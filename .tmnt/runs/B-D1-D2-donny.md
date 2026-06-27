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
session id: 019f0acc-c7df-73b2-83f5-a902b5845471
--------
user
TASK: Phase B Wave 1 — B-D1 + B-D2 (Admin session columns + join_session close guard)

CONTEXT
Goal file: /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/goal-phase-b.md
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Files to consider (read these before changing anything):
- supabase/migrations/20260627160000_booking_enforcement.sql (existing join_session RPC — copy and extend)
- src/contexts/TrainingContext.tsx (add session_closed to bookingErrorMessages)
- src/types/Training.ts (will be updated in B-D5, not this task)

CODING CONSTRAINTS (non-negotiable)
- Simplicity first: minimum code that solves the problem. No speculative features.
- Surgical changes: create two new migration files ONLY. Add one error mapping line to TrainingContext.
- Match existing style and conventions in this codebase.
- No new dependencies.
- If anything is unclear, output a line starting "QUESTION:" and stop without writing code.

DEFINITION OF DONE
1. Create two new migration files:
   a. supabase/migrations/20260627170000_admin_sessions_columns.sql
      - ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS is_open boolean NOT NULL DEFAULT true;
      - ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS room text;
      - ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS duration_min integer;
      - Wrapped in BEGIN/COMMIT, idempotent (IF NOT EXISTS), with a comment explaining room/duration are nullable.
   b. supabase/migrations/20260627170100_join_session_closed.sql
      - CREATE OR REPLACE FUNCTION public.join_session(p_session_id uuid)
      - Copy the ENTIRE body from 20260627160000_booking_enforcement.sql EXACTLY
      - ADD a guard AFTER the advisory locks and BEFORE the capacity check:
        * Fetch is_open together with max_participants from public.sessions
        * If session row not found -> raise exception 'session_not_found' (already there)
        * If is_open = false -> raise exception 'session_closed' (NEW, must come BEFORE capacity/limit checks)
      - Re-assert the grants: revoke all from public, anon; grant execute to authenticated.
      - Wrapped in BEGIN/COMMIT.

2. In src/contexts/TrainingContext.tsx:
   - In the bookingErrorMessages record (line 8–14), add ONE new line:
     session_closed: "Termin je trenutno zatvoren za prijave."

3. Code style:
   - PostgreSQL: indentation as in existing migrations, lowercase keywords.
   - TypeScript: no formatting changes to TrainingContext beyond the one new record entry.

4. Verification:
   - npx tsc --noEmit must exit 0.
   - No commits, no DB apply (Main Claude will do that after review).

Output: produce the two migration files and the exact TrainingContext diff. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the specified migration and context file first, then make only the three requested changes and run TypeScript verification.
exec
/bin/zsh -lc "sed -n '1,260p' supabase/migrations/20260627160000_booking_enforcement.sql && sed -n '1,40p' src/contexts/TrainingContext.tsx && git status --short" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
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
import { createContext, useEffect, useState } from "react";
import { Alert } from "react-native";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase/client";
import { Training } from "@/types/Training";

const bookingErrorMessages: Record<string, string> = {
  weekly_limit_reached: "Dostigli ste nedeljni limit.",
  session_full: "Termin je popunjen.",
  already_joined: "Već ste prijavljeni na ovaj termin.",
  not_authenticated: "Niste prijavljeni.",
  session_not_found: "Termin nije pronađen.",
};

const getBookingErrorMessage = (rawMessage: string, mapRpcCodes = true) => {
  if (mapRpcCodes) {
    const code = Object.keys(bookingErrorMessages).find((key) =>
      rawMessage.includes(key),
    );

    if (code) return bookingErrorMessages[code];
  }

  const fallback = "Došlo je do greške. Pokušajte ponovo.";
  return __DEV__ && rawMessage ? `${fallback}\n\n${rawMessage}` : fallback;
};

type TrainingContextType = {
  trainings: Training[];
  loading: boolean;
  fetchTrainings: () => Promise<void>;
  getTrainingsByDay: (day: string) => Training[];
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: (sessionId: string) => Promise<void>;
  canJoinSession: () => boolean;
  reachedLimit: boolean;
  bookedCount: number;
};

 M .claude/agents/memory/raphael-memory.md
 M .claude/agents/memory/splinter-session.md
 M app/(tabs)/_layout.tsx
 M app/_layout.tsx
 M app/login.tsx
 M package-lock.json
 M package.json
 M src/components/AlertBar.tsx
 M src/components/DayFilter.tsx
 M src/components/Header.tsx
 M src/components/TrainingCard.tsx
 M src/constants/Colors.ts
 M src/contexts/AuthContext.tsx
?? .claude/agents/tmnt/session-logs/2026-06-27-S2-raphael.md
?? .tmnt/board-redesign.md
?? .tmnt/goal-phase-b.md
?? .tmnt/goal-redesign.md
?? .tmnt/runs/B-D1-D2-donny.md
?? .tmnt/runs/D1-donatello.md
?? .tmnt/runs/D2-donatello.md
?? .tmnt/runs/D2-donny.md
?? .tmnt/runs/D3-donatello.md
?? .tmnt/runs/M1-M6-codex-raw.log
?? .tmnt/runs/M1-M6-michelangelo.md
?? .tmnt/runs/M7-M8-michelangelo.md
?? .tmnt/runs/R1-raphael.md
?? .tmnt/runs/R2-raphael.md
?? .tmnt/runs/R3-raphael.md
?? app/profile.tsx
?? assets/images/perun-emblem-burgundy.png
?? assets/images/perun-emblem-cream.png
?? assets/images/perun-emblem-gold.png
?? assets/images/perun-emblem-ink.png
?? assets/images/perun-emblem-sage.png
?? assets/images/perun-wordmark-burgundy.png
?? assets/images/perun-wordmark-cream.png
?? assets/images/perun-wordmark-gold.png
?? src/components/EmptyDay.tsx
?? src/constants/__tests__/tokens.test.ts
?? src/constants/spacing.ts
?? src/constants/typography.ts
?? src/utils/

codex
The existing function structure is clear. I’m checking the goal entry for any task-specific constraint before patching, while preserving the unrelated dirty worktree.
exec
/bin/zsh -lc 'rg -n -C 8 "B-D1|B-D2|admin_sessions|join_session" .tmnt/goal-phase-b.md' in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
16----
17-
18-## REPO REALITY — read before planning (the README's data assumptions are partly wrong)
19-
20-| README / old plan says | Actual repo |
21-|---|---|
22-| `trainings` table | The table is **`sessions`** — `TrainingContext.tsx` queries `.from("sessions")`. Bookings are rows in **`session_participants`** (`user_id`, `session_id`). |
23-| add `role` to profiles | The DB `profiles.role` column **already exists** (defaults `'user'` via `handle_new_user`). But the **TS `Profile` type does NOT include `role`** — add it. The role-routing branch in the app is the missing piece. |
24:| booking guard in `src/services/trainings/guards.ts` | No such file. Booking enforcement is the Postgres **`join_session(uuid)` RPC** (migration `supabase/migrations/20260627160000_booking_enforcement.sql`). The `is_open` check extends THAT RPC. |
25-| form has SALA (room) + TRAJANJE (duration) | The `Training` type / `sessions` table has **no `room` and no `duration` columns** (only `id, day_of_week, title, time, max_participants, created_at`). DECISION REQUIRED — see Decisions. |
26-| icon set "lucide/ionicons" | **`@expo/vector-icons` already installed** — use Feather (grid, users, calendar, bar-chart-2). No new dep. |
27-| 6-tab member layout | Members stay single-screen + day-filter (Phase A). Admin is a **separate `(admin)` route group** with its own real bottom tabs. |
28-
29-Existing booking-error mapping lives in `TrainingContext.tsx` (`bookingErrorMessages` record + `getBookingErrorMessage`). Extend it for `session_closed`.
30-
31----
32-
--
36-2. **Admin provisioning.** First admin is set by a manual `UPDATE public.profiles SET role='admin' WHERE id='…'` in Supabase Studio. **No self-promotion / invite flow in-app.** (Recommended: yes, manual.)
37-3. **Stats source.** Real aggregates over `profiles.created_at` (new members/month, cumulative) and `session_participants` vs `max_participants` (occupancy). Numbers in the mock are illustrative — **replace with real RPC/view output, no hardcoded figures.**
38-4. **Admin write surface.** Use `SECURITY DEFINER` `admin_*` RPCs that check `(select role from profiles where id = auth.uid()) = 'admin'`, rather than broad table-level RLS for admin writes. (Recommended: RPCs — small, auditable surface.)
39-
40----
41-
42-## BACKEND TASKS (Donatello) — these block all admin UI
43-
44:**B-D1 — Migration: `is_open` on sessions + room/duration (per Decision 1)**
45:- New migration `supabase/migrations/<ts>_admin_sessions_columns.sql`:
46-  - `alter table public.sessions add column is_open boolean not null default true;`
47-  - (Decision 1) `add column room text;` `add column duration_min int;`
48-  - Backfill existing rows (`is_open = true`; room/duration null or a default).
49-- DoD: migration applies cleanly locally (`supabase db reset` or `db push` against the linked project in `supabase/.temp/linked-project.json`); no RLS regression for members.
50-
51:**B-D2 — Extend `join_session` RPC to reject closed slots**
52:- Update the `join_session(uuid)` function (see `20260627160000_booking_enforcement.sql`) to `raise exception 'session_closed'` when the target session `is_open = false`, before the capacity/limit checks.
53-- In `TrainingContext.tsx`, add `session_closed: "Termin je trenutno zatvoren za prijave."` to `bookingErrorMessages`.
54-- DoD: a closed session rejects a member join with the mapped Serbian message; open sessions unaffected. Existing booking tests stay green.
55-
56-**B-D3 — Admin RPCs (SECURITY DEFINER, role-checked)**
57-- New migration `<ts>_admin_rpcs.sql` with functions, each guarding `is_admin(auth.uid())`:
58-  - `admin_set_session_open(session_id uuid, open boolean)`
59-  - `admin_upsert_session(... title, day_of_week, time, room, duration_min, max_participants, is_open ...)` (insert when id null, else update)
60-  - `admin_delete_user(target uuid)` (cascade their `session_participants`)
--
134-- Create-session form inserts and the session appears in the member week.
135-- Pregled + Statistika show real aggregates from Supabase.
136-- A non-admin cannot call admin RPCs (verified by test).
137-- `npm run lint` + `npm run test` green; migrations apply cleanly on the linked project.
138-
139----
140-
141-## Suggested build order (for Leonardo)
142:1. Backend first — B-D1 → B-D2 → B-D3 → B-D4 → B-D5 (migrations + RPCs + types/services). These block all UI.
143-2. Routing — B-M1, B-M2 (role redirect + admin shell).
144-3. Screens — B-M3…B-M7, with B-M8 shared components extracted early (BarChart/StatTile needed by Pregled + Statistika).
145-4. Verification — B-R1 gates throughout; B-R2 security test once admin RPCs land; B-R3 cross-role smoke at the end.

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/src/contexts/TrainingContext.tsx
/Users/uros/Documents/Private/Projects/PerunApp/supabase/migrations/20260627170000_admin_sessions_columns.sql
/Users/uros/Documents/Private/Projects/PerunApp/supabase/migrations/20260627170100_join_session_closed.sql
diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 7db328400a3ef2976727dd4de23f876800ef760b..07664d25828c7c5309a0e543ef040962a54fa313
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -8,6 +8,7 @@
 const bookingErrorMessages: Record<string, string> = {
   weekly_limit_reached: "Dostigli ste nedeljni limit.",
   session_full: "Termin je popunjen.",
+  session_closed: "Termin je trenutno zatvoren za prijave.",
   already_joined: "Već ste prijavljeni na ovaj termin.",
   not_authenticated: "Niste prijavljeni.",
   session_not_found: "Termin nije pronađen.",
diff --git a/supabase/migrations/20260627170000_admin_sessions_columns.sql b/supabase/migrations/20260627170000_admin_sessions_columns.sql
new file mode 100644
index 0000000000000000000000000000000000000000..fee9d7ce9f2aa05895aa5927c46c666620836187
--- /dev/null
+++ b/supabase/migrations/20260627170000_admin_sessions_columns.sql
@@ -0,0 +1,13 @@
+begin;
+
+alter table public.sessions
+  add column if not exists is_open boolean not null default true;
+
+-- Room and duration are nullable so existing sessions do not need backfilling.
+alter table public.sessions
+  add column if not exists room text;
+
+alter table public.sessions
+  add column if not exists duration_min integer;
+
+commit;
diff --git a/supabase/migrations/20260627170100_join_session_closed.sql b/supabase/migrations/20260627170100_join_session_closed.sql
new file mode 100644
index 0000000000000000000000000000000000000000..de71a8963c960ec7a24519591bbcebe80696ec9e
--- /dev/null
+++ b/supabase/migrations/20260627170100_join_session_closed.sql
@@ -0,0 +1,84 @@
+begin;
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
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+commit;

diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 7db328400a3ef2976727dd4de23f876800ef760b..07664d25828c7c5309a0e543ef040962a54fa313
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -8,6 +8,7 @@
 const bookingErrorMessages: Record<string, string> = {
   weekly_limit_reached: "Dostigli ste nedeljni limit.",
   session_full: "Termin je popunjen.",
+  session_closed: "Termin je trenutno zatvoren za prijave.",
   already_joined: "Već ste prijavljeni na ovaj termin.",
   not_authenticated: "Niste prijavljeni.",
   session_not_found: "Termin nije pronađen.",
diff --git a/supabase/migrations/20260627170000_admin_sessions_columns.sql b/supabase/migrations/20260627170000_admin_sessions_columns.sql
new file mode 100644
index 0000000000000000000000000000000000000000..fee9d7ce9f2aa05895aa5927c46c666620836187
--- /dev/null
+++ b/supabase/migrations/20260627170000_admin_sessions_columns.sql
@@ -0,0 +1,13 @@
+begin;
+
+alter table public.sessions
+  add column if not exists is_open boolean not null default true;
+
+-- Room and duration are nullable so existing sessions do not need backfilling.
+alter table public.sessions
+  add column if not exists room text;
+
+alter table public.sessions
+  add column if not exists duration_min integer;
+
+commit;
diff --git a/supabase/migrations/20260627170100_join_session_closed.sql b/supabase/migrations/20260627170100_join_session_closed.sql
new file mode 100644
index 0000000000000000000000000000000000000000..de71a8963c960ec7a24519591bbcebe80696ec9e
--- /dev/null
+++ b/supabase/migrations/20260627170100_join_session_closed.sql
@@ -0,0 +1,84 @@
+begin;
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
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+commit;

codex
The two migrations and single mapping entry are in place. I’m now checking the scoped diff and running `npx tsc --noEmit`; I will not apply migrations or modify any other files.
exec
/bin/zsh -lc 'git diff -- src/contexts/TrainingContext.tsx && git diff --no-index -- /dev/null supabase/migrations/20260627170000_admin_sessions_columns.sql; status1=$?; git diff --no-index -- /dev/null supabase/migrations/20260627170100_join_session_closed.sql; status2=$?; npx tsc --noEmit; tsc_status=$?; printf '"'\\nTSC_EXIT=%s\\n' \""'$tsc_status"; test "$tsc_status" -eq 0' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 7db328400a3ef2976727dd4de23f876800ef760b..07664d25828c7c5309a0e543ef040962a54fa313
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -8,6 +8,7 @@
 const bookingErrorMessages: Record<string, string> = {
   weekly_limit_reached: "Dostigli ste nedeljni limit.",
   session_full: "Termin je popunjen.",
+  session_closed: "Termin je trenutno zatvoren za prijave.",
   already_joined: "Već ste prijavljeni na ovaj termin.",
   not_authenticated: "Niste prijavljeni.",
   session_not_found: "Termin nije pronađen.",
diff --git a/supabase/migrations/20260627170000_admin_sessions_columns.sql b/supabase/migrations/20260627170000_admin_sessions_columns.sql
new file mode 100644
index 0000000000000000000000000000000000000000..fee9d7ce9f2aa05895aa5927c46c666620836187
--- /dev/null
+++ b/supabase/migrations/20260627170000_admin_sessions_columns.sql
@@ -0,0 +1,13 @@
+begin;
+
+alter table public.sessions
+  add column if not exists is_open boolean not null default true;
+
+-- Room and duration are nullable so existing sessions do not need backfilling.
+alter table public.sessions
+  add column if not exists room text;
+
+alter table public.sessions
+  add column if not exists duration_min integer;
+
+commit;
diff --git a/supabase/migrations/20260627170100_join_session_closed.sql b/supabase/migrations/20260627170100_join_session_closed.sql
new file mode 100644
index 0000000000000000000000000000000000000000..de71a8963c960ec7a24519591bbcebe80696ec9e
--- /dev/null
+++ b/supabase/migrations/20260627170100_join_session_closed.sql
@@ -0,0 +1,84 @@
+begin;
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
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+commit;

 succeeded in 1591ms:

TSC_EXIT=0

codex
Created:

- [admin_sessions_columns.sql](/Users/uros/Documents/Private/Projects/PerunApp/supabase/migrations/20260627170000_admin_sessions_columns.sql)
- [join_session_closed.sql](/Users/uros/Documents/Private/Projects/PerunApp/supabase/migrations/20260627170100_join_session_closed.sql)

Exact `TrainingContext.tsx` diff:

```diff
+  session_closed: "Termin je trenutno zatvoren za prijave.",
```

`npx tsc --noEmit` exited 0. No migrations applied or commits created.

DONE
diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 7db328400a3ef2976727dd4de23f876800ef760b..07664d25828c7c5309a0e543ef040962a54fa313
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -8,6 +8,7 @@
 const bookingErrorMessages: Record<string, string> = {
   weekly_limit_reached: "Dostigli ste nedeljni limit.",
   session_full: "Termin je popunjen.",
+  session_closed: "Termin je trenutno zatvoren za prijave.",
   already_joined: "Već ste prijavljeni na ovaj termin.",
   not_authenticated: "Niste prijavljeni.",
   session_not_found: "Termin nije pronađen.",
diff --git a/supabase/migrations/20260627170000_admin_sessions_columns.sql b/supabase/migrations/20260627170000_admin_sessions_columns.sql
new file mode 100644
index 0000000000000000000000000000000000000000..fee9d7ce9f2aa05895aa5927c46c666620836187
--- /dev/null
+++ b/supabase/migrations/20260627170000_admin_sessions_columns.sql
@@ -0,0 +1,13 @@
+begin;
+
+alter table public.sessions
+  add column if not exists is_open boolean not null default true;
+
+-- Room and duration are nullable so existing sessions do not need backfilling.
+alter table public.sessions
+  add column if not exists room text;
+
+alter table public.sessions
+  add column if not exists duration_min integer;
+
+commit;
diff --git a/supabase/migrations/20260627170100_join_session_closed.sql b/supabase/migrations/20260627170100_join_session_closed.sql
new file mode 100644
index 0000000000000000000000000000000000000000..de71a8963c960ec7a24519591bbcebe80696ec9e
--- /dev/null
+++ b/supabase/migrations/20260627170100_join_session_closed.sql
@@ -0,0 +1,84 @@
+begin;
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
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+commit;

tokens used
13,860
Created:

- [admin_sessions_columns.sql](/Users/uros/Documents/Private/Projects/PerunApp/supabase/migrations/20260627170000_admin_sessions_columns.sql)
- [join_session_closed.sql](/Users/uros/Documents/Private/Projects/PerunApp/supabase/migrations/20260627170100_join_session_closed.sql)

Exact `TrainingContext.tsx` diff:

```diff
+  session_closed: "Termin je trenutno zatvoren za prijave.",
```

`npx tsc --noEmit` exited 0. No migrations applied or commits created.

DONE
