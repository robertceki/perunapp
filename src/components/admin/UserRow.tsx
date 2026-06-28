import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies } from "@/constants/typography";
import { AdminUser } from "@/services/admin/types";

interface UserRowProps {
  user: AdminUser;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onRemove: () => void;
  tintIndex?: number;
}

const tints = [Colors.sage, Colors.gold, Colors.burgundy];

export default function UserRow({ user, expanded, onToggleExpand, onEdit, onRemove, tintIndex = 0 }: UserRowProps) {
  const avatarColor = tints[tintIndex % 3];
  const initials = [user.first_name[0] || "", (user.last_name?.[0] || "")]
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable onPress={onToggleExpand}>
      <View style={[styles.card, expanded && styles.cardExpanded]}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
            <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: user.role === "admin" ? Colors.burgundyTint : Colors.sageTint }]}>
            <Text style={[styles.chipText, { color: user.role === "admin" ? Colors.burgundy : Colors.sage }]}>
              {user.role === "admin" ? "Admin" : `${user.max_sessions_per_week}× / ned`}
            </Text>
          </View>
        </View>
        {expanded && (
          <View style={styles.actions}>
            <Pressable onPress={onEdit} style={styles.editBtn}>
              <Text style={styles.editText}>Izmeni</Text>
            </Pressable>
            <Pressable onPress={onRemove} style={styles.removeBtn}>
              <Text style={styles.removeText}>Ukloni</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[16],
    padding: Spacing.cardPadding,
    ...Shadows.card,
  },
  cardExpanded: {
    backgroundColor: Colors.surfaceWarm,
    borderColor: Colors.goldBorder,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.cardGap,
  },
  avatar: { width: 36, height: 36, borderRadius: 9999, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: FontFamilies.hanken[700], fontSize: 12, fontWeight: "700", color: Colors.surface },
  info: { flex: 1 },
  name: { fontFamily: FontFamilies.hanken[700], fontSize: 14, fontWeight: "700", color: Colors.ink },
  email: { fontFamily: FontFamilies.hanken[600], fontSize: 12, fontWeight: "600", color: Colors.inkMuted },
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.chip },
  chipText: { fontFamily: FontFamilies.hanken[700], fontSize: 12, fontWeight: "700" },
  actions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 12,
  },
  editBtn: { borderColor: Colors.burgundyBorder, borderWidth: 1, borderRadius: Radii.tile[12], paddingHorizontal: 12, paddingVertical: 8 },
  editText: { fontFamily: FontFamilies.hanken[700], fontSize: 14, fontWeight: "700", color: Colors.burgundy },
  removeBtn: { borderColor: "#EAC6BF", borderWidth: 1, borderRadius: Radii.tile[12], paddingHorizontal: 12, paddingVertical: 8 },
  removeText: { fontFamily: FontFamilies.hanken[700], fontSize: 14, fontWeight: "700", color: "#C0341B" },
});
