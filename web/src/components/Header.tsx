import { useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const initials = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .map((name) => name?.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className="flex items-center justify-between bg-paper px-5 py-2.5"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 10px)" }}
    >
      <div className="flex items-center gap-2.5">
        <img
          alt=""
          className="h-[30px] w-[30px] object-contain"
          src="/brand/perun-emblem-burgundy.png"
        />
        <span className="font-display text-lg font-extrabold tracking-[0.12em] text-burgundy">
          PERUN
        </span>
      </div>

      <button
        aria-label="Otvori profil"
        className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-burgundy text-[13.5px] font-bold text-surface shadow-sm active:opacity-90"
        onClick={() => navigate("/profile")}
        type="button"
      >
        {initials || "P"}
      </button>
    </header>
  );
}
