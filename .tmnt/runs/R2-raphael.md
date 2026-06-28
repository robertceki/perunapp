Reading additional input from stdin...
OpenAI Codex v0.142.0
--------
workdir: /Users/uros/Documents/Private/Projects/PerunApp
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: high
reasoning summaries: none
session id: 019f0a19-bef1-70a1-80f4-1af1eaaaeae5
--------
user
TASK: Token + stepper-clamp unit tests (R2)

CONTEXT
Goal file: /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/goal-redesign.md
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Test runner: Jest (npm test)
Existing test directory: src/**/__tests__
Implementation files to test:
- src/constants/Colors.ts (for token assertions)
- app/profile.tsx (for the inline clamp: Math.min(7, Math.max(bookedCount, max + delta)))

REQUIREMENTS
1. Create src/utils/limits.ts with a pure function:
   clampWeeklyLimit(current: number, delta: number, bookedCount: number, max = 7): number
   
   The function must implement the exact logic from profile.tsx line 59:
   const newValue = Math.min(7, Math.max(bookedCount, max + delta));
   
   So: clampWeeklyLimit(current, delta, bookedCount, max) should apply delta to `current` (not to `max`),
   then clamp to [bookedCount, max].
   WAIT: re-read profile.tsx line 59 carefully. It says Math.min(7, Math.max(bookedCount, max + delta)).
   - max is the current limit
   - delta is -1 or +1 (from changeLimit)
   - bookedCount is the booked sessions count
   - So: newValue = Math.min(7, Math.max(bookedCount, max + delta))
   This means: clamp (max + delta) to be >= bookedCount and <= 7.
   Function signature: clampWeeklyLimit(max: number, delta: number, bookedCount: number, maxLimit = 7): number

2. Create src/constants/__tests__/tokens.test.ts:
   Assert that Colors.ts exports these exact hex values (catches typo regressions):
   - paper: #FBF7F1
   - surface: #FFFFFF
   - surfaceWarm: #FFFDF8
   - surfaceMuted: #FAF6EF
   - ink: #221F2B
   - inkMuted: #8B8192
   - inkFaint: #9A8FA0
   - burgundy: #58003D
   - burgundyTint: #F6E9F0
   - burgundyBorder: #ECCFDF
   - burgundyText2: #9A6385
   - gold: #C6A35C
   - goldDeep: #9A7B33
   - goldTint: #F6EFDF
   - goldBorder: #E8D9B5
   - sage: #586056
   - sageTint: #EAEDE7
   - navy: #22222A
   - border: #F0E8DD
   - track: #EFE7DA
   - fieldBorder: #ECE2D4

3. Create src/utils/__tests__/limits.test.ts:
   - Test that clampWeeklyLimit cannot go below bookedCount
   - Test that clampWeeklyLimit cannot exceed maxLimit (default 7)
   - Test normal increment/decrement within range
   - Test edge case: out-of-range input is clamped
   - Include at least one test that would FAIL if the clamp logic were inverted or missing

4. Update app/profile.tsx:
   - Line 58-64: Replace the inline clamp in changeLimit with a call to clampWeeklyLimit
   - Import clampWeeklyLimit from @/utils/limits
   - No other behavior change

DEFINITION OF DONE
- npm test passes with the new token + limits tests included (current 5 tests, expect at least 7 new)
- npx tsc --noEmit clean
- A deliberately broken hex value or out-of-range expectation in the new tests would cause a failure (sanity check this)

Output: produce the test files and the updated profile.tsx line. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the current tokens, profile implementation, and Jest/TypeScript setup, then add the utility/tests and run the requested verification.
exec
/bin/zsh -lc "sed -n '1,180p' src/constants/Colors.ts && sed -n '1,130p' app/profile.tsx && find src -path '*/__tests__/*' -type f -maxdepth 6 -print && sed -n '1,220p' package.json && sed -n '1,180p' tsconfig.json" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
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
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/Colors";
import { Day, TRAINING_DAYS } from "@/constants/days";
import { Radii, Shadows } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
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
    const newValue = Math.min(7, Math.max(bookedCount, max + delta));

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
src/constants/__tests__/days.test.ts
src/utils/__tests__/week.test.ts
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
The existing `Colors` values already match the required contract. I’ll add exact-value coverage plus boundary-focused limit cases, then replace only the inline expression in `profile.tsx`.
exec
/bin/zsh -lc "sed -n '1,220p' src/constants/__tests__/days.test.ts && sed -n '1,260p' src/utils/__tests__/week.test.ts && git status --short" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
import { DAYS, TRAINING_DAYS } from "../days";

test("defines a consistent Sunday-start training week", () => {
  expect(DAYS).toEqual([
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ]);
  expect(TRAINING_DAYS).toEqual([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ]);
  expect(TRAINING_DAYS).toEqual(DAYS.filter((day) => day !== "sunday"));
});
import { TRAINING_DAYS } from "../../constants/days";
import { getCurrentWeekDates } from "../week";

const WEEK_DAYS = [...TRAINING_DAYS, "sunday"] as const;
const ONE_DAY = 24 * 60 * 60 * 1000;

test("returns exactly six training days", () => {
  const week = getCurrentWeekDates();
  const trainingDates = TRAINING_DAYS.map((day) => week[day]);

  expect(trainingDates).toHaveLength(TRAINING_DAYS.length);
  expect(trainingDates).toHaveLength(6);
  expect(trainingDates.every((date) => date instanceof Date)).toBe(true);
});

test("returns consecutive dates for the ISO week", () => {
  const week = getCurrentWeekDates(
    new Date("2026-01-14T12:00:00+01:00"),
  );

  expect(week.monday).toEqual(new Date(Date.UTC(2026, 0, 12)));
  expect(week.sunday).toEqual(new Date(Date.UTC(2026, 0, 18)));

  WEEK_DAYS.slice(1).forEach((day, index) => {
    expect(week[day].getTime() - week[WEEK_DAYS[index]].getTime()).toBe(
      ONE_DAY,
    );
  });
});

test("anchors Sunday and Monday to the correct ISO weeks", () => {
  const sundayWeek = getCurrentWeekDates(
    new Date("2026-01-11T12:00:00+01:00"),
  );
  const mondayWeek = getCurrentWeekDates(
    new Date("2026-01-12T12:00:00+01:00"),
  );

  expect(sundayWeek.monday).toEqual(new Date(Date.UTC(2026, 0, 5)));
  expect(sundayWeek.sunday).toEqual(new Date(Date.UTC(2026, 0, 11)));
  expect(mondayWeek.monday).toEqual(new Date(Date.UTC(2026, 0, 12)));
  expect(mondayWeek.sunday).toEqual(new Date(Date.UTC(2026, 0, 18)));
});

test("accepts an explicit reference date", () => {
  const referenceDate = new Date("2025-12-31T12:00:00+01:00");

  expect(getCurrentWeekDates(referenceDate).monday).toEqual(
    new Date(Date.UTC(2025, 11, 29)),
  );
});
 M .claude/agents/memory/splinter-session.md
 M app/(tabs)/_layout.tsx
 M app/_layout.tsx
 M app/login.tsx
 M package-lock.json
 M package.json
 M src/components/AlertBar.tsx
 M src/components/DayFilter.tsx
 M src/components/Header.tsx
 M src/components/TrainingCard.tsx
 M src/constants/Colors.ts
 M src/contexts/AuthContext.tsx
?? .tmnt/board-redesign.md
?? .tmnt/goal-redesign.md
?? .tmnt/runs/D1-donatello.md
?? .tmnt/runs/D2-donatello.md
?? .tmnt/runs/D2-donny.md
?? .tmnt/runs/D3-donatello.md
?? .tmnt/runs/M1-M6-codex-raw.log
?? .tmnt/runs/M1-M6-michelangelo.md
?? .tmnt/runs/M7-M8-michelangelo.md
?? .tmnt/runs/R1-raphael.md
?? .tmnt/runs/R2-raphael.md
?? app/profile.tsx
?? assets/images/perun-emblem-burgundy.png
?? assets/images/perun-emblem-cream.png
?? assets/images/perun-emblem-gold.png
?? assets/images/perun-emblem-ink.png
?? assets/images/perun-emblem-sage.png
?? assets/images/perun-wordmark-burgundy.png
?? assets/images/perun-wordmark-cream.png
?? assets/images/perun-wordmark-gold.png
?? src/components/EmptyDay.tsx
?? src/constants/spacing.ts
?? src/constants/typography.ts
?? src/utils/

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/app/profile.tsx
/Users/uros/Documents/Private/Projects/PerunApp/src/constants/__tests__/tokens.test.ts
/Users/uros/Documents/Private/Projects/PerunApp/src/utils/__tests__/limits.test.ts
/Users/uros/Documents/Private/Projects/PerunApp/src/utils/limits.ts
diff --git a/app/profile.tsx b/app/profile.tsx
index e972111a4db5c6be810f5cd547a3340f68533ce7..799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,6 +8,7 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
+import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -56,7 +57,7 @@
     });
 
   const changeLimit = (delta: number) => {
-    const newValue = Math.min(7, Math.max(bookedCount, max + delta));
+    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
     if (newValue !== max) {
       void updateProfile({ max_sessions_per_week: newValue });
diff --git a/src/constants/__tests__/tokens.test.ts b/src/constants/__tests__/tokens.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..049faa5cc8ed0f29979dde83ccb2c18d36e8cb10
--- /dev/null
+++ b/src/constants/__tests__/tokens.test.ts
@@ -0,0 +1,27 @@
+import { Colors } from "../Colors";
+
+test("defines the redesign color tokens with their exact hex values", () => {
+  expect(Colors).toMatchObject({
+    paper: "#FBF7F1",
+    surface: "#FFFFFF",
+    surfaceWarm: "#FFFDF8",
+    surfaceMuted: "#FAF6EF",
+    ink: "#221F2B",
+    inkMuted: "#8B8192",
+    inkFaint: "#9A8FA0",
+    burgundy: "#58003D",
+    burgundyTint: "#F6E9F0",
+    burgundyBorder: "#ECCFDF",
+    burgundyText2: "#9A6385",
+    gold: "#C6A35C",
+    goldDeep: "#9A7B33",
+    goldTint: "#F6EFDF",
+    goldBorder: "#E8D9B5",
+    sage: "#586056",
+    sageTint: "#EAEDE7",
+    navy: "#22222A",
+    border: "#F0E8DD",
+    track: "#EFE7DA",
+    fieldBorder: "#ECE2D4",
+  });
+});
diff --git a/src/utils/__tests__/limits.test.ts b/src/utils/__tests__/limits.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..d46c11561e0b4ea6155165ef4eeb9430a8e13d50
--- /dev/null
+++ b/src/utils/__tests__/limits.test.ts
@@ -0,0 +1,28 @@
+import { clampWeeklyLimit } from "../limits";
+
+describe("clampWeeklyLimit", () => {
+  test("cannot decrement below the booked session count", () => {
+    expect(clampWeeklyLimit(3, -1, 3)).toBe(3);
+  });
+
+  test("cannot increment beyond the default maximum of seven", () => {
+    expect(clampWeeklyLimit(7, 1, 0)).toBe(7);
+  });
+
+  test("increments normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, 1, 2)).toBe(5);
+  });
+
+  test("decrements normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, -1, 2)).toBe(3);
+  });
+
+  test("clamps an out-of-range current value", () => {
+    expect(clampWeeklyLimit(20, -1, 2)).toBe(7);
+    expect(clampWeeklyLimit(-5, 1, 2)).toBe(2);
+  });
+
+  test("respects a custom maximum limit", () => {
+    expect(clampWeeklyLimit(5, 1, 1, 5)).toBe(5);
+  });
+});
diff --git a/src/utils/limits.ts b/src/utils/limits.ts
new file mode 100644
index 0000000000000000000000000000000000000000..9a3ef96f86bcc13dc5306547b703fa631e2ee48f
--- /dev/null
+++ b/src/utils/limits.ts
@@ -0,0 +1,8 @@
+export function clampWeeklyLimit(
+  max: number,
+  delta: number,
+  bookedCount: number,
+  maxLimit = 7,
+): number {
+  return Math.min(maxLimit, Math.max(bookedCount, max + delta));
+}

diff --git a/app/profile.tsx b/app/profile.tsx
index e972111a4db5c6be810f5cd547a3340f68533ce7..799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,6 +8,7 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
+import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -56,7 +57,7 @@
     });
 
   const changeLimit = (delta: number) => {
-    const newValue = Math.min(7, Math.max(bookedCount, max + delta));
+    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
     if (newValue !== max) {
       void updateProfile({ max_sessions_per_week: newValue });
diff --git a/src/constants/__tests__/tokens.test.ts b/src/constants/__tests__/tokens.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..049faa5cc8ed0f29979dde83ccb2c18d36e8cb10
--- /dev/null
+++ b/src/constants/__tests__/tokens.test.ts
@@ -0,0 +1,27 @@
+import { Colors } from "../Colors";
+
+test("defines the redesign color tokens with their exact hex values", () => {
+  expect(Colors).toMatchObject({
+    paper: "#FBF7F1",
+    surface: "#FFFFFF",
+    surfaceWarm: "#FFFDF8",
+    surfaceMuted: "#FAF6EF",
+    ink: "#221F2B",
+    inkMuted: "#8B8192",
+    inkFaint: "#9A8FA0",
+    burgundy: "#58003D",
+    burgundyTint: "#F6E9F0",
+    burgundyBorder: "#ECCFDF",
+    burgundyText2: "#9A6385",
+    gold: "#C6A35C",
+    goldDeep: "#9A7B33",
+    goldTint: "#F6EFDF",
+    goldBorder: "#E8D9B5",
+    sage: "#586056",
+    sageTint: "#EAEDE7",
+    navy: "#22222A",
+    border: "#F0E8DD",
+    track: "#EFE7DA",
+    fieldBorder: "#ECE2D4",
+  });
+});
diff --git a/src/utils/__tests__/limits.test.ts b/src/utils/__tests__/limits.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..d46c11561e0b4ea6155165ef4eeb9430a8e13d50
--- /dev/null
+++ b/src/utils/__tests__/limits.test.ts
@@ -0,0 +1,28 @@
+import { clampWeeklyLimit } from "../limits";
+
+describe("clampWeeklyLimit", () => {
+  test("cannot decrement below the booked session count", () => {
+    expect(clampWeeklyLimit(3, -1, 3)).toBe(3);
+  });
+
+  test("cannot increment beyond the default maximum of seven", () => {
+    expect(clampWeeklyLimit(7, 1, 0)).toBe(7);
+  });
+
+  test("increments normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, 1, 2)).toBe(5);
+  });
+
+  test("decrements normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, -1, 2)).toBe(3);
+  });
+
+  test("clamps an out-of-range current value", () => {
+    expect(clampWeeklyLimit(20, -1, 2)).toBe(7);
+    expect(clampWeeklyLimit(-5, 1, 2)).toBe(2);
+  });
+
+  test("respects a custom maximum limit", () => {
+    expect(clampWeeklyLimit(5, 1, 1, 5)).toBe(5);
+  });
+});
diff --git a/src/utils/limits.ts b/src/utils/limits.ts
new file mode 100644
index 0000000000000000000000000000000000000000..9a3ef96f86bcc13dc5306547b703fa631e2ee48f
--- /dev/null
+++ b/src/utils/limits.ts
@@ -0,0 +1,8 @@
+export function clampWeeklyLimit(
+  max: number,
+  delta: number,
+  bookedCount: number,
+  maxLimit = 7,
+): number {
+  return Math.min(maxLimit, Math.max(bookedCount, max + delta));
+}

codex
Implementation and tests are in place. I’m running Jest and TypeScript concurrently; afterward I’ll perform the requested mutation sanity checks without leaving broken files behind.
exec
/bin/zsh -lc 'npm test -- --runInBand' in /Users/uros/Documents/Private/Projects/PerunApp
exec
/bin/zsh -lc 'npx tsc --noEmit' in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 1526ms:
diff --git a/app/profile.tsx b/app/profile.tsx
index e972111a4db5c6be810f5cd547a3340f68533ce7..799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,6 +8,7 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
+import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -56,7 +57,7 @@
     });
 
   const changeLimit = (delta: number) => {
-    const newValue = Math.min(7, Math.max(bookedCount, max + delta));
+    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
     if (newValue !== max) {
       void updateProfile({ max_sessions_per_week: newValue });
diff --git a/src/constants/__tests__/tokens.test.ts b/src/constants/__tests__/tokens.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..049faa5cc8ed0f29979dde83ccb2c18d36e8cb10
--- /dev/null
+++ b/src/constants/__tests__/tokens.test.ts
@@ -0,0 +1,27 @@
+import { Colors } from "../Colors";
+
+test("defines the redesign color tokens with their exact hex values", () => {
+  expect(Colors).toMatchObject({
+    paper: "#FBF7F1",
+    surface: "#FFFFFF",
+    surfaceWarm: "#FFFDF8",
+    surfaceMuted: "#FAF6EF",
+    ink: "#221F2B",
+    inkMuted: "#8B8192",
+    inkFaint: "#9A8FA0",
+    burgundy: "#58003D",
+    burgundyTint: "#F6E9F0",
+    burgundyBorder: "#ECCFDF",
+    burgundyText2: "#9A6385",
+    gold: "#C6A35C",
+    goldDeep: "#9A7B33",
+    goldTint: "#F6EFDF",
+    goldBorder: "#E8D9B5",
+    sage: "#586056",
+    sageTint: "#EAEDE7",
+    navy: "#22222A",
+    border: "#F0E8DD",
+    track: "#EFE7DA",
+    fieldBorder: "#ECE2D4",
+  });
+});
diff --git a/src/utils/__tests__/limits.test.ts b/src/utils/__tests__/limits.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..d46c11561e0b4ea6155165ef4eeb9430a8e13d50
--- /dev/null
+++ b/src/utils/__tests__/limits.test.ts
@@ -0,0 +1,28 @@
+import { clampWeeklyLimit } from "../limits";
+
+describe("clampWeeklyLimit", () => {
+  test("cannot decrement below the booked session count", () => {
+    expect(clampWeeklyLimit(3, -1, 3)).toBe(3);
+  });
+
+  test("cannot increment beyond the default maximum of seven", () => {
+    expect(clampWeeklyLimit(7, 1, 0)).toBe(7);
+  });
+
+  test("increments normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, 1, 2)).toBe(5);
+  });
+
+  test("decrements normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, -1, 2)).toBe(3);
+  });
+
+  test("clamps an out-of-range current value", () => {
+    expect(clampWeeklyLimit(20, -1, 2)).toBe(7);
+    expect(clampWeeklyLimit(-5, 1, 2)).toBe(2);
+  });
+
+  test("respects a custom maximum limit", () => {
+    expect(clampWeeklyLimit(5, 1, 1, 5)).toBe(5);
+  });
+});
diff --git a/src/utils/limits.ts b/src/utils/limits.ts
new file mode 100644
index 0000000000000000000000000000000000000000..9a3ef96f86bcc13dc5306547b703fa631e2ee48f
--- /dev/null
+++ b/src/utils/limits.ts
@@ -0,0 +1,8 @@
+export function clampWeeklyLimit(
+  max: number,
+  delta: number,
+  bookedCount: number,
+  maxLimit = 7,
+): number {
+  return Math.min(maxLimit, Math.max(bookedCount, max + delta));
+}

 succeeded in 1658ms:

> peruntreningcentar@1.0.0 test
> jest --runInBand

PASS src/utils/__tests__/limits.test.ts
PASS src/constants/__tests__/tokens.test.ts
PASS src/utils/__tests__/week.test.ts
PASS src/constants/__tests__/days.test.ts

Test Suites: 4 passed, 4 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        0.633 s, estimated 1 s
Ran all test suites.

codex
Both checks pass: 12 Jest tests and a clean TypeScript build. I’ll now temporarily introduce one token typo and one wrong clamp expectation, confirm both targeted suites fail, and immediately restore them.
apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/src/constants/Colors.ts
/Users/uros/Documents/Private/Projects/PerunApp/src/utils/__tests__/limits.test.ts
diff --git a/app/profile.tsx b/app/profile.tsx
index e972111a4db5c6be810f5cd547a3340f68533ce7..799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,6 +8,7 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
+import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -56,7 +57,7 @@
     });
 
   const changeLimit = (delta: number) => {
-    const newValue = Math.min(7, Math.max(bookedCount, max + delta));
+    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
     if (newValue !== max) {
       void updateProfile({ max_sessions_per_week: newValue });
diff --git a/src/constants/Colors.ts b/src/constants/Colors.ts
index 2666801740b953101dbb3b0829a35c295647a790..3b56b2cf6670eb3b444a7b8d67f40602d22a41d4
--- a/src/constants/Colors.ts
+++ b/src/constants/Colors.ts
@@ -1,5 +1,5 @@
 export const Colors = {
-  paper: "#FBF7F1",
+  paper: "#000000",
   surface: "#FFFFFF",
   surfaceWarm: "#FFFDF8",
   surfaceMuted: "#FAF6EF",
diff --git a/src/constants/__tests__/tokens.test.ts b/src/constants/__tests__/tokens.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..049faa5cc8ed0f29979dde83ccb2c18d36e8cb10
--- /dev/null
+++ b/src/constants/__tests__/tokens.test.ts
@@ -0,0 +1,27 @@
+import { Colors } from "../Colors";
+
+test("defines the redesign color tokens with their exact hex values", () => {
+  expect(Colors).toMatchObject({
+    paper: "#FBF7F1",
+    surface: "#FFFFFF",
+    surfaceWarm: "#FFFDF8",
+    surfaceMuted: "#FAF6EF",
+    ink: "#221F2B",
+    inkMuted: "#8B8192",
+    inkFaint: "#9A8FA0",
+    burgundy: "#58003D",
+    burgundyTint: "#F6E9F0",
+    burgundyBorder: "#ECCFDF",
+    burgundyText2: "#9A6385",
+    gold: "#C6A35C",
+    goldDeep: "#9A7B33",
+    goldTint: "#F6EFDF",
+    goldBorder: "#E8D9B5",
+    sage: "#586056",
+    sageTint: "#EAEDE7",
+    navy: "#22222A",
+    border: "#F0E8DD",
+    track: "#EFE7DA",
+    fieldBorder: "#ECE2D4",
+  });
+});
diff --git a/src/utils/__tests__/limits.test.ts b/src/utils/__tests__/limits.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..459bb24d672016d419329bbe151f692049daf16d
--- /dev/null
+++ b/src/utils/__tests__/limits.test.ts
@@ -0,0 +1,28 @@
+import { clampWeeklyLimit } from "../limits";
+
+describe("clampWeeklyLimit", () => {
+  test("cannot decrement below the booked session count", () => {
+    expect(clampWeeklyLimit(3, -1, 3)).toBe(3);
+  });
+
+  test("cannot increment beyond the default maximum of seven", () => {
+    expect(clampWeeklyLimit(7, 1, 0)).toBe(7);
+  });
+
+  test("increments normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, 1, 2)).toBe(5);
+  });
+
+  test("decrements normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, -1, 2)).toBe(3);
+  });
+
+  test("clamps an out-of-range current value", () => {
+    expect(clampWeeklyLimit(20, -1, 2)).toBe(19);
+    expect(clampWeeklyLimit(-5, 1, 2)).toBe(2);
+  });
+
+  test("respects a custom maximum limit", () => {
+    expect(clampWeeklyLimit(5, 1, 1, 5)).toBe(5);
+  });
+});
diff --git a/src/utils/limits.ts b/src/utils/limits.ts
new file mode 100644
index 0000000000000000000000000000000000000000..9a3ef96f86bcc13dc5306547b703fa631e2ee48f
--- /dev/null
+++ b/src/utils/limits.ts
@@ -0,0 +1,8 @@
+export function clampWeeklyLimit(
+  max: number,
+  delta: number,
+  bookedCount: number,
+  maxLimit = 7,
+): number {
+  return Math.min(maxLimit, Math.max(bookedCount, max + delta));
+}

diff --git a/app/profile.tsx b/app/profile.tsx
index e972111a4db5c6be810f5cd547a3340f68533ce7..799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,6 +8,7 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
+import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -56,7 +57,7 @@
     });
 
   const changeLimit = (delta: number) => {
-    const newValue = Math.min(7, Math.max(bookedCount, max + delta));
+    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
     if (newValue !== max) {
       void updateProfile({ max_sessions_per_week: newValue });
diff --git a/src/constants/Colors.ts b/src/constants/Colors.ts
index 2666801740b953101dbb3b0829a35c295647a790..3b56b2cf6670eb3b444a7b8d67f40602d22a41d4
--- a/src/constants/Colors.ts
+++ b/src/constants/Colors.ts
@@ -1,5 +1,5 @@
 export const Colors = {
-  paper: "#FBF7F1",
+  paper: "#000000",
   surface: "#FFFFFF",
   surfaceWarm: "#FFFDF8",
   surfaceMuted: "#FAF6EF",
diff --git a/src/constants/__tests__/tokens.test.ts b/src/constants/__tests__/tokens.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..049faa5cc8ed0f29979dde83ccb2c18d36e8cb10
--- /dev/null
+++ b/src/constants/__tests__/tokens.test.ts
@@ -0,0 +1,27 @@
+import { Colors } from "../Colors";
+
+test("defines the redesign color tokens with their exact hex values", () => {
+  expect(Colors).toMatchObject({
+    paper: "#FBF7F1",
+    surface: "#FFFFFF",
+    surfaceWarm: "#FFFDF8",
+    surfaceMuted: "#FAF6EF",
+    ink: "#221F2B",
+    inkMuted: "#8B8192",
+    inkFaint: "#9A8FA0",
+    burgundy: "#58003D",
+    burgundyTint: "#F6E9F0",
+    burgundyBorder: "#ECCFDF",
+    burgundyText2: "#9A6385",
+    gold: "#C6A35C",
+    goldDeep: "#9A7B33",
+    goldTint: "#F6EFDF",
+    goldBorder: "#E8D9B5",
+    sage: "#586056",
+    sageTint: "#EAEDE7",
+    navy: "#22222A",
+    border: "#F0E8DD",
+    track: "#EFE7DA",
+    fieldBorder: "#ECE2D4",
+  });
+});
diff --git a/src/utils/__tests__/limits.test.ts b/src/utils/__tests__/limits.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..459bb24d672016d419329bbe151f692049daf16d
--- /dev/null
+++ b/src/utils/__tests__/limits.test.ts
@@ -0,0 +1,28 @@
+import { clampWeeklyLimit } from "../limits";
+
+describe("clampWeeklyLimit", () => {
+  test("cannot decrement below the booked session count", () => {
+    expect(clampWeeklyLimit(3, -1, 3)).toBe(3);
+  });
+
+  test("cannot increment beyond the default maximum of seven", () => {
+    expect(clampWeeklyLimit(7, 1, 0)).toBe(7);
+  });
+
+  test("increments normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, 1, 2)).toBe(5);
+  });
+
+  test("decrements normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, -1, 2)).toBe(3);
+  });
+
+  test("clamps an out-of-range current value", () => {
+    expect(clampWeeklyLimit(20, -1, 2)).toBe(19);
+    expect(clampWeeklyLimit(-5, 1, 2)).toBe(2);
+  });
+
+  test("respects a custom maximum limit", () => {
+    expect(clampWeeklyLimit(5, 1, 1, 5)).toBe(5);
+  });
+});
diff --git a/src/utils/limits.ts b/src/utils/limits.ts
new file mode 100644
index 0000000000000000000000000000000000000000..9a3ef96f86bcc13dc5306547b703fa631e2ee48f
--- /dev/null
+++ b/src/utils/limits.ts
@@ -0,0 +1,8 @@
+export function clampWeeklyLimit(
+  max: number,
+  delta: number,
+  bookedCount: number,
+  maxLimit = 7,
+): number {
+  return Math.min(maxLimit, Math.max(bookedCount, max + delta));
+}

exec
/bin/zsh -lc 'npm test -- --runInBand src/constants/__tests__/tokens.test.ts src/utils/__tests__/limits.test.ts' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/profile.tsx b/app/profile.tsx
index e972111a4db5c6be810f5cd547a3340f68533ce7..799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,6 +8,7 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
+import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -56,7 +57,7 @@
     });
 
   const changeLimit = (delta: number) => {
-    const newValue = Math.min(7, Math.max(bookedCount, max + delta));
+    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
     if (newValue !== max) {
       void updateProfile({ max_sessions_per_week: newValue });
diff --git a/src/constants/Colors.ts b/src/constants/Colors.ts
index 2666801740b953101dbb3b0829a35c295647a790..3b56b2cf6670eb3b444a7b8d67f40602d22a41d4
--- a/src/constants/Colors.ts
+++ b/src/constants/Colors.ts
@@ -1,5 +1,5 @@
 export const Colors = {
-  paper: "#FBF7F1",
+  paper: "#000000",
   surface: "#FFFFFF",
   surfaceWarm: "#FFFDF8",
   surfaceMuted: "#FAF6EF",
diff --git a/src/constants/__tests__/tokens.test.ts b/src/constants/__tests__/tokens.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..049faa5cc8ed0f29979dde83ccb2c18d36e8cb10
--- /dev/null
+++ b/src/constants/__tests__/tokens.test.ts
@@ -0,0 +1,27 @@
+import { Colors } from "../Colors";
+
+test("defines the redesign color tokens with their exact hex values", () => {
+  expect(Colors).toMatchObject({
+    paper: "#FBF7F1",
+    surface: "#FFFFFF",
+    surfaceWarm: "#FFFDF8",
+    surfaceMuted: "#FAF6EF",
+    ink: "#221F2B",
+    inkMuted: "#8B8192",
+    inkFaint: "#9A8FA0",
+    burgundy: "#58003D",
+    burgundyTint: "#F6E9F0",
+    burgundyBorder: "#ECCFDF",
+    burgundyText2: "#9A6385",
+    gold: "#C6A35C",
+    goldDeep: "#9A7B33",
+    goldTint: "#F6EFDF",
+    goldBorder: "#E8D9B5",
+    sage: "#586056",
+    sageTint: "#EAEDE7",
+    navy: "#22222A",
+    border: "#F0E8DD",
+    track: "#EFE7DA",
+    fieldBorder: "#ECE2D4",
+  });
+});
diff --git a/src/utils/__tests__/limits.test.ts b/src/utils/__tests__/limits.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..459bb24d672016d419329bbe151f692049daf16d
--- /dev/null
+++ b/src/utils/__tests__/limits.test.ts
@@ -0,0 +1,28 @@
+import { clampWeeklyLimit } from "../limits";
+
+describe("clampWeeklyLimit", () => {
+  test("cannot decrement below the booked session count", () => {
+    expect(clampWeeklyLimit(3, -1, 3)).toBe(3);
+  });
+
+  test("cannot increment beyond the default maximum of seven", () => {
+    expect(clampWeeklyLimit(7, 1, 0)).toBe(7);
+  });
+
+  test("increments normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, 1, 2)).toBe(5);
+  });
+
+  test("decrements normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, -1, 2)).toBe(3);
+  });
+
+  test("clamps an out-of-range current value", () => {
+    expect(clampWeeklyLimit(20, -1, 2)).toBe(19);
+    expect(clampWeeklyLimit(-5, 1, 2)).toBe(2);
+  });
+
+  test("respects a custom maximum limit", () => {
+    expect(clampWeeklyLimit(5, 1, 1, 5)).toBe(5);
+  });
+});
diff --git a/src/utils/limits.ts b/src/utils/limits.ts
new file mode 100644
index 0000000000000000000000000000000000000000..9a3ef96f86bcc13dc5306547b703fa631e2ee48f
--- /dev/null
+++ b/src/utils/limits.ts
@@ -0,0 +1,8 @@
+export function clampWeeklyLimit(
+  max: number,
+  delta: number,
+  bookedCount: number,
+  maxLimit = 7,
+): number {
+  return Math.min(maxLimit, Math.max(bookedCount, max + delta));
+}

 exited 1 in 1120ms:
FAIL src/utils/__tests__/limits.test.ts
  ● clampWeeklyLimit › clamps an out-of-range current value

    expect(received).toBe(expected) // Object.is equality

    Expected: 19
    Received: 7

      19 |
      20 |   test("clamps an out-of-range current value", () => {
    > 21 |     expect(clampWeeklyLimit(20, -1, 2)).toBe(19);
         |                                         ^
      22 |     expect(clampWeeklyLimit(-5, 1, 2)).toBe(2);
      23 |   });
      24 |

      at Object.toBe (src/utils/__tests__/limits.test.ts:21:41)

FAIL src/constants/__tests__/tokens.test.ts
  ● defines the redesign color tokens with their exact hex values

    expect(received).toMatchObject(expected)

    - Expected  - 1
    + Received  + 1

    @@ -11,11 +11,11 @@
        "goldTint": "#F6EFDF",
        "ink": "#221F2B",
        "inkFaint": "#9A8FA0",
        "inkMuted": "#8B8192",
        "navy": "#22222A",
    -   "paper": "#FBF7F1",
    +   "paper": "#000000",
        "sage": "#586056",
        "sageTint": "#EAEDE7",
        "surface": "#FFFFFF",
        "surfaceMuted": "#FAF6EF",
        "surfaceWarm": "#FFFDF8",

      2 |
      3 | test("defines the redesign color tokens with their exact hex values", () => {
    > 4 |   expect(Colors).toMatchObject({
        |                  ^
      5 |     paper: "#FBF7F1",
      6 |     surface: "#FFFFFF",
      7 |     surfaceWarm: "#FFFDF8",

      at Object.toMatchObject (src/constants/__tests__/tokens.test.ts:4:18)

Test Suites: 2 failed, 2 total
Tests:       2 failed, 5 passed, 7 total
Snapshots:   0 total
Time:        0.336 s, estimated 1 s
Ran all test suites matching /src\/constants\/__tests__\/tokens.test.ts|src\/utils\/__tests__\/limits.test.ts/i.

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/src/constants/Colors.ts
/Users/uros/Documents/Private/Projects/PerunApp/src/utils/__tests__/limits.test.ts
diff --git a/app/profile.tsx b/app/profile.tsx
index e972111a4db5c6be810f5cd547a3340f68533ce7..799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,6 +8,7 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
+import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -56,7 +57,7 @@
     });
 
   const changeLimit = (delta: number) => {
-    const newValue = Math.min(7, Math.max(bookedCount, max + delta));
+    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
     if (newValue !== max) {
       void updateProfile({ max_sessions_per_week: newValue });
diff --git a/src/constants/__tests__/tokens.test.ts b/src/constants/__tests__/tokens.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..049faa5cc8ed0f29979dde83ccb2c18d36e8cb10
--- /dev/null
+++ b/src/constants/__tests__/tokens.test.ts
@@ -0,0 +1,27 @@
+import { Colors } from "../Colors";
+
+test("defines the redesign color tokens with their exact hex values", () => {
+  expect(Colors).toMatchObject({
+    paper: "#FBF7F1",
+    surface: "#FFFFFF",
+    surfaceWarm: "#FFFDF8",
+    surfaceMuted: "#FAF6EF",
+    ink: "#221F2B",
+    inkMuted: "#8B8192",
+    inkFaint: "#9A8FA0",
+    burgundy: "#58003D",
+    burgundyTint: "#F6E9F0",
+    burgundyBorder: "#ECCFDF",
+    burgundyText2: "#9A6385",
+    gold: "#C6A35C",
+    goldDeep: "#9A7B33",
+    goldTint: "#F6EFDF",
+    goldBorder: "#E8D9B5",
+    sage: "#586056",
+    sageTint: "#EAEDE7",
+    navy: "#22222A",
+    border: "#F0E8DD",
+    track: "#EFE7DA",
+    fieldBorder: "#ECE2D4",
+  });
+});
diff --git a/src/utils/__tests__/limits.test.ts b/src/utils/__tests__/limits.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..d46c11561e0b4ea6155165ef4eeb9430a8e13d50
--- /dev/null
+++ b/src/utils/__tests__/limits.test.ts
@@ -0,0 +1,28 @@
+import { clampWeeklyLimit } from "../limits";
+
+describe("clampWeeklyLimit", () => {
+  test("cannot decrement below the booked session count", () => {
+    expect(clampWeeklyLimit(3, -1, 3)).toBe(3);
+  });
+
+  test("cannot increment beyond the default maximum of seven", () => {
+    expect(clampWeeklyLimit(7, 1, 0)).toBe(7);
+  });
+
+  test("increments normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, 1, 2)).toBe(5);
+  });
+
+  test("decrements normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, -1, 2)).toBe(3);
+  });
+
+  test("clamps an out-of-range current value", () => {
+    expect(clampWeeklyLimit(20, -1, 2)).toBe(7);
+    expect(clampWeeklyLimit(-5, 1, 2)).toBe(2);
+  });
+
+  test("respects a custom maximum limit", () => {
+    expect(clampWeeklyLimit(5, 1, 1, 5)).toBe(5);
+  });
+});
diff --git a/src/utils/limits.ts b/src/utils/limits.ts
new file mode 100644
index 0000000000000000000000000000000000000000..9a3ef96f86bcc13dc5306547b703fa631e2ee48f
--- /dev/null
+++ b/src/utils/limits.ts
@@ -0,0 +1,8 @@
+export function clampWeeklyLimit(
+  max: number,
+  delta: number,
+  bookedCount: number,
+  maxLimit = 7,
+): number {
+  return Math.min(maxLimit, Math.max(bookedCount, max + delta));
+}

diff --git a/app/profile.tsx b/app/profile.tsx
index e972111a4db5c6be810f5cd547a3340f68533ce7..799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,6 +8,7 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
+import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -56,7 +57,7 @@
     });
 
   const changeLimit = (delta: number) => {
-    const newValue = Math.min(7, Math.max(bookedCount, max + delta));
+    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
     if (newValue !== max) {
       void updateProfile({ max_sessions_per_week: newValue });
diff --git a/src/constants/__tests__/tokens.test.ts b/src/constants/__tests__/tokens.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..049faa5cc8ed0f29979dde83ccb2c18d36e8cb10
--- /dev/null
+++ b/src/constants/__tests__/tokens.test.ts
@@ -0,0 +1,27 @@
+import { Colors } from "../Colors";
+
+test("defines the redesign color tokens with their exact hex values", () => {
+  expect(Colors).toMatchObject({
+    paper: "#FBF7F1",
+    surface: "#FFFFFF",
+    surfaceWarm: "#FFFDF8",
+    surfaceMuted: "#FAF6EF",
+    ink: "#221F2B",
+    inkMuted: "#8B8192",
+    inkFaint: "#9A8FA0",
+    burgundy: "#58003D",
+    burgundyTint: "#F6E9F0",
+    burgundyBorder: "#ECCFDF",
+    burgundyText2: "#9A6385",
+    gold: "#C6A35C",
+    goldDeep: "#9A7B33",
+    goldTint: "#F6EFDF",
+    goldBorder: "#E8D9B5",
+    sage: "#586056",
+    sageTint: "#EAEDE7",
+    navy: "#22222A",
+    border: "#F0E8DD",
+    track: "#EFE7DA",
+    fieldBorder: "#ECE2D4",
+  });
+});
diff --git a/src/utils/__tests__/limits.test.ts b/src/utils/__tests__/limits.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..d46c11561e0b4ea6155165ef4eeb9430a8e13d50
--- /dev/null
+++ b/src/utils/__tests__/limits.test.ts
@@ -0,0 +1,28 @@
+import { clampWeeklyLimit } from "../limits";
+
+describe("clampWeeklyLimit", () => {
+  test("cannot decrement below the booked session count", () => {
+    expect(clampWeeklyLimit(3, -1, 3)).toBe(3);
+  });
+
+  test("cannot increment beyond the default maximum of seven", () => {
+    expect(clampWeeklyLimit(7, 1, 0)).toBe(7);
+  });
+
+  test("increments normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, 1, 2)).toBe(5);
+  });
+
+  test("decrements normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, -1, 2)).toBe(3);
+  });
+
+  test("clamps an out-of-range current value", () => {
+    expect(clampWeeklyLimit(20, -1, 2)).toBe(7);
+    expect(clampWeeklyLimit(-5, 1, 2)).toBe(2);
+  });
+
+  test("respects a custom maximum limit", () => {
+    expect(clampWeeklyLimit(5, 1, 1, 5)).toBe(5);
+  });
+});
diff --git a/src/utils/limits.ts b/src/utils/limits.ts
new file mode 100644
index 0000000000000000000000000000000000000000..9a3ef96f86bcc13dc5306547b703fa631e2ee48f
--- /dev/null
+++ b/src/utils/limits.ts
@@ -0,0 +1,8 @@
+export function clampWeeklyLimit(
+  max: number,
+  delta: number,
+  bookedCount: number,
+  maxLimit = 7,
+): number {
+  return Math.min(maxLimit, Math.max(bookedCount, max + delta));
+}

codex
The sanity check failed exactly where intended for both mutations. The correct values are restored; I’m doing one final clean test/build pass and reviewing the scoped diff.
exec
/bin/zsh -lc 'git diff -- src/constants/Colors.ts app/profile.tsx src/utils/limits.ts src/constants/__tests__/tokens.test.ts src/utils/__tests__/limits.test.ts && git status --short -- app/profile.tsx src/utils/limits.ts src/constants/__tests__/tokens.test.ts src/utils/__tests__/limits.test.ts' in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
diff --git a/src/constants/Colors.ts b/src/constants/Colors.ts
index 1c706c7..2666801 100644
--- a/src/constants/Colors.ts
+++ b/src/constants/Colors.ts
@@ -1,19 +1,25 @@
-const tintColorLight = '#2f95dc';
-const tintColorDark = '#fff';
+export const Colors = {
+  paper: "#FBF7F1",
+  surface: "#FFFFFF",
+  surfaceWarm: "#FFFDF8",
+  surfaceMuted: "#FAF6EF",
+  ink: "#221F2B",
+  inkMuted: "#8B8192",
+  inkFaint: "#9A8FA0",
+  burgundy: "#58003D",
+  burgundyTint: "#F6E9F0",
+  burgundyBorder: "#ECCFDF",
+  burgundyText2: "#9A6385",
+  gold: "#C6A35C",
+  goldDeep: "#9A7B33",
+  goldTint: "#F6EFDF",
+  goldBorder: "#E8D9B5",
+  sage: "#586056",
+  sageTint: "#EAEDE7",
+  navy: "#22222A",
+  border: "#F0E8DD",
+  track: "#EFE7DA",
+  fieldBorder: "#ECE2D4",
+} as const;
 
-export default {
-  light: {
-    text: '#000',
-    background: '#fff',
-    tint: tintColorLight,
-    tabIconDefault: '#ccc',
-    tabIconSelected: tintColorLight,
-  },
-  dark: {
-    text: '#fff',
-    background: '#000',
-    tint: tintColorDark,
-    tabIconDefault: '#ccc',
-    tabIconSelected: tintColorDark,
-  },
-};
+export type ColorToken = keyof typeof Colors;
?? app/profile.tsx
?? src/constants/__tests__/tokens.test.ts
?? src/utils/__tests__/limits.test.ts
?? src/utils/limits.ts

exec
/bin/zsh -lc 'npm test -- --runInBand' in /Users/uros/Documents/Private/Projects/PerunApp
exec
/bin/zsh -lc 'npx tsc --noEmit' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/profile.tsx b/app/profile.tsx
index e972111a4db5c6be810f5cd547a3340f68533ce7..799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,6 +8,7 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
+import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -56,7 +57,7 @@
     });
 
   const changeLimit = (delta: number) => {
-    const newValue = Math.min(7, Math.max(bookedCount, max + delta));
+    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
     if (newValue !== max) {
       void updateProfile({ max_sessions_per_week: newValue });
diff --git a/src/constants/__tests__/tokens.test.ts b/src/constants/__tests__/tokens.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..049faa5cc8ed0f29979dde83ccb2c18d36e8cb10
--- /dev/null
+++ b/src/constants/__tests__/tokens.test.ts
@@ -0,0 +1,27 @@
+import { Colors } from "../Colors";
+
+test("defines the redesign color tokens with their exact hex values", () => {
+  expect(Colors).toMatchObject({
+    paper: "#FBF7F1",
+    surface: "#FFFFFF",
+    surfaceWarm: "#FFFDF8",
+    surfaceMuted: "#FAF6EF",
+    ink: "#221F2B",
+    inkMuted: "#8B8192",
+    inkFaint: "#9A8FA0",
+    burgundy: "#58003D",
+    burgundyTint: "#F6E9F0",
+    burgundyBorder: "#ECCFDF",
+    burgundyText2: "#9A6385",
+    gold: "#C6A35C",
+    goldDeep: "#9A7B33",
+    goldTint: "#F6EFDF",
+    goldBorder: "#E8D9B5",
+    sage: "#586056",
+    sageTint: "#EAEDE7",
+    navy: "#22222A",
+    border: "#F0E8DD",
+    track: "#EFE7DA",
+    fieldBorder: "#ECE2D4",
+  });
+});
diff --git a/src/utils/__tests__/limits.test.ts b/src/utils/__tests__/limits.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..d46c11561e0b4ea6155165ef4eeb9430a8e13d50
--- /dev/null
+++ b/src/utils/__tests__/limits.test.ts
@@ -0,0 +1,28 @@
+import { clampWeeklyLimit } from "../limits";
+
+describe("clampWeeklyLimit", () => {
+  test("cannot decrement below the booked session count", () => {
+    expect(clampWeeklyLimit(3, -1, 3)).toBe(3);
+  });
+
+  test("cannot increment beyond the default maximum of seven", () => {
+    expect(clampWeeklyLimit(7, 1, 0)).toBe(7);
+  });
+
+  test("increments normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, 1, 2)).toBe(5);
+  });
+
+  test("decrements normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, -1, 2)).toBe(3);
+  });
+
+  test("clamps an out-of-range current value", () => {
+    expect(clampWeeklyLimit(20, -1, 2)).toBe(7);
+    expect(clampWeeklyLimit(-5, 1, 2)).toBe(2);
+  });
+
+  test("respects a custom maximum limit", () => {
+    expect(clampWeeklyLimit(5, 1, 1, 5)).toBe(5);
+  });
+});
diff --git a/src/utils/limits.ts b/src/utils/limits.ts
new file mode 100644
index 0000000000000000000000000000000000000000..9a3ef96f86bcc13dc5306547b703fa631e2ee48f
--- /dev/null
+++ b/src/utils/limits.ts
@@ -0,0 +1,8 @@
+export function clampWeeklyLimit(
+  max: number,
+  delta: number,
+  bookedCount: number,
+  maxLimit = 7,
+): number {
+  return Math.min(maxLimit, Math.max(bookedCount, max + delta));
+}

 succeeded in 1329ms:
PASS src/utils/__tests__/limits.test.ts
PASS src/constants/__tests__/tokens.test.ts
PASS src/utils/__tests__/week.test.ts
PASS src/constants/__tests__/days.test.ts

Test Suites: 4 passed, 4 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        0.523 s, estimated 1 s
Ran all test suites.

 succeeded in 1329ms:
codex
Created:

- [limits.ts](/Users/uros/Documents/Private/Projects/PerunApp/src/utils/limits.ts)
- [limits.test.ts](/Users/uros/Documents/Private/Projects/PerunApp/src/utils/__tests__/limits.test.ts)
- [tokens.test.ts](/Users/uros/Documents/Private/Projects/PerunApp/src/constants/__tests__/tokens.test.ts)
- Updated [profile.tsx](/Users/uros/Documents/Private/Projects/PerunApp/app/profile.tsx)

Validation:

- Jest: 12/12 passed
- TypeScript: clean
- Mutation sanity checks failed as expected

DONE
diff --git a/app/profile.tsx b/app/profile.tsx
index e972111a4db5c6be810f5cd547a3340f68533ce7..799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,6 +8,7 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
+import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -56,7 +57,7 @@
     });
 
   const changeLimit = (delta: number) => {
-    const newValue = Math.min(7, Math.max(bookedCount, max + delta));
+    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
     if (newValue !== max) {
       void updateProfile({ max_sessions_per_week: newValue });
diff --git a/src/constants/__tests__/tokens.test.ts b/src/constants/__tests__/tokens.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..049faa5cc8ed0f29979dde83ccb2c18d36e8cb10
--- /dev/null
+++ b/src/constants/__tests__/tokens.test.ts
@@ -0,0 +1,27 @@
+import { Colors } from "../Colors";
+
+test("defines the redesign color tokens with their exact hex values", () => {
+  expect(Colors).toMatchObject({
+    paper: "#FBF7F1",
+    surface: "#FFFFFF",
+    surfaceWarm: "#FFFDF8",
+    surfaceMuted: "#FAF6EF",
+    ink: "#221F2B",
+    inkMuted: "#8B8192",
+    inkFaint: "#9A8FA0",
+    burgundy: "#58003D",
+    burgundyTint: "#F6E9F0",
+    burgundyBorder: "#ECCFDF",
+    burgundyText2: "#9A6385",
+    gold: "#C6A35C",
+    goldDeep: "#9A7B33",
+    goldTint: "#F6EFDF",
+    goldBorder: "#E8D9B5",
+    sage: "#586056",
+    sageTint: "#EAEDE7",
+    navy: "#22222A",
+    border: "#F0E8DD",
+    track: "#EFE7DA",
+    fieldBorder: "#ECE2D4",
+  });
+});
diff --git a/src/utils/__tests__/limits.test.ts b/src/utils/__tests__/limits.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..d46c11561e0b4ea6155165ef4eeb9430a8e13d50
--- /dev/null
+++ b/src/utils/__tests__/limits.test.ts
@@ -0,0 +1,28 @@
+import { clampWeeklyLimit } from "../limits";
+
+describe("clampWeeklyLimit", () => {
+  test("cannot decrement below the booked session count", () => {
+    expect(clampWeeklyLimit(3, -1, 3)).toBe(3);
+  });
+
+  test("cannot increment beyond the default maximum of seven", () => {
+    expect(clampWeeklyLimit(7, 1, 0)).toBe(7);
+  });
+
+  test("increments normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, 1, 2)).toBe(5);
+  });
+
+  test("decrements normally within the allowed range", () => {
+    expect(clampWeeklyLimit(4, -1, 2)).toBe(3);
+  });
+
+  test("clamps an out-of-range current value", () => {
+    expect(clampWeeklyLimit(20, -1, 2)).toBe(7);
+    expect(clampWeeklyLimit(-5, 1, 2)).toBe(2);
+  });
+
+  test("respects a custom maximum limit", () => {
+    expect(clampWeeklyLimit(5, 1, 1, 5)).toBe(5);
+  });
+});
diff --git a/src/utils/limits.ts b/src/utils/limits.ts
new file mode 100644
index 0000000000000000000000000000000000000000..9a3ef96f86bcc13dc5306547b703fa631e2ee48f
--- /dev/null
+++ b/src/utils/limits.ts
@@ -0,0 +1,8 @@
+export function clampWeeklyLimit(
+  max: number,
+  delta: number,
+  bookedCount: number,
+  maxLimit = 7,
+): number {
+  return Math.min(maxLimit, Math.max(bookedCount, max + delta));
+}

tokens used
18,867
Created:

- [limits.ts](/Users/uros/Documents/Private/Projects/PerunApp/src/utils/limits.ts)
- [limits.test.ts](/Users/uros/Documents/Private/Projects/PerunApp/src/utils/__tests__/limits.test.ts)
- [tokens.test.ts](/Users/uros/Documents/Private/Projects/PerunApp/src/constants/__tests__/tokens.test.ts)
- Updated [profile.tsx](/Users/uros/Documents/Private/Projects/PerunApp/app/profile.tsx)

Validation:

- Jest: 12/12 passed
- TypeScript: clean
- Mutation sanity checks failed as expected

DONE
