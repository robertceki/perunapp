# Cancellation cutoff at training start

Approved cancel-r1: ordinary users may cancel before the training starts. At or after start, cancellation is rejected and the participant row remains, preserving its contribution to the weekly limit.

Migration adds authenticated leave_session(uuid), uses only auth.uid() for ownership, locks before sampling database time, and interprets day/time in the current Sunday-start Europe/Belgrade cycle. Direct client DELETE is revoked. Existing weekly reset, join_session and attendance logic are unchanged. No new columns or cron. Frontend uses the RPC and shows the session_started message.

Local verification passed: three isolated PostgreSQL test groups, TypeScript/build, lint and diff check. Tests execute the actual migration with real roles in a reconstructed minimal schema. Exact boundaries and Sunday/winter/summer cases use an explicitly labeled fixture-only clock and repeat under UTC and America/Los_Angeles. A second model and specialist review found no production SQL defect. Build retained the existing large-chunk warning.

T1 attempts 1/retry 0. T2 attempts 2/retry 1 (test coverage correction only). Final source hashes are in final-verification.json. Test runtime setup is documented at the top of supabase/tests/leave_session.test.mjs and does not modify application dependencies or package-lock.json.

Not deployed: the migration has not been applied to live Supabase, and the original live schema/grants/policies have not been inspected. Apply/review the migration before activating frontend code that depends on leave_session; live authorization and weekly cleanup must then be checked. The current-week interpretation relies on the existing successful Sunday reset. No commit/push or live database changes were performed.