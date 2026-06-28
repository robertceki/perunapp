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
session id: 019f0ae2-6fd3-7230-979a-0cd0a7aa779e
--------
user
TASK: B-M8 + B-M2 + B-M1 — Build admin components, route group, and role-based routing

CONTEXT
Goal file: /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/goal-phase-b.md
Design source: /Users/uros/Desktop/design_handoff_perun_redesign/README.md (frames 05–09, lines 311–413)
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Framework: React Native (Expo) + expo-router + TypeScript
Files to consider (read these before changing):
- src/components/Header.tsx (brand/avatar pattern, StyleSheet conventions)
- app/(tabs)/_layout.tsx (tab layout, greeting, day-filter usage)
- src/constants/Colors.ts (all token definitions — paper, surface, surfaceWarm, etc.)
- src/constants/spacing.ts (Spacing, Radii, Shadows)
- src/constants/typography.ts (FontFamilies, Typography presets)
- src/services/admin/types.ts (AdminUser, OccupancySummary, MemberSeriesPoint, UpsertSessionInput, UpdateUserPatch)
- src/types/Profile.ts (role: "user" | "admin" already added)
- src/types/Training.ts (is_open, room, duration_min already added)
- src/hooks/useAuth.ts (useAuth() returns session, loading, profile)
- app/_layout.tsx (RootLayout, RootNavigator — do NOT touch font/splash wiring)

CODING CONSTRAINTS (non-negotiable)
- Simplicity first: minimum code that solves the problem. No speculative features.
- React Native primitives only (View/Text/Pressable/Image/TextInput/FlatList/ScrollView). No web/HTML, no expo-linear-gradient.
- Surgical edits: touch only new admin components + new route files + app/_layout.tsx RootNavigator. Do NOT refactor existing member screens.
- Match Header.tsx pattern exactly: StyleSheet.create, Spacing, Radii, Shadows, Colors constants, opacity-based pressed state via `styles.pressed`.
- Reuse existing design tokens (Colors.burgundy, Colors.navy, Colors.goldTint, etc.). Do NOT create new colors or gradients.
- TypeScript strict, no any. All types from src/services/admin/types.ts and src/types/*.
- Serbian copy is canonical — render exact text from the design spec.
- No commit; `npx tsc --noEmit` must pass.

DEFINITION OF DONE (verbatim from goal)
All B-M8 components exist + the 4 admin screens (placeholder) + training/[id] placeholder + admin _layout Tabs + edited root routing. `npx tsc --noEmit` exits 0. `npx eslint app src/components/admin` runs (warnings ok, no new errors). No commit.

---

## PART 1: B-M8 — Shared Admin Components

Create **src/components/admin/** directory and build these 7 components:

### 1. AdminHeader.tsx
Props: none (read from useAuth).
Render: white card, flexDirection "row", justifyContent "space-between", gap 9.
- Left: Image (perun-emblem-burgundy.png, 30×30) + Text "PERUN" (Typography.wordmark, Colors.burgundy) + ADMIN badge.
  - ADMIN badge: white bg → NO. CORRECT: burgundyTint bg, burgundyBorder border (width 1), burgundy text, Hanken 9/800, radius 6, padding 3×6.
- Right: Avatar (38×38 circle, navy bg, white initials from profile.first_name + profile.last_name, Hanken 13.5/700), Shadows.avatar, Pressable → onPress router.push("/profile").
- Use Header.tsx as a direct reference for structure, Pressable pattern (pressed opacity 0.9).

### 2. StatTile.tsx
Props interface:
```typescript
interface StatTileProps {
  figure: string;
  label: string;
  figureColor?: string;     // default Colors.ink
  delta?: string;           // optional "▲ +12 ovog meseca"
  deltaColor?: string;      // optional color for delta text
}
```
Render: white card (Colors.surface, border Colors.border, 1px, Radii.tile[18], Shadows.card), flex column, gap 4.
- Top: Text figure (Bricolage 26/800, figureColor or Colors.ink).
- Middle: Text label (Hanken 11.5/600, Colors.inkMuted).
- Bottom (if delta): Text delta (Hanken 11/700, deltaColor).
- Padding: cardPadding (16).

### 3. BarChart.tsx
Props interface:
```typescript
interface BarChartProps {
  data: { label: string; value: number }[];
  currentIndex?: number;
  showValueLabelOnCurrent?: boolean;
}
```
Render: custom dependency-free vertical bar chart.
- Container: flex row, gap 4, justifyContent "space-evenly", height 140 (approximate).
- For each bar:
  - Normalize value to a height: max = max(data.map(d => d.value)); if max === 0, guard to 1. height = (value / max) * 120, min 4.
  - Bar column View: flex 1, borderTopLeftRadius 6, borderTopRightRadius 6.
    - If index === currentIndex: backgroundColor Colors.burgundy, render a sub-View at the top (2–4 px height) with backgroundColor Colors.goldTint as a highlight.
    - Else: backgroundColor Colors.gold, render same highlight.
  - If showValueLabelOnCurrent && index === currentIndex: render Text (value.toString(), Bricolage 14/800, Colors.ink) ABOVE the bar.
  - Label below: Text (data[index].label, Hanken 9/700, Colors.inkFaint).
- No external charting library, no Animated.

### 4. Toggle.tsx
Props interface:
```typescript
interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}
```
Render: custom pill switch ~46×27.
- Container: Pressable, width 46, height 27, borderRadius 20, onPress toggle value (toggle onValueChange(!value)).
- Track: full container, backgroundColor = value ? Colors.burgundy : "#DDD3C7", borderRadius 20.
- Knob: absolute circle (width ~21, height 21, borderRadius 9999), backgroundColor white.
  - If value: position right ~3 (marginRight 3 logic or left calculation).
  - Else: position left ~3 (marginLeft 3 or left 3).
- No Animated (static switch).
- If disabled: opacity 0.5, Pressable onPress swallowed.

### 5. FilterChips.tsx
Props interface (generic):
```typescript
interface FilterChipsProps<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
}
```
Render: horizontal FlatList or scroll View of chips.
- Container: flexDirection "row", gap 8, horizontal scrolling (if needed, use ScrollView horizontal).
- Each chip: Pressable, flexDirection "row", alignItems "center", borderRadius Radii.chip (20), padding ~6×12, Hanken 12/700.
  - If option.key === value: backgroundColor Colors.burgundy, color white.
  - Else: backgroundColor Colors.surface, borderColor Colors.fieldBorder, borderWidth 1, color Colors.ink (or inkMuted).
  - onPress: onChange(option.key).

### 6. UserRow.tsx
Props interface:
```typescript
interface UserRowProps {
  user: AdminUser;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onRemove: () => void;
  tintIndex?: number; // for avatar tint rotation
}
```
Render: white card, Radii.tile[16], Shadows.card.
- Collapsed state (default): flexDirection "row", alignItems "center", gap Spacing.cardGap (13).
  - Avatar: 36×36 circle, tint rotation [Colors.sage, Colors.gold, Colors.burgundy] by tintIndex % 3. Initials user.first_name[0] + user.last_name[0], white text, Hanken 12/700.
  - Column: flex 1.
    - Name: Hanken 14/700, Colors.ink.
    - Email: Hanken 12/600, Colors.inkMuted, numberOfLines 1, ellipsizeMode "tail".
  - Right chip: role === "admin" ? burgundyTint/burgundy "Admin" (Hanken 12/700, burgundy) : sageTint/sage "{user.max_sessions_per_week}× / ned" (Hanken 12/700, sage).
  - Entire row is Pressable → onToggleExpand.
- Expanded state:
  - Card gets backgroundColor Colors.surfaceWarm, borderColor Colors.goldBorder, borderWidth 1.
  - Same header row as above.
  - Below header: flexDirection "row", gap 10, justifyContent "flex-end".
    - "Izmeni" button: Pressable, borderColor Colors.burgundyBorder, borderWidth 1, borderRadius Radii.tile[12], padding 8×12, Text Hanken 14/700 Colors.burgundy → onEdit.
    - "Ukloni" button: Pressable, borderColor "#EAC6BF", borderWidth 1, borderRadius Radii.tile[12], padding 8×12, Text Hanken 14/700 "#C0341B" → onRemove.

### 7. SessionRow.tsx
Props interface:
```typescript
interface SessionRowProps {
  session: Training;
  bookedCount: number;
  onToggleOpen: (open: boolean) => void;
  onPress?: () => void;
}
```
Render: white card, Radii.tile[18], flexDirection "row", alignItems "center", gap 12.
- Left: time block, flexDirection "column", gap 2.
  - Time: Bricolage 17/800, Colors.ink.
  - Duration: Hanken 10/600, Colors.inkFaint (render as "{session.duration_min} min" or "—").
- Center divider: height 40, width 1, backgroundColor Colors.border.
- Main: flex 1, flexDirection "column", gap 2.
  - Title: Bricolage 15/700, Colors.ink.
  - Booked: Hanken 12/600, Colors.sage (render as "{session.room ?? 'Sala'} · {bookedCount} / {session.max_participants}").
  - If bookedCount >= session.max_participants: add a burgundyTint/burgundy "Popunjeno" chip (Hanken 11/700, burgundyText2).
- Right: <Toggle value={session.is_open} onValueChange={onToggleOpen} disabled={false} />.
- If !session.is_open:
  - Card backgroundColor Colors.surfaceMuted, borderColor "#ECE3D6", borderWidth 1.
  - All text color Colors.inkMuted / Colors.inkFaint.
  - Add a "Zatvoreno" chip (Hanken 11/700, Colors.inkMuted, surfaceMuted bg).
- Optional Pressable wrapper around the whole row for onPress (if provided).

---

## PART 2: B-M2 — Admin Route Group + Tab Bar

Create **app/(admin)/** directory and **app/(admin)/_layout.tsx**:

```typescript
// app/(admin)/_layout.tsx
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import AdminHeader from "@/components/admin/AdminHeader";
import { Colors } from "@/constants/Colors";
import { FontFamilies, Typography } from "@/constants/typography";

export default function AdminLayout() {
  return (
    <View style={styles.container}>
      <AdminHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 70,
            backgroundColor: "rgba(255, 255, 255, 0.97)",
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            paddingBottom: 24,
            paddingTop: 8,
          },
          tabBarActiveTintColor: Colors.burgundy,
          tabBarInactiveTintColor: "#B3A9B2",
          tabBarLabelStyle: {
            fontFamily: FontFamilies.hanken[700],
            fontSize: 11,
          },
          tabBarIconStyle: {
            marginBottom: -2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Pregled",
            tabBarIcon: ({ color, size }) => (
              <Feather name="grid" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: "Korisnici",
            tabBarIcon: ({ color, size }) => (
              <Feather name="users" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: "Treninzi",
            tabBarIcon: ({ color, size }) => (
              <Feather name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Statistika",
            tabBarIcon: ({ color, size }) => (
              <Feather name="bar-chart-2" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="training/[id]"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
});
```

Now create **4 placeholder screen files** in **app/(admin)/**: **index.tsx**, **users.tsx**, **sessions.tsx**, **stats.tsx**.

Each placeholder screen:
- Import View, Text, StyleSheet from react-native.
- Return a View flex 1 backgroundColor Colors.paper, center-aligned Text showing the screen name.
- Each should be a minimal stub; the screen names are: "Pregled", "Korisnici", "Treninzi", "Statistika".
- Example structure:
  ```typescript
  import { View, Text, StyleSheet } from "react-native";
  import { Colors } from "@/constants/Colors";
  import { Typography } from "@/constants/typography";

  export default function PregledScreen() {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Pregled</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Colors.paper,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      ...Typography.screenTitle,
      color: Colors.ink,
    },
  });
  ```

Create **app/(admin)/training/[id].tsx** as a minimal placeholder with the same pattern showing "Novi trening" or "Izmena treninga" (for now, just show "Training Detail").

---

## PART 3: B-M1 — Role-Based Routing (app/_layout.tsx)

Edit **app/_layout.tsx** RootNavigator function ONLY. The goal: after login + profile resolve, route admin to /(admin), user to /(tabs).

**Existing code to preserve:**
- RootLayout function (fonts, SplashScreen).
- AuthProvider, TrainingProvider wrapping.

**Changes to RootNavigator:**
1. Keep `const { session, loading } = useAuth();` BUT also read `profile`: `const { session, loading, profile } = useAuth();`.
2. Keep `const router = useRouter(); const segments = useSegments();`.
3. Update the useEffect dependency to `[session, loading, profile, segments]`.
4. Update the logic:
   ```typescript
   useEffect(() => {
     // Wait for auth to resolve
     if (loading) return;

     // Wait for profile to load (after session exists)
     if (session && !profile) return;

     const inLoginPage = segments[0] === "login";
     const inAdminPage = segments[0] === "(admin)";
     const inTabsPage = segments[0] === "(tabs)";

     // Not logged in and not on login page → go to login
     if (!session && !inLoginPage) {
       router.replace("/login");
       return;
     }

     // Logged in but on login page → route by role
     if (session && profile && inLoginPage) {
       if (profile.role === "admin") {
         router.replace("/(admin)");
       } else {
         router.replace("/(tabs)");
       }
       return;
     }

     // Logged in on wrong stack → redirect by role
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
   }, [session, loading, profile, segments]);
   ```
5. Keep the loading spinner View unchanged.
6. Keep the Stack structure as-is; ADD `<Stack.Screen name="(admin)" />` before the closing </Stack>.

---

## Implementation notes

1. **AdminHeader** must use the same useRouter + useAuth pattern as Header; no prop drilling.
2. **All styles** use Spacing, Radii, Shadows, Colors from constants — do not hardcode numbers except for very small adjustments (e.g., 3 px for toggle knob margin).
3. **Color gradients** are NOT possible in RN without expo-linear-gradient (excluded by constraint). Instead:
   - For the BarChart gold bars: solid Colors.gold. The "highlight" is a thin goldTint sub-View at the top of each bar (~3 px).
   - For the burgundy current bar: solid Colors.burgundy, same goldTint highlight at the top (this is the visual approximation of gradient).
4. **No new dependencies.** Use @expo/vector-icons (Feather) which is already installed.
5. **UserRow avatar tint:** if tintIndex is not provided, use a simple index % 3 rotation or a name-hash approach. Simplest: accept the prop and apply [Colors.sage, Colors.gold, Colors.burgundy][tintIndex % 3].
6. **Placeholder screens** are the 4 tabs + training/[id]. They do NOT include actual data fetching yet (Wave C/onward).

---

DO NOT:
- Commit changes.
- Touch any member screen (app/(tabs)/*, src/components/TrainingCard, etc.).
- Add any new colors or design tokens.
- Create any subdirectories inside src/components/admin (keep them flat in the admin folder).
- Use expo-linear-gradient, Animated, or any non-primitive component.

Output: produce the code changes. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the specified source files and design section first, then add only the admin components/routes and the scoped RootNavigator change. Afterward I’ll run TypeScript and the requested ESLint command.
  → Inspect required source files, tokens, types, and design handoff
  • Create shared admin components and admin route group placeholders
  • Update RootNavigator role-based routing
  • Run TypeScript and ESLint verification, fix scoped issues
exec
/bin/zsh -lc "git status --short && sed -n '1,260p' src/components/Header.tsx && sed -n '1,280p' 'app/(tabs)/_layout.tsx' && sed -n '1,300p' src/constants/Colors.ts && sed -n '1,240p' src/constants/spacing.ts && sed -n '1,300p' src/constants/typography.ts" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
?? .tmnt/runs/B-M8-B-M2-B-M1-mikey.md
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
import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import AlertBar from "@/components/AlertBar";
import DayFilter from "@/components/DayFilter";
import EmptyDay from "@/components/EmptyDay";
import Header from "@/components/Header";
import { TrainingCard } from "@/components/TrainingCard";
import { Colors } from "@/constants/Colors";
import { Day } from "@/constants/days";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { getCurrentWeekDates } from "@/utils/week";

const DAY_NAMES: Record<Day, string> = {
  sunday: "NEDELJA",
  monday: "PONEDELJAK",
  tuesday: "UTORAK",
  wednesday: "SREDA",
  thursday: "ČETVRTAK",
  friday: "PETAK",
  saturday: "SUBOTA",
};

const MONTH_NAMES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAJ",
  "JUN",
  "JUL",
  "AVG",
  "SEP",
  "OKT",
  "NOV",
  "DEC",
] as const;

export default function TabsLayout() {
  const [selectedDay, setSelectedDay] = useState<Day>("monday");
  const { profile } = useAuth();
  const { getTrainingsByDay } = useTrainings();
  const data = getTrainingsByDay(selectedDay);
  const selectedDate = getCurrentWeekDates()[selectedDay];
  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;

  return (
    <View style={styles.screen}>
      <Header />

      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>
          Zdravo, {profile?.first_name?.trim() || "—"}
        </Text>
        <Text style={styles.subtitle}>
          Spreman za trening? Evo termina za ovu nedelju.
        </Text>
      </View>

      <DayFilter
        selected={selectedDay}
        setSelected={(day) => setSelectedDay(day as Day)}
      />
      <AlertBar />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {DAY_NAMES[selectedDay]} · {dateLabel}
        </Text>
        <Text style={styles.sectionCount}>{data.length} termina</Text>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={data}
        keyExtractor={(training) => training.id}
        ListEmptyComponent={EmptyDay}
        renderItem={({ item }) => <TrainingCard training={item} />}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.paper,
    flex: 1,
  },
  greeting: {
    paddingBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  greetingTitle: {
    ...Typography.greeting,
    color: Colors.ink,
  },
  subtitle: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 13.5,
    fontWeight: "600",
    marginTop: 4,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  sectionTitle: {
    ...Typography.sectionLabel,
    color: Colors.sage,
  },
  sectionCount: {
    color: Colors.inkFaint,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
});
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

exec
/bin/zsh -lc "sed -n '1,320p' src/services/admin/types.ts && sed -n '1,240p' src/types/Profile.ts && sed -n '1,280p' src/types/Training.ts && sed -n '1,280p' src/hooks/useAuth.ts && sed -n '1,360p' app/_layout.tsx && sed -n '1,260p' .tmnt/goal-phase-b.md && sed -n '311,413p' /Users/uros/Desktop/design_handoff_perun_redesign/README.md" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  role: "user" | "admin";
  max_sessions_per_week: number;
  enabled: boolean | null;
}

export interface MemberSeriesPoint {
  month: string;
  total_members: number;
  new_members: number;
}

export interface OccupancySummary {
  avg_pct: number;
  top_day: string;
  new_this_month: number;
  prev_new: number;
}

export interface UpsertSessionInput {
  id: string | null;
  title: string;
  day_of_week: string;
  time: string;
  room: string | null;
  duration_min: number | null;
  max_participants: number;
  is_open: boolean;
}

export interface UpdateUserPatch {
  first_name?: string | null;
  last_name?: string | null;
  role?: "user" | "admin" | null;
  max_sessions_per_week?: number | null;
}
export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  max_sessions_per_week: number;
  role: "user" | "admin";
};
export type Training = {
  id: string;
  day_of_week: string;
  title: string;
  time: string;
  max_participants: number;
  created_at: string;
  is_open: boolean;
  room: string | null;
  duration_min: number | null;
  session_participants: {
    user_id: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  }[];
};
import { useContext } from "react";

import { AuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  return useContext(AuthContext);
}
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
  const { session, loading } = useAuth();

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inLoginPage = segments[0] === "login";

    if (!session && !inLoginPage) {
      router.replace("/login");
    }

    if (session && inLoginPage) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);

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
# Goal: Perun Redesign — PHASE B (Admin App)

**Target project:** /Users/uros/Documents/Private/Projects/PerunApp
**Depends on:** Phase A (member redesign) — DONE. Design system (tokens/fonts/assets), member screens, and the data layer are already in place.
**Source of truth (design):** /Users/uros/Desktop/design_handoff_perun_redesign/README.md — Admin section, frames 05–09. README wins over the HTML prototype.
**Status:** Approved to build. Lay backend foundations (migrations + RPCs) BEFORE admin UI.

---

## What we're building
The admin surface of Perun Trening Centar: 5 screens (Pregled / Korisnici / Treninzi / Novi-trening / Statistika) behind a shared admin tab bar, reached by role-based routing after login. Same brand and design system as the member app. This lets the gym operate without touching the database: open/close slots, manage members, create sessions, and see attendance trends.

## Why
Phase A made the member app branded and usable. Phase B unlocks the operator. Today an admin has to go into Supabase directly to change anything; Phase B puts that behind an authenticated, role-gated UI.

---

## REPO REALITY — read before planning (the README's data assumptions are partly wrong)

| README / old plan says | Actual repo |
|---|---|
| `trainings` table | The table is **`sessions`** — `TrainingContext.tsx` queries `.from("sessions")`. Bookings are rows in **`session_participants`** (`user_id`, `session_id`). |
| add `role` to profiles | The DB `profiles.role` column **already exists** (defaults `'user'` via `handle_new_user`). But the **TS `Profile` type does NOT include `role`** — add it. The role-routing branch in the app is the missing piece. |
| booking guard in `src/services/trainings/guards.ts` | No such file. Booking enforcement is the Postgres **`join_session(uuid)` RPC** (migration `supabase/migrations/20260627160000_booking_enforcement.sql`). The `is_open` check extends THAT RPC. |
| form has SALA (room) + TRAJANJE (duration) | The `Training` type / `sessions` table has **no `room` and no `duration` columns** (only `id, day_of_week, title, time, max_participants, created_at`). DECISION REQUIRED — see Decisions. |
| icon set "lucide/ionicons" | **`@expo/vector-icons` already installed** — use Feather (grid, users, calendar, bar-chart-2). No new dep. |
| 6-tab member layout | Members stay single-screen + day-filter (Phase A). Admin is a **separate `(admin)` route group** with its own real bottom tabs. |

Existing booking-error mapping lives in `TrainingContext.tsx` (`bookingErrorMessages` record + `getBookingErrorMessage`). Extend it for `session_closed`.

---

## Decisions to lock before code (recommendations in bold)

1. **Room/duration columns.** The admin create/edit form shows SALA + TRAJANJE, but `sessions` has neither column. → **Add `room text` and `duration_min int` to `sessions` (nullable, sensible defaults), surface them on the `Training` type, and render them in member TrainingCard's "Grupni · Sala A" / "60 min" slots (currently those are hardcoded/placeholder in Phase A).** Alternative: drop both fields from the form (cheaper, but the member card keeps faked room/duration). Pick the first unless you want to defer.
2. **Admin provisioning.** First admin is set by a manual `UPDATE public.profiles SET role='admin' WHERE id='…'` in Supabase Studio. **No self-promotion / invite flow in-app.** (Recommended: yes, manual.)
3. **Stats source.** Real aggregates over `profiles.created_at` (new members/month, cumulative) and `session_participants` vs `max_participants` (occupancy). Numbers in the mock are illustrative — **replace with real RPC/view output, no hardcoded figures.**
4. **Admin write surface.** Use `SECURITY DEFINER` `admin_*` RPCs that check `(select role from profiles where id = auth.uid()) = 'admin'`, rather than broad table-level RLS for admin writes. (Recommended: RPCs — small, auditable surface.)

---

## BACKEND TASKS (Donatello) — these block all admin UI

**B-D1 — Migration: `is_open` on sessions + room/duration (per Decision 1)**
- New migration `supabase/migrations/<ts>_admin_sessions_columns.sql`:
  - `alter table public.sessions add column is_open boolean not null default true;`
  - (Decision 1) `add column room text;` `add column duration_min int;`
  - Backfill existing rows (`is_open = true`; room/duration null or a default).
- DoD: migration applies cleanly locally (`supabase db reset` or `db push` against the linked project in `supabase/.temp/linked-project.json`); no RLS regression for members.

**B-D2 — Extend `join_session` RPC to reject closed slots**
- Update the `join_session(uuid)` function (see `20260627160000_booking_enforcement.sql`) to `raise exception 'session_closed'` when the target session `is_open = false`, before the capacity/limit checks.
- In `TrainingContext.tsx`, add `session_closed: "Termin je trenutno zatvoren za prijave."` to `bookingErrorMessages`.
- DoD: a closed session rejects a member join with the mapped Serbian message; open sessions unaffected. Existing booking tests stay green.

**B-D3 — Admin RPCs (SECURITY DEFINER, role-checked)**
- New migration `<ts>_admin_rpcs.sql` with functions, each guarding `is_admin(auth.uid())`:
  - `admin_set_session_open(session_id uuid, open boolean)`
  - `admin_upsert_session(... title, day_of_week, time, room, duration_min, max_participants, is_open ...)` (insert when id null, else update)
  - `admin_delete_user(target uuid)` (cascade their `session_participants`)
  - `admin_update_user(target uuid, patch ...)` (name, role, max_sessions_per_week)
- DoD: a **non-admin** caller gets denied (RLS/role check), an admin succeeds. Include a SQL-level check or a Raphael integration test asserting the non-admin denial.

**B-D4 — Stats RPCs/view**
- `admin_member_series(months int)` → rows of `{ month, total_members, new_members }` from `profiles.created_at`.
- `admin_occupancy_summary(period text)` → `{ avg_pct, top_day, new_this_month, prev_new }` from `session_participants` / `max_participants`.
- DoD: returns real numbers on the linked project; callable only by admins.

**B-D5 — Types + service layer**
- `src/types/Profile.ts`: add `role: 'user' | 'admin'` (and `created_at` if used by stats UI).
- `src/types/Training.ts`: add `is_open: boolean` (+ `room`, `duration_min` per Decision 1).
- New `src/services/admin/*.ts`: typed wrappers calling the admin RPCs (sessions CRUD, users, stats). No `any`.
- DoD: `npx tsc --noEmit` clean; services typed end-to-end.

---

## ROUTING TASKS (Michelangelo, after B-D5 types exist)

**B-M1 — Role-based redirect**
- In `app/_layout.tsx` RootNavigator: after `login()` + profile fetch resolves, branch `profile.role === 'admin'` → `/(admin)`, else `/(tabs)`. Do not disturb the Phase A font/splash wiring.
- DoD: admin lands on admin tabs, user on member home, no flash of the wrong stack.

**B-M2 — Admin route group + tab bar**
- `app/(admin)/_layout.tsx`: `<Tabs>` (or custom bottom bar per spec, height ~70, white .97, top border, ~24 bottom inset) with 4 tabs — Pregled / Korisnici / Treninzi / Statistika; Feather icons grid/users/calendar/bar-chart-2; active burgundy, inactive `#B3A9B2`.
- DoD: tabs navigate; brand matches; `ADMIN` badge next to the wordmark; admin avatar uses `navy` bg.

## ADMIN SCREEN TASKS (Michelangelo) — reuse Phase A tokens/components where possible

**B-M3 — Pregled `app/(admin)/index.tsx`** (README §5): ADMIN top bar, greeting, 2×2 stat grid, monthly trend chart card (6 bars, current month burgundy / others gold gradient, value label), quick action "＋ Novi trening" → create route. Data from `admin_member_series` + `admin_occupancy_summary`.

**B-M4 — Korisnici `app/(admin)/users.tsx`** (README §6): header + member count, search field, filter chips (Svi/Aktivni/Admini), user rows (avatar tint rotation, name, email, right chip = weekly limit or "Admin"). Expand-to-edit row → "Izmeni" (→ edit) + "Ukloni" (confirm dialog → `admin_delete_user`). Uses `admin_update_user` / `admin_delete_user`.

**B-M5 — Treninzi `app/(admin)/sessions.tsx`** (README §7): day selector (reuse member pattern), workout rows (time/title/room·booked·max), `is_open` toggle switch per row → `admin_set_session_open`. Closed slot = muted + "Zatvoreno" chip + toggle off. "＋ Novi" → create route.

**B-M6 — Novi/Izmena trening `app/(admin)/training/[id].tsx`** (README §8): `[id]==='new'` = create. Fields: NAZIV, DAN (PON–SUB chips, single-select), VREME + TRAJANJE, SALA + MAKS. UČESNIKA (stepper), "Status slota" toggle. Sticky footer Otkaži / "Sačuvaj trening" → `admin_upsert_session`.

**B-M7 — Statistika `app/(admin)/stats.tsx`** (README §9): period chips (12/6/Sve), 12-bar members chart (current month burgundy), two secondary tiles (NOVIH/MES., PROS. POPUNJ. + top day). Data from stats RPCs.

**B-M8 — Charts + shared admin components**
- New `src/components/admin/{StatTile, BarChart, UserRow, SessionRow, Toggle, FilterChips}.tsx`. `BarChart` is a small custom RN component (no extra dep), normalised to max value, gold gradient with burgundy current-period bar.
- DoD: components reused across Pregled/Statistika/Treninzi/Korisnici.

---

## VERIFICATION (Raphael)

**B-R1 — Gates:** `npx tsc --noEmit` clean; `npm run lint` (no new errors); `npm run test` green. New migrations apply on the linked project.
**B-R2 — Security test:** assert a non-admin profile **cannot** call any `admin_*` RPC (denied), and an admin can. This is the highest-risk surface.
**B-R3 — Cross-role smoke (document, run on device/sim where headless can't):**
- Member login → no admin tabs visible.
- Admin login → admin tabs visible.
- Admin closes a session → member sees it disabled and the join is rejected with `session_closed`.
- Admin creates a session → it appears in the member's week.
- Pregled + Statistika render REAL Supabase numbers (not mocks).

---

## Constraints (hold throughout)
- React Native primitives only (`View/Text/Pressable/Image/TextInput/FlatList/SafeAreaView`). No web/HTML, no UI kit, no Tailwind.
- Reuse `useAuth` / `useTrainings`; no parallel data layer. Admin data goes through the new `src/services/admin/*` + RPCs.
- TypeScript strict, no new `any`. Serbian copy is canonical — do not anglicise.
- Guard EVERY admin mutation in the database (role check in the RPC), not just in the UI. UI gating is not security.
- Brand colors/shadows from README are canonical.

## Phase B explicitly does NOT include
- Admin self-promotion / email-invite flow (manual role seed only).
- Push notifications / email on session changes.
- Multi-gym / multi-center support. Localisation beyond Serbian.
- Production/store builds.

## Definition of done
- `role='admin'` lands on the admin tab bar after login; `role='user'` lands on member home (no regressions).
- Closing a session in admin prevents member joins (UI closed state + RPC `session_closed`).
- Create-session form inserts and the session appears in the member week.
- Pregled + Statistika show real aggregates from Supabase.
- A non-admin cannot call admin RPCs (verified by test).
- `npm run lint` + `npm run test` green; migrations apply cleanly on the linked project.

---

## Suggested build order (for Leonardo)
1. Backend first — B-D1 → B-D2 → B-D3 → B-D4 → B-D5 (migrations + RPCs + types/services). These block all UI.
2. Routing — B-M1, B-M2 (role redirect + admin shell).
3. Screens — B-M3…B-M7, with B-M8 shared components extracted early (BarChart/StatTile needed by Pregled + Statistika).
4. Verification — B-R1 gates throughout; B-R2 security test once admin RPCs land; B-R3 cross-role smoke at the end.
# Admin App (frames 05–09)

The admin uses the **same login screen**. After auth, branch on the user's role
(`profile.role === 'admin'` or a Supabase `is_admin` flag) and route admins to the admin
stack instead of the member tabs. Same brand, tokens, and type as the member app. A small
`ADMIN` badge sits next to the wordmark in the top bar; the admin avatar uses the `navy`
(`#22222A`) background to distinguish it from members (`burgundy`).

Admin screens share a **bottom tab bar** (height ~70, white `rgba(255,255,255,.97)`, top
border `border`, ~24 bottom padding for the home indicator). Four tabs: **Pregled**,
**Korisnici**, **Treninzi**, **Statistika**. Active tab = `burgundy` icon + label (700);
inactive = `#B3A9B2` (600). Icons are simple CSS glyphs (2×2 grid, person, calendar, bars)
— in RN use your icon set (e.g. lucide/ionicons): grid, users, calendar, bar-chart.

## 5. Admin — Pregled (Dashboard)
**Purpose:** At-a-glance health of the center + monthly member trend.
- **Top bar**: emblem + "PERUN" + `ADMIN` badge (Hanken 9/800, `burgundy` on `burgundyTint`,
  border `burgundyBorder`, radius 6); right = 38 circle avatar "AD" on `navy`.
- **Greeting**: "Zdravo, Admin" (Bricolage 25/800) + "Pregled centra · jun 2026."
- **Stat tiles — 2×2 grid** (gap 11), white cards radius 18:
  - "142" (`burgundy`) — "aktivnih članova" — delta "▲ +12 ovog meseca" (`#4E7A5C`).
  - "84%" (`goldDeep`) — "popunjenost" — "▲ +6% n/n".
  - "38" (`ink`) — "treninga ove nedelje".
  - "6" (`sage`) — "otvorenih slotova danas".
  Figures Bricolage 26/800; labels Hanken 11.5/600 `inkMuted`; deltas 11/700.
- **Monthly trend chart card** "ČLANOVI PO MESECU" + "▲ 18% / 6m" (`#4E7A5C`): 6 vertical
  bars (jan–jun), height ∝ value, gold gradient `linear-gradient(#DCC388,#C6A35C)`, radius
  6 6 0 0; the **last/current bar is burgundy** `linear-gradient(#7A2057,#58003D)` with its
  value label "142" above. Month labels Hanken 9/700 `inkFaint`.
- **Quick action**: full-width `burgundy` "＋ Novi trening".
- Bottom nav, **Pregled** active.

## 6. Admin — Korisnici (Users: edit / remove)
**Purpose:** Manage members — search, edit, remove.
- **Header**: "Korisnici" (Bricolage 23/800) + "142 člana"; right = `burgundy` pill
  "＋ Dodaj".
- **Search field**: white, border `fieldBorder`, radius 14, magnifier glyph + placeholder
  "Pretraži članove…".
- **Filter chips**: "Svi" (active `burgundy`), "Aktivni", "Admini" (white/outline).
- **User rows** (white cards radius 16): avatar (initials, tint rotates sage/gold/burgundy)
  + name (14/700) + email (12 `inkMuted`, ellipsis) + right chip = weekly limit
  ("3× / ned" on `sageTint`) or role ("Admin" on `burgundyTint`/`burgundy`).
- **Expanded/edit row** (one shown): card gets `surfaceWarm` bg + `goldBorder`; below the
  identity row, two buttons — **"Izmeni"** (outline `burgundy`: border `burgundyBorder`)
  and **"Ukloni"** (outline red: text `#C0341B`, border `#EAC6BF`). Tapping a row expands
  to reveal these; "Ukloni" should confirm before deleting the user + their bookings.
- Bottom nav, **Korisnici** active.

## 7. Admin — Treninzi (Workouts + open/close slots)
**Purpose:** Manage the day's sessions and toggle each slot open/closed.
- **Header**: "Treninzi" + "Ponedeljak · 9. jun"; right = `burgundy` pill "＋ Novi".
- **Day selector**: PON–SUB (same as member, slightly smaller; PON active `burgundy`).
- **Workout rows** (white cards radius 18): time block (Bricolage 17/800 + duration) ·
  divider · title (Bricolage 15/700) + "Sala X · {booked} / {max}" (`sage` 12/600). When
  full, add a "Popunjeno" chip (`burgundyText2` on `burgundyTint`). Right side = **slot
  toggle**: a 42×25 pill switch — **ON** = `burgundy` track, knob right; **OFF** = `#DDD3C7`
  track, knob left. A **closed** slot uses `surfaceMuted` bg + `#ECE3D6` border, muted
  greys, a "Zatvoreno" chip, and the toggle OFF.
- Toggling the switch flips the session's `is_open` / `status` field (members can only
  book `is_open` slots).
- Bottom nav, **Treninzi** active.

## 8. Admin — Novi / Izmena treninga (Add / edit workout form)
**Purpose:** Create or edit a session.
- **Nav bar**: back chevron square + "Novi trening" (use "Izmena treninga" when editing).
- **Fields** (label = micro label, inputs white / border `fieldBorder` / radius 14):
  - "NAZIV TRENINGA" (text).
  - "DAN" — 6 chips PON–SUB (single-select; active `burgundy`).
  - Row: "VREME" (time) + "TRAJANJE" (duration).
  - Row: "SALA" (text) + "MAKS. UČESNIKA" (stepper − value + ).
  - **"Status slota"** card (`surfaceWarm` / `goldBorder`): label "Otvoren za prijave
    članova" + 46×27 toggle (ON `burgundy`). This sets the slot open/closed at creation.
- **Footer actions** (sticky, gradient fade to `paper`): "Otkaži" (outline) + full-width
  `burgundy` "Sačuvaj trening".
- Maps to insert/update on the `trainings` table (`title`, `day_of_week`, `time`,
  `duration`, `room`, `max_participants`, `is_open`).

## 9. Admin — Statistika
**Purpose:** Membership & attendance trends over time.
- **Header**: "Statistika" + "Trendovi članstva i posećenosti".
- **Period chips**: "12 meseci" (active), "6 meseci", "Sve".
- **Members chart card**: "ČLANOVA UKUPNO" + big figure "142" (Bricolage 28/800) + trend
  badge "▲ 18% / 6m" (`#4E7A5C` on `#E9F1EB`); **12 bars** (jul→jun), gold gradient with
  the current month (jun) in burgundy. Bars height ∝ value, gap 4, month labels 7.5/700.
- **Secondary metric tiles** (row of 2): "NOVIH / MES." → "+12" (`goldDeep`) + "▲ vs +9
  (maj)"; "PROS. POPUNJ." → "84%" (`burgundy`) + "najjači dan: PON".
- Bottom nav, **Statistika** active.

## Admin — data & state notes
- **Role routing**: add `role` to the profile (or a `user_roles` table). Login flow is
  unchanged; after `login()` read the role and navigate to the admin stack.
- **Users**: list/search profiles; edit `max_sessions_per_week`, name, role; delete user
  (cascade their `session_participants`). Guard all admin mutations with Supabase RLS /
  policies, not just UI.
- **Slots open/close**: a boolean on `trainings` (e.g. `is_open`). Member booking guards
  (`src/services/trainings/guards.ts`) must also reject joins when `is_open === false`.
- **Statistics**: derive monthly series from `created_at` on profiles (new members/month,
  cumulative total) and from `session_participants` vs `max_participants` (occupancy).
  Numbers in the mock are illustrative — replace with real aggregate queries / a
  Postgres view or RPC.
- **New routes/screens** not in the current repo: admin dashboard, users, workouts list,
  workout form, statistics, and the shared admin tab bar. The login screen is reused.

codex
The token and type definitions match the requested interfaces. One existing untracked `.tmnt` run file is present; I’ll leave it untouched. I’m proceeding with flat admin components, five placeholder screens, the admin tab layout, and only the RootNavigator routing block.
exec
/bin/zsh -lc "rg --files src/components/admin 'app/(admin)' 2>/dev/null || true
sed -n '1,260p' eslint.config.js 2>/dev/null || true
sed -n '1,220p' tsconfig.json
cat package.json" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier/flat");

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ["dist/*"],
  },
]);
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

