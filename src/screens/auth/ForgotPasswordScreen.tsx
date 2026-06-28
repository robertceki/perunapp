import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      await resetPassword(email);
      setMessage("Ako nalog postoji, poslali smo uputstva na email.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-[30px] py-8 font-sans"
      style={{ paddingTop: "max(30px, env(safe-area-inset-top))" }}
    >
      <div className="flex w-full flex-col items-center gap-6">
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

        <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
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

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          {message && <p className="text-sm font-semibold text-ink-muted">{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-input bg-burgundy p-4 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Učitavanje…" : "Pošalji link za reset"}
          </button>
        </form>

        <Link to="/login" className="text-sm font-bold text-burgundy">
          Nazad na prijavu
        </Link>
      </div>
    </main>
  );
}
