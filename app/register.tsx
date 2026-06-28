import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.screen}
      >
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
                <View style={styles.passwordField}>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="password"
                    onChangeText={setPassword}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.paper,
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingTop: 16,
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
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.92,
  },
});
