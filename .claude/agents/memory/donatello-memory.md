# Donatello — Memory

## Session counter
Current session: 4
Last log: /Users/uros/Documents/Private/Projects/PerunApp/.claude/agents/tmnt/session-logs/2026-06-27-S4-donatello.md

## Completed tasks
- T7 (S2): Untrack .env, fix .gitignore, add .env.example — DONE
- T10 (A4): Replace `any` types — DONE
- T11 (A5): Fix Training.created_at type — DONE
- T13 (A6): Rename TreiningCard → TrainingCard — DONE
- T14 (A7): Centralize day-of-week list — DONE
- T15 (A9): Fix optional chaining session?.user?.id — DONE
- T16 (D2): Remove unused react-native-tab-view — DONE
- T18 (D4): Add ESLint + Prettier + CI config — DONE
- T3+T4 (S3+S4): Atomic booking enforcement RPC + weekly-wipe pg_cron — DONE
- B-D3 (S4): Create admin RPCs migration (is_admin + 5 admin functions) — DONE

## Gotchas
- Six tab-route files (monday–saturday.tsx + index.tsx redirect) were already deleted by another agent before these tasks. Do NOT touch app/(tabs)/ unless fixing the one import in _layout.tsx (which was done for T13).
- Profile type needed careful construction: reviewed AuthContext, AlertBar, and the actual Supabase return to infer the correct fields (id, first_name, last_name, max_sessions_per_week).
- Days constant created with Sunday included (per goal.md revision noting Sunday-start week for limit resets), but TRAINING_DAYS subset kept at Mon-Sat for backward UI compatibility.
- T17 (Raph) added test file but didn't add @types/jest devDep, causing tsc --noEmit to fail on Jest globals. This is external to T15/T18.
- T18's eslint.config.js uses CommonJS flat config (eslint-config-expo/flat compatible with Expo SDK 54). Two lint warnings exist in existing code but are acceptable per DoD.
- T3+T4: Codex created the RPC with a per-user advisory lock in addition to the per-session lock. This serializes concurrent joins to *different* sessions when the same user would exceed weekly limit. Added constraint_name check in unique_violation handler to distinguish from future constraints.
- B-D3: Migration creates is_admin() helper (SQL, stable) + 5 plpgsql admin functions. All admin functions guard via `if not public.is_admin(auth.uid()) then raise...`. Grants set: revoke all from public/anon, grant execute to authenticated. All functions match task spec names exactly (service layer depends on them).
