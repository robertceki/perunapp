import { Pressable, StyleSheet, View } from "react-native";
import { Colors } from "@/constants/Colors";

interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ value, onValueChange, disabled = false }: ToggleProps) {
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[styles.container, { opacity: disabled ? 0.5 : 1 }]}
    >
      <View style={[styles.track, { backgroundColor: value ? Colors.burgundy : "#DDD3C7" }]}>
        <View style={[styles.knob, { left: value ? 22 : 3 }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: 46, height: 27, justifyContent: "center" },
  track: { width: "100%", height: "100%", borderRadius: 20, position: "relative" },
  knob: { width: 21, height: 21, borderRadius: 9999, backgroundColor: Colors.surface, position: "absolute", top: 3 },
});
