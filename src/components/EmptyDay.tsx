import { Image, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { Radii } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";

export default function EmptyDay() {
  return (
    <View style={styles.card}>
      <Image
        accessibilityIgnoresInvertColors
        source={require("../../assets/images/perun-emblem-ink.png")}
        style={styles.emblem}
      />
      <Text style={styles.title}>Nema više termina</Text>
      <Text style={styles.message}>
        Za ovaj dan nema dodatnih zakazanih treninga.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: "#E7DDCF",
    borderRadius: Radii.card,
    borderStyle: "dashed",
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  emblem: {
    height: 62,
    opacity: 0.12,
    resizeMode: "contain",
    width: 62,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.ink,
    marginTop: 14,
  },
  message: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18.2,
    marginTop: 5,
    textAlign: "center",
  },
});
