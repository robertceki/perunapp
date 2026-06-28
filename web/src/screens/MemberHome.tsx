import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";

export default function MemberHome() {
  const { profile, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setError(null);

    try {
      await logout();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-paper px-6 text-center"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <h1 className="font-display text-[25px] font-extrabold text-ink">
        Član: {profile?.first_name}
      </h1>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="rounded-input border border-burgundy-border bg-surface px-8 py-4 text-sm font-bold text-burgundy"
      >
        Odjavi se
      </button>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
    </main>
  );
}
