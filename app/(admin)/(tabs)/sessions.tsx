import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { SessionRow } from "@/components/admin";
import { Colors } from "@/constants/Colors";
import { TRAINING_DAYS } from "@/constants/days";
import type { Day } from "@/constants/days";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useTrainings } from "@/hooks/useTrainings";
import { setSessionOpen } from "@/services/admin";
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

const DAY_NAMES: Record<Day, string> = {
  sunday: "NEDELJA",
  monday: "PONEDELJAK",
  tuesday: "UTORAK",
  wednesday: "SREDA",
  thursday: "ČETVRTAK",
  friday: "PETAK",
  saturday: "SUBOTA",
};

const MONTH_NAMES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAJ",
  "JUN",
  "JUL",
  "AVG",
  "SEP",
  "OKT",
  "NOV",
  "DEC",
] as const;

export default function TreninziScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<Day>("monday");
  const { loading, fetchTrainings, getTrainingsByDay } = useTrainings();
  const sessions = getTrainingsByDay(selectedDay);
  const selectedDate = getCurrentWeekDates()[selectedDay];
  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;

  const toggleSession = async (sessionId: string, open: boolean) => {
    try {
      await setSessionOpen(sessionId, open);
    } catch (error: unknown) {
      console.error(error);
      Alert.alert("Greška", "Status treninga nije promenjen.");
    } finally {
      await fetchTrainings();
    }
  };

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={sessions}
      keyExtractor={(session) => session.id}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.listGap} />}
      ListHeaderComponent={
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Treninzi</Text>
              <Text style={styles.subtitle}>
                {DAY_NAMES[selectedDay]} · {dateLabel}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(admin)/training/new")}
              style={({ pressed }) => [
                styles.newButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.newButtonText}>＋ Novi</Text>
            </Pressable>
          </View>

          <View style={styles.daySelector}>
            {TRAINING_DAYS.map((day) => {
              const active = selectedDay === day;
              return (
                <Pressable
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      active && styles.dayChipTextActive,
                    ]}
                  >
                    {DAY_LABELS[day]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {loading && (
            <ActivityIndicator
              color={Colors.burgundy}
              style={styles.loadingIndicator}
            />
          )}
        </View>
      }
      ListEmptyComponent={
        loading ? null : (
          <Text style={styles.emptyText}>Nema termina za ovaj dan.</Text>
        )
      }
      renderItem={({ item }) => (
        <SessionRow
          session={item}
          bookedCount={item.session_participants.length}
          onToggleOpen={(open) => void toggleSession(item.id, open)}
          onPress={() => router.push(`/(admin)/training/${item.id}`)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    gap: 18,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleBlock: {
    flex: 1,
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
  newButton: {
    borderRadius: Radii.chip,
    backgroundColor: Colors.burgundy,
    paddingHorizontal: 14,
    paddingVertical: 9,
    ...Shadows.primaryButton,
  },
  newButtonText: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 13,
    fontWeight: "700",
    color: Colors.surface,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  daySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 5,
  },
  dayChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.chip,
    backgroundColor: Colors.surface,
  },
  dayChipActive: {
    borderColor: Colors.burgundy,
    backgroundColor: Colors.burgundy,
    ...Shadows.activeDay,
  },
  dayChipText: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10,
    fontWeight: "700",
    color: Colors.ink,
  },
  dayChipTextActive: {
    color: Colors.surface,
  },
  loadingIndicator: {
    marginTop: 10,
  },
  listGap: {
    height: 10,
  },
  emptyText: {
    marginTop: 48,
    textAlign: "center",
    fontFamily: FontFamilies.hanken[600],
    fontSize: 13,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
});
