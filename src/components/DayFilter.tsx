import { Pressable, Text, View } from "react-native";

import { TRAINING_DAYS } from "@/constants/days";

interface DayFilterProps {
  selected: string;
  setSelected: (day: string) => void;
}

export default function DayFilter({ selected, setSelected }: DayFilterProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: "#fff",
      }}
    >
      {TRAINING_DAYS.map((day) => (
        <Pressable
          key={day}
          onPress={() => setSelected(day)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 20,
            marginRight: 8,
            backgroundColor: selected === day ? "#000" : "#eee",
          }}
        >
          <Text
            style={{
              color: selected === day ? "#fff" : "#333",
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {day.slice(0, 3).toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
