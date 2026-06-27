-- Audit remediation (T3 / T4): enforce bookings atomically and reset weekly.
-- `session_participants` contains only the current week's bookings; every
-- Sunday at 00:00 Europe/Belgrade the table is wiped in full.

begin;

-- 1) pg_cron runs the weekly reset inside PostgreSQL.
create extension if not exists pg_cron;

-- 2) All joins pass through one server-side transaction. The session lock
--    serializes capacity checks; the user lock serializes weekly-limit checks
--    across simultaneous joins to different sessions.
create or replace function public.join_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_max_participants integer;
  v_weekly_limit integer;
  v_booking_count bigint;
  v_constraint_name text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));

  select max_participants
    into v_max_participants
    from public.sessions
   where id = p_session_id;

  if not found then
    raise exception 'session_not_found';
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
end;
$$;

revoke all on function public.join_session(uuid) from public, anon;
grant execute on function public.join_session(uuid) to authenticated;

-- 3) Direct INSERT is no longer allowed; SELECT and own-row DELETE policies
--    remain unchanged.
drop policy if exists "Users can join sessions" on public.session_participants;

-- 4) Run hourly and guard on Belgrade local time. This avoids encoding a fixed
--    UTC offset, so the Sunday 00:00 reset remains correct across DST changes.
do $$
begin
  if exists (
    select 1
      from cron.job
     where jobname = 'weekly-booking-reset'
  ) then
    perform cron.unschedule('weekly-booking-reset');
  end if;
end;
$$;

select cron.schedule(
  'weekly-booking-reset',
  '0 * * * *',
  $cron$
    delete from public.session_participants
     where extract(dow from (now() at time zone 'Europe/Belgrade')) = 0
       and (now() at time zone 'Europe/Belgrade')::time < time '01:00';
  $cron$
);

commit;
