-- Phase C (A2): capture first/last name from sign-up metadata at profile
-- creation, so registration can set names WITHOUT granting members write access
-- to profiles (which would be a privilege-escalation risk: role / weekly limit
-- must stay admin-controlled). The trigger is SECURITY DEFINER, so it can write
-- the profile while the table stays member-read-only.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  insert into public.profiles (id, first_name, last_name, enabled, role, max_sessions_per_week)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''), ''),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''), ''),
    true,
    'user',
    0
  );
  return new;
end;
$fn$;
