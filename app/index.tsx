import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const { session, loading } = useAuth();
  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/login");
    }
    console.log("Session:", session);
  }, [session, loading]);

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
