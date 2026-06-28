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
