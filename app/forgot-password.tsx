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
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
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
                  Ako nalog postoji, poslali smo uputstva za reset lozinke na
                  tvoju email adresu.
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
