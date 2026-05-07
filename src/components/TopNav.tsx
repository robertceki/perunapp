import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function TopNav() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderColor: "#eee",
      }}
    >
      <Pressable onPress={() => router.push("/")}>
        <Text style={{ fontWeight: "600" }}>Home</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/profile")}>
        <Text style={{ fontWeight: "600" }}>Profile</Text>
      </Pressable>
    </View>
  );
}
