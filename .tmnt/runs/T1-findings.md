# T1 — Supabase RLS verification (empirical)

**Date:** 2026-06-27
**Method:** Live read-only probe of the restored project `khgsxxzeavudmsznbpyt`
("perun app", eu-west-1, Postgres 17) using ONLY the public **anon** key
(unauthenticated). No service_role used for data reads; service_role used once
only to enumerate table names (schema cache was stale right after restore).
No writes performed.

## Verdict: 🔴 CRITICAL — RLS is NOT protecting `public.profiles`

| Table | Anon read (unauthenticated) | Result |
|---|---|---|
| `profiles` | `GET /rest/v1/profiles` → **HTTP 200**, `content-range: 0-1/2` | ⚠️ **FULLY READABLE** — returned all rows incl. PII |
| `sessions` | HTTP 200, `*/0` | 0 rows — **table currently empty**, RLS state inconclusive from read alone |
| `session_participants` | HTTP 200, `*/0` | 0 rows — **empty**, inconclusive from read alone |

### `profiles` exposure (confirmed)
Anonymous request with the public anon key returned **2 member rows** including:
`id`, `first_name`, `last_name`, `enabled`, `role`, `max_sessions_per_week`.

This means **either RLS is disabled on `profiles`, or there is a permissive
`anon` SELECT policy.** Real member names + roles are readable by anyone.

### Severity amplifier
The anon key that unlocks this is **`EXPO_PUBLIC_*` (shipped in every client
bundle) AND was committed to a public GitHub repo (`robertceki/perunapp`).**
So the read access above is available to the entire internet right now, not just
app users. This is a live PII disclosure.

### Schema notes (vs app's TS types)
`profiles` has columns the app's `Profile` type doesn't model: **`enabled`
(bool)** and **`role`** (e.g. `user`). The `role` column is relevant to audit
gate Q4 (admin/coach role) — an authorization role field already exists in the
schema even though the app treats everyone as a member.

## What this means for the plan
- **S1 is real and live, not hypothetical.** T2 ("implement RLS") is required and
  is "build/fix", not merely "verify-and-harden".
- `sessions` / `session_participants` RLS could not be confirmed by read because
  both are empty. Need the actual policy/`relrowsecurity` state — requires DB
  access (link + DB password) or a controlled write test (not run; would mutate
  prod and needs a valid FK session row).

## Recommended immediate action
1. **Disable anon read on `profiles` now** (enable RLS + remove any permissive
   anon policy; add an authenticated, self-or-scoped read policy). This is the
   one finding that is actively leaking.
2. Pull full RLS/policy state for all three tables to scope T2 precisely.
3. Rotate is NOT required (anon key is public by design) — fixing RLS is the fix.

---

## RESOLUTION (applied 2026-06-27)

Root cause was NOT missing RLS (RLS was enabled on all 3 tables). It was a
mis-scoped policy: `profiles` had `"allow read profiles"` granted to **`public`**
(includes anon) with `USING (true)`. Also `anon`/`authenticated` held excessive
table grants (incl. `TRUNCATE`).

Migration `supabase/migrations/20260627155611_harden_rls_profiles_anon.sql`
applied to the live DB via the Management API:
1. Dropped `"allow read profiles"`; added `profiles_select_authenticated`
   (SELECT, role `authenticated`, `USING (true)`).
2. `REVOKE ALL ... FROM anon` on profiles/sessions/session_participants.
3. Revoked `truncate, trigger, references` from `authenticated`.
4. Dropped a redundant duplicate SELECT policy on `session_participants`.

**Verified:** anon `GET /profiles` → **HTTP 401 `42501 permission denied`**
(was 200 + PII). `pg_policies` shows only the authenticated policy; anon grants
now empty.

### Pre-existing policy review (already correct — left as-is)
- `session_participants`: INSERT `with_check (auth.uid() = user_id)`,
  DELETE `using (auth.uid() = user_id)`, SELECT authenticated. Correct own-row authz.
- `sessions`: SELECT authenticated; no write policies → writes default-denied. OK
  for now (no admin UI; gate Q4 = admin "planned but not yet").

### Still open (NOT closed by this fix)
- **T3 (atomic capacity + weekly limit):** still only enforced in client JS. An
  authenticated user can still over-book past `max_participants` /
  `max_sessions_per_week` via direct REST INSERTs (own user_id), because there is
  no server-side capacity/limit check. Needs the RPC/trigger work.
- **Authenticated-path functional check:** RLS change preserves authenticated
  SELECT by design, but pre-login `fetchTrainings()` (runs on mount) now gets 401
  instead of empty — surfaces a pre-existing "data not refetched after login"
  weakness. Verify in the running app / ensure fetches happen post-auth.
- **Column minimization:** any logged-in member can still read every profile row
  incl. `role`/`enabled`/`max_sessions_per_week`. Acceptable vs the public leak;
  refine later (view or column policy) if desired.
