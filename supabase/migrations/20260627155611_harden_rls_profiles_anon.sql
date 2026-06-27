-- Audit remediation (T2 / S1): close live PII leak + harden grants.
-- Context: `profiles` had a SELECT policy granted to `public` (incl. anon) with
-- USING (true) -> the entire members table was readable by anyone holding the
-- public anon key (which ships in the client AND was committed to a public repo).
-- The app authenticates via GoTrue before any table access, so anon needs no
-- table privileges at all.

begin;

-- 1) profiles: replace public read with authenticated-only read.
drop policy if exists "allow read profiles" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

-- 2) Defense-in-depth: anon gets no table access on any app table.
revoke all on public.profiles             from anon;
revoke all on public.sessions             from anon;
revoke all on public.session_participants from anon;

-- 3) Least-privilege for authenticated: drop dangerous/unneeded grants.
--    (RLS policies still gate SELECT/INSERT/UPDATE/DELETE on top of these.)
revoke truncate, trigger, references on public.profiles             from authenticated;
revoke truncate, trigger, references on public.sessions             from authenticated;
revoke truncate, trigger, references on public.session_participants from authenticated;

-- 4) Remove a redundant duplicate SELECT policy on session_participants.
drop policy if exists "Allow authenticated read" on public.session_participants;

commit;
