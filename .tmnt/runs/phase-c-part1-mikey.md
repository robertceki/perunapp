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
session id: 019f0b2d-72a8-7653-9577-673eff6220d0
--------
user
TASK: Phase C Group A Part 1 — Auth methods + screens (A1, A2, A3, A4)

CONTEXT
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Framework: React Native (Expo) + TypeScript

CODING CONSTRAINTS
- React Native primitives only (View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Image, ActivityIndicator). No new deps.
- TS strict, no `any`.
- Reuse Colors, Spacing, Typography, Radii constants.
- Match login field/button styles.
- Serbian copy: Napravi nalog, Imaš nalog, Prijavi se, Pošalji link za reset, Ako nalog postoji, poslali smo uputstva…

DEFINITION OF DONE
1. app/login.tsx: KeyboardAvoidingView + ScrollView wrapper; tagline removed; "Zaboravljena lozinka?" → router.push("/forgot-password"); "Pridruži se" → router.push("/register").
2. AuthContext: add register(email, password, firstName, lastName) and resetPassword(email) methods.
3. app/register.tsx (new): IME, PREZIME, EMAIL, LOZINKA fields (show/hide), "Napravi nalog" button, error display, "Imaš nalog? Prijavi se" → /login.
4. app/forgot-password.tsx (new): EMAIL field, "Pošalji link za reset" button, success message, back-to-login link. Comment: SMTP deferred.
5. Gates: tsc --noEmit 0, eslint app src 0.

OUTPUT
1. Modify app/login.tsx
2. Modify src/contexts/AuthContext.tsx
3. Create app/register.tsx
4. Create app/forgot-password.tsx
5. Run tsc + eslint; report exit codes.

Then: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the existing auth context, login screen, design constants, and routing conventions, then implement the four requested changes and run both gates.
exec
/bin/zsh -lc "pwd && rg --files app src | sort && git status --short && sed -n '1,260p' app/login.tsx && sed -n '1,320p' src/contexts/AuthContext.tsx" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
/Users/uros/Documents/Private/Projects/PerunApp
app/(admin)/(tabs)/_layout.tsx
app/(admin)/(tabs)/index.tsx
app/(admin)/(tabs)/sessions.tsx
app/(admin)/(tabs)/stats.tsx
app/(admin)/(tabs)/users.tsx
app/(admin)/_layout.tsx
app/(admin)/training/[id].tsx
app/(tabs)/_layout.tsx
app/(tabs)/index.tsx
app/_layout.tsx
app/login.tsx
app/profile.tsx
src/components/AlertBar.tsx
src/components/DayFilter.tsx
src/components/EmptyDay.tsx
src/components/Header.tsx
src/components/TrainingCard.tsx
src/components/admin/AdminHeader.tsx
src/components/admin/BarChart.tsx
src/components/admin/FilterChips.tsx
src/components/admin/SessionRow.tsx
src/components/admin/StatTile.tsx
src/components/admin/Toggle.tsx
src/components/admin/UserRow.tsx
src/components/admin/index.ts
src/constants/Colors.ts
src/constants/__tests__/days.test.ts
src/constants/__tests__/tokens.test.ts
src/constants/days.ts
src/constants/spacing.ts
src/constants/typography.ts
src/contexts/AuthContext.tsx
src/contexts/TrainingContext.tsx
src/hooks/useAuth.ts
src/hooks/useTrainings.ts
src/services/admin/index.ts
src/services/admin/sessions.ts
src/services/admin/stats.ts
src/services/admin/types.ts
src/services/admin/users.ts
src/services/supabase/client.ts
src/types/Profile.ts
src/types/Training.ts
src/utils/__tests__/limits.test.ts
src/utils/__tests__/week.test.ts
src/utils/limits.ts
src/utils/week.ts
?? .tmnt/goal-phase-c.md
?? .tmnt/runs/phase-c-group-a-mikey.md
?? .tmnt/runs/phase-c-part1-mikey.md
?? supabase/migrations/20260628100000_signup_capture_names.sql
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
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
    <View style={styles.screen}>
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
        <Text style={styles.tagline}>
          Rezerviši svoj termin i budi deo ekipe ove nedelje.
        </Text>

        <View style={styles.fields}>
          <View>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder=""
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
          onPress={() => {}}
          style={({ pressed }) => [styles.forgotPassword, pressed && styles.pressed]}
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

        <Text style={styles.footer}>
          Nemaš nalog? <Text style={styles.joinLink}>Pridruži se</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.paper,
    flex: 1,
    paddingTop: 30,
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
  },
  wordmark: {
    alignSelf: "center",
    height: 95.5,
    marginTop: 26,
    resizeMode: "contain",
    width: 176,
  },
  tagline: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[400],
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20.3,
    marginTop: 14,
    paddingHorizontal: 12,
    textAlign: "center",
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
  },
  footer: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[400],
    fontSize: 13.5,
    fontWeight: "400",
    marginTop: 18,
import { Session } from "@supabase/supabase-js";
import { createContext, useEffect, useMemo, useState } from "react";

import { Profile } from "@/types/Profile";
import { supabase } from "@/services/supabase/client";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  profile: null,
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setProfile(data || null);
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setSession(null);
  };

  const updateProfile = async (patch: Partial<Profile>) => {
    if (!session) {
      throw new Error("No active session");
    }

    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", session.user.id);

    if (error) {
      throw error;
    }

    await fetchProfile(session.user.id);
  };

  const value = useMemo(
    () => ({
      session,
      loading,
      profile,
      login,
      logout,
      updateProfile,
    }),
    [session, loading, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

exec
/bin/zsh -lc "sed -n '220,420p' app/login.tsx && sed -n '1,240p' app/_layout.tsx && sed -n '1,220p' src/constants/Colors.ts && sed -n '1,240p' src/constants/spacing.ts && sed -n '1,260p' src/constants/typography.ts && sed -n '1,240p' supabase/migrations/20260628100000_signup_capture_names.sql && sed -n '1,220p' package.json && sed -n '1,160p' tsconfig.json" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
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
  },
  footer: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[400],
    fontSize: 13.5,
    fontWeight: "400",
    marginTop: 18,
    textAlign: "center",
  },
  joinLink: {
    color: Colors.burgundy,
    fontFamily: FontFamilies.hanken[700],
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.92,
  },
});
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

    const inLoginPage = segments[0] === "login";
    const inAdminPage = segments[0] === "(admin)";
    const inTabsPage = segments[0] === "(tabs)";

    if (!session && !inLoginPage) {
      router.replace("/login");
      return;
    }

    if (session && profile && inLoginPage) {
      if (profile.role === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(tabs)");
      }
      return;
    }

    if (session && profile && !inLoginPage) {
      if (profile.role === "admin" && !inAdminPage) {
        router.replace("/(admin)");
        return;
      }
      if (profile.role !== "admin" && !inTabsPage) {
        router.replace("/(tabs)");
        return;
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
export const Colors = {
  paper: "#FBF7F1",
  surface: "#FFFFFF",
  surfaceWarm: "#FFFDF8",
  surfaceMuted: "#FAF6EF",
  ink: "#221F2B",
  inkMuted: "#8B8192",
  inkFaint: "#9A8FA0",
  burgundy: "#58003D",
  burgundyTint: "#F6E9F0",
  burgundyBorder: "#ECCFDF",
  burgundyText2: "#9A6385",
  gold: "#C6A35C",
  goldDeep: "#9A7B33",
  goldTint: "#F6EFDF",
  goldBorder: "#E8D9B5",
  sage: "#586056",
  sageTint: "#EAEDE7",
  navy: "#22222A",
  border: "#F0E8DD",
  track: "#EFE7DA",
  fieldBorder: "#ECE2D4",
} as const;

export type ColorToken = keyof typeof Colors;
import type { ViewStyle } from "react-native";

export const Spacing = {
  screenHorizontal: 20,
  loginHorizontal: 30,
  cardPadding: 16,
  cardGap: 13,
  section: {
    compact: 16,
    relaxed: 18,
  },
} as const;

export const Radii = {
  screen: 44,
  card: 22,
  input: 15,
  chip: 20,
  tile: {
    12: 12,
    14: 14,
    16: 16,
    18: 18,
  },
  avatar: 9999,
} as const;

type ShadowPreset = Pick<
  ViewStyle,
  | "shadowColor"
  | "shadowOpacity"
  | "shadowRadius"
  | "shadowOffset"
  | "elevation"
>;

export const Shadows = {
  card: {
    shadowColor: "rgb(40, 20, 40)",
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  primaryButton: {
    shadowColor: "rgb(88, 0, 61)",
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  activeDay: {
    shadowColor: "rgb(88, 0, 61)",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  avatar: {
    shadowColor: "rgb(88, 0, 61)",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
} as const satisfies Record<string, ShadowPreset>;

export type SpacingToken = keyof typeof Spacing;
export type RadiusToken = keyof typeof Radii;
export type ShadowToken = keyof typeof Shadows;
import type { TextStyle } from "react-native";

export const FontFamilies = {
  bricolage: {
    700: "Bricolage_700Bold",
    800: "Bricolage_800ExtraBold",
  },
  hanken: {
    400: "Hanken_400Regular",
    500: "Hanken_500Medium",
    600: "Hanken_600SemiBold",
    700: "Hanken_700Bold",
    800: "Hanken_800ExtraBold",
  },
} as const;

export type TextRolePreset = {
  fontFamily: string;
  fontSize: number;
  fontWeight: NonNullable<TextStyle["fontWeight"]>;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: NonNullable<TextStyle["textTransform"]>;
};

export const Typography = {
  greeting: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  screenTitle: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontFamily: FontFamilies.bricolage[700],
    fontSize: 16.5,
    fontWeight: "700",
    lineHeight: 19,
  },
  time: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 20,
    fontWeight: "800",
  },
  statFigure: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 27,
    fontWeight: "800",
  },
  sectionLabel: {
    fontFamily: FontFamilies.bricolage[700],
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  wordmark: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  body: {
    fontFamily: FontFamilies.hanken[600],
    fontSize: 14,
    fontWeight: "600",
  },
  fieldText: {
    fontFamily: FontFamilies.hanken[600],
    fontSize: 14.5,
    fontWeight: "600",
  },
  secondary: {
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
  },
  meta: {
    fontFamily: FontFamilies.hanken[600],
    fontSize: 13.5,
    fontWeight: "600",
  },
  microLabel: {
    fontFamily: FontFamilies.hanken[800],
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  microLabelWide: {
    fontFamily: FontFamilies.hanken[800],
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  chip: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 11,
    fontWeight: "700",
  },
  primaryButtonCompact: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  primaryButton: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
} as const satisfies Record<string, TextRolePreset>;

export type TextRole = keyof typeof Typography;
-- Phase C (A2): capture first/last name from sign-up metadata at profile
-- creation, so registration can set names WITHOUT granting members write access
-- to profiles (which would be a privilege-escalation risk: role / weekly limit
-- must stay admin-controlled). The trigger is SECURITY DEFINER, so it can write
-- the profile while the table stays member-read-only.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  insert into public.profiles (id, first_name, last_name, enabled, role, max_sessions_per_week)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''), ''),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''), ''),
    true,
    'user',
    0
  );
  return new;
end;
$fn$;
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
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}

codex
The current auth guard only permits `/login`; without a small routing update it would immediately redirect the two new screens. I’ll include that necessary `app/_layout.tsx` adjustment while keeping the requested UI and auth API changes scoped to the four target files.
exec
/bin/zsh -lc "rg -n \"KeyboardAvoidingView|resetPassword|signUp|router\\.push\" app src eslint.config.* .eslintrc* 2>/dev/null || true && rg --files | rg 'eslint|prettier'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
zsh:1: no matches found: .eslintrc*
eslint.config.js

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/app/login.tsx
diff --git a/app/login.tsx b/app/login.tsx
index 262794f4fe932f38798b1689211119b6ac788692..e16020ead53ade22b107dd7daaa1af462effc3e2
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -2,7 +2,9 @@
 import { useState } from "react";
 import {
   Image,
+  KeyboardAvoidingView,
   Pressable,
+  ScrollView,
   StyleSheet,
   Text,
   TextInput,
@@ -41,101 +43,112 @@
   };
 
   return (
-    <View style={styles.screen}>
-      <View style={styles.hero}>
-        <Image
-          accessibilityIgnoresInvertColors
-          source={require("../assets/images/perun-emblem-burgundy.png")}
-          style={styles.emblem}
-        />
-      </View>
-
-      <View style={styles.content}>
-        <Image
-          accessibilityIgnoresInvertColors
-          source={require("../assets/images/perun-wordmark-burgundy.png")}
-          style={styles.wordmark}
-        />
-        <Text style={styles.tagline}>
-          Rezerviši svoj termin i budi deo ekipe ove nedelje.
-        </Text>
+    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+      <ScrollView
+        contentContainerStyle={styles.scrollContent}
+        keyboardShouldPersistTaps="handled"
+      >
+        <View style={styles.hero}>
+          <Image
+            accessibilityIgnoresInvertColors
+            source={require("../assets/images/perun-emblem-burgundy.png")}
+            style={styles.emblem}
+          />
+        </View>
 
-        <View style={styles.fields}>
-          <View>
-            <Text style={styles.label}>EMAIL</Text>
-            <TextInput
-              autoCapitalize="none"
-              autoComplete="email"
-              keyboardType="email-address"
-              onChangeText={setEmail}
-              placeholder=""
-              style={styles.emailInput}
-              value={email}
-            />
-          </View>
+        <View style={styles.content}>
+          <Image
+            accessibilityIgnoresInvertColors
+            source={require("../assets/images/perun-wordmark-burgundy.png")}
+            style={styles.wordmark}
+          />
 
-          <View>
-            <Text style={styles.label}>LOZINKA</Text>
-            <View
-              style={[
-                styles.passwordField,
-                passwordFocused && styles.passwordFieldFocused,
-              ]}
-            >
+          <View style={styles.fields}>
+            <View>
+              <Text style={styles.label}>EMAIL</Text>
               <TextInput
                 autoCapitalize="none"
-                autoComplete="password"
-                onBlur={() => setPasswordFocused(false)}
-                onChangeText={setPassword}
-                onFocus={() => setPasswordFocused(true)}
-                secureTextEntry={!passwordVisible}
-                style={styles.passwordInput}
-                value={password}
+                autoComplete="email"
+                keyboardType="email-address"
+                onChangeText={setEmail}
+                style={styles.emailInput}
+                value={email}
               />
-              <Pressable
-                accessibilityRole="button"
-                onPress={() => setPasswordVisible((visible) => !visible)}
-                style={({ pressed }) => pressed && styles.pressed}
+            </View>
+
+            <View>
+              <Text style={styles.label}>LOZINKA</Text>
+              <View
+                style={[
+                  styles.passwordField,
+                  passwordFocused && styles.passwordFieldFocused,
+                ]}
               >
-                <Text style={styles.showPassword}>
-                  {passwordVisible ? "Sakrij" : "Prikaži"}
-                </Text>
-              </Pressable>
+                <TextInput
+                  autoCapitalize="none"
+                  autoComplete="password"
+                  onBlur={() => setPasswordFocused(false)}
+                  onChangeText={setPassword}
+                  onFocus={() => setPasswordFocused(true)}
+                  secureTextEntry={!passwordVisible}
+                  style={styles.passwordInput}
+                  value={password}
+                />
+                <Pressable
+                  accessibilityRole="button"
+                  onPress={() => setPasswordVisible((visible) => !visible)}
+                  style={({ pressed }) => pressed && styles.pressed}
+                >
+                  <Text style={styles.showPassword}>
+                    {passwordVisible ? "Sakrij" : "Prikaži"}
+                  </Text>
+                </Pressable>
+              </View>
             </View>
           </View>
-        </View>
 
-        <Pressable
-          accessibilityRole="button"
-          onPress={() => {}}
-          style={({ pressed }) => [styles.forgotPassword, pressed && styles.pressed]}
-        >
-          <Text style={styles.link}>Zaboravljena lozinka?</Text>
-        </Pressable>
+          <Pressable
+            accessibilityRole="button"
+            onPress={() => router.push("/forgot-password")}
+            style={({ pressed }) => [
+              styles.forgotPassword,
+              pressed && styles.pressed,
+            ]}
+          >
+            <Text style={styles.link}>Zaboravljena lozinka?</Text>
+          </Pressable>
 
-        {error && <Text style={styles.error}>{error}</Text>}
+          {error && <Text style={styles.error}>{error}</Text>}
 
-        <Pressable
-          accessibilityRole="button"
-          accessibilityState={{ disabled: loading }}
-          disabled={loading}
-          onPress={handleLogin}
-          style={({ pressed }) => [
-            styles.loginButton,
-            loading && styles.disabled,
-            pressed && styles.pressed,
-          ]}
-        >
-          <Text style={styles.loginButtonText}>
-            {loading ? "Učitavanje…" : "Prijavi se"}
-          </Text>
-        </Pressable>
+          <Pressable
+            accessibilityRole="button"
+            accessibilityState={{ disabled: loading }}
+            disabled={loading}
+            onPress={handleLogin}
+            style={({ pressed }) => [
+              styles.loginButton,
+              loading && styles.disabled,
+              pressed && styles.pressed,
+            ]}
+          >
+            <Text style={styles.loginButtonText}>
+              {loading ? "Učitavanje…" : "Prijavi se"}
+            </Text>
+          </Pressable>
 
-        <Text style={styles.footer}>
-          Nemaš nalog? <Text style={styles.joinLink}>Pridruži se</Text>
-        </Text>
-      </View>
-    </View>
+          <View style={styles.footer}>
+            <Text style={styles.footerText}>Nemaš nalog? </Text>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/register")}
+              style={({ pressed }) => pressed && styles.pressed}
+            >
+              <Text style={styles.joinLink}>Pridruži se</Text>
+            </Pressable>
+          </View>
+        </View>
+      </ScrollView>
+    </KeyboardAvoidingView>
   );
 }
 
@@ -145,6 +158,9 @@
     flex: 1,
     paddingTop: 30,
   },
+  scrollContent: {
+    flexGrow: 1,
+  },
   hero: {
     alignItems: "center",
     height: 200,
@@ -158,6 +174,7 @@
   content: {
     flex: 1,
     paddingHorizontal: Spacing.loginHorizontal,
+    paddingBottom: Spacing.section.relaxed,
   },
   wordmark: {
     alignSelf: "center",
@@ -166,16 +183,6 @@
     resizeMode: "contain",
     width: 176,
   },
-  tagline: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[400],
-    fontSize: 14,
-    fontWeight: "400",
-    lineHeight: 20.3,
-    marginTop: 14,
-    paddingHorizontal: 12,
-    textAlign: "center",
-  },
   fields: {
     gap: 13,
     marginTop: 24,
@@ -253,16 +260,21 @@
     color: Colors.surface,
   },
   footer: {
+    alignItems: "center",
+    flexDirection: "row",
+    justifyContent: "center",
+    marginTop: 18,
+  },
+  footerText: {
     color: Colors.inkMuted,
     fontFamily: FontFamilies.hanken[400],
     fontSize: 13.5,
     fontWeight: "400",
-    marginTop: 18,
-    textAlign: "center",
   },
   joinLink: {
     color: Colors.burgundy,
     fontFamily: FontFamilies.hanken[700],
+    fontSize: 13.5,
     fontWeight: "700",
   },
   disabled: {

diff --git a/app/login.tsx b/app/login.tsx
index 262794f4fe932f38798b1689211119b6ac788692..e16020ead53ade22b107dd7daaa1af462effc3e2
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -2,7 +2,9 @@
 import { useState } from "react";
 import {
   Image,
+  KeyboardAvoidingView,
   Pressable,
+  ScrollView,
   StyleSheet,
   Text,
   TextInput,
@@ -41,101 +43,112 @@
   };
 
   return (
-    <View style={styles.screen}>
-      <View style={styles.hero}>
-        <Image
-          accessibilityIgnoresInvertColors
-          source={require("../assets/images/perun-emblem-burgundy.png")}
-          style={styles.emblem}
-        />
-      </View>
-
-      <View style={styles.content}>
-        <Image
-          accessibilityIgnoresInvertColors
-          source={require("../assets/images/perun-wordmark-burgundy.png")}
-          style={styles.wordmark}
-        />
-        <Text style={styles.tagline}>
-          Rezerviši svoj termin i budi deo ekipe ove nedelje.
-        </Text>
+    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+      <ScrollView
+        contentContainerStyle={styles.scrollContent}
+        keyboardShouldPersistTaps="handled"
+      >
+        <View style={styles.hero}>
+          <Image
+            accessibilityIgnoresInvertColors
+            source={require("../assets/images/perun-emblem-burgundy.png")}
+            style={styles.emblem}
+          />
+        </View>
 
-        <View style={styles.fields}>
-          <View>
-            <Text style={styles.label}>EMAIL</Text>
-            <TextInput
-              autoCapitalize="none"
-              autoComplete="email"
-              keyboardType="email-address"
-              onChangeText={setEmail}
-              placeholder=""
-              style={styles.emailInput}
-              value={email}
-            />
-          </View>
+        <View style={styles.content}>
+          <Image
+            accessibilityIgnoresInvertColors
+            source={require("../assets/images/perun-wordmark-burgundy.png")}
+            style={styles.wordmark}
+          />
 
-          <View>
-            <Text style={styles.label}>LOZINKA</Text>
-            <View
-              style={[
-                styles.passwordField,
-                passwordFocused && styles.passwordFieldFocused,
-              ]}
-            >
+          <View style={styles.fields}>
+            <View>
+              <Text style={styles.label}>EMAIL</Text>
               <TextInput
                 autoCapitalize="none"
-                autoComplete="password"
-                onBlur={() => setPasswordFocused(false)}
-                onChangeText={setPassword}
-                onFocus={() => setPasswordFocused(true)}
-                secureTextEntry={!passwordVisible}
-                style={styles.passwordInput}
-                value={password}
+                autoComplete="email"
+                keyboardType="email-address"
+                onChangeText={setEmail}
+                style={styles.emailInput}
+                value={email}
               />
-              <Pressable
-                accessibilityRole="button"
-                onPress={() => setPasswordVisible((visible) => !visible)}
-                style={({ pressed }) => pressed && styles.pressed}
+            </View>
+
+            <View>
+              <Text style={styles.label}>LOZINKA</Text>
+              <View
+                style={[
+                  styles.passwordField,
+                  passwordFocused && styles.passwordFieldFocused,
+                ]}
               >
-                <Text style={styles.showPassword}>
-                  {passwordVisible ? "Sakrij" : "Prikaži"}
-                </Text>
-              </Pressable>
+                <TextInput
+                  autoCapitalize="none"
+                  autoComplete="password"
+                  onBlur={() => setPasswordFocused(false)}
+                  onChangeText={setPassword}
+                  onFocus={() => setPasswordFocused(true)}
+                  secureTextEntry={!passwordVisible}
+                  style={styles.passwordInput}
+                  value={password}
+                />
+                <Pressable
+                  accessibilityRole="button"
+                  onPress={() => setPasswordVisible((visible) => !visible)}
+                  style={({ pressed }) => pressed && styles.pressed}
+                >
+                  <Text style={styles.showPassword}>
+                    {passwordVisible ? "Sakrij" : "Prikaži"}
+                  </Text>
+                </Pressable>
+              </View>
             </View>
           </View>
-        </View>
 
-        <Pressable
-          accessibilityRole="button"
-          onPress={() => {}}
-          style={({ pressed }) => [styles.forgotPassword, pressed && styles.pressed]}
-        >
-          <Text style={styles.link}>Zaboravljena lozinka?</Text>
-        </Pressable>
+          <Pressable
+            accessibilityRole="button"
+            onPress={() => router.push("/forgot-password")}
+            style={({ pressed }) => [
+              styles.forgotPassword,
+              pressed && styles.pressed,
+            ]}
+          >
+            <Text style={styles.link}>Zaboravljena lozinka?</Text>
+          </Pressable>
 
-        {error && <Text style={styles.error}>{error}</Text>}
+          {error && <Text style={styles.error}>{error}</Text>}
 
-        <Pressable
-          accessibilityRole="button"
-          accessibilityState={{ disabled: loading }}
-          disabled={loading}
-          onPress={handleLogin}
-          style={({ pressed }) => [
-            styles.loginButton,
-            loading && styles.disabled,
-            pressed && styles.pressed,
-          ]}
-        >
-          <Text style={styles.loginButtonText}>
-            {loading ? "Učitavanje…" : "Prijavi se"}
-          </Text>
-        </Pressable>
+          <Pressable
+            accessibilityRole="button"
+            accessibilityState={{ disabled: loading }}
+            disabled={loading}
+            onPress={handleLogin}
+            style={({ pressed }) => [
+              styles.loginButton,
+              loading && styles.disabled,
+              pressed && styles.pressed,
+            ]}
+          >
+            <Text style={styles.loginButtonText}>
+              {loading ? "Učitavanje…" : "Prijavi se"}
+            </Text>
+          </Pressable>
 
-        <Text style={styles.footer}>
-          Nemaš nalog? <Text style={styles.joinLink}>Pridruži se</Text>
-        </Text>
-      </View>
-    </View>
+          <View style={styles.footer}>
+            <Text style={styles.footerText}>Nemaš nalog? </Text>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/register")}
+              style={({ pressed }) => pressed && styles.pressed}
+            >
+              <Text style={styles.joinLink}>Pridruži se</Text>
+            </Pressable>
+          </View>
+        </View>
+      </ScrollView>
+    </KeyboardAvoidingView>
   );
 }
 
@@ -145,6 +158,9 @@
     flex: 1,
     paddingTop: 30,
   },
+  scrollContent: {
+    flexGrow: 1,
+  },
   hero: {
     alignItems: "center",
     height: 200,
@@ -158,6 +174,7 @@
   content: {
     flex: 1,
     paddingHorizontal: Spacing.loginHorizontal,
+    paddingBottom: Spacing.section.relaxed,
   },
   wordmark: {
     alignSelf: "center",
@@ -166,16 +183,6 @@
     resizeMode: "contain",
     width: 176,
   },
-  tagline: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[400],
-    fontSize: 14,
-    fontWeight: "400",
-    lineHeight: 20.3,
-    marginTop: 14,
-    paddingHorizontal: 12,
-    textAlign: "center",
-  },
   fields: {
     gap: 13,
     marginTop: 24,
@@ -253,16 +260,21 @@
     color: Colors.surface,
   },
   footer: {
+    alignItems: "center",
+    flexDirection: "row",
+    justifyContent: "center",
+    marginTop: 18,
+  },
+  footerText: {
     color: Colors.inkMuted,
     fontFamily: FontFamilies.hanken[400],
     fontSize: 13.5,
     fontWeight: "400",
-    marginTop: 18,
-    textAlign: "center",
   },
   joinLink: {
     color: Colors.burgundy,
     fontFamily: FontFamilies.hanken[700],
+    fontSize: 13.5,
     fontWeight: "700",
   },
   disabled: {

exec
/bin/zsh -lc "sed -n '1,360p' app/login.tsx" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
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
  joinLink: {
    color: Colors.burgundy,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 13.5,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.92,
  },
});

diff --git a/app/login.tsx b/app/login.tsx
index 262794f4fe932f38798b1689211119b6ac788692..e16020ead53ade22b107dd7daaa1af462effc3e2
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -2,7 +2,9 @@
 import { useState } from "react";
 import {
   Image,
+  KeyboardAvoidingView,
   Pressable,
+  ScrollView,
   StyleSheet,
   Text,
   TextInput,
@@ -41,101 +43,112 @@
   };
 
   return (
-    <View style={styles.screen}>
-      <View style={styles.hero}>
-        <Image
-          accessibilityIgnoresInvertColors
-          source={require("../assets/images/perun-emblem-burgundy.png")}
-          style={styles.emblem}
-        />
-      </View>
-
-      <View style={styles.content}>
-        <Image
-          accessibilityIgnoresInvertColors
-          source={require("../assets/images/perun-wordmark-burgundy.png")}
-          style={styles.wordmark}
-        />
-        <Text style={styles.tagline}>
-          Rezerviši svoj termin i budi deo ekipe ove nedelje.
-        </Text>
+    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+      <ScrollView
+        contentContainerStyle={styles.scrollContent}
+        keyboardShouldPersistTaps="handled"
+      >
+        <View style={styles.hero}>
+          <Image
+            accessibilityIgnoresInvertColors
+            source={require("../assets/images/perun-emblem-burgundy.png")}
+            style={styles.emblem}
+          />
+        </View>
 
-        <View style={styles.fields}>
-          <View>
-            <Text style={styles.label}>EMAIL</Text>
-            <TextInput
-              autoCapitalize="none"
-              autoComplete="email"
-              keyboardType="email-address"
-              onChangeText={setEmail}
-              placeholder=""
-              style={styles.emailInput}
-              value={email}
-            />
-          </View>
+        <View style={styles.content}>
+          <Image
+            accessibilityIgnoresInvertColors
+            source={require("../assets/images/perun-wordmark-burgundy.png")}
+            style={styles.wordmark}
+          />
 
-          <View>
-            <Text style={styles.label}>LOZINKA</Text>
-            <View
-              style={[
-                styles.passwordField,
-                passwordFocused && styles.passwordFieldFocused,
-              ]}
-            >
+          <View style={styles.fields}>
+            <View>
+              <Text style={styles.label}>EMAIL</Text>
               <TextInput
                 autoCapitalize="none"
-                autoComplete="password"
-                onBlur={() => setPasswordFocused(false)}
-                onChangeText={setPassword}
-                onFocus={() => setPasswordFocused(true)}
-                secureTextEntry={!passwordVisible}
-                style={styles.passwordInput}
-                value={password}
+                autoComplete="email"
+                keyboardType="email-address"
+                onChangeText={setEmail}
+                style={styles.emailInput}
+                value={email}
               />
-              <Pressable
-                accessibilityRole="button"
-                onPress={() => setPasswordVisible((visible) => !visible)}
-                style={({ pressed }) => pressed && styles.pressed}
+            </View>
+
+            <View>
+              <Text style={styles.label}>LOZINKA</Text>
+              <View
+                style={[
+                  styles.passwordField,
+                  passwordFocused && styles.passwordFieldFocused,
+                ]}
               >
-                <Text style={styles.showPassword}>
-                  {passwordVisible ? "Sakrij" : "Prikaži"}
-                </Text>
-              </Pressable>
+                <TextInput
+                  autoCapitalize="none"
+                  autoComplete="password"
+                  onBlur={() => setPasswordFocused(false)}
+                  onChangeText={setPassword}
+                  onFocus={() => setPasswordFocused(true)}
+                  secureTextEntry={!passwordVisible}
+                  style={styles.passwordInput}
+                  value={password}
+                />
+                <Pressable
+                  accessibilityRole="button"
+                  onPress={() => setPasswordVisible((visible) => !visible)}
+                  style={({ pressed }) => pressed && styles.pressed}
+                >
+                  <Text style={styles.showPassword}>
+                    {passwordVisible ? "Sakrij" : "Prikaži"}
+                  </Text>
+                </Pressable>
+              </View>
             </View>
           </View>
-        </View>
 
-        <Pressable
-          accessibilityRole="button"
-          onPress={() => {}}
-          style={({ pressed }) => [styles.forgotPassword, pressed && styles.pressed]}
-        >
-          <Text style={styles.link}>Zaboravljena lozinka?</Text>
-        </Pressable>
+          <Pressable
+            accessibilityRole="button"
+            onPress={() => router.push("/forgot-password")}
+            style={({ pressed }) => [
+              styles.forgotPassword,
+              pressed && styles.pressed,
+            ]}
+          >
+            <Text style={styles.link}>Zaboravljena lozinka?</Text>
+          </Pressable>
 
-        {error && <Text style={styles.error}>{error}</Text>}
+          {error && <Text style={styles.error}>{error}</Text>}
 
-        <Pressable
-          accessibilityRole="button"
-          accessibilityState={{ disabled: loading }}
-          disabled={loading}
-          onPress={handleLogin}
-          style={({ pressed }) => [
-            styles.loginButton,
-            loading && styles.disabled,
-            pressed && styles.pressed,
-          ]}
-        >
-          <Text style={styles.loginButtonText}>
-            {loading ? "Učitavanje…" : "Prijavi se"}
-          </Text>
-        </Pressable>
+          <Pressable
+            accessibilityRole="button"
+            accessibilityState={{ disabled: loading }}
+            disabled={loading}
+            onPress={handleLogin}
+            style={({ pressed }) => [
+              styles.loginButton,
+              loading && styles.disabled,
+              pressed && styles.pressed,
+            ]}
+          >
+            <Text style={styles.loginButtonText}>
+              {loading ? "Učitavanje…" : "Prijavi se"}
+            </Text>
+          </Pressable>
 
-        <Text style={styles.footer}>
-          Nemaš nalog? <Text style={styles.joinLink}>Pridruži se</Text>
-        </Text>
-      </View>
-    </View>
+          <View style={styles.footer}>
+            <Text style={styles.footerText}>Nemaš nalog? </Text>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/register")}
+              style={({ pressed }) => pressed && styles.pressed}
+            >
+              <Text style={styles.joinLink}>Pridruži se</Text>
+            </Pressable>
+          </View>
+        </View>
+      </ScrollView>
+    </KeyboardAvoidingView>
   );
 }
 
@@ -145,6 +158,9 @@
     flex: 1,
     paddingTop: 30,
   },
+  scrollContent: {
+    flexGrow: 1,
+  },
   hero: {
     alignItems: "center",
     height: 200,
@@ -158,6 +174,7 @@
   content: {
     flex: 1,
     paddingHorizontal: Spacing.loginHorizontal,
+    paddingBottom: Spacing.section.relaxed,
   },
   wordmark: {
     alignSelf: "center",
@@ -166,16 +183,6 @@
     resizeMode: "contain",
     width: 176,
   },
-  tagline: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[400],
-    fontSize: 14,
-    fontWeight: "400",
-    lineHeight: 20.3,
-    marginTop: 14,
-    paddingHorizontal: 12,
-    textAlign: "center",
-  },
   fields: {
     gap: 13,
     marginTop: 24,
@@ -253,16 +260,21 @@
     color: Colors.surface,
   },
   footer: {
+    alignItems: "center",
+    flexDirection: "row",
+    justifyContent: "center",
+    marginTop: 18,
+  },
+  footerText: {
     color: Colors.inkMuted,
     fontFamily: FontFamilies.hanken[400],
     fontSize: 13.5,
     fontWeight: "400",
-    marginTop: 18,
-    textAlign: "center",
   },
   joinLink: {
     color: Colors.burgundy,
     fontFamily: FontFamilies.hanken[700],
+    fontSize: 13.5,
     fontWeight: "700",
   },
   disabled: {

exec
/bin/zsh -lc "sed -n '1,220p' eslint.config.js && npx eslint src/contexts/AuthContext.tsx" in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/login.tsx b/app/login.tsx
index 262794f4fe932f38798b1689211119b6ac788692..e16020ead53ade22b107dd7daaa1af462effc3e2
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -2,7 +2,9 @@
 import { useState } from "react";
 import {
   Image,
+  KeyboardAvoidingView,
   Pressable,
+  ScrollView,
   StyleSheet,
   Text,
   TextInput,
@@ -41,101 +43,112 @@
   };
 
   return (
-    <View style={styles.screen}>
-      <View style={styles.hero}>
-        <Image
-          accessibilityIgnoresInvertColors
-          source={require("../assets/images/perun-emblem-burgundy.png")}
-          style={styles.emblem}
-        />
-      </View>
-
-      <View style={styles.content}>
-        <Image
-          accessibilityIgnoresInvertColors
-          source={require("../assets/images/perun-wordmark-burgundy.png")}
-          style={styles.wordmark}
-        />
-        <Text style={styles.tagline}>
-          Rezerviši svoj termin i budi deo ekipe ove nedelje.
-        </Text>
+    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+      <ScrollView
+        contentContainerStyle={styles.scrollContent}
+        keyboardShouldPersistTaps="handled"
+      >
+        <View style={styles.hero}>
+          <Image
+            accessibilityIgnoresInvertColors
+            source={require("../assets/images/perun-emblem-burgundy.png")}
+            style={styles.emblem}
+          />
+        </View>
 
-        <View style={styles.fields}>
-          <View>
-            <Text style={styles.label}>EMAIL</Text>
-            <TextInput
-              autoCapitalize="none"
-              autoComplete="email"
-              keyboardType="email-address"
-              onChangeText={setEmail}
-              placeholder=""
-              style={styles.emailInput}
-              value={email}
-            />
-          </View>
+        <View style={styles.content}>
+          <Image
+            accessibilityIgnoresInvertColors
+            source={require("../assets/images/perun-wordmark-burgundy.png")}
+            style={styles.wordmark}
+          />
 
-          <View>
-            <Text style={styles.label}>LOZINKA</Text>
-            <View
-              style={[
-                styles.passwordField,
-                passwordFocused && styles.passwordFieldFocused,
-              ]}
-            >
+          <View style={styles.fields}>
+            <View>
+              <Text style={styles.label}>EMAIL</Text>
               <TextInput
                 autoCapitalize="none"
-                autoComplete="password"
-                onBlur={() => setPasswordFocused(false)}
-                onChangeText={setPassword}
-                onFocus={() => setPasswordFocused(true)}
-                secureTextEntry={!passwordVisible}
-                style={styles.passwordInput}
-                value={password}
+                autoComplete="email"
+                keyboardType="email-address"
+                onChangeText={setEmail}
+                style={styles.emailInput}
+                value={email}
               />
-              <Pressable
-                accessibilityRole="button"
-                onPress={() => setPasswordVisible((visible) => !visible)}
-                style={({ pressed }) => pressed && styles.pressed}
+            </View>
+
+            <View>
+              <Text style={styles.label}>LOZINKA</Text>
+              <View
+                style={[
+                  styles.passwordField,
+                  passwordFocused && styles.passwordFieldFocused,
+                ]}
               >
-                <Text style={styles.showPassword}>
-                  {passwordVisible ? "Sakrij" : "Prikaži"}
-                </Text>
-              </Pressable>
+                <TextInput
+                  autoCapitalize="none"
+                  autoComplete="password"
+                  onBlur={() => setPasswordFocused(false)}
+                  onChangeText={setPassword}
+                  onFocus={() => setPasswordFocused(true)}
+                  secureTextEntry={!passwordVisible}
+                  style={styles.passwordInput}
+                  value={password}
+                />
+                <Pressable
+                  accessibilityRole="button"
+                  onPress={() => setPasswordVisible((visible) => !visible)}
+                  style={({ pressed }) => pressed && styles.pressed}
+                >
+                  <Text style={styles.showPassword}>
+                    {passwordVisible ? "Sakrij" : "Prikaži"}
+                  </Text>
+                </Pressable>
+              </View>
             </View>
           </View>
-        </View>
 
-        <Pressable
-          accessibilityRole="button"
-          onPress={() => {}}
-          style={({ pressed }) => [styles.forgotPassword, pressed && styles.pressed]}
-        >
-          <Text style={styles.link}>Zaboravljena lozinka?</Text>
-        </Pressable>
+          <Pressable
+            accessibilityRole="button"
+            onPress={() => router.push("/forgot-password")}
+            style={({ pressed }) => [
+              styles.forgotPassword,
+              pressed && styles.pressed,
+            ]}
+          >
+            <Text style={styles.link}>Zaboravljena lozinka?</Text>
+          </Pressable>
 
-        {error && <Text style={styles.error}>{error}</Text>}
+          {error && <Text style={styles.error}>{error}</Text>}
 
-        <Pressable
-          accessibilityRole="button"
-          accessibilityState={{ disabled: loading }}
-          disabled={loading}
-          onPress={handleLogin}
-          style={({ pressed }) => [
-            styles.loginButton,
-            loading && styles.disabled,
-            pressed && styles.pressed,
-          ]}
-        >
-          <Text style={styles.loginButtonText}>
-            {loading ? "Učitavanje…" : "Prijavi se"}
-          </Text>
-        </Pressable>
+          <Pressable
+            accessibilityRole="button"
+            accessibilityState={{ disabled: loading }}
+            disabled={loading}
+            onPress={handleLogin}
+            style={({ pressed }) => [
+              styles.loginButton,
+              loading && styles.disabled,
+              pressed && styles.pressed,
+            ]}
+          >
+            <Text style={styles.loginButtonText}>
+              {loading ? "Učitavanje…" : "Prijavi se"}
+            </Text>
+          </Pressable>
 
-        <Text style={styles.footer}>
-          Nemaš nalog? <Text style={styles.joinLink}>Pridruži se</Text>
-        </Text>
-      </View>
-    </View>
+          <View style={styles.footer}>
+            <Text style={styles.footerText}>Nemaš nalog? </Text>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/register")}
+              style={({ pressed }) => pressed && styles.pressed}
+            >
+              <Text style={styles.joinLink}>Pridruži se</Text>
+            </Pressable>
+          </View>
+        </View>
+      </ScrollView>
+    </KeyboardAvoidingView>
   );
 }
 
@@ -145,6 +158,9 @@
     flex: 1,
     paddingTop: 30,
   },
+  scrollContent: {
+    flexGrow: 1,
+  },
   hero: {
     alignItems: "center",
     height: 200,
@@ -158,6 +174,7 @@
   content: {
     flex: 1,
     paddingHorizontal: Spacing.loginHorizontal,
+    paddingBottom: Spacing.section.relaxed,
   },
   wordmark: {
     alignSelf: "center",
@@ -166,16 +183,6 @@
     resizeMode: "contain",
     width: 176,
   },
-  tagline: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[400],
-    fontSize: 14,
-    fontWeight: "400",
-    lineHeight: 20.3,
-    marginTop: 14,
-    paddingHorizontal: 12,
-    textAlign: "center",
-  },
   fields: {
     gap: 13,
     marginTop: 24,
@@ -253,16 +260,21 @@
     color: Colors.surface,
   },
   footer: {
+    alignItems: "center",
+    flexDirection: "row",
+    justifyContent: "center",
+    marginTop: 18,
+  },
+  footerText: {
     color: Colors.inkMuted,
     fontFamily: FontFamilies.hanken[400],
     fontSize: 13.5,
     fontWeight: "400",
-    marginTop: 18,
-    textAlign: "center",
   },
   joinLink: {
     color: Colors.burgundy,
     fontFamily: FontFamilies.hanken[700],
+    fontSize: 13.5,
     fontWeight: "700",
   },
   disabled: {

 succeeded in 1590ms:

/Users/uros/Documents/Private/Projects/PerunApp/src/contexts/AuthContext.tsx
  110:5  warning  React Hook useMemo has a missing dependency: 'updateProfile'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)


apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/src/contexts/AuthContext.tsx
diff --git a/app/login.tsx b/app/login.tsx
index 262794f4fe932f38798b1689211119b6ac788692..e16020ead53ade22b107dd7daaa1af462effc3e2
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -2,7 +2,9 @@
 import { useState } from "react";
 import {
   Image,
+  KeyboardAvoidingView,
   Pressable,
+  ScrollView,
   StyleSheet,
   Text,
   TextInput,
@@ -41,101 +43,112 @@
   };
 
   return (
-    <View style={styles.screen}>
-      <View style={styles.hero}>
-        <Image
-          accessibilityIgnoresInvertColors
-          source={require("../assets/images/perun-emblem-burgundy.png")}
-          style={styles.emblem}
-        />
-      </View>
-
-      <View style={styles.content}>
-        <Image
-          accessibilityIgnoresInvertColors
-          source={require("../assets/images/perun-wordmark-burgundy.png")}
-          style={styles.wordmark}
-        />
-        <Text style={styles.tagline}>
-          Rezerviši svoj termin i budi deo ekipe ove nedelje.
-        </Text>
+    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+      <ScrollView
+        contentContainerStyle={styles.scrollContent}
+        keyboardShouldPersistTaps="handled"
+      >
+        <View style={styles.hero}>
+          <Image
+            accessibilityIgnoresInvertColors
+            source={require("../assets/images/perun-emblem-burgundy.png")}
+            style={styles.emblem}
+          />
+        </View>
 
-        <View style={styles.fields}>
-          <View>
-            <Text style={styles.label}>EMAIL</Text>
-            <TextInput
-              autoCapitalize="none"
-              autoComplete="email"
-              keyboardType="email-address"
-              onChangeText={setEmail}
-              placeholder=""
-              style={styles.emailInput}
-              value={email}
-            />
-          </View>
+        <View style={styles.content}>
+          <Image
+            accessibilityIgnoresInvertColors
+            source={require("../assets/images/perun-wordmark-burgundy.png")}
+            style={styles.wordmark}
+          />
 
-          <View>
-            <Text style={styles.label}>LOZINKA</Text>
-            <View
-              style={[
-                styles.passwordField,
-                passwordFocused && styles.passwordFieldFocused,
-              ]}
-            >
+          <View style={styles.fields}>
+            <View>
+              <Text style={styles.label}>EMAIL</Text>
               <TextInput
                 autoCapitalize="none"
-                autoComplete="password"
-                onBlur={() => setPasswordFocused(false)}
-                onChangeText={setPassword}
-                onFocus={() => setPasswordFocused(true)}
-                secureTextEntry={!passwordVisible}
-                style={styles.passwordInput}
-                value={password}
+                autoComplete="email"
+                keyboardType="email-address"
+                onChangeText={setEmail}
+                style={styles.emailInput}
+                value={email}
               />
-              <Pressable
-                accessibilityRole="button"
-                onPress={() => setPasswordVisible((visible) => !visible)}
-                style={({ pressed }) => pressed && styles.pressed}
+            </View>
+
+            <View>
+              <Text style={styles.label}>LOZINKA</Text>
+              <View
+                style={[
+                  styles.passwordField,
+                  passwordFocused && styles.passwordFieldFocused,
+                ]}
               >
-                <Text style={styles.showPassword}>
-                  {passwordVisible ? "Sakrij" : "Prikaži"}
-                </Text>
-              </Pressable>
+                <TextInput
+                  autoCapitalize="none"
+                  autoComplete="password"
+                  onBlur={() => setPasswordFocused(false)}
+                  onChangeText={setPassword}
+                  onFocus={() => setPasswordFocused(true)}
+                  secureTextEntry={!passwordVisible}
+                  style={styles.passwordInput}
+                  value={password}
+                />
+                <Pressable
+                  accessibilityRole="button"
+                  onPress={() => setPasswordVisible((visible) => !visible)}
+                  style={({ pressed }) => pressed && styles.pressed}
+                >
+                  <Text style={styles.showPassword}>
+                    {passwordVisible ? "Sakrij" : "Prikaži"}
+                  </Text>
+                </Pressable>
+              </View>
             </View>
           </View>
-        </View>
 
-        <Pressable
-          accessibilityRole="button"
-          onPress={() => {}}
-          style={({ pressed }) => [styles.forgotPassword, pressed && styles.pressed]}
-        >
-          <Text style={styles.link}>Zaboravljena lozinka?</Text>
-        </Pressable>
+          <Pressable
+            accessibilityRole="button"
+            onPress={() => router.push("/forgot-password")}
+            style={({ pressed }) => [
+              styles.forgotPassword,
+              pressed && styles.pressed,
+            ]}
+          >
+            <Text style={styles.link}>Zaboravljena lozinka?</Text>
+          </Pressable>
 
-        {error && <Text style={styles.error}>{error}</Text>}
+          {error && <Text style={styles.error}>{error}</Text>}
 
-        <Pressable
-          accessibilityRole="button"
-          accessibilityState={{ disabled: loading }}
-          disabled={loading}
-          onPress={handleLogin}
-          style={({ pressed }) => [
-            styles.loginButton,
-            loading && styles.disabled,
-            pressed && styles.pressed,
-          ]}
-        >
-          <Text style={styles.loginButtonText}>
-            {loading ? "Učitavanje…" : "Prijavi se"}
-          </Text>
-        </Pressable>
+          <Pressable
+            accessibilityRole="button"
+            accessibilityState={{ disabled: loading }}
+            disabled={loading}
+            onPress={handleLogin}
+            style={({ pressed }) => [
+              styles.loginButton,
+              loading && styles.disabled,
+              pressed && styles.pressed,
+            ]}
+          >
+            <Text style={styles.loginButtonText}>
+              {loading ? "Učitavanje…" : "Prijavi se"}
+            </Text>
+          </Pressable>
 
-        <Text style={styles.footer}>
-          Nemaš nalog? <Text style={styles.joinLink}>Pridruži se</Text>
-        </Text>
-      </View>
-    </View>
+          <View style={styles.footer}>
+            <Text style={styles.footerText}>Nemaš nalog? </Text>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/register")}
+              style={({ pressed }) => pressed && styles.pressed}
+            >
+              <Text style={styles.joinLink}>Pridruži se</Text>
+            </Pressable>
+          </View>
+        </View>
+      </ScrollView>
+    </KeyboardAvoidingView>
   );
 }
 
@@ -145,6 +158,9 @@
     flex: 1,
     paddingTop: 30,
   },
+  scrollContent: {
+    flexGrow: 1,
+  },
   hero: {
     alignItems: "center",
     height: 200,
@@ -158,6 +174,7 @@
   content: {
     flex: 1,
     paddingHorizontal: Spacing.loginHorizontal,
+    paddingBottom: Spacing.section.relaxed,
   },
   wordmark: {
     alignSelf: "center",
@@ -166,16 +183,6 @@
     resizeMode: "contain",
     width: 176,
   },
-  tagline: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[400],
-    fontSize: 14,
-    fontWeight: "400",
-    lineHeight: 20.3,
-    marginTop: 14,
-    paddingHorizontal: 12,
-    textAlign: "center",
-  },
   fields: {
     gap: 13,
     marginTop: 24,
@@ -253,16 +260,21 @@
     color: Colors.surface,
   },
   footer: {
+    alignItems: "center",
+    flexDirection: "row",
+    justifyContent: "center",
+    marginTop: 18,
+  },
+  footerText: {
     color: Colors.inkMuted,
     fontFamily: FontFamilies.hanken[400],
     fontSize: 13.5,
     fontWeight: "400",
-    marginTop: 18,
-    textAlign: "center",
   },
   joinLink: {
     color: Colors.burgundy,
     fontFamily: FontFamilies.hanken[700],
+    fontSize: 13.5,
     fontWeight: "700",
   },
   disabled: {
diff --git a/src/contexts/AuthContext.tsx b/src/contexts/AuthContext.tsx
index dc46095c4c7d6ec506d502e16f7e18ff8a1da222..7f94981b30cdce768166be804520f30859d378d9
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -1,14 +1,21 @@
 import { Session } from "@supabase/supabase-js";
-import { createContext, useEffect, useMemo, useState } from "react";
+import { createContext, useCallback, useEffect, useMemo, useState } from "react";
 
+import { supabase } from "@/services/supabase/client";
 import { Profile } from "@/types/Profile";
-import { supabase } from "@/services/supabase/client";
 
 type AuthContextType = {
   session: Session | null;
   loading: boolean;
   profile: Profile | null;
   login: (email: string, password: string) => Promise<void>;
+  register: (
+    email: string,
+    password: string,
+    firstName: string,
+    lastName: string,
+  ) => Promise<void>;
+  resetPassword: (email: string) => Promise<void>;
   logout: () => Promise<void>;
   updateProfile: (patch: Partial<Profile>) => Promise<void>;
 };
@@ -18,6 +25,8 @@
   loading: true,
   profile: null,
   login: async () => {},
+  register: async () => {},
+  resetPassword: async () => {},
   logout: async () => {},
   updateProfile: async () => {},
 });
@@ -27,6 +36,16 @@
   const [loading, setLoading] = useState(true);
   const [profile, setProfile] = useState<Profile | null>(null);
 
+  const fetchProfile = useCallback(async (userId: string) => {
+    const { data } = await supabase
+      .from("profiles")
+      .select("*")
+      .eq("id", userId)
+      .single();
+
+    setProfile(data || null);
+  }, []);
+
   useEffect(() => {
     supabase.auth.getSession().then(({ data }) => {
       setSession(data.session);
@@ -48,19 +67,9 @@
     );
 
     return () => listener.subscription.unsubscribe();
-  }, []);
-
-  const fetchProfile = async (userId: string) => {
-    const { data } = await supabase
-      .from("profiles")
-      .select("*")
-      .eq("id", userId)
-      .single();
+  }, [fetchProfile]);
 
-    setProfile(data || null);
-  };
-
-  const login = async (email: string, password: string) => {
+  const login = useCallback(async (email: string, password: string) => {
     const { error } = await supabase.auth.signInWithPassword({
       email,
       password,
@@ -69,9 +78,42 @@
     if (error) {
       throw error;
     }
-  };
+  }, []);
+
+  const register = useCallback(
+    async (
+      email: string,
+      password: string,
+      firstName: string,
+      lastName: string,
+    ) => {
+      const { error } = await supabase.auth.signUp({
+        email,
+        password,
+        options: {
+          data: {
+            first_name: firstName,
+            last_name: lastName,
+          },
+        },
+      });
+
+      if (error) {
+        throw error;
+      }
+    },
+    [],
+  );
+
+  const resetPassword = useCallback(async (email: string) => {
+    const { error } = await supabase.auth.resetPasswordForEmail(email);
+
+    if (error) {
+      throw error;
+    }
+  }, []);
 
-  const logout = async () => {
+  const logout = useCallback(async () => {
     const { error } = await supabase.auth.signOut();
 
     if (error) {
@@ -79,24 +121,27 @@
     }
 
     setSession(null);
-  };
+  }, []);
 
-  const updateProfile = async (patch: Partial<Profile>) => {
-    if (!session) {
-      throw new Error("No active session");
-    }
+  const updateProfile = useCallback(
+    async (patch: Partial<Profile>) => {
+      if (!session) {
+        throw new Error("No active session");
+      }
 
-    const { error } = await supabase
-      .from("profiles")
-      .update(patch)
-      .eq("id", session.user.id);
+      const { error } = await supabase
+        .from("profiles")
+        .update(patch)
+        .eq("id", session.user.id);
 
-    if (error) {
-      throw error;
-    }
+      if (error) {
+        throw error;
+      }
 
-    await fetchProfile(session.user.id);
-  };
+      await fetchProfile(session.user.id);
+    },
+    [fetchProfile, session],
+  );
 
   const value = useMemo(
     () => ({
@@ -104,10 +149,21 @@
       loading,
       profile,
       login,
+      register,
+      resetPassword,
       logout,
       updateProfile,
     }),
-    [session, loading, profile],
+    [
+      session,
+      loading,
+      profile,
+      login,
+      register,
+      resetPassword,
+      logout,
+      updateProfile,
+    ],
   );
 
   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

diff --git a/app/login.tsx b/app/login.tsx
index 262794f4fe932f38798b1689211119b6ac788692..e16020ead53ade22b107dd7daaa1af462effc3e2
--- a/app/login.tsx
+++ b/app/login.tsx
@@ -2,7 +2,9 @@
 import { useState } from "react";
 import {
   Image,
+  KeyboardAvoidingView,
   Pressable,
+  ScrollView,
   StyleSheet,
   Text,
   TextInput,
@@ -41,101 +43,112 @@
   };
 
   return (
-    <View style={styles.screen}>
-      <View style={styles.hero}>
-        <Image
-          accessibilityIgnoresInvertColors
-          source={require("../assets/images/perun-emblem-burgundy.png")}
-          style={styles.emblem}
-        />
-      </View>
-
-      <View style={styles.content}>
-        <Image
-          accessibilityIgnoresInvertColors
-          source={require("../assets/images/perun-wordmark-burgundy.png")}
-          style={styles.wordmark}
-        />
-        <Text style={styles.tagline}>
-          Rezerviši svoj termin i budi deo ekipe ove nedelje.
-        </Text>
+    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
+      <ScrollView
+        contentContainerStyle={styles.scrollContent}
+        keyboardShouldPersistTaps="handled"
+      >
+        <View style={styles.hero}>
+          <Image
+            accessibilityIgnoresInvertColors
+            source={require("../assets/images/perun-emblem-burgundy.png")}
+            style={styles.emblem}
+          />
+        </View>
 
-        <View style={styles.fields}>
-          <View>
-            <Text style={styles.label}>EMAIL</Text>
-            <TextInput
-              autoCapitalize="none"
-              autoComplete="email"
-              keyboardType="email-address"
-              onChangeText={setEmail}
-              placeholder=""
-              style={styles.emailInput}
-              value={email}
-            />
-          </View>
+        <View style={styles.content}>
+          <Image
+            accessibilityIgnoresInvertColors
+            source={require("../assets/images/perun-wordmark-burgundy.png")}
+            style={styles.wordmark}
+          />
 
-          <View>
-            <Text style={styles.label}>LOZINKA</Text>
-            <View
-              style={[
-                styles.passwordField,
-                passwordFocused && styles.passwordFieldFocused,
-              ]}
-            >
+          <View style={styles.fields}>
+            <View>
+              <Text style={styles.label}>EMAIL</Text>
               <TextInput
                 autoCapitalize="none"
-                autoComplete="password"
-                onBlur={() => setPasswordFocused(false)}
-                onChangeText={setPassword}
-                onFocus={() => setPasswordFocused(true)}
-                secureTextEntry={!passwordVisible}
-                style={styles.passwordInput}
-                value={password}
+                autoComplete="email"
+                keyboardType="email-address"
+                onChangeText={setEmail}
+                style={styles.emailInput}
+                value={email}
               />
-              <Pressable
-                accessibilityRole="button"
-                onPress={() => setPasswordVisible((visible) => !visible)}
-                style={({ pressed }) => pressed && styles.pressed}
+            </View>
+
+            <View>
+              <Text style={styles.label}>LOZINKA</Text>
+              <View
+                style={[
+                  styles.passwordField,
+                  passwordFocused && styles.passwordFieldFocused,
+                ]}
               >
-                <Text style={styles.showPassword}>
-                  {passwordVisible ? "Sakrij" : "Prikaži"}
-                </Text>
-              </Pressable>
+                <TextInput
+                  autoCapitalize="none"
+                  autoComplete="password"
+                  onBlur={() => setPasswordFocused(false)}
+                  onChangeText={setPassword}
+                  onFocus={() => setPasswordFocused(true)}
+                  secureTextEntry={!passwordVisible}
+                  style={styles.passwordInput}
+                  value={password}
+                />
+                <Pressable
+                  accessibilityRole="button"
+                  onPress={() => setPasswordVisible((visible) => !visible)}
+                  style={({ pressed }) => pressed && styles.pressed}
+                >
+                  <Text style={styles.showPassword}>
+                    {passwordVisible ? "Sakrij" : "Prikaži"}
+                  </Text>
+                </Pressable>
+              </View>
             </View>
           </View>
-        </View>
 
-        <Pressable
-          accessibilityRole="button"
-          onPress={() => {}}
-          style={({ pressed }) => [styles.forgotPassword, pressed && styles.pressed]}
-        >
-          <Text style={styles.link}>Zaboravljena lozinka?</Text>
-        </Pressable>
+          <Pressable
+            accessibilityRole="button"
+            onPress={() => router.push("/forgot-password")}
+            style={({ pressed }) => [
+              styles.forgotPassword,
+              pressed && styles.pressed,
+            ]}
+          >
+            <Text style={styles.link}>Zaboravljena lozinka?</Text>
+          </Pressable>
 
-        {error && <Text style={styles.error}>{error}</Text>}
+          {error && <Text style={styles.error}>{error}</Text>}
 
-        <Pressable
-          accessibilityRole="button"
-          accessibilityState={{ disabled: loading }}
-          disabled={loading}
-          onPress={handleLogin}
-          style={({ pressed }) => [
-            styles.loginButton,
-            loading && styles.disabled,
-            pressed && styles.pressed,
-          ]}
-        >
-          <Text style={styles.loginButtonText}>
-            {loading ? "Učitavanje…" : "Prijavi se"}
-          </Text>
-        </Pressable>
+          <Pressable
+            accessibilityRole="button"
+            accessibilityState={{ disabled: loading }}
+            disabled={loading}
+            onPress={handleLogin}
+            style={({ pressed }) => [
+              styles.loginButton,
+              loading && styles.disabled,
+              pressed && styles.pressed,
+            ]}
+          >
+            <Text style={styles.loginButtonText}>
+              {loading ? "Učitavanje…" : "Prijavi se"}
+            </Text>
+          </Pressable>
 
-        <Text style={styles.footer}>
-          Nemaš nalog? <Text style={styles.joinLink}>Pridruži se</Text>
-        </Text>
-      </View>
-    </View>
+          <View style={styles.footer}>
+            <Text style={styles.footerText}>Nemaš nalog? </Text>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/register")}
+              style={({ pressed }) => pressed && styles.pressed}
+            >
+              <Text style={styles.joinLink}>Pridruži se</Text>
+            </Pressable>
+          </View>
+        </View>
+      </ScrollView>
+    </KeyboardAvoidingView>
   );
 }
 
@@ -145,6 +158,9 @@
     flex: 1,
     paddingTop: 30,
   },
+  scrollContent: {
+    flexGrow: 1,
+  },
   hero: {
     alignItems: "center",
     height: 200,
@@ -158,6 +174,7 @@
   content: {
     flex: 1,
     paddingHorizontal: Spacing.loginHorizontal,
+    paddingBottom: Spacing.section.relaxed,
   },
   wordmark: {
     alignSelf: "center",
@@ -166,16 +183,6 @@
     resizeMode: "contain",
     width: 176,
   },
-  tagline: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[400],
-    fontSize: 14,
-    fontWeight: "400",
-    lineHeight: 20.3,
-    marginTop: 14,
-    paddingHorizontal: 12,
-    textAlign: "center",
-  },
   fields: {
     gap: 13,
     marginTop: 24,
@@ -253,16 +260,21 @@
     color: Colors.surface,
   },
   footer: {
+    alignItems: "center",
+    flexDirection: "row",
+    justifyContent: "center",
+    marginTop: 18,
+  },
+  footerText: {
     color: Colors.inkMuted,
     fontFamily: FontFamilies.hanken[400],
     fontSize: 13.5,
     fontWeight: "400",
-    marginTop: 18,
-    textAlign: "center",
   },
   joinLink: {
     color: Colors.burgundy,
     fontFamily: FontFamilies.hanken[700],
+    fontSize: 13.5,
     fontWeight: "700",
   },
   disabled: {
diff --git a/src/contexts/AuthContext.tsx b/src/contexts/AuthContext.tsx
index dc46095c4c7d6ec506d502e16f7e18ff8a1da222..7f94981b30cdce768166be804520f30859d378d9
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -1,14 +1,21 @@
 import { Session } from "@supabase/supabase-js";
-import { createContext, useEffect, useMemo, useState } from "react";
+import { createContext, useCallback, useEffect, useMemo, useState } from "react";
 
+import { supabase } from "@/services/supabase/client";
 import { Profile } from "@/types/Profile";
-import { supabase } from "@/services/supabase/client";
 
 type AuthContextType = {
   session: Session | null;
   loading: boolean;
   profile: Profile | null;
   login: (email: string, password: string) => Promise<void>;
+  register: (
+    email: string,
+    password: string,
+    firstName: string,
+    lastName: string,
+  ) => Promise<void>;
+  resetPassword: (email: string) => Promise<void>;
   logout: () => Promise<void>;
   updateProfile: (patch: Partial<Profile>) => Promise<void>;
 };
@@ -18,6 +25,8 @@
   loading: true,
   profile: null,
   login: async () => {},
+  register: async () => {},
+  resetPassword: async () => {},
   logout: async () => {},
   updateProfile: async () => {},
 });
@@ -27,6 +36,16 @@
   const [loading, setLoading] = useState(true);
   const [profile, setProfile] = useState<Profile | null>(null);
 
+  const fetchProfile = useCallback(async (userId: string) => {
+    const { data } = await supabase
+      .from("profiles")
+      .select("*")
+      .eq("id", userId)
+      .single();
+
+    setProfile(data || null);
+  }, []);
+
   useEffect(() => {
     supabase.auth.getSession().then(({ data }) => {
       setSession(data.session);
@@ -48,19 +67,9 @@
     );
 
     return () => listener.subscription.unsubscribe();
-  }, []);
-
-  const fetchProfile = async (userId: string) => {
-    const { data } = await supabase
-      .from("profiles")
-      .select("*")
-      .eq("id", userId)
-      .single();
+  }, [fetchProfile]);
 
-    setProfile(data || null);
-  };
-
-  const login = async (email: string, password: string) => {
+  const login = useCallback(async (email: string, password: string) => {
     const { error } = await supabase.auth.signInWithPassword({
       email,
       password,
@@ -69,9 +78,42 @@
     if (error) {
       throw error;
     }
-  };
+  }, []);
+
+  const register = useCallback(
+    async (
+      email: string,
+      password: string,
+      firstName: string,
+      lastName: string,
+    ) => {
+      const { error } = await supabase.auth.signUp({
+        email,
+        password,
+        options: {
+          data: {
+            first_name: firstName,
+            last_name: lastName,
+          },
+        },
+      });
+
+      if (error) {
+        throw error;
+      }
+    },
+    [],
+  );
+
+  const resetPassword = useCallback(async (email: string) => {
+    const { error } = await supabase.auth.resetPasswordForEmail(email);
+
+    if (error) {
+      throw error;
+    }
+  }, []);
 
-  const logout = async () => {
+  const logout = useCallback(async () => {
     const { error } = await supabase.auth.signOut();
 
     if (error) {
@@ -79,24 +121,27 @@
     }
 
     setSession(null);
-  };
+  }, []);
 
-  const updateProfile = async (patch: Partial<Profile>) => {
-    if (!session) {
-      throw new Error("No active session");
-    }
+  const updateProfile = useCallback(
+    async (patch: Partial<Profile>) => {
+      if (!session) {
+        throw new Error("No active session");
+      }
 
-    const { error } = await supabase
-      .from("profiles")
-      .update(patch)
-      .eq("id", session.user.id);
+      const { error } = await supabase
+        .from("profiles")
+        .update(patch)
+        .eq("id", session.user.id);
 
-    if (error) {
-      throw error;
-    }
+      if (error) {
+        throw error;
+      }
 
-    await fetchProfile(session.user.id);
-  };
+      await fetchProfile(session.user.id);
+    },
+    [fetchProfile, session],
+  );
 
   const value = useMemo(
     () => ({
@@ -104,10 +149,21 @@
       loading,
       profile,
       login,
+      register,
+      resetPassword,
       logout,
       updateProfile,
     }),
-    [session, loading, profile],
+    [
+      session,
+      loading,
+      profile,
+      login,
+      register,
+      resetPassword,
+      logout,
+      updateProfile,
+    ],
   );
 
   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

