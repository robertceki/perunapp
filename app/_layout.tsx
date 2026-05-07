import TopNav from "@/components/TopNav";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <>
      <TopNav />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
      </Stack>
    </>
  );
}
