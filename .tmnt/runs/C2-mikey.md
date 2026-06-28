Reading additional input from stdin...
OpenAI Codex v0.142.0
--------
workdir: /Users/uros/Documents/Private/Projects/PerunApp
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR] (network access enabled)
reasoning effort: high
reasoning summaries: none
session id: 019f0cc0-d98f-7712-9d4b-addd332fd8e4
--------
user
TASK: Fix Android status bar overlap (Phase C Group C #2)

CONTEXT
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Framework: React Native (Expo) + expo-router + react-native-safe-area-context (v5.6.0)

Files to consider (read before changing):
- app/_layout.tsx (RootLayout, wraps AuthProvider/TrainingProvider/RootNavigator)
- src/components/Header.tsx (member top bar, uses paddingVertical: 10)
- src/components/admin/AdminHeader.tsx (admin top bar, uses paddingVertical: 10)
- app/login.tsx (auth screen, uses paddingTop: 30)
- app/register.tsx (auth screen, uses paddingTop: 30)
- app/forgot-password.tsx (auth screen, uses paddingTop: 30)
- app/profile.tsx (profile modal nav bar, already uses SafeAreaView edges={["top", "bottom"]})
- app/(admin)/training/[id].tsx (form nav bar, uses paddingTop: 16, paddingBottom: 12)

CODING CONSTRAINTS (non-negotiable)
- Simplicity first: minimum code that solves the problem. No speculative features.
- Surgical changes: touch only files listed above. Do not refactor adjacent components.
- Match existing patterns: RN primitives + safe-area-context only. No new dependencies.
- Reuse tokens: no new colors, spacing values, or design tokens.
- TypeScript strict mode: no `any` types.
- No commit; just produce the code changes.

TASKS
1. Ensure SafeAreaProvider wraps the app:
   In app/_layout.tsx RootLayout return statement, wrap the tree (AuthProvider/TrainingProvider/RootNavigator) inside a `<SafeAreaProvider>` from "react-native-safe-area-context".
   Do NOT disturb the fonts/SplashScreen logic. The SafeAreaProvider should wrap at the root, below the font-loading gate, but INSIDE RootLayout's return.

2. Apply top safe-area inset to top chrome (both iOS + Android):
   - src/components/Header.tsx: Import `useSafeAreaInsets` from "react-native-safe-area-context". Call it in component. In the header View style, add `paddingTop: insets.top + 10` (so the existing paddingVertical: 10 becomes the visual baseline, and the inset sits above it). The backgroundColor should extend under the status bar (not visible, but prevents jarring color mismatch).
   - src/components/admin/AdminHeader.tsx: Same pattern. Add `useSafeAreaInsets()`, set `paddingTop: insets.top + 10`.

3. Fix auth screens that use hardcoded top padding:
   - app/login.tsx styles.screen: Replace `paddingTop: 30` with `paddingTop: useSafeAreaInsets().top + 16` (a sensible base below the inset).
     BUT useSafeAreaInsets is a hook, so you must wrap login.tsx in a functional component that calls the hook. OR use SafeAreaView edges={["top"]} wrapping the KeyboardAvoidingView (simpler).
     Prefer SafeAreaView edges={["top"]} so the backgroundColor extends under the status bar. Then adjust the remaining visual padding.
   - app/register.tsx styles.screen: Same as login.tsx.
   - app/forgot-password.tsx styles.screen: Same as login.tsx.
   NOTE: These screens already have KeyboardAvoidingView + ScrollView. Wrap KeyboardAvoidingView inside SafeAreaView edges={["top"]} like so:
     <SafeAreaView edges={["top"]} style={...}>
       <KeyboardAvoidingView behavior="padding" style={...}>
         <ScrollView ...>
   The SafeAreaView will add the top inset; the KeyboardAvoidingView/ScrollView stay inside.

4. Apply top inset to form screen:
   - app/(admin)/training/[id].tsx: The navBar (View at line 128+) has `paddingTop: 16, paddingBottom: 12`. Import `useSafeAreaInsets`, call it, and set `paddingTop: insets.top + 16` on the navBar View. (The form screen is NOT inside tabs, so it renders its own nav; apply the inset there too.)

5. Ensure StatusBar style is set (optional but recommended):
   In app/_layout.tsx RootLayout, after the fonts are loaded, render:
   ```
   import { StatusBar } from "expo-status-bar";
   <StatusBar style="dark" />
   ```
   This ensures the status bar icons (clock, battery) are dark (visible on the cream paper background). You can render it anywhere in the layout; the standard place is at the root level or inside RootNavigator.

DEFINITION OF DONE
- No overlap between top chrome (Header, AdminHeader, auth screens, form nav) and the system status bar on Android.
- Correct inset handling on iOS with notch.
- `npx tsc --noEmit` exits with 0 (no type errors).
- `npx eslint app src` reports no new errors on modified files.
- No commit.

Output: produce the code changes to each file. Explain which inset method you chose (useSafeAreaInsets vs SafeAreaView) and why. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect only the listed files, apply the safe-area changes surgically, then run TypeScript and lint checks.
exec
/bin/zsh -lc "sed -n '1,240p' app/_layout.tsx && sed -n '1,220p' src/components/Header.tsx && sed -n '1,220p' src/components/admin/AdminHeader.tsx && sed -n '1,260p' app/login.tsx && sed -n '1,280p' app/register.tsx && sed -n '1,260p' app/forgot-password.tsx && sed -n '1,220p' app/profile.tsx && sed -n '1,300p' 'app/(admin)/training/[id].tsx'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
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

import { Stack, useRouter, useSegments } from "expo-router";

import { AuthProvider } from "@/contexts/AuthContext";
import { TrainingProvider } from "@/contexts/TrainingContext";
import { useAuth } from "@/hooks/useAuth";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, loading, profile } = useAuth();

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
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
  }, [session, loading, profile, segments, router]);

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
    <AuthProvider>
      <TrainingProvider>
        <RootNavigator />
      </TrainingProvider>
    </AuthProvider>
  );
}
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const router = useRouter();
  const { profile } = useAuth();
  const initials = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .map((name) => name?.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Image
          accessibilityIgnoresInvertColors
          source={require("../../assets/images/perun-emblem-burgundy.png")}
          style={styles.emblem}
        />
        <Text style={styles.wordmark}>PERUN</Text>
      </View>

      <Pressable
        accessibilityLabel="Otvori profil"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.push("/profile")}
        style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
      >
        <Text style={styles.initials}>{initials || "P"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: Colors.paper,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: 10,
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  emblem: {
    height: 30,
    resizeMode: "contain",
    width: 30,
  },
  wordmark: {
    ...Typography.wordmark,
    color: Colors.burgundy,
  },
  avatar: {
    ...Shadows.avatar,
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: Radii.avatar,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  initials: {
    color: Colors.surface,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 13.5,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.9,
  },
});
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";

export default function AdminHeader() {
  const router = useRouter();
  const { profile } = useAuth();
  const initials = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .map((name) => name?.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Image source={require("../../../assets/images/perun-emblem-burgundy.png")} style={styles.emblem} />
        <Text style={styles.wordmark}>PERUN</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ADMIN</Text>
        </View>
      </View>
      <Pressable onPress={() => router.push("/profile")} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
        <Text style={styles.initials}>{initials || "A"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.paper,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: 10,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  emblem: { width: 30, height: 30, resizeMode: "contain" },
  wordmark: { ...Typography.wordmark, color: Colors.burgundy },
  badge: {
    backgroundColor: Colors.burgundyTint,
    borderColor: Colors.burgundyBorder,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FontFamilies.hanken[800],
    fontSize: 9,
    fontWeight: "800",
    color: Colors.burgundy,
  },
  avatar: {
    ...Shadows.avatar,
    backgroundColor: Colors.navy,
    width: 38,
    height: 38,
    borderRadius: Radii.avatar,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: Colors.surface,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 13.5,
    fontWeight: "700",
  },
  pressed: { opacity: 0.9 },
});
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      await login(email, password);

      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Image
            accessibilityIgnoresInvertColors
            source={require("../assets/images/perun-emblem-burgundy.png")}
            style={styles.emblem}
          />
        </View>

        <View style={styles.content}>
          <Image
            accessibilityIgnoresInvertColors
            source={require("../assets/images/perun-wordmark-burgundy.png")}
            style={styles.wordmark}
          />

          <View style={styles.fields}>
            <View>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                style={styles.emailInput}
                value={email}
              />
            </View>

            <View>
              <Text style={styles.label}>LOZINKA</Text>
              <View
                style={[
                  styles.passwordField,
                  passwordFocused && styles.passwordFieldFocused,
                ]}
              >
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password"
                  onBlur={() => setPasswordFocused(false)}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  secureTextEntry={!passwordVisible}
                  style={styles.passwordInput}
                  value={password}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text style={styles.showPassword}>
                    {passwordVisible ? "Sakrij" : "Prikaži"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/forgot-password")}
            style={({ pressed }) => [
              styles.forgotPassword,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.link}>Zaboravljena lozinka?</Text>
          </Pressable>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
            disabled={loading}
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.loginButton,
              loading && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Učitavanje…" : "Prijavi se"}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Nemaš nalog? </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/register")}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.joinLink}>Pridruži se</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.paper,
    flex: 1,
    paddingTop: 30,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    alignItems: "center",
    height: 200,
    justifyContent: "center",
  },
  emblem: {
    height: 142,
    resizeMode: "contain",
    width: 142,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.loginHorizontal,
    paddingBottom: Spacing.section.relaxed,
  },
  wordmark: {
    alignSelf: "center",
    height: 95.5,
    marginTop: 26,
    resizeMode: "contain",
    width: 176,
  },
  fields: {
    gap: 13,
    marginTop: 24,
  },
  label: {
    ...Typography.microLabelWide,
    color: Colors.inkFaint,
    marginBottom: 7,
  },
  emailInput: {
    ...Typography.fieldText,
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderRadius: Radii.input,
    borderWidth: 1,
    color: Colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  passwordField: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderRadius: Radii.input,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  passwordFieldFocused: {
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 3,
  },
  passwordInput: {
    ...Typography.fieldText,
    color: Colors.ink,
    flex: 1,
    paddingVertical: 15,
  },
  showPassword: {
    color: Colors.sage,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 12,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 12,
  },
  link: {
    color: Colors.sage,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 13,
    fontWeight: "700",
  },
  error: {
    color: "#C0341B",
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    marginTop: 10,
  },
  loginButton: {
    ...Shadows.primaryButton,
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: Radii.tile[16],
    marginTop: 18,
    paddingVertical: 16,
  },
  loginButtonText: {
    ...Typography.primaryButton,
    color: Colors.surface,
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      await register(email, password, firstName, lastName);

      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Image
            accessibilityIgnoresInvertColors
            source={require("../assets/images/perun-emblem-burgundy.png")}
            style={styles.emblem}
          />
        </View>

        <View style={styles.content}>
          <Image
            accessibilityIgnoresInvertColors
            source={require("../assets/images/perun-wordmark-burgundy.png")}
            style={styles.wordmark}
          />

          <View style={styles.fields}>
            <View>
              <Text style={styles.label}>IME</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setFirstName}
                placeholder=""
                style={styles.input}
                value={firstName}
              />
            </View>

            <View>
              <Text style={styles.label}>PREZIME</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setLastName}
                placeholder=""
                style={styles.input}
                value={lastName}
              />
            </View>

            <View>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder=""
                style={styles.input}
                value={email}
              />
            </View>

            <View>
              <Text style={styles.label}>LOZINKA</Text>
              <View
                style={[
                  styles.passwordField,
                  passwordFocused && styles.passwordFieldFocused,
                ]}
              >
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password"
                  onBlur={() => setPasswordFocused(false)}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  secureTextEntry={!passwordVisible}
                  style={styles.passwordInput}
                  value={password}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text style={styles.showPassword}>
                    {passwordVisible ? "Sakrij" : "Prikaži"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
            disabled={loading}
            onPress={handleRegister}
            style={({ pressed }) => [
              styles.registerButton,
              loading && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.registerButtonText}>
              {loading ? "Učitavanje…" : "Napravi nalog"}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Imaš nalog? </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/login")}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.loginLink}>Prijavi se</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.paper,
    flex: 1,
    paddingTop: 30,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    alignItems: "center",
    height: 200,
    justifyContent: "center",
  },
  emblem: {
    height: 142,
    resizeMode: "contain",
    width: 142,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.loginHorizontal,
    paddingBottom: Spacing.section.relaxed,
  },
  wordmark: {
    alignSelf: "center",
    height: 95.5,
    marginTop: 26,
    resizeMode: "contain",
    width: 176,
  },
  fields: {
    gap: 13,
    marginTop: 24,
  },
  label: {
    ...Typography.microLabelWide,
    color: Colors.inkFaint,
    marginBottom: 7,
  },
  input: {
    ...Typography.fieldText,
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderRadius: Radii.input,
    borderWidth: 1,
    color: Colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  passwordField: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderRadius: Radii.input,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  passwordFieldFocused: {
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 3,
  },
  passwordInput: {
    ...Typography.fieldText,
    color: Colors.ink,
    flex: 1,
    paddingVertical: 15,
  },
  showPassword: {
    color: Colors.sage,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 12,
  },
  error: {
    color: "#C0341B",
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    marginTop: 10,
  },
  registerButton: {
    ...Shadows.primaryButton,
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: Radii.tile[16],
    marginTop: 18,
    paddingVertical: 16,
  },
  registerButtonText: {
    ...Typography.primaryButton,
    color: Colors.surface,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },
  footerText: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[400],
    fontSize: 13.5,
    fontWeight: "400",
  },
  loginLink: {
    color: Colors.burgundy,
    fontFamily: FontFamilies.hanken[700],
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError(null);

      await resetPassword(email);

      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Image
            accessibilityIgnoresInvertColors
            source={require("../assets/images/perun-emblem-burgundy.png")}
            style={styles.emblem}
          />
        </View>

        <View style={styles.content}>
          <Image
            accessibilityIgnoresInvertColors
            source={require("../assets/images/perun-wordmark-burgundy.png")}
            style={styles.wordmark}
          />

          {sent ? (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>Uputstva poslana</Text>
              <Text style={styles.successMessage}>
                Ako nalog postoji, poslali smo uputstva za reset lozinke na tvoju
                email adresu.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.fields}>
                <View>
                  <Text style={styles.label}>EMAIL</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!loading}
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    placeholder=""
                    style={styles.emailInput}
                    value={email}
                  />
                </View>
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: loading }}
                disabled={loading}
                onPress={handleResetPassword}
                style={({ pressed }) => [
                  styles.resetButton,
                  loading && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.resetButtonText}>
                  {loading ? "Učitavanje…" : "Pošalji link za reset"}
                </Text>
              </Pressable>
            </>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/login")}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.backLink}>Nazad na prijavu</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.paper,
    flex: 1,
    paddingTop: 30,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    alignItems: "center",
    height: 200,
    justifyContent: "center",
  },
  emblem: {
    height: 142,
    resizeMode: "contain",
    width: 142,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.loginHorizontal,
    paddingBottom: Spacing.section.relaxed,
  },
  wordmark: {
    alignSelf: "center",
    height: 95.5,
    marginTop: 26,
    resizeMode: "contain",
    width: 176,
  },
  fields: {
    gap: 13,
    marginTop: 24,
  },
  label: {
    ...Typography.microLabelWide,
    color: Colors.inkFaint,
    marginBottom: 7,
  },
  emailInput: {
    ...Typography.fieldText,
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderRadius: Radii.input,
    borderWidth: 1,
    color: Colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  error: {
    color: "#C0341B",
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    marginTop: 10,
  },
  resetButton: {
    ...Shadows.primaryButton,
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: Radii.tile[16],
    marginTop: 18,
    paddingVertical: 16,
  },
  resetButtonText: {
    ...Typography.primaryButton,
    color: Colors.surface,
  },
  successContainer: {
    marginTop: 24,
    paddingHorizontal: 12,
  },
  successTitle: {
    ...Typography.cardTitle,
    color: Colors.ink,
    textAlign: "center",
  },
  successMessage: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[400],
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    marginTop: 12,
    textAlign: "center",
  },
  backLink: {
    color: Colors.sage,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 13,
    fontWeight: "700",
    marginTop: 18,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.92,
  },
});
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/Colors";
import { Day, TRAINING_DAYS } from "@/constants/days";
import { Radii, Shadows } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { clampWeeklyLimit } from "@/utils/limits";
import { getCurrentWeekDates } from "@/utils/week";

const DAY_LABELS: Record<Day, string> = {
  sunday: "NED",
  monday: "PON",
  tuesday: "UTO",
  wednesday: "SRE",
  thursday: "ČET",
  friday: "PET",
  saturday: "SUB",
};

const isTrainingDay = (day: string): day is Day =>
  TRAINING_DAYS.includes(day as Day);

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, profile, session, updateProfile } = useAuth();
  const { bookedCount, trainings } = useTrainings();
  const weekDates = getCurrentWeekDates();
  const max = profile?.max_sessions_per_week ?? 0;
  const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
  const initials = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .map((name) => name?.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");
  const bookedSessions = trainings
    .filter(
      (training) =>
        isTrainingDay(training.day_of_week) &&
        training.session_participants.some(
          (participant) => participant.user_id === session?.user.id,
        ),
    )
    .sort((a, b) => {
      const dayDifference =
        weekDates[a.day_of_week as Day].getTime() -
        weekDates[b.day_of_week as Day].getTime();

      return dayDifference || a.time.localeCompare(b.time);
    });

  const changeLimit = (delta: number) => {
    const newValue = clampWeeklyLimit(max, delta, bookedCount);

    if (newValue !== max) {
      void updateProfile({ max_sessions_per_week: newValue });
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <View style={styles.navBar}>
        <Pressable
          accessibilityLabel="Nazad"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>Profil</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <View style={styles.avatarOutline}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials || "P"}</Text>
            </View>
          </View>
          <Text style={styles.name}>{fullName || "Perun član"}</Text>
          {/* Inferred placeholder: Profile has no created_at field. */}
          <View style={styles.membershipChip}>
            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
          </View>
        </View>

        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.placeholderMarker}>PRIMER</Text>
            <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
            <Text style={styles.statLabel}>treninga ukupno</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.placeholderMarker}>PRIMER</Text>
            <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
            <Text style={styles.statLabel}>nedelja u nizu</Text>
          </View>
        </View>

        <View style={styles.limitCard}>
          <View style={styles.limitHeader}>
            <View style={styles.limitHeaderCopy}>
              <Text style={styles.limitTitle}>Nedeljni limit</Text>
              <Text style={styles.limitSubtitle}>
                Maksimalno treninga po nedelji
              </Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                accessibilityLabel="Smanji nedeljni limit"
                accessibilityRole="button"
                disabled={max <= bookedCount}
                onPress={() => changeLimit(-1)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text
                  style={[
                    styles.stepperButton,
                    max <= bookedCount && styles.disabledStepperButton,
                  ]}
                >
                  −
                </Text>
              </Pressable>
              <Text style={styles.stepperValue}>{max}</Text>
              <Pressable
                accessibilityLabel="Povećaj nedeljni limit"
                accessibilityRole="button"
                disabled={max >= 7}
                onPress={() => changeLimit(1)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text
                  style={[
                    styles.stepperButton,
                    max >= 7 && styles.disabledStepperButton,
                  ]}
                >
                  +
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
            <Text style={styles.usageValue}>
              {bookedCount} / {max}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress}%` }]}>
              <View style={styles.fillHighlight} />
            </View>
          </View>
        </View>

        <Text style={styles.sessionsSectionTitle}>
          MOJI TERMINI OVE NEDELJE
        </Text>
        <View style={styles.sessionsList}>
          {bookedSessions.map((training) => {
            const day = training.day_of_week as Day;
            const dateNumber = String(weekDates[day].getUTCDate()).padStart(
              2,
              "0",
            );

            return (
              <View key={training.id} style={styles.sessionCard}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
                  <Text style={styles.dateNumber}>{dateNumber}</Text>
                </View>
                <View style={styles.sessionDivider} />
                <View style={styles.sessionCopy}>
                  <Text numberOfLines={1} style={styles.sessionTitle}>
                    {training.title}
                  </Text>
                  <Text style={styles.sessionMeta}>
                    {training.time.slice(0, 5)} · SALA A
                  </Text>
                </View>
                <View style={styles.checkBadge}>
                  <Text style={styles.check}>✓</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.logoutContainer}>
          <Pressable
            accessibilityRole="button"
            onPress={logout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.logoutText}>Odjavi se</Text>
          </Pressable>
        </View>
      </ScrollView>
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { FilterChips, Toggle } from "@/components/admin";
import { Colors } from "@/constants/Colors";
import { TRAINING_DAYS } from "@/constants/days";
import type { Day } from "@/constants/days";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useTrainings } from "@/hooks/useTrainings";
import { upsertSession } from "@/services/admin";
import type { UpsertSessionInput } from "@/services/admin";

const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map((day) => ({
  key: day,
  label: {
    monday: "PON",
    tuesday: "UTO",
    wednesday: "SRE",
    thursday: "ČET",
    friday: "PET",
    saturday: "SUB",
    sunday: "NED",
  }[day],
}));

export default function TrainingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { trainings, loading, fetchTrainings } = useTrainings();
  const training = trainings.find((item) => item.id === id);
  const [title, setTitle] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
  const [time, setTime] = useState("");
  const [room, setRoom] = useState("");
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isOpen, setIsOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initializedId, setInitializedId] = useState<string | null>(null);

  useEffect(() => {
    if (!training || initializedId === training.id) return;

    setTitle(training.title);
    setDayOfWeek(
      TRAINING_DAYS.includes(training.day_of_week as Day)
        ? (training.day_of_week as Day)
        : "monday",
    );
    setTime(training.time);
    setRoom(training.room ?? "");
    setDurationMin(training.duration_min);
    setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
    setIsOpen(training.is_open);
    setInitializedId(training.id);
  }, [initializedId, training]);

  const submit = async () => {
    const normalizedTitle = title.trim();
    const normalizedTime = time.trim();

    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
      Alert.alert(
        "Proverite podatke",
        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
      );
      return;
    }

    const input: UpsertSessionInput = {
      id: isNew ? null : id,
      title: normalizedTitle,
      day_of_week: dayOfWeek,
      time: normalizedTime,
      room: room.trim() || null,
      duration_min: durationMin,
      max_participants: maxParticipants,
      is_open: isOpen,
    };

    setSubmitting(true);
    try {
      await upsertSession(input);
      await fetchTrainings();
      router.back();
    } catch (error: unknown) {
      console.error(error);
      Alert.alert("Greška", "Trening nije sačuvan.");
      await fetchTrainings();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isNew && loading && !training) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={Colors.burgundy} />
      </View>
    );
  }

  if (!isNew && !training) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
          <Text style={styles.notFoundButtonText}>Nazad</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.navBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>
          {isNew ? "Novi trening" : "Izmena treninga"}
        </Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            editable={!submitting}
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>DAN</Text>
          <FilterChips
            options={DAY_OPTIONS}
            value={dayOfWeek}
            onChange={setDayOfWeek}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.columnField}>
            <Text style={styles.fieldLabel}>VREME</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="18:00"
              placeholderTextColor={Colors.inkFaint}
              editable={!submitting}
              style={styles.input}
            />
          </View>
          <View style={styles.columnField}>
            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
            <TextInput
              value={durationMin?.toString() ?? ""}
              onChangeText={(value) =>
                setDurationMin(
                  value === "" ? null : Number(value.replace(/\D/g, "")),
                )
              }
              keyboardType="number-pad"
              editable={!submitting}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.columnField}>
            <Text style={styles.fieldLabel}>SALA</Text>
            <TextInput
              value={room}
              onChangeText={setRoom}
              editable={!submitting}
              style={styles.input}
            />
          </View>
          <View style={styles.columnField}>
            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
            <View style={styles.stepper}>
              <Pressable
                disabled={submitting || maxParticipants === 1}
                onPress={() =>
                  setMaxParticipants((value) => Math.max(1, value - 1))
                }
                style={styles.stepButton}
              >
                <Text style={styles.stepButtonText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{maxParticipants}</Text>
              <Pressable
                disabled={submitting || maxParticipants === 50}
                onPress={() =>
                  setMaxParticipants((value) => Math.min(50, value + 1))
                }
                style={styles.stepButton}
              >
                <Text style={styles.stepButtonText}>＋</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusTextBlock}>
            <Text style={styles.statusTitle}>Status slota</Text>
            <Text style={styles.statusDescription}>
              Otvoren za prijave članova
            </Text>
          </View>
          <Toggle
            value={isOpen}
            onValueChange={setIsOpen}
            disabled={submitting}
          />
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={() => router.back()}
            disabled={submitting}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Otkaži</Text>
          </Pressable>
          <Pressable
            onPress={() => void submit()}
            disabled={submitting}
            style={[styles.saveButton, submitting && styles.buttonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: Colors.paper,
  },
  notFoundText: {
    ...Typography.body,
    color: Colors.inkMuted,
  },
  notFoundButton: {
    borderColor: Colors.burgundy,
    borderWidth: 1,
    borderRadius: Radii.tile[12],
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  notFoundButtonText: {
    ...Typography.primaryButtonCompact,
    color: Colors.burgundy,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

exec
/bin/zsh -lc "rg -n 'KeyboardAvoidingView|styles\\.screen|paddingTop|navBar|SafeArea' app/login.tsx app/register.tsx app/forgot-password.tsx 'app/(admin)/training/[id].tsx' app/_layout.tsx src/components/Header.tsx src/components/admin/AdminHeader.tsx && sed -n '1,230p' app/register.tsx && sed -n '1,220p' app/forgot-password.tsx && sed -n '275,350p' 'app/(admin)/training/[id].tsx'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
app/forgot-password.tsx:5:  KeyboardAvoidingView,
app/forgot-password.tsx:44:    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
app/forgot-password.tsx:119:    </KeyboardAvoidingView>
app/forgot-password.tsx:127:    paddingTop: 30,
app/register.tsx:5:  KeyboardAvoidingView,
app/register.tsx:48:    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
app/register.tsx:165:    </KeyboardAvoidingView>
app/register.tsx:173:    paddingTop: 30,
app/login.tsx:5:  KeyboardAvoidingView,
app/login.tsx:46:    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
app/login.tsx:151:    </KeyboardAvoidingView>
app/login.tsx:159:    paddingTop: 30,
app/(admin)/training/[id].tsx:127:    <View style={styles.screen}>
app/(admin)/training/[id].tsx:128:      <View style={styles.navBar}>
app/(admin)/training/[id].tsx:297:  navBar: {
app/(admin)/training/[id].tsx:302:    paddingTop: 16,
app/(admin)/training/[id].tsx:339:    paddingTop: 22,
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      await register(email, password, firstName, lastName);

      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Image
            accessibilityIgnoresInvertColors
            source={require("../assets/images/perun-emblem-burgundy.png")}
            style={styles.emblem}
          />
        </View>

        <View style={styles.content}>
          <Image
            accessibilityIgnoresInvertColors
            source={require("../assets/images/perun-wordmark-burgundy.png")}
            style={styles.wordmark}
          />

          <View style={styles.fields}>
            <View>
              <Text style={styles.label}>IME</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setFirstName}
                placeholder=""
                style={styles.input}
                value={firstName}
              />
            </View>

            <View>
              <Text style={styles.label}>PREZIME</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setLastName}
                placeholder=""
                style={styles.input}
                value={lastName}
              />
            </View>

            <View>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder=""
                style={styles.input}
                value={email}
              />
            </View>

            <View>
              <Text style={styles.label}>LOZINKA</Text>
              <View
                style={[
                  styles.passwordField,
                  passwordFocused && styles.passwordFieldFocused,
                ]}
              >
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password"
                  onBlur={() => setPasswordFocused(false)}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  secureTextEntry={!passwordVisible}
                  style={styles.passwordInput}
                  value={password}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text style={styles.showPassword}>
                    {passwordVisible ? "Sakrij" : "Prikaži"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
            disabled={loading}
            onPress={handleRegister}
            style={({ pressed }) => [
              styles.registerButton,
              loading && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.registerButtonText}>
              {loading ? "Učitavanje…" : "Napravi nalog"}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Imaš nalog? </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/login")}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.loginLink}>Prijavi se</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.paper,
    flex: 1,
    paddingTop: 30,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    alignItems: "center",
    height: 200,
    justifyContent: "center",
  },
  emblem: {
    height: 142,
    resizeMode: "contain",
    width: 142,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.loginHorizontal,
    paddingBottom: Spacing.section.relaxed,
  },
  wordmark: {
    alignSelf: "center",
    height: 95.5,
    marginTop: 26,
    resizeMode: "contain",
    width: 176,
  },
  fields: {
    gap: 13,
    marginTop: 24,
  },
  label: {
    ...Typography.microLabelWide,
    color: Colors.inkFaint,
    marginBottom: 7,
  },
  input: {
    ...Typography.fieldText,
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderRadius: Radii.input,
    borderWidth: 1,
    color: Colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  passwordField: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderRadius: Radii.input,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  passwordFieldFocused: {
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError(null);

      await resetPassword(email);

      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Image
            accessibilityIgnoresInvertColors
            source={require("../assets/images/perun-emblem-burgundy.png")}
            style={styles.emblem}
          />
        </View>

        <View style={styles.content}>
          <Image
            accessibilityIgnoresInvertColors
            source={require("../assets/images/perun-wordmark-burgundy.png")}
            style={styles.wordmark}
          />

          {sent ? (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>Uputstva poslana</Text>
              <Text style={styles.successMessage}>
                Ako nalog postoji, poslali smo uputstva za reset lozinke na tvoju
                email adresu.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.fields}>
                <View>
                  <Text style={styles.label}>EMAIL</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!loading}
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    placeholder=""
                    style={styles.emailInput}
                    value={email}
                  />
                </View>
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: loading }}
                disabled={loading}
                onPress={handleResetPassword}
                style={({ pressed }) => [
                  styles.resetButton,
                  loading && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.resetButtonText}>
                  {loading ? "Učitavanje…" : "Pošalji link za reset"}
                </Text>
              </Pressable>
            </>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/login")}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.backLink}>Nazad na prijavu</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.paper,
    flex: 1,
    paddingTop: 30,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    alignItems: "center",
    height: 200,
    justifyContent: "center",
  },
  emblem: {
    height: 142,
    resizeMode: "contain",
    width: 142,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.loginHorizontal,
    paddingBottom: Spacing.section.relaxed,
  },
  wordmark: {
    alignSelf: "center",
    height: 95.5,
    marginTop: 26,
    resizeMode: "contain",
    width: 176,
  },
  fields: {
    gap: 13,
    marginTop: 24,
  },
  label: {
    ...Typography.microLabelWide,
    color: Colors.inkFaint,
    marginBottom: 7,
  },
  emailInput: {
    ...Typography.fieldText,
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderRadius: Radii.input,
    borderWidth: 1,
    color: Colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  error: {
    color: "#C0341B",
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    marginTop: 10,
  },
  resetButton: {
    ...Shadows.primaryButton,
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: Radii.tile[16],
    marginTop: 18,
    paddingVertical: 16,
  },
  resetButtonText: {
    ...Typography.primaryButton,
    color: Colors.surface,
  },
  successContainer: {
    marginTop: 24,
    paddingHorizontal: 12,
  },
  successTitle: {
    ...Typography.cardTitle,
    color: Colors.ink,
    textAlign: "center",
  },
  successMessage: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[400],
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    marginTop: 12,
    textAlign: "center",
  },
  backLink: {
    color: Colors.sage,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 13,
    fontWeight: "700",
    marginTop: 18,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: Colors.paper,
  },
  notFoundText: {
    ...Typography.body,
    color: Colors.inkMuted,
  },
  notFoundButton: {
    borderColor: Colors.burgundy,
    borderWidth: 1,
    borderRadius: Radii.tile[12],
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  notFoundButtonText: {
    ...Typography.primaryButtonCompact,
    color: Colors.burgundy,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[12],
    backgroundColor: Colors.surface,
  },
  backChevron: {
    fontFamily: FontFamilies.hanken[500],
    fontSize: 31,
    fontWeight: "500",
    lineHeight: 32,
    color: Colors.burgundy,
  },
  navTitle: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 19,
    fontWeight: "800",
    color: Colors.ink,
  },
  navSpacer: {
    width: 38,
    height: 38,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 22,
    paddingBottom: 28,
    gap: 20,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
  },
  columnField: {

codex
The auth screens will use `SafeAreaView` for the system inset and retain a 16-point visual top gap inside the keyboard-avoiding content. Headers and the standalone form nav need numeric inset composition, so those use `useSafeAreaInsets`.
apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/training/[id].tsx
/Users/uros/Documents/Private/Projects/PerunApp/app/_layout.tsx
/Users/uros/Documents/Private/Projects/PerunApp/app/forgot-password.tsx
/Users/uros/Documents/Private/Projects/PerunApp/app/login.tsx
/Users/uros/Documents/Private/Projects/PerunApp/app/register.tsx
/Users/uros/Documents/Private/Projects/PerunApp/src/components/Header.tsx
/Users/uros/Documents/Private/Projects/PerunApp/src/components/admin/AdminHeader.tsx
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 388b015c56c399a15805fd1f85899697fef3dee9..63f74934074ec361d3383d1bebe96ac5e5d71acb
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -10,6 +10,7 @@
   View,
 } from "react-native";
 import { useLocalSearchParams, useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
@@ -36,6 +37,7 @@
 
 export default function TrainingDetailScreen() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { id } = useLocalSearchParams<{ id: string }>();
   const isNew = id === "new";
   const { trainings, loading, fetchTrainings } = useTrainings();
@@ -125,7 +127,7 @@
 
   return (
     <View style={styles.screen}>
-      <View style={styles.navBar}>
+      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
         <Pressable
           accessibilityRole="button"
           onPress={() => router.back()}
diff --git a/app/_layout.tsx b/app/_layout.tsx
index 0baec49fcdcb74d36ae4c78abb34724f4f67de2f..f3f5f840fdc5cfa8284cb499c446f0c03e3771ac
--- a/app/_layout.tsx
+++ b/app/_layout.tsx
@@ -15,6 +15,8 @@
 } from "@expo-google-fonts/hanken-grotesk";
 
 import { Stack, useRouter, useSegments } from "expo-router";
+import { StatusBar } from "expo-status-bar";
+import { SafeAreaProvider } from "react-native-safe-area-context";
 
 import { AuthProvider } from "@/contexts/AuthContext";
 import { TrainingProvider } from "@/contexts/TrainingContext";
@@ -121,10 +123,13 @@
   }
 
   return (
-    <AuthProvider>
-      <TrainingProvider>
-        <RootNavigator />
-      </TrainingProvider>
-    </AuthProvider>
+    <SafeAreaProvider>
+      <StatusBar style="dark" />
+      <AuthProvider>
+        <TrainingProvider>
+          <RootNavigator />
+        </TrainingProvider>
+      </AuthProvider>
+    </SafeAreaProvider>
   );
 }
diff --git a/app/forgot-password.tsx b/app/forgot-password.tsx
index 7734a88167506d1024ab2be67f958abf23cd33d9..0dd0d668c445376ef29bc58b3487f5acbee2ac6c
--- a/app/forgot-password.tsx
+++ b/app/forgot-password.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -41,11 +42,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -115,16 +117,20 @@
             <Text style={styles.backLink}>Nazad na prijavu</Text>
           </Pressable>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/login.tsx b/app/login.tsx
index e16020ead53ade22b107dd7daaa1af462effc3e2..40b30317a15947b3efc43c79cfd321c0f0deaa39
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -43,11 +44,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -147,16 +149,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/register.tsx b/app/register.tsx
index cf6103746240334f3879ea9af64702cdac2d28e0..d94c677f5871de50ce6c25a667929349bd98aea2
--- a/app/register.tsx
+++ b/app/register.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -45,11 +46,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -161,16 +163,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/src/components/Header.tsx b/src/components/Header.tsx
index 07321482e3df747b35ca47f22a9981d2dff46465..c6bdb6eb2a47bc3fc4ba5588d6c54ea1cd108d7e
--- a/src/components/Header.tsx
+++ b/src/components/Header.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -8,6 +9,7 @@
 
 export default function Header() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -17,7 +19,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image
           accessibilityIgnoresInvertColors
diff --git a/src/components/admin/AdminHeader.tsx b/src/components/admin/AdminHeader.tsx
index 9972950eb5a3ffda1db65b6d32b413568fb677d1..f747014f4234d7703997cfc15b264b875ca4595f
--- a/src/components/admin/AdminHeader.tsx
+++ b/src/components/admin/AdminHeader.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 import { useAuth } from "@/hooks/useAuth";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -7,6 +8,7 @@
 
 export default function AdminHeader() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -16,7 +18,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image source={require("../../../assets/images/perun-emblem-burgundy.png")} style={styles.emblem} />
         <Text style={styles.wordmark}>PERUN</Text>

diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 388b015c56c399a15805fd1f85899697fef3dee9..63f74934074ec361d3383d1bebe96ac5e5d71acb
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -10,6 +10,7 @@
   View,
 } from "react-native";
 import { useLocalSearchParams, useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
@@ -36,6 +37,7 @@
 
 export default function TrainingDetailScreen() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { id } = useLocalSearchParams<{ id: string }>();
   const isNew = id === "new";
   const { trainings, loading, fetchTrainings } = useTrainings();
@@ -125,7 +127,7 @@
 
   return (
     <View style={styles.screen}>
-      <View style={styles.navBar}>
+      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
         <Pressable
           accessibilityRole="button"
           onPress={() => router.back()}
diff --git a/app/_layout.tsx b/app/_layout.tsx
index 0baec49fcdcb74d36ae4c78abb34724f4f67de2f..f3f5f840fdc5cfa8284cb499c446f0c03e3771ac
--- a/app/_layout.tsx
+++ b/app/_layout.tsx
@@ -15,6 +15,8 @@
 } from "@expo-google-fonts/hanken-grotesk";
 
 import { Stack, useRouter, useSegments } from "expo-router";
+import { StatusBar } from "expo-status-bar";
+import { SafeAreaProvider } from "react-native-safe-area-context";
 
 import { AuthProvider } from "@/contexts/AuthContext";
 import { TrainingProvider } from "@/contexts/TrainingContext";
@@ -121,10 +123,13 @@
   }
 
   return (
-    <AuthProvider>
-      <TrainingProvider>
-        <RootNavigator />
-      </TrainingProvider>
-    </AuthProvider>
+    <SafeAreaProvider>
+      <StatusBar style="dark" />
+      <AuthProvider>
+        <TrainingProvider>
+          <RootNavigator />
+        </TrainingProvider>
+      </AuthProvider>
+    </SafeAreaProvider>
   );
 }
diff --git a/app/forgot-password.tsx b/app/forgot-password.tsx
index 7734a88167506d1024ab2be67f958abf23cd33d9..0dd0d668c445376ef29bc58b3487f5acbee2ac6c
--- a/app/forgot-password.tsx
+++ b/app/forgot-password.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -41,11 +42,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -115,16 +117,20 @@
             <Text style={styles.backLink}>Nazad na prijavu</Text>
           </Pressable>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/login.tsx b/app/login.tsx
index e16020ead53ade22b107dd7daaa1af462effc3e2..40b30317a15947b3efc43c79cfd321c0f0deaa39
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -43,11 +44,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -147,16 +149,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/register.tsx b/app/register.tsx
index cf6103746240334f3879ea9af64702cdac2d28e0..d94c677f5871de50ce6c25a667929349bd98aea2
--- a/app/register.tsx
+++ b/app/register.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -45,11 +46,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -161,16 +163,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/src/components/Header.tsx b/src/components/Header.tsx
index 07321482e3df747b35ca47f22a9981d2dff46465..c6bdb6eb2a47bc3fc4ba5588d6c54ea1cd108d7e
--- a/src/components/Header.tsx
+++ b/src/components/Header.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -8,6 +9,7 @@
 
 export default function Header() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -17,7 +19,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image
           accessibilityIgnoresInvertColors
diff --git a/src/components/admin/AdminHeader.tsx b/src/components/admin/AdminHeader.tsx
index 9972950eb5a3ffda1db65b6d32b413568fb677d1..f747014f4234d7703997cfc15b264b875ca4595f
--- a/src/components/admin/AdminHeader.tsx
+++ b/src/components/admin/AdminHeader.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 import { useAuth } from "@/hooks/useAuth";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -7,6 +8,7 @@
 
 export default function AdminHeader() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -16,7 +18,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image source={require("../../../assets/images/perun-emblem-burgundy.png")} style={styles.emblem} />
         <Text style={styles.wordmark}>PERUN</Text>

exec
/bin/zsh -lc "git diff -- app/_layout.tsx src/components/Header.tsx src/components/admin/AdminHeader.tsx app/login.tsx app/register.tsx app/forgot-password.tsx 'app/(admin)/training/[id].tsx'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 388b015..63f7493 100644
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -10,6 +10,7 @@ import {
   View,
 } from "react-native";
 import { useLocalSearchParams, useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
@@ -36,6 +37,7 @@ const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map((day) => ({
 
 export default function TrainingDetailScreen() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { id } = useLocalSearchParams<{ id: string }>();
   const isNew = id === "new";
   const { trainings, loading, fetchTrainings } = useTrainings();
@@ -125,7 +127,7 @@ export default function TrainingDetailScreen() {
 
   return (
     <View style={styles.screen}>
-      <View style={styles.navBar}>
+      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
         <Pressable
           accessibilityRole="button"
           onPress={() => router.back()}
diff --git a/app/_layout.tsx b/app/_layout.tsx
index 0baec49..f3f5f84 100644
--- a/app/_layout.tsx
+++ b/app/_layout.tsx
@@ -15,6 +15,8 @@ import {
 } from "@expo-google-fonts/hanken-grotesk";
 
 import { Stack, useRouter, useSegments } from "expo-router";
+import { StatusBar } from "expo-status-bar";
+import { SafeAreaProvider } from "react-native-safe-area-context";
 
 import { AuthProvider } from "@/contexts/AuthContext";
 import { TrainingProvider } from "@/contexts/TrainingContext";
@@ -121,10 +123,13 @@ export default function RootLayout() {
   }
 
   return (
-    <AuthProvider>
-      <TrainingProvider>
-        <RootNavigator />
-      </TrainingProvider>
-    </AuthProvider>
+    <SafeAreaProvider>
+      <StatusBar style="dark" />
+      <AuthProvider>
+        <TrainingProvider>
+          <RootNavigator />
+        </TrainingProvider>
+      </AuthProvider>
+    </SafeAreaProvider>
   );
 }
diff --git a/app/forgot-password.tsx b/app/forgot-password.tsx
index 7734a88..0dd0d66 100644
--- a/app/forgot-password.tsx
+++ b/app/forgot-password.tsx
@@ -10,6 +10,7 @@ import {
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -41,11 +42,12 @@ export default function ForgotPasswordScreen() {
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -115,16 +117,20 @@ export default function ForgotPasswordScreen() {
             <Text style={styles.backLink}>Nazad na prijavu</Text>
           </Pressable>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
-  screen: {
+  safeArea: {
     backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+  },
+  screen: {
+    flex: 1,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/login.tsx b/app/login.tsx
index e16020e..40b3031 100644
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -10,6 +10,7 @@ import {
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -43,11 +44,12 @@ export default function LoginScreen() {
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -147,16 +149,20 @@ export default function LoginScreen() {
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
-  screen: {
+  safeArea: {
     backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+  },
+  screen: {
+    flex: 1,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/register.tsx b/app/register.tsx
index cf61037..d94c677 100644
--- a/app/register.tsx
+++ b/app/register.tsx
@@ -10,6 +10,7 @@ import {
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -45,11 +46,12 @@ export default function RegisterScreen() {
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -161,16 +163,20 @@ export default function RegisterScreen() {
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
-  screen: {
+  safeArea: {
     backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+  },
+  screen: {
+    flex: 1,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/src/components/Header.tsx b/src/components/Header.tsx
index 0732148..c6bdb6e 100644
--- a/src/components/Header.tsx
+++ b/src/components/Header.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -8,6 +9,7 @@ import { useAuth } from "@/hooks/useAuth";
 
 export default function Header() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -17,7 +19,7 @@ export default function Header() {
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image
           accessibilityIgnoresInvertColors
diff --git a/src/components/admin/AdminHeader.tsx b/src/components/admin/AdminHeader.tsx
index 9972950..f747014 100644
--- a/src/components/admin/AdminHeader.tsx
+++ b/src/components/admin/AdminHeader.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 import { useAuth } from "@/hooks/useAuth";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -7,6 +8,7 @@ import { FontFamilies, Typography } from "@/constants/typography";
 
 export default function AdminHeader() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -16,7 +18,7 @@ export default function AdminHeader() {
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image source={require("../../../assets/images/perun-emblem-burgundy.png")} style={styles.emblem} />
         <Text style={styles.wordmark}>PERUN</Text>

diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 388b015c56c399a15805fd1f85899697fef3dee9..63f74934074ec361d3383d1bebe96ac5e5d71acb
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -10,6 +10,7 @@
   View,
 } from "react-native";
 import { useLocalSearchParams, useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
@@ -36,6 +37,7 @@
 
 export default function TrainingDetailScreen() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { id } = useLocalSearchParams<{ id: string }>();
   const isNew = id === "new";
   const { trainings, loading, fetchTrainings } = useTrainings();
@@ -125,7 +127,7 @@
 
   return (
     <View style={styles.screen}>
-      <View style={styles.navBar}>
+      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
         <Pressable
           accessibilityRole="button"
           onPress={() => router.back()}
diff --git a/app/_layout.tsx b/app/_layout.tsx
index 0baec49fcdcb74d36ae4c78abb34724f4f67de2f..f3f5f840fdc5cfa8284cb499c446f0c03e3771ac
--- a/app/_layout.tsx
+++ b/app/_layout.tsx
@@ -15,6 +15,8 @@
 } from "@expo-google-fonts/hanken-grotesk";
 
 import { Stack, useRouter, useSegments } from "expo-router";
+import { StatusBar } from "expo-status-bar";
+import { SafeAreaProvider } from "react-native-safe-area-context";
 
 import { AuthProvider } from "@/contexts/AuthContext";
 import { TrainingProvider } from "@/contexts/TrainingContext";
@@ -121,10 +123,13 @@
   }
 
   return (
-    <AuthProvider>
-      <TrainingProvider>
-        <RootNavigator />
-      </TrainingProvider>
-    </AuthProvider>
+    <SafeAreaProvider>
+      <StatusBar style="dark" />
+      <AuthProvider>
+        <TrainingProvider>
+          <RootNavigator />
+        </TrainingProvider>
+      </AuthProvider>
+    </SafeAreaProvider>
   );
 }
diff --git a/app/forgot-password.tsx b/app/forgot-password.tsx
index 7734a88167506d1024ab2be67f958abf23cd33d9..0dd0d668c445376ef29bc58b3487f5acbee2ac6c
--- a/app/forgot-password.tsx
+++ b/app/forgot-password.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -41,11 +42,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -115,16 +117,20 @@
             <Text style={styles.backLink}>Nazad na prijavu</Text>
           </Pressable>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/login.tsx b/app/login.tsx
index e16020ead53ade22b107dd7daaa1af462effc3e2..40b30317a15947b3efc43c79cfd321c0f0deaa39
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -43,11 +44,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -147,16 +149,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/register.tsx b/app/register.tsx
index cf6103746240334f3879ea9af64702cdac2d28e0..d94c677f5871de50ce6c25a667929349bd98aea2
--- a/app/register.tsx
+++ b/app/register.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -45,11 +46,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -161,16 +163,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/src/components/Header.tsx b/src/components/Header.tsx
index 07321482e3df747b35ca47f22a9981d2dff46465..c6bdb6eb2a47bc3fc4ba5588d6c54ea1cd108d7e
--- a/src/components/Header.tsx
+++ b/src/components/Header.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -8,6 +9,7 @@
 
 export default function Header() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -17,7 +19,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image
           accessibilityIgnoresInvertColors
diff --git a/src/components/admin/AdminHeader.tsx b/src/components/admin/AdminHeader.tsx
index 9972950eb5a3ffda1db65b6d32b413568fb677d1..f747014f4234d7703997cfc15b264b875ca4595f
--- a/src/components/admin/AdminHeader.tsx
+++ b/src/components/admin/AdminHeader.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 import { useAuth } from "@/hooks/useAuth";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -7,6 +8,7 @@
 
 export default function AdminHeader() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -16,7 +18,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image source={require("../../../assets/images/perun-emblem-burgundy.png")} style={styles.emblem} />
         <Text style={styles.wordmark}>PERUN</Text>

exec
/bin/zsh -lc "cat package.json && (ls -a | rg 'prettier|eslint' || true)" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
{
  "name": "peruntreningcentar",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "jest": {
    "preset": "jest-expo"
  },
  "dependencies": {
    "@expo-google-fonts/bricolage-grotesque": "^0.4.1",
    "@expo-google-fonts/hanken-grotesk": "^0.4.3",
    "@expo/vector-icons": "^15.0.3",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-navigation/native": "^7.1.8",
    "@supabase/supabase-js": "^2.106.2",
    "expo": "~54.0.33",
    "expo-constants": "~18.0.13",
    "expo-font": "~14.0.11",
    "expo-linking": "~8.0.11",
    "expo-router": "~6.0.23",
    "expo-splash-screen": "~31.0.13",
    "expo-status-bar": "~3.0.9",
    "expo-web-browser": "~15.0.10",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-url-polyfill": "^3.0.0",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.5.1"
  },
  "devDependencies": {
    "@testing-library/react-native": "^13.3.3",
    "@types/jest": "^30.0.0",
    "@types/react": "~19.1.0",
    "eslint": "^9.39.4",
    "eslint-config-expo": "~10.0.0",
    "eslint-config-prettier": "^10.1.8",
    "jest-expo": "~54.0.17",
    "prettier": "^3.8.5",
    "react-test-renderer": "19.1.0",
    "typescript": "~5.9.2"
  },
  "private": true
}
.prettierrc
eslint.config.js

diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 388b015c56c399a15805fd1f85899697fef3dee9..63f74934074ec361d3383d1bebe96ac5e5d71acb
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -10,6 +10,7 @@
   View,
 } from "react-native";
 import { useLocalSearchParams, useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
@@ -36,6 +37,7 @@
 
 export default function TrainingDetailScreen() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { id } = useLocalSearchParams<{ id: string }>();
   const isNew = id === "new";
   const { trainings, loading, fetchTrainings } = useTrainings();
@@ -125,7 +127,7 @@
 
   return (
     <View style={styles.screen}>
-      <View style={styles.navBar}>
+      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
         <Pressable
           accessibilityRole="button"
           onPress={() => router.back()}
diff --git a/app/_layout.tsx b/app/_layout.tsx
index 0baec49fcdcb74d36ae4c78abb34724f4f67de2f..f3f5f840fdc5cfa8284cb499c446f0c03e3771ac
--- a/app/_layout.tsx
+++ b/app/_layout.tsx
@@ -15,6 +15,8 @@
 } from "@expo-google-fonts/hanken-grotesk";
 
 import { Stack, useRouter, useSegments } from "expo-router";
+import { StatusBar } from "expo-status-bar";
+import { SafeAreaProvider } from "react-native-safe-area-context";
 
 import { AuthProvider } from "@/contexts/AuthContext";
 import { TrainingProvider } from "@/contexts/TrainingContext";
@@ -121,10 +123,13 @@
   }
 
   return (
-    <AuthProvider>
-      <TrainingProvider>
-        <RootNavigator />
-      </TrainingProvider>
-    </AuthProvider>
+    <SafeAreaProvider>
+      <StatusBar style="dark" />
+      <AuthProvider>
+        <TrainingProvider>
+          <RootNavigator />
+        </TrainingProvider>
+      </AuthProvider>
+    </SafeAreaProvider>
   );
 }
diff --git a/app/forgot-password.tsx b/app/forgot-password.tsx
index 7734a88167506d1024ab2be67f958abf23cd33d9..0dd0d668c445376ef29bc58b3487f5acbee2ac6c
--- a/app/forgot-password.tsx
+++ b/app/forgot-password.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -41,11 +42,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -115,16 +117,20 @@
             <Text style={styles.backLink}>Nazad na prijavu</Text>
           </Pressable>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/login.tsx b/app/login.tsx
index e16020ead53ade22b107dd7daaa1af462effc3e2..40b30317a15947b3efc43c79cfd321c0f0deaa39
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -43,11 +44,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -147,16 +149,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/register.tsx b/app/register.tsx
index cf6103746240334f3879ea9af64702cdac2d28e0..d94c677f5871de50ce6c25a667929349bd98aea2
--- a/app/register.tsx
+++ b/app/register.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -45,11 +46,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -161,16 +163,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/src/components/Header.tsx b/src/components/Header.tsx
index 07321482e3df747b35ca47f22a9981d2dff46465..c6bdb6eb2a47bc3fc4ba5588d6c54ea1cd108d7e
--- a/src/components/Header.tsx
+++ b/src/components/Header.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -8,6 +9,7 @@
 
 export default function Header() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -17,7 +19,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image
           accessibilityIgnoresInvertColors
diff --git a/src/components/admin/AdminHeader.tsx b/src/components/admin/AdminHeader.tsx
index 9972950eb5a3ffda1db65b6d32b413568fb677d1..f747014f4234d7703997cfc15b264b875ca4595f
--- a/src/components/admin/AdminHeader.tsx
+++ b/src/components/admin/AdminHeader.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 import { useAuth } from "@/hooks/useAuth";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -7,6 +8,7 @@
 
 export default function AdminHeader() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -16,7 +18,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image source={require("../../../assets/images/perun-emblem-burgundy.png")} style={styles.emblem} />
         <Text style={styles.wordmark}>PERUN</Text>

exec
/bin/zsh -lc 'npx prettier --write app/login.tsx app/register.tsx app/forgot-password.tsx' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 388b015c56c399a15805fd1f85899697fef3dee9..63f74934074ec361d3383d1bebe96ac5e5d71acb
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -10,6 +10,7 @@
   View,
 } from "react-native";
 import { useLocalSearchParams, useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
@@ -36,6 +37,7 @@
 
 export default function TrainingDetailScreen() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { id } = useLocalSearchParams<{ id: string }>();
   const isNew = id === "new";
   const { trainings, loading, fetchTrainings } = useTrainings();
@@ -125,7 +127,7 @@
 
   return (
     <View style={styles.screen}>
-      <View style={styles.navBar}>
+      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
         <Pressable
           accessibilityRole="button"
           onPress={() => router.back()}
diff --git a/app/_layout.tsx b/app/_layout.tsx
index 0baec49fcdcb74d36ae4c78abb34724f4f67de2f..f3f5f840fdc5cfa8284cb499c446f0c03e3771ac
--- a/app/_layout.tsx
+++ b/app/_layout.tsx
@@ -15,6 +15,8 @@
 } from "@expo-google-fonts/hanken-grotesk";
 
 import { Stack, useRouter, useSegments } from "expo-router";
+import { StatusBar } from "expo-status-bar";
+import { SafeAreaProvider } from "react-native-safe-area-context";
 
 import { AuthProvider } from "@/contexts/AuthContext";
 import { TrainingProvider } from "@/contexts/TrainingContext";
@@ -121,10 +123,13 @@
   }
 
   return (
-    <AuthProvider>
-      <TrainingProvider>
-        <RootNavigator />
-      </TrainingProvider>
-    </AuthProvider>
+    <SafeAreaProvider>
+      <StatusBar style="dark" />
+      <AuthProvider>
+        <TrainingProvider>
+          <RootNavigator />
+        </TrainingProvider>
+      </AuthProvider>
+    </SafeAreaProvider>
   );
 }
diff --git a/app/forgot-password.tsx b/app/forgot-password.tsx
index 7734a88167506d1024ab2be67f958abf23cd33d9..0dd0d668c445376ef29bc58b3487f5acbee2ac6c
--- a/app/forgot-password.tsx
+++ b/app/forgot-password.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -41,11 +42,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -115,16 +117,20 @@
             <Text style={styles.backLink}>Nazad na prijavu</Text>
           </Pressable>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/login.tsx b/app/login.tsx
index e16020ead53ade22b107dd7daaa1af462effc3e2..40b30317a15947b3efc43c79cfd321c0f0deaa39
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -43,11 +44,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -147,16 +149,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/register.tsx b/app/register.tsx
index cf6103746240334f3879ea9af64702cdac2d28e0..d94c677f5871de50ce6c25a667929349bd98aea2
--- a/app/register.tsx
+++ b/app/register.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -45,11 +46,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -161,16 +163,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/src/components/Header.tsx b/src/components/Header.tsx
index 07321482e3df747b35ca47f22a9981d2dff46465..c6bdb6eb2a47bc3fc4ba5588d6c54ea1cd108d7e
--- a/src/components/Header.tsx
+++ b/src/components/Header.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -8,6 +9,7 @@
 
 export default function Header() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -17,7 +19,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image
           accessibilityIgnoresInvertColors
diff --git a/src/components/admin/AdminHeader.tsx b/src/components/admin/AdminHeader.tsx
index 9972950eb5a3ffda1db65b6d32b413568fb677d1..f747014f4234d7703997cfc15b264b875ca4595f
--- a/src/components/admin/AdminHeader.tsx
+++ b/src/components/admin/AdminHeader.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 import { useAuth } from "@/hooks/useAuth";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -7,6 +8,7 @@
 
 export default function AdminHeader() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -16,7 +18,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image source={require("../../../assets/images/perun-emblem-burgundy.png")} style={styles.emblem} />
         <Text style={styles.wordmark}>PERUN</Text>

 succeeded in 560ms:
app/login.tsx 57ms
app/register.tsx 17ms
app/forgot-password.tsx 11ms

codex
The requested files are patched. I’m running the exact TypeScript and ESLint checks now; if the repository has pre-existing lint findings, I’ll distinguish those from modified-file results.
exec
/bin/zsh -lc 'npx eslint app src' in /Users/uros/Documents/Private/Projects/PerunApp
exec
/bin/zsh -lc 'npx tsc --noEmit' in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 2663ms:
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 388b015c56c399a15805fd1f85899697fef3dee9..63f74934074ec361d3383d1bebe96ac5e5d71acb
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -10,6 +10,7 @@
   View,
 } from "react-native";
 import { useLocalSearchParams, useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
@@ -36,6 +37,7 @@
 
 export default function TrainingDetailScreen() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { id } = useLocalSearchParams<{ id: string }>();
   const isNew = id === "new";
   const { trainings, loading, fetchTrainings } = useTrainings();
@@ -125,7 +127,7 @@
 
   return (
     <View style={styles.screen}>
-      <View style={styles.navBar}>
+      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
         <Pressable
           accessibilityRole="button"
           onPress={() => router.back()}
diff --git a/app/_layout.tsx b/app/_layout.tsx
index 0baec49fcdcb74d36ae4c78abb34724f4f67de2f..f3f5f840fdc5cfa8284cb499c446f0c03e3771ac
--- a/app/_layout.tsx
+++ b/app/_layout.tsx
@@ -15,6 +15,8 @@
 } from "@expo-google-fonts/hanken-grotesk";
 
 import { Stack, useRouter, useSegments } from "expo-router";
+import { StatusBar } from "expo-status-bar";
+import { SafeAreaProvider } from "react-native-safe-area-context";
 
 import { AuthProvider } from "@/contexts/AuthContext";
 import { TrainingProvider } from "@/contexts/TrainingContext";
@@ -121,10 +123,13 @@
   }
 
   return (
-    <AuthProvider>
-      <TrainingProvider>
-        <RootNavigator />
-      </TrainingProvider>
-    </AuthProvider>
+    <SafeAreaProvider>
+      <StatusBar style="dark" />
+      <AuthProvider>
+        <TrainingProvider>
+          <RootNavigator />
+        </TrainingProvider>
+      </AuthProvider>
+    </SafeAreaProvider>
   );
 }
diff --git a/app/forgot-password.tsx b/app/forgot-password.tsx
index 7734a88167506d1024ab2be67f958abf23cd33d9..0dd0d668c445376ef29bc58b3487f5acbee2ac6c
--- a/app/forgot-password.tsx
+++ b/app/forgot-password.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -41,11 +42,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -115,16 +117,20 @@
             <Text style={styles.backLink}>Nazad na prijavu</Text>
           </Pressable>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/login.tsx b/app/login.tsx
index e16020ead53ade22b107dd7daaa1af462effc3e2..40b30317a15947b3efc43c79cfd321c0f0deaa39
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -43,11 +44,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -147,16 +149,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/register.tsx b/app/register.tsx
index cf6103746240334f3879ea9af64702cdac2d28e0..d94c677f5871de50ce6c25a667929349bd98aea2
--- a/app/register.tsx
+++ b/app/register.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -45,11 +46,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -161,16 +163,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/src/components/Header.tsx b/src/components/Header.tsx
index 07321482e3df747b35ca47f22a9981d2dff46465..c6bdb6eb2a47bc3fc4ba5588d6c54ea1cd108d7e
--- a/src/components/Header.tsx
+++ b/src/components/Header.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -8,6 +9,7 @@
 
 export default function Header() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -17,7 +19,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image
           accessibilityIgnoresInvertColors
diff --git a/src/components/admin/AdminHeader.tsx b/src/components/admin/AdminHeader.tsx
index 9972950eb5a3ffda1db65b6d32b413568fb677d1..f747014f4234d7703997cfc15b264b875ca4595f
--- a/src/components/admin/AdminHeader.tsx
+++ b/src/components/admin/AdminHeader.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 import { useAuth } from "@/hooks/useAuth";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -7,6 +8,7 @@
 
 export default function AdminHeader() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -16,7 +18,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image source={require("../../../assets/images/perun-emblem-burgundy.png")} style={styles.emblem} />
         <Text style={styles.wordmark}>PERUN</Text>

 succeeded in 2851ms:
exec
/bin/zsh -lc "git status --short && git diff --check && git diff --stat && git diff -- app/_layout.tsx src/components/Header.tsx src/components/admin/AdminHeader.tsx app/login.tsx app/register.tsx app/forgot-password.tsx 'app/(admin)/training/[id].tsx'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
 M app/(admin)/training/[id].tsx
 M app/_layout.tsx
 M app/forgot-password.tsx
 M app/login.tsx
 M app/register.tsx
 M src/components/Header.tsx
 M src/components/admin/AdminHeader.tsx
?? .tmnt/runs/C2-mikey.md
 app/(admin)/training/[id].tsx        |   4 +-
 app/_layout.tsx                      |  15 ++-
 app/forgot-password.tsx              | 150 +++++++++++++------------
 app/login.tsx                        | 190 ++++++++++++++++---------------
 app/register.tsx                     | 212 ++++++++++++++++++-----------------
 src/components/Header.tsx            |   4 +-
 src/components/admin/AdminHeader.tsx |   4 +-
 7 files changed, 304 insertions(+), 275 deletions(-)
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 388b015..63f7493 100644
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -10,6 +10,7 @@ import {
   View,
 } from "react-native";
 import { useLocalSearchParams, useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
@@ -36,6 +37,7 @@ const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map((day) => ({
 
 export default function TrainingDetailScreen() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { id } = useLocalSearchParams<{ id: string }>();
   const isNew = id === "new";
   const { trainings, loading, fetchTrainings } = useTrainings();
@@ -125,7 +127,7 @@ export default function TrainingDetailScreen() {
 
   return (
     <View style={styles.screen}>
-      <View style={styles.navBar}>
+      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
         <Pressable
           accessibilityRole="button"
           onPress={() => router.back()}
diff --git a/app/_layout.tsx b/app/_layout.tsx
index 0baec49..f3f5f84 100644
--- a/app/_layout.tsx
+++ b/app/_layout.tsx
@@ -15,6 +15,8 @@ import {
 } from "@expo-google-fonts/hanken-grotesk";
 
 import { Stack, useRouter, useSegments } from "expo-router";
+import { StatusBar } from "expo-status-bar";
+import { SafeAreaProvider } from "react-native-safe-area-context";
 
 import { AuthProvider } from "@/contexts/AuthContext";
 import { TrainingProvider } from "@/contexts/TrainingContext";
@@ -121,10 +123,13 @@ export default function RootLayout() {
   }
 
   return (
-    <AuthProvider>
-      <TrainingProvider>
-        <RootNavigator />
-      </TrainingProvider>
-    </AuthProvider>
+    <SafeAreaProvider>
+      <StatusBar style="dark" />
+      <AuthProvider>
+        <TrainingProvider>
+          <RootNavigator />
+        </TrainingProvider>
+      </AuthProvider>
+    </SafeAreaProvider>
   );
 }
diff --git a/app/forgot-password.tsx b/app/forgot-password.tsx
index 7734a88..b40ec3b 100644
--- a/app/forgot-password.tsx
+++ b/app/forgot-password.tsx
@@ -10,6 +10,7 @@ import {
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -41,90 +42,95 @@ export default function ForgotPasswordScreen() {
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
-        <View style={styles.hero}>
-          <Image
-            accessibilityIgnoresInvertColors
-            source={require("../assets/images/perun-emblem-burgundy.png")}
-            style={styles.emblem}
-          />
-        </View>
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
+          <View style={styles.hero}>
+            <Image
+              accessibilityIgnoresInvertColors
+              source={require("../assets/images/perun-emblem-burgundy.png")}
+              style={styles.emblem}
+            />
+          </View>
 
-        <View style={styles.content}>
-          <Image
-            accessibilityIgnoresInvertColors
-            source={require("../assets/images/perun-wordmark-burgundy.png")}
-            style={styles.wordmark}
-          />
+          <View style={styles.content}>
+            <Image
+              accessibilityIgnoresInvertColors
+              source={require("../assets/images/perun-wordmark-burgundy.png")}
+              style={styles.wordmark}
+            />
 
-          {sent ? (
-            <View style={styles.successContainer}>
-              <Text style={styles.successTitle}>Uputstva poslana</Text>
-              <Text style={styles.successMessage}>
-                Ako nalog postoji, poslali smo uputstva za reset lozinke na tvoju
-                email adresu.
-              </Text>
-            </View>
-          ) : (
-            <>
-              <View style={styles.fields}>
-                <View>
-                  <Text style={styles.label}>EMAIL</Text>
-                  <TextInput
-                    autoCapitalize="none"
-                    autoComplete="email"
-                    editable={!loading}
-                    keyboardType="email-address"
-                    onChangeText={setEmail}
-                    placeholder=""
-                    style={styles.emailInput}
-                    value={email}
-                  />
-                </View>
+            {sent ? (
+              <View style={styles.successContainer}>
+                <Text style={styles.successTitle}>Uputstva poslana</Text>
+                <Text style={styles.successMessage}>
+                  Ako nalog postoji, poslali smo uputstva za reset lozinke na
+                  tvoju email adresu.
+                </Text>
               </View>
+            ) : (
+              <>
+                <View style={styles.fields}>
+                  <View>
+                    <Text style={styles.label}>EMAIL</Text>
+                    <TextInput
+                      autoCapitalize="none"
+                      autoComplete="email"
+                      editable={!loading}
+                      keyboardType="email-address"
+                      onChangeText={setEmail}
+                      placeholder=""
+                      style={styles.emailInput}
+                      value={email}
+                    />
+                  </View>
+                </View>
 
-              {error && <Text style={styles.error}>{error}</Text>}
+                {error && <Text style={styles.error}>{error}</Text>}
 
-              <Pressable
-                accessibilityRole="button"
-                accessibilityState={{ disabled: loading }}
-                disabled={loading}
-                onPress={handleResetPassword}
-                style={({ pressed }) => [
-                  styles.resetButton,
-                  loading && styles.disabled,
-                  pressed && styles.pressed,
-                ]}
-              >
-                <Text style={styles.resetButtonText}>
-                  {loading ? "Učitavanje…" : "Pošalji link za reset"}
-                </Text>
-              </Pressable>
-            </>
-          )}
+                <Pressable
+                  accessibilityRole="button"
+                  accessibilityState={{ disabled: loading }}
+                  disabled={loading}
+                  onPress={handleResetPassword}
+                  style={({ pressed }) => [
+                    styles.resetButton,
+                    loading && styles.disabled,
+                    pressed && styles.pressed,
+                  ]}
+                >
+                  <Text style={styles.resetButtonText}>
+                    {loading ? "Učitavanje…" : "Pošalji link za reset"}
+                  </Text>
+                </Pressable>
+              </>
+            )}
 
-          <Pressable
-            accessibilityRole="button"
-            onPress={() => router.replace("/login")}
-            style={({ pressed }) => pressed && styles.pressed}
-          >
-            <Text style={styles.backLink}>Nazad na prijavu</Text>
-          </Pressable>
-        </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.replace("/login")}
+              style={({ pressed }) => pressed && styles.pressed}
+            >
+              <Text style={styles.backLink}>Nazad na prijavu</Text>
+            </Pressable>
+          </View>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
-  screen: {
+  safeArea: {
     backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+  },
+  screen: {
+    flex: 1,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/login.tsx b/app/login.tsx
index e16020e..91246b8 100644
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -10,6 +10,7 @@ import {
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -43,120 +44,125 @@ export default function LoginScreen() {
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
-        <View style={styles.hero}>
-          <Image
-            accessibilityIgnoresInvertColors
-            source={require("../assets/images/perun-emblem-burgundy.png")}
-            style={styles.emblem}
-          />
-        </View>
-
-        <View style={styles.content}>
-          <Image
-            accessibilityIgnoresInvertColors
-            source={require("../assets/images/perun-wordmark-burgundy.png")}
-            style={styles.wordmark}
-          />
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
+          <View style={styles.hero}>
+            <Image
+              accessibilityIgnoresInvertColors
+              source={require("../assets/images/perun-emblem-burgundy.png")}
+              style={styles.emblem}
+            />
+          </View>
 
-          <View style={styles.fields}>
-            <View>
-              <Text style={styles.label}>EMAIL</Text>
-              <TextInput
-                autoCapitalize="none"
-                autoComplete="email"
-                keyboardType="email-address"
-                onChangeText={setEmail}
-                style={styles.emailInput}
-                value={email}
-              />
-            </View>
+          <View style={styles.content}>
+            <Image
+              accessibilityIgnoresInvertColors
+              source={require("../assets/images/perun-wordmark-burgundy.png")}
+              style={styles.wordmark}
+            />
 
-            <View>
-              <Text style={styles.label}>LOZINKA</Text>
-              <View
-                style={[
-                  styles.passwordField,
-                  passwordFocused && styles.passwordFieldFocused,
-                ]}
-              >
+            <View style={styles.fields}>
+              <View>
+                <Text style={styles.label}>EMAIL</Text>
                 <TextInput
                   autoCapitalize="none"
-                  autoComplete="password"
-                  onBlur={() => setPasswordFocused(false)}
-                  onChangeText={setPassword}
-                  onFocus={() => setPasswordFocused(true)}
-                  secureTextEntry={!passwordVisible}
-                  style={styles.passwordInput}
-                  value={password}
+                  autoComplete="email"
+                  keyboardType="email-address"
+                  onChangeText={setEmail}
+                  style={styles.emailInput}
+                  value={email}
                 />
-                <Pressable
-                  accessibilityRole="button"
-                  onPress={() => setPasswordVisible((visible) => !visible)}
-                  style={({ pressed }) => pressed && styles.pressed}
+              </View>
+
+              <View>
+                <Text style={styles.label}>LOZINKA</Text>
+                <View
+                  style={[
+                    styles.passwordField,
+                    passwordFocused && styles.passwordFieldFocused,
+                  ]}
                 >
-                  <Text style={styles.showPassword}>
-                    {passwordVisible ? "Sakrij" : "Prikaži"}
-                  </Text>
-                </Pressable>
+                  <TextInput
+                    autoCapitalize="none"
+                    autoComplete="password"
+                    onBlur={() => setPasswordFocused(false)}
+                    onChangeText={setPassword}
+                    onFocus={() => setPasswordFocused(true)}
+                    secureTextEntry={!passwordVisible}
+                    style={styles.passwordInput}
+                    value={password}
+                  />
+                  <Pressable
+                    accessibilityRole="button"
+                    onPress={() => setPasswordVisible((visible) => !visible)}
+                    style={({ pressed }) => pressed && styles.pressed}
+                  >
+                    <Text style={styles.showPassword}>
+                      {passwordVisible ? "Sakrij" : "Prikaži"}
+                    </Text>
+                  </Pressable>
+                </View>
               </View>
             </View>
-          </View>
-
-          <Pressable
-            accessibilityRole="button"
-            onPress={() => router.push("/forgot-password")}
-            style={({ pressed }) => [
-              styles.forgotPassword,
-              pressed && styles.pressed,
-            ]}
-          >
-            <Text style={styles.link}>Zaboravljena lozinka?</Text>
-          </Pressable>
 
-          {error && <Text style={styles.error}>{error}</Text>}
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/forgot-password")}
+              style={({ pressed }) => [
+                styles.forgotPassword,
+                pressed && styles.pressed,
+              ]}
+            >
+              <Text style={styles.link}>Zaboravljena lozinka?</Text>
+            </Pressable>
 
-          <Pressable
-            accessibilityRole="button"
-            accessibilityState={{ disabled: loading }}
-            disabled={loading}
-            onPress={handleLogin}
-            style={({ pressed }) => [
-              styles.loginButton,
-              loading && styles.disabled,
-              pressed && styles.pressed,
-            ]}
-          >
-            <Text style={styles.loginButtonText}>
-              {loading ? "Učitavanje…" : "Prijavi se"}
-            </Text>
-          </Pressable>
+            {error && <Text style={styles.error}>{error}</Text>}
 
-          <View style={styles.footer}>
-            <Text style={styles.footerText}>Nemaš nalog? </Text>
             <Pressable
               accessibilityRole="button"
-              onPress={() => router.push("/register")}
-              style={({ pressed }) => pressed && styles.pressed}
+              accessibilityState={{ disabled: loading }}
+              disabled={loading}
+              onPress={handleLogin}
+              style={({ pressed }) => [
+                styles.loginButton,
+                loading && styles.disabled,
+                pressed && styles.pressed,
+              ]}
             >
-              <Text style={styles.joinLink}>Pridruži se</Text>
+              <Text style={styles.loginButtonText}>
+                {loading ? "Učitavanje…" : "Prijavi se"}
+              </Text>
             </Pressable>
+
+            <View style={styles.footer}>
+              <Text style={styles.footerText}>Nemaš nalog? </Text>
+              <Pressable
+                accessibilityRole="button"
+                onPress={() => router.push("/register")}
+                style={({ pressed }) => pressed && styles.pressed}
+              >
+                <Text style={styles.joinLink}>Pridruži se</Text>
+              </Pressable>
+            </View>
           </View>
-        </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
-  screen: {
+  safeArea: {
     backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+  },
+  screen: {
+    flex: 1,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/register.tsx b/app/register.tsx
index cf61037..65eec84 100644
--- a/app/register.tsx
+++ b/app/register.tsx
@@ -10,6 +10,7 @@ import {
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -45,132 +46,137 @@ export default function RegisterScreen() {
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
-        <View style={styles.hero}>
-          <Image
-            accessibilityIgnoresInvertColors
-            source={require("../assets/images/perun-emblem-burgundy.png")}
-            style={styles.emblem}
-          />
-        </View>
-
-        <View style={styles.content}>
-          <Image
-            accessibilityIgnoresInvertColors
-            source={require("../assets/images/perun-wordmark-burgundy.png")}
-            style={styles.wordmark}
-          />
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
+          <View style={styles.hero}>
+            <Image
+              accessibilityIgnoresInvertColors
+              source={require("../assets/images/perun-emblem-burgundy.png")}
+              style={styles.emblem}
+            />
+          </View>
 
-          <View style={styles.fields}>
-            <View>
-              <Text style={styles.label}>IME</Text>
-              <TextInput
-                autoCapitalize="words"
-                onChangeText={setFirstName}
-                placeholder=""
-                style={styles.input}
-                value={firstName}
-              />
-            </View>
+          <View style={styles.content}>
+            <Image
+              accessibilityIgnoresInvertColors
+              source={require("../assets/images/perun-wordmark-burgundy.png")}
+              style={styles.wordmark}
+            />
 
-            <View>
-              <Text style={styles.label}>PREZIME</Text>
-              <TextInput
-                autoCapitalize="words"
-                onChangeText={setLastName}
-                placeholder=""
-                style={styles.input}
-                value={lastName}
-              />
-            </View>
+            <View style={styles.fields}>
+              <View>
+                <Text style={styles.label}>IME</Text>
+                <TextInput
+                  autoCapitalize="words"
+                  onChangeText={setFirstName}
+                  placeholder=""
+                  style={styles.input}
+                  value={firstName}
+                />
+              </View>
 
-            <View>
-              <Text style={styles.label}>EMAIL</Text>
-              <TextInput
-                autoCapitalize="none"
-                autoComplete="email"
-                keyboardType="email-address"
-                onChangeText={setEmail}
-                placeholder=""
-                style={styles.input}
-                value={email}
-              />
-            </View>
+              <View>
+                <Text style={styles.label}>PREZIME</Text>
+                <TextInput
+                  autoCapitalize="words"
+                  onChangeText={setLastName}
+                  placeholder=""
+                  style={styles.input}
+                  value={lastName}
+                />
+              </View>
 
-            <View>
-              <Text style={styles.label}>LOZINKA</Text>
-              <View
-                style={[
-                  styles.passwordField,
-                  passwordFocused && styles.passwordFieldFocused,
-                ]}
-              >
+              <View>
+                <Text style={styles.label}>EMAIL</Text>
                 <TextInput
                   autoCapitalize="none"
-                  autoComplete="password"
-                  onBlur={() => setPasswordFocused(false)}
-                  onChangeText={setPassword}
-                  onFocus={() => setPasswordFocused(true)}
-                  secureTextEntry={!passwordVisible}
-                  style={styles.passwordInput}
-                  value={password}
+                  autoComplete="email"
+                  keyboardType="email-address"
+                  onChangeText={setEmail}
+                  placeholder=""
+                  style={styles.input}
+                  value={email}
                 />
-                <Pressable
-                  accessibilityRole="button"
-                  onPress={() => setPasswordVisible((visible) => !visible)}
-                  style={({ pressed }) => pressed && styles.pressed}
+              </View>
+
+              <View>
+                <Text style={styles.label}>LOZINKA</Text>
+                <View
+                  style={[
+                    styles.passwordField,
+                    passwordFocused && styles.passwordFieldFocused,
+                  ]}
                 >
-                  <Text style={styles.showPassword}>
-                    {passwordVisible ? "Sakrij" : "Prikaži"}
-                  </Text>
-                </Pressable>
+                  <TextInput
+                    autoCapitalize="none"
+                    autoComplete="password"
+                    onBlur={() => setPasswordFocused(false)}
+                    onChangeText={setPassword}
+                    onFocus={() => setPasswordFocused(true)}
+                    secureTextEntry={!passwordVisible}
+                    style={styles.passwordInput}
+                    value={password}
+                  />
+                  <Pressable
+                    accessibilityRole="button"
+                    onPress={() => setPasswordVisible((visible) => !visible)}
+                    style={({ pressed }) => pressed && styles.pressed}
+                  >
+                    <Text style={styles.showPassword}>
+                      {passwordVisible ? "Sakrij" : "Prikaži"}
+                    </Text>
+                  </Pressable>
+                </View>
               </View>
             </View>
-          </View>
 
-          {error && <Text style={styles.error}>{error}</Text>}
+            {error && <Text style={styles.error}>{error}</Text>}
 
-          <Pressable
-            accessibilityRole="button"
-            accessibilityState={{ disabled: loading }}
-            disabled={loading}
-            onPress={handleRegister}
-            style={({ pressed }) => [
-              styles.registerButton,
-              loading && styles.disabled,
-              pressed && styles.pressed,
-            ]}
-          >
-            <Text style={styles.registerButtonText}>
-              {loading ? "Učitavanje…" : "Napravi nalog"}
-            </Text>
-          </Pressable>
-
-          <View style={styles.footer}>
-            <Text style={styles.footerText}>Imaš nalog? </Text>
             <Pressable
               accessibilityRole="button"
-              onPress={() => router.replace("/login")}
-              style={({ pressed }) => pressed && styles.pressed}
+              accessibilityState={{ disabled: loading }}
+              disabled={loading}
+              onPress={handleRegister}
+              style={({ pressed }) => [
+                styles.registerButton,
+                loading && styles.disabled,
+                pressed && styles.pressed,
+              ]}
             >
-              <Text style={styles.loginLink}>Prijavi se</Text>
+              <Text style={styles.registerButtonText}>
+                {loading ? "Učitavanje…" : "Napravi nalog"}
+              </Text>
             </Pressable>
+
+            <View style={styles.footer}>
+              <Text style={styles.footerText}>Imaš nalog? </Text>
+              <Pressable
+                accessibilityRole="button"
+                onPress={() => router.replace("/login")}
+                style={({ pressed }) => pressed && styles.pressed}
+              >
+                <Text style={styles.loginLink}>Prijavi se</Text>
+              </Pressable>
+            </View>
           </View>
-        </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
-  screen: {
+  safeArea: {
     backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+  },
+  screen: {
+    flex: 1,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/src/components/Header.tsx b/src/components/Header.tsx
index 0732148..c6bdb6e 100644
--- a/src/components/Header.tsx
+++ b/src/components/Header.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -8,6 +9,7 @@ import { useAuth } from "@/hooks/useAuth";
 
 export default function Header() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -17,7 +19,7 @@ export default function Header() {
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image
           accessibilityIgnoresInvertColors
diff --git a/src/components/admin/AdminHeader.tsx b/src/components/admin/AdminHeader.tsx
index 9972950..f747014 100644
--- a/src/components/admin/AdminHeader.tsx
+++ b/src/components/admin/AdminHeader.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 import { useAuth } from "@/hooks/useAuth";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -7,6 +8,7 @@ import { FontFamilies, Typography } from "@/constants/typography";
 
 export default function AdminHeader() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -16,7 +18,7 @@ export default function AdminHeader() {
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image source={require("../../../assets/images/perun-emblem-burgundy.png")} style={styles.emblem} />
         <Text style={styles.wordmark}>PERUN</Text>

diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 388b015c56c399a15805fd1f85899697fef3dee9..63f74934074ec361d3383d1bebe96ac5e5d71acb
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -10,6 +10,7 @@
   View,
 } from "react-native";
 import { useLocalSearchParams, useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
@@ -36,6 +37,7 @@
 
 export default function TrainingDetailScreen() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { id } = useLocalSearchParams<{ id: string }>();
   const isNew = id === "new";
   const { trainings, loading, fetchTrainings } = useTrainings();
@@ -125,7 +127,7 @@
 
   return (
     <View style={styles.screen}>
-      <View style={styles.navBar}>
+      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
         <Pressable
           accessibilityRole="button"
           onPress={() => router.back()}
diff --git a/app/_layout.tsx b/app/_layout.tsx
index 0baec49fcdcb74d36ae4c78abb34724f4f67de2f..f3f5f840fdc5cfa8284cb499c446f0c03e3771ac
--- a/app/_layout.tsx
+++ b/app/_layout.tsx
@@ -15,6 +15,8 @@
 } from "@expo-google-fonts/hanken-grotesk";
 
 import { Stack, useRouter, useSegments } from "expo-router";
+import { StatusBar } from "expo-status-bar";
+import { SafeAreaProvider } from "react-native-safe-area-context";
 
 import { AuthProvider } from "@/contexts/AuthContext";
 import { TrainingProvider } from "@/contexts/TrainingContext";
@@ -121,10 +123,13 @@
   }
 
   return (
-    <AuthProvider>
-      <TrainingProvider>
-        <RootNavigator />
-      </TrainingProvider>
-    </AuthProvider>
+    <SafeAreaProvider>
+      <StatusBar style="dark" />
+      <AuthProvider>
+        <TrainingProvider>
+          <RootNavigator />
+        </TrainingProvider>
+      </AuthProvider>
+    </SafeAreaProvider>
   );
 }
diff --git a/app/forgot-password.tsx b/app/forgot-password.tsx
index 7734a88167506d1024ab2be67f958abf23cd33d9..0dd0d668c445376ef29bc58b3487f5acbee2ac6c
--- a/app/forgot-password.tsx
+++ b/app/forgot-password.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -41,11 +42,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -115,16 +117,20 @@
             <Text style={styles.backLink}>Nazad na prijavu</Text>
           </Pressable>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/login.tsx b/app/login.tsx
index e16020ead53ade22b107dd7daaa1af462effc3e2..40b30317a15947b3efc43c79cfd321c0f0deaa39
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -43,11 +44,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -147,16 +149,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/register.tsx b/app/register.tsx
index cf6103746240334f3879ea9af64702cdac2d28e0..d94c677f5871de50ce6c25a667929349bd98aea2
--- a/app/register.tsx
+++ b/app/register.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -45,11 +46,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -161,16 +163,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/src/components/Header.tsx b/src/components/Header.tsx
index 07321482e3df747b35ca47f22a9981d2dff46465..c6bdb6eb2a47bc3fc4ba5588d6c54ea1cd108d7e
--- a/src/components/Header.tsx
+++ b/src/components/Header.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -8,6 +9,7 @@
 
 export default function Header() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -17,7 +19,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image
           accessibilityIgnoresInvertColors
diff --git a/src/components/admin/AdminHeader.tsx b/src/components/admin/AdminHeader.tsx
index 9972950eb5a3ffda1db65b6d32b413568fb677d1..f747014f4234d7703997cfc15b264b875ca4595f
--- a/src/components/admin/AdminHeader.tsx
+++ b/src/components/admin/AdminHeader.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 import { useAuth } from "@/hooks/useAuth";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -7,6 +8,7 @@
 
 export default function AdminHeader() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -16,7 +18,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image source={require("../../../assets/images/perun-emblem-burgundy.png")} style={styles.emblem} />
         <Text style={styles.wordmark}>PERUN</Text>

codex
Implemented safe-area handling across the seven requested files:

- Added root `SafeAreaProvider` and dark `StatusBar`.
- Used `useSafeAreaInsets` for member/admin headers and training nav.
- Used top-edge `SafeAreaView` plus 16px visual padding for auth screens.
- Left `profile.tsx` unchanged because it already handles safe areas.
- `npx tsc --noEmit`: passed.
- `npx eslint app src`: passed.
- No commit created.

DONE
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 388b015c56c399a15805fd1f85899697fef3dee9..63f74934074ec361d3383d1bebe96ac5e5d71acb
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -10,6 +10,7 @@
   View,
 } from "react-native";
 import { useLocalSearchParams, useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
@@ -36,6 +37,7 @@
 
 export default function TrainingDetailScreen() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { id } = useLocalSearchParams<{ id: string }>();
   const isNew = id === "new";
   const { trainings, loading, fetchTrainings } = useTrainings();
@@ -125,7 +127,7 @@
 
   return (
     <View style={styles.screen}>
-      <View style={styles.navBar}>
+      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
         <Pressable
           accessibilityRole="button"
           onPress={() => router.back()}
diff --git a/app/_layout.tsx b/app/_layout.tsx
index 0baec49fcdcb74d36ae4c78abb34724f4f67de2f..f3f5f840fdc5cfa8284cb499c446f0c03e3771ac
--- a/app/_layout.tsx
+++ b/app/_layout.tsx
@@ -15,6 +15,8 @@
 } from "@expo-google-fonts/hanken-grotesk";
 
 import { Stack, useRouter, useSegments } from "expo-router";
+import { StatusBar } from "expo-status-bar";
+import { SafeAreaProvider } from "react-native-safe-area-context";
 
 import { AuthProvider } from "@/contexts/AuthContext";
 import { TrainingProvider } from "@/contexts/TrainingContext";
@@ -121,10 +123,13 @@
   }
 
   return (
-    <AuthProvider>
-      <TrainingProvider>
-        <RootNavigator />
-      </TrainingProvider>
-    </AuthProvider>
+    <SafeAreaProvider>
+      <StatusBar style="dark" />
+      <AuthProvider>
+        <TrainingProvider>
+          <RootNavigator />
+        </TrainingProvider>
+      </AuthProvider>
+    </SafeAreaProvider>
   );
 }
diff --git a/app/forgot-password.tsx b/app/forgot-password.tsx
index 7734a88167506d1024ab2be67f958abf23cd33d9..0dd0d668c445376ef29bc58b3487f5acbee2ac6c
--- a/app/forgot-password.tsx
+++ b/app/forgot-password.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -41,11 +42,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -115,16 +117,20 @@
             <Text style={styles.backLink}>Nazad na prijavu</Text>
           </Pressable>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/login.tsx b/app/login.tsx
index e16020ead53ade22b107dd7daaa1af462effc3e2..40b30317a15947b3efc43c79cfd321c0f0deaa39
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -43,11 +44,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -147,16 +149,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/app/register.tsx b/app/register.tsx
index cf6103746240334f3879ea9af64702cdac2d28e0..d94c677f5871de50ce6c25a667929349bd98aea2
--- a/app/register.tsx
+++ b/app/register.tsx
@@ -10,6 +10,7 @@
   TextInput,
   View,
 } from "react-native";
+import { SafeAreaView } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -45,11 +46,12 @@
   };
 
   return (
-    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
-      <ScrollView
-        contentContainerStyle={styles.scrollContent}
-        keyboardShouldPersistTaps="handled"
-      >
+    <SafeAreaView edges={["top"]} style={styles.safeArea}>
+      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+        <ScrollView
+          contentContainerStyle={styles.scrollContent}
+          keyboardShouldPersistTaps="handled"
+        >
         <View style={styles.hero}>
           <Image
             accessibilityIgnoresInvertColors
@@ -161,16 +163,20 @@
             </Pressable>
           </View>
         </View>
-      </ScrollView>
-    </KeyboardAvoidingView>
+        </ScrollView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
+  safeArea: {
+    backgroundColor: Colors.paper,
+    flex: 1,
+  },
   screen: {
-    backgroundColor: Colors.paper,
     flex: 1,
-    paddingTop: 30,
+    paddingTop: 16,
   },
   scrollContent: {
     flexGrow: 1,
diff --git a/src/components/Header.tsx b/src/components/Header.tsx
index 07321482e3df747b35ca47f22a9981d2dff46465..c6bdb6eb2a47bc3fc4ba5588d6c54ea1cd108d7e
--- a/src/components/Header.tsx
+++ b/src/components/Header.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -8,6 +9,7 @@
 
 export default function Header() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -17,7 +19,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image
           accessibilityIgnoresInvertColors
diff --git a/src/components/admin/AdminHeader.tsx b/src/components/admin/AdminHeader.tsx
index 9972950eb5a3ffda1db65b6d32b413568fb677d1..f747014f4234d7703997cfc15b264b875ca4595f
--- a/src/components/admin/AdminHeader.tsx
+++ b/src/components/admin/AdminHeader.tsx
@@ -1,5 +1,6 @@
 import { Image, Pressable, StyleSheet, Text, View } from "react-native";
 import { useRouter } from "expo-router";
+import { useSafeAreaInsets } from "react-native-safe-area-context";
 import { useAuth } from "@/hooks/useAuth";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
@@ -7,6 +8,7 @@
 
 export default function AdminHeader() {
   const router = useRouter();
+  const insets = useSafeAreaInsets();
   const { profile } = useAuth();
   const initials = [profile?.first_name, profile?.last_name]
     .filter(Boolean)
@@ -16,7 +18,7 @@
     .toUpperCase();
 
   return (
-    <View style={styles.header}>
+    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
       <View style={styles.brand}>
         <Image source={require("../../../assets/images/perun-emblem-burgundy.png")} style={styles.emblem} />
         <Text style={styles.wordmark}>PERUN</Text>

tokens used
41,110
Implemented safe-area handling across the seven requested files:

- Added root `SafeAreaProvider` and dark `StatusBar`.
- Used `useSafeAreaInsets` for member/admin headers and training nav.
- Used top-edge `SafeAreaView` plus 16px visual padding for auth screens.
- Left `profile.tsx` unchanged because it already handles safe areas.
- `npx tsc --noEmit`: passed.
- `npx eslint app src`: passed.
- No commit created.

DONE
