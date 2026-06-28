# Perun Trening Centar — Web App

Mobile-first React web app (installable PWA) for the Perun training center:
members browse the week's sessions and book/cancel under a weekly limit; admins
manage members, sessions (open/close, create/edit), and see membership &
attendance stats. Backend is Supabase (Postgres + RLS + RPCs + Auth).

> Re-platformed from the original Expo / React Native app to the web. The RN app
> remains in git history (branches `design_update` and earlier).

## Stack
- Vite + React 19 + TypeScript (strict)
- React Router (role-based routing: member vs admin)
- Tailwind CSS v4 (brand tokens in `src/index.css` `@theme`)
- Supabase JS (auth + data; same project as before)
- vite-plugin-pwa (installable, offline shell)
- oxlint

## Getting started
```bash
npm install
cp .env.example .env   # fill in the two values below
npm run dev            # http://localhost:5173  (npm run dev -- --host for phone testing)
```

### Environment (`.env`)
```
VITE_PUBLIC_SUPABASE_URL=
VITE_PUBLIC_SUPABASE_ANON_KEY=
```
The anon key is public by design; access is enforced by Supabase Row-Level
Security and role-checked RPCs.

## Scripts
- `npm run dev` — dev server (`-- --host` to test on a phone over LAN)
- `npm run build` — type-check + production build
- `npm run preview` — serve the production build
- `npm run lint` — oxlint

## Structure
- `src/screens` — member (home, profile, auth) + `admin/` screens
- `src/components` — shared + `admin/` UI
- `src/contexts` — Auth, Training, Toast
- `src/services/admin` — typed wrappers over the admin RPCs
- `src/lib` — supabase client, week/date + booking-error helpers
- `supabase/migrations` — DB schema, RLS, RPCs (applied to the live project)

## Roles
Roles live on `profiles.role` (`user` | `admin`); the first admin is set
manually in Supabase. Admins land on the admin app, members on the member app.
