-- Audit remediation: new members must start with NO booking allowance.
-- Decision (Uros): default max_sessions_per_week = 0 — a new signup cannot book
-- until an admin explicitly raises their weekly limit. Make this explicit and
-- non-null instead of relying on NULL (which the RPC was coalescing to 0).

begin;

-- 1) Backfill any existing NULLs to 0 (none today, but safe/idempotent).
update public.profiles set max_sessions_per_week = 0 where max_sessions_per_week is null;

-- 2) Column-level default + NOT NULL so the value is always present.
alter table public.profiles alter column max_sessions_per_week set default 0;
alter table public.profiles alter column max_sessions_per_week set not null;

-- 3) Make the signup trigger set it explicitly too (belt and suspenders).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $fn$
begin
  insert into public.profiles (id, first_name, last_name, enabled, role, max_sessions_per_week)
  values (new.id, '', '', true, 'user', 0);
  return new;
end;
$fn$;

commit;
