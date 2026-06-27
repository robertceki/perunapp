import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/Colors";
import { Day, TRAINING_DAYS } from "@/constants/days";
import { Radii, Shadows } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { clampWeeklyLimit } from "@/utils/limits";
import { getCurrentWeekDates } from "@/utils/week";

const DAY_LABELS: Record<Day, string> = {
  sunday: "NED",
  monday: "PON",
  tuesday: "UTO",
  wednesday: "SRE",
  thursday: "ČET",
  friday: "PET",
  saturday: "SUB",
};

const isTrainingDay = (day: string): day is Day =>
  TRAINING_DAYS.includes(day as Day);

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, profile, session, updateProfile } = useAuth();
  const { bookedCount, trainings } = useTrainings();
  const weekDates = getCurrentWeekDates();
  const max = profile?.max_sessions_per_week ?? 0;
  const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
  const initials = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .map((name) => name?.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");
  const bookedSessions = trainings
    .filter(
      (training) =>
        isTrainingDay(training.day_of_week) &&
        training.session_participants.some(
          (participant) => participant.user_id === session?.user.id,
        ),
    )
    .sort((a, b) => {
      const dayDifference =
        weekDates[a.day_of_week as Day].getTime() -
        weekDates[b.day_of_week as Day].getTime();

      return dayDifference || a.time.localeCompare(b.time);
    });

  const changeLimit = (delta: number) => {
    const newValue = clampWeeklyLimit(max, delta, bookedCount);

    if (newValue !== max) {
      void updateProfile({ max_sessions_per_week: newValue });
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <View style={styles.navBar}>
        <Pressable
          accessibilityLabel="Nazad"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>Profil</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <View style={styles.avatarOutline}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials || "P"}</Text>
            </View>
          </View>
          <Text style={styles.name}>{fullName || "Perun član"}</Text>
          {/* Inferred placeholder: Profile has no created_at field. */}
          <View style={styles.membershipChip}>
            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
          </View>
        </View>

        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.placeholderMarker}>PRIMER</Text>
            <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
            <Text style={styles.statLabel}>treninga ukupno</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.placeholderMarker}>PRIMER</Text>
            <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
            <Text style={styles.statLabel}>nedelja u nizu</Text>
          </View>
        </View>

        <View style={styles.limitCard}>
          <View style={styles.limitHeader}>
            <View style={styles.limitHeaderCopy}>
              <Text style={styles.limitTitle}>Nedeljni limit</Text>
              <Text style={styles.limitSubtitle}>
                Maksimalno treninga po nedelji
              </Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                accessibilityLabel="Smanji nedeljni limit"
                accessibilityRole="button"
                disabled={max <= bookedCount}
                onPress={() => changeLimit(-1)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text
                  style={[
                    styles.stepperButton,
                    max <= bookedCount && styles.disabledStepperButton,
                  ]}
                >
                  −
                </Text>
              </Pressable>
              <Text style={styles.stepperValue}>{max}</Text>
              <Pressable
                accessibilityLabel="Povećaj nedeljni limit"
                accessibilityRole="button"
                disabled={max >= 7}
                onPress={() => changeLimit(1)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text
                  style={[
                    styles.stepperButton,
                    max >= 7 && styles.disabledStepperButton,
                  ]}
                >
                  +
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
            <Text style={styles.usageValue}>
              {bookedCount} / {max}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress}%` }]}>
              <View style={styles.fillHighlight} />
            </View>
          </View>
        </View>

        <Text style={styles.sessionsSectionTitle}>
          MOJI TERMINI OVE NEDELJE
        </Text>
        <View style={styles.sessionsList}>
          {bookedSessions.map((training) => {
            const day = training.day_of_week as Day;
            const dateNumber = String(weekDates[day].getUTCDate()).padStart(
              2,
              "0",
            );

            return (
              <View key={training.id} style={styles.sessionCard}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
                  <Text style={styles.dateNumber}>{dateNumber}</Text>
                </View>
                <View style={styles.sessionDivider} />
                <View style={styles.sessionCopy}>
                  <Text numberOfLines={1} style={styles.sessionTitle}>
                    {training.title}
                  </Text>
                  <Text style={styles.sessionMeta}>
                    {training.time.slice(0, 5)} · SALA A
                  </Text>
                </View>
                <View style={styles.checkBadge}>
                  <Text style={styles.check}>✓</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.logoutContainer}>
          <Pressable
            accessibilityRole="button"
            onPress={logout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.logoutText}>Odjavi se</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.paper,
    flex: 1,
  },
  navBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radii.tile[12],
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  backChevron: {
    color: Colors.burgundy,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 26,
  },
  navTitle: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[700],
    fontSize: 16,
    fontWeight: "700",
  },
  navSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  identity: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  avatarOutline: {
    ...Shadows.avatar,
    alignItems: "center",
    borderColor: Colors.border,
    borderRadius: Radii.avatar,
    borderWidth: 1,
    height: 86,
    justifyContent: "center",
    width: 86,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderColor: Colors.surface,
    borderRadius: Radii.avatar,
    borderWidth: 3,
    height: 84,
    justifyContent: "center",
    width: 84,
  },
  initials: {
    color: Colors.surface,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 32,
    fontWeight: "800",
  },
  name: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 21,
    fontWeight: "800",
    marginTop: 14,
  },
  membershipChip: {
    backgroundColor: Colors.goldTint,
    borderRadius: Radii.chip,
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  membershipText: {
    color: Colors.goldDeep,
    fontFamily: FontFamilies.hanken[800],
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statTile: {
    ...Shadows.card,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radii.tile[18],
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  placeholderMarker: {
    color: Colors.inkFaint,
    fontFamily: FontFamilies.hanken[800],
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    opacity: 0.65,
    position: "absolute",
    right: 12,
    top: 10,
  },
  statFigure: {
    ...Typography.statFigure,
    lineHeight: 29,
    opacity: 0.68,
  },
  burgundyStat: {
    color: Colors.burgundy,
  },
  sageStat: {
    color: Colors.sage,
  },
  statLabel: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 5,
  },
  limitCard: {
    ...Shadows.card,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
  },
  limitHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  limitHeaderCopy: {
    flex: 1,
    paddingRight: 10,
  },
  limitTitle: {
    color: Colors.ink,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 14.5,
    fontWeight: "700",
  },
  limitSubtitle: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  stepper: {
    alignItems: "center",
    backgroundColor: Colors.surfaceMuted,
    borderColor: "#EFE3D2",
    borderRadius: Radii.tile[14],
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  stepperButton: {
    color: Colors.burgundy,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 18,
    fontWeight: "700",
  },
  disabledStepperButton: {
    opacity: 0.3,
  },
  stepperValue: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 18,
    fontWeight: "800",
    minWidth: 14,
    textAlign: "center",
  },
  usageRow: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  usageLabel: {
    ...Typography.microLabelWide,
    color: Colors.inkFaint,
  },
  usageValue: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
  },
  track: {
    backgroundColor: Colors.track,
    borderRadius: 6,
    height: 8,
    marginTop: 9,
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
  sessionsSectionTitle: {
    ...Typography.sectionLabel,
    color: Colors.sage,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sessionsList: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sessionCard: {
    ...Shadows.card,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radii.tile[16],
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    padding: 16,
  },
  dateBlock: {
    alignItems: "center",
    width: 42,
  },
  dayLabel: {
    color: Colors.sage,
    fontFamily: FontFamilies.hanken[800],
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dateNumber: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 18,
    fontWeight: "800",
  },
  sessionDivider: {
    alignSelf: "stretch",
    backgroundColor: Colors.border,
    width: 1,
  },
  sessionCopy: {
    flex: 1,
    minWidth: 0,
  },
  sessionTitle: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[700],
    fontSize: 15,
    fontWeight: "700",
  },
  sessionMeta: {
    color: Colors.sage,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  checkBadge: {
    alignItems: "center",
    backgroundColor: Colors.gold,
    borderRadius: Radii.avatar,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  check: {
    color: Colors.surface,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10,
    fontWeight: "700",
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.burgundyBorder,
    borderRadius: Radii.tile[14],
    borderWidth: 1,
    paddingVertical: 14,
  },
  logoutText: {
    color: Colors.burgundy,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
});
