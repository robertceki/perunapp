import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { Day, TRAINING_DAYS } from "@/constants/days";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies } from "@/constants/typography";
import { getCurrentWeekDates } from "@/utils/week";

interface DayFilterProps {
  selected: string;
  setSelected: (day: string) => void;
}

const DAY_LABELS: Record<Day, string> = {
  sunday: "NED",
  monday: "PON",
  tuesday: "UTO",
  wednesday: "SRE",
  thursday: "ČET",
  friday: "PET",
  saturday: "SUB",
};

export default function DayFilter({ selected, setSelected }: DayFilterProps) {
  const weekDates = getCurrentWeekDates();

  return (
    <View style={styles.container}>
      {TRAINING_DAYS.map((day) => {
        const active = selected === day;
        const dateNumber = String(weekDates[day].getUTCDate()).padStart(2, "0");

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={day}
            onPress={() => setSelected(day)}
            style={({ pressed }) => [
              styles.day,
              active && styles.activeDay,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>
              {DAY_LABELS[day]}
            </Text>
            <Text style={[styles.date, active && styles.activeDate]}>
              {dateNumber}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.paper,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 18,
  },
  day: {
    alignItems: "center",
    borderRadius: Radii.tile[16],
    flex: 1,
    gap: 5,
    paddingVertical: 10,
  },
  activeDay: {
    ...Shadows.activeDay,
    backgroundColor: Colors.burgundy,
  },
  pressed: {
    opacity: 0.92,
  },
  label: {
    color: "#A99FA8",
    fontFamily: FontFamilies.hanken[800],
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  activeLabel: {
    color: "#E7C9D8",
  },
  date: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 16,
    fontWeight: "800",
  },
  activeDate: {
    color: Colors.surface,
  },
});
