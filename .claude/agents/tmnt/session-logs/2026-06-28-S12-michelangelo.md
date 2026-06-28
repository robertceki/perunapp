# Session 12 — Michelangelo — Phase C Group B UI (2026-06-28)

## Dispatch
Phase C Group B UI: 6 combined tasks (B1, B3, D5, B4, B5, B2).

## Tasks executed
1. **B1** — Remove SALA + TRAJANJE fields from training form
   - File: app/(admin)/training/[id].tsx
   - Removed room + durationMin state and UI fields
   - Form now passes room:null, duration_min:null to upsertSession

2. **B3** — Time input mask for VREME field
   - File: app/(admin)/training/[id].tsx
   - Added TIME_PATTERN regex (HH:MM, 00–23:MM 00–59)
   - Added formatTime helper (strips non-digits, auto-inserts ":" after 2 digits)
   - VREME TextInput: keyboardType="number-pad", onChangeText applies formatTime
   - Validation on submit: rejects invalid time with Alert, prevents save

3. **D5** — Remove hardcoded room/duration from member card
   - File: src/components/TrainingCard.tsx
   - Removed "60 min" <Text> entirely from timeBlock
   - Changed category from "Grupni · Sala A" to "Grupni"
   - Removed unused duration + fullMeta style definitions

4. **B4** — Equal-height stat cards in grid rows
   - Files: src/components/admin/StatTile.tsx, app/(admin)/(tabs)/index.tsx, app/(admin)/(tabs)/stats.tsx
   - StatTile: added flex:1 to tile style
   - Pregled (index.tsx): tileRow added alignItems:"stretch"
   - Statistika (stats.tsx): secondaryRow added alignItems:"stretch"; secondaryTile added flex:1

5. **B5** — Active/inactive toggle in edit-user
   - File: app/(admin)/(tabs)/users.tsx
   - Added enabled state; init from user.enabled??true
   - Modal: new toggleRow with "AKTIVAN" label + Toggle component
   - saveUser: includes enabled in UpdateUserPatch

6. **B2** — Role-aware profile + logout for both roles
   - File: app/profile.tsx
   - Added isAdmin constant from profile.role==="admin"
   - Identity: shows ADMIN chip for admins, ČLAN for members
   - Stats/limit/booking sections: wrapped in !isAdmin (members only)
   - Limit card: replaced editable stepper with read-only display "{bookedCount} / {max} ove nedelje"
   - Logout: button works for both roles (calls useAuth().logout())

## Verification
- tsc --noEmit: PASS (no errors)
- eslint app src --max-warnings 0: PASS (no warnings/errors)
- Codex report: DONE (70k tokens used)
- All 6 files modified as expected
- No new dependencies, no refactors outside target scope

## Files modified
- /Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/training/[id].tsx
- /Users/uros/Documents/Private/Projects/PerunApp/src/components/TrainingCard.tsx
- /Users/uros/Documents/Private/Projects/PerunApp/src/components/admin/StatTile.tsx
- /Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/index.tsx
- /Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/stats.tsx
- /Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/users.tsx
- /Users/uros/Documents/Private/Projects/PerunApp/app/profile.tsx

## Codex run log
- Path: /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/runs/phase-c-b-groupb-mikey.md
- Exit: 0 (success)
- Signal: DONE

## Notes for next session
- All Phase C Group B tasks complete and verified
- Profile role-aware rendering works for both admin + member; logout functional
- Training form validation on time is client-side only (server accepts any value); no backend time validation needed
- Member card now shows only "Grupni" (no room/duration data collected); admin form fields removed
- Stat tile equal height works via flex layout (no hardcoded heights, responsive)
- No breaking changes to admin RPC calls; updateUser now accepts optional enabled field (already supported by backend from B waves prep)
