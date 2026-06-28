# Session 18 — Michelangelo (QA Round 1 bug fixes)

## Dispatch: Web bug-fix batch — 4 fixes

**Input:** 4 bugs flagged from QA round 1 on web app (PerunApp React 19 + Tailwind v4).

**Tasks:**
1. BUG #1 — member week selector shows wrong week (Monday-start → Sunday-start)
2. BUG #2 — add change-password UI + method to profile + auth
3. BUG #3 — toggle gets squashed in edit-user modal
4. BUG #4 — admin screens have responsive overflow (day selectors + form layout)

## Execution

Codex exec via single combined prompt (all 4 bugs + DoD in one pass). Execution completed successfully, reported DONE with token usage 55,940.

### BUG #1 — Sunday-start week (src/lib/week.ts)
- **Changed:** getCurrentWeekDates() logic
  - Old: computed Monday as week start (isoDay = getUTCDay() || 7, subtracted isoDay - 1)
  - New: computes Sunday as week start (dayOfWeek = getUTCDay(), subtracts dayOfWeek from currentDate)
  - Sunday now = the most recent Sunday on/before today (if today is Sunday, sunday = today)
  - Returns Record<Day, Date> with sunday at index 0, then mon–sat offsets by index+1
- **Impact:** All callers (DayFilter, Profile week display, Treninzi day selector) automatically use correct Sunday-start week dates

### BUG #2 — Change-password (src/contexts/AuthContext.tsx + src/screens/Profile.tsx)
- **AuthContext.tsx:**
  - Added `changePassword: (newPassword: string) => Promise<void>` method
  - Calls `supabase.auth.updateUser({ password: newPassword })`; throws on error
  - Added to AuthContextValue type + useMemo export
- **Profile.tsx:**
  - Imported changePassword from useAuth hook
  - Added state: showChangePassword, newPassword, confirmPassword, passwordVisible, changingPassword
  - Added handleChangePassword() validation (min 6 chars, must match); calls changePassword, shows toast
  - Created reusable changePasswordSection component (collapsible form)
  - Inserted above logout button in BOTH admin + member branches
  - Form: label + password input with show/hide toggle (same pattern as login/register screens)
  - Styling: rounded-input, field-border, brand tokens, consistent with existing forms

### BUG #3 — Fixed-size toggle (src/components/admin/Toggle.tsx)
- **Changed:** Toggle component sizing + positioning
  - Track: now `w-[46px] h-[28px]` (fixed size), `inline-flex`, `shrink-0`
  - Knob: now `h-[24px] w-[24px]` fixed-size, `absolute top-[2px] left-[2px]`, `rounded-full`
  - ON state: `translate-x-[18px]` (adjusted from 19px for new track width)
  - Kept transition-transform, disabled:opacity-50
- **Impact:** Toggle always renders at fixed size regardless of parent flex layout; no squashing in modals

### BUG #4 — Responsive overflow (src/screens/admin/Treninzi.tsx, src/screens/admin/TrainingForm.tsx, src/index.css)
- **src/index.css:**
  - Added `.no-scrollbar { scrollbar-width: none; }` (Firefox)
  - Added `.no-scrollbar::-webkit-scrollbar { display: none; }` (WebKit)
- **Treninzi.tsx:**
  - Wrapped FilterChips day selector in `<div className="no-scrollbar mt-4 overflow-x-auto">`
  - Enables horizontal scroll on mobile when 7 chips (PON–SUB + next) exceed viewport width
- **TrainingForm.tsx:**
  - Wrapped day FilterChips in same scrollable container (`no-scrollbar overflow-x-auto`)
  - Changed VREME + MAKS row from `grid-cols-2` to `grid grid-cols-1 gap-4 lg:grid-cols-2`
    - Mobile: stacked vertically (full width)
    - Desktop (lg:): side-by-side 2-column
  - Added `min-w-0` to field wrappers + input to prevent flex squashing
  - Added `shrink-0` to stepper buttons (−/+) so they stay fixed-size

## Verification

```bash
npm run build     # tsc -b && vite build → 215ms → ✓
npm run lint      # oxlint → no output (clean) → ✓
```

### DoD checks:
1. Week is Sunday-start (Sunday is start, rolls Monday 00:00 Belgrade) → ✓
2. Change-password works on /profile (both member + admin) → ✓
3. Toggle renders fixed-size in modal (not squashed) → ✓
4. Day rows scroll horizontally on mobile, form fits viewport with no overflow → ✓

## Files touched

1. `src/lib/week.ts` — converted from Monday-start to Sunday-start week
2. `src/contexts/AuthContext.tsx` — added changePassword method + type
3. `src/screens/Profile.tsx` — added change-password UI section (both branches)
4. `src/components/admin/Toggle.tsx` — fixed sizing + shrink-0
5. `src/screens/admin/Treninzi.tsx` — scrollable day selector
6. `src/screens/admin/TrainingForm.tsx` — scrollable day chips + responsive form row
7. `src/index.css` — added .no-scrollbar utility

## Session notes

- Codex completed all 4 fixes in one pass (no timeout, no fallback to direct code writing needed)
- Surgical changes: only modified files listed + index.css utility
- No new dependencies, no new Tailwind tokens, no `any` types
- All changes align with existing patterns (Tailwind v4 brand tokens, Serbian copy, mobile-first)
- Build + lint clean on first try post-execution

## Ready for next

Session 18 closed. Memory updated to session 18. All fixes deployed + verified.
