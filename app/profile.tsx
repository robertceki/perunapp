import { Text, View } from "react-native";

export default function Profile() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Profil korisnika</Text>

      <Text style={{ marginTop: 10 }}>Ime: (kasnije Supabase)</Text>

      <Text>Email: (kasnije Supabase)</Text>
    </View>
  );
}
