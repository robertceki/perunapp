import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>Perun Trening</Text>

      <Pressable onPress={() => router.push("/(tabs)/monday")}>
        <Text style={{ marginTop: 20, fontSize: 18 }}>→ Treninzi</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/profile")}>
        <Text style={{ marginTop: 10, fontSize: 18 }}>→ Profil</Text>
      </Pressable>
    </View>
  );
}
