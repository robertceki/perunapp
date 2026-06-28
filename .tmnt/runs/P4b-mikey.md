# P4b — Web Admin Screens (Korisnici, Treninzi, TrainingForm)

## Session 17 — Direct Implementation (Codex timeout → fallback to manual)

### Summary
Implemented three complete admin screens (Korisnici, Treninzi, TrainingForm) + updated routing to support dynamic training IDs. Codex timed out mid-analysis (exit 143) on combined prompt due to large file list. Fell back to direct code writing per established pattern (sessions 12–14).

### Files Created
- None (UserRow.tsx and SessionRow.tsx already existed from P4a)

### Files Modified
1. **web/src/screens/admin/Korisnici.tsx** (213 lines)
   - Load listUsers() on mount; guard role === "admin"
   - Search input (filters first_name + last_name + email, case-insensitive)
   - FilterChips: Svi/Aktivni/Admini
   - UserRow list with one-at-a-time expansion
   - Edit Modal: IME, PREZIME, ULOGA (chips), MAKS.SESIJA (stepper 0–14), "Aktivan" Toggle
   - Confirm delete dialog with "Ukloni korisnika?" + name + "Sve prijave će biti uklonjene"
   - Error/loading states, toast feedback

2. **web/src/screens/admin/Treninzi.tsx** (105 lines)
   - Header: "Treninzi" + "{day} · {date}" + burgundy "＋ Novi" button
   - Day selector: FilterChips PON–SUB, default monday
   - Load getTrainingsByDay(selectedDay) from useTrainings context
   - SessionRow list with toggle open/close + onClick navigate to form
   - Empty state: "Nema termina za ovaj dan"
   - Loading spinner

3. **web/src/screens/admin/TrainingForm.tsx** (265 lines)
   - useParams id; isNew = (id === "new")
   - When editing: find session from context; if not found & !isNew → error page
   - Nav bar: back button + title "Novi/Izmena treninga"
   - Fields: NAZIV (text), DAN (chips PON–SUB), VREME (masked HH:MM), MAKS.UČESNIKA (stepper 1–50), "Status slota" card with Toggle
   - Validation: title required, valid HH:MM time (00–23:00–59), max >= 1
   - Sticky footer: "Otkaži" + "Sačuvaj trening" (burgundy)
   - On save: upsertSession({ id: isNew ? null : id, title, day_of_week, time, room: null, duration_min: null, max_participants, is_open }) → fetchTrainings() → navigate("/admin/sessions")

4. **web/src/App.tsx** (115 lines)
   - Updated routing: changed from `/admin/training/new` to `/admin/training/:id` to support dynamic IDs
   - Now supports both "/admin/training/new" (create) and "/admin/training/{sessionId}" (edit)

### DoD Verification
```bash
cd /Users/uros/Documents/Private/Projects/PerunApp/web

# npm run build
✓ tsc -b exits 0
✓ vite build exits 0 (206ms)
✓ No errors

# npm run lint
✓ oxlint exits 0 (no output = clean)
✓ No errors or warnings
```

### Design Compliance
- All Tailwind tokens from v4 @theme: bg-paper, bg-surface, bg-surface-warm, text-ink, text-ink-muted, text-ink-faint, rounded-input, rounded-chip, font-display, font-semibold, etc.
- Korisnici: search + filter chips + UserRow expanded/collapsed + edit modal + delete confirm
- Treninzi: day selector + SessionRow with toggle + empty state
- TrainingForm: masked time input (HH:MM), validation on save, sticky footer
- No new dependencies, no `any` types, strict TypeScript

### Notes
- Codex timed out on first attempt with combined P4b prompt (large file list + design spec). Fallback pattern: move to direct code writing as proven in prior sessions.
- Hooks refactored to be called before guard returns (React hooks rules compliance).
- Time input uses `formatTimeInput()` helper (inline, strips non-digits, auto-inserts ":" after 2 digits): 
  - User types "1430" → "14:30"
  - Validation on blur/save checks regex and range
- Edit modal: stepper ± buttons for max_sessions_per_week (0–14), Toggle for enabled
- Treninzi day selector: FilterChips reused from Pregled; active day burgundy
- TrainingForm: when editing, loads existing data from context; if not found & !isNew → "Termin nije pronađen" screen
- All three screens route-guarded: profile?.role === "admin" check; non-admin users see "Pristup odbijen"
- Toasts on all mutations (edit save, delete, session open/close)

### Gotchas
- useParams must have default value (id = "new") to avoid undefined type error when passing to upsertSession
- Hooks (useEffect, useMemo) must be called unconditionally, before any returns; restructured guard logic to validate inside component body instead of early return

### Files Not Modified (Reused)
- UserRow.tsx (already existed from P4a)
- SessionRow.tsx (already existed from P4a)
- FilterChips, Toggle, StatTile (existing shared components)
- useTrainings, useToast, useAuth (existing hooks)
- Admin services (listUsers, updateUser, deleteUser, setSessionOpen, upsertSession)

### Next Steps (if any)
- All admin CRUD screens now wired and functional
- Ready for QA testing (E2E or manual browser testing)
- No follow-up tasks identified in dispatch
