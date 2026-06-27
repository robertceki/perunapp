import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { FilterChips, UserRow } from "@/components/admin";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { deleteUser, listUsers, updateUser } from "@/services/admin";
import type { AdminUser, UpdateUserPatch } from "@/services/admin";

type UserFilter = "svi" | "aktivni" | "admini";
type UserRole = AdminUser["role"];

const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
  { key: "svi", label: "Svi" },
  { key: "aktivni", label: "Aktivni" },
  { key: "admini", label: "Admini" },
];

const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
  { key: "user", label: "Član" },
  { key: "admin", label: "Admin" },
];

export default function KorisniciScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("svi");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [maxSessions, setMaxSessions] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setHasError(false);

    try {
      setUsers(await listUsers());
    } catch (error: unknown) {
      console.error(error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return users.filter((user) => {
      const matchesFilter =
        filter === "svi" ||
        (filter === "aktivni" && user.enabled !== false) ||
        (filter === "admini" && user.role === "admin");
      const searchable =
        `${user.first_name} ${user.last_name ?? ""} ${user.email}`.toLocaleLowerCase();

      return matchesFilter && searchable.includes(query);
    });
  }, [filter, search, users]);

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setFirstName(user.first_name);
    setLastName(user.last_name ?? "");
    setRole(user.role);
    setMaxSessions(user.max_sessions_per_week);
  };

  const closeEditModal = () => {
    if (!saving) setEditingUser(null);
  };

  const saveUser = async () => {
    if (!editingUser) return;

    const patch: UpdateUserPatch = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      role,
      max_sessions_per_week: maxSessions,
    };

    setSaving(true);
    try {
      await updateUser(editingUser.id, patch);
      setEditingUser(null);
      await fetchUsers();
    } catch (error: unknown) {
      console.error(error);
      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
      await fetchUsers();
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (user: AdminUser) => {
    try {
      await deleteUser(user.id);
      setExpandedId(null);
      await fetchUsers();
    } catch (error: unknown) {
      console.error(error);
      Alert.alert("Greška", "Korisnik nije uklonjen.");
      await fetchUsers();
    }
  };

  const confirmRemove = (user: AdminUser) => {
    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();

    Alert.alert(
      "Ukloni korisnika",
      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
      [
        { text: "Otkaži", style: "cancel" },
        {
          text: "Ukloni",
          style: "destructive",
          onPress: () => void removeUser(user),
        },
      ],
    );
  };

  if (loading && users.length === 0) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={Colors.burgundy} />
      </View>
    );
  }

  if (hasError && users.length === 0) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Greška pri učitavanju</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={filteredUsers}
        keyExtractor={(user) => user.id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.listGap} />}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Korisnici</Text>
              <Text style={styles.subtitle}>{users.length} članova</Text>
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Pretraži članove…"
              placeholderTextColor={Colors.inkFaint}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FilterChips
              options={FILTER_OPTIONS}
              value={filter}
              onChange={setFilter}
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <UserRow
            user={item}
            expanded={expandedId === item.id}
            onToggleExpand={() =>
              setExpandedId((current) => (current === item.id ? null : item.id))
            }
            onEdit={() => openEditModal(item)}
            onRemove={() => confirmRemove(item)}
            tintIndex={index % 3}
          />
        )}
      />

      <Modal
        animationType="slide"
        transparent
        visible={editingUser !== null}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Izmena korisnika</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>IME</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                style={styles.fieldInput}
                editable={!saving}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PREZIME</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                style={styles.fieldInput}
                editable={!saving}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ULOGA</Text>
              <FilterChips
                options={ROLE_OPTIONS}
                value={role}
                onChange={setRole}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
              <View style={styles.stepper}>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving || maxSessions === 0}
                  onPress={() =>
                    setMaxSessions((value) => Math.max(0, value - 1))
                  }
                  style={styles.stepButton}
                >
                  <Text style={styles.stepButtonText}>−</Text>
                </Pressable>
                <Text style={styles.stepValue}>{maxSessions}</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving || maxSessions === 14}
                  onPress={() =>
                    setMaxSessions((value) => Math.min(14, value + 1))
                  }
                  style={styles.stepButton}
                >
                  <Text style={styles.stepButtonText}>＋</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={closeEditModal}
                disabled={saving}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Otkaži</Text>
              </Pressable>
              <Pressable
                onPress={() => void saveUser()}
                disabled={saving}
                style={[styles.saveButton, saving && styles.buttonDisabled]}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.surface} />
                ) : (
                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 20,
    paddingBottom: 24,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  errorText: {
    ...Typography.body,
    color: Colors.inkMuted,
  },
  headerContent: {
    gap: 16,
    marginBottom: 16,
  },
  title: {
    ...Typography.screenTitle,
    fontSize: 23,
    color: Colors.ink,
  },
  subtitle: {
    fontFamily: FontFamilies.hanken[600],
    fontSize: 13,
    fontWeight: "600",
    color: Colors.inkMuted,
    marginTop: 3,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 14,
    fontWeight: "600",
    color: Colors.ink,
  },
  listGap: {
    height: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(34, 31, 43, 0.35)",
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.card,
    borderTopRightRadius: Radii.card,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 24,
    paddingBottom: 28,
    gap: 16,
    ...Shadows.card,
  },
  modalTitle: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 21,
    fontWeight: "800",
    color: Colors.ink,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldLabel: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: Colors.inkMuted,
  },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 14,
    fontWeight: "600",
    color: Colors.ink,
  },
  stepper: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
    backgroundColor: Colors.surface,
  },
  stepButton: {
    width: 44,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonText: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 20,
    fontWeight: "700",
    color: Colors.burgundy,
  },
  stepValue: {
    minWidth: 44,
    textAlign: "center",
    fontFamily: FontFamilies.hanken[700],
    fontSize: 15,
    fontWeight: "700",
    color: Colors.ink,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderColor: Colors.burgundy,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
  },
  cancelButtonText: {
    ...Typography.primaryButtonCompact,
    color: Colors.burgundy,
  },
  saveButton: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: Radii.tile[14],
    backgroundColor: Colors.burgundy,
  },
  saveButtonText: {
    ...Typography.primaryButtonCompact,
    color: Colors.surface,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
