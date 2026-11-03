import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTrainings } from "@/hooks/useTrainings";
import { getBookingErrorMessage } from "@/lib/bookingErrors";
import type { Training } from "@/types/Training";

type TrainingCardProps = {
  training: Training;
  onJoin: (sessionId: string) => Promise<void>;
  onLeave: (sessionId: string) => Promise<void>;
};

function getErrorMessage(caught: unknown) {
  if (caught instanceof Error) {
    const rawMessage =
      "rawMessage" in caught && typeof caught.rawMessage === "string"
        ? caught.rawMessage
        : caught.message;
    return getBookingErrorMessage(rawMessage);
  }

  return getBookingErrorMessage(String(caught));
}

export function TrainingCard({
  training,
  onJoin,
  onLeave,
}: TrainingCardProps) {
  const { session } = useAuth();
  const { reachedLimit } = useTrainings();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const userId = session?.user.id;
  const participants = training.session_participants ?? [];
  const isBooked = participants.some(
    (participant) => participant.user_id === userId,
  );
  const bookedCount = participants.length;
  const isFull = bookedCount >= training.max_participants;
  const canJoin = !isFull && !reachedLimit && !isBooked;
  const fullAndNotBooked = isFull && !isBooked;
  const spotsLeft = Math.max(training.max_participants - bookedCount, 0);
  const cardBackground = fullAndNotBooked
    ? "bg-surface-muted"
    : isBooked
      ? "bg-surface-warm"
      : "bg-surface";

  async function submit(action: (sessionId: string) => Promise<void>) {
    setSubmitting(true);

    try {
      await action(training.id);
    } catch (caught) {
      showToast(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article
      className={`relative overflow-hidden rounded-card border p-4 ${cardBackground} ${isBooked ? "border-gold-border shadow-sm" : "border-border"} ${fullAndNotBooked ? "shadow-none" : "shadow-sm"}`}
    >
      {isBooked && <div className="absolute inset-y-0 left-0 w-1 bg-gold" />}

      <div className="flex items-start gap-3">
        <div className="w-[58px] shrink-0 text-center">
          <span
            className={`font-display text-lg font-extrabold leading-[21px] ${fullAndNotBooked ? "text-ink-faint" : "text-ink"}`}
          >
            {training.time.slice(0, 5)}
          </span>
        </div>

        <div className="self-stretch border-l border-border" />

        <div className="min-w-0 flex-1">
          <h2
            className={`line-clamp-2 font-display text-[15px] font-bold leading-[18px] ${fullAndNotBooked ? "text-ink-muted" : "text-ink"}`}
          >
            {training.title}
          </h2>
          <p
            className={`mt-1 text-xs font-semibold ${fullAndNotBooked ? "text-ink-faint" : "text-sage"}`}
          >
            Grupni
          </p>
        </div>

        {isBooked ? (
          <span className="flex shrink-0 items-center gap-1 rounded-chip bg-burgundy py-1 pr-2.5 pl-2 text-[10px] font-extrabold text-surface">
            <span className="flex h-[15px] w-[15px] items-center justify-center rounded-full bg-gold text-[10px]">
              ✓
            </span>
            Prijavljen
          </span>
        ) : fullAndNotBooked ? (
          <span className="shrink-0 rounded-chip bg-burgundy-tint px-2.5 py-1 text-[10px] font-extrabold text-burgundy-text2">
            Popunjeno
          </span>
        ) : (
          <span className="shrink-0 rounded-chip bg-gold-tint px-2.5 py-1 text-[10px] font-extrabold text-gold-deep">
            još {spotsLeft} mesta
          </span>
        )}
      </div>

      <ul className="mt-3.5 flex min-w-0 flex-wrap gap-1.5">
        {participants.map((participant) => {
          const fullName = [
            participant.profiles?.first_name,
            participant.profiles?.last_name,
          ]
            .map((name) => name?.trim())
            .filter(Boolean)
            .join(" ");
          const isCurrentUser = participant.user_id === userId;

          return (
            <li
              className={`min-w-0 max-w-full rounded-chip px-2.5 py-1 text-xs font-semibold [overflow-wrap:anywhere] ${isCurrentUser ? "bg-burgundy text-surface" : "bg-sage-tint text-sage"}`}
              key={participant.user_id}
            >
              {fullName || "—"}
            </li>
          );
        })}
      </ul>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`text-[12.5px] font-semibold ${fullAndNotBooked ? "text-ink-faint" : "text-ink-muted"}`}
        >
          {bookedCount} / {training.max_participants} mesta
        </span>

        {isBooked && (
          <button
            className="shrink-0 text-xs font-bold text-sage disabled:opacity-50"
            disabled={submitting}
            onClick={() => void submit(onLeave)}
            type="button"
          >
            {submitting ? "Sačekaj..." : "Odjavi se"}
          </button>
        )}
      </div>

      {!isBooked &&
        (fullAndNotBooked ? (
          <button
            className="mt-3.5 w-full rounded-input bg-track py-3 text-[13.5px] font-bold text-ink-faint"
            disabled
            type="button"
          >
            Popunjeno
          </button>
        ) : reachedLimit ? (
          <button
            className="mt-3.5 w-full rounded-input border border-dashed border-field-border bg-paper py-3 text-[13.5px] font-bold text-ink-faint"
            disabled
            type="button"
          >
            Nedeljni limit dostignut
          </button>
        ) : (
          <button
            className="mt-3.5 w-full rounded-input bg-burgundy py-3 text-[13.5px] font-bold text-surface shadow-sm active:opacity-90 disabled:opacity-50"
            disabled={!canJoin || submitting}
            onClick={() => void submit(onJoin)}
            type="button"
          >
            {submitting ? "Prijava..." : "Prijavi se"}
          </button>
        ))}
    </article>
  );
}
