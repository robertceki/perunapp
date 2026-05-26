import { Tabs } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { Text, View } from "react-native";

export default function TabsLayout() {
  const { fetchTrainings, bookedCount, reachedLimit } = useTrainings();
  const { profile } = useAuth();
  useEffect(() => {
    console.log("Fetching trainings...");
    fetchTrainings();
  }, []);
  return (
    <>
      {profile && (
        <View
          style={{
            padding: 12,
            backgroundColor: reachedLimit ? "#ffdddd" : "#eeeeee",
          }}
        >
          <Text>
            {bookedCount} / {profile.max_sessions_per_week} treninga prijavljeno
          </Text>

          {reachedLimit && (
            <Text
              style={{
                color: "red",
                marginTop: 4,
              }}
            >
              Dostigli ste limit
            </Text>
          )}
        </View>
      )}
      <Tabs screenOptions={{ headerShown: true }}>
        <Tabs.Screen name="monday" options={{ title: "Ponedeljak" }} />
        <Tabs.Screen name="tuesday" options={{ title: "Utorak" }} />
        <Tabs.Screen name="wednesday" options={{ title: "Sreda" }} />
        <Tabs.Screen name="thursday" options={{ title: "Četvrtak" }} />
        <Tabs.Screen name="friday" options={{ title: "Petak" }} />
        <Tabs.Screen name="saturday" options={{ title: "Subota" }} />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </>
  );
}
