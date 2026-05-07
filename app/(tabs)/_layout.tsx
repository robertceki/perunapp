import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="monday" options={{ title: "Ponedeljak" }} />
      <Tabs.Screen name="tuesday" options={{ title: "Utorak" }} />
      <Tabs.Screen name="wednesday" options={{ title: "Sreda" }} />
      <Tabs.Screen name="thursday" options={{ title: "Četvrtak" }} />
      <Tabs.Screen name="friday" options={{ title: "Petak" }} />
      <Tabs.Screen name="saturday" options={{ title: "Subota" }} />
    </Tabs>
  );
}
