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

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
    } catch {
      showToast("Odjava nije uspela. Pokušajte ponovo.");
      setLoggingOut(false);
    }
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
