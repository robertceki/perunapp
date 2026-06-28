import { Redirect, Stack } from "expo-router";

import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";

// Admin stack: the tab navigator lives in (tabs); the create/edit form is a
// sibling stack route so it renders WITHOUT the admin header or bottom tab bar.
export default function AdminLayout() {
  const { session, profile } = useAuth();

  // Hard guard at the admin boundary: non-admins (or signed-out users) never
  // mount any admin screen, so admin RPCs are never fired without the role
  // (prevents the not_admin error on a stale/raced admin route).
  if (!session) {
    return <Redirect href="/login" />;
  }
  if (profile && profile.role !== "admin") {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.paper },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="training/[id]" />
    </Stack>
  );
}
