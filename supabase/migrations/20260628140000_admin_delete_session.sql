-- Admin: delete a training session. session_participants cascade-delete (FK),
-- attendance_log.session_id is ON DELETE SET NULL so booking history survives.
create or replace function public.admin_delete_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  delete from public.sessions where id = p_session_id;

  if not found then
    raise exception 'session_not_found';
  end if;
end;
$$;

revoke all on function public.admin_delete_session(uuid) from public, anon;
grant execute on function public.admin_delete_session(uuid) to authenticated;
