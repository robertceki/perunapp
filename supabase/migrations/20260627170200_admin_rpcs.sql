begin;

-- Shared role check used by every admin RPC.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce((select role from public.profiles where id = uid), 'user') = 'admin';
$$;

revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;

-- Opens or closes an existing session for member bookings.
create or replace function public.admin_set_session_open(
  p_session_id uuid,
  p_open boolean
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

  update public.sessions
     set is_open = p_open
   where id = p_session_id;

  if not found then
    raise exception 'session_not_found';
  end if;
end;
$$;

revoke all on function public.admin_set_session_open(uuid, boolean) from public, anon;
grant execute on function public.admin_set_session_open(uuid, boolean) to authenticated;

-- Creates a new session when p_id is null, otherwise updates the matching session.
create or replace function public.admin_upsert_session(
  p_id uuid,
  p_title text,
  p_day_of_week public.day_of_week,
  p_time text,
  p_room text,
  p_duration_min integer,
  p_max_participants integer,
  p_is_open boolean
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  if p_id is null then
    insert into public.sessions (
      title,
      day_of_week,
      time,
      room,
      duration_min,
      max_participants,
      is_open
    )
    values (
      p_title,
      p_day_of_week,
      p_time,
      p_room,
      p_duration_min,
      p_max_participants,
      p_is_open
    )
    returning id into v_session_id;

    return v_session_id;
  end if;

  update public.sessions
     set title = p_title,
         day_of_week = p_day_of_week,
         time = p_time,
         room = p_room,
         duration_min = p_duration_min,
         max_participants = p_max_participants,
         is_open = p_is_open
   where id = p_id;

  if not found then
    raise exception 'session_not_found';
  end if;

  return p_id;
end;
$$;

revoke all on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) from public, anon;
grant execute on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) to authenticated;

-- Applies a partial profile patch while preserving fields passed as null.
create or replace function public.admin_update_user(
  p_target uuid,
  p_first_name text,
  p_last_name text,
  p_role text,
  p_max_sessions_per_week integer
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
         )
   where id = p_target;

  if not found then
    raise exception 'user_not_found';
  end if;
end;
$$;

revoke all on function public.admin_update_user(uuid, text, text, text, integer) from public, anon;
grant execute on function public.admin_update_user(uuid, text, text, text, integer) to authenticated;

-- Removes both the application profile and its login. The profile is deleted
-- first so its session_participants rows cascade before the auth account goes.
create or replace function public.admin_delete_user(p_target uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  if p_target = auth.uid() then
    raise exception 'cannot_delete_self';
  end if;

  delete from public.profiles
   where id = p_target;

  delete from auth.users
   where id = p_target;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

commit;
