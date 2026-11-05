begin;

create or replace function public.leave_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_day text;
  v_time text;
  v_day_index integer;
  v_start_time time;
  v_now timestamptz;
  v_local_now timestamp;
  v_sunday date;
  v_start timestamptz;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Match join_session's lock and hold the schedule stable through deletion.
  perform pg_advisory_xact_lock(hashtext(p_session_id::text));

  select day_of_week::text, "time"
    into v_day, v_time
    from public.sessions
   where id = p_session_id
     for update;

  if not found then
    raise exception 'session_not_found';
  end if;

  perform 1
    from public.session_participants
   where session_id = p_session_id
     and user_id = v_uid
     for update;

  if not found then
    return;
  end if;

  v_day_index := case v_day
    when 'sunday' then 0
    when 'monday' then 1
    when 'tuesday' then 2
    when 'wednesday' then 3
    when 'thursday' then 4
    when 'friday' then 5
    when 'saturday' then 6
    else null
  end;
  v_start_time := v_time::time;

  if v_day_index is null or v_start_time is null then
    raise exception 'invalid_session_schedule';
  end if;

  -- Sample after all potentially blocking locks; elapsed weekdays stay past.
  -- Current-week bookings rely on the existing Sunday reset.
  v_now := clock_timestamp();
  v_local_now := v_now at time zone 'Europe/Belgrade';
  v_sunday := v_local_now::date - extract(dow from v_local_now)::integer;
  v_start := ((v_sunday + v_day_index) + v_start_time)
    at time zone 'Europe/Belgrade';

  if v_now >= v_start then
    raise exception 'session_started';
  end if;

  delete from public.session_participants
   where session_id = p_session_id
     and user_id = v_uid;
end;
$$;

revoke delete on public.session_participants from public, anon, authenticated;
revoke all on function public.leave_session(uuid) from public, anon;
grant execute on function public.leave_session(uuid) to authenticated;

commit;
