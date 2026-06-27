import { Stack } from "expo-router";

import { Colors } from "@/constants/Colors";

// Admin stack: the tab navigator lives in (tabs); the create/edit form is a
// sibling stack route so it renders WITHOUT the admin header or bottom tab bar.
export default function AdminLayout() {
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
