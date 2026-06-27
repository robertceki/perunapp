# Raphael — Memory

## Session counter
Current session: 2
Last log: 2026-06-27-S2-raphael.md

## Completed tasks
- T17 (D3) — Fix broken test + add real test runner
  - Deleted src/components/__tests__/StyledText-test.js (imports nonexistent ../StyledText)
  - Set up jest-expo@54.0.17 + @testing-library/react-native@13.3.3
  - Added "test": "jest" script + "jest" preset in package.json
  - Wrote 1 real test: src/constants/__tests__/days.test.ts (assertions on DAYS/TRAINING_DAYS arrays, order, Sunday-start week consistency)
  - `npm test` passes: 1 suite, 1 test, exit 0

- R2 (Perun redesign Phase A) — Token + stepper-clamp unit tests
  - Created src/utils/limits.ts: pure function clampWeeklyLimit(max, delta, bookedCount, maxLimit=7) matching inline stepper logic
  - Created src/utils/__tests__/limits.test.ts: 6 tests (decrement floor, increment ceiling, normal range, out-of-range clamp, custom max)
  - Created src/constants/__tests__/tokens.test.ts: 1 test asserting exact hex values for all 22 design tokens
  - Updated app/profile.tsx: replaced inline clamp with import + call to clampWeeklyLimit
  - npm test: 4 suites, 12 tests, all pass
  - npx tsc: clean
  - Mutation sanity check: deliberately broken token and out-of-range expectation both failed as intended, then restored

## Gotchas
- npm cache issue (root-owned files) — Codex worked around it with npm_config_cache=/tmp isolation
- jest-expo preset requires babel-jest, jest-snapshot, jest-environment-jsdom — all included in jest-expo dependencies
- @testing-library/react-native v13.3.3 chosen (React 19 compatible, lower than latest v14 which requires React 19+ more strictly)
- Codex clampWeeklyLimit inline expression: Math.min(maxLimit, Math.max(bookedCount, max + delta)) — applies delta to current `max`, not to a separate `current` param
