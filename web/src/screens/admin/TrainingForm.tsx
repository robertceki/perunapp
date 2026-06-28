import { Link } from "react-router-dom";

export default function TrainingForm() {
  return (
    <main
      className="min-h-[100dvh] bg-paper px-5 pb-6"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
    >
      <nav className="flex items-center gap-4">
        <Link
          aria-label="Nazad"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-input border border-border bg-surface text-2xl font-bold leading-none text-burgundy"
          to="/admin"
        >
          ‹
        </Link>
        <h1 className="font-display text-[23px] font-extrabold text-ink">
          Novi trening
        </h1>
      </nav>
      <p className="mt-5 text-[13px] font-semibold text-ink-muted">
        Forma za trening biće dostupna uskoro.
      </p>
    </main>
  );
}
