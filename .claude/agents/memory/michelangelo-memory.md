# Michelangelo — Memory

## Session counter
Current session: 12
Last log: /Users/uros/Documents/Private/Projects/PerunApp/.claude/agents/tmnt/session-logs/2026-06-28-S12-michelangelo.md

## Completed tasks
- T5 (A1) — Fixed tab routing by deleting six dead day-route files (monday–saturday). Kept _layout.tsx as the single-screen renderer. Modified index.tsx to return null (no redirect, prevents dangling link).
- T8 (S5) — Surface join/leave errors to user (Serbian Alert messages). Created error-code-to-message mapping helper; modified joinSession/leaveSession to catch errors, show Alert, and NOT rethrow. Gated console logging behind __DEV__. tsc --noEmit PASS.
- T9 (A3) — De-duplicate booking/limit logic. AlertBar now consumes bookedCount/reachedLimit from context instead of recomputing. Deleted unused guards.ts. Removed useMemo from TrainingContext; fixed eslint warning. tsc + eslint PASS.
- B-M8 + B-M2 + B-M1 (Phase B UI Wave A) — Built 7 shared admin components in src/components/admin/ (AdminHeader, StatTile, BarChart, Toggle, FilterChips, UserRow, SessionRow), created app/(admin)/ route group with _layout.tsx (Tabs + AdminHeader) and 4 placeholder screens (index/users/sessions/stats) + training/[id] placeholder. Modified app/_layout.tsx RootNavigator to route role-based: admin → /(admin), user → /(tabs). No flashing, no profile race condition. tsc + eslint PASS. No commit.
- B-M3 + B-M7 (Phase B UI Wave B) — Filled Pregled (dashboard) and Statistika (stats) screens with real RPC data (memberSeries, occupancySummary) and useTrainings hooks. 2×2 stat grid, monthly trend chart with green badge, quick-action button on Pregled. Period filter (12m/6m/all), big member figure, secondary metric tiles on Statistika. Loading + error states, ScrollView wrapper, paper bg, no AdminHeader inside screens. Reused StatTile/BarChart/FilterChips. Inline helpers: MONTHS_LC, DAY_ABBR, monthAbbrevFrom, getTodayEnum, trendPercent. tsc --noEmit PASS; eslint PASS. No commit.
- B-M4 + B-M5 + B-M6 (Phase B UI Wave C) — Implemented three admin screens (Korisnici, Treninzi, training form [id]). Users screen: load listUsers(), search/filter (svi/aktivni/admini), FlatList of UserRow, edit Modal with stepper for max_sessions_per_week, delete with confirm, re-fetch on mutations. Sessions screen: FlatList with day selector (FilterChips PON–SUB), SessionRow with toggle open/close, real-time re-fetch, empty state text. Form screen (outside tabs): nav bar with back/title, full form with day chips, time/duration row, room/max-participants stepper, status card with Toggle. Validate title/time/max_participants, await upsertSession → fetchTrainings → router.back(). All screens use real services (listUsers, updateUser, deleteUser, setSessionOpen, upsertSession), no new deps, no AdminHeader in tab screens. tsc --noEmit PASS; eslint PASS. No commit.
- C-A1/A2/A3/A4 (Phase C Group A — Login & Auth) — Fixed keyboard handling in login (KeyboardAvoidingView + ScrollView), built register + forgot-password screens, added register/resetPassword methods to AuthContext, reworked routing to support auth screens + role-based redirect without bouncing shared routes (profile modal). Tagline removed. tsc --noEmit PASS; eslint PASS. No commit.
- C2 (Phase C Group C #2 — Android status bar overlap) — Wrapped app with SafeAreaProvider + StatusBar style="dark" in RootLayout. Applied useSafeAreaInsets to Header, AdminHeader, and training form navBar (paddingTop: insets.top + existing base). Wrapped auth screens (login/register/forgot-password) with SafeAreaView edges={["top"]} and reduced hardcoded paddingTop from 30 to 16. tsc --noEmit PASS; eslint PASS. No commit.
- C-B1/B3/D5/B4/B5/B2 (Phase C Group B — Admin UX + Profile) — (S12) Removed SALA/TRAJANJE fields from training form; passes room:null, duration_min:null to upsertSession. Added masked time input (HH:MM) with formatTime helper; validates on save (00–23:MM 00–59); shows Alert if invalid. Removed hardcoded "60 min" and "Sala A" from TrainingCard; category now "Grupni". Equal-height stat tiles: added flex:1 to StatTile, alignItems:"stretch" to tileRow/secondaryRow in Pregled + Statistika. Edit-user modal: added Aktivan toggle, initializes from user.enabled??true, included in updateUser patch. Profile: role-aware (isAdmin flag); admins see minimal profile+ADMIN badge+logout; members see read-only limit "{bookedCount}/{max} ove nedelje" (no updateProfile call); logout button works for both roles. tsc --noEmit PASS; eslint PASS. No commit.

## Gotchas
- npm cache permission issue (`/Users/uros/.npm/_cacache`) prevented `npx` direct invocation; worked around using `npm_config_cache=/tmp/perunapp-npm-cache`.
- Codex timed out mid-execution on T5 but the patch WAS applied before timeout. Final DONE signal not reached, but verification confirms work is complete.
- T8: Codex correctly avoided throwing errors (which would bubble into un-awaited onPress) by catching + Alert + return pattern. TrainingCard callers safe without modification.
- T9: useMemo removal was simpler than useCallback wrapping handlers; context consumers re-render on provider render anyway.
- B-M8/B-M2/B-M1: First two invocations of Codex with combined prompt timed out during analysis phase (Codex reasoning loop is slow on large specs). Split into two focused prompts: (1) components-only (v3 with inline code templates), (2) routing+screens. Both succeeded. ESLint warning on router hook dependency added router to deps array (standard pattern, common in auth routing).
- B-M3/B-M7: Codex successfully verified tsc + eslint in sandbox, reported DONE. No issues on actual tsc/eslint runs in local env. Both screens load from real RPCs; no hardcoded mock values. Occupancy data null-guarded on both screens.
- B-M4/M5/M6: Codex timed out (exit 144) on first attempt with large combined prompt. Fell back to direct code writing (Mikey writes, not Codex). Users.tsx and sessions.tsx were auto-formatted by eslint on disk write. Form screen [id].tsx was already fully implemented in Wave A placeholders. All three screens verified: tsc --noEmit PASS, eslint PASS on app/(admin) + src/components/admin.
- C-A (Phase C Group A): Codex timed out mid-execution on first attempt (exit 143), but patches were already applied to login.tsx before timeout (KeyboardAvoidingView + ScrollView + routing changes visible). Codex also updated AuthContext successfully before timeout. Fell back to direct code writing for register.tsx, forgot-password.tsx, and _layout.tsx routing logic. All files verified tsc + eslint PASS.
- C2: Codex executed cleanly (no timeout), completed all changes in one pass. Used mixed approach: useSafeAreaInsets for headers/form (component-level hook), SafeAreaView wrapper for auth screens (simpler than hook in each screen). All files verified tsc + eslint PASS.
- C-B (Phase C Group B, S12): Codex executed cleanly on combined 6-task prompt (B1/B3/D5/B4/B5/B2). No timeout. Reported DONE with token usage 70k. All changes applied in one pass. Verified tsc + eslint PASS post-execution. No issues.

## Design system reuse notes
- All screens use existing Colors, Radii, Spacing, Shadows, Typography constants.
- No new tokens, no gradients (RN limitation), no new dependencies.
- Register and forgot-password screens copy login's field styles exactly (emailInput, passwordField, passwordFieldFocused, etc.)
- Both auth screens use KeyboardAvoidingView behavior="padding" + ScrollView for keyboard handling
- Register form shows IME/PREZIME/EMAIL/LOZINKA fields with show/hide toggle on password
- Forgot-password shows single EMAIL field with neutral success message
- SafeAreaView + StatusBar style="dark" ensures top bar does not overlap system status bar (Android clock/battery visible on cream paper bg)
- Phase C Group B: Time masking uses inline formatTime helper (no new utility file). Training form no longer stores room/duration state; passes null to backend RPC. StatTile gains flex:1 for equal-height grid rows. Profile role-check uses isAdmin boolean derived from profile.role.

## Routing logic in app/_layout.tsx (Phase C update)
- Added "register" and "forgot-password" to publicAuthRoutes list
- Separated "shared" routes (profile modal) from auth routes; both admins and members can access shared routes without bounce
- Guard flow:
  - if loading → spinner
  - if session && !profile → spinner, no redirect (wait for profile)
  - if !session && !inAuthRoute → router.replace("/login")
  - if session && profile:
    - if inShared → do nothing (allow both roles)
    - if admin: bounce from publicAuthRoutes or "(tabs)" → "/(admin)"
    - if member: bounce from publicAuthRoutes or "(admin)" → "/(tabs)"

## RPC/Service layer notes (unchanged from B waves)
- memberSeries, occupancySummary, useTrainings, listUsers, updateUser, deleteUser, setSessionOpen, upsertSession (all RPC calls, real operations)
- Both tab screens + form use real data flows; no mock values, no stale state
- Error handling: Alert.alert on catch, always re-fetch to resync after mutation
- Loading states: ActivityIndicator rendered during fetch; buttons disabled while submitting
- C-B (S12): updateUser now includes optional `enabled` field in UpdateUserPatch (backend already supports it from admin_update_user RPC param p_enabled). Training form upsertSession always passes room:null, duration_min:null.

## Safe-area inset strategy (C2)
- SafeAreaProvider wraps RootLayout (below font gate, above AuthProvider)
- StatusBar style="dark" ensures Android status bar icons are visible on paper bg
- Headers use useSafeAreaInsets hook: paddingTop: insets.top + 10 (extends bg under status bar)
- Auth screens use SafeAreaView edges={["top"]} wrapper: simpler, avoids hook clutter in each screen
- Form nav uses useSafeAreaInsets hook: paddingTop: insets.top + 16 (consistent with headers, no AdminHeader)
- profile.tsx already had SafeAreaView edges={["top", "bottom"]}, left unchanged

## Phase C Group B changes (S12) — File-by-file summary
- app/(admin)/training/[id].tsx: Removed room/durationMin state + UI fields. Added TIME_PATTERN regex + formatTime helper. VREME field uses keyboardType="number-pad", onChangeText formatTime, validates on submit (HH:MM, 00–23:MM 00–59). Always passes room:null, duration_min:null to upsertSession.
- src/components/TrainingCard.tsx: Removed duration <Text> line; timeBlock now only renders time (no padding/marginTop adjustments needed, looks centered). Category changed from "Grupni · Sala A" to "Grupni". Removed unused duration and fullMeta style definitions.
- src/components/admin/StatTile.tsx: Added flex:1 to tile style for equal-height grid cells.
- app/(admin)/(tabs)/index.tsx (Pregled): tileRow added alignItems:"stretch"; tileCell already flex:1. Grid rows now equalize height when labels wrap.
- app/(admin)/(tabs)/stats.tsx (Statistika): secondaryRow added alignItems:"stretch"; secondaryTile added flex:1 + minWidth:0. Secondary tiles now match tallest in row.
- app/(admin)/(tabs)/users.tsx: Added enabled state (init openEditModal from user.enabled??true). Modal has new toggleRow with Aktivan label + Toggle. saveUser patch includes enabled field.
- app/profile.tsx: Added isAdmin constant from profile.role==="admin". Identity section shows ADMIN chip for admins, ČLAN for members. Stats/limit/booking wrapped in !isAdmin conditional (members only). Limit section changed from editable stepper to read-only display "{bookedCount} / {max} ove nedelje". Logout button remains and works for both roles.
