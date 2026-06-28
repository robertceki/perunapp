import { useState } from "react";

import AlertBar from "@/components/AlertBar";
import DayFilter from "@/components/DayFilter";
import EmptyDay from "@/components/EmptyDay";
import Header from "@/components/Header";
import { TrainingCard } from "@/components/TrainingCard";
import type { Day } from "@/constants/days";
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { getCurrentWeekDates } from "@/lib/week";

const DAY_NAMES: Record<Day, string> = {
  sunday: "NEDELJA",
  monday: "PONEDELJAK",
  tuesday: "UTORAK",
  wednesday: "SREDA",
  thursday: "ČETVRTAK",
  friday: "PETAK",
  saturday: "SUBOTA",
};

const MONTH_NAMES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAJ",
  "JUN",
  "JUL",
  "AVG",
  "SEP",
  "OKT",
  "NOV",
  "DEC",
] as const;

export default function MemberHome() {
  const [selectedDay, setSelectedDay] = useState<Day>("monday");
  const { profile } = useAuth();
  const {
    getTrainingsByDay,
    joinSession,
    leaveSession,
    loading,
  } = useTrainings();
  const trainings = getTrainingsByDay(selectedDay);
  const selectedDate = getCurrentWeekDates()[selectedDay];
  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;

  async function handleJoin(sessionId: string) {
    const error = await joinSession(sessionId);
    if (error) throw error;
  }

  async function handleLeave(sessionId: string) {
    const error = await leaveSession(sessionId);
    if (error) throw error;
  }

  return (
    <main className="min-h-[100dvh] bg-paper pb-5">
      <Header />

      <section className="px-5 pt-4 pb-2">
        <h1 className="font-display text-[25px] font-extrabold leading-tight text-ink">
          Zdravo, {profile?.first_name?.trim() || "—"}
        </h1>
        <p className="mt-1 text-[13.5px] font-semibold text-ink-muted">
          Spreman za trening? Evo termina za ovu nedelju.
        </p>
      </section>

      <DayFilter
        onSelectDay={(day) => setSelectedDay(day as Day)}
        selectedDay={selectedDay}
      />
      <AlertBar />

      <div className="flex items-center justify-between px-[18px] pt-5 pb-3.5">
        <h2 className="font-display text-xs font-extrabold tracking-[0.08em] text-sage">
          {DAY_NAMES[selectedDay]} · {dateLabel}
        </h2>
        <span className="text-xs font-semibold text-ink-faint">
          {trainings.length} termina
        </span>
      </div>

      <section className="flex flex-col gap-[13px] px-5">
        {loading ? (
          <div className="flex justify-center py-10">
            <div
              aria-label="Učitavanje termina"
              className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-burgundy"
              role="status"
            />
          </div>
        ) : trainings.length > 0 ? (
          trainings.map((training) => (
            <TrainingCard
              key={training.id}
              onJoin={handleJoin}
              onLeave={handleLeave}
              training={training}
            />
          ))
        ) : (
          <EmptyDay />
        )}
      </section>
    </main>
  );
}
