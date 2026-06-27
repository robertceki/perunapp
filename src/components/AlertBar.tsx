import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";

export default function AlertBar() {
  const { session, profile } = useAuth();
  const { bookedCount, reachedLimit } = useTrainings();

  if (!session || !profile) return null;

  const max = profile.max_sessions_per_week ?? 0;
  const atLimit = reachedLimit && max > 0;
  const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;

  if (atLimit) {
    return (
      <View style={styles.limitCard}>
        <View style={styles.alertIcon}>
          <Text style={styles.alertIconText}>!</Text>
        </View>
        <View style={styles.alertCopy}>
          <Text style={styles.alertTitle}>Nedeljni limit dostignut</Text>
          <Text style={styles.alertMessage}>
            Iskoristio si {bookedCount} / {max} treninga ove nedelje.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Text style={styles.microLabel}>OVE NEDELJE</Text>
        <Text style={styles.progressValue}>
          {bookedCount}
          <Text style={styles.progressTotal}> / {max} termina</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]}>
          <View style={styles.fillHighlight} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    ...Shadows.card,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radii.tile[18],
    borderWidth: 1,
    marginHorizontal: Spacing.screenHorizontal,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  progressHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  microLabel: {
    ...Typography.microLabel,
    color: Colors.inkMuted,
  },
  progressValue: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 15,
    fontWeight: "800",
  },
  progressTotal: {
    color: "#B6A9C0",
  },
  track: {
    backgroundColor: Colors.track,
    borderRadius: 6,
    height: 8,
    marginTop: 10,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: Colors.gold,
    borderRadius: 6,
    height: "100%",
    overflow: "hidden",
  },
  fillHighlight: {
    alignSelf: "flex-end",
    backgroundColor: "#DCC388",
    height: "100%",
    width: "50%",
  },
  limitCard: {
    alignItems: "center",
    backgroundColor: Colors.burgundyTint,
    borderColor: Colors.burgundyBorder,
    borderRadius: Radii.tile[16],
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginHorizontal: Spacing.screenHorizontal,
    marginTop: 16,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  alertIcon: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: Radii.avatar,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  alertIconText: {
    color: Colors.surface,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 18,
    fontWeight: "800",
  },
  alertCopy: {
    flex: 1,
  },
  alertTitle: {
    color: Colors.burgundy,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 13.5,
    fontWeight: "700",
  },
  alertMessage: {
    color: Colors.burgundyText2,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
    marginTop: 1,
  },
});
