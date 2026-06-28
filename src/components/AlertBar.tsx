import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";

export default function AlertBar() {
  const { session, profile } = useAuth();
  const { bookedCount, reachedLimit } = useTrainings();

  if (!session || !profile) return null;

  const max = profile.max_sessions_per_week;
  const atLimit = max > 0 && reachedLimit;
  const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;

  if (atLimit) {
    return (
      <section className="mx-5 mt-4 flex items-center gap-3 rounded-card border border-burgundy-border bg-burgundy-tint px-4 py-3.5">
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-burgundy font-display text-lg font-extrabold text-surface">
          !
        </span>
        <div>
          <p className="text-[13.5px] font-bold text-burgundy">
            Nedeljni limit dostignut
          </p>
          <p className="mt-px text-xs font-semibold text-burgundy-text2">
            Iskoristio si {bookedCount} / {max} treninga ove nedelje.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-5 mt-4 rounded-card border border-border bg-surface px-4 py-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-extrabold tracking-[0.1em] text-ink-muted">
          OVE NEDELJE
        </span>
        <span className="font-display text-[15px] font-extrabold text-ink">
          {bookedCount} / {max}
        </span>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-chip bg-track">
        <div
          className="h-full rounded-chip bg-gold transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  );
}
