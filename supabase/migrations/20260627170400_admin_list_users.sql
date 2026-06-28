begin;

create or replace function public.admin_list_users()
returns table(
  id uuid,
  first_name text,
  last_name text,
  email text,
  role text,
  max_sessions_per_week integer,
  enabled boolean
)
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
  select
    p.id,
    p.first_name,
    p.last_name,
    u.email::text,
    p.role,
    p.max_sessions_per_week::integer,
    p.enabled
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.first_name nulls last, p.last_name nulls last;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

commit;
