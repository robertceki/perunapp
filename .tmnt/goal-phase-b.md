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
