import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { Training } from "@/types/Training";

const AVATAR_COLORS = [
  { backgroundColor: Colors.sageTint, color: Colors.sage },
  { backgroundColor: Colors.goldTint, color: Colors.goldDeep },
  { backgroundColor: "#F4E6EE", color: Colors.burgundy },
] as const;

export function TrainingCard({ training }: { training: Training }) {
  const { session } = useAuth();
  const { joinSession, leaveSession, reachedLimit } = useTrainings();

  const userId = session?.user.id;
  const participants = training.session_participants ?? [];
  const isBooked = participants.some(
    (participant) => participant.user_id === userId,
  );
  const bookedCount = participants.length;
  const isFull = bookedCount >= training.max_participants;
  const canJoin = !isFull && !reachedLimit && !isBooked;
  const fullAndNotBooked = isFull && !isBooked;
  const spotsLeft = Math.max(training.max_participants - bookedCount, 0);
  const otherParticipants = isBooked
    ? participants.filter((participant) => participant.user_id !== userId)
    : participants;
  const hasOverflow = bookedCount > 3;
  const visibleParticipantSlots = hasOverflow ? 2 : 3;
  const visibleOthers = otherParticipants.slice(
    0,
    Math.max(visibleParticipantSlots - (isBooked ? 1 : 0), 0),
  );
  const shownCount = visibleOthers.length + (isBooked ? 1 : 0);
  const overflowCount = Math.max(bookedCount - shownCount, 0);
  const cardBackground = fullAndNotBooked
    ? Colors.surfaceMuted
    : isBooked
      ? Colors.surfaceWarm
      : Colors.surface;

  return (
    <View
      style={[
        styles.shadowContainer,
        { backgroundColor: cardBackground },
        fullAndNotBooked && styles.noShadow,
      ]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: cardBackground },
          isBooked && styles.bookedCard,
          fullAndNotBooked && styles.fullCard,
        ]}
      >
        {isBooked && (
          <View style={styles.goldAccent}>
            <View style={styles.goldAccentHighlight} />
          </View>
        )}

        <View style={styles.headerRow}>
          <View style={styles.timeBlock}>
            <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
              {training.time.slice(0, 5)}
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              isBooked && styles.bookedDivider,
              fullAndNotBooked && styles.fullDivider,
            ]}
          />

          <View style={styles.titleBlock}>
            <Text
              numberOfLines={2}
              style={[styles.title, fullAndNotBooked && styles.fullTitle]}
            >
              {training.title}
            </Text>
            <Text
              style={[styles.category, fullAndNotBooked && styles.fullTime]}
            >
              Grupni
            </Text>
          </View>

          {isBooked ? (
            <View style={styles.bookedChip}>
              <View style={styles.checkBadge}>
                <Text style={styles.check}>✓</Text>
              </View>
              <Text style={styles.bookedChipText}>Prijavljen</Text>
            </View>
          ) : fullAndNotBooked ? (
            <View style={styles.fullChip}>
              <Text style={styles.fullChipText}>Popunjeno</Text>
            </View>
          ) : (
            <View style={styles.spotsChip}>
              <Text style={styles.spotsChipText}>još {spotsLeft} mesta</Text>
            </View>
          )}
        </View>

        <View style={styles.capacityRow}>
          <View style={styles.capacityDetails}>
            <View style={styles.avatarStack}>
              {isBooked && (
                <View
                  style={[
                    styles.participantAvatar,
                    styles.youAvatar,
                    { borderColor: cardBackground },
                  ]}
                >
                  <Text style={styles.youAvatarText}>TI</Text>
                </View>
              )}

              {visibleOthers.map((participant, index) => {
                const palette = AVATAR_COLORS[index % AVATAR_COLORS.length];
                const initials = [
                  participant.profiles?.first_name,
                  participant.profiles?.last_name,
                ]
                  .filter(Boolean)
                  .map((name) => name?.trim().charAt(0))
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <View
                    key={participant.user_id}
                    style={[
                      styles.participantAvatar,
                      shownCount > visibleOthers.length - index &&
                        styles.overlap,
                      {
                        backgroundColor: palette.backgroundColor,
                        borderColor: cardBackground,
                      },
                    ]}
                  >
                    <Text style={[styles.avatarText, { color: palette.color }]}>
                      {initials || "—"}
                    </Text>
                  </View>
                );
              })}

              {overflowCount > 0 && (
                <View
                  style={[
                    styles.participantAvatar,
                    styles.overflowAvatar,
                    styles.overlap,
                    { borderColor: cardBackground },
                  ]}
                >
                  <Text style={styles.overflowText}>+{overflowCount}</Text>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.capacityText,
                fullAndNotBooked && styles.fullCapacityText,
              ]}
            >
              {bookedCount} / {training.max_participants} mesta
            </Text>
          </View>

          {isBooked && (
            <Pressable
              accessibilityRole="button"
              onPress={() => leaveSession(training.id)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.leaveLink}>Odjavi se</Text>
            </Pressable>
          )}
        </View>

        {!isBooked &&
          (fullAndNotBooked ? (
            <View style={[styles.action, styles.fullAction]}>
              <Text style={styles.fullActionText}>Popunjeno</Text>
            </View>
          ) : reachedLimit ? (
            <View style={[styles.action, styles.limitAction]}>
              <Text style={styles.limitActionText}>
                Nedeljni limit dostignut
              </Text>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={!canJoin}
              onPress={() => joinSession(training.id)}
              style={({ pressed }) => [
                styles.action,
                styles.joinAction,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.joinActionText}>Prijavi se</Text>
            </Pressable>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    ...Shadows.card,
    borderRadius: Radii.card,
    marginBottom: Spacing.cardGap,
  },
  noShadow: {
    elevation: 0,
    shadowOpacity: 0,
  },
  card: {
    borderColor: Colors.border,
    borderRadius: Radii.card,
    borderWidth: 1,
    overflow: "hidden",
    padding: Spacing.cardPadding,
  },
  bookedCard: {
    borderColor: Colors.goldBorder,
  },
  fullCard: {
    borderColor: "#ECE3D6",
  },
  goldAccent: {
    backgroundColor: Colors.gold,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 4,
  },
  goldAccentHighlight: {
    backgroundColor: "#DCC388",
    bottom: 0,
    height: "50%",
    left: 0,
    position: "absolute",
    right: 0,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 13,
  },
  timeBlock: {
    alignItems: "center",
    width: 58,
  },
  time: {
    ...Typography.time,
    color: Colors.ink,
    lineHeight: 21,
  },
  divider: {
    alignSelf: "stretch",
    backgroundColor: Colors.border,
    width: 1,
  },
  bookedDivider: {
    backgroundColor: "#EEE3CC",
  },
  fullDivider: {
    backgroundColor: "#ECE3D6",
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.ink,
  },
  category: {
    ...Typography.secondary,
    color: Colors.sage,
    marginTop: 4,
  },
  fullTime: {
    color: "#9A9098",
  },
  fullTitle: {
    color: "#6E6670",
  },
  spotsChip: {
    backgroundColor: Colors.goldTint,
    borderRadius: Radii.chip,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  spotsChipText: {
    ...Typography.chip,
    color: Colors.goldDeep,
  },
  bookedChip: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: Radii.chip,
    flexDirection: "row",
    gap: 5,
    paddingBottom: 5,
    paddingLeft: 7,
    paddingRight: 10,
    paddingTop: 5,
  },
  checkBadge: {
    alignItems: "center",
    backgroundColor: Colors.gold,
    borderRadius: Radii.avatar,
    height: 15,
    justifyContent: "center",
    width: 15,
  },
  check: {
    color: Colors.surface,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10,
    fontWeight: "700",
  },
  bookedChipText: {
    ...Typography.chip,
    color: Colors.surface,
  },
  fullChip: {
    backgroundColor: "#F1E4EC",
    borderRadius: Radii.chip,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  fullChipText: {
    ...Typography.chip,
    color: Colors.burgundyText2,
  },
  capacityRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  capacityDetails: {
    alignItems: "center",
    flexDirection: "row",
    minWidth: 0,
  },
  avatarStack: {
    alignItems: "center",
    flexDirection: "row",
  },
  participantAvatar: {
    alignItems: "center",
    borderRadius: Radii.avatar,
    borderWidth: 2,
    height: 29,
    justifyContent: "center",
    width: 29,
  },
  overlap: {
    marginLeft: -9,
  },
  youAvatar: {
    backgroundColor: Colors.burgundy,
  },
  youAvatarText: {
    color: Colors.surface,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10,
    fontWeight: "700",
  },
  avatarText: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10.5,
    fontWeight: "700",
  },
  overflowAvatar: {
    backgroundColor: Colors.track,
  },
  overflowText: {
    color: Colors.goldDeep,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10.5,
    fontWeight: "700",
  },
  capacityText: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12.5,
    fontWeight: "600",
    marginLeft: 11,
  },
  fullCapacityText: {
    color: "#9A9098",
  },
  leaveLink: {
    color: Colors.sage,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 12,
    fontWeight: "700",
  },
  action: {
    alignItems: "center",
    borderRadius: Radii.tile[14],
    justifyContent: "center",
    marginTop: 14,
    paddingVertical: 13,
  },
  joinAction: {
    ...Shadows.primaryButton,
    backgroundColor: Colors.burgundy,
  },
  joinActionText: {
    ...Typography.primaryButtonCompact,
    color: Colors.surface,
  },
  fullAction: {
    backgroundColor: "#F0E9DF",
  },
  fullActionText: {
    ...Typography.primaryButtonCompact,
    color: "#A99FB0",
  },
  limitAction: {
    backgroundColor: Colors.paper,
    borderColor: "#E2D7C7",
    borderStyle: "dashed",
    borderWidth: 1,
  },
  limitActionText: {
    color: "#A99FB0",
    fontFamily: FontFamilies.hanken[700],
    fontSize: 13.5,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.92,
  },
});
