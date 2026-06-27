# Session 7 — Michelangelo — 2026-06-27

## Task
B-M8 + B-M2 + B-M1 — Admin UI Wave A (components, routing, screens)

## Files created/modified

### New — src/components/admin/ (7 components + barrel)
- `AdminHeader.tsx` — top bar with emblem, PERUN wordmark, ADMIN badge (burgundyTint/burgundy), navy avatar
- `StatTile.tsx` — reusable stat card (figure, label, optional delta)
- `BarChart.tsx` — custom vertical bar chart, gold/burgundy colors, goldTint highlight per bar
- `Toggle.tsx` — pill switch (46×27, burgundy on / #DDD3C7 off, knob animation via left pos)
- `FilterChips.tsx` — generic T extends string, active burgundy/white, inactive surface/fieldBorder
- `UserRow.tsx` — admin user card, expandable, avatar tint rotation [sage, gold, burgundy], shows role or weekly limit
- `SessionRow.tsx` — session card with time/duration, booked count, is_open toggle, closed state (surfaceMuted + Zatvoreno)
- `index.ts` — barrel export of all 7

### New — app/(admin)/ (route group + 5 screens)
- `_layout.tsx` — Tabs layout: Pregled/Korisnici/Treninzi/Statistika (4 tabs) + training/[id] hidden tab
  - TabBar: height 70, white .97 rgba, top border Colors.border, ~24 bottom padding
  - Active: burgundy, inactive #B3A9B2, Hanken 700 11px labels
  - Icons: Feather (grid, users, calendar, bar-chart-2)
  - Wraps AdminHeader at top, flex 1 paper bg
- `index.tsx` — Pregled placeholder
- `users.tsx` — Korisnici placeholder
- `sessions.tsx` — Treninzi placeholder
- `stats.tsx` — Statistika placeholder
- `training/[id].tsx` — Training detail placeholder (not a tab, href: null)

### Modified — app/_layout.tsx
- RootNavigator: added `profile` from useAuth()
- useEffect deps: added profile, router
- Logic: waits for session && profile before routing (no flash of wrong stack)
- Branch: profile.role === "admin" → router.replace("/(admin)"), else → router.replace("/(tabs)")
- Stack: added <Stack.Screen name="(admin)" /> before profile modal
- RootLayout: no changes (fonts/SplashScreen untouched)

## Definition of Done — VERIFIED

- [x] All B-M8 components exist in src/components/admin/ (7 .tsx + 1 index.ts)
- [x] 4 admin screens (index, users, sessions, stats) + training/[id] placeholder in app/(admin)/
- [x] app/(admin)/_layout.tsx with Tabs + AdminHeader, correct tab bar styling
- [x] app/_layout.tsx RootNavigator: role-based routing (admin → /(admin), user → /(tabs))
- [x] `npx tsc --noEmit` — PASS (no errors)
- [x] `npx eslint app src/components/admin` — PASS (no new errors after adding router to deps)

## Notes

### Codex invocations
1. First combined prompt (B-M8 + B-M2 + B-M1) timed out during analysis.
2. Second smaller prompt (B-M8 only) timed out during analysis.
3. Third invocation: split into (1) components-only with inline code templates (v3.md) — SUCCESS, (2) routing+screens (prompt-routing.md) — SUCCESS.
   - Lesson: Codex reasoning loop is slow on large, multi-step specs. Prefer smaller, more direct prompts with code templates inline.

### Design compliance
- All components use existing Colors, Radii, Spacing, Shadows, Typography from constants.
- No new dependencies (Feather from @expo/vector-icons already installed).
- No expo-linear-gradient; BarChart uses solid Colors.gold + goldTint highlight sub-View (visual approximation).
- SessionRow.tsx imports and uses Toggle.tsx (component composition, not duplication).
- UserRow avatar tint: [Colors.sage, Colors.gold, Colors.burgundy][tintIndex % 3].
- Admin avatar navy bg (vs member burgundy) per README frames 05–09.
- ADMIN badge: burgundyTint bg, burgundyBorder 1px, burgundy text (Hanken 9/800), radius 6, padding 3×6.

### Routing behavior
- No profile race condition: waits for profile to load before redirecting.
- Consistent: if already on correct role-stack, no redirect (segments check).
- Loading spinner shown while session and profile resolve.
- Member profile → /(tabs), admin → /(admin), not on login → login.

### What's NOT done (for next waves)
- Screens are placeholders; no data fetching or real UI yet (Wave B/C).
- No user edit/delete modals (Wave B).
- No session create/edit form (Wave B).
- No "Novi" action button wiring.
- Stats screens show placeholder only.

## Diff summary
- 14 files created
- 1 file modified (app/_layout.tsx)
- ~1200 lines added
- 0 lines removed (no refactoring of member code)

## Status
DONE. Ready for Leonardo to dispatch next wave (B-M3 onward: actual screen content).
