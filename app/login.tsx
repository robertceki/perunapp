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
