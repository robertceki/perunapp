import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import UserRow from "@/components/admin/UserRow";
import FilterChips from "@/components/admin/FilterChips";
import Toggle from "@/components/admin/Toggle";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  listUsers,
  updateUser,
  deleteUser,
  type AdminUser,
  type UpdateUserPatch,
} from "@/services/admin";

type FilterKey = "all" | "active" | "admin";

type EditingUser = {
  id: string;
  first_name: string;
  last_name: string | null;
  role: "user" | "admin";
  max_sessions_per_week: number;
  enabled: boolean | null;
};

export default function Korisnici() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterKey, setFilterKey] = useState<FilterKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load users
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);

      try {
        const data = await listUsers();
        setUsers(data);
      } catch {
        setError("Greška pri učitavanju");
        showToast("Greška pri učitavanju korisnika");
      } finally {
        setLoading(false);
      }
    }

    void fetchUsers();
  }, [showToast]);

  // Filter users
  const filtered = useMemo(() => {
    let result = users;

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.first_name?.toLowerCase() ?? "").includes(q) ||
          (u.last_name?.toLowerCase() ?? "").includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }

    // Status/role filter
    switch (filterKey) {
      case "active":
        result = result.filter((u) => u.enabled !== false);
        break;
      case "admin":
        result = result.filter((u) => u.role === "admin");
        break;
      case "all":
      default:
        break;
    }

    return result;
  }, [users, search, filterKey]);

  // Guard: only admins can manage users
  if (profile?.role !== "admin") {
    return (
      <section className="px-5 pt-5">
        <p className="text-[13px] font-semibold text-ink-muted">
          Pristup odbijen.
        </p>
      </section>
    );
  }

  // Edit handler
  async function handleEditSave() {
    if (!editingUser) return;

    setSubmitting(true);
    try {
      const patch: UpdateUserPatch = {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        role: editingUser.role,
        max_sessions_per_week: editingUser.max_sessions_per_week,
        enabled: editingUser.enabled,
      };

      await updateUser(editingUser.id, patch);
      showToast("Korisnik je uspešno ažuriran");

      // Refetch
      const data = await listUsers();
      setUsers(data);
      setEditingUser(null);
      setExpandedId(null);
    } catch {
      showToast("Greška pri čuvanju korisnika");
    } finally {
      setSubmitting(false);
    }
  }

  // Remove handler
  async function handleRemove() {
    if (!confirmRemoveId) return;

    setSubmitting(true);
    try {
      await deleteUser(confirmRemoveId);
      showToast("Korisnik je uklonjen");

      // Refetch
      const data = await listUsers();
      setUsers(data);
      setConfirmRemoveId(null);
      setExpandedId(null);
    } catch {
      showToast("Greška pri uklanjanju korisnika");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="px-5 pt-5 pb-24">
      {/* Header */}
      <div className="flex items-baseline gap-2">
        <h1 className="font-display text-[23px] font-extrabold text-ink">
          Korisnici
        </h1>
        <span className="text-[13px] font-semibold text-ink-muted">
          {filtered.length} članova
        </span>
      </div>

      {/* Search */}
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          placeholder="Pretraži članove…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-input border border-field-border bg-surface py-2.5 pl-10 pr-10 text-sm placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="mt-4">
        <FilterChips
          options={[
            { key: "all", label: "Svi" },
            { key: "active", label: "Aktivni" },
            { key: "admin", label: "Admini" },
          ]}
          value={filterKey}
          onChange={(key) => setFilterKey(key as FilterKey)}
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 rounded-input border border-burgundy-border bg-burgundy-tint p-4 text-sm font-semibold text-burgundy">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-6 flex justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-burgundy"
            role="status"
            aria-label="Učitavanje"
          />
        </div>
      )}

      {/* List */}
      {!loading && !error && (
        <div className="mt-6 space-y-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-ink-muted">
              Nema rezultata.
            </p>
          ) : (
            filtered.map((user, idx) => (
              <UserRow
                key={user.id}
                user={user}
                expanded={expandedId === user.id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === user.id ? null : user.id)
                }
                onEdit={() => {
                  setEditingUser({
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    max_sessions_per_week: user.max_sessions_per_week,
                    enabled: user.enabled ?? true,
                  });
                }}
                onRemove={() => setConfirmRemoveId(user.id)}
                tintIndex={idx}
              />
            ))
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5">
          <div className="w-full max-w-md rounded-[22px] bg-surface p-6">
            <h2 className="font-display text-[20px] font-bold text-ink">
              Izmeni korisnika
            </h2>

            {/* IME */}
            <div className="mt-5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Ime
              </label>
              <input
                type="text"
                value={editingUser.first_name}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    first_name: e.target.value,
                  })
                }
                className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            {/* PREZIME */}
            <div className="mt-4">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Prezime
              </label>
              <input
                type="text"
                value={editingUser.last_name ?? ""}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    last_name: e.target.value || null,
                  })
                }
                className="mt-1.5 w-full rounded-input border border-field-border bg-surface py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            {/* ULOGA */}
            <div className="mt-4">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Uloga
              </label>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({ ...editingUser, role: "user" })
                  }
                  className={`flex-1 rounded-input border-2 py-2 px-3 text-sm font-semibold transition-colors ${
                    editingUser.role === "user"
                      ? "border-burgundy bg-burgundy text-surface"
                      : "border-border bg-surface text-ink"
                  }`}
                >
                  Član
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({ ...editingUser, role: "admin" })
                  }
                  className={`flex-1 rounded-input border-2 py-2 px-3 text-sm font-semibold transition-colors ${
                    editingUser.role === "admin"
                      ? "border-burgundy bg-burgundy text-surface"
                      : "border-border bg-surface text-ink"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* MAKS. SESIJA */}
            <div className="mt-4">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Maks. sesija po nedelji
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({
                      ...editingUser,
                      max_sessions_per_week: Math.max(
                        0,
                        editingUser.max_sessions_per_week - 1,
                      ),
                    })
                  }
                  className="h-9 w-9 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
                >
                  −
                </button>
                <input
                  type="text"
                  value={editingUser.max_sessions_per_week}
                  readOnly
                  className="h-9 flex-1 rounded-input border border-field-border bg-surface-muted text-center font-bold text-ink"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({
                      ...editingUser,
                      max_sessions_per_week: Math.min(
                        14,
                        editingUser.max_sessions_per_week + 1,
                      ),
                    })
                  }
                  className="h-9 w-9 rounded-input border border-field-border bg-surface font-bold text-ink hover:bg-surface-muted active:opacity-70"
                >
                  +
                </button>
              </div>
            </div>

            {/* Aktivan Toggle */}
            <div className="mt-4 flex items-center justify-between">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
                Aktivan
              </label>
              <Toggle
                onChange={(enabled) =>
                  setEditingUser({
                    ...editingUser,
                    enabled,
                  })
                }
                value={Boolean(editingUser.enabled)}
              />
            </div>

            {/* Footer */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={submitting}
                className="flex-1 rounded-input border border-field-border py-2.5 font-semibold text-ink hover:bg-surface-muted disabled:opacity-50"
              >
                Otkaži
              </button>
              <button
                type="button"
                onClick={() => void handleEditSave()}
                disabled={submitting}
                className="flex-1 rounded-input bg-burgundy py-2.5 font-semibold text-surface hover:opacity-90 disabled:opacity-50"
              >
                Sačuvaj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Remove Dialog */}
      {confirmRemoveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5">
          <div className="w-full max-w-md rounded-[22px] bg-surface p-6">
            <h2 className="font-display text-[20px] font-bold text-ink">
              Ukloni korisnika?
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              {users
                .find((u) => u.id === confirmRemoveId)
                ?.first_name || "Korisnik"}{" "}
              · Sve prijave će biti uklonjene.
            </p>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemoveId(null)}
                disabled={submitting}
                className="flex-1 rounded-input border border-field-border py-2.5 font-semibold text-ink hover:bg-surface-muted disabled:opacity-50"
              >
                Otkaži
              </button>
              <button
                type="button"
                onClick={() => void handleRemove()}
                disabled={submitting}
                className="flex-1 rounded-input py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#C0341B" }}
              >
                Ukloni
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
