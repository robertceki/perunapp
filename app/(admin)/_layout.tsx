import { Stack } from "expo-router";

import { Colors } from "@/constants/Colors";

// Admin stack: the tab navigator lives in (tabs); the create/edit form is a
// sibling stack route so it renders WITHOUT the admin header or bottom tab bar.
// Non-admins are kept out by RootNavigator's effect-based redirect (app/_layout)
// and the per-screen role guards refuse to call admin RPCs — so we do NOT render
// a <Redirect> during this layout's render (that competes with the root effect
// and can navigate before the tree is ready).
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
