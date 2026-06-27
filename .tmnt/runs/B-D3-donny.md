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
session id: 019f0ad0-8831-7ca3-985f-cce1a3ec0a25
--------
user
TASK: Create migration file for admin RPCs (B-D3)

CONTEXT
Goal file: /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/goal-phase-b.md
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Files to consider (read these before changing anything):
- supabase/migrations/20260627160000_booking_enforcement.sql (RPC style reference)
- supabase/migrations/20260627170100_join_session_closed.sql (updated join_session structure)

CONFIRMED SCHEMA (live)
- public.profiles(id uuid pk, first_name text not null, last_name text, enabled bool, role text default 'user', max_sessions_per_week smallint not null default 0)
- public.sessions(id uuid pk default gen_random_uuid(), day_of_week ENUM public.day_of_week (monday..sunday) not null, time text not null, max_participants int not null default 10, created_at timestamp, title text, is_open bool not null default true, room text, duration_min int)
- public.session_participants(user_id uuid FK->profiles(id) ON DELETE CASCADE, session_id uuid FK->sessions(id) ON DELETE CASCADE, unique(session_id,user_id))
- profiles has NO FK to auth.users.

CODING CONSTRAINTS (non-negotiable)
- Simplicity first: minimum code that solves the problem. No speculative features.
- Surgical changes: create ONLY the migration file. No other file edits.
- Match existing style and conventions in this codebase (see booking_enforcement.sql and join_session_closed.sql for SQL idiom).
- Use plpgsql for admin functions, SQL for the is_admin helper.
- Wrap entire migration in BEGIN; ... COMMIT; block.
- Add SQL comments explaining each object.
- All admin functions: security definer, set search_path = public, pg_temp, revoke all from public+anon, grant execute to authenticated.
- In-body role guard (using is_admin check) is the real gate; the grant to authenticated is safe because the function itself checks auth.

DEFINITION OF DONE
1. Migration file created at supabase/migrations/20260627170200_admin_rpcs.sql
2. Contains 6 objects:
   a) public.is_admin(uid uuid) returns boolean — SQL, SECURITY DEFINER, STABLE, set search_path = public, pg_temp
      Body: select coalesce((select role from public.profiles where id = uid), 'user') = 'admin';
      Grants: revoke all from public, anon; grant execute to authenticated.
   
   b) public.admin_set_session_open(p_session_id uuid, p_open boolean) returns void — plpgsql
      Guard at start: if not public.is_admin(auth.uid()) then raise exception 'not_admin' using errcode = '42501'; end if;
      Body: update public.sessions set is_open = p_open where id = p_session_id; if not found raise 'session_not_found'.
      Grants: revoke all from public, anon; grant execute to authenticated.
   
   c) public.admin_upsert_session(p_id uuid, p_title text, p_day_of_week public.day_of_week, p_time text, p_room text, p_duration_min int, p_max_participants int, p_is_open boolean) returns uuid — plpgsql
      Guard at start.
      If p_id is null: insert into public.sessions(title, day_of_week, time, room, duration_min, max_participants, is_open) values(...) returning id;
      Else: update public.sessions set title, day_of_week, time, room, duration_min, max_participants, is_open where id=p_id; if not found raise 'session_not_found'; return p_id.
      Grants: revoke all from public, anon; grant execute to authenticated.
   
   d) public.admin_update_user(p_target uuid, p_first_name text, p_last_name text, p_role text, p_max_sessions_per_week int) returns void — plpgsql
      Guard at start.
      If p_role is not null and p_role not in ('user','admin') raise 'invalid_role'.
      Partial patch via COALESCE (null param = keep existing):
        update public.profiles set
          first_name = coalesce(p_first_name, first_name),
          last_name = coalesce(p_last_name, last_name),
          role = coalesce(p_role, role),
          max_sessions_per_week = coalesce(p_max_sessions_per_week, max_sessions_per_week)
        where id = p_target;
      If no row found raise 'user_not_found'.
      Grants: revoke all from public, anon; grant execute to authenticated.
   
   e) public.admin_delete_user(p_target uuid) returns void — plpgsql
      Guard at start.
      Prevent self-delete: if p_target = auth.uid() raise 'cannot_delete_self'.
      Delete from public.profiles where id = p_target (cascades session_participants via FK ON DELETE CASCADE).
      Delete from auth.users where id = p_target (remove the login).
      Order: profiles first then auth.users. Add comment explaining why both.
      Grants: revoke all from public, anon; grant execute to authenticated.
3. All function names EXACTLY match the task spec (service layer + UI depend on them).
4. All role guards use the shared pattern: `if not public.is_admin(auth.uid()) then raise exception 'not_admin' using errcode = '42501'; end if;`
5. No DB apply, no DB push, no commit via git. Migration file only.
6. npx tsc --noEmit must still pass (no TS changes expected here).

Output: produce the migration file content. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the goal and the two SQL references, then create only the requested migration and run the TypeScript check without applying it.
exec
/bin/zsh -lc "sed -n '1,240p' .tmnt/goal-phase-b.md && sed -n '1,280p' supabase/migrations/20260627160000_booking_enforcement.sql && sed -n '1,280p' supabase/migrations/20260627170100_join_session_closed.sql && git status --short" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
# Goal: Perun Redesign — PHASE B (Admin App)

**Target project:** /Users/uros/Documents/Private/Projects/PerunApp
**Depends on:** Phase A (member redesign) — DONE. Design system (tokens/fonts/assets), member screens, and the data layer are already in place.
**Source of truth (design):** /Users/uros/Desktop/design_handoff_perun_redesign/README.md — Admin section, frames 05–09. README wins over the HTML prototype.
**Status:** Approved to build. Lay backend foundations (migrations + RPCs) BEFORE admin UI.

---

## What we're building
The admin surface of Perun Trening Centar: 5 screens (Pregled / Korisnici / Treninzi / Novi-trening / Statistika) behind a shared admin tab bar, reached by role-based routing after login. Same brand and design system as the member app. This lets the gym operate without touching the database: open/close slots, manage members, create sessions, and see attendance trends.

## Why
Phase A made the member app branded and usable. Phase B unlocks the operator. Today an admin has to go into Supabase directly to change anything; Phase B puts that behind an authenticated, role-gated UI.

---

## REPO REALITY — read before planning (the README's data assumptions are partly wrong)

| README / old plan says | Actual repo |
|---|---|
| `trainings` table | The table is **`sessions`** — `TrainingContext.tsx` queries `.from("sessions")`. Bookings are rows in **`session_participants`** (`user_id`, `session_id`). |
| add `role` to profiles | The DB `profiles.role` column **already exists** (defaults `'user'` via `handle_new_user`). But the **TS `Profile` type does NOT include `role`** — add it. The role-routing branch in the app is the missing piece. |
| booking guard in `src/services/trainings/guards.ts` | No such file. Booking enforcement is the Postgres **`join_session(uuid)` RPC** (migration `supabase/migrations/20260627160000_booking_enforcement.sql`). The `is_open` check extends THAT RPC. |
| form has SALA (room) + TRAJANJE (duration) | The `Training` type / `sessions` table has **no `room` and no `duration` columns** (only `id, day_of_week, title, time, max_participants, created_at`). DECISION REQUIRED — see Decisions. |
| icon set "lucide/ionicons" | **`@expo/vector-icons` already installed** — use Feather (grid, users, calendar, bar-chart-2). No new dep. |
| 6-tab member layout | Members stay single-screen + day-filter (Phase A). Admin is a **separate `(admin)` route group** with its own real bottom tabs. |

Existing booking-error mapping lives in `TrainingContext.tsx` (`bookingErrorMessages` record + `getBookingErrorMessage`). Extend it for `session_closed`.

---

## Decisions to lock before code (recommendations in bold)

1. **Room/duration columns.** The admin create/edit form shows SALA + TRAJANJE, but `sessions` has neither column. → **Add `room text` and `duration_min int` to `sessions` (nullable, sensible defaults), surface them on the `Training` type, and render them in member TrainingCard's "Grupni · Sala A" / "60 min" slots (currently those are hardcoded/placeholder in Phase A).** Alternative: drop both fields from the form (cheaper, but the member card keeps faked room/duration). Pick the first unless you want to defer.
2. **Admin provisioning.** First admin is set by a manual `UPDATE public.profiles SET role='admin' WHERE id='…'` in Supabase Studio. **No self-promotion / invite flow in-app.** (Recommended: yes, manual.)
3. **Stats source.** Real aggregates over `profiles.created_at` (new members/month, cumulative) and `session_participants` vs `max_participants` (occupancy). Numbers in the mock are illustrative — **replace with real RPC/view output, no hardcoded figures.**
4. **Admin write surface.** Use `SECURITY DEFINER` `admin_*` RPCs that check `(select role from profiles where id = auth.uid()) = 'admin'`, rather than broad table-level RLS for admin writes. (Recommended: RPCs — small, auditable surface.)

---

## BACKEND TASKS (Donatello) — these block all admin UI

**B-D1 — Migration: `is_open` on sessions + room/duration (per Decision 1)**
- New migration `supabase/migrations/<ts>_admin_sessions_columns.sql`:
  - `alter table public.sessions add column is_open boolean not null default true;`
  - (Decision 1) `add column room text;` `add column duration_min int;`
  - Backfill existing rows (`is_open = true`; room/duration null or a default).
- DoD: migration applies cleanly locally (`supabase db reset` or `db push` against the linked project in `supabase/.temp/linked-project.json`); no RLS regression for members.

**B-D2 — Extend `join_session` RPC to reject closed slots**
- Update the `join_session(uuid)` function (see `20260627160000_booking_enforcement.sql`) to `raise exception 'session_closed'` when the target session `is_open = false`, before the capacity/limit checks.
- In `TrainingContext.tsx`, add `session_closed: "Termin je trenutno zatvoren za prijave."` to `bookingErrorMessages`.
- DoD: a closed session rejects a member join with the mapped Serbian message; open sessions unaffected. Existing booking tests stay green.

**B-D3 — Admin RPCs (SECURITY DEFINER, role-checked)**
- New migration `<ts>_admin_rpcs.sql` with functions, each guarding `is_admin(auth.uid())`:
  - `admin_set_session_open(session_id uuid, open boolean)`
  - `admin_upsert_session(... title, day_of_week, time, room, duration_min, max_participants, is_open ...)` (insert when id null, else update)
  - `admin_delete_user(target uuid)` (cascade their `session_participants`)
  - `admin_update_user(target uuid, patch ...)` (name, role, max_sessions_per_week)
- DoD: a **non-admin** caller gets denied (RLS/role check), an admin succeeds. Include a SQL-level check or a Raphael integration test asserting the non-admin denial.

**B-D4 — Stats RPCs/view**
- `admin_member_series(months int)` → rows of `{ month, total_members, new_members }` from `profiles.created_at`.
- `admin_occupancy_summary(period text)` → `{ avg_pct, top_day, new_this_month, prev_new }` from `session_participants` / `max_participants`.
- DoD: returns real numbers on the linked project; callable only by admins.

**B-D5 — Types + service layer**
- `src/types/Profile.ts`: add `role: 'user' | 'admin'` (and `created_at` if used by stats UI).
- `src/types/Training.ts`: add `is_open: boolean` (+ `room`, `duration_min` per Decision 1).
- New `src/services/admin/*.ts`: typed wrappers calling the admin RPCs (sessions CRUD, users, stats). No `any`.
- DoD: `npx tsc --noEmit` clean; services typed end-to-end.

---

## ROUTING TASKS (Michelangelo, after B-D5 types exist)

**B-M1 — Role-based redirect**
- In `app/_layout.tsx` RootNavigator: after `login()` + profile fetch resolves, branch `profile.role === 'admin'` → `/(admin)`, else `/(tabs)`. Do not disturb the Phase A font/splash wiring.
- DoD: admin lands on admin tabs, user on member home, no flash of the wrong stack.

**B-M2 — Admin route group + tab bar**
- `app/(admin)/_layout.tsx`: `<Tabs>` (or custom bottom bar per spec, height ~70, white .97, top border, ~24 bottom inset) with 4 tabs — Pregled / Korisnici / Treninzi / Statistika; Feather icons grid/users/calendar/bar-chart-2; active burgundy, inactive `#B3A9B2`.
- DoD: tabs navigate; brand matches; `ADMIN` badge next to the wordmark; admin avatar uses `navy` bg.

## ADMIN SCREEN TASKS (Michelangelo) — reuse Phase A tokens/components where possible

**B-M3 — Pregled `app/(admin)/index.tsx`** (README §5): ADMIN top bar, greeting, 2×2 stat grid, monthly trend chart card (6 bars, current month burgundy / others gold gradient, value label), quick action "＋ Novi trening" → create route. Data from `admin_member_series` + `admin_occupancy_summary`.

**B-M4 — Korisnici `app/(admin)/users.tsx`** (README §6): header + member count, search field, filter chips (Svi/Aktivni/Admini), user rows (avatar tint rotation, name, email, right chip = weekly limit or "Admin"). Expand-to-edit row → "Izmeni" (→ edit) + "Ukloni" (confirm dialog → `admin_delete_user`). Uses `admin_update_user` / `admin_delete_user`.

**B-M5 — Treninzi `app/(admin)/sessions.tsx`** (README §7): day selector (reuse member pattern), workout rows (time/title/room·booked·max), `is_open` toggle switch per row → `admin_set_session_open`. Closed slot = muted + "Zatvoreno" chip + toggle off. "＋ Novi" → create route.

**B-M6 — Novi/Izmena trening `app/(admin)/training/[id].tsx`** (README §8): `[id]==='new'` = create. Fields: NAZIV, DAN (PON–SUB chips, single-select), VREME + TRAJANJE, SALA + MAKS. UČESNIKA (stepper), "Status slota" toggle. Sticky footer Otkaži / "Sačuvaj trening" → `admin_upsert_session`.

**B-M7 — Statistika `app/(admin)/stats.tsx`** (README §9): period chips (12/6/Sve), 12-bar members chart (current month burgundy), two secondary tiles (NOVIH/MES., PROS. POPUNJ. + top day). Data from stats RPCs.

**B-M8 — Charts + shared admin components**
- New `src/components/admin/{StatTile, BarChart, UserRow, SessionRow, Toggle, FilterChips}.tsx`. `BarChart` is a small custom RN component (no extra dep), normalised to max value, gold gradient with burgundy current-period bar.
- DoD: components reused across Pregled/Statistika/Treninzi/Korisnici.

---

## VERIFICATION (Raphael)

**B-R1 — Gates:** `npx tsc --noEmit` clean; `npm run lint` (no new errors); `npm run test` green. New migrations apply on the linked project.
**B-R2 — Security test:** assert a non-admin profile **cannot** call any `admin_*` RPC (denied), and an admin can. This is the highest-risk surface.
**B-R3 — Cross-role smoke (document, run on device/sim where headless can't):**
- Member login → no admin tabs visible.
- Admin login → admin tabs visible.
- Admin closes a session → member sees it disabled and the join is rejected with `session_closed`.
- Admin creates a session → it appears in the member's week.
- Pregled + Statistika render REAL Supabase numbers (not mocks).

---

## Constraints (hold throughout)
- React Native primitives only (`View/Text/Pressable/Image/TextInput/FlatList/SafeAreaView`). No web/HTML, no UI kit, no Tailwind.
- Reuse `useAuth` / `useTrainings`; no parallel data layer. Admin data goes through the new `src/services/admin/*` + RPCs.
- TypeScript strict, no new `any`. Serbian copy is canonical — do not anglicise.
- Guard EVERY admin mutation in the database (role check in the RPC), not just in the UI. UI gating is not security.
- Brand colors/shadows from README are canonical.

## Phase B explicitly does NOT include
- Admin self-promotion / email-invite flow (manual role seed only).
- Push notifications / email on session changes.
- Multi-gym / multi-center support. Localisation beyond Serbian.
- Production/store builds.

## Definition of done
- `role='admin'` lands on the admin tab bar after login; `role='user'` lands on member home (no regressions).
- Closing a session in admin prevents member joins (UI closed state + RPC `session_closed`).
- Create-session form inserts and the session appears in the member week.
- Pregled + Statistika show real aggregates from Supabase.
- A non-admin cannot call admin RPCs (verified by test).
- `npm run lint` + `npm run test` green; migrations apply cleanly on the linked project.

---

## Suggested build order (for Leonardo)
1. Backend first — B-D1 → B-D2 → B-D3 → B-D4 → B-D5 (migrations + RPCs + types/services). These block all UI.
2. Routing — B-M1, B-M2 (role redirect + admin shell).
3. Screens — B-M3…B-M7, with B-M8 shared components extracted early (BarChart/StatTile needed by Pregled + Statistika).
4. Verification — B-R1 gates throughout; B-R2 security test once admin RPCs land; B-R3 cross-role smoke at the end.
-- Audit remediation (T3 / T4): enforce bookings atomically and reset weekly.
-- `session_participants` contains only the current week's bookings; every
-- Sunday at 00:00 Europe/Belgrade the table is wiped in full.

begin;

-- 1) pg_cron runs the weekly reset inside PostgreSQL.
create extension if not exists pg_cron;

-- 2) All joins pass through one server-side transaction. The session lock
--    serializes capacity checks; the user lock serializes weekly-limit checks
--    across simultaneous joins to different sessions.
create or replace function public.join_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_max_participants integer;
  v_weekly_limit integer;
  v_booking_count bigint;
  v_constraint_name text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));

  select max_participants
    into v_max_participants
    from public.sessions
   where id = p_session_id;

  if not found then
    raise exception 'session_not_found';
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

-- 3) Direct INSERT is no longer allowed; SELECT and own-row DELETE policies
--    remain unchanged.
drop policy if exists "Users can join sessions" on public.session_participants;

-- 4) Run hourly and guard on Belgrade local time. This avoids encoding a fixed
--    UTC offset, so the Sunday 00:00 reset remains correct across DST changes.
do $$
begin
  if exists (
    select 1
      from cron.job
     where jobname = 'weekly-booking-reset'
  ) then
    perform cron.unschedule('weekly-booking-reset');
  end if;
end;
$$;

select cron.schedule(
  'weekly-booking-reset',
  '0 * * * *',
  $cron$
    delete from public.session_participants
     where extract(dow from (now() at time zone 'Europe/Belgrade')) = 0
       and (now() at time zone 'Europe/Belgrade')::time < time '01:00';
  $cron$
);

commit;
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
?? .tmnt/runs/B-D3-donny.md

exec
/bin/zsh -lc 'rg -n "is_admin|admin_set_session_open|admin_upsert_session|admin_update_user|admin_delete_user|create or replace function" supabase/migrations && rg -n "create type public.day_of_week|day_of_week" supabase/migrations | head -80 && ls -l supabase/migrations/20260627170*.sql' in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
supabase/migrations/20260627160000_booking_enforcement.sql:13:create or replace function public.join_session(p_session_id uuid)
supabase/migrations/20260627161500_default_weekly_limit_zero.sql:16:create or replace function public.handle_new_user()
supabase/migrations/20260627170100_join_session_closed.sql:3:create or replace function public.join_session(p_session_id uuid)
-rw-r--r--@ 1 uros  staff   336 Jun 27 22:37 supabase/migrations/20260627170000_admin_sessions_columns.sql
-rw-r--r--@ 1 uros  staff  1974 Jun 27 22:37 supabase/migrations/20260627170100_join_session_closed.sql

codex
The references confirm lowercase SQL, `create or replace function`, explicit function-signature grants, and `public, pg_temp` search paths. I’m preserving the unrelated untracked `.tmnt/runs/B-D3-donny.md` file and adding only the migration.
apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/supabase/migrations/20260627170200_admin_rpcs.sql
diff --git a/supabase/migrations/20260627170200_admin_rpcs.sql b/supabase/migrations/20260627170200_admin_rpcs.sql
new file mode 100644
index 0000000000000000000000000000000000000000..0318aba5a30ad71ee3a220db131e125a0a34e75a
--- /dev/null
+++ b/supabase/migrations/20260627170200_admin_rpcs.sql
@@ -0,0 +1,185 @@
+begin;
+
+-- Shared role check used by every admin RPC.
+create or replace function public.is_admin(uid uuid)
+returns boolean
+language sql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+  select coalesce(
+           (select role from public.profiles where id = uid),
+           'user'
+         ) = 'admin';
+$$;
+
+revoke all on function public.is_admin(uuid) from public, anon;
+grant execute on function public.is_admin(uuid) to authenticated;
+
+-- Opens or closes an existing session for member bookings.
+create or replace function public.admin_set_session_open(
+  p_session_id uuid,
+  p_open boolean
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  update public.sessions
+     set is_open = p_open
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_set_session_open(uuid, boolean) from public, anon;
+grant execute on function public.admin_set_session_open(uuid, boolean) to authenticated;
+
+-- Creates a new session when p_id is null, otherwise updates the matching session.
+create or replace function public.admin_upsert_session(
+  p_id uuid,
+  p_title text,
+  p_day_of_week public.day_of_week,
+  p_time text,
+  p_room text,
+  p_duration_min integer,
+  p_max_participants integer,
+  p_is_open boolean
+)
+returns uuid
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_session_id uuid;
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_id is null then
+    insert into public.sessions (
+      title,
+      day_of_week,
+      time,
+      room,
+      duration_min,
+      max_participants,
+      is_open
+    )
+    values (
+      p_title,
+      p_day_of_week,
+      p_time,
+      p_room,
+      p_duration_min,
+      p_max_participants,
+      p_is_open
+    )
+    returning id into v_session_id;
+
+    return v_session_id;
+  end if;
+
+  update public.sessions
+     set title = p_title,
+         day_of_week = p_day_of_week,
+         time = p_time,
+         room = p_room,
+         duration_min = p_duration_min,
+         max_participants = p_max_participants,
+         is_open = p_is_open
+   where id = p_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  return p_id;
+end;
+$$;
+
+revoke all on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) from public, anon;
+grant execute on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) to authenticated;
+
+-- Applies a partial profile patch while preserving fields passed as null.
+create or replace function public.admin_update_user(
+  p_target uuid,
+  p_first_name text,
+  p_last_name text,
+  p_role text,
+  p_max_sessions_per_week integer
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_role is not null and p_role not in ('user', 'admin') then
+    raise exception 'invalid_role';
+  end if;
+
+  update public.profiles
+     set first_name = coalesce(p_first_name, first_name),
+         last_name = coalesce(p_last_name, last_name),
+         role = coalesce(p_role, role),
+         max_sessions_per_week = coalesce(
+           p_max_sessions_per_week,
+           max_sessions_per_week
+         )
+   where id = p_target;
+
+  if not found then
+    raise exception 'user_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_update_user(uuid, text, text, text, integer) from public, anon;
+grant execute on function public.admin_update_user(uuid, text, text, text, integer) to authenticated;
+
+-- Removes both the application profile and its login. The profile is deleted
+-- first so its session_participants rows cascade before the auth account goes.
+create or replace function public.admin_delete_user(p_target uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_target = auth.uid() then
+    raise exception 'cannot_delete_self';
+  end if;
+
+  delete from public.profiles
+   where id = p_target;
+
+  delete from auth.users
+   where id = p_target;
+end;
+$$;
+
+revoke all on function public.admin_delete_user(uuid) from public, anon;
+grant execute on function public.admin_delete_user(uuid) to authenticated;
+
+commit;

diff --git a/supabase/migrations/20260627170200_admin_rpcs.sql b/supabase/migrations/20260627170200_admin_rpcs.sql
new file mode 100644
index 0000000000000000000000000000000000000000..0318aba5a30ad71ee3a220db131e125a0a34e75a
--- /dev/null
+++ b/supabase/migrations/20260627170200_admin_rpcs.sql
@@ -0,0 +1,185 @@
+begin;
+
+-- Shared role check used by every admin RPC.
+create or replace function public.is_admin(uid uuid)
+returns boolean
+language sql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+  select coalesce(
+           (select role from public.profiles where id = uid),
+           'user'
+         ) = 'admin';
+$$;
+
+revoke all on function public.is_admin(uuid) from public, anon;
+grant execute on function public.is_admin(uuid) to authenticated;
+
+-- Opens or closes an existing session for member bookings.
+create or replace function public.admin_set_session_open(
+  p_session_id uuid,
+  p_open boolean
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  update public.sessions
+     set is_open = p_open
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_set_session_open(uuid, boolean) from public, anon;
+grant execute on function public.admin_set_session_open(uuid, boolean) to authenticated;
+
+-- Creates a new session when p_id is null, otherwise updates the matching session.
+create or replace function public.admin_upsert_session(
+  p_id uuid,
+  p_title text,
+  p_day_of_week public.day_of_week,
+  p_time text,
+  p_room text,
+  p_duration_min integer,
+  p_max_participants integer,
+  p_is_open boolean
+)
+returns uuid
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_session_id uuid;
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_id is null then
+    insert into public.sessions (
+      title,
+      day_of_week,
+      time,
+      room,
+      duration_min,
+      max_participants,
+      is_open
+    )
+    values (
+      p_title,
+      p_day_of_week,
+      p_time,
+      p_room,
+      p_duration_min,
+      p_max_participants,
+      p_is_open
+    )
+    returning id into v_session_id;
+
+    return v_session_id;
+  end if;
+
+  update public.sessions
+     set title = p_title,
+         day_of_week = p_day_of_week,
+         time = p_time,
+         room = p_room,
+         duration_min = p_duration_min,
+         max_participants = p_max_participants,
+         is_open = p_is_open
+   where id = p_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  return p_id;
+end;
+$$;
+
+revoke all on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) from public, anon;
+grant execute on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) to authenticated;
+
+-- Applies a partial profile patch while preserving fields passed as null.
+create or replace function public.admin_update_user(
+  p_target uuid,
+  p_first_name text,
+  p_last_name text,
+  p_role text,
+  p_max_sessions_per_week integer
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_role is not null and p_role not in ('user', 'admin') then
+    raise exception 'invalid_role';
+  end if;
+
+  update public.profiles
+     set first_name = coalesce(p_first_name, first_name),
+         last_name = coalesce(p_last_name, last_name),
+         role = coalesce(p_role, role),
+         max_sessions_per_week = coalesce(
+           p_max_sessions_per_week,
+           max_sessions_per_week
+         )
+   where id = p_target;
+
+  if not found then
+    raise exception 'user_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_update_user(uuid, text, text, text, integer) from public, anon;
+grant execute on function public.admin_update_user(uuid, text, text, text, integer) to authenticated;
+
+-- Removes both the application profile and its login. The profile is deleted
+-- first so its session_participants rows cascade before the auth account goes.
+create or replace function public.admin_delete_user(p_target uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_target = auth.uid() then
+    raise exception 'cannot_delete_self';
+  end if;
+
+  delete from public.profiles
+   where id = p_target;
+
+  delete from auth.users
+   where id = p_target;
+end;
+$$;
+
+revoke all on function public.admin_delete_user(uuid) from public, anon;
+grant execute on function public.admin_delete_user(uuid) to authenticated;
+
+commit;

exec
/bin/zsh -lc "sed -n '1,320p' supabase/migrations/20260627170200_admin_rpcs.sql && git status --short && npx tsc --noEmit" in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/supabase/migrations/20260627170200_admin_rpcs.sql b/supabase/migrations/20260627170200_admin_rpcs.sql
new file mode 100644
index 0000000000000000000000000000000000000000..0318aba5a30ad71ee3a220db131e125a0a34e75a
--- /dev/null
+++ b/supabase/migrations/20260627170200_admin_rpcs.sql
@@ -0,0 +1,185 @@
+begin;
+
+-- Shared role check used by every admin RPC.
+create or replace function public.is_admin(uid uuid)
+returns boolean
+language sql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+  select coalesce(
+           (select role from public.profiles where id = uid),
+           'user'
+         ) = 'admin';
+$$;
+
+revoke all on function public.is_admin(uuid) from public, anon;
+grant execute on function public.is_admin(uuid) to authenticated;
+
+-- Opens or closes an existing session for member bookings.
+create or replace function public.admin_set_session_open(
+  p_session_id uuid,
+  p_open boolean
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  update public.sessions
+     set is_open = p_open
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_set_session_open(uuid, boolean) from public, anon;
+grant execute on function public.admin_set_session_open(uuid, boolean) to authenticated;
+
+-- Creates a new session when p_id is null, otherwise updates the matching session.
+create or replace function public.admin_upsert_session(
+  p_id uuid,
+  p_title text,
+  p_day_of_week public.day_of_week,
+  p_time text,
+  p_room text,
+  p_duration_min integer,
+  p_max_participants integer,
+  p_is_open boolean
+)
+returns uuid
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_session_id uuid;
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_id is null then
+    insert into public.sessions (
+      title,
+      day_of_week,
+      time,
+      room,
+      duration_min,
+      max_participants,
+      is_open
+    )
+    values (
+      p_title,
+      p_day_of_week,
+      p_time,
+      p_room,
+      p_duration_min,
+      p_max_participants,
+      p_is_open
+    )
+    returning id into v_session_id;
+
+    return v_session_id;
+  end if;
+
+  update public.sessions
+     set title = p_title,
+         day_of_week = p_day_of_week,
+         time = p_time,
+         room = p_room,
+         duration_min = p_duration_min,
+         max_participants = p_max_participants,
+         is_open = p_is_open
+   where id = p_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  return p_id;
+end;
+$$;
+
+revoke all on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) from public, anon;
+grant execute on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) to authenticated;
+
+-- Applies a partial profile patch while preserving fields passed as null.
+create or replace function public.admin_update_user(
+  p_target uuid,
+  p_first_name text,
+  p_last_name text,
+  p_role text,
+  p_max_sessions_per_week integer
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_role is not null and p_role not in ('user', 'admin') then
+    raise exception 'invalid_role';
+  end if;
+
+  update public.profiles
+     set first_name = coalesce(p_first_name, first_name),
+         last_name = coalesce(p_last_name, last_name),
+         role = coalesce(p_role, role),
+         max_sessions_per_week = coalesce(
+           p_max_sessions_per_week,
+           max_sessions_per_week
+         )
+   where id = p_target;
+
+  if not found then
+    raise exception 'user_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_update_user(uuid, text, text, text, integer) from public, anon;
+grant execute on function public.admin_update_user(uuid, text, text, text, integer) to authenticated;
+
+-- Removes both the application profile and its login. The profile is deleted
+-- first so its session_participants rows cascade before the auth account goes.
+create or replace function public.admin_delete_user(p_target uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_target = auth.uid() then
+    raise exception 'cannot_delete_self';
+  end if;
+
+  delete from public.profiles
+   where id = p_target;
+
+  delete from auth.users
+   where id = p_target;
+end;
+$$;
+
+revoke all on function public.admin_delete_user(uuid) from public, anon;
+grant execute on function public.admin_delete_user(uuid) to authenticated;
+
+commit;

 succeeded in 4417ms:
codex
The migration is in place and `npx tsc --noEmit` passes. I’m doing a final static check for the required signatures, guards, privileges, transaction wrapper, and file-only scope; no database apply or push will be run.
apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/supabase/migrations/20260627170200_admin_rpcs.sql
diff --git a/supabase/migrations/20260627170200_admin_rpcs.sql b/supabase/migrations/20260627170200_admin_rpcs.sql
new file mode 100644
index 0000000000000000000000000000000000000000..d11a8adb67da81634c4078b36e5f3a803c1ba6fe
--- /dev/null
+++ b/supabase/migrations/20260627170200_admin_rpcs.sql
@@ -0,0 +1,182 @@
+begin;
+
+-- Shared role check used by every admin RPC.
+create or replace function public.is_admin(uid uuid)
+returns boolean
+language sql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+  select coalesce((select role from public.profiles where id = uid), 'user') = 'admin';
+$$;
+
+revoke all on function public.is_admin(uuid) from public, anon;
+grant execute on function public.is_admin(uuid) to authenticated;
+
+-- Opens or closes an existing session for member bookings.
+create or replace function public.admin_set_session_open(
+  p_session_id uuid,
+  p_open boolean
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  update public.sessions
+     set is_open = p_open
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_set_session_open(uuid, boolean) from public, anon;
+grant execute on function public.admin_set_session_open(uuid, boolean) to authenticated;
+
+-- Creates a new session when p_id is null, otherwise updates the matching session.
+create or replace function public.admin_upsert_session(
+  p_id uuid,
+  p_title text,
+  p_day_of_week public.day_of_week,
+  p_time text,
+  p_room text,
+  p_duration_min integer,
+  p_max_participants integer,
+  p_is_open boolean
+)
+returns uuid
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_session_id uuid;
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_id is null then
+    insert into public.sessions (
+      title,
+      day_of_week,
+      time,
+      room,
+      duration_min,
+      max_participants,
+      is_open
+    )
+    values (
+      p_title,
+      p_day_of_week,
+      p_time,
+      p_room,
+      p_duration_min,
+      p_max_participants,
+      p_is_open
+    )
+    returning id into v_session_id;
+
+    return v_session_id;
+  end if;
+
+  update public.sessions
+     set title = p_title,
+         day_of_week = p_day_of_week,
+         time = p_time,
+         room = p_room,
+         duration_min = p_duration_min,
+         max_participants = p_max_participants,
+         is_open = p_is_open
+   where id = p_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  return p_id;
+end;
+$$;
+
+revoke all on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) from public, anon;
+grant execute on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) to authenticated;
+
+-- Applies a partial profile patch while preserving fields passed as null.
+create or replace function public.admin_update_user(
+  p_target uuid,
+  p_first_name text,
+  p_last_name text,
+  p_role text,
+  p_max_sessions_per_week integer
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_role is not null and p_role not in ('user', 'admin') then
+    raise exception 'invalid_role';
+  end if;
+
+  update public.profiles
+     set first_name = coalesce(p_first_name, first_name),
+         last_name = coalesce(p_last_name, last_name),
+         role = coalesce(p_role, role),
+         max_sessions_per_week = coalesce(
+           p_max_sessions_per_week,
+           max_sessions_per_week
+         )
+   where id = p_target;
+
+  if not found then
+    raise exception 'user_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_update_user(uuid, text, text, text, integer) from public, anon;
+grant execute on function public.admin_update_user(uuid, text, text, text, integer) to authenticated;
+
+-- Removes both the application profile and its login. The profile is deleted
+-- first so its session_participants rows cascade before the auth account goes.
+create or replace function public.admin_delete_user(p_target uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_target = auth.uid() then
+    raise exception 'cannot_delete_self';
+  end if;
+
+  delete from public.profiles
+   where id = p_target;
+
+  delete from auth.users
+   where id = p_target;
+end;
+$$;
+
+revoke all on function public.admin_delete_user(uuid) from public, anon;
+grant execute on function public.admin_delete_user(uuid) to authenticated;
+
+commit;

exec
/bin/zsh -lc 'test "$(head -n 1 supabase/migrations/20260627170200_admin_rpcs.sql)" = "begin;" && test "$(tail -n 1 supabase/migrations/20260627170200_admin_rpcs.sql)" = "commit;" && test "$(rg -c "create or replace function public'"\\.\" supabase/migrations/20260627170200_admin_rpcs.sql)\" = \"5\" && test \""'$(rg -c "security definer" supabase/migrations/20260627170200_admin_rpcs.sql)" = "5" && test "$(rg -c "set search_path = public, pg_temp" supabase/migrations/20260627170200_admin_rpcs.sql)" = "5" && test "$(rg -c "raise exception '"'not_admin' using errcode = '42501';\" supabase/migrations/20260627170200_admin_rpcs.sql)\" = \"4\" && git diff --check -- supabase/migrations/20260627170200_admin_rpcs.sql && git status --short" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
?? .tmnt/runs/B-D3-donny.md
?? supabase/migrations/20260627170200_admin_rpcs.sql

diff --git a/supabase/migrations/20260627170200_admin_rpcs.sql b/supabase/migrations/20260627170200_admin_rpcs.sql
new file mode 100644
index 0000000000000000000000000000000000000000..d11a8adb67da81634c4078b36e5f3a803c1ba6fe
--- /dev/null
+++ b/supabase/migrations/20260627170200_admin_rpcs.sql
@@ -0,0 +1,182 @@
+begin;
+
+-- Shared role check used by every admin RPC.
+create or replace function public.is_admin(uid uuid)
+returns boolean
+language sql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+  select coalesce((select role from public.profiles where id = uid), 'user') = 'admin';
+$$;
+
+revoke all on function public.is_admin(uuid) from public, anon;
+grant execute on function public.is_admin(uuid) to authenticated;
+
+-- Opens or closes an existing session for member bookings.
+create or replace function public.admin_set_session_open(
+  p_session_id uuid,
+  p_open boolean
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  update public.sessions
+     set is_open = p_open
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_set_session_open(uuid, boolean) from public, anon;
+grant execute on function public.admin_set_session_open(uuid, boolean) to authenticated;
+
+-- Creates a new session when p_id is null, otherwise updates the matching session.
+create or replace function public.admin_upsert_session(
+  p_id uuid,
+  p_title text,
+  p_day_of_week public.day_of_week,
+  p_time text,
+  p_room text,
+  p_duration_min integer,
+  p_max_participants integer,
+  p_is_open boolean
+)
+returns uuid
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_session_id uuid;
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_id is null then
+    insert into public.sessions (
+      title,
+      day_of_week,
+      time,
+      room,
+      duration_min,
+      max_participants,
+      is_open
+    )
+    values (
+      p_title,
+      p_day_of_week,
+      p_time,
+      p_room,
+      p_duration_min,
+      p_max_participants,
+      p_is_open
+    )
+    returning id into v_session_id;
+
+    return v_session_id;
+  end if;
+
+  update public.sessions
+     set title = p_title,
+         day_of_week = p_day_of_week,
+         time = p_time,
+         room = p_room,
+         duration_min = p_duration_min,
+         max_participants = p_max_participants,
+         is_open = p_is_open
+   where id = p_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  return p_id;
+end;
+$$;
+
+revoke all on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) from public, anon;
+grant execute on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) to authenticated;
+
+-- Applies a partial profile patch while preserving fields passed as null.
+create or replace function public.admin_update_user(
+  p_target uuid,
+  p_first_name text,
+  p_last_name text,
+  p_role text,
+  p_max_sessions_per_week integer
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_role is not null and p_role not in ('user', 'admin') then
+    raise exception 'invalid_role';
+  end if;
+
+  update public.profiles
+     set first_name = coalesce(p_first_name, first_name),
+         last_name = coalesce(p_last_name, last_name),
+         role = coalesce(p_role, role),
+         max_sessions_per_week = coalesce(
+           p_max_sessions_per_week,
+           max_sessions_per_week
+         )
+   where id = p_target;
+
+  if not found then
+    raise exception 'user_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_update_user(uuid, text, text, text, integer) from public, anon;
+grant execute on function public.admin_update_user(uuid, text, text, text, integer) to authenticated;
+
+-- Removes both the application profile and its login. The profile is deleted
+-- first so its session_participants rows cascade before the auth account goes.
+create or replace function public.admin_delete_user(p_target uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_target = auth.uid() then
+    raise exception 'cannot_delete_self';
+  end if;
+
+  delete from public.profiles
+   where id = p_target;
+
+  delete from auth.users
+   where id = p_target;
+end;
+$$;
+
+revoke all on function public.admin_delete_user(uuid) from public, anon;
+grant execute on function public.admin_delete_user(uuid) to authenticated;
+
+commit;

codex
Created `supabase/migrations/20260627170200_admin_rpcs.sql` with all specified RPCs, guards, grants, comments, and transaction wrapping.

`npx tsc --noEmit` passes. No database or Git operations performed.

DONE
diff --git a/supabase/migrations/20260627170200_admin_rpcs.sql b/supabase/migrations/20260627170200_admin_rpcs.sql
new file mode 100644
index 0000000000000000000000000000000000000000..d11a8adb67da81634c4078b36e5f3a803c1ba6fe
--- /dev/null
+++ b/supabase/migrations/20260627170200_admin_rpcs.sql
@@ -0,0 +1,182 @@
+begin;
+
+-- Shared role check used by every admin RPC.
+create or replace function public.is_admin(uid uuid)
+returns boolean
+language sql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+  select coalesce((select role from public.profiles where id = uid), 'user') = 'admin';
+$$;
+
+revoke all on function public.is_admin(uuid) from public, anon;
+grant execute on function public.is_admin(uuid) to authenticated;
+
+-- Opens or closes an existing session for member bookings.
+create or replace function public.admin_set_session_open(
+  p_session_id uuid,
+  p_open boolean
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  update public.sessions
+     set is_open = p_open
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_set_session_open(uuid, boolean) from public, anon;
+grant execute on function public.admin_set_session_open(uuid, boolean) to authenticated;
+
+-- Creates a new session when p_id is null, otherwise updates the matching session.
+create or replace function public.admin_upsert_session(
+  p_id uuid,
+  p_title text,
+  p_day_of_week public.day_of_week,
+  p_time text,
+  p_room text,
+  p_duration_min integer,
+  p_max_participants integer,
+  p_is_open boolean
+)
+returns uuid
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_session_id uuid;
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_id is null then
+    insert into public.sessions (
+      title,
+      day_of_week,
+      time,
+      room,
+      duration_min,
+      max_participants,
+      is_open
+    )
+    values (
+      p_title,
+      p_day_of_week,
+      p_time,
+      p_room,
+      p_duration_min,
+      p_max_participants,
+      p_is_open
+    )
+    returning id into v_session_id;
+
+    return v_session_id;
+  end if;
+
+  update public.sessions
+     set title = p_title,
+         day_of_week = p_day_of_week,
+         time = p_time,
+         room = p_room,
+         duration_min = p_duration_min,
+         max_participants = p_max_participants,
+         is_open = p_is_open
+   where id = p_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  return p_id;
+end;
+$$;
+
+revoke all on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) from public, anon;
+grant execute on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) to authenticated;
+
+-- Applies a partial profile patch while preserving fields passed as null.
+create or replace function public.admin_update_user(
+  p_target uuid,
+  p_first_name text,
+  p_last_name text,
+  p_role text,
+  p_max_sessions_per_week integer
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_role is not null and p_role not in ('user', 'admin') then
+    raise exception 'invalid_role';
+  end if;
+
+  update public.profiles
+     set first_name = coalesce(p_first_name, first_name),
+         last_name = coalesce(p_last_name, last_name),
+         role = coalesce(p_role, role),
+         max_sessions_per_week = coalesce(
+           p_max_sessions_per_week,
+           max_sessions_per_week
+         )
+   where id = p_target;
+
+  if not found then
+    raise exception 'user_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_update_user(uuid, text, text, text, integer) from public, anon;
+grant execute on function public.admin_update_user(uuid, text, text, text, integer) to authenticated;
+
+-- Removes both the application profile and its login. The profile is deleted
+-- first so its session_participants rows cascade before the auth account goes.
+create or replace function public.admin_delete_user(p_target uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_target = auth.uid() then
+    raise exception 'cannot_delete_self';
+  end if;
+
+  delete from public.profiles
+   where id = p_target;
+
+  delete from auth.users
+   where id = p_target;
+end;
+$$;
+
+revoke all on function public.admin_delete_user(uuid) from public, anon;
+grant execute on function public.admin_delete_user(uuid) to authenticated;
+
+commit;

tokens used
17,887
Created `supabase/migrations/20260627170200_admin_rpcs.sql` with all specified RPCs, guards, grants, comments, and transaction wrapping.

`npx tsc --noEmit` passes. No database or Git operations performed.

DONE
