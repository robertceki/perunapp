# Session 16 — Michelangelo Log

**Date:** 2026-06-28  
**Task:** P4a Web — Admin shell + nav + shared admin components + Pregled & Statistika  
**Execution:** Codex (single pass)

## Summary

Executed P4a web rewrite: admin routing restructure, AdminLayout with fixed bottom TabBar, 6 shared admin components, and 2 real-data screens (Pregled, Statistika) + 3 placeholders.

## Tasks Completed

1. **Routing (App.tsx)**
   - Restructured RequireAdmin to wrap AdminLayout (not just AdminHome)
   - Added RequireAuthenticated guard (gates /profile + admin routes)
   - Updated AppProviders (renamed from MemberProviders) to wrap both member + admin
   - Routes: /admin→Pregled, /admin/users→Korisnici, /admin/sessions→Treninzi, /admin/stats→Statistika
   - /admin/training/new→TrainingForm (outside AdminLayout, no tab bar)
   - Admin routes inherit ToastProvider + TrainingProvider for P4b use

2. **Admin Shell (AdminLayout.tsx)**
   - Flex column min-h-[100dvh] with 3-part layout
   - AdminHeader at top (safe-area top inset)
   - Scrollable Outlet in middle (pb to clear tab bar)
   - Fixed TabBar at bottom (height 70px + safe-area bottom)

3. **AdminHeader Component**
   - Emblem 30×30 + "PERUN" wordmark (font-display, burgundy)
   - "ADMIN" badge (burgundy on burgundyTint, small radius)
   - Navy avatar (38×38) with initials → /profile
   - Safe-area top padding: calc(env + 10px)

4. **TabBar Component**
   - Fixed bottom nav: height 70px, white bg (rgba .97), top border
   - 4 NavLink tabs: Pregled, Korisnici, Treninzi, Statistika
   - Icons: lucide-react (LayoutGrid, Users, Calendar, BarChart2)
   - Active = burgundy (700), inactive = #B3A9B2 (600)
   - NavLink end prop on /admin (exact match only)
   - Safe-area bottom inset

5. **Shared Components (web/src/components/admin/)**
   - StatTile: figure + label + optional delta, h-full for equal-height grids
   - BarChart: gold gradient bars (current = burgundy), month labels, value label above current
   - Toggle: pill switch, burgundy ON, #DDD3C7 OFF, smooth animation
   - FilterChips: generic pills, active burgundy, inactive surface

6. **Pregled Screen**
   - Load: memberSeries(6) + occupancySummary("6") + useTrainings() on mount
   - Role guard: profile?.role === "admin"
   - Render: greeting "Zdravo, Admin", date + month
   - 2×2 stat grid (equal height):
     - Aktivnih članova (last memberSeries.total_members, burgundy, +new delta)
     - Popunjenost (avg_pct%, gold-deep)
     - Treninga ove nedelje (trainings.length)
     - Otvorenih slotova danas (is_open && day===today count)
   - Trend card "ČLANOVI PO MESECU" (BarChart + green % badge)
   - Quick action: "＋ Novi trening" button → /admin/training/new

7. **Statistika Screen**
   - Period FilterChips: 12/6/all → maps to months
   - Load on period change: memberSeries + occupancySummary + slotPopularity in Promise.all()
   - Title "Statistika" + subtitle
   - Members chart card: latest figure + % badge + BarChart
   - Secondary tiles (2-col): "NOVIH / MES." (+new vs prev), "PROS. POPUNJ." (% + top day)
   - "POPULARNOST TERMINA" section: top 8 slots (time + bookings + proportional bar)
   - Empty + loading states, role guard

8. **Placeholders (P4b)**
   - Korisnici: title + stub text
   - Treninzi: title + stub text
   - TrainingForm: back link + title + stub text

## Files Created / Modified

**Created (13 files):**
- web/src/components/admin/AdminHeader.tsx
- web/src/components/admin/TabBar.tsx
- web/src/components/admin/StatTile.tsx
- web/src/components/admin/BarChart.tsx
- web/src/components/admin/Toggle.tsx
- web/src/components/admin/FilterChips.tsx
- web/src/screens/admin/AdminLayout.tsx
- web/src/screens/admin/Pregled.tsx
- web/src/screens/admin/Statistika.tsx
- web/src/screens/admin/Korisnici.tsx
- web/src/screens/admin/Treninzi.tsx
- web/src/screens/admin/TrainingForm.tsx

**Modified (1 file):**
- web/src/App.tsx (routing restructure, RequireAuthenticated, AppProviders)

## Verification

✅ `npm run build` — PASS (tsc -b + vite build 229ms)
✅ `npm run lint` — PASS (oxlint clean, no errors)
✅ No `any` types, no React Native / expo imports
✅ All components use Tailwind v4 brand tokens (no new config)
✅ Pregled + Statistika load real admin RPC data
✅ Routing: no race conditions, no flashing
✅ TabBar active/inactive states correct
✅ AdminLayout 3-part layout (header + scrollable + fixed nav)

## Notes for Mikey 17

- P4b will fill Korisnici + Treninzi + TrainingForm with real UIs (listUsers, updateUser, deleteUser, setSessionOpen, upsertSession).
- admin routes now inherit ToastProvider + TrainingProvider; P4b screens can call useToast/useTrainings without additional wrapping.
- Pregled delta for "aktivnih članova" uses occupancy.new_this_month; if 0, delta is hidden.
- Statistika period chips map: "12"→12, "6"→6, "all"→24 months (passed to memberSeries).
- Slot popularity renders top 8 by bookings descending; proportional bar width = (bookings / maxBookings) * 100.
- TabBar uses NavLink end prop on /admin so it's only active for exact "/admin" path (not "/admin/users", etc.).
- AdminHeader avatar links to /profile (shared route, both roles can access).

## Codex Log Reference

Full execution log: `/Users/uros/Documents/Private/Projects/PerunApp/web/.tmnt/runs/P4a-mikey.md`
Codex tokens used: 93,932
Codex time: ~5min
Status: DONE (no timeout, clean execution)
