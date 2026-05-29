import { Pressable, Text, View } from "react-native";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export default function DayFilter({ selected, setSelected }: any) {
  return (
    <View
      style={{
        flexDirection: "row",
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: "#fff",
      }}
    >
      {DAYS.map((day) => (
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
