import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";

export default function AdminHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const initials = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .map((name) => name?.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.brand}>
        <Image source={require("../../../assets/images/perun-emblem-burgundy.png")} style={styles.emblem} />
        <Text style={styles.wordmark}>PERUN</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ADMIN</Text>
        </View>
      </View>
      <Pressable onPress={() => router.push("/profile")} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
        <Text style={styles.initials}>{initials || "A"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.paper,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: 10,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  emblem: { width: 30, height: 30, resizeMode: "contain" },
  wordmark: { ...Typography.wordmark, color: Colors.burgundy },
  badge: {
    backgroundColor: Colors.burgundyTint,
    borderColor: Colors.burgundyBorder,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FontFamilies.hanken[800],
    fontSize: 9,
    fontWeight: "800",
    color: Colors.burgundy,
  },
  avatar: {
    ...Shadows.avatar,
    backgroundColor: Colors.navy,
    width: 38,
    height: 38,
    borderRadius: Radii.avatar,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: Colors.surface,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 13.5,
    fontWeight: "700",
  },
  pressed: { opacity: 0.9 },
});
