import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      setComplete(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (complete) return <Navigate to="/" replace />;

  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-[30px] py-8 font-sans"
      style={{ paddingTop: "max(30px, env(safe-area-inset-top))" }}
    >
      <div className="flex w-full flex-col items-center gap-5">
        <img
          src="/brand/perun-emblem-burgundy.png"
          alt="Perun"
          className="h-28 w-28 object-contain"
        />
        <img
          src="/brand/perun-wordmark-burgundy.png"
          alt="Perun Trening Centar"
          className="h-16 w-44 object-contain"
        />

        <form className="flex w-full flex-col gap-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-[11px] font-extrabold tracking-[1.1px] text-ink-faint">
            EMAIL
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="rounded-input border border-field-border bg-surface px-4 py-[15px] text-base font-semibold tracking-normal text-ink outline-none focus:border-gold focus:ring-[3px] focus:ring-gold/15"
            />
          </label>

          <label className="flex flex-col gap-2 text-[11px] font-extrabold tracking-[1.1px] text-ink-faint">
            LOZINKA
            <span className="flex rounded-input border border-field-border bg-surface focus-within:border-gold focus-within:ring-[3px] focus-within:ring-gold/15">
              <input
                type={visible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="min-w-0 flex-1 bg-transparent px-4 py-[15px] text-base font-semibold tracking-normal text-ink outline-none"
              />
              <button
                type="button"
                onClick={() => setVisible((current) => !current)}
                className="px-4 text-[13px] font-bold tracking-normal text-sage"
              >
                {visible ? "Sakrij" : "Prikaži"}
              </button>
            </span>
          </label>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <Link
            to="/forgot-password"
            className="mt-1 self-end text-[13px] font-bold text-sage"
          >
            Zaboravljena lozinka?
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-input bg-burgundy p-4 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Učitavanje…" : "Prijavi se"}
          </button>
        </form>

        <p className="text-sm font-semibold text-ink-muted">
          Nemaš nalog?{" "}
          <Link to="/register" className="font-bold text-burgundy">
            Pridruži se
          </Link>
        </p>
      </div>
    </main>
  );
}
