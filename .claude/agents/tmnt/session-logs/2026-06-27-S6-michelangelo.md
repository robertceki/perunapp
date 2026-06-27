# Michelangelo Session 6 — T9 (A3) De-duplicate booking logic

## Task
T9 (A3): Remove duplicate `bookedCount` and `reachedLimit` logic from AlertBar.tsx. Also delete dead-code guards.ts, fix useMemo warning in TrainingContext.

## Changes
1. **AlertBar.tsx**: consume `bookedCount`, `reachedLimit` from context instead of recomputing
   - Removed myBookings filter + local bookedCount/reachedLimit
   - Output identical (same Serbian text, same styling)
   - Import reduced: now only destructures `{ bookedCount, reachedLimit }` from `useTrainings()`

2. **TrainingContext.tsx**: removed `useMemo` wrapper + fixed eslint warning
   - Deleted the useMemo call; pass value object directly
   - Enhanced `reachedLimit` logic: explicit `maxSessions > 0` guard preserves "limit 0" behavior
   - Removed useMemo import
   - Line 182 eslint warning gone

3. **src/services/trainings/guards.ts**: deleted entirely
   - Zero imports confirmed across src/ and app/
   - Dead code (async canJoinSession never called anywhere)

## Verification
- `npx tsc --noEmit`: PASS
- `npx eslint .`: PASS (0 errors; 1 pre-existing warning in app/_layout.tsx, unrelated)
- TrainingContext useMemo warning: GONE
- Behavior: unchanged for real users

## Run log
/Users/uros/Documents/Private/Projects/PerunApp/.tmnt/runs/T9-mikey.md

## Status
DONE — ready for Leonardo's next task
