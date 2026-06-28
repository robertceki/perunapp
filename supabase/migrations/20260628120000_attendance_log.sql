begin;

create table public.attendance_log (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  user_id uuid,
  day_of_week public.day_of_week,
  "time" text,
  joined_at timestamptz default now()
);

create index attendance_log_joined_at_idx
  on public.attendance_log (joined_at);
create index attendance_log_slot_idx
  on public.attendance_log (day_of_week, "time");

alter table public.attendance_log enable row level security;
revoke all on table public.attendance_log from anon, authenticated;

insert into public.attendance_log (session_id, user_id, day_of_week, "time")
select sp.session_id, sp.user_id, s.day_of_week, s."time"
  from public.session_participants sp
  join public.sessions s on s.id = sp.session_id;

create or replace function public.join_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_max_participants integer;
  v_is_open boolean;
  v_weekly_limit integer;
  v_booking_count bigint;
  v_constraint_name text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if exists (
    select 1
      from public.profiles
     where id = v_uid
       and enabled = false
  ) then
    raise exception 'account_inactive';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));

  select max_participants, is_open
    into v_max_participants, v_is_open
    from public.sessions
   where id = p_session_id;

  if not found then
    raise exception 'session_not_found';
  end if;

  if v_is_open = false then
    raise exception 'session_closed';
  end if;

  select count(*)
    into v_booking_count
    from public.session_participants
   where session_id = p_session_id;

  if v_booking_count >= v_max_participants then
    raise exception 'session_full';
  end if;

  select coalesce(
           (select max_sessions_per_week
              from public.profiles
             where id = v_uid),
           0
         )
    into v_weekly_limit;

  select count(*)
    into v_booking_count
    from public.session_participants
   where user_id = v_uid;

  if v_booking_count >= v_weekly_limit then
    raise exception 'weekly_limit_reached';
  end if;

  begin
    insert into public.session_participants (session_id, user_id)
    values (p_session_id, v_uid);
  exception
    when unique_violation then
      get stacked diagnostics v_constraint_name = constraint_name;

      if v_constraint_name = 'unique_session_user' then
        raise exception 'already_joined';
      end if;

      raise;
  end;

  insert into public.attendance_log (session_id, user_id, day_of_week, "time")
  select p_session_id, v_uid, s.day_of_week, s."time"
    from public.sessions s
   where s.id = p_session_id;
end;
$$;

revoke all on function public.join_session(uuid) from public, anon;
grant execute on function public.join_session(uuid) to authenticated;

create or replace function public.admin_slot_popularity(p_period text)
returns table(day_of_week text, "time" text, bookings bigint)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_cutoff timestamptz;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  case p_period
    when '6' then v_cutoff := now() - interval '6 months';
    when '12' then v_cutoff := now() - interval '12 months';
    when 'all' then v_cutoff := null;
    else raise exception 'invalid_period';
  end case;

  return query
  select
    al.day_of_week::text,
    al."time",
    count(*)::bigint
  from public.attendance_log al
  where v_cutoff is null or al.joined_at >= v_cutoff
  group by al.day_of_week, al."time"
  order by count(*) desc, al.day_of_week, al."time";
end;
$$;

revoke all on function public.admin_slot_popularity(text) from public, anon;
grant execute on function public.admin_slot_popularity(text) to authenticated;

commit;
