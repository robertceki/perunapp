import { Text, View } from "react-native";

export default function Header() {
  return (
    <View
      style={{
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: "#0f0f0f",
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 22,
          fontWeight: "700",
          letterSpacing: 1,
          textAlign: "center",
        }}
      >
        PERUN TRAINING CENTAR
      </Text>
    </View>
  );
}
