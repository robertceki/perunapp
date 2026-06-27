# PerunApp — Audit Report

**Date:** 2026-06-27
**Branch:** `audit`
**Commit reviewed:** `8c6be4b` (top navigation & join session sync)
**Scope:** Security · Code quality / architecture · Dependencies & vulnerabilities
**Codebase size:** ~840 LOC (Expo SDK 54 / React Native 0.81 / React 19 / Supabase)
**Status:** Findings + remediation plan only. **Nothing fixed yet.**

---

## 0. Executive summary

The app is a small training-session booking MVP. The code is readable and the
dependency versions are current and SDK-aligned. However there are **two
blocking-class problems** that must be resolved before this can be considered
production-safe:

1. **All authorization is client-side.** Booking limits, capacity, and identity
   checks live in JavaScript. If Supabase Row-Level Security (RLS) is not
   correctly configured server-side, any authenticated user can bypass every
   rule by calling the Supabase REST API directly with the (public) anon key.
   **We cannot see the DB/RLS from this repo — this is the #1 thing to verify.**
2. **The tab routing is broken.** `app/(tabs)/_layout.tsx` never renders
   `<Slot>`/`<Tabs>`, so the six per-day route files never render at all. The
   app "works" only through the day-filter state inside the layout; the route
   files are dead code.

Severity counts: **2 Critical · 5 High · 8 Medium · several Low/cleanup.**

---

## 1. Security

### S1 — [CRITICAL] Authorization is enforced only on the client
- **Where:** `src/contexts/TrainingContext.tsx` (`joinSession`, `leaveSession`,
  `canJoinSession`), `src/services/trainings/guards.ts`,
  `src/components/TreiningCard.tsx`.
- **Problem:** Weekly limit (`max_sessions_per_week`), session capacity
  (`max_participants`), and "already joined" are all checked in JS *before* a
  direct `insert`/`delete` to `session_participants`. The anon key is shipped to
  every client (by design — see S2), so a user can replay the REST call and:
  - join sessions past their weekly limit,
  - join a full session,
  - potentially insert/delete rows for **other** `user_id`s (depends on RLS),
  - read other users' profile data (`first_name`/`last_name`) — privacy.
- **Fix direction:** Treat the client as untrusted. Enforce every rule in the
  database:
  - RLS policies on `session_participants`, `sessions`, `profiles` keyed to
    `auth.uid()` (a user may only insert/delete their *own* participation rows).
  - Capacity + weekly-limit enforced server-side via a Postgres function (RPC)
    or constraints/triggers, not JS.
- **Action required from you:** confirm the current RLS policy state (or give DB
  access) so we can verify rather than assume.

### S2 — [MEDIUM] `.env` is committed to git
- **Where:** `.env` is tracked (`git ls-files .env` → tracked); repo
  `.gitignore` only ignores `.env*.local`.
- **Nuance:** the vars are `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`. The `EXPO_PUBLIC_` prefix means Expo
  **intentionally inlines them into the client bundle** — the anon key is *meant*
  to be public. So this is **not** a credential leak in the classic sense, and
  the anon key does **not** need rotation *provided RLS is correct* (see S1).
- **Real risk:** (a) bad hygiene — the file lives in history forever; (b) the
  trap that the next person adds a real secret (e.g. `service_role` key) to the
  same committed file and leaks it catastrophically.
- **Fix direction:** `git rm --cached .env`, add `.env` to `.gitignore`, commit
  a `.env.example` with empty values. (History scrub optional — only the public
  anon key is in there today.)

### S3 — [HIGH] Race condition / no atomicity on capacity & weekly limit
- **Where:** `joinSession` — read participant list, then `insert`.
- **Problem:** Classic check-then-act TOCTOU. Two concurrent joins both pass the
  capacity / limit check and both insert → overbooking past `max_participants`
  and past `max_sessions_per_week`.
- **Fix direction:** enforce atomically in the DB — unique constraint on
  `(session_id, user_id)` to stop double-join, plus an RPC/trigger that checks
  capacity and weekly count under a row lock.

### S4 — [HIGH] "Weekly" limit is not actually weekly
- **Where:** `TrainingContext.tsx` `bookedCount` counts the user across **all**
  fetched sessions; `AlertBar.tsx` shows "X / Y treninga ove nedelje" ("this
  week"). `fetchTrainings` returns *all* sessions with no date/week filter.
- **Problem:** The limit counts lifetime bookings, not the current week — both a
  correctness bug and a (weak) authz bug.
- **Fix direction:** filter bookings to the current week (and do the real
  enforcement server-side per S1/S3).

### S5 — [MEDIUM] Errors are swallowed; no user feedback
- **Where:** `joinSession`/`leaveSession` (`console.log(error); return;`),
  `guards.ts` (`console.log("Limit check error")`).
- **Problem:** A failed/blocked write looks identical to success to the user, and
  security-relevant failures are invisible. Also `console.log` ships to prod.
- **Fix direction:** surface errors in UI; remove/condition debug logging.

---

## 2. Code quality & architecture

### A1 — [HIGH] Broken tab routing — six dead route files
- **Where:** `app/(tabs)/_layout.tsx` renders `Header` + `DayFilter` + content
  directly and **never renders `<Slot>`/`<Tabs>`/`children`** (verified). In
  Expo Router a layout must render an outlet for child routes to appear.
- **Effect:** `app/(tabs)/{monday,tuesday,wednesday,thursday,friday,saturday}.tsx`
  **never render.** `index.tsx` redirects to `/(tabs)/monday`, but that just
  shows the layout. Day switching actually happens via `useState` inside the
  layout. `typedRoutes` + 6 route files are misleading dead code.
- **Fix direction:** pick ONE model:
  - **(a)** Keep the single-screen + `DayFilter` state approach → delete the six
    day route files and `index.tsx` redirect; or
  - **(b)** Make it real routing → convert `_layout` to `<Tabs>`/`<Slot>`, move
    `Header`/`DayFilter`/`AlertBar` into the layout shell, let each day file own
    its content.
  Recommend **(a)** — simpler, matches current behavior.

### A2 — [MEDIUM] `friday.tsx` is a leftover stub
- Renders only `<Text>Friday</Text>` (inconsistent with the other days; dead per
  A1 anyway). Resolve as part of A1.

### A3 — [MEDIUM] Duplicated booking/limit logic in 3 places
- `TrainingContext` (`bookedCount`/`reachedLimit`/`canJoinSession`), `AlertBar`
  (recomputes the same), `guards.ts` (a *third*, different definition that counts
  all-time participants and is **never imported/used**).
- **Fix direction:** single source of truth in the context (or a selector);
  delete `guards.ts` or wire it in consistently.

### A4 — [MEDIUM] `any` types defeat strict mode
- `AuthContext.profile: any` + `useState<any>`, `DayFilter({...}: any)`,
  `catch (e: any)` in `login.tsx`.
- **Fix direction:** add a `Profile` type (`id`, `first_name`, `last_name`,
  `max_sessions_per_week`, …); type `DayFilter` props; narrow caught errors.

### A5 — [MEDIUM] `Training.created_at: number` likely wrong
- Supabase `created_at` is a timestamptz **string**; typed as `number` and used
  in `.order("created_at")`. Type mismatch waiting to bite.

### A6 — [LOW] Misspelled filename `TreiningCard.tsx`
- Exports `TrainingCard` from a misspelled file. Rename for consistency.

### A7 — [LOW] Fragile day coupling
- `day_of_week` matched against hardcoded lowercase English strings; `DAYS` has
  no Sunday. Centralize the day list/type.

### A8 — [LOW] No optimistic updates / refetch-everything
- Every join/leave refetches all sessions. Fine for MVP; note for scale.

### A9 — [LOW] Minor inconsistency
- `TrainingContext.tsx:85` `session?.user.id` mixes optional/non-optional
  chaining; import ordering differs across files (no lint config).

---

## 3. Dependencies & vulnerabilities

### D1 — [HIGH→context: low real risk] 23 npm audit findings (22 moderate, 1 high)
- **High:** `undici` (HTTP header injection / DoS / response poisoning) — pulled
  in transitively by `@expo` build tooling.
- **Moderate:** `uuid` ← `xcode` ← `@expo/config-plugins` ← Expo prebuild chain.
- **Context:** these are **build-time / CLI** dependencies, **not shipped in the
  app runtime bundle**. Real-world exploitability for a deployed RN app is low,
  but they should be tracked.
- **Fix direction:** do **not** run `npm audit fix --force` blindly — it wants
  `expo@56` (breaking). Wait for an Expo SDK 54 patch bump or upgrade SDK
  deliberately as its own task.

### D2 — [LOW] `react-native-tab-view` appears unused
- Listed in deps; **no imports found** in `src`/`app` (verified). Likely
  removable (confirm before deleting).

### D3 — [LOW] Broken/leftover test + no test runner
- `src/components/__tests__/StyledText-test.js` imports `../StyledText` which
  **does not exist** → test cannot pass. `react-test-renderer` is deprecated for
  React 19. There is **no `test` script** in `package.json` and no jest config.
- **Fix direction:** delete the leftover test or add a real testing setup
  (`jest-expo` + `@testing-library/react-native`) and a `test` script.

### D4 — [LOW] No lint/format/CI config
- No ESLint/Prettier config committed, no CI. Recommend adding before the team
  grows.

### D5 — [GOOD] Versions are current & SDK-aligned
- Expo 54, React 19.1, RN 0.81.5, supabase-js 2.106. No action.

---

## 4. Prioritized fix plan

| # | Severity | Item | Effort | Blocking? |
|---|----------|------|--------|-----------|
| 1 | CRITICAL | S1 — verify/implement Supabase RLS + server-side authz | M–L | **Yes** |
| 2 | HIGH | S3/S4 — atomic capacity + real weekly-limit enforcement (DB) | M | **Yes** |
| 3 | HIGH | A1 — fix/remove broken tab routing & dead day files | S | Yes |
| 4 | MEDIUM | S2 — untrack `.env`, add `.env.example` | S | Recommended |
| 5 | MEDIUM | S5 — surface errors, strip `console.log` | S | Recommended |
| 6 | MEDIUM | A3 — de-duplicate booking/limit logic | S | No |
| 7 | MEDIUM | A4/A5 — add `Profile` type, fix `any` & `created_at` | S | No |
| 8 | LOW | A2/A6/A7/A9 — stub cleanup, rename, day constants, lint | S | No |
| 9 | LOW | D2/D3/D4 — drop unused dep, fix tests, add lint/CI | S–M | No |
| 10 | TRACK | D1 — npm vulns; revisit on next Expo SDK bump | — | No |

**Phasing:**
- **Phase 0 (gate):** answer the open questions below — especially RLS status.
  Without it we're guessing at the most important fix.
- **Phase 1 (must-fix before real users):** items 1–3.
- **Phase 2 (hardening / hygiene):** items 4–5.
- **Phase 3 (quality):** items 6–9.

---

## 5. Open questions for the owner (blockers for Phase 1)
1. **RLS:** Are Row-Level Security policies enabled on `sessions`,
   `session_participants`, and `profiles`? Can we get read access to the schema
   + policies (or the Supabase project)? *(Determines whether S1 is "verify" or
   "build from scratch".)*
2. **Routing intent:** Keep the single-screen + day-filter approach (delete the
   route files), or move to real per-day routes? *(A1)*
3. **Weekly limit semantics:** Is "week" Mon–Sun, rolling 7 days, or
   gym-defined? *(S4)*
4. **Is there any admin/coach role** (create/edit sessions), or is the app
   read-only browse + self-book for members?
