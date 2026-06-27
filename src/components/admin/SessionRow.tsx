import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies } from "@/constants/typography";
import { Training } from "@/types/Training";
import Toggle from "./Toggle";

interface SessionRowProps {
  session: Training;
  bookedCount: number;
  onToggleOpen: (open: boolean) => void;
  onPress?: () => void;
}

export default function SessionRow({ session, bookedCount, onToggleOpen, onPress }: SessionRowProps) {
  const isFull = bookedCount >= session.max_participants;
  const isClosed = !session.is_open;

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.card, isClosed && styles.cardClosed]}>
        <View style={styles.content}>
          <View style={styles.timeBlock}>
            <Text style={[styles.time, isClosed && styles.textMuted]}>{session.time}</Text>
            <Text style={[styles.duration, isClosed && styles.textMuted]}>
              {session.duration_min ? `${session.duration_min} min` : "—"}
            </Text>
          </View>
          <View style={[styles.divider, isClosed && { backgroundColor: "#ECE3D6" }]} />
          <View style={styles.main}>
            <Text style={[styles.title, isClosed && styles.textMuted]}>{session.title}</Text>
            <Text style={[styles.booked, isClosed && styles.textMuted]}>
              {session.room || "Sala"} · {bookedCount} / {session.max_participants}
            </Text>
            {isFull && !isClosed && (
              <View style={styles.fullChip}>
                <Text style={styles.fullText}>Popunjeno</Text>
              </View>
            )}
            {isClosed && (
              <View style={styles.closedChip}>
                <Text style={styles.closedText}>Zatvoreno</Text>
              </View>
            )}
          </View>
          <Toggle value={session.is_open} onValueChange={onToggleOpen} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    ...Shadows.card,
  },
  cardClosed: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: "#ECE3D6",
  },
  content: { flexDirection: "row", alignItems: "center", gap: 12 },
  timeBlock: { gap: 2 },
  time: { fontFamily: FontFamilies.bricolage[800], fontSize: 17, fontWeight: "800", color: Colors.ink },
  duration: { fontFamily: FontFamilies.hanken[600], fontSize: 10, fontWeight: "600", color: Colors.inkFaint },
  divider: { width: 1, height: 40, backgroundColor: Colors.border },
  main: { flex: 1, gap: 2 },
  title: { fontFamily: FontFamilies.bricolage[700], fontSize: 15, fontWeight: "700", color: Colors.ink },
  booked: { fontFamily: FontFamilies.hanken[600], fontSize: 12, fontWeight: "600", color: Colors.sage },
  fullChip: { backgroundColor: Colors.burgundyTint, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radii.chip },
  fullText: { fontFamily: FontFamilies.hanken[700], fontSize: 11, fontWeight: "700", color: Colors.burgundyText2 },
  closedChip: { backgroundColor: Colors.surfaceMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radii.chip },
  closedText: { fontFamily: FontFamilies.hanken[700], fontSize: 11, fontWeight: "700", color: Colors.inkMuted },
  textMuted: { color: Colors.inkMuted },
});
