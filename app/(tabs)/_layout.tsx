import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import AlertBar from "@/components/AlertBar";
import DayFilter from "@/components/DayFilter";
import EmptyDay from "@/components/EmptyDay";
import Header from "@/components/Header";
import { TrainingCard } from "@/components/TrainingCard";
import { Colors } from "@/constants/Colors";
import { Day } from "@/constants/days";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { getCurrentWeekDates } from "@/utils/week";

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

export default function TabsLayout() {
  const [selectedDay, setSelectedDay] = useState<Day>("monday");
  const { profile } = useAuth();
  const { getTrainingsByDay } = useTrainings();
  const data = getTrainingsByDay(selectedDay);
  const selectedDate = getCurrentWeekDates()[selectedDay];
  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;

  return (
    <View style={styles.screen}>
      <Header />

      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>
          Zdravo, {profile?.first_name?.trim() || "—"}
        </Text>
        <Text style={styles.subtitle}>
          Spreman za trening? Evo termina za ovu nedelju.
        </Text>
      </View>

      <DayFilter
        selected={selectedDay}
        setSelected={(day) => setSelectedDay(day as Day)}
      />
      <AlertBar />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {DAY_NAMES[selectedDay]} · {dateLabel}
        </Text>
        <Text style={styles.sectionCount}>{data.length} termina</Text>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={data}
        keyExtractor={(training) => training.id}
        ListEmptyComponent={EmptyDay}
        renderItem={({ item }) => <TrainingCard training={item} />}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.paper,
    flex: 1,
  },
  greeting: {
    paddingBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  greetingTitle: {
    ...Typography.greeting,
    color: Colors.ink,
  },
  subtitle: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 13.5,
    fontWeight: "600",
    marginTop: 4,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  sectionTitle: {
    ...Typography.sectionLabel,
    color: Colors.sage,
  },
  sectionCount: {
    color: Colors.inkFaint,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
});
