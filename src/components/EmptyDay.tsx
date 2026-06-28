export default function EmptyDay() {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-border bg-surface px-5 py-[30px] text-center">
      <img
        alt=""
        className="h-[62px] w-[62px] object-contain opacity-[0.12]"
        src="/brand/perun-emblem-ink.png"
      />
      <p className="mt-3.5 font-display text-base font-bold text-ink">
        Nema više termina
      </p>
      <p className="mt-1 text-[13px] font-semibold leading-[18px] text-ink-muted">
        Za ovaj dan nema dodatnih zakazanih treninga.
      </p>
    </div>
  );
}
