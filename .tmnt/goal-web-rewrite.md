# Goal: Perun — Web rewrite (React web app, keep Supabase backend)

**Date:** 2026-06-28
**Target project:** /Users/uros/Documents/Private/Projects/PerunApp
**Status:** PLAN — awaiting Uros's decisions before execution.

## What we're building
Re-platform Perunから an **Expo / React Native mobile app** to a **React web
app**, keeping React and the entire Supabase backend untouched. Same product
(member booking + admin app), same brand/design, same Serbian copy — rebuilt for
the browser (mobile-first, also works on desktop).

## Why
- The team wants a web app, not a phone app.
- Bonus: most of this week's QA pain (login password focus, keyboard handling,
  safe-area overlap, "navigate before navigator ready") is **RN/expo-router
  specific** and disappears on the web.

## What STAYS (no change)
- **Supabase backend in full:** schema, RLS, all RPCs (`join_session`,
  `admin_*`, `is_admin`, stats, `attendance_log`), auth, the weekly-reset cron.
  The web app talks to the same project with the same anon key.
- Product rules: booking/capacity/weekly-limit, roles, slot open/close, stats.

## What PORTS with light edits (high reuse)
- `src/services/admin/*` (sessions/users/stats/types/index) — pure `supabase.rpc`
  calls; move as-is.
- `src/types/*` (Profile, Training, admin types) — as-is.
- `src/services/supabase/client.ts` — drop AsyncStorage; supabase-js uses
  `localStorage` on web by default. Env var prefix changes (see below).
- Context **logic** (`AuthContext`, `TrainingContext`): the data flow, derived
  state, error-code→Serbian maps, booking guards — reuse the logic, swap RN bits
  (Alert → web toast) and providers.
- `src/constants/{Colors,spacing,typography}` — become CSS theme tokens
  (CSS variables or Tailwind theme). Same values/brand.
- All Serbian copy and the booking-error message map.

## What is a REWRITE (the bulk of the work)
- **Every screen & component** (RN primitives → DOM + CSS): login, register,
  forgot-password, member home (day schedule + TrainingCard + AlertBar +
  DayFilter + EmptyDay + Header), profile; admin shell + Pregled, Korisnici,
  Treninzi, Statistika, create/edit form; shared admin components (BarChart,
  StatTile, Toggle, FilterChips, UserRow, SessionRow, AdminHeader).
  - `View→div`, `Text→span/p`, `Pressable→button`, `TextInput→input`,
    `FlatList/ScrollView→div + map`, `Image→img`, `Modal→dialog/portal`,
    `Alert.alert→toast/dialog`, `StyleSheet→CSS`.
- **Navigation:** expo-router → a web router (role-based auth guard, the
  `(admin)`/`(tabs)` split, the create/edit route). Reimplement the routing rules.
- **Styling:** RN inline styles/StyleSheet → CSS (approach = decision below).
- **Fonts:** `@expo-google-fonts` → web fonts (`@fontsource` or Google Fonts
  `<link>`).
- **Icons:** `@expo/vector-icons` Feather → `lucide-react` (web).
- **Charts:** the custom RN `BarChart` → CSS/SVG bars (still dependency-light).
- **Build/tooling:** Expo/Metro → a web bundler (decision below). New
  `package.json`, tsconfig, scripts; remove RN/Expo deps.
- **Drop entirely:** SafeAreaView/insets, StatusBar, KeyboardAvoidingView,
  Platform checks, AsyncStorage, splash screen — all RN-only.
- **Env:** `EXPO_PUBLIC_SUPABASE_*` → framework public prefix
  (`VITE_PUBLIC_*` or `NEXT_PUBLIC_*`). Anon key still public-by-design.

## DECISIONS LOCKED (2026-06-28, from Uros)
- **Framework:** Vite + React + React Router (client-side SPA).
- **Styling:** Tailwind CSS (existing Colors/spacing/typography tokens → Tailwind theme).
- **Repo:** new branch **`web`** off `design_update`; keep the RN/Expo app in
  history for reference until web reaches parity, then retire Expo.
- **RN fixes:** STOPPED — all effort goes to the web rewrite (the open RN bugs are
  platform-specific and won't exist on web).
- **Responsive:** mobile-first, desktop = centered max-width column (inferred; confirm if wrong).

## Decisions to lock before code (recommendations in bold)
1. **Framework / router.** **Vite + React + React Router (SPA)** — closest to the
   current SPA model, least ceremony, fast. Alt: Next.js (App Router) if you want
   SSR/SEO/server routes (more rework, heavier). Recommend Vite unless SSR is needed.
2. **Styling.** **Tailwind CSS** (fast, design tokens map to theme) — alt: CSS
   Modules + CSS variables (no new mental model) or styled-components. Recommend
   Tailwind, with the existing color/spacing/type tokens as the theme config.
3. **Repo strategy.** **New branch `web` + a fresh web app at repo root (or
   `web/`), keeping the RN code in git history for reference** until parity, then
   retire Expo. Alt: hard replace in place. Recommend new branch so we don't lose
   the working RN reference mid-rewrite.
4. **Scope order.** Backend stays → shared layer (client/types/services/tokens)
   → auth + routing shell → member screens → admin screens → polish. Member-first
   so there's a usable web app early.
5. **Responsive target.** **Mobile-first, also desktop-friendly** (the design is
   390px phone frames; center a max-width column on desktop). Confirm.
6. **Deployment (informational, not required to start).** Static host
   (Vercel/Netlify/Cloudflare Pages). Not building this now; just noting the target.

## Phases (once decisions are locked)
- **P0 — Scaffold:** new web app (chosen framework), TypeScript strict, lint,
  fonts, theme tokens, Supabase client (web), env wiring, CI gate.
- **P1 — Shared layer:** port types + services/admin + context logic; verify a
  smoke call to Supabase from the browser.
- **P2 — Auth + routing shell:** login/register/forgot, role-based routing
  (member vs admin), protected routes, logout.
- **P3 — Member app:** home (day schedule, booking, capacity, limits), profile.
- **P4 — Admin app:** shell/nav + Pregled, Korisnici, Treninzi, create/edit form,
  Statistika (charts).
- **P5 — Polish + parity check:** responsive pass, empty/loading/error states,
  full click-through QA, retire the Expo app.

## Definition of done
- A React web app builds and runs in the browser; member + admin flows work end
  to end against the live Supabase project (login/register, browse + book/cancel
  under limits, admin open/close slots, create/edit sessions, manage users, real
  stats), with role-based routing.
- No RN/Expo dependencies remain in the web app; `tsc` + lint + build all green.
- Brand/design and Serbian copy match the current app.

## Out of scope
- Backend changes (it's done and verified).
- Native mobile builds / app stores.
- New features beyond current parity.
- Auth email delivery (still pending SMTP, unchanged).

## Open question for Uros
The current RN code still has open QA items (the login focus issue). Since we're
re-platforming, do we **stop further RN fixes** and put all effort into the web
rewrite? (Recommended: yes — the RN-specific bugs vanish on web.)
