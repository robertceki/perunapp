import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { Radii } from "@/constants/spacing";
import { FontFamilies } from "@/constants/typography";

interface FilterChipsProps<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
}

export default function FilterChips<T extends string>({ options, value, onChange }: FilterChipsProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => (
        <Pressable key={opt.key} onPress={() => onChange(opt.key)} style={[
          styles.chip,
          { backgroundColor: opt.key === value ? Colors.burgundy : Colors.surface,
            borderColor: opt.key === value ? "transparent" : Colors.fieldBorder },
        ]}>
          <Text style={[styles.label, { color: opt.key === value ? Colors.surface : Colors.ink }]}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radii.chip, borderWidth: 1 },
  label: { fontFamily: FontFamilies.hanken[700], fontSize: 12, fontWeight: "700" },
});
