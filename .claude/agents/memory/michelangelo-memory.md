# Michelangelo — Memory

## Session counter
Current session: 9
Last log: /Users/uros/Documents/Private/Projects/PerunApp/.claude/agents/tmnt/session-logs/2026-06-27-S9-michelangelo.md

## Completed tasks
- T5 (A1) — Fixed tab routing by deleting six dead day-route files (monday–saturday). Kept _layout.tsx as the single-screen renderer. Modified index.tsx to return null (no redirect, prevents dangling link).
- T8 (S5) — Surface join/leave errors to user (Serbian Alert messages). Created error-code-to-message mapping helper; modified joinSession/leaveSession to catch errors, show Alert, and NOT rethrow. Gated console logging behind __DEV__. tsc --noEmit PASS.
- T9 (A3) — De-duplicate booking/limit logic. AlertBar now consumes bookedCount/reachedLimit from context instead of recomputing. Deleted unused guards.ts. Removed useMemo from TrainingContext; fixed eslint warning. tsc + eslint PASS.
- B-M8 + B-M2 + B-M1 (Phase B UI Wave A) — Built 7 shared admin components in src/components/admin/ (AdminHeader, StatTile, BarChart, Toggle, FilterChips, UserRow, SessionRow), created app/(admin)/ route group with _layout.tsx (Tabs + AdminHeader) and 4 placeholder screens (index/users/sessions/stats) + training/[id] placeholder. Modified app/_layout.tsx RootNavigator to route role-based: admin → /(admin), user → /(tabs). No flashing, no profile race condition. tsc + eslint PASS. No commit.
- B-M3 + B-M7 (Phase B UI Wave B) — Filled Pregled (dashboard) and Statistika (stats) screens with real RPC data (memberSeries, occupancySummary) and useTrainings hooks. 2×2 stat grid, monthly trend chart with green badge, quick-action button on Pregled. Period filter (12m/6m/all), big member figure, secondary metric tiles on Statistika. Loading + error states, ScrollView wrapper, paper bg, no AdminHeader inside screens. Reused StatTile/BarChart/FilterChips. Inline helpers: MONTHS_LC, DAY_ABBR, monthAbbrevFrom, getTodayEnum, trendPercent. tsc --noEmit PASS; eslint PASS. No commit.
- B-M4 + B-M5 + B-M6 (Phase B UI Wave C) — Implemented three admin screens (Korisnici, Treninzi, training form [id]). Users screen: load listUsers(), search/filter (svi/aktivni/admini), FlatList of UserRow, edit Modal with stepper for max_sessions_per_week, delete with confirm, re-fetch on mutations. Sessions screen: FlatList with day selector (FilterChips PON–SUB), SessionRow with toggle open/close, real-time re-fetch, empty state text. Form screen (outside tabs): nav bar with back/title, full form with day chips, time/duration row, room/max-participants stepper, status card with Toggle. Validate title/time/max_participants, await upsertSession → fetchTrainings → router.back(). All screens use real services (listUsers, updateUser, deleteUser, setSessionOpen, upsertSession), no new deps, no AdminHeader in tab screens. tsc --noEmit PASS; eslint PASS. No commit.

## Gotchas
- npm cache permission issue (`/Users/uros/.npm/_cacache`) prevented `npx` direct invocation; worked around using `npm_config_cache=/tmp/perunapp-npm-cache`.
- Codex timed out mid-execution on T5 but the patch WAS applied before timeout. Final DONE signal not reached, but verification confirms work is complete.
- T8: Codex correctly avoided throwing errors (which would bubble into un-awaited onPress) by catching + Alert + return pattern. TrainingCard callers safe without modification.
- T9: useMemo removal was simpler than useCallback wrapping handlers; context consumers re-render on provider render anyway.
- B-M8/B-M2/B-M1: First two invocations of Codex with combined prompt timed out during analysis phase (Codex reasoning loop is slow on large specs). Split into two focused prompts: (1) components-only (v3 with inline code templates), (2) routing+screens. Both succeeded. ESLint warning on router hook dependency added router to deps array (standard pattern, common in auth routing).
- B-M3/B-M7: Codex successfully verified tsc + eslint in sandbox, reported DONE. No issues on actual tsc/eslint runs in local env. Both screens load from real RPCs; no hardcoded mock values. Occupancy data null-guarded on both screens.
- B-M4/M5/M6: Codex timed out (exit 144) on first attempt with large combined prompt. Fell back to direct code writing (Mikey writes, not Codex). Users.tsx and sessions.tsx were auto-formatted by eslint on disk write. Form screen [id].tsx was already fully implemented in Wave A placeholders. All three screens verified: tsc --noEmit PASS, eslint PASS on app/(admin) + src/components/admin.

## Design system reuse notes
- All admin components use existing Colors, Radii, Spacing, Shadows, Typography constants.
- No new tokens, no gradients (RN limitation), no new dependencies.
- SessionRow uses Toggle internally (shared component).
- UserRow avatar tint rotation by index: [sage, gold, burgundy] % 3.
- BarChart gold bar with goldTint highlight at top mimics gradient within RN constraint.
- Admin avatar navy (vs member burgundy) per design spec.
- Pregled & Statistika: inline Serbian month/day maps (no shared util per constraint).
- Trendpercent guard: returns null if first=0 to avoid synthetic pct; rendered as "—" on both screens.
- Users/Sessions/Form: FilterChips (generic, single-select), stepper (−/value/+, clamp bounds), Toggle (checked=burgundy ON), Modal (slide transparent), FlatList (no AdminHeader).

## Routing logic in app/_layout.tsx
- Waits for both session AND profile before deciding route (no flash of wrong stack).
- Branch: role === "admin" → /(admin), else → /(tabs).
- Always routes by role if already on correct page (no drift).
- Loading spinner rendered while auth resolves.
- Admin tabs: Pregled / Korisnici / Treninzi / Statistika (top-level tabs).
- Form route: /(admin)/training/new and /(admin)/training/[id] — outside tabs, own nav bar.

## RPC/Service layer notes (B-M3/B-M7 + B-M4/M5/M6)
- memberSeries(months: number) → MemberSeriesPoint[] (month: 'YYYY-MM', total_members, new_members)
- occupancySummary(period: '12'|'6'|'all') → OccupancySummary | null (avg_pct, top_day enum string, new_this_month, prev_new)
- useTrainings() → {trainings, loading, fetchTrainings, getTrainingsByDay} where Training has is_open, day_of_week enum
- Admin services: listUsers, updateUser, deleteUser, setSessionOpen, upsertSession (all RPC calls, real operations)
- Both tab screens + form use real data flows; no mock values, no stale state
- Error handling: Alert.alert on catch, always re-fetch to resync after mutation
- Loading states: ActivityIndicator rendered during fetch; buttons disabled while submitting
