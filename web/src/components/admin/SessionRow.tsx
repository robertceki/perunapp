import { useState } from "react";

import Toggle from "@/components/admin/Toggle";
import { useToast } from "@/hooks/useToast";
import type { Training } from "@/types/Training";

type SessionRowProps = {
  session: Training;
  bookedCount: number;
  onToggleOpen: (open: boolean) => Promise<void>;
  onClick?: () => void;
};

export default function SessionRow({
  session,
  bookedCount,
  onToggleOpen,
  onClick,
}: SessionRowProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const isFull = bookedCount >= session.max_participants;
  const closed = !session.is_open;

  async function toggle(open: boolean) {
    setSubmitting(true);

    try {
      await onToggleOpen(open);
    } catch {
      showToast("Promena statusa nije uspela.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article
      className={`flex items-center gap-3 rounded-[18px] border p-3 shadow-sm ${
        closed
          ? "border-border bg-surface-muted text-ink-muted"
          : "border-border bg-surface text-ink"
      } ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span
        className={`w-[52px] shrink-0 text-center font-display text-[17px] font-extrabold ${
          closed ? "text-ink-muted" : "text-ink"
        }`}
      >
        {session.time.slice(0, 5)}
      </span>

      <span className="h-10 border-l border-border" />

      <span className="min-w-0 flex-1">
        <span
          className={`block truncate font-display text-[15px] font-bold ${
            closed ? "text-ink-muted" : "text-ink"
          }`}
        >
          {session.title}
        </span>
        <span
          className={`mt-0.5 block truncate text-xs font-semibold ${
            closed ? "text-ink-faint" : "text-sage"
          }`}
        >
          {session.room ?? "Sala"} · {bookedCount}/{session.max_participants}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {isFull && !closed && (
          <span className="rounded-chip bg-burgundy-tint px-2 py-1 text-[9px] font-extrabold text-burgundy-text2">
            Popunjeno
          </span>
        )}
        {closed && (
          <span className="rounded-chip bg-track px-2 py-1 text-[9px] font-extrabold text-ink-muted">
            Zatvoreno
          </span>
        )}
        <span onClick={(event) => event.stopPropagation()}>
          <Toggle
            disabled={submitting}
            onChange={(open) => void toggle(open)}
            value={session.is_open}
          />
        </span>
      </span>
    </article>
  );
}
