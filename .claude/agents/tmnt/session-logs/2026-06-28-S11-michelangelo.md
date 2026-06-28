# Session 11 — Michelangelo

## Task: C2 — Android Status Bar Overlap (Phase C Group C)

**Branch:** design_update  
**Run log:** /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/runs/C2-mikey.md

### Summary

Fixed Android status bar overlap by:
1. Adding `SafeAreaProvider` wrapper in app/_layout.tsx RootLayout
2. Adding dark `StatusBar` in app/_layout.tsx RootLayout
3. Using `useSafeAreaInsets()` hook in Header.tsx and AdminHeader.tsx with `paddingTop: insets.top + 10`
4. Wrapping auth screens (login, register, forgot-password) with `SafeAreaView edges={["top"]}` and reducing `paddingTop: 30 → 16` on KeyboardAvoidingView
5. Using `useSafeAreaInsets()` in training form screen [id].tsx with `paddingTop: insets.top + 16`

### Method chosen

**useSafeAreaInsets for headers + form; SafeAreaView wrapper for auth screens.**

- Headers: useSafeAreaInsets allows the backgroundColor (Colors.paper) to extend under the status bar, preventing visual jarring. Dynamic padding inset sits above the 10px base padding.
- Auth screens: SafeAreaView edges={["top"]} is simpler than wrapping every usage of useSafeAreaInsets in each screen. The SafeAreaView wrapper provides automatic inset handling; the backgroundColor extends under status bar. Reduced hardcoded top padding from 30 to 16 for visual balance.
- Form nav: useSafeAreaInsets to be consistent with member/admin headers. Increased from 16 to `insets.top + 16`.

### Files modified

- `app/_layout.tsx` — Added SafeAreaProvider + StatusBar
- `src/components/Header.tsx` — Added useSafeAreaInsets, paddingTop: insets.top + 10
- `src/components/admin/AdminHeader.tsx` — Added useSafeAreaInsets, paddingTop: insets.top + 10
- `app/login.tsx` — Wrapped with SafeAreaView edges={["top"]}, paddingTop: 30 → 16
- `app/register.tsx` — Wrapped with SafeAreaView edges={["top"]}, paddingTop: 30 → 16
- `app/forgot-password.tsx` — Wrapped with SafeAreaView edges={["top"]}, paddingTop: 30 → 16
- `app/(admin)/training/[id].tsx` — Added useSafeAreaInsets, paddingTop: 16 → insets.top + 16

### DoD verification

- `npx tsc --noEmit` ✅ PASS (no output = no errors)
- `npx eslint app src --max-warnings 0` ✅ PASS (no output = no errors)
- No commit ✅ (staging area clean)
- Visual check: pending Android device screenshot (overlap gone, correct on iOS notch)

### Notes

- All auth screens reuse existing Colors.paper, Spacing tokens, Typography
- No new dependencies (react-native-safe-area-context already in package.json v5.6.0)
- Codex execution time: ~41k tokens. Reasoning effort high.
- No errors or timeouts.

### Gotchas for next Mikey

- Android status bar (system clock, battery) needs dark icons to be visible on cream paper background. StatusBar style="dark" is set.
- SafeAreaProvider must wrap auth providers; placement is critical to avoid re-initialization.
- useSafeAreaInsets hook requires component to be inside SafeAreaProvider context, so it's safe inside RootNavigator.
- profile.tsx already used SafeAreaView edges={["top", "bottom"]}, so left unchanged.
