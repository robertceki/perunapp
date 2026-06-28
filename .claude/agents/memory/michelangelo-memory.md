# Michelangelo — Memory

## Session counter
Current session: 17
Last log: /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/runs/P4b-mikey.md

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
- C-D6 (Phase C Group D #6 — Slot popularity in Statistika) — (S13) Added "Popularnost termina" section to stats.tsx. Loads slotPopularity(selectedPeriod) alongside memberSeries + occupancySummary in Promise.all(), re-fetches when period chip changes. Renders white card (Radii.tile[18], Shadows.card, padding 16) with micro-label "POPULARNOST TERMINA" and subtitle "Najtraženiji termini" (inkMuted). Top 8 slots rendered as rows: left = "{DAY_ABBR[day_of_week]} · {time}" (Hanken 13/600, ink), right = bookings count (Bricolage 26/800, ink) + thin proportional bar beneath (height 3px, Colors.gold fill on Colors.track bg). Empty state: "Još nema podataka o prijavama." (centered, muted). Loading: folded into existing screen-level ActivityIndicator. Placed after secondaryRow. All existing sections untouched. tsc --noEmit PASS; eslint PASS. No commit.
- P2 Web (S14) — Auth context + routing + auth screens (React web). Ported AuthContext from root (getSession, onAuthStateChange, fetchProfile, login/logout/register/resetPassword/updateProfile). Created web/src/contexts/AuthContext.tsx (exports AuthProvider) + web/src/hooks/useAuth.ts (exports useAuth hook). Replaced web/src/App.tsx with full routing: BrowserRouter → AuthProvider → AppRoutes (loading spinner gate, PublicOnly/RequireMember/RequireAdmin guards, 3 auth screens + 3 placeholder screens). Built LoginScreen.tsx (emblem/wordmark hero, email+password fields with show/hide, gold focus ring, error text, "Prijavi se" button, "Zaboravljena lozinka?" link, footer with /register link). RegisterScreen.tsx (IME/PREZIME/EMAIL/LOZINKA fields, "Napravi nalog" button, link to /login). ForgotPasswordScreen.tsx (EMAIL only, "Pošalji link za reset", neutral success message, link to /login). MemberHome.tsx, AdminHome.tsx, ProfilePlaceholder.tsx (minimal placeholders with logout button). All screens: min-h-[100dvh], safe-area padding via env(), Tailwind brand tokens (bg-paper, text-ink, rounded-input, border-field-border, font-display, font-sans). No new dependencies. No `any` types. TypeScript strict. npm run build PASS (tsc -b + vite build), npm run lint PASS (oxlint clean).
- P3 Web (S15) — Member app full rewrite: TrainingContext (fetch gated on session, getTrainingsByDay, joinSession/leaveSession with RPC + refetch, error handling returns error object not throw), useTrainings hook, ToastContext (dependency-free, fixed bottom, auto-dismiss 3s, safe-area aware), Header (emblem + "PERUN" + avatar button→/profile), DayFilter (Mon-Sat week selector with active burgundy pill), AlertBar (normal state with progress track, limit-reached state with "!" icon + message), TrainingCard (all booking states: available/booked/full/limit-reached, avatar stack, error→toast), EmptyDay (dashed card with emblem + text), MemberHome (Header + greeting + DayFilter + AlertBar + section header + TrainingCard list/EmptyDay fallback), Profile (member-only: back link + identity avatar + stat tiles + read-only weekly limit card + booked sessions list + logout button). App.tsx: MemberProviders wrapper (ToastProvider + TrainingProvider) around member routes. All components: Tailwind v4 brand tokens, no hardcoded colors, no `any` types, no RN imports. npm run build PASS (tsc -b + vite build 161ms), npm run lint PASS (oxlint clean). No issues.
- P4a Web (S16) — Admin shell + nav + shared components + Pregled & Statistika (web). Restructured routing: RequireAdmin wraps AdminLayout (not just AdminHome). AdminLayout: flex column min-h-[100dvh], AdminHeader at top (safe-area padding + ADMIN badge + navy avatar), scrollable Outlet in middle, fixed bottom TabBar (height 70px, 4 tabs: Pregled/Korisnici/Treninzi/Statistika, NavLink with end prop, lucide icons). Shared components: StatTile (figure+label+delta, h-full for equal-height grid), BarChart (gold/burgundy gradient bars, current value label), Toggle (burgundy ON / #DDD3C7 OFF pill), FilterChips (generic period/status selector). Pregled.tsx: loads memberSeries(6) + occupancySummary("6") + useTrainings() on mount, role-guarded (profile.role === "admin" only). Renders: greeting, 2×2 stat grid (aktivnih/popunjenost/treninga/otvoreni_slotovi), trend card with bar chart + green %, "＋ Novi trening" quick action. Statistika.tsx: Period FilterChips (12/6/all), loads memberSeries + occupancySummary + slotPopularity in Promise.all() on period change. Renders: title, members chart card (latest figure + % badge), secondary tiles (NOVIH/MES., PROS.POPUNJ. + top day), "POPULARNOST TERMINA" section (top 8 slots with proportional bars). Placeholder screens: Korisnici, Treninzi, TrainingForm (title + stub text, P4b). App.tsx: RequireAuthenticated wrapper (gates /profile + admin routes), AppProviders (ToastProvider + TrainingProvider for both member + admin). All files: no `any`, no RN imports, Tailwind v4 tokens only. npm run build PASS (vite 229ms), npm run lint PASS (oxlint clean).
- P4b Web (S17) — Admin CRUD screens: Korisnici (list/search/filter/edit/delete), Treninzi (day selector + sessions + toggle open/close), TrainingForm (create/edit with masked time). Codex timed out (exit 143) on combined prompt; fell back to direct code writing. Implemented:
  - Korisnici.tsx: load listUsers(), search (first_name+last_name+email), FilterChips (Svi/Aktivni/Admini), UserRow list, edit Modal (IME/PREZIME/ULOGA/MAKS.SESIJA/Aktivan), delete confirm dialog, error/loading states
  - Treninzi.tsx: header + day selector (FilterChips PON–SUB), SessionRow list with toggle open/close + onClick navigate to form, empty state, loading spinner
  - TrainingForm.tsx: nav bar + fields (NAZIV/DAN/VREME masked HH:MM/MAKS.UČESNIKA/Status toggle), validation (title required, valid HH:MM 00–23:00–59, max>=1), sticky footer, upsertSession + fetchTrainings + navigate to Treninzi
  - App.tsx: route updated from /admin/training/new to /admin/training/:id (supports both create + edit)
  - All screens: role-guarded, Tailwind v4 tokens, no new deps, strict TS
  - DoD: npm run build PASS (tsc -b + vite 206ms), npm run lint PASS (oxlint clean)

## Gotchas
- npm cache permission issue (`/Users/uros/.npm/_cacache`) prevented `npx` direct invocation; worked around using `npm_config_cache=/tmp/perunapp-npm-cache`.
- Codex timed out mid-execution on T5 but the patch WAS applied before timeout. Final DONE signal not reached, but verification confirms work is complete.
- T8: Codex correctly avoided throwing errors (which would bubble into un-awaited onPress) by catching + Alert + return pattern. TrainingCard callers safe without modification.
- T9: useMemo removal was simpler than useCallback wrapping handlers; context consumers re-render on provider render anyway.
- B-M8/B-M2/B-M1: First two invocations of Codex with combined prompt timed out during analysis phase (Codex reasoning loop is slow on large specs). Split into two focused prompts: (1) components-only (v3 with inline code templates), (2) routing+screens. Both succeeded. ESLint warning on router hook dependency added router to deps array (standard pattern, common in auth routing).
- B-M3/B-M7: Codex successfully verified tsc + eslint in sandbox, reported DONE. No issues on actual tsc/eslint runs in local env. Both screens load from real RPCs; no hardcoded mock values. Occupancy data null-guarded on both screens.
- B-M4/M5/M6: Codex timed out (exit 144) on first attempt with large combined prompt. Fell back to direct code writing (Mikey writes, not Codex). Users.tsx and sessions.tsx were auto-formatted by eslint on disk write. Form screen [id].tsx was already fully implemented in Wave A placeholders. All three screens verified: tsc --noEmit PASS, eslint PASS on app/(admin) + src/components/admin.
- C-A (Phase C Group A): Codex timed out mid-execution on first attempt (exit 143), but patches were already applied to login.tsx before timeout (KeyboardAvoidingView + ScrollView + routing changes visible). Codex also updated AuthContext successfully before timeout. Fell back to direct code writing for register.tsx, forgot-password.tsx, and _layout.tsx routing logic. All files verified tsc + eslint PASS.
- C2: Codex executed cleanly (no timeout), completed all changes in one pass. Used mixed approach: useSafeAreaInsets for headers/form (component-level hook), SafeAreaView wrapper for auth screens (simpler, avoids hook clutter in each screen). All files verified tsc + eslint PASS.
- C-B (Phase C Group B, S12): Codex executed cleanly on combined 6-task prompt (B1/B3/D5/B4/B5/B2). No timeout. Reported DONE with token usage 70k. All changes applied in one pass. Verified tsc + eslint PASS post-execution. No issues.
- C-D6 (Phase C Group D, S13): Codex executed cleanly. Single surgical change to stats.tsx: added slotPopularity RPC to Promise.all(), added slots state, rendered new popularityCard section with top 8 slots, proportional bar, empty state. All existing sections untouched. Verified tsc + eslint PASS post-execution. No issues.
- P2 Web (S14): Codex executed successfully, generated log truncated but all 8 files created (AuthContext, useAuth hook, App.tsx with guards, 3 auth screens, 3 placeholder screens). Local verification: npm run build PASS (tsc -b + vite build in 226ms), npm run lint PASS (oxlint clean, no output = no errors).
- P3 Web (S15): Codex executed successfully (83k tokens, ~5min runtime). All 13 files created/modified: TrainingContext, useTrainings, ToastContext, useToast, week.ts utility; Header, DayFilter, AlertBar, TrainingCard, EmptyDay components; MemberHome + Profile screens; updated App.tsx with provider nesting. Codex verified tsc + eslint in sandbox. Local verification: npm run build PASS (tsc -b + vite build 161ms), npm run lint PASS (oxlint clean). No issues.
- P4a Web (S16): Codex executed successfully (93k tokens, ~5min runtime). All 13 files created: AdminLayout, AdminHeader, TabBar, StatTile, BarChart, Toggle, FilterChips components; Pregled, Statistika, Korisnici, Treninzi, TrainingForm screens. Updated App.tsx routing with RequireAuthenticated wrapper, AdminLayout with nested tabs, AppProviders for admin+member. Codex reported DONE. Local verification: npm run build PASS (vite 229ms), npm run lint PASS (oxlint clean). No issues.
- P4b Web (S17): Codex timed out (exit 143) on first invocation with combined prompt (large file list + §6/§7/§8 design spec). No patches applied before timeout (unlike T5/C-A). Fell back to direct code writing per established pattern (sessions 12–14). Implemented 3 screens (Korisnici/Treninzi/TrainingForm) + routing update manually. Fixed React hooks rules violation (hooks must be called unconditionally before guard returns); moved guard logic to component body instead of early return. DoD verified locally: npm run build PASS (tsc -b + vite 206ms), npm run lint PASS (oxlint clean).

## Design system reuse notes
- All screens use existing Colors, Radii, Spacing, Shadows, Typography constants.
- No new tokens, no gradients (RN limitation), no new dependencies.
- Register and forgot-password screens copy login's field styles exactly (emailInput, passwordField, passwordFieldFocused, etc.)
- Both auth screens use KeyboardAvoidingView behavior="padding" + ScrollView for keyboard handling
- Register form shows IME/PREZIME/EMAIL/LOZINKA fields with show/hide toggle on password
- Forgot-password shows single EMAIL field with neutral success message
- SafeAreaView + StatusBar style="dark" ensures top bar does not overlap system status bar (Android clock/battery visible on cream paper bg)
- Phase C Group B: Time masking uses inline formatTime helper (no new utility file). Training form no longer stores room/duration state; passes null to backend RPC. StatTile gains flex:1 for equal-height grid rows. Profile role-check uses isAdmin boolean derived from profile.role.
- Phase C Group D: Slot popularity card reuses existing card styling (Colors.surface, Colors.border, Radii.tile[18], Shadows.card, Spacing.cardPadding). DAY_ABBR map already exists in stats.tsx; no new map. Proportional bar uses Colors.gold (fill) + Colors.track (bg). No new color tokens or spacing values introduced.
- P2 Web: Tailwind v4 brand theme (@theme in index.css) provides all token utilities (bg-paper, text-ink, rounded-input, font-display, font-sans, etc.). Auth screens use px-[30px] (inline equivalent for design 30px padding). Focus ring on password: gold (`focus:ring-gold/15` = rgba(198,163,92,.14)). No new Tailwind config values added.
- P3 Web: All member components (Header, DayFilter, AlertBar, TrainingCard, EmptyDay, MemberHome, Profile) use Tailwind v4 brand tokens exclusively. Toast uses bg-ink (dark pill) with white text. TrainingCard avatar palettes use existing colors (sage-tint/gold-tint/burgundy-tint). DayFilter active pill uses rounded-chip (20px radius). Current week dates computed using Europe/Belgrade timezone (getCurrentWeekDates utility in lib/week.ts). No hardcoded hex values anywhere; all design tokens from index.css @theme.
- P4a Web: AdminHeader uses safe-area top padding (env). TabBar: fixed bottom, height 70px, safe-area bottom inset. All admin components reuse StatTile/BarChart/Toggle/FilterChips patterns. Pregled + Statistika load real admin RPCs (memberSeries, occupancySummary, slotPopularity). No new Tailwind tokens; all from v4 brand theme (bg-linear-to-t gradient for bars, text-burgundy active, text-[#B3A9B2] inactive, etc.).
- P4b Web: Korisnici/Treninzi/TrainingForm follow same Tailwind v4 token pattern. Search icon from lucide-react. Edit modal uses backdrop blur (bg-black/30) + z-50. UserRow tint rotation cycles sage/gold/burgundy by index mod 3. SessionRow styling: white card (radius 18), closed state = bg-surface-muted + muted text. Time input uses formatTimeInput helper (inline strips non-digits, auto-inserts ":" after 2 digits). All buttons use rounded-input + font-semibold. No hardcoded colors except inline hex for red delete button (#C0341B). All borders use field-border/border tokens.

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

## Web routing logic in web/src/App.tsx (P2)
- BrowserRouter wraps entire app; AuthProvider inside
- AppRoutes component gates with full-screen spinner if loading OR (session && !profile)
- Three guard route-elements: PublicOnly, RequireMember, RequireAdmin
- PublicOnly: if session && profile → redirects to "/" (or "/admin" if admin role) else allows <Outlet>
- RequireMember: if !session → "/login"; if admin → "/admin"; else allows <Outlet>
- RequireAdmin: if !session → "/login"; if not admin → "/"; else allows <Outlet>
- Routes: /login, /register, /forgot-password (PublicOnly); "/" + "/profile" (RequireMember); "/admin" (RequireAdmin); "*" → "/"
- No imperative navigation in useEffect; all guards use <Navigate replace>. Avoids race conditions from earlier Expo app.

## Web routing logic in web/src/App.tsx (P3 update)
- Added MemberProviders wrapper component (between RequireMember guard and outlet)
- MemberProviders: ToastProvider (outer) → TrainingProvider (inner, receives session + profile from useAuth) → <Outlet>
- Member routes ("/" and "/profile") now render inside MemberProviders, so both useToast + useTrainings available
- AdminHome route remains unwrapped (admin doesn't use training context)
- Toast rendered inside ToastProvider at fixed bottom, auto-dismiss 3s, safe-area aware (pb includes env(safe-area-inset-bottom))

## Web routing logic in web/src/App.tsx (P4a update)
- Renamed MemberProviders to AppProviders; now wraps both member AND admin routes
- RequireAuthenticated guard (new): gates /profile + /admin routes; redirects /login if no session
- Routing tree:
  - PublicOnly: /login, /register, /forgot-password
  - RequireAuthenticated → AppProviders (ToastProvider + TrainingProvider):
    - RequireMember → /
    - /profile (no RequireMember guard; both roles can access)
    - RequireAdmin → /admin (AdminLayout):
      - index → Pregled
      - users → Korisnici
      - sessions → Treninzi
      - stats → Statistika
    - /admin/training/new → TrainingForm (outside AdminLayout, no tab bar)
- AppProviders applies ToastProvider + TrainingProvider to admin routes too, enabling admin to call useToast/useTrainings in P4b
- No race conditions; RequireAuthenticated waits for profile before rendering

## Web routing logic in web/src/App.tsx (P4b update)
- Changed route from `/admin/training/new` to `/admin/training/:id`
- Now supports both "/admin/training/new" (isNew=true, create) and "/admin/training/{sessionId}" (isNew=false, edit/view)
- TrainingForm useParams({ id = "new" }) extracts id with default; checks id==="new" to set isNew flag
- On edit: loads session from useTrainings().trainings context by id; if not found & !isNew → error page
- On save: upsertSession passes id: isNew ? null : id to backend

## RPC/Service layer notes (unchanged from B waves)
- memberSeries, occupancySummary, useTrainings, listUsers, updateUser, deleteUser, setSessionOpen, upsertSession (all RPC calls, real operations)
- Both tab screens + form use real data flows; no mock values, no stale state
- Error handling: Alert.alert on catch, always re-fetch to resync after mutation
- Loading states: ActivityIndicator rendered during fetch; buttons disabled while submitting
- C-B (S12): updateUser now includes optional `enabled` field in UpdateUserPatch (backend already supports it from admin_update_user RPC param p_enabled). Training form upsertSession always passes room:null, duration_min:null.
- C-D6 (S13): slotPopularity RPC call already exists in src/services/admin/stats.ts (exports function slotPopularity(period: string): Promise<SlotPopularity[]>). Returns pre-sorted array (by bookings desc). Type SlotPopularity defined in src/services/admin/types.ts.
- P3 Web: TrainingContext fetches from supabase.from("sessions").select(...session_participants...). join_session RPC returns error if: weekly_limit_reached, session_full, session_closed, already_joined, not_authenticated, account_inactive, session_not_found (all mapped to Serbian messages in bookingErrorMessages). leaveSession deletes from session_participants table. Both return error object (not throw) to caller; TrainingCard catches + shows via useToast.
- P4a Web: Admin screens guard RPC calls on profile?.role === "admin" (defensive check). Pregled loads memberSeries(6) + occupancySummary("6") on mount. Statistika loads memberSeries(months) + occupancySummary + slotPopularity in Promise.all() on period change. All calls exported from web/src/services/admin/stats.ts.
- P4b Web: Korisnici calls listUsers(), updateUser(id, patch with first_name/last_name/role/max_sessions_per_week/enabled), deleteUser(id). Treninzi calls setSessionOpen(sessionId, open) on toggle. TrainingForm calls upsertSession({ id, title, day_of_week, time, room: null, duration_min: null, max_participants, is_open }). All calls wrapped in try/catch with showToast on error.

## Safe-area inset strategy (C2)
- SafeAreaProvider wraps RootLayout (below font gate, above AuthProvider)
- StatusBar style="dark" ensures Android status bar icons are visible on paper bg
- Headers use useSafeAreaInsets hook: paddingTop: insets.top + 10 (extends bg under status bar)
- Auth screens use SafeAreaView edges={["top"]} wrapper: simpler, avoids hook clutter in each screen
- Form nav uses useSafeAreaInsets hook: paddingTop: insets.top + 16 (consistent with headers, no AdminHeader)
- profile.tsx already had SafeAreaView edges={["top", "bottom"]}, left unchanged

## Web safe-area inset strategy (P2+P3)
- Used inline style={{ paddingTop: "max(30px, env(safe-area-inset-top))" }} on auth screens (LoginScreen, RegisterScreen, ForgotPasswordScreen).
- Placeholder screens (MemberHome, AdminHome, ProfilePlaceholder) use style={{ paddingTop: "env(safe-area-inset-top)" }} (no max fallback; design expects body padding).
- App.tsx spinner gate uses min-h-[100dvh] + Tailwind flexbox (no explicit safe-area; spinner centered regardless).
- P3 Web: MemberHome uses no explicit top safe-area (body/html handles it). Profile uses style={{ paddingTop: "env(safe-area-inset-top)" }}. Header uses style={{ paddingTop: "calc(env(safe-area-inset-top) + 10px)" }}. Toast uses pb-[calc(16px+env(safe-area-inset-bottom))] to sit above home indicator on iPhone.
- P4a Web: AdminHeader uses style={{ paddingTop: "calc(env(safe-area-inset-top) + 10px)" }}. TabBar uses pb-[env(safe-area-inset-bottom)], height h-[calc(70px+env(safe-area-inset-bottom))]. AdminLayout Outlet uses pb-[calc(70px+env(safe-area-inset-bottom))] to avoid content overlap.
- P4b Web: TrainingForm uses style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}. Korisnici/Treninzi use px-5 pt-5 pb-24 (no explicit safe-area top; admin flows don't require it; bottom pb avoids TabBar overlap).

## P4a Web files summary
- web/src/App.tsx: 130 lines. Updated routing: RequireAuthenticated wraps /profile + admin routes. AppProviders (renamed from MemberProviders) applies ToastProvider + TrainingProvider to both member + admin. AdminLayout nested under RequireAdmin with index routes: /admin→Pregled, /admin/users→Korisnici, /admin/sessions→Treninzi, /admin/stats→Statistika. TrainingForm at /admin/training/new outside AdminLayout.
- web/src/components/admin/AdminHeader.tsx: 42 lines. Top bar: emblem 30×30 + "PERUN" (font-display, tracking-[0.12em], burgundy) + "ADMIN" badge (rounded-[6px], small, burgundy on burgundyTint). Avatar link (navy bg, initials) → /profile. Safe-area top padding via env().
- web/src/components/admin/TabBar.tsx: 48 lines. Fixed bottom nav, height 70px. 4 NavLink tabs: Pregled (end=true), Korisnici, Treninzi, Statistika with lucide icons (LayoutGrid, Users, Calendar, BarChart2). Active = font-bold text-burgundy, inactive = font-semibold text-[#B3A9B2]. Safe-area bottom inset.
- web/src/components/admin/StatTile.tsx: 27 lines. Props: figure, label, figureColor, delta, deltaColor. White card, h-full for equal-height grids. Figure (Bricolage 26/800), label (11.5/600 muted), optional delta (11/700 colored).
- web/src/components/admin/BarChart.tsx: 61 lines. Props: data (label+value[]), currentIndex, showValueLabelOnCurrent. Bars: gold gradient default, burgundy gradient if current. Height normalized to maxValue. Month labels bottom (Hanken 9/700 faint). Value label above current bar if showValueLabelOnCurrent.
- web/src/components/admin/Toggle.tsx: 30 lines. Pill switch: burgundy bg ON, #DDD3C7 OFF. Knob 21×21 white circle, slide animation. Role="switch" aria-checked.
- web/src/components/admin/FilterChips.tsx: 35 lines. Generic pills: active = burgundy bg + surface text, inactive = surface bg + ink text. options array of {key, label}. onClick → onChange(key).
- web/src/screens/admin/AdminLayout.tsx: 16 lines. Flex column min-h-[100dvh]: AdminHeader at top, scrollable Outlet (pb to avoid tab bar overlap), fixed TabBar at bottom.
- web/src/screens/admin/Pregled.tsx: ~180 lines. Load on mount: memberSeries(6) + occupancySummary("6") + useTrainings. Role guard (profile?.role === "admin"). Render: greeting "Zdravo, Admin", 2×2 stat grid (members/popunjenost/weekly trainings/open today), trend card "ČLANOVI PO MESECU" with bar chart + green %, quick action "＋ Novi trening" → /admin/training/new.
- web/src/screens/admin/Statistika.tsx: ~220 lines. Period FilterChips (12/6/all). Load on change: memberSeries + occupancySummary + slotPopularity in Promise.all(). Render: title, members chart (latest figure + % badge), secondary tiles (new/month, avg occupancy + top day), "POPULARNOST TERMINA" (top 8 slots with proportional bars). Role guard.
- web/src/screens/admin/Korisnici.tsx: 213 lines. Load listUsers() on mount, role-guarded. Header + search + FilterChips (Svi/Aktivni/Admini). UserRow list (one expanded at a time, tint index rotates). Edit Modal (IME/PREZIME/ULOGA/MAKS.SESIJA/Aktivan toggle). Delete confirm. Error/loading/empty states. Toast on mutations.
- web/src/screens/admin/Treninzi.tsx: 105 lines. Header "Treninzi" + day date + "＋ Novi" button. Day selector FilterChips PON–SUB. SessionRow list with bookedCount + toggle open/close + onClick navigate to form. Empty state. Loading spinner.
- web/src/screens/admin/TrainingForm.tsx: 265 lines. Nav bar back + title (Novi/Izmena). Fields: NAZIV (text), DAN (chips), VREME (masked HH:MM), MAKS.UČESNIKA (stepper), Status toggle. Validation (title, time format 00–23:00–59, max>=1). Sticky footer (Otkaži/Sačuvaj). On edit: load from context; if not found & !isNew → error page.

## P4b Web additions/updates
- **UserRow.tsx** (already existed from P4a): 102 lines. Props: user, expanded, onToggleExpand, onEdit, onRemove, tintIndex. Avatar (initials, circular, rotating tints). Name/email (truncate) + right chip (Admin or "{limit}× / ned"). Expanded: bg-surface-warm + border-gold, buttons Izmeni (outline burgundy) + Ukloni (outline red #C0341B).
- **SessionRow.tsx** (already existed from P4a): 102 lines. Props: session, bookedCount, onToggleOpen, onClick. Time (Bricolage 17/800) · divider · title (Bricolage 15/700) + sub (sage 12/600). Full → "Popunjeno" chip. Closed → bg-surface-muted + "Zatvoreno" chip. Right: Toggle on/off. Clicking toggle: setSubmitting during RPC, catch → showToast, refetch.
- **Korisnici.tsx**: 213 lines. Hooks (useEffect, useMemo) called before guard. Load listUsers, search filter (first_name+last_name+email), FilterChips logic (Svi/Aktivni/Admini). UserRow with expanded state, tintIndex = idx % 3. Edit modal state, save → updateUser + refetch. Delete confirm state, confirm → deleteUser + refetch.
- **Treninzi.tsx**: 105 lines. Hooks called before guard. useState selectedDay (monday default). getTrainingsByDay(selectedDay) from context. SessionRow onClick → navigate to /admin/training/{id}. onToggleOpen → setSessionOpen + fetchTrainings + showToast.
- **TrainingForm.tsx**: 265 lines. Hooks (useEffect) called before guard. useParams id = "new", isNew = (id === "new"). Load session from context on edit. formatTimeInput() helper (inline). isValidTime() check (regex + range). Save validates + upsertSession + fetchTrainings + navigate. Not found error page if edit session not found.
- **App.tsx**: Route updated `/admin/training/:id` (was `/admin/training/new`). Supports both isNew (create) and edit flows.

## P4a Web improvements (vs P3)
- Routing: AppProviders now wraps both member + admin routes; admin can call useToast/useTrainings in future screens (P4b).
- Admin shell: AdminLayout flex column with scrollable content, fixed bottom TabBar with 4 tabs + lucide icons.
- Shared components: StatTile, BarChart, Toggle, FilterChips reusable across admin screens.
- Real data: Pregled + Statistika load from admin RPCs (memberSeries, occupancySummary, slotPopularity). Period selector in Statistika re-fetches on change.
- No new deps, no `any` types, Tailwind v4 tokens only.

## P4b Web improvements (vs P4a)
- Three admin CRUD screens now fully implemented + wired (Korisnici, Treninzi, TrainingForm)
- Korisnici: search + filter + edit modal + delete confirm, all using real admin RPCs
- Treninzi: day selector + session list with toggle + "Novi" button → form
- TrainingForm: create/edit both supported via dynamic route `/admin/training/:id`; masked time input with validation; sticky footer
- All screens: role-guarded, Tailwind v4 tokens, toast feedback, error/loading states
- React hooks rules compliance: useEffect + useMemo called before guard returns
- No new dependencies; reused UserRow + SessionRow + FilterChips + useTrainings + admin services

