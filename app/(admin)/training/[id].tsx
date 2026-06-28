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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const formatTime = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  return digits.length > 2
    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
    : digits;
};

export default function TrainingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { trainings, loading, fetchTrainings } = useTrainings();
  const training = trainings.find((item) => item.id === id);
  const [title, setTitle] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
  const [time, setTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isOpen, setIsOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [initializedId, setInitializedId] = useState<string | null>(null);
  const isTimeValid = TIME_PATTERN.test(time.trim());

  useEffect(() => {
    if (!training || initializedId === training.id) return;

    setTitle(training.title);
    setDayOfWeek(
      TRAINING_DAYS.includes(training.day_of_week as Day)
        ? (training.day_of_week as Day)
        : "monday",
    );
    setTime(formatTime(training.time));
    setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
    setIsOpen(training.is_open);
    setInitializedId(training.id);
  }, [initializedId, training]);

  const submit = async () => {
    const normalizedTitle = title.trim();
    const normalizedTime = time.trim();

    if (!normalizedTitle || maxParticipants < 1) {
      Alert.alert(
        "Proverite podatke",
        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
      );
      return;
    }

    if (!TIME_PATTERN.test(normalizedTime)) {
      setSaveAttempted(true);
      Alert.alert(
        "Proverite vreme",
        "Vreme mora biti u formatu HH:MM (00:00–23:59).",
      );
      return;
    }

    const input: UpsertSessionInput = {
      id: isNew ? null : id,
      title: normalizedTitle,
      day_of_week: dayOfWeek,
      time: normalizedTime,
      room: null,
      duration_min: null,
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
      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
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
              onChangeText={(value) => setTime(formatTime(value))}
              placeholder="18:00"
              placeholderTextColor={Colors.inkFaint}
              keyboardType="number-pad"
              maxLength={5}
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
            disabled={submitting || (saveAttempted && !isTimeValid)}
            style={[
              styles.saveButton,
              (submitting || (saveAttempted && !isTimeValid)) &&
                styles.buttonDisabled,
            ]}
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
    flex: 1,
    gap: 7,
  },
  fieldLabel: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: Colors.inkMuted,
  },
  input: {
    minHeight: 46,
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 14,
    fontWeight: "600",
    color: Colors.ink,
  },
  stepper: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
    backgroundColor: Colors.surface,
  },
  stepButton: {
    width: 38,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonText: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 19,
    fontWeight: "700",
    color: Colors.burgundy,
  },
  stepValue: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 15,
    fontWeight: "700",
    color: Colors.ink,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderColor: Colors.goldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[16],
    backgroundColor: Colors.surfaceWarm,
    padding: Spacing.cardPadding,
  },
  statusTextBlock: {
    flex: 1,
    gap: 3,
  },
  statusTitle: {
    fontFamily: FontFamilies.bricolage[700],
    fontSize: 15,
    fontWeight: "700",
    color: Colors.ink,
  },
  statusDescription: {
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.burgundy,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
  },
  cancelButtonText: {
    ...Typography.primaryButton,
    color: Colors.burgundy,
  },
  saveButton: {
    flex: 2,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.tile[14],
    backgroundColor: Colors.burgundy,
    ...Shadows.primaryButton,
  },
  saveButtonText: {
    ...Typography.primaryButton,
    color: Colors.surface,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
