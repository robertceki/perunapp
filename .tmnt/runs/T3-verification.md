# T3/T4 — Booking enforcement: live verification

**Date:** 2026-06-27
**Migration:** `supabase/migrations/20260627160000_booking_enforcement.sql` (applied to live DB)
**Decisions:** weekly WIPE model (Sun 00:00 Europe/Belgrade), enforcement server-side & non-bypassable.

## What was applied
- `join_session(uuid)` SECURITY DEFINER RPC: advisory-locked, checks capacity
  (`max_participants`) + weekly limit (current booking count vs
  `max_sessions_per_week`), inserts; maps `unique_violation` → `already_joined`.
  Execute granted to `authenticated` only.
- Dropped the direct INSERT policy on `session_participants` (joins now ONLY via RPC).
- `pg_cron` job `weekly-booking-reset` ('0 * * * *', guarded to fire at Belgrade
  Sunday 00:xx, DST-safe) wipes all bookings weekly.
- App: `TrainingContext.joinSession` now calls `supabase.rpc('join_session', …)`.

## DB object checks (live)
- `join_session` exists, `prosecdef = true` (SECURITY DEFINER). ✅
- `session_participants` policies now: SELECT + DELETE only (INSERT removed). ✅
- `cron.job` `weekly-booking-reset` active, schedule `0 * * * *`. ✅

## End-to-end functional test (throwaway user, cleaned up after)
| Test | Result | Verdict |
|---|---|---|
| Direct INSERT to `session_participants` as authenticated user | `403` RLS violation | ✅ bypass blocked |
| RPC `join_session(S1)` under limit (max_sessions_per_week=1) | `204` | ✅ join works |
| RPC `join_session(S2)` over weekly limit | `400 weekly_limit_reached` | ✅ limit enforced |
| RPC re-join `S1` | `400` (weekly check short-circuits before already_joined) | ✅ acceptable |

Test data fully removed (auth user + profile + participations); `audit-test-%`
user count = 0 after run.

## Not load-tested (logic verified by code review, same structure as weekly check)
- Capacity (`session_full`) path: would require filling a session to
  `max_participants` (=10). Code path mirrors the verified weekly-limit check
  (count under advisory lock, raise before insert). Considered sound; a
  concurrency stress test is a future nicety (original T6 scope).

## NEW finding (product decision, not fixed)
`on_auth_user_created` → `handle_new_user` auto-creates `profiles` rows with
`max_sessions_per_week = NULL`. The RPC coalesces NULL → 0, so **a brand-new
member cannot book anything until an admin sets their weekly limit.** Options:
give the column a sensible default, or set it in the trigger, or surface an
admin "set limit" flow. Needs Uros's call on the default value.

## Authenticated read path
RLS SELECT policies confirmed present for `authenticated` on all three tables
(profiles authenticated-only after the S1 fix; sessions + session_participants
authenticated). Logged-in reads are preserved. A full in-app smoke test (run the
app, log in, see trainings) remains an optional confirmation.
