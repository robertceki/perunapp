import type { AdminUser } from "@/services/admin";

const AVATAR_TINTS = [
  "bg-sage-tint text-sage",
  "bg-gold-tint text-gold-deep",
  "bg-burgundy-tint text-burgundy",
] as const;

type UserRowProps = {
  user: AdminUser;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onRemove: () => void;
  tintIndex?: number;
};

export default function UserRow({
  user,
  expanded,
  onToggleExpand,
  onEdit,
  onRemove,
  tintIndex = 0,
}: UserRowProps) {
  const initials = `${user.first_name.charAt(0)}${user.last_name?.charAt(0) ?? ""}`
    .toUpperCase() || "—";
  const inactive = user.enabled === false;

  return (
    <article
      className={`rounded-[16px] p-3 shadow-sm ${
        expanded
          ? "border-2 border-gold bg-surface-warm"
          : "border border-border bg-surface"
      } ${inactive ? "opacity-65" : ""}`}
    >
      <button
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 text-left"
        onClick={onToggleExpand}
        type="button"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
            AVATAR_TINTS[tintIndex % AVATAR_TINTS.length]
          }`}
        >
          {initials}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink">
            {[user.first_name, user.last_name].filter(Boolean).join(" ")}
          </span>
          <span className="block truncate text-xs font-semibold text-ink-muted">
            {user.email}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-chip px-2.5 py-1 text-[10px] font-extrabold ${
              user.role === "admin"
                ? "bg-burgundy-tint text-burgundy"
                : "bg-sage-tint text-sage"
            }`}
          >
            {user.role === "admin"
              ? "Admin"
              : `${user.max_sessions_per_week}× / ned`}
          </span>
          {inactive && (
            <span className="rounded-chip bg-track px-2 py-0.5 text-[9px] font-bold text-ink-muted">
              Neaktivan
            </span>
          )}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 flex gap-2 border-t border-gold-border pt-3">
          <button
            className="flex-1 rounded-input border border-burgundy px-4 py-2.5 text-sm font-semibold text-burgundy active:bg-burgundy-tint"
            onClick={onEdit}
            type="button"
          >
            Izmeni
          </button>
          <button
            className="flex-1 rounded-input border border-[#C0341B] px-4 py-2.5 text-sm font-semibold text-[#C0341B] active:opacity-70"
            onClick={onRemove}
            type="button"
          >
            Ukloni
          </button>
        </div>
      )}
    </article>
  );
}
