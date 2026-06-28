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
