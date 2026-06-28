Reading additional input from stdin...
OpenAI Codex v0.142.0
--------
workdir: /Users/uros/Documents/Private/Projects/PerunApp
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR] (network access enabled)
reasoning effort: high
reasoning summaries: none
session id: 019f0ec9-8f7c-7fc1-bb6e-2537063538af
--------
user
TASK: Fix 4 web app bugs — week selector, change password, toggle squashing, responsive overflow

CONTEXT
Goal file: /Users/uros/Documents/Private/Projects/PerunApp/CLAUDE.md
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Framework: Vite + React 19 TS strict, React Router v7, Tailwind v4, lucide-react, supabase-js
Files to consider (read these before changing anything):
- src/lib/week.ts (getCurrentWeekDates — Monday-start, needs Sunday-start)
- src/contexts/AuthContext.tsx (needs changePassword method)
- src/screens/Profile.tsx (both member + admin views, needs change-password UI)
- src/components/admin/Toggle.tsx (gets squashed in modal, needs fixed sizing)
- src/screens/admin/Korisniki.tsx (edit modal layout)
- src/screens/admin/Treninzi.tsx (day selector FilterChips overflow)
- src/screens/admin/TrainingForm.tsx (VREME + MAKS row + day chips overflow)
- src/components/admin/FilterChips.tsx (day chips, needs scrollable container)
- src/index.css (add .no-scrollbar utility if not present)

CODING CONSTRAINTS (non-negotiable)
- Simplicity first: minimum code that solves the problem. No speculative features.
- Surgical changes: touch only the files listed above, plus index.css for the scrollbar utility.
- Match existing component patterns and styling conventions. Use Tailwind v4, existing tokens (bg-paper, text-ink, rounded-input, font-semibold, etc.).
- Reuse existing components (FilterChips, Toggle). Do not create new tokens, colors, or spacing values.
- No new dependencies.
- TypeScript strict — no `any` types, no react-native/expo imports.
- All dates stay UTC (Date-construction style unchanged); only the logic of Monday→Sunday changes.

BUG #1 — Member week selector shows wrong week (currently Monday-start, needs Sunday-start)
- File: src/lib/week.ts — getCurrentWeekDates() should compute SUNDAY-START weeks
- Decision: Sunday is the start of the booking week (resets 00:00 Europe/Belgrade)
- Current: computes Monday as start (isoDay 0=Sun..6=Sat, Monday=1)
- Needed: compute Sunday as start (dow 0=Sun..6=Sat, Sunday=0, Sunday=today if today is Sunday, else most recent Sunday before today)
- Logic: After converting referenceDate to Belgrade date-only, compute dow = getUTCDay() (0=Sun..6=Sat). weekStartSunday = new Date with same year/month/day, then setUTCDate(getUTCDate() - dow). Return Record with sunday at index 0, then +1..+6 for mon–sat. Callers (DayFilter, MemberHome, Profile) keep working with the new dates (they iterate TRAINING_DAYS Mon–Sat + use weekDates[day]).

BUG #2 — Add change-password to AuthContext + Profile screen
- AuthContext.tsx: Add new method changePassword(newPassword: string): Promise<void>
  - Call supabase.auth.updateUser({ password: newPassword })
  - If error, throw error
  - Add to AuthContextValue type signature
  - Add to useMemo value export
- Profile.tsx: Add change-password UI (both member + admin branches)
  - Add state: showChangePassword (bool), newPassword (str), confirmPassword (str), changingPassword (bool)
  - Add inline form section above logout button (in both isAdmin + member sections)
  - Form: NOVA ŠIFRA + POTVRDI ŠIFRU inputs (type=password), inline visibility toggle, validation (min 6 chars, must match)
  - On click "Sačuvaj šifru": validate, call changePassword, show success toast, collapse form
  - On error: show error toast
  - Styling: rounded-input, field-border, brand tokens, mobile-friendly, consistent with existing forms

BUG #3 — Toggle is squashed in edit-user modal
- File: src/components/admin/Toggle.tsx
- Problem: currently relative-positioned with no fixed sizing; gets squashed by flex parent in modal
- Solution: Make Toggle ROBUST & SELF-CONTAINED
  - Explicit track: w-[46px] h-[28px] (slightly larger, well-proportioned)
  - Knob: h-[24px] w-[24px] fixed-size white circle, positioned absolute top-[2px] left-[2px]
  - Add shrink-0 to button, inline-flex
  - Knob: translate-x-[18px] when ON (was 19px, adjust for new track width)
  - Keep rounded-chip for track, rounded-full for knob
  - Keep transition-transform on knob
- Verify: edit modal (Korisniki.tsx) does NOT give Toggle flex-1 or stretch (check existing code)
- Result: Toggle always renders at fixed size, cannot be squashed

BUG #4 — Admin screens have responsive overflow (day selector + form)
- Problem A: Treninzi.tsx day selector (FilterChips PON–SUB) overflows off right edge
- Solution A: 
  - Wrap FilterChips container with `overflow-x-auto`, `flex-nowrap`, `shrink-0` on chips
  - Add .no-scrollbar utility to hide scrollbar (in src/index.css)
  - Apply class to container div
- Problem B: TrainingForm VREME + MAKS row overflows (stepper squashed, fields run off-screen)
- Solution B:
  - Change grid-cols-2 to responsive: flex-col lg:flex-cols-2 (mobile stacks, desktop side-by-side)
  - OR: use flex with min-w-0 on children + sensible gap so labels + controls fit
  - Ensure stepper buttons don't get squeezed: explicit h-[38px] w-[38px] (already present, good)
  - Ensure input has min-w-0 so flex doesn't squeeze it below label width
  - Option: use flex gap-2 with flex-1 on the label-input groups, or two-column responsive grid with mobile override
  - Simpler: wrap each field (label+control) in a `min-w-0 flex-1` div, then flex row with gap
- Problem C: General page-level horizontal scroll (check FilterChips container)
- Solution C:
  - FilterChips parent: `overflow-x-auto`, `flex-nowrap`
  - Chips: `shrink-0`
  - No page-level scroll on main; px-5 or sensible padding
- Implementation: 
  - Treninzi: wrap FilterChips in <div className="overflow-x-auto no-scrollbar"> with flex-nowrap
  - TrainingForm: wrap day chips in same scrollable container
  - TrainingForm: VREME + MAKS row — either flex with min-w-0 or responsive grid (try flex first)
  - index.css: add .no-scrollbar { scrollbar-width: none; } + .no-scrollbar::-webkit-scrollbar { display: none; }

DEFINITION OF DONE
- npm run build exits 0 (tsc -b && vite build)
- npm run lint exits 0 (oxlint clean)
- BUG #1: week is Sunday-start (Sunday is start, rolls over on Monday 00:00 Belgrade time)
- BUG #2: change-password works on /profile (both member + admin roles can change)
- BUG #3: Toggle renders fixed-size in edit-user modal (not squashed)
- BUG #4: day rows scroll horizontally on mobile, new-training form fits viewport with no overflow

Output: produce the code changes. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the project guidance and the listed files first, then apply only the requested surgical changes and run build plus lint.
  → Read CLAUDE.md and inspect the listed implementation files
  • Implement the four targeted fixes
  • Run build and lint; resolve any issues in scope
exec
/bin/zsh -lc "git status --short && sed -n '1,240p' CLAUDE.md && for f in src/lib/week.ts src/contexts/AuthContext.tsx src/screens/Profile.tsx src/components/admin/Toggle.tsx src/screens/admin/Korisnici.tsx src/screens/admin/Treninzi.tsx src/screens/admin/TrainingForm.tsx src/components/admin/FilterChips.tsx src/index.css; do echo \"FILE: "'$f"; sed -n '"'1,320p' \""'$f"; done' in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
?? .tmnt/runs/QA-Batch-1-mikey.md
# Project: PerunApp (working name)

## What this is
<!-- TODO: one-paragraph description of the product. -->

## Target user
<!-- TODO: who it's for. -->

## Scope (what to build)
<!-- TODO: MVP scope as a numbered list. -->

## Explicitly OUT of scope for MVP
<!-- TODO: list the tempting things you are deliberately NOT building yet. -->

## Coding conventions
- TypeScript strict mode (adjust to the chosen stack)
- Keep core logic isolated and unit-testable (no UI/DB coupling)
- Small, reviewable commits; explain each change before making it

## Karpathy Method — Environment (Layer 3)
This repo runs the Karpathy three-layer build discipline. How it routes:

**Skills (in `.claude/skills/`, model-invoked by description):**
- `karpathy-method` — invoke at the START of any multi-step build. Drives the
  Spec → Verifier → Environment loop and the definition-of-done.
- `karpathy-guidelines` — behavioral rules for writing/reviewing each change
  (simplicity, surgical edits, surface assumptions).

**Where knowledge lives:** `.claude/knowledge/` is the durable knowledge base
(design decisions, taxonomy, progression rules, ruled-out dead-ends). Add to it
rather than re-deriving. See `.claude/knowledge/README.md`.

**Hard rules (always-do):**
- Before building anything multi-step, include a verification plan
  (measurable definition-of-done + the green signal you'll run).
- State assumptions explicitly as `(inferred)`; stop the user on the ones that
  most change the design before writing code.
- If about to do something for the third time, turn it into a skill.

**Verifier gate (enforced, not optional):** `git commit`/`git push` are blocked
by the `.claude/hooks/verify-gate.sh` PreToolUse hook until a fresh
`.claude/.verify-pass` marker exists (written after the green signal runs).
This is the physical form of "external signal, not self-report."

**Never-do (ask first):**
- Never declare work "done" without external signal green — say
  `blocked: verification incomplete` instead. (Enforced by the hook above.)
- Never bypass the verifier gate silently. The only sanctioned bypass is
  `[skip-verify]` in the git command, which is logged to `.claude/.verify-log`.

## Agent orchestration (TMNT pod)
Coding/planning work routes through the TMNT pod in `.claude/agents/tmnt/`:
- **splinter** (sensei) — turns intent into a written goal; hands off to leonardo.
- **leonardo** (lead) — decomposes the goal, dispatches specialists, runs the verifier gate.
- **donatello** (backend), **michelangelo** (frontend), **raphael** (QA) — Codex wrappers
  that do the actual code work and verify the definition-of-done.

Agent persistent memory is **isolated to this project**
(`.claude/agents/memory/`) — these agents read/write their memory here, so
PerunApp keeps its own session history independent of other projects.
FILE: src/lib/week.ts
import type { Day } from "@/constants/days";
import { TRAINING_DAYS } from "@/constants/days";

export type TrainingWeekDates = Record<Day, Date>;

export function getCurrentWeekDates(referenceDate: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Belgrade",
    year: "numeric",
  }).formatToParts(referenceDate);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const currentDate = new Date(
    Date.UTC(getPart("year"), getPart("month") - 1, getPart("day")),
  );
  const isoDay = currentDate.getUTCDay() || 7;
  const monday = new Date(currentDate);
  monday.setUTCDate(currentDate.getUTCDate() - isoDay + 1);

  return TRAINING_DAYS.reduce(
    (week, day, index) => {
      const date = new Date(monday);
      date.setUTCDate(monday.getUTCDate() + index);
      week[day] = date;
      return week;
    },
    {
      sunday: new Date(
        Date.UTC(
          monday.getUTCFullYear(),
          monday.getUTCMonth(),
          monday.getUTCDate() + 6,
        ),
      ),
    } as TrainingWeekDates,
  );
}
FILE: src/contexts/AuthContext.tsx
import type { Session } from "@supabase/supabase-js";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import { AuthContext } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/Profile";

export type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single<Profile>();

    if (error) {
      throw error;
    }

    setProfile(data);
  }, []);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setLoading(false);
        return;
      }

      setSession(data.session);
      setProfile(null);

      if (data.session) {
        void fetchProfile(data.session.user.id);
      }

      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return;

        setSession(nextSession);
        setProfile(null);

        if (nextSession) {
          void fetchProfile(nextSession.user.id);
        }
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
        },
      });

      if (error) throw error;
    },
    [],
  );

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) throw error;
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!session) {
        throw new Error("No active session");
      }

      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", session.user.id);

      if (error) throw error;

      await fetchProfile(session.user.id);
    },
    [fetchProfile, session],
  );

  const value = useMemo(
    () => ({
      session,
      loading,
      profile,
      login,
      logout,
      register,
      resetPassword,
      updateProfile,
    }),
    [
      session,
      loading,
      profile,
      login,
      logout,
      register,
      resetPassword,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
FILE: src/screens/Profile.tsx
import { useState } from "react";
import { Link } from "react-router-dom";

import type { Day } from "@/constants/days";
import { TRAINING_DAYS } from "@/constants/days";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTrainings } from "@/hooks/useTrainings";
import { getCurrentWeekDates } from "@/lib/week";

const DAY_LABELS: Record<Day, string> = {
  sunday: "NED",
  monday: "PON",
  tuesday: "UTO",
  wednesday: "SRE",
  thursday: "ČET",
  friday: "PET",
  saturday: "SUB",
};

export default function Profile() {
  const { logout, profile, session } = useAuth();
  const { bookedCount, trainings } = useTrainings();
  const { showToast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);
  const max = profile?.max_sessions_per_week ?? 0;
  const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
  const weekDates = getCurrentWeekDates();
  const initials = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .map((name) => name?.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");
  const bookedSessions = trainings
    .filter(
      (training) =>
        TRAINING_DAYS.includes(training.day_of_week as Day) &&
        training.session_participants.some(
          (participant) => participant.user_id === session?.user.id,
        ),
    )
    .sort((first, second) => {
      const firstDay = first.day_of_week as Day;
      const secondDay = second.day_of_week as Day;
      const dayDifference =
        weekDates[firstDay].getTime() - weekDates[secondDay].getTime();

      return dayDifference || first.time.localeCompare(second.time);
    });

  const isAdmin = profile?.role === "admin";

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
    } catch {
      showToast("Odjava nije uspela. Pokušajte ponovo.");
      setLoggingOut(false);
    }
  }

  // Admin profile: identity + logout only — no member booking/limit sections.
  if (isAdmin) {
    return (
      <main
        className="min-h-[100dvh] bg-paper pb-[calc(28px+env(safe-area-inset-bottom))]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <nav className="flex items-center justify-between px-5 pt-3">
          <Link
            aria-label="Nazad"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-input border border-border bg-surface text-2xl font-bold leading-none text-burgundy active:opacity-85"
            to="/admin"
          >
            ‹
          </Link>
          <h1 className="font-display text-base font-bold text-ink">Profil</h1>
          <div className="w-[38px]" />
        </nav>

        <section className="flex flex-col items-center px-5 pt-[18px] text-center">
          <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full border border-border shadow-sm">
            <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full border-[3px] border-surface bg-navy font-display text-[32px] font-extrabold text-surface">
              {initials || "A"}
            </div>
          </div>
          <h2 className="mt-3.5 font-display text-[21px] font-extrabold text-ink">
            {fullName || "Administrator"}
          </h2>
          <span className="mt-1 rounded-chip border border-burgundy-border bg-burgundy-tint px-2.5 py-1 text-[10px] font-extrabold tracking-[0.08em] text-burgundy">
            ADMIN
          </span>
          {session?.user.email ? (
            <p className="mt-2 text-[13px] font-semibold text-ink-muted">
              {session.user.email}
            </p>
          ) : null}
        </section>

        <div className="px-4 pt-7">
          <button
            className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            type="button"
          >
            {loggingOut ? "Odjava..." : "Odjavi se"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-[100dvh] bg-paper pb-[calc(28px+env(safe-area-inset-bottom))]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <nav className="flex items-center justify-between px-5 pt-3">
        <Link
          aria-label="Nazad"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-input border border-border bg-surface text-2xl font-bold leading-none text-burgundy active:opacity-85"
          to="/"
        >
          ‹
        </Link>
        <h1 className="font-display text-base font-bold text-ink">Profil</h1>
        <div className="w-[38px]" />
      </nav>

      <section className="flex flex-col items-center px-5 pt-[18px] text-center">
        <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full border border-border shadow-sm">
          <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full border-[3px] border-surface bg-burgundy font-display text-[32px] font-extrabold text-surface">
            {initials || "P"}
          </div>
        </div>
        <h2 className="mt-3.5 font-display text-[21px] font-extrabold text-ink">
          {fullName || "Perun član"}
        </h2>
        <span className="mt-1 rounded-chip bg-gold-tint px-2.5 py-1 text-[10px] font-extrabold tracking-[0.05em] text-gold-deep">
          ČLAN PERUN CENTRA
        </span>
      </section>

      <section className="grid grid-cols-2 gap-3 px-5 pt-5">
        <div className="rounded-card border border-border bg-surface px-4 py-4 shadow-sm">
          <p className="font-display text-2xl font-extrabold text-burgundy">
            {bookedCount}
          </p>
          <p className="mt-1 text-[11.5px] font-semibold text-ink-muted">
            treninga ove nedelje
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface px-4 py-4 shadow-sm">
          <p className="font-display text-2xl font-extrabold text-sage">{max}</p>
          <p className="mt-1 text-[11.5px] font-semibold text-ink-muted">
            nedeljni limit
          </p>
        </div>
      </section>

      <section className="mx-5 mt-4 rounded-card border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[14.5px] font-bold text-ink">Nedeljni limit</h2>
          <span className="text-xs font-semibold text-ink-muted">
            {bookedCount} / {max}
          </span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-chip bg-track">
          <div
            className="h-full rounded-chip bg-gold"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      <section className="px-5 pt-5">
        <h2 className="font-display text-xs font-extrabold tracking-[0.08em] text-sage">
          MOJI TERMINI OVE NEDELJE
        </h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {bookedSessions.length > 0 ? (
            bookedSessions.map((training) => {
              const day = training.day_of_week as Day;
              const dateNumber = String(weekDates[day].getUTCDate()).padStart(
                2,
                "0",
              );

              return (
                <article
                  className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-sm"
                  key={training.id}
                >
                  <div className="w-[42px] shrink-0 text-center">
                    <p className="text-[10px] font-extrabold tracking-[0.05em] text-sage">
                      {DAY_LABELS[day]}
                    </p>
                    <p className="font-display text-lg font-extrabold text-ink">
                      {dateNumber}
                    </p>
                  </div>
                  <div className="self-stretch border-l border-border" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-[15px] font-bold text-ink">
                      {training.title}
                    </h3>
                    <p className="mt-0.5 text-xs font-semibold text-sage">
                      {training.time.slice(0, 5)}
                      {training.room ? ` · ${training.room}` : ""}
                    </p>
                  </div>
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-surface">
                    ✓
                  </span>
                </article>
              );
            })
          ) : (
            <div className="rounded-card border border-dashed border-border bg-surface px-5 py-6 text-center text-[13px] font-semibold text-ink-muted">
              Nemaš prijavljene termine ove nedelje.
            </div>
          )}
        </div>
      </section>

      <div className="px-4 pt-[18px]">
        <button
          className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
          disabled={loggingOut}
          onClick={() => void handleLogout()}
          type="button"
        >
          {loggingOut ? "Odjava..." : "Odjavi se"}
        </button>
      </div>
    </main>
  );
}
FILE: src/components/admin/Toggle.tsx
type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export default function Toggle({
  value,
  onChange,
  disabled = false,
}: ToggleProps) {
  return (
    <button
      aria-checked={value}
      className={`relative h-[27px] w-[46px] rounded-chip transition-colors ${
        value ? "bg-burgundy" : "bg-[#DDD3C7]"
      } disabled:opacity-50`}
      disabled={disabled}
      onClick={() => onChange(!value)}
      role="switch"
      type="button"
    >
      <span
        className={`absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-surface transition-transform ${
          value ? "translate-x-[19px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
FILE: src/screens/admin/Korisnici.tsx
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import UserRow from "@/components/admin/UserRow";
import FilterChips from "@/components/admin/FilterChips";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  listUsers,
  updateUser,
  deleteUser,
  type AdminUser,
  type UpdateUserPatch,
} from "@/services/admin";

type FilterKey = "all" | "active" | "admin";

type EditingUser = {
  id: string;
  first_name: string;
  last_name: string | null;
  role: "user" | "admin";
  max_sessions_per_week: number;
  enabled: boolean | null;
};

export default function Korisnici() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterKey, setFilterKey] = useState<FilterKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load users
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);

      try {
        const data = await listUsers();
        setUsers(data);
      } catch {
        setError("Greška pri učitavanju");
        showToast("Greška pri učitavanju korisnika");
      } finally {
        setLoading(false);
      }
    }

    void fetchUsers();
  }, [showToast]);

  // Filter users
  const filtered = useMemo(() => {
    let result = users;

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.first_name?.toLowerCase() ?? "").includes(q) ||
          (u.last_name?.toLowerCase() ?? "").includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }

    // Status/role filter
    switch (filterKey) {
      case "active":
        result = result.filter((u) => u.enabled !== false);
        break;
      case "admin":
        result = result.filter((u) => u.role === "admin");
        break;
      case "all":
      default:
        break;
    }

    return result;
  }, [users, search, filterKey]);

  // Guard: only admins can manage users
  if (profile?.role !== "admin") {
    return (
      <section className="px-5 pt-5">
        <p className="text-[13px] font-semibold text-ink-muted">
          Pristup odbijen.
        </p>
      </section>
    );
  }

  // Edit handler
  async function handleEditSave() {
    if (!editingUser) return;

    setSubmitting(true);
    try {
      const patch: UpdateUserPatch = {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        role: editingUser.role,
        max_sessions_per_week: editingUser.max_sessions_per_week,
        enabled: editingUser.enabled,
      };

      await updateUser(editingUser.id, patch);
      showToast("Korisnik je uspešno ažuriran");

      // Refetch
      const data = await listUsers();
      setUsers(data);
      setEditingUser(null);
      setExpandedId(null);
    } catch {
      showToast("Greška pri čuvanju korisnika");
    } finally {
      setSubmitting(false);
    }
  }

  // Remove handler
  async function handleRemove() {
    if (!confirmRemoveId) return;

    setSubmitting(true);
    try {
      await deleteUser(confirmRemoveId);
      showToast("Korisnik je uklonjen");

      // Refetch
      const data = await listUsers();
      setUsers(data);
      setConfirmRemoveId(null);
      setExpandedId(null);
    } catch {
      showToast("Greška pri uklanjanju korisnika");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="px-5 pt-5 pb-24">
      {/* Header */}
      <div className="flex items-baseline gap-2">
        <h1 className="font-display text-[23px] font-extrabold text-ink">
          Korisnici
        </h1>
        <span className="text-[13px] font-semibold text-ink-muted">
          {filtered.length} članova
        </span>
      </div>

      {/* Search */}
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          placeholder="Pretraži članove…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-input border border-field-border bg-surface py-2.5 pl-10 pr-10 text-sm placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="mt-4">
        <FilterChips
          options={[
            { key: "all", label: "Svi" },
            { key: "active", label: "Aktivni" },
            { key: "admin", label: "Admini" },
          ]}
          value={filterKey}
          onChange={(key) => setFilterKey(key as FilterKey)}
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 rounded-input border border-burgundy-border bg-burgundy-tint p-4 text-sm font-semibold text-burgundy">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-6 flex justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-burgundy"
            role="status"
            aria-label="Učitavanje"
          />
        </div>
      )}

      {/* List */}
      {!loading && !error && (
        <div className="mt-6 space-y-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-ink-muted">
              Nema rezultata.
            </p>
          ) : (
            filtered.map((user, idx) => (
              <UserRow
                key={user.id}
                user={user}
                expanded={expandedId === user.id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === user.id ? null : user.id)
                }
                onEdit={() => {
                  setEditingUser({
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    max_sessions_per_week: user.max_sessions_per_week,
                    enabled: user.enabled ?? true,
                  });
                }}
                onRemove={() => setConfirmRemoveId(user.id)}
                tintIndex={idx}
              />
            ))
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5">
          <div className="w-full max-w-md rounded-[22px] bg-surface p-6">
            <h2 className="font-display text-[20px] font-bold text-ink">
              Izmeni korisnika
            </h2>

            {/* IME */}
            <div className="mt-5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Ime
              </label>
              <input
                type="text"
                value={editingUser.first_name}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    first_name: e.target.value,
                  })
                }
                className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            {/* PREZIME */}
            <div className="mt-4">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Prezime
              </label>
              <input
                type="text"
                value={editingUser.last_name ?? ""}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    last_name: e.target.value || null,
                  })
                }
                className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            {/* ULOGA */}
            <div className="mt-4">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Uloga
              </label>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({ ...editingUser, role: "user" })
                  }
                  className={`flex-1 rounded-input border-2 py-2 px-3 text-sm font-semibold transition-colors ${
                    editingUser.role === "user"
                      ? "border-burgundy bg-burgundy text-surface"
                      : "border-border bg-surface text-ink"
                  }`}
                >
                  Član
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({ ...editingUser, role: "admin" })
                  }
                  className={`flex-1 rounded-input border-2 py-2 px-3 text-sm font-semibold transition-colors ${
                    editingUser.role === "admin"
                      ? "border-burgundy bg-burgundy text-surface"
FILE: src/screens/admin/Treninzi.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import SessionRow from "@/components/admin/SessionRow";
import FilterChips from "@/components/admin/FilterChips";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTrainings } from "@/hooks/useTrainings";
import { setSessionOpen } from "@/services/admin";
import { TRAINING_DAYS, type Day } from "@/constants/days";
import { getCurrentWeekDates } from "@/lib/week";

const DAY_LABELS: Record<string, string> = {
  monday: "Ponedeljak",
  tuesday: "Utorak",
  wednesday: "Sreda",
  thursday: "Četvrtak",
  friday: "Petak",
  saturday: "Subota",
};

export default function Treninzi() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { fetchTrainings, getTrainingsByDay, loading } = useTrainings();
  const [selectedDay, setSelectedDay] = useState<Day>("monday");

  // Guard: only admins
  if (profile?.role !== "admin") {
    return (
      <section className="px-5 pt-5">
        <p className="text-[13px] font-semibold text-ink-muted">
          Pristup odbijen.
        </p>
      </section>
    );
  }

  const weekDates = getCurrentWeekDates();
  const selectedDate = weekDates[selectedDay];
  const dateStr = String(selectedDate.getUTCDate()).padStart(2, "0");

  const sessions = getTrainingsByDay(selectedDay);

  async function handleToggleOpen(sessionId: string, newValue: boolean) {
    try {
      await setSessionOpen(sessionId, newValue);
      await fetchTrainings();
      showToast(newValue ? "Termin je otvoren" : "Termin je zatvoren");
    } catch {
      showToast("Greška pri čuvanju statusa");
      await fetchTrainings(); // Refetch to sync UI
    }
  }

  return (
    <section className="px-5 pt-5 pb-24">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-[23px] font-extrabold text-ink">
            Treninzi
          </h1>
          <p className="mt-1 text-[13px] font-semibold text-ink-muted">
            {DAY_LABELS[selectedDay]} · {dateStr}. jun
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/training/new")}
          className="flex items-center gap-2 rounded-full bg-burgundy px-4 py-2 text-sm font-bold text-surface hover:opacity-90 active:opacity-75"
        >
          <Plus className="h-4 w-4" />
          <span>Novi</span>
        </button>
      </div>

      {/* Day selector */}
      <div className="mt-4">
        <FilterChips
          options={TRAINING_DAYS.map((day) => ({
            key: day,
            label: DAY_LABELS[day].slice(0, 3).toUpperCase(),
          }))}
          value={selectedDay}
          onChange={(key) => setSelectedDay(key as Day)}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-6 flex justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-burgundy"
            role="status"
            aria-label="Učitavanje"
          />
        </div>
      )}

      {/* List */}
      {!loading && (
        <div className="mt-6 space-y-2">
          {sessions.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-ink-muted">
              Nema termina za ovaj dan.
            </p>
          ) : (
            sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                bookedCount={session.session_participants?.length ?? 0}
                onToggleOpen={(open) => handleToggleOpen(session.id, open)}
                onClick={() => navigate(`/admin/training/${session.id}`)}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}
FILE: src/screens/admin/TrainingForm.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Toggle from "@/components/admin/Toggle";
import FilterChips from "@/components/admin/FilterChips";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTrainings } from "@/hooks/useTrainings";
import { upsertSession } from "@/services/admin";
import { TRAINING_DAYS, type Day } from "@/constants/days";

const DAY_LABELS: Record<string, string> = {
  monday: "Ponedeljak",
  tuesday: "Utorak",
  wednesday: "Sreda",
  thursday: "Četvrtak",
  friday: "Petak",
  saturday: "Subota",
};

// Validate time format HH:MM and value range
function isValidTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [hh, mm] = time.split(":").map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

// Format time input: strip non-digits, add ":" after 2 digits
function formatTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

export default function TrainingForm() {
  const navigate = useNavigate();
  const { id = "new" } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { trainings, fetchTrainings } = useTrainings();

  const isNew = id === "new";
  const [title, setTitle] = useState("");
  const [day, setDay] = useState<Day>("monday");
  const [time, setTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isOpen, setIsOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Load existing session if editing
  useEffect(() => {
    if (!isNew && id) {
      const session = trainings.find((s) => s.id === id);
      if (session) {
        setTitle(session.title);
        setDay(session.day_of_week as Day);
        setTime(session.time);
        setMaxParticipants(session.max_participants);
        setIsOpen(session.is_open);
      } else if (trainings.length > 0) {
        // Trainings loaded but session not found
        setNotFound(true);
      }
    }
  }, [id, isNew, trainings]);

  async function handleSave() {
    // Validate
    if (!title.trim()) {
      showToast("Naziv treninga je obavezan");
      return;
    }
    if (!isValidTime(time)) {
      showToast("Vreme mora biti u formatu HH:MM (00:00 - 23:59)");
      return;
    }
    if (maxParticipants < 1) {
      showToast("Minimum 1 učesnik");
      return;
    }

    setSubmitting(true);
    try {
      await upsertSession({
        id: isNew ? null : id,
        title: title.trim(),
        day_of_week: day,
        time,
        room: null,
        duration_min: null,
        max_participants: maxParticipants,
        is_open: isOpen,
      });

      showToast("Trening je uspešno sačuvan");
      await fetchTrainings();
      navigate("/admin/sessions");
    } catch {
      showToast("Greška pri čuvanju treninga");
    } finally {
      setSubmitting(false);
    }
  }

  // Guard: only admins
  if (profile?.role !== "admin") {
    return (
      <main className="min-h-[100dvh] bg-paper px-5 pb-6">
        <p className="mt-5 text-[13px] font-semibold text-ink-muted">
          Pristup odbijen.
        </p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main
        className="min-h-[100dvh] bg-paper px-5 pb-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <nav className="flex items-center gap-4">
          <button
            aria-label="Nazad"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-input border border-border bg-surface text-2xl font-bold leading-none text-burgundy hover:bg-surface-muted active:opacity-70"
            onClick={() => navigate(-1)}
            type="button"
          >
            ‹
          </button>
          <h1 className="font-display text-[23px] font-extrabold text-ink">
            Izmena treninga
          </h1>
        </nav>
        <p className="mt-5 text-sm text-ink-muted">Termin nije pronađen.</p>
        <button
          type="button"
          onClick={() => navigate("/admin/sessions")}
          className="mt-2 text-sm font-semibold text-burgundy hover:underline"
        >
          Nazad na treninge
        </button>
      </main>
    );
  }

  return (
    <main
      className="min-h-[100dvh] bg-paper px-5 pb-32"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
    >
      {/* Nav bar */}
      <nav className="flex items-center gap-4">
        <button
          aria-label="Nazad"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-input border border-border bg-surface text-2xl font-bold leading-none text-burgundy hover:bg-surface-muted active:opacity-70"
          onClick={() => navigate(-1)}
          type="button"
        >
          ‹
        </button>
        <h1 className="font-display text-[23px] font-extrabold text-ink">
          {isNew ? "Novi trening" : "Izmena treninga"}
        </h1>
      </nav>

      {/* NAZIV */}
      <div className="mt-6">
        <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
          Naziv treninga
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Npr. Fitnes, Joga, Kardio…"
          className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-sm placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
      </div>

      {/* DAN */}
      <div className="mt-5">
        <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
          Dan
        </label>
        <div className="mt-1.5">
          <FilterChips
            options={TRAINING_DAYS.map((d) => ({
              key: d,
              label: DAY_LABELS[d],
            }))}
            value={day}
            onChange={(key) => setDay(key as Day)}
          />
        </div>
      </div>

      {/* VREME & MAKS. UČESNIKA row */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        {/* VREME */}
        <div>
          <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
            Vreme
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={time}
            onChange={(e) => setTime(formatTimeInput(e.target.value))}
            placeholder="HH:MM"
            maxLength={5}
            className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>

        {/* MAKS. UČESNIKA */}
        <div>
          <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
            Maks. učesnika
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setMaxParticipants(Math.max(1, maxParticipants - 1))
              }
              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
            >
              −
            </button>
            <input
              type="text"
              value={maxParticipants}
              readOnly
              className="h-[38px] flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
            />
            <button
              type="button"
              onClick={() =>
                setMaxParticipants(Math.min(50, maxParticipants + 1))
              }
              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Status slota */}
      <div className="mt-5 rounded-[22px] border border-gold bg-surface-warm p-4">
        <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
          Status slota
        </label>
        <p className="mt-1 text-xs font-semibold text-ink">
          Otvoren za prijave članova
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">
            {isOpen ? "Otvoren" : "Zatvoren"}
          </span>
          <Toggle value={isOpen} onChange={setIsOpen} />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-paper via-paper to-transparent px-5 pb-6 pt-8">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={submitting}
            className="flex-1 rounded-input border border-field-border bg-surface py-2.5 font-semibold text-ink hover:bg-surface-muted disabled:opacity-50"
          >
            Otkaži
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={submitting}
            className="flex-1 rounded-input bg-burgundy py-2.5 font-semibold text-surface hover:opacity-90 disabled:opacity-50"
          >
            Sačuvaj trening
          </button>
        </div>
      </div>
    </main>
  );
}
FILE: src/components/admin/FilterChips.tsx
type FilterChipsProps<Key extends string> = {
  options: readonly { key: Key; label: string }[];
  value: Key;
  onChange: (key: Key) => void;
};

export default function FilterChips<Key extends string>({
  options,
  value,
  onChange,
}: FilterChipsProps<Key>) {
  return (
    <div className="flex gap-2">
      {options.map((option) => {
        const active = option.key === value;

        return (
          <button
            aria-pressed={active}
            className={`rounded-chip border px-3 py-1.5 text-xs font-bold ${
              active
                ? "border-burgundy bg-burgundy text-surface"
                : "border-field-border bg-surface text-ink"
            }`}
            key={option.key}
            onClick={() => onChange(option.key)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
FILE: src/index.css
@import "tailwindcss";

/* ---------------------------------------------------------------------------
   Perun brand theme (ported from the RN design tokens). Tailwind v4 @theme
   exposes these as utilities (bg-paper, text-ink, rounded-card, etc.).
--------------------------------------------------------------------------- */
@theme {
  /* Colors */
  --color-paper: #fbf7f1;
  --color-surface: #ffffff;
  --color-surface-warm: #fffdf8;
  --color-surface-muted: #faf6ef;
  --color-ink: #221f2b;
  --color-ink-muted: #8b8192;
  --color-ink-faint: #9a8fa0;
  --color-burgundy: #58003d;
  --color-burgundy-tint: #f6e9f0;
  --color-burgundy-border: #eccfdf;
  --color-burgundy-text2: #9a6385;
  --color-gold: #c6a35c;
  --color-gold-deep: #9a7b33;
  --color-gold-tint: #f6efdf;
  --color-gold-border: #e8d9b5;
  --color-sage: #586056;
  --color-sage-tint: #eaede7;
  --color-navy: #22222a;
  --color-border: #f0e8dd;
  --color-track: #efe7da;
  --color-field-border: #ece2d4;

  /* Fonts (loaded via Google Fonts <link> in index.html) */
  --font-display: "Bricolage Grotesque", system-ui, sans-serif;
  --font-sans: "Hanken Grotesk", system-ui, sans-serif;

  /* Radii */
  --radius-card: 22px;
  --radius-input: 15px;
  --radius-chip: 20px;
}

/* ---------------------------------------------------------------------------
   Mobile-web base (99% phone usage). Phone-first; desktop = centered column.
--------------------------------------------------------------------------- */
* {
  -webkit-tap-highlight-color: transparent;
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  margin: 0;
  background: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* App shell: full dynamic viewport height (avoids iOS URL-bar jump), centered
   phone-width column on larger screens. Safe-area padding handled per-screen
   via env() where needed. */
#root {
  min-height: 100dvh;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: var(--color-paper);
}

/* Inputs ≥16px so iOS Safari doesn't auto-zoom on focus. */
input,
textarea,
select,
button {
  font-family: inherit;
  font-size: 16px;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}

codex
Verification plan: confirm Sunday anchoring with focused date cases, then use the repository’s required green signals (`npm run build` and `npm run lint`). I’m treating the requested Belgrade date-only conversion as authoritative; only the week anchor changes, with all returned `Date` objects remaining UTC.
exec
/bin/zsh -lc "rg -n -C 5 \"<Toggle|showToast\\(|type=\\\"password\\\"|Eye|EyeOff|FilterChips|grid-cols-2\" src/screens src/components src/hooks && sed -n '1,220p' src/hooks/useAuth.ts && sed -n '1,180p' src/hooks/useToast.ts && sed -n '1,120p' src/constants/days.ts && sed -n '160,360p' src/screens/admin/Korisnici.tsx && cat package.json" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
src/components/TrainingCard.tsx-74-    setSubmitting(true);
src/components/TrainingCard.tsx-75-
src/components/TrainingCard.tsx-76-    try {
src/components/TrainingCard.tsx-77-      await action(training.id);
src/components/TrainingCard.tsx-78-    } catch (caught) {
src/components/TrainingCard.tsx:79:      showToast(getErrorMessage(caught));
src/components/TrainingCard.tsx-80-    } finally {
src/components/TrainingCard.tsx-81-      setSubmitting(false);
src/components/TrainingCard.tsx-82-    }
src/components/TrainingCard.tsx-83-  }
src/components/TrainingCard.tsx-84-
--
src/screens/admin/TrainingForm.tsx-1-import { useEffect, useState } from "react";
src/screens/admin/TrainingForm.tsx-2-import { useNavigate, useParams } from "react-router-dom";
src/screens/admin/TrainingForm.tsx-3-
src/screens/admin/TrainingForm.tsx-4-import Toggle from "@/components/admin/Toggle";
src/screens/admin/TrainingForm.tsx:5:import FilterChips from "@/components/admin/FilterChips";
src/screens/admin/TrainingForm.tsx-6-import { useAuth } from "@/hooks/useAuth";
src/screens/admin/TrainingForm.tsx-7-import { useToast } from "@/hooks/useToast";
src/screens/admin/TrainingForm.tsx-8-import { useTrainings } from "@/hooks/useTrainings";
src/screens/admin/TrainingForm.tsx-9-import { upsertSession } from "@/services/admin";
src/screens/admin/TrainingForm.tsx-10-import { TRAINING_DAYS, type Day } from "@/constants/days";
--
src/screens/admin/TrainingForm.tsx-66-  }, [id, isNew, trainings]);
src/screens/admin/TrainingForm.tsx-67-
src/screens/admin/TrainingForm.tsx-68-  async function handleSave() {
src/screens/admin/TrainingForm.tsx-69-    // Validate
src/screens/admin/TrainingForm.tsx-70-    if (!title.trim()) {
src/screens/admin/TrainingForm.tsx:71:      showToast("Naziv treninga je obavezan");
src/screens/admin/TrainingForm.tsx-72-      return;
src/screens/admin/TrainingForm.tsx-73-    }
src/screens/admin/TrainingForm.tsx-74-    if (!isValidTime(time)) {
src/screens/admin/TrainingForm.tsx:75:      showToast("Vreme mora biti u formatu HH:MM (00:00 - 23:59)");
src/screens/admin/TrainingForm.tsx-76-      return;
src/screens/admin/TrainingForm.tsx-77-    }
src/screens/admin/TrainingForm.tsx-78-    if (maxParticipants < 1) {
src/screens/admin/TrainingForm.tsx:79:      showToast("Minimum 1 učesnik");
src/screens/admin/TrainingForm.tsx-80-      return;
src/screens/admin/TrainingForm.tsx-81-    }
src/screens/admin/TrainingForm.tsx-82-
src/screens/admin/TrainingForm.tsx-83-    setSubmitting(true);
src/screens/admin/TrainingForm.tsx-84-    try {
--
src/screens/admin/TrainingForm.tsx-91-        duration_min: null,
src/screens/admin/TrainingForm.tsx-92-        max_participants: maxParticipants,
src/screens/admin/TrainingForm.tsx-93-        is_open: isOpen,
src/screens/admin/TrainingForm.tsx-94-      });
src/screens/admin/TrainingForm.tsx-95-
src/screens/admin/TrainingForm.tsx:96:      showToast("Trening je uspešno sačuvan");
src/screens/admin/TrainingForm.tsx-97-      await fetchTrainings();
src/screens/admin/TrainingForm.tsx-98-      navigate("/admin/sessions");
src/screens/admin/TrainingForm.tsx-99-    } catch {
src/screens/admin/TrainingForm.tsx:100:      showToast("Greška pri čuvanju treninga");
src/screens/admin/TrainingForm.tsx-101-    } finally {
src/screens/admin/TrainingForm.tsx-102-      setSubmitting(false);
src/screens/admin/TrainingForm.tsx-103-    }
src/screens/admin/TrainingForm.tsx-104-  }
src/screens/admin/TrainingForm.tsx-105-
--
src/screens/admin/TrainingForm.tsx-183-      <div className="mt-5">
src/screens/admin/TrainingForm.tsx-184-        <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
src/screens/admin/TrainingForm.tsx-185-          Dan
src/screens/admin/TrainingForm.tsx-186-        </label>
src/screens/admin/TrainingForm.tsx-187-        <div className="mt-1.5">
src/screens/admin/TrainingForm.tsx:188:          <FilterChips
src/screens/admin/TrainingForm.tsx-189-            options={TRAINING_DAYS.map((d) => ({
src/screens/admin/TrainingForm.tsx-190-              key: d,
src/screens/admin/TrainingForm.tsx-191-              label: DAY_LABELS[d],
src/screens/admin/TrainingForm.tsx-192-            }))}
src/screens/admin/TrainingForm.tsx-193-            value={day}
--
src/screens/admin/TrainingForm.tsx-195-          />
src/screens/admin/TrainingForm.tsx-196-        </div>
src/screens/admin/TrainingForm.tsx-197-      </div>
src/screens/admin/TrainingForm.tsx-198-
src/screens/admin/TrainingForm.tsx-199-      {/* VREME & MAKS. UČESNIKA row */}
src/screens/admin/TrainingForm.tsx:200:      <div className="mt-5 grid grid-cols-2 gap-4">
src/screens/admin/TrainingForm.tsx-201-        {/* VREME */}
src/screens/admin/TrainingForm.tsx-202-        <div>
src/screens/admin/TrainingForm.tsx-203-          <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
src/screens/admin/TrainingForm.tsx-204-            Vreme
src/screens/admin/TrainingForm.tsx-205-          </label>
--
src/screens/admin/TrainingForm.tsx-258-        </p>
src/screens/admin/TrainingForm.tsx-259-        <div className="mt-3 flex items-center justify-between">
src/screens/admin/TrainingForm.tsx-260-          <span className="text-sm font-semibold text-ink">
src/screens/admin/TrainingForm.tsx-261-            {isOpen ? "Otvoren" : "Zatvoren"}
src/screens/admin/TrainingForm.tsx-262-          </span>
src/screens/admin/TrainingForm.tsx:263:          <Toggle value={isOpen} onChange={setIsOpen} />
src/screens/admin/TrainingForm.tsx-264-        </div>
src/screens/admin/TrainingForm.tsx-265-      </div>
src/screens/admin/TrainingForm.tsx-266-
src/screens/admin/TrainingForm.tsx-267-      {/* Sticky footer */}
src/screens/admin/TrainingForm.tsx-268-      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-paper via-paper to-transparent px-5 pb-6 pt-8">
--
src/components/admin/FilterChips.tsx:1:type FilterChipsProps<Key extends string> = {
src/components/admin/FilterChips.tsx-2-  options: readonly { key: Key; label: string }[];
src/components/admin/FilterChips.tsx-3-  value: Key;
src/components/admin/FilterChips.tsx-4-  onChange: (key: Key) => void;
src/components/admin/FilterChips.tsx-5-};
src/components/admin/FilterChips.tsx-6-
src/components/admin/FilterChips.tsx:7:export default function FilterChips<Key extends string>({
src/components/admin/FilterChips.tsx-8-  options,
src/components/admin/FilterChips.tsx-9-  value,
src/components/admin/FilterChips.tsx-10-  onChange,
src/components/admin/FilterChips.tsx:11:}: FilterChipsProps<Key>) {
src/components/admin/FilterChips.tsx-12-  return (
src/components/admin/FilterChips.tsx-13-    <div className="flex gap-2">
src/components/admin/FilterChips.tsx-14-      {options.map((option) => {
src/components/admin/FilterChips.tsx-15-        const active = option.key === value;
src/components/admin/FilterChips.tsx-16-
--
src/screens/admin/Korisnici.tsx-1-import { useEffect, useMemo, useState } from "react";
src/screens/admin/Korisnici.tsx-2-import { Search, X } from "lucide-react";
src/screens/admin/Korisnici.tsx-3-
src/screens/admin/Korisnici.tsx-4-import UserRow from "@/components/admin/UserRow";
src/screens/admin/Korisnici.tsx:5:import FilterChips from "@/components/admin/FilterChips";
src/screens/admin/Korisnici.tsx-6-import { useAuth } from "@/hooks/useAuth";
src/screens/admin/Korisnici.tsx-7-import { useToast } from "@/hooks/useToast";
src/screens/admin/Korisnici.tsx-8-import {
src/screens/admin/Korisnici.tsx-9-  listUsers,
src/screens/admin/Korisnici.tsx-10-  updateUser,
--
src/screens/admin/Korisnici.tsx-46-      try {
src/screens/admin/Korisnici.tsx-47-        const data = await listUsers();
src/screens/admin/Korisnici.tsx-48-        setUsers(data);
src/screens/admin/Korisnici.tsx-49-      } catch {
src/screens/admin/Korisnici.tsx-50-        setError("Greška pri učitavanju");
src/screens/admin/Korisnici.tsx:51:        showToast("Greška pri učitavanju korisnika");
src/screens/admin/Korisnici.tsx-52-      } finally {
src/screens/admin/Korisnici.tsx-53-        setLoading(false);
src/screens/admin/Korisnici.tsx-54-      }
src/screens/admin/Korisnici.tsx-55-    }
src/screens/admin/Korisnici.tsx-56-
--
src/screens/admin/Korisnici.tsx-112-        max_sessions_per_week: editingUser.max_sessions_per_week,
src/screens/admin/Korisnici.tsx-113-        enabled: editingUser.enabled,
src/screens/admin/Korisnici.tsx-114-      };
src/screens/admin/Korisnici.tsx-115-
src/screens/admin/Korisnici.tsx-116-      await updateUser(editingUser.id, patch);
src/screens/admin/Korisnici.tsx:117:      showToast("Korisnik je uspešno ažuriran");
src/screens/admin/Korisnici.tsx-118-
src/screens/admin/Korisnici.tsx-119-      // Refetch
src/screens/admin/Korisnici.tsx-120-      const data = await listUsers();
src/screens/admin/Korisnici.tsx-121-      setUsers(data);
src/screens/admin/Korisnici.tsx-122-      setEditingUser(null);
src/screens/admin/Korisnici.tsx-123-      setExpandedId(null);
src/screens/admin/Korisnici.tsx-124-    } catch {
src/screens/admin/Korisnici.tsx:125:      showToast("Greška pri čuvanju korisnika");
src/screens/admin/Korisnici.tsx-126-    } finally {
src/screens/admin/Korisnici.tsx-127-      setSubmitting(false);
src/screens/admin/Korisnici.tsx-128-    }
src/screens/admin/Korisnici.tsx-129-  }
src/screens/admin/Korisnici.tsx-130-
--
src/screens/admin/Korisnici.tsx-133-    if (!confirmRemoveId) return;
src/screens/admin/Korisnici.tsx-134-
src/screens/admin/Korisnici.tsx-135-    setSubmitting(true);
src/screens/admin/Korisnici.tsx-136-    try {
src/screens/admin/Korisnici.tsx-137-      await deleteUser(confirmRemoveId);
src/screens/admin/Korisnici.tsx:138:      showToast("Korisnik je uklonjen");
src/screens/admin/Korisnici.tsx-139-
src/screens/admin/Korisnici.tsx-140-      // Refetch
src/screens/admin/Korisnici.tsx-141-      const data = await listUsers();
src/screens/admin/Korisnici.tsx-142-      setUsers(data);
src/screens/admin/Korisnici.tsx-143-      setConfirmRemoveId(null);
src/screens/admin/Korisnici.tsx-144-      setExpandedId(null);
src/screens/admin/Korisnici.tsx-145-    } catch {
src/screens/admin/Korisnici.tsx:146:      showToast("Greška pri uklanjanju korisnika");
src/screens/admin/Korisnici.tsx-147-    } finally {
src/screens/admin/Korisnici.tsx-148-      setSubmitting(false);
src/screens/admin/Korisnici.tsx-149-    }
src/screens/admin/Korisnici.tsx-150-  }
src/screens/admin/Korisnici.tsx-151-
--
src/screens/admin/Korisnici.tsx-182-        )}
src/screens/admin/Korisnici.tsx-183-      </div>
src/screens/admin/Korisnici.tsx-184-
src/screens/admin/Korisnici.tsx-185-      {/* Filter chips */}
src/screens/admin/Korisnici.tsx-186-      <div className="mt-4">
src/screens/admin/Korisnici.tsx:187:        <FilterChips
src/screens/admin/Korisnici.tsx-188-          options={[
src/screens/admin/Korisnici.tsx-189-            { key: "all", label: "Svi" },
src/screens/admin/Korisnici.tsx-190-            { key: "active", label: "Aktivni" },
src/screens/admin/Korisnici.tsx-191-            { key: "admin", label: "Admini" },
src/screens/admin/Korisnici.tsx-192-          ]}
--
src/screens/admin/Statistika.tsx-1-import { useEffect, useState } from "react";
src/screens/admin/Statistika.tsx-2-
src/screens/admin/Statistika.tsx-3-import BarChart from "@/components/admin/BarChart";
src/screens/admin/Statistika.tsx:4:import FilterChips from "@/components/admin/FilterChips";
src/screens/admin/Statistika.tsx-5-import { useAuth } from "@/hooks/useAuth";
src/screens/admin/Statistika.tsx-6-import {
src/screens/admin/Statistika.tsx-7-  memberSeries,
src/screens/admin/Statistika.tsx-8-  occupancySummary,
src/screens/admin/Statistika.tsx-9-  slotPopularity,
--
src/screens/admin/Statistika.tsx-147-        <p className="mt-1 text-[13.5px] font-semibold text-ink-muted">
src/screens/admin/Statistika.tsx-148-          Trendovi članstva i posećenosti
src/screens/admin/Statistika.tsx-149-        </p>
src/screens/admin/Statistika.tsx-150-      </section>
src/screens/admin/Statistika.tsx-151-
src/screens/admin/Statistika.tsx:152:      <FilterChips options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
src/screens/admin/Statistika.tsx-153-
src/screens/admin/Statistika.tsx-154-      <section className="rounded-[18px] border border-border bg-surface p-4 shadow-sm">
src/screens/admin/Statistika.tsx-155-        <div className="flex items-center justify-between gap-3">
src/screens/admin/Statistika.tsx-156-          <div>
src/screens/admin/Statistika.tsx-157-            <h2 className="text-[11px] font-extrabold tracking-[0.1em] text-ink-faint">
--
src/screens/admin/Statistika.tsx-166-          </span>
src/screens/admin/Statistika.tsx-167-        </div>
src/screens/admin/Statistika.tsx-168-        <BarChart currentIndex={chartData.length - 1} data={chartData} />
src/screens/admin/Statistika.tsx-169-      </section>
src/screens/admin/Statistika.tsx-170-
src/screens/admin/Statistika.tsx:171:      <section className="grid grid-cols-2 gap-3">
src/screens/admin/Statistika.tsx-172-        <article className="min-w-0 rounded-[18px] border border-border bg-surface p-4 shadow-sm">
src/screens/admin/Statistika.tsx-173-          <h2 className="text-[11px] font-extrabold tracking-[0.1em] text-ink-faint">
src/screens/admin/Statistika.tsx-174-            NOVIH / MES.
src/screens/admin/Statistika.tsx-175-          </h2>
src/screens/admin/Statistika.tsx-176-          <p className="mt-1 font-display text-[26px] font-extrabold text-gold-deep">
--
src/screens/Profile.tsx-58-    setLoggingOut(true);
src/screens/Profile.tsx-59-
src/screens/Profile.tsx-60-    try {
src/screens/Profile.tsx-61-      await logout();
src/screens/Profile.tsx-62-    } catch {
src/screens/Profile.tsx:63:      showToast("Odjava nije uspela. Pokušajte ponovo.");
src/screens/Profile.tsx-64-      setLoggingOut(false);
src/screens/Profile.tsx-65-    }
src/screens/Profile.tsx-66-  }
src/screens/Profile.tsx-67-
src/screens/Profile.tsx-68-  // Admin profile: identity + logout only — no member booking/limit sections.
--
src/screens/Profile.tsx-146-        <span className="mt-1 rounded-chip bg-gold-tint px-2.5 py-1 text-[10px] font-extrabold tracking-[0.05em] text-gold-deep">
src/screens/Profile.tsx-147-          ČLAN PERUN CENTRA
src/screens/Profile.tsx-148-        </span>
src/screens/Profile.tsx-149-      </section>
src/screens/Profile.tsx-150-
src/screens/Profile.tsx:151:      <section className="grid grid-cols-2 gap-3 px-5 pt-5">
src/screens/Profile.tsx-152-        <div className="rounded-card border border-border bg-surface px-4 py-4 shadow-sm">
src/screens/Profile.tsx-153-          <p className="font-display text-2xl font-extrabold text-burgundy">
src/screens/Profile.tsx-154-            {bookedCount}
src/screens/Profile.tsx-155-          </p>
src/screens/Profile.tsx-156-          <p className="mt-1 text-[11.5px] font-semibold text-ink-muted">
--
src/screens/admin/Treninzi.tsx-1-import { useState } from "react";
src/screens/admin/Treninzi.tsx-2-import { useNavigate } from "react-router-dom";
src/screens/admin/Treninzi.tsx-3-import { Plus } from "lucide-react";
src/screens/admin/Treninzi.tsx-4-
src/screens/admin/Treninzi.tsx-5-import SessionRow from "@/components/admin/SessionRow";
src/screens/admin/Treninzi.tsx:6:import FilterChips from "@/components/admin/FilterChips";
src/screens/admin/Treninzi.tsx-7-import { useAuth } from "@/hooks/useAuth";
src/screens/admin/Treninzi.tsx-8-import { useToast } from "@/hooks/useToast";
src/screens/admin/Treninzi.tsx-9-import { useTrainings } from "@/hooks/useTrainings";
src/screens/admin/Treninzi.tsx-10-import { setSessionOpen } from "@/services/admin";
src/screens/admin/Treninzi.tsx-11-import { TRAINING_DAYS, type Day } from "@/constants/days";
--
src/screens/admin/Treninzi.tsx-46-
src/screens/admin/Treninzi.tsx-47-  async function handleToggleOpen(sessionId: string, newValue: boolean) {
src/screens/admin/Treninzi.tsx-48-    try {
src/screens/admin/Treninzi.tsx-49-      await setSessionOpen(sessionId, newValue);
src/screens/admin/Treninzi.tsx-50-      await fetchTrainings();
src/screens/admin/Treninzi.tsx:51:      showToast(newValue ? "Termin je otvoren" : "Termin je zatvoren");
src/screens/admin/Treninzi.tsx-52-    } catch {
src/screens/admin/Treninzi.tsx:53:      showToast("Greška pri čuvanju statusa");
src/screens/admin/Treninzi.tsx-54-      await fetchTrainings(); // Refetch to sync UI
src/screens/admin/Treninzi.tsx-55-    }
src/screens/admin/Treninzi.tsx-56-  }
src/screens/admin/Treninzi.tsx-57-
src/screens/admin/Treninzi.tsx-58-  return (
--
src/screens/admin/Treninzi.tsx-77-        </button>
src/screens/admin/Treninzi.tsx-78-      </div>
src/screens/admin/Treninzi.tsx-79-
src/screens/admin/Treninzi.tsx-80-      {/* Day selector */}
src/screens/admin/Treninzi.tsx-81-      <div className="mt-4">
src/screens/admin/Treninzi.tsx:82:        <FilterChips
src/screens/admin/Treninzi.tsx-83-          options={TRAINING_DAYS.map((day) => ({
src/screens/admin/Treninzi.tsx-84-            key: day,
src/screens/admin/Treninzi.tsx-85-            label: DAY_LABELS[day].slice(0, 3).toUpperCase(),
src/screens/admin/Treninzi.tsx-86-          }))}
src/screens/admin/Treninzi.tsx-87-          value={selectedDay}
--
src/components/admin/SessionRow.tsx-26-    setSubmitting(true);
src/components/admin/SessionRow.tsx-27-
src/components/admin/SessionRow.tsx-28-    try {
src/components/admin/SessionRow.tsx-29-      await onToggleOpen(open);
src/components/admin/SessionRow.tsx-30-    } catch {
src/components/admin/SessionRow.tsx:31:      showToast("Promena statusa nije uspela.");
src/components/admin/SessionRow.tsx-32-    } finally {
src/components/admin/SessionRow.tsx-33-      setSubmitting(false);
src/components/admin/SessionRow.tsx-34-    }
src/components/admin/SessionRow.tsx-35-  }
src/components/admin/SessionRow.tsx-36-
--
src/components/admin/SessionRow.tsx-88-          <span className="rounded-chip bg-track px-2 py-1 text-[9px] font-extrabold text-ink-muted">
src/components/admin/SessionRow.tsx-89-            Zatvoreno
src/components/admin/SessionRow.tsx-90-          </span>
src/components/admin/SessionRow.tsx-91-        )}
src/components/admin/SessionRow.tsx-92-        <span onClick={(event) => event.stopPropagation()}>
src/components/admin/SessionRow.tsx:93:          <Toggle
src/components/admin/SessionRow.tsx-94-            disabled={submitting}
src/components/admin/SessionRow.tsx-95-            onChange={(open) => void toggle(open)}
src/components/admin/SessionRow.tsx-96-            value={session.is_open}
src/components/admin/SessionRow.tsx-97-          />
src/components/admin/SessionRow.tsx-98-        </span>
--
src/screens/admin/Pregled.tsx-117-        <p className="mt-1 text-[13.5px] font-semibold text-ink-muted">
src/screens/admin/Pregled.tsx-118-          Pregled centra · {MONTHS[now.getMonth()].toLowerCase()} {now.getFullYear()}.
src/screens/admin/Pregled.tsx-119-        </p>
src/screens/admin/Pregled.tsx-120-      </section>
src/screens/admin/Pregled.tsx-121-
src/screens/admin/Pregled.tsx:122:      <section className="grid auto-rows-fr grid-cols-2 gap-[11px]">
src/screens/admin/Pregled.tsx-123-        <StatTile
src/screens/admin/Pregled.tsx-124-          delta={
src/screens/admin/Pregled.tsx-125-            occupancy.new_this_month === 0
src/screens/admin/Pregled.tsx-126-              ? undefined
src/screens/admin/Pregled.tsx-127-              : `▲ +${occupancy.new_this_month} ovog meseca`
import { createContext, useContext } from "react";

import type { AuthContextValue } from "@/contexts/AuthContext";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
import { createContext, useContext } from "react";

import type { ToastContextValue } from "@/contexts/ToastContext";

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
// Week window resets Sunday 00:00 (Sunday-start week).
// DAYS array includes all 7 days for completeness (matching DB schema day_of_week field).
// DayFilter display is currently limited to Mon-Sat (training days), which is maintained
// separately below for backward compatibility with existing UI.

export type Day =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

// Full canonical week (Sunday-start, for DB and date logic)
export const DAYS: Day[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// Days currently displayed in the UI filter (Mon-Sat training schedule)
export const TRAINING_DAYS: Day[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
          {filtered.length} članova
        </span>
      </div>

      {/* Search */}
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          placeholder="Pretraži članove…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-input border border-field-border bg-surface py-2.5 pl-10 pr-10 text-sm placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="mt-4">
        <FilterChips
          options={[
            { key: "all", label: "Svi" },
            { key: "active", label: "Aktivni" },
            { key: "admin", label: "Admini" },
          ]}
          value={filterKey}
          onChange={(key) => setFilterKey(key as FilterKey)}
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 rounded-input border border-burgundy-border bg-burgundy-tint p-4 text-sm font-semibold text-burgundy">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-6 flex justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-burgundy"
            role="status"
            aria-label="Učitavanje"
          />
        </div>
      )}

      {/* List */}
      {!loading && !error && (
        <div className="mt-6 space-y-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-ink-muted">
              Nema rezultata.
            </p>
          ) : (
            filtered.map((user, idx) => (
              <UserRow
                key={user.id}
                user={user}
                expanded={expandedId === user.id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === user.id ? null : user.id)
                }
                onEdit={() => {
                  setEditingUser({
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    max_sessions_per_week: user.max_sessions_per_week,
                    enabled: user.enabled ?? true,
                  });
                }}
                onRemove={() => setConfirmRemoveId(user.id)}
                tintIndex={idx}
              />
            ))
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5">
          <div className="w-full max-w-md rounded-[22px] bg-surface p-6">
            <h2 className="font-display text-[20px] font-bold text-ink">
              Izmeni korisnika
            </h2>

            {/* IME */}
            <div className="mt-5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Ime
              </label>
              <input
                type="text"
                value={editingUser.first_name}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    first_name: e.target.value,
                  })
                }
                className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            {/* PREZIME */}
            <div className="mt-4">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Prezime
              </label>
              <input
                type="text"
                value={editingUser.last_name ?? ""}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    last_name: e.target.value || null,
                  })
                }
                className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            {/* ULOGA */}
            <div className="mt-4">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Uloga
              </label>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({ ...editingUser, role: "user" })
                  }
                  className={`flex-1 rounded-input border-2 py-2 px-3 text-sm font-semibold transition-colors ${
                    editingUser.role === "user"
                      ? "border-burgundy bg-burgundy text-surface"
                      : "border-border bg-surface text-ink"
                  }`}
                >
                  Član
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({ ...editingUser, role: "admin" })
                  }
                  className={`flex-1 rounded-input border-2 py-2 px-3 text-sm font-semibold transition-colors ${
                    editingUser.role === "admin"
                      ? "border-burgundy bg-burgundy text-surface"
                      : "border-border bg-surface text-ink"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* MAKS. SESIJA */}
            <div className="mt-4">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Maks. sesija po nedelji
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({
                      ...editingUser,
                      max_sessions_per_week: Math.max(
                        0,
                        editingUser.max_sessions_per_week - 1,
                      ),
                    })
                  }
                  className="h-9 w-9 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
                >
                  −
                </button>
                <input
                  type="text"
                  value={editingUser.max_sessions_per_week}
                  readOnly
                  className="h-9 flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({
                      ...editingUser,
{
  "name": "perun-web",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": "22.x"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.108.2",
    "lucide-react": "^1.21.0",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.18.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.1",
    "@types/node": "^24.13.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.2",
    "oxlint": "^1.69.0",
    "tailwindcss": "^4.3.1",
    "typescript": "~6.0.2",
    "vite": "^8.1.0",
    "vite-plugin-pwa": "^1.3.0"
  }
}

exec
/bin/zsh -lc "sed -n '300,430p' src/screens/admin/Korisnici.tsx && sed -n '1,180p' src/contexts/ToastContext.tsx && rg -n \"password|ŠIFR|šifr|Lozink|lozink\" src" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({ ...editingUser, role: "user" })
                  }
                  className={`flex-1 rounded-input border-2 py-2 px-3 text-sm font-semibold transition-colors ${
                    editingUser.role === "user"
                      ? "border-burgundy bg-burgundy text-surface"
                      : "border-border bg-surface text-ink"
                  }`}
                >
                  Član
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({ ...editingUser, role: "admin" })
                  }
                  className={`flex-1 rounded-input border-2 py-2 px-3 text-sm font-semibold transition-colors ${
                    editingUser.role === "admin"
                      ? "border-burgundy bg-burgundy text-surface"
                      : "border-border bg-surface text-ink"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* MAKS. SESIJA */}
            <div className="mt-4">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Maks. sesija po nedelji
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({
                      ...editingUser,
                      max_sessions_per_week: Math.max(
                        0,
                        editingUser.max_sessions_per_week - 1,
                      ),
                    })
                  }
                  className="h-9 w-9 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
                >
                  −
                </button>
                <input
                  type="text"
                  value={editingUser.max_sessions_per_week}
                  readOnly
                  className="h-9 flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({
                      ...editingUser,
                      max_sessions_per_week: Math.min(
                        14,
                        editingUser.max_sessions_per_week + 1,
                      ),
                    })
                  }
                  className="h-9 w-9 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
                >
                  +
                </button>
              </div>
            </div>

            {/* Aktivan Toggle */}
            <div className="mt-4 flex items-center justify-between">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Aktivan
              </label>
              <button
                type="button"
                onClick={() =>
                  setEditingUser({
                    ...editingUser,
                    enabled: !editingUser.enabled,
                  })
                }
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  editingUser.enabled ? "bg-burgundy" : "bg-[#DDD3C7]"
                }`}
              >
                <div
                  className={`absolute h-6 w-6 rounded-full bg-white transition-transform ${
                    editingUser.enabled ? "translate-x-0.5" : "translate-x-5"
                  }`}
                />
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={submitting}
                className="flex-1 rounded-input border border-field-border py-2.5 font-semibold text-ink hover:bg-surface-muted disabled:opacity-50"
              >
                Otkaži
              </button>
              <button
                type="button"
                onClick={() => void handleEditSave()}
                disabled={submitting}
                className="flex-1 rounded-input bg-burgundy py-2.5 font-semibold text-surface hover:opacity-90 disabled:opacity-50"
              >
                Sačuvaj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Remove Dialog */}
      {confirmRemoveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5">
          <div className="w-full max-w-md rounded-[22px] bg-surface p-6">
            <h2 className="font-display text-[20px] font-bold text-ink">
              Ukloni korisnika?
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              {users
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { ToastContext } from "@/hooks/useToast";

export type ToastContextValue = {
  showToast: (message: string) => void;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((nextMessage: string) => {
    if (timer.current) clearTimeout(timer.current);

    setMessage(nextMessage);
    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-atomic="true"
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] px-4 pb-[calc(16px+env(safe-area-inset-bottom))] transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <div className="rounded-chip bg-ink px-4 py-3 text-center text-sm font-semibold text-surface shadow-lg">
          {message}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
src/lib/supabase.ts:11:// detects the auth callback in the URL (used by the password-reset flow).
src/App.tsx:95:        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
src/contexts/AuthContext.tsx:18:  login: (email: string, password: string) => Promise<void>;
src/contexts/AuthContext.tsx:22:    password: string,
src/contexts/AuthContext.tsx:89:  const login = useCallback(async (email: string, password: string) => {
src/contexts/AuthContext.tsx:90:    const { error } = await supabase.auth.signInWithPassword({ email, password });
src/contexts/AuthContext.tsx:104:      password: string,
src/contexts/AuthContext.tsx:110:        password,
src/screens/auth/LoginScreen.tsx:10:  const [password, setPassword] = useState("");
src/screens/auth/LoginScreen.tsx:22:      await login(email, password);
src/screens/auth/LoginScreen.tsx:67:                type={visible ? "text" : "password"}
src/screens/auth/LoginScreen.tsx:68:                value={password}
src/screens/auth/LoginScreen.tsx:70:                autoComplete="current-password"
src/screens/auth/LoginScreen.tsx:87:            to="/forgot-password"
src/screens/auth/LoginScreen.tsx:90:            Zaboravljena lozinka?
src/screens/auth/RegisterScreen.tsx:17:  const [password, setPassword] = useState("");
src/screens/auth/RegisterScreen.tsx:29:      await register(email, password, firstName, lastName);
src/screens/auth/RegisterScreen.tsx:96:                type={visible ? "text" : "password"}
src/screens/auth/RegisterScreen.tsx:97:                value={password}
src/screens/auth/RegisterScreen.tsx:99:                autoComplete="new-password"

exec
/bin/zsh -lc "sed -n '1,140p' src/screens/auth/LoginScreen.tsx && sed -n '1,150p' src/screens/auth/RegisterScreen.tsx" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      setComplete(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (complete) return <Navigate to="/" replace />;

  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-[30px] py-8 font-sans"
      style={{ paddingTop: "max(30px, env(safe-area-inset-top))" }}
    >
      <div className="flex w-full flex-col items-center gap-5">
        <img
          src="/brand/perun-emblem-burgundy.png"
          alt="Perun"
          className="h-28 w-28 object-contain"
        />
        <img
          src="/brand/perun-wordmark-burgundy.png"
          alt="Perun Trening Centar"
          className="h-16 w-44 object-contain"
        />

        <form className="flex w-full flex-col gap-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-[11px] font-extrabold tracking-[1.1px] text-ink-faint">
            EMAIL
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="rounded-input border border-field-border bg-surface px-4 py-[15px] text-base font-semibold tracking-normal text-ink outline-none focus:border-gold focus:ring-[3px] focus:ring-gold/15"
            />
          </label>

          <label className="flex flex-col gap-2 text-[11px] font-extrabold tracking-[1.1px] text-ink-faint">
            LOZINKA
            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
              <input
                type={visible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="min-w-0 flex-1 bg-transparent px-4 py-[15px] text-base font-semibold tracking-normal text-ink outline-none"
              />
              <button
                type="button"
                onClick={() => setVisible((current) => !current)}
                className="px-4 text-[13px] font-bold tracking-normal text-sage"
              >
                {visible ? "Sakrij" : "Prikaži"}
              </button>
            </span>
          </label>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <Link
            to="/forgot-password"
            className="mt-1 self-end text-[13px] font-bold text-sage"
          >
            Zaboravljena lozinka?
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-input bg-burgundy p-4 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Učitavanje…" : "Prijavi se"}
          </button>
        </form>

        <p className="text-sm font-semibold text-ink-muted">
          Nemaš nalog?{" "}
          <Link to="/register" className="font-bold text-burgundy">
            Pridruži se
          </Link>
        </p>
      </div>
    </main>
  );
}
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

const inputClassName =
  "rounded-input border border-field-border bg-surface px-4 py-[15px] text-base font-semibold tracking-normal text-ink outline-none focus:border-gold focus:ring-[3px] focus:ring-gold/15";
const labelClassName =
  "flex flex-col gap-2 text-[11px] font-extrabold tracking-[1.1px] text-ink-faint";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await register(email, password, firstName, lastName);
      setComplete(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (complete) return <Navigate to="/" replace />;

  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-[30px] py-8 font-sans"
      style={{ paddingTop: "max(30px, env(safe-area-inset-top))" }}
    >
      <div className="flex w-full flex-col items-center gap-5">
        <img
          src="/brand/perun-emblem-burgundy.png"
          alt="Perun"
          className="h-28 w-28 object-contain"
        />
        <img
          src="/brand/perun-wordmark-burgundy.png"
          alt="Perun Trening Centar"
          className="h-16 w-44 object-contain"
        />

        <form className="flex w-full flex-col gap-3" onSubmit={handleSubmit}>
          <label className={labelClassName}>
            IME
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              required
              className={inputClassName}
            />
          </label>

          <label className={labelClassName}>
            PREZIME
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              required
              className={inputClassName}
            />
          </label>

          <label className={labelClassName}>
            EMAIL
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className={inputClassName}
            />
          </label>

          <label className={labelClassName}>
            LOZINKA
            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
              <input
                type={visible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
                className="min-w-0 flex-1 bg-transparent px-4 py-[15px] text-base font-semibold tracking-normal text-ink outline-none"
              />
              <button
                type="button"
                onClick={() => setVisible((current) => !current)}
                className="px-4 text-[13px] font-bold tracking-normal text-sage"
              >
                {visible ? "Sakrij" : "Prikaži"}
              </button>
            </span>
          </label>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-input bg-burgundy p-4 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Učitavanje…" : "Napravi nalog"}
          </button>
        </form>

        <p className="text-sm font-semibold text-ink-muted">
          Već imaš nalog?{" "}
          <Link to="/login" className="font-bold text-burgundy">
            Prijavi se
          </Link>
        </p>
      </div>
    </main>
  );
}

codex
The edit-user modal currently bypasses the shared `Toggle` and implements a second switch inline. I’ll replace that duplicate with `Toggle`; otherwise hardening `Toggle.tsx` would not fix the modal described in the task.
apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/src/components/admin/FilterChips.tsx
/Users/uros/Documents/Private/Projects/PerunApp/src/components/admin/Toggle.tsx
/Users/uros/Documents/Private/Projects/PerunApp/src/contexts/AuthContext.tsx
/Users/uros/Documents/Private/Projects/PerunApp/src/index.css
/Users/uros/Documents/Private/Projects/PerunApp/src/lib/week.ts
/Users/uros/Documents/Private/Projects/PerunApp/src/screens/admin/Korisnici.tsx
/Users/uros/Documents/Private/Projects/PerunApp/src/screens/admin/TrainingForm.tsx
/Users/uros/Documents/Private/Projects/PerunApp/src/screens/admin/Treninzi.tsx
diff --git a/src/components/admin/FilterChips.tsx b/src/components/admin/FilterChips.tsx
index 892dc67d230091cad0c47b09226e21f3a116b940..260acd380ce7f0fb189799c0c5ad43ea8a3e5130
--- a/src/components/admin/FilterChips.tsx
+++ b/src/components/admin/FilterChips.tsx
@@ -10,14 +10,14 @@
   onChange,
 }: FilterChipsProps<Key>) {
   return (
-    <div className="flex gap-2">
+    <div className="flex flex-nowrap gap-2">
       {options.map((option) => {
         const active = option.key === value;
 
         return (
           <button
             aria-pressed={active}
-            className={`rounded-chip border px-3 py-1.5 text-xs font-bold ${
+            className={`shrink-0 rounded-chip border px-3 py-1.5 text-xs font-bold ${
               active
                 ? "border-burgundy bg-burgundy text-surface"
                 : "border-field-border bg-surface text-ink"
diff --git a/src/components/admin/Toggle.tsx b/src/components/admin/Toggle.tsx
index dd32bd3b575acbacc2c458d7e5f21761c1cdc612..fd152d80d8c5db43986eb983a51f921f9ef4f793
--- a/src/components/admin/Toggle.tsx
+++ b/src/components/admin/Toggle.tsx
@@ -12,7 +12,7 @@
   return (
     <button
       aria-checked={value}
-      className={`relative h-[27px] w-[46px] rounded-chip transition-colors ${
+      className={`relative inline-flex h-[28px] w-[46px] shrink-0 rounded-chip transition-colors ${
         value ? "bg-burgundy" : "bg-[#DDD3C7]"
       } disabled:opacity-50`}
       disabled={disabled}
@@ -21,8 +21,8 @@
       type="button"
     >
       <span
-        className={`absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-surface transition-transform ${
-          value ? "translate-x-[19px]" : "translate-x-0"
+        className={`absolute top-[2px] left-[2px] h-[24px] w-[24px] rounded-full bg-surface transition-transform ${
+          value ? "translate-x-[18px]" : "translate-x-0"
         }`}
       />
     </button>
diff --git a/src/contexts/AuthContext.tsx b/src/contexts/AuthContext.tsx
index 972c4281795ce4065676edf4a457911f4662889b..cd6baffeb88715b401e2385d5f15083ba379cdc2
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -23,6 +23,7 @@
     firstName: string,
     lastName: string,
   ) => Promise<void>;
+  changePassword: (newPassword: string) => Promise<void>;
   resetPassword: (email: string) => Promise<void>;
   updateProfile: (patch: Partial<Profile>) => Promise<void>;
 };
@@ -124,6 +125,12 @@
     if (error) throw error;
   }, []);
 
+  const changePassword = useCallback(async (newPassword: string) => {
+    const { error } = await supabase.auth.updateUser({ password: newPassword });
+
+    if (error) throw error;
+  }, []);
+
   const updateProfile = useCallback(
     async (patch: Partial<Profile>) => {
       if (!session) {
@@ -150,6 +157,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     }),
@@ -160,6 +168,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     ],
diff --git a/src/index.css b/src/index.css
index 5822bdc6338fcdaf4501f9f91587c61530c21d29..228eccd4ad182dc296c28c0f86bf6cf7b918ed6f
--- a/src/index.css
+++ b/src/index.css
@@ -79,6 +79,14 @@
   font-size: 16px;
 }
 
+.no-scrollbar {
+  scrollbar-width: none;
+}
+
+.no-scrollbar::-webkit-scrollbar {
+  display: none;
+}
+
 @media (prefers-reduced-motion: reduce) {
   * {
     animation-duration: 0.001ms !important;
diff --git a/src/lib/week.ts b/src/lib/week.ts
index fcc65332c9a826692f6dcaa6397a1d3b261fa953..10f63b33f490e6ccc8154ac612f401d5216ce575
--- a/src/lib/week.ts
+++ b/src/lib/week.ts
@@ -15,25 +15,17 @@
   const currentDate = new Date(
     Date.UTC(getPart("year"), getPart("month") - 1, getPart("day")),
   );
-  const isoDay = currentDate.getUTCDay() || 7;
-  const monday = new Date(currentDate);
-  monday.setUTCDate(currentDate.getUTCDate() - isoDay + 1);
+  const dayOfWeek = currentDate.getUTCDay();
+  const sunday = new Date(currentDate);
+  sunday.setUTCDate(currentDate.getUTCDate() - dayOfWeek);
 
   return TRAINING_DAYS.reduce(
     (week, day, index) => {
-      const date = new Date(monday);
-      date.setUTCDate(monday.getUTCDate() + index);
+      const date = new Date(sunday);
+      date.setUTCDate(sunday.getUTCDate() + index + 1);
       week[day] = date;
       return week;
     },
-    {
-      sunday: new Date(
-        Date.UTC(
-          monday.getUTCFullYear(),
-          monday.getUTCMonth(),
-          monday.getUTCDate() + 6,
-        ),
-      ),
-    } as TrainingWeekDates,
+    { sunday: new Date(sunday) } as TrainingWeekDates,
   );
 }
diff --git a/src/screens/admin/Korisnici.tsx b/src/screens/admin/Korisnici.tsx
index 2740e236ca2f4da0cd6b5698679e286cbd882a2f..38aa36f73fbbb85feb2af1aaf55589f06f9acf96
--- a/src/screens/admin/Korisnici.tsx
+++ b/src/screens/admin/Korisnici.tsx
@@ -3,6 +3,7 @@
 
 import UserRow from "@/components/admin/UserRow";
 import FilterChips from "@/components/admin/FilterChips";
+import Toggle from "@/components/admin/Toggle";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/useToast";
 import {
@@ -376,24 +377,15 @@
               <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                 Aktivan
               </label>
-              <button
-                type="button"
-                onClick={() =>
+              <Toggle
+                onChange={(enabled) =>
                   setEditingUser({
                     ...editingUser,
-                    enabled: !editingUser.enabled,
+                    enabled,
                   })
                 }
-                className={`relative h-7 w-12 rounded-full transition-colors ${
-                  editingUser.enabled ? "bg-burgundy" : "bg-[#DDD3C7]"
-                }`}
-              >
-                <div
-                  className={`absolute h-6 w-6 rounded-full bg-white transition-transform ${
-                    editingUser.enabled ? "translate-x-0.5" : "translate-x-5"
-                  }`}
-                />
-              </button>
+                value={Boolean(editingUser.enabled)}
+              />
             </div>
 
             {/* Footer */}
diff --git a/src/screens/admin/TrainingForm.tsx b/src/screens/admin/TrainingForm.tsx
index f4d2750060a43f35278d9e897c78644235075f40..6bd708df28aa46b34f71cb679f9841323abf2730
--- a/src/screens/admin/TrainingForm.tsx
+++ b/src/screens/admin/TrainingForm.tsx
@@ -184,7 +184,7 @@
         <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
           Dan
         </label>
-        <div className="mt-1.5">
+        <div className="no-scrollbar mt-1.5 overflow-x-auto">
           <FilterChips
             options={TRAINING_DAYS.map((d) => ({
               key: d,
@@ -197,9 +197,9 @@
       </div>
 
       {/* VREME & MAKS. UČESNIKA row */}
-      <div className="mt-5 grid grid-cols-2 gap-4">
+      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
         {/* VREME */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Vreme
           </label>
@@ -210,12 +210,12 @@
             onChange={(e) => setTime(formatTimeInput(e.target.value))}
             placeholder="HH:MM"
             maxLength={5}
-            className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
+            className="mt-1.5 w-full min-w-0 rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
           />
         </div>
 
         {/* MAKS. UČESNIKA */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Maks. učesnika
           </label>
@@ -225,7 +225,7 @@
               onClick={() =>
                 setMaxParticipants(Math.max(1, maxParticipants - 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               −
             </button>
@@ -233,14 +233,14 @@
               type="text"
               value={maxParticipants}
               readOnly
-              className="h-[38px] flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
+              className="h-[38px] min-w-0 flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
             />
             <button
               type="button"
               onClick={() =>
                 setMaxParticipants(Math.min(50, maxParticipants + 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               +
             </button>
diff --git a/src/screens/admin/Treninzi.tsx b/src/screens/admin/Treninzi.tsx
index 3f397448532eb447eae954c3a870ce7c3bc337af..1b014c8fa03c2b3b2fff7e2dd3e89dd51e758d00
--- a/src/screens/admin/Treninzi.tsx
+++ b/src/screens/admin/Treninzi.tsx
@@ -78,7 +78,7 @@
       </div>
 
       {/* Day selector */}
-      <div className="mt-4">
+      <div className="no-scrollbar mt-4 overflow-x-auto">
         <FilterChips
           options={TRAINING_DAYS.map((day) => ({
             key: day,

diff --git a/src/components/admin/FilterChips.tsx b/src/components/admin/FilterChips.tsx
index 892dc67d230091cad0c47b09226e21f3a116b940..260acd380ce7f0fb189799c0c5ad43ea8a3e5130
--- a/src/components/admin/FilterChips.tsx
+++ b/src/components/admin/FilterChips.tsx
@@ -10,14 +10,14 @@
   onChange,
 }: FilterChipsProps<Key>) {
   return (
-    <div className="flex gap-2">
+    <div className="flex flex-nowrap gap-2">
       {options.map((option) => {
         const active = option.key === value;
 
         return (
           <button
             aria-pressed={active}
-            className={`rounded-chip border px-3 py-1.5 text-xs font-bold ${
+            className={`shrink-0 rounded-chip border px-3 py-1.5 text-xs font-bold ${
               active
                 ? "border-burgundy bg-burgundy text-surface"
                 : "border-field-border bg-surface text-ink"
diff --git a/src/components/admin/Toggle.tsx b/src/components/admin/Toggle.tsx
index dd32bd3b575acbacc2c458d7e5f21761c1cdc612..fd152d80d8c5db43986eb983a51f921f9ef4f793
--- a/src/components/admin/Toggle.tsx
+++ b/src/components/admin/Toggle.tsx
@@ -12,7 +12,7 @@
   return (
     <button
       aria-checked={value}
-      className={`relative h-[27px] w-[46px] rounded-chip transition-colors ${
+      className={`relative inline-flex h-[28px] w-[46px] shrink-0 rounded-chip transition-colors ${
         value ? "bg-burgundy" : "bg-[#DDD3C7]"
       } disabled:opacity-50`}
       disabled={disabled}
@@ -21,8 +21,8 @@
       type="button"
     >
       <span
-        className={`absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-surface transition-transform ${
-          value ? "translate-x-[19px]" : "translate-x-0"
+        className={`absolute top-[2px] left-[2px] h-[24px] w-[24px] rounded-full bg-surface transition-transform ${
+          value ? "translate-x-[18px]" : "translate-x-0"
         }`}
       />
     </button>
diff --git a/src/contexts/AuthContext.tsx b/src/contexts/AuthContext.tsx
index 972c4281795ce4065676edf4a457911f4662889b..cd6baffeb88715b401e2385d5f15083ba379cdc2
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -23,6 +23,7 @@
     firstName: string,
     lastName: string,
   ) => Promise<void>;
+  changePassword: (newPassword: string) => Promise<void>;
   resetPassword: (email: string) => Promise<void>;
   updateProfile: (patch: Partial<Profile>) => Promise<void>;
 };
@@ -124,6 +125,12 @@
     if (error) throw error;
   }, []);
 
+  const changePassword = useCallback(async (newPassword: string) => {
+    const { error } = await supabase.auth.updateUser({ password: newPassword });
+
+    if (error) throw error;
+  }, []);
+
   const updateProfile = useCallback(
     async (patch: Partial<Profile>) => {
       if (!session) {
@@ -150,6 +157,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     }),
@@ -160,6 +168,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     ],
diff --git a/src/index.css b/src/index.css
index 5822bdc6338fcdaf4501f9f91587c61530c21d29..228eccd4ad182dc296c28c0f86bf6cf7b918ed6f
--- a/src/index.css
+++ b/src/index.css
@@ -79,6 +79,14 @@
   font-size: 16px;
 }
 
+.no-scrollbar {
+  scrollbar-width: none;
+}
+
+.no-scrollbar::-webkit-scrollbar {
+  display: none;
+}
+
 @media (prefers-reduced-motion: reduce) {
   * {
     animation-duration: 0.001ms !important;
diff --git a/src/lib/week.ts b/src/lib/week.ts
index fcc65332c9a826692f6dcaa6397a1d3b261fa953..10f63b33f490e6ccc8154ac612f401d5216ce575
--- a/src/lib/week.ts
+++ b/src/lib/week.ts
@@ -15,25 +15,17 @@
   const currentDate = new Date(
     Date.UTC(getPart("year"), getPart("month") - 1, getPart("day")),
   );
-  const isoDay = currentDate.getUTCDay() || 7;
-  const monday = new Date(currentDate);
-  monday.setUTCDate(currentDate.getUTCDate() - isoDay + 1);
+  const dayOfWeek = currentDate.getUTCDay();
+  const sunday = new Date(currentDate);
+  sunday.setUTCDate(currentDate.getUTCDate() - dayOfWeek);
 
   return TRAINING_DAYS.reduce(
     (week, day, index) => {
-      const date = new Date(monday);
-      date.setUTCDate(monday.getUTCDate() + index);
+      const date = new Date(sunday);
+      date.setUTCDate(sunday.getUTCDate() + index + 1);
       week[day] = date;
       return week;
     },
-    {
-      sunday: new Date(
-        Date.UTC(
-          monday.getUTCFullYear(),
-          monday.getUTCMonth(),
-          monday.getUTCDate() + 6,
-        ),
-      ),
-    } as TrainingWeekDates,
+    { sunday: new Date(sunday) } as TrainingWeekDates,
   );
 }
diff --git a/src/screens/admin/Korisnici.tsx b/src/screens/admin/Korisnici.tsx
index 2740e236ca2f4da0cd6b5698679e286cbd882a2f..38aa36f73fbbb85feb2af1aaf55589f06f9acf96
--- a/src/screens/admin/Korisnici.tsx
+++ b/src/screens/admin/Korisnici.tsx
@@ -3,6 +3,7 @@
 
 import UserRow from "@/components/admin/UserRow";
 import FilterChips from "@/components/admin/FilterChips";
+import Toggle from "@/components/admin/Toggle";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/useToast";
 import {
@@ -376,24 +377,15 @@
               <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                 Aktivan
               </label>
-              <button
-                type="button"
-                onClick={() =>
+              <Toggle
+                onChange={(enabled) =>
                   setEditingUser({
                     ...editingUser,
-                    enabled: !editingUser.enabled,
+                    enabled,
                   })
                 }
-                className={`relative h-7 w-12 rounded-full transition-colors ${
-                  editingUser.enabled ? "bg-burgundy" : "bg-[#DDD3C7]"
-                }`}
-              >
-                <div
-                  className={`absolute h-6 w-6 rounded-full bg-white transition-transform ${
-                    editingUser.enabled ? "translate-x-0.5" : "translate-x-5"
-                  }`}
-                />
-              </button>
+                value={Boolean(editingUser.enabled)}
+              />
             </div>
 
             {/* Footer */}
diff --git a/src/screens/admin/TrainingForm.tsx b/src/screens/admin/TrainingForm.tsx
index f4d2750060a43f35278d9e897c78644235075f40..6bd708df28aa46b34f71cb679f9841323abf2730
--- a/src/screens/admin/TrainingForm.tsx
+++ b/src/screens/admin/TrainingForm.tsx
@@ -184,7 +184,7 @@
         <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
           Dan
         </label>
-        <div className="mt-1.5">
+        <div className="no-scrollbar mt-1.5 overflow-x-auto">
           <FilterChips
             options={TRAINING_DAYS.map((d) => ({
               key: d,
@@ -197,9 +197,9 @@
       </div>
 
       {/* VREME & MAKS. UČESNIKA row */}
-      <div className="mt-5 grid grid-cols-2 gap-4">
+      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
         {/* VREME */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Vreme
           </label>
@@ -210,12 +210,12 @@
             onChange={(e) => setTime(formatTimeInput(e.target.value))}
             placeholder="HH:MM"
             maxLength={5}
-            className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
+            className="mt-1.5 w-full min-w-0 rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
           />
         </div>
 
         {/* MAKS. UČESNIKA */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Maks. učesnika
           </label>
@@ -225,7 +225,7 @@
               onClick={() =>
                 setMaxParticipants(Math.max(1, maxParticipants - 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               −
             </button>
@@ -233,14 +233,14 @@
               type="text"
               value={maxParticipants}
               readOnly
-              className="h-[38px] flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
+              className="h-[38px] min-w-0 flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
             />
             <button
               type="button"
               onClick={() =>
                 setMaxParticipants(Math.min(50, maxParticipants + 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               +
             </button>
diff --git a/src/screens/admin/Treninzi.tsx b/src/screens/admin/Treninzi.tsx
index 3f397448532eb447eae954c3a870ce7c3bc337af..1b014c8fa03c2b3b2fff7e2dd3e89dd51e758d00
--- a/src/screens/admin/Treninzi.tsx
+++ b/src/screens/admin/Treninzi.tsx
@@ -78,7 +78,7 @@
       </div>
 
       {/* Day selector */}
-      <div className="mt-4">
+      <div className="no-scrollbar mt-4 overflow-x-auto">
         <FilterChips
           options={TRAINING_DAYS.map((day) => ({
             key: day,

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/src/screens/Profile.tsx
diff --git a/src/components/admin/FilterChips.tsx b/src/components/admin/FilterChips.tsx
index 892dc67d230091cad0c47b09226e21f3a116b940..260acd380ce7f0fb189799c0c5ad43ea8a3e5130
--- a/src/components/admin/FilterChips.tsx
+++ b/src/components/admin/FilterChips.tsx
@@ -10,14 +10,14 @@
   onChange,
 }: FilterChipsProps<Key>) {
   return (
-    <div className="flex gap-2">
+    <div className="flex flex-nowrap gap-2">
       {options.map((option) => {
         const active = option.key === value;
 
         return (
           <button
             aria-pressed={active}
-            className={`rounded-chip border px-3 py-1.5 text-xs font-bold ${
+            className={`shrink-0 rounded-chip border px-3 py-1.5 text-xs font-bold ${
               active
                 ? "border-burgundy bg-burgundy text-surface"
                 : "border-field-border bg-surface text-ink"
diff --git a/src/components/admin/Toggle.tsx b/src/components/admin/Toggle.tsx
index dd32bd3b575acbacc2c458d7e5f21761c1cdc612..fd152d80d8c5db43986eb983a51f921f9ef4f793
--- a/src/components/admin/Toggle.tsx
+++ b/src/components/admin/Toggle.tsx
@@ -12,7 +12,7 @@
   return (
     <button
       aria-checked={value}
-      className={`relative h-[27px] w-[46px] rounded-chip transition-colors ${
+      className={`relative inline-flex h-[28px] w-[46px] shrink-0 rounded-chip transition-colors ${
         value ? "bg-burgundy" : "bg-[#DDD3C7]"
       } disabled:opacity-50`}
       disabled={disabled}
@@ -21,8 +21,8 @@
       type="button"
     >
       <span
-        className={`absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-surface transition-transform ${
-          value ? "translate-x-[19px]" : "translate-x-0"
+        className={`absolute top-[2px] left-[2px] h-[24px] w-[24px] rounded-full bg-surface transition-transform ${
+          value ? "translate-x-[18px]" : "translate-x-0"
         }`}
       />
     </button>
diff --git a/src/contexts/AuthContext.tsx b/src/contexts/AuthContext.tsx
index 972c4281795ce4065676edf4a457911f4662889b..cd6baffeb88715b401e2385d5f15083ba379cdc2
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -23,6 +23,7 @@
     firstName: string,
     lastName: string,
   ) => Promise<void>;
+  changePassword: (newPassword: string) => Promise<void>;
   resetPassword: (email: string) => Promise<void>;
   updateProfile: (patch: Partial<Profile>) => Promise<void>;
 };
@@ -124,6 +125,12 @@
     if (error) throw error;
   }, []);
 
+  const changePassword = useCallback(async (newPassword: string) => {
+    const { error } = await supabase.auth.updateUser({ password: newPassword });
+
+    if (error) throw error;
+  }, []);
+
   const updateProfile = useCallback(
     async (patch: Partial<Profile>) => {
       if (!session) {
@@ -150,6 +157,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     }),
@@ -160,6 +168,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     ],
diff --git a/src/index.css b/src/index.css
index 5822bdc6338fcdaf4501f9f91587c61530c21d29..228eccd4ad182dc296c28c0f86bf6cf7b918ed6f
--- a/src/index.css
+++ b/src/index.css
@@ -79,6 +79,14 @@
   font-size: 16px;
 }
 
+.no-scrollbar {
+  scrollbar-width: none;
+}
+
+.no-scrollbar::-webkit-scrollbar {
+  display: none;
+}
+
 @media (prefers-reduced-motion: reduce) {
   * {
     animation-duration: 0.001ms !important;
diff --git a/src/lib/week.ts b/src/lib/week.ts
index fcc65332c9a826692f6dcaa6397a1d3b261fa953..10f63b33f490e6ccc8154ac612f401d5216ce575
--- a/src/lib/week.ts
+++ b/src/lib/week.ts
@@ -15,25 +15,17 @@
   const currentDate = new Date(
     Date.UTC(getPart("year"), getPart("month") - 1, getPart("day")),
   );
-  const isoDay = currentDate.getUTCDay() || 7;
-  const monday = new Date(currentDate);
-  monday.setUTCDate(currentDate.getUTCDate() - isoDay + 1);
+  const dayOfWeek = currentDate.getUTCDay();
+  const sunday = new Date(currentDate);
+  sunday.setUTCDate(currentDate.getUTCDate() - dayOfWeek);
 
   return TRAINING_DAYS.reduce(
     (week, day, index) => {
-      const date = new Date(monday);
-      date.setUTCDate(monday.getUTCDate() + index);
+      const date = new Date(sunday);
+      date.setUTCDate(sunday.getUTCDate() + index + 1);
       week[day] = date;
       return week;
     },
-    {
-      sunday: new Date(
-        Date.UTC(
-          monday.getUTCFullYear(),
-          monday.getUTCMonth(),
-          monday.getUTCDate() + 6,
-        ),
-      ),
-    } as TrainingWeekDates,
+    { sunday: new Date(sunday) } as TrainingWeekDates,
   );
 }
diff --git a/src/screens/Profile.tsx b/src/screens/Profile.tsx
index f6fe4a18025294ba4afa47c4d0d0a4a1f733090b..efb1f4274e049a10e83d7af8891f1faa8ccab924
--- a/src/screens/Profile.tsx
+++ b/src/screens/Profile.tsx
@@ -19,10 +19,15 @@
 };
 
 export default function Profile() {
-  const { logout, profile, session } = useAuth();
+  const { changePassword, logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
   const { showToast } = useToast();
   const [loggingOut, setLoggingOut] = useState(false);
+  const [showChangePassword, setShowChangePassword] = useState(false);
+  const [newPassword, setNewPassword] = useState("");
+  const [confirmPassword, setConfirmPassword] = useState("");
+  const [changingPassword, setChangingPassword] = useState(false);
+  const [passwordVisible, setPasswordVisible] = useState(false);
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
   const weekDates = getCurrentWeekDates();
@@ -65,6 +70,103 @@
     }
   }
 
+  async function handleChangePassword() {
+    if (newPassword.length < 6) {
+      showToast("Šifra mora imati najmanje 6 znakova.");
+      return;
+    }
+
+    if (newPassword !== confirmPassword) {
+      showToast("Šifre se ne podudaraju.");
+      return;
+    }
+
+    setChangingPassword(true);
+
+    try {
+      await changePassword(newPassword);
+      showToast("Šifra je uspešno promenjena.");
+      setNewPassword("");
+      setConfirmPassword("");
+      setPasswordVisible(false);
+      setShowChangePassword(false);
+    } catch {
+      showToast("Promena šifre nije uspela. Pokušajte ponovo.");
+    } finally {
+      setChangingPassword(false);
+    }
+  }
+
+  const changePasswordSection = (
+    <section className="mx-4 mt-7 rounded-card border border-border bg-surface p-4 shadow-sm">
+      <button
+        aria-expanded={showChangePassword}
+        className="flex w-full items-center justify-between text-left text-sm font-bold text-ink"
+        disabled={changingPassword}
+        onClick={() => setShowChangePassword((current) => !current)}
+        type="button"
+      >
+        Promeni šifru
+        <span className="text-lg leading-none text-burgundy">
+          {showChangePassword ? "−" : "+"}
+        </span>
+      </button>
+
+      {showChangePassword ? (
+        <div className="mt-4 flex flex-col gap-3">
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            NOVA ŠIFRA
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setNewPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={newPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            POTVRDI ŠIFRU
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setConfirmPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={confirmPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <button
+            className="mt-1 w-full rounded-input bg-burgundy py-3 text-sm font-bold text-surface disabled:opacity-50"
+            disabled={changingPassword}
+            onClick={() => void handleChangePassword()}
+            type="button"
+          >
+            {changingPassword ? "Čuvanje..." : "Sačuvaj šifru"}
+          </button>
+        </div>
+      ) : null}
+    </section>
+  );
+
   // Admin profile: identity + logout only — no member booking/limit sections.
   if (isAdmin) {
     return (
@@ -103,7 +205,9 @@
           ) : null}
         </section>
 
-        <div className="px-4 pt-7">
+        {changePasswordSection}
+
+        <div className="px-4 pt-3">
           <button
             className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
             disabled={loggingOut}
@@ -230,7 +334,9 @@
         </div>
       </section>
 
-      <div className="px-4 pt-[18px]">
+      {changePasswordSection}
+
+      <div className="px-4 pt-3">
         <button
           className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
           disabled={loggingOut}
diff --git a/src/screens/admin/Korisnici.tsx b/src/screens/admin/Korisnici.tsx
index 2740e236ca2f4da0cd6b5698679e286cbd882a2f..38aa36f73fbbb85feb2af1aaf55589f06f9acf96
--- a/src/screens/admin/Korisnici.tsx
+++ b/src/screens/admin/Korisnici.tsx
@@ -3,6 +3,7 @@
 
 import UserRow from "@/components/admin/UserRow";
 import FilterChips from "@/components/admin/FilterChips";
+import Toggle from "@/components/admin/Toggle";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/useToast";
 import {
@@ -376,24 +377,15 @@
               <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                 Aktivan
               </label>
-              <button
-                type="button"
-                onClick={() =>
+              <Toggle
+                onChange={(enabled) =>
                   setEditingUser({
                     ...editingUser,
-                    enabled: !editingUser.enabled,
+                    enabled,
                   })
                 }
-                className={`relative h-7 w-12 rounded-full transition-colors ${
-                  editingUser.enabled ? "bg-burgundy" : "bg-[#DDD3C7]"
-                }`}
-              >
-                <div
-                  className={`absolute h-6 w-6 rounded-full bg-white transition-transform ${
-                    editingUser.enabled ? "translate-x-0.5" : "translate-x-5"
-                  }`}
-                />
-              </button>
+                value={Boolean(editingUser.enabled)}
+              />
             </div>
 
             {/* Footer */}
diff --git a/src/screens/admin/TrainingForm.tsx b/src/screens/admin/TrainingForm.tsx
index f4d2750060a43f35278d9e897c78644235075f40..6bd708df28aa46b34f71cb679f9841323abf2730
--- a/src/screens/admin/TrainingForm.tsx
+++ b/src/screens/admin/TrainingForm.tsx
@@ -184,7 +184,7 @@
         <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
           Dan
         </label>
-        <div className="mt-1.5">
+        <div className="no-scrollbar mt-1.5 overflow-x-auto">
           <FilterChips
             options={TRAINING_DAYS.map((d) => ({
               key: d,
@@ -197,9 +197,9 @@
       </div>
 
       {/* VREME & MAKS. UČESNIKA row */}
-      <div className="mt-5 grid grid-cols-2 gap-4">
+      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
         {/* VREME */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Vreme
           </label>
@@ -210,12 +210,12 @@
             onChange={(e) => setTime(formatTimeInput(e.target.value))}
             placeholder="HH:MM"
             maxLength={5}
-            className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
+            className="mt-1.5 w-full min-w-0 rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
           />
         </div>
 
         {/* MAKS. UČESNIKA */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Maks. učesnika
           </label>
@@ -225,7 +225,7 @@
               onClick={() =>
                 setMaxParticipants(Math.max(1, maxParticipants - 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               −
             </button>
@@ -233,14 +233,14 @@
               type="text"
               value={maxParticipants}
               readOnly
-              className="h-[38px] flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
+              className="h-[38px] min-w-0 flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
             />
             <button
               type="button"
               onClick={() =>
                 setMaxParticipants(Math.min(50, maxParticipants + 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               +
             </button>
diff --git a/src/screens/admin/Treninzi.tsx b/src/screens/admin/Treninzi.tsx
index 3f397448532eb447eae954c3a870ce7c3bc337af..1b014c8fa03c2b3b2fff7e2dd3e89dd51e758d00
--- a/src/screens/admin/Treninzi.tsx
+++ b/src/screens/admin/Treninzi.tsx
@@ -78,7 +78,7 @@
       </div>
 
       {/* Day selector */}
-      <div className="mt-4">
+      <div className="no-scrollbar mt-4 overflow-x-auto">
         <FilterChips
           options={TRAINING_DAYS.map((day) => ({
             key: day,

diff --git a/src/components/admin/FilterChips.tsx b/src/components/admin/FilterChips.tsx
index 892dc67d230091cad0c47b09226e21f3a116b940..260acd380ce7f0fb189799c0c5ad43ea8a3e5130
--- a/src/components/admin/FilterChips.tsx
+++ b/src/components/admin/FilterChips.tsx
@@ -10,14 +10,14 @@
   onChange,
 }: FilterChipsProps<Key>) {
   return (
-    <div className="flex gap-2">
+    <div className="flex flex-nowrap gap-2">
       {options.map((option) => {
         const active = option.key === value;
 
         return (
           <button
             aria-pressed={active}
-            className={`rounded-chip border px-3 py-1.5 text-xs font-bold ${
+            className={`shrink-0 rounded-chip border px-3 py-1.5 text-xs font-bold ${
               active
                 ? "border-burgundy bg-burgundy text-surface"
                 : "border-field-border bg-surface text-ink"
diff --git a/src/components/admin/Toggle.tsx b/src/components/admin/Toggle.tsx
index dd32bd3b575acbacc2c458d7e5f21761c1cdc612..fd152d80d8c5db43986eb983a51f921f9ef4f793
--- a/src/components/admin/Toggle.tsx
+++ b/src/components/admin/Toggle.tsx
@@ -12,7 +12,7 @@
   return (
     <button
       aria-checked={value}
-      className={`relative h-[27px] w-[46px] rounded-chip transition-colors ${
+      className={`relative inline-flex h-[28px] w-[46px] shrink-0 rounded-chip transition-colors ${
         value ? "bg-burgundy" : "bg-[#DDD3C7]"
       } disabled:opacity-50`}
       disabled={disabled}
@@ -21,8 +21,8 @@
       type="button"
     >
       <span
-        className={`absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-surface transition-transform ${
-          value ? "translate-x-[19px]" : "translate-x-0"
+        className={`absolute top-[2px] left-[2px] h-[24px] w-[24px] rounded-full bg-surface transition-transform ${
+          value ? "translate-x-[18px]" : "translate-x-0"
         }`}
       />
     </button>
diff --git a/src/contexts/AuthContext.tsx b/src/contexts/AuthContext.tsx
index 972c4281795ce4065676edf4a457911f4662889b..cd6baffeb88715b401e2385d5f15083ba379cdc2
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -23,6 +23,7 @@
     firstName: string,
     lastName: string,
   ) => Promise<void>;
+  changePassword: (newPassword: string) => Promise<void>;
   resetPassword: (email: string) => Promise<void>;
   updateProfile: (patch: Partial<Profile>) => Promise<void>;
 };
@@ -124,6 +125,12 @@
     if (error) throw error;
   }, []);
 
+  const changePassword = useCallback(async (newPassword: string) => {
+    const { error } = await supabase.auth.updateUser({ password: newPassword });
+
+    if (error) throw error;
+  }, []);
+
   const updateProfile = useCallback(
     async (patch: Partial<Profile>) => {
       if (!session) {
@@ -150,6 +157,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     }),
@@ -160,6 +168,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     ],
diff --git a/src/index.css b/src/index.css
index 5822bdc6338fcdaf4501f9f91587c61530c21d29..228eccd4ad182dc296c28c0f86bf6cf7b918ed6f
--- a/src/index.css
+++ b/src/index.css
@@ -79,6 +79,14 @@
   font-size: 16px;
 }
 
+.no-scrollbar {
+  scrollbar-width: none;
+}
+
+.no-scrollbar::-webkit-scrollbar {
+  display: none;
+}
+
 @media (prefers-reduced-motion: reduce) {
   * {
     animation-duration: 0.001ms !important;
diff --git a/src/lib/week.ts b/src/lib/week.ts
index fcc65332c9a826692f6dcaa6397a1d3b261fa953..10f63b33f490e6ccc8154ac612f401d5216ce575
--- a/src/lib/week.ts
+++ b/src/lib/week.ts
@@ -15,25 +15,17 @@
   const currentDate = new Date(
     Date.UTC(getPart("year"), getPart("month") - 1, getPart("day")),
   );
-  const isoDay = currentDate.getUTCDay() || 7;
-  const monday = new Date(currentDate);
-  monday.setUTCDate(currentDate.getUTCDate() - isoDay + 1);
+  const dayOfWeek = currentDate.getUTCDay();
+  const sunday = new Date(currentDate);
+  sunday.setUTCDate(currentDate.getUTCDate() - dayOfWeek);
 
   return TRAINING_DAYS.reduce(
     (week, day, index) => {
-      const date = new Date(monday);
-      date.setUTCDate(monday.getUTCDate() + index);
+      const date = new Date(sunday);
+      date.setUTCDate(sunday.getUTCDate() + index + 1);
       week[day] = date;
       return week;
     },
-    {
-      sunday: new Date(
-        Date.UTC(
-          monday.getUTCFullYear(),
-          monday.getUTCMonth(),
-          monday.getUTCDate() + 6,
-        ),
-      ),
-    } as TrainingWeekDates,
+    { sunday: new Date(sunday) } as TrainingWeekDates,
   );
 }
diff --git a/src/screens/Profile.tsx b/src/screens/Profile.tsx
index f6fe4a18025294ba4afa47c4d0d0a4a1f733090b..efb1f4274e049a10e83d7af8891f1faa8ccab924
--- a/src/screens/Profile.tsx
+++ b/src/screens/Profile.tsx
@@ -19,10 +19,15 @@
 };
 
 export default function Profile() {
-  const { logout, profile, session } = useAuth();
+  const { changePassword, logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
   const { showToast } = useToast();
   const [loggingOut, setLoggingOut] = useState(false);
+  const [showChangePassword, setShowChangePassword] = useState(false);
+  const [newPassword, setNewPassword] = useState("");
+  const [confirmPassword, setConfirmPassword] = useState("");
+  const [changingPassword, setChangingPassword] = useState(false);
+  const [passwordVisible, setPasswordVisible] = useState(false);
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
   const weekDates = getCurrentWeekDates();
@@ -65,6 +70,103 @@
     }
   }
 
+  async function handleChangePassword() {
+    if (newPassword.length < 6) {
+      showToast("Šifra mora imati najmanje 6 znakova.");
+      return;
+    }
+
+    if (newPassword !== confirmPassword) {
+      showToast("Šifre se ne podudaraju.");
+      return;
+    }
+
+    setChangingPassword(true);
+
+    try {
+      await changePassword(newPassword);
+      showToast("Šifra je uspešno promenjena.");
+      setNewPassword("");
+      setConfirmPassword("");
+      setPasswordVisible(false);
+      setShowChangePassword(false);
+    } catch {
+      showToast("Promena šifre nije uspela. Pokušajte ponovo.");
+    } finally {
+      setChangingPassword(false);
+    }
+  }
+
+  const changePasswordSection = (
+    <section className="mx-4 mt-7 rounded-card border border-border bg-surface p-4 shadow-sm">
+      <button
+        aria-expanded={showChangePassword}
+        className="flex w-full items-center justify-between text-left text-sm font-bold text-ink"
+        disabled={changingPassword}
+        onClick={() => setShowChangePassword((current) => !current)}
+        type="button"
+      >
+        Promeni šifru
+        <span className="text-lg leading-none text-burgundy">
+          {showChangePassword ? "−" : "+"}
+        </span>
+      </button>
+
+      {showChangePassword ? (
+        <div className="mt-4 flex flex-col gap-3">
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            NOVA ŠIFRA
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setNewPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={newPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            POTVRDI ŠIFRU
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setConfirmPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={confirmPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <button
+            className="mt-1 w-full rounded-input bg-burgundy py-3 text-sm font-bold text-surface disabled:opacity-50"
+            disabled={changingPassword}
+            onClick={() => void handleChangePassword()}
+            type="button"
+          >
+            {changingPassword ? "Čuvanje..." : "Sačuvaj šifru"}
+          </button>
+        </div>
+      ) : null}
+    </section>
+  );
+
   // Admin profile: identity + logout only — no member booking/limit sections.
   if (isAdmin) {
     return (
@@ -103,7 +205,9 @@
           ) : null}
         </section>
 
-        <div className="px-4 pt-7">
+        {changePasswordSection}
+
+        <div className="px-4 pt-3">
           <button
             className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
             disabled={loggingOut}
@@ -230,7 +334,9 @@
         </div>
       </section>
 
-      <div className="px-4 pt-[18px]">
+      {changePasswordSection}
+
+      <div className="px-4 pt-3">
         <button
           className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
           disabled={loggingOut}
diff --git a/src/screens/admin/Korisnici.tsx b/src/screens/admin/Korisnici.tsx
index 2740e236ca2f4da0cd6b5698679e286cbd882a2f..38aa36f73fbbb85feb2af1aaf55589f06f9acf96
--- a/src/screens/admin/Korisnici.tsx
+++ b/src/screens/admin/Korisnici.tsx
@@ -3,6 +3,7 @@
 
 import UserRow from "@/components/admin/UserRow";
 import FilterChips from "@/components/admin/FilterChips";
+import Toggle from "@/components/admin/Toggle";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/useToast";
 import {
@@ -376,24 +377,15 @@
               <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                 Aktivan
               </label>
-              <button
-                type="button"
-                onClick={() =>
+              <Toggle
+                onChange={(enabled) =>
                   setEditingUser({
                     ...editingUser,
-                    enabled: !editingUser.enabled,
+                    enabled,
                   })
                 }
-                className={`relative h-7 w-12 rounded-full transition-colors ${
-                  editingUser.enabled ? "bg-burgundy" : "bg-[#DDD3C7]"
-                }`}
-              >
-                <div
-                  className={`absolute h-6 w-6 rounded-full bg-white transition-transform ${
-                    editingUser.enabled ? "translate-x-0.5" : "translate-x-5"
-                  }`}
-                />
-              </button>
+                value={Boolean(editingUser.enabled)}
+              />
             </div>
 
             {/* Footer */}
diff --git a/src/screens/admin/TrainingForm.tsx b/src/screens/admin/TrainingForm.tsx
index f4d2750060a43f35278d9e897c78644235075f40..6bd708df28aa46b34f71cb679f9841323abf2730
--- a/src/screens/admin/TrainingForm.tsx
+++ b/src/screens/admin/TrainingForm.tsx
@@ -184,7 +184,7 @@
         <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
           Dan
         </label>
-        <div className="mt-1.5">
+        <div className="no-scrollbar mt-1.5 overflow-x-auto">
           <FilterChips
             options={TRAINING_DAYS.map((d) => ({
               key: d,
@@ -197,9 +197,9 @@
       </div>
 
       {/* VREME & MAKS. UČESNIKA row */}
-      <div className="mt-5 grid grid-cols-2 gap-4">
+      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
         {/* VREME */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Vreme
           </label>
@@ -210,12 +210,12 @@
             onChange={(e) => setTime(formatTimeInput(e.target.value))}
             placeholder="HH:MM"
             maxLength={5}
-            className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
+            className="mt-1.5 w-full min-w-0 rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
           />
         </div>
 
         {/* MAKS. UČESNIKA */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Maks. učesnika
           </label>
@@ -225,7 +225,7 @@
               onClick={() =>
                 setMaxParticipants(Math.max(1, maxParticipants - 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               −
             </button>
@@ -233,14 +233,14 @@
               type="text"
               value={maxParticipants}
               readOnly
-              className="h-[38px] flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
+              className="h-[38px] min-w-0 flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
             />
             <button
               type="button"
               onClick={() =>
                 setMaxParticipants(Math.min(50, maxParticipants + 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               +
             </button>
diff --git a/src/screens/admin/Treninzi.tsx b/src/screens/admin/Treninzi.tsx
index 3f397448532eb447eae954c3a870ce7c3bc337af..1b014c8fa03c2b3b2fff7e2dd3e89dd51e758d00
--- a/src/screens/admin/Treninzi.tsx
+++ b/src/screens/admin/Treninzi.tsx
@@ -78,7 +78,7 @@
       </div>
 
       {/* Day selector */}
-      <div className="mt-4">
+      <div className="no-scrollbar mt-4 overflow-x-auto">
         <FilterChips
           options={TRAINING_DAYS.map((day) => ({
             key: day,

All four fixes are implemented, including replacing the modal’s duplicate switch with the shared fixed-size Toggle.
  ✓ Read CLAUDE.md and inspect the listed implementation files
  ✓ Implement the four targeted fixes
  → Run build and lint; resolve any issues in scope
exec
/bin/zsh -lc 'git diff --check && git diff -- src/lib/week.ts src/contexts/AuthContext.tsx src/screens/Profile.tsx src/components/admin/Toggle.tsx src/screens/admin/Korisnici.tsx src/screens/admin/Treninzi.tsx src/screens/admin/TrainingForm.tsx src/components/admin/FilterChips.tsx src/index.css && npm run build && npm run lint' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/src/components/admin/FilterChips.tsx b/src/components/admin/FilterChips.tsx
index 892dc67d230091cad0c47b09226e21f3a116b940..260acd380ce7f0fb189799c0c5ad43ea8a3e5130
--- a/src/components/admin/FilterChips.tsx
+++ b/src/components/admin/FilterChips.tsx
@@ -10,14 +10,14 @@
   onChange,
 }: FilterChipsProps<Key>) {
   return (
-    <div className="flex gap-2">
+    <div className="flex flex-nowrap gap-2">
       {options.map((option) => {
         const active = option.key === value;
 
         return (
           <button
             aria-pressed={active}
-            className={`rounded-chip border px-3 py-1.5 text-xs font-bold ${
+            className={`shrink-0 rounded-chip border px-3 py-1.5 text-xs font-bold ${
               active
                 ? "border-burgundy bg-burgundy text-surface"
                 : "border-field-border bg-surface text-ink"
diff --git a/src/components/admin/Toggle.tsx b/src/components/admin/Toggle.tsx
index dd32bd3b575acbacc2c458d7e5f21761c1cdc612..fd152d80d8c5db43986eb983a51f921f9ef4f793
--- a/src/components/admin/Toggle.tsx
+++ b/src/components/admin/Toggle.tsx
@@ -12,7 +12,7 @@
   return (
     <button
       aria-checked={value}
-      className={`relative h-[27px] w-[46px] rounded-chip transition-colors ${
+      className={`relative inline-flex h-[28px] w-[46px] shrink-0 rounded-chip transition-colors ${
         value ? "bg-burgundy" : "bg-[#DDD3C7]"
       } disabled:opacity-50`}
       disabled={disabled}
@@ -21,8 +21,8 @@
       type="button"
     >
       <span
-        className={`absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-surface transition-transform ${
-          value ? "translate-x-[19px]" : "translate-x-0"
+        className={`absolute top-[2px] left-[2px] h-[24px] w-[24px] rounded-full bg-surface transition-transform ${
+          value ? "translate-x-[18px]" : "translate-x-0"
         }`}
       />
     </button>
diff --git a/src/contexts/AuthContext.tsx b/src/contexts/AuthContext.tsx
index 972c4281795ce4065676edf4a457911f4662889b..cd6baffeb88715b401e2385d5f15083ba379cdc2
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -23,6 +23,7 @@
     firstName: string,
     lastName: string,
   ) => Promise<void>;
+  changePassword: (newPassword: string) => Promise<void>;
   resetPassword: (email: string) => Promise<void>;
   updateProfile: (patch: Partial<Profile>) => Promise<void>;
 };
@@ -124,6 +125,12 @@
     if (error) throw error;
   }, []);
 
+  const changePassword = useCallback(async (newPassword: string) => {
+    const { error } = await supabase.auth.updateUser({ password: newPassword });
+
+    if (error) throw error;
+  }, []);
+
   const updateProfile = useCallback(
     async (patch: Partial<Profile>) => {
       if (!session) {
@@ -150,6 +157,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     }),
@@ -160,6 +168,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     ],
diff --git a/src/index.css b/src/index.css
index 5822bdc6338fcdaf4501f9f91587c61530c21d29..228eccd4ad182dc296c28c0f86bf6cf7b918ed6f
--- a/src/index.css
+++ b/src/index.css
@@ -79,6 +79,14 @@
   font-size: 16px;
 }
 
+.no-scrollbar {
+  scrollbar-width: none;
+}
+
+.no-scrollbar::-webkit-scrollbar {
+  display: none;
+}
+
 @media (prefers-reduced-motion: reduce) {
   * {
     animation-duration: 0.001ms !important;
diff --git a/src/lib/week.ts b/src/lib/week.ts
index fcc65332c9a826692f6dcaa6397a1d3b261fa953..10f63b33f490e6ccc8154ac612f401d5216ce575
--- a/src/lib/week.ts
+++ b/src/lib/week.ts
@@ -15,25 +15,17 @@
   const currentDate = new Date(
     Date.UTC(getPart("year"), getPart("month") - 1, getPart("day")),
   );
-  const isoDay = currentDate.getUTCDay() || 7;
-  const monday = new Date(currentDate);
-  monday.setUTCDate(currentDate.getUTCDate() - isoDay + 1);
+  const dayOfWeek = currentDate.getUTCDay();
+  const sunday = new Date(currentDate);
+  sunday.setUTCDate(currentDate.getUTCDate() - dayOfWeek);
 
   return TRAINING_DAYS.reduce(
     (week, day, index) => {
-      const date = new Date(monday);
-      date.setUTCDate(monday.getUTCDate() + index);
+      const date = new Date(sunday);
+      date.setUTCDate(sunday.getUTCDate() + index + 1);
       week[day] = date;
       return week;
     },
-    {
-      sunday: new Date(
-        Date.UTC(
-          monday.getUTCFullYear(),
-          monday.getUTCMonth(),
-          monday.getUTCDate() + 6,
-        ),
-      ),
-    } as TrainingWeekDates,
+    { sunday: new Date(sunday) } as TrainingWeekDates,
   );
 }
diff --git a/src/screens/Profile.tsx b/src/screens/Profile.tsx
index f6fe4a18025294ba4afa47c4d0d0a4a1f733090b..efb1f4274e049a10e83d7af8891f1faa8ccab924
--- a/src/screens/Profile.tsx
+++ b/src/screens/Profile.tsx
@@ -19,10 +19,15 @@
 };
 
 export default function Profile() {
-  const { logout, profile, session } = useAuth();
+  const { changePassword, logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
   const { showToast } = useToast();
   const [loggingOut, setLoggingOut] = useState(false);
+  const [showChangePassword, setShowChangePassword] = useState(false);
+  const [newPassword, setNewPassword] = useState("");
+  const [confirmPassword, setConfirmPassword] = useState("");
+  const [changingPassword, setChangingPassword] = useState(false);
+  const [passwordVisible, setPasswordVisible] = useState(false);
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
   const weekDates = getCurrentWeekDates();
@@ -65,6 +70,103 @@
     }
   }
 
+  async function handleChangePassword() {
+    if (newPassword.length < 6) {
+      showToast("Šifra mora imati najmanje 6 znakova.");
+      return;
+    }
+
+    if (newPassword !== confirmPassword) {
+      showToast("Šifre se ne podudaraju.");
+      return;
+    }
+
+    setChangingPassword(true);
+
+    try {
+      await changePassword(newPassword);
+      showToast("Šifra je uspešno promenjena.");
+      setNewPassword("");
+      setConfirmPassword("");
+      setPasswordVisible(false);
+      setShowChangePassword(false);
+    } catch {
+      showToast("Promena šifre nije uspela. Pokušajte ponovo.");
+    } finally {
+      setChangingPassword(false);
+    }
+  }
+
+  const changePasswordSection = (
+    <section className="mx-4 mt-7 rounded-card border border-border bg-surface p-4 shadow-sm">
+      <button
+        aria-expanded={showChangePassword}
+        className="flex w-full items-center justify-between text-left text-sm font-bold text-ink"
+        disabled={changingPassword}
+        onClick={() => setShowChangePassword((current) => !current)}
+        type="button"
+      >
+        Promeni šifru
+        <span className="text-lg leading-none text-burgundy">
+          {showChangePassword ? "−" : "+"}
+        </span>
+      </button>
+
+      {showChangePassword ? (
+        <div className="mt-4 flex flex-col gap-3">
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            NOVA ŠIFRA
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setNewPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={newPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            POTVRDI ŠIFRU
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setConfirmPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={confirmPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <button
+            className="mt-1 w-full rounded-input bg-burgundy py-3 text-sm font-bold text-surface disabled:opacity-50"
+            disabled={changingPassword}
+            onClick={() => void handleChangePassword()}
+            type="button"
+          >
+            {changingPassword ? "Čuvanje..." : "Sačuvaj šifru"}
+          </button>
+        </div>
+      ) : null}
+    </section>
+  );
+
   // Admin profile: identity + logout only — no member booking/limit sections.
   if (isAdmin) {
     return (
@@ -103,7 +205,9 @@
           ) : null}
         </section>
 
-        <div className="px-4 pt-7">
+        {changePasswordSection}
+
+        <div className="px-4 pt-3">
           <button
             className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
             disabled={loggingOut}
@@ -230,7 +334,9 @@
         </div>
       </section>
 
-      <div className="px-4 pt-[18px]">
+      {changePasswordSection}
+
+      <div className="px-4 pt-3">
         <button
           className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
           disabled={loggingOut}
diff --git a/src/screens/admin/Korisnici.tsx b/src/screens/admin/Korisnici.tsx
index 2740e236ca2f4da0cd6b5698679e286cbd882a2f..38aa36f73fbbb85feb2af1aaf55589f06f9acf96
--- a/src/screens/admin/Korisnici.tsx
+++ b/src/screens/admin/Korisnici.tsx
@@ -3,6 +3,7 @@
 
 import UserRow from "@/components/admin/UserRow";
 import FilterChips from "@/components/admin/FilterChips";
+import Toggle from "@/components/admin/Toggle";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/useToast";
 import {
@@ -376,24 +377,15 @@
               <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                 Aktivan
               </label>
-              <button
-                type="button"
-                onClick={() =>
+              <Toggle
+                onChange={(enabled) =>
                   setEditingUser({
                     ...editingUser,
-                    enabled: !editingUser.enabled,
+                    enabled,
                   })
                 }
-                className={`relative h-7 w-12 rounded-full transition-colors ${
-                  editingUser.enabled ? "bg-burgundy" : "bg-[#DDD3C7]"
-                }`}
-              >
-                <div
-                  className={`absolute h-6 w-6 rounded-full bg-white transition-transform ${
-                    editingUser.enabled ? "translate-x-0.5" : "translate-x-5"
-                  }`}
-                />
-              </button>
+                value={Boolean(editingUser.enabled)}
+              />
             </div>
 
             {/* Footer */}
diff --git a/src/screens/admin/TrainingForm.tsx b/src/screens/admin/TrainingForm.tsx
index f4d2750060a43f35278d9e897c78644235075f40..6bd708df28aa46b34f71cb679f9841323abf2730
--- a/src/screens/admin/TrainingForm.tsx
+++ b/src/screens/admin/TrainingForm.tsx
@@ -184,7 +184,7 @@
         <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
           Dan
         </label>
-        <div className="mt-1.5">
+        <div className="no-scrollbar mt-1.5 overflow-x-auto">
           <FilterChips
             options={TRAINING_DAYS.map((d) => ({
               key: d,
@@ -197,9 +197,9 @@
       </div>
 
       {/* VREME & MAKS. UČESNIKA row */}
-      <div className="mt-5 grid grid-cols-2 gap-4">
+      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
         {/* VREME */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Vreme
           </label>
@@ -210,12 +210,12 @@
             onChange={(e) => setTime(formatTimeInput(e.target.value))}
             placeholder="HH:MM"
             maxLength={5}
-            className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
+            className="mt-1.5 w-full min-w-0 rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
           />
         </div>
 
         {/* MAKS. UČESNIKA */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Maks. učesnika
           </label>
@@ -225,7 +225,7 @@
               onClick={() =>
                 setMaxParticipants(Math.max(1, maxParticipants - 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               −
             </button>
@@ -233,14 +233,14 @@
               type="text"
               value={maxParticipants}
               readOnly
-              className="h-[38px] flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
+              className="h-[38px] min-w-0 flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
             />
             <button
               type="button"
               onClick={() =>
                 setMaxParticipants(Math.min(50, maxParticipants + 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               +
             </button>
diff --git a/src/screens/admin/Treninzi.tsx b/src/screens/admin/Treninzi.tsx
index 3f397448532eb447eae954c3a870ce7c3bc337af..1b014c8fa03c2b3b2fff7e2dd3e89dd51e758d00
--- a/src/screens/admin/Treninzi.tsx
+++ b/src/screens/admin/Treninzi.tsx
@@ -78,7 +78,7 @@
       </div>
 
       {/* Day selector */}
-      <div className="mt-4">
+      <div className="no-scrollbar mt-4 overflow-x-auto">
         <FilterChips
           options={TRAINING_DAYS.map((day) => ({
             key: day,

 succeeded in 3253ms:

> perun-web@1.0.0 build
> tsc -b && vite build

vite v8.1.0 building client environment for production...
[2Ktransforming...✓ 117 modules transformed.
rendering chunks...
computing gzip size...
dist/registerSW.js                0.13 kB
dist/manifest.webmanifest         0.50 kB
dist/index.html                   1.38 kB │ gzip:   0.64 kB
dist/assets/index-TfeDBXCF.css   31.55 kB │ gzip:   6.58 kB
dist/assets/index-Cp1RtSfj.js   504.60 kB │ gzip: 140.64 kB

✓ built in 187ms
[plugin builtin:vite-reporter] 
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.

PWA v1.3.0
mode      generateSW
precache  10 entries (525.07 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js

> perun-web@1.0.0 lint
> oxlint


diff --git a/src/components/admin/FilterChips.tsx b/src/components/admin/FilterChips.tsx
index 892dc67d230091cad0c47b09226e21f3a116b940..260acd380ce7f0fb189799c0c5ad43ea8a3e5130
--- a/src/components/admin/FilterChips.tsx
+++ b/src/components/admin/FilterChips.tsx
@@ -10,14 +10,14 @@
   onChange,
 }: FilterChipsProps<Key>) {
   return (
-    <div className="flex gap-2">
+    <div className="flex flex-nowrap gap-2">
       {options.map((option) => {
         const active = option.key === value;
 
         return (
           <button
             aria-pressed={active}
-            className={`rounded-chip border px-3 py-1.5 text-xs font-bold ${
+            className={`shrink-0 rounded-chip border px-3 py-1.5 text-xs font-bold ${
               active
                 ? "border-burgundy bg-burgundy text-surface"
                 : "border-field-border bg-surface text-ink"
diff --git a/src/components/admin/Toggle.tsx b/src/components/admin/Toggle.tsx
index dd32bd3b575acbacc2c458d7e5f21761c1cdc612..fd152d80d8c5db43986eb983a51f921f9ef4f793
--- a/src/components/admin/Toggle.tsx
+++ b/src/components/admin/Toggle.tsx
@@ -12,7 +12,7 @@
   return (
     <button
       aria-checked={value}
-      className={`relative h-[27px] w-[46px] rounded-chip transition-colors ${
+      className={`relative inline-flex h-[28px] w-[46px] shrink-0 rounded-chip transition-colors ${
         value ? "bg-burgundy" : "bg-[#DDD3C7]"
       } disabled:opacity-50`}
       disabled={disabled}
@@ -21,8 +21,8 @@
       type="button"
     >
       <span
-        className={`absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-surface transition-transform ${
-          value ? "translate-x-[19px]" : "translate-x-0"
+        className={`absolute top-[2px] left-[2px] h-[24px] w-[24px] rounded-full bg-surface transition-transform ${
+          value ? "translate-x-[18px]" : "translate-x-0"
         }`}
       />
     </button>
diff --git a/src/contexts/AuthContext.tsx b/src/contexts/AuthContext.tsx
index 972c4281795ce4065676edf4a457911f4662889b..cd6baffeb88715b401e2385d5f15083ba379cdc2
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -23,6 +23,7 @@
     firstName: string,
     lastName: string,
   ) => Promise<void>;
+  changePassword: (newPassword: string) => Promise<void>;
   resetPassword: (email: string) => Promise<void>;
   updateProfile: (patch: Partial<Profile>) => Promise<void>;
 };
@@ -124,6 +125,12 @@
     if (error) throw error;
   }, []);
 
+  const changePassword = useCallback(async (newPassword: string) => {
+    const { error } = await supabase.auth.updateUser({ password: newPassword });
+
+    if (error) throw error;
+  }, []);
+
   const updateProfile = useCallback(
     async (patch: Partial<Profile>) => {
       if (!session) {
@@ -150,6 +157,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     }),
@@ -160,6 +168,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     ],
diff --git a/src/index.css b/src/index.css
index 5822bdc6338fcdaf4501f9f91587c61530c21d29..228eccd4ad182dc296c28c0f86bf6cf7b918ed6f
--- a/src/index.css
+++ b/src/index.css
@@ -79,6 +79,14 @@
   font-size: 16px;
 }
 
+.no-scrollbar {
+  scrollbar-width: none;
+}
+
+.no-scrollbar::-webkit-scrollbar {
+  display: none;
+}
+
 @media (prefers-reduced-motion: reduce) {
   * {
     animation-duration: 0.001ms !important;
diff --git a/src/lib/week.ts b/src/lib/week.ts
index fcc65332c9a826692f6dcaa6397a1d3b261fa953..10f63b33f490e6ccc8154ac612f401d5216ce575
--- a/src/lib/week.ts
+++ b/src/lib/week.ts
@@ -15,25 +15,17 @@
   const currentDate = new Date(
     Date.UTC(getPart("year"), getPart("month") - 1, getPart("day")),
   );
-  const isoDay = currentDate.getUTCDay() || 7;
-  const monday = new Date(currentDate);
-  monday.setUTCDate(currentDate.getUTCDate() - isoDay + 1);
+  const dayOfWeek = currentDate.getUTCDay();
+  const sunday = new Date(currentDate);
+  sunday.setUTCDate(currentDate.getUTCDate() - dayOfWeek);
 
   return TRAINING_DAYS.reduce(
     (week, day, index) => {
-      const date = new Date(monday);
-      date.setUTCDate(monday.getUTCDate() + index);
+      const date = new Date(sunday);
+      date.setUTCDate(sunday.getUTCDate() + index + 1);
       week[day] = date;
       return week;
     },
-    {
-      sunday: new Date(
-        Date.UTC(
-          monday.getUTCFullYear(),
-          monday.getUTCMonth(),
-          monday.getUTCDate() + 6,
-        ),
-      ),
-    } as TrainingWeekDates,
+    { sunday: new Date(sunday) } as TrainingWeekDates,
   );
 }
diff --git a/src/screens/Profile.tsx b/src/screens/Profile.tsx
index f6fe4a18025294ba4afa47c4d0d0a4a1f733090b..efb1f4274e049a10e83d7af8891f1faa8ccab924
--- a/src/screens/Profile.tsx
+++ b/src/screens/Profile.tsx
@@ -19,10 +19,15 @@
 };
 
 export default function Profile() {
-  const { logout, profile, session } = useAuth();
+  const { changePassword, logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
   const { showToast } = useToast();
   const [loggingOut, setLoggingOut] = useState(false);
+  const [showChangePassword, setShowChangePassword] = useState(false);
+  const [newPassword, setNewPassword] = useState("");
+  const [confirmPassword, setConfirmPassword] = useState("");
+  const [changingPassword, setChangingPassword] = useState(false);
+  const [passwordVisible, setPasswordVisible] = useState(false);
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
   const weekDates = getCurrentWeekDates();
@@ -65,6 +70,103 @@
     }
   }
 
+  async function handleChangePassword() {
+    if (newPassword.length < 6) {
+      showToast("Šifra mora imati najmanje 6 znakova.");
+      return;
+    }
+
+    if (newPassword !== confirmPassword) {
+      showToast("Šifre se ne podudaraju.");
+      return;
+    }
+
+    setChangingPassword(true);
+
+    try {
+      await changePassword(newPassword);
+      showToast("Šifra je uspešno promenjena.");
+      setNewPassword("");
+      setConfirmPassword("");
+      setPasswordVisible(false);
+      setShowChangePassword(false);
+    } catch {
+      showToast("Promena šifre nije uspela. Pokušajte ponovo.");
+    } finally {
+      setChangingPassword(false);
+    }
+  }
+
+  const changePasswordSection = (
+    <section className="mx-4 mt-7 rounded-card border border-border bg-surface p-4 shadow-sm">
+      <button
+        aria-expanded={showChangePassword}
+        className="flex w-full items-center justify-between text-left text-sm font-bold text-ink"
+        disabled={changingPassword}
+        onClick={() => setShowChangePassword((current) => !current)}
+        type="button"
+      >
+        Promeni šifru
+        <span className="text-lg leading-none text-burgundy">
+          {showChangePassword ? "−" : "+"}
+        </span>
+      </button>
+
+      {showChangePassword ? (
+        <div className="mt-4 flex flex-col gap-3">
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            NOVA ŠIFRA
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setNewPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={newPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            POTVRDI ŠIFRU
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setConfirmPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={confirmPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <button
+            className="mt-1 w-full rounded-input bg-burgundy py-3 text-sm font-bold text-surface disabled:opacity-50"
+            disabled={changingPassword}
+            onClick={() => void handleChangePassword()}
+            type="button"
+          >
+            {changingPassword ? "Čuvanje..." : "Sačuvaj šifru"}
+          </button>
+        </div>
+      ) : null}
+    </section>
+  );
+
   // Admin profile: identity + logout only — no member booking/limit sections.
   if (isAdmin) {
     return (
@@ -103,7 +205,9 @@
           ) : null}
         </section>
 
-        <div className="px-4 pt-7">
+        {changePasswordSection}
+
+        <div className="px-4 pt-3">
           <button
             className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
             disabled={loggingOut}
@@ -230,7 +334,9 @@
         </div>
       </section>
 
-      <div className="px-4 pt-[18px]">
+      {changePasswordSection}
+
+      <div className="px-4 pt-3">
         <button
           className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
           disabled={loggingOut}
diff --git a/src/screens/admin/Korisnici.tsx b/src/screens/admin/Korisnici.tsx
index 2740e236ca2f4da0cd6b5698679e286cbd882a2f..38aa36f73fbbb85feb2af1aaf55589f06f9acf96
--- a/src/screens/admin/Korisnici.tsx
+++ b/src/screens/admin/Korisnici.tsx
@@ -3,6 +3,7 @@
 
 import UserRow from "@/components/admin/UserRow";
 import FilterChips from "@/components/admin/FilterChips";
+import Toggle from "@/components/admin/Toggle";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/useToast";
 import {
@@ -376,24 +377,15 @@
               <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                 Aktivan
               </label>
-              <button
-                type="button"
-                onClick={() =>
+              <Toggle
+                onChange={(enabled) =>
                   setEditingUser({
                     ...editingUser,
-                    enabled: !editingUser.enabled,
+                    enabled,
                   })
                 }
-                className={`relative h-7 w-12 rounded-full transition-colors ${
-                  editingUser.enabled ? "bg-burgundy" : "bg-[#DDD3C7]"
-                }`}
-              >
-                <div
-                  className={`absolute h-6 w-6 rounded-full bg-white transition-transform ${
-                    editingUser.enabled ? "translate-x-0.5" : "translate-x-5"
-                  }`}
-                />
-              </button>
+                value={Boolean(editingUser.enabled)}
+              />
             </div>
 
             {/* Footer */}
diff --git a/src/screens/admin/TrainingForm.tsx b/src/screens/admin/TrainingForm.tsx
index f4d2750060a43f35278d9e897c78644235075f40..6bd708df28aa46b34f71cb679f9841323abf2730
--- a/src/screens/admin/TrainingForm.tsx
+++ b/src/screens/admin/TrainingForm.tsx
@@ -184,7 +184,7 @@
         <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
           Dan
         </label>
-        <div className="mt-1.5">
+        <div className="no-scrollbar mt-1.5 overflow-x-auto">
           <FilterChips
             options={TRAINING_DAYS.map((d) => ({
               key: d,
@@ -197,9 +197,9 @@
       </div>
 
       {/* VREME & MAKS. UČESNIKA row */}
-      <div className="mt-5 grid grid-cols-2 gap-4">
+      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
         {/* VREME */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Vreme
           </label>
@@ -210,12 +210,12 @@
             onChange={(e) => setTime(formatTimeInput(e.target.value))}
             placeholder="HH:MM"
             maxLength={5}
-            className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
+            className="mt-1.5 w-full min-w-0 rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
           />
         </div>
 
         {/* MAKS. UČESNIKA */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Maks. učesnika
           </label>
@@ -225,7 +225,7 @@
               onClick={() =>
                 setMaxParticipants(Math.max(1, maxParticipants - 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               −
             </button>
@@ -233,14 +233,14 @@
               type="text"
               value={maxParticipants}
               readOnly
-              className="h-[38px] flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
+              className="h-[38px] min-w-0 flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
             />
             <button
               type="button"
               onClick={() =>
                 setMaxParticipants(Math.min(50, maxParticipants + 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               +
             </button>
diff --git a/src/screens/admin/Treninzi.tsx b/src/screens/admin/Treninzi.tsx
index 3f397448532eb447eae954c3a870ce7c3bc337af..1b014c8fa03c2b3b2fff7e2dd3e89dd51e758d00
--- a/src/screens/admin/Treninzi.tsx
+++ b/src/screens/admin/Treninzi.tsx
@@ -78,7 +78,7 @@
       </div>
 
       {/* Day selector */}
-      <div className="mt-4">
+      <div className="no-scrollbar mt-4 overflow-x-auto">
         <FilterChips
           options={TRAINING_DAYS.map((day) => ({
             key: day,

codex
Build and lint are green. I’m doing one final targeted check of the week boundary (including Belgrade midnight) and confirming the working tree contains only the intended source edits; the existing untracked QA note will remain untouched.
exec
/bin/zsh -lc "rm -rf /tmp/perun-week-test && npx vite build --ssr src/lib/week.ts --outDir /tmp/perun-week-test >/tmp/perun-week-build.log && node --input-type=module - <<'EOF'
import { getCurrentWeekDates } from '/tmp/perun-week-test/week.js';

const cases = [
  ['before Belgrade Sunday midnight', '2026-06-27T21:59:00.000Z', '2026-06-21'],
  ['at Belgrade Sunday midnight', '2026-06-27T22:00:00.000Z', '2026-06-28'],
  ['following Monday', '2026-06-29T12:00:00.000Z', '2026-06-28'],
];

for (const [name, reference, expectedSunday] of cases) {
  const week = getCurrentWeekDates(new Date(reference));
  const actualSunday = week.sunday.toISOString().slice(0, 10);
  if (actualSunday "'!== expectedSunday) {
    throw new Error(`${name}: expected ${expectedSunday}, got ${actualSunday}`);
  }
  const dates = ['"'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    .map((day) => week[day].toISOString().slice(0, 10));
  console.log("'`${name}: ${dates.join('"', ')}"'`);
}
EOF
git diff --check && git status --short' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/src/components/admin/FilterChips.tsx b/src/components/admin/FilterChips.tsx
index 892dc67d230091cad0c47b09226e21f3a116b940..260acd380ce7f0fb189799c0c5ad43ea8a3e5130
--- a/src/components/admin/FilterChips.tsx
+++ b/src/components/admin/FilterChips.tsx
@@ -10,14 +10,14 @@
   onChange,
 }: FilterChipsProps<Key>) {
   return (
-    <div className="flex gap-2">
+    <div className="flex flex-nowrap gap-2">
       {options.map((option) => {
         const active = option.key === value;
 
         return (
           <button
             aria-pressed={active}
-            className={`rounded-chip border px-3 py-1.5 text-xs font-bold ${
+            className={`shrink-0 rounded-chip border px-3 py-1.5 text-xs font-bold ${
               active
                 ? "border-burgundy bg-burgundy text-surface"
                 : "border-field-border bg-surface text-ink"
diff --git a/src/components/admin/Toggle.tsx b/src/components/admin/Toggle.tsx
index dd32bd3b575acbacc2c458d7e5f21761c1cdc612..fd152d80d8c5db43986eb983a51f921f9ef4f793
--- a/src/components/admin/Toggle.tsx
+++ b/src/components/admin/Toggle.tsx
@@ -12,7 +12,7 @@
   return (
     <button
       aria-checked={value}
-      className={`relative h-[27px] w-[46px] rounded-chip transition-colors ${
+      className={`relative inline-flex h-[28px] w-[46px] shrink-0 rounded-chip transition-colors ${
         value ? "bg-burgundy" : "bg-[#DDD3C7]"
       } disabled:opacity-50`}
       disabled={disabled}
@@ -21,8 +21,8 @@
       type="button"
     >
       <span
-        className={`absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-surface transition-transform ${
-          value ? "translate-x-[19px]" : "translate-x-0"
+        className={`absolute top-[2px] left-[2px] h-[24px] w-[24px] rounded-full bg-surface transition-transform ${
+          value ? "translate-x-[18px]" : "translate-x-0"
         }`}
       />
     </button>
diff --git a/src/contexts/AuthContext.tsx b/src/contexts/AuthContext.tsx
index 972c4281795ce4065676edf4a457911f4662889b..cd6baffeb88715b401e2385d5f15083ba379cdc2
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -23,6 +23,7 @@
     firstName: string,
     lastName: string,
   ) => Promise<void>;
+  changePassword: (newPassword: string) => Promise<void>;
   resetPassword: (email: string) => Promise<void>;
   updateProfile: (patch: Partial<Profile>) => Promise<void>;
 };
@@ -124,6 +125,12 @@
     if (error) throw error;
   }, []);
 
+  const changePassword = useCallback(async (newPassword: string) => {
+    const { error } = await supabase.auth.updateUser({ password: newPassword });
+
+    if (error) throw error;
+  }, []);
+
   const updateProfile = useCallback(
     async (patch: Partial<Profile>) => {
       if (!session) {
@@ -150,6 +157,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     }),
@@ -160,6 +168,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     ],
diff --git a/src/index.css b/src/index.css
index 5822bdc6338fcdaf4501f9f91587c61530c21d29..228eccd4ad182dc296c28c0f86bf6cf7b918ed6f
--- a/src/index.css
+++ b/src/index.css
@@ -79,6 +79,14 @@
   font-size: 16px;
 }
 
+.no-scrollbar {
+  scrollbar-width: none;
+}
+
+.no-scrollbar::-webkit-scrollbar {
+  display: none;
+}
+
 @media (prefers-reduced-motion: reduce) {
   * {
     animation-duration: 0.001ms !important;
diff --git a/src/lib/week.ts b/src/lib/week.ts
index fcc65332c9a826692f6dcaa6397a1d3b261fa953..10f63b33f490e6ccc8154ac612f401d5216ce575
--- a/src/lib/week.ts
+++ b/src/lib/week.ts
@@ -15,25 +15,17 @@
   const currentDate = new Date(
     Date.UTC(getPart("year"), getPart("month") - 1, getPart("day")),
   );
-  const isoDay = currentDate.getUTCDay() || 7;
-  const monday = new Date(currentDate);
-  monday.setUTCDate(currentDate.getUTCDate() - isoDay + 1);
+  const dayOfWeek = currentDate.getUTCDay();
+  const sunday = new Date(currentDate);
+  sunday.setUTCDate(currentDate.getUTCDate() - dayOfWeek);
 
   return TRAINING_DAYS.reduce(
     (week, day, index) => {
-      const date = new Date(monday);
-      date.setUTCDate(monday.getUTCDate() + index);
+      const date = new Date(sunday);
+      date.setUTCDate(sunday.getUTCDate() + index + 1);
       week[day] = date;
       return week;
     },
-    {
-      sunday: new Date(
-        Date.UTC(
-          monday.getUTCFullYear(),
-          monday.getUTCMonth(),
-          monday.getUTCDate() + 6,
-        ),
-      ),
-    } as TrainingWeekDates,
+    { sunday: new Date(sunday) } as TrainingWeekDates,
   );
 }
diff --git a/src/screens/Profile.tsx b/src/screens/Profile.tsx
index f6fe4a18025294ba4afa47c4d0d0a4a1f733090b..efb1f4274e049a10e83d7af8891f1faa8ccab924
--- a/src/screens/Profile.tsx
+++ b/src/screens/Profile.tsx
@@ -19,10 +19,15 @@
 };
 
 export default function Profile() {
-  const { logout, profile, session } = useAuth();
+  const { changePassword, logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
   const { showToast } = useToast();
   const [loggingOut, setLoggingOut] = useState(false);
+  const [showChangePassword, setShowChangePassword] = useState(false);
+  const [newPassword, setNewPassword] = useState("");
+  const [confirmPassword, setConfirmPassword] = useState("");
+  const [changingPassword, setChangingPassword] = useState(false);
+  const [passwordVisible, setPasswordVisible] = useState(false);
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
   const weekDates = getCurrentWeekDates();
@@ -65,6 +70,103 @@
     }
   }
 
+  async function handleChangePassword() {
+    if (newPassword.length < 6) {
+      showToast("Šifra mora imati najmanje 6 znakova.");
+      return;
+    }
+
+    if (newPassword !== confirmPassword) {
+      showToast("Šifre se ne podudaraju.");
+      return;
+    }
+
+    setChangingPassword(true);
+
+    try {
+      await changePassword(newPassword);
+      showToast("Šifra je uspešno promenjena.");
+      setNewPassword("");
+      setConfirmPassword("");
+      setPasswordVisible(false);
+      setShowChangePassword(false);
+    } catch {
+      showToast("Promena šifre nije uspela. Pokušajte ponovo.");
+    } finally {
+      setChangingPassword(false);
+    }
+  }
+
+  const changePasswordSection = (
+    <section className="mx-4 mt-7 rounded-card border border-border bg-surface p-4 shadow-sm">
+      <button
+        aria-expanded={showChangePassword}
+        className="flex w-full items-center justify-between text-left text-sm font-bold text-ink"
+        disabled={changingPassword}
+        onClick={() => setShowChangePassword((current) => !current)}
+        type="button"
+      >
+        Promeni šifru
+        <span className="text-lg leading-none text-burgundy">
+          {showChangePassword ? "−" : "+"}
+        </span>
+      </button>
+
+      {showChangePassword ? (
+        <div className="mt-4 flex flex-col gap-3">
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            NOVA ŠIFRA
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setNewPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={newPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            POTVRDI ŠIFRU
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setConfirmPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={confirmPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <button
+            className="mt-1 w-full rounded-input bg-burgundy py-3 text-sm font-bold text-surface disabled:opacity-50"
+            disabled={changingPassword}
+            onClick={() => void handleChangePassword()}
+            type="button"
+          >
+            {changingPassword ? "Čuvanje..." : "Sačuvaj šifru"}
+          </button>
+        </div>
+      ) : null}
+    </section>
+  );
+
   // Admin profile: identity + logout only — no member booking/limit sections.
   if (isAdmin) {
     return (
@@ -103,7 +205,9 @@
           ) : null}
         </section>
 
-        <div className="px-4 pt-7">
+        {changePasswordSection}
+
+        <div className="px-4 pt-3">
           <button
             className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
             disabled={loggingOut}
@@ -230,7 +334,9 @@
         </div>
       </section>
 
-      <div className="px-4 pt-[18px]">
+      {changePasswordSection}
+
+      <div className="px-4 pt-3">
         <button
           className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
           disabled={loggingOut}
diff --git a/src/screens/admin/Korisnici.tsx b/src/screens/admin/Korisnici.tsx
index 2740e236ca2f4da0cd6b5698679e286cbd882a2f..38aa36f73fbbb85feb2af1aaf55589f06f9acf96
--- a/src/screens/admin/Korisnici.tsx
+++ b/src/screens/admin/Korisnici.tsx
@@ -3,6 +3,7 @@
 
 import UserRow from "@/components/admin/UserRow";
 import FilterChips from "@/components/admin/FilterChips";
+import Toggle from "@/components/admin/Toggle";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/useToast";
 import {
@@ -376,24 +377,15 @@
               <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                 Aktivan
               </label>
-              <button
-                type="button"
-                onClick={() =>
+              <Toggle
+                onChange={(enabled) =>
                   setEditingUser({
                     ...editingUser,
-                    enabled: !editingUser.enabled,
+                    enabled,
                   })
                 }
-                className={`relative h-7 w-12 rounded-full transition-colors ${
-                  editingUser.enabled ? "bg-burgundy" : "bg-[#DDD3C7]"
-                }`}
-              >
-                <div
-                  className={`absolute h-6 w-6 rounded-full bg-white transition-transform ${
-                    editingUser.enabled ? "translate-x-0.5" : "translate-x-5"
-                  }`}
-                />
-              </button>
+                value={Boolean(editingUser.enabled)}
+              />
             </div>
 
             {/* Footer */}
diff --git a/src/screens/admin/TrainingForm.tsx b/src/screens/admin/TrainingForm.tsx
index f4d2750060a43f35278d9e897c78644235075f40..6bd708df28aa46b34f71cb679f9841323abf2730
--- a/src/screens/admin/TrainingForm.tsx
+++ b/src/screens/admin/TrainingForm.tsx
@@ -184,7 +184,7 @@
         <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
           Dan
         </label>
-        <div className="mt-1.5">
+        <div className="no-scrollbar mt-1.5 overflow-x-auto">
           <FilterChips
             options={TRAINING_DAYS.map((d) => ({
               key: d,
@@ -197,9 +197,9 @@
       </div>
 
       {/* VREME & MAKS. UČESNIKA row */}
-      <div className="mt-5 grid grid-cols-2 gap-4">
+      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
         {/* VREME */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Vreme
           </label>
@@ -210,12 +210,12 @@
             onChange={(e) => setTime(formatTimeInput(e.target.value))}
             placeholder="HH:MM"
             maxLength={5}
-            className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
+            className="mt-1.5 w-full min-w-0 rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
           />
         </div>
 
         {/* MAKS. UČESNIKA */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Maks. učesnika
           </label>
@@ -225,7 +225,7 @@
               onClick={() =>
                 setMaxParticipants(Math.max(1, maxParticipants - 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               −
             </button>
@@ -233,14 +233,14 @@
               type="text"
               value={maxParticipants}
               readOnly
-              className="h-[38px] flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
+              className="h-[38px] min-w-0 flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
             />
             <button
               type="button"
               onClick={() =>
                 setMaxParticipants(Math.min(50, maxParticipants + 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               +
             </button>
diff --git a/src/screens/admin/Treninzi.tsx b/src/screens/admin/Treninzi.tsx
index 3f397448532eb447eae954c3a870ce7c3bc337af..1b014c8fa03c2b3b2fff7e2dd3e89dd51e758d00
--- a/src/screens/admin/Treninzi.tsx
+++ b/src/screens/admin/Treninzi.tsx
@@ -78,7 +78,7 @@
       </div>
 
       {/* Day selector */}
-      <div className="mt-4">
+      <div className="no-scrollbar mt-4 overflow-x-auto">
         <FilterChips
           options={TRAINING_DAYS.map((day) => ({
             key: day,

 succeeded in 588ms:

(!) outDir /tmp/perun-week-test is not inside project root and will not be emptied.
Use --emptyOutDir to override.

before Belgrade Sunday midnight: 2026-06-21, 2026-06-22, 2026-06-23, 2026-06-24, 2026-06-25, 2026-06-26, 2026-06-27
at Belgrade Sunday midnight: 2026-06-28, 2026-06-29, 2026-06-30, 2026-07-01, 2026-07-02, 2026-07-03, 2026-07-04
following Monday: 2026-06-28, 2026-06-29, 2026-06-30, 2026-07-01, 2026-07-02, 2026-07-03, 2026-07-04
 M src/components/admin/FilterChips.tsx
 M src/components/admin/Toggle.tsx
 M src/contexts/AuthContext.tsx
 M src/index.css
 M src/lib/week.ts
 M src/screens/Profile.tsx
 M src/screens/admin/Korisnici.tsx
 M src/screens/admin/TrainingForm.tsx
 M src/screens/admin/Treninzi.tsx
?? .tmnt/runs/QA-Batch-1-mikey.md

Build, lint, diff checks, and targeted Sunday-boundary checks all passed.
  ✓ Read CLAUDE.md and inspect the listed implementation files
  ✓ Implement the four targeted fixes
  ✓ Run build and lint; resolve any issues in scope
diff --git a/src/components/admin/FilterChips.tsx b/src/components/admin/FilterChips.tsx
index 892dc67d230091cad0c47b09226e21f3a116b940..260acd380ce7f0fb189799c0c5ad43ea8a3e5130
--- a/src/components/admin/FilterChips.tsx
+++ b/src/components/admin/FilterChips.tsx
@@ -10,14 +10,14 @@
   onChange,
 }: FilterChipsProps<Key>) {
   return (
-    <div className="flex gap-2">
+    <div className="flex flex-nowrap gap-2">
       {options.map((option) => {
         const active = option.key === value;
 
         return (
           <button
             aria-pressed={active}
-            className={`rounded-chip border px-3 py-1.5 text-xs font-bold ${
+            className={`shrink-0 rounded-chip border px-3 py-1.5 text-xs font-bold ${
               active
                 ? "border-burgundy bg-burgundy text-surface"
                 : "border-field-border bg-surface text-ink"
diff --git a/src/components/admin/Toggle.tsx b/src/components/admin/Toggle.tsx
index dd32bd3b575acbacc2c458d7e5f21761c1cdc612..fd152d80d8c5db43986eb983a51f921f9ef4f793
--- a/src/components/admin/Toggle.tsx
+++ b/src/components/admin/Toggle.tsx
@@ -12,7 +12,7 @@
   return (
     <button
       aria-checked={value}
-      className={`relative h-[27px] w-[46px] rounded-chip transition-colors ${
+      className={`relative inline-flex h-[28px] w-[46px] shrink-0 rounded-chip transition-colors ${
         value ? "bg-burgundy" : "bg-[#DDD3C7]"
       } disabled:opacity-50`}
       disabled={disabled}
@@ -21,8 +21,8 @@
       type="button"
     >
       <span
-        className={`absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-surface transition-transform ${
-          value ? "translate-x-[19px]" : "translate-x-0"
+        className={`absolute top-[2px] left-[2px] h-[24px] w-[24px] rounded-full bg-surface transition-transform ${
+          value ? "translate-x-[18px]" : "translate-x-0"
         }`}
       />
     </button>
diff --git a/src/contexts/AuthContext.tsx b/src/contexts/AuthContext.tsx
index 972c4281795ce4065676edf4a457911f4662889b..cd6baffeb88715b401e2385d5f15083ba379cdc2
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -23,6 +23,7 @@
     firstName: string,
     lastName: string,
   ) => Promise<void>;
+  changePassword: (newPassword: string) => Promise<void>;
   resetPassword: (email: string) => Promise<void>;
   updateProfile: (patch: Partial<Profile>) => Promise<void>;
 };
@@ -124,6 +125,12 @@
     if (error) throw error;
   }, []);
 
+  const changePassword = useCallback(async (newPassword: string) => {
+    const { error } = await supabase.auth.updateUser({ password: newPassword });
+
+    if (error) throw error;
+  }, []);
+
   const updateProfile = useCallback(
     async (patch: Partial<Profile>) => {
       if (!session) {
@@ -150,6 +157,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     }),
@@ -160,6 +168,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     ],
diff --git a/src/index.css b/src/index.css
index 5822bdc6338fcdaf4501f9f91587c61530c21d29..228eccd4ad182dc296c28c0f86bf6cf7b918ed6f
--- a/src/index.css
+++ b/src/index.css
@@ -79,6 +79,14 @@
   font-size: 16px;
 }
 
+.no-scrollbar {
+  scrollbar-width: none;
+}
+
+.no-scrollbar::-webkit-scrollbar {
+  display: none;
+}
+
 @media (prefers-reduced-motion: reduce) {
   * {
     animation-duration: 0.001ms !important;
diff --git a/src/lib/week.ts b/src/lib/week.ts
index fcc65332c9a826692f6dcaa6397a1d3b261fa953..10f63b33f490e6ccc8154ac612f401d5216ce575
--- a/src/lib/week.ts
+++ b/src/lib/week.ts
@@ -15,25 +15,17 @@
   const currentDate = new Date(
     Date.UTC(getPart("year"), getPart("month") - 1, getPart("day")),
   );
-  const isoDay = currentDate.getUTCDay() || 7;
-  const monday = new Date(currentDate);
-  monday.setUTCDate(currentDate.getUTCDate() - isoDay + 1);
+  const dayOfWeek = currentDate.getUTCDay();
+  const sunday = new Date(currentDate);
+  sunday.setUTCDate(currentDate.getUTCDate() - dayOfWeek);
 
   return TRAINING_DAYS.reduce(
     (week, day, index) => {
-      const date = new Date(monday);
-      date.setUTCDate(monday.getUTCDate() + index);
+      const date = new Date(sunday);
+      date.setUTCDate(sunday.getUTCDate() + index + 1);
       week[day] = date;
       return week;
     },
-    {
-      sunday: new Date(
-        Date.UTC(
-          monday.getUTCFullYear(),
-          monday.getUTCMonth(),
-          monday.getUTCDate() + 6,
-        ),
-      ),
-    } as TrainingWeekDates,
+    { sunday: new Date(sunday) } as TrainingWeekDates,
   );
 }
diff --git a/src/screens/Profile.tsx b/src/screens/Profile.tsx
index f6fe4a18025294ba4afa47c4d0d0a4a1f733090b..efb1f4274e049a10e83d7af8891f1faa8ccab924
--- a/src/screens/Profile.tsx
+++ b/src/screens/Profile.tsx
@@ -19,10 +19,15 @@
 };
 
 export default function Profile() {
-  const { logout, profile, session } = useAuth();
+  const { changePassword, logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
   const { showToast } = useToast();
   const [loggingOut, setLoggingOut] = useState(false);
+  const [showChangePassword, setShowChangePassword] = useState(false);
+  const [newPassword, setNewPassword] = useState("");
+  const [confirmPassword, setConfirmPassword] = useState("");
+  const [changingPassword, setChangingPassword] = useState(false);
+  const [passwordVisible, setPasswordVisible] = useState(false);
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
   const weekDates = getCurrentWeekDates();
@@ -65,6 +70,103 @@
     }
   }
 
+  async function handleChangePassword() {
+    if (newPassword.length < 6) {
+      showToast("Šifra mora imati najmanje 6 znakova.");
+      return;
+    }
+
+    if (newPassword !== confirmPassword) {
+      showToast("Šifre se ne podudaraju.");
+      return;
+    }
+
+    setChangingPassword(true);
+
+    try {
+      await changePassword(newPassword);
+      showToast("Šifra je uspešno promenjena.");
+      setNewPassword("");
+      setConfirmPassword("");
+      setPasswordVisible(false);
+      setShowChangePassword(false);
+    } catch {
+      showToast("Promena šifre nije uspela. Pokušajte ponovo.");
+    } finally {
+      setChangingPassword(false);
+    }
+  }
+
+  const changePasswordSection = (
+    <section className="mx-4 mt-7 rounded-card border border-border bg-surface p-4 shadow-sm">
+      <button
+        aria-expanded={showChangePassword}
+        className="flex w-full items-center justify-between text-left text-sm font-bold text-ink"
+        disabled={changingPassword}
+        onClick={() => setShowChangePassword((current) => !current)}
+        type="button"
+      >
+        Promeni šifru
+        <span className="text-lg leading-none text-burgundy">
+          {showChangePassword ? "−" : "+"}
+        </span>
+      </button>
+
+      {showChangePassword ? (
+        <div className="mt-4 flex flex-col gap-3">
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            NOVA ŠIFRA
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setNewPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={newPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            POTVRDI ŠIFRU
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setConfirmPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={confirmPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <button
+            className="mt-1 w-full rounded-input bg-burgundy py-3 text-sm font-bold text-surface disabled:opacity-50"
+            disabled={changingPassword}
+            onClick={() => void handleChangePassword()}
+            type="button"
+          >
+            {changingPassword ? "Čuvanje..." : "Sačuvaj šifru"}
+          </button>
+        </div>
+      ) : null}
+    </section>
+  );
+
   // Admin profile: identity + logout only — no member booking/limit sections.
   if (isAdmin) {
     return (
@@ -103,7 +205,9 @@
           ) : null}
         </section>
 
-        <div className="px-4 pt-7">
+        {changePasswordSection}
+
+        <div className="px-4 pt-3">
           <button
             className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
             disabled={loggingOut}
@@ -230,7 +334,9 @@
         </div>
       </section>
 
-      <div className="px-4 pt-[18px]">
+      {changePasswordSection}
+
+      <div className="px-4 pt-3">
         <button
           className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
           disabled={loggingOut}
diff --git a/src/screens/admin/Korisnici.tsx b/src/screens/admin/Korisnici.tsx
index 2740e236ca2f4da0cd6b5698679e286cbd882a2f..38aa36f73fbbb85feb2af1aaf55589f06f9acf96
--- a/src/screens/admin/Korisnici.tsx
+++ b/src/screens/admin/Korisnici.tsx
@@ -3,6 +3,7 @@
 
 import UserRow from "@/components/admin/UserRow";
 import FilterChips from "@/components/admin/FilterChips";
+import Toggle from "@/components/admin/Toggle";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/useToast";
 import {
@@ -376,24 +377,15 @@
               <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                 Aktivan
               </label>
-              <button
-                type="button"
-                onClick={() =>
+              <Toggle
+                onChange={(enabled) =>
                   setEditingUser({
                     ...editingUser,
-                    enabled: !editingUser.enabled,
+                    enabled,
                   })
                 }
-                className={`relative h-7 w-12 rounded-full transition-colors ${
-                  editingUser.enabled ? "bg-burgundy" : "bg-[#DDD3C7]"
-                }`}
-              >
-                <div
-                  className={`absolute h-6 w-6 rounded-full bg-white transition-transform ${
-                    editingUser.enabled ? "translate-x-0.5" : "translate-x-5"
-                  }`}
-                />
-              </button>
+                value={Boolean(editingUser.enabled)}
+              />
             </div>
 
             {/* Footer */}
diff --git a/src/screens/admin/TrainingForm.tsx b/src/screens/admin/TrainingForm.tsx
index f4d2750060a43f35278d9e897c78644235075f40..6bd708df28aa46b34f71cb679f9841323abf2730
--- a/src/screens/admin/TrainingForm.tsx
+++ b/src/screens/admin/TrainingForm.tsx
@@ -184,7 +184,7 @@
         <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
           Dan
         </label>
-        <div className="mt-1.5">
+        <div className="no-scrollbar mt-1.5 overflow-x-auto">
           <FilterChips
             options={TRAINING_DAYS.map((d) => ({
               key: d,
@@ -197,9 +197,9 @@
       </div>
 
       {/* VREME & MAKS. UČESNIKA row */}
-      <div className="mt-5 grid grid-cols-2 gap-4">
+      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
         {/* VREME */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Vreme
           </label>
@@ -210,12 +210,12 @@
             onChange={(e) => setTime(formatTimeInput(e.target.value))}
             placeholder="HH:MM"
             maxLength={5}
-            className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
+            className="mt-1.5 w-full min-w-0 rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
           />
         </div>
 
         {/* MAKS. UČESNIKA */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Maks. učesnika
           </label>
@@ -225,7 +225,7 @@
               onClick={() =>
                 setMaxParticipants(Math.max(1, maxParticipants - 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               −
             </button>
@@ -233,14 +233,14 @@
               type="text"
               value={maxParticipants}
               readOnly
-              className="h-[38px] flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
+              className="h-[38px] min-w-0 flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
             />
             <button
               type="button"
               onClick={() =>
                 setMaxParticipants(Math.min(50, maxParticipants + 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               +
             </button>
diff --git a/src/screens/admin/Treninzi.tsx b/src/screens/admin/Treninzi.tsx
index 3f397448532eb447eae954c3a870ce7c3bc337af..1b014c8fa03c2b3b2fff7e2dd3e89dd51e758d00
--- a/src/screens/admin/Treninzi.tsx
+++ b/src/screens/admin/Treninzi.tsx
@@ -78,7 +78,7 @@
       </div>
 
       {/* Day selector */}
-      <div className="mt-4">
+      <div className="no-scrollbar mt-4 overflow-x-auto">
         <FilterChips
           options={TRAINING_DAYS.map((day) => ({
             key: day,

codex
Implemented all four fixes:

- Sunday-start booking weeks with Belgrade midnight rollover
- Change-password support for member and admin profiles
- Fixed-size shared toggle in the user modal
- Mobile-safe scrolling and responsive training form layout

Verification passed:

- `npm run build`
- `npm run lint`
- Focused week-boundary checks
- `git diff --check`

DONE
diff --git a/src/components/admin/FilterChips.tsx b/src/components/admin/FilterChips.tsx
index 892dc67d230091cad0c47b09226e21f3a116b940..260acd380ce7f0fb189799c0c5ad43ea8a3e5130
--- a/src/components/admin/FilterChips.tsx
+++ b/src/components/admin/FilterChips.tsx
@@ -10,14 +10,14 @@
   onChange,
 }: FilterChipsProps<Key>) {
   return (
-    <div className="flex gap-2">
+    <div className="flex flex-nowrap gap-2">
       {options.map((option) => {
         const active = option.key === value;
 
         return (
           <button
             aria-pressed={active}
-            className={`rounded-chip border px-3 py-1.5 text-xs font-bold ${
+            className={`shrink-0 rounded-chip border px-3 py-1.5 text-xs font-bold ${
               active
                 ? "border-burgundy bg-burgundy text-surface"
                 : "border-field-border bg-surface text-ink"
diff --git a/src/components/admin/Toggle.tsx b/src/components/admin/Toggle.tsx
index dd32bd3b575acbacc2c458d7e5f21761c1cdc612..fd152d80d8c5db43986eb983a51f921f9ef4f793
--- a/src/components/admin/Toggle.tsx
+++ b/src/components/admin/Toggle.tsx
@@ -12,7 +12,7 @@
   return (
     <button
       aria-checked={value}
-      className={`relative h-[27px] w-[46px] rounded-chip transition-colors ${
+      className={`relative inline-flex h-[28px] w-[46px] shrink-0 rounded-chip transition-colors ${
         value ? "bg-burgundy" : "bg-[#DDD3C7]"
       } disabled:opacity-50`}
       disabled={disabled}
@@ -21,8 +21,8 @@
       type="button"
     >
       <span
-        className={`absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-surface transition-transform ${
-          value ? "translate-x-[19px]" : "translate-x-0"
+        className={`absolute top-[2px] left-[2px] h-[24px] w-[24px] rounded-full bg-surface transition-transform ${
+          value ? "translate-x-[18px]" : "translate-x-0"
         }`}
       />
     </button>
diff --git a/src/contexts/AuthContext.tsx b/src/contexts/AuthContext.tsx
index 972c4281795ce4065676edf4a457911f4662889b..cd6baffeb88715b401e2385d5f15083ba379cdc2
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -23,6 +23,7 @@
     firstName: string,
     lastName: string,
   ) => Promise<void>;
+  changePassword: (newPassword: string) => Promise<void>;
   resetPassword: (email: string) => Promise<void>;
   updateProfile: (patch: Partial<Profile>) => Promise<void>;
 };
@@ -124,6 +125,12 @@
     if (error) throw error;
   }, []);
 
+  const changePassword = useCallback(async (newPassword: string) => {
+    const { error } = await supabase.auth.updateUser({ password: newPassword });
+
+    if (error) throw error;
+  }, []);
+
   const updateProfile = useCallback(
     async (patch: Partial<Profile>) => {
       if (!session) {
@@ -150,6 +157,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     }),
@@ -160,6 +168,7 @@
       login,
       logout,
       register,
+      changePassword,
       resetPassword,
       updateProfile,
     ],
diff --git a/src/index.css b/src/index.css
index 5822bdc6338fcdaf4501f9f91587c61530c21d29..228eccd4ad182dc296c28c0f86bf6cf7b918ed6f
--- a/src/index.css
+++ b/src/index.css
@@ -79,6 +79,14 @@
   font-size: 16px;
 }
 
+.no-scrollbar {
+  scrollbar-width: none;
+}
+
+.no-scrollbar::-webkit-scrollbar {
+  display: none;
+}
+
 @media (prefers-reduced-motion: reduce) {
   * {
     animation-duration: 0.001ms !important;
diff --git a/src/lib/week.ts b/src/lib/week.ts
index fcc65332c9a826692f6dcaa6397a1d3b261fa953..10f63b33f490e6ccc8154ac612f401d5216ce575
--- a/src/lib/week.ts
+++ b/src/lib/week.ts
@@ -15,25 +15,17 @@
   const currentDate = new Date(
     Date.UTC(getPart("year"), getPart("month") - 1, getPart("day")),
   );
-  const isoDay = currentDate.getUTCDay() || 7;
-  const monday = new Date(currentDate);
-  monday.setUTCDate(currentDate.getUTCDate() - isoDay + 1);
+  const dayOfWeek = currentDate.getUTCDay();
+  const sunday = new Date(currentDate);
+  sunday.setUTCDate(currentDate.getUTCDate() - dayOfWeek);
 
   return TRAINING_DAYS.reduce(
     (week, day, index) => {
-      const date = new Date(monday);
-      date.setUTCDate(monday.getUTCDate() + index);
+      const date = new Date(sunday);
+      date.setUTCDate(sunday.getUTCDate() + index + 1);
       week[day] = date;
       return week;
     },
-    {
-      sunday: new Date(
-        Date.UTC(
-          monday.getUTCFullYear(),
-          monday.getUTCMonth(),
-          monday.getUTCDate() + 6,
-        ),
-      ),
-    } as TrainingWeekDates,
+    { sunday: new Date(sunday) } as TrainingWeekDates,
   );
 }
diff --git a/src/screens/Profile.tsx b/src/screens/Profile.tsx
index f6fe4a18025294ba4afa47c4d0d0a4a1f733090b..efb1f4274e049a10e83d7af8891f1faa8ccab924
--- a/src/screens/Profile.tsx
+++ b/src/screens/Profile.tsx
@@ -19,10 +19,15 @@
 };
 
 export default function Profile() {
-  const { logout, profile, session } = useAuth();
+  const { changePassword, logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
   const { showToast } = useToast();
   const [loggingOut, setLoggingOut] = useState(false);
+  const [showChangePassword, setShowChangePassword] = useState(false);
+  const [newPassword, setNewPassword] = useState("");
+  const [confirmPassword, setConfirmPassword] = useState("");
+  const [changingPassword, setChangingPassword] = useState(false);
+  const [passwordVisible, setPasswordVisible] = useState(false);
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
   const weekDates = getCurrentWeekDates();
@@ -65,6 +70,103 @@
     }
   }
 
+  async function handleChangePassword() {
+    if (newPassword.length < 6) {
+      showToast("Šifra mora imati najmanje 6 znakova.");
+      return;
+    }
+
+    if (newPassword !== confirmPassword) {
+      showToast("Šifre se ne podudaraju.");
+      return;
+    }
+
+    setChangingPassword(true);
+
+    try {
+      await changePassword(newPassword);
+      showToast("Šifra je uspešno promenjena.");
+      setNewPassword("");
+      setConfirmPassword("");
+      setPasswordVisible(false);
+      setShowChangePassword(false);
+    } catch {
+      showToast("Promena šifre nije uspela. Pokušajte ponovo.");
+    } finally {
+      setChangingPassword(false);
+    }
+  }
+
+  const changePasswordSection = (
+    <section className="mx-4 mt-7 rounded-card border border-border bg-surface p-4 shadow-sm">
+      <button
+        aria-expanded={showChangePassword}
+        className="flex w-full items-center justify-between text-left text-sm font-bold text-ink"
+        disabled={changingPassword}
+        onClick={() => setShowChangePassword((current) => !current)}
+        type="button"
+      >
+        Promeni šifru
+        <span className="text-lg leading-none text-burgundy">
+          {showChangePassword ? "−" : "+"}
+        </span>
+      </button>
+
+      {showChangePassword ? (
+        <div className="mt-4 flex flex-col gap-3">
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            NOVA ŠIFRA
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setNewPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={newPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <label className="flex flex-col gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink-faint">
+            POTVRDI ŠIFRU
+            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
+              <input
+                autoComplete="new-password"
+                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tracking-normal text-ink outline-none"
+                onChange={(event) => setConfirmPassword(event.target.value)}
+                type={passwordVisible ? "text" : "password"}
+                value={confirmPassword}
+              />
+              <button
+                className="px-3 text-[13px] font-bold tracking-normal text-sage"
+                onClick={() => setPasswordVisible((current) => !current)}
+                type="button"
+              >
+                {passwordVisible ? "Sakrij" : "Prikaži"}
+              </button>
+            </span>
+          </label>
+
+          <button
+            className="mt-1 w-full rounded-input bg-burgundy py-3 text-sm font-bold text-surface disabled:opacity-50"
+            disabled={changingPassword}
+            onClick={() => void handleChangePassword()}
+            type="button"
+          >
+            {changingPassword ? "Čuvanje..." : "Sačuvaj šifru"}
+          </button>
+        </div>
+      ) : null}
+    </section>
+  );
+
   // Admin profile: identity + logout only — no member booking/limit sections.
   if (isAdmin) {
     return (
@@ -103,7 +205,9 @@
           ) : null}
         </section>
 
-        <div className="px-4 pt-7">
+        {changePasswordSection}
+
+        <div className="px-4 pt-3">
           <button
             className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
             disabled={loggingOut}
@@ -230,7 +334,9 @@
         </div>
       </section>
 
-      <div className="px-4 pt-[18px]">
+      {changePasswordSection}
+
+      <div className="px-4 pt-3">
         <button
           className="w-full rounded-input border border-burgundy bg-transparent py-3.5 text-sm font-bold text-burgundy active:opacity-85 disabled:opacity-50"
           disabled={loggingOut}
diff --git a/src/screens/admin/Korisnici.tsx b/src/screens/admin/Korisnici.tsx
index 2740e236ca2f4da0cd6b5698679e286cbd882a2f..38aa36f73fbbb85feb2af1aaf55589f06f9acf96
--- a/src/screens/admin/Korisnici.tsx
+++ b/src/screens/admin/Korisnici.tsx
@@ -3,6 +3,7 @@
 
 import UserRow from "@/components/admin/UserRow";
 import FilterChips from "@/components/admin/FilterChips";
+import Toggle from "@/components/admin/Toggle";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/useToast";
 import {
@@ -376,24 +377,15 @@
               <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                 Aktivan
               </label>
-              <button
-                type="button"
-                onClick={() =>
+              <Toggle
+                onChange={(enabled) =>
                   setEditingUser({
                     ...editingUser,
-                    enabled: !editingUser.enabled,
+                    enabled,
                   })
                 }
-                className={`relative h-7 w-12 rounded-full transition-colors ${
-                  editingUser.enabled ? "bg-burgundy" : "bg-[#DDD3C7]"
-                }`}
-              >
-                <div
-                  className={`absolute h-6 w-6 rounded-full bg-white transition-transform ${
-                    editingUser.enabled ? "translate-x-0.5" : "translate-x-5"
-                  }`}
-                />
-              </button>
+                value={Boolean(editingUser.enabled)}
+              />
             </div>
 
             {/* Footer */}
diff --git a/src/screens/admin/TrainingForm.tsx b/src/screens/admin/TrainingForm.tsx
index f4d2750060a43f35278d9e897c78644235075f40..6bd708df28aa46b34f71cb679f9841323abf2730
--- a/src/screens/admin/TrainingForm.tsx
+++ b/src/screens/admin/TrainingForm.tsx
@@ -184,7 +184,7 @@
         <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
           Dan
         </label>
-        <div className="mt-1.5">
+        <div className="no-scrollbar mt-1.5 overflow-x-auto">
           <FilterChips
             options={TRAINING_DAYS.map((d) => ({
               key: d,
@@ -197,9 +197,9 @@
       </div>
 
       {/* VREME & MAKS. UČESNIKA row */}
-      <div className="mt-5 grid grid-cols-2 gap-4">
+      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
         {/* VREME */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Vreme
           </label>
@@ -210,12 +210,12 @@
             onChange={(e) => setTime(formatTimeInput(e.target.value))}
             placeholder="HH:MM"
             maxLength={5}
-            className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
+            className="mt-1.5 w-full min-w-0 rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
           />
         </div>
 
         {/* MAKS. UČESNIKA */}
-        <div>
+        <div className="min-w-0">
           <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
             Maks. učesnika
           </label>
@@ -225,7 +225,7 @@
               onClick={() =>
                 setMaxParticipants(Math.max(1, maxParticipants - 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               −
             </button>
@@ -233,14 +233,14 @@
               type="text"
               value={maxParticipants}
               readOnly
-              className="h-[38px] flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
+              className="h-[38px] min-w-0 flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
             />
             <button
               type="button"
               onClick={() =>
                 setMaxParticipants(Math.min(50, maxParticipants + 1))
               }
-              className="h-[38px] w-[38px] rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
+              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
             >
               +
             </button>
diff --git a/src/screens/admin/Treninzi.tsx b/src/screens/admin/Treninzi.tsx
index 3f397448532eb447eae954c3a870ce7c3bc337af..1b014c8fa03c2b3b2fff7e2dd3e89dd51e758d00
--- a/src/screens/admin/Treninzi.tsx
+++ b/src/screens/admin/Treninzi.tsx
@@ -78,7 +78,7 @@
       </div>
 
       {/* Day selector */}
-      <div className="mt-4">
+      <div className="no-scrollbar mt-4 overflow-x-auto">
         <FilterChips
           options={TRAINING_DAYS.map((day) => ({
             key: day,

tokens used
55,940
Implemented all four fixes:

- Sunday-start booking weeks with Belgrade midnight rollover
- Change-password support for member and admin profiles
- Fixed-size shared toggle in the user modal
- Mobile-safe scrolling and responsive training form layout

Verification passed:

- `npm run build`
- `npm run lint`
- Focused week-boundary checks
- `git diff --check`

DONE
