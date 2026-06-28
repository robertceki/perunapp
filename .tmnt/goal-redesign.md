# Goal: Perun Visual Redesign — phased plan (PLAN ONLY)

**Date:** 2026-06-27
**Splinter session:** 2
**Target project:** /Users/uros/Documents/Private/Projects/PerunApp
**Supersedes goal.md?** No. The audit-remediation plan in `goal.md` is a
separate workstream that is already mostly delivered (see `.tmnt/runs/T*`).
This goal is the next thing: the full visual redesign.

**Status:** PLAN ONLY. This brief decomposes the work and proposes a build
sequence. No code work begins until Uros explicitly approves a phase.

---

## What we're building

A full visual redesign of the Perun Trening Centar mobile app (React Native +
Expo, expo-router, TypeScript, Supabase) using the high-fidelity handoff at
`/Users/uros/Desktop/design_handoff_perun_redesign/`. Two distinct bodies of
work share one design system:

- **Phase A — Member redesign (4 screens):** Login, Home (day schedule +
  booking), TrainingCard states & edge cases, Profile (new). Pure UI work on
  top of the existing data layer.
- **Phase B — Admin app (5 screens):** Pregled / Korisnici / Treninzi /
  Novi-trening / Statistika, plus a shared admin tab bar and role-based
  routing after login. Materially heavier: requires schema, RPC, and RLS
  changes.

Brand: cream paper background, burgundy primary, gold metallic accent, Perun
emblem + runic wordmark, Bricolage Grotesque (display) + Hanken Grotesk (UI),
Serbian Latin-Extended copy.

## Why

The app today is a bare functional skeleton. Members open it, see flat grey
cards, and the brand the gym paid for never appears. The redesign turns the
booking flow into the gym's brand presence and unlocks the admin surface
needed to operate the gym (open/close slots, manage users, see attendance
trends) without going through the database.

## Source of truth

- Canonical spec: `/Users/uros/Desktop/design_handoff_perun_redesign/README.md`
  — when README and HTML disagree, **README wins**.
- Visual reference: `/Users/uros/Desktop/design_handoff_perun_redesign/Perun App.dc.html`
  (open in a browser; reference only, not production code).
- Brand PNGs: `/Users/uros/Desktop/design_handoff_perun_redesign/assets/*.png`
  — copy into `assets/images/` of the app.
- Existing codebase audit: `/Users/uros/Documents/Private/Projects/PerunApp/AUDIT.md`
  — Phase 1 audit fixes (S1/S3/S4) are already shipped via migrations
  (`supabase/migrations/20260627*.sql`). Audit items A1 (broken
  `(tabs)/_layout` not rendering `<Slot>`) and A6 (TreiningCard rename) are
  still open and intersect this work; A6 is already done in the repo (file
  is `TrainingCard.tsx`).

## Reality check vs the handoff README

The README was written against an assumed file map that no longer matches the
real repo. Plan against the real repo, not the README's paths:

| README assumption | Actual repo |
|---|---|
| `app/(tabs)/monday.tsx … saturday.tsx` per-day routes | No per-day files. Day selection is a single screen with `selectedDay` state in `app/(tabs)/_layout.tsx`. |
| Component file `src/components/TreiningCard.tsx` (typo) | Already renamed to `src/components/TrainingCard.tsx`. |
| Booking guard at `src/services/trainings/guards.ts` | Folder does not exist. Booking enforcement is now a Postgres `join_session` RPC (see migration `20260627160000_booking_enforcement.sql`). Admin `is_open` check must extend that RPC. |
| Add `role` to profiles | `role` column already exists (`handle_new_user` defaults `'user'`). Role-based routing branch in the app is the missing piece. |
| "Use your icon set (e.g. lucide/ionicons)" | `@expo/vector-icons` is **already installed** — no new dep needed. |
| Six-tab layout missing | `(tabs)/_layout.tsx` never renders `<Slot>`/`<Tabs>` (audit item A1). Redesign work resolves this — recommendation: keep single-screen + day-filter for members; admin shell is a separate `(admin)` group with its own real bottom tabs. |

---

## Phase A — MEMBER REDESIGN (lower risk, no schema change)

### Scope
4 screens: Login, Home, Card states & edge cases (all live inside the
TrainingCard), Profile (new route).

### Foundation tasks (block everything else)
1. **Design tokens** — replace `src/constants/Colors.ts` with the README token
   table (paper / surface / ink / burgundy / gold / sage families + shadows
   + spacing + radii). Export as typed constants, not the current
   light/dark shape.
2. **Fonts** — load Bricolage Grotesque (700, 800) and Hanken Grotesk
   (400/500/600/700/800) via `expo-font` (Google Fonts package or local
   `assets/fonts/`). Wire into `app/_layout.tsx`; hold splash via
   `expo-splash-screen` until `useFonts` is ready.
3. **Brand assets** — copy 8 PNGs from
   `/Users/uros/Desktop/design_handoff_perun_redesign/assets/` into
   `assets/images/` and reference via `require`.
4. **Safe-area + status bar** — switch chrome to `SafeAreaView` /
   `react-native-safe-area-context`; the README explicitly says use OS
   status bar (no fake 9:41).

### Screen tasks
5. **Login (`app/login.tsx`)** — full rewrite of the screen body: emblem
   hero, wordmark, tagline, EMAIL/LOZINKA fields with gold focus ring,
   "Zaboravljena lozinka?" link (no-op stub for now), primary burgundy
   "Prijavi se" button, footer "Nemaš nalog? Pridruži se". Reuse
   `useAuth().login`; keep existing error & loading state. Password-visibility
   toggle = new local state.
6. **Header (`src/components/Header.tsx`)** — restyle: emblem 30×30 +
   "PERUN" wordmark (burgundy) + circular avatar with user initials from
   `profile.first_name`/`last_name`. Avatar tap → navigate to Profile.
7. **DayFilter (`src/components/DayFilter.tsx`)** — restyle to 6-up week
   selector with Serbian abbrevs (PON UTO SRE ČET PET SUB), Bricolage date
   number stacked under the abbrev, burgundy pill for active. Decision: the
   "date number" needs a Monday-anchored "current week" (Mon–Sat) — pick a
   deterministic week-start helper. Mark `(inferred)`: current ISO week,
   Mon as day 1, locale Europe/Belgrade.
8. **AlertBar (`src/components/AlertBar.tsx`)** — restyle as the weekly
   progress card (normal state) AND the "Nedeljni limit dostignut" alert
   variant. Drive from existing `bookedCount` / `reachedLimit` /
   `profile.max_sessions_per_week`. Gold-gradient progress fill.
9. **TrainingCard (`src/components/TrainingCard.tsx`)** — full restyle, all
   states:
   - Available / canJoin (burgundy CTA "Prijavi se")
   - Booked / mine (surfaceWarm bg, goldBorder, 4px gold accent bar,
     "Prijavljen" chip, "Odjavi se" link)
   - Full (muted bg, "Popunjeno" chip + disabled button)
   - Reached weekly limit & not booked (dashed disabled button)
   - Avatar stack with rotated tints (sage/gold/burgundy), "TI" first if
     the user is booked, "+N" overflow.
   - Status chip "još N mesta" when spots remain.
10. **Empty-day card** — new small component used by Home when
    `getTrainingsByDay(selectedDay).length === 0`: dashed border, faint
    emblem watermark, "Nema više termina".
11. **Home tab shell (`app/(tabs)/_layout.tsx` + `index.tsx`)** —
    restyle/restructure. Resolves audit A1 by keeping the single-screen
    approach (audit recommendation a): move all chrome into a single screen
    rendering `Header` + greeting + week selector + weekly progress card +
    section header + `FlatList<TrainingCard>` + empty state. Confirm
    whether the dead per-day route files actually exist (prompt says they
    do not; if they do, delete them).
12. **Profile screen (NEW)** — new route. Two options:
    - **Option 1 (recommended):** stack/modal route at `app/profile.tsx`,
      navigated from the Header avatar — matches the design's back-chevron
      nav bar.
    - **Option 2:** `app/(tabs)/profile.tsx` as a second tab (would require
      moving to real `<Tabs>` rendering in the tab layout).
    Content: identity block (large avatar + name + ČLAN OD chip), 2 stat
    tiles (`48 treninga ukupno` / `5 nedelja u nizu` — placeholder values
    until Phase B stats land; mark `(inferred)`), weekly-limit stepper card
    that persists `profile.max_sessions_per_week`, bookings list for the
    week, outline "Odjavi se" button using existing `useAuth().logout`.
13. **Verification** — manual smoke (`npm start`, run on iOS sim or Expo
    Go): login → see new home → tap day → join an open session → see
    Prijavljen → open profile → bump weekly limit → see progress fill
    update → logout. Plus `npm run lint` and `npm run test` green.

### Files changed in Phase A
- `app/_layout.tsx` (font loading)
- `app/login.tsx` (rewrite)
- `app/(tabs)/_layout.tsx` (restructure; resolves A1)
- `app/(tabs)/index.tsx` (becomes the actual home screen, not a null)
- `src/components/Header.tsx`, `DayFilter.tsx`, `AlertBar.tsx`, `TrainingCard.tsx` (restyle)
- `src/constants/Colors.ts` (token table)
- **New:** `src/constants/typography.ts`, `src/constants/spacing.ts`,
  `src/components/EmptyDay.tsx`, `app/profile.tsx`, avatar-initials helper,
  week-helper (`src/utils/week.ts`).
- **Copied in:** `assets/images/perun-emblem-*.png`,
  `assets/images/perun-wordmark-*.png`.
- **AuthContext:** add `updateProfile(patch)` if it does not already exist
  — required for the stepper to persist.

### Phase A explicitly does NOT include
- Any Supabase schema, RLS, or RPC change.
- Real Profile aggregates (use placeholder figures; real numbers land in B).
- Any admin screen, admin tab bar, or role-based routing.
- Asset vectorisation (ship with PNGs; vector request stays open with client).
- A push to production / store builds.

---

## Phase B — ADMIN APP (heavier; backend + UI + RLS)

### Scope
5 admin screens (Pregled, Korisnici, Treninzi, Novi-trening, Statistika) +
shared admin tab bar + role-based routing after login.

### Backend tasks (block UI)
1. **Schema migration — `is_open`** — add `is_open boolean not null default
   true` to `public.sessions`. Backfill existing rows to true.
2. **RPC update — `join_session`** — extend `join_session(uuid)` to reject
   joins when `is_open = false` (`raise exception 'session_closed'`). Map
   the code in `bookingErrorMessages` ("Termin je trenutno zatvoren za
   prijave.").
3. **Admin policies / RPCs** — for sessions CRUD, profile management, and
   user deletion. Approach: `admin_*` SECURITY DEFINER RPCs that check
   `(select role from profiles where id = auth.uid()) = 'admin'`. This
   keeps RLS surface small.
4. **Stats** — either a Postgres view or RPCs:
   - `admin_member_series(months int)` → array of
     `{ month, total_members, new_members }`.
   - `admin_occupancy_summary(period text)` → `{ avg_pct, top_day }`.
   These power the Pregled trend chart and the Statistika screen. Real but
   simple aggregates over `profiles.created_at` and
   `session_participants` counts.
5. **Admin role provisioning** — first admin is created by manual `UPDATE`
   in Supabase Studio. No self-promotion from the app.

### Routing tasks
6. **Role-based redirect** — after `login()` + profile fetch resolves,
   branch: `profile.role === 'admin'` → `/(admin)`, else `/(tabs)`. Update
   `RootNavigator` in `app/_layout.tsx`.
7. **Admin route group** — `app/(admin)/_layout.tsx` rendering `<Tabs>`
   (or custom bottom bar matching the spec) with four tabs: Pregled,
   Korisnici, Treninzi, Statistika. Icons from `@expo/vector-icons`
   (Feather: grid, users, calendar, bar-chart-2).
8. **Novi-trening** — stack route inside `(admin)` for create/edit
   (`app/(admin)/training/[id].tsx` with `[id] === 'new'` for create).

### Screen tasks (UI)
9. **Pregled (`app/(admin)/index.tsx`)** — top bar with ADMIN badge + navy
   avatar; greeting "Zdravo, Admin · Pregled centra · {month}"; 2×2 stat
   grid; monthly trend chart card (6 bars, current month burgundy, others
   gold gradient); quick action "＋ Novi trening".
10. **Korisnici (`app/(admin)/users.tsx`)** — header + count, search input,
    filter chips (Svi/Aktivni/Admini), list of user rows with
    expand-to-edit revealing "Izmeni" / "Ukloni" with confirm dialog.
11. **Treninzi (`app/(admin)/sessions.tsx`)** — day selector reuse, list of
    workout rows with `is_open` toggle switch. Toggling calls
    `admin_set_session_open(id, bool)` RPC.
12. **Novi/Izmena trening (`app/(admin)/training/[id].tsx`)** — form:
    title, day chip-picker, time + duration, room, max participants
    stepper, `is_open` toggle, sticky footer Otkaži / Sačuvaj.
13. **Statistika (`app/(admin)/stats.tsx`)** — period chips (12/6/Sve),
    12-bar members chart, two secondary tiles (NOVIH/MES., PROS. POPUNJ.).
14. **Charts** — small custom bar-chart component (no extra dep). Normalise
    to max value.

### Verification (Phase B)
- `npm run lint`, `npm run test` green.
- DB: new migrations apply locally and on linked project.
- Manual: log in as a member → cannot see admin screens; log in as admin →
  see admin tabs; close a session in admin → member sees it disabled and
  cannot book; create a new session in admin → it appears in member week.

### Files added/changed in Phase B (high-level)
- `supabase/migrations/<ts>_is_open_on_sessions.sql`
- `supabase/migrations/<ts>_admin_rpcs.sql`
- `src/contexts/TrainingContext.tsx` (map `session_closed`, surface `is_open`)
- `src/types/Training.ts` (+ `is_open: boolean`)
- `src/types/Profile.ts` (+ `role: 'user' | 'admin'`)
- `app/_layout.tsx` (role-based redirect)
- **New:** `app/(admin)/_layout.tsx`, `index.tsx`, `users.tsx`,
  `sessions.tsx`, `stats.tsx`, `training/[id].tsx`.
- **New:** `src/services/admin/*` (user mgmt, session CRUD, stats fetchers).
- **New:** `src/components/admin/{StatTile, BarChart, UserRow, SessionRow, Toggle, FilterChips}.tsx`.

### Phase B explicitly does NOT include
- Admin self-promotion / invite-by-email flow (manual seed only).
- Push notifications / email on session changes.
- Multi-gym / multi-center support.
- Localisation beyond Serbian.

---

## Constraints (must hold across both phases)

- React Native primitives only (`View`, `Text`, `Pressable`, `Image`,
  `TextInput`, `FlatList`, `SafeAreaView`). No web/HTML, no Tailwind, no
  styled-components, no UI kit.
- Reuse existing contexts and hooks (`useAuth`, `useTrainings`). Do not
  introduce a parallel data layer.
- TypeScript strict — no new `any`. Resolve audit A4/A5 in passing where it
  intersects the touched files; do not expand scope to fix everything.
- Verification gate: every phase ends green on `npm run lint` +
  `npm run test` + manual smoke. Karpathy verifier gate enforces this (no
  commit without `.claude/.verify-pass`).
- Serbian copy is canonical — do not anglicise. Latin-Extended fonts only.
- Brand colours and shadows from README are canonical; HTML is reference.

## Out of scope (explicitly not touching)

- Supabase schema and RLS in Phase A.
- Real Profile aggregates in Phase A — placeholder until Phase B stats land.
- Light/dark mode (single warm-light theme only — README does not specify
  dark).
- Forgot-password and sign-up flows ("Pridruži se" is link-only / disabled).
- Push notifications, in-app messaging, calendar export.
- Sentry / analytics / crash reporting.
- Asset vectorisation (kept open with client; PNGs are good enough now).
- Audit items not intersected by this redesign (A3 duplicate logic dedup,
  D2 unused dep, D3 leftover test) — track separately.

## Definition of done

### Phase A
- App opens to the redesigned Login. After sign-in the new Home renders
  with Perun branding, the week selector, the weekly-progress card, and
  styled TrainingCards in all four states (verified by toggling state in a
  test account).
- Empty-day card shows when a day has no sessions.
- Profile screen reachable from the Header avatar; the weekly-limit
  stepper changes `profile.max_sessions_per_week` and the change persists
  across reload.
- `npm run lint` and `npm run test` green.
- 60-second manual smoke (login → browse week → join one open session →
  open profile → bump limit → logout) passes on iOS simulator.

### Phase B
- A user with `role = 'admin'` lands on the admin tab bar after login;
  `role = 'user'` lands on the member home (no regressions).
- Closing a session in admin (`is_open = false`) prevents members from
  joining it (UI shows closed state; RPC rejects with `session_closed`).
- Create-session form inserts and the new session appears in the member's
  week.
- Pregled and Statistika render with real numbers from Supabase (not
  mocks).
- `npm run lint`, `npm run test` green; new migrations apply cleanly on
  the linked project.

---

## Decisions Uros needs to make before any code

These are the forks where Splinter will not silently pick:

1. **Phase scope this turn.**
   - (a) Phase A only now (lower risk, no schema), Phase B later as a
     separate goal; **or**
   - (b) Both phases in one push (longer cycle, larger blast radius).
   *Recommendation: (a).*
2. **Supabase schema/RLS changes — in-scope now or deferred?** Tied to
   decision 1. If (a), all schema work stays out of scope this turn.
3. **Profile screen route shape** — modal stack (back chevron, design
   matches) vs `(tabs)/profile.tsx`. *Recommendation: modal stack.*
4. **Week-anchor for date numbers in the week selector** — current ISO
   week, Mon as day 1, locale Europe/Belgrade. *Recommendation: confirm
   `(inferred)`.*
5. **`max_sessions_per_week` write path** — confirm there is no existing
   `updateProfile` on `AuthContext` (not visible in current source). If
   absent, add a minimal one in Phase A.
6. **Phase B only — admin role provisioning** — manual `UPDATE profiles
   SET role = 'admin' WHERE id = '…'` in Supabase Studio for the first
   admin? *Recommendation: yes.*
7. **Icon library** — `@expo/vector-icons` (already installed;
   Feather/Ionicons cover all admin icons). *Recommendation: use it.*

---

## Risks

- **R1 — Asset rasterisation.** PNGs may look soft on tablet / large
  devices. Mitigation: ask client for SVG/AI before Phase B ships; not a
  blocker for Phase A.
- **R2 — Font-load flash.** Without proper `useFonts` gating, screens may
  render in fallback font for a frame. Mitigation: hold splash via
  `expo-splash-screen` until fonts load.
- **R3 — Profile placeholder stats** in Phase A may look like real numbers
  to the gym owner. Mitigation: dim/label as "—" or render with a
  "demo" badge until Phase B lands.
- **R4 — Admin RPC + RLS surface area** (Phase B) is the largest source of
  risk. Mitigation: dedicated migration review; integration test asserting
  a non-admin cannot call admin RPCs.
- **R5 — Audit A1** (dead day-route files) intersects Phase A's tab shell
  work. Mitigation: fold A1 cleanup into Phase A task 11.

---

## Hand-off to Leonardo

When Uros approves a phase, Splinter will dispatch Leonardo with this brief
attached. Leonardo decomposes into the task board
(`/Users/uros/Documents/Private/Projects/PerunApp/.tmnt/board-redesign.md`,
distinct from the existing audit `board.md`) and dispatches specialists:

- **Phase A** is mostly Michelangelo (frontend) with a small Donatello
  slice (font loading wiring, `updateProfile` on AuthContext if needed)
  and Raphael at the end for the verification smoke + a unit test on the
  week-anchor helper.
- **Phase B** is roughly half Donatello (migrations, RPCs, RLS, stats)
  and half Michelangelo (5 screens + admin shell + charts), with Raphael
  verifying the admin-vs-member gate.

Begin Phase A by laying foundations (tokens + fonts + assets) before any
screen work — these unblock every other task.
