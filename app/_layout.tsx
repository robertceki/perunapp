import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { Stack, useRouter, useSegments } from "expo-router";

import { AuthProvider } from "@/contexts/AuthContext";
import { TrainingProvider } from "@/contexts/TrainingContext";
import { useAuth } from "@/hooks/useAuth";

function RootNavigator() {
  const { session, loading } = useAuth();

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inLoginPage = segments[0] === "login";

    if (!session && !inLoginPage) {
      router.replace("/login");
    }

    if (session && inLoginPage) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TrainingProvider>
        <RootNavigator />
      </TrainingProvider>
    </AuthProvider>
  );
}
