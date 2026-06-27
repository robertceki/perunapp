# Raphael — Memory

## Session counter
Current session: 1
Last log: 2026-06-27-S1-raphael.md

## Completed tasks
- T17 (D3) — Fix broken test + add real test runner
  - Deleted src/components/__tests__/StyledText-test.js (imports nonexistent ../StyledText)
  - Set up jest-expo@54.0.17 + @testing-library/react-native@13.3.3
  - Added "test": "jest" script + "jest" preset in package.json
  - Wrote 1 real test: src/constants/__tests__/days.test.ts (assertions on DAYS/TRAINING_DAYS arrays, order, Sunday-start week consistency)
  - `npm test` passes: 1 suite, 1 test, exit 0

## Gotchas
- npm cache issue (root-owned files) — Codex worked around it with npm_config_cache=/tmp isolation
- jest-expo preset requires babel-jest, jest-snapshot, jest-environment-jsdom — all included in jest-expo dependencies
- @testing-library/react-native v13.3.3 chosen (React 19 compatible, lower than latest v14 which requires React 19+ more strictly)
