# Michelangelo Session 9 — Phase B UI Wave C (B-M4, B-M5, B-M6)

**Date:** 2026-06-27  
**Task:** Implement three admin screens (Korisnici, Treninzi, training form)  
**Status:** DONE

## Summary

Implemented Phase B UI Wave C (B-M4, B-M5, B-M6) — three full screens for admin management of users, sessions, and session create/edit.

### Files Modified
1. **app/(admin)/(tabs)/users.tsx** — Korisnici (user list + search + filters + edit/delete)
   - FlatList of UserRow components, real-time filtered by search + role filter
   - Edit Modal with fields: first_name, last_name, role (user/admin), max_sessions_per_week (stepper 0–14)
   - Delete with Alert confirm; awaits deleteUser, refreshes list
   - Loading/error states with ActivityIndicator and "Greška pri učitavanju" fallback
   - Services: listUsers, updateUser, deleteUser

2. **app/(admin)/(tabs)/sessions.tsx** — Treninzi (session list by day + toggle open/close)
   - Day selector (FilterChips PON–SUB, default monday)
   - FlatList of SessionRow for selected day's sessions
   - Toggle on/off via setSessionOpen; always re-fetches to resync
   - Empty state: "Nema termina za ovaj dan."
   - Right header button: burgundy pill "＋ Novi" → router.push("/(admin)/training/new")
   - Services: useTrainings() hook (getTrainingsByDay, fetchTrainings), setSessionOpen

3. **app/(admin)/training/[id].tsx** — Novi / Izmena treninga (form screen)
   - **Already implemented in Wave A placeholders.** Reviewed + verified.
   - Own nav bar (no AdminHeader, no tab bar): back chevron, title, spacer
   - Form fields: title, day (FilterChips PON–SUB), time, duration_min, room, max_participants (stepper), status (Toggle)
   - Validate: title non-empty, time non-empty, max_participants >= 1
   - On save: await upsertSession → fetchTrainings → router.back()
   - Loading state when editing (find by id); "Termin nije pronađen" fallback
   - Services: upsertSession, useTrainings()

### Design & Architecture Notes
- **No AdminHeader in tab screens** — it lives in (tabs)/_layout.tsx; screens don't render it
- **FlatList scrolling** — used as primary scroll surface in both tab screens (no nested ScrollView)
- **Form screen outside tabs** — /(admin)/training/new and /(admin)/training/[id] are stack routes, not tabs
- **Reuse existing components:** UserRow, SessionRow, FilterChips (generic), Toggle, AdminHeader (from Wave A)
- **Real services:** All three screens call actual RPC functions (listUsers, updateUser, deleteUser, setSessionOpen, upsertSession)
- **Error handling:** Alert.alert on RPC catch; always re-fetch after mutations to maintain consistent state
- **No new colors, spacing, or dependencies** — all design tokens from constants/

### Verification
- **tsc --noEmit:** PASS (no errors)
- **eslint app/(admin) src/components/admin:** PASS (no errors, max-warnings=0)
- **No AdminHeader rendered in users.tsx or sessions.tsx** (verified via code inspection)
- **Form has own nav bar, no tab bar** (verified via useLocalSearchParams + router structure)
- **All mutations re-fetch:** deleteUser → fetchUsers, setSessionOpen → fetchTrainings, upsertSession → fetchTrainings

## Definition of Done (All Met)
- [x] Korisnici screen: load users, search/filter, edit Modal, delete confirm, re-fetch on mutations
- [x] Treninzi screen: day selector, FlatList by day, toggle open/close, empty state
- [x] Training form: nav bar (no AdminHeader), full form with validation, save/cancel, re-fetch on save
- [x] No AdminHeader in tab screens; it's inherited from _layout.tsx
- [x] Form screen renders own nav bar, no tab bar visible
- [x] tsc --noEmit exits 0
- [x] eslint exits 0 on app/(admin) and src/components/admin
- [x] No new errors introduced
- [x] No commit (per instructions)

## Approach Notes
- Codex timed out on first attempt (exit 144, reasoning loop too long on large combined prompt).
- Fell back to direct Mikey code writing (no Codex).
- users.tsx and sessions.tsx were auto-formatted by eslint on disk write (style compliance).
- Form screen [id].tsx was already fully implemented in Wave A (verified structure).
- All three screens integrate with existing admin services (no new RPC endpoints needed).
- Day selector in sessions.tsx uses FilterChips (same component as role filter in users.tsx), reusing the generic pattern.

## No Changes Needed
- AdminHeader — left as-is in _layout.tsx; not rendered in screens
- UserRow, SessionRow — reused as-is; no modifications
- Services — all already defined in src/services/admin/
- TrainingContext / useTrainings — already providing needed methods (getTrainingsByDay, fetchTrainings)

## Gotchas Encountered
None. Smooth implementation once Codex timeout was worked around.

