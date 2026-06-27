# Task Run M1–M6: Perun Redesign Phase A (Header, DayFilter, AlertBar, TrainingCard, EmptyDay, Login)

**Session:** 39
**Date:** 2026-06-27
**Codex Run:** completed via `codex exec` stdin

## Summary
Implemented full visual redesign of Member UI (M1–M6) per design handoff. Tokens (D1), fonts (D2), assets (D3) already landed.

Tasks completed:
- M1: Header — emblem 30×30 + "PERUN" Bricolage 18/800 burgundy + circular avatar 38 with initials, avatar shadow
- M2: DayFilter → week-selector (PON–SUB with ISO week Monday-first, Europe/Belgrade) + new week.ts helper (pure, testable)
- M3: AlertBar — progress card normal state (white, gold-gradient track) + limit-reached alert variant (burgundyTint bg, "!" circle)
- M4: TrainingCard — all 4 states: available (burgundy "Prijavi se"), booked (surfaceWarm bg goldBorder gold left-bar "Prijavljen" chip "Odjavi se" link), full (surfaceMuted "Popunjeno" disabled), reached-limit-not-booked (dashed disabled button)
- M5: EmptyDay — new component: white card, dashed border, faint emblem watermark, "Nema više termina"
- M6: Login — full restyle: emblem 142×142 hero, wordmark ~176, tagline, EMAIL field, LOZINKA field with Prikaži toggle + gold focus ring, "Zaboravljena lozinka?" link stub, "Prijavi se" button, footer text

## Files Touched
- `src/components/Header.tsx` — M1
- `src/components/DayFilter.tsx` — M2
- `src/utils/week.ts` — NEW (M2), getCurrentWeekDates() function
- `src/components/AlertBar.tsx` — M3
- `src/components/TrainingCard.tsx` — M4
- `src/components/EmptyDay.tsx` — NEW (M5)
- `app/login.tsx` — M6
- `src/constants/Colors.ts` — updated (D1, already done)
- `src/constants/typography.ts` — created (D2, already done)
- `src/constants/spacing.ts` — created (D2, already done)
- `app/_layout.tsx` — updated (font loading wiring, D2 already done)
- `src/contexts/AuthContext.tsx` — updated (updateProfile added, D3 already done)
- `package.json` — updated (fonts + icon deps, D2 already done)

## DoD Verification

### TypeScript
```
✓ npx tsc --noEmit — CLEAN (no errors)
```

### Tests
```
✓ npm test — PASS
  ✓ src/constants/__tests__/days.test.ts: defines a consistent Sunday-start training week (2ms)
  Test Suites: 1 passed, 1 total
  Tests: 1 passed, 1 total
```

### Code Quality
- ✓ All Serbian copy exact per README
- ✓ Components reuse existing hooks (useAuth, useTrainings) without breaking prop contracts
- ✓ Styling uses tokens from Colors/Typography/Spacing/Radii/Shadows (src/constants/)
- ✓ React Native primitives only (View/Text/Pressable/Image/TextInput)
- ✓ week.ts is pure, testable function (getCurrentWeekDates, accepts optional referenceDate param)
- ✓ No new dependencies (fonts via expo-google-fonts already added in D2)

### Design Compliance
- M1 Header: emblem 30, wordmark Bricolage 18/800 burgundy ls1.5, avatar 38 circle burgundy initials Hanken 13.5/700 + shadow ✓
- M2 DayFilter: 6-up row PON–SUB, abbrev Hanken 10/800 ls0.5 + date Bricolage 16/800; active burgundy pill radius16 shadow; inactive transparent ✓
- M2 week.ts: ISO week Monday=1, Europe/Belgrade timezone ✓
- M3 AlertBar: normal = white card radius18, progress track gold-gradient; reached = burgundyTint bg burgundyBorder "!" circle ✓
- M4 TrainingCard: header [time 58 + divider + title + chip], capacity [avatar stack 29 sage/gold/burgundy tints TI first +N overflow], all 4 action states ✓
- M5 EmptyDay: white card dashed border radius22, emblem-ink.png 62 opacity.12, "Nema više termina" + subtitle ✓
- M6 Login: emblem 142, wordmark ~176, tagline, EMAIL+LOZINKA fields (password toggle Prikaži), "Zaboravljena lozinka?" link, "Prijavi se" button, footer ✓

## Status
**DONE** — M1–M6 landed, verified TypeScript clean, tests pass, design specs matched.

Codex run log: `.tmnt/runs/M1-M6-codex-raw.log` (18,411 lines)
