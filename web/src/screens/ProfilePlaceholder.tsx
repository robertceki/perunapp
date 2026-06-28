import { Link } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

export default function ProfilePlaceholder() {
  const { profile } = useAuth();

  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-paper px-6 text-center"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <h1 className="font-display text-[25px] font-extrabold text-ink">Profil</h1>
      <p className="font-sans font-semibold text-ink-muted">
        {profile?.first_name} {profile?.last_name}
      </p>
      <Link to="/" className="text-sm font-bold text-burgundy">
        Nazad
      </Link>
    </main>
  );
}
