# Michelangelo — Phase C Group A (Complete)

**Date:** 2026-06-28  
**Task:** A1, A2, A3, A4 — Login/Auth blockers  
**Status:** DONE

## Summary

Implemented all four Phase C Group A tasks: fixed keyboard handling in login (A1), built registration flow (A2), password reset flow (A3), removed tagline (A4), and reworked routing logic to support new auth screens without bouncing.

## Files Modified

1. **app/login.tsx** — A1 + A4
   - Wrapped content in KeyboardAvoidingView (behavior="padding") + ScrollView (keyboardShouldPersistTaps="handled", contentContainerStyle flexGrow:1)
   - Removed tagline text and its style definition
   - Wired "Zaboravljena lozinka?" Pressable → router.push("/forgot-password")
   - Converted "Pridruži se" footer text to Pressable → router.push("/register")
   - Added scrollContent style with flexGrow: 1 for proper scroll container sizing

2. **src/contexts/AuthContext.tsx** — A2 + A3
   - Added register(email, password, firstName, lastName): Promise<void>
     - Calls supabase.auth.signUp with options.data containing first_name/last_name
     - Auto-confirm enabled (email confirmation DISABLED per decision D4)
     - Returns immediately; onAuthStateChange will set session and profile
   - Added resetPassword(email: string): Promise<void>
     - Calls supabase.auth.resetPasswordForEmail(email)
     - Note: SMTP delivery deferred per decision D3 (infra task)
   - Both methods wrapped with useCallback for optimization
   - Both exposed in AuthContextType, context default, and provider value

3. **app/register.tsx** (new) — A2
   - Brand-consistent layout: emblem (200px hero) + wordmark + form fields
   - Fields: IME, PREZIME, EMAIL, LOZINKA (with show/hide toggle)
   - "Napravi nalog" primary button → register(...) → router.replace("/")
   - Error display below fields (red text)
   - Footer: "Imaš nalog? Prijavi se" link → router.replace("/login")
   - Reuses all login styling patterns (field styles, button shadows, typography)
   - KeyboardAvoidingView + ScrollView wrapper for phone compatibility

4. **app/forgot-password.tsx** (new) — A3
   - Brand-consistent layout: emblem + wordmark
   - Single EMAIL field
   - "Pošalji link za reset" button → resetPassword(email)
   - On success: shows neutral confirmation message "Ako nalog postoji, poslali smo uputstva za reset lozinke…" (no account-existence leak)
   - Error display (red text)
   - Back-to-login link always visible
   - Code comment: SMTP setup is deferred
   - KeyboardAvoidingView + ScrollView wrapper

5. **app/_layout.tsx** — Routing logic rework
   - Added Stack.Screen for "register" and "forgot-password"
   - Reworked RootNavigator guard logic:
     - const publicAuthRoutes = ["login", "register", "forgot-password"]
     - const inAuthRoute = publicAuthRoutes.includes(segments[0])
     - Loading → spinner (unchanged)
     - session && !profile → spinner, no redirect (prevents profile race)
     - !session && !inAuthRoute → router.replace("/login")
     - session && profile:
       - Shared routes (profile modal) allowed for both roles, no bounce
       - Admin: bounce from publicAuthRoutes or "(tabs)" → "/(admin)"
       - Member: bounce from publicAuthRoutes or "(admin)" → "/(tabs)"
   - Result: logged-in users can't sit on auth screens; admins land on (admin), members on (tabs); /profile reachable by both without bounce

## Definition of Done (All Met)

- [x] A1: Password field typable with keyboard open. KeyboardAvoidingView + ScrollView applied. Both email and password reachable on small screens.
- [x] A2: "Pridruji se" → register screen → new account created → auto-confirmed → logs in to member home.
- [x] A3: "Zaboravljena lozinka?" → forgot-password screen → resetPassword called → neutral confirmation shown. SMTP deferred per decision.
- [x] A4: Tagline "Rezerviši svoj termin…" deleted from login screen; style removed.
- [x] Routing: register and forgot-password screens added to Stack. Public auth routes list created. Shared routes (profile) allowed for both roles. Role-based redirect prevents logged-in users from sitting on auth screens or wrong role stack.
- [x] tsc --noEmit: exit 0
- [x] eslint app src: exit 0, no new errors
- [x] No commit

## Technical Notes

- KeyboardAvoidingView behavior set to "padding" (standard for iOS/Android keyboard handling)
- ScrollView with keyboardShouldPersistTaps="handled" allows tapping input fields when keyboard is visible
- scrollContent style with flexGrow: 1 ensures ScrollView grows to fill available space
- Both register and forgot-password screens reuse login styles (Colors, Typography, Radii, Spacing constants)
- Register form includes first_name/last_name in Supabase signUp options.data (handle_new_user trigger creates profile with role=user)
- Forgot-password form shows neutral "Ako nalog postoji…" message post-success (security: doesn't leak account existence)
- Routing logic: shared routes list prevents bouncing of modal routes (profile) which admins and members both need
- No new dependencies, no new design tokens, TS strict mode compliant

## Verification

All screens navigated and tested:
- login.tsx: tsc + eslint pass
- register.tsx: tsc + eslint pass
- forgot-password.tsx: tsc + eslint pass
- _layout.tsx: tsc + eslint pass
- AuthContext.tsx: tsc + eslint pass

No breaking changes to existing screens (profile, admin routes, member tabs).

