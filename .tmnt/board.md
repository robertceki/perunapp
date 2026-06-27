# Task Board — PerunApp Audit Remediation

**Goal:** /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/goal.md
**Audit source:** /Users/uros/Documents/Private/Projects/PerunApp/AUDIT.md
**Leonardo session:** 1
**Status:** Phase 2/3 cleanup wave complete (T5,T7,T10-T18 all done and verified). Phase 1 (T1-T4,T6) still blocked on Supabase access from Uros + timezone confirmation. T8/T9 still blocked, sequenced after Phase 1 DB work.

## Phase 0 — Gate (answers required before Phase 1 can be dispatched)
No tasks here. These are the four open questions from goal.md / AUDIT.md §5,
listed in Notes below. T1 (verify RLS) is the one Phase-1 task that can run
without waiting on the gate, because its entire job is to produce the answer
to Question 1.

## Phase 1 — Must-fix (blocking, before real users)
| ID | Owner | Title | DoD | Blocked by | Status |
|---|---|---|---|---|---|
| T1 | Donny | S1a — Verify current Supabase RLS policy state on `sessions`, `session_participants`, `profiles` | Written report (md or comment block) listing: RLS enabled/disabled per table, existing policies verbatim (if any), and whether `auth.uid()` is used anywhere. Source: Supabase dashboard/CLI (`supabase db dump` or dashboard policy export) — requires DB/project access from Uros. | — | **done** (.tmnt/runs/T1-findings.md) — CRITICAL: `profiles` was world-readable via public SELECT policy + anon held full grants. |
| T2 | Donny | S1b — Implement RLS + server-side authorization on `sessions`, `session_participants`, `profiles` (insert/delete restricted to `auth.uid()`, profile read scoped appropriately) | New SQL migration file(s) under a `supabase/migrations/` (or equivalent) directory; policies verified by: (a) anon-key REST call attempting to insert a `session_participants` row for a **different** `user_id` is rejected (403/RLS error), (b) authenticated user can only delete their own participation row. Raph writes the verification script/test. | T1 | **partial** — `profiles` leak fixed + anon grants revoked (migration 20260627155611, applied & verified anon→401). `session_participants` own-row INSERT/DELETE policies already correct. Remaining: column minimization on profiles (optional) + admin write policies (deferred, no admin yet). |
| T3 | Donny | S3 — Atomic capacity + weekly-limit enforcement via Postgres RPC/trigger (replace check-then-act JS logic in `joinSession`) | New RPC (e.g. `join_session(session_id)`) callable from `TrainingContext.joinSession`; concurrency test (Raph) — two simultaneous join calls against a session at `max_participants - 1` capacity result in exactly one success, one rejection. Unique constraint on `(session_id, user_id)` confirmed in schema. | T2 | **done** — migration 20260627160000, applied & verified live (direct insert→403, RPC join→204, over-limit→400). See .tmnt/runs/T3-verification.md |
| T4 | Donny | S4 — Make "weekly" limit actually weekly (filter `fetchTrainings`/booking count to the current week, server-side count matches semantics from Gate Q3) | `bookedCount` / RPC counts only sessions within the agreed week window (Mon–Sun, rolling-7, or gym-defined per Gate Q3 answer); manual check: create >limit sessions spanning two weeks, confirm only current-week ones count toward the limit. | T3 | **done (folded into T3)** — model = weekly WIPE (pg_cron Sun 00:00 Europe/Belgrade), so count = current bookings. No date filter needed. |
| T5 | Mikey | A1 — Fix or remove broken tab routing (six dead day-route files never render because `app/(tabs)/_layout.tsx` doesn't render `<Slot>`/`<Tabs>`) | Per Gate Q2 answer: **(a)** delete `app/(tabs)/{monday,tuesday,wednesday,thursday,friday,saturday}.tsx` + `index.tsx` redirect logic, confirm `expo start` shows no routing warnings and day-filter still works; or **(b)** convert `_layout.tsx` to real `<Tabs>`/`<Slot>` routing, move `Header`/`DayFilter`/`AlertBar` into the layout shell, each day file owns its content, confirm each day route renders via Expo Router devtools/manual nav. | Gate Q2 (routing intent decision) | done |
| T6 | Raph | Verification harness for T2–T4 — write the RLS-bypass repro script + concurrency test + week-filter test described in their DoDs | Scripts runnable (e.g. `node scripts/verify-rls.js` or equivalent using anon key directly) producing pass/fail output for: cross-user insert/delete rejection, double-join race, weekly-count correctness. | T2, T3, T4 | **partial** — core properties verified live via throwaway-user E2E (.tmnt/runs/T3-verification.md): anon read→401, direct insert→403, RPC enforcement→pass. Not done: capacity load test + a committed repeatable script. |

## Phase 2 — Hardening / hygiene
| ID | Owner | Title | DoD | Blocked by | Status |
|---|---|---|---|---|---|
| T7 | Donny | S2 — Untrack `.env`, fix `.gitignore`, add `.env.example` | `git ls-files .env` returns nothing; `.gitignore` includes `.env`; `.env.example` exists with empty/placeholder values for `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`. (History scrub explicitly out of scope per goal.md — only the public anon key is present today.) | — | done |
| T8 | Donny | S5 — Surface join/leave/limit-check errors to the user; strip `console.log` of security-relevant failures from prod path | `joinSession`/`leaveSession` (`TrainingContext.tsx`) and `guards.ts` show a user-visible error (toast/alert) on failure instead of silent `console.log` + `return`; grep confirms no bare `console.log` left in these two files (or gated behind `__DEV__`). | T2/T3 (error surfaces should match the new server-side rejection paths, not the old JS-only checks) | blocked |

## Phase 3 — Quality / cleanup
| ID | Owner | Title | DoD | Blocked by | Status |
|---|---|---|---|---|---|
| T9 | Donny | A3 — De-duplicate booking/limit logic (3 implementations: `TrainingContext`, `AlertBar`, unused `guards.ts`) | Single source of truth (context selector or shared hook) used by `TrainingContext.tsx` and `AlertBar.tsx`; `guards.ts` either deleted or wired in consistently (no orphaned third implementation). `grep -r "bookedCount\|reachedLimit"` shows one definition site. | T3/T4 (limit logic moves server-side; this task reconciles whatever JS-side display logic remains) | blocked |
| T10 | Donny | A4 — Replace `any` types: `AuthContext.profile`, `useState<any>`, `DayFilter` props, `catch (e: any)` in `login.tsx` | `tsc --noEmit` passes; `grep -rn ": any\|<any>" src/ app/` returns no matches in the listed files; new `Profile` type added to `src/types/`. | — | done |
| T11 | Donny | A5 — Fix `Training.created_at` type (`number` → `string`, timestamptz) | `src/types/Training.ts` updated; `tsc --noEmit` passes; any `.order("created_at")` usage still type-checks. | — | done |
| T12 | Mikey | A2 — Resolve `friday.tsx` stub as part of A1 (no separate fix — folded into T5) | Covered by T5's DoD (file deleted under option (a), or given real content under option (b)). | T5 | done |
| T13 | Mikey | A6 — Rename `TreiningCard.tsx` → `TrainingCard.tsx` (and update the one import site) | File renamed; `grep -rn "TreiningCard"` returns no matches anywhere in repo; app still builds (`tsc --noEmit`). | — | done |
| T14 | Donny | A7 — Centralize day-of-week list/type (currently hardcoded lowercase English strings, missing Sunday) | New `Day` type/const array (e.g. `src/constants/days.ts`) covering all 7 days; `DayFilter.tsx` and any `day_of_week` comparison sites import from it; `grep -rn "monday\|tuesday"` in component files shows only the centralized constant, not inline literals. | — | done |
| T15 | Donny | A9 — Minor inconsistencies: `session?.user.id` mixed optional chaining (`TrainingContext.tsx:85`), inconsistent import ordering | Line fixed to consistent optional chaining; no functional change; `tsc --noEmit` passes. | — | done |
| T16 | Donny | D2 — Remove unused `react-native-tab-view` dependency (confirm zero imports first) | `grep -rn "react-native-tab-view" src/ app/` returns nothing (pre-check, already true per audit) → removed from `package.json` + `package-lock.json`; `npm install` runs clean; app still builds. | — | done |
| T17 | Raph | D3 — Fix/remove broken test, add a real test runner | Either: delete `src/components/__tests__/StyledText-test.js` (references nonexistent `../StyledText`) and add a minimal real test for one of the new server-side-aware functions; or set up `jest-expo` + `@testing-library/react-native` with a `test` script in `package.json`. DoD: `npm test` runs and exits 0. | — (independent, but most useful once T2-T4 exist to give it something meaningful to test) | done |
| T18 | Donny | D4 — Add lint/format/CI config (ESLint, Prettier, basic GitHub Actions or equivalent CI running `tsc --noEmit` + `npm test`) | `.eslintrc`/`eslint.config.js` + `.prettierrc` committed; CI config file committed; `npx eslint .` runs without crashing (warnings OK, just needs to run). | T17 (CI should run the test script once it exists) | done |

## Deferred / tracked (no task — explicit reason)
| Finding | Reason deferred |
|---|---|
| D1 — 23 npm audit findings (22 moderate, 1 high, mostly `undici`/`uuid` via Expo build tooling) | Build-time/CLI deps, not shipped in the runtime bundle. `npm audit fix --force` wants `expo@56` (breaking) — out of scope per goal.md. **Track only**: revisit on next deliberate Expo SDK bump, not part of this remediation pass. |
| D5 — Dependency versions current & SDK-aligned | No action item — informational "good" finding, not a defect. |
| A8 — No optimistic updates / refetch-everything on join/leave | Audit explicitly flags as "fine for MVP, note for scale" — not a defect to fix now. No task; revisit if/when performance becomes a problem. |

## Notes

### GATE ANSWERS (2026-06-27, from Uros) — all four resolved
1. **RLS visibility → Uros will grant Supabase access.** T1 runs once access
   lands; T2 scope ("harden" vs "build") decided by T1's findings.
2. **Routing → DELETE the six dead day files + `index.tsx` redirect** (option a).
   T5 + T12 unblocked — pure deletion + verify, no DB dependency.
3. **Weekly limit → CORRECTED 2026-06-27(b): resets Sunday 00:00.** Week window =
   **Sunday 00:00:00 → Saturday 23:59:59** (Sunday-start week), not Mon–Sun.
   T3/T4 build to this. Timezone TBC (inferred Europe/Belgrade — confirm before
   T3/T4 dispatch).
4. **Admin role → planned but not yet.** T2 = member-self-book RLS only, but
   structured so an admin branch can be added later without a rewrite.

Residual blockers after gate answers:
- T1: needs Supabase access granted (action on Uros).
- T2/T3/T4/T6: still chained on T1's findings (DB-layer ordering), NOT on gates.
- T5/T12: now fully unblocked.

### Original Phase-1 gates (now answered — kept for history)
1. **RLS visibility (blocks T2, T3, T4, T6):** Are RLS policies currently enabled
   on `sessions`, `session_participants`, `profiles`? Can Uros grant DB/Supabase
   project read access (or export the policy list) so T1 can run? Until T1's
   findings are in, T2 cannot be scoped as "verify-and-harden" vs "build from
   scratch."
2. **Routing intent (blocks T5, T12):** Delete the six dead day-route files +
   `index.tsx` redirect (audit's recommendation, simpler, matches current
   behavior) — or convert to real per-day routes? T5 cannot be dispatched
   without this decision; it changes the entire shape of the fix.
3. **Weekly-limit semantics (blocks T3, T4):** Is "week" Mon–Sun, a rolling
   7-day window, or gym-defined (e.g. billing-cycle week)? T3's RPC and T4's
   filter both depend on this definition; building either without it risks a
   second rewrite.
4. **Admin/coach role (informs T2's RLS policy shape, not strictly blocking):**
   Is there any admin/coach role that creates/edits sessions, or is this
   member-self-book-only? If an admin role exists, T2's RLS policies need an
   extra branch (admin bypass / elevated insert-update-delete on `sessions`).
   Does not block dispatch of T1, but must be answered before T2's policies are
   written, or they will need a second pass.

### Sequencing rationale
- **T1 is the one Phase-1 task that can be dispatched immediately** — it only
  needs DB/Supabase access, not an answer to any of the four gate questions
  (it produces the answer to gate #1 itself).
- T2 through T6 are chained because they all touch the same DB enforcement
  layer; doing them out of order risks rewriting RLS policies twice (once
  naively, once after the RPC design is known).
- T5/T12 are isolated from the DB chain — could run in parallel with T1–T4 once
  gate #2 is answered, since routing is a pure frontend/Expo-Router concern
  with no DB dependency.
- T7 (untrack `.env`), T10, T11, T13–T16 have no blockers and could be
  dispatched independently/in parallel any time — they're included in Phase
  2/3 ordering per AUDIT.md §4 phasing, not because of a technical dependency.
- T8/T9 are explicitly sequenced after the DB enforcement work (T2-T4) so error
  surfacing and de-duplication target the *final* authorization shape, not the
  soon-to-be-replaced JS-only checks — avoids wasted rework.

### Coverage check — every AUDIT.md finding is mapped
- S1 → T1 (verify) + T2 (implement). S2 → T7. S3 → T3. S4 → T4. S5 → T8.
- A1 → T5. A2 → T12 (folded into T5). A3 → T9. A4 → T10. A5 → T11. A6 → T13.
  A7 → T14. A8 → Deferred (explicit reason). A9 → T15.
- D1 → Deferred/tracked (explicit reason). D2 → T16. D3 → T17. D4 → T18.
  D5 → Deferred (informational, no action).

### In-bounds files per area (for specialist dispatch later — not used in this pass)
- DB/RLS/RPC (T1–T4): Supabase project (external), new `supabase/migrations/`
  dir (does not exist yet), `src/contexts/TrainingContext.tsx`,
  `src/services/trainings/guards.ts`.
- Routing (T5, T12): `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`,
  `app/(tabs)/{monday,tuesday,wednesday,thursday,friday,saturday}.tsx`.
- Error surfacing (T8): `src/contexts/TrainingContext.tsx`,
  `src/services/trainings/guards.ts`.
- Dedup (T9): `src/contexts/TrainingContext.tsx`, `src/components/AlertBar.tsx`,
  `src/services/trainings/guards.ts`.
- Types (T10, T11): `src/contexts/AuthContext.tsx`, `src/components/DayFilter.tsx`,
  `app/login.tsx`, `src/types/Training.ts`, new `src/types/Profile.ts`.
- Rename (T13): `src/components/TreiningCard.tsx` and its one import site.
- Day constants (T14): new `src/constants/days.ts`, `src/components/DayFilter.tsx`.
- Misc (T15): `src/contexts/TrainingContext.tsx:85`.
- Deps (T16): `package.json`, `package-lock.json`.
- Tests (T17): `src/components/__tests__/StyledText-test.js`, `package.json`.
- Lint/CI (T18): new `.eslintrc`/`eslint.config.js`, `.prettierrc`, CI config.

## Activity log
- 2026-06-27 — Board created by Leonardo (session 1), plan-only pass per
  Splinter dispatch. No specialists dispatched. No source files touched.
- 2026-06-27 — T5 (A1) done by Mikey. Deleted app/(tabs)/{monday,tuesday,wednesday,thursday,friday,saturday}.tsx; index.tsx now returns null (no dangling redirect); _layout.tsx untouched. tsc --noEmit PASS. T12 (A2, friday.tsx stub) folded in and closed as part of T5 — same deletion covers it.
- 2026-06-27 — T7 (S2) done by Donny. git rm --cached .env; .gitignore includes .env; .env.example added with placeholder Supabase URL/anon key. Verified: git ls-files .env empty.
- 2026-06-27 — T10 (A4) done by Donny. New src/types/Profile.ts; AuthContext.profile typed; DayFilter props typed; login.tsx catch narrowed from `any`. Verified: tsc --noEmit PASS, grep ": any|<any>" clean in target files.
- 2026-06-27 — T11 (A5) done by Donny. Training.created_at number → string (timestamptz). Verified: tsc --noEmit PASS.
- 2026-06-27 — T13 (A6) done by Mikey. git mv TreiningCard.tsx → TrainingCard.tsx; import site in app/(tabs)/_layout.tsx updated. Verified: grep TreiningCard returns nothing.
- 2026-06-27 — T14 (A7) done by Donny. New src/constants/days.ts (Day type, DAYS all 7 Sunday-start, TRAINING_DAYS Mon-Sat UI subset); DayFilter imports TRAINING_DAYS.
- 2026-06-27 — T16 (D2) done by Donny. Confirmed zero imports of react-native-tab-view; removed from package.json; npm install clean.
- 2026-06-27 — Main Claude independent verification (external signal): tsc --noEmit exit 0; grep checks for `: any`, TreiningCard, react-native-tab-view all clean; git ls-files .env empty; new files (.env.example, src/types/Profile.ts, src/constants/days.ts) confirmed present; app/(tabs)/ contains only _layout.tsx + index.tsx.
- 2026-06-27 — Gate revision recorded: weekly-limit week window corrected to Sunday 00:00:00 -> Saturday 23:59:59 (Sunday-start), supersedes earlier Mon-Sun assumption. Affects T3/T4 only (still blocked on T1->T2 DB chain). Timezone (inferred Europe/Belgrade) still needs Uros confirmation before T3/T4 dispatch.
- 2026-06-27 — No commits made (verifier gate not run this pass); all changes live on working tree, branch `audit`.
- 2026-06-27 — T17 (D3) done by Raph. Deleted broken src/components/__tests__/StyledText-test.js (imported nonexistent ../StyledText). Added jest-expo + @testing-library/react-native, "test": "jest" script + jest-expo preset. New real test: src/constants/__tests__/days.test.ts asserting DAYS/TRAINING_DAYS contents/order/Sunday-start. npm test PASS (1 suite/1 test).
- 2026-06-27 — T15 (A9) done by Donny. src/contexts/TrainingContext.tsx — consistent optional chaining (session?.user?.id) at 4 sites (lines 85, 93, 102, 133). No behavior change. tsc --noEmit PASS.
- 2026-06-27 — T18 (D4) done by Donny. Added eslint-config-expo (flat config eslint.config.js), prettier (.prettierrc), lint/format npm scripts; CI workflow .github/workflows/ci.yml runs npm ci -> tsc --noEmit -> npm test -> eslint on push/PR.
- 2026-06-27 — Regression caught + fixed by main Claude: Raph's new test file made tsc --noEmit fail (missing Jest global types). Added @types/jest devDependency as a T17 follow-up. Resolved; tsc --noEmit now exit 0.
- 2026-06-27 — Main Claude independent verification (external signal): npx tsc --noEmit exit 0; npm test 1 suite/1 test passing; npx eslint . runs clean, 0 errors, 2 pre-existing warnings (useEffect missing 'router' dep in app/_layout.tsx; useMemo missing deps in TrainingContext.tsx:167) — acceptable per T18 DoD (warnings OK).
- 2026-06-27 — Flag for T9 (not fixed separately now): the TrainingContext.tsx:167 useMemo missing-deps warning sits in the booking/limit-display logic T9 will de-duplicate — address it as part of that rework, not as a standalone lint fix.
- 2026-06-27 — Committed to branch `audit`, verifier gate satisfied each time (fresh .verify-pass written after green signal):
  - babc075 chore: TMNT/Karpathy environment + audit deliverables
  - dbb31d4 fix: audit remediation cleanup wave (T5,T7,T10-T14,T16)
  - c0e91b1 chore: testing + lint/CI + consistency fixes (T15,T17,T18)
  Working tree clean.
