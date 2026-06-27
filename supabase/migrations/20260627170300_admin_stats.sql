begin;

-- Member growth series: new + cumulative members per month (last N months).
-- Source of truth = auth.users.created_at (never deleted, even after profile
-- removal). Timezone = Europe/Belgrade (consistent with the rest of the app).
-- plpgsql (not sql) so we can enforce the admin guard with raise.
create or replace function public.admin_member_series(p_months integer)
returns table(month text, total_members bigint, new_members bigint)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  return query
  with date_series as (
    select
      (date_trunc('month', now() at time zone 'Europe/Belgrade')::date
        - (interval '1 month' * i))::date as month_start
    from generate_series(0, p_months - 1) as i
  ),
  month_boundaries as (
    select
      month_start,
      (month_start + interval '1 month' - interval '1 day')::date as month_end,
      to_char(month_start, 'YYYY-MM') as month_text
    from date_series
  ),
  new_counts as (
    select
      mb.month_text,
      mb.month_start,
      coalesce(count(*) filter (
        where au.created_at at time zone 'Europe/Belgrade' >= mb.month_start
          and au.created_at at time zone 'Europe/Belgrade' <= (mb.month_end || ' 23:59:59')::timestamp
      ), 0) as new_in_month
    from month_boundaries mb
    cross join auth.users au
    group by mb.month_text, mb.month_start
  )
  select
    nc.month_text as month,
    (
      select coalesce(count(*), 0)
      from auth.users au
      where au.created_at at time zone 'Europe/Belgrade'
        <= ((nc.month_start + interval '1 month' - interval '1 day')::date || ' 23:59:59')::timestamp
    )::bigint as total_members,
    nc.new_in_month::bigint as new_members
  from new_counts nc
  order by nc.month_start asc;
end;
$$;

revoke all on function public.admin_member_series(integer) from public, anon;
grant execute on function public.admin_member_series(integer) to authenticated;

-- Occupancy + recruitment summary.
-- CAVEAT: session_participants is wiped every Sunday 00:00 Europe/Belgrade, so
-- occupancy is a CURRENT snapshot, not historical. Member growth
-- (new_this_month/prev_new) comes from auth.users, which persists.
-- p_period is accepted for signature stability with the chart period control
-- but does not change the math.
create or replace function public.admin_occupancy_summary(p_period text)
returns table(avg_pct numeric, top_day text, new_this_month bigint, prev_new bigint)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  return query
  with session_occupancy as (
    select
      (count(sp.user_id)::numeric / nullif(s.max_participants::numeric, 0) * 100) as occupancy_pct
    from public.sessions s
    left join public.session_participants sp on sp.session_id = s.id
    group by s.id, s.max_participants
  ),
  occupancy_avg as (
    select coalesce(round(avg(occupancy_pct), 1), 0) as avg_occupancy
    from session_occupancy
  ),
  session_day_counts as (
    select s.day_of_week, count(sp.user_id) as booking_count
    from public.sessions s
    left join public.session_participants sp on sp.session_id = s.id
    group by s.day_of_week
  ),
  top_day_result as (
    select sdc.day_of_week
    from session_day_counts sdc
    order by sdc.booking_count desc
    limit 1
  ),
  month_boundaries as (
    select
      date_trunc('month', now() at time zone 'Europe/Belgrade')::date as curr_month_start,
      (date_trunc('month', now() at time zone 'Europe/Belgrade')::date - interval '1 month')::date as prev_month_start,
      ((date_trunc('month', now() at time zone 'Europe/Belgrade')::date + interval '1 month' - interval '1 day')::date || ' 23:59:59')::timestamp as curr_month_end,
      ((date_trunc('month', now() at time zone 'Europe/Belgrade')::date - interval '1 day')::date || ' 23:59:59')::timestamp as prev_month_end
  ),
  new_counts as (
    select
      coalesce(count(*) filter (
        where au.created_at at time zone 'Europe/Belgrade' >= mb.curr_month_start
          and au.created_at at time zone 'Europe/Belgrade' <= mb.curr_month_end
      ), 0) as new_current,
      coalesce(count(*) filter (
        where au.created_at at time zone 'Europe/Belgrade' >= mb.prev_month_start
          and au.created_at at time zone 'Europe/Belgrade' <= mb.prev_month_end
      ), 0) as new_previous
    from auth.users au
    cross join month_boundaries mb
  )
  select
    oa.avg_occupancy::numeric as avg_pct,
    coalesce((select td.day_of_week::text from top_day_result td), '') as top_day,
    nc.new_current::bigint as new_this_month,
    nc.new_previous::bigint as prev_new
  from occupancy_avg oa
  cross join new_counts nc;
end;
$$;

revoke all on function public.admin_occupancy_summary(text) from public, anon;
grant execute on function public.admin_occupancy_summary(text) to authenticated;

commit;
