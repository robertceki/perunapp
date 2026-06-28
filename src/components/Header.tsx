import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
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
        <Image
          accessibilityIgnoresInvertColors
          source={require("../../assets/images/perun-emblem-burgundy.png")}
          style={styles.emblem}
        />
        <Text style={styles.wordmark}>PERUN</Text>
      </View>

      <Pressable
        accessibilityLabel="Otvori profil"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.push("/profile")}
        style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
      >
        <Text style={styles.initials}>{initials || "P"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: Colors.paper,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: 10,
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  emblem: {
    height: 30,
    resizeMode: "contain",
    width: 30,
  },
  wordmark: {
    ...Typography.wordmark,
    color: Colors.burgundy,
  },
  avatar: {
    ...Shadows.avatar,
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: Radii.avatar,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  initials: {
    color: Colors.surface,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 13.5,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.9,
  },
});
