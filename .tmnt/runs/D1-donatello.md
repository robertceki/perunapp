# D1: Design tokens module — Donatello run log

**Task:** Design tokens (Colors, typography, spacing, radii, shadows).
**Dispatch session:** 4
**Codex model:** gpt-5.5
**Status:** DONE

## Summary

Codex created three new token modules as specified:

1. **Colors.ts** (rewritten) — 21 color tokens as typed constant object matching README hex table exactly.
2. **typography.ts** (new) — FontFamilies registry + Typography presets covering 13 text roles.
3. **spacing.ts** (new) — Spacing/Radii/Shadows constants with React Native shadow objects.

All three files pass `npx tsc --noEmit` clean. No files outside scope were touched.

## Colors.ts verification

Hex values match README table:
- paper #FBF7F1
- surface #FFFFFF
- surfaceWarm #FFFDF8
- surfaceMuted #FAF6EF
- ink #221F2B
- inkMuted #8B8192
- inkFaint #9A8FA0
- burgundy #58003D
- burgundyTint #F6E9F0
- burgundyBorder #ECCFDF
- burgundyText2 #9A6385
- gold #C6A35C
- goldDeep #9A7B33
- goldTint #F6EFDF
- goldBorder #E8D9B5
- sage #586056
- sageTint #EAEDE7
- navy #22222A
- border #F0E8DD
- track #EFE7DA
- fieldBorder #ECE2D4

Exported as `Colors` const + `ColorToken` type for consumption.

## typography.ts verification

FontFamilies registry:
- Bricolage: 700 (Bold), 800 (ExtraBold)
- Hanken: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)

Typography presets (16 roles):
- greeting (25/800 ls -0.3)
- screenTitle (25/800 ls -0.3)
- cardTitle (16.5/700 lh 19)
- time (20/800)
- statFigure (27/800)
- sectionLabel (13/700 ls 1.4 uppercase)
- wordmark (18/800 ls 1.5)
- body (14/600)
- fieldText (14.5/600)
- secondary (12/600)
- meta (13.5/600)
- microLabel (11/800 ls 1 uppercase)
- microLabelWide (11/800 ls 1.2 uppercase)
- chip (11/700)
- primaryButtonCompact (14.5/700 ls 0.3)
- primaryButton (15/700 ls 0.3)

Each preset is a TextRolePreset object with fontFamily, fontSize, fontWeight, optional letterSpacing/lineHeight/textTransform.

## spacing.ts verification

Spacing constants:
- screenHorizontal: 20
- loginHorizontal: 30
- cardPadding: 16
- cardGap: 13
- section: {compact: 16, relaxed: 18}

Radii constants:
- screen: 44
- card: 22
- input: 15
- chip: 20
- tile: {12, 14, 16, 18}
- avatar: 9999

Shadows presets (React Native ShadowStyleIOS + elevation):
- card: shadowColor rgb(40,20,40), opacity 0.28, radius 28, offset 0/12, elevation 4
- primaryButton: shadowColor rgb(88,0,61), opacity 0.5, radius 22, offset 0/12, elevation 8
- activeDay: shadowColor rgb(88,0,61), opacity 0.5, radius 18, offset 0/10, elevation 6
- avatar: shadowColor rgb(88,0,61), opacity 0.5, radius 16, offset 0/8, elevation 4

## DoD verification

✓ Colors.ts rewritten with exact README hex values  
✓ typography.ts created with font families + 16 text-role presets  
✓ spacing.ts created with spacing, radii, 4 shadow presets  
✓ npx tsc --noEmit clean (no errors)  
✓ No files touched outside scope  

## Files changed

- src/constants/Colors.ts (replaced entirely)
- src/constants/typography.ts (new)
- src/constants/spacing.ts (new)

## Notes for next tasks

- Current Colors.ts had no active imports in the codebase (was unused).
- Font family names match @expo-google-fonts conventions (e.g., Bricolage_700Bold, Hanken_600SemiBold). D2 (font loading) must wire these exact names into expo-font.
- Shadow objects are ready for direct spread into React Native styles or wrapped in StyleSheet.
- Typography presets can be spread into Text styles: `<Text style={Typography.greeting}>…</Text>`.
- No new dependencies added.
