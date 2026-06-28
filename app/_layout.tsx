import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from "@expo-google-fonts/hanken-grotesk";

import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/contexts/AuthContext";
import { TrainingProvider } from "@/contexts/TrainingContext";
import { useAuth } from "@/hooks/useAuth";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, loading, profile } = useAuth();

  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();

  useEffect(() => {
    // Don't navigate until the root navigator is mounted, otherwise
    // router.replace throws "REPLACE ... was not handled by any navigator".
    if (!navState?.key) return;

    if (loading) return;

    if (session && !profile) return;

    // Public auth routes that don't require authentication
    const publicAuthRoutes = ["login", "register", "forgot-password"];
    const inAuthRoute = publicAuthRoutes.includes(segments[0]);

    // Shared routes accessible by both admins and members
    const sharedRoutes = ["profile"];
    const inShared = sharedRoutes.includes(segments[0]);

    // Not logged in: redirect to login if not already on a public auth route
    if (!session && !inAuthRoute) {
      router.replace("/login");
      return;
    }

    // Logged in but still waiting for profile: do nothing, let spinner show
    if (session && !profile) {
      return;
    }

    // Logged in with profile: enforce role-based routing
    if (session && profile) {
      // Allow shared routes without bouncing
      if (inShared) {
        return;
      }

      if (profile.role === "admin") {
        // Admin: redirect away from public auth routes or member (tabs)
        if (inAuthRoute || segments[0] === "(tabs)") {
          router.replace("/(admin)");
        }
      } else {
        // Member: redirect away from public auth routes or admin routes
        if (inAuthRoute || segments[0] === "(admin)") {
          router.replace("/(tabs)");
        }
      }
    }
  }, [session, loading, profile, segments, router, navState?.key]);

  // Wait for auth AND (if signed in) the profile/role before rendering any
  // stack, so screens never mount before auth is ready — otherwise admin data
  // loads fire as anon (not_admin) and role routing flashes the wrong stack.
  if (loading || (session && !profile)) {
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
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="profile" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Bricolage_700Bold: BricolageGrotesque_700Bold,
    Bricolage_800ExtraBold: BricolageGrotesque_800ExtraBold,
    Hanken_400Regular: HankenGrotesk_400Regular,
    Hanken_500Medium: HankenGrotesk_500Medium,
    Hanken_600SemiBold: HankenGrotesk_600SemiBold,
    Hanken_700Bold: HankenGrotesk_700Bold,
    Hanken_800ExtraBold: HankenGrotesk_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <TrainingProvider>
          <RootNavigator />
        </TrainingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
