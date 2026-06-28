import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies } from "@/constants/typography";

interface StatTileProps {
  figure: string;
  label: string;
  figureColor?: string;
  delta?: string;
  deltaColor?: string;
}

export default function StatTile({
  figure,
  label,
  figureColor = Colors.ink,
  delta,
  deltaColor,
}: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.figure, { color: figureColor }]}>{figure}</Text>
      <Text style={styles.label}>{label}</Text>
      {delta && (
        <Text style={[styles.delta, { color: deltaColor }]}>{delta}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    gap: 4,
    ...Shadows.card,
  },
  figure: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 26,
    fontWeight: "800",
  },
  label: {
    fontFamily: FontFamilies.hanken[600],
    fontSize: 11.5,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
  delta: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 11,
    fontWeight: "700",
  },
});
