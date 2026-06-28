begin;

drop function public.admin_update_user(uuid, text, text, text, integer);

create or replace function public.admin_update_user(
  p_target uuid,
  p_first_name text,
  p_last_name text,
  p_role text,
  p_max_sessions_per_week integer,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  if p_role is not null and p_role not in ('user', 'admin') then
    raise exception 'invalid_role';
  end if;

  update public.profiles
     set first_name = coalesce(p_first_name, first_name),
         last_name = coalesce(p_last_name, last_name),
         role = coalesce(p_role, role),
         max_sessions_per_week = coalesce(
           p_max_sessions_per_week,
           max_sessions_per_week
         ),
         enabled = coalesce(p_enabled, enabled)
   where id = p_target;

  if not found then
    raise exception 'user_not_found';
  end if;
end;
$$;

revoke all on function public.admin_update_user(uuid, text, text, text, integer, boolean) from public, anon;
grant execute on function public.admin_update_user(uuid, text, text, text, integer, boolean) to authenticated;

commit;
