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
session id: 019f0ada-356e-7cb1-8857-af058040ab7e
--------
user
TASK: B-D5 — Types + admin service layer (+ admin_list_users RPC)

CONTEXT
Goal file: /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/goal-phase-b.md
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Files to consider (read these before changing anything):
- src/types/Profile.ts
- src/types/Training.ts
- src/services/supabase/client.ts
- supabase/migrations/20260627170200_admin_rpcs.sql (existing admin functions)

CODING CONSTRAINTS (non-negotiable)
- Simplicity first: minimum code that solves the problem. No speculative features.
- Surgical changes: touch only files listed above, plus new files explicitly required by the task. Do not refactor adjacent code.
- Match existing style and conventions in this codebase.
- No new dependencies unless the task explicitly requires one.
- If anything is unclear, output a line starting "QUESTION:" and stop without writing code.

DEFINITION OF DONE
1. New migration file supabase/migrations/20260627170400_admin_list_users.sql:
   - Create public.admin_list_users() RETURNS TABLE(id uuid, first_name text, last_name text, email text, role text, max_sessions_per_week integer, enabled boolean)
   - Language plpgsql, SECURITY DEFINER, STABLE, SET search_path = public, pg_temp
   - Guard: if not public.is_admin(auth.uid()) then raise exception 'not_admin' using errcode='42501'; end if;
   - Query: SELECT p.id, p.first_name, p.last_name, u.email::text, p.role, p.max_sessions_per_week::integer, p.enabled FROM public.profiles p JOIN auth.users u ON u.id = p.id ORDER BY p.first_name NULLS LAST, p.last_name NULLS LAST;
   - Permissions: REVOKE ALL FROM public, anon; GRANT EXECUTE TO authenticated;

2. Update src/types/Profile.ts:
   - Add field: role: "user" | "admin";
   - Do NOT add created_at (profiles table has no such column)
   - Keep all existing fields

3. Update src/types/Training.ts:
   - Add fields: is_open: boolean; room: string | null; duration_min: number | null;
   - Keep all existing fields

4. Create src/services/admin/types.ts with exported interfaces:
   - AdminUser { id: string; first_name: string; last_name: string | null; email: string; role: "user" | "admin"; max_sessions_per_week: number; enabled: boolean | null; }
   - MemberSeriesPoint { month: string; total_members: number; new_members: number; }
   - OccupancySummary { avg_pct: number; top_day: string; new_this_month: number; prev_new: number; }
   - UpsertSessionInput { id: string | null; title: string; day_of_week: string; time: string; room: string | null; duration_min: number | null; max_participants: number; is_open: boolean; }
   - UpdateUserPatch { first_name?: string | null; last_name?: string | null; role?: "user" | "admin" | null; max_sessions_per_week?: number | null; }

5. Create src/services/admin/sessions.ts with functions:
   - setSessionOpen(sessionId: string, open: boolean): Promise<void>
     Calls: supabase.rpc("admin_set_session_open", { p_session_id: sessionId, p_open: open })
     Throws on error
   - upsertSession(input: UpsertSessionInput): Promise<string>
     Calls: supabase.rpc("admin_upsert_session", { p_id: input.id, p_title: input.title, p_day_of_week: input.day_of_week, p_time: input.time, p_room: input.room, p_duration_min: input.duration_min, p_max_participants: input.max_participants, p_is_open: input.is_open })
     Returns data as string (the UUID of the inserted/updated session)
     Throws on error

6. Create src/services/admin/users.ts with functions:
   - listUsers(): Promise<AdminUser[]>
     Calls: supabase.rpc("admin_list_users")
     Returns (data ?? []) cast as AdminUser[]
   - updateUser(target: string, patch: UpdateUserPatch): Promise<void>
     Calls: supabase.rpc("admin_update_user", { p_target: target, p_first_name: patch.first_name ?? null, p_last_name: patch.last_name ?? null, p_role: patch.role ?? null, p_max_sessions_per_week: patch.max_sessions_per_week ?? null })
     Throws on error
   - deleteUser(target: string): Promise<void>
     Calls: supabase.rpc("admin_delete_user", { p_target: target })
     Throws on error

7. Create src/services/admin/stats.ts with functions:
   - memberSeries(months: number): Promise<MemberSeriesPoint[]>
     Calls: supabase.rpc("admin_member_series", { p_months: months })
     Returns (data ?? []) cast as MemberSeriesPoint[]
   - occupancySummary(period: string): Promise<OccupancySummary | null>
     Calls: supabase.rpc("admin_occupancy_summary", { p_period: period })
     Data is an array — return (data?.[0] ?? null) cast as OccupancySummary | null

8. Create src/services/admin/index.ts:
   - Re-export all exports from ./types.ts, ./sessions.ts, ./users.ts, ./stats.ts for convenient import

Pattern for each RPC wrapper:
- const { data, error } = await supabase.rpc(name, params);
- if (error) throw error;
- return <explicit cast to interface> (no any, no @ts-ignore)
- If tsc complains about untyped supabase client rpc arg typing, use a single localized "as" cast on params object only

9. Run: npx tsc --noEmit
   Must exit with code 0. Report exact exit code and any remaining errors.

Output: produce all the migration SQL, type changes, and service files. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the specified types, Supabase client, existing admin RPC migration, and goal context first. Then I’ll make only the requested additions and run the exact TypeScript check.
exec
/bin/zsh -lc "sed -n '1,240p' .tmnt/goal-phase-b.md && sed -n '1,200p' src/types/Profile.ts && sed -n '1,200p' src/types/Training.ts && sed -n '1,200p' src/services/supabase/client.ts && sed -n '1,320p' supabase/migrations/20260627170200_admin_rpcs.sql" in /Users/uros/Documents/Private/Projects/PerunApp
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
export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  max_sessions_per_week: number;
};
export type Training = {
  id: string;
  day_of_week: string;
  title: string;
  time: string;
  max_participants: number;
  created_at: string;
  session_participants: {
    user_id: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  }[];
};
import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
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

codex
The requested shapes are unambiguous. The existing Supabase client is untyped, so RPC names and parameter objects should compile without generated database-type casts; I’m checking nearby service import conventions and the current worktree before patching.
exec
/bin/zsh -lc "git status --short && find src/services -maxdepth 2 -type f -print | sort && rg -n \"supabase\\.rpc|from \\\".*\\.ts\\\"|from '\\.*/.*\\.ts'\" src --glob '*.ts' --glob '*.tsx' | head -120 && ls -1 supabase/migrations | tail -20" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
?? .tmnt/runs/B-D5-donny.md
src/services/supabase/client.ts
src/contexts/TrainingContext.tsx:134:    const { error } = await supabase.rpc("join_session", {
20260627155611_harden_rls_profiles_anon.sql
20260627160000_booking_enforcement.sql
20260627161500_default_weekly_limit_zero.sql
20260627170000_admin_sessions_columns.sql
20260627170100_join_session_closed.sql
20260627170200_admin_rpcs.sql
20260627170300_admin_stats.sql

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/src/services/admin/index.ts
/Users/uros/Documents/Private/Projects/PerunApp/src/services/admin/sessions.ts
/Users/uros/Documents/Private/Projects/PerunApp/src/services/admin/stats.ts
/Users/uros/Documents/Private/Projects/PerunApp/src/services/admin/types.ts
/Users/uros/Documents/Private/Projects/PerunApp/src/services/admin/users.ts
/Users/uros/Documents/Private/Projects/PerunApp/src/types/Profile.ts
/Users/uros/Documents/Private/Projects/PerunApp/src/types/Training.ts
/Users/uros/Documents/Private/Projects/PerunApp/supabase/migrations/20260627170400_admin_list_users.sql
diff --git a/src/services/admin/index.ts b/src/services/admin/index.ts
new file mode 100644
index 0000000000000000000000000000000000000000..f22b43bec7d8da8db38e877d44494792eca910e7
--- /dev/null
+++ b/src/services/admin/index.ts
@@ -0,0 +1,4 @@
+export * from "./types";
+export * from "./sessions";
+export * from "./users";
+export * from "./stats";
diff --git a/src/services/admin/sessions.ts b/src/services/admin/sessions.ts
new file mode 100644
index 0000000000000000000000000000000000000000..3b62fe5d7810205d7529aaf078a69c1acddf30ae
--- /dev/null
+++ b/src/services/admin/sessions.ts
@@ -0,0 +1,32 @@
+import { supabase } from "../supabase/client";
+import { UpsertSessionInput } from "./types";
+
+export async function setSessionOpen(
+  sessionId: string,
+  open: boolean,
+): Promise<void> {
+  const { error } = await supabase.rpc("admin_set_session_open", {
+    p_session_id: sessionId,
+    p_open: open,
+  });
+
+  if (error) throw error;
+}
+
+export async function upsertSession(
+  input: UpsertSessionInput,
+): Promise<string> {
+  const { data, error } = await supabase.rpc("admin_upsert_session", {
+    p_id: input.id,
+    p_title: input.title,
+    p_day_of_week: input.day_of_week,
+    p_time: input.time,
+    p_room: input.room,
+    p_duration_min: input.duration_min,
+    p_max_participants: input.max_participants,
+    p_is_open: input.is_open,
+  });
+
+  if (error) throw error;
+  return data as string;
+}
diff --git a/src/services/admin/stats.ts b/src/services/admin/stats.ts
new file mode 100644
index 0000000000000000000000000000000000000000..de193258628753786677f3ebf8bfe7fdc38d4275
--- /dev/null
+++ b/src/services/admin/stats.ts
@@ -0,0 +1,24 @@
+import { supabase } from "../supabase/client";
+import { MemberSeriesPoint, OccupancySummary } from "./types";
+
+export async function memberSeries(
+  months: number,
+): Promise<MemberSeriesPoint[]> {
+  const { data, error } = await supabase.rpc("admin_member_series", {
+    p_months: months,
+  });
+
+  if (error) throw error;
+  return (data ?? []) as MemberSeriesPoint[];
+}
+
+export async function occupancySummary(
+  period: string,
+): Promise<OccupancySummary | null> {
+  const { data, error } = await supabase.rpc("admin_occupancy_summary", {
+    p_period: period,
+  });
+
+  if (error) throw error;
+  return (data?.[0] ?? null) as OccupancySummary | null;
+}
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
new file mode 100644
index 0000000000000000000000000000000000000000..b7fa07b1e84eb8d6b44791808157739e9a873d41
--- /dev/null
+++ b/src/services/admin/types.ts
@@ -0,0 +1,40 @@
+export interface AdminUser {
+  id: string;
+  first_name: string;
+  last_name: string | null;
+  email: string;
+  role: "user" | "admin";
+  max_sessions_per_week: number;
+  enabled: boolean | null;
+}
+
+export interface MemberSeriesPoint {
+  month: string;
+  total_members: number;
+  new_members: number;
+}
+
+export interface OccupancySummary {
+  avg_pct: number;
+  top_day: string;
+  new_this_month: number;
+  prev_new: number;
+}
+
+export interface UpsertSessionInput {
+  id: string | null;
+  title: string;
+  day_of_week: string;
+  time: string;
+  room: string | null;
+  duration_min: number | null;
+  max_participants: number;
+  is_open: boolean;
+}
+
+export interface UpdateUserPatch {
+  first_name?: string | null;
+  last_name?: string | null;
+  role?: "user" | "admin" | null;
+  max_sessions_per_week?: number | null;
+}
diff --git a/src/services/admin/users.ts b/src/services/admin/users.ts
new file mode 100644
index 0000000000000000000000000000000000000000..4a5dadff20840b710e9d7b129fb75bf8f7fc3cf5
--- /dev/null
+++ b/src/services/admin/users.ts
@@ -0,0 +1,32 @@
+import { supabase } from "../supabase/client";
+import { AdminUser, UpdateUserPatch } from "./types";
+
+export async function listUsers(): Promise<AdminUser[]> {
+  const { data, error } = await supabase.rpc("admin_list_users");
+
+  if (error) throw error;
+  return (data ?? []) as AdminUser[];
+}
+
+export async function updateUser(
+  target: string,
+  patch: UpdateUserPatch,
+): Promise<void> {
+  const { error } = await supabase.rpc("admin_update_user", {
+    p_target: target,
+    p_first_name: patch.first_name ?? null,
+    p_last_name: patch.last_name ?? null,
+    p_role: patch.role ?? null,
+    p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
+  });
+
+  if (error) throw error;
+}
+
+export async function deleteUser(target: string): Promise<void> {
+  const { error } = await supabase.rpc("admin_delete_user", {
+    p_target: target,
+  });
+
+  if (error) throw error;
+}
diff --git a/src/types/Profile.ts b/src/types/Profile.ts
index cb76e533f98e65ec3c95d177b4afc6c78fcdd7aa..b6dc4145bf1b922af106f7039a815499600ca5b1
--- a/src/types/Profile.ts
+++ b/src/types/Profile.ts
@@ -3,4 +3,5 @@
   first_name: string;
   last_name: string;
   max_sessions_per_week: number;
+  role: "user" | "admin";
 };
diff --git a/src/types/Training.ts b/src/types/Training.ts
index 03e8707f03d88686d4b973a10fee8b2b7d955c7b..a510afd4b3ee39708888f7c9eb2afe2e991be352
--- a/src/types/Training.ts
+++ b/src/types/Training.ts
@@ -5,6 +5,9 @@
   time: string;
   max_participants: number;
   created_at: string;
+  is_open: boolean;
+  room: string | null;
+  duration_min: number | null;
   session_participants: {
     user_id: string;
     profiles: {
diff --git a/supabase/migrations/20260627170400_admin_list_users.sql b/supabase/migrations/20260627170400_admin_list_users.sql
new file mode 100644
index 0000000000000000000000000000000000000000..01b24be8b20116d3bff4e9aa7e76ce5f422b1974
--- /dev/null
+++ b/supabase/migrations/20260627170400_admin_list_users.sql
@@ -0,0 +1,41 @@
+begin;
+
+create or replace function public.admin_list_users()
+returns table(
+  id uuid,
+  first_name text,
+  last_name text,
+  email text,
+  role text,
+  max_sessions_per_week integer,
+  enabled boolean
+)
+language plpgsql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  return query
+  select
+    p.id,
+    p.first_name,
+    p.last_name,
+    u.email::text,
+    p.role,
+    p.max_sessions_per_week::integer,
+    p.enabled
+  from public.profiles p
+  join auth.users u on u.id = p.id
+  order by p.first_name nulls last, p.last_name nulls last;
+end;
+$$;
+
+revoke all on function public.admin_list_users() from public, anon;
+grant execute on function public.admin_list_users() to authenticated;
+
+commit;

diff --git a/src/services/admin/index.ts b/src/services/admin/index.ts
new file mode 100644
index 0000000000000000000000000000000000000000..f22b43bec7d8da8db38e877d44494792eca910e7
--- /dev/null
+++ b/src/services/admin/index.ts
@@ -0,0 +1,4 @@
+export * from "./types";
+export * from "./sessions";
+export * from "./users";
+export * from "./stats";
diff --git a/src/services/admin/sessions.ts b/src/services/admin/sessions.ts
new file mode 100644
index 0000000000000000000000000000000000000000..3b62fe5d7810205d7529aaf078a69c1acddf30ae
--- /dev/null
+++ b/src/services/admin/sessions.ts
@@ -0,0 +1,32 @@
+import { supabase } from "../supabase/client";
+import { UpsertSessionInput } from "./types";
+
+export async function setSessionOpen(
+  sessionId: string,
+  open: boolean,
+): Promise<void> {
+  const { error } = await supabase.rpc("admin_set_session_open", {
+    p_session_id: sessionId,
+    p_open: open,
+  });
+
+  if (error) throw error;
+}
+
+export async function upsertSession(
+  input: UpsertSessionInput,
+): Promise<string> {
+  const { data, error } = await supabase.rpc("admin_upsert_session", {
+    p_id: input.id,
+    p_title: input.title,
+    p_day_of_week: input.day_of_week,
+    p_time: input.time,
+    p_room: input.room,
+    p_duration_min: input.duration_min,
+    p_max_participants: input.max_participants,
+    p_is_open: input.is_open,
+  });
+
+  if (error) throw error;
+  return data as string;
+}
diff --git a/src/services/admin/stats.ts b/src/services/admin/stats.ts
new file mode 100644
index 0000000000000000000000000000000000000000..de193258628753786677f3ebf8bfe7fdc38d4275
--- /dev/null
+++ b/src/services/admin/stats.ts
@@ -0,0 +1,24 @@
+import { supabase } from "../supabase/client";
+import { MemberSeriesPoint, OccupancySummary } from "./types";
+
+export async function memberSeries(
+  months: number,
+): Promise<MemberSeriesPoint[]> {
+  const { data, error } = await supabase.rpc("admin_member_series", {
+    p_months: months,
+  });
+
+  if (error) throw error;
+  return (data ?? []) as MemberSeriesPoint[];
+}
+
+export async function occupancySummary(
+  period: string,
+): Promise<OccupancySummary | null> {
+  const { data, error } = await supabase.rpc("admin_occupancy_summary", {
+    p_period: period,
+  });
+
+  if (error) throw error;
+  return (data?.[0] ?? null) as OccupancySummary | null;
+}
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
new file mode 100644
index 0000000000000000000000000000000000000000..b7fa07b1e84eb8d6b44791808157739e9a873d41
--- /dev/null
+++ b/src/services/admin/types.ts
@@ -0,0 +1,40 @@
+export interface AdminUser {
+  id: string;
+  first_name: string;
+  last_name: string | null;
+  email: string;
+  role: "user" | "admin";
+  max_sessions_per_week: number;
+  enabled: boolean | null;
+}
+
+export interface MemberSeriesPoint {
+  month: string;
+  total_members: number;
+  new_members: number;
+}
+
+export interface OccupancySummary {
+  avg_pct: number;
+  top_day: string;
+  new_this_month: number;
+  prev_new: number;
+}
+
+export interface UpsertSessionInput {
+  id: string | null;
+  title: string;
+  day_of_week: string;
+  time: string;
+  room: string | null;
+  duration_min: number | null;
+  max_participants: number;
+  is_open: boolean;
+}
+
+export interface UpdateUserPatch {
+  first_name?: string | null;
+  last_name?: string | null;
+  role?: "user" | "admin" | null;
+  max_sessions_per_week?: number | null;
+}
diff --git a/src/services/admin/users.ts b/src/services/admin/users.ts
new file mode 100644
index 0000000000000000000000000000000000000000..4a5dadff20840b710e9d7b129fb75bf8f7fc3cf5
--- /dev/null
+++ b/src/services/admin/users.ts
@@ -0,0 +1,32 @@
+import { supabase } from "../supabase/client";
+import { AdminUser, UpdateUserPatch } from "./types";
+
+export async function listUsers(): Promise<AdminUser[]> {
+  const { data, error } = await supabase.rpc("admin_list_users");
+
+  if (error) throw error;
+  return (data ?? []) as AdminUser[];
+}
+
+export async function updateUser(
+  target: string,
+  patch: UpdateUserPatch,
+): Promise<void> {
+  const { error } = await supabase.rpc("admin_update_user", {
+    p_target: target,
+    p_first_name: patch.first_name ?? null,
+    p_last_name: patch.last_name ?? null,
+    p_role: patch.role ?? null,
+    p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
+  });
+
+  if (error) throw error;
+}
+
+export async function deleteUser(target: string): Promise<void> {
+  const { error } = await supabase.rpc("admin_delete_user", {
+    p_target: target,
+  });
+
+  if (error) throw error;
+}
diff --git a/src/types/Profile.ts b/src/types/Profile.ts
index cb76e533f98e65ec3c95d177b4afc6c78fcdd7aa..b6dc4145bf1b922af106f7039a815499600ca5b1
--- a/src/types/Profile.ts
+++ b/src/types/Profile.ts
@@ -3,4 +3,5 @@
   first_name: string;
   last_name: string;
   max_sessions_per_week: number;
+  role: "user" | "admin";
 };
diff --git a/src/types/Training.ts b/src/types/Training.ts
index 03e8707f03d88686d4b973a10fee8b2b7d955c7b..a510afd4b3ee39708888f7c9eb2afe2e991be352
--- a/src/types/Training.ts
+++ b/src/types/Training.ts
@@ -5,6 +5,9 @@
   time: string;
   max_participants: number;
   created_at: string;
+  is_open: boolean;
+  room: string | null;
+  duration_min: number | null;
   session_participants: {
     user_id: string;
     profiles: {
diff --git a/supabase/migrations/20260627170400_admin_list_users.sql b/supabase/migrations/20260627170400_admin_list_users.sql
new file mode 100644
index 0000000000000000000000000000000000000000..01b24be8b20116d3bff4e9aa7e76ce5f422b1974
--- /dev/null
+++ b/supabase/migrations/20260627170400_admin_list_users.sql
@@ -0,0 +1,41 @@
+begin;
+
+create or replace function public.admin_list_users()
+returns table(
+  id uuid,
+  first_name text,
+  last_name text,
+  email text,
+  role text,
+  max_sessions_per_week integer,
+  enabled boolean
+)
+language plpgsql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  return query
+  select
+    p.id,
+    p.first_name,
+    p.last_name,
+    u.email::text,
+    p.role,
+    p.max_sessions_per_week::integer,
+    p.enabled
+  from public.profiles p
+  join auth.users u on u.id = p.id
+  order by p.first_name nulls last, p.last_name nulls last;
+end;
+$$;
+
+revoke all on function public.admin_list_users() from public, anon;
+grant execute on function public.admin_list_users() to authenticated;
+
+commit;

codex
All requested files are now in place, with the SQL guard and grants matching the existing migration style. I’m running the exact `npx tsc --noEmit` gate now; if it exposes integration issues, I’ll limit fixes to these new or explicitly listed files.
exec
/bin/zsh -lc 'npx tsc --noEmit' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/src/services/admin/index.ts b/src/services/admin/index.ts
new file mode 100644
index 0000000000000000000000000000000000000000..f22b43bec7d8da8db38e877d44494792eca910e7
--- /dev/null
+++ b/src/services/admin/index.ts
@@ -0,0 +1,4 @@
+export * from "./types";
+export * from "./sessions";
+export * from "./users";
+export * from "./stats";
diff --git a/src/services/admin/sessions.ts b/src/services/admin/sessions.ts
new file mode 100644
index 0000000000000000000000000000000000000000..3b62fe5d7810205d7529aaf078a69c1acddf30ae
--- /dev/null
+++ b/src/services/admin/sessions.ts
@@ -0,0 +1,32 @@
+import { supabase } from "../supabase/client";
+import { UpsertSessionInput } from "./types";
+
+export async function setSessionOpen(
+  sessionId: string,
+  open: boolean,
+): Promise<void> {
+  const { error } = await supabase.rpc("admin_set_session_open", {
+    p_session_id: sessionId,
+    p_open: open,
+  });
+
+  if (error) throw error;
+}
+
+export async function upsertSession(
+  input: UpsertSessionInput,
+): Promise<string> {
+  const { data, error } = await supabase.rpc("admin_upsert_session", {
+    p_id: input.id,
+    p_title: input.title,
+    p_day_of_week: input.day_of_week,
+    p_time: input.time,
+    p_room: input.room,
+    p_duration_min: input.duration_min,
+    p_max_participants: input.max_participants,
+    p_is_open: input.is_open,
+  });
+
+  if (error) throw error;
+  return data as string;
+}
diff --git a/src/services/admin/stats.ts b/src/services/admin/stats.ts
new file mode 100644
index 0000000000000000000000000000000000000000..de193258628753786677f3ebf8bfe7fdc38d4275
--- /dev/null
+++ b/src/services/admin/stats.ts
@@ -0,0 +1,24 @@
+import { supabase } from "../supabase/client";
+import { MemberSeriesPoint, OccupancySummary } from "./types";
+
+export async function memberSeries(
+  months: number,
+): Promise<MemberSeriesPoint[]> {
+  const { data, error } = await supabase.rpc("admin_member_series", {
+    p_months: months,
+  });
+
+  if (error) throw error;
+  return (data ?? []) as MemberSeriesPoint[];
+}
+
+export async function occupancySummary(
+  period: string,
+): Promise<OccupancySummary | null> {
+  const { data, error } = await supabase.rpc("admin_occupancy_summary", {
+    p_period: period,
+  });
+
+  if (error) throw error;
+  return (data?.[0] ?? null) as OccupancySummary | null;
+}
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
new file mode 100644
index 0000000000000000000000000000000000000000..b7fa07b1e84eb8d6b44791808157739e9a873d41
--- /dev/null
+++ b/src/services/admin/types.ts
@@ -0,0 +1,40 @@
+export interface AdminUser {
+  id: string;
+  first_name: string;
+  last_name: string | null;
+  email: string;
+  role: "user" | "admin";
+  max_sessions_per_week: number;
+  enabled: boolean | null;
+}
+
+export interface MemberSeriesPoint {
+  month: string;
+  total_members: number;
+  new_members: number;
+}
+
+export interface OccupancySummary {
+  avg_pct: number;
+  top_day: string;
+  new_this_month: number;
+  prev_new: number;
+}
+
+export interface UpsertSessionInput {
+  id: string | null;
+  title: string;
+  day_of_week: string;
+  time: string;
+  room: string | null;
+  duration_min: number | null;
+  max_participants: number;
+  is_open: boolean;
+}
+
+export interface UpdateUserPatch {
+  first_name?: string | null;
+  last_name?: string | null;
+  role?: "user" | "admin" | null;
+  max_sessions_per_week?: number | null;
+}
diff --git a/src/services/admin/users.ts b/src/services/admin/users.ts
new file mode 100644
index 0000000000000000000000000000000000000000..4a5dadff20840b710e9d7b129fb75bf8f7fc3cf5
--- /dev/null
+++ b/src/services/admin/users.ts
@@ -0,0 +1,32 @@
+import { supabase } from "../supabase/client";
+import { AdminUser, UpdateUserPatch } from "./types";
+
+export async function listUsers(): Promise<AdminUser[]> {
+  const { data, error } = await supabase.rpc("admin_list_users");
+
+  if (error) throw error;
+  return (data ?? []) as AdminUser[];
+}
+
+export async function updateUser(
+  target: string,
+  patch: UpdateUserPatch,
+): Promise<void> {
+  const { error } = await supabase.rpc("admin_update_user", {
+    p_target: target,
+    p_first_name: patch.first_name ?? null,
+    p_last_name: patch.last_name ?? null,
+    p_role: patch.role ?? null,
+    p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
+  });
+
+  if (error) throw error;
+}
+
+export async function deleteUser(target: string): Promise<void> {
+  const { error } = await supabase.rpc("admin_delete_user", {
+    p_target: target,
+  });
+
+  if (error) throw error;
+}
diff --git a/src/types/Profile.ts b/src/types/Profile.ts
index cb76e533f98e65ec3c95d177b4afc6c78fcdd7aa..b6dc4145bf1b922af106f7039a815499600ca5b1
--- a/src/types/Profile.ts
+++ b/src/types/Profile.ts
@@ -3,4 +3,5 @@
   first_name: string;
   last_name: string;
   max_sessions_per_week: number;
+  role: "user" | "admin";
 };
diff --git a/src/types/Training.ts b/src/types/Training.ts
index 03e8707f03d88686d4b973a10fee8b2b7d955c7b..a510afd4b3ee39708888f7c9eb2afe2e991be352
--- a/src/types/Training.ts
+++ b/src/types/Training.ts
@@ -5,6 +5,9 @@
   time: string;
   max_participants: number;
   created_at: string;
+  is_open: boolean;
+  room: string | null;
+  duration_min: number | null;
   session_participants: {
     user_id: string;
     profiles: {
diff --git a/supabase/migrations/20260627170400_admin_list_users.sql b/supabase/migrations/20260627170400_admin_list_users.sql
new file mode 100644
index 0000000000000000000000000000000000000000..01b24be8b20116d3bff4e9aa7e76ce5f422b1974
--- /dev/null
+++ b/supabase/migrations/20260627170400_admin_list_users.sql
@@ -0,0 +1,41 @@
+begin;
+
+create or replace function public.admin_list_users()
+returns table(
+  id uuid,
+  first_name text,
+  last_name text,
+  email text,
+  role text,
+  max_sessions_per_week integer,
+  enabled boolean
+)
+language plpgsql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  return query
+  select
+    p.id,
+    p.first_name,
+    p.last_name,
+    u.email::text,
+    p.role,
+    p.max_sessions_per_week::integer,
+    p.enabled
+  from public.profiles p
+  join auth.users u on u.id = p.id
+  order by p.first_name nulls last, p.last_name nulls last;
+end;
+$$;
+
+revoke all on function public.admin_list_users() from public, anon;
+grant execute on function public.admin_list_users() to authenticated;
+
+commit;

 succeeded in 1783ms:
codex
TypeScript passed with exit code 0 and no errors. I’m doing a final scoped diff review to confirm no unrelated files were changed and every requested field/RPC argument is present exactly once.
exec
/bin/zsh -lc 'git status --short && git diff -- src/types/Profile.ts src/types/Training.ts supabase/migrations/20260627170400_admin_list_users.sql src/services/admin/types.ts src/services/admin/sessions.ts src/services/admin/users.ts src/services/admin/stats.ts src/services/admin/index.ts && for f in supabase/migrations/20260627170400_admin_list_users.sql src/services/admin/types.ts src/services/admin/sessions.ts src/services/admin/users.ts src/services/admin/stats.ts src/services/admin/index.ts; do git diff --no-index -- /dev/null "$f" || true; done' in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
 M src/types/Profile.ts
 M src/types/Training.ts
?? .tmnt/runs/B-D5-donny.md
?? src/services/admin/
?? supabase/migrations/20260627170400_admin_list_users.sql
diff --git a/src/types/Profile.ts b/src/types/Profile.ts
index cb76e53..b6dc414 100644
--- a/src/types/Profile.ts
+++ b/src/types/Profile.ts
@@ -3,4 +3,5 @@ export type Profile = {
   first_name: string;
   last_name: string;
   max_sessions_per_week: number;
+  role: "user" | "admin";
 };
diff --git a/src/types/Training.ts b/src/types/Training.ts
index 03e8707..a510afd 100644
--- a/src/types/Training.ts
+++ b/src/types/Training.ts
@@ -5,6 +5,9 @@ export type Training = {
   time: string;
   max_participants: number;
   created_at: string;
+  is_open: boolean;
+  room: string | null;
+  duration_min: number | null;
   session_participants: {
     user_id: string;
     profiles: {
diff --git a/supabase/migrations/20260627170400_admin_list_users.sql b/supabase/migrations/20260627170400_admin_list_users.sql
new file mode 100644
index 0000000..01b24be
--- /dev/null
+++ b/supabase/migrations/20260627170400_admin_list_users.sql
@@ -0,0 +1,41 @@
+begin;
+
+create or replace function public.admin_list_users()
+returns table(
+  id uuid,
+  first_name text,
+  last_name text,
+  email text,
+  role text,
+  max_sessions_per_week integer,
+  enabled boolean
+)
+language plpgsql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  return query
+  select
+    p.id,
+    p.first_name,
+    p.last_name,
+    u.email::text,
+    p.role,
+    p.max_sessions_per_week::integer,
+    p.enabled
+  from public.profiles p
+  join auth.users u on u.id = p.id
+  order by p.first_name nulls last, p.last_name nulls last;
+end;
+$$;
+
+revoke all on function public.admin_list_users() from public, anon;
+grant execute on function public.admin_list_users() to authenticated;
+
+commit;
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
new file mode 100644
index 0000000..b7fa07b
--- /dev/null
+++ b/src/services/admin/types.ts
@@ -0,0 +1,40 @@
+export interface AdminUser {
+  id: string;
+  first_name: string;
+  last_name: string | null;
+  email: string;
+  role: "user" | "admin";
+  max_sessions_per_week: number;
+  enabled: boolean | null;
+}
+
+export interface MemberSeriesPoint {
+  month: string;
+  total_members: number;
+  new_members: number;
+}
+
+export interface OccupancySummary {
+  avg_pct: number;
+  top_day: string;
+  new_this_month: number;
+  prev_new: number;
+}
+
+export interface UpsertSessionInput {
+  id: string | null;
+  title: string;
+  day_of_week: string;
+  time: string;
+  room: string | null;
+  duration_min: number | null;
+  max_participants: number;
+  is_open: boolean;
+}
+
+export interface UpdateUserPatch {
+  first_name?: string | null;
+  last_name?: string | null;
+  role?: "user" | "admin" | null;
+  max_sessions_per_week?: number | null;
+}
diff --git a/src/services/admin/sessions.ts b/src/services/admin/sessions.ts
new file mode 100644
index 0000000..3b62fe5
--- /dev/null
+++ b/src/services/admin/sessions.ts
@@ -0,0 +1,32 @@
+import { supabase } from "../supabase/client";
+import { UpsertSessionInput } from "./types";
+
+export async function setSessionOpen(
+  sessionId: string,
+  open: boolean,
+): Promise<void> {
+  const { error } = await supabase.rpc("admin_set_session_open", {
+    p_session_id: sessionId,
+    p_open: open,
+  });
+
+  if (error) throw error;
+}
+
+export async function upsertSession(
+  input: UpsertSessionInput,
+): Promise<string> {
+  const { data, error } = await supabase.rpc("admin_upsert_session", {
+    p_id: input.id,
+    p_title: input.title,
+    p_day_of_week: input.day_of_week,
+    p_time: input.time,
+    p_room: input.room,
+    p_duration_min: input.duration_min,
+    p_max_participants: input.max_participants,
+    p_is_open: input.is_open,
+  });
+
+  if (error) throw error;
+  return data as string;
+}
diff --git a/src/services/admin/users.ts b/src/services/admin/users.ts
new file mode 100644
index 0000000..4a5dadf
--- /dev/null
+++ b/src/services/admin/users.ts
@@ -0,0 +1,32 @@
+import { supabase } from "../supabase/client";
+import { AdminUser, UpdateUserPatch } from "./types";
+
+export async function listUsers(): Promise<AdminUser[]> {
+  const { data, error } = await supabase.rpc("admin_list_users");
+
+  if (error) throw error;
+  return (data ?? []) as AdminUser[];
+}
+
+export async function updateUser(
+  target: string,
+  patch: UpdateUserPatch,
+): Promise<void> {
+  const { error } = await supabase.rpc("admin_update_user", {
+    p_target: target,
+    p_first_name: patch.first_name ?? null,
+    p_last_name: patch.last_name ?? null,
+    p_role: patch.role ?? null,
+    p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
+  });
+
+  if (error) throw error;
+}
+
+export async function deleteUser(target: string): Promise<void> {
+  const { error } = await supabase.rpc("admin_delete_user", {
+    p_target: target,
+  });
+
+  if (error) throw error;
+}
diff --git a/src/services/admin/stats.ts b/src/services/admin/stats.ts
new file mode 100644
index 0000000..de19325
--- /dev/null
+++ b/src/services/admin/stats.ts
@@ -0,0 +1,24 @@
+import { supabase } from "../supabase/client";
+import { MemberSeriesPoint, OccupancySummary } from "./types";
+
+export async function memberSeries(
+  months: number,
+): Promise<MemberSeriesPoint[]> {
+  const { data, error } = await supabase.rpc("admin_member_series", {
+    p_months: months,
+  });
+
+  if (error) throw error;
+  return (data ?? []) as MemberSeriesPoint[];
+}
+
+export async function occupancySummary(
+  period: string,
+): Promise<OccupancySummary | null> {
+  const { data, error } = await supabase.rpc("admin_occupancy_summary", {
+    p_period: period,
+  });
+
+  if (error) throw error;
+  return (data?.[0] ?? null) as OccupancySummary | null;
+}
diff --git a/src/services/admin/index.ts b/src/services/admin/index.ts
new file mode 100644
index 0000000..f22b43b
--- /dev/null
+++ b/src/services/admin/index.ts
@@ -0,0 +1,4 @@
+export * from "./types";
+export * from "./sessions";
+export * from "./users";
+export * from "./stats";

diff --git a/src/services/admin/index.ts b/src/services/admin/index.ts
new file mode 100644
index 0000000000000000000000000000000000000000..f22b43bec7d8da8db38e877d44494792eca910e7
--- /dev/null
+++ b/src/services/admin/index.ts
@@ -0,0 +1,4 @@
+export * from "./types";
+export * from "./sessions";
+export * from "./users";
+export * from "./stats";
diff --git a/src/services/admin/sessions.ts b/src/services/admin/sessions.ts
new file mode 100644
index 0000000000000000000000000000000000000000..3b62fe5d7810205d7529aaf078a69c1acddf30ae
--- /dev/null
+++ b/src/services/admin/sessions.ts
@@ -0,0 +1,32 @@
+import { supabase } from "../supabase/client";
+import { UpsertSessionInput } from "./types";
+
+export async function setSessionOpen(
+  sessionId: string,
+  open: boolean,
+): Promise<void> {
+  const { error } = await supabase.rpc("admin_set_session_open", {
+    p_session_id: sessionId,
+    p_open: open,
+  });
+
+  if (error) throw error;
+}
+
+export async function upsertSession(
+  input: UpsertSessionInput,
+): Promise<string> {
+  const { data, error } = await supabase.rpc("admin_upsert_session", {
+    p_id: input.id,
+    p_title: input.title,
+    p_day_of_week: input.day_of_week,
+    p_time: input.time,
+    p_room: input.room,
+    p_duration_min: input.duration_min,
+    p_max_participants: input.max_participants,
+    p_is_open: input.is_open,
+  });
+
+  if (error) throw error;
+  return data as string;
+}
diff --git a/src/services/admin/stats.ts b/src/services/admin/stats.ts
new file mode 100644
index 0000000000000000000000000000000000000000..de193258628753786677f3ebf8bfe7fdc38d4275
--- /dev/null
+++ b/src/services/admin/stats.ts
@@ -0,0 +1,24 @@
+import { supabase } from "../supabase/client";
+import { MemberSeriesPoint, OccupancySummary } from "./types";
+
+export async function memberSeries(
+  months: number,
+): Promise<MemberSeriesPoint[]> {
+  const { data, error } = await supabase.rpc("admin_member_series", {
+    p_months: months,
+  });
+
+  if (error) throw error;
+  return (data ?? []) as MemberSeriesPoint[];
+}
+
+export async function occupancySummary(
+  period: string,
+): Promise<OccupancySummary | null> {
+  const { data, error } = await supabase.rpc("admin_occupancy_summary", {
+    p_period: period,
+  });
+
+  if (error) throw error;
+  return (data?.[0] ?? null) as OccupancySummary | null;
+}
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
new file mode 100644
index 0000000000000000000000000000000000000000..b7fa07b1e84eb8d6b44791808157739e9a873d41
--- /dev/null
+++ b/src/services/admin/types.ts
@@ -0,0 +1,40 @@
+export interface AdminUser {
+  id: string;
+  first_name: string;
+  last_name: string | null;
+  email: string;
+  role: "user" | "admin";
+  max_sessions_per_week: number;
+  enabled: boolean | null;
+}
+
+export interface MemberSeriesPoint {
+  month: string;
+  total_members: number;
+  new_members: number;
+}
+
+export interface OccupancySummary {
+  avg_pct: number;
+  top_day: string;
+  new_this_month: number;
+  prev_new: number;
+}
+
+export interface UpsertSessionInput {
+  id: string | null;
+  title: string;
+  day_of_week: string;
+  time: string;
+  room: string | null;
+  duration_min: number | null;
+  max_participants: number;
+  is_open: boolean;
+}
+
+export interface UpdateUserPatch {
+  first_name?: string | null;
+  last_name?: string | null;
+  role?: "user" | "admin" | null;
+  max_sessions_per_week?: number | null;
+}
diff --git a/src/services/admin/users.ts b/src/services/admin/users.ts
new file mode 100644
index 0000000000000000000000000000000000000000..4a5dadff20840b710e9d7b129fb75bf8f7fc3cf5
--- /dev/null
+++ b/src/services/admin/users.ts
@@ -0,0 +1,32 @@
+import { supabase } from "../supabase/client";
+import { AdminUser, UpdateUserPatch } from "./types";
+
+export async function listUsers(): Promise<AdminUser[]> {
+  const { data, error } = await supabase.rpc("admin_list_users");
+
+  if (error) throw error;
+  return (data ?? []) as AdminUser[];
+}
+
+export async function updateUser(
+  target: string,
+  patch: UpdateUserPatch,
+): Promise<void> {
+  const { error } = await supabase.rpc("admin_update_user", {
+    p_target: target,
+    p_first_name: patch.first_name ?? null,
+    p_last_name: patch.last_name ?? null,
+    p_role: patch.role ?? null,
+    p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
+  });
+
+  if (error) throw error;
+}
+
+export async function deleteUser(target: string): Promise<void> {
+  const { error } = await supabase.rpc("admin_delete_user", {
+    p_target: target,
+  });
+
+  if (error) throw error;
+}
diff --git a/src/types/Profile.ts b/src/types/Profile.ts
index cb76e533f98e65ec3c95d177b4afc6c78fcdd7aa..b6dc4145bf1b922af106f7039a815499600ca5b1
--- a/src/types/Profile.ts
+++ b/src/types/Profile.ts
@@ -3,4 +3,5 @@
   first_name: string;
   last_name: string;
   max_sessions_per_week: number;
+  role: "user" | "admin";
 };
diff --git a/src/types/Training.ts b/src/types/Training.ts
index 03e8707f03d88686d4b973a10fee8b2b7d955c7b..a510afd4b3ee39708888f7c9eb2afe2e991be352
--- a/src/types/Training.ts
+++ b/src/types/Training.ts
@@ -5,6 +5,9 @@
   time: string;
   max_participants: number;
   created_at: string;
+  is_open: boolean;
+  room: string | null;
+  duration_min: number | null;
   session_participants: {
     user_id: string;
     profiles: {
diff --git a/supabase/migrations/20260627170400_admin_list_users.sql b/supabase/migrations/20260627170400_admin_list_users.sql
new file mode 100644
index 0000000000000000000000000000000000000000..01b24be8b20116d3bff4e9aa7e76ce5f422b1974
--- /dev/null
+++ b/supabase/migrations/20260627170400_admin_list_users.sql
@@ -0,0 +1,41 @@
+begin;
+
+create or replace function public.admin_list_users()
+returns table(
+  id uuid,
+  first_name text,
+  last_name text,
+  email text,
+  role text,
+  max_sessions_per_week integer,
+  enabled boolean
+)
+language plpgsql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  return query
+  select
+    p.id,
+    p.first_name,
+    p.last_name,
+    u.email::text,
+    p.role,
+    p.max_sessions_per_week::integer,
+    p.enabled
+  from public.profiles p
+  join auth.users u on u.id = p.id
+  order by p.first_name nulls last, p.last_name nulls last;
+end;
+$$;
+
+revoke all on function public.admin_list_users() from public, anon;
+grant execute on function public.admin_list_users() to authenticated;
+
+commit;

codex
Implemented B-D5:

- Added `admin_list_users()` migration with admin guard and permissions.
- Updated `Profile` and `Training` types.
- Added typed admin services for sessions, users, and stats.
- Added admin barrel exports.
- `npx tsc --noEmit` exit code: `0`
- Remaining errors: none.

DONE
diff --git a/src/services/admin/index.ts b/src/services/admin/index.ts
new file mode 100644
index 0000000000000000000000000000000000000000..f22b43bec7d8da8db38e877d44494792eca910e7
--- /dev/null
+++ b/src/services/admin/index.ts
@@ -0,0 +1,4 @@
+export * from "./types";
+export * from "./sessions";
+export * from "./users";
+export * from "./stats";
diff --git a/src/services/admin/sessions.ts b/src/services/admin/sessions.ts
new file mode 100644
index 0000000000000000000000000000000000000000..3b62fe5d7810205d7529aaf078a69c1acddf30ae
--- /dev/null
+++ b/src/services/admin/sessions.ts
@@ -0,0 +1,32 @@
+import { supabase } from "../supabase/client";
+import { UpsertSessionInput } from "./types";
+
+export async function setSessionOpen(
+  sessionId: string,
+  open: boolean,
+): Promise<void> {
+  const { error } = await supabase.rpc("admin_set_session_open", {
+    p_session_id: sessionId,
+    p_open: open,
+  });
+
+  if (error) throw error;
+}
+
+export async function upsertSession(
+  input: UpsertSessionInput,
+): Promise<string> {
+  const { data, error } = await supabase.rpc("admin_upsert_session", {
+    p_id: input.id,
+    p_title: input.title,
+    p_day_of_week: input.day_of_week,
+    p_time: input.time,
+    p_room: input.room,
+    p_duration_min: input.duration_min,
+    p_max_participants: input.max_participants,
+    p_is_open: input.is_open,
+  });
+
+  if (error) throw error;
+  return data as string;
+}
diff --git a/src/services/admin/stats.ts b/src/services/admin/stats.ts
new file mode 100644
index 0000000000000000000000000000000000000000..de193258628753786677f3ebf8bfe7fdc38d4275
--- /dev/null
+++ b/src/services/admin/stats.ts
@@ -0,0 +1,24 @@
+import { supabase } from "../supabase/client";
+import { MemberSeriesPoint, OccupancySummary } from "./types";
+
+export async function memberSeries(
+  months: number,
+): Promise<MemberSeriesPoint[]> {
+  const { data, error } = await supabase.rpc("admin_member_series", {
+    p_months: months,
+  });
+
+  if (error) throw error;
+  return (data ?? []) as MemberSeriesPoint[];
+}
+
+export async function occupancySummary(
+  period: string,
+): Promise<OccupancySummary | null> {
+  const { data, error } = await supabase.rpc("admin_occupancy_summary", {
+    p_period: period,
+  });
+
+  if (error) throw error;
+  return (data?.[0] ?? null) as OccupancySummary | null;
+}
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
new file mode 100644
index 0000000000000000000000000000000000000000..b7fa07b1e84eb8d6b44791808157739e9a873d41
--- /dev/null
+++ b/src/services/admin/types.ts
@@ -0,0 +1,40 @@
+export interface AdminUser {
+  id: string;
+  first_name: string;
+  last_name: string | null;
+  email: string;
+  role: "user" | "admin";
+  max_sessions_per_week: number;
+  enabled: boolean | null;
+}
+
+export interface MemberSeriesPoint {
+  month: string;
+  total_members: number;
+  new_members: number;
+}
+
+export interface OccupancySummary {
+  avg_pct: number;
+  top_day: string;
+  new_this_month: number;
+  prev_new: number;
+}
+
+export interface UpsertSessionInput {
+  id: string | null;
+  title: string;
+  day_of_week: string;
+  time: string;
+  room: string | null;
+  duration_min: number | null;
+  max_participants: number;
+  is_open: boolean;
+}
+
+export interface UpdateUserPatch {
+  first_name?: string | null;
+  last_name?: string | null;
+  role?: "user" | "admin" | null;
+  max_sessions_per_week?: number | null;
+}
diff --git a/src/services/admin/users.ts b/src/services/admin/users.ts
new file mode 100644
index 0000000000000000000000000000000000000000..4a5dadff20840b710e9d7b129fb75bf8f7fc3cf5
--- /dev/null
+++ b/src/services/admin/users.ts
@@ -0,0 +1,32 @@
+import { supabase } from "../supabase/client";
+import { AdminUser, UpdateUserPatch } from "./types";
+
+export async function listUsers(): Promise<AdminUser[]> {
+  const { data, error } = await supabase.rpc("admin_list_users");
+
+  if (error) throw error;
+  return (data ?? []) as AdminUser[];
+}
+
+export async function updateUser(
+  target: string,
+  patch: UpdateUserPatch,
+): Promise<void> {
+  const { error } = await supabase.rpc("admin_update_user", {
+    p_target: target,
+    p_first_name: patch.first_name ?? null,
+    p_last_name: patch.last_name ?? null,
+    p_role: patch.role ?? null,
+    p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
+  });
+
+  if (error) throw error;
+}
+
+export async function deleteUser(target: string): Promise<void> {
+  const { error } = await supabase.rpc("admin_delete_user", {
+    p_target: target,
+  });
+
+  if (error) throw error;
+}
diff --git a/src/types/Profile.ts b/src/types/Profile.ts
index cb76e533f98e65ec3c95d177b4afc6c78fcdd7aa..b6dc4145bf1b922af106f7039a815499600ca5b1
--- a/src/types/Profile.ts
+++ b/src/types/Profile.ts
@@ -3,4 +3,5 @@
   first_name: string;
   last_name: string;
   max_sessions_per_week: number;
+  role: "user" | "admin";
 };
diff --git a/src/types/Training.ts b/src/types/Training.ts
index 03e8707f03d88686d4b973a10fee8b2b7d955c7b..a510afd4b3ee39708888f7c9eb2afe2e991be352
--- a/src/types/Training.ts
+++ b/src/types/Training.ts
@@ -5,6 +5,9 @@
   time: string;
   max_participants: number;
   created_at: string;
+  is_open: boolean;
+  room: string | null;
+  duration_min: number | null;
   session_participants: {
     user_id: string;
     profiles: {
diff --git a/supabase/migrations/20260627170400_admin_list_users.sql b/supabase/migrations/20260627170400_admin_list_users.sql
new file mode 100644
index 0000000000000000000000000000000000000000..01b24be8b20116d3bff4e9aa7e76ce5f422b1974
--- /dev/null
+++ b/supabase/migrations/20260627170400_admin_list_users.sql
@@ -0,0 +1,41 @@
+begin;
+
+create or replace function public.admin_list_users()
+returns table(
+  id uuid,
+  first_name text,
+  last_name text,
+  email text,
+  role text,
+  max_sessions_per_week integer,
+  enabled boolean
+)
+language plpgsql
+security definer
+stable
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  return query
+  select
+    p.id,
+    p.first_name,
+    p.last_name,
+    u.email::text,
+    p.role,
+    p.max_sessions_per_week::integer,
+    p.enabled
+  from public.profiles p
+  join auth.users u on u.id = p.id
+  order by p.first_name nulls last, p.last_name nulls last;
+end;
+$$;
+
+revoke all on function public.admin_list_users() from public, anon;
+grant execute on function public.admin_list_users() to authenticated;
+
+commit;

tokens used
16,490
Implemented B-D5:

- Added `admin_list_users()` migration with admin guard and permissions.
- Updated `Profile` and `Training` types.
- Added typed admin services for sessions, users, and stats.
- Added admin barrel exports.
- `npx tsc --noEmit` exit code: `0`
- Remaining errors: none.

DONE
