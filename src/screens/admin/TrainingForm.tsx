import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Toggle from "@/components/admin/Toggle";
import FilterChips from "@/components/admin/FilterChips";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTrainings } from "@/hooks/useTrainings";
import { deleteSession, upsertSession } from "@/services/admin";
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    if (isNew) return;
    setDeleting(true);
    try {
      await deleteSession(id);
      showToast("Trening je obrisan");
      await fetchTrainings();
      navigate("/admin/sessions");
    } catch {
      showToast("Greška pri brisanju treninga");
      setDeleting(false);
      setConfirmDelete(false);
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
        <div className="no-scrollbar mt-1.5 overflow-x-auto">
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
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* VREME */}
        <div className="min-w-0">
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
            className="mt-1.5 w-full min-w-0 rounded-input border border-field-border bg-surface py-2.5 px-3 text-center text-sm placeholder-ink-faint font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>

        {/* MAKS. UČESNIKA */}
        <div className="min-w-0">
          <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
            Maks. učesnika
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setMaxParticipants(Math.max(1, maxParticipants - 1))
              }
              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
            >
              −
            </button>
            <input
              type="text"
              value={maxParticipants}
              readOnly
              className="h-[38px] min-w-0 flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
            />
            <button
              type="button"
              onClick={() =>
                setMaxParticipants(Math.min(50, maxParticipants + 1))
              }
              className="h-[38px] w-[38px] shrink-0 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
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

      {/* Delete (edit mode only) */}
      {!isNew && (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={submitting || deleting}
          className="mt-5 w-full rounded-input border border-[#EAC6BF] bg-surface py-2.5 text-sm font-bold text-[#C0341B] hover:bg-surface-muted disabled:opacity-50"
        >
          Obriši trening
        </button>
      )}

      {/* Confirm-delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6">
          <div className="w-full max-w-sm rounded-card bg-surface p-5 shadow-lg">
            <h2 className="font-display text-lg font-extrabold text-ink">
              Obriši trening?
            </h2>
            <p className="mt-2 text-[13px] font-semibold text-ink-muted">
              Trening i sve prijave članova biće trajno uklonjeni.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 rounded-input border border-field-border bg-surface py-2.5 font-semibold text-ink hover:bg-surface-muted disabled:opacity-50"
              >
                Otkaži
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex-1 rounded-input bg-[#C0341B] py-2.5 font-semibold text-surface hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? "Brisanje..." : "Obriši"}
              </button>
            </div>
          </div>
        </div>
      )}

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
