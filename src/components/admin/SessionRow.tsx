import { useRef, useState } from "react";

import Toggle from "@/components/admin/Toggle";
import { useToast } from "@/hooks/useToast";
import type { Training } from "@/types/Training";

type SessionRowProps = {
  session: Training;
  bookedCount: number;
  onToggleOpen: (open: boolean) => Promise<void>;
  onClick?: () => void;
  onLongPress?: () => void;
};

const LONG_PRESS_MS = 500;
const MOVE_CANCEL_PX = 10;

export default function SessionRow({
  session,
  bookedCount,
  onToggleOpen,
  onClick,
  onLongPress,
}: SessionRowProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const isFull = bookedCount >= session.max_participants;
  const closed = !session.is_open;

  // Long-press to delete: a timer fires after a hold; movement/scroll cancels it,
  // and a fired long-press suppresses the row's navigate click.
  const timerRef = useRef<number | null>(null);
  const firedRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function handlePointerDown(event: React.PointerEvent) {
    if (!onLongPress) return;
    firedRef.current = false;
    startRef.current = { x: event.clientX, y: event.clientY };
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      firedRef.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (timerRef.current === null || !startRef.current) return;
    const dx = Math.abs(event.clientX - startRef.current.x);
    const dy = Math.abs(event.clientY - startRef.current.y);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) clearTimer();
  }

  function handleClick() {
    if (firedRef.current) {
      firedRef.current = false;
      return; // long-press already handled this interaction
    }
    onClick?.();
  }

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
      className={`flex select-none items-center gap-3 rounded-[18px] border p-3 shadow-sm [-webkit-touch-callout:none] ${
        closed
          ? "border-border bg-surface-muted text-ink-muted"
          : "border-border bg-surface text-ink"
      } ${onClick ? "cursor-pointer" : ""}`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onPointerLeave={clearTimer}
      onContextMenu={(event) => {
        if (onLongPress) event.preventDefault();
      }}
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
        <span
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
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
