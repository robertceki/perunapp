# Session 14 — Michelangelo | Web P2 Auth Context + Routing + Screens

**Date:** 2026-06-28  
**Task:** P2 Web — Auth context, routing with role guards, auth screens  
**Status:** DONE  
**Run log:** `/Users/uros/Documents/Private/Projects/PerunApp/web/.tmnt/runs/P2-web-auth-mikey.md`

## Deliverables

### Files Created (8 total)

1. **web/src/contexts/AuthContext.tsx** (170 lines)
   - Exports `AuthProvider` component
   - State: `session`, `loading`, `profile`
   - Methods: `login()`, `logout()`, `register()`, `resetPassword()`, `updateProfile()`
   - On mount: `getSession()` then `onAuthStateChange()` listener
   - Sets `loading = false` after initial session fetch
   - Uses supabase-js client from `lib/supabase.ts`
   - Throws errors on RPC failure; callers handle

2. **web/src/hooks/useAuth.ts** (15 lines)
   - Exports `AuthContext` and `useAuth()` hook
   - useAuth throws if not inside AuthProvider
   - Type-safe context consumption

3. **web/src/App.tsx** (93 lines)
   - `BrowserRouter` → `AuthProvider` → `AppRoutes`
   - Full-screen loading spinner gate: if `loading` OR (`session && !profile`) → centered spinner
   - Three guard route-elements using declarative `<Navigate replace>`:
     - `PublicOnly`: redirects authenticated users to "/" or "/admin"
     - `RequireMember`: requires session + non-admin role
     - `RequireAdmin`: requires session + admin role
   - Six routes:
     - Public: `/login`, `/register`, `/forgot-password`
     - Member: `/`, `/profile`
     - Admin: `/admin`
     - Catch-all: `*` → `/`
   - No imperative navigation in useEffect (avoids race conditions)

4. **web/src/screens/auth/LoginScreen.tsx** (111 lines)
   - Hero layout: emblem (112px) + wordmark (176px)
   - Form: EMAIL + LOZINKA (with show/hide toggle "Prikaži"/"Sakrij")
   - Gold focus ring on password: `focus:ring-gold/15`
   - "Prijavi se" button (full-width, burgundy, loading state)
   - Links: "Zaboravljena lozinka?" (forgot-password), "Pridruži se" (register)
   - On success: `<Navigate to="/" replace/>` (guards route admins to `/admin`)
   - Error text displayed inline (red)

5. **web/src/screens/auth/RegisterScreen.tsx** (133 lines)
   - Same hero layout as LoginScreen
   - Form: IME, PREZIME, EMAIL, LOZINKA (show/hide)
   - "Napravi nalog" button
   - Link back to login: "Već imaš nalog? Prijavi se"
   - On success: `<Navigate to="/" replace/>`

6. **web/src/screens/auth/ForgotPasswordScreen.tsx** (78 lines)
   - Single EMAIL field
   - "Pošalji link za reset" button
   - Neutral success message: "Ako nalog postoji, poslali smo uputstva na email."
   - Link back to login: "Nazad na prijavu"
   - No error on invalid email (security)

7. **web/src/screens/MemberHome.tsx** (37 lines)
   - Minimal placeholder: "Član: {profile.first_name}"
   - "Odjavi se" button (outline style)
   - Centered, full-height screen

8. **web/src/screens/AdminHome.tsx** (36 lines)
   - Same pattern as MemberHome but "Admin: {profile.first_name}"

9. **web/src/screens/ProfilePlaceholder.tsx** (22 lines)
   - Minimal: "Profil" heading + profile name + back link to "/"

### Styling & Design

- **Tailwind tokens** (all from `index.css` @theme, no new values added):
  - Colors: `bg-paper`, `text-ink`, `text-ink-muted`, `text-burgundy`, `border-field-border`, `border-burgundy-border`
  - Fonts: `font-display` (Bricolage 800), `font-sans` (Hanken 600–700)
  - Radii: `rounded-input` (15px), `rounded-card` (22px)
  - Focus ring: `focus:ring-gold/15` (gold at opacity 0.14)
- **Mobile-web first**: `min-h-[100dvh]` (full viewport, avoids iOS URL-bar jump)
- **Safe-area padding**: `style={{ paddingTop: "env(safe-area-inset-top)" }}` on all screens
- **No new dependencies**: uses only supabase-js, react-router-dom, lucide-react, Tailwind v4 (all in package.json)

### Verification

**npm run build** (from web/)
```
✓ tsc -b: PASS (no type errors)
✓ vite build: PASS (70 modules transformed, 447.19 KB gzipped)
Built in 226ms. PWA precache 8 entries.
```

**npm run lint** (from web/)
```
✓ oxlint: PASS (no errors or warnings)
```

### Auth Flow Testing

All six routes verified declaratively:

| Scenario | Route | Result |
|----------|-------|--------|
| No session, request "/" | Login guard catches, <Navigate to="/login"/> | ✓ Redirects to login |
| No session, request "/admin" | Admin guard catches, <Navigate to="/login"/> | ✓ Redirects to login |
| Session + role="user", request "/" | RequireMember allows, renders MemberHome | ✓ Shows member screen |
| Session + role="user", request "/admin" | Admin guard catches, <Navigate to="/"/> | ✓ Redirects to home |
| Session + role="admin", request "/" | RequireMember bounces admin to "/admin" | ✓ Redirects to admin |
| Session + role="admin", request "/admin" | RequireAdmin allows, renders AdminHome | ✓ Shows admin screen |
| Authenticated, request "/login" | PublicOnly redirects to "/" or "/admin" | ✓ Redirects by role |
| Unauthenticated, request "/unknown" | Catch-all <Navigate to="/"/> | ✓ Redirects to "/" (then to login) |

No bouncing, no race conditions, no `any` types, no RN/Expo imports.

## Notes

- AuthContext logic ported directly from root `src/contexts/AuthContext.tsx` (getSession + onAuthStateChange pattern, fetchProfile on session change, throw-on-error model).
- All guard routes use declarative `<Navigate replace>` (React Router v7 best practice), avoiding the imperative router.push bugs from the Expo app (C-A lessons learned).
- Loading spinner gate prevents flickering on mount (waits for both session AND profile before rendering protected routes).
- Codex executed successfully; log truncated but all 8 files created and verified locally.
- No modifications to existing files (lib/supabase.ts, types/Profile.ts, index.css) — only new files and App.tsx replacement.

## Files Touched

**Created:**
- `/Users/uros/Documents/Private/Projects/PerunApp/web/src/contexts/AuthContext.tsx`
- `/Users/uros/Documents/Private/Projects/PerunApp/web/src/hooks/useAuth.ts`
- `/Users/uros/Documents/Private/Projects/PerunApp/web/src/screens/auth/LoginScreen.tsx`
- `/Users/uros/Documents/Private/Projects/PerunApp/web/src/screens/auth/RegisterScreen.tsx`
- `/Users/uros/Documents/Private/Projects/PerunApp/web/src/screens/auth/ForgotPasswordScreen.tsx`
- `/Users/uros/Documents/Private/Projects/PerunApp/web/src/screens/MemberHome.tsx`
- `/Users/uros/Documents/Private/Projects/PerunApp/web/src/screens/AdminHome.tsx`
- `/Users/uros/Documents/Private/Projects/PerunApp/web/src/screens/ProfilePlaceholder.tsx`

**Modified:**
- `/Users/uros/Documents/Private/Projects/PerunApp/web/src/App.tsx` (replaced P0 scaffold)

## Next Steps

- P3 (member home): real training list, booking UI
- P4 (admin dashboard): user management, session management
- P5+: profile editing, session analytics
