import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";
export default function Profile() {
  const router = useRouter();
  const { session, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Profil korisnika</Text>

      <Text style={{ marginTop: 10 }}>Ime: {session?.user.email}</Text>

      <Text>Email: {session?.user.email}</Text>

      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
