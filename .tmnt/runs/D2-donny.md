Reading additional input from stdin...
OpenAI Codex v0.142.0
--------
workdir: /Users/uros/Documents/Private/Projects/PerunApp
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR] (network access enabled)
reasoning effort: high
reasoning summaries: none
session id: 019f0cd8-f65e-70d1-b5d5-ce5c7bc5aa26
--------
user
TASK: D2 (Phase C Group D) — Attendance log & slot popularity

CONTEXT
Goal file: /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/goal-phase-c.md
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Files to consider (read these before changing anything):
- supabase/migrations/20260628110100_join_session_inactive.sql (FULL body to copy into new join_session)
- src/services/admin/types.ts
- src/services/admin/stats.ts
- src/services/admin/index.ts

CODING CONSTRAINTS (non-negotiable)
- Simplicity first: minimum code that solves the problem. No speculative features.
- Surgical changes: touch only files listed above, plus the new migration file. Do not refactor adjacent code.
- Match existing style and conventions in this codebase.
- No new dependencies.
- If anything is unclear, output a line starting "QUESTION:" and stop without writing code.

DEFINITION OF DONE
1. Create supabase/migrations/20260628120000_attendance_log.sql with:
   - Table: attendance_log (id uuid pk, session_id uuid refs sessions(id) on delete set null, user_id uuid, day_of_week enum, time text, joined_at timestamptz default now()).
   - Indexes: joined_at, slot (day_of_week + time).
   - RLS: enable, revoke all from anon/authenticated (no policies).
   - Backfill: insert from session_participants + sessions join.
   - Modify join_session RPC: copy FULL body from 20260628110100_join_session_inactive.sql, then after successful insert into session_participants, add log write:
     insert into public.attendance_log (session_id, user_id, day_of_week, "time")
     select p_session_id, v_uid, s.day_of_week, s."time" from public.sessions s where s.id = p_session_id;
   - Create admin_slot_popularity(p_period text) RPC: SECURITY DEFINER, plpgsql, guard is_admin(auth.uid()), map period '6'/'12'/'all' to cutoff window, return TABLE(day_of_week text, time text, bookings bigint).
   - Revoke all from public/anon; grant execute to authenticated.

2. src/services/admin/types.ts: add SlotPopularity type.
3. src/services/admin/stats.ts: add slotPopularity(period: string) function → rpc("admin_slot_popularity", { p_period: period }); return (data ?? []) as SlotPopularity[].
4. src/services/admin/index.ts: export SlotPopularity and slotPopularity.

Gates: npx tsc --noEmit must exit 0. No apply, no commit.

Output: produce the code changes. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the specified files and existing migration conventions, then make only the requested edits and run the TypeScript gate.
exec
/bin/zsh -lc "sed -n '1,260p' supabase/migrations/20260628110100_join_session_inactive.sql && sed -n '1,240p' src/services/admin/types.ts && sed -n '1,260p' src/services/admin/stats.ts && sed -n '1,220p' src/services/admin/index.ts" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
begin;

create or replace function public.join_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_max_participants integer;
  v_is_open boolean;
  v_weekly_limit integer;
  v_booking_count bigint;
  v_constraint_name text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if exists (
    select 1
      from public.profiles
     where id = v_uid
       and enabled = false
  ) then
    raise exception 'account_inactive';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));

  select max_participants, is_open
    into v_max_participants, v_is_open
    from public.sessions
   where id = p_session_id;

  if not found then
    raise exception 'session_not_found';
  end if;

  if v_is_open = false then
    raise exception 'session_closed';
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

commit;
export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  role: "user" | "admin";
  max_sessions_per_week: number;
  enabled: boolean | null;
}

export interface MemberSeriesPoint {
  month: string;
  total_members: number;
  new_members: number;
}

export interface OccupancySummary {
  avg_pct: number;
  top_day: string;
  new_this_month: number;
  prev_new: number;
}

export interface UpsertSessionInput {
  id: string | null;
  title: string;
  day_of_week: string;
  time: string;
  room: string | null;
  duration_min: number | null;
  max_participants: number;
  is_open: boolean;
}

export interface UpdateUserPatch {
  first_name?: string | null;
  last_name?: string | null;
  role?: "user" | "admin" | null;
  max_sessions_per_week?: number | null;
  enabled?: boolean | null;
}
import { supabase } from "../supabase/client";
import { MemberSeriesPoint, OccupancySummary } from "./types";

export async function memberSeries(
  months: number,
): Promise<MemberSeriesPoint[]> {
  const { data, error } = await supabase.rpc("admin_member_series", {
    p_months: months,
  });

  if (error) throw error;
  return (data ?? []) as MemberSeriesPoint[];
}

export async function occupancySummary(
  period: string,
): Promise<OccupancySummary | null> {
  const { data, error } = await supabase.rpc("admin_occupancy_summary", {
    p_period: period,
  });

  if (error) throw error;
  return (data?.[0] ?? null) as OccupancySummary | null;
}
export * from "./types";
export * from "./sessions";
export * from "./users";
export * from "./stats";

exec
/bin/zsh -lc "sed -n '1,260p' .tmnt/goal-phase-c.md && rg -n \"admin_.*popularity|admin_occupancy_summary|is_admin\\(|day_of_week|create table public.sessions|session_participants\" supabase/migrations -g '*.sql'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
# Goal: Perun — PHASE C (post-test bug fixes & gaps)

**Date:** 2026-06-28
**Target project:** /Users/uros/Documents/Private/Projects/PerunApp
**Branch:** design_update (continue) — or a new `phase-c` branch off it (decision)
**Status:** PLAN — awaiting Uros approval before execution.
**Source:** Uros's hands-on test of the Phase B build (admin + login). 11 findings.

## What we're fixing
Eleven issues found while testing. They cluster into: (A) login/auth blockers,
(B) admin UX fixes, (C) cross-platform layout, (D) one new stat feature.
Testing was partly blocked by the login issues, so Group A is highest priority.

---

## Group A — Login & Auth (BLOCKERS — do first)
**A1 (#8) — Can't type password.** login.tsx has no ScrollView/KeyboardAvoidingView;
the 200px emblem hero pushes the password field under the keyboard, so taps hit
the email field. Fix: wrap login in KeyboardAvoidingView + ScrollView (or shrink
the hero when the keyboard is open) so both fields stay tappable. Verify on
Android + iOS.

**A2 (#9) — "Pridruži se" goes nowhere.** It's plain text today. Build a
registration screen (`app/register.tsx`): fields ime/prezime, email, lozinka →
`supabase.auth.signUp`. The `handle_new_user` trigger already creates the profile
(role=user, weekly limit 0). Make the login footer link navigate there; add a
"back to login" path. → depends on **Decision D4** (email confirmation).

**A3 (#11) — "Zaboravljena lozinka" does nothing.** Empty onPress. Implement
`supabase.auth.resetPasswordForEmail(email)` → Supabase emails a reset link/OTP
(NOT a literal "temporary password" — that's not how Supabase works). Needs a
small "enter your email" step + a reset-password screen (or rely on Supabase's
hosted reset page). → depends on **Decision D3** (mechanism + email/SMTP).

**A4 (#10) — Remove tagline under logo.** Delete the "Rezerviši svoj termin…"
text on login. Trivial.

## Group B — Admin UX
**B1 (#1) — Drop SALA + TRAJANJE from the create/edit form.** Remove the room and
duration_min fields from `app/(admin)/training/[id].tsx`; `admin_upsert_session`
keeps accepting them but the form passes null. (The member card's "Grupni · Sala A"
/ "60 min" are hardcoded placeholders, not data — see **Decision D5** for whether
to also remove those.) Columns stay in the DB (harmless), no migration needed.

**B2 (#7) — Admin logout + stop the avatar bounce.** Two parts:
  - Fix the role-routing guard in `app/_layout.tsx` so it does NOT redirect an
    admin away from shared modal routes (e.g. `/profile`). Whitelist non-group
    routes instead of bouncing anything that isn't `(admin)`/`(tabs)`.
  - Give admins a logout. Simplest: make `profile.tsx` role-aware (admins see a
    minimal profile + "Odjavi se"), reachable from the admin avatar; or a small
    dropdown sheet from the avatar with "Odjavi se". Recommend role-aware profile.

**B3 (#4) — Time input mask.** `VREME` becomes a numeric, masked input: type 4
digits, auto-insert ":" after the first two → "HH:MM"; validate 00–23 / 00–59.
Apply in the training form (and reuse in any other time entry).

**B4 (#3) — Equal-height stat cards.** StatTile cards in the 2×2 grids render
unequal when a label wraps to two lines. Fix: tiles `flex: 1` + row
`alignItems: "stretch"` (and/or a minHeight) so a row's tiles match the tallest.

**B5 (#5) — Active/inactive toggle in edit-user.** `profiles.enabled` exists but
isn't editable. Add an "Aktivan" toggle to the edit-user modal; extend
`admin_update_user` with a `p_enabled boolean` param + the service `UpdateUserPatch`.
→ depends on **Decision D1** (what "inactive" actually enforces).

## Group C — Cross-platform
**C1 (#2) — Android status-bar overlap.** The top bar collides with the system
clock/status bar on Android. Apply safe-area top insets
(`react-native-safe-area-context`, already installed) to AdminHeader + member
Header (and any screen top chrome). Verify on Android.

## Group D — New feature
**D1feat (#6) — Time-slot popularity in Statistika.** Show which time slots /
sessions are most booked so the admin can adjust scheduling. → depends on
**Decision D2** (snapshot vs. historical), because bookings are wiped every
Sunday, so "popularity over time" needs a new persistent attendance-history
table; current-week popularity is cheap.

---

## DECISIONS LOCKED (2026-06-28, from Uros)
- **D1 → block booking only.** Inactive users can still log in but `join_session`
  rejects with `account_inactive`; admin list shows them muted.
- **D2 → persistent history.** Add `attendance_log` (written on each join before
  the weekly wipe) + `admin_slot_popularity` RPC for real trends.
- **D5 → remove** the hardcoded "Grupni · Sala A" / "60 min" from the member card.
- **D6 → continue on `design_update`.**
- **D3/D4 → auto-confirm sign-ups** (disable email confirmation so new accounts
  log in immediately, no email needed). Build the in-app "forgot password" flow
  (`resetPasswordForEmail`), but real delivery is deferred to a later SMTP setup
  (separate infra task). App stays fully testable now.
- **APPROVED to execute (2026-06-28).**

## Decisions to lock before execution
- **D1 — What does "inactive user" enforce?** (B5)
  Recommend: inactive users **cannot book** (add an `enabled` check in
  `join_session` → `account_inactive`), and the admin list shows them muted.
  Also block login for inactive users? (Harder — needs a post-login check +
  sign-out.) Recommend: booking-block now, login-block later.
- **D2 — Slot popularity: snapshot or historical?** (D1feat)
  (a) Current-week only — cheap, no schema change, but resets weekly.
  (b) Persistent — add an `attendance_log` table written on each join (before the
  weekly wipe) + an `admin_slot_popularity` RPC → real trends. More work.
  Recommend (b) if you want this to actually inform scheduling over time.
- **D3 — Password reset mechanism + email.** (A3)
  Supabase sends a reset **link/OTP** email (no "temporary password"). Confirm we
  use `resetPasswordForEmail` + a reset screen. NOTE: reliable auth emails need
  SMTP configured in the Supabase project (the built-in sender is rate-limited);
  is SMTP set up, or should email delivery be treated as a separate infra task?
- **D4 — Sign-up email confirmation.** (A2)
  Require email verification before first login (Supabase default), or
  auto-confirm? Confirmation also needs working email (see D3). Recommend:
  decide alongside D3.
- **D5 — Member card placeholders.** (B1)
  The member TrainingCard shows hardcoded "Grupni · Sala A" / "60 min". Now that
  room/duration are dropped from admin: remove those lines from the card too, or
  leave the static text? Recommend: remove (don't show data we don't collect).
- **D6 — Branch.** Continue on `design_update`, or cut a `phase-c` branch off it?

## Out of scope
- Multi-gym, push/email notifications beyond auth, store builds, localisation
  beyond Serbian.
- Any change to the verified Phase B security model (admin RPCs stay role-checked).

## Definition of done (per group, verifiable)
- A1: on a phone/emulator, you can focus and type into the password field; login
  succeeds. A2: "Pridruži se" → register screen → new account created → lands on
  member home. A3: "Zaboravljena lozinka" → reset email triggered (or hosted flow).
  A4: tagline gone.
- B1: form has no Sala/Trajanje. B2: admin avatar → profile with working
  "Odjavi se"; no bounce. B3: time field auto-formats HH:MM + validates. B4:
  stat-grid tiles equal height. B5: admin can toggle active; enforced per D1.
- C1: no status-bar overlap on Android.
- D1feat: Statistika shows slot popularity per D2.
- Gates: `npx tsc --noEmit` 0, `npm run lint` no new errors, `npm test` green,
  app bundles. Admin RPC security test still passes.

## Suggested order
1. Group A (unblock login/testing) → 2. Group C (Android safe-area, quick) →
3. Group B → 4. Group D. Backend bits (B5 RPC param, D2 table/RPC) before their UI.
supabase/migrations/20260627155611_harden_rls_profiles_anon.sql:21:revoke all on public.session_participants from anon;
supabase/migrations/20260627155611_harden_rls_profiles_anon.sql:27:revoke truncate, trigger, references on public.session_participants from authenticated;
supabase/migrations/20260627155611_harden_rls_profiles_anon.sql:29:-- 4) Remove a redundant duplicate SELECT policy on session_participants.
supabase/migrations/20260627155611_harden_rls_profiles_anon.sql:30:drop policy if exists "Allow authenticated read" on public.session_participants;
supabase/migrations/20260628110000_admin_update_user_enabled.sql:19:  if not public.is_admin(auth.uid()) then
supabase/migrations/20260627170100_join_session_closed.sql:41:    from public.session_participants
supabase/migrations/20260627170100_join_session_closed.sql:58:    from public.session_participants
supabase/migrations/20260627170100_join_session_closed.sql:66:    insert into public.session_participants (session_id, user_id)
supabase/migrations/20260627160000_booking_enforcement.sql:2:-- `session_participants` contains only the current week's bookings; every
supabase/migrations/20260627160000_booking_enforcement.sql:46:    from public.session_participants
supabase/migrations/20260627160000_booking_enforcement.sql:63:    from public.session_participants
supabase/migrations/20260627160000_booking_enforcement.sql:71:    insert into public.session_participants (session_id, user_id)
supabase/migrations/20260627160000_booking_enforcement.sql:91:drop policy if exists "Users can join sessions" on public.session_participants;
supabase/migrations/20260627160000_booking_enforcement.sql:111:    delete from public.session_participants
supabase/migrations/20260628110100_join_session_inactive.sql:50:    from public.session_participants
supabase/migrations/20260628110100_join_session_inactive.sql:67:    from public.session_participants
supabase/migrations/20260628110100_join_session_inactive.sql:75:    insert into public.session_participants (session_id, user_id)
supabase/migrations/20260627170200_admin_rpcs.sql:4:create or replace function public.is_admin(uid uuid)
supabase/migrations/20260627170200_admin_rpcs.sql:14:revoke all on function public.is_admin(uuid) from public, anon;
supabase/migrations/20260627170200_admin_rpcs.sql:15:grant execute on function public.is_admin(uuid) to authenticated;
supabase/migrations/20260627170200_admin_rpcs.sql:28:  if not public.is_admin(auth.uid()) then
supabase/migrations/20260627170200_admin_rpcs.sql:49:  p_day_of_week public.day_of_week,
supabase/migrations/20260627170200_admin_rpcs.sql:64:  if not public.is_admin(auth.uid()) then
supabase/migrations/20260627170200_admin_rpcs.sql:71:      day_of_week,
supabase/migrations/20260627170200_admin_rpcs.sql:80:      p_day_of_week,
supabase/migrations/20260627170200_admin_rpcs.sql:94:         day_of_week = p_day_of_week,
supabase/migrations/20260627170200_admin_rpcs.sql:110:revoke all on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) from public, anon;
supabase/migrations/20260627170200_admin_rpcs.sql:111:grant execute on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) to authenticated;
supabase/migrations/20260627170200_admin_rpcs.sql:127:  if not public.is_admin(auth.uid()) then
supabase/migrations/20260627170200_admin_rpcs.sql:155:-- first so its session_participants rows cascade before the auth account goes.
supabase/migrations/20260627170200_admin_rpcs.sql:163:  if not public.is_admin(auth.uid()) then
supabase/migrations/20260627170400_admin_list_users.sql:19:  if not public.is_admin(auth.uid()) then
supabase/migrations/20260627170300_admin_stats.sql:15:  if not public.is_admin(auth.uid()) then
supabase/migrations/20260627170300_admin_stats.sql:63:-- CAVEAT: session_participants is wiped every Sunday 00:00 Europe/Belgrade, so
supabase/migrations/20260627170300_admin_stats.sql:68:create or replace function public.admin_occupancy_summary(p_period text)
supabase/migrations/20260627170300_admin_stats.sql:76:  if not public.is_admin(auth.uid()) then
supabase/migrations/20260627170300_admin_stats.sql:85:    left join public.session_participants sp on sp.session_id = s.id
supabase/migrations/20260627170300_admin_stats.sql:93:    select s.day_of_week, count(sp.user_id) as booking_count
supabase/migrations/20260627170300_admin_stats.sql:95:    left join public.session_participants sp on sp.session_id = s.id
supabase/migrations/20260627170300_admin_stats.sql:96:    group by s.day_of_week
supabase/migrations/20260627170300_admin_stats.sql:99:    select sdc.day_of_week
supabase/migrations/20260627170300_admin_stats.sql:126:    coalesce((select td.day_of_week::text from top_day_result td), '') as top_day,
supabase/migrations/20260627170300_admin_stats.sql:134:revoke all on function public.admin_occupancy_summary(text) from public, anon;
supabase/migrations/20260627170300_admin_stats.sql:135:grant execute on function public.admin_occupancy_summary(text) to authenticated;

exec
/bin/zsh -lc "sed -n '1,220p' supabase/migrations/20260627170300_admin_stats.sql && sed -n '1,210p' supabase/migrations/20260627170200_admin_rpcs.sql && rg -n \"create type.*day_of_week|create table.*sessions|create table.*session_participants\" supabase/migrations -g '*.sql' && rg -n \"SlotPopularity|slotPopularity\" src || true" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
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

exec
/bin/zsh -lc "rg -n \"day_of_week|CREATE TABLE|create table\" supabase -g '*.sql' | head -120 && git status --short" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
supabase/migrations/20260627170300_admin_stats.sql:93:    select s.day_of_week, count(sp.user_id) as booking_count
supabase/migrations/20260627170300_admin_stats.sql:96:    group by s.day_of_week
supabase/migrations/20260627170300_admin_stats.sql:99:    select sdc.day_of_week
supabase/migrations/20260627170300_admin_stats.sql:126:    coalesce((select td.day_of_week::text from top_day_result td), '') as top_day,
supabase/migrations/20260627170200_admin_rpcs.sql:49:  p_day_of_week public.day_of_week,
supabase/migrations/20260627170200_admin_rpcs.sql:71:      day_of_week,
supabase/migrations/20260627170200_admin_rpcs.sql:80:      p_day_of_week,
supabase/migrations/20260627170200_admin_rpcs.sql:94:         day_of_week = p_day_of_week,
supabase/migrations/20260627170200_admin_rpcs.sql:110:revoke all on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) from public, anon;
supabase/migrations/20260627170200_admin_rpcs.sql:111:grant execute on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) to authenticated;
 M .tmnt/runs/D2-donny.md

exec
/bin/zsh -lc "rg -n \"period|6|12|all|Sve|mesec\" 'app' src -g '*.tsx' -g '*.ts' | head -180 && rg -n \"gen_random_uuid\\(\\)|uuid_generate\" supabase/migrations -g '*.sql'" in /Users/uros/Documents/Private/Projects/PerunApp
 exited 1 in 0ms:
app/(admin)/(tabs)/_layout.tsx:10:// sits above the tab navigator, so all four tab screens inherit it. The
app/(admin)/(tabs)/users.tsx:1:import { useCallback, useEffect, useMemo, useState } from "react";
app/(admin)/(tabs)/users.tsx:50:  const fetchUsers = useCallback(async () => {
app/(admin)/(tabs)/users.tsx:59:    } finally {
app/(admin)/(tabs)/users.tsx:116:    } finally {
app/(admin)/(tabs)/users.tsx:334:    gap: 16,
app/(admin)/(tabs)/users.tsx:335:    marginBottom: 16,
app/(admin)/(tabs)/users.tsx:343:    fontFamily: FontFamilies.hanken[600],
app/(admin)/(tabs)/users.tsx:345:    fontWeight: "600",
app/(admin)/(tabs)/users.tsx:354:    paddingHorizontal: 12,
app/(admin)/(tabs)/users.tsx:355:    paddingVertical: 12,
app/(admin)/(tabs)/users.tsx:356:    fontFamily: FontFamilies.hanken[600],
app/(admin)/(tabs)/users.tsx:358:    fontWeight: "600",
app/(admin)/(tabs)/users.tsx:376:    gap: 16,
app/(admin)/(tabs)/users.tsx:400:    paddingHorizontal: 12,
app/(admin)/(tabs)/users.tsx:402:    fontFamily: FontFamilies.hanken[600],
app/(admin)/(tabs)/users.tsx:404:    fontWeight: "600",
app/(admin)/(tabs)/users.tsx:477:    opacity: 0.6,
app/(admin)/(tabs)/stats.tsx:21:type Period = "12" | "6" | "all";
app/(admin)/(tabs)/stats.tsx:24:  { key: "12", label: "12 meseci" },
app/(admin)/(tabs)/stats.tsx:25:  { key: "6", label: "6 meseci" },
app/(admin)/(tabs)/stats.tsx:26:  { key: "all", label: "Sve" },
app/(admin)/(tabs)/stats.tsx:68:  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
app/(admin)/(tabs)/stats.tsx:73:  const months: 12 | 6 | 24 =
app/(admin)/(tabs)/stats.tsx:74:    selectedPeriod === "all" ? 24 : selectedPeriod === "12" ? 12 : 6;
app/(admin)/(tabs)/stats.tsx:81:    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
app/(admin)/(tabs)/stats.tsx:92:      .finally(() => {
app/(admin)/(tabs)/stats.tsx:174:            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
app/(admin)/(tabs)/stats.tsx:260:    gap: 12,
app/(admin)/(tabs)/stats.tsx:275:    fontSize: 26,
app/(admin)/(tabs)/sessions.tsx:72:    } finally {
app/(admin)/(tabs)/sessions.tsx:166:    marginBottom: 16,
app/(admin)/(tabs)/sessions.tsx:172:    gap: 12,
app/(admin)/(tabs)/sessions.tsx:183:    fontFamily: FontFamilies.hanken[600],
app/(admin)/(tabs)/sessions.tsx:185:    fontWeight: "600",
app/(admin)/(tabs)/sessions.tsx:214:    minHeight: 36,
app/(admin)/(tabs)/sessions.tsx:243:    fontFamily: FontFamilies.hanken[600],
app/(admin)/(tabs)/sessions.tsx:245:    fontWeight: "600",
app/(admin)/(tabs)/index.tsx:78:    Promise.all([memberSeries(6), occupancySummary("6")])
app/(admin)/(tabs)/index.tsx:89:      .finally(() => {
app/(admin)/(tabs)/index.tsx:150:                  : `▲ +${occupancy.new_this_month} ovog meseca`
app/(admin)/(tabs)/index.tsx:186:              {pct === null ? "—" : `▲ ${pct}% / 6m`}
app/(admin)/(tabs)/index.tsx:283:    borderRadius: Radii.tile[16],
app/(admin)/(tabs)/index.tsx:284:    padding: 16,
src/services/admin/stats.ts:16:  period: string,
src/services/admin/stats.ts:19:    p_period: period,
app/(admin)/training/[id].tsx:121:    } finally {
app/(admin)/training/[id].tsx:147:      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
app/(admin)/training/[id].tsx:278:    gap: 16,
app/(admin)/training/[id].tsx:288:    borderRadius: Radii.tile[12],
app/(admin)/training/[id].tsx:301:    paddingTop: 16,
app/(admin)/training/[id].tsx:302:    paddingBottom: 12,
app/(admin)/training/[id].tsx:313:    borderRadius: Radii.tile[12],
app/(admin)/training/[id].tsx:347:    gap: 12,
app/(admin)/training/[id].tsx:361:    minHeight: 46,
app/(admin)/training/[id].tsx:366:    paddingHorizontal: 12,
app/(admin)/training/[id].tsx:368:    fontFamily: FontFamilies.hanken[600],
app/(admin)/training/[id].tsx:370:    fontWeight: "600",
app/(admin)/training/[id].tsx:374:    minHeight: 46,
app/(admin)/training/[id].tsx:406:    gap: 16,
app/(admin)/training/[id].tsx:409:    borderRadius: Radii.tile[16],
app/(admin)/training/[id].tsx:424:    fontFamily: FontFamilies.hanken[600],
app/(admin)/training/[id].tsx:425:    fontSize: 12,
app/(admin)/training/[id].tsx:426:    fontWeight: "600",
app/(admin)/training/[id].tsx:461:    opacity: 0.6,
app/forgot-password.tsx:39:    } finally {
app/forgot-password.tsx:133:    paddingTop: 16,
app/forgot-password.tsx:156:    marginTop: 26,
app/forgot-password.tsx:158:    width: 176,
app/forgot-password.tsx:176:    paddingHorizontal: 16,
app/forgot-password.tsx:181:    fontFamily: FontFamilies.hanken[600],
app/forgot-password.tsx:182:    fontSize: 12,
app/forgot-password.tsx:189:    borderRadius: Radii.tile[16],
app/forgot-password.tsx:191:    paddingVertical: 16,
app/forgot-password.tsx:199:    paddingHorizontal: 12,
app/forgot-password.tsx:212:    marginTop: 12,
app/forgot-password.tsx:224:    opacity: 0.6,
app/_layout.tsx:12:  HankenGrotesk_600SemiBold,
app/_layout.tsx:110:    Hanken_600SemiBold: HankenGrotesk_600SemiBold,
app/profile.tsx:99:            {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
app/profile.tsx:190:    paddingTop: 12,
app/profile.tsx:196:    borderRadius: Radii.tile[12],
app/profile.tsx:207:    lineHeight: 26,
app/profile.tsx:212:    fontSize: 16,
app/profile.tsx:232:    height: 86,
app/profile.tsx:234:    width: 86,
app/profile.tsx:275:    gap: 12,
app/profile.tsx:286:    paddingHorizontal: 16,
app/profile.tsx:295:    opacity: 0.65,
app/profile.tsx:297:    right: 12,
app/profile.tsx:303:    opacity: 0.68,
app/profile.tsx:313:    fontFamily: FontFamilies.hanken[600],
app/profile.tsx:315:    fontWeight: "600",
app/profile.tsx:325:    marginTop: 16,
app/profile.tsx:326:    padding: 16,
app/profile.tsx:341:    fontFamily: FontFamilies.hanken[600],
app/profile.tsx:342:    fontSize: 12,
app/profile.tsx:343:    fontWeight: "600",
app/profile.tsx:347:    borderRadius: 6,
app/profile.tsx:354:    borderRadius: 6,
app/profile.tsx:373:    paddingTop: 12,
app/profile.tsx:380:    borderRadius: Radii.tile[16],
app/profile.tsx:384:    padding: 16,
app/profile.tsx:420:    fontFamily: FontFamilies.hanken[600],
app/profile.tsx:421:    fontSize: 12,
app/profile.tsx:422:    fontWeight: "600",
app/profile.tsx:440:    paddingHorizontal: 16,
src/components/DayFilter.tsx:68:    borderRadius: Radii.tile[16],
src/components/DayFilter.tsx:93:    fontSize: 16,
app/register.tsx:43:    } finally {
app/register.tsx:179:    paddingTop: 16,
app/register.tsx:202:    marginTop: 26,
app/register.tsx:204:    width: 176,
app/register.tsx:222:    paddingHorizontal: 16,
app/register.tsx:232:    paddingHorizontal: 16,
app/register.tsx:250:    fontSize: 12,
app/register.tsx:252:    marginLeft: 12,
app/register.tsx:256:    fontFamily: FontFamilies.hanken[600],
app/register.tsx:257:    fontSize: 12,
app/register.tsx:264:    borderRadius: Radii.tile[16],
app/register.tsx:266:    paddingVertical: 16,
app/register.tsx:290:    opacity: 0.6,
src/components/admin/BarChart.tsx:13:  const chartHeight = 120;
src/components/admin/BarChart.tsx:39:  container: { flexDirection: "row", gap: 4, justifyContent: "space-evenly", height: 160 },
src/components/admin/BarChart.tsx:41:  bar: { width: "100%", borderTopLeftRadius: 6, borderTopRightRadius: 6 },
app/(tabs)/_layout.tsx:96:    paddingTop: 16,
app/(tabs)/_layout.tsx:104:    fontFamily: FontFamilies.hanken[600],
app/(tabs)/_layout.tsx:106:    fontWeight: "600",
app/(tabs)/_layout.tsx:123:    fontFamily: FontFamilies.hanken[600],
app/(tabs)/_layout.tsx:124:    fontSize: 12,
app/(tabs)/_layout.tsx:125:    fontWeight: "600",
src/components/admin/UserRow.tsx:62:    borderRadius: Radii.tile[16],
src/components/admin/UserRow.tsx:75:  avatar: { width: 36, height: 36, borderRadius: 9999, alignItems: "center", justifyContent: "center" },
src/components/admin/UserRow.tsx:76:  initials: { fontFamily: FontFamilies.hanken[700], fontSize: 12, fontWeight: "700", color: Colors.surface },
src/components/admin/UserRow.tsx:79:  email: { fontFamily: FontFamilies.hanken[600], fontSize: 12, fontWeight: "600", color: Colors.inkMuted },
src/components/admin/UserRow.tsx:81:  chipText: { fontFamily: FontFamilies.hanken[700], fontSize: 12, fontWeight: "700" },
src/components/admin/UserRow.tsx:86:    marginTop: 12,
src/components/admin/UserRow.tsx:88:  editBtn: { borderColor: Colors.burgundyBorder, borderWidth: 1, borderRadius: Radii.tile[12], paddingHorizontal: 12, paddingVertical: 8 },
src/components/admin/UserRow.tsx:90:  removeBtn: { borderColor: "#EAC6BF", borderWidth: 1, borderRadius: Radii.tile[12], paddingHorizontal: 12, paddingVertical: 8 },
app/login.tsx:41:    } finally {
app/login.tsx:165:    paddingTop: 16,
app/login.tsx:188:    marginTop: 26,
app/login.tsx:190:    width: 176,
app/login.tsx:208:    paddingHorizontal: 16,
app/login.tsx:218:    paddingHorizontal: 16,
app/login.tsx:236:    fontSize: 12,
app/login.tsx:238:    marginLeft: 12,
app/login.tsx:242:    marginTop: 12,
app/login.tsx:252:    fontFamily: FontFamilies.hanken[600],
app/login.tsx:253:    fontSize: 12,
app/login.tsx:260:    borderRadius: Radii.tile[16],
app/login.tsx:262:    paddingVertical: 16,
app/login.tsx:287:    opacity: 0.6,
src/components/admin/Toggle.tsx:25:  container: { width: 46, height: 27, justifyContent: "center" },
src/components/AlertBar.tsx:61:    marginTop: 16,
src/components/AlertBar.tsx:62:    paddingHorizontal: 16,
src/components/AlertBar.tsx:81:    color: "#B6A9C0",
src/components/AlertBar.tsx:85:    borderRadius: 6,
src/components/AlertBar.tsx:92:    borderRadius: 6,
src/components/AlertBar.tsx:106:    borderRadius: Radii.tile[16],
src/components/AlertBar.tsx:109:    gap: 12,
src/components/AlertBar.tsx:111:    marginTop: 16,
src/components/AlertBar.tsx:140:    fontFamily: FontFamilies.hanken[600],
src/components/AlertBar.tsx:141:    fontSize: 12,
src/components/AlertBar.tsx:142:    fontWeight: "600",
src/components/admin/FilterChips.tsx:30:  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radii.chip, borderWidth: 1 },
src/components/admin/FilterChips.tsx:31:  label: { fontFamily: FontFamilies.hanken[700], fontSize: 12, fontWeight: "700" },
src/components/TrainingCard.tsx:13:  { backgroundColor: "#F4E6EE", color: Colors.burgundy },
src/components/TrainingCard.tsx:249:    borderColor: "#ECE3D6",
src/components/TrainingCard.tsx:290:    backgroundColor: "#ECE3D6",
src/components/TrainingCard.tsx:309:    color: "#6E6670",
src/components/TrainingCard.tsx:411:    fontFamily: FontFamilies.hanken[600],
src/components/TrainingCard.tsx:412:    fontSize: 12.5,
src/components/TrainingCard.tsx:413:    fontWeight: "600",
src/components/TrainingCard.tsx:422:    fontSize: 12,
src/components/admin/SessionRow.tsx:29:          <View style={[styles.divider, isClosed && { backgroundColor: "#ECE3D6" }]} />
src/components/admin/SessionRow.tsx:64:    borderColor: "#ECE3D6",
src/components/admin/SessionRow.tsx:66:  content: { flexDirection: "row", alignItems: "center", gap: 12 },
src/components/admin/SessionRow.tsx:69:  duration: { fontFamily: FontFamilies.hanken[600], fontSize: 10, fontWeight: "600", color: Colors.inkFaint },
src/components/admin/SessionRow.tsx:73:  booked: { fontFamily: FontFamilies.hanken[600], fontSize: 12, fontWeight: "600", color: Colors.sage },

codex
The existing admin period selector uses `"6"`, `"12"`, and `"all"`. I’ll implement those as rolling six-/twelve-month cutoffs, with `"all"` unbounded and invalid values rejected. The log UUID needs a default because the required join write omits `id`.
apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/src/services/admin/stats.ts
/Users/uros/Documents/Private/Projects/PerunApp/src/services/admin/types.ts
/Users/uros/Documents/Private/Projects/PerunApp/supabase/migrations/20260628120000_attendance_log.sql
diff --git a/src/services/admin/stats.ts b/src/services/admin/stats.ts
index de193258628753786677f3ebf8bfe7fdc38d4275..b027f7755e7683167cca8791f31485030eae9688
--- a/src/services/admin/stats.ts
+++ b/src/services/admin/stats.ts
@@ -1,5 +1,9 @@
 import { supabase } from "../supabase/client";
-import { MemberSeriesPoint, OccupancySummary } from "./types";
+import {
+  MemberSeriesPoint,
+  OccupancySummary,
+  SlotPopularity,
+} from "./types";
 
 export async function memberSeries(
   months: number,
@@ -22,3 +26,14 @@
   if (error) throw error;
   return (data?.[0] ?? null) as OccupancySummary | null;
 }
+
+export async function slotPopularity(
+  period: string,
+): Promise<SlotPopularity[]> {
+  const { data, error } = await supabase.rpc("admin_slot_popularity", {
+    p_period: period,
+  });
+
+  if (error) throw error;
+  return (data ?? []) as SlotPopularity[];
+}
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
index e0ac0e53f5568bda4454477cd1f01358f284586f..ce43aca5d551f638672a7be16c0aa91b7382565a
--- a/src/services/admin/types.ts
+++ b/src/services/admin/types.ts
@@ -21,6 +21,12 @@
   prev_new: number;
 }
 
+export interface SlotPopularity {
+  day_of_week: string;
+  time: string;
+  bookings: number;
+}
+
 export interface UpsertSessionInput {
   id: string | null;
   title: string;
diff --git a/supabase/migrations/20260628120000_attendance_log.sql b/supabase/migrations/20260628120000_attendance_log.sql
new file mode 100644
index 0000000000000000000000000000000000000000..e47880812c931accd5d16e5a11d02727a9a99de0
--- /dev/null
+++ b/supabase/migrations/20260628120000_attendance_log.sql
@@ -0,0 +1,156 @@
+begin;
+
+create table public.attendance_log (
+  id uuid primary key default gen_random_uuid(),
+  session_id uuid references public.sessions(id) on delete set null,
+  user_id uuid,
+  day_of_week public.day_of_week,
+  "time" text,
+  joined_at timestamptz default now()
+);
+
+create index attendance_log_joined_at_idx
+  on public.attendance_log (joined_at);
+create index attendance_log_slot_idx
+  on public.attendance_log (day_of_week, "time");
+
+alter table public.attendance_log enable row level security;
+revoke all on table public.attendance_log from anon, authenticated;
+
+insert into public.attendance_log (session_id, user_id, day_of_week, "time")
+select sp.session_id, sp.user_id, s.day_of_week, s."time"
+  from public.session_participants sp
+  join public.sessions s on s.id = sp.session_id;
+
+create or replace function public.join_session(p_session_id uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_uid uuid;
+  v_max_participants integer;
+  v_is_open boolean;
+  v_weekly_limit integer;
+  v_booking_count bigint;
+  v_constraint_name text;
+begin
+  v_uid := auth.uid();
+
+  if v_uid is null then
+    raise exception 'not_authenticated' using errcode = '28000';
+  end if;
+
+  if exists (
+    select 1
+      from public.profiles
+     where id = v_uid
+       and enabled = false
+  ) then
+    raise exception 'account_inactive';
+  end if;
+
+  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
+  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));
+
+  select max_participants, is_open
+    into v_max_participants, v_is_open
+    from public.sessions
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  if v_is_open = false then
+    raise exception 'session_closed';
+  end if;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where session_id = p_session_id;
+
+  if v_booking_count >= v_max_participants then
+    raise exception 'session_full';
+  end if;
+
+  select coalesce(
+           (select max_sessions_per_week
+              from public.profiles
+             where id = v_uid),
+           0
+         )
+    into v_weekly_limit;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where user_id = v_uid;
+
+  if v_booking_count >= v_weekly_limit then
+    raise exception 'weekly_limit_reached';
+  end if;
+
+  begin
+    insert into public.session_participants (session_id, user_id)
+    values (p_session_id, v_uid);
+  exception
+    when unique_violation then
+      get stacked diagnostics v_constraint_name = constraint_name;
+
+      if v_constraint_name = 'unique_session_user' then
+        raise exception 'already_joined';
+      end if;
+
+      raise;
+  end;
+
+  insert into public.attendance_log (session_id, user_id, day_of_week, "time")
+  select p_session_id, v_uid, s.day_of_week, s."time"
+    from public.sessions s
+   where s.id = p_session_id;
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+create or replace function public.admin_slot_popularity(p_period text)
+returns table(day_of_week text, time text, bookings bigint)
+language plpgsql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+declare
+  v_cutoff timestamptz;
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  case p_period
+    when '6' then v_cutoff := now() - interval '6 months';
+    when '12' then v_cutoff := now() - interval '12 months';
+    when 'all' then v_cutoff := null;
+    else raise exception 'invalid_period';
+  end case;
+
+  return query
+  select
+    al.day_of_week::text,
+    al."time",
+    count(*)::bigint
+  from public.attendance_log al
+  where v_cutoff is null or al.joined_at >= v_cutoff
+  group by al.day_of_week, al."time"
+  order by count(*) desc, al.day_of_week, al."time";
+end;
+$$;
+
+revoke all on function public.admin_slot_popularity(text) from public, anon;
+grant execute on function public.admin_slot_popularity(text) to authenticated;
+
+commit;

diff --git a/src/services/admin/stats.ts b/src/services/admin/stats.ts
index de193258628753786677f3ebf8bfe7fdc38d4275..b027f7755e7683167cca8791f31485030eae9688
--- a/src/services/admin/stats.ts
+++ b/src/services/admin/stats.ts
@@ -1,5 +1,9 @@
 import { supabase } from "../supabase/client";
-import { MemberSeriesPoint, OccupancySummary } from "./types";
+import {
+  MemberSeriesPoint,
+  OccupancySummary,
+  SlotPopularity,
+} from "./types";
 
 export async function memberSeries(
   months: number,
@@ -22,3 +26,14 @@
   if (error) throw error;
   return (data?.[0] ?? null) as OccupancySummary | null;
 }
+
+export async function slotPopularity(
+  period: string,
+): Promise<SlotPopularity[]> {
+  const { data, error } = await supabase.rpc("admin_slot_popularity", {
+    p_period: period,
+  });
+
+  if (error) throw error;
+  return (data ?? []) as SlotPopularity[];
+}
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
index e0ac0e53f5568bda4454477cd1f01358f284586f..ce43aca5d551f638672a7be16c0aa91b7382565a
--- a/src/services/admin/types.ts
+++ b/src/services/admin/types.ts
@@ -21,6 +21,12 @@
   prev_new: number;
 }
 
+export interface SlotPopularity {
+  day_of_week: string;
+  time: string;
+  bookings: number;
+}
+
 export interface UpsertSessionInput {
   id: string | null;
   title: string;
diff --git a/supabase/migrations/20260628120000_attendance_log.sql b/supabase/migrations/20260628120000_attendance_log.sql
new file mode 100644
index 0000000000000000000000000000000000000000..e47880812c931accd5d16e5a11d02727a9a99de0
--- /dev/null
+++ b/supabase/migrations/20260628120000_attendance_log.sql
@@ -0,0 +1,156 @@
+begin;
+
+create table public.attendance_log (
+  id uuid primary key default gen_random_uuid(),
+  session_id uuid references public.sessions(id) on delete set null,
+  user_id uuid,
+  day_of_week public.day_of_week,
+  "time" text,
+  joined_at timestamptz default now()
+);
+
+create index attendance_log_joined_at_idx
+  on public.attendance_log (joined_at);
+create index attendance_log_slot_idx
+  on public.attendance_log (day_of_week, "time");
+
+alter table public.attendance_log enable row level security;
+revoke all on table public.attendance_log from anon, authenticated;
+
+insert into public.attendance_log (session_id, user_id, day_of_week, "time")
+select sp.session_id, sp.user_id, s.day_of_week, s."time"
+  from public.session_participants sp
+  join public.sessions s on s.id = sp.session_id;
+
+create or replace function public.join_session(p_session_id uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_uid uuid;
+  v_max_participants integer;
+  v_is_open boolean;
+  v_weekly_limit integer;
+  v_booking_count bigint;
+  v_constraint_name text;
+begin
+  v_uid := auth.uid();
+
+  if v_uid is null then
+    raise exception 'not_authenticated' using errcode = '28000';
+  end if;
+
+  if exists (
+    select 1
+      from public.profiles
+     where id = v_uid
+       and enabled = false
+  ) then
+    raise exception 'account_inactive';
+  end if;
+
+  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
+  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));
+
+  select max_participants, is_open
+    into v_max_participants, v_is_open
+    from public.sessions
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  if v_is_open = false then
+    raise exception 'session_closed';
+  end if;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where session_id = p_session_id;
+
+  if v_booking_count >= v_max_participants then
+    raise exception 'session_full';
+  end if;
+
+  select coalesce(
+           (select max_sessions_per_week
+              from public.profiles
+             where id = v_uid),
+           0
+         )
+    into v_weekly_limit;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where user_id = v_uid;
+
+  if v_booking_count >= v_weekly_limit then
+    raise exception 'weekly_limit_reached';
+  end if;
+
+  begin
+    insert into public.session_participants (session_id, user_id)
+    values (p_session_id, v_uid);
+  exception
+    when unique_violation then
+      get stacked diagnostics v_constraint_name = constraint_name;
+
+      if v_constraint_name = 'unique_session_user' then
+        raise exception 'already_joined';
+      end if;
+
+      raise;
+  end;
+
+  insert into public.attendance_log (session_id, user_id, day_of_week, "time")
+  select p_session_id, v_uid, s.day_of_week, s."time"
+    from public.sessions s
+   where s.id = p_session_id;
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+create or replace function public.admin_slot_popularity(p_period text)
+returns table(day_of_week text, time text, bookings bigint)
+language plpgsql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+declare
+  v_cutoff timestamptz;
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  case p_period
+    when '6' then v_cutoff := now() - interval '6 months';
+    when '12' then v_cutoff := now() - interval '12 months';
+    when 'all' then v_cutoff := null;
+    else raise exception 'invalid_period';
+  end case;
+
+  return query
+  select
+    al.day_of_week::text,
+    al."time",
+    count(*)::bigint
+  from public.attendance_log al
+  where v_cutoff is null or al.joined_at >= v_cutoff
+  group by al.day_of_week, al."time"
+  order by count(*) desc, al.day_of_week, al."time";
+end;
+$$;
+
+revoke all on function public.admin_slot_popularity(text) from public, anon;
+grant execute on function public.admin_slot_popularity(text) to authenticated;
+
+commit;

exec
/bin/zsh -lc 'git diff -- supabase/migrations/20260628120000_attendance_log.sql src/services/admin/types.ts src/services/admin/stats.ts src/services/admin/index.ts && npx tsc --noEmit' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/src/services/admin/stats.ts b/src/services/admin/stats.ts
index de193258628753786677f3ebf8bfe7fdc38d4275..b027f7755e7683167cca8791f31485030eae9688
--- a/src/services/admin/stats.ts
+++ b/src/services/admin/stats.ts
@@ -1,5 +1,9 @@
 import { supabase } from "../supabase/client";
-import { MemberSeriesPoint, OccupancySummary } from "./types";
+import {
+  MemberSeriesPoint,
+  OccupancySummary,
+  SlotPopularity,
+} from "./types";
 
 export async function memberSeries(
   months: number,
@@ -22,3 +26,14 @@
   if (error) throw error;
   return (data?.[0] ?? null) as OccupancySummary | null;
 }
+
+export async function slotPopularity(
+  period: string,
+): Promise<SlotPopularity[]> {
+  const { data, error } = await supabase.rpc("admin_slot_popularity", {
+    p_period: period,
+  });
+
+  if (error) throw error;
+  return (data ?? []) as SlotPopularity[];
+}
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
index e0ac0e53f5568bda4454477cd1f01358f284586f..ce43aca5d551f638672a7be16c0aa91b7382565a
--- a/src/services/admin/types.ts
+++ b/src/services/admin/types.ts
@@ -21,6 +21,12 @@
   prev_new: number;
 }
 
+export interface SlotPopularity {
+  day_of_week: string;
+  time: string;
+  bookings: number;
+}
+
 export interface UpsertSessionInput {
   id: string | null;
   title: string;
diff --git a/supabase/migrations/20260628120000_attendance_log.sql b/supabase/migrations/20260628120000_attendance_log.sql
new file mode 100644
index 0000000000000000000000000000000000000000..e47880812c931accd5d16e5a11d02727a9a99de0
--- /dev/null
+++ b/supabase/migrations/20260628120000_attendance_log.sql
@@ -0,0 +1,156 @@
+begin;
+
+create table public.attendance_log (
+  id uuid primary key default gen_random_uuid(),
+  session_id uuid references public.sessions(id) on delete set null,
+  user_id uuid,
+  day_of_week public.day_of_week,
+  "time" text,
+  joined_at timestamptz default now()
+);
+
+create index attendance_log_joined_at_idx
+  on public.attendance_log (joined_at);
+create index attendance_log_slot_idx
+  on public.attendance_log (day_of_week, "time");
+
+alter table public.attendance_log enable row level security;
+revoke all on table public.attendance_log from anon, authenticated;
+
+insert into public.attendance_log (session_id, user_id, day_of_week, "time")
+select sp.session_id, sp.user_id, s.day_of_week, s."time"
+  from public.session_participants sp
+  join public.sessions s on s.id = sp.session_id;
+
+create or replace function public.join_session(p_session_id uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_uid uuid;
+  v_max_participants integer;
+  v_is_open boolean;
+  v_weekly_limit integer;
+  v_booking_count bigint;
+  v_constraint_name text;
+begin
+  v_uid := auth.uid();
+
+  if v_uid is null then
+    raise exception 'not_authenticated' using errcode = '28000';
+  end if;
+
+  if exists (
+    select 1
+      from public.profiles
+     where id = v_uid
+       and enabled = false
+  ) then
+    raise exception 'account_inactive';
+  end if;
+
+  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
+  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));
+
+  select max_participants, is_open
+    into v_max_participants, v_is_open
+    from public.sessions
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  if v_is_open = false then
+    raise exception 'session_closed';
+  end if;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where session_id = p_session_id;
+
+  if v_booking_count >= v_max_participants then
+    raise exception 'session_full';
+  end if;
+
+  select coalesce(
+           (select max_sessions_per_week
+              from public.profiles
+             where id = v_uid),
+           0
+         )
+    into v_weekly_limit;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where user_id = v_uid;
+
+  if v_booking_count >= v_weekly_limit then
+    raise exception 'weekly_limit_reached';
+  end if;
+
+  begin
+    insert into public.session_participants (session_id, user_id)
+    values (p_session_id, v_uid);
+  exception
+    when unique_violation then
+      get stacked diagnostics v_constraint_name = constraint_name;
+
+      if v_constraint_name = 'unique_session_user' then
+        raise exception 'already_joined';
+      end if;
+
+      raise;
+  end;
+
+  insert into public.attendance_log (session_id, user_id, day_of_week, "time")
+  select p_session_id, v_uid, s.day_of_week, s."time"
+    from public.sessions s
+   where s.id = p_session_id;
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+create or replace function public.admin_slot_popularity(p_period text)
+returns table(day_of_week text, time text, bookings bigint)
+language plpgsql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+declare
+  v_cutoff timestamptz;
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  case p_period
+    when '6' then v_cutoff := now() - interval '6 months';
+    when '12' then v_cutoff := now() - interval '12 months';
+    when 'all' then v_cutoff := null;
+    else raise exception 'invalid_period';
+  end case;
+
+  return query
+  select
+    al.day_of_week::text,
+    al."time",
+    count(*)::bigint
+  from public.attendance_log al
+  where v_cutoff is null or al.joined_at >= v_cutoff
+  group by al.day_of_week, al."time"
+  order by count(*) desc, al.day_of_week, al."time";
+end;
+$$;
+
+revoke all on function public.admin_slot_popularity(text) from public, anon;
+grant execute on function public.admin_slot_popularity(text) to authenticated;
+
+commit;

 succeeded in 2018ms:
codex
The TypeScript gate passes. I’m doing a final scope and SQL-body verification, including confirming the replacement `join_session` remains identical to the source migration apart from the requested attendance insert.
exec
/bin/zsh -lc "python3 - <<'PY'
from pathlib import Path
old = Path('supabase/migrations/20260628110100_join_session_inactive.sql').read_text()
new = Path('supabase/migrations/20260628120000_attendance_log.sql').read_text()
old_fn = old[old.index('create or replace function public.join_session'):old.index('\\nrevoke all on function public.join_session')]
new_fn = new[new.index('create or replace function public.join_session'):new.index('\\nrevoke all on function public.join_session')]
addition = '''\\n\\n  insert into public.attendance_log (session_id, user_id, day_of_week, \"time\")\\n  select p_session_id, v_uid, s.day_of_week, s.\"time\"\\n    from public.sessions s\\n   where s.id = p_session_id;'''
expected = old_fn.replace('\\nend;\\n"'$$;'"', addition + '\\nend;\\n"'$$;'"')
print('join_session_matches=' + str(new_fn == expected).lower())
PY
sed -n '1,260p' supabase/migrations/20260628120000_attendance_log.sql
git status --short" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
join_session_matches=true
begin;

create table public.attendance_log (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  user_id uuid,
  day_of_week public.day_of_week,
  "time" text,
  joined_at timestamptz default now()
);

create index attendance_log_joined_at_idx
  on public.attendance_log (joined_at);
create index attendance_log_slot_idx
  on public.attendance_log (day_of_week, "time");

alter table public.attendance_log enable row level security;
revoke all on table public.attendance_log from anon, authenticated;

insert into public.attendance_log (session_id, user_id, day_of_week, "time")
select sp.session_id, sp.user_id, s.day_of_week, s."time"
  from public.session_participants sp
  join public.sessions s on s.id = sp.session_id;

create or replace function public.join_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_max_participants integer;
  v_is_open boolean;
  v_weekly_limit integer;
  v_booking_count bigint;
  v_constraint_name text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if exists (
    select 1
      from public.profiles
     where id = v_uid
       and enabled = false
  ) then
    raise exception 'account_inactive';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));

  select max_participants, is_open
    into v_max_participants, v_is_open
    from public.sessions
   where id = p_session_id;

  if not found then
    raise exception 'session_not_found';
  end if;

  if v_is_open = false then
    raise exception 'session_closed';
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

  insert into public.attendance_log (session_id, user_id, day_of_week, "time")
  select p_session_id, v_uid, s.day_of_week, s."time"
    from public.sessions s
   where s.id = p_session_id;
end;
$$;

revoke all on function public.join_session(uuid) from public, anon;
grant execute on function public.join_session(uuid) to authenticated;

create or replace function public.admin_slot_popularity(p_period text)
returns table(day_of_week text, time text, bookings bigint)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_cutoff timestamptz;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  case p_period
    when '6' then v_cutoff := now() - interval '6 months';
    when '12' then v_cutoff := now() - interval '12 months';
    when 'all' then v_cutoff := null;
    else raise exception 'invalid_period';
  end case;

  return query
  select
    al.day_of_week::text,
    al."time",
    count(*)::bigint
  from public.attendance_log al
  where v_cutoff is null or al.joined_at >= v_cutoff
  group by al.day_of_week, al."time"
  order by count(*) desc, al.day_of_week, al."time";
end;
$$;

revoke all on function public.admin_slot_popularity(text) from public, anon;
grant execute on function public.admin_slot_popularity(text) to authenticated;

commit;
 M .tmnt/runs/D2-donny.md
 M src/services/admin/stats.ts
 M src/services/admin/types.ts
?? supabase/migrations/20260628120000_attendance_log.sql

diff --git a/src/services/admin/stats.ts b/src/services/admin/stats.ts
index de193258628753786677f3ebf8bfe7fdc38d4275..b027f7755e7683167cca8791f31485030eae9688
--- a/src/services/admin/stats.ts
+++ b/src/services/admin/stats.ts
@@ -1,5 +1,9 @@
 import { supabase } from "../supabase/client";
-import { MemberSeriesPoint, OccupancySummary } from "./types";
+import {
+  MemberSeriesPoint,
+  OccupancySummary,
+  SlotPopularity,
+} from "./types";
 
 export async function memberSeries(
   months: number,
@@ -22,3 +26,14 @@
   if (error) throw error;
   return (data?.[0] ?? null) as OccupancySummary | null;
 }
+
+export async function slotPopularity(
+  period: string,
+): Promise<SlotPopularity[]> {
+  const { data, error } = await supabase.rpc("admin_slot_popularity", {
+    p_period: period,
+  });
+
+  if (error) throw error;
+  return (data ?? []) as SlotPopularity[];
+}
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
index e0ac0e53f5568bda4454477cd1f01358f284586f..ce43aca5d551f638672a7be16c0aa91b7382565a
--- a/src/services/admin/types.ts
+++ b/src/services/admin/types.ts
@@ -21,6 +21,12 @@
   prev_new: number;
 }
 
+export interface SlotPopularity {
+  day_of_week: string;
+  time: string;
+  bookings: number;
+}
+
 export interface UpsertSessionInput {
   id: string | null;
   title: string;
diff --git a/supabase/migrations/20260628120000_attendance_log.sql b/supabase/migrations/20260628120000_attendance_log.sql
new file mode 100644
index 0000000000000000000000000000000000000000..e47880812c931accd5d16e5a11d02727a9a99de0
--- /dev/null
+++ b/supabase/migrations/20260628120000_attendance_log.sql
@@ -0,0 +1,156 @@
+begin;
+
+create table public.attendance_log (
+  id uuid primary key default gen_random_uuid(),
+  session_id uuid references public.sessions(id) on delete set null,
+  user_id uuid,
+  day_of_week public.day_of_week,
+  "time" text,
+  joined_at timestamptz default now()
+);
+
+create index attendance_log_joined_at_idx
+  on public.attendance_log (joined_at);
+create index attendance_log_slot_idx
+  on public.attendance_log (day_of_week, "time");
+
+alter table public.attendance_log enable row level security;
+revoke all on table public.attendance_log from anon, authenticated;
+
+insert into public.attendance_log (session_id, user_id, day_of_week, "time")
+select sp.session_id, sp.user_id, s.day_of_week, s."time"
+  from public.session_participants sp
+  join public.sessions s on s.id = sp.session_id;
+
+create or replace function public.join_session(p_session_id uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_uid uuid;
+  v_max_participants integer;
+  v_is_open boolean;
+  v_weekly_limit integer;
+  v_booking_count bigint;
+  v_constraint_name text;
+begin
+  v_uid := auth.uid();
+
+  if v_uid is null then
+    raise exception 'not_authenticated' using errcode = '28000';
+  end if;
+
+  if exists (
+    select 1
+      from public.profiles
+     where id = v_uid
+       and enabled = false
+  ) then
+    raise exception 'account_inactive';
+  end if;
+
+  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
+  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));
+
+  select max_participants, is_open
+    into v_max_participants, v_is_open
+    from public.sessions
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  if v_is_open = false then
+    raise exception 'session_closed';
+  end if;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where session_id = p_session_id;
+
+  if v_booking_count >= v_max_participants then
+    raise exception 'session_full';
+  end if;
+
+  select coalesce(
+           (select max_sessions_per_week
+              from public.profiles
+             where id = v_uid),
+           0
+         )
+    into v_weekly_limit;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where user_id = v_uid;
+
+  if v_booking_count >= v_weekly_limit then
+    raise exception 'weekly_limit_reached';
+  end if;
+
+  begin
+    insert into public.session_participants (session_id, user_id)
+    values (p_session_id, v_uid);
+  exception
+    when unique_violation then
+      get stacked diagnostics v_constraint_name = constraint_name;
+
+      if v_constraint_name = 'unique_session_user' then
+        raise exception 'already_joined';
+      end if;
+
+      raise;
+  end;
+
+  insert into public.attendance_log (session_id, user_id, day_of_week, "time")
+  select p_session_id, v_uid, s.day_of_week, s."time"
+    from public.sessions s
+   where s.id = p_session_id;
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+create or replace function public.admin_slot_popularity(p_period text)
+returns table(day_of_week text, time text, bookings bigint)
+language plpgsql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+declare
+  v_cutoff timestamptz;
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  case p_period
+    when '6' then v_cutoff := now() - interval '6 months';
+    when '12' then v_cutoff := now() - interval '12 months';
+    when 'all' then v_cutoff := null;
+    else raise exception 'invalid_period';
+  end case;
+
+  return query
+  select
+    al.day_of_week::text,
+    al."time",
+    count(*)::bigint
+  from public.attendance_log al
+  where v_cutoff is null or al.joined_at >= v_cutoff
+  group by al.day_of_week, al."time"
+  order by count(*) desc, al.day_of_week, al."time";
+end;
+$$;
+
+revoke all on function public.admin_slot_popularity(text) from public, anon;
+grant execute on function public.admin_slot_popularity(text) to authenticated;
+
+commit;

codex
Implemented attendance logging, backfill, `join_session` logging, slot popularity RPC, and admin service/type exports. Existing `index.ts` wildcard exports expose both additions.

`npx tsc --noEmit` passes.

DONE
diff --git a/src/services/admin/stats.ts b/src/services/admin/stats.ts
index de193258628753786677f3ebf8bfe7fdc38d4275..b027f7755e7683167cca8791f31485030eae9688
--- a/src/services/admin/stats.ts
+++ b/src/services/admin/stats.ts
@@ -1,5 +1,9 @@
 import { supabase } from "../supabase/client";
-import { MemberSeriesPoint, OccupancySummary } from "./types";
+import {
+  MemberSeriesPoint,
+  OccupancySummary,
+  SlotPopularity,
+} from "./types";
 
 export async function memberSeries(
   months: number,
@@ -22,3 +26,14 @@
   if (error) throw error;
   return (data?.[0] ?? null) as OccupancySummary | null;
 }
+
+export async function slotPopularity(
+  period: string,
+): Promise<SlotPopularity[]> {
+  const { data, error } = await supabase.rpc("admin_slot_popularity", {
+    p_period: period,
+  });
+
+  if (error) throw error;
+  return (data ?? []) as SlotPopularity[];
+}
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
index e0ac0e53f5568bda4454477cd1f01358f284586f..ce43aca5d551f638672a7be16c0aa91b7382565a
--- a/src/services/admin/types.ts
+++ b/src/services/admin/types.ts
@@ -21,6 +21,12 @@
   prev_new: number;
 }
 
+export interface SlotPopularity {
+  day_of_week: string;
+  time: string;
+  bookings: number;
+}
+
 export interface UpsertSessionInput {
   id: string | null;
   title: string;
diff --git a/supabase/migrations/20260628120000_attendance_log.sql b/supabase/migrations/20260628120000_attendance_log.sql
new file mode 100644
index 0000000000000000000000000000000000000000..e47880812c931accd5d16e5a11d02727a9a99de0
--- /dev/null
+++ b/supabase/migrations/20260628120000_attendance_log.sql
@@ -0,0 +1,156 @@
+begin;
+
+create table public.attendance_log (
+  id uuid primary key default gen_random_uuid(),
+  session_id uuid references public.sessions(id) on delete set null,
+  user_id uuid,
+  day_of_week public.day_of_week,
+  "time" text,
+  joined_at timestamptz default now()
+);
+
+create index attendance_log_joined_at_idx
+  on public.attendance_log (joined_at);
+create index attendance_log_slot_idx
+  on public.attendance_log (day_of_week, "time");
+
+alter table public.attendance_log enable row level security;
+revoke all on table public.attendance_log from anon, authenticated;
+
+insert into public.attendance_log (session_id, user_id, day_of_week, "time")
+select sp.session_id, sp.user_id, s.day_of_week, s."time"
+  from public.session_participants sp
+  join public.sessions s on s.id = sp.session_id;
+
+create or replace function public.join_session(p_session_id uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_uid uuid;
+  v_max_participants integer;
+  v_is_open boolean;
+  v_weekly_limit integer;
+  v_booking_count bigint;
+  v_constraint_name text;
+begin
+  v_uid := auth.uid();
+
+  if v_uid is null then
+    raise exception 'not_authenticated' using errcode = '28000';
+  end if;
+
+  if exists (
+    select 1
+      from public.profiles
+     where id = v_uid
+       and enabled = false
+  ) then
+    raise exception 'account_inactive';
+  end if;
+
+  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
+  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));
+
+  select max_participants, is_open
+    into v_max_participants, v_is_open
+    from public.sessions
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  if v_is_open = false then
+    raise exception 'session_closed';
+  end if;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where session_id = p_session_id;
+
+  if v_booking_count >= v_max_participants then
+    raise exception 'session_full';
+  end if;
+
+  select coalesce(
+           (select max_sessions_per_week
+              from public.profiles
+             where id = v_uid),
+           0
+         )
+    into v_weekly_limit;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where user_id = v_uid;
+
+  if v_booking_count >= v_weekly_limit then
+    raise exception 'weekly_limit_reached';
+  end if;
+
+  begin
+    insert into public.session_participants (session_id, user_id)
+    values (p_session_id, v_uid);
+  exception
+    when unique_violation then
+      get stacked diagnostics v_constraint_name = constraint_name;
+
+      if v_constraint_name = 'unique_session_user' then
+        raise exception 'already_joined';
+      end if;
+
+      raise;
+  end;
+
+  insert into public.attendance_log (session_id, user_id, day_of_week, "time")
+  select p_session_id, v_uid, s.day_of_week, s."time"
+    from public.sessions s
+   where s.id = p_session_id;
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+create or replace function public.admin_slot_popularity(p_period text)
+returns table(day_of_week text, time text, bookings bigint)
+language plpgsql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+declare
+  v_cutoff timestamptz;
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  case p_period
+    when '6' then v_cutoff := now() - interval '6 months';
+    when '12' then v_cutoff := now() - interval '12 months';
+    when 'all' then v_cutoff := null;
+    else raise exception 'invalid_period';
+  end case;
+
+  return query
+  select
+    al.day_of_week::text,
+    al."time",
+    count(*)::bigint
+  from public.attendance_log al
+  where v_cutoff is null or al.joined_at >= v_cutoff
+  group by al.day_of_week, al."time"
+  order by count(*) desc, al.day_of_week, al."time";
+end;
+$$;
+
+revoke all on function public.admin_slot_popularity(text) from public, anon;
+grant execute on function public.admin_slot_popularity(text) to authenticated;
+
+commit;

tokens used
26,746
Implemented attendance logging, backfill, `join_session` logging, slot popularity RPC, and admin service/type exports. Existing `index.ts` wildcard exports expose both additions.

`npx tsc --noEmit` passes.

DONE
