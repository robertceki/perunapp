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
session id: 019f0af7-7d5e-7291-89f2-7bafae95450d
--------
user
TASK: Phase B UI Wave C — Implement Korisnici (users), Treninzi (sessions), and training form screens

CONTEXT
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Framework: React Native (Expo) + Tauri 2, Svelte 5 runes
Reusable components: src/components/admin/ (UserRow, SessionRow, Toggle, FilterChips, AdminHeader)
Services: src/services/admin/ (listUsers, updateUser, deleteUser, setSessionOpen, upsertSession)
Types: AdminUser, UpsertSessionInput, UpdateUserPatch, Training
Hook: useTrainings() → {trainings, loading, fetchTrainings, getTrainingsByDay}
Day enum: src/constants/days.ts (TRAINING_DAYS = monday…saturday)
Design tokens: Colors, Radii, Spacing, Shadows, FontFamilies from constants

SCREENS TO IMPLEMENT
(1) app/(admin)/(tabs)/users.tsx — Korisnici (user list + search + filters + edit/delete)
(2) app/(admin)/(tabs)/sessions.tsx — Treninzi (session list by day + toggle open/close)
(3) app/(admin)/training/[id].tsx — create/edit form (no tab bar, own nav bar)

KEY CONSTRAINTS
- users.tsx and sessions.tsx: Do NOT render AdminHeader; it's in the (tabs)/_layout.tsx
- Tab screens: wrap content in ScrollView, paper bg, paddingHorizontal 20
- Form screen: outside tabs group; renders its own nav bar (back chevron + title)
- All screens: TypeScript strict, no `any`. React Native primitives only (View/Text/Pressable/TextInput/FlatList/ScrollView/Modal/ActivityIndicator)
- Reuse existing tokens/components. Do NOT create new colors, spacing, or dependencies
- No production code changes outside the three target screens
- tsc --noEmit must pass; eslint must pass on app/(admin) and src/components/admin

DETAILED DESIGN SPECS (from README §6–8, design_handoff_perun_redesign)

=== USERS.TSX ===
Layout:
- Header: View with "Korisnici" (Bricolage 23/800, ink) + "{users.length} članova" (Hanken 13/600, inkMuted)
- Search TextInput: white bg, border fieldBorder, radius 14, paddingH/V 12, placeholder "Pretraži članove…"
  Filter users client-side: first_name + last_name + email, case-insensitive
- FilterChips: [{key:"svi",label:"Svi"},{key:"aktivni",label:"Aktivni"},{key:"admini",label:"Admini"}]
  "aktivni" = enabled !== false
  "admini" = role === "admin"
- FlatList of UserRow (reuse component from @/components/admin)
  Track expandedId (only one expanded at a time)
  UserRow.tintIndex = list.indexOf(user) % 3
  onEdit(user) → open Modal (see below)
  onRemove(user) → Alert confirm ("Ukloni korisnika", "{first_name} {last_name} i sve njegove rezervacije će biti uklonjeni.", ["Otkaži", "Ukloni"]) → deleteUser → re-fetch
- Edit Modal (RN <Modal animationType="slide" transparent>)
  Card with title "Izmena korisnika", fields:
  - first_name TextInput (Hanken 14/600, ink)
  - last_name TextInput
  - role: FilterChips [{key:"user",label:"Član"},{key:"admin",label:"Admin"}]
  - max_sessions_per_week: stepper (−/value/+, clamp 0..14, burgundy text on − and +)
  Footer: "Otkaži" (outline burgundy) + "Sačuvaj" (full-width, burgundy bg)
  On save: await updateUser(user.id, {...patch}) → close + re-fetch users. Error → Alert.
- Loading state: ActivityIndicator while fetching
- Error fallback: "Greška pri učitavanju" text

=== SESSIONS.TSX ===
Layout:
- Header: View with "Treninzi" (Bricolage 23/800) + "{selectedDayLabel} · {date}" (Hanken 13/600, inkMuted)
  Right: burgundy pill button "＋ Novi" → router.push("/(admin)/training/new")
- Day selector: chip row PON–SUB (reuse DayFilter if dates fit, or build simpler chip row with day enum only)
  Default selected: "monday"
  Styles: inactive white/border, active burgundy bg
- FlatList of SessionRow for getTrainingsByDay(selectedDay)
  SessionRow props: session, bookedCount=session_participants.length, onToggleOpen={async (open)=>...}, onPress={()=>router.push(`/(admin)/training/${session.id}`)}
  onToggleOpen: await setSessionOpen(session.id, open); await fetchTrainings(); on error Alert + still fetchTrainings to resync
- Empty state: "Nema termina za ovaj dan." (Hanken 13/600, inkMuted) centered
- Loading state: ActivityIndicator

=== TRAINING/[ID].TSX ===
Layout:
- useLocalSearchParams<{ id: string }>(); isNew = id === "new"
- Own nav bar (NOT in tabs group): 38×38 square button (white/border/radius 12) with back chevron "‹" (burgundy) → router.back(); center title "Novi trening" or "Izmena treninga"; right spacer
- Fetch data when editing: useTrainings().trainings.find(t=>t.id===id); if not found && !isNew → show "Termin nije pronađen" + back button
- Form state:
  title, day_of_week (default "monday"), time, room (string|null, default ""), duration_min (number|null), max_participants (default 10), is_open (default true)
- Fields (label = Hanken 10/700 uppercase, inputs white/border/radius 14):
  - "NAZIV TRENINGA" TextInput
  - "DAN" FilterChips PON–SUB (single-select, day_of_week)
  - Row 2 cols: "VREME" TextInput (e.g. "18:00") | "TRAJANJE (MIN)" numeric TextInput
  - Row 2 cols: "SALA" TextInput | "MAKS. UČESNIKA" stepper (1..50, burgundy)
  - "Status slota" card (surfaceWarm bg, goldBorder): "Otvoren za prijave članova" label + Toggle (46×27, ON=burgundy)
- Sticky footer (absolute bottom or ScrollView footer):
  "Otkaži" (outline burgundy) → router.back()
  "Sačuvaj trening" (full-width, burgundy, Shadows.primaryButton) → validate (title non-empty, time non-empty, max_participants>=1) → await upsertSession({id: isNew?null:id, ...fields}) → await fetchTrainings() → router.back(); disable while submitting; on error Alert
- KeyboardAvoidingView or ScrollView for form fields
- NEVER render AdminHeader or tab bar in this screen

EXISTING REUSABLE CODE
From @/components/admin:
- UserRow: props { user: AdminUser, expanded: boolean, onToggleExpand, onEdit, onRemove, tintIndex?: number }
- SessionRow: props { session: Training, bookedCount: number, onToggleOpen, onPress?: () => void }
- Toggle: props { value: boolean, onValueChange, disabled?: boolean }
- FilterChips: props { options: {key, label}[], value: T, onChange: (k:T)=>void }

From @/services/admin:
- listUsers(): Promise<AdminUser[]>
- updateUser(target: string, patch: UpdateUserPatch): Promise<void>
- deleteUser(target: string): Promise<void>
- setSessionOpen(sessionId: string, open: boolean): Promise<void>
- upsertSession(input: UpsertSessionInput): Promise<string>

From @/hooks:
- useTrainings(): {trainings, loading, fetchTrainings, getTrainingsByDay}

Import const day arrays/helpers from src/constants/days.ts (TRAINING_DAYS, Day type)

CODING RULES
- Keep it clean: minimal state, reuse existing patterns (tabs layout, modal, FlatList)
- Surgical edits: touch only the three target screens + optionally create app/(admin)/training/_layout.tsx if needed for router structure. DO NOT modify existing admin components or services
- Match existing style (use the constants for colors, spacing, shadows, typography; match existing Hanken/Bricolage weights/sizes)
- No new dependencies. No speculative features.
- Error handling: Alert.alert on RPC failures. Always re-fetch after mutations to maintain consistent state.
- Loading states: show ActivityIndicator, disable buttons
- Validation: non-empty title, non-empty time, max_participants >= 1

OUTPUT PLAN
1. Implement app/(admin)/(tabs)/users.tsx (full)
2. Implement app/(admin)/(tabs)/sessions.tsx (full)
3. Implement app/(admin)/training/[id].tsx (full)
4. Verify tsc --noEmit passes
5. Verify eslint passes on target directories
6. Final line: "DONE"

DEFINITION OF DONE
- All three screens implemented with real services and state management
- Mutations work: updateUser/deleteUser refresh list; setSessionOpen/upsertSession refresh trainings
- No AdminHeader in tab screens (it's in _layout)
- Form has its own nav bar, no tab bar
- tsc --noEmit exits 0
- eslint exits 0 on app/(admin) and src/components/admin
- No new errors introduced

If anything is unclear or you hit a blocker, output "QUESTION: <text>" before stopping.
codex
I’ll inspect the existing screen stubs, tokens, types, services, hook, and admin component APIs, then implement only the three authorized screens and run the requested TypeScript and ESLint checks.
  → Inspect existing admin patterns and APIs
  • Implement users.tsx
  • Implement sessions.tsx
  • Implement training/[id].tsx
  • Run TypeScript and ESLint verification
exec
/bin/zsh -lc "pwd && rg --files 'app/(admin)' src/components/admin src/services/admin src/hooks src/constants | sort && git status --short" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
/Users/uros/Documents/Private/Projects/PerunApp
app/(admin)/(tabs)/_layout.tsx
app/(admin)/(tabs)/index.tsx
app/(admin)/(tabs)/sessions.tsx
app/(admin)/(tabs)/stats.tsx
app/(admin)/(tabs)/users.tsx
app/(admin)/_layout.tsx
app/(admin)/training/[id].tsx
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
src/hooks/useAuth.ts
src/hooks/useTrainings.ts
src/services/admin/index.ts
src/services/admin/sessions.ts
src/services/admin/stats.ts
src/services/admin/types.ts
src/services/admin/users.ts
 M .claude/agents/memory/michelangelo-memory.md
 M app/_layout.tsx
?? .claude/agents/tmnt/session-logs/2026-06-27-S7-michelangelo.md
?? .claude/agents/tmnt/session-logs/2026-06-27-S8-michelangelo.md
?? .tmnt/runs/B-M3-B-M7-mikey.md
?? .tmnt/runs/B-M4-M5-M6-mikey.md
?? .tmnt/runs/B-M8-B-M2-B-M1-mikey.md
?? .tmnt/runs/B-M8-components.md
?? app/(admin)/
?? src/components/admin/

exec
/bin/zsh -lc "sed -n '1,240p' 'app/(admin)/(tabs)/users.tsx'
sed -n '1,240p' 'app/(admin)/(tabs)/sessions.tsx'
sed -n '1,280p' 'app/(admin)/training/[id].tsx'
sed -n '1,220p' 'app/(admin)/(tabs)/index.tsx'
sed -n '1,220p' 'app/(admin)/(tabs)/stats.tsx'
sed -n '1,220p' 'app/(admin)/(tabs)/_layout.tsx'
sed -n '1,160p' 'app/(admin)/_layout.tsx'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/typography";

export default function KorisniciScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Korisnici</Text>
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
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/typography";

export default function TreninziScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Treninzi</Text>
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
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/typography";

export default function TrainingDetailScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Training Detail</Text>
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
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import BarChart from "@/components/admin/BarChart";
import StatTile from "@/components/admin/StatTile";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { Typography } from "@/constants/typography";
import { useTrainings } from "@/hooks/useTrainings";
import { memberSeries, occupancySummary } from "@/services/admin/stats";
import type {
  MemberSeriesPoint,
  OccupancySummary,
} from "@/services/admin/types";
import type { Day } from "@/constants/days";

const MONTHS_LC = [
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

const DAYS_BY_INDEX: readonly Day[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function monthAbbrevFrom(isoMonth: string) {
  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
  return MONTHS_LC[monthIndex] ?? "—";
}

function getTodayEnum() {
  return DAYS_BY_INDEX[new Date().getDay()];
}

function trendPercent(series: MemberSeriesPoint[]) {
  const first = series[0]?.total_members;
  const last = series.at(-1)?.total_members;

  if (first === undefined || last === undefined || first === 0) return null;
  return Math.round(((last - first) / Math.max(first, 1)) * 100);
}

export default function PregledScreen() {
  const router = useRouter();
  const { trainings, loading: trainingsLoading } = useTrainings();
  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([memberSeries(6), occupancySummary("6")])
      .then(([memberData, occupancyData]) => {
        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
        if (!active) return;
        setSeries(memberData);
        setOccupancy(occupancyData);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading || trainingsLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={Colors.burgundy} />
      </View>
    );
  }

  if (hasError || !occupancy) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Greška pri učitavanju</Text>
      </View>
    );
  }

  const now = new Date();
  const latestMembers = series.at(-1)?.total_members;
  const pct = trendPercent(series);
  const today = getTodayEnum();
  const openToday = trainings.filter(
    (training) => training.is_open && training.day_of_week === today,
  ).length;
  const chartData = series.map((point) => ({
    label: monthAbbrevFrom(point.month),
    value: point.total_members,
  }));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={styles.greeting}>Zdravo, Admin</Text>
        <Text style={styles.subtitle}>
          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()}{" "}
          {now.getFullYear()}
        </Text>
      </View>

      <View style={styles.tileGrid}>
        <View style={styles.tileRow}>
          <View style={styles.tileCell}>
            <StatTile
              figure={latestMembers?.toString() ?? "—"}
              label="aktivnih članova"
              figureColor={Colors.burgundy}
              delta={
                occupancy.new_this_month === 0
                  ? undefined
                  : `▲ +${occupancy.new_this_month} ovog meseca`
              }
              deltaColor="#4E7A5C"
            />
          </View>
          <View style={styles.tileCell}>
            <StatTile
              figure={`${occupancy.avg_pct}%`}
              label="popunjenost"
              figureColor={Colors.goldDeep}
            />
          </View>
        </View>
        <View style={styles.tileRow}>
          <View style={styles.tileCell}>
            <StatTile
              figure={trainings.length.toString()}
              label="treninga ove nedelje"
              figureColor={Colors.ink}
            />
          </View>
          <View style={styles.tileCell}>
            <StatTile
              figure={openToday.toString()}
              label="otvorenih slotova danas"
              figureColor={Colors.sage}
            />
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
          <View style={styles.trendBadge}>
            <Text style={styles.trendText}>
              {pct === null ? "—" : `▲ ${pct}% / 6m`}
            </Text>
          </View>
        </View>
        <BarChart
          data={chartData}
          currentIndex={chartData.length - 1}
          showValueLabelOnCurrent
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/(admin)/training/new")}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 18,
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import BarChart from "@/components/admin/BarChart";
import FilterChips from "@/components/admin/FilterChips";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { memberSeries, occupancySummary } from "@/services/admin/stats";
import type {
  MemberSeriesPoint,
  OccupancySummary,
} from "@/services/admin/types";

type Period = "12" | "6" | "all";

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "12", label: "12 meseci" },
  { key: "6", label: "6 meseci" },
  { key: "all", label: "Sve" },
];

const MONTHS_LC = [
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

const DAY_ABBR: Record<string, string> = {
  monday: "PON",
  tuesday: "UTO",
  wednesday: "SRE",
  thursday: "ČET",
  friday: "PET",
  saturday: "SUB",
  sunday: "NED",
};

function monthAbbrevFrom(isoMonth: string) {
  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
  return MONTHS_LC[monthIndex] ?? "—";
}

function trendPercent(series: MemberSeriesPoint[]) {
  const first = series[0]?.total_members;
  const last = series.at(-1)?.total_members;

  if (first === undefined || last === undefined || first === 0) return null;
  return Math.round(((last - first) / Math.max(first, 1)) * 100);
}

export default function StatsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const months: 12 | 6 | 24 =
    selectedPeriod === "all" ? 24 : selectedPeriod === "12" ? 12 : 6;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setHasError(false);

    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
      .then(([memberData, occupancyData]) => {
        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
        if (!active) return;
        setSeries(memberData);
        setOccupancy(occupancyData);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [months, selectedPeriod]);

  if (loading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={Colors.burgundy} />
      </View>
    );
  }

  if (hasError || !occupancy) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Greška pri učitavanju</Text>
      </View>
    );
  }

  const chartData = series.map((point) => ({
    label: monthAbbrevFrom(point.month),
    value: point.total_members,
  }));
  const latestMembers = series.at(-1)?.total_members;
  const pct = trendPercent(series);
  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
  const topDay =
    DAY_ABBR[occupancy.top_day] ??
    (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={styles.title}>Statistika</Text>
        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
      </View>

      <FilterChips
        options={PERIOD_OPTIONS}
        value={selectedPeriod}
        onChange={setSelectedPeriod}
      />

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
            <Text style={styles.memberFigure}>
              {latestMembers?.toString() ?? "—"}
            </Text>
          </View>
          <View style={styles.trendBadge}>
            <Text style={styles.trendText}>
              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
            </Text>
          </View>
        </View>
        <BarChart data={chartData} currentIndex={chartData.length - 1} />
      </View>

      <View style={styles.secondaryRow}>
        <View style={styles.secondaryTile}>
          <Text style={styles.microLabel}>NOVIH / MES.</Text>
          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
            +{occupancy.new_this_month}
          </Text>
          <Text
            style={[
              styles.secondaryDelta,
              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
            ]}
          >
            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
          </Text>
        </View>
        <View style={styles.secondaryTile}>
          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
            {occupancy.avg_pct}%
          </Text>
          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
            najjači dan: {topDay}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 18,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  errorText: {
    ...Typography.body,
    color: Colors.inkMuted,
  },
  title: {
    ...Typography.screenTitle,
    fontSize: 23,
    color: Colors.ink,
  },
  subtitle: {
    ...Typography.meta,
    color: Colors.inkMuted,
    marginTop: 3,
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import AdminHeader from "@/components/admin/AdminHeader";
import { Colors } from "@/constants/Colors";
import { FontFamilies } from "@/constants/typography";

// Shared admin chrome: the AdminHeader (emblem + PERUN + ADMIN badge + avatar)
// sits above the tab navigator, so all four tab screens inherit it. The
// create/edit form lives outside this group and renders its own nav bar.
export default function AdminTabsLayout() {
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
          tabBarIconStyle: { marginBottom: -2 },
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
import { Stack } from "expo-router";

import { Colors } from "@/constants/Colors";

// Admin stack: the tab navigator lives in (tabs); the create/edit form is a
// sibling stack route so it renders WITHOUT the admin header or bottom tab bar.
export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.paper },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="training/[id]" />
    </Stack>
  );
}

exec
/bin/zsh -lc "sed -n '1,240p' src/components/admin/UserRow.tsx
sed -n '1,240p' src/components/admin/SessionRow.tsx
sed -n '1,200p' src/components/admin/FilterChips.tsx
sed -n '1,180p' src/components/admin/Toggle.tsx
sed -n '1,160p' src/components/admin/index.ts
sed -n '1,240p' src/services/admin/types.ts
sed -n '1,240p' src/services/admin/users.ts
sed -n '1,220p' src/services/admin/sessions.ts
sed -n '1,160p' src/services/admin/index.ts
sed -n '1,240p' src/hooks/useTrainings.ts
sed -n '1,180p' src/constants/days.ts
sed -n '1,240p' src/constants/Colors.ts
sed -n '1,200p' src/constants/spacing.ts
sed -n '1,200p' src/constants/typography.ts" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies } from "@/constants/typography";
import { AdminUser } from "@/services/admin/types";

interface UserRowProps {
  user: AdminUser;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onRemove: () => void;
  tintIndex?: number;
}

const tints = [Colors.sage, Colors.gold, Colors.burgundy];

export default function UserRow({ user, expanded, onToggleExpand, onEdit, onRemove, tintIndex = 0 }: UserRowProps) {
  const avatarColor = tints[tintIndex % 3];
  const initials = [user.first_name[0] || "", (user.last_name?.[0] || "")]
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable onPress={onToggleExpand}>
      <View style={[styles.card, expanded && styles.cardExpanded]}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
            <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: user.role === "admin" ? Colors.burgundyTint : Colors.sageTint }]}>
            <Text style={[styles.chipText, { color: user.role === "admin" ? Colors.burgundy : Colors.sage }]}>
              {user.role === "admin" ? "Admin" : `${user.max_sessions_per_week}× / ned`}
            </Text>
          </View>
        </View>
        {expanded && (
          <View style={styles.actions}>
            <Pressable onPress={onEdit} style={styles.editBtn}>
              <Text style={styles.editText}>Izmeni</Text>
            </Pressable>
            <Pressable onPress={onRemove} style={styles.removeBtn}>
              <Text style={styles.removeText}>Ukloni</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[16],
    padding: Spacing.cardPadding,
    ...Shadows.card,
  },
  cardExpanded: {
    backgroundColor: Colors.surfaceWarm,
    borderColor: Colors.goldBorder,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.cardGap,
  },
  avatar: { width: 36, height: 36, borderRadius: 9999, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: FontFamilies.hanken[700], fontSize: 12, fontWeight: "700", color: Colors.surface },
  info: { flex: 1 },
  name: { fontFamily: FontFamilies.hanken[700], fontSize: 14, fontWeight: "700", color: Colors.ink },
  email: { fontFamily: FontFamilies.hanken[600], fontSize: 12, fontWeight: "600", color: Colors.inkMuted },
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.chip },
  chipText: { fontFamily: FontFamilies.hanken[700], fontSize: 12, fontWeight: "700" },
  actions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 12,
  },
  editBtn: { borderColor: Colors.burgundyBorder, borderWidth: 1, borderRadius: Radii.tile[12], paddingHorizontal: 12, paddingVertical: 8 },
  editText: { fontFamily: FontFamilies.hanken[700], fontSize: 14, fontWeight: "700", color: Colors.burgundy },
  removeBtn: { borderColor: "#EAC6BF", borderWidth: 1, borderRadius: Radii.tile[12], paddingHorizontal: 12, paddingVertical: 8 },
  removeText: { fontFamily: FontFamilies.hanken[700], fontSize: 14, fontWeight: "700", color: "#C0341B" },
});
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies } from "@/constants/typography";
import { Training } from "@/types/Training";
import Toggle from "./Toggle";

interface SessionRowProps {
  session: Training;
  bookedCount: number;
  onToggleOpen: (open: boolean) => void;
  onPress?: () => void;
}

export default function SessionRow({ session, bookedCount, onToggleOpen, onPress }: SessionRowProps) {
  const isFull = bookedCount >= session.max_participants;
  const isClosed = !session.is_open;

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.card, isClosed && styles.cardClosed]}>
        <View style={styles.content}>
          <View style={styles.timeBlock}>
            <Text style={[styles.time, isClosed && styles.textMuted]}>{session.time}</Text>
            <Text style={[styles.duration, isClosed && styles.textMuted]}>
              {session.duration_min ? `${session.duration_min} min` : "—"}
            </Text>
          </View>
          <View style={[styles.divider, isClosed && { backgroundColor: "#ECE3D6" }]} />
          <View style={styles.main}>
            <Text style={[styles.title, isClosed && styles.textMuted]}>{session.title}</Text>
            <Text style={[styles.booked, isClosed && styles.textMuted]}>
              {session.room || "Sala"} · {bookedCount} / {session.max_participants}
            </Text>
            {isFull && !isClosed && (
              <View style={styles.fullChip}>
                <Text style={styles.fullText}>Popunjeno</Text>
              </View>
            )}
            {isClosed && (
              <View style={styles.closedChip}>
                <Text style={styles.closedText}>Zatvoreno</Text>
              </View>
            )}
          </View>
          <Toggle value={session.is_open} onValueChange={onToggleOpen} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    ...Shadows.card,
  },
  cardClosed: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: "#ECE3D6",
  },
  content: { flexDirection: "row", alignItems: "center", gap: 12 },
  timeBlock: { gap: 2 },
  time: { fontFamily: FontFamilies.bricolage[800], fontSize: 17, fontWeight: "800", color: Colors.ink },
  duration: { fontFamily: FontFamilies.hanken[600], fontSize: 10, fontWeight: "600", color: Colors.inkFaint },
  divider: { width: 1, height: 40, backgroundColor: Colors.border },
  main: { flex: 1, gap: 2 },
  title: { fontFamily: FontFamilies.bricolage[700], fontSize: 15, fontWeight: "700", color: Colors.ink },
  booked: { fontFamily: FontFamilies.hanken[600], fontSize: 12, fontWeight: "600", color: Colors.sage },
  fullChip: { backgroundColor: Colors.burgundyTint, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radii.chip },
  fullText: { fontFamily: FontFamilies.hanken[700], fontSize: 11, fontWeight: "700", color: Colors.burgundyText2 },
  closedChip: { backgroundColor: Colors.surfaceMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radii.chip },
  closedText: { fontFamily: FontFamilies.hanken[700], fontSize: 11, fontWeight: "700", color: Colors.inkMuted },
  textMuted: { color: Colors.inkMuted },
});
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { Radii } from "@/constants/spacing";
import { FontFamilies } from "@/constants/typography";

interface FilterChipsProps<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
}

export default function FilterChips<T extends string>({ options, value, onChange }: FilterChipsProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => (
        <Pressable key={opt.key} onPress={() => onChange(opt.key)} style={[
          styles.chip,
          { backgroundColor: opt.key === value ? Colors.burgundy : Colors.surface,
            borderColor: opt.key === value ? "transparent" : Colors.fieldBorder },
        ]}>
          <Text style={[styles.label, { color: opt.key === value ? Colors.surface : Colors.ink }]}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radii.chip, borderWidth: 1 },
  label: { fontFamily: FontFamilies.hanken[700], fontSize: 12, fontWeight: "700" },
});
import { Pressable, StyleSheet, View } from "react-native";
import { Colors } from "@/constants/Colors";

interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ value, onValueChange, disabled = false }: ToggleProps) {
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[styles.container, { opacity: disabled ? 0.5 : 1 }]}
    >
      <View style={[styles.track, { backgroundColor: value ? Colors.burgundy : "#DDD3C7" }]}>
        <View style={[styles.knob, { left: value ? 22 : 3 }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: 46, height: 27, justifyContent: "center" },
  track: { width: "100%", height: "100%", borderRadius: 20, position: "relative" },
  knob: { width: 21, height: 21, borderRadius: 9999, backgroundColor: Colors.surface, position: "absolute", top: 3 },
});
export { default as AdminHeader } from "./AdminHeader";
export { default as StatTile } from "./StatTile";
export { default as BarChart } from "./BarChart";
export { default as Toggle } from "./Toggle";
export { default as FilterChips } from "./FilterChips";
export { default as UserRow } from "./UserRow";
export { default as SessionRow } from "./SessionRow";
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
import { supabase } from "../supabase/client";
import { AdminUser, UpdateUserPatch } from "./types";

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc("admin_list_users");

  if (error) throw error;
  return (data ?? []) as AdminUser[];
}

export async function updateUser(
  target: string,
  patch: UpdateUserPatch,
): Promise<void> {
  const { error } = await supabase.rpc("admin_update_user", {
    p_target: target,
    p_first_name: patch.first_name ?? null,
    p_last_name: patch.last_name ?? null,
    p_role: patch.role ?? null,
    p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
  });

  if (error) throw error;
}

export async function deleteUser(target: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_user", {
    p_target: target,
  });

  if (error) throw error;
}
import { supabase } from "../supabase/client";
import { UpsertSessionInput } from "./types";

export async function setSessionOpen(
  sessionId: string,
  open: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("admin_set_session_open", {
    p_session_id: sessionId,
    p_open: open,
  });

  if (error) throw error;
}

export async function upsertSession(
  input: UpsertSessionInput,
): Promise<string> {
  const { data, error } = await supabase.rpc("admin_upsert_session", {
    p_id: input.id,
    p_title: input.title,
    p_day_of_week: input.day_of_week,
    p_time: input.time,
    p_room: input.room,
    p_duration_min: input.duration_min,
    p_max_participants: input.max_participants,
    p_is_open: input.is_open,
  });

  if (error) throw error;
  return data as string;
}
export * from "./types";
export * from "./sessions";
export * from "./users";
export * from "./stats";
import { useContext } from "react";

import { TrainingContext } from "@/contexts/TrainingContext";

export function useTrainings() {
  return useContext(TrainingContext);
}
// Week window resets Sunday 00:00 (Sunday-start week).
// DAYS array includes all 7 days for completeness (matching DB schema day_of_week field).
// DayFilter display is currently limited to Mon-Sat (training days), which is maintained
// separately below for backward compatibility with existing UI.

export type Day =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

// Full canonical week (Sunday-start, for DB and date logic)
export const DAYS: Day[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// Days currently displayed in the UI filter (Mon-Sat training schedule)
export const TRAINING_DAYS: Day[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
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
/bin/zsh -lc "sed -n '1,260p' src/types/Training.ts
sed -n '1,320p' src/contexts/TrainingContext.tsx
cat package.json
rg \"getTrainingsByDay|day_of_week|Intl.DateTimeFormat|toLocaleDateString\" app src -g '*.tsx' -g '*.ts'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
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
import { createContext, useEffect, useState } from "react";
import { Alert } from "react-native";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase/client";
import { Training } from "@/types/Training";

const bookingErrorMessages: Record<string, string> = {
  weekly_limit_reached: "Dostigli ste nedeljni limit.",
  session_full: "Termin je popunjen.",
  session_closed: "Termin je trenutno zatvoren za prijave.",
  already_joined: "Već ste prijavljeni na ovaj termin.",
  not_authenticated: "Niste prijavljeni.",
  session_not_found: "Termin nije pronađen.",
};

const getBookingErrorMessage = (rawMessage: string, mapRpcCodes = true) => {
  if (mapRpcCodes) {
    const code = Object.keys(bookingErrorMessages).find((key) =>
      rawMessage.includes(key),
    );

    if (code) return bookingErrorMessages[code];
  }

  const fallback = "Došlo je do greške. Pokušajte ponovo.";
  return __DEV__ && rawMessage ? `${fallback}\n\n${rawMessage}` : fallback;
};

type TrainingContextType = {
  trainings: Training[];
  loading: boolean;
  fetchTrainings: () => Promise<void>;
  getTrainingsByDay: (day: string) => Training[];
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: (sessionId: string) => Promise<void>;
  canJoinSession: () => boolean;
  reachedLimit: boolean;
  bookedCount: number;
};

export const TrainingContext = createContext<TrainingContextType>({
  trainings: [],
  loading: true,
  fetchTrainings: async () => {},
  getTrainingsByDay: () => [],
  joinSession: async () => {},
  leaveSession: async () => {},
  canJoinSession: () => false,
  reachedLimit: false,
  bookedCount: 0,
});

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const { session, profile } = useAuth();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // FETCH
  // -------------------------
  const fetchTrainings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("sessions")
      .select(
        `*,session_participants (
          user_id,
          profiles (
            first_name,
            last_name
          )
        )`,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // IMPORTANT: new reference
    setTrainings([...(data as Training[])]);

    setLoading(false);
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  // -------------------------
  // FILTER
  // -------------------------
  const getTrainingsByDay = (day: string) =>
    trainings.filter((t) => t.day_of_week === day);

  // -------------------------
  // BOOKED COUNT
  // -------------------------
  const bookedCount = trainings
    .flatMap((t) => t.session_participants)
    .filter((p) => p.user_id === session?.user?.id).length;

  const maxSessions = profile?.max_sessions_per_week ?? 0;
  // No `> 0` guard here: a user with a 0 allowance HAS reached their limit, so
  // TrainingCard correctly disables the join button. AlertBar applies its own
  // `max > 0` guard for the red "limit" warning display.
  const reachedLimit = bookedCount >= maxSessions;

  // -------------------------
  // GUARD
  // -------------------------
  const canJoinSession = () => {
    if (!session?.user?.id || !profile) return false;

    return bookedCount < (profile.max_sessions_per_week ?? 0);
  };

  // -------------------------
  // JOIN (SAFE - NO FAKE DATA)
  // -------------------------
  const joinSession = async (sessionId: string) => {
    const userId = session?.user?.id;
    if (!userId) return;

    if (!canJoinSession()) return;

    const { error } = await supabase.rpc("join_session", {
      p_session_id: sessionId,
    });

    if (error) {
      if (__DEV__) console.error(error);
      Alert.alert(getBookingErrorMessage(error.message));
      return;
    }

    // ALWAYS REFRESH (CONSISTENT STATE)
    await fetchTrainings();
  };

  // -------------------------
  // LEAVE
  // -------------------------
  const leaveSession = async (sessionId: string) => {
    const userId = session?.user?.id;
    if (!userId) return;

    const { error } = await supabase
      .from("session_participants")
      .delete()
      .match({
        session_id: sessionId,
        user_id: userId,
      });

    if (error) {
      if (__DEV__) console.error(error);
      Alert.alert(getBookingErrorMessage(error.message, false));
      return;
    }

    await fetchTrainings();
  };

  const value = {
    trainings,
    loading,
    fetchTrainings,
    getTrainingsByDay,
    joinSession,
    leaveSession,
    canJoinSession,
    reachedLimit,
    bookedCount,
  };

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
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
src/services/admin/sessions.ts:    p_day_of_week: input.day_of_week,
src/types/Training.ts:  day_of_week: string;
src/utils/week.ts:  const parts = new Intl.DateTimeFormat("en-CA", {
src/utils/week.ts:  const part = (type: Intl.DateTimeFormatPartTypes) =>
src/constants/days.ts:// DAYS array includes all 7 days for completeness (matching DB schema day_of_week field).
src/contexts/TrainingContext.tsx:  getTrainingsByDay: (day: string) => Training[];
src/contexts/TrainingContext.tsx:  getTrainingsByDay: () => [],
src/contexts/TrainingContext.tsx:  const getTrainingsByDay = (day: string) =>
src/contexts/TrainingContext.tsx:    trainings.filter((t) => t.day_of_week === day);
src/contexts/TrainingContext.tsx:    getTrainingsByDay,
src/services/admin/types.ts:  day_of_week: string;
app/(admin)/(tabs)/index.tsx:    (training) => training.is_open && training.day_of_week === today,
app/profile.tsx:        isTrainingDay(training.day_of_week) &&
app/profile.tsx:        weekDates[a.day_of_week as Day].getTime() -
app/profile.tsx:        weekDates[b.day_of_week as Day].getTime();
app/profile.tsx:            const day = training.day_of_week as Day;
app/(tabs)/_layout.tsx:  const { getTrainingsByDay } = useTrainings();
app/(tabs)/_layout.tsx:  const data = getTrainingsByDay(selectedDay);

exec
/bin/zsh -lc "sed -n '1,280p' 'app/(tabs)/_layout.tsx'
sed -n '1,260p' src/utils/week.ts
rg \"PON|UTO|SRE|ČET|PET|SUB|DayFilter\" app src -g '*.tsx' -g '*.ts'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
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
import { Day, TRAINING_DAYS } from "@/constants/days";

export type TrainingWeekDates = Record<Day, Date>;

const BELGRADE_TIME_ZONE = "Europe/Belgrade";

export function getCurrentWeekDates(
  referenceDate: Date = new Date(),
): TrainingWeekDates {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: BELGRADE_TIME_ZONE,
    year: "numeric",
  }).formatToParts(referenceDate);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((value) => value.type === type)?.value);

  const belgradeDate = new Date(
    Date.UTC(part("year"), part("month") - 1, part("day")),
  );
  const isoDay = belgradeDate.getUTCDay() || 7;
  const monday = new Date(belgradeDate);
  monday.setUTCDate(belgradeDate.getUTCDate() - isoDay + 1);

  return TRAINING_DAYS.reduce((week, day, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    week[day] = date;
    return week;
  }, {
    sunday: new Date(
      Date.UTC(
        monday.getUTCFullYear(),
        monday.getUTCMonth(),
        monday.getUTCDate() + 6,
      ),
    ),
  } as TrainingWeekDates);
}
app/(admin)/(tabs)/stats.tsx:  monday: "PON",
app/(admin)/(tabs)/stats.tsx:  tuesday: "UTO",
app/(admin)/(tabs)/stats.tsx:  wednesday: "SRE",
app/(admin)/(tabs)/stats.tsx:  thursday: "ČET",
app/(admin)/(tabs)/stats.tsx:  friday: "PET",
app/(admin)/(tabs)/stats.tsx:  saturday: "SUB",
app/profile.tsx:  monday: "PON",
app/profile.tsx:  tuesday: "UTO",
app/profile.tsx:  wednesday: "SRE",
app/profile.tsx:  thursday: "ČET",
app/profile.tsx:  friday: "PET",
app/profile.tsx:  saturday: "SUB",
app/(tabs)/_layout.tsx:import DayFilter from "@/components/DayFilter";
app/(tabs)/_layout.tsx:  monday: "PONEDELJAK",
app/(tabs)/_layout.tsx:  tuesday: "UTORAK",
app/(tabs)/_layout.tsx:  wednesday: "SREDA",
app/(tabs)/_layout.tsx:  thursday: "ČETVRTAK",
app/(tabs)/_layout.tsx:  friday: "PETAK",
app/(tabs)/_layout.tsx:  saturday: "SUBOTA",
app/(tabs)/_layout.tsx:      <DayFilter
src/components/DayFilter.tsx:interface DayFilterProps {
src/components/DayFilter.tsx:  monday: "PON",
src/components/DayFilter.tsx:  tuesday: "UTO",
src/components/DayFilter.tsx:  wednesday: "SRE",
src/components/DayFilter.tsx:  thursday: "ČET",
src/components/DayFilter.tsx:  friday: "PET",
src/components/DayFilter.tsx:  saturday: "SUB",
src/components/DayFilter.tsx:export default function DayFilter({ selected, setSelected }: DayFilterProps) {
src/constants/days.ts:// DayFilter display is currently limited to Mon-Sat (training days), which is maintained

exec
/bin/zsh -lc "rg -n \"Korisnici|Treninzi|Izmena korisnika|Status slota|Novi trening\" README.md . -g '*.md' --glob '"'!node_modules/**'"' --glob '"'!.git/**'"'" in /Users/uros/Documents/Private/Projects/PerunApp
 exited 2 in 0ms:
rg: README.md: No such file or directory (os error 2)

codex
The existing APIs match the task. I’ll keep each tab screen as a single `FlatList` scroll surface (it provides the required scrolling without nesting a virtualized list inside a `ScrollView`), use the current-week Belgrade date helper for session labels, and preserve the existing stack separation for the form.
apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/sessions.tsx
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/users.tsx
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/training/[id].tsx
diff --git a/app/(admin)/(tabs)/sessions.tsx b/app/(admin)/(tabs)/sessions.tsx
index b37d42eee582cfcbbfbaba8b37d423440c0794ae..df22d2c62a54e17bd6bdbca98213ae4760f430de
--- a/app/(admin)/(tabs)/sessions.tsx
+++ b/app/(admin)/(tabs)/sessions.tsx
@@ -1,12 +1,155 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  FlatList,
+  Pressable,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import { SessionRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { setSessionOpen } from "@/services/admin";
+import { getCurrentWeekDates } from "@/utils/week";
+
+const DAY_LABELS: Record<Day, string> = {
+  sunday: "NED",
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+};
+
+const DAY_NAMES: Record<Day, string> = {
+  sunday: "NEDELJA",
+  monday: "PONEDELJAK",
+  tuesday: "UTORAK",
+  wednesday: "SREDA",
+  thursday: "ČETVRTAK",
+  friday: "PETAK",
+  saturday: "SUBOTA",
+};
+
+const MONTH_NAMES = [
+  "JAN",
+  "FEB",
+  "MAR",
+  "APR",
+  "MAJ",
+  "JUN",
+  "JUL",
+  "AVG",
+  "SEP",
+  "OKT",
+  "NOV",
+  "DEC",
+] as const;
 
 export default function TreninziScreen() {
+  const router = useRouter();
+  const [selectedDay, setSelectedDay] = useState<Day>("monday");
+  const { loading, fetchTrainings, getTrainingsByDay } = useTrainings();
+  const sessions = getTrainingsByDay(selectedDay);
+  const selectedDate = getCurrentWeekDates()[selectedDay];
+  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;
+
+  const toggleSession = async (sessionId: string, open: boolean) => {
+    try {
+      await setSessionOpen(sessionId, open);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Status treninga nije promenjen.");
+    } finally {
+      await fetchTrainings();
+    }
+  };
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Treninzi</Text>
-    </View>
+    <FlatList
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      data={sessions}
+      keyExtractor={(session) => session.id}
+      showsVerticalScrollIndicator={false}
+      ItemSeparatorComponent={() => <View style={styles.listGap} />}
+      ListHeaderComponent={
+        <View style={styles.headerContent}>
+          <View style={styles.titleRow}>
+            <View style={styles.titleBlock}>
+              <Text style={styles.title}>Treninzi</Text>
+              <Text style={styles.subtitle}>
+                {DAY_NAMES[selectedDay]} · {dateLabel}
+              </Text>
+            </View>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/(admin)/training/new")}
+              style={({ pressed }) => [
+                styles.newButton,
+                pressed && styles.buttonPressed,
+              ]}
+            >
+              <Text style={styles.newButtonText}>＋ Novi</Text>
+            </Pressable>
+          </View>
+
+          <View style={styles.daySelector}>
+            {TRAINING_DAYS.map((day) => {
+              const active = selectedDay === day;
+              return (
+                <Pressable
+                  key={day}
+                  onPress={() => setSelectedDay(day)}
+                  style={[
+                    styles.dayChip,
+                    active && styles.dayChipActive,
+                  ]}
+                >
+                  <Text
+                    style={[
+                      styles.dayChipText,
+                      active && styles.dayChipTextActive,
+                    ]}
+                  >
+                    {DAY_LABELS[day]}
+                  </Text>
+                </Pressable>
+              );
+            })}
+          </View>
+
+          {loading && (
+            <ActivityIndicator
+              color={Colors.burgundy}
+              style={styles.loadingIndicator}
+            />
+          )}
+        </View>
+      }
+      ListEmptyComponent={
+        loading ? null : (
+          <Text style={styles.emptyText}>Nema termina za ovaj dan.</Text>
+        )
+      }
+      renderItem={({ item }) => (
+        <SessionRow
+          session={item}
+          bookedCount={item.session_participants.length}
+          onToggleOpen={(open) => void toggleSession(item.id, open)}
+          onPress={() => router.push(`/(admin)/training/${item.id}`)}
+        />
+      )}
+    />
   );
 }
 
@@ -14,11 +157,95 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    flexGrow: 1,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  headerContent: {
+    gap: 18,
+    marginBottom: 16,
+  },
+  titleRow: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 12,
   },
+  titleBlock: {
+    flex: 1,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
     color: Colors.ink,
   },
+  subtitle: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  newButton: {
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.burgundy,
+    paddingHorizontal: 14,
+    paddingVertical: 9,
+    ...Shadows.primaryButton,
+  },
+  newButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 13,
+    fontWeight: "700",
+    color: Colors.surface,
+  },
+  buttonPressed: {
+    opacity: 0.85,
+  },
+  daySelector: {
+    flexDirection: "row",
+    justifyContent: "space-between",
+    gap: 5,
+  },
+  dayChip: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 36,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.surface,
+  },
+  dayChipActive: {
+    borderColor: Colors.burgundy,
+    backgroundColor: Colors.burgundy,
+    ...Shadows.activeDay,
+  },
+  dayChipText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  dayChipTextActive: {
+    color: Colors.surface,
+  },
+  loadingIndicator: {
+    marginTop: 10,
+  },
+  listGap: {
+    height: 10,
+  },
+  emptyText: {
+    marginTop: 48,
+    textAlign: "center",
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
 });
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 8af74755eb930ef1aea5ab7c7c6df27230debb82..d750a54b7f9ba61a558953849e34bda2533339a1
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -1,319 +1,296 @@
+import { useCallback, useEffect, useMemo, useState } from "react";
 import {
-  View,
-  Text,
-  StyleSheet,
+  ActivityIndicator,
+  Alert,
   FlatList,
-  TextInput,
   Modal,
-  Alert,
-  ActivityIndicator,
   Pressable,
-  ScrollView,
-  KeyboardAvoidingView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
 } from "react-native";
-import { useEffect, useState } from "react";
+
+import { FilterChips, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import {
-  listUsers,
-  updateUser,
-  deleteUser,
-  AdminUser,
-  UpdateUserPatch,
-} from "@/services/admin";
-import UserRow from "@/components/admin/UserRow";
-import FilterChips from "@/components/admin/FilterChips";
+import { deleteUser, listUsers, updateUser } from "@/services/admin";
+import type { AdminUser, UpdateUserPatch } from "@/services/admin";
 
-type FilterKey = "svi" | "aktivni" | "admini";
+type UserFilter = "svi" | "aktivni" | "admini";
+type UserRole = AdminUser["role"];
 
+const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
+  { key: "svi", label: "Svi" },
+  { key: "aktivni", label: "Aktivni" },
+  { key: "admini", label: "Admini" },
+];
+
+const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
+  { key: "user", label: "Član" },
+  { key: "admin", label: "Admin" },
+];
+
 export default function KorisniciScreen() {
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
+  const [hasError, setHasError] = useState(false);
+  const [search, setSearch] = useState("");
+  const [filter, setFilter] = useState<UserFilter>("svi");
   const [expandedId, setExpandedId] = useState<string | null>(null);
-  const [searchText, setSearchText] = useState("");
-  const [filter, setFilter] = useState<FilterKey>("svi");
   const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
-  const [editModal, setEditModal] = useState(false);
-  const [editForm, setEditForm] = useState({
-    first_name: "",
-    last_name: "",
-    role: "user" as "user" | "admin",
-    max_sessions_per_week: 0,
-  });
+  const [firstName, setFirstName] = useState("");
+  const [lastName, setLastName] = useState("");
+  const [role, setRole] = useState<UserRole>("user");
+  const [maxSessions, setMaxSessions] = useState(0);
   const [saving, setSaving] = useState(false);
 
-  // Load users on mount
-  useEffect(() => {
-    fetchUsers();
-  }, []);
+  const fetchUsers = useCallback(async () => {
+    setLoading(true);
+    setHasError(false);
 
-  const fetchUsers = async () => {
-    setLoading(true);
-    setError(null);
     try {
-      const data = await listUsers();
-      setUsers(data);
-    } catch (err) {
-      setError("Greška pri učitavanju");
-      if (__DEV__) console.error(err);
+      setUsers(await listUsers());
+    } catch (error: unknown) {
+      console.error(error);
+      setHasError(true);
     } finally {
       setLoading(false);
     }
-  };
+  }, []);
 
-  // Filter logic
-  const filteredUsers = users
-    .filter((u) => {
-      const searchLower = searchText.toLowerCase();
-      const matchesSearch =
-        u.first_name.toLowerCase().includes(searchLower) ||
-        (u.last_name?.toLowerCase().includes(searchLower) ?? false) ||
-        u.email.toLowerCase().includes(searchLower);
+  useEffect(() => {
+    void fetchUsers();
+  }, [fetchUsers]);
 
-      if (!matchesSearch) return false;
+  const filteredUsers = useMemo(() => {
+    const query = search.trim().toLocaleLowerCase();
+
+    return users.filter((user) => {
+      const matchesFilter =
+        filter === "svi" ||
+        (filter === "aktivni" && user.enabled !== false) ||
+        (filter === "admini" && user.role === "admin");
+      const searchable = `${user.first_name} ${user.last_name ?? ""} ${user.email}`
+        .toLocaleLowerCase();
 
-      if (filter === "aktivni") return u.enabled !== false;
-      if (filter === "admini") return u.role === "admin";
-      return true;
+      return matchesFilter && searchable.includes(query);
     });
+  }, [filter, search, users]);
 
-  // Edit modal handlers
-  const onEdit = (user: AdminUser) => {
+  const openEditModal = (user: AdminUser) => {
     setEditingUser(user);
-    setEditForm({
-      first_name: user.first_name,
-      last_name: user.last_name || "",
-      role: user.role,
-      max_sessions_per_week: user.max_sessions_per_week,
-    });
-    setEditModal(true);
+    setFirstName(user.first_name);
+    setLastName(user.last_name ?? "");
+    setRole(user.role);
+    setMaxSessions(user.max_sessions_per_week);
   };
 
-  const onRemove = (user: AdminUser) => {
-    Alert.alert(
-      "Ukloni korisnika",
-      `${user.first_name} ${user.last_name || ""} i sve njegove rezervacije će biti uklonjeni.`,
-      [
-        { text: "Otkaži", style: "cancel" },
-        {
-          text: "Ukloni",
-          onPress: async () => {
-            try {
-              await deleteUser(user.id);
-              await fetchUsers();
-            } catch (err) {
-              Alert.alert("Greška", "Nije moguće obrisati korisnika");
-              if (__DEV__) console.error(err);
-            }
-          },
-          style: "destructive",
-        },
-      ]
-    );
+  const closeEditModal = () => {
+    if (!saving) setEditingUser(null);
   };
 
-  const onSaveEdit = async () => {
+  const saveUser = async () => {
     if (!editingUser) return;
 
+    const patch: UpdateUserPatch = {
+      first_name: firstName.trim(),
+      last_name: lastName.trim(),
+      role,
+      max_sessions_per_week: maxSessions,
+    };
+
     setSaving(true);
     try {
-      const patch: UpdateUserPatch = {
-        first_name: editForm.first_name || null,
-        last_name: editForm.last_name || null,
-        role: editForm.role,
-        max_sessions_per_week: editForm.max_sessions_per_week,
-      };
       await updateUser(editingUser.id, patch);
-      setEditModal(false);
       setEditingUser(null);
       await fetchUsers();
-    } catch (err) {
-      Alert.alert("Greška", "Nije moguće sačuvati promene");
-      if (__DEV__) console.error(err);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
+      await fetchUsers();
     } finally {
       setSaving(false);
     }
   };
 
-  if (loading) {
+  const removeUser = async (user: AdminUser) => {
+    try {
+      await deleteUser(user.id);
+      setExpandedId(null);
+      await fetchUsers();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Korisnik nije uklonjen.");
+      await fetchUsers();
+    }
+  };
+
+  const confirmRemove = (user: AdminUser) => {
+    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();
+
+    Alert.alert(
+      "Ukloni korisnika",
+      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
+      [
+        { text: "Otkaži", style: "cancel" },
+        {
+          text: "Ukloni",
+          style: "destructive",
+          onPress: () => void removeUser(user),
+        },
+      ],
+    );
+  };
+
+  if (loading && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <ActivityIndicator size="large" color={Colors.burgundy} />
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
       </View>
     );
   }
 
-  if (error) {
+  if (hasError && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <Text style={styles.errorText}>{error}</Text>
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
       </View>
     );
   }
 
   return (
-    <View style={styles.screen}>
-      {/* Header */}
-      <View style={styles.header}>
-        <Text style={styles.headerTitle}>Korisnici</Text>
-        <Text style={styles.headerSubtitle}>{users.length} članova</Text>
-      </View>
-
-      {/* Search */}
-      <TextInput
-        style={styles.searchInput}
-        placeholder="Pretraži članove…"
-        placeholderTextColor={Colors.inkMuted}
-        value={searchText}
-        onChangeText={setSearchText}
-      />
-
-      {/* Filter chips */}
-      <View style={styles.filterContainer}>
-        <FilterChips<FilterKey>
-          options={[
-            { key: "svi", label: "Svi" },
-            { key: "aktivni", label: "Aktivni" },
-            { key: "admini", label: "Admini" },
-          ]}
-          value={filter}
-          onChange={setFilter}
-        />
-      </View>
-
-      {/* User list */}
+    <>
       <FlatList
+        style={styles.screen}
+        contentContainerStyle={styles.content}
         data={filteredUsers}
-        keyExtractor={(u) => u.id}
+        keyExtractor={(user) => user.id}
+        showsVerticalScrollIndicator={false}
+        ItemSeparatorComponent={() => <View style={styles.listGap} />}
+        ListHeaderComponent={
+          <View style={styles.headerContent}>
+            <View>
+              <Text style={styles.title}>Korisnici</Text>
+              <Text style={styles.subtitle}>{users.length} članova</Text>
+            </View>
+            <TextInput
+              value={search}
+              onChangeText={setSearch}
+              placeholder="Pretraži članove…"
+              placeholderTextColor={Colors.inkFaint}
+              style={styles.searchInput}
+              autoCapitalize="none"
+              autoCorrect={false}
+            />
+            <FilterChips
+              options={FILTER_OPTIONS}
+              value={filter}
+              onChange={setFilter}
+            />
+          </View>
+        }
         renderItem={({ item, index }) => (
           <UserRow
             user={item}
             expanded={expandedId === item.id}
             onToggleExpand={() =>
-              setExpandedId(expandedId === item.id ? null : item.id)
+              setExpandedId((current) => (current === item.id ? null : item.id))
             }
-            onEdit={() => onEdit(item)}
-            onRemove={() => onRemove(item)}
+            onEdit={() => openEditModal(item)}
+            onRemove={() => confirmRemove(item)}
             tintIndex={index % 3}
           />
         )}
-        contentContainerStyle={styles.listContent}
-        scrollEnabled={false}
       />
 
-      {/* Edit Modal */}
       <Modal
         animationType="slide"
         transparent
-        visible={editModal}
-        onRequestClose={() => setEditModal(false)}
+        visible={editingUser !== null}
+        onRequestClose={closeEditModal}
       >
         <View style={styles.modalOverlay}>
-          <KeyboardAvoidingView behavior="padding" style={styles.modal}>
-            <ScrollView
-              contentContainerStyle={styles.modalContent}
-              keyboardShouldPersistTaps="handled"
-            >
-              <Text style={styles.modalTitle}>Izmena korisnika</Text>
+          <View style={styles.modalCard}>
+            <Text style={styles.modalTitle}>Izmena korisnika</Text>
 
-              {/* first_name */}
-              <Text style={styles.label}>IME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>IME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.first_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, first_name: v }))
-                }
+                value={firstName}
+                onChangeText={setFirstName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* last_name */}
-              <Text style={styles.label}>PREZIME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>PREZIME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.last_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, last_name: v }))
-                }
+                value={lastName}
+                onChangeText={setLastName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* role */}
-              <Text style={styles.label}>ULOGA</Text>
-              <FilterChips<"user" | "admin">
-                options={[
-                  { key: "user", label: "Član" },
-                  { key: "admin", label: "Admin" },
-                ]}
-                value={editForm.role}
-                onChange={(v) => setEditForm((p) => ({ ...p, role: v }))}
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>ULOGA</Text>
+              <FilterChips
+                options={ROLE_OPTIONS}
+                value={role}
+                onChange={setRole}
               />
+            </View>
 
-              {/* max_sessions_per_week stepper */}
-              <Text style={styles.label}>NEDELJNI LIMIT</Text>
-              <View style={styles.stepperContainer}>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
+              <View style={styles.stepper}>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.max(
-                        0,
-                        p.max_sessions_per_week - 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 0}
+                  onPress={() => setMaxSessions((value) => Math.max(0, value - 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>−</Text>
+                  <Text style={styles.stepButtonText}>−</Text>
                 </Pressable>
-                <Text style={styles.stepperValue}>
-                  {editForm.max_sessions_per_week}
-                </Text>
+                <Text style={styles.stepValue}>{maxSessions}</Text>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.min(
-                        14,
-                        p.max_sessions_per_week + 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 14}
+                  onPress={() => setMaxSessions((value) => Math.min(14, value + 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>+</Text>
+                  <Text style={styles.stepButtonText}>＋</Text>
                 </Pressable>
               </View>
+            </View>
 
-              {/* Footer actions */}
-              <View style={styles.modalFooter}>
-                <Pressable
-                  onPress={() => setEditModal(false)}
-                  style={styles.cancelBtn}
-                  disabled={saving}
-                >
-                  <Text style={styles.cancelBtnText}>Otkaži</Text>
-                </Pressable>
-                <Pressable
-                  onPress={onSaveEdit}
-                  style={[
-                    styles.saveBtn,
-                    saving && styles.saveBtnDisabled,
-                  ]}
-                  disabled={saving}
-                >
-                  {saving ? (
-                    <ActivityIndicator size="small" color={Colors.surface} />
-                  ) : (
-                    <Text style={styles.saveBtnText}>Sačuvaj</Text>
-                  )}
-                </Pressable>
-              </View>
-            </ScrollView>
-          </KeyboardAvoidingView>
+            <View style={styles.modalFooter}>
+              <Pressable
+                onPress={closeEditModal}
+                disabled={saving}
+                style={styles.cancelButton}
+              >
+                <Text style={styles.cancelButtonText}>Otkaži</Text>
+              </Pressable>
+              <Pressable
+                onPress={() => void saveUser()}
+                disabled={saving}
+                style={[styles.saveButton, saving && styles.buttonDisabled]}
+              >
+                {saving ? (
+                  <ActivityIndicator color={Colors.surface} />
+                ) : (
+                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
+                )}
+              </Pressable>
+            </View>
+          </View>
         </View>
       </Modal>
-    </View>
+    </>
   );
 }
 
@@ -321,33 +298,37 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    paddingHorizontal: Spacing.screenHorizontal || 20,
   },
-  centerContainer: {
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  centeredState: {
     flex: 1,
+    alignItems: "center",
     justifyContent: "center",
-    alignItems: "center",
     backgroundColor: Colors.paper,
   },
   errorText: {
-    ...Typography.section,
+    ...Typography.body,
     color: Colors.inkMuted,
   },
-  header: {
-    paddingTop: 20,
-    paddingBottom: 16,
+  headerContent: {
+    gap: 16,
+    marginBottom: 16,
   },
-  headerTitle: {
-    fontFamily: FontFamilies.bricolage[800],
+  title: {
+    ...Typography.screenTitle,
     fontSize: 23,
-    fontWeight: "800",
     color: Colors.ink,
   },
-  headerSubtitle: {
+  subtitle: {
     fontFamily: FontFamilies.hanken[600],
     fontSize: 13,
     fontWeight: "600",
     color: Colors.inkMuted,
+    marginTop: 3,
   },
   searchInput: {
     backgroundColor: Colors.surface,
@@ -360,122 +341,114 @@
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
-    marginBottom: 16,
-  },
-  filterContainer: {
-    marginBottom: 16,
   },
-  listContent: {
-    gap: 12,
-    paddingBottom: 20,
+  listGap: {
+    height: 10,
   },
-  // Modal
   modalOverlay: {
     flex: 1,
-    backgroundColor: "rgba(0, 0, 0, 0.5)",
     justifyContent: "flex-end",
+    backgroundColor: "rgba(34, 31, 43, 0.35)",
   },
-  modal: {
-    flex: 1,
-    maxHeight: "90%",
-    backgroundColor: Colors.paper,
-    borderTopLeftRadius: Radii.tile[24],
-    borderTopRightRadius: Radii.tile[24],
-  },
-  modalContent: {
-    padding: Spacing.cardPadding || 20,
+  modalCard: {
+    backgroundColor: Colors.surface,
+    borderTopLeftRadius: Radii.card,
+    borderTopRightRadius: Radii.card,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 24,
+    paddingBottom: 28,
     gap: 16,
+    ...Shadows.card,
   },
   modalTitle: {
     fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
+    fontSize: 21,
     fontWeight: "800",
     color: Colors.ink,
-    marginBottom: 8,
   },
-  label: {
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldLabel: {
     fontFamily: FontFamilies.hanken[700],
-    fontSize: 11,
+    fontSize: 10,
     fontWeight: "700",
     letterSpacing: 1,
-    textTransform: "uppercase",
-    color: Colors.ink,
+    color: Colors.inkMuted,
   },
-  input: {
+  fieldInput: {
     backgroundColor: Colors.surface,
     borderColor: Colors.fieldBorder,
     borderWidth: 1,
     borderRadius: Radii.tile[14],
     paddingHorizontal: 12,
-    paddingVertical: 12,
+    paddingVertical: 11,
     fontFamily: FontFamilies.hanken[600],
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
   },
-  stepperContainer: {
+  stepper: {
+    alignSelf: "flex-start",
     flexDirection: "row",
     alignItems: "center",
-    gap: 12,
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
   },
-  stepperBtn: {
-    width: 40,
-    height: 40,
-    borderRadius: Radii.tile[12],
-    backgroundColor: Colors.surfaceMuted,
-    justifyContent: "center",
+  stepButton: {
+    width: 44,
+    height: 42,
     alignItems: "center",
+    justifyContent: "center",
   },
-  stepperBtnText: {
-    fontFamily: FontFamilies.hanken[800],
-    fontSize: 18,
-    fontWeight: "800",
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 20,
+    fontWeight: "700",
     color: Colors.burgundy,
   },
-  stepperValue: {
-    flex: 1,
+  stepValue: {
+    minWidth: 44,
     textAlign: "center",
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 16,
-    fontWeight: "800",
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
   modalFooter: {
     flexDirection: "row",
-    gap: 12,
-    marginTop: 16,
+    gap: 10,
+    marginTop: 4,
   },
-  cancelBtn: {
+  cancelButton: {
     flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
-    borderColor: Colors.burgundyBorder,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderColor: Colors.burgundy,
     borderWidth: 1,
-    justifyContent: "center",
-    alignItems: "center",
+    borderRadius: Radii.tile[14],
   },
-  cancelBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
+  cancelButtonText: {
+    ...Typography.primaryButtonCompact,
     color: Colors.burgundy,
   },
-  saveBtn: {
-    flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
+  saveButton: {
+    flex: 2,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderRadius: Radii.tile[14],
     backgroundColor: Colors.burgundy,
-    justifyContent: "center",
-    alignItems: "center",
-    ...Shadows.primaryButton,
   },
-  saveBtnDisabled: {
+  saveButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
     opacity: 0.6,
-  },
-  saveBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
-    color: Colors.surface,
   },
 });
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 5ff9c08c6c36ad11d37ae2b56f1e48e9638ab6e3..bbbd205d1bb0aac98ed8f85b00eb8fe3c290ebe5
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -1,11 +1,268 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
+} from "react-native";
+import { useLocalSearchParams, useRouter } from "expo-router";
+
+import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { upsertSession } from "@/services/admin";
+import type { UpsertSessionInput } from "@/services/admin";
 
+const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map(
+  (day) => ({
+    key: day,
+    label: {
+      monday: "PON",
+      tuesday: "UTO",
+      wednesday: "SRE",
+      thursday: "ČET",
+      friday: "PET",
+      saturday: "SUB",
+      sunday: "NED",
+    }[day],
+  }),
+);
+
 export default function TrainingDetailScreen() {
+  const router = useRouter();
+  const { id } = useLocalSearchParams<{ id: string }>();
+  const isNew = id === "new";
+  const { trainings, loading, fetchTrainings } = useTrainings();
+  const training = trainings.find((item) => item.id === id);
+  const [title, setTitle] = useState("");
+  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
+  const [time, setTime] = useState("");
+  const [room, setRoom] = useState("");
+  const [durationMin, setDurationMin] = useState<number | null>(null);
+  const [maxParticipants, setMaxParticipants] = useState(10);
+  const [isOpen, setIsOpen] = useState(true);
+  const [submitting, setSubmitting] = useState(false);
+  const [initializedId, setInitializedId] = useState<string | null>(null);
+
+  useEffect(() => {
+    if (!training || initializedId === training.id) return;
+
+    setTitle(training.title);
+    setDayOfWeek(
+      TRAINING_DAYS.includes(training.day_of_week as Day)
+        ? (training.day_of_week as Day)
+        : "monday",
+    );
+    setTime(training.time);
+    setRoom(training.room ?? "");
+    setDurationMin(training.duration_min);
+    setMaxParticipants(training.max_participants);
+    setIsOpen(training.is_open);
+    setInitializedId(training.id);
+  }, [initializedId, training]);
+
+  const submit = async () => {
+    const normalizedTitle = title.trim();
+    const normalizedTime = time.trim();
+
+    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+      Alert.alert(
+        "Proverite podatke",
+        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
+      );
+      return;
+    }
+
+    const input: UpsertSessionInput = {
+      id: isNew ? null : id,
+      title: normalizedTitle,
+      day_of_week: dayOfWeek,
+      time: normalizedTime,
+      room: room.trim() || null,
+      duration_min: durationMin,
+      max_participants: maxParticipants,
+      is_open: isOpen,
+    };
+
+    setSubmitting(true);
+    try {
+      await upsertSession(input);
+      await fetchTrainings();
+      router.back();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Trening nije sačuvan.");
+      await fetchTrainings();
+    } finally {
+      setSubmitting(false);
+    }
+  };
+
+  if (!isNew && loading && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (!isNew && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
+        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
+          <Text style={styles.notFoundButtonText}>Nazad</Text>
+        </Pressable>
+      </View>
+    );
+  }
+
   return (
     <View style={styles.screen}>
-      <Text style={styles.title}>Training Detail</Text>
+      <View style={styles.navBar}>
+        <Pressable
+          accessibilityRole="button"
+          onPress={() => router.back()}
+          style={styles.backButton}
+        >
+          <Text style={styles.backChevron}>‹</Text>
+        </Pressable>
+        <Text style={styles.navTitle}>
+          {isNew ? "Novi trening" : "Izmena treninga"}
+        </Text>
+        <View style={styles.navSpacer} />
+      </View>
+
+      <ScrollView
+        style={styles.formScroll}
+        contentContainerStyle={styles.formContent}
+        keyboardShouldPersistTaps="handled"
+        showsVerticalScrollIndicator={false}
+      >
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
+          <TextInput
+            value={title}
+            onChangeText={setTitle}
+            editable={!submitting}
+            style={styles.input}
+          />
+        </View>
+
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>DAN</Text>
+          <FilterChips
+            options={DAY_OPTIONS}
+            value={dayOfWeek}
+            onChange={setDayOfWeek}
+          />
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>VREME</Text>
+            <TextInput
+              value={time}
+              onChangeText={setTime}
+              placeholder="18:00"
+              placeholderTextColor={Colors.inkFaint}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
+            <TextInput
+              value={durationMin?.toString() ?? ""}
+              onChangeText={(value) =>
+                setDurationMin(value === "" ? null : Number(value.replace(/\D/g, "")))
+              }
+              keyboardType="number-pad"
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>SALA</Text>
+            <TextInput
+              value={room}
+              onChangeText={setRoom}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
+            <View style={styles.stepper}>
+              <Pressable
+                disabled={submitting || maxParticipants === 1}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.max(1, value - 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>−</Text>
+              </Pressable>
+              <Text style={styles.stepValue}>{maxParticipants}</Text>
+              <Pressable
+                disabled={submitting || maxParticipants === 50}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.min(50, value + 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>＋</Text>
+              </Pressable>
+            </View>
+          </View>
+        </View>
+
+        <View style={styles.statusCard}>
+          <View style={styles.statusTextBlock}>
+            <Text style={styles.statusTitle}>Status slota</Text>
+            <Text style={styles.statusDescription}>
+              Otvoren za prijave članova
+            </Text>
+          </View>
+          <Toggle
+            value={isOpen}
+            onValueChange={setIsOpen}
+            disabled={submitting}
+          />
+        </View>
+
+        <View style={styles.footer}>
+          <Pressable
+            onPress={() => router.back()}
+            disabled={submitting}
+            style={styles.cancelButton}
+          >
+            <Text style={styles.cancelButtonText}>Otkaži</Text>
+          </Pressable>
+          <Pressable
+            onPress={() => void submit()}
+            disabled={submitting}
+            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+          >
+            {submitting ? (
+              <ActivityIndicator color={Colors.surface} />
+            ) : (
+              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
+            )}
+          </Pressable>
+        </View>
+      </ScrollView>
     </View>
   );
 }
@@ -14,11 +271,194 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
+  },
+  centeredState: {
+    flex: 1,
+    alignItems: "center",
     justifyContent: "center",
+    gap: 16,
+    backgroundColor: Colors.paper,
+  },
+  notFoundText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
+  notFoundButton: {
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    paddingHorizontal: 18,
+    paddingVertical: 10,
+  },
+  notFoundButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.burgundy,
+  },
+  navBar: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 16,
+    paddingBottom: 12,
+    borderBottomColor: Colors.border,
+    borderBottomWidth: 1,
+  },
+  backButton: {
+    width: 38,
+    height: 38,
     alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    backgroundColor: Colors.surface,
+  },
+  backChevron: {
+    fontFamily: FontFamilies.hanken[500],
+    fontSize: 31,
+    fontWeight: "500",
+    lineHeight: 32,
+    color: Colors.burgundy,
   },
-  title: {
-    ...Typography.screenTitle,
+  navTitle: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 19,
+    fontWeight: "800",
     color: Colors.ink,
   },
+  navSpacer: {
+    width: 38,
+    height: 38,
+  },
+  formScroll: {
+    flex: 1,
+  },
+  formContent: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 22,
+    paddingBottom: 28,
+    gap: 20,
+  },
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  columnField: {
+    flex: 1,
+    gap: 7,
+  },
+  fieldLabel: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    letterSpacing: 1,
+    color: Colors.inkMuted,
+  },
+  input: {
+    minHeight: 46,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    paddingHorizontal: 12,
+    paddingVertical: 11,
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 14,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  stepper: {
+    minHeight: 46,
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
+  },
+  stepButton: {
+    width: 38,
+    height: 44,
+    alignItems: "center",
+    justifyContent: "center",
+  },
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 19,
+    fontWeight: "700",
+    color: Colors.burgundy,
+  },
+  stepValue: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusCard: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    gap: 16,
+    borderColor: Colors.goldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[16],
+    backgroundColor: Colors.surfaceWarm,
+    padding: Spacing.cardPadding,
+  },
+  statusTextBlock: {
+    flex: 1,
+    gap: 3,
+  },
+  statusTitle: {
+    fontFamily: FontFamilies.bricolage[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusDescription: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 12,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
+  footer: {
+    flexDirection: "row",
+    gap: 10,
+    marginTop: 4,
+  },
+  cancelButton: {
+    flex: 1,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+  },
+  cancelButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.burgundy,
+  },
+  saveButton: {
+    flex: 2,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.burgundy,
+    ...Shadows.primaryButton,
+  },
+  saveButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
+    opacity: 0.6,
+  },
 });

diff --git a/app/(admin)/(tabs)/sessions.tsx b/app/(admin)/(tabs)/sessions.tsx
index b37d42eee582cfcbbfbaba8b37d423440c0794ae..df22d2c62a54e17bd6bdbca98213ae4760f430de
--- a/app/(admin)/(tabs)/sessions.tsx
+++ b/app/(admin)/(tabs)/sessions.tsx
@@ -1,12 +1,155 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  FlatList,
+  Pressable,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import { SessionRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { setSessionOpen } from "@/services/admin";
+import { getCurrentWeekDates } from "@/utils/week";
+
+const DAY_LABELS: Record<Day, string> = {
+  sunday: "NED",
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+};
+
+const DAY_NAMES: Record<Day, string> = {
+  sunday: "NEDELJA",
+  monday: "PONEDELJAK",
+  tuesday: "UTORAK",
+  wednesday: "SREDA",
+  thursday: "ČETVRTAK",
+  friday: "PETAK",
+  saturday: "SUBOTA",
+};
+
+const MONTH_NAMES = [
+  "JAN",
+  "FEB",
+  "MAR",
+  "APR",
+  "MAJ",
+  "JUN",
+  "JUL",
+  "AVG",
+  "SEP",
+  "OKT",
+  "NOV",
+  "DEC",
+] as const;
 
 export default function TreninziScreen() {
+  const router = useRouter();
+  const [selectedDay, setSelectedDay] = useState<Day>("monday");
+  const { loading, fetchTrainings, getTrainingsByDay } = useTrainings();
+  const sessions = getTrainingsByDay(selectedDay);
+  const selectedDate = getCurrentWeekDates()[selectedDay];
+  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;
+
+  const toggleSession = async (sessionId: string, open: boolean) => {
+    try {
+      await setSessionOpen(sessionId, open);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Status treninga nije promenjen.");
+    } finally {
+      await fetchTrainings();
+    }
+  };
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Treninzi</Text>
-    </View>
+    <FlatList
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      data={sessions}
+      keyExtractor={(session) => session.id}
+      showsVerticalScrollIndicator={false}
+      ItemSeparatorComponent={() => <View style={styles.listGap} />}
+      ListHeaderComponent={
+        <View style={styles.headerContent}>
+          <View style={styles.titleRow}>
+            <View style={styles.titleBlock}>
+              <Text style={styles.title}>Treninzi</Text>
+              <Text style={styles.subtitle}>
+                {DAY_NAMES[selectedDay]} · {dateLabel}
+              </Text>
+            </View>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/(admin)/training/new")}
+              style={({ pressed }) => [
+                styles.newButton,
+                pressed && styles.buttonPressed,
+              ]}
+            >
+              <Text style={styles.newButtonText}>＋ Novi</Text>
+            </Pressable>
+          </View>
+
+          <View style={styles.daySelector}>
+            {TRAINING_DAYS.map((day) => {
+              const active = selectedDay === day;
+              return (
+                <Pressable
+                  key={day}
+                  onPress={() => setSelectedDay(day)}
+                  style={[
+                    styles.dayChip,
+                    active && styles.dayChipActive,
+                  ]}
+                >
+                  <Text
+                    style={[
+                      styles.dayChipText,
+                      active && styles.dayChipTextActive,
+                    ]}
+                  >
+                    {DAY_LABELS[day]}
+                  </Text>
+                </Pressable>
+              );
+            })}
+          </View>
+
+          {loading && (
+            <ActivityIndicator
+              color={Colors.burgundy}
+              style={styles.loadingIndicator}
+            />
+          )}
+        </View>
+      }
+      ListEmptyComponent={
+        loading ? null : (
+          <Text style={styles.emptyText}>Nema termina za ovaj dan.</Text>
+        )
+      }
+      renderItem={({ item }) => (
+        <SessionRow
+          session={item}
+          bookedCount={item.session_participants.length}
+          onToggleOpen={(open) => void toggleSession(item.id, open)}
+          onPress={() => router.push(`/(admin)/training/${item.id}`)}
+        />
+      )}
+    />
   );
 }
 
@@ -14,11 +157,95 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    flexGrow: 1,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  headerContent: {
+    gap: 18,
+    marginBottom: 16,
+  },
+  titleRow: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 12,
   },
+  titleBlock: {
+    flex: 1,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
     color: Colors.ink,
   },
+  subtitle: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  newButton: {
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.burgundy,
+    paddingHorizontal: 14,
+    paddingVertical: 9,
+    ...Shadows.primaryButton,
+  },
+  newButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 13,
+    fontWeight: "700",
+    color: Colors.surface,
+  },
+  buttonPressed: {
+    opacity: 0.85,
+  },
+  daySelector: {
+    flexDirection: "row",
+    justifyContent: "space-between",
+    gap: 5,
+  },
+  dayChip: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 36,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.surface,
+  },
+  dayChipActive: {
+    borderColor: Colors.burgundy,
+    backgroundColor: Colors.burgundy,
+    ...Shadows.activeDay,
+  },
+  dayChipText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  dayChipTextActive: {
+    color: Colors.surface,
+  },
+  loadingIndicator: {
+    marginTop: 10,
+  },
+  listGap: {
+    height: 10,
+  },
+  emptyText: {
+    marginTop: 48,
+    textAlign: "center",
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
 });
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 8af74755eb930ef1aea5ab7c7c6df27230debb82..d750a54b7f9ba61a558953849e34bda2533339a1
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -1,319 +1,296 @@
+import { useCallback, useEffect, useMemo, useState } from "react";
 import {
-  View,
-  Text,
-  StyleSheet,
+  ActivityIndicator,
+  Alert,
   FlatList,
-  TextInput,
   Modal,
-  Alert,
-  ActivityIndicator,
   Pressable,
-  ScrollView,
-  KeyboardAvoidingView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
 } from "react-native";
-import { useEffect, useState } from "react";
+
+import { FilterChips, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import {
-  listUsers,
-  updateUser,
-  deleteUser,
-  AdminUser,
-  UpdateUserPatch,
-} from "@/services/admin";
-import UserRow from "@/components/admin/UserRow";
-import FilterChips from "@/components/admin/FilterChips";
+import { deleteUser, listUsers, updateUser } from "@/services/admin";
+import type { AdminUser, UpdateUserPatch } from "@/services/admin";
 
-type FilterKey = "svi" | "aktivni" | "admini";
+type UserFilter = "svi" | "aktivni" | "admini";
+type UserRole = AdminUser["role"];
 
+const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
+  { key: "svi", label: "Svi" },
+  { key: "aktivni", label: "Aktivni" },
+  { key: "admini", label: "Admini" },
+];
+
+const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
+  { key: "user", label: "Član" },
+  { key: "admin", label: "Admin" },
+];
+
 export default function KorisniciScreen() {
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
+  const [hasError, setHasError] = useState(false);
+  const [search, setSearch] = useState("");
+  const [filter, setFilter] = useState<UserFilter>("svi");
   const [expandedId, setExpandedId] = useState<string | null>(null);
-  const [searchText, setSearchText] = useState("");
-  const [filter, setFilter] = useState<FilterKey>("svi");
   const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
-  const [editModal, setEditModal] = useState(false);
-  const [editForm, setEditForm] = useState({
-    first_name: "",
-    last_name: "",
-    role: "user" as "user" | "admin",
-    max_sessions_per_week: 0,
-  });
+  const [firstName, setFirstName] = useState("");
+  const [lastName, setLastName] = useState("");
+  const [role, setRole] = useState<UserRole>("user");
+  const [maxSessions, setMaxSessions] = useState(0);
   const [saving, setSaving] = useState(false);
 
-  // Load users on mount
-  useEffect(() => {
-    fetchUsers();
-  }, []);
+  const fetchUsers = useCallback(async () => {
+    setLoading(true);
+    setHasError(false);
 
-  const fetchUsers = async () => {
-    setLoading(true);
-    setError(null);
     try {
-      const data = await listUsers();
-      setUsers(data);
-    } catch (err) {
-      setError("Greška pri učitavanju");
-      if (__DEV__) console.error(err);
+      setUsers(await listUsers());
+    } catch (error: unknown) {
+      console.error(error);
+      setHasError(true);
     } finally {
       setLoading(false);
     }
-  };
+  }, []);
 
-  // Filter logic
-  const filteredUsers = users
-    .filter((u) => {
-      const searchLower = searchText.toLowerCase();
-      const matchesSearch =
-        u.first_name.toLowerCase().includes(searchLower) ||
-        (u.last_name?.toLowerCase().includes(searchLower) ?? false) ||
-        u.email.toLowerCase().includes(searchLower);
+  useEffect(() => {
+    void fetchUsers();
+  }, [fetchUsers]);
 
-      if (!matchesSearch) return false;
+  const filteredUsers = useMemo(() => {
+    const query = search.trim().toLocaleLowerCase();
+
+    return users.filter((user) => {
+      const matchesFilter =
+        filter === "svi" ||
+        (filter === "aktivni" && user.enabled !== false) ||
+        (filter === "admini" && user.role === "admin");
+      const searchable = `${user.first_name} ${user.last_name ?? ""} ${user.email}`
+        .toLocaleLowerCase();
 
-      if (filter === "aktivni") return u.enabled !== false;
-      if (filter === "admini") return u.role === "admin";
-      return true;
+      return matchesFilter && searchable.includes(query);
     });
+  }, [filter, search, users]);
 
-  // Edit modal handlers
-  const onEdit = (user: AdminUser) => {
+  const openEditModal = (user: AdminUser) => {
     setEditingUser(user);
-    setEditForm({
-      first_name: user.first_name,
-      last_name: user.last_name || "",
-      role: user.role,
-      max_sessions_per_week: user.max_sessions_per_week,
-    });
-    setEditModal(true);
+    setFirstName(user.first_name);
+    setLastName(user.last_name ?? "");
+    setRole(user.role);
+    setMaxSessions(user.max_sessions_per_week);
   };
 
-  const onRemove = (user: AdminUser) => {
-    Alert.alert(
-      "Ukloni korisnika",
-      `${user.first_name} ${user.last_name || ""} i sve njegove rezervacije će biti uklonjeni.`,
-      [
-        { text: "Otkaži", style: "cancel" },
-        {
-          text: "Ukloni",
-          onPress: async () => {
-            try {
-              await deleteUser(user.id);
-              await fetchUsers();
-            } catch (err) {
-              Alert.alert("Greška", "Nije moguće obrisati korisnika");
-              if (__DEV__) console.error(err);
-            }
-          },
-          style: "destructive",
-        },
-      ]
-    );
+  const closeEditModal = () => {
+    if (!saving) setEditingUser(null);
   };
 
-  const onSaveEdit = async () => {
+  const saveUser = async () => {
     if (!editingUser) return;
 
+    const patch: UpdateUserPatch = {
+      first_name: firstName.trim(),
+      last_name: lastName.trim(),
+      role,
+      max_sessions_per_week: maxSessions,
+    };
+
     setSaving(true);
     try {
-      const patch: UpdateUserPatch = {
-        first_name: editForm.first_name || null,
-        last_name: editForm.last_name || null,
-        role: editForm.role,
-        max_sessions_per_week: editForm.max_sessions_per_week,
-      };
       await updateUser(editingUser.id, patch);
-      setEditModal(false);
       setEditingUser(null);
       await fetchUsers();
-    } catch (err) {
-      Alert.alert("Greška", "Nije moguće sačuvati promene");
-      if (__DEV__) console.error(err);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
+      await fetchUsers();
     } finally {
       setSaving(false);
     }
   };
 
-  if (loading) {
+  const removeUser = async (user: AdminUser) => {
+    try {
+      await deleteUser(user.id);
+      setExpandedId(null);
+      await fetchUsers();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Korisnik nije uklonjen.");
+      await fetchUsers();
+    }
+  };
+
+  const confirmRemove = (user: AdminUser) => {
+    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();
+
+    Alert.alert(
+      "Ukloni korisnika",
+      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
+      [
+        { text: "Otkaži", style: "cancel" },
+        {
+          text: "Ukloni",
+          style: "destructive",
+          onPress: () => void removeUser(user),
+        },
+      ],
+    );
+  };
+
+  if (loading && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <ActivityIndicator size="large" color={Colors.burgundy} />
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
       </View>
     );
   }
 
-  if (error) {
+  if (hasError && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <Text style={styles.errorText}>{error}</Text>
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
       </View>
     );
   }
 
   return (
-    <View style={styles.screen}>
-      {/* Header */}
-      <View style={styles.header}>
-        <Text style={styles.headerTitle}>Korisnici</Text>
-        <Text style={styles.headerSubtitle}>{users.length} članova</Text>
-      </View>
-
-      {/* Search */}
-      <TextInput
-        style={styles.searchInput}
-        placeholder="Pretraži članove…"
-        placeholderTextColor={Colors.inkMuted}
-        value={searchText}
-        onChangeText={setSearchText}
-      />
-
-      {/* Filter chips */}
-      <View style={styles.filterContainer}>
-        <FilterChips<FilterKey>
-          options={[
-            { key: "svi", label: "Svi" },
-            { key: "aktivni", label: "Aktivni" },
-            { key: "admini", label: "Admini" },
-          ]}
-          value={filter}
-          onChange={setFilter}
-        />
-      </View>
-
-      {/* User list */}
+    <>
       <FlatList
+        style={styles.screen}
+        contentContainerStyle={styles.content}
         data={filteredUsers}
-        keyExtractor={(u) => u.id}
+        keyExtractor={(user) => user.id}
+        showsVerticalScrollIndicator={false}
+        ItemSeparatorComponent={() => <View style={styles.listGap} />}
+        ListHeaderComponent={
+          <View style={styles.headerContent}>
+            <View>
+              <Text style={styles.title}>Korisnici</Text>
+              <Text style={styles.subtitle}>{users.length} članova</Text>
+            </View>
+            <TextInput
+              value={search}
+              onChangeText={setSearch}
+              placeholder="Pretraži članove…"
+              placeholderTextColor={Colors.inkFaint}
+              style={styles.searchInput}
+              autoCapitalize="none"
+              autoCorrect={false}
+            />
+            <FilterChips
+              options={FILTER_OPTIONS}
+              value={filter}
+              onChange={setFilter}
+            />
+          </View>
+        }
         renderItem={({ item, index }) => (
           <UserRow
             user={item}
             expanded={expandedId === item.id}
             onToggleExpand={() =>
-              setExpandedId(expandedId === item.id ? null : item.id)
+              setExpandedId((current) => (current === item.id ? null : item.id))
             }
-            onEdit={() => onEdit(item)}
-            onRemove={() => onRemove(item)}
+            onEdit={() => openEditModal(item)}
+            onRemove={() => confirmRemove(item)}
             tintIndex={index % 3}
           />
         )}
-        contentContainerStyle={styles.listContent}
-        scrollEnabled={false}
       />
 
-      {/* Edit Modal */}
       <Modal
         animationType="slide"
         transparent
-        visible={editModal}
-        onRequestClose={() => setEditModal(false)}
+        visible={editingUser !== null}
+        onRequestClose={closeEditModal}
       >
         <View style={styles.modalOverlay}>
-          <KeyboardAvoidingView behavior="padding" style={styles.modal}>
-            <ScrollView
-              contentContainerStyle={styles.modalContent}
-              keyboardShouldPersistTaps="handled"
-            >
-              <Text style={styles.modalTitle}>Izmena korisnika</Text>
+          <View style={styles.modalCard}>
+            <Text style={styles.modalTitle}>Izmena korisnika</Text>
 
-              {/* first_name */}
-              <Text style={styles.label}>IME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>IME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.first_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, first_name: v }))
-                }
+                value={firstName}
+                onChangeText={setFirstName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* last_name */}
-              <Text style={styles.label}>PREZIME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>PREZIME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.last_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, last_name: v }))
-                }
+                value={lastName}
+                onChangeText={setLastName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* role */}
-              <Text style={styles.label}>ULOGA</Text>
-              <FilterChips<"user" | "admin">
-                options={[
-                  { key: "user", label: "Član" },
-                  { key: "admin", label: "Admin" },
-                ]}
-                value={editForm.role}
-                onChange={(v) => setEditForm((p) => ({ ...p, role: v }))}
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>ULOGA</Text>
+              <FilterChips
+                options={ROLE_OPTIONS}
+                value={role}
+                onChange={setRole}
               />
+            </View>
 
-              {/* max_sessions_per_week stepper */}
-              <Text style={styles.label}>NEDELJNI LIMIT</Text>
-              <View style={styles.stepperContainer}>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
+              <View style={styles.stepper}>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.max(
-                        0,
-                        p.max_sessions_per_week - 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 0}
+                  onPress={() => setMaxSessions((value) => Math.max(0, value - 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>−</Text>
+                  <Text style={styles.stepButtonText}>−</Text>
                 </Pressable>
-                <Text style={styles.stepperValue}>
-                  {editForm.max_sessions_per_week}
-                </Text>
+                <Text style={styles.stepValue}>{maxSessions}</Text>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.min(
-                        14,
-                        p.max_sessions_per_week + 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 14}
+                  onPress={() => setMaxSessions((value) => Math.min(14, value + 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>+</Text>
+                  <Text style={styles.stepButtonText}>＋</Text>
                 </Pressable>
               </View>
+            </View>
 
-              {/* Footer actions */}
-              <View style={styles.modalFooter}>
-                <Pressable
-                  onPress={() => setEditModal(false)}
-                  style={styles.cancelBtn}
-                  disabled={saving}
-                >
-                  <Text style={styles.cancelBtnText}>Otkaži</Text>
-                </Pressable>
-                <Pressable
-                  onPress={onSaveEdit}
-                  style={[
-                    styles.saveBtn,
-                    saving && styles.saveBtnDisabled,
-                  ]}
-                  disabled={saving}
-                >
-                  {saving ? (
-                    <ActivityIndicator size="small" color={Colors.surface} />
-                  ) : (
-                    <Text style={styles.saveBtnText}>Sačuvaj</Text>
-                  )}
-                </Pressable>
-              </View>
-            </ScrollView>
-          </KeyboardAvoidingView>
+            <View style={styles.modalFooter}>
+              <Pressable
+                onPress={closeEditModal}
+                disabled={saving}
+                style={styles.cancelButton}
+              >
+                <Text style={styles.cancelButtonText}>Otkaži</Text>
+              </Pressable>
+              <Pressable
+                onPress={() => void saveUser()}
+                disabled={saving}
+                style={[styles.saveButton, saving && styles.buttonDisabled]}
+              >
+                {saving ? (
+                  <ActivityIndicator color={Colors.surface} />
+                ) : (
+                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
+                )}
+              </Pressable>
+            </View>
+          </View>
         </View>
       </Modal>
-    </View>
+    </>
   );
 }
 
@@ -321,33 +298,37 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    paddingHorizontal: Spacing.screenHorizontal || 20,
   },
-  centerContainer: {
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  centeredState: {
     flex: 1,
+    alignItems: "center",
     justifyContent: "center",
-    alignItems: "center",
     backgroundColor: Colors.paper,
   },
   errorText: {
-    ...Typography.section,
+    ...Typography.body,
     color: Colors.inkMuted,
   },
-  header: {
-    paddingTop: 20,
-    paddingBottom: 16,
+  headerContent: {
+    gap: 16,
+    marginBottom: 16,
   },
-  headerTitle: {
-    fontFamily: FontFamilies.bricolage[800],
+  title: {
+    ...Typography.screenTitle,
     fontSize: 23,
-    fontWeight: "800",
     color: Colors.ink,
   },
-  headerSubtitle: {
+  subtitle: {
     fontFamily: FontFamilies.hanken[600],
     fontSize: 13,
     fontWeight: "600",
     color: Colors.inkMuted,
+    marginTop: 3,
   },
   searchInput: {
     backgroundColor: Colors.surface,
@@ -360,122 +341,114 @@
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
-    marginBottom: 16,
-  },
-  filterContainer: {
-    marginBottom: 16,
   },
-  listContent: {
-    gap: 12,
-    paddingBottom: 20,
+  listGap: {
+    height: 10,
   },
-  // Modal
   modalOverlay: {
     flex: 1,
-    backgroundColor: "rgba(0, 0, 0, 0.5)",
     justifyContent: "flex-end",
+    backgroundColor: "rgba(34, 31, 43, 0.35)",
   },
-  modal: {
-    flex: 1,
-    maxHeight: "90%",
-    backgroundColor: Colors.paper,
-    borderTopLeftRadius: Radii.tile[24],
-    borderTopRightRadius: Radii.tile[24],
-  },
-  modalContent: {
-    padding: Spacing.cardPadding || 20,
+  modalCard: {
+    backgroundColor: Colors.surface,
+    borderTopLeftRadius: Radii.card,
+    borderTopRightRadius: Radii.card,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 24,
+    paddingBottom: 28,
     gap: 16,
+    ...Shadows.card,
   },
   modalTitle: {
     fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
+    fontSize: 21,
     fontWeight: "800",
     color: Colors.ink,
-    marginBottom: 8,
   },
-  label: {
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldLabel: {
     fontFamily: FontFamilies.hanken[700],
-    fontSize: 11,
+    fontSize: 10,
     fontWeight: "700",
     letterSpacing: 1,
-    textTransform: "uppercase",
-    color: Colors.ink,
+    color: Colors.inkMuted,
   },
-  input: {
+  fieldInput: {
     backgroundColor: Colors.surface,
     borderColor: Colors.fieldBorder,
     borderWidth: 1,
     borderRadius: Radii.tile[14],
     paddingHorizontal: 12,
-    paddingVertical: 12,
+    paddingVertical: 11,
     fontFamily: FontFamilies.hanken[600],
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
   },
-  stepperContainer: {
+  stepper: {
+    alignSelf: "flex-start",
     flexDirection: "row",
     alignItems: "center",
-    gap: 12,
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
   },
-  stepperBtn: {
-    width: 40,
-    height: 40,
-    borderRadius: Radii.tile[12],
-    backgroundColor: Colors.surfaceMuted,
-    justifyContent: "center",
+  stepButton: {
+    width: 44,
+    height: 42,
     alignItems: "center",
+    justifyContent: "center",
   },
-  stepperBtnText: {
-    fontFamily: FontFamilies.hanken[800],
-    fontSize: 18,
-    fontWeight: "800",
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 20,
+    fontWeight: "700",
     color: Colors.burgundy,
   },
-  stepperValue: {
-    flex: 1,
+  stepValue: {
+    minWidth: 44,
     textAlign: "center",
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 16,
-    fontWeight: "800",
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
   modalFooter: {
     flexDirection: "row",
-    gap: 12,
-    marginTop: 16,
+    gap: 10,
+    marginTop: 4,
   },
-  cancelBtn: {
+  cancelButton: {
     flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
-    borderColor: Colors.burgundyBorder,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderColor: Colors.burgundy,
     borderWidth: 1,
-    justifyContent: "center",
-    alignItems: "center",
+    borderRadius: Radii.tile[14],
   },
-  cancelBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
+  cancelButtonText: {
+    ...Typography.primaryButtonCompact,
     color: Colors.burgundy,
   },
-  saveBtn: {
-    flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
+  saveButton: {
+    flex: 2,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderRadius: Radii.tile[14],
     backgroundColor: Colors.burgundy,
-    justifyContent: "center",
-    alignItems: "center",
-    ...Shadows.primaryButton,
   },
-  saveBtnDisabled: {
+  saveButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
     opacity: 0.6,
-  },
-  saveBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
-    color: Colors.surface,
   },
 });
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 5ff9c08c6c36ad11d37ae2b56f1e48e9638ab6e3..bbbd205d1bb0aac98ed8f85b00eb8fe3c290ebe5
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -1,11 +1,268 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
+} from "react-native";
+import { useLocalSearchParams, useRouter } from "expo-router";
+
+import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { upsertSession } from "@/services/admin";
+import type { UpsertSessionInput } from "@/services/admin";
 
+const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map(
+  (day) => ({
+    key: day,
+    label: {
+      monday: "PON",
+      tuesday: "UTO",
+      wednesday: "SRE",
+      thursday: "ČET",
+      friday: "PET",
+      saturday: "SUB",
+      sunday: "NED",
+    }[day],
+  }),
+);
+
 export default function TrainingDetailScreen() {
+  const router = useRouter();
+  const { id } = useLocalSearchParams<{ id: string }>();
+  const isNew = id === "new";
+  const { trainings, loading, fetchTrainings } = useTrainings();
+  const training = trainings.find((item) => item.id === id);
+  const [title, setTitle] = useState("");
+  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
+  const [time, setTime] = useState("");
+  const [room, setRoom] = useState("");
+  const [durationMin, setDurationMin] = useState<number | null>(null);
+  const [maxParticipants, setMaxParticipants] = useState(10);
+  const [isOpen, setIsOpen] = useState(true);
+  const [submitting, setSubmitting] = useState(false);
+  const [initializedId, setInitializedId] = useState<string | null>(null);
+
+  useEffect(() => {
+    if (!training || initializedId === training.id) return;
+
+    setTitle(training.title);
+    setDayOfWeek(
+      TRAINING_DAYS.includes(training.day_of_week as Day)
+        ? (training.day_of_week as Day)
+        : "monday",
+    );
+    setTime(training.time);
+    setRoom(training.room ?? "");
+    setDurationMin(training.duration_min);
+    setMaxParticipants(training.max_participants);
+    setIsOpen(training.is_open);
+    setInitializedId(training.id);
+  }, [initializedId, training]);
+
+  const submit = async () => {
+    const normalizedTitle = title.trim();
+    const normalizedTime = time.trim();
+
+    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+      Alert.alert(
+        "Proverite podatke",
+        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
+      );
+      return;
+    }
+
+    const input: UpsertSessionInput = {
+      id: isNew ? null : id,
+      title: normalizedTitle,
+      day_of_week: dayOfWeek,
+      time: normalizedTime,
+      room: room.trim() || null,
+      duration_min: durationMin,
+      max_participants: maxParticipants,
+      is_open: isOpen,
+    };
+
+    setSubmitting(true);
+    try {
+      await upsertSession(input);
+      await fetchTrainings();
+      router.back();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Trening nije sačuvan.");
+      await fetchTrainings();
+    } finally {
+      setSubmitting(false);
+    }
+  };
+
+  if (!isNew && loading && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (!isNew && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
+        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
+          <Text style={styles.notFoundButtonText}>Nazad</Text>
+        </Pressable>
+      </View>
+    );
+  }
+
   return (
     <View style={styles.screen}>
-      <Text style={styles.title}>Training Detail</Text>
+      <View style={styles.navBar}>
+        <Pressable
+          accessibilityRole="button"
+          onPress={() => router.back()}
+          style={styles.backButton}
+        >
+          <Text style={styles.backChevron}>‹</Text>
+        </Pressable>
+        <Text style={styles.navTitle}>
+          {isNew ? "Novi trening" : "Izmena treninga"}
+        </Text>
+        <View style={styles.navSpacer} />
+      </View>
+
+      <ScrollView
+        style={styles.formScroll}
+        contentContainerStyle={styles.formContent}
+        keyboardShouldPersistTaps="handled"
+        showsVerticalScrollIndicator={false}
+      >
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
+          <TextInput
+            value={title}
+            onChangeText={setTitle}
+            editable={!submitting}
+            style={styles.input}
+          />
+        </View>
+
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>DAN</Text>
+          <FilterChips
+            options={DAY_OPTIONS}
+            value={dayOfWeek}
+            onChange={setDayOfWeek}
+          />
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>VREME</Text>
+            <TextInput
+              value={time}
+              onChangeText={setTime}
+              placeholder="18:00"
+              placeholderTextColor={Colors.inkFaint}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
+            <TextInput
+              value={durationMin?.toString() ?? ""}
+              onChangeText={(value) =>
+                setDurationMin(value === "" ? null : Number(value.replace(/\D/g, "")))
+              }
+              keyboardType="number-pad"
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>SALA</Text>
+            <TextInput
+              value={room}
+              onChangeText={setRoom}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
+            <View style={styles.stepper}>
+              <Pressable
+                disabled={submitting || maxParticipants === 1}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.max(1, value - 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>−</Text>
+              </Pressable>
+              <Text style={styles.stepValue}>{maxParticipants}</Text>
+              <Pressable
+                disabled={submitting || maxParticipants === 50}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.min(50, value + 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>＋</Text>
+              </Pressable>
+            </View>
+          </View>
+        </View>
+
+        <View style={styles.statusCard}>
+          <View style={styles.statusTextBlock}>
+            <Text style={styles.statusTitle}>Status slota</Text>
+            <Text style={styles.statusDescription}>
+              Otvoren za prijave članova
+            </Text>
+          </View>
+          <Toggle
+            value={isOpen}
+            onValueChange={setIsOpen}
+            disabled={submitting}
+          />
+        </View>
+
+        <View style={styles.footer}>
+          <Pressable
+            onPress={() => router.back()}
+            disabled={submitting}
+            style={styles.cancelButton}
+          >
+            <Text style={styles.cancelButtonText}>Otkaži</Text>
+          </Pressable>
+          <Pressable
+            onPress={() => void submit()}
+            disabled={submitting}
+            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+          >
+            {submitting ? (
+              <ActivityIndicator color={Colors.surface} />
+            ) : (
+              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
+            )}
+          </Pressable>
+        </View>
+      </ScrollView>
     </View>
   );
 }
@@ -14,11 +271,194 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
+  },
+  centeredState: {
+    flex: 1,
+    alignItems: "center",
     justifyContent: "center",
+    gap: 16,
+    backgroundColor: Colors.paper,
+  },
+  notFoundText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
+  notFoundButton: {
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    paddingHorizontal: 18,
+    paddingVertical: 10,
+  },
+  notFoundButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.burgundy,
+  },
+  navBar: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 16,
+    paddingBottom: 12,
+    borderBottomColor: Colors.border,
+    borderBottomWidth: 1,
+  },
+  backButton: {
+    width: 38,
+    height: 38,
     alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    backgroundColor: Colors.surface,
+  },
+  backChevron: {
+    fontFamily: FontFamilies.hanken[500],
+    fontSize: 31,
+    fontWeight: "500",
+    lineHeight: 32,
+    color: Colors.burgundy,
   },
-  title: {
-    ...Typography.screenTitle,
+  navTitle: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 19,
+    fontWeight: "800",
     color: Colors.ink,
   },
+  navSpacer: {
+    width: 38,
+    height: 38,
+  },
+  formScroll: {
+    flex: 1,
+  },
+  formContent: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 22,
+    paddingBottom: 28,
+    gap: 20,
+  },
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  columnField: {
+    flex: 1,
+    gap: 7,
+  },
+  fieldLabel: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    letterSpacing: 1,
+    color: Colors.inkMuted,
+  },
+  input: {
+    minHeight: 46,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    paddingHorizontal: 12,
+    paddingVertical: 11,
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 14,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  stepper: {
+    minHeight: 46,
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
+  },
+  stepButton: {
+    width: 38,
+    height: 44,
+    alignItems: "center",
+    justifyContent: "center",
+  },
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 19,
+    fontWeight: "700",
+    color: Colors.burgundy,
+  },
+  stepValue: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusCard: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    gap: 16,
+    borderColor: Colors.goldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[16],
+    backgroundColor: Colors.surfaceWarm,
+    padding: Spacing.cardPadding,
+  },
+  statusTextBlock: {
+    flex: 1,
+    gap: 3,
+  },
+  statusTitle: {
+    fontFamily: FontFamilies.bricolage[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusDescription: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 12,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
+  footer: {
+    flexDirection: "row",
+    gap: 10,
+    marginTop: 4,
+  },
+  cancelButton: {
+    flex: 1,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+  },
+  cancelButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.burgundy,
+  },
+  saveButton: {
+    flex: 2,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.burgundy,
+    ...Shadows.primaryButton,
+  },
+  saveButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
+    opacity: 0.6,
+  },
 });

codex
All three screens are implemented with the real admin services and shared components. I’m now checking strict typing and lint; any fixes will remain confined to the target files.
Inspection and screen implementations are complete; verification is in progress.
  ✓ Inspect existing admin patterns and APIs
  ✓ Implement users.tsx
  ✓ Implement sessions.tsx
  ✓ Implement training/[id].tsx
  → Run TypeScript and ESLint verification
exec
/bin/zsh -lc 'npx tsc --noEmit' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/(tabs)/sessions.tsx b/app/(admin)/(tabs)/sessions.tsx
index b37d42eee582cfcbbfbaba8b37d423440c0794ae..df22d2c62a54e17bd6bdbca98213ae4760f430de
--- a/app/(admin)/(tabs)/sessions.tsx
+++ b/app/(admin)/(tabs)/sessions.tsx
@@ -1,12 +1,155 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  FlatList,
+  Pressable,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import { SessionRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { setSessionOpen } from "@/services/admin";
+import { getCurrentWeekDates } from "@/utils/week";
+
+const DAY_LABELS: Record<Day, string> = {
+  sunday: "NED",
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+};
+
+const DAY_NAMES: Record<Day, string> = {
+  sunday: "NEDELJA",
+  monday: "PONEDELJAK",
+  tuesday: "UTORAK",
+  wednesday: "SREDA",
+  thursday: "ČETVRTAK",
+  friday: "PETAK",
+  saturday: "SUBOTA",
+};
+
+const MONTH_NAMES = [
+  "JAN",
+  "FEB",
+  "MAR",
+  "APR",
+  "MAJ",
+  "JUN",
+  "JUL",
+  "AVG",
+  "SEP",
+  "OKT",
+  "NOV",
+  "DEC",
+] as const;
 
 export default function TreninziScreen() {
+  const router = useRouter();
+  const [selectedDay, setSelectedDay] = useState<Day>("monday");
+  const { loading, fetchTrainings, getTrainingsByDay } = useTrainings();
+  const sessions = getTrainingsByDay(selectedDay);
+  const selectedDate = getCurrentWeekDates()[selectedDay];
+  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;
+
+  const toggleSession = async (sessionId: string, open: boolean) => {
+    try {
+      await setSessionOpen(sessionId, open);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Status treninga nije promenjen.");
+    } finally {
+      await fetchTrainings();
+    }
+  };
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Treninzi</Text>
-    </View>
+    <FlatList
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      data={sessions}
+      keyExtractor={(session) => session.id}
+      showsVerticalScrollIndicator={false}
+      ItemSeparatorComponent={() => <View style={styles.listGap} />}
+      ListHeaderComponent={
+        <View style={styles.headerContent}>
+          <View style={styles.titleRow}>
+            <View style={styles.titleBlock}>
+              <Text style={styles.title}>Treninzi</Text>
+              <Text style={styles.subtitle}>
+                {DAY_NAMES[selectedDay]} · {dateLabel}
+              </Text>
+            </View>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/(admin)/training/new")}
+              style={({ pressed }) => [
+                styles.newButton,
+                pressed && styles.buttonPressed,
+              ]}
+            >
+              <Text style={styles.newButtonText}>＋ Novi</Text>
+            </Pressable>
+          </View>
+
+          <View style={styles.daySelector}>
+            {TRAINING_DAYS.map((day) => {
+              const active = selectedDay === day;
+              return (
+                <Pressable
+                  key={day}
+                  onPress={() => setSelectedDay(day)}
+                  style={[
+                    styles.dayChip,
+                    active && styles.dayChipActive,
+                  ]}
+                >
+                  <Text
+                    style={[
+                      styles.dayChipText,
+                      active && styles.dayChipTextActive,
+                    ]}
+                  >
+                    {DAY_LABELS[day]}
+                  </Text>
+                </Pressable>
+              );
+            })}
+          </View>
+
+          {loading && (
+            <ActivityIndicator
+              color={Colors.burgundy}
+              style={styles.loadingIndicator}
+            />
+          )}
+        </View>
+      }
+      ListEmptyComponent={
+        loading ? null : (
+          <Text style={styles.emptyText}>Nema termina za ovaj dan.</Text>
+        )
+      }
+      renderItem={({ item }) => (
+        <SessionRow
+          session={item}
+          bookedCount={item.session_participants.length}
+          onToggleOpen={(open) => void toggleSession(item.id, open)}
+          onPress={() => router.push(`/(admin)/training/${item.id}`)}
+        />
+      )}
+    />
   );
 }
 
@@ -14,11 +157,95 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    flexGrow: 1,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  headerContent: {
+    gap: 18,
+    marginBottom: 16,
+  },
+  titleRow: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 12,
   },
+  titleBlock: {
+    flex: 1,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
     color: Colors.ink,
   },
+  subtitle: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  newButton: {
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.burgundy,
+    paddingHorizontal: 14,
+    paddingVertical: 9,
+    ...Shadows.primaryButton,
+  },
+  newButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 13,
+    fontWeight: "700",
+    color: Colors.surface,
+  },
+  buttonPressed: {
+    opacity: 0.85,
+  },
+  daySelector: {
+    flexDirection: "row",
+    justifyContent: "space-between",
+    gap: 5,
+  },
+  dayChip: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 36,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.surface,
+  },
+  dayChipActive: {
+    borderColor: Colors.burgundy,
+    backgroundColor: Colors.burgundy,
+    ...Shadows.activeDay,
+  },
+  dayChipText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  dayChipTextActive: {
+    color: Colors.surface,
+  },
+  loadingIndicator: {
+    marginTop: 10,
+  },
+  listGap: {
+    height: 10,
+  },
+  emptyText: {
+    marginTop: 48,
+    textAlign: "center",
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
 });
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 8af74755eb930ef1aea5ab7c7c6df27230debb82..d750a54b7f9ba61a558953849e34bda2533339a1
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -1,319 +1,296 @@
+import { useCallback, useEffect, useMemo, useState } from "react";
 import {
-  View,
-  Text,
-  StyleSheet,
+  ActivityIndicator,
+  Alert,
   FlatList,
-  TextInput,
   Modal,
-  Alert,
-  ActivityIndicator,
   Pressable,
-  ScrollView,
-  KeyboardAvoidingView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
 } from "react-native";
-import { useEffect, useState } from "react";
+
+import { FilterChips, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import {
-  listUsers,
-  updateUser,
-  deleteUser,
-  AdminUser,
-  UpdateUserPatch,
-} from "@/services/admin";
-import UserRow from "@/components/admin/UserRow";
-import FilterChips from "@/components/admin/FilterChips";
+import { deleteUser, listUsers, updateUser } from "@/services/admin";
+import type { AdminUser, UpdateUserPatch } from "@/services/admin";
 
-type FilterKey = "svi" | "aktivni" | "admini";
+type UserFilter = "svi" | "aktivni" | "admini";
+type UserRole = AdminUser["role"];
 
+const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
+  { key: "svi", label: "Svi" },
+  { key: "aktivni", label: "Aktivni" },
+  { key: "admini", label: "Admini" },
+];
+
+const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
+  { key: "user", label: "Član" },
+  { key: "admin", label: "Admin" },
+];
+
 export default function KorisniciScreen() {
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
+  const [hasError, setHasError] = useState(false);
+  const [search, setSearch] = useState("");
+  const [filter, setFilter] = useState<UserFilter>("svi");
   const [expandedId, setExpandedId] = useState<string | null>(null);
-  const [searchText, setSearchText] = useState("");
-  const [filter, setFilter] = useState<FilterKey>("svi");
   const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
-  const [editModal, setEditModal] = useState(false);
-  const [editForm, setEditForm] = useState({
-    first_name: "",
-    last_name: "",
-    role: "user" as "user" | "admin",
-    max_sessions_per_week: 0,
-  });
+  const [firstName, setFirstName] = useState("");
+  const [lastName, setLastName] = useState("");
+  const [role, setRole] = useState<UserRole>("user");
+  const [maxSessions, setMaxSessions] = useState(0);
   const [saving, setSaving] = useState(false);
 
-  // Load users on mount
-  useEffect(() => {
-    fetchUsers();
-  }, []);
+  const fetchUsers = useCallback(async () => {
+    setLoading(true);
+    setHasError(false);
 
-  const fetchUsers = async () => {
-    setLoading(true);
-    setError(null);
     try {
-      const data = await listUsers();
-      setUsers(data);
-    } catch (err) {
-      setError("Greška pri učitavanju");
-      if (__DEV__) console.error(err);
+      setUsers(await listUsers());
+    } catch (error: unknown) {
+      console.error(error);
+      setHasError(true);
     } finally {
       setLoading(false);
     }
-  };
+  }, []);
 
-  // Filter logic
-  const filteredUsers = users
-    .filter((u) => {
-      const searchLower = searchText.toLowerCase();
-      const matchesSearch =
-        u.first_name.toLowerCase().includes(searchLower) ||
-        (u.last_name?.toLowerCase().includes(searchLower) ?? false) ||
-        u.email.toLowerCase().includes(searchLower);
+  useEffect(() => {
+    void fetchUsers();
+  }, [fetchUsers]);
 
-      if (!matchesSearch) return false;
+  const filteredUsers = useMemo(() => {
+    const query = search.trim().toLocaleLowerCase();
+
+    return users.filter((user) => {
+      const matchesFilter =
+        filter === "svi" ||
+        (filter === "aktivni" && user.enabled !== false) ||
+        (filter === "admini" && user.role === "admin");
+      const searchable = `${user.first_name} ${user.last_name ?? ""} ${user.email}`
+        .toLocaleLowerCase();
 
-      if (filter === "aktivni") return u.enabled !== false;
-      if (filter === "admini") return u.role === "admin";
-      return true;
+      return matchesFilter && searchable.includes(query);
     });
+  }, [filter, search, users]);
 
-  // Edit modal handlers
-  const onEdit = (user: AdminUser) => {
+  const openEditModal = (user: AdminUser) => {
     setEditingUser(user);
-    setEditForm({
-      first_name: user.first_name,
-      last_name: user.last_name || "",
-      role: user.role,
-      max_sessions_per_week: user.max_sessions_per_week,
-    });
-    setEditModal(true);
+    setFirstName(user.first_name);
+    setLastName(user.last_name ?? "");
+    setRole(user.role);
+    setMaxSessions(user.max_sessions_per_week);
   };
 
-  const onRemove = (user: AdminUser) => {
-    Alert.alert(
-      "Ukloni korisnika",
-      `${user.first_name} ${user.last_name || ""} i sve njegove rezervacije će biti uklonjeni.`,
-      [
-        { text: "Otkaži", style: "cancel" },
-        {
-          text: "Ukloni",
-          onPress: async () => {
-            try {
-              await deleteUser(user.id);
-              await fetchUsers();
-            } catch (err) {
-              Alert.alert("Greška", "Nije moguće obrisati korisnika");
-              if (__DEV__) console.error(err);
-            }
-          },
-          style: "destructive",
-        },
-      ]
-    );
+  const closeEditModal = () => {
+    if (!saving) setEditingUser(null);
   };
 
-  const onSaveEdit = async () => {
+  const saveUser = async () => {
     if (!editingUser) return;
 
+    const patch: UpdateUserPatch = {
+      first_name: firstName.trim(),
+      last_name: lastName.trim(),
+      role,
+      max_sessions_per_week: maxSessions,
+    };
+
     setSaving(true);
     try {
-      const patch: UpdateUserPatch = {
-        first_name: editForm.first_name || null,
-        last_name: editForm.last_name || null,
-        role: editForm.role,
-        max_sessions_per_week: editForm.max_sessions_per_week,
-      };
       await updateUser(editingUser.id, patch);
-      setEditModal(false);
       setEditingUser(null);
       await fetchUsers();
-    } catch (err) {
-      Alert.alert("Greška", "Nije moguće sačuvati promene");
-      if (__DEV__) console.error(err);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
+      await fetchUsers();
     } finally {
       setSaving(false);
     }
   };
 
-  if (loading) {
+  const removeUser = async (user: AdminUser) => {
+    try {
+      await deleteUser(user.id);
+      setExpandedId(null);
+      await fetchUsers();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Korisnik nije uklonjen.");
+      await fetchUsers();
+    }
+  };
+
+  const confirmRemove = (user: AdminUser) => {
+    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();
+
+    Alert.alert(
+      "Ukloni korisnika",
+      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
+      [
+        { text: "Otkaži", style: "cancel" },
+        {
+          text: "Ukloni",
+          style: "destructive",
+          onPress: () => void removeUser(user),
+        },
+      ],
+    );
+  };
+
+  if (loading && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <ActivityIndicator size="large" color={Colors.burgundy} />
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
       </View>
     );
   }
 
-  if (error) {
+  if (hasError && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <Text style={styles.errorText}>{error}</Text>
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
       </View>
     );
   }
 
   return (
-    <View style={styles.screen}>
-      {/* Header */}
-      <View style={styles.header}>
-        <Text style={styles.headerTitle}>Korisnici</Text>
-        <Text style={styles.headerSubtitle}>{users.length} članova</Text>
-      </View>
-
-      {/* Search */}
-      <TextInput
-        style={styles.searchInput}
-        placeholder="Pretraži članove…"
-        placeholderTextColor={Colors.inkMuted}
-        value={searchText}
-        onChangeText={setSearchText}
-      />
-
-      {/* Filter chips */}
-      <View style={styles.filterContainer}>
-        <FilterChips<FilterKey>
-          options={[
-            { key: "svi", label: "Svi" },
-            { key: "aktivni", label: "Aktivni" },
-            { key: "admini", label: "Admini" },
-          ]}
-          value={filter}
-          onChange={setFilter}
-        />
-      </View>
-
-      {/* User list */}
+    <>
       <FlatList
+        style={styles.screen}
+        contentContainerStyle={styles.content}
         data={filteredUsers}
-        keyExtractor={(u) => u.id}
+        keyExtractor={(user) => user.id}
+        showsVerticalScrollIndicator={false}
+        ItemSeparatorComponent={() => <View style={styles.listGap} />}
+        ListHeaderComponent={
+          <View style={styles.headerContent}>
+            <View>
+              <Text style={styles.title}>Korisnici</Text>
+              <Text style={styles.subtitle}>{users.length} članova</Text>
+            </View>
+            <TextInput
+              value={search}
+              onChangeText={setSearch}
+              placeholder="Pretraži članove…"
+              placeholderTextColor={Colors.inkFaint}
+              style={styles.searchInput}
+              autoCapitalize="none"
+              autoCorrect={false}
+            />
+            <FilterChips
+              options={FILTER_OPTIONS}
+              value={filter}
+              onChange={setFilter}
+            />
+          </View>
+        }
         renderItem={({ item, index }) => (
           <UserRow
             user={item}
             expanded={expandedId === item.id}
             onToggleExpand={() =>
-              setExpandedId(expandedId === item.id ? null : item.id)
+              setExpandedId((current) => (current === item.id ? null : item.id))
             }
-            onEdit={() => onEdit(item)}
-            onRemove={() => onRemove(item)}
+            onEdit={() => openEditModal(item)}
+            onRemove={() => confirmRemove(item)}
             tintIndex={index % 3}
           />
         )}
-        contentContainerStyle={styles.listContent}
-        scrollEnabled={false}
       />
 
-      {/* Edit Modal */}
       <Modal
         animationType="slide"
         transparent
-        visible={editModal}
-        onRequestClose={() => setEditModal(false)}
+        visible={editingUser !== null}
+        onRequestClose={closeEditModal}
       >
         <View style={styles.modalOverlay}>
-          <KeyboardAvoidingView behavior="padding" style={styles.modal}>
-            <ScrollView
-              contentContainerStyle={styles.modalContent}
-              keyboardShouldPersistTaps="handled"
-            >
-              <Text style={styles.modalTitle}>Izmena korisnika</Text>
+          <View style={styles.modalCard}>
+            <Text style={styles.modalTitle}>Izmena korisnika</Text>
 
-              {/* first_name */}
-              <Text style={styles.label}>IME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>IME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.first_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, first_name: v }))
-                }
+                value={firstName}
+                onChangeText={setFirstName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* last_name */}
-              <Text style={styles.label}>PREZIME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>PREZIME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.last_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, last_name: v }))
-                }
+                value={lastName}
+                onChangeText={setLastName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* role */}
-              <Text style={styles.label}>ULOGA</Text>
-              <FilterChips<"user" | "admin">
-                options={[
-                  { key: "user", label: "Član" },
-                  { key: "admin", label: "Admin" },
-                ]}
-                value={editForm.role}
-                onChange={(v) => setEditForm((p) => ({ ...p, role: v }))}
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>ULOGA</Text>
+              <FilterChips
+                options={ROLE_OPTIONS}
+                value={role}
+                onChange={setRole}
               />
+            </View>
 
-              {/* max_sessions_per_week stepper */}
-              <Text style={styles.label}>NEDELJNI LIMIT</Text>
-              <View style={styles.stepperContainer}>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
+              <View style={styles.stepper}>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.max(
-                        0,
-                        p.max_sessions_per_week - 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 0}
+                  onPress={() => setMaxSessions((value) => Math.max(0, value - 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>−</Text>
+                  <Text style={styles.stepButtonText}>−</Text>
                 </Pressable>
-                <Text style={styles.stepperValue}>
-                  {editForm.max_sessions_per_week}
-                </Text>
+                <Text style={styles.stepValue}>{maxSessions}</Text>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.min(
-                        14,
-                        p.max_sessions_per_week + 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 14}
+                  onPress={() => setMaxSessions((value) => Math.min(14, value + 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>+</Text>
+                  <Text style={styles.stepButtonText}>＋</Text>
                 </Pressable>
               </View>
+            </View>
 
-              {/* Footer actions */}
-              <View style={styles.modalFooter}>
-                <Pressable
-                  onPress={() => setEditModal(false)}
-                  style={styles.cancelBtn}
-                  disabled={saving}
-                >
-                  <Text style={styles.cancelBtnText}>Otkaži</Text>
-                </Pressable>
-                <Pressable
-                  onPress={onSaveEdit}
-                  style={[
-                    styles.saveBtn,
-                    saving && styles.saveBtnDisabled,
-                  ]}
-                  disabled={saving}
-                >
-                  {saving ? (
-                    <ActivityIndicator size="small" color={Colors.surface} />
-                  ) : (
-                    <Text style={styles.saveBtnText}>Sačuvaj</Text>
-                  )}
-                </Pressable>
-              </View>
-            </ScrollView>
-          </KeyboardAvoidingView>
+            <View style={styles.modalFooter}>
+              <Pressable
+                onPress={closeEditModal}
+                disabled={saving}
+                style={styles.cancelButton}
+              >
+                <Text style={styles.cancelButtonText}>Otkaži</Text>
+              </Pressable>
+              <Pressable
+                onPress={() => void saveUser()}
+                disabled={saving}
+                style={[styles.saveButton, saving && styles.buttonDisabled]}
+              >
+                {saving ? (
+                  <ActivityIndicator color={Colors.surface} />
+                ) : (
+                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
+                )}
+              </Pressable>
+            </View>
+          </View>
         </View>
       </Modal>
-    </View>
+    </>
   );
 }
 
@@ -321,33 +298,37 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    paddingHorizontal: Spacing.screenHorizontal || 20,
   },
-  centerContainer: {
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  centeredState: {
     flex: 1,
+    alignItems: "center",
     justifyContent: "center",
-    alignItems: "center",
     backgroundColor: Colors.paper,
   },
   errorText: {
-    ...Typography.section,
+    ...Typography.body,
     color: Colors.inkMuted,
   },
-  header: {
-    paddingTop: 20,
-    paddingBottom: 16,
+  headerContent: {
+    gap: 16,
+    marginBottom: 16,
   },
-  headerTitle: {
-    fontFamily: FontFamilies.bricolage[800],
+  title: {
+    ...Typography.screenTitle,
     fontSize: 23,
-    fontWeight: "800",
     color: Colors.ink,
   },
-  headerSubtitle: {
+  subtitle: {
     fontFamily: FontFamilies.hanken[600],
     fontSize: 13,
     fontWeight: "600",
     color: Colors.inkMuted,
+    marginTop: 3,
   },
   searchInput: {
     backgroundColor: Colors.surface,
@@ -360,122 +341,114 @@
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
-    marginBottom: 16,
-  },
-  filterContainer: {
-    marginBottom: 16,
   },
-  listContent: {
-    gap: 12,
-    paddingBottom: 20,
+  listGap: {
+    height: 10,
   },
-  // Modal
   modalOverlay: {
     flex: 1,
-    backgroundColor: "rgba(0, 0, 0, 0.5)",
     justifyContent: "flex-end",
+    backgroundColor: "rgba(34, 31, 43, 0.35)",
   },
-  modal: {
-    flex: 1,
-    maxHeight: "90%",
-    backgroundColor: Colors.paper,
-    borderTopLeftRadius: Radii.tile[24],
-    borderTopRightRadius: Radii.tile[24],
-  },
-  modalContent: {
-    padding: Spacing.cardPadding || 20,
+  modalCard: {
+    backgroundColor: Colors.surface,
+    borderTopLeftRadius: Radii.card,
+    borderTopRightRadius: Radii.card,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 24,
+    paddingBottom: 28,
     gap: 16,
+    ...Shadows.card,
   },
   modalTitle: {
     fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
+    fontSize: 21,
     fontWeight: "800",
     color: Colors.ink,
-    marginBottom: 8,
   },
-  label: {
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldLabel: {
     fontFamily: FontFamilies.hanken[700],
-    fontSize: 11,
+    fontSize: 10,
     fontWeight: "700",
     letterSpacing: 1,
-    textTransform: "uppercase",
-    color: Colors.ink,
+    color: Colors.inkMuted,
   },
-  input: {
+  fieldInput: {
     backgroundColor: Colors.surface,
     borderColor: Colors.fieldBorder,
     borderWidth: 1,
     borderRadius: Radii.tile[14],
     paddingHorizontal: 12,
-    paddingVertical: 12,
+    paddingVertical: 11,
     fontFamily: FontFamilies.hanken[600],
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
   },
-  stepperContainer: {
+  stepper: {
+    alignSelf: "flex-start",
     flexDirection: "row",
     alignItems: "center",
-    gap: 12,
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
   },
-  stepperBtn: {
-    width: 40,
-    height: 40,
-    borderRadius: Radii.tile[12],
-    backgroundColor: Colors.surfaceMuted,
-    justifyContent: "center",
+  stepButton: {
+    width: 44,
+    height: 42,
     alignItems: "center",
+    justifyContent: "center",
   },
-  stepperBtnText: {
-    fontFamily: FontFamilies.hanken[800],
-    fontSize: 18,
-    fontWeight: "800",
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 20,
+    fontWeight: "700",
     color: Colors.burgundy,
   },
-  stepperValue: {
-    flex: 1,
+  stepValue: {
+    minWidth: 44,
     textAlign: "center",
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 16,
-    fontWeight: "800",
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
   modalFooter: {
     flexDirection: "row",
-    gap: 12,
-    marginTop: 16,
+    gap: 10,
+    marginTop: 4,
   },
-  cancelBtn: {
+  cancelButton: {
     flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
-    borderColor: Colors.burgundyBorder,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderColor: Colors.burgundy,
     borderWidth: 1,
-    justifyContent: "center",
-    alignItems: "center",
+    borderRadius: Radii.tile[14],
   },
-  cancelBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
+  cancelButtonText: {
+    ...Typography.primaryButtonCompact,
     color: Colors.burgundy,
   },
-  saveBtn: {
-    flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
+  saveButton: {
+    flex: 2,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderRadius: Radii.tile[14],
     backgroundColor: Colors.burgundy,
-    justifyContent: "center",
-    alignItems: "center",
-    ...Shadows.primaryButton,
   },
-  saveBtnDisabled: {
+  saveButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
     opacity: 0.6,
-  },
-  saveBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
-    color: Colors.surface,
   },
 });
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 5ff9c08c6c36ad11d37ae2b56f1e48e9638ab6e3..bbbd205d1bb0aac98ed8f85b00eb8fe3c290ebe5
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -1,11 +1,268 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
+} from "react-native";
+import { useLocalSearchParams, useRouter } from "expo-router";
+
+import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { upsertSession } from "@/services/admin";
+import type { UpsertSessionInput } from "@/services/admin";
 
+const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map(
+  (day) => ({
+    key: day,
+    label: {
+      monday: "PON",
+      tuesday: "UTO",
+      wednesday: "SRE",
+      thursday: "ČET",
+      friday: "PET",
+      saturday: "SUB",
+      sunday: "NED",
+    }[day],
+  }),
+);
+
 export default function TrainingDetailScreen() {
+  const router = useRouter();
+  const { id } = useLocalSearchParams<{ id: string }>();
+  const isNew = id === "new";
+  const { trainings, loading, fetchTrainings } = useTrainings();
+  const training = trainings.find((item) => item.id === id);
+  const [title, setTitle] = useState("");
+  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
+  const [time, setTime] = useState("");
+  const [room, setRoom] = useState("");
+  const [durationMin, setDurationMin] = useState<number | null>(null);
+  const [maxParticipants, setMaxParticipants] = useState(10);
+  const [isOpen, setIsOpen] = useState(true);
+  const [submitting, setSubmitting] = useState(false);
+  const [initializedId, setInitializedId] = useState<string | null>(null);
+
+  useEffect(() => {
+    if (!training || initializedId === training.id) return;
+
+    setTitle(training.title);
+    setDayOfWeek(
+      TRAINING_DAYS.includes(training.day_of_week as Day)
+        ? (training.day_of_week as Day)
+        : "monday",
+    );
+    setTime(training.time);
+    setRoom(training.room ?? "");
+    setDurationMin(training.duration_min);
+    setMaxParticipants(training.max_participants);
+    setIsOpen(training.is_open);
+    setInitializedId(training.id);
+  }, [initializedId, training]);
+
+  const submit = async () => {
+    const normalizedTitle = title.trim();
+    const normalizedTime = time.trim();
+
+    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+      Alert.alert(
+        "Proverite podatke",
+        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
+      );
+      return;
+    }
+
+    const input: UpsertSessionInput = {
+      id: isNew ? null : id,
+      title: normalizedTitle,
+      day_of_week: dayOfWeek,
+      time: normalizedTime,
+      room: room.trim() || null,
+      duration_min: durationMin,
+      max_participants: maxParticipants,
+      is_open: isOpen,
+    };
+
+    setSubmitting(true);
+    try {
+      await upsertSession(input);
+      await fetchTrainings();
+      router.back();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Trening nije sačuvan.");
+      await fetchTrainings();
+    } finally {
+      setSubmitting(false);
+    }
+  };
+
+  if (!isNew && loading && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (!isNew && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
+        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
+          <Text style={styles.notFoundButtonText}>Nazad</Text>
+        </Pressable>
+      </View>
+    );
+  }
+
   return (
     <View style={styles.screen}>
-      <Text style={styles.title}>Training Detail</Text>
+      <View style={styles.navBar}>
+        <Pressable
+          accessibilityRole="button"
+          onPress={() => router.back()}
+          style={styles.backButton}
+        >
+          <Text style={styles.backChevron}>‹</Text>
+        </Pressable>
+        <Text style={styles.navTitle}>
+          {isNew ? "Novi trening" : "Izmena treninga"}
+        </Text>
+        <View style={styles.navSpacer} />
+      </View>
+
+      <ScrollView
+        style={styles.formScroll}
+        contentContainerStyle={styles.formContent}
+        keyboardShouldPersistTaps="handled"
+        showsVerticalScrollIndicator={false}
+      >
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
+          <TextInput
+            value={title}
+            onChangeText={setTitle}
+            editable={!submitting}
+            style={styles.input}
+          />
+        </View>
+
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>DAN</Text>
+          <FilterChips
+            options={DAY_OPTIONS}
+            value={dayOfWeek}
+            onChange={setDayOfWeek}
+          />
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>VREME</Text>
+            <TextInput
+              value={time}
+              onChangeText={setTime}
+              placeholder="18:00"
+              placeholderTextColor={Colors.inkFaint}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
+            <TextInput
+              value={durationMin?.toString() ?? ""}
+              onChangeText={(value) =>
+                setDurationMin(value === "" ? null : Number(value.replace(/\D/g, "")))
+              }
+              keyboardType="number-pad"
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>SALA</Text>
+            <TextInput
+              value={room}
+              onChangeText={setRoom}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
+            <View style={styles.stepper}>
+              <Pressable
+                disabled={submitting || maxParticipants === 1}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.max(1, value - 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>−</Text>
+              </Pressable>
+              <Text style={styles.stepValue}>{maxParticipants}</Text>
+              <Pressable
+                disabled={submitting || maxParticipants === 50}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.min(50, value + 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>＋</Text>
+              </Pressable>
+            </View>
+          </View>
+        </View>
+
+        <View style={styles.statusCard}>
+          <View style={styles.statusTextBlock}>
+            <Text style={styles.statusTitle}>Status slota</Text>
+            <Text style={styles.statusDescription}>
+              Otvoren za prijave članova
+            </Text>
+          </View>
+          <Toggle
+            value={isOpen}
+            onValueChange={setIsOpen}
+            disabled={submitting}
+          />
+        </View>
+
+        <View style={styles.footer}>
+          <Pressable
+            onPress={() => router.back()}
+            disabled={submitting}
+            style={styles.cancelButton}
+          >
+            <Text style={styles.cancelButtonText}>Otkaži</Text>
+          </Pressable>
+          <Pressable
+            onPress={() => void submit()}
+            disabled={submitting}
+            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+          >
+            {submitting ? (
+              <ActivityIndicator color={Colors.surface} />
+            ) : (
+              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
+            )}
+          </Pressable>
+        </View>
+      </ScrollView>
     </View>
   );
 }
@@ -14,11 +271,194 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
+  },
+  centeredState: {
+    flex: 1,
+    alignItems: "center",
     justifyContent: "center",
+    gap: 16,
+    backgroundColor: Colors.paper,
+  },
+  notFoundText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
+  notFoundButton: {
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    paddingHorizontal: 18,
+    paddingVertical: 10,
+  },
+  notFoundButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.burgundy,
+  },
+  navBar: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 16,
+    paddingBottom: 12,
+    borderBottomColor: Colors.border,
+    borderBottomWidth: 1,
+  },
+  backButton: {
+    width: 38,
+    height: 38,
     alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    backgroundColor: Colors.surface,
+  },
+  backChevron: {
+    fontFamily: FontFamilies.hanken[500],
+    fontSize: 31,
+    fontWeight: "500",
+    lineHeight: 32,
+    color: Colors.burgundy,
   },
-  title: {
-    ...Typography.screenTitle,
+  navTitle: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 19,
+    fontWeight: "800",
     color: Colors.ink,
   },
+  navSpacer: {
+    width: 38,
+    height: 38,
+  },
+  formScroll: {
+    flex: 1,
+  },
+  formContent: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 22,
+    paddingBottom: 28,
+    gap: 20,
+  },
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  columnField: {
+    flex: 1,
+    gap: 7,
+  },
+  fieldLabel: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    letterSpacing: 1,
+    color: Colors.inkMuted,
+  },
+  input: {
+    minHeight: 46,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    paddingHorizontal: 12,
+    paddingVertical: 11,
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 14,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  stepper: {
+    minHeight: 46,
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
+  },
+  stepButton: {
+    width: 38,
+    height: 44,
+    alignItems: "center",
+    justifyContent: "center",
+  },
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 19,
+    fontWeight: "700",
+    color: Colors.burgundy,
+  },
+  stepValue: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusCard: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    gap: 16,
+    borderColor: Colors.goldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[16],
+    backgroundColor: Colors.surfaceWarm,
+    padding: Spacing.cardPadding,
+  },
+  statusTextBlock: {
+    flex: 1,
+    gap: 3,
+  },
+  statusTitle: {
+    fontFamily: FontFamilies.bricolage[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusDescription: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 12,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
+  footer: {
+    flexDirection: "row",
+    gap: 10,
+    marginTop: 4,
+  },
+  cancelButton: {
+    flex: 1,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+  },
+  cancelButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.burgundy,
+  },
+  saveButton: {
+    flex: 2,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.burgundy,
+    ...Shadows.primaryButton,
+  },
+  saveButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
+    opacity: 0.6,
+  },
 });

 succeeded in 2003ms:
exec
/bin/zsh -lc "npx eslint 'app/(admin)' src/components/admin" in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/(tabs)/sessions.tsx b/app/(admin)/(tabs)/sessions.tsx
index b37d42eee582cfcbbfbaba8b37d423440c0794ae..df22d2c62a54e17bd6bdbca98213ae4760f430de
--- a/app/(admin)/(tabs)/sessions.tsx
+++ b/app/(admin)/(tabs)/sessions.tsx
@@ -1,12 +1,155 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  FlatList,
+  Pressable,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import { SessionRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { setSessionOpen } from "@/services/admin";
+import { getCurrentWeekDates } from "@/utils/week";
+
+const DAY_LABELS: Record<Day, string> = {
+  sunday: "NED",
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+};
+
+const DAY_NAMES: Record<Day, string> = {
+  sunday: "NEDELJA",
+  monday: "PONEDELJAK",
+  tuesday: "UTORAK",
+  wednesday: "SREDA",
+  thursday: "ČETVRTAK",
+  friday: "PETAK",
+  saturday: "SUBOTA",
+};
+
+const MONTH_NAMES = [
+  "JAN",
+  "FEB",
+  "MAR",
+  "APR",
+  "MAJ",
+  "JUN",
+  "JUL",
+  "AVG",
+  "SEP",
+  "OKT",
+  "NOV",
+  "DEC",
+] as const;
 
 export default function TreninziScreen() {
+  const router = useRouter();
+  const [selectedDay, setSelectedDay] = useState<Day>("monday");
+  const { loading, fetchTrainings, getTrainingsByDay } = useTrainings();
+  const sessions = getTrainingsByDay(selectedDay);
+  const selectedDate = getCurrentWeekDates()[selectedDay];
+  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;
+
+  const toggleSession = async (sessionId: string, open: boolean) => {
+    try {
+      await setSessionOpen(sessionId, open);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Status treninga nije promenjen.");
+    } finally {
+      await fetchTrainings();
+    }
+  };
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Treninzi</Text>
-    </View>
+    <FlatList
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      data={sessions}
+      keyExtractor={(session) => session.id}
+      showsVerticalScrollIndicator={false}
+      ItemSeparatorComponent={() => <View style={styles.listGap} />}
+      ListHeaderComponent={
+        <View style={styles.headerContent}>
+          <View style={styles.titleRow}>
+            <View style={styles.titleBlock}>
+              <Text style={styles.title}>Treninzi</Text>
+              <Text style={styles.subtitle}>
+                {DAY_NAMES[selectedDay]} · {dateLabel}
+              </Text>
+            </View>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/(admin)/training/new")}
+              style={({ pressed }) => [
+                styles.newButton,
+                pressed && styles.buttonPressed,
+              ]}
+            >
+              <Text style={styles.newButtonText}>＋ Novi</Text>
+            </Pressable>
+          </View>
+
+          <View style={styles.daySelector}>
+            {TRAINING_DAYS.map((day) => {
+              const active = selectedDay === day;
+              return (
+                <Pressable
+                  key={day}
+                  onPress={() => setSelectedDay(day)}
+                  style={[
+                    styles.dayChip,
+                    active && styles.dayChipActive,
+                  ]}
+                >
+                  <Text
+                    style={[
+                      styles.dayChipText,
+                      active && styles.dayChipTextActive,
+                    ]}
+                  >
+                    {DAY_LABELS[day]}
+                  </Text>
+                </Pressable>
+              );
+            })}
+          </View>
+
+          {loading && (
+            <ActivityIndicator
+              color={Colors.burgundy}
+              style={styles.loadingIndicator}
+            />
+          )}
+        </View>
+      }
+      ListEmptyComponent={
+        loading ? null : (
+          <Text style={styles.emptyText}>Nema termina za ovaj dan.</Text>
+        )
+      }
+      renderItem={({ item }) => (
+        <SessionRow
+          session={item}
+          bookedCount={item.session_participants.length}
+          onToggleOpen={(open) => void toggleSession(item.id, open)}
+          onPress={() => router.push(`/(admin)/training/${item.id}`)}
+        />
+      )}
+    />
   );
 }
 
@@ -14,11 +157,95 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    flexGrow: 1,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  headerContent: {
+    gap: 18,
+    marginBottom: 16,
+  },
+  titleRow: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 12,
   },
+  titleBlock: {
+    flex: 1,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
     color: Colors.ink,
   },
+  subtitle: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  newButton: {
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.burgundy,
+    paddingHorizontal: 14,
+    paddingVertical: 9,
+    ...Shadows.primaryButton,
+  },
+  newButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 13,
+    fontWeight: "700",
+    color: Colors.surface,
+  },
+  buttonPressed: {
+    opacity: 0.85,
+  },
+  daySelector: {
+    flexDirection: "row",
+    justifyContent: "space-between",
+    gap: 5,
+  },
+  dayChip: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 36,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.surface,
+  },
+  dayChipActive: {
+    borderColor: Colors.burgundy,
+    backgroundColor: Colors.burgundy,
+    ...Shadows.activeDay,
+  },
+  dayChipText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  dayChipTextActive: {
+    color: Colors.surface,
+  },
+  loadingIndicator: {
+    marginTop: 10,
+  },
+  listGap: {
+    height: 10,
+  },
+  emptyText: {
+    marginTop: 48,
+    textAlign: "center",
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
 });
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 8af74755eb930ef1aea5ab7c7c6df27230debb82..d750a54b7f9ba61a558953849e34bda2533339a1
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -1,319 +1,296 @@
+import { useCallback, useEffect, useMemo, useState } from "react";
 import {
-  View,
-  Text,
-  StyleSheet,
+  ActivityIndicator,
+  Alert,
   FlatList,
-  TextInput,
   Modal,
-  Alert,
-  ActivityIndicator,
   Pressable,
-  ScrollView,
-  KeyboardAvoidingView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
 } from "react-native";
-import { useEffect, useState } from "react";
+
+import { FilterChips, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import {
-  listUsers,
-  updateUser,
-  deleteUser,
-  AdminUser,
-  UpdateUserPatch,
-} from "@/services/admin";
-import UserRow from "@/components/admin/UserRow";
-import FilterChips from "@/components/admin/FilterChips";
+import { deleteUser, listUsers, updateUser } from "@/services/admin";
+import type { AdminUser, UpdateUserPatch } from "@/services/admin";
 
-type FilterKey = "svi" | "aktivni" | "admini";
+type UserFilter = "svi" | "aktivni" | "admini";
+type UserRole = AdminUser["role"];
 
+const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
+  { key: "svi", label: "Svi" },
+  { key: "aktivni", label: "Aktivni" },
+  { key: "admini", label: "Admini" },
+];
+
+const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
+  { key: "user", label: "Član" },
+  { key: "admin", label: "Admin" },
+];
+
 export default function KorisniciScreen() {
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
+  const [hasError, setHasError] = useState(false);
+  const [search, setSearch] = useState("");
+  const [filter, setFilter] = useState<UserFilter>("svi");
   const [expandedId, setExpandedId] = useState<string | null>(null);
-  const [searchText, setSearchText] = useState("");
-  const [filter, setFilter] = useState<FilterKey>("svi");
   const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
-  const [editModal, setEditModal] = useState(false);
-  const [editForm, setEditForm] = useState({
-    first_name: "",
-    last_name: "",
-    role: "user" as "user" | "admin",
-    max_sessions_per_week: 0,
-  });
+  const [firstName, setFirstName] = useState("");
+  const [lastName, setLastName] = useState("");
+  const [role, setRole] = useState<UserRole>("user");
+  const [maxSessions, setMaxSessions] = useState(0);
   const [saving, setSaving] = useState(false);
 
-  // Load users on mount
-  useEffect(() => {
-    fetchUsers();
-  }, []);
+  const fetchUsers = useCallback(async () => {
+    setLoading(true);
+    setHasError(false);
 
-  const fetchUsers = async () => {
-    setLoading(true);
-    setError(null);
     try {
-      const data = await listUsers();
-      setUsers(data);
-    } catch (err) {
-      setError("Greška pri učitavanju");
-      if (__DEV__) console.error(err);
+      setUsers(await listUsers());
+    } catch (error: unknown) {
+      console.error(error);
+      setHasError(true);
     } finally {
       setLoading(false);
     }
-  };
+  }, []);
 
-  // Filter logic
-  const filteredUsers = users
-    .filter((u) => {
-      const searchLower = searchText.toLowerCase();
-      const matchesSearch =
-        u.first_name.toLowerCase().includes(searchLower) ||
-        (u.last_name?.toLowerCase().includes(searchLower) ?? false) ||
-        u.email.toLowerCase().includes(searchLower);
+  useEffect(() => {
+    void fetchUsers();
+  }, [fetchUsers]);
 
-      if (!matchesSearch) return false;
+  const filteredUsers = useMemo(() => {
+    const query = search.trim().toLocaleLowerCase();
+
+    return users.filter((user) => {
+      const matchesFilter =
+        filter === "svi" ||
+        (filter === "aktivni" && user.enabled !== false) ||
+        (filter === "admini" && user.role === "admin");
+      const searchable = `${user.first_name} ${user.last_name ?? ""} ${user.email}`
+        .toLocaleLowerCase();
 
-      if (filter === "aktivni") return u.enabled !== false;
-      if (filter === "admini") return u.role === "admin";
-      return true;
+      return matchesFilter && searchable.includes(query);
     });
+  }, [filter, search, users]);
 
-  // Edit modal handlers
-  const onEdit = (user: AdminUser) => {
+  const openEditModal = (user: AdminUser) => {
     setEditingUser(user);
-    setEditForm({
-      first_name: user.first_name,
-      last_name: user.last_name || "",
-      role: user.role,
-      max_sessions_per_week: user.max_sessions_per_week,
-    });
-    setEditModal(true);
+    setFirstName(user.first_name);
+    setLastName(user.last_name ?? "");
+    setRole(user.role);
+    setMaxSessions(user.max_sessions_per_week);
   };
 
-  const onRemove = (user: AdminUser) => {
-    Alert.alert(
-      "Ukloni korisnika",
-      `${user.first_name} ${user.last_name || ""} i sve njegove rezervacije će biti uklonjeni.`,
-      [
-        { text: "Otkaži", style: "cancel" },
-        {
-          text: "Ukloni",
-          onPress: async () => {
-            try {
-              await deleteUser(user.id);
-              await fetchUsers();
-            } catch (err) {
-              Alert.alert("Greška", "Nije moguće obrisati korisnika");
-              if (__DEV__) console.error(err);
-            }
-          },
-          style: "destructive",
-        },
-      ]
-    );
+  const closeEditModal = () => {
+    if (!saving) setEditingUser(null);
   };
 
-  const onSaveEdit = async () => {
+  const saveUser = async () => {
     if (!editingUser) return;
 
+    const patch: UpdateUserPatch = {
+      first_name: firstName.trim(),
+      last_name: lastName.trim(),
+      role,
+      max_sessions_per_week: maxSessions,
+    };
+
     setSaving(true);
     try {
-      const patch: UpdateUserPatch = {
-        first_name: editForm.first_name || null,
-        last_name: editForm.last_name || null,
-        role: editForm.role,
-        max_sessions_per_week: editForm.max_sessions_per_week,
-      };
       await updateUser(editingUser.id, patch);
-      setEditModal(false);
       setEditingUser(null);
       await fetchUsers();
-    } catch (err) {
-      Alert.alert("Greška", "Nije moguće sačuvati promene");
-      if (__DEV__) console.error(err);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
+      await fetchUsers();
     } finally {
       setSaving(false);
     }
   };
 
-  if (loading) {
+  const removeUser = async (user: AdminUser) => {
+    try {
+      await deleteUser(user.id);
+      setExpandedId(null);
+      await fetchUsers();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Korisnik nije uklonjen.");
+      await fetchUsers();
+    }
+  };
+
+  const confirmRemove = (user: AdminUser) => {
+    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();
+
+    Alert.alert(
+      "Ukloni korisnika",
+      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
+      [
+        { text: "Otkaži", style: "cancel" },
+        {
+          text: "Ukloni",
+          style: "destructive",
+          onPress: () => void removeUser(user),
+        },
+      ],
+    );
+  };
+
+  if (loading && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <ActivityIndicator size="large" color={Colors.burgundy} />
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
       </View>
     );
   }
 
-  if (error) {
+  if (hasError && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <Text style={styles.errorText}>{error}</Text>
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
       </View>
     );
   }
 
   return (
-    <View style={styles.screen}>
-      {/* Header */}
-      <View style={styles.header}>
-        <Text style={styles.headerTitle}>Korisnici</Text>
-        <Text style={styles.headerSubtitle}>{users.length} članova</Text>
-      </View>
-
-      {/* Search */}
-      <TextInput
-        style={styles.searchInput}
-        placeholder="Pretraži članove…"
-        placeholderTextColor={Colors.inkMuted}
-        value={searchText}
-        onChangeText={setSearchText}
-      />
-
-      {/* Filter chips */}
-      <View style={styles.filterContainer}>
-        <FilterChips<FilterKey>
-          options={[
-            { key: "svi", label: "Svi" },
-            { key: "aktivni", label: "Aktivni" },
-            { key: "admini", label: "Admini" },
-          ]}
-          value={filter}
-          onChange={setFilter}
-        />
-      </View>
-
-      {/* User list */}
+    <>
       <FlatList
+        style={styles.screen}
+        contentContainerStyle={styles.content}
         data={filteredUsers}
-        keyExtractor={(u) => u.id}
+        keyExtractor={(user) => user.id}
+        showsVerticalScrollIndicator={false}
+        ItemSeparatorComponent={() => <View style={styles.listGap} />}
+        ListHeaderComponent={
+          <View style={styles.headerContent}>
+            <View>
+              <Text style={styles.title}>Korisnici</Text>
+              <Text style={styles.subtitle}>{users.length} članova</Text>
+            </View>
+            <TextInput
+              value={search}
+              onChangeText={setSearch}
+              placeholder="Pretraži članove…"
+              placeholderTextColor={Colors.inkFaint}
+              style={styles.searchInput}
+              autoCapitalize="none"
+              autoCorrect={false}
+            />
+            <FilterChips
+              options={FILTER_OPTIONS}
+              value={filter}
+              onChange={setFilter}
+            />
+          </View>
+        }
         renderItem={({ item, index }) => (
           <UserRow
             user={item}
             expanded={expandedId === item.id}
             onToggleExpand={() =>
-              setExpandedId(expandedId === item.id ? null : item.id)
+              setExpandedId((current) => (current === item.id ? null : item.id))
             }
-            onEdit={() => onEdit(item)}
-            onRemove={() => onRemove(item)}
+            onEdit={() => openEditModal(item)}
+            onRemove={() => confirmRemove(item)}
             tintIndex={index % 3}
           />
         )}
-        contentContainerStyle={styles.listContent}
-        scrollEnabled={false}
       />
 
-      {/* Edit Modal */}
       <Modal
         animationType="slide"
         transparent
-        visible={editModal}
-        onRequestClose={() => setEditModal(false)}
+        visible={editingUser !== null}
+        onRequestClose={closeEditModal}
       >
         <View style={styles.modalOverlay}>
-          <KeyboardAvoidingView behavior="padding" style={styles.modal}>
-            <ScrollView
-              contentContainerStyle={styles.modalContent}
-              keyboardShouldPersistTaps="handled"
-            >
-              <Text style={styles.modalTitle}>Izmena korisnika</Text>
+          <View style={styles.modalCard}>
+            <Text style={styles.modalTitle}>Izmena korisnika</Text>
 
-              {/* first_name */}
-              <Text style={styles.label}>IME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>IME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.first_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, first_name: v }))
-                }
+                value={firstName}
+                onChangeText={setFirstName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* last_name */}
-              <Text style={styles.label}>PREZIME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>PREZIME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.last_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, last_name: v }))
-                }
+                value={lastName}
+                onChangeText={setLastName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* role */}
-              <Text style={styles.label}>ULOGA</Text>
-              <FilterChips<"user" | "admin">
-                options={[
-                  { key: "user", label: "Član" },
-                  { key: "admin", label: "Admin" },
-                ]}
-                value={editForm.role}
-                onChange={(v) => setEditForm((p) => ({ ...p, role: v }))}
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>ULOGA</Text>
+              <FilterChips
+                options={ROLE_OPTIONS}
+                value={role}
+                onChange={setRole}
               />
+            </View>
 
-              {/* max_sessions_per_week stepper */}
-              <Text style={styles.label}>NEDELJNI LIMIT</Text>
-              <View style={styles.stepperContainer}>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
+              <View style={styles.stepper}>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.max(
-                        0,
-                        p.max_sessions_per_week - 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 0}
+                  onPress={() => setMaxSessions((value) => Math.max(0, value - 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>−</Text>
+                  <Text style={styles.stepButtonText}>−</Text>
                 </Pressable>
-                <Text style={styles.stepperValue}>
-                  {editForm.max_sessions_per_week}
-                </Text>
+                <Text style={styles.stepValue}>{maxSessions}</Text>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.min(
-                        14,
-                        p.max_sessions_per_week + 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 14}
+                  onPress={() => setMaxSessions((value) => Math.min(14, value + 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>+</Text>
+                  <Text style={styles.stepButtonText}>＋</Text>
                 </Pressable>
               </View>
+            </View>
 
-              {/* Footer actions */}
-              <View style={styles.modalFooter}>
-                <Pressable
-                  onPress={() => setEditModal(false)}
-                  style={styles.cancelBtn}
-                  disabled={saving}
-                >
-                  <Text style={styles.cancelBtnText}>Otkaži</Text>
-                </Pressable>
-                <Pressable
-                  onPress={onSaveEdit}
-                  style={[
-                    styles.saveBtn,
-                    saving && styles.saveBtnDisabled,
-                  ]}
-                  disabled={saving}
-                >
-                  {saving ? (
-                    <ActivityIndicator size="small" color={Colors.surface} />
-                  ) : (
-                    <Text style={styles.saveBtnText}>Sačuvaj</Text>
-                  )}
-                </Pressable>
-              </View>
-            </ScrollView>
-          </KeyboardAvoidingView>
+            <View style={styles.modalFooter}>
+              <Pressable
+                onPress={closeEditModal}
+                disabled={saving}
+                style={styles.cancelButton}
+              >
+                <Text style={styles.cancelButtonText}>Otkaži</Text>
+              </Pressable>
+              <Pressable
+                onPress={() => void saveUser()}
+                disabled={saving}
+                style={[styles.saveButton, saving && styles.buttonDisabled]}
+              >
+                {saving ? (
+                  <ActivityIndicator color={Colors.surface} />
+                ) : (
+                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
+                )}
+              </Pressable>
+            </View>
+          </View>
         </View>
       </Modal>
-    </View>
+    </>
   );
 }
 
@@ -321,33 +298,37 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    paddingHorizontal: Spacing.screenHorizontal || 20,
   },
-  centerContainer: {
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  centeredState: {
     flex: 1,
+    alignItems: "center",
     justifyContent: "center",
-    alignItems: "center",
     backgroundColor: Colors.paper,
   },
   errorText: {
-    ...Typography.section,
+    ...Typography.body,
     color: Colors.inkMuted,
   },
-  header: {
-    paddingTop: 20,
-    paddingBottom: 16,
+  headerContent: {
+    gap: 16,
+    marginBottom: 16,
   },
-  headerTitle: {
-    fontFamily: FontFamilies.bricolage[800],
+  title: {
+    ...Typography.screenTitle,
     fontSize: 23,
-    fontWeight: "800",
     color: Colors.ink,
   },
-  headerSubtitle: {
+  subtitle: {
     fontFamily: FontFamilies.hanken[600],
     fontSize: 13,
     fontWeight: "600",
     color: Colors.inkMuted,
+    marginTop: 3,
   },
   searchInput: {
     backgroundColor: Colors.surface,
@@ -360,122 +341,114 @@
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
-    marginBottom: 16,
-  },
-  filterContainer: {
-    marginBottom: 16,
   },
-  listContent: {
-    gap: 12,
-    paddingBottom: 20,
+  listGap: {
+    height: 10,
   },
-  // Modal
   modalOverlay: {
     flex: 1,
-    backgroundColor: "rgba(0, 0, 0, 0.5)",
     justifyContent: "flex-end",
+    backgroundColor: "rgba(34, 31, 43, 0.35)",
   },
-  modal: {
-    flex: 1,
-    maxHeight: "90%",
-    backgroundColor: Colors.paper,
-    borderTopLeftRadius: Radii.tile[24],
-    borderTopRightRadius: Radii.tile[24],
-  },
-  modalContent: {
-    padding: Spacing.cardPadding || 20,
+  modalCard: {
+    backgroundColor: Colors.surface,
+    borderTopLeftRadius: Radii.card,
+    borderTopRightRadius: Radii.card,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 24,
+    paddingBottom: 28,
     gap: 16,
+    ...Shadows.card,
   },
   modalTitle: {
     fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
+    fontSize: 21,
     fontWeight: "800",
     color: Colors.ink,
-    marginBottom: 8,
   },
-  label: {
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldLabel: {
     fontFamily: FontFamilies.hanken[700],
-    fontSize: 11,
+    fontSize: 10,
     fontWeight: "700",
     letterSpacing: 1,
-    textTransform: "uppercase",
-    color: Colors.ink,
+    color: Colors.inkMuted,
   },
-  input: {
+  fieldInput: {
     backgroundColor: Colors.surface,
     borderColor: Colors.fieldBorder,
     borderWidth: 1,
     borderRadius: Radii.tile[14],
     paddingHorizontal: 12,
-    paddingVertical: 12,
+    paddingVertical: 11,
     fontFamily: FontFamilies.hanken[600],
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
   },
-  stepperContainer: {
+  stepper: {
+    alignSelf: "flex-start",
     flexDirection: "row",
     alignItems: "center",
-    gap: 12,
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
   },
-  stepperBtn: {
-    width: 40,
-    height: 40,
-    borderRadius: Radii.tile[12],
-    backgroundColor: Colors.surfaceMuted,
-    justifyContent: "center",
+  stepButton: {
+    width: 44,
+    height: 42,
     alignItems: "center",
+    justifyContent: "center",
   },
-  stepperBtnText: {
-    fontFamily: FontFamilies.hanken[800],
-    fontSize: 18,
-    fontWeight: "800",
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 20,
+    fontWeight: "700",
     color: Colors.burgundy,
   },
-  stepperValue: {
-    flex: 1,
+  stepValue: {
+    minWidth: 44,
     textAlign: "center",
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 16,
-    fontWeight: "800",
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
   modalFooter: {
     flexDirection: "row",
-    gap: 12,
-    marginTop: 16,
+    gap: 10,
+    marginTop: 4,
   },
-  cancelBtn: {
+  cancelButton: {
     flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
-    borderColor: Colors.burgundyBorder,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderColor: Colors.burgundy,
     borderWidth: 1,
-    justifyContent: "center",
-    alignItems: "center",
+    borderRadius: Radii.tile[14],
   },
-  cancelBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
+  cancelButtonText: {
+    ...Typography.primaryButtonCompact,
     color: Colors.burgundy,
   },
-  saveBtn: {
-    flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
+  saveButton: {
+    flex: 2,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderRadius: Radii.tile[14],
     backgroundColor: Colors.burgundy,
-    justifyContent: "center",
-    alignItems: "center",
-    ...Shadows.primaryButton,
   },
-  saveBtnDisabled: {
+  saveButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
     opacity: 0.6,
-  },
-  saveBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
-    color: Colors.surface,
   },
 });
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 5ff9c08c6c36ad11d37ae2b56f1e48e9638ab6e3..bbbd205d1bb0aac98ed8f85b00eb8fe3c290ebe5
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -1,11 +1,268 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
+} from "react-native";
+import { useLocalSearchParams, useRouter } from "expo-router";
+
+import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { upsertSession } from "@/services/admin";
+import type { UpsertSessionInput } from "@/services/admin";
 
+const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map(
+  (day) => ({
+    key: day,
+    label: {
+      monday: "PON",
+      tuesday: "UTO",
+      wednesday: "SRE",
+      thursday: "ČET",
+      friday: "PET",
+      saturday: "SUB",
+      sunday: "NED",
+    }[day],
+  }),
+);
+
 export default function TrainingDetailScreen() {
+  const router = useRouter();
+  const { id } = useLocalSearchParams<{ id: string }>();
+  const isNew = id === "new";
+  const { trainings, loading, fetchTrainings } = useTrainings();
+  const training = trainings.find((item) => item.id === id);
+  const [title, setTitle] = useState("");
+  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
+  const [time, setTime] = useState("");
+  const [room, setRoom] = useState("");
+  const [durationMin, setDurationMin] = useState<number | null>(null);
+  const [maxParticipants, setMaxParticipants] = useState(10);
+  const [isOpen, setIsOpen] = useState(true);
+  const [submitting, setSubmitting] = useState(false);
+  const [initializedId, setInitializedId] = useState<string | null>(null);
+
+  useEffect(() => {
+    if (!training || initializedId === training.id) return;
+
+    setTitle(training.title);
+    setDayOfWeek(
+      TRAINING_DAYS.includes(training.day_of_week as Day)
+        ? (training.day_of_week as Day)
+        : "monday",
+    );
+    setTime(training.time);
+    setRoom(training.room ?? "");
+    setDurationMin(training.duration_min);
+    setMaxParticipants(training.max_participants);
+    setIsOpen(training.is_open);
+    setInitializedId(training.id);
+  }, [initializedId, training]);
+
+  const submit = async () => {
+    const normalizedTitle = title.trim();
+    const normalizedTime = time.trim();
+
+    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+      Alert.alert(
+        "Proverite podatke",
+        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
+      );
+      return;
+    }
+
+    const input: UpsertSessionInput = {
+      id: isNew ? null : id,
+      title: normalizedTitle,
+      day_of_week: dayOfWeek,
+      time: normalizedTime,
+      room: room.trim() || null,
+      duration_min: durationMin,
+      max_participants: maxParticipants,
+      is_open: isOpen,
+    };
+
+    setSubmitting(true);
+    try {
+      await upsertSession(input);
+      await fetchTrainings();
+      router.back();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Trening nije sačuvan.");
+      await fetchTrainings();
+    } finally {
+      setSubmitting(false);
+    }
+  };
+
+  if (!isNew && loading && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (!isNew && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
+        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
+          <Text style={styles.notFoundButtonText}>Nazad</Text>
+        </Pressable>
+      </View>
+    );
+  }
+
   return (
     <View style={styles.screen}>
-      <Text style={styles.title}>Training Detail</Text>
+      <View style={styles.navBar}>
+        <Pressable
+          accessibilityRole="button"
+          onPress={() => router.back()}
+          style={styles.backButton}
+        >
+          <Text style={styles.backChevron}>‹</Text>
+        </Pressable>
+        <Text style={styles.navTitle}>
+          {isNew ? "Novi trening" : "Izmena treninga"}
+        </Text>
+        <View style={styles.navSpacer} />
+      </View>
+
+      <ScrollView
+        style={styles.formScroll}
+        contentContainerStyle={styles.formContent}
+        keyboardShouldPersistTaps="handled"
+        showsVerticalScrollIndicator={false}
+      >
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
+          <TextInput
+            value={title}
+            onChangeText={setTitle}
+            editable={!submitting}
+            style={styles.input}
+          />
+        </View>
+
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>DAN</Text>
+          <FilterChips
+            options={DAY_OPTIONS}
+            value={dayOfWeek}
+            onChange={setDayOfWeek}
+          />
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>VREME</Text>
+            <TextInput
+              value={time}
+              onChangeText={setTime}
+              placeholder="18:00"
+              placeholderTextColor={Colors.inkFaint}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
+            <TextInput
+              value={durationMin?.toString() ?? ""}
+              onChangeText={(value) =>
+                setDurationMin(value === "" ? null : Number(value.replace(/\D/g, "")))
+              }
+              keyboardType="number-pad"
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>SALA</Text>
+            <TextInput
+              value={room}
+              onChangeText={setRoom}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
+            <View style={styles.stepper}>
+              <Pressable
+                disabled={submitting || maxParticipants === 1}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.max(1, value - 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>−</Text>
+              </Pressable>
+              <Text style={styles.stepValue}>{maxParticipants}</Text>
+              <Pressable
+                disabled={submitting || maxParticipants === 50}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.min(50, value + 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>＋</Text>
+              </Pressable>
+            </View>
+          </View>
+        </View>
+
+        <View style={styles.statusCard}>
+          <View style={styles.statusTextBlock}>
+            <Text style={styles.statusTitle}>Status slota</Text>
+            <Text style={styles.statusDescription}>
+              Otvoren za prijave članova
+            </Text>
+          </View>
+          <Toggle
+            value={isOpen}
+            onValueChange={setIsOpen}
+            disabled={submitting}
+          />
+        </View>
+
+        <View style={styles.footer}>
+          <Pressable
+            onPress={() => router.back()}
+            disabled={submitting}
+            style={styles.cancelButton}
+          >
+            <Text style={styles.cancelButtonText}>Otkaži</Text>
+          </Pressable>
+          <Pressable
+            onPress={() => void submit()}
+            disabled={submitting}
+            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+          >
+            {submitting ? (
+              <ActivityIndicator color={Colors.surface} />
+            ) : (
+              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
+            )}
+          </Pressable>
+        </View>
+      </ScrollView>
     </View>
   );
 }
@@ -14,11 +271,194 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
+  },
+  centeredState: {
+    flex: 1,
+    alignItems: "center",
     justifyContent: "center",
+    gap: 16,
+    backgroundColor: Colors.paper,
+  },
+  notFoundText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
+  notFoundButton: {
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    paddingHorizontal: 18,
+    paddingVertical: 10,
+  },
+  notFoundButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.burgundy,
+  },
+  navBar: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 16,
+    paddingBottom: 12,
+    borderBottomColor: Colors.border,
+    borderBottomWidth: 1,
+  },
+  backButton: {
+    width: 38,
+    height: 38,
     alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    backgroundColor: Colors.surface,
+  },
+  backChevron: {
+    fontFamily: FontFamilies.hanken[500],
+    fontSize: 31,
+    fontWeight: "500",
+    lineHeight: 32,
+    color: Colors.burgundy,
   },
-  title: {
-    ...Typography.screenTitle,
+  navTitle: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 19,
+    fontWeight: "800",
     color: Colors.ink,
   },
+  navSpacer: {
+    width: 38,
+    height: 38,
+  },
+  formScroll: {
+    flex: 1,
+  },
+  formContent: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 22,
+    paddingBottom: 28,
+    gap: 20,
+  },
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  columnField: {
+    flex: 1,
+    gap: 7,
+  },
+  fieldLabel: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    letterSpacing: 1,
+    color: Colors.inkMuted,
+  },
+  input: {
+    minHeight: 46,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    paddingHorizontal: 12,
+    paddingVertical: 11,
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 14,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  stepper: {
+    minHeight: 46,
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
+  },
+  stepButton: {
+    width: 38,
+    height: 44,
+    alignItems: "center",
+    justifyContent: "center",
+  },
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 19,
+    fontWeight: "700",
+    color: Colors.burgundy,
+  },
+  stepValue: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusCard: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    gap: 16,
+    borderColor: Colors.goldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[16],
+    backgroundColor: Colors.surfaceWarm,
+    padding: Spacing.cardPadding,
+  },
+  statusTextBlock: {
+    flex: 1,
+    gap: 3,
+  },
+  statusTitle: {
+    fontFamily: FontFamilies.bricolage[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusDescription: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 12,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
+  footer: {
+    flexDirection: "row",
+    gap: 10,
+    marginTop: 4,
+  },
+  cancelButton: {
+    flex: 1,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+  },
+  cancelButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.burgundy,
+  },
+  saveButton: {
+    flex: 2,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.burgundy,
+    ...Shadows.primaryButton,
+  },
+  saveButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
+    opacity: 0.6,
+  },
 });

 succeeded in 1500ms:
exec
/bin/zsh -lc "npx prettier --check 'app/(admin)/(tabs)/users.tsx' 'app/(admin)/(tabs)/sessions.tsx' 'app/(admin)/training/[id].tsx'" in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/(tabs)/sessions.tsx b/app/(admin)/(tabs)/sessions.tsx
index b37d42eee582cfcbbfbaba8b37d423440c0794ae..df22d2c62a54e17bd6bdbca98213ae4760f430de
--- a/app/(admin)/(tabs)/sessions.tsx
+++ b/app/(admin)/(tabs)/sessions.tsx
@@ -1,12 +1,155 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  FlatList,
+  Pressable,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import { SessionRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { setSessionOpen } from "@/services/admin";
+import { getCurrentWeekDates } from "@/utils/week";
+
+const DAY_LABELS: Record<Day, string> = {
+  sunday: "NED",
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+};
+
+const DAY_NAMES: Record<Day, string> = {
+  sunday: "NEDELJA",
+  monday: "PONEDELJAK",
+  tuesday: "UTORAK",
+  wednesday: "SREDA",
+  thursday: "ČETVRTAK",
+  friday: "PETAK",
+  saturday: "SUBOTA",
+};
+
+const MONTH_NAMES = [
+  "JAN",
+  "FEB",
+  "MAR",
+  "APR",
+  "MAJ",
+  "JUN",
+  "JUL",
+  "AVG",
+  "SEP",
+  "OKT",
+  "NOV",
+  "DEC",
+] as const;
 
 export default function TreninziScreen() {
+  const router = useRouter();
+  const [selectedDay, setSelectedDay] = useState<Day>("monday");
+  const { loading, fetchTrainings, getTrainingsByDay } = useTrainings();
+  const sessions = getTrainingsByDay(selectedDay);
+  const selectedDate = getCurrentWeekDates()[selectedDay];
+  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;
+
+  const toggleSession = async (sessionId: string, open: boolean) => {
+    try {
+      await setSessionOpen(sessionId, open);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Status treninga nije promenjen.");
+    } finally {
+      await fetchTrainings();
+    }
+  };
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Treninzi</Text>
-    </View>
+    <FlatList
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      data={sessions}
+      keyExtractor={(session) => session.id}
+      showsVerticalScrollIndicator={false}
+      ItemSeparatorComponent={() => <View style={styles.listGap} />}
+      ListHeaderComponent={
+        <View style={styles.headerContent}>
+          <View style={styles.titleRow}>
+            <View style={styles.titleBlock}>
+              <Text style={styles.title}>Treninzi</Text>
+              <Text style={styles.subtitle}>
+                {DAY_NAMES[selectedDay]} · {dateLabel}
+              </Text>
+            </View>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/(admin)/training/new")}
+              style={({ pressed }) => [
+                styles.newButton,
+                pressed && styles.buttonPressed,
+              ]}
+            >
+              <Text style={styles.newButtonText}>＋ Novi</Text>
+            </Pressable>
+          </View>
+
+          <View style={styles.daySelector}>
+            {TRAINING_DAYS.map((day) => {
+              const active = selectedDay === day;
+              return (
+                <Pressable
+                  key={day}
+                  onPress={() => setSelectedDay(day)}
+                  style={[
+                    styles.dayChip,
+                    active && styles.dayChipActive,
+                  ]}
+                >
+                  <Text
+                    style={[
+                      styles.dayChipText,
+                      active && styles.dayChipTextActive,
+                    ]}
+                  >
+                    {DAY_LABELS[day]}
+                  </Text>
+                </Pressable>
+              );
+            })}
+          </View>
+
+          {loading && (
+            <ActivityIndicator
+              color={Colors.burgundy}
+              style={styles.loadingIndicator}
+            />
+          )}
+        </View>
+      }
+      ListEmptyComponent={
+        loading ? null : (
+          <Text style={styles.emptyText}>Nema termina za ovaj dan.</Text>
+        )
+      }
+      renderItem={({ item }) => (
+        <SessionRow
+          session={item}
+          bookedCount={item.session_participants.length}
+          onToggleOpen={(open) => void toggleSession(item.id, open)}
+          onPress={() => router.push(`/(admin)/training/${item.id}`)}
+        />
+      )}
+    />
   );
 }
 
@@ -14,11 +157,95 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    flexGrow: 1,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  headerContent: {
+    gap: 18,
+    marginBottom: 16,
+  },
+  titleRow: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 12,
   },
+  titleBlock: {
+    flex: 1,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
     color: Colors.ink,
   },
+  subtitle: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  newButton: {
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.burgundy,
+    paddingHorizontal: 14,
+    paddingVertical: 9,
+    ...Shadows.primaryButton,
+  },
+  newButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 13,
+    fontWeight: "700",
+    color: Colors.surface,
+  },
+  buttonPressed: {
+    opacity: 0.85,
+  },
+  daySelector: {
+    flexDirection: "row",
+    justifyContent: "space-between",
+    gap: 5,
+  },
+  dayChip: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 36,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.surface,
+  },
+  dayChipActive: {
+    borderColor: Colors.burgundy,
+    backgroundColor: Colors.burgundy,
+    ...Shadows.activeDay,
+  },
+  dayChipText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  dayChipTextActive: {
+    color: Colors.surface,
+  },
+  loadingIndicator: {
+    marginTop: 10,
+  },
+  listGap: {
+    height: 10,
+  },
+  emptyText: {
+    marginTop: 48,
+    textAlign: "center",
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
 });
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 8af74755eb930ef1aea5ab7c7c6df27230debb82..d750a54b7f9ba61a558953849e34bda2533339a1
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -1,319 +1,296 @@
+import { useCallback, useEffect, useMemo, useState } from "react";
 import {
-  View,
-  Text,
-  StyleSheet,
+  ActivityIndicator,
+  Alert,
   FlatList,
-  TextInput,
   Modal,
-  Alert,
-  ActivityIndicator,
   Pressable,
-  ScrollView,
-  KeyboardAvoidingView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
 } from "react-native";
-import { useEffect, useState } from "react";
+
+import { FilterChips, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import {
-  listUsers,
-  updateUser,
-  deleteUser,
-  AdminUser,
-  UpdateUserPatch,
-} from "@/services/admin";
-import UserRow from "@/components/admin/UserRow";
-import FilterChips from "@/components/admin/FilterChips";
+import { deleteUser, listUsers, updateUser } from "@/services/admin";
+import type { AdminUser, UpdateUserPatch } from "@/services/admin";
 
-type FilterKey = "svi" | "aktivni" | "admini";
+type UserFilter = "svi" | "aktivni" | "admini";
+type UserRole = AdminUser["role"];
 
+const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
+  { key: "svi", label: "Svi" },
+  { key: "aktivni", label: "Aktivni" },
+  { key: "admini", label: "Admini" },
+];
+
+const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
+  { key: "user", label: "Član" },
+  { key: "admin", label: "Admin" },
+];
+
 export default function KorisniciScreen() {
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
+  const [hasError, setHasError] = useState(false);
+  const [search, setSearch] = useState("");
+  const [filter, setFilter] = useState<UserFilter>("svi");
   const [expandedId, setExpandedId] = useState<string | null>(null);
-  const [searchText, setSearchText] = useState("");
-  const [filter, setFilter] = useState<FilterKey>("svi");
   const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
-  const [editModal, setEditModal] = useState(false);
-  const [editForm, setEditForm] = useState({
-    first_name: "",
-    last_name: "",
-    role: "user" as "user" | "admin",
-    max_sessions_per_week: 0,
-  });
+  const [firstName, setFirstName] = useState("");
+  const [lastName, setLastName] = useState("");
+  const [role, setRole] = useState<UserRole>("user");
+  const [maxSessions, setMaxSessions] = useState(0);
   const [saving, setSaving] = useState(false);
 
-  // Load users on mount
-  useEffect(() => {
-    fetchUsers();
-  }, []);
+  const fetchUsers = useCallback(async () => {
+    setLoading(true);
+    setHasError(false);
 
-  const fetchUsers = async () => {
-    setLoading(true);
-    setError(null);
     try {
-      const data = await listUsers();
-      setUsers(data);
-    } catch (err) {
-      setError("Greška pri učitavanju");
-      if (__DEV__) console.error(err);
+      setUsers(await listUsers());
+    } catch (error: unknown) {
+      console.error(error);
+      setHasError(true);
     } finally {
       setLoading(false);
     }
-  };
+  }, []);
 
-  // Filter logic
-  const filteredUsers = users
-    .filter((u) => {
-      const searchLower = searchText.toLowerCase();
-      const matchesSearch =
-        u.first_name.toLowerCase().includes(searchLower) ||
-        (u.last_name?.toLowerCase().includes(searchLower) ?? false) ||
-        u.email.toLowerCase().includes(searchLower);
+  useEffect(() => {
+    void fetchUsers();
+  }, [fetchUsers]);
 
-      if (!matchesSearch) return false;
+  const filteredUsers = useMemo(() => {
+    const query = search.trim().toLocaleLowerCase();
+
+    return users.filter((user) => {
+      const matchesFilter =
+        filter === "svi" ||
+        (filter === "aktivni" && user.enabled !== false) ||
+        (filter === "admini" && user.role === "admin");
+      const searchable = `${user.first_name} ${user.last_name ?? ""} ${user.email}`
+        .toLocaleLowerCase();
 
-      if (filter === "aktivni") return u.enabled !== false;
-      if (filter === "admini") return u.role === "admin";
-      return true;
+      return matchesFilter && searchable.includes(query);
     });
+  }, [filter, search, users]);
 
-  // Edit modal handlers
-  const onEdit = (user: AdminUser) => {
+  const openEditModal = (user: AdminUser) => {
     setEditingUser(user);
-    setEditForm({
-      first_name: user.first_name,
-      last_name: user.last_name || "",
-      role: user.role,
-      max_sessions_per_week: user.max_sessions_per_week,
-    });
-    setEditModal(true);
+    setFirstName(user.first_name);
+    setLastName(user.last_name ?? "");
+    setRole(user.role);
+    setMaxSessions(user.max_sessions_per_week);
   };
 
-  const onRemove = (user: AdminUser) => {
-    Alert.alert(
-      "Ukloni korisnika",
-      `${user.first_name} ${user.last_name || ""} i sve njegove rezervacije će biti uklonjeni.`,
-      [
-        { text: "Otkaži", style: "cancel" },
-        {
-          text: "Ukloni",
-          onPress: async () => {
-            try {
-              await deleteUser(user.id);
-              await fetchUsers();
-            } catch (err) {
-              Alert.alert("Greška", "Nije moguće obrisati korisnika");
-              if (__DEV__) console.error(err);
-            }
-          },
-          style: "destructive",
-        },
-      ]
-    );
+  const closeEditModal = () => {
+    if (!saving) setEditingUser(null);
   };
 
-  const onSaveEdit = async () => {
+  const saveUser = async () => {
     if (!editingUser) return;
 
+    const patch: UpdateUserPatch = {
+      first_name: firstName.trim(),
+      last_name: lastName.trim(),
+      role,
+      max_sessions_per_week: maxSessions,
+    };
+
     setSaving(true);
     try {
-      const patch: UpdateUserPatch = {
-        first_name: editForm.first_name || null,
-        last_name: editForm.last_name || null,
-        role: editForm.role,
-        max_sessions_per_week: editForm.max_sessions_per_week,
-      };
       await updateUser(editingUser.id, patch);
-      setEditModal(false);
       setEditingUser(null);
       await fetchUsers();
-    } catch (err) {
-      Alert.alert("Greška", "Nije moguće sačuvati promene");
-      if (__DEV__) console.error(err);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
+      await fetchUsers();
     } finally {
       setSaving(false);
     }
   };
 
-  if (loading) {
+  const removeUser = async (user: AdminUser) => {
+    try {
+      await deleteUser(user.id);
+      setExpandedId(null);
+      await fetchUsers();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Korisnik nije uklonjen.");
+      await fetchUsers();
+    }
+  };
+
+  const confirmRemove = (user: AdminUser) => {
+    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();
+
+    Alert.alert(
+      "Ukloni korisnika",
+      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
+      [
+        { text: "Otkaži", style: "cancel" },
+        {
+          text: "Ukloni",
+          style: "destructive",
+          onPress: () => void removeUser(user),
+        },
+      ],
+    );
+  };
+
+  if (loading && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <ActivityIndicator size="large" color={Colors.burgundy} />
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
       </View>
     );
   }
 
-  if (error) {
+  if (hasError && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <Text style={styles.errorText}>{error}</Text>
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
       </View>
     );
   }
 
   return (
-    <View style={styles.screen}>
-      {/* Header */}
-      <View style={styles.header}>
-        <Text style={styles.headerTitle}>Korisnici</Text>
-        <Text style={styles.headerSubtitle}>{users.length} članova</Text>
-      </View>
-
-      {/* Search */}
-      <TextInput
-        style={styles.searchInput}
-        placeholder="Pretraži članove…"
-        placeholderTextColor={Colors.inkMuted}
-        value={searchText}
-        onChangeText={setSearchText}
-      />
-
-      {/* Filter chips */}
-      <View style={styles.filterContainer}>
-        <FilterChips<FilterKey>
-          options={[
-            { key: "svi", label: "Svi" },
-            { key: "aktivni", label: "Aktivni" },
-            { key: "admini", label: "Admini" },
-          ]}
-          value={filter}
-          onChange={setFilter}
-        />
-      </View>
-
-      {/* User list */}
+    <>
       <FlatList
+        style={styles.screen}
+        contentContainerStyle={styles.content}
         data={filteredUsers}
-        keyExtractor={(u) => u.id}
+        keyExtractor={(user) => user.id}
+        showsVerticalScrollIndicator={false}
+        ItemSeparatorComponent={() => <View style={styles.listGap} />}
+        ListHeaderComponent={
+          <View style={styles.headerContent}>
+            <View>
+              <Text style={styles.title}>Korisnici</Text>
+              <Text style={styles.subtitle}>{users.length} članova</Text>
+            </View>
+            <TextInput
+              value={search}
+              onChangeText={setSearch}
+              placeholder="Pretraži članove…"
+              placeholderTextColor={Colors.inkFaint}
+              style={styles.searchInput}
+              autoCapitalize="none"
+              autoCorrect={false}
+            />
+            <FilterChips
+              options={FILTER_OPTIONS}
+              value={filter}
+              onChange={setFilter}
+            />
+          </View>
+        }
         renderItem={({ item, index }) => (
           <UserRow
             user={item}
             expanded={expandedId === item.id}
             onToggleExpand={() =>
-              setExpandedId(expandedId === item.id ? null : item.id)
+              setExpandedId((current) => (current === item.id ? null : item.id))
             }
-            onEdit={() => onEdit(item)}
-            onRemove={() => onRemove(item)}
+            onEdit={() => openEditModal(item)}
+            onRemove={() => confirmRemove(item)}
             tintIndex={index % 3}
           />
         )}
-        contentContainerStyle={styles.listContent}
-        scrollEnabled={false}
       />
 
-      {/* Edit Modal */}
       <Modal
         animationType="slide"
         transparent
-        visible={editModal}
-        onRequestClose={() => setEditModal(false)}
+        visible={editingUser !== null}
+        onRequestClose={closeEditModal}
       >
         <View style={styles.modalOverlay}>
-          <KeyboardAvoidingView behavior="padding" style={styles.modal}>
-            <ScrollView
-              contentContainerStyle={styles.modalContent}
-              keyboardShouldPersistTaps="handled"
-            >
-              <Text style={styles.modalTitle}>Izmena korisnika</Text>
+          <View style={styles.modalCard}>
+            <Text style={styles.modalTitle}>Izmena korisnika</Text>
 
-              {/* first_name */}
-              <Text style={styles.label}>IME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>IME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.first_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, first_name: v }))
-                }
+                value={firstName}
+                onChangeText={setFirstName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* last_name */}
-              <Text style={styles.label}>PREZIME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>PREZIME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.last_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, last_name: v }))
-                }
+                value={lastName}
+                onChangeText={setLastName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* role */}
-              <Text style={styles.label}>ULOGA</Text>
-              <FilterChips<"user" | "admin">
-                options={[
-                  { key: "user", label: "Član" },
-                  { key: "admin", label: "Admin" },
-                ]}
-                value={editForm.role}
-                onChange={(v) => setEditForm((p) => ({ ...p, role: v }))}
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>ULOGA</Text>
+              <FilterChips
+                options={ROLE_OPTIONS}
+                value={role}
+                onChange={setRole}
               />
+            </View>
 
-              {/* max_sessions_per_week stepper */}
-              <Text style={styles.label}>NEDELJNI LIMIT</Text>
-              <View style={styles.stepperContainer}>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
+              <View style={styles.stepper}>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.max(
-                        0,
-                        p.max_sessions_per_week - 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 0}
+                  onPress={() => setMaxSessions((value) => Math.max(0, value - 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>−</Text>
+                  <Text style={styles.stepButtonText}>−</Text>
                 </Pressable>
-                <Text style={styles.stepperValue}>
-                  {editForm.max_sessions_per_week}
-                </Text>
+                <Text style={styles.stepValue}>{maxSessions}</Text>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.min(
-                        14,
-                        p.max_sessions_per_week + 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 14}
+                  onPress={() => setMaxSessions((value) => Math.min(14, value + 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>+</Text>
+                  <Text style={styles.stepButtonText}>＋</Text>
                 </Pressable>
               </View>
+            </View>
 
-              {/* Footer actions */}
-              <View style={styles.modalFooter}>
-                <Pressable
-                  onPress={() => setEditModal(false)}
-                  style={styles.cancelBtn}
-                  disabled={saving}
-                >
-                  <Text style={styles.cancelBtnText}>Otkaži</Text>
-                </Pressable>
-                <Pressable
-                  onPress={onSaveEdit}
-                  style={[
-                    styles.saveBtn,
-                    saving && styles.saveBtnDisabled,
-                  ]}
-                  disabled={saving}
-                >
-                  {saving ? (
-                    <ActivityIndicator size="small" color={Colors.surface} />
-                  ) : (
-                    <Text style={styles.saveBtnText}>Sačuvaj</Text>
-                  )}
-                </Pressable>
-              </View>
-            </ScrollView>
-          </KeyboardAvoidingView>
+            <View style={styles.modalFooter}>
+              <Pressable
+                onPress={closeEditModal}
+                disabled={saving}
+                style={styles.cancelButton}
+              >
+                <Text style={styles.cancelButtonText}>Otkaži</Text>
+              </Pressable>
+              <Pressable
+                onPress={() => void saveUser()}
+                disabled={saving}
+                style={[styles.saveButton, saving && styles.buttonDisabled]}
+              >
+                {saving ? (
+                  <ActivityIndicator color={Colors.surface} />
+                ) : (
+                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
+                )}
+              </Pressable>
+            </View>
+          </View>
         </View>
       </Modal>
-    </View>
+    </>
   );
 }
 
@@ -321,33 +298,37 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    paddingHorizontal: Spacing.screenHorizontal || 20,
   },
-  centerContainer: {
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  centeredState: {
     flex: 1,
+    alignItems: "center",
     justifyContent: "center",
-    alignItems: "center",
     backgroundColor: Colors.paper,
   },
   errorText: {
-    ...Typography.section,
+    ...Typography.body,
     color: Colors.inkMuted,
   },
-  header: {
-    paddingTop: 20,
-    paddingBottom: 16,
+  headerContent: {
+    gap: 16,
+    marginBottom: 16,
   },
-  headerTitle: {
-    fontFamily: FontFamilies.bricolage[800],
+  title: {
+    ...Typography.screenTitle,
     fontSize: 23,
-    fontWeight: "800",
     color: Colors.ink,
   },
-  headerSubtitle: {
+  subtitle: {
     fontFamily: FontFamilies.hanken[600],
     fontSize: 13,
     fontWeight: "600",
     color: Colors.inkMuted,
+    marginTop: 3,
   },
   searchInput: {
     backgroundColor: Colors.surface,
@@ -360,122 +341,114 @@
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
-    marginBottom: 16,
-  },
-  filterContainer: {
-    marginBottom: 16,
   },
-  listContent: {
-    gap: 12,
-    paddingBottom: 20,
+  listGap: {
+    height: 10,
   },
-  // Modal
   modalOverlay: {
     flex: 1,
-    backgroundColor: "rgba(0, 0, 0, 0.5)",
     justifyContent: "flex-end",
+    backgroundColor: "rgba(34, 31, 43, 0.35)",
   },
-  modal: {
-    flex: 1,
-    maxHeight: "90%",
-    backgroundColor: Colors.paper,
-    borderTopLeftRadius: Radii.tile[24],
-    borderTopRightRadius: Radii.tile[24],
-  },
-  modalContent: {
-    padding: Spacing.cardPadding || 20,
+  modalCard: {
+    backgroundColor: Colors.surface,
+    borderTopLeftRadius: Radii.card,
+    borderTopRightRadius: Radii.card,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 24,
+    paddingBottom: 28,
     gap: 16,
+    ...Shadows.card,
   },
   modalTitle: {
     fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
+    fontSize: 21,
     fontWeight: "800",
     color: Colors.ink,
-    marginBottom: 8,
   },
-  label: {
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldLabel: {
     fontFamily: FontFamilies.hanken[700],
-    fontSize: 11,
+    fontSize: 10,
     fontWeight: "700",
     letterSpacing: 1,
-    textTransform: "uppercase",
-    color: Colors.ink,
+    color: Colors.inkMuted,
   },
-  input: {
+  fieldInput: {
     backgroundColor: Colors.surface,
     borderColor: Colors.fieldBorder,
     borderWidth: 1,
     borderRadius: Radii.tile[14],
     paddingHorizontal: 12,
-    paddingVertical: 12,
+    paddingVertical: 11,
     fontFamily: FontFamilies.hanken[600],
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
   },
-  stepperContainer: {
+  stepper: {
+    alignSelf: "flex-start",
     flexDirection: "row",
     alignItems: "center",
-    gap: 12,
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
   },
-  stepperBtn: {
-    width: 40,
-    height: 40,
-    borderRadius: Radii.tile[12],
-    backgroundColor: Colors.surfaceMuted,
-    justifyContent: "center",
+  stepButton: {
+    width: 44,
+    height: 42,
     alignItems: "center",
+    justifyContent: "center",
   },
-  stepperBtnText: {
-    fontFamily: FontFamilies.hanken[800],
-    fontSize: 18,
-    fontWeight: "800",
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 20,
+    fontWeight: "700",
     color: Colors.burgundy,
   },
-  stepperValue: {
-    flex: 1,
+  stepValue: {
+    minWidth: 44,
     textAlign: "center",
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 16,
-    fontWeight: "800",
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
   modalFooter: {
     flexDirection: "row",
-    gap: 12,
-    marginTop: 16,
+    gap: 10,
+    marginTop: 4,
   },
-  cancelBtn: {
+  cancelButton: {
     flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
-    borderColor: Colors.burgundyBorder,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderColor: Colors.burgundy,
     borderWidth: 1,
-    justifyContent: "center",
-    alignItems: "center",
+    borderRadius: Radii.tile[14],
   },
-  cancelBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
+  cancelButtonText: {
+    ...Typography.primaryButtonCompact,
     color: Colors.burgundy,
   },
-  saveBtn: {
-    flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
+  saveButton: {
+    flex: 2,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderRadius: Radii.tile[14],
     backgroundColor: Colors.burgundy,
-    justifyContent: "center",
-    alignItems: "center",
-    ...Shadows.primaryButton,
   },
-  saveBtnDisabled: {
+  saveButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
     opacity: 0.6,
-  },
-  saveBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
-    color: Colors.surface,
   },
 });
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 5ff9c08c6c36ad11d37ae2b56f1e48e9638ab6e3..bbbd205d1bb0aac98ed8f85b00eb8fe3c290ebe5
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -1,11 +1,268 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
+} from "react-native";
+import { useLocalSearchParams, useRouter } from "expo-router";
+
+import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { upsertSession } from "@/services/admin";
+import type { UpsertSessionInput } from "@/services/admin";
 
+const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map(
+  (day) => ({
+    key: day,
+    label: {
+      monday: "PON",
+      tuesday: "UTO",
+      wednesday: "SRE",
+      thursday: "ČET",
+      friday: "PET",
+      saturday: "SUB",
+      sunday: "NED",
+    }[day],
+  }),
+);
+
 export default function TrainingDetailScreen() {
+  const router = useRouter();
+  const { id } = useLocalSearchParams<{ id: string }>();
+  const isNew = id === "new";
+  const { trainings, loading, fetchTrainings } = useTrainings();
+  const training = trainings.find((item) => item.id === id);
+  const [title, setTitle] = useState("");
+  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
+  const [time, setTime] = useState("");
+  const [room, setRoom] = useState("");
+  const [durationMin, setDurationMin] = useState<number | null>(null);
+  const [maxParticipants, setMaxParticipants] = useState(10);
+  const [isOpen, setIsOpen] = useState(true);
+  const [submitting, setSubmitting] = useState(false);
+  const [initializedId, setInitializedId] = useState<string | null>(null);
+
+  useEffect(() => {
+    if (!training || initializedId === training.id) return;
+
+    setTitle(training.title);
+    setDayOfWeek(
+      TRAINING_DAYS.includes(training.day_of_week as Day)
+        ? (training.day_of_week as Day)
+        : "monday",
+    );
+    setTime(training.time);
+    setRoom(training.room ?? "");
+    setDurationMin(training.duration_min);
+    setMaxParticipants(training.max_participants);
+    setIsOpen(training.is_open);
+    setInitializedId(training.id);
+  }, [initializedId, training]);
+
+  const submit = async () => {
+    const normalizedTitle = title.trim();
+    const normalizedTime = time.trim();
+
+    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+      Alert.alert(
+        "Proverite podatke",
+        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
+      );
+      return;
+    }
+
+    const input: UpsertSessionInput = {
+      id: isNew ? null : id,
+      title: normalizedTitle,
+      day_of_week: dayOfWeek,
+      time: normalizedTime,
+      room: room.trim() || null,
+      duration_min: durationMin,
+      max_participants: maxParticipants,
+      is_open: isOpen,
+    };
+
+    setSubmitting(true);
+    try {
+      await upsertSession(input);
+      await fetchTrainings();
+      router.back();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Trening nije sačuvan.");
+      await fetchTrainings();
+    } finally {
+      setSubmitting(false);
+    }
+  };
+
+  if (!isNew && loading && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (!isNew && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
+        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
+          <Text style={styles.notFoundButtonText}>Nazad</Text>
+        </Pressable>
+      </View>
+    );
+  }
+
   return (
     <View style={styles.screen}>
-      <Text style={styles.title}>Training Detail</Text>
+      <View style={styles.navBar}>
+        <Pressable
+          accessibilityRole="button"
+          onPress={() => router.back()}
+          style={styles.backButton}
+        >
+          <Text style={styles.backChevron}>‹</Text>
+        </Pressable>
+        <Text style={styles.navTitle}>
+          {isNew ? "Novi trening" : "Izmena treninga"}
+        </Text>
+        <View style={styles.navSpacer} />
+      </View>
+
+      <ScrollView
+        style={styles.formScroll}
+        contentContainerStyle={styles.formContent}
+        keyboardShouldPersistTaps="handled"
+        showsVerticalScrollIndicator={false}
+      >
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
+          <TextInput
+            value={title}
+            onChangeText={setTitle}
+            editable={!submitting}
+            style={styles.input}
+          />
+        </View>
+
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>DAN</Text>
+          <FilterChips
+            options={DAY_OPTIONS}
+            value={dayOfWeek}
+            onChange={setDayOfWeek}
+          />
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>VREME</Text>
+            <TextInput
+              value={time}
+              onChangeText={setTime}
+              placeholder="18:00"
+              placeholderTextColor={Colors.inkFaint}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
+            <TextInput
+              value={durationMin?.toString() ?? ""}
+              onChangeText={(value) =>
+                setDurationMin(value === "" ? null : Number(value.replace(/\D/g, "")))
+              }
+              keyboardType="number-pad"
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>SALA</Text>
+            <TextInput
+              value={room}
+              onChangeText={setRoom}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
+            <View style={styles.stepper}>
+              <Pressable
+                disabled={submitting || maxParticipants === 1}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.max(1, value - 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>−</Text>
+              </Pressable>
+              <Text style={styles.stepValue}>{maxParticipants}</Text>
+              <Pressable
+                disabled={submitting || maxParticipants === 50}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.min(50, value + 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>＋</Text>
+              </Pressable>
+            </View>
+          </View>
+        </View>
+
+        <View style={styles.statusCard}>
+          <View style={styles.statusTextBlock}>
+            <Text style={styles.statusTitle}>Status slota</Text>
+            <Text style={styles.statusDescription}>
+              Otvoren za prijave članova
+            </Text>
+          </View>
+          <Toggle
+            value={isOpen}
+            onValueChange={setIsOpen}
+            disabled={submitting}
+          />
+        </View>
+
+        <View style={styles.footer}>
+          <Pressable
+            onPress={() => router.back()}
+            disabled={submitting}
+            style={styles.cancelButton}
+          >
+            <Text style={styles.cancelButtonText}>Otkaži</Text>
+          </Pressable>
+          <Pressable
+            onPress={() => void submit()}
+            disabled={submitting}
+            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+          >
+            {submitting ? (
+              <ActivityIndicator color={Colors.surface} />
+            ) : (
+              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
+            )}
+          </Pressable>
+        </View>
+      </ScrollView>
     </View>
   );
 }
@@ -14,11 +271,194 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
+  },
+  centeredState: {
+    flex: 1,
+    alignItems: "center",
     justifyContent: "center",
+    gap: 16,
+    backgroundColor: Colors.paper,
+  },
+  notFoundText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
+  notFoundButton: {
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    paddingHorizontal: 18,
+    paddingVertical: 10,
+  },
+  notFoundButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.burgundy,
+  },
+  navBar: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 16,
+    paddingBottom: 12,
+    borderBottomColor: Colors.border,
+    borderBottomWidth: 1,
+  },
+  backButton: {
+    width: 38,
+    height: 38,
     alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    backgroundColor: Colors.surface,
+  },
+  backChevron: {
+    fontFamily: FontFamilies.hanken[500],
+    fontSize: 31,
+    fontWeight: "500",
+    lineHeight: 32,
+    color: Colors.burgundy,
   },
-  title: {
-    ...Typography.screenTitle,
+  navTitle: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 19,
+    fontWeight: "800",
     color: Colors.ink,
   },
+  navSpacer: {
+    width: 38,
+    height: 38,
+  },
+  formScroll: {
+    flex: 1,
+  },
+  formContent: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 22,
+    paddingBottom: 28,
+    gap: 20,
+  },
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  columnField: {
+    flex: 1,
+    gap: 7,
+  },
+  fieldLabel: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    letterSpacing: 1,
+    color: Colors.inkMuted,
+  },
+  input: {
+    minHeight: 46,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    paddingHorizontal: 12,
+    paddingVertical: 11,
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 14,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  stepper: {
+    minHeight: 46,
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
+  },
+  stepButton: {
+    width: 38,
+    height: 44,
+    alignItems: "center",
+    justifyContent: "center",
+  },
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 19,
+    fontWeight: "700",
+    color: Colors.burgundy,
+  },
+  stepValue: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusCard: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    gap: 16,
+    borderColor: Colors.goldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[16],
+    backgroundColor: Colors.surfaceWarm,
+    padding: Spacing.cardPadding,
+  },
+  statusTextBlock: {
+    flex: 1,
+    gap: 3,
+  },
+  statusTitle: {
+    fontFamily: FontFamilies.bricolage[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusDescription: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 12,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
+  footer: {
+    flexDirection: "row",
+    gap: 10,
+    marginTop: 4,
+  },
+  cancelButton: {
+    flex: 1,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+  },
+  cancelButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.burgundy,
+  },
+  saveButton: {
+    flex: 2,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.burgundy,
+    ...Shadows.primaryButton,
+  },
+  saveButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
+    opacity: 0.6,
+  },
 });

 exited 1 in 305ms:
Checking formatting...
[warn] app/(admin)/(tabs)/users.tsx
[warn] app/(admin)/(tabs)/sessions.tsx
[warn] app/(admin)/training/[id].tsx
[warn] Code style issues found in 3 files. Run Prettier with --write to fix.

exec
/bin/zsh -lc "npx prettier --write 'app/(admin)/(tabs)/users.tsx' 'app/(admin)/(tabs)/sessions.tsx' 'app/(admin)/training/[id].tsx' && npx tsc --noEmit && npx eslint 'app/(admin)' src/components/admin" in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/(tabs)/sessions.tsx b/app/(admin)/(tabs)/sessions.tsx
index b37d42eee582cfcbbfbaba8b37d423440c0794ae..df22d2c62a54e17bd6bdbca98213ae4760f430de
--- a/app/(admin)/(tabs)/sessions.tsx
+++ b/app/(admin)/(tabs)/sessions.tsx
@@ -1,12 +1,155 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  FlatList,
+  Pressable,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import { SessionRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { setSessionOpen } from "@/services/admin";
+import { getCurrentWeekDates } from "@/utils/week";
+
+const DAY_LABELS: Record<Day, string> = {
+  sunday: "NED",
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+};
+
+const DAY_NAMES: Record<Day, string> = {
+  sunday: "NEDELJA",
+  monday: "PONEDELJAK",
+  tuesday: "UTORAK",
+  wednesday: "SREDA",
+  thursday: "ČETVRTAK",
+  friday: "PETAK",
+  saturday: "SUBOTA",
+};
+
+const MONTH_NAMES = [
+  "JAN",
+  "FEB",
+  "MAR",
+  "APR",
+  "MAJ",
+  "JUN",
+  "JUL",
+  "AVG",
+  "SEP",
+  "OKT",
+  "NOV",
+  "DEC",
+] as const;
 
 export default function TreninziScreen() {
+  const router = useRouter();
+  const [selectedDay, setSelectedDay] = useState<Day>("monday");
+  const { loading, fetchTrainings, getTrainingsByDay } = useTrainings();
+  const sessions = getTrainingsByDay(selectedDay);
+  const selectedDate = getCurrentWeekDates()[selectedDay];
+  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;
+
+  const toggleSession = async (sessionId: string, open: boolean) => {
+    try {
+      await setSessionOpen(sessionId, open);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Status treninga nije promenjen.");
+    } finally {
+      await fetchTrainings();
+    }
+  };
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Treninzi</Text>
-    </View>
+    <FlatList
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      data={sessions}
+      keyExtractor={(session) => session.id}
+      showsVerticalScrollIndicator={false}
+      ItemSeparatorComponent={() => <View style={styles.listGap} />}
+      ListHeaderComponent={
+        <View style={styles.headerContent}>
+          <View style={styles.titleRow}>
+            <View style={styles.titleBlock}>
+              <Text style={styles.title}>Treninzi</Text>
+              <Text style={styles.subtitle}>
+                {DAY_NAMES[selectedDay]} · {dateLabel}
+              </Text>
+            </View>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/(admin)/training/new")}
+              style={({ pressed }) => [
+                styles.newButton,
+                pressed && styles.buttonPressed,
+              ]}
+            >
+              <Text style={styles.newButtonText}>＋ Novi</Text>
+            </Pressable>
+          </View>
+
+          <View style={styles.daySelector}>
+            {TRAINING_DAYS.map((day) => {
+              const active = selectedDay === day;
+              return (
+                <Pressable
+                  key={day}
+                  onPress={() => setSelectedDay(day)}
+                  style={[
+                    styles.dayChip,
+                    active && styles.dayChipActive,
+                  ]}
+                >
+                  <Text
+                    style={[
+                      styles.dayChipText,
+                      active && styles.dayChipTextActive,
+                    ]}
+                  >
+                    {DAY_LABELS[day]}
+                  </Text>
+                </Pressable>
+              );
+            })}
+          </View>
+
+          {loading && (
+            <ActivityIndicator
+              color={Colors.burgundy}
+              style={styles.loadingIndicator}
+            />
+          )}
+        </View>
+      }
+      ListEmptyComponent={
+        loading ? null : (
+          <Text style={styles.emptyText}>Nema termina za ovaj dan.</Text>
+        )
+      }
+      renderItem={({ item }) => (
+        <SessionRow
+          session={item}
+          bookedCount={item.session_participants.length}
+          onToggleOpen={(open) => void toggleSession(item.id, open)}
+          onPress={() => router.push(`/(admin)/training/${item.id}`)}
+        />
+      )}
+    />
   );
 }
 
@@ -14,11 +157,95 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    flexGrow: 1,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  headerContent: {
+    gap: 18,
+    marginBottom: 16,
+  },
+  titleRow: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 12,
   },
+  titleBlock: {
+    flex: 1,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
     color: Colors.ink,
   },
+  subtitle: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  newButton: {
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.burgundy,
+    paddingHorizontal: 14,
+    paddingVertical: 9,
+    ...Shadows.primaryButton,
+  },
+  newButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 13,
+    fontWeight: "700",
+    color: Colors.surface,
+  },
+  buttonPressed: {
+    opacity: 0.85,
+  },
+  daySelector: {
+    flexDirection: "row",
+    justifyContent: "space-between",
+    gap: 5,
+  },
+  dayChip: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 36,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.surface,
+  },
+  dayChipActive: {
+    borderColor: Colors.burgundy,
+    backgroundColor: Colors.burgundy,
+    ...Shadows.activeDay,
+  },
+  dayChipText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  dayChipTextActive: {
+    color: Colors.surface,
+  },
+  loadingIndicator: {
+    marginTop: 10,
+  },
+  listGap: {
+    height: 10,
+  },
+  emptyText: {
+    marginTop: 48,
+    textAlign: "center",
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
 });
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 8af74755eb930ef1aea5ab7c7c6df27230debb82..d750a54b7f9ba61a558953849e34bda2533339a1
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -1,319 +1,296 @@
+import { useCallback, useEffect, useMemo, useState } from "react";
 import {
-  View,
-  Text,
-  StyleSheet,
+  ActivityIndicator,
+  Alert,
   FlatList,
-  TextInput,
   Modal,
-  Alert,
-  ActivityIndicator,
   Pressable,
-  ScrollView,
-  KeyboardAvoidingView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
 } from "react-native";
-import { useEffect, useState } from "react";
+
+import { FilterChips, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import {
-  listUsers,
-  updateUser,
-  deleteUser,
-  AdminUser,
-  UpdateUserPatch,
-} from "@/services/admin";
-import UserRow from "@/components/admin/UserRow";
-import FilterChips from "@/components/admin/FilterChips";
+import { deleteUser, listUsers, updateUser } from "@/services/admin";
+import type { AdminUser, UpdateUserPatch } from "@/services/admin";
 
-type FilterKey = "svi" | "aktivni" | "admini";
+type UserFilter = "svi" | "aktivni" | "admini";
+type UserRole = AdminUser["role"];
 
+const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
+  { key: "svi", label: "Svi" },
+  { key: "aktivni", label: "Aktivni" },
+  { key: "admini", label: "Admini" },
+];
+
+const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
+  { key: "user", label: "Član" },
+  { key: "admin", label: "Admin" },
+];
+
 export default function KorisniciScreen() {
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
+  const [hasError, setHasError] = useState(false);
+  const [search, setSearch] = useState("");
+  const [filter, setFilter] = useState<UserFilter>("svi");
   const [expandedId, setExpandedId] = useState<string | null>(null);
-  const [searchText, setSearchText] = useState("");
-  const [filter, setFilter] = useState<FilterKey>("svi");
   const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
-  const [editModal, setEditModal] = useState(false);
-  const [editForm, setEditForm] = useState({
-    first_name: "",
-    last_name: "",
-    role: "user" as "user" | "admin",
-    max_sessions_per_week: 0,
-  });
+  const [firstName, setFirstName] = useState("");
+  const [lastName, setLastName] = useState("");
+  const [role, setRole] = useState<UserRole>("user");
+  const [maxSessions, setMaxSessions] = useState(0);
   const [saving, setSaving] = useState(false);
 
-  // Load users on mount
-  useEffect(() => {
-    fetchUsers();
-  }, []);
+  const fetchUsers = useCallback(async () => {
+    setLoading(true);
+    setHasError(false);
 
-  const fetchUsers = async () => {
-    setLoading(true);
-    setError(null);
     try {
-      const data = await listUsers();
-      setUsers(data);
-    } catch (err) {
-      setError("Greška pri učitavanju");
-      if (__DEV__) console.error(err);
+      setUsers(await listUsers());
+    } catch (error: unknown) {
+      console.error(error);
+      setHasError(true);
     } finally {
       setLoading(false);
     }
-  };
+  }, []);
 
-  // Filter logic
-  const filteredUsers = users
-    .filter((u) => {
-      const searchLower = searchText.toLowerCase();
-      const matchesSearch =
-        u.first_name.toLowerCase().includes(searchLower) ||
-        (u.last_name?.toLowerCase().includes(searchLower) ?? false) ||
-        u.email.toLowerCase().includes(searchLower);
+  useEffect(() => {
+    void fetchUsers();
+  }, [fetchUsers]);
 
-      if (!matchesSearch) return false;
+  const filteredUsers = useMemo(() => {
+    const query = search.trim().toLocaleLowerCase();
+
+    return users.filter((user) => {
+      const matchesFilter =
+        filter === "svi" ||
+        (filter === "aktivni" && user.enabled !== false) ||
+        (filter === "admini" && user.role === "admin");
+      const searchable = `${user.first_name} ${user.last_name ?? ""} ${user.email}`
+        .toLocaleLowerCase();
 
-      if (filter === "aktivni") return u.enabled !== false;
-      if (filter === "admini") return u.role === "admin";
-      return true;
+      return matchesFilter && searchable.includes(query);
     });
+  }, [filter, search, users]);
 
-  // Edit modal handlers
-  const onEdit = (user: AdminUser) => {
+  const openEditModal = (user: AdminUser) => {
     setEditingUser(user);
-    setEditForm({
-      first_name: user.first_name,
-      last_name: user.last_name || "",
-      role: user.role,
-      max_sessions_per_week: user.max_sessions_per_week,
-    });
-    setEditModal(true);
+    setFirstName(user.first_name);
+    setLastName(user.last_name ?? "");
+    setRole(user.role);
+    setMaxSessions(user.max_sessions_per_week);
   };
 
-  const onRemove = (user: AdminUser) => {
-    Alert.alert(
-      "Ukloni korisnika",
-      `${user.first_name} ${user.last_name || ""} i sve njegove rezervacije će biti uklonjeni.`,
-      [
-        { text: "Otkaži", style: "cancel" },
-        {
-          text: "Ukloni",
-          onPress: async () => {
-            try {
-              await deleteUser(user.id);
-              await fetchUsers();
-            } catch (err) {
-              Alert.alert("Greška", "Nije moguće obrisati korisnika");
-              if (__DEV__) console.error(err);
-            }
-          },
-          style: "destructive",
-        },
-      ]
-    );
+  const closeEditModal = () => {
+    if (!saving) setEditingUser(null);
   };
 
-  const onSaveEdit = async () => {
+  const saveUser = async () => {
     if (!editingUser) return;
 
+    const patch: UpdateUserPatch = {
+      first_name: firstName.trim(),
+      last_name: lastName.trim(),
+      role,
+      max_sessions_per_week: maxSessions,
+    };
+
     setSaving(true);
     try {
-      const patch: UpdateUserPatch = {
-        first_name: editForm.first_name || null,
-        last_name: editForm.last_name || null,
-        role: editForm.role,
-        max_sessions_per_week: editForm.max_sessions_per_week,
-      };
       await updateUser(editingUser.id, patch);
-      setEditModal(false);
       setEditingUser(null);
       await fetchUsers();
-    } catch (err) {
-      Alert.alert("Greška", "Nije moguće sačuvati promene");
-      if (__DEV__) console.error(err);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
+      await fetchUsers();
     } finally {
       setSaving(false);
     }
   };
 
-  if (loading) {
+  const removeUser = async (user: AdminUser) => {
+    try {
+      await deleteUser(user.id);
+      setExpandedId(null);
+      await fetchUsers();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Korisnik nije uklonjen.");
+      await fetchUsers();
+    }
+  };
+
+  const confirmRemove = (user: AdminUser) => {
+    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();
+
+    Alert.alert(
+      "Ukloni korisnika",
+      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
+      [
+        { text: "Otkaži", style: "cancel" },
+        {
+          text: "Ukloni",
+          style: "destructive",
+          onPress: () => void removeUser(user),
+        },
+      ],
+    );
+  };
+
+  if (loading && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <ActivityIndicator size="large" color={Colors.burgundy} />
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
       </View>
     );
   }
 
-  if (error) {
+  if (hasError && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <Text style={styles.errorText}>{error}</Text>
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
       </View>
     );
   }
 
   return (
-    <View style={styles.screen}>
-      {/* Header */}
-      <View style={styles.header}>
-        <Text style={styles.headerTitle}>Korisnici</Text>
-        <Text style={styles.headerSubtitle}>{users.length} članova</Text>
-      </View>
-
-      {/* Search */}
-      <TextInput
-        style={styles.searchInput}
-        placeholder="Pretraži članove…"
-        placeholderTextColor={Colors.inkMuted}
-        value={searchText}
-        onChangeText={setSearchText}
-      />
-
-      {/* Filter chips */}
-      <View style={styles.filterContainer}>
-        <FilterChips<FilterKey>
-          options={[
-            { key: "svi", label: "Svi" },
-            { key: "aktivni", label: "Aktivni" },
-            { key: "admini", label: "Admini" },
-          ]}
-          value={filter}
-          onChange={setFilter}
-        />
-      </View>
-
-      {/* User list */}
+    <>
       <FlatList
+        style={styles.screen}
+        contentContainerStyle={styles.content}
         data={filteredUsers}
-        keyExtractor={(u) => u.id}
+        keyExtractor={(user) => user.id}
+        showsVerticalScrollIndicator={false}
+        ItemSeparatorComponent={() => <View style={styles.listGap} />}
+        ListHeaderComponent={
+          <View style={styles.headerContent}>
+            <View>
+              <Text style={styles.title}>Korisnici</Text>
+              <Text style={styles.subtitle}>{users.length} članova</Text>
+            </View>
+            <TextInput
+              value={search}
+              onChangeText={setSearch}
+              placeholder="Pretraži članove…"
+              placeholderTextColor={Colors.inkFaint}
+              style={styles.searchInput}
+              autoCapitalize="none"
+              autoCorrect={false}
+            />
+            <FilterChips
+              options={FILTER_OPTIONS}
+              value={filter}
+              onChange={setFilter}
+            />
+          </View>
+        }
         renderItem={({ item, index }) => (
           <UserRow
             user={item}
             expanded={expandedId === item.id}
             onToggleExpand={() =>
-              setExpandedId(expandedId === item.id ? null : item.id)
+              setExpandedId((current) => (current === item.id ? null : item.id))
             }
-            onEdit={() => onEdit(item)}
-            onRemove={() => onRemove(item)}
+            onEdit={() => openEditModal(item)}
+            onRemove={() => confirmRemove(item)}
             tintIndex={index % 3}
           />
         )}
-        contentContainerStyle={styles.listContent}
-        scrollEnabled={false}
       />
 
-      {/* Edit Modal */}
       <Modal
         animationType="slide"
         transparent
-        visible={editModal}
-        onRequestClose={() => setEditModal(false)}
+        visible={editingUser !== null}
+        onRequestClose={closeEditModal}
       >
         <View style={styles.modalOverlay}>
-          <KeyboardAvoidingView behavior="padding" style={styles.modal}>
-            <ScrollView
-              contentContainerStyle={styles.modalContent}
-              keyboardShouldPersistTaps="handled"
-            >
-              <Text style={styles.modalTitle}>Izmena korisnika</Text>
+          <View style={styles.modalCard}>
+            <Text style={styles.modalTitle}>Izmena korisnika</Text>
 
-              {/* first_name */}
-              <Text style={styles.label}>IME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>IME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.first_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, first_name: v }))
-                }
+                value={firstName}
+                onChangeText={setFirstName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* last_name */}
-              <Text style={styles.label}>PREZIME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>PREZIME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.last_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, last_name: v }))
-                }
+                value={lastName}
+                onChangeText={setLastName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* role */}
-              <Text style={styles.label}>ULOGA</Text>
-              <FilterChips<"user" | "admin">
-                options={[
-                  { key: "user", label: "Član" },
-                  { key: "admin", label: "Admin" },
-                ]}
-                value={editForm.role}
-                onChange={(v) => setEditForm((p) => ({ ...p, role: v }))}
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>ULOGA</Text>
+              <FilterChips
+                options={ROLE_OPTIONS}
+                value={role}
+                onChange={setRole}
               />
+            </View>
 
-              {/* max_sessions_per_week stepper */}
-              <Text style={styles.label}>NEDELJNI LIMIT</Text>
-              <View style={styles.stepperContainer}>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
+              <View style={styles.stepper}>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.max(
-                        0,
-                        p.max_sessions_per_week - 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 0}
+                  onPress={() => setMaxSessions((value) => Math.max(0, value - 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>−</Text>
+                  <Text style={styles.stepButtonText}>−</Text>
                 </Pressable>
-                <Text style={styles.stepperValue}>
-                  {editForm.max_sessions_per_week}
-                </Text>
+                <Text style={styles.stepValue}>{maxSessions}</Text>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.min(
-                        14,
-                        p.max_sessions_per_week + 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 14}
+                  onPress={() => setMaxSessions((value) => Math.min(14, value + 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>+</Text>
+                  <Text style={styles.stepButtonText}>＋</Text>
                 </Pressable>
               </View>
+            </View>
 
-              {/* Footer actions */}
-              <View style={styles.modalFooter}>
-                <Pressable
-                  onPress={() => setEditModal(false)}
-                  style={styles.cancelBtn}
-                  disabled={saving}
-                >
-                  <Text style={styles.cancelBtnText}>Otkaži</Text>
-                </Pressable>
-                <Pressable
-                  onPress={onSaveEdit}
-                  style={[
-                    styles.saveBtn,
-                    saving && styles.saveBtnDisabled,
-                  ]}
-                  disabled={saving}
-                >
-                  {saving ? (
-                    <ActivityIndicator size="small" color={Colors.surface} />
-                  ) : (
-                    <Text style={styles.saveBtnText}>Sačuvaj</Text>
-                  )}
-                </Pressable>
-              </View>
-            </ScrollView>
-          </KeyboardAvoidingView>
+            <View style={styles.modalFooter}>
+              <Pressable
+                onPress={closeEditModal}
+                disabled={saving}
+                style={styles.cancelButton}
+              >
+                <Text style={styles.cancelButtonText}>Otkaži</Text>
+              </Pressable>
+              <Pressable
+                onPress={() => void saveUser()}
+                disabled={saving}
+                style={[styles.saveButton, saving && styles.buttonDisabled]}
+              >
+                {saving ? (
+                  <ActivityIndicator color={Colors.surface} />
+                ) : (
+                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
+                )}
+              </Pressable>
+            </View>
+          </View>
         </View>
       </Modal>
-    </View>
+    </>
   );
 }
 
@@ -321,33 +298,37 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    paddingHorizontal: Spacing.screenHorizontal || 20,
   },
-  centerContainer: {
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  centeredState: {
     flex: 1,
+    alignItems: "center",
     justifyContent: "center",
-    alignItems: "center",
     backgroundColor: Colors.paper,
   },
   errorText: {
-    ...Typography.section,
+    ...Typography.body,
     color: Colors.inkMuted,
   },
-  header: {
-    paddingTop: 20,
-    paddingBottom: 16,
+  headerContent: {
+    gap: 16,
+    marginBottom: 16,
   },
-  headerTitle: {
-    fontFamily: FontFamilies.bricolage[800],
+  title: {
+    ...Typography.screenTitle,
     fontSize: 23,
-    fontWeight: "800",
     color: Colors.ink,
   },
-  headerSubtitle: {
+  subtitle: {
     fontFamily: FontFamilies.hanken[600],
     fontSize: 13,
     fontWeight: "600",
     color: Colors.inkMuted,
+    marginTop: 3,
   },
   searchInput: {
     backgroundColor: Colors.surface,
@@ -360,122 +341,114 @@
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
-    marginBottom: 16,
-  },
-  filterContainer: {
-    marginBottom: 16,
   },
-  listContent: {
-    gap: 12,
-    paddingBottom: 20,
+  listGap: {
+    height: 10,
   },
-  // Modal
   modalOverlay: {
     flex: 1,
-    backgroundColor: "rgba(0, 0, 0, 0.5)",
     justifyContent: "flex-end",
+    backgroundColor: "rgba(34, 31, 43, 0.35)",
   },
-  modal: {
-    flex: 1,
-    maxHeight: "90%",
-    backgroundColor: Colors.paper,
-    borderTopLeftRadius: Radii.tile[24],
-    borderTopRightRadius: Radii.tile[24],
-  },
-  modalContent: {
-    padding: Spacing.cardPadding || 20,
+  modalCard: {
+    backgroundColor: Colors.surface,
+    borderTopLeftRadius: Radii.card,
+    borderTopRightRadius: Radii.card,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 24,
+    paddingBottom: 28,
     gap: 16,
+    ...Shadows.card,
   },
   modalTitle: {
     fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
+    fontSize: 21,
     fontWeight: "800",
     color: Colors.ink,
-    marginBottom: 8,
   },
-  label: {
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldLabel: {
     fontFamily: FontFamilies.hanken[700],
-    fontSize: 11,
+    fontSize: 10,
     fontWeight: "700",
     letterSpacing: 1,
-    textTransform: "uppercase",
-    color: Colors.ink,
+    color: Colors.inkMuted,
   },
-  input: {
+  fieldInput: {
     backgroundColor: Colors.surface,
     borderColor: Colors.fieldBorder,
     borderWidth: 1,
     borderRadius: Radii.tile[14],
     paddingHorizontal: 12,
-    paddingVertical: 12,
+    paddingVertical: 11,
     fontFamily: FontFamilies.hanken[600],
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
   },
-  stepperContainer: {
+  stepper: {
+    alignSelf: "flex-start",
     flexDirection: "row",
     alignItems: "center",
-    gap: 12,
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
   },
-  stepperBtn: {
-    width: 40,
-    height: 40,
-    borderRadius: Radii.tile[12],
-    backgroundColor: Colors.surfaceMuted,
-    justifyContent: "center",
+  stepButton: {
+    width: 44,
+    height: 42,
     alignItems: "center",
+    justifyContent: "center",
   },
-  stepperBtnText: {
-    fontFamily: FontFamilies.hanken[800],
-    fontSize: 18,
-    fontWeight: "800",
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 20,
+    fontWeight: "700",
     color: Colors.burgundy,
   },
-  stepperValue: {
-    flex: 1,
+  stepValue: {
+    minWidth: 44,
     textAlign: "center",
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 16,
-    fontWeight: "800",
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
   modalFooter: {
     flexDirection: "row",
-    gap: 12,
-    marginTop: 16,
+    gap: 10,
+    marginTop: 4,
   },
-  cancelBtn: {
+  cancelButton: {
     flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
-    borderColor: Colors.burgundyBorder,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderColor: Colors.burgundy,
     borderWidth: 1,
-    justifyContent: "center",
-    alignItems: "center",
+    borderRadius: Radii.tile[14],
   },
-  cancelBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
+  cancelButtonText: {
+    ...Typography.primaryButtonCompact,
     color: Colors.burgundy,
   },
-  saveBtn: {
-    flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
+  saveButton: {
+    flex: 2,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderRadius: Radii.tile[14],
     backgroundColor: Colors.burgundy,
-    justifyContent: "center",
-    alignItems: "center",
-    ...Shadows.primaryButton,
   },
-  saveBtnDisabled: {
+  saveButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
     opacity: 0.6,
-  },
-  saveBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
-    color: Colors.surface,
   },
 });
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 5ff9c08c6c36ad11d37ae2b56f1e48e9638ab6e3..bbbd205d1bb0aac98ed8f85b00eb8fe3c290ebe5
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -1,11 +1,268 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
+} from "react-native";
+import { useLocalSearchParams, useRouter } from "expo-router";
+
+import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { upsertSession } from "@/services/admin";
+import type { UpsertSessionInput } from "@/services/admin";
 
+const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map(
+  (day) => ({
+    key: day,
+    label: {
+      monday: "PON",
+      tuesday: "UTO",
+      wednesday: "SRE",
+      thursday: "ČET",
+      friday: "PET",
+      saturday: "SUB",
+      sunday: "NED",
+    }[day],
+  }),
+);
+
 export default function TrainingDetailScreen() {
+  const router = useRouter();
+  const { id } = useLocalSearchParams<{ id: string }>();
+  const isNew = id === "new";
+  const { trainings, loading, fetchTrainings } = useTrainings();
+  const training = trainings.find((item) => item.id === id);
+  const [title, setTitle] = useState("");
+  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
+  const [time, setTime] = useState("");
+  const [room, setRoom] = useState("");
+  const [durationMin, setDurationMin] = useState<number | null>(null);
+  const [maxParticipants, setMaxParticipants] = useState(10);
+  const [isOpen, setIsOpen] = useState(true);
+  const [submitting, setSubmitting] = useState(false);
+  const [initializedId, setInitializedId] = useState<string | null>(null);
+
+  useEffect(() => {
+    if (!training || initializedId === training.id) return;
+
+    setTitle(training.title);
+    setDayOfWeek(
+      TRAINING_DAYS.includes(training.day_of_week as Day)
+        ? (training.day_of_week as Day)
+        : "monday",
+    );
+    setTime(training.time);
+    setRoom(training.room ?? "");
+    setDurationMin(training.duration_min);
+    setMaxParticipants(training.max_participants);
+    setIsOpen(training.is_open);
+    setInitializedId(training.id);
+  }, [initializedId, training]);
+
+  const submit = async () => {
+    const normalizedTitle = title.trim();
+    const normalizedTime = time.trim();
+
+    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+      Alert.alert(
+        "Proverite podatke",
+        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
+      );
+      return;
+    }
+
+    const input: UpsertSessionInput = {
+      id: isNew ? null : id,
+      title: normalizedTitle,
+      day_of_week: dayOfWeek,
+      time: normalizedTime,
+      room: room.trim() || null,
+      duration_min: durationMin,
+      max_participants: maxParticipants,
+      is_open: isOpen,
+    };
+
+    setSubmitting(true);
+    try {
+      await upsertSession(input);
+      await fetchTrainings();
+      router.back();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Trening nije sačuvan.");
+      await fetchTrainings();
+    } finally {
+      setSubmitting(false);
+    }
+  };
+
+  if (!isNew && loading && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (!isNew && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
+        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
+          <Text style={styles.notFoundButtonText}>Nazad</Text>
+        </Pressable>
+      </View>
+    );
+  }
+
   return (
     <View style={styles.screen}>
-      <Text style={styles.title}>Training Detail</Text>
+      <View style={styles.navBar}>
+        <Pressable
+          accessibilityRole="button"
+          onPress={() => router.back()}
+          style={styles.backButton}
+        >
+          <Text style={styles.backChevron}>‹</Text>
+        </Pressable>
+        <Text style={styles.navTitle}>
+          {isNew ? "Novi trening" : "Izmena treninga"}
+        </Text>
+        <View style={styles.navSpacer} />
+      </View>
+
+      <ScrollView
+        style={styles.formScroll}
+        contentContainerStyle={styles.formContent}
+        keyboardShouldPersistTaps="handled"
+        showsVerticalScrollIndicator={false}
+      >
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
+          <TextInput
+            value={title}
+            onChangeText={setTitle}
+            editable={!submitting}
+            style={styles.input}
+          />
+        </View>
+
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>DAN</Text>
+          <FilterChips
+            options={DAY_OPTIONS}
+            value={dayOfWeek}
+            onChange={setDayOfWeek}
+          />
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>VREME</Text>
+            <TextInput
+              value={time}
+              onChangeText={setTime}
+              placeholder="18:00"
+              placeholderTextColor={Colors.inkFaint}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
+            <TextInput
+              value={durationMin?.toString() ?? ""}
+              onChangeText={(value) =>
+                setDurationMin(value === "" ? null : Number(value.replace(/\D/g, "")))
+              }
+              keyboardType="number-pad"
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>SALA</Text>
+            <TextInput
+              value={room}
+              onChangeText={setRoom}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
+            <View style={styles.stepper}>
+              <Pressable
+                disabled={submitting || maxParticipants === 1}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.max(1, value - 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>−</Text>
+              </Pressable>
+              <Text style={styles.stepValue}>{maxParticipants}</Text>
+              <Pressable
+                disabled={submitting || maxParticipants === 50}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.min(50, value + 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>＋</Text>
+              </Pressable>
+            </View>
+          </View>
+        </View>
+
+        <View style={styles.statusCard}>
+          <View style={styles.statusTextBlock}>
+            <Text style={styles.statusTitle}>Status slota</Text>
+            <Text style={styles.statusDescription}>
+              Otvoren za prijave članova
+            </Text>
+          </View>
+          <Toggle
+            value={isOpen}
+            onValueChange={setIsOpen}
+            disabled={submitting}
+          />
+        </View>
+
+        <View style={styles.footer}>
+          <Pressable
+            onPress={() => router.back()}
+            disabled={submitting}
+            style={styles.cancelButton}
+          >
+            <Text style={styles.cancelButtonText}>Otkaži</Text>
+          </Pressable>
+          <Pressable
+            onPress={() => void submit()}
+            disabled={submitting}
+            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+          >
+            {submitting ? (
+              <ActivityIndicator color={Colors.surface} />
+            ) : (
+              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
+            )}
+          </Pressable>
+        </View>
+      </ScrollView>
     </View>
   );
 }
@@ -14,11 +271,194 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
+  },
+  centeredState: {
+    flex: 1,
+    alignItems: "center",
     justifyContent: "center",
+    gap: 16,
+    backgroundColor: Colors.paper,
+  },
+  notFoundText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
+  notFoundButton: {
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    paddingHorizontal: 18,
+    paddingVertical: 10,
+  },
+  notFoundButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.burgundy,
+  },
+  navBar: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 16,
+    paddingBottom: 12,
+    borderBottomColor: Colors.border,
+    borderBottomWidth: 1,
+  },
+  backButton: {
+    width: 38,
+    height: 38,
     alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    backgroundColor: Colors.surface,
+  },
+  backChevron: {
+    fontFamily: FontFamilies.hanken[500],
+    fontSize: 31,
+    fontWeight: "500",
+    lineHeight: 32,
+    color: Colors.burgundy,
   },
-  title: {
-    ...Typography.screenTitle,
+  navTitle: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 19,
+    fontWeight: "800",
     color: Colors.ink,
   },
+  navSpacer: {
+    width: 38,
+    height: 38,
+  },
+  formScroll: {
+    flex: 1,
+  },
+  formContent: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 22,
+    paddingBottom: 28,
+    gap: 20,
+  },
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  columnField: {
+    flex: 1,
+    gap: 7,
+  },
+  fieldLabel: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    letterSpacing: 1,
+    color: Colors.inkMuted,
+  },
+  input: {
+    minHeight: 46,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    paddingHorizontal: 12,
+    paddingVertical: 11,
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 14,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  stepper: {
+    minHeight: 46,
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
+  },
+  stepButton: {
+    width: 38,
+    height: 44,
+    alignItems: "center",
+    justifyContent: "center",
+  },
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 19,
+    fontWeight: "700",
+    color: Colors.burgundy,
+  },
+  stepValue: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusCard: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    gap: 16,
+    borderColor: Colors.goldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[16],
+    backgroundColor: Colors.surfaceWarm,
+    padding: Spacing.cardPadding,
+  },
+  statusTextBlock: {
+    flex: 1,
+    gap: 3,
+  },
+  statusTitle: {
+    fontFamily: FontFamilies.bricolage[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusDescription: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 12,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
+  footer: {
+    flexDirection: "row",
+    gap: 10,
+    marginTop: 4,
+  },
+  cancelButton: {
+    flex: 1,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+  },
+  cancelButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.burgundy,
+  },
+  saveButton: {
+    flex: 2,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.burgundy,
+    ...Shadows.primaryButton,
+  },
+  saveButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
+    opacity: 0.6,
+  },
 });

 succeeded in 3579ms:
app/(admin)/(tabs)/users.tsx 60ms
app/(admin)/(tabs)/sessions.tsx 13ms
app/(admin)/training/[id].tsx 22ms

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/training/[id].tsx
diff --git a/app/(admin)/(tabs)/sessions.tsx b/app/(admin)/(tabs)/sessions.tsx
index b37d42eee582cfcbbfbaba8b37d423440c0794ae..df22d2c62a54e17bd6bdbca98213ae4760f430de
--- a/app/(admin)/(tabs)/sessions.tsx
+++ b/app/(admin)/(tabs)/sessions.tsx
@@ -1,12 +1,155 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  FlatList,
+  Pressable,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import { SessionRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { setSessionOpen } from "@/services/admin";
+import { getCurrentWeekDates } from "@/utils/week";
+
+const DAY_LABELS: Record<Day, string> = {
+  sunday: "NED",
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+};
+
+const DAY_NAMES: Record<Day, string> = {
+  sunday: "NEDELJA",
+  monday: "PONEDELJAK",
+  tuesday: "UTORAK",
+  wednesday: "SREDA",
+  thursday: "ČETVRTAK",
+  friday: "PETAK",
+  saturday: "SUBOTA",
+};
+
+const MONTH_NAMES = [
+  "JAN",
+  "FEB",
+  "MAR",
+  "APR",
+  "MAJ",
+  "JUN",
+  "JUL",
+  "AVG",
+  "SEP",
+  "OKT",
+  "NOV",
+  "DEC",
+] as const;
 
 export default function TreninziScreen() {
+  const router = useRouter();
+  const [selectedDay, setSelectedDay] = useState<Day>("monday");
+  const { loading, fetchTrainings, getTrainingsByDay } = useTrainings();
+  const sessions = getTrainingsByDay(selectedDay);
+  const selectedDate = getCurrentWeekDates()[selectedDay];
+  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;
+
+  const toggleSession = async (sessionId: string, open: boolean) => {
+    try {
+      await setSessionOpen(sessionId, open);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Status treninga nije promenjen.");
+    } finally {
+      await fetchTrainings();
+    }
+  };
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Treninzi</Text>
-    </View>
+    <FlatList
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      data={sessions}
+      keyExtractor={(session) => session.id}
+      showsVerticalScrollIndicator={false}
+      ItemSeparatorComponent={() => <View style={styles.listGap} />}
+      ListHeaderComponent={
+        <View style={styles.headerContent}>
+          <View style={styles.titleRow}>
+            <View style={styles.titleBlock}>
+              <Text style={styles.title}>Treninzi</Text>
+              <Text style={styles.subtitle}>
+                {DAY_NAMES[selectedDay]} · {dateLabel}
+              </Text>
+            </View>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/(admin)/training/new")}
+              style={({ pressed }) => [
+                styles.newButton,
+                pressed && styles.buttonPressed,
+              ]}
+            >
+              <Text style={styles.newButtonText}>＋ Novi</Text>
+            </Pressable>
+          </View>
+
+          <View style={styles.daySelector}>
+            {TRAINING_DAYS.map((day) => {
+              const active = selectedDay === day;
+              return (
+                <Pressable
+                  key={day}
+                  onPress={() => setSelectedDay(day)}
+                  style={[
+                    styles.dayChip,
+                    active && styles.dayChipActive,
+                  ]}
+                >
+                  <Text
+                    style={[
+                      styles.dayChipText,
+                      active && styles.dayChipTextActive,
+                    ]}
+                  >
+                    {DAY_LABELS[day]}
+                  </Text>
+                </Pressable>
+              );
+            })}
+          </View>
+
+          {loading && (
+            <ActivityIndicator
+              color={Colors.burgundy}
+              style={styles.loadingIndicator}
+            />
+          )}
+        </View>
+      }
+      ListEmptyComponent={
+        loading ? null : (
+          <Text style={styles.emptyText}>Nema termina za ovaj dan.</Text>
+        )
+      }
+      renderItem={({ item }) => (
+        <SessionRow
+          session={item}
+          bookedCount={item.session_participants.length}
+          onToggleOpen={(open) => void toggleSession(item.id, open)}
+          onPress={() => router.push(`/(admin)/training/${item.id}`)}
+        />
+      )}
+    />
   );
 }
 
@@ -14,11 +157,95 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    flexGrow: 1,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  headerContent: {
+    gap: 18,
+    marginBottom: 16,
+  },
+  titleRow: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 12,
   },
+  titleBlock: {
+    flex: 1,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
     color: Colors.ink,
   },
+  subtitle: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  newButton: {
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.burgundy,
+    paddingHorizontal: 14,
+    paddingVertical: 9,
+    ...Shadows.primaryButton,
+  },
+  newButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 13,
+    fontWeight: "700",
+    color: Colors.surface,
+  },
+  buttonPressed: {
+    opacity: 0.85,
+  },
+  daySelector: {
+    flexDirection: "row",
+    justifyContent: "space-between",
+    gap: 5,
+  },
+  dayChip: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 36,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.surface,
+  },
+  dayChipActive: {
+    borderColor: Colors.burgundy,
+    backgroundColor: Colors.burgundy,
+    ...Shadows.activeDay,
+  },
+  dayChipText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  dayChipTextActive: {
+    color: Colors.surface,
+  },
+  loadingIndicator: {
+    marginTop: 10,
+  },
+  listGap: {
+    height: 10,
+  },
+  emptyText: {
+    marginTop: 48,
+    textAlign: "center",
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
 });
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 8af74755eb930ef1aea5ab7c7c6df27230debb82..d750a54b7f9ba61a558953849e34bda2533339a1
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -1,319 +1,296 @@
+import { useCallback, useEffect, useMemo, useState } from "react";
 import {
-  View,
-  Text,
-  StyleSheet,
+  ActivityIndicator,
+  Alert,
   FlatList,
-  TextInput,
   Modal,
-  Alert,
-  ActivityIndicator,
   Pressable,
-  ScrollView,
-  KeyboardAvoidingView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
 } from "react-native";
-import { useEffect, useState } from "react";
+
+import { FilterChips, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import {
-  listUsers,
-  updateUser,
-  deleteUser,
-  AdminUser,
-  UpdateUserPatch,
-} from "@/services/admin";
-import UserRow from "@/components/admin/UserRow";
-import FilterChips from "@/components/admin/FilterChips";
+import { deleteUser, listUsers, updateUser } from "@/services/admin";
+import type { AdminUser, UpdateUserPatch } from "@/services/admin";
 
-type FilterKey = "svi" | "aktivni" | "admini";
+type UserFilter = "svi" | "aktivni" | "admini";
+type UserRole = AdminUser["role"];
 
+const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
+  { key: "svi", label: "Svi" },
+  { key: "aktivni", label: "Aktivni" },
+  { key: "admini", label: "Admini" },
+];
+
+const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
+  { key: "user", label: "Član" },
+  { key: "admin", label: "Admin" },
+];
+
 export default function KorisniciScreen() {
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
+  const [hasError, setHasError] = useState(false);
+  const [search, setSearch] = useState("");
+  const [filter, setFilter] = useState<UserFilter>("svi");
   const [expandedId, setExpandedId] = useState<string | null>(null);
-  const [searchText, setSearchText] = useState("");
-  const [filter, setFilter] = useState<FilterKey>("svi");
   const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
-  const [editModal, setEditModal] = useState(false);
-  const [editForm, setEditForm] = useState({
-    first_name: "",
-    last_name: "",
-    role: "user" as "user" | "admin",
-    max_sessions_per_week: 0,
-  });
+  const [firstName, setFirstName] = useState("");
+  const [lastName, setLastName] = useState("");
+  const [role, setRole] = useState<UserRole>("user");
+  const [maxSessions, setMaxSessions] = useState(0);
   const [saving, setSaving] = useState(false);
 
-  // Load users on mount
-  useEffect(() => {
-    fetchUsers();
-  }, []);
+  const fetchUsers = useCallback(async () => {
+    setLoading(true);
+    setHasError(false);
 
-  const fetchUsers = async () => {
-    setLoading(true);
-    setError(null);
     try {
-      const data = await listUsers();
-      setUsers(data);
-    } catch (err) {
-      setError("Greška pri učitavanju");
-      if (__DEV__) console.error(err);
+      setUsers(await listUsers());
+    } catch (error: unknown) {
+      console.error(error);
+      setHasError(true);
     } finally {
       setLoading(false);
     }
-  };
+  }, []);
 
-  // Filter logic
-  const filteredUsers = users
-    .filter((u) => {
-      const searchLower = searchText.toLowerCase();
-      const matchesSearch =
-        u.first_name.toLowerCase().includes(searchLower) ||
-        (u.last_name?.toLowerCase().includes(searchLower) ?? false) ||
-        u.email.toLowerCase().includes(searchLower);
+  useEffect(() => {
+    void fetchUsers();
+  }, [fetchUsers]);
 
-      if (!matchesSearch) return false;
+  const filteredUsers = useMemo(() => {
+    const query = search.trim().toLocaleLowerCase();
+
+    return users.filter((user) => {
+      const matchesFilter =
+        filter === "svi" ||
+        (filter === "aktivni" && user.enabled !== false) ||
+        (filter === "admini" && user.role === "admin");
+      const searchable = `${user.first_name} ${user.last_name ?? ""} ${user.email}`
+        .toLocaleLowerCase();
 
-      if (filter === "aktivni") return u.enabled !== false;
-      if (filter === "admini") return u.role === "admin";
-      return true;
+      return matchesFilter && searchable.includes(query);
     });
+  }, [filter, search, users]);
 
-  // Edit modal handlers
-  const onEdit = (user: AdminUser) => {
+  const openEditModal = (user: AdminUser) => {
     setEditingUser(user);
-    setEditForm({
-      first_name: user.first_name,
-      last_name: user.last_name || "",
-      role: user.role,
-      max_sessions_per_week: user.max_sessions_per_week,
-    });
-    setEditModal(true);
+    setFirstName(user.first_name);
+    setLastName(user.last_name ?? "");
+    setRole(user.role);
+    setMaxSessions(user.max_sessions_per_week);
   };
 
-  const onRemove = (user: AdminUser) => {
-    Alert.alert(
-      "Ukloni korisnika",
-      `${user.first_name} ${user.last_name || ""} i sve njegove rezervacije će biti uklonjeni.`,
-      [
-        { text: "Otkaži", style: "cancel" },
-        {
-          text: "Ukloni",
-          onPress: async () => {
-            try {
-              await deleteUser(user.id);
-              await fetchUsers();
-            } catch (err) {
-              Alert.alert("Greška", "Nije moguće obrisati korisnika");
-              if (__DEV__) console.error(err);
-            }
-          },
-          style: "destructive",
-        },
-      ]
-    );
+  const closeEditModal = () => {
+    if (!saving) setEditingUser(null);
   };
 
-  const onSaveEdit = async () => {
+  const saveUser = async () => {
     if (!editingUser) return;
 
+    const patch: UpdateUserPatch = {
+      first_name: firstName.trim(),
+      last_name: lastName.trim(),
+      role,
+      max_sessions_per_week: maxSessions,
+    };
+
     setSaving(true);
     try {
-      const patch: UpdateUserPatch = {
-        first_name: editForm.first_name || null,
-        last_name: editForm.last_name || null,
-        role: editForm.role,
-        max_sessions_per_week: editForm.max_sessions_per_week,
-      };
       await updateUser(editingUser.id, patch);
-      setEditModal(false);
       setEditingUser(null);
       await fetchUsers();
-    } catch (err) {
-      Alert.alert("Greška", "Nije moguće sačuvati promene");
-      if (__DEV__) console.error(err);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
+      await fetchUsers();
     } finally {
       setSaving(false);
     }
   };
 
-  if (loading) {
+  const removeUser = async (user: AdminUser) => {
+    try {
+      await deleteUser(user.id);
+      setExpandedId(null);
+      await fetchUsers();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Korisnik nije uklonjen.");
+      await fetchUsers();
+    }
+  };
+
+  const confirmRemove = (user: AdminUser) => {
+    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();
+
+    Alert.alert(
+      "Ukloni korisnika",
+      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
+      [
+        { text: "Otkaži", style: "cancel" },
+        {
+          text: "Ukloni",
+          style: "destructive",
+          onPress: () => void removeUser(user),
+        },
+      ],
+    );
+  };
+
+  if (loading && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <ActivityIndicator size="large" color={Colors.burgundy} />
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
       </View>
     );
   }
 
-  if (error) {
+  if (hasError && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <Text style={styles.errorText}>{error}</Text>
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
       </View>
     );
   }
 
   return (
-    <View style={styles.screen}>
-      {/* Header */}
-      <View style={styles.header}>
-        <Text style={styles.headerTitle}>Korisnici</Text>
-        <Text style={styles.headerSubtitle}>{users.length} članova</Text>
-      </View>
-
-      {/* Search */}
-      <TextInput
-        style={styles.searchInput}
-        placeholder="Pretraži članove…"
-        placeholderTextColor={Colors.inkMuted}
-        value={searchText}
-        onChangeText={setSearchText}
-      />
-
-      {/* Filter chips */}
-      <View style={styles.filterContainer}>
-        <FilterChips<FilterKey>
-          options={[
-            { key: "svi", label: "Svi" },
-            { key: "aktivni", label: "Aktivni" },
-            { key: "admini", label: "Admini" },
-          ]}
-          value={filter}
-          onChange={setFilter}
-        />
-      </View>
-
-      {/* User list */}
+    <>
       <FlatList
+        style={styles.screen}
+        contentContainerStyle={styles.content}
         data={filteredUsers}
-        keyExtractor={(u) => u.id}
+        keyExtractor={(user) => user.id}
+        showsVerticalScrollIndicator={false}
+        ItemSeparatorComponent={() => <View style={styles.listGap} />}
+        ListHeaderComponent={
+          <View style={styles.headerContent}>
+            <View>
+              <Text style={styles.title}>Korisnici</Text>
+              <Text style={styles.subtitle}>{users.length} članova</Text>
+            </View>
+            <TextInput
+              value={search}
+              onChangeText={setSearch}
+              placeholder="Pretraži članove…"
+              placeholderTextColor={Colors.inkFaint}
+              style={styles.searchInput}
+              autoCapitalize="none"
+              autoCorrect={false}
+            />
+            <FilterChips
+              options={FILTER_OPTIONS}
+              value={filter}
+              onChange={setFilter}
+            />
+          </View>
+        }
         renderItem={({ item, index }) => (
           <UserRow
             user={item}
             expanded={expandedId === item.id}
             onToggleExpand={() =>
-              setExpandedId(expandedId === item.id ? null : item.id)
+              setExpandedId((current) => (current === item.id ? null : item.id))
             }
-            onEdit={() => onEdit(item)}
-            onRemove={() => onRemove(item)}
+            onEdit={() => openEditModal(item)}
+            onRemove={() => confirmRemove(item)}
             tintIndex={index % 3}
           />
         )}
-        contentContainerStyle={styles.listContent}
-        scrollEnabled={false}
       />
 
-      {/* Edit Modal */}
       <Modal
         animationType="slide"
         transparent
-        visible={editModal}
-        onRequestClose={() => setEditModal(false)}
+        visible={editingUser !== null}
+        onRequestClose={closeEditModal}
       >
         <View style={styles.modalOverlay}>
-          <KeyboardAvoidingView behavior="padding" style={styles.modal}>
-            <ScrollView
-              contentContainerStyle={styles.modalContent}
-              keyboardShouldPersistTaps="handled"
-            >
-              <Text style={styles.modalTitle}>Izmena korisnika</Text>
+          <View style={styles.modalCard}>
+            <Text style={styles.modalTitle}>Izmena korisnika</Text>
 
-              {/* first_name */}
-              <Text style={styles.label}>IME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>IME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.first_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, first_name: v }))
-                }
+                value={firstName}
+                onChangeText={setFirstName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* last_name */}
-              <Text style={styles.label}>PREZIME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>PREZIME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.last_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, last_name: v }))
-                }
+                value={lastName}
+                onChangeText={setLastName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* role */}
-              <Text style={styles.label}>ULOGA</Text>
-              <FilterChips<"user" | "admin">
-                options={[
-                  { key: "user", label: "Član" },
-                  { key: "admin", label: "Admin" },
-                ]}
-                value={editForm.role}
-                onChange={(v) => setEditForm((p) => ({ ...p, role: v }))}
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>ULOGA</Text>
+              <FilterChips
+                options={ROLE_OPTIONS}
+                value={role}
+                onChange={setRole}
               />
+            </View>
 
-              {/* max_sessions_per_week stepper */}
-              <Text style={styles.label}>NEDELJNI LIMIT</Text>
-              <View style={styles.stepperContainer}>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
+              <View style={styles.stepper}>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.max(
-                        0,
-                        p.max_sessions_per_week - 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 0}
+                  onPress={() => setMaxSessions((value) => Math.max(0, value - 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>−</Text>
+                  <Text style={styles.stepButtonText}>−</Text>
                 </Pressable>
-                <Text style={styles.stepperValue}>
-                  {editForm.max_sessions_per_week}
-                </Text>
+                <Text style={styles.stepValue}>{maxSessions}</Text>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.min(
-                        14,
-                        p.max_sessions_per_week + 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 14}
+                  onPress={() => setMaxSessions((value) => Math.min(14, value + 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>+</Text>
+                  <Text style={styles.stepButtonText}>＋</Text>
                 </Pressable>
               </View>
+            </View>
 
-              {/* Footer actions */}
-              <View style={styles.modalFooter}>
-                <Pressable
-                  onPress={() => setEditModal(false)}
-                  style={styles.cancelBtn}
-                  disabled={saving}
-                >
-                  <Text style={styles.cancelBtnText}>Otkaži</Text>
-                </Pressable>
-                <Pressable
-                  onPress={onSaveEdit}
-                  style={[
-                    styles.saveBtn,
-                    saving && styles.saveBtnDisabled,
-                  ]}
-                  disabled={saving}
-                >
-                  {saving ? (
-                    <ActivityIndicator size="small" color={Colors.surface} />
-                  ) : (
-                    <Text style={styles.saveBtnText}>Sačuvaj</Text>
-                  )}
-                </Pressable>
-              </View>
-            </ScrollView>
-          </KeyboardAvoidingView>
+            <View style={styles.modalFooter}>
+              <Pressable
+                onPress={closeEditModal}
+                disabled={saving}
+                style={styles.cancelButton}
+              >
+                <Text style={styles.cancelButtonText}>Otkaži</Text>
+              </Pressable>
+              <Pressable
+                onPress={() => void saveUser()}
+                disabled={saving}
+                style={[styles.saveButton, saving && styles.buttonDisabled]}
+              >
+                {saving ? (
+                  <ActivityIndicator color={Colors.surface} />
+                ) : (
+                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
+                )}
+              </Pressable>
+            </View>
+          </View>
         </View>
       </Modal>
-    </View>
+    </>
   );
 }
 
@@ -321,33 +298,37 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    paddingHorizontal: Spacing.screenHorizontal || 20,
   },
-  centerContainer: {
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  centeredState: {
     flex: 1,
+    alignItems: "center",
     justifyContent: "center",
-    alignItems: "center",
     backgroundColor: Colors.paper,
   },
   errorText: {
-    ...Typography.section,
+    ...Typography.body,
     color: Colors.inkMuted,
   },
-  header: {
-    paddingTop: 20,
-    paddingBottom: 16,
+  headerContent: {
+    gap: 16,
+    marginBottom: 16,
   },
-  headerTitle: {
-    fontFamily: FontFamilies.bricolage[800],
+  title: {
+    ...Typography.screenTitle,
     fontSize: 23,
-    fontWeight: "800",
     color: Colors.ink,
   },
-  headerSubtitle: {
+  subtitle: {
     fontFamily: FontFamilies.hanken[600],
     fontSize: 13,
     fontWeight: "600",
     color: Colors.inkMuted,
+    marginTop: 3,
   },
   searchInput: {
     backgroundColor: Colors.surface,
@@ -360,122 +341,114 @@
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
-    marginBottom: 16,
-  },
-  filterContainer: {
-    marginBottom: 16,
   },
-  listContent: {
-    gap: 12,
-    paddingBottom: 20,
+  listGap: {
+    height: 10,
   },
-  // Modal
   modalOverlay: {
     flex: 1,
-    backgroundColor: "rgba(0, 0, 0, 0.5)",
     justifyContent: "flex-end",
+    backgroundColor: "rgba(34, 31, 43, 0.35)",
   },
-  modal: {
-    flex: 1,
-    maxHeight: "90%",
-    backgroundColor: Colors.paper,
-    borderTopLeftRadius: Radii.tile[24],
-    borderTopRightRadius: Radii.tile[24],
-  },
-  modalContent: {
-    padding: Spacing.cardPadding || 20,
+  modalCard: {
+    backgroundColor: Colors.surface,
+    borderTopLeftRadius: Radii.card,
+    borderTopRightRadius: Radii.card,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 24,
+    paddingBottom: 28,
     gap: 16,
+    ...Shadows.card,
   },
   modalTitle: {
     fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
+    fontSize: 21,
     fontWeight: "800",
     color: Colors.ink,
-    marginBottom: 8,
   },
-  label: {
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldLabel: {
     fontFamily: FontFamilies.hanken[700],
-    fontSize: 11,
+    fontSize: 10,
     fontWeight: "700",
     letterSpacing: 1,
-    textTransform: "uppercase",
-    color: Colors.ink,
+    color: Colors.inkMuted,
   },
-  input: {
+  fieldInput: {
     backgroundColor: Colors.surface,
     borderColor: Colors.fieldBorder,
     borderWidth: 1,
     borderRadius: Radii.tile[14],
     paddingHorizontal: 12,
-    paddingVertical: 12,
+    paddingVertical: 11,
     fontFamily: FontFamilies.hanken[600],
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
   },
-  stepperContainer: {
+  stepper: {
+    alignSelf: "flex-start",
     flexDirection: "row",
     alignItems: "center",
-    gap: 12,
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
   },
-  stepperBtn: {
-    width: 40,
-    height: 40,
-    borderRadius: Radii.tile[12],
-    backgroundColor: Colors.surfaceMuted,
-    justifyContent: "center",
+  stepButton: {
+    width: 44,
+    height: 42,
     alignItems: "center",
+    justifyContent: "center",
   },
-  stepperBtnText: {
-    fontFamily: FontFamilies.hanken[800],
-    fontSize: 18,
-    fontWeight: "800",
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 20,
+    fontWeight: "700",
     color: Colors.burgundy,
   },
-  stepperValue: {
-    flex: 1,
+  stepValue: {
+    minWidth: 44,
     textAlign: "center",
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 16,
-    fontWeight: "800",
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
   modalFooter: {
     flexDirection: "row",
-    gap: 12,
-    marginTop: 16,
+    gap: 10,
+    marginTop: 4,
   },
-  cancelBtn: {
+  cancelButton: {
     flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
-    borderColor: Colors.burgundyBorder,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderColor: Colors.burgundy,
     borderWidth: 1,
-    justifyContent: "center",
-    alignItems: "center",
+    borderRadius: Radii.tile[14],
   },
-  cancelBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
+  cancelButtonText: {
+    ...Typography.primaryButtonCompact,
     color: Colors.burgundy,
   },
-  saveBtn: {
-    flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
+  saveButton: {
+    flex: 2,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderRadius: Radii.tile[14],
     backgroundColor: Colors.burgundy,
-    justifyContent: "center",
-    alignItems: "center",
-    ...Shadows.primaryButton,
   },
-  saveBtnDisabled: {
+  saveButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
     opacity: 0.6,
-  },
-  saveBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
-    color: Colors.surface,
   },
 });
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 5ff9c08c6c36ad11d37ae2b56f1e48e9638ab6e3..370de64bb181162ed7439dfdb42d667232871d81
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -1,11 +1,270 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
+} from "react-native";
+import { useLocalSearchParams, useRouter } from "expo-router";
+
+import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { upsertSession } from "@/services/admin";
+import type { UpsertSessionInput } from "@/services/admin";
 
+const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map((day) => ({
+  key: day,
+  label: {
+    monday: "PON",
+    tuesday: "UTO",
+    wednesday: "SRE",
+    thursday: "ČET",
+    friday: "PET",
+    saturday: "SUB",
+    sunday: "NED",
+  }[day],
+}));
+
 export default function TrainingDetailScreen() {
+  const router = useRouter();
+  const { id } = useLocalSearchParams<{ id: string }>();
+  const isNew = id === "new";
+  const { trainings, loading, fetchTrainings } = useTrainings();
+  const training = trainings.find((item) => item.id === id);
+  const [title, setTitle] = useState("");
+  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
+  const [time, setTime] = useState("");
+  const [room, setRoom] = useState("");
+  const [durationMin, setDurationMin] = useState<number | null>(null);
+  const [maxParticipants, setMaxParticipants] = useState(10);
+  const [isOpen, setIsOpen] = useState(true);
+  const [submitting, setSubmitting] = useState(false);
+  const [initializedId, setInitializedId] = useState<string | null>(null);
+
+  useEffect(() => {
+    if (!training || initializedId === training.id) return;
+
+    setTitle(training.title);
+    setDayOfWeek(
+      TRAINING_DAYS.includes(training.day_of_week as Day)
+        ? (training.day_of_week as Day)
+        : "monday",
+    );
+    setTime(training.time);
+    setRoom(training.room ?? "");
+    setDurationMin(training.duration_min);
+    setMaxParticipants(
+      Math.min(50, Math.max(1, training.max_participants)),
+    );
+    setIsOpen(training.is_open);
+    setInitializedId(training.id);
+  }, [initializedId, training]);
+
+  const submit = async () => {
+    const normalizedTitle = title.trim();
+    const normalizedTime = time.trim();
+
+    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+      Alert.alert(
+        "Proverite podatke",
+        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
+      );
+      return;
+    }
+
+    const input: UpsertSessionInput = {
+      id: isNew ? null : id,
+      title: normalizedTitle,
+      day_of_week: dayOfWeek,
+      time: normalizedTime,
+      room: room.trim() || null,
+      duration_min: durationMin,
+      max_participants: maxParticipants,
+      is_open: isOpen,
+    };
+
+    setSubmitting(true);
+    try {
+      await upsertSession(input);
+      await fetchTrainings();
+      router.back();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Trening nije sačuvan.");
+      await fetchTrainings();
+    } finally {
+      setSubmitting(false);
+    }
+  };
+
+  if (!isNew && loading && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (!isNew && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
+        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
+          <Text style={styles.notFoundButtonText}>Nazad</Text>
+        </Pressable>
+      </View>
+    );
+  }
+
   return (
     <View style={styles.screen}>
-      <Text style={styles.title}>Training Detail</Text>
+      <View style={styles.navBar}>
+        <Pressable
+          accessibilityRole="button"
+          onPress={() => router.back()}
+          style={styles.backButton}
+        >
+          <Text style={styles.backChevron}>‹</Text>
+        </Pressable>
+        <Text style={styles.navTitle}>
+          {isNew ? "Novi trening" : "Izmena treninga"}
+        </Text>
+        <View style={styles.navSpacer} />
+      </View>
+
+      <ScrollView
+        style={styles.formScroll}
+        contentContainerStyle={styles.formContent}
+        keyboardShouldPersistTaps="handled"
+        showsVerticalScrollIndicator={false}
+      >
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
+          <TextInput
+            value={title}
+            onChangeText={setTitle}
+            editable={!submitting}
+            style={styles.input}
+          />
+        </View>
+
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>DAN</Text>
+          <FilterChips
+            options={DAY_OPTIONS}
+            value={dayOfWeek}
+            onChange={setDayOfWeek}
+          />
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>VREME</Text>
+            <TextInput
+              value={time}
+              onChangeText={setTime}
+              placeholder="18:00"
+              placeholderTextColor={Colors.inkFaint}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
+            <TextInput
+              value={durationMin?.toString() ?? ""}
+              onChangeText={(value) =>
+                setDurationMin(
+                  value === "" ? null : Number(value.replace(/\D/g, "")),
+                )
+              }
+              keyboardType="number-pad"
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>SALA</Text>
+            <TextInput
+              value={room}
+              onChangeText={setRoom}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
+            <View style={styles.stepper}>
+              <Pressable
+                disabled={submitting || maxParticipants === 1}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.max(1, value - 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>−</Text>
+              </Pressable>
+              <Text style={styles.stepValue}>{maxParticipants}</Text>
+              <Pressable
+                disabled={submitting || maxParticipants === 50}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.min(50, value + 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>＋</Text>
+              </Pressable>
+            </View>
+          </View>
+        </View>
+
+        <View style={styles.statusCard}>
+          <View style={styles.statusTextBlock}>
+            <Text style={styles.statusTitle}>Status slota</Text>
+            <Text style={styles.statusDescription}>
+              Otvoren za prijave članova
+            </Text>
+          </View>
+          <Toggle
+            value={isOpen}
+            onValueChange={setIsOpen}
+            disabled={submitting}
+          />
+        </View>
+
+        <View style={styles.footer}>
+          <Pressable
+            onPress={() => router.back()}
+            disabled={submitting}
+            style={styles.cancelButton}
+          >
+            <Text style={styles.cancelButtonText}>Otkaži</Text>
+          </Pressable>
+          <Pressable
+            onPress={() => void submit()}
+            disabled={submitting}
+            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+          >
+            {submitting ? (
+              <ActivityIndicator color={Colors.surface} />
+            ) : (
+              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
+            )}
+          </Pressable>
+        </View>
+      </ScrollView>
     </View>
   );
 }
@@ -14,11 +273,194 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
+  },
+  centeredState: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    gap: 16,
+    backgroundColor: Colors.paper,
+  },
+  notFoundText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
+  notFoundButton: {
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    paddingHorizontal: 18,
+    paddingVertical: 10,
+  },
+  notFoundButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.burgundy,
+  },
+  navBar: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 16,
+    paddingBottom: 12,
+    borderBottomColor: Colors.border,
+    borderBottomWidth: 1,
+  },
+  backButton: {
+    width: 38,
+    height: 38,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    backgroundColor: Colors.surface,
+  },
+  backChevron: {
+    fontFamily: FontFamilies.hanken[500],
+    fontSize: 31,
+    fontWeight: "500",
+    lineHeight: 32,
+    color: Colors.burgundy,
+  },
+  navTitle: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 19,
+    fontWeight: "800",
+    color: Colors.ink,
+  },
+  navSpacer: {
+    width: 38,
+    height: 38,
+  },
+  formScroll: {
+    flex: 1,
+  },
+  formContent: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 22,
+    paddingBottom: 28,
+    gap: 20,
+  },
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  columnField: {
+    flex: 1,
+    gap: 7,
+  },
+  fieldLabel: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    letterSpacing: 1,
+    color: Colors.inkMuted,
+  },
+  input: {
+    minHeight: 46,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    paddingHorizontal: 12,
+    paddingVertical: 11,
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 14,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  stepper: {
+    minHeight: 46,
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
+  },
+  stepButton: {
+    width: 38,
+    height: 44,
+    alignItems: "center",
     justifyContent: "center",
+  },
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 19,
+    fontWeight: "700",
+    color: Colors.burgundy,
+  },
+  stepValue: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusCard: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 16,
+    borderColor: Colors.goldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[16],
+    backgroundColor: Colors.surfaceWarm,
+    padding: Spacing.cardPadding,
+  },
+  statusTextBlock: {
+    flex: 1,
+    gap: 3,
   },
-  title: {
-    ...Typography.screenTitle,
+  statusTitle: {
+    fontFamily: FontFamilies.bricolage[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
+  statusDescription: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 12,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
+  footer: {
+    flexDirection: "row",
+    gap: 10,
+    marginTop: 4,
+  },
+  cancelButton: {
+    flex: 1,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+  },
+  cancelButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.burgundy,
+  },
+  saveButton: {
+    flex: 2,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.burgundy,
+    ...Shadows.primaryButton,
+  },
+  saveButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
+    opacity: 0.6,
+  },
 });

diff --git a/app/(admin)/(tabs)/sessions.tsx b/app/(admin)/(tabs)/sessions.tsx
index b37d42eee582cfcbbfbaba8b37d423440c0794ae..df22d2c62a54e17bd6bdbca98213ae4760f430de
--- a/app/(admin)/(tabs)/sessions.tsx
+++ b/app/(admin)/(tabs)/sessions.tsx
@@ -1,12 +1,155 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  FlatList,
+  Pressable,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import { SessionRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { setSessionOpen } from "@/services/admin";
+import { getCurrentWeekDates } from "@/utils/week";
+
+const DAY_LABELS: Record<Day, string> = {
+  sunday: "NED",
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+};
+
+const DAY_NAMES: Record<Day, string> = {
+  sunday: "NEDELJA",
+  monday: "PONEDELJAK",
+  tuesday: "UTORAK",
+  wednesday: "SREDA",
+  thursday: "ČETVRTAK",
+  friday: "PETAK",
+  saturday: "SUBOTA",
+};
+
+const MONTH_NAMES = [
+  "JAN",
+  "FEB",
+  "MAR",
+  "APR",
+  "MAJ",
+  "JUN",
+  "JUL",
+  "AVG",
+  "SEP",
+  "OKT",
+  "NOV",
+  "DEC",
+] as const;
 
 export default function TreninziScreen() {
+  const router = useRouter();
+  const [selectedDay, setSelectedDay] = useState<Day>("monday");
+  const { loading, fetchTrainings, getTrainingsByDay } = useTrainings();
+  const sessions = getTrainingsByDay(selectedDay);
+  const selectedDate = getCurrentWeekDates()[selectedDay];
+  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;
+
+  const toggleSession = async (sessionId: string, open: boolean) => {
+    try {
+      await setSessionOpen(sessionId, open);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Status treninga nije promenjen.");
+    } finally {
+      await fetchTrainings();
+    }
+  };
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Treninzi</Text>
-    </View>
+    <FlatList
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      data={sessions}
+      keyExtractor={(session) => session.id}
+      showsVerticalScrollIndicator={false}
+      ItemSeparatorComponent={() => <View style={styles.listGap} />}
+      ListHeaderComponent={
+        <View style={styles.headerContent}>
+          <View style={styles.titleRow}>
+            <View style={styles.titleBlock}>
+              <Text style={styles.title}>Treninzi</Text>
+              <Text style={styles.subtitle}>
+                {DAY_NAMES[selectedDay]} · {dateLabel}
+              </Text>
+            </View>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/(admin)/training/new")}
+              style={({ pressed }) => [
+                styles.newButton,
+                pressed && styles.buttonPressed,
+              ]}
+            >
+              <Text style={styles.newButtonText}>＋ Novi</Text>
+            </Pressable>
+          </View>
+
+          <View style={styles.daySelector}>
+            {TRAINING_DAYS.map((day) => {
+              const active = selectedDay === day;
+              return (
+                <Pressable
+                  key={day}
+                  onPress={() => setSelectedDay(day)}
+                  style={[
+                    styles.dayChip,
+                    active && styles.dayChipActive,
+                  ]}
+                >
+                  <Text
+                    style={[
+                      styles.dayChipText,
+                      active && styles.dayChipTextActive,
+                    ]}
+                  >
+                    {DAY_LABELS[day]}
+                  </Text>
+                </Pressable>
+              );
+            })}
+          </View>
+
+          {loading && (
+            <ActivityIndicator
+              color={Colors.burgundy}
+              style={styles.loadingIndicator}
+            />
+          )}
+        </View>
+      }
+      ListEmptyComponent={
+        loading ? null : (
+          <Text style={styles.emptyText}>Nema termina za ovaj dan.</Text>
+        )
+      }
+      renderItem={({ item }) => (
+        <SessionRow
+          session={item}
+          bookedCount={item.session_participants.length}
+          onToggleOpen={(open) => void toggleSession(item.id, open)}
+          onPress={() => router.push(`/(admin)/training/${item.id}`)}
+        />
+      )}
+    />
   );
 }
 
@@ -14,11 +157,95 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    flexGrow: 1,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  headerContent: {
+    gap: 18,
+    marginBottom: 16,
+  },
+  titleRow: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 12,
   },
+  titleBlock: {
+    flex: 1,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
     color: Colors.ink,
   },
+  subtitle: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  newButton: {
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.burgundy,
+    paddingHorizontal: 14,
+    paddingVertical: 9,
+    ...Shadows.primaryButton,
+  },
+  newButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 13,
+    fontWeight: "700",
+    color: Colors.surface,
+  },
+  buttonPressed: {
+    opacity: 0.85,
+  },
+  daySelector: {
+    flexDirection: "row",
+    justifyContent: "space-between",
+    gap: 5,
+  },
+  dayChip: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 36,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.surface,
+  },
+  dayChipActive: {
+    borderColor: Colors.burgundy,
+    backgroundColor: Colors.burgundy,
+    ...Shadows.activeDay,
+  },
+  dayChipText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  dayChipTextActive: {
+    color: Colors.surface,
+  },
+  loadingIndicator: {
+    marginTop: 10,
+  },
+  listGap: {
+    height: 10,
+  },
+  emptyText: {
+    marginTop: 48,
+    textAlign: "center",
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
 });
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 8af74755eb930ef1aea5ab7c7c6df27230debb82..d750a54b7f9ba61a558953849e34bda2533339a1
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -1,319 +1,296 @@
+import { useCallback, useEffect, useMemo, useState } from "react";
 import {
-  View,
-  Text,
-  StyleSheet,
+  ActivityIndicator,
+  Alert,
   FlatList,
-  TextInput,
   Modal,
-  Alert,
-  ActivityIndicator,
   Pressable,
-  ScrollView,
-  KeyboardAvoidingView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
 } from "react-native";
-import { useEffect, useState } from "react";
+
+import { FilterChips, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import {
-  listUsers,
-  updateUser,
-  deleteUser,
-  AdminUser,
-  UpdateUserPatch,
-} from "@/services/admin";
-import UserRow from "@/components/admin/UserRow";
-import FilterChips from "@/components/admin/FilterChips";
+import { deleteUser, listUsers, updateUser } from "@/services/admin";
+import type { AdminUser, UpdateUserPatch } from "@/services/admin";
 
-type FilterKey = "svi" | "aktivni" | "admini";
+type UserFilter = "svi" | "aktivni" | "admini";
+type UserRole = AdminUser["role"];
 
+const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
+  { key: "svi", label: "Svi" },
+  { key: "aktivni", label: "Aktivni" },
+  { key: "admini", label: "Admini" },
+];
+
+const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
+  { key: "user", label: "Član" },
+  { key: "admin", label: "Admin" },
+];
+
 export default function KorisniciScreen() {
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
+  const [hasError, setHasError] = useState(false);
+  const [search, setSearch] = useState("");
+  const [filter, setFilter] = useState<UserFilter>("svi");
   const [expandedId, setExpandedId] = useState<string | null>(null);
-  const [searchText, setSearchText] = useState("");
-  const [filter, setFilter] = useState<FilterKey>("svi");
   const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
-  const [editModal, setEditModal] = useState(false);
-  const [editForm, setEditForm] = useState({
-    first_name: "",
-    last_name: "",
-    role: "user" as "user" | "admin",
-    max_sessions_per_week: 0,
-  });
+  const [firstName, setFirstName] = useState("");
+  const [lastName, setLastName] = useState("");
+  const [role, setRole] = useState<UserRole>("user");
+  const [maxSessions, setMaxSessions] = useState(0);
   const [saving, setSaving] = useState(false);
 
-  // Load users on mount
-  useEffect(() => {
-    fetchUsers();
-  }, []);
+  const fetchUsers = useCallback(async () => {
+    setLoading(true);
+    setHasError(false);
 
-  const fetchUsers = async () => {
-    setLoading(true);
-    setError(null);
     try {
-      const data = await listUsers();
-      setUsers(data);
-    } catch (err) {
-      setError("Greška pri učitavanju");
-      if (__DEV__) console.error(err);
+      setUsers(await listUsers());
+    } catch (error: unknown) {
+      console.error(error);
+      setHasError(true);
     } finally {
       setLoading(false);
     }
-  };
+  }, []);
 
-  // Filter logic
-  const filteredUsers = users
-    .filter((u) => {
-      const searchLower = searchText.toLowerCase();
-      const matchesSearch =
-        u.first_name.toLowerCase().includes(searchLower) ||
-        (u.last_name?.toLowerCase().includes(searchLower) ?? false) ||
-        u.email.toLowerCase().includes(searchLower);
+  useEffect(() => {
+    void fetchUsers();
+  }, [fetchUsers]);
 
-      if (!matchesSearch) return false;
+  const filteredUsers = useMemo(() => {
+    const query = search.trim().toLocaleLowerCase();
+
+    return users.filter((user) => {
+      const matchesFilter =
+        filter === "svi" ||
+        (filter === "aktivni" && user.enabled !== false) ||
+        (filter === "admini" && user.role === "admin");
+      const searchable = `${user.first_name} ${user.last_name ?? ""} ${user.email}`
+        .toLocaleLowerCase();
 
-      if (filter === "aktivni") return u.enabled !== false;
-      if (filter === "admini") return u.role === "admin";
-      return true;
+      return matchesFilter && searchable.includes(query);
     });
+  }, [filter, search, users]);
 
-  // Edit modal handlers
-  const onEdit = (user: AdminUser) => {
+  const openEditModal = (user: AdminUser) => {
     setEditingUser(user);
-    setEditForm({
-      first_name: user.first_name,
-      last_name: user.last_name || "",
-      role: user.role,
-      max_sessions_per_week: user.max_sessions_per_week,
-    });
-    setEditModal(true);
+    setFirstName(user.first_name);
+    setLastName(user.last_name ?? "");
+    setRole(user.role);
+    setMaxSessions(user.max_sessions_per_week);
   };
 
-  const onRemove = (user: AdminUser) => {
-    Alert.alert(
-      "Ukloni korisnika",
-      `${user.first_name} ${user.last_name || ""} i sve njegove rezervacije će biti uklonjeni.`,
-      [
-        { text: "Otkaži", style: "cancel" },
-        {
-          text: "Ukloni",
-          onPress: async () => {
-            try {
-              await deleteUser(user.id);
-              await fetchUsers();
-            } catch (err) {
-              Alert.alert("Greška", "Nije moguće obrisati korisnika");
-              if (__DEV__) console.error(err);
-            }
-          },
-          style: "destructive",
-        },
-      ]
-    );
+  const closeEditModal = () => {
+    if (!saving) setEditingUser(null);
   };
 
-  const onSaveEdit = async () => {
+  const saveUser = async () => {
     if (!editingUser) return;
 
+    const patch: UpdateUserPatch = {
+      first_name: firstName.trim(),
+      last_name: lastName.trim(),
+      role,
+      max_sessions_per_week: maxSessions,
+    };
+
     setSaving(true);
     try {
-      const patch: UpdateUserPatch = {
-        first_name: editForm.first_name || null,
-        last_name: editForm.last_name || null,
-        role: editForm.role,
-        max_sessions_per_week: editForm.max_sessions_per_week,
-      };
       await updateUser(editingUser.id, patch);
-      setEditModal(false);
       setEditingUser(null);
       await fetchUsers();
-    } catch (err) {
-      Alert.alert("Greška", "Nije moguće sačuvati promene");
-      if (__DEV__) console.error(err);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
+      await fetchUsers();
     } finally {
       setSaving(false);
     }
   };
 
-  if (loading) {
+  const removeUser = async (user: AdminUser) => {
+    try {
+      await deleteUser(user.id);
+      setExpandedId(null);
+      await fetchUsers();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Korisnik nije uklonjen.");
+      await fetchUsers();
+    }
+  };
+
+  const confirmRemove = (user: AdminUser) => {
+    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();
+
+    Alert.alert(
+      "Ukloni korisnika",
+      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
+      [
+        { text: "Otkaži", style: "cancel" },
+        {
+          text: "Ukloni",
+          style: "destructive",
+          onPress: () => void removeUser(user),
+        },
+      ],
+    );
+  };
+
+  if (loading && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <ActivityIndicator size="large" color={Colors.burgundy} />
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
       </View>
     );
   }
 
-  if (error) {
+  if (hasError && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <Text style={styles.errorText}>{error}</Text>
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
       </View>
     );
   }
 
   return (
-    <View style={styles.screen}>
-      {/* Header */}
-      <View style={styles.header}>
-        <Text style={styles.headerTitle}>Korisnici</Text>
-        <Text style={styles.headerSubtitle}>{users.length} članova</Text>
-      </View>
-
-      {/* Search */}
-      <TextInput
-        style={styles.searchInput}
-        placeholder="Pretraži članove…"
-        placeholderTextColor={Colors.inkMuted}
-        value={searchText}
-        onChangeText={setSearchText}
-      />
-
-      {/* Filter chips */}
-      <View style={styles.filterContainer}>
-        <FilterChips<FilterKey>
-          options={[
-            { key: "svi", label: "Svi" },
-            { key: "aktivni", label: "Aktivni" },
-            { key: "admini", label: "Admini" },
-          ]}
-          value={filter}
-          onChange={setFilter}
-        />
-      </View>
-
-      {/* User list */}
+    <>
       <FlatList
+        style={styles.screen}
+        contentContainerStyle={styles.content}
         data={filteredUsers}
-        keyExtractor={(u) => u.id}
+        keyExtractor={(user) => user.id}
+        showsVerticalScrollIndicator={false}
+        ItemSeparatorComponent={() => <View style={styles.listGap} />}
+        ListHeaderComponent={
+          <View style={styles.headerContent}>
+            <View>
+              <Text style={styles.title}>Korisnici</Text>
+              <Text style={styles.subtitle}>{users.length} članova</Text>
+            </View>
+            <TextInput
+              value={search}
+              onChangeText={setSearch}
+              placeholder="Pretraži članove…"
+              placeholderTextColor={Colors.inkFaint}
+              style={styles.searchInput}
+              autoCapitalize="none"
+              autoCorrect={false}
+            />
+            <FilterChips
+              options={FILTER_OPTIONS}
+              value={filter}
+              onChange={setFilter}
+            />
+          </View>
+        }
         renderItem={({ item, index }) => (
           <UserRow
             user={item}
             expanded={expandedId === item.id}
             onToggleExpand={() =>
-              setExpandedId(expandedId === item.id ? null : item.id)
+              setExpandedId((current) => (current === item.id ? null : item.id))
             }
-            onEdit={() => onEdit(item)}
-            onRemove={() => onRemove(item)}
+            onEdit={() => openEditModal(item)}
+            onRemove={() => confirmRemove(item)}
             tintIndex={index % 3}
           />
         )}
-        contentContainerStyle={styles.listContent}
-        scrollEnabled={false}
       />
 
-      {/* Edit Modal */}
       <Modal
         animationType="slide"
         transparent
-        visible={editModal}
-        onRequestClose={() => setEditModal(false)}
+        visible={editingUser !== null}
+        onRequestClose={closeEditModal}
       >
         <View style={styles.modalOverlay}>
-          <KeyboardAvoidingView behavior="padding" style={styles.modal}>
-            <ScrollView
-              contentContainerStyle={styles.modalContent}
-              keyboardShouldPersistTaps="handled"
-            >
-              <Text style={styles.modalTitle}>Izmena korisnika</Text>
+          <View style={styles.modalCard}>
+            <Text style={styles.modalTitle}>Izmena korisnika</Text>
 
-              {/* first_name */}
-              <Text style={styles.label}>IME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>IME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.first_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, first_name: v }))
-                }
+                value={firstName}
+                onChangeText={setFirstName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* last_name */}
-              <Text style={styles.label}>PREZIME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>PREZIME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.last_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, last_name: v }))
-                }
+                value={lastName}
+                onChangeText={setLastName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* role */}
-              <Text style={styles.label}>ULOGA</Text>
-              <FilterChips<"user" | "admin">
-                options={[
-                  { key: "user", label: "Član" },
-                  { key: "admin", label: "Admin" },
-                ]}
-                value={editForm.role}
-                onChange={(v) => setEditForm((p) => ({ ...p, role: v }))}
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>ULOGA</Text>
+              <FilterChips
+                options={ROLE_OPTIONS}
+                value={role}
+                onChange={setRole}
               />
+            </View>
 
-              {/* max_sessions_per_week stepper */}
-              <Text style={styles.label}>NEDELJNI LIMIT</Text>
-              <View style={styles.stepperContainer}>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
+              <View style={styles.stepper}>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.max(
-                        0,
-                        p.max_sessions_per_week - 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 0}
+                  onPress={() => setMaxSessions((value) => Math.max(0, value - 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>−</Text>
+                  <Text style={styles.stepButtonText}>−</Text>
                 </Pressable>
-                <Text style={styles.stepperValue}>
-                  {editForm.max_sessions_per_week}
-                </Text>
+                <Text style={styles.stepValue}>{maxSessions}</Text>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.min(
-                        14,
-                        p.max_sessions_per_week + 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 14}
+                  onPress={() => setMaxSessions((value) => Math.min(14, value + 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>+</Text>
+                  <Text style={styles.stepButtonText}>＋</Text>
                 </Pressable>
               </View>
+            </View>
 
-              {/* Footer actions */}
-              <View style={styles.modalFooter}>
-                <Pressable
-                  onPress={() => setEditModal(false)}
-                  style={styles.cancelBtn}
-                  disabled={saving}
-                >
-                  <Text style={styles.cancelBtnText}>Otkaži</Text>
-                </Pressable>
-                <Pressable
-                  onPress={onSaveEdit}
-                  style={[
-                    styles.saveBtn,
-                    saving && styles.saveBtnDisabled,
-                  ]}
-                  disabled={saving}
-                >
-                  {saving ? (
-                    <ActivityIndicator size="small" color={Colors.surface} />
-                  ) : (
-                    <Text style={styles.saveBtnText}>Sačuvaj</Text>
-                  )}
-                </Pressable>
-              </View>
-            </ScrollView>
-          </KeyboardAvoidingView>
+            <View style={styles.modalFooter}>
+              <Pressable
+                onPress={closeEditModal}
+                disabled={saving}
+                style={styles.cancelButton}
+              >
+                <Text style={styles.cancelButtonText}>Otkaži</Text>
+              </Pressable>
+              <Pressable
+                onPress={() => void saveUser()}
+                disabled={saving}
+                style={[styles.saveButton, saving && styles.buttonDisabled]}
+              >
+                {saving ? (
+                  <ActivityIndicator color={Colors.surface} />
+                ) : (
+                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
+                )}
+              </Pressable>
+            </View>
+          </View>
         </View>
       </Modal>
-    </View>
+    </>
   );
 }
 
@@ -321,33 +298,37 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    paddingHorizontal: Spacing.screenHorizontal || 20,
   },
-  centerContainer: {
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  centeredState: {
     flex: 1,
+    alignItems: "center",
     justifyContent: "center",
-    alignItems: "center",
     backgroundColor: Colors.paper,
   },
   errorText: {
-    ...Typography.section,
+    ...Typography.body,
     color: Colors.inkMuted,
   },
-  header: {
-    paddingTop: 20,
-    paddingBottom: 16,
+  headerContent: {
+    gap: 16,
+    marginBottom: 16,
   },
-  headerTitle: {
-    fontFamily: FontFamilies.bricolage[800],
+  title: {
+    ...Typography.screenTitle,
     fontSize: 23,
-    fontWeight: "800",
     color: Colors.ink,
   },
-  headerSubtitle: {
+  subtitle: {
     fontFamily: FontFamilies.hanken[600],
     fontSize: 13,
     fontWeight: "600",
     color: Colors.inkMuted,
+    marginTop: 3,
   },
   searchInput: {
     backgroundColor: Colors.surface,
@@ -360,122 +341,114 @@
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
-    marginBottom: 16,
-  },
-  filterContainer: {
-    marginBottom: 16,
   },
-  listContent: {
-    gap: 12,
-    paddingBottom: 20,
+  listGap: {
+    height: 10,
   },
-  // Modal
   modalOverlay: {
     flex: 1,
-    backgroundColor: "rgba(0, 0, 0, 0.5)",
     justifyContent: "flex-end",
+    backgroundColor: "rgba(34, 31, 43, 0.35)",
   },
-  modal: {
-    flex: 1,
-    maxHeight: "90%",
-    backgroundColor: Colors.paper,
-    borderTopLeftRadius: Radii.tile[24],
-    borderTopRightRadius: Radii.tile[24],
-  },
-  modalContent: {
-    padding: Spacing.cardPadding || 20,
+  modalCard: {
+    backgroundColor: Colors.surface,
+    borderTopLeftRadius: Radii.card,
+    borderTopRightRadius: Radii.card,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 24,
+    paddingBottom: 28,
     gap: 16,
+    ...Shadows.card,
   },
   modalTitle: {
     fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
+    fontSize: 21,
     fontWeight: "800",
     color: Colors.ink,
-    marginBottom: 8,
   },
-  label: {
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldLabel: {
     fontFamily: FontFamilies.hanken[700],
-    fontSize: 11,
+    fontSize: 10,
     fontWeight: "700",
     letterSpacing: 1,
-    textTransform: "uppercase",
-    color: Colors.ink,
+    color: Colors.inkMuted,
   },
-  input: {
+  fieldInput: {
     backgroundColor: Colors.surface,
     borderColor: Colors.fieldBorder,
     borderWidth: 1,
     borderRadius: Radii.tile[14],
     paddingHorizontal: 12,
-    paddingVertical: 12,
+    paddingVertical: 11,
     fontFamily: FontFamilies.hanken[600],
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
   },
-  stepperContainer: {
+  stepper: {
+    alignSelf: "flex-start",
     flexDirection: "row",
     alignItems: "center",
-    gap: 12,
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
   },
-  stepperBtn: {
-    width: 40,
-    height: 40,
-    borderRadius: Radii.tile[12],
-    backgroundColor: Colors.surfaceMuted,
-    justifyContent: "center",
+  stepButton: {
+    width: 44,
+    height: 42,
     alignItems: "center",
+    justifyContent: "center",
   },
-  stepperBtnText: {
-    fontFamily: FontFamilies.hanken[800],
-    fontSize: 18,
-    fontWeight: "800",
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 20,
+    fontWeight: "700",
     color: Colors.burgundy,
   },
-  stepperValue: {
-    flex: 1,
+  stepValue: {
+    minWidth: 44,
     textAlign: "center",
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 16,
-    fontWeight: "800",
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
   modalFooter: {
     flexDirection: "row",
-    gap: 12,
-    marginTop: 16,
+    gap: 10,
+    marginTop: 4,
   },
-  cancelBtn: {
+  cancelButton: {
     flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
-    borderColor: Colors.burgundyBorder,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderColor: Colors.burgundy,
     borderWidth: 1,
-    justifyContent: "center",
-    alignItems: "center",
+    borderRadius: Radii.tile[14],
   },
-  cancelBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
+  cancelButtonText: {
+    ...Typography.primaryButtonCompact,
     color: Colors.burgundy,
   },
-  saveBtn: {
-    flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
+  saveButton: {
+    flex: 2,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderRadius: Radii.tile[14],
     backgroundColor: Colors.burgundy,
-    justifyContent: "center",
-    alignItems: "center",
-    ...Shadows.primaryButton,
   },
-  saveBtnDisabled: {
+  saveButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
     opacity: 0.6,
-  },
-  saveBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
-    color: Colors.surface,
   },
 });
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 5ff9c08c6c36ad11d37ae2b56f1e48e9638ab6e3..370de64bb181162ed7439dfdb42d667232871d81
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -1,11 +1,270 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
+} from "react-native";
+import { useLocalSearchParams, useRouter } from "expo-router";
+
+import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { upsertSession } from "@/services/admin";
+import type { UpsertSessionInput } from "@/services/admin";
 
+const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map((day) => ({
+  key: day,
+  label: {
+    monday: "PON",
+    tuesday: "UTO",
+    wednesday: "SRE",
+    thursday: "ČET",
+    friday: "PET",
+    saturday: "SUB",
+    sunday: "NED",
+  }[day],
+}));
+
 export default function TrainingDetailScreen() {
+  const router = useRouter();
+  const { id } = useLocalSearchParams<{ id: string }>();
+  const isNew = id === "new";
+  const { trainings, loading, fetchTrainings } = useTrainings();
+  const training = trainings.find((item) => item.id === id);
+  const [title, setTitle] = useState("");
+  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
+  const [time, setTime] = useState("");
+  const [room, setRoom] = useState("");
+  const [durationMin, setDurationMin] = useState<number | null>(null);
+  const [maxParticipants, setMaxParticipants] = useState(10);
+  const [isOpen, setIsOpen] = useState(true);
+  const [submitting, setSubmitting] = useState(false);
+  const [initializedId, setInitializedId] = useState<string | null>(null);
+
+  useEffect(() => {
+    if (!training || initializedId === training.id) return;
+
+    setTitle(training.title);
+    setDayOfWeek(
+      TRAINING_DAYS.includes(training.day_of_week as Day)
+        ? (training.day_of_week as Day)
+        : "monday",
+    );
+    setTime(training.time);
+    setRoom(training.room ?? "");
+    setDurationMin(training.duration_min);
+    setMaxParticipants(
+      Math.min(50, Math.max(1, training.max_participants)),
+    );
+    setIsOpen(training.is_open);
+    setInitializedId(training.id);
+  }, [initializedId, training]);
+
+  const submit = async () => {
+    const normalizedTitle = title.trim();
+    const normalizedTime = time.trim();
+
+    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+      Alert.alert(
+        "Proverite podatke",
+        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
+      );
+      return;
+    }
+
+    const input: UpsertSessionInput = {
+      id: isNew ? null : id,
+      title: normalizedTitle,
+      day_of_week: dayOfWeek,
+      time: normalizedTime,
+      room: room.trim() || null,
+      duration_min: durationMin,
+      max_participants: maxParticipants,
+      is_open: isOpen,
+    };
+
+    setSubmitting(true);
+    try {
+      await upsertSession(input);
+      await fetchTrainings();
+      router.back();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Trening nije sačuvan.");
+      await fetchTrainings();
+    } finally {
+      setSubmitting(false);
+    }
+  };
+
+  if (!isNew && loading && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (!isNew && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
+        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
+          <Text style={styles.notFoundButtonText}>Nazad</Text>
+        </Pressable>
+      </View>
+    );
+  }
+
   return (
     <View style={styles.screen}>
-      <Text style={styles.title}>Training Detail</Text>
+      <View style={styles.navBar}>
+        <Pressable
+          accessibilityRole="button"
+          onPress={() => router.back()}
+          style={styles.backButton}
+        >
+          <Text style={styles.backChevron}>‹</Text>
+        </Pressable>
+        <Text style={styles.navTitle}>
+          {isNew ? "Novi trening" : "Izmena treninga"}
+        </Text>
+        <View style={styles.navSpacer} />
+      </View>
+
+      <ScrollView
+        style={styles.formScroll}
+        contentContainerStyle={styles.formContent}
+        keyboardShouldPersistTaps="handled"
+        showsVerticalScrollIndicator={false}
+      >
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
+          <TextInput
+            value={title}
+            onChangeText={setTitle}
+            editable={!submitting}
+            style={styles.input}
+          />
+        </View>
+
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>DAN</Text>
+          <FilterChips
+            options={DAY_OPTIONS}
+            value={dayOfWeek}
+            onChange={setDayOfWeek}
+          />
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>VREME</Text>
+            <TextInput
+              value={time}
+              onChangeText={setTime}
+              placeholder="18:00"
+              placeholderTextColor={Colors.inkFaint}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
+            <TextInput
+              value={durationMin?.toString() ?? ""}
+              onChangeText={(value) =>
+                setDurationMin(
+                  value === "" ? null : Number(value.replace(/\D/g, "")),
+                )
+              }
+              keyboardType="number-pad"
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>SALA</Text>
+            <TextInput
+              value={room}
+              onChangeText={setRoom}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
+            <View style={styles.stepper}>
+              <Pressable
+                disabled={submitting || maxParticipants === 1}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.max(1, value - 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>−</Text>
+              </Pressable>
+              <Text style={styles.stepValue}>{maxParticipants}</Text>
+              <Pressable
+                disabled={submitting || maxParticipants === 50}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.min(50, value + 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>＋</Text>
+              </Pressable>
+            </View>
+          </View>
+        </View>
+
+        <View style={styles.statusCard}>
+          <View style={styles.statusTextBlock}>
+            <Text style={styles.statusTitle}>Status slota</Text>
+            <Text style={styles.statusDescription}>
+              Otvoren za prijave članova
+            </Text>
+          </View>
+          <Toggle
+            value={isOpen}
+            onValueChange={setIsOpen}
+            disabled={submitting}
+          />
+        </View>
+
+        <View style={styles.footer}>
+          <Pressable
+            onPress={() => router.back()}
+            disabled={submitting}
+            style={styles.cancelButton}
+          >
+            <Text style={styles.cancelButtonText}>Otkaži</Text>
+          </Pressable>
+          <Pressable
+            onPress={() => void submit()}
+            disabled={submitting}
+            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+          >
+            {submitting ? (
+              <ActivityIndicator color={Colors.surface} />
+            ) : (
+              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
+            )}
+          </Pressable>
+        </View>
+      </ScrollView>
     </View>
   );
 }
@@ -14,11 +273,194 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
+  },
+  centeredState: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    gap: 16,
+    backgroundColor: Colors.paper,
+  },
+  notFoundText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
+  notFoundButton: {
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    paddingHorizontal: 18,
+    paddingVertical: 10,
+  },
+  notFoundButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.burgundy,
+  },
+  navBar: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 16,
+    paddingBottom: 12,
+    borderBottomColor: Colors.border,
+    borderBottomWidth: 1,
+  },
+  backButton: {
+    width: 38,
+    height: 38,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    backgroundColor: Colors.surface,
+  },
+  backChevron: {
+    fontFamily: FontFamilies.hanken[500],
+    fontSize: 31,
+    fontWeight: "500",
+    lineHeight: 32,
+    color: Colors.burgundy,
+  },
+  navTitle: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 19,
+    fontWeight: "800",
+    color: Colors.ink,
+  },
+  navSpacer: {
+    width: 38,
+    height: 38,
+  },
+  formScroll: {
+    flex: 1,
+  },
+  formContent: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 22,
+    paddingBottom: 28,
+    gap: 20,
+  },
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  columnField: {
+    flex: 1,
+    gap: 7,
+  },
+  fieldLabel: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    letterSpacing: 1,
+    color: Colors.inkMuted,
+  },
+  input: {
+    minHeight: 46,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    paddingHorizontal: 12,
+    paddingVertical: 11,
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 14,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  stepper: {
+    minHeight: 46,
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
+  },
+  stepButton: {
+    width: 38,
+    height: 44,
+    alignItems: "center",
     justifyContent: "center",
+  },
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 19,
+    fontWeight: "700",
+    color: Colors.burgundy,
+  },
+  stepValue: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusCard: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 16,
+    borderColor: Colors.goldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[16],
+    backgroundColor: Colors.surfaceWarm,
+    padding: Spacing.cardPadding,
+  },
+  statusTextBlock: {
+    flex: 1,
+    gap: 3,
   },
-  title: {
-    ...Typography.screenTitle,
+  statusTitle: {
+    fontFamily: FontFamilies.bricolage[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
+  statusDescription: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 12,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
+  footer: {
+    flexDirection: "row",
+    gap: 10,
+    marginTop: 4,
+  },
+  cancelButton: {
+    flex: 1,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+  },
+  cancelButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.burgundy,
+  },
+  saveButton: {
+    flex: 2,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.burgundy,
+    ...Shadows.primaryButton,
+  },
+  saveButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
+    opacity: 0.6,
+  },
 });

exec
/bin/zsh -lc "npx prettier --write 'app/(admin)/training/[id].tsx' && npx tsc --noEmit && npx eslint 'app/(admin)' src/components/admin && rg -n \"AdminHeader\" 'app/(admin)/(tabs)/users.tsx' 'app/(admin)/(tabs)/sessions.tsx' 'app/(admin)/training/[id].tsx' || true
git status --short -- 'app/(admin)/(tabs)/users.tsx' 'app/(admin)/(tabs)/sessions.tsx' 'app/(admin)/training/[id].tsx'" in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/(tabs)/sessions.tsx b/app/(admin)/(tabs)/sessions.tsx
index b37d42eee582cfcbbfbaba8b37d423440c0794ae..df22d2c62a54e17bd6bdbca98213ae4760f430de
--- a/app/(admin)/(tabs)/sessions.tsx
+++ b/app/(admin)/(tabs)/sessions.tsx
@@ -1,12 +1,155 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  FlatList,
+  Pressable,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import { SessionRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { setSessionOpen } from "@/services/admin";
+import { getCurrentWeekDates } from "@/utils/week";
+
+const DAY_LABELS: Record<Day, string> = {
+  sunday: "NED",
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+};
+
+const DAY_NAMES: Record<Day, string> = {
+  sunday: "NEDELJA",
+  monday: "PONEDELJAK",
+  tuesday: "UTORAK",
+  wednesday: "SREDA",
+  thursday: "ČETVRTAK",
+  friday: "PETAK",
+  saturday: "SUBOTA",
+};
+
+const MONTH_NAMES = [
+  "JAN",
+  "FEB",
+  "MAR",
+  "APR",
+  "MAJ",
+  "JUN",
+  "JUL",
+  "AVG",
+  "SEP",
+  "OKT",
+  "NOV",
+  "DEC",
+] as const;
 
 export default function TreninziScreen() {
+  const router = useRouter();
+  const [selectedDay, setSelectedDay] = useState<Day>("monday");
+  const { loading, fetchTrainings, getTrainingsByDay } = useTrainings();
+  const sessions = getTrainingsByDay(selectedDay);
+  const selectedDate = getCurrentWeekDates()[selectedDay];
+  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;
+
+  const toggleSession = async (sessionId: string, open: boolean) => {
+    try {
+      await setSessionOpen(sessionId, open);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Status treninga nije promenjen.");
+    } finally {
+      await fetchTrainings();
+    }
+  };
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Treninzi</Text>
-    </View>
+    <FlatList
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      data={sessions}
+      keyExtractor={(session) => session.id}
+      showsVerticalScrollIndicator={false}
+      ItemSeparatorComponent={() => <View style={styles.listGap} />}
+      ListHeaderComponent={
+        <View style={styles.headerContent}>
+          <View style={styles.titleRow}>
+            <View style={styles.titleBlock}>
+              <Text style={styles.title}>Treninzi</Text>
+              <Text style={styles.subtitle}>
+                {DAY_NAMES[selectedDay]} · {dateLabel}
+              </Text>
+            </View>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/(admin)/training/new")}
+              style={({ pressed }) => [
+                styles.newButton,
+                pressed && styles.buttonPressed,
+              ]}
+            >
+              <Text style={styles.newButtonText}>＋ Novi</Text>
+            </Pressable>
+          </View>
+
+          <View style={styles.daySelector}>
+            {TRAINING_DAYS.map((day) => {
+              const active = selectedDay === day;
+              return (
+                <Pressable
+                  key={day}
+                  onPress={() => setSelectedDay(day)}
+                  style={[
+                    styles.dayChip,
+                    active && styles.dayChipActive,
+                  ]}
+                >
+                  <Text
+                    style={[
+                      styles.dayChipText,
+                      active && styles.dayChipTextActive,
+                    ]}
+                  >
+                    {DAY_LABELS[day]}
+                  </Text>
+                </Pressable>
+              );
+            })}
+          </View>
+
+          {loading && (
+            <ActivityIndicator
+              color={Colors.burgundy}
+              style={styles.loadingIndicator}
+            />
+          )}
+        </View>
+      }
+      ListEmptyComponent={
+        loading ? null : (
+          <Text style={styles.emptyText}>Nema termina za ovaj dan.</Text>
+        )
+      }
+      renderItem={({ item }) => (
+        <SessionRow
+          session={item}
+          bookedCount={item.session_participants.length}
+          onToggleOpen={(open) => void toggleSession(item.id, open)}
+          onPress={() => router.push(`/(admin)/training/${item.id}`)}
+        />
+      )}
+    />
   );
 }
 
@@ -14,11 +157,95 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    flexGrow: 1,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  headerContent: {
+    gap: 18,
+    marginBottom: 16,
+  },
+  titleRow: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 12,
   },
+  titleBlock: {
+    flex: 1,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
     color: Colors.ink,
   },
+  subtitle: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  newButton: {
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.burgundy,
+    paddingHorizontal: 14,
+    paddingVertical: 9,
+    ...Shadows.primaryButton,
+  },
+  newButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 13,
+    fontWeight: "700",
+    color: Colors.surface,
+  },
+  buttonPressed: {
+    opacity: 0.85,
+  },
+  daySelector: {
+    flexDirection: "row",
+    justifyContent: "space-between",
+    gap: 5,
+  },
+  dayChip: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 36,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.surface,
+  },
+  dayChipActive: {
+    borderColor: Colors.burgundy,
+    backgroundColor: Colors.burgundy,
+    ...Shadows.activeDay,
+  },
+  dayChipText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  dayChipTextActive: {
+    color: Colors.surface,
+  },
+  loadingIndicator: {
+    marginTop: 10,
+  },
+  listGap: {
+    height: 10,
+  },
+  emptyText: {
+    marginTop: 48,
+    textAlign: "center",
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
 });
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 8af74755eb930ef1aea5ab7c7c6df27230debb82..d750a54b7f9ba61a558953849e34bda2533339a1
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -1,319 +1,296 @@
+import { useCallback, useEffect, useMemo, useState } from "react";
 import {
-  View,
-  Text,
-  StyleSheet,
+  ActivityIndicator,
+  Alert,
   FlatList,
-  TextInput,
   Modal,
-  Alert,
-  ActivityIndicator,
   Pressable,
-  ScrollView,
-  KeyboardAvoidingView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
 } from "react-native";
-import { useEffect, useState } from "react";
+
+import { FilterChips, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import {
-  listUsers,
-  updateUser,
-  deleteUser,
-  AdminUser,
-  UpdateUserPatch,
-} from "@/services/admin";
-import UserRow from "@/components/admin/UserRow";
-import FilterChips from "@/components/admin/FilterChips";
+import { deleteUser, listUsers, updateUser } from "@/services/admin";
+import type { AdminUser, UpdateUserPatch } from "@/services/admin";
 
-type FilterKey = "svi" | "aktivni" | "admini";
+type UserFilter = "svi" | "aktivni" | "admini";
+type UserRole = AdminUser["role"];
 
+const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
+  { key: "svi", label: "Svi" },
+  { key: "aktivni", label: "Aktivni" },
+  { key: "admini", label: "Admini" },
+];
+
+const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
+  { key: "user", label: "Član" },
+  { key: "admin", label: "Admin" },
+];
+
 export default function KorisniciScreen() {
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
+  const [hasError, setHasError] = useState(false);
+  const [search, setSearch] = useState("");
+  const [filter, setFilter] = useState<UserFilter>("svi");
   const [expandedId, setExpandedId] = useState<string | null>(null);
-  const [searchText, setSearchText] = useState("");
-  const [filter, setFilter] = useState<FilterKey>("svi");
   const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
-  const [editModal, setEditModal] = useState(false);
-  const [editForm, setEditForm] = useState({
-    first_name: "",
-    last_name: "",
-    role: "user" as "user" | "admin",
-    max_sessions_per_week: 0,
-  });
+  const [firstName, setFirstName] = useState("");
+  const [lastName, setLastName] = useState("");
+  const [role, setRole] = useState<UserRole>("user");
+  const [maxSessions, setMaxSessions] = useState(0);
   const [saving, setSaving] = useState(false);
 
-  // Load users on mount
-  useEffect(() => {
-    fetchUsers();
-  }, []);
+  const fetchUsers = useCallback(async () => {
+    setLoading(true);
+    setHasError(false);
 
-  const fetchUsers = async () => {
-    setLoading(true);
-    setError(null);
     try {
-      const data = await listUsers();
-      setUsers(data);
-    } catch (err) {
-      setError("Greška pri učitavanju");
-      if (__DEV__) console.error(err);
+      setUsers(await listUsers());
+    } catch (error: unknown) {
+      console.error(error);
+      setHasError(true);
     } finally {
       setLoading(false);
     }
-  };
+  }, []);
 
-  // Filter logic
-  const filteredUsers = users
-    .filter((u) => {
-      const searchLower = searchText.toLowerCase();
-      const matchesSearch =
-        u.first_name.toLowerCase().includes(searchLower) ||
-        (u.last_name?.toLowerCase().includes(searchLower) ?? false) ||
-        u.email.toLowerCase().includes(searchLower);
+  useEffect(() => {
+    void fetchUsers();
+  }, [fetchUsers]);
 
-      if (!matchesSearch) return false;
+  const filteredUsers = useMemo(() => {
+    const query = search.trim().toLocaleLowerCase();
+
+    return users.filter((user) => {
+      const matchesFilter =
+        filter === "svi" ||
+        (filter === "aktivni" && user.enabled !== false) ||
+        (filter === "admini" && user.role === "admin");
+      const searchable = `${user.first_name} ${user.last_name ?? ""} ${user.email}`
+        .toLocaleLowerCase();
 
-      if (filter === "aktivni") return u.enabled !== false;
-      if (filter === "admini") return u.role === "admin";
-      return true;
+      return matchesFilter && searchable.includes(query);
     });
+  }, [filter, search, users]);
 
-  // Edit modal handlers
-  const onEdit = (user: AdminUser) => {
+  const openEditModal = (user: AdminUser) => {
     setEditingUser(user);
-    setEditForm({
-      first_name: user.first_name,
-      last_name: user.last_name || "",
-      role: user.role,
-      max_sessions_per_week: user.max_sessions_per_week,
-    });
-    setEditModal(true);
+    setFirstName(user.first_name);
+    setLastName(user.last_name ?? "");
+    setRole(user.role);
+    setMaxSessions(user.max_sessions_per_week);
   };
 
-  const onRemove = (user: AdminUser) => {
-    Alert.alert(
-      "Ukloni korisnika",
-      `${user.first_name} ${user.last_name || ""} i sve njegove rezervacije će biti uklonjeni.`,
-      [
-        { text: "Otkaži", style: "cancel" },
-        {
-          text: "Ukloni",
-          onPress: async () => {
-            try {
-              await deleteUser(user.id);
-              await fetchUsers();
-            } catch (err) {
-              Alert.alert("Greška", "Nije moguće obrisati korisnika");
-              if (__DEV__) console.error(err);
-            }
-          },
-          style: "destructive",
-        },
-      ]
-    );
+  const closeEditModal = () => {
+    if (!saving) setEditingUser(null);
   };
 
-  const onSaveEdit = async () => {
+  const saveUser = async () => {
     if (!editingUser) return;
 
+    const patch: UpdateUserPatch = {
+      first_name: firstName.trim(),
+      last_name: lastName.trim(),
+      role,
+      max_sessions_per_week: maxSessions,
+    };
+
     setSaving(true);
     try {
-      const patch: UpdateUserPatch = {
-        first_name: editForm.first_name || null,
-        last_name: editForm.last_name || null,
-        role: editForm.role,
-        max_sessions_per_week: editForm.max_sessions_per_week,
-      };
       await updateUser(editingUser.id, patch);
-      setEditModal(false);
       setEditingUser(null);
       await fetchUsers();
-    } catch (err) {
-      Alert.alert("Greška", "Nije moguće sačuvati promene");
-      if (__DEV__) console.error(err);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
+      await fetchUsers();
     } finally {
       setSaving(false);
     }
   };
 
-  if (loading) {
+  const removeUser = async (user: AdminUser) => {
+    try {
+      await deleteUser(user.id);
+      setExpandedId(null);
+      await fetchUsers();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Korisnik nije uklonjen.");
+      await fetchUsers();
+    }
+  };
+
+  const confirmRemove = (user: AdminUser) => {
+    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();
+
+    Alert.alert(
+      "Ukloni korisnika",
+      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
+      [
+        { text: "Otkaži", style: "cancel" },
+        {
+          text: "Ukloni",
+          style: "destructive",
+          onPress: () => void removeUser(user),
+        },
+      ],
+    );
+  };
+
+  if (loading && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <ActivityIndicator size="large" color={Colors.burgundy} />
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
       </View>
     );
   }
 
-  if (error) {
+  if (hasError && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <Text style={styles.errorText}>{error}</Text>
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
       </View>
     );
   }
 
   return (
-    <View style={styles.screen}>
-      {/* Header */}
-      <View style={styles.header}>
-        <Text style={styles.headerTitle}>Korisnici</Text>
-        <Text style={styles.headerSubtitle}>{users.length} članova</Text>
-      </View>
-
-      {/* Search */}
-      <TextInput
-        style={styles.searchInput}
-        placeholder="Pretraži članove…"
-        placeholderTextColor={Colors.inkMuted}
-        value={searchText}
-        onChangeText={setSearchText}
-      />
-
-      {/* Filter chips */}
-      <View style={styles.filterContainer}>
-        <FilterChips<FilterKey>
-          options={[
-            { key: "svi", label: "Svi" },
-            { key: "aktivni", label: "Aktivni" },
-            { key: "admini", label: "Admini" },
-          ]}
-          value={filter}
-          onChange={setFilter}
-        />
-      </View>
-
-      {/* User list */}
+    <>
       <FlatList
+        style={styles.screen}
+        contentContainerStyle={styles.content}
         data={filteredUsers}
-        keyExtractor={(u) => u.id}
+        keyExtractor={(user) => user.id}
+        showsVerticalScrollIndicator={false}
+        ItemSeparatorComponent={() => <View style={styles.listGap} />}
+        ListHeaderComponent={
+          <View style={styles.headerContent}>
+            <View>
+              <Text style={styles.title}>Korisnici</Text>
+              <Text style={styles.subtitle}>{users.length} članova</Text>
+            </View>
+            <TextInput
+              value={search}
+              onChangeText={setSearch}
+              placeholder="Pretraži članove…"
+              placeholderTextColor={Colors.inkFaint}
+              style={styles.searchInput}
+              autoCapitalize="none"
+              autoCorrect={false}
+            />
+            <FilterChips
+              options={FILTER_OPTIONS}
+              value={filter}
+              onChange={setFilter}
+            />
+          </View>
+        }
         renderItem={({ item, index }) => (
           <UserRow
             user={item}
             expanded={expandedId === item.id}
             onToggleExpand={() =>
-              setExpandedId(expandedId === item.id ? null : item.id)
+              setExpandedId((current) => (current === item.id ? null : item.id))
             }
-            onEdit={() => onEdit(item)}
-            onRemove={() => onRemove(item)}
+            onEdit={() => openEditModal(item)}
+            onRemove={() => confirmRemove(item)}
             tintIndex={index % 3}
           />
         )}
-        contentContainerStyle={styles.listContent}
-        scrollEnabled={false}
       />
 
-      {/* Edit Modal */}
       <Modal
         animationType="slide"
         transparent
-        visible={editModal}
-        onRequestClose={() => setEditModal(false)}
+        visible={editingUser !== null}
+        onRequestClose={closeEditModal}
       >
         <View style={styles.modalOverlay}>
-          <KeyboardAvoidingView behavior="padding" style={styles.modal}>
-            <ScrollView
-              contentContainerStyle={styles.modalContent}
-              keyboardShouldPersistTaps="handled"
-            >
-              <Text style={styles.modalTitle}>Izmena korisnika</Text>
+          <View style={styles.modalCard}>
+            <Text style={styles.modalTitle}>Izmena korisnika</Text>
 
-              {/* first_name */}
-              <Text style={styles.label}>IME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>IME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.first_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, first_name: v }))
-                }
+                value={firstName}
+                onChangeText={setFirstName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* last_name */}
-              <Text style={styles.label}>PREZIME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>PREZIME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.last_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, last_name: v }))
-                }
+                value={lastName}
+                onChangeText={setLastName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* role */}
-              <Text style={styles.label}>ULOGA</Text>
-              <FilterChips<"user" | "admin">
-                options={[
-                  { key: "user", label: "Član" },
-                  { key: "admin", label: "Admin" },
-                ]}
-                value={editForm.role}
-                onChange={(v) => setEditForm((p) => ({ ...p, role: v }))}
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>ULOGA</Text>
+              <FilterChips
+                options={ROLE_OPTIONS}
+                value={role}
+                onChange={setRole}
               />
+            </View>
 
-              {/* max_sessions_per_week stepper */}
-              <Text style={styles.label}>NEDELJNI LIMIT</Text>
-              <View style={styles.stepperContainer}>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
+              <View style={styles.stepper}>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.max(
-                        0,
-                        p.max_sessions_per_week - 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 0}
+                  onPress={() => setMaxSessions((value) => Math.max(0, value - 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>−</Text>
+                  <Text style={styles.stepButtonText}>−</Text>
                 </Pressable>
-                <Text style={styles.stepperValue}>
-                  {editForm.max_sessions_per_week}
-                </Text>
+                <Text style={styles.stepValue}>{maxSessions}</Text>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.min(
-                        14,
-                        p.max_sessions_per_week + 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 14}
+                  onPress={() => setMaxSessions((value) => Math.min(14, value + 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>+</Text>
+                  <Text style={styles.stepButtonText}>＋</Text>
                 </Pressable>
               </View>
+            </View>
 
-              {/* Footer actions */}
-              <View style={styles.modalFooter}>
-                <Pressable
-                  onPress={() => setEditModal(false)}
-                  style={styles.cancelBtn}
-                  disabled={saving}
-                >
-                  <Text style={styles.cancelBtnText}>Otkaži</Text>
-                </Pressable>
-                <Pressable
-                  onPress={onSaveEdit}
-                  style={[
-                    styles.saveBtn,
-                    saving && styles.saveBtnDisabled,
-                  ]}
-                  disabled={saving}
-                >
-                  {saving ? (
-                    <ActivityIndicator size="small" color={Colors.surface} />
-                  ) : (
-                    <Text style={styles.saveBtnText}>Sačuvaj</Text>
-                  )}
-                </Pressable>
-              </View>
-            </ScrollView>
-          </KeyboardAvoidingView>
+            <View style={styles.modalFooter}>
+              <Pressable
+                onPress={closeEditModal}
+                disabled={saving}
+                style={styles.cancelButton}
+              >
+                <Text style={styles.cancelButtonText}>Otkaži</Text>
+              </Pressable>
+              <Pressable
+                onPress={() => void saveUser()}
+                disabled={saving}
+                style={[styles.saveButton, saving && styles.buttonDisabled]}
+              >
+                {saving ? (
+                  <ActivityIndicator color={Colors.surface} />
+                ) : (
+                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
+                )}
+              </Pressable>
+            </View>
+          </View>
         </View>
       </Modal>
-    </View>
+    </>
   );
 }
 
@@ -321,33 +298,37 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    paddingHorizontal: Spacing.screenHorizontal || 20,
   },
-  centerContainer: {
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  centeredState: {
     flex: 1,
+    alignItems: "center",
     justifyContent: "center",
-    alignItems: "center",
     backgroundColor: Colors.paper,
   },
   errorText: {
-    ...Typography.section,
+    ...Typography.body,
     color: Colors.inkMuted,
   },
-  header: {
-    paddingTop: 20,
-    paddingBottom: 16,
+  headerContent: {
+    gap: 16,
+    marginBottom: 16,
   },
-  headerTitle: {
-    fontFamily: FontFamilies.bricolage[800],
+  title: {
+    ...Typography.screenTitle,
     fontSize: 23,
-    fontWeight: "800",
     color: Colors.ink,
   },
-  headerSubtitle: {
+  subtitle: {
     fontFamily: FontFamilies.hanken[600],
     fontSize: 13,
     fontWeight: "600",
     color: Colors.inkMuted,
+    marginTop: 3,
   },
   searchInput: {
     backgroundColor: Colors.surface,
@@ -360,122 +341,114 @@
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
-    marginBottom: 16,
-  },
-  filterContainer: {
-    marginBottom: 16,
   },
-  listContent: {
-    gap: 12,
-    paddingBottom: 20,
+  listGap: {
+    height: 10,
   },
-  // Modal
   modalOverlay: {
     flex: 1,
-    backgroundColor: "rgba(0, 0, 0, 0.5)",
     justifyContent: "flex-end",
+    backgroundColor: "rgba(34, 31, 43, 0.35)",
   },
-  modal: {
-    flex: 1,
-    maxHeight: "90%",
-    backgroundColor: Colors.paper,
-    borderTopLeftRadius: Radii.tile[24],
-    borderTopRightRadius: Radii.tile[24],
-  },
-  modalContent: {
-    padding: Spacing.cardPadding || 20,
+  modalCard: {
+    backgroundColor: Colors.surface,
+    borderTopLeftRadius: Radii.card,
+    borderTopRightRadius: Radii.card,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 24,
+    paddingBottom: 28,
     gap: 16,
+    ...Shadows.card,
   },
   modalTitle: {
     fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
+    fontSize: 21,
     fontWeight: "800",
     color: Colors.ink,
-    marginBottom: 8,
   },
-  label: {
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldLabel: {
     fontFamily: FontFamilies.hanken[700],
-    fontSize: 11,
+    fontSize: 10,
     fontWeight: "700",
     letterSpacing: 1,
-    textTransform: "uppercase",
-    color: Colors.ink,
+    color: Colors.inkMuted,
   },
-  input: {
+  fieldInput: {
     backgroundColor: Colors.surface,
     borderColor: Colors.fieldBorder,
     borderWidth: 1,
     borderRadius: Radii.tile[14],
     paddingHorizontal: 12,
-    paddingVertical: 12,
+    paddingVertical: 11,
     fontFamily: FontFamilies.hanken[600],
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
   },
-  stepperContainer: {
+  stepper: {
+    alignSelf: "flex-start",
     flexDirection: "row",
     alignItems: "center",
-    gap: 12,
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
   },
-  stepperBtn: {
-    width: 40,
-    height: 40,
-    borderRadius: Radii.tile[12],
-    backgroundColor: Colors.surfaceMuted,
-    justifyContent: "center",
+  stepButton: {
+    width: 44,
+    height: 42,
     alignItems: "center",
+    justifyContent: "center",
   },
-  stepperBtnText: {
-    fontFamily: FontFamilies.hanken[800],
-    fontSize: 18,
-    fontWeight: "800",
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 20,
+    fontWeight: "700",
     color: Colors.burgundy,
   },
-  stepperValue: {
-    flex: 1,
+  stepValue: {
+    minWidth: 44,
     textAlign: "center",
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 16,
-    fontWeight: "800",
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
   modalFooter: {
     flexDirection: "row",
-    gap: 12,
-    marginTop: 16,
+    gap: 10,
+    marginTop: 4,
   },
-  cancelBtn: {
+  cancelButton: {
     flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
-    borderColor: Colors.burgundyBorder,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderColor: Colors.burgundy,
     borderWidth: 1,
-    justifyContent: "center",
-    alignItems: "center",
+    borderRadius: Radii.tile[14],
   },
-  cancelBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
+  cancelButtonText: {
+    ...Typography.primaryButtonCompact,
     color: Colors.burgundy,
   },
-  saveBtn: {
-    flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
+  saveButton: {
+    flex: 2,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderRadius: Radii.tile[14],
     backgroundColor: Colors.burgundy,
-    justifyContent: "center",
-    alignItems: "center",
-    ...Shadows.primaryButton,
   },
-  saveBtnDisabled: {
+  saveButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
     opacity: 0.6,
-  },
-  saveBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
-    color: Colors.surface,
   },
 });
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 5ff9c08c6c36ad11d37ae2b56f1e48e9638ab6e3..370de64bb181162ed7439dfdb42d667232871d81
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -1,11 +1,270 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
+} from "react-native";
+import { useLocalSearchParams, useRouter } from "expo-router";
+
+import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { upsertSession } from "@/services/admin";
+import type { UpsertSessionInput } from "@/services/admin";
 
+const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map((day) => ({
+  key: day,
+  label: {
+    monday: "PON",
+    tuesday: "UTO",
+    wednesday: "SRE",
+    thursday: "ČET",
+    friday: "PET",
+    saturday: "SUB",
+    sunday: "NED",
+  }[day],
+}));
+
 export default function TrainingDetailScreen() {
+  const router = useRouter();
+  const { id } = useLocalSearchParams<{ id: string }>();
+  const isNew = id === "new";
+  const { trainings, loading, fetchTrainings } = useTrainings();
+  const training = trainings.find((item) => item.id === id);
+  const [title, setTitle] = useState("");
+  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
+  const [time, setTime] = useState("");
+  const [room, setRoom] = useState("");
+  const [durationMin, setDurationMin] = useState<number | null>(null);
+  const [maxParticipants, setMaxParticipants] = useState(10);
+  const [isOpen, setIsOpen] = useState(true);
+  const [submitting, setSubmitting] = useState(false);
+  const [initializedId, setInitializedId] = useState<string | null>(null);
+
+  useEffect(() => {
+    if (!training || initializedId === training.id) return;
+
+    setTitle(training.title);
+    setDayOfWeek(
+      TRAINING_DAYS.includes(training.day_of_week as Day)
+        ? (training.day_of_week as Day)
+        : "monday",
+    );
+    setTime(training.time);
+    setRoom(training.room ?? "");
+    setDurationMin(training.duration_min);
+    setMaxParticipants(
+      Math.min(50, Math.max(1, training.max_participants)),
+    );
+    setIsOpen(training.is_open);
+    setInitializedId(training.id);
+  }, [initializedId, training]);
+
+  const submit = async () => {
+    const normalizedTitle = title.trim();
+    const normalizedTime = time.trim();
+
+    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+      Alert.alert(
+        "Proverite podatke",
+        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
+      );
+      return;
+    }
+
+    const input: UpsertSessionInput = {
+      id: isNew ? null : id,
+      title: normalizedTitle,
+      day_of_week: dayOfWeek,
+      time: normalizedTime,
+      room: room.trim() || null,
+      duration_min: durationMin,
+      max_participants: maxParticipants,
+      is_open: isOpen,
+    };
+
+    setSubmitting(true);
+    try {
+      await upsertSession(input);
+      await fetchTrainings();
+      router.back();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Trening nije sačuvan.");
+      await fetchTrainings();
+    } finally {
+      setSubmitting(false);
+    }
+  };
+
+  if (!isNew && loading && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (!isNew && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
+        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
+          <Text style={styles.notFoundButtonText}>Nazad</Text>
+        </Pressable>
+      </View>
+    );
+  }
+
   return (
     <View style={styles.screen}>
-      <Text style={styles.title}>Training Detail</Text>
+      <View style={styles.navBar}>
+        <Pressable
+          accessibilityRole="button"
+          onPress={() => router.back()}
+          style={styles.backButton}
+        >
+          <Text style={styles.backChevron}>‹</Text>
+        </Pressable>
+        <Text style={styles.navTitle}>
+          {isNew ? "Novi trening" : "Izmena treninga"}
+        </Text>
+        <View style={styles.navSpacer} />
+      </View>
+
+      <ScrollView
+        style={styles.formScroll}
+        contentContainerStyle={styles.formContent}
+        keyboardShouldPersistTaps="handled"
+        showsVerticalScrollIndicator={false}
+      >
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
+          <TextInput
+            value={title}
+            onChangeText={setTitle}
+            editable={!submitting}
+            style={styles.input}
+          />
+        </View>
+
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>DAN</Text>
+          <FilterChips
+            options={DAY_OPTIONS}
+            value={dayOfWeek}
+            onChange={setDayOfWeek}
+          />
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>VREME</Text>
+            <TextInput
+              value={time}
+              onChangeText={setTime}
+              placeholder="18:00"
+              placeholderTextColor={Colors.inkFaint}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
+            <TextInput
+              value={durationMin?.toString() ?? ""}
+              onChangeText={(value) =>
+                setDurationMin(
+                  value === "" ? null : Number(value.replace(/\D/g, "")),
+                )
+              }
+              keyboardType="number-pad"
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>SALA</Text>
+            <TextInput
+              value={room}
+              onChangeText={setRoom}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
+            <View style={styles.stepper}>
+              <Pressable
+                disabled={submitting || maxParticipants === 1}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.max(1, value - 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>−</Text>
+              </Pressable>
+              <Text style={styles.stepValue}>{maxParticipants}</Text>
+              <Pressable
+                disabled={submitting || maxParticipants === 50}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.min(50, value + 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>＋</Text>
+              </Pressable>
+            </View>
+          </View>
+        </View>
+
+        <View style={styles.statusCard}>
+          <View style={styles.statusTextBlock}>
+            <Text style={styles.statusTitle}>Status slota</Text>
+            <Text style={styles.statusDescription}>
+              Otvoren za prijave članova
+            </Text>
+          </View>
+          <Toggle
+            value={isOpen}
+            onValueChange={setIsOpen}
+            disabled={submitting}
+          />
+        </View>
+
+        <View style={styles.footer}>
+          <Pressable
+            onPress={() => router.back()}
+            disabled={submitting}
+            style={styles.cancelButton}
+          >
+            <Text style={styles.cancelButtonText}>Otkaži</Text>
+          </Pressable>
+          <Pressable
+            onPress={() => void submit()}
+            disabled={submitting}
+            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+          >
+            {submitting ? (
+              <ActivityIndicator color={Colors.surface} />
+            ) : (
+              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
+            )}
+          </Pressable>
+        </View>
+      </ScrollView>
     </View>
   );
 }
@@ -14,11 +273,194 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
+  },
+  centeredState: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    gap: 16,
+    backgroundColor: Colors.paper,
+  },
+  notFoundText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
+  notFoundButton: {
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    paddingHorizontal: 18,
+    paddingVertical: 10,
+  },
+  notFoundButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.burgundy,
+  },
+  navBar: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 16,
+    paddingBottom: 12,
+    borderBottomColor: Colors.border,
+    borderBottomWidth: 1,
+  },
+  backButton: {
+    width: 38,
+    height: 38,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    backgroundColor: Colors.surface,
+  },
+  backChevron: {
+    fontFamily: FontFamilies.hanken[500],
+    fontSize: 31,
+    fontWeight: "500",
+    lineHeight: 32,
+    color: Colors.burgundy,
+  },
+  navTitle: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 19,
+    fontWeight: "800",
+    color: Colors.ink,
+  },
+  navSpacer: {
+    width: 38,
+    height: 38,
+  },
+  formScroll: {
+    flex: 1,
+  },
+  formContent: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 22,
+    paddingBottom: 28,
+    gap: 20,
+  },
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  columnField: {
+    flex: 1,
+    gap: 7,
+  },
+  fieldLabel: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    letterSpacing: 1,
+    color: Colors.inkMuted,
+  },
+  input: {
+    minHeight: 46,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    paddingHorizontal: 12,
+    paddingVertical: 11,
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 14,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  stepper: {
+    minHeight: 46,
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
+  },
+  stepButton: {
+    width: 38,
+    height: 44,
+    alignItems: "center",
     justifyContent: "center",
+  },
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 19,
+    fontWeight: "700",
+    color: Colors.burgundy,
+  },
+  stepValue: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusCard: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 16,
+    borderColor: Colors.goldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[16],
+    backgroundColor: Colors.surfaceWarm,
+    padding: Spacing.cardPadding,
+  },
+  statusTextBlock: {
+    flex: 1,
+    gap: 3,
   },
-  title: {
-    ...Typography.screenTitle,
+  statusTitle: {
+    fontFamily: FontFamilies.bricolage[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
+  statusDescription: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 12,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
+  footer: {
+    flexDirection: "row",
+    gap: 10,
+    marginTop: 4,
+  },
+  cancelButton: {
+    flex: 1,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+  },
+  cancelButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.burgundy,
+  },
+  saveButton: {
+    flex: 2,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.burgundy,
+    ...Shadows.primaryButton,
+  },
+  saveButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
+    opacity: 0.6,
+  },
 });

 succeeded in 3075ms:
app/(admin)/training/[id].tsx 63ms
?? app/(admin)/(tabs)/sessions.tsx
?? app/(admin)/(tabs)/users.tsx
?? app/(admin)/training/[id].tsx

All requested screens are implemented, formatted, and pass both verification commands.
  ✓ Inspect existing admin patterns and APIs
  ✓ Implement users.tsx
  ✓ Implement sessions.tsx
  ✓ Implement training/[id].tsx
  ✓ Run TypeScript and ESLint verification
diff --git a/app/(admin)/(tabs)/sessions.tsx b/app/(admin)/(tabs)/sessions.tsx
index b37d42eee582cfcbbfbaba8b37d423440c0794ae..df22d2c62a54e17bd6bdbca98213ae4760f430de
--- a/app/(admin)/(tabs)/sessions.tsx
+++ b/app/(admin)/(tabs)/sessions.tsx
@@ -1,12 +1,155 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  FlatList,
+  Pressable,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import { SessionRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { setSessionOpen } from "@/services/admin";
+import { getCurrentWeekDates } from "@/utils/week";
+
+const DAY_LABELS: Record<Day, string> = {
+  sunday: "NED",
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+};
+
+const DAY_NAMES: Record<Day, string> = {
+  sunday: "NEDELJA",
+  monday: "PONEDELJAK",
+  tuesday: "UTORAK",
+  wednesday: "SREDA",
+  thursday: "ČETVRTAK",
+  friday: "PETAK",
+  saturday: "SUBOTA",
+};
+
+const MONTH_NAMES = [
+  "JAN",
+  "FEB",
+  "MAR",
+  "APR",
+  "MAJ",
+  "JUN",
+  "JUL",
+  "AVG",
+  "SEP",
+  "OKT",
+  "NOV",
+  "DEC",
+] as const;
 
 export default function TreninziScreen() {
+  const router = useRouter();
+  const [selectedDay, setSelectedDay] = useState<Day>("monday");
+  const { loading, fetchTrainings, getTrainingsByDay } = useTrainings();
+  const sessions = getTrainingsByDay(selectedDay);
+  const selectedDate = getCurrentWeekDates()[selectedDay];
+  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;
+
+  const toggleSession = async (sessionId: string, open: boolean) => {
+    try {
+      await setSessionOpen(sessionId, open);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Status treninga nije promenjen.");
+    } finally {
+      await fetchTrainings();
+    }
+  };
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Treninzi</Text>
-    </View>
+    <FlatList
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      data={sessions}
+      keyExtractor={(session) => session.id}
+      showsVerticalScrollIndicator={false}
+      ItemSeparatorComponent={() => <View style={styles.listGap} />}
+      ListHeaderComponent={
+        <View style={styles.headerContent}>
+          <View style={styles.titleRow}>
+            <View style={styles.titleBlock}>
+              <Text style={styles.title}>Treninzi</Text>
+              <Text style={styles.subtitle}>
+                {DAY_NAMES[selectedDay]} · {dateLabel}
+              </Text>
+            </View>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/(admin)/training/new")}
+              style={({ pressed }) => [
+                styles.newButton,
+                pressed && styles.buttonPressed,
+              ]}
+            >
+              <Text style={styles.newButtonText}>＋ Novi</Text>
+            </Pressable>
+          </View>
+
+          <View style={styles.daySelector}>
+            {TRAINING_DAYS.map((day) => {
+              const active = selectedDay === day;
+              return (
+                <Pressable
+                  key={day}
+                  onPress={() => setSelectedDay(day)}
+                  style={[
+                    styles.dayChip,
+                    active && styles.dayChipActive,
+                  ]}
+                >
+                  <Text
+                    style={[
+                      styles.dayChipText,
+                      active && styles.dayChipTextActive,
+                    ]}
+                  >
+                    {DAY_LABELS[day]}
+                  </Text>
+                </Pressable>
+              );
+            })}
+          </View>
+
+          {loading && (
+            <ActivityIndicator
+              color={Colors.burgundy}
+              style={styles.loadingIndicator}
+            />
+          )}
+        </View>
+      }
+      ListEmptyComponent={
+        loading ? null : (
+          <Text style={styles.emptyText}>Nema termina za ovaj dan.</Text>
+        )
+      }
+      renderItem={({ item }) => (
+        <SessionRow
+          session={item}
+          bookedCount={item.session_participants.length}
+          onToggleOpen={(open) => void toggleSession(item.id, open)}
+          onPress={() => router.push(`/(admin)/training/${item.id}`)}
+        />
+      )}
+    />
   );
 }
 
@@ -14,11 +157,95 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    flexGrow: 1,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  headerContent: {
+    gap: 18,
+    marginBottom: 16,
+  },
+  titleRow: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 12,
   },
+  titleBlock: {
+    flex: 1,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
     color: Colors.ink,
   },
+  subtitle: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  newButton: {
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.burgundy,
+    paddingHorizontal: 14,
+    paddingVertical: 9,
+    ...Shadows.primaryButton,
+  },
+  newButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 13,
+    fontWeight: "700",
+    color: Colors.surface,
+  },
+  buttonPressed: {
+    opacity: 0.85,
+  },
+  daySelector: {
+    flexDirection: "row",
+    justifyContent: "space-between",
+    gap: 5,
+  },
+  dayChip: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 36,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.surface,
+  },
+  dayChipActive: {
+    borderColor: Colors.burgundy,
+    backgroundColor: Colors.burgundy,
+    ...Shadows.activeDay,
+  },
+  dayChipText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  dayChipTextActive: {
+    color: Colors.surface,
+  },
+  loadingIndicator: {
+    marginTop: 10,
+  },
+  listGap: {
+    height: 10,
+  },
+  emptyText: {
+    marginTop: 48,
+    textAlign: "center",
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
 });
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 8af74755eb930ef1aea5ab7c7c6df27230debb82..d750a54b7f9ba61a558953849e34bda2533339a1
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -1,319 +1,296 @@
+import { useCallback, useEffect, useMemo, useState } from "react";
 import {
-  View,
-  Text,
-  StyleSheet,
+  ActivityIndicator,
+  Alert,
   FlatList,
-  TextInput,
   Modal,
-  Alert,
-  ActivityIndicator,
   Pressable,
-  ScrollView,
-  KeyboardAvoidingView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
 } from "react-native";
-import { useEffect, useState } from "react";
+
+import { FilterChips, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import {
-  listUsers,
-  updateUser,
-  deleteUser,
-  AdminUser,
-  UpdateUserPatch,
-} from "@/services/admin";
-import UserRow from "@/components/admin/UserRow";
-import FilterChips from "@/components/admin/FilterChips";
+import { deleteUser, listUsers, updateUser } from "@/services/admin";
+import type { AdminUser, UpdateUserPatch } from "@/services/admin";
 
-type FilterKey = "svi" | "aktivni" | "admini";
+type UserFilter = "svi" | "aktivni" | "admini";
+type UserRole = AdminUser["role"];
 
+const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
+  { key: "svi", label: "Svi" },
+  { key: "aktivni", label: "Aktivni" },
+  { key: "admini", label: "Admini" },
+];
+
+const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
+  { key: "user", label: "Član" },
+  { key: "admin", label: "Admin" },
+];
+
 export default function KorisniciScreen() {
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
+  const [hasError, setHasError] = useState(false);
+  const [search, setSearch] = useState("");
+  const [filter, setFilter] = useState<UserFilter>("svi");
   const [expandedId, setExpandedId] = useState<string | null>(null);
-  const [searchText, setSearchText] = useState("");
-  const [filter, setFilter] = useState<FilterKey>("svi");
   const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
-  const [editModal, setEditModal] = useState(false);
-  const [editForm, setEditForm] = useState({
-    first_name: "",
-    last_name: "",
-    role: "user" as "user" | "admin",
-    max_sessions_per_week: 0,
-  });
+  const [firstName, setFirstName] = useState("");
+  const [lastName, setLastName] = useState("");
+  const [role, setRole] = useState<UserRole>("user");
+  const [maxSessions, setMaxSessions] = useState(0);
   const [saving, setSaving] = useState(false);
 
-  // Load users on mount
-  useEffect(() => {
-    fetchUsers();
-  }, []);
+  const fetchUsers = useCallback(async () => {
+    setLoading(true);
+    setHasError(false);
 
-  const fetchUsers = async () => {
-    setLoading(true);
-    setError(null);
     try {
-      const data = await listUsers();
-      setUsers(data);
-    } catch (err) {
-      setError("Greška pri učitavanju");
-      if (__DEV__) console.error(err);
+      setUsers(await listUsers());
+    } catch (error: unknown) {
+      console.error(error);
+      setHasError(true);
     } finally {
       setLoading(false);
     }
-  };
+  }, []);
 
-  // Filter logic
-  const filteredUsers = users
-    .filter((u) => {
-      const searchLower = searchText.toLowerCase();
-      const matchesSearch =
-        u.first_name.toLowerCase().includes(searchLower) ||
-        (u.last_name?.toLowerCase().includes(searchLower) ?? false) ||
-        u.email.toLowerCase().includes(searchLower);
+  useEffect(() => {
+    void fetchUsers();
+  }, [fetchUsers]);
 
-      if (!matchesSearch) return false;
+  const filteredUsers = useMemo(() => {
+    const query = search.trim().toLocaleLowerCase();
+
+    return users.filter((user) => {
+      const matchesFilter =
+        filter === "svi" ||
+        (filter === "aktivni" && user.enabled !== false) ||
+        (filter === "admini" && user.role === "admin");
+      const searchable = `${user.first_name} ${user.last_name ?? ""} ${user.email}`
+        .toLocaleLowerCase();
 
-      if (filter === "aktivni") return u.enabled !== false;
-      if (filter === "admini") return u.role === "admin";
-      return true;
+      return matchesFilter && searchable.includes(query);
     });
+  }, [filter, search, users]);
 
-  // Edit modal handlers
-  const onEdit = (user: AdminUser) => {
+  const openEditModal = (user: AdminUser) => {
     setEditingUser(user);
-    setEditForm({
-      first_name: user.first_name,
-      last_name: user.last_name || "",
-      role: user.role,
-      max_sessions_per_week: user.max_sessions_per_week,
-    });
-    setEditModal(true);
+    setFirstName(user.first_name);
+    setLastName(user.last_name ?? "");
+    setRole(user.role);
+    setMaxSessions(user.max_sessions_per_week);
   };
 
-  const onRemove = (user: AdminUser) => {
-    Alert.alert(
-      "Ukloni korisnika",
-      `${user.first_name} ${user.last_name || ""} i sve njegove rezervacije će biti uklonjeni.`,
-      [
-        { text: "Otkaži", style: "cancel" },
-        {
-          text: "Ukloni",
-          onPress: async () => {
-            try {
-              await deleteUser(user.id);
-              await fetchUsers();
-            } catch (err) {
-              Alert.alert("Greška", "Nije moguće obrisati korisnika");
-              if (__DEV__) console.error(err);
-            }
-          },
-          style: "destructive",
-        },
-      ]
-    );
+  const closeEditModal = () => {
+    if (!saving) setEditingUser(null);
   };
 
-  const onSaveEdit = async () => {
+  const saveUser = async () => {
     if (!editingUser) return;
 
+    const patch: UpdateUserPatch = {
+      first_name: firstName.trim(),
+      last_name: lastName.trim(),
+      role,
+      max_sessions_per_week: maxSessions,
+    };
+
     setSaving(true);
     try {
-      const patch: UpdateUserPatch = {
-        first_name: editForm.first_name || null,
-        last_name: editForm.last_name || null,
-        role: editForm.role,
-        max_sessions_per_week: editForm.max_sessions_per_week,
-      };
       await updateUser(editingUser.id, patch);
-      setEditModal(false);
       setEditingUser(null);
       await fetchUsers();
-    } catch (err) {
-      Alert.alert("Greška", "Nije moguće sačuvati promene");
-      if (__DEV__) console.error(err);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
+      await fetchUsers();
     } finally {
       setSaving(false);
     }
   };
 
-  if (loading) {
+  const removeUser = async (user: AdminUser) => {
+    try {
+      await deleteUser(user.id);
+      setExpandedId(null);
+      await fetchUsers();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Korisnik nije uklonjen.");
+      await fetchUsers();
+    }
+  };
+
+  const confirmRemove = (user: AdminUser) => {
+    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();
+
+    Alert.alert(
+      "Ukloni korisnika",
+      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
+      [
+        { text: "Otkaži", style: "cancel" },
+        {
+          text: "Ukloni",
+          style: "destructive",
+          onPress: () => void removeUser(user),
+        },
+      ],
+    );
+  };
+
+  if (loading && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <ActivityIndicator size="large" color={Colors.burgundy} />
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
       </View>
     );
   }
 
-  if (error) {
+  if (hasError && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <Text style={styles.errorText}>{error}</Text>
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
       </View>
     );
   }
 
   return (
-    <View style={styles.screen}>
-      {/* Header */}
-      <View style={styles.header}>
-        <Text style={styles.headerTitle}>Korisnici</Text>
-        <Text style={styles.headerSubtitle}>{users.length} članova</Text>
-      </View>
-
-      {/* Search */}
-      <TextInput
-        style={styles.searchInput}
-        placeholder="Pretraži članove…"
-        placeholderTextColor={Colors.inkMuted}
-        value={searchText}
-        onChangeText={setSearchText}
-      />
-
-      {/* Filter chips */}
-      <View style={styles.filterContainer}>
-        <FilterChips<FilterKey>
-          options={[
-            { key: "svi", label: "Svi" },
-            { key: "aktivni", label: "Aktivni" },
-            { key: "admini", label: "Admini" },
-          ]}
-          value={filter}
-          onChange={setFilter}
-        />
-      </View>
-
-      {/* User list */}
+    <>
       <FlatList
+        style={styles.screen}
+        contentContainerStyle={styles.content}
         data={filteredUsers}
-        keyExtractor={(u) => u.id}
+        keyExtractor={(user) => user.id}
+        showsVerticalScrollIndicator={false}
+        ItemSeparatorComponent={() => <View style={styles.listGap} />}
+        ListHeaderComponent={
+          <View style={styles.headerContent}>
+            <View>
+              <Text style={styles.title}>Korisnici</Text>
+              <Text style={styles.subtitle}>{users.length} članova</Text>
+            </View>
+            <TextInput
+              value={search}
+              onChangeText={setSearch}
+              placeholder="Pretraži članove…"
+              placeholderTextColor={Colors.inkFaint}
+              style={styles.searchInput}
+              autoCapitalize="none"
+              autoCorrect={false}
+            />
+            <FilterChips
+              options={FILTER_OPTIONS}
+              value={filter}
+              onChange={setFilter}
+            />
+          </View>
+        }
         renderItem={({ item, index }) => (
           <UserRow
             user={item}
             expanded={expandedId === item.id}
             onToggleExpand={() =>
-              setExpandedId(expandedId === item.id ? null : item.id)
+              setExpandedId((current) => (current === item.id ? null : item.id))
             }
-            onEdit={() => onEdit(item)}
-            onRemove={() => onRemove(item)}
+            onEdit={() => openEditModal(item)}
+            onRemove={() => confirmRemove(item)}
             tintIndex={index % 3}
           />
         )}
-        contentContainerStyle={styles.listContent}
-        scrollEnabled={false}
       />
 
-      {/* Edit Modal */}
       <Modal
         animationType="slide"
         transparent
-        visible={editModal}
-        onRequestClose={() => setEditModal(false)}
+        visible={editingUser !== null}
+        onRequestClose={closeEditModal}
       >
         <View style={styles.modalOverlay}>
-          <KeyboardAvoidingView behavior="padding" style={styles.modal}>
-            <ScrollView
-              contentContainerStyle={styles.modalContent}
-              keyboardShouldPersistTaps="handled"
-            >
-              <Text style={styles.modalTitle}>Izmena korisnika</Text>
+          <View style={styles.modalCard}>
+            <Text style={styles.modalTitle}>Izmena korisnika</Text>
 
-              {/* first_name */}
-              <Text style={styles.label}>IME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>IME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.first_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, first_name: v }))
-                }
+                value={firstName}
+                onChangeText={setFirstName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* last_name */}
-              <Text style={styles.label}>PREZIME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>PREZIME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.last_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, last_name: v }))
-                }
+                value={lastName}
+                onChangeText={setLastName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* role */}
-              <Text style={styles.label}>ULOGA</Text>
-              <FilterChips<"user" | "admin">
-                options={[
-                  { key: "user", label: "Član" },
-                  { key: "admin", label: "Admin" },
-                ]}
-                value={editForm.role}
-                onChange={(v) => setEditForm((p) => ({ ...p, role: v }))}
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>ULOGA</Text>
+              <FilterChips
+                options={ROLE_OPTIONS}
+                value={role}
+                onChange={setRole}
               />
+            </View>
 
-              {/* max_sessions_per_week stepper */}
-              <Text style={styles.label}>NEDELJNI LIMIT</Text>
-              <View style={styles.stepperContainer}>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
+              <View style={styles.stepper}>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.max(
-                        0,
-                        p.max_sessions_per_week - 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 0}
+                  onPress={() => setMaxSessions((value) => Math.max(0, value - 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>−</Text>
+                  <Text style={styles.stepButtonText}>−</Text>
                 </Pressable>
-                <Text style={styles.stepperValue}>
-                  {editForm.max_sessions_per_week}
-                </Text>
+                <Text style={styles.stepValue}>{maxSessions}</Text>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.min(
-                        14,
-                        p.max_sessions_per_week + 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 14}
+                  onPress={() => setMaxSessions((value) => Math.min(14, value + 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>+</Text>
+                  <Text style={styles.stepButtonText}>＋</Text>
                 </Pressable>
               </View>
+            </View>
 
-              {/* Footer actions */}
-              <View style={styles.modalFooter}>
-                <Pressable
-                  onPress={() => setEditModal(false)}
-                  style={styles.cancelBtn}
-                  disabled={saving}
-                >
-                  <Text style={styles.cancelBtnText}>Otkaži</Text>
-                </Pressable>
-                <Pressable
-                  onPress={onSaveEdit}
-                  style={[
-                    styles.saveBtn,
-                    saving && styles.saveBtnDisabled,
-                  ]}
-                  disabled={saving}
-                >
-                  {saving ? (
-                    <ActivityIndicator size="small" color={Colors.surface} />
-                  ) : (
-                    <Text style={styles.saveBtnText}>Sačuvaj</Text>
-                  )}
-                </Pressable>
-              </View>
-            </ScrollView>
-          </KeyboardAvoidingView>
+            <View style={styles.modalFooter}>
+              <Pressable
+                onPress={closeEditModal}
+                disabled={saving}
+                style={styles.cancelButton}
+              >
+                <Text style={styles.cancelButtonText}>Otkaži</Text>
+              </Pressable>
+              <Pressable
+                onPress={() => void saveUser()}
+                disabled={saving}
+                style={[styles.saveButton, saving && styles.buttonDisabled]}
+              >
+                {saving ? (
+                  <ActivityIndicator color={Colors.surface} />
+                ) : (
+                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
+                )}
+              </Pressable>
+            </View>
+          </View>
         </View>
       </Modal>
-    </View>
+    </>
   );
 }
 
@@ -321,33 +298,37 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    paddingHorizontal: Spacing.screenHorizontal || 20,
   },
-  centerContainer: {
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  centeredState: {
     flex: 1,
+    alignItems: "center",
     justifyContent: "center",
-    alignItems: "center",
     backgroundColor: Colors.paper,
   },
   errorText: {
-    ...Typography.section,
+    ...Typography.body,
     color: Colors.inkMuted,
   },
-  header: {
-    paddingTop: 20,
-    paddingBottom: 16,
+  headerContent: {
+    gap: 16,
+    marginBottom: 16,
   },
-  headerTitle: {
-    fontFamily: FontFamilies.bricolage[800],
+  title: {
+    ...Typography.screenTitle,
     fontSize: 23,
-    fontWeight: "800",
     color: Colors.ink,
   },
-  headerSubtitle: {
+  subtitle: {
     fontFamily: FontFamilies.hanken[600],
     fontSize: 13,
     fontWeight: "600",
     color: Colors.inkMuted,
+    marginTop: 3,
   },
   searchInput: {
     backgroundColor: Colors.surface,
@@ -360,122 +341,114 @@
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
-    marginBottom: 16,
-  },
-  filterContainer: {
-    marginBottom: 16,
   },
-  listContent: {
-    gap: 12,
-    paddingBottom: 20,
+  listGap: {
+    height: 10,
   },
-  // Modal
   modalOverlay: {
     flex: 1,
-    backgroundColor: "rgba(0, 0, 0, 0.5)",
     justifyContent: "flex-end",
+    backgroundColor: "rgba(34, 31, 43, 0.35)",
   },
-  modal: {
-    flex: 1,
-    maxHeight: "90%",
-    backgroundColor: Colors.paper,
-    borderTopLeftRadius: Radii.tile[24],
-    borderTopRightRadius: Radii.tile[24],
-  },
-  modalContent: {
-    padding: Spacing.cardPadding || 20,
+  modalCard: {
+    backgroundColor: Colors.surface,
+    borderTopLeftRadius: Radii.card,
+    borderTopRightRadius: Radii.card,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 24,
+    paddingBottom: 28,
     gap: 16,
+    ...Shadows.card,
   },
   modalTitle: {
     fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
+    fontSize: 21,
     fontWeight: "800",
     color: Colors.ink,
-    marginBottom: 8,
   },
-  label: {
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldLabel: {
     fontFamily: FontFamilies.hanken[700],
-    fontSize: 11,
+    fontSize: 10,
     fontWeight: "700",
     letterSpacing: 1,
-    textTransform: "uppercase",
-    color: Colors.ink,
+    color: Colors.inkMuted,
   },
-  input: {
+  fieldInput: {
     backgroundColor: Colors.surface,
     borderColor: Colors.fieldBorder,
     borderWidth: 1,
     borderRadius: Radii.tile[14],
     paddingHorizontal: 12,
-    paddingVertical: 12,
+    paddingVertical: 11,
     fontFamily: FontFamilies.hanken[600],
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
   },
-  stepperContainer: {
+  stepper: {
+    alignSelf: "flex-start",
     flexDirection: "row",
     alignItems: "center",
-    gap: 12,
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
   },
-  stepperBtn: {
-    width: 40,
-    height: 40,
-    borderRadius: Radii.tile[12],
-    backgroundColor: Colors.surfaceMuted,
-    justifyContent: "center",
+  stepButton: {
+    width: 44,
+    height: 42,
     alignItems: "center",
+    justifyContent: "center",
   },
-  stepperBtnText: {
-    fontFamily: FontFamilies.hanken[800],
-    fontSize: 18,
-    fontWeight: "800",
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 20,
+    fontWeight: "700",
     color: Colors.burgundy,
   },
-  stepperValue: {
-    flex: 1,
+  stepValue: {
+    minWidth: 44,
     textAlign: "center",
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 16,
-    fontWeight: "800",
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
   modalFooter: {
     flexDirection: "row",
-    gap: 12,
-    marginTop: 16,
+    gap: 10,
+    marginTop: 4,
   },
-  cancelBtn: {
+  cancelButton: {
     flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
-    borderColor: Colors.burgundyBorder,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderColor: Colors.burgundy,
     borderWidth: 1,
-    justifyContent: "center",
-    alignItems: "center",
+    borderRadius: Radii.tile[14],
   },
-  cancelBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
+  cancelButtonText: {
+    ...Typography.primaryButtonCompact,
     color: Colors.burgundy,
   },
-  saveBtn: {
-    flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
+  saveButton: {
+    flex: 2,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderRadius: Radii.tile[14],
     backgroundColor: Colors.burgundy,
-    justifyContent: "center",
-    alignItems: "center",
-    ...Shadows.primaryButton,
   },
-  saveBtnDisabled: {
+  saveButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
     opacity: 0.6,
-  },
-  saveBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
-    color: Colors.surface,
   },
 });
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 5ff9c08c6c36ad11d37ae2b56f1e48e9638ab6e3..370de64bb181162ed7439dfdb42d667232871d81
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -1,11 +1,270 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
+} from "react-native";
+import { useLocalSearchParams, useRouter } from "expo-router";
+
+import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { upsertSession } from "@/services/admin";
+import type { UpsertSessionInput } from "@/services/admin";
 
+const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map((day) => ({
+  key: day,
+  label: {
+    monday: "PON",
+    tuesday: "UTO",
+    wednesday: "SRE",
+    thursday: "ČET",
+    friday: "PET",
+    saturday: "SUB",
+    sunday: "NED",
+  }[day],
+}));
+
 export default function TrainingDetailScreen() {
+  const router = useRouter();
+  const { id } = useLocalSearchParams<{ id: string }>();
+  const isNew = id === "new";
+  const { trainings, loading, fetchTrainings } = useTrainings();
+  const training = trainings.find((item) => item.id === id);
+  const [title, setTitle] = useState("");
+  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
+  const [time, setTime] = useState("");
+  const [room, setRoom] = useState("");
+  const [durationMin, setDurationMin] = useState<number | null>(null);
+  const [maxParticipants, setMaxParticipants] = useState(10);
+  const [isOpen, setIsOpen] = useState(true);
+  const [submitting, setSubmitting] = useState(false);
+  const [initializedId, setInitializedId] = useState<string | null>(null);
+
+  useEffect(() => {
+    if (!training || initializedId === training.id) return;
+
+    setTitle(training.title);
+    setDayOfWeek(
+      TRAINING_DAYS.includes(training.day_of_week as Day)
+        ? (training.day_of_week as Day)
+        : "monday",
+    );
+    setTime(training.time);
+    setRoom(training.room ?? "");
+    setDurationMin(training.duration_min);
+    setMaxParticipants(
+      Math.min(50, Math.max(1, training.max_participants)),
+    );
+    setIsOpen(training.is_open);
+    setInitializedId(training.id);
+  }, [initializedId, training]);
+
+  const submit = async () => {
+    const normalizedTitle = title.trim();
+    const normalizedTime = time.trim();
+
+    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+      Alert.alert(
+        "Proverite podatke",
+        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
+      );
+      return;
+    }
+
+    const input: UpsertSessionInput = {
+      id: isNew ? null : id,
+      title: normalizedTitle,
+      day_of_week: dayOfWeek,
+      time: normalizedTime,
+      room: room.trim() || null,
+      duration_min: durationMin,
+      max_participants: maxParticipants,
+      is_open: isOpen,
+    };
+
+    setSubmitting(true);
+    try {
+      await upsertSession(input);
+      await fetchTrainings();
+      router.back();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Trening nije sačuvan.");
+      await fetchTrainings();
+    } finally {
+      setSubmitting(false);
+    }
+  };
+
+  if (!isNew && loading && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (!isNew && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
+        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
+          <Text style={styles.notFoundButtonText}>Nazad</Text>
+        </Pressable>
+      </View>
+    );
+  }
+
   return (
     <View style={styles.screen}>
-      <Text style={styles.title}>Training Detail</Text>
+      <View style={styles.navBar}>
+        <Pressable
+          accessibilityRole="button"
+          onPress={() => router.back()}
+          style={styles.backButton}
+        >
+          <Text style={styles.backChevron}>‹</Text>
+        </Pressable>
+        <Text style={styles.navTitle}>
+          {isNew ? "Novi trening" : "Izmena treninga"}
+        </Text>
+        <View style={styles.navSpacer} />
+      </View>
+
+      <ScrollView
+        style={styles.formScroll}
+        contentContainerStyle={styles.formContent}
+        keyboardShouldPersistTaps="handled"
+        showsVerticalScrollIndicator={false}
+      >
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
+          <TextInput
+            value={title}
+            onChangeText={setTitle}
+            editable={!submitting}
+            style={styles.input}
+          />
+        </View>
+
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>DAN</Text>
+          <FilterChips
+            options={DAY_OPTIONS}
+            value={dayOfWeek}
+            onChange={setDayOfWeek}
+          />
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>VREME</Text>
+            <TextInput
+              value={time}
+              onChangeText={setTime}
+              placeholder="18:00"
+              placeholderTextColor={Colors.inkFaint}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
+            <TextInput
+              value={durationMin?.toString() ?? ""}
+              onChangeText={(value) =>
+                setDurationMin(
+                  value === "" ? null : Number(value.replace(/\D/g, "")),
+                )
+              }
+              keyboardType="number-pad"
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>SALA</Text>
+            <TextInput
+              value={room}
+              onChangeText={setRoom}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
+            <View style={styles.stepper}>
+              <Pressable
+                disabled={submitting || maxParticipants === 1}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.max(1, value - 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>−</Text>
+              </Pressable>
+              <Text style={styles.stepValue}>{maxParticipants}</Text>
+              <Pressable
+                disabled={submitting || maxParticipants === 50}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.min(50, value + 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>＋</Text>
+              </Pressable>
+            </View>
+          </View>
+        </View>
+
+        <View style={styles.statusCard}>
+          <View style={styles.statusTextBlock}>
+            <Text style={styles.statusTitle}>Status slota</Text>
+            <Text style={styles.statusDescription}>
+              Otvoren za prijave članova
+            </Text>
+          </View>
+          <Toggle
+            value={isOpen}
+            onValueChange={setIsOpen}
+            disabled={submitting}
+          />
+        </View>
+
+        <View style={styles.footer}>
+          <Pressable
+            onPress={() => router.back()}
+            disabled={submitting}
+            style={styles.cancelButton}
+          >
+            <Text style={styles.cancelButtonText}>Otkaži</Text>
+          </Pressable>
+          <Pressable
+            onPress={() => void submit()}
+            disabled={submitting}
+            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+          >
+            {submitting ? (
+              <ActivityIndicator color={Colors.surface} />
+            ) : (
+              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
+            )}
+          </Pressable>
+        </View>
+      </ScrollView>
     </View>
   );
 }
@@ -14,11 +273,194 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
+  },
+  centeredState: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    gap: 16,
+    backgroundColor: Colors.paper,
+  },
+  notFoundText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
+  notFoundButton: {
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    paddingHorizontal: 18,
+    paddingVertical: 10,
+  },
+  notFoundButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.burgundy,
+  },
+  navBar: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 16,
+    paddingBottom: 12,
+    borderBottomColor: Colors.border,
+    borderBottomWidth: 1,
+  },
+  backButton: {
+    width: 38,
+    height: 38,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    backgroundColor: Colors.surface,
+  },
+  backChevron: {
+    fontFamily: FontFamilies.hanken[500],
+    fontSize: 31,
+    fontWeight: "500",
+    lineHeight: 32,
+    color: Colors.burgundy,
+  },
+  navTitle: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 19,
+    fontWeight: "800",
+    color: Colors.ink,
+  },
+  navSpacer: {
+    width: 38,
+    height: 38,
+  },
+  formScroll: {
+    flex: 1,
+  },
+  formContent: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 22,
+    paddingBottom: 28,
+    gap: 20,
+  },
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  columnField: {
+    flex: 1,
+    gap: 7,
+  },
+  fieldLabel: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    letterSpacing: 1,
+    color: Colors.inkMuted,
+  },
+  input: {
+    minHeight: 46,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    paddingHorizontal: 12,
+    paddingVertical: 11,
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 14,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  stepper: {
+    minHeight: 46,
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
+  },
+  stepButton: {
+    width: 38,
+    height: 44,
+    alignItems: "center",
     justifyContent: "center",
+  },
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 19,
+    fontWeight: "700",
+    color: Colors.burgundy,
+  },
+  stepValue: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusCard: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 16,
+    borderColor: Colors.goldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[16],
+    backgroundColor: Colors.surfaceWarm,
+    padding: Spacing.cardPadding,
+  },
+  statusTextBlock: {
+    flex: 1,
+    gap: 3,
   },
-  title: {
-    ...Typography.screenTitle,
+  statusTitle: {
+    fontFamily: FontFamilies.bricolage[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
+  statusDescription: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 12,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
+  footer: {
+    flexDirection: "row",
+    gap: 10,
+    marginTop: 4,
+  },
+  cancelButton: {
+    flex: 1,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+  },
+  cancelButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.burgundy,
+  },
+  saveButton: {
+    flex: 2,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.burgundy,
+    ...Shadows.primaryButton,
+  },
+  saveButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
+    opacity: 0.6,
+  },
 });

codex
Implemented:

- [users.tsx](</Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/users.tsx>)
- [sessions.tsx](</Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/sessions.tsx>)
- [[id].tsx](</Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/training/[id].tsx>)

Verification passed:

- `tsc --noEmit`
- ESLint on `app/(admin)` and `src/components/admin`

DONE
diff --git a/app/(admin)/(tabs)/sessions.tsx b/app/(admin)/(tabs)/sessions.tsx
index b37d42eee582cfcbbfbaba8b37d423440c0794ae..df22d2c62a54e17bd6bdbca98213ae4760f430de
--- a/app/(admin)/(tabs)/sessions.tsx
+++ b/app/(admin)/(tabs)/sessions.tsx
@@ -1,12 +1,155 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  FlatList,
+  Pressable,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import { SessionRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { setSessionOpen } from "@/services/admin";
+import { getCurrentWeekDates } from "@/utils/week";
+
+const DAY_LABELS: Record<Day, string> = {
+  sunday: "NED",
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+};
+
+const DAY_NAMES: Record<Day, string> = {
+  sunday: "NEDELJA",
+  monday: "PONEDELJAK",
+  tuesday: "UTORAK",
+  wednesday: "SREDA",
+  thursday: "ČETVRTAK",
+  friday: "PETAK",
+  saturday: "SUBOTA",
+};
+
+const MONTH_NAMES = [
+  "JAN",
+  "FEB",
+  "MAR",
+  "APR",
+  "MAJ",
+  "JUN",
+  "JUL",
+  "AVG",
+  "SEP",
+  "OKT",
+  "NOV",
+  "DEC",
+] as const;
 
 export default function TreninziScreen() {
+  const router = useRouter();
+  const [selectedDay, setSelectedDay] = useState<Day>("monday");
+  const { loading, fetchTrainings, getTrainingsByDay } = useTrainings();
+  const sessions = getTrainingsByDay(selectedDay);
+  const selectedDate = getCurrentWeekDates()[selectedDay];
+  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;
+
+  const toggleSession = async (sessionId: string, open: boolean) => {
+    try {
+      await setSessionOpen(sessionId, open);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Status treninga nije promenjen.");
+    } finally {
+      await fetchTrainings();
+    }
+  };
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Treninzi</Text>
-    </View>
+    <FlatList
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      data={sessions}
+      keyExtractor={(session) => session.id}
+      showsVerticalScrollIndicator={false}
+      ItemSeparatorComponent={() => <View style={styles.listGap} />}
+      ListHeaderComponent={
+        <View style={styles.headerContent}>
+          <View style={styles.titleRow}>
+            <View style={styles.titleBlock}>
+              <Text style={styles.title}>Treninzi</Text>
+              <Text style={styles.subtitle}>
+                {DAY_NAMES[selectedDay]} · {dateLabel}
+              </Text>
+            </View>
+            <Pressable
+              accessibilityRole="button"
+              onPress={() => router.push("/(admin)/training/new")}
+              style={({ pressed }) => [
+                styles.newButton,
+                pressed && styles.buttonPressed,
+              ]}
+            >
+              <Text style={styles.newButtonText}>＋ Novi</Text>
+            </Pressable>
+          </View>
+
+          <View style={styles.daySelector}>
+            {TRAINING_DAYS.map((day) => {
+              const active = selectedDay === day;
+              return (
+                <Pressable
+                  key={day}
+                  onPress={() => setSelectedDay(day)}
+                  style={[
+                    styles.dayChip,
+                    active && styles.dayChipActive,
+                  ]}
+                >
+                  <Text
+                    style={[
+                      styles.dayChipText,
+                      active && styles.dayChipTextActive,
+                    ]}
+                  >
+                    {DAY_LABELS[day]}
+                  </Text>
+                </Pressable>
+              );
+            })}
+          </View>
+
+          {loading && (
+            <ActivityIndicator
+              color={Colors.burgundy}
+              style={styles.loadingIndicator}
+            />
+          )}
+        </View>
+      }
+      ListEmptyComponent={
+        loading ? null : (
+          <Text style={styles.emptyText}>Nema termina za ovaj dan.</Text>
+        )
+      }
+      renderItem={({ item }) => (
+        <SessionRow
+          session={item}
+          bookedCount={item.session_participants.length}
+          onToggleOpen={(open) => void toggleSession(item.id, open)}
+          onPress={() => router.push(`/(admin)/training/${item.id}`)}
+        />
+      )}
+    />
   );
 }
 
@@ -14,11 +157,95 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    flexGrow: 1,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  headerContent: {
+    gap: 18,
+    marginBottom: 16,
+  },
+  titleRow: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 12,
   },
+  titleBlock: {
+    flex: 1,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
     color: Colors.ink,
   },
+  subtitle: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  newButton: {
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.burgundy,
+    paddingHorizontal: 14,
+    paddingVertical: 9,
+    ...Shadows.primaryButton,
+  },
+  newButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 13,
+    fontWeight: "700",
+    color: Colors.surface,
+  },
+  buttonPressed: {
+    opacity: 0.85,
+  },
+  daySelector: {
+    flexDirection: "row",
+    justifyContent: "space-between",
+    gap: 5,
+  },
+  dayChip: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 36,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.chip,
+    backgroundColor: Colors.surface,
+  },
+  dayChipActive: {
+    borderColor: Colors.burgundy,
+    backgroundColor: Colors.burgundy,
+    ...Shadows.activeDay,
+  },
+  dayChipText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  dayChipTextActive: {
+    color: Colors.surface,
+  },
+  loadingIndicator: {
+    marginTop: 10,
+  },
+  listGap: {
+    height: 10,
+  },
+  emptyText: {
+    marginTop: 48,
+    textAlign: "center",
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
 });
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 8af74755eb930ef1aea5ab7c7c6df27230debb82..d750a54b7f9ba61a558953849e34bda2533339a1
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -1,319 +1,296 @@
+import { useCallback, useEffect, useMemo, useState } from "react";
 import {
-  View,
-  Text,
-  StyleSheet,
+  ActivityIndicator,
+  Alert,
   FlatList,
-  TextInput,
   Modal,
-  Alert,
-  ActivityIndicator,
   Pressable,
-  ScrollView,
-  KeyboardAvoidingView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
 } from "react-native";
-import { useEffect, useState } from "react";
+
+import { FilterChips, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import {
-  listUsers,
-  updateUser,
-  deleteUser,
-  AdminUser,
-  UpdateUserPatch,
-} from "@/services/admin";
-import UserRow from "@/components/admin/UserRow";
-import FilterChips from "@/components/admin/FilterChips";
+import { deleteUser, listUsers, updateUser } from "@/services/admin";
+import type { AdminUser, UpdateUserPatch } from "@/services/admin";
 
-type FilterKey = "svi" | "aktivni" | "admini";
+type UserFilter = "svi" | "aktivni" | "admini";
+type UserRole = AdminUser["role"];
 
+const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
+  { key: "svi", label: "Svi" },
+  { key: "aktivni", label: "Aktivni" },
+  { key: "admini", label: "Admini" },
+];
+
+const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
+  { key: "user", label: "Član" },
+  { key: "admin", label: "Admin" },
+];
+
 export default function KorisniciScreen() {
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
+  const [hasError, setHasError] = useState(false);
+  const [search, setSearch] = useState("");
+  const [filter, setFilter] = useState<UserFilter>("svi");
   const [expandedId, setExpandedId] = useState<string | null>(null);
-  const [searchText, setSearchText] = useState("");
-  const [filter, setFilter] = useState<FilterKey>("svi");
   const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
-  const [editModal, setEditModal] = useState(false);
-  const [editForm, setEditForm] = useState({
-    first_name: "",
-    last_name: "",
-    role: "user" as "user" | "admin",
-    max_sessions_per_week: 0,
-  });
+  const [firstName, setFirstName] = useState("");
+  const [lastName, setLastName] = useState("");
+  const [role, setRole] = useState<UserRole>("user");
+  const [maxSessions, setMaxSessions] = useState(0);
   const [saving, setSaving] = useState(false);
 
-  // Load users on mount
-  useEffect(() => {
-    fetchUsers();
-  }, []);
+  const fetchUsers = useCallback(async () => {
+    setLoading(true);
+    setHasError(false);
 
-  const fetchUsers = async () => {
-    setLoading(true);
-    setError(null);
     try {
-      const data = await listUsers();
-      setUsers(data);
-    } catch (err) {
-      setError("Greška pri učitavanju");
-      if (__DEV__) console.error(err);
+      setUsers(await listUsers());
+    } catch (error: unknown) {
+      console.error(error);
+      setHasError(true);
     } finally {
       setLoading(false);
     }
-  };
+  }, []);
 
-  // Filter logic
-  const filteredUsers = users
-    .filter((u) => {
-      const searchLower = searchText.toLowerCase();
-      const matchesSearch =
-        u.first_name.toLowerCase().includes(searchLower) ||
-        (u.last_name?.toLowerCase().includes(searchLower) ?? false) ||
-        u.email.toLowerCase().includes(searchLower);
+  useEffect(() => {
+    void fetchUsers();
+  }, [fetchUsers]);
 
-      if (!matchesSearch) return false;
+  const filteredUsers = useMemo(() => {
+    const query = search.trim().toLocaleLowerCase();
+
+    return users.filter((user) => {
+      const matchesFilter =
+        filter === "svi" ||
+        (filter === "aktivni" && user.enabled !== false) ||
+        (filter === "admini" && user.role === "admin");
+      const searchable = `${user.first_name} ${user.last_name ?? ""} ${user.email}`
+        .toLocaleLowerCase();
 
-      if (filter === "aktivni") return u.enabled !== false;
-      if (filter === "admini") return u.role === "admin";
-      return true;
+      return matchesFilter && searchable.includes(query);
     });
+  }, [filter, search, users]);
 
-  // Edit modal handlers
-  const onEdit = (user: AdminUser) => {
+  const openEditModal = (user: AdminUser) => {
     setEditingUser(user);
-    setEditForm({
-      first_name: user.first_name,
-      last_name: user.last_name || "",
-      role: user.role,
-      max_sessions_per_week: user.max_sessions_per_week,
-    });
-    setEditModal(true);
+    setFirstName(user.first_name);
+    setLastName(user.last_name ?? "");
+    setRole(user.role);
+    setMaxSessions(user.max_sessions_per_week);
   };
 
-  const onRemove = (user: AdminUser) => {
-    Alert.alert(
-      "Ukloni korisnika",
-      `${user.first_name} ${user.last_name || ""} i sve njegove rezervacije će biti uklonjeni.`,
-      [
-        { text: "Otkaži", style: "cancel" },
-        {
-          text: "Ukloni",
-          onPress: async () => {
-            try {
-              await deleteUser(user.id);
-              await fetchUsers();
-            } catch (err) {
-              Alert.alert("Greška", "Nije moguće obrisati korisnika");
-              if (__DEV__) console.error(err);
-            }
-          },
-          style: "destructive",
-        },
-      ]
-    );
+  const closeEditModal = () => {
+    if (!saving) setEditingUser(null);
   };
 
-  const onSaveEdit = async () => {
+  const saveUser = async () => {
     if (!editingUser) return;
 
+    const patch: UpdateUserPatch = {
+      first_name: firstName.trim(),
+      last_name: lastName.trim(),
+      role,
+      max_sessions_per_week: maxSessions,
+    };
+
     setSaving(true);
     try {
-      const patch: UpdateUserPatch = {
-        first_name: editForm.first_name || null,
-        last_name: editForm.last_name || null,
-        role: editForm.role,
-        max_sessions_per_week: editForm.max_sessions_per_week,
-      };
       await updateUser(editingUser.id, patch);
-      setEditModal(false);
       setEditingUser(null);
       await fetchUsers();
-    } catch (err) {
-      Alert.alert("Greška", "Nije moguće sačuvati promene");
-      if (__DEV__) console.error(err);
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
+      await fetchUsers();
     } finally {
       setSaving(false);
     }
   };
 
-  if (loading) {
+  const removeUser = async (user: AdminUser) => {
+    try {
+      await deleteUser(user.id);
+      setExpandedId(null);
+      await fetchUsers();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Korisnik nije uklonjen.");
+      await fetchUsers();
+    }
+  };
+
+  const confirmRemove = (user: AdminUser) => {
+    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();
+
+    Alert.alert(
+      "Ukloni korisnika",
+      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
+      [
+        { text: "Otkaži", style: "cancel" },
+        {
+          text: "Ukloni",
+          style: "destructive",
+          onPress: () => void removeUser(user),
+        },
+      ],
+    );
+  };
+
+  if (loading && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <ActivityIndicator size="large" color={Colors.burgundy} />
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
       </View>
     );
   }
 
-  if (error) {
+  if (hasError && users.length === 0) {
     return (
-      <View style={styles.centerContainer}>
-        <Text style={styles.errorText}>{error}</Text>
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
       </View>
     );
   }
 
   return (
-    <View style={styles.screen}>
-      {/* Header */}
-      <View style={styles.header}>
-        <Text style={styles.headerTitle}>Korisnici</Text>
-        <Text style={styles.headerSubtitle}>{users.length} članova</Text>
-      </View>
-
-      {/* Search */}
-      <TextInput
-        style={styles.searchInput}
-        placeholder="Pretraži članove…"
-        placeholderTextColor={Colors.inkMuted}
-        value={searchText}
-        onChangeText={setSearchText}
-      />
-
-      {/* Filter chips */}
-      <View style={styles.filterContainer}>
-        <FilterChips<FilterKey>
-          options={[
-            { key: "svi", label: "Svi" },
-            { key: "aktivni", label: "Aktivni" },
-            { key: "admini", label: "Admini" },
-          ]}
-          value={filter}
-          onChange={setFilter}
-        />
-      </View>
-
-      {/* User list */}
+    <>
       <FlatList
+        style={styles.screen}
+        contentContainerStyle={styles.content}
         data={filteredUsers}
-        keyExtractor={(u) => u.id}
+        keyExtractor={(user) => user.id}
+        showsVerticalScrollIndicator={false}
+        ItemSeparatorComponent={() => <View style={styles.listGap} />}
+        ListHeaderComponent={
+          <View style={styles.headerContent}>
+            <View>
+              <Text style={styles.title}>Korisnici</Text>
+              <Text style={styles.subtitle}>{users.length} članova</Text>
+            </View>
+            <TextInput
+              value={search}
+              onChangeText={setSearch}
+              placeholder="Pretraži članove…"
+              placeholderTextColor={Colors.inkFaint}
+              style={styles.searchInput}
+              autoCapitalize="none"
+              autoCorrect={false}
+            />
+            <FilterChips
+              options={FILTER_OPTIONS}
+              value={filter}
+              onChange={setFilter}
+            />
+          </View>
+        }
         renderItem={({ item, index }) => (
           <UserRow
             user={item}
             expanded={expandedId === item.id}
             onToggleExpand={() =>
-              setExpandedId(expandedId === item.id ? null : item.id)
+              setExpandedId((current) => (current === item.id ? null : item.id))
             }
-            onEdit={() => onEdit(item)}
-            onRemove={() => onRemove(item)}
+            onEdit={() => openEditModal(item)}
+            onRemove={() => confirmRemove(item)}
             tintIndex={index % 3}
           />
         )}
-        contentContainerStyle={styles.listContent}
-        scrollEnabled={false}
       />
 
-      {/* Edit Modal */}
       <Modal
         animationType="slide"
         transparent
-        visible={editModal}
-        onRequestClose={() => setEditModal(false)}
+        visible={editingUser !== null}
+        onRequestClose={closeEditModal}
       >
         <View style={styles.modalOverlay}>
-          <KeyboardAvoidingView behavior="padding" style={styles.modal}>
-            <ScrollView
-              contentContainerStyle={styles.modalContent}
-              keyboardShouldPersistTaps="handled"
-            >
-              <Text style={styles.modalTitle}>Izmena korisnika</Text>
+          <View style={styles.modalCard}>
+            <Text style={styles.modalTitle}>Izmena korisnika</Text>
 
-              {/* first_name */}
-              <Text style={styles.label}>IME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>IME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.first_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, first_name: v }))
-                }
+                value={firstName}
+                onChangeText={setFirstName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* last_name */}
-              <Text style={styles.label}>PREZIME</Text>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>PREZIME</Text>
               <TextInput
-                style={styles.input}
-                value={editForm.last_name}
-                onChangeText={(v) =>
-                  setEditForm((p) => ({ ...p, last_name: v }))
-                }
+                value={lastName}
+                onChangeText={setLastName}
+                style={styles.fieldInput}
+                editable={!saving}
               />
+            </View>
 
-              {/* role */}
-              <Text style={styles.label}>ULOGA</Text>
-              <FilterChips<"user" | "admin">
-                options={[
-                  { key: "user", label: "Član" },
-                  { key: "admin", label: "Admin" },
-                ]}
-                value={editForm.role}
-                onChange={(v) => setEditForm((p) => ({ ...p, role: v }))}
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>ULOGA</Text>
+              <FilterChips
+                options={ROLE_OPTIONS}
+                value={role}
+                onChange={setRole}
               />
+            </View>
 
-              {/* max_sessions_per_week stepper */}
-              <Text style={styles.label}>NEDELJNI LIMIT</Text>
-              <View style={styles.stepperContainer}>
+            <View style={styles.fieldGroup}>
+              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
+              <View style={styles.stepper}>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.max(
-                        0,
-                        p.max_sessions_per_week - 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 0}
+                  onPress={() => setMaxSessions((value) => Math.max(0, value - 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>−</Text>
+                  <Text style={styles.stepButtonText}>−</Text>
                 </Pressable>
-                <Text style={styles.stepperValue}>
-                  {editForm.max_sessions_per_week}
-                </Text>
+                <Text style={styles.stepValue}>{maxSessions}</Text>
                 <Pressable
-                  onPress={() =>
-                    setEditForm((p) => ({
-                      ...p,
-                      max_sessions_per_week: Math.min(
-                        14,
-                        p.max_sessions_per_week + 1
-                      ),
-                    }))
-                  }
-                  style={styles.stepperBtn}
+                  accessibilityRole="button"
+                  disabled={saving || maxSessions === 14}
+                  onPress={() => setMaxSessions((value) => Math.min(14, value + 1))}
+                  style={styles.stepButton}
                 >
-                  <Text style={styles.stepperBtnText}>+</Text>
+                  <Text style={styles.stepButtonText}>＋</Text>
                 </Pressable>
               </View>
+            </View>
 
-              {/* Footer actions */}
-              <View style={styles.modalFooter}>
-                <Pressable
-                  onPress={() => setEditModal(false)}
-                  style={styles.cancelBtn}
-                  disabled={saving}
-                >
-                  <Text style={styles.cancelBtnText}>Otkaži</Text>
-                </Pressable>
-                <Pressable
-                  onPress={onSaveEdit}
-                  style={[
-                    styles.saveBtn,
-                    saving && styles.saveBtnDisabled,
-                  ]}
-                  disabled={saving}
-                >
-                  {saving ? (
-                    <ActivityIndicator size="small" color={Colors.surface} />
-                  ) : (
-                    <Text style={styles.saveBtnText}>Sačuvaj</Text>
-                  )}
-                </Pressable>
-              </View>
-            </ScrollView>
-          </KeyboardAvoidingView>
+            <View style={styles.modalFooter}>
+              <Pressable
+                onPress={closeEditModal}
+                disabled={saving}
+                style={styles.cancelButton}
+              >
+                <Text style={styles.cancelButtonText}>Otkaži</Text>
+              </Pressable>
+              <Pressable
+                onPress={() => void saveUser()}
+                disabled={saving}
+                style={[styles.saveButton, saving && styles.buttonDisabled]}
+              >
+                {saving ? (
+                  <ActivityIndicator color={Colors.surface} />
+                ) : (
+                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
+                )}
+              </Pressable>
+            </View>
+          </View>
         </View>
       </Modal>
-    </View>
+    </>
   );
 }
 
@@ -321,33 +298,37 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    paddingHorizontal: Spacing.screenHorizontal || 20,
   },
-  centerContainer: {
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+  },
+  centeredState: {
     flex: 1,
+    alignItems: "center",
     justifyContent: "center",
-    alignItems: "center",
     backgroundColor: Colors.paper,
   },
   errorText: {
-    ...Typography.section,
+    ...Typography.body,
     color: Colors.inkMuted,
   },
-  header: {
-    paddingTop: 20,
-    paddingBottom: 16,
+  headerContent: {
+    gap: 16,
+    marginBottom: 16,
   },
-  headerTitle: {
-    fontFamily: FontFamilies.bricolage[800],
+  title: {
+    ...Typography.screenTitle,
     fontSize: 23,
-    fontWeight: "800",
     color: Colors.ink,
   },
-  headerSubtitle: {
+  subtitle: {
     fontFamily: FontFamilies.hanken[600],
     fontSize: 13,
     fontWeight: "600",
     color: Colors.inkMuted,
+    marginTop: 3,
   },
   searchInput: {
     backgroundColor: Colors.surface,
@@ -360,122 +341,114 @@
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
-    marginBottom: 16,
-  },
-  filterContainer: {
-    marginBottom: 16,
   },
-  listContent: {
-    gap: 12,
-    paddingBottom: 20,
+  listGap: {
+    height: 10,
   },
-  // Modal
   modalOverlay: {
     flex: 1,
-    backgroundColor: "rgba(0, 0, 0, 0.5)",
     justifyContent: "flex-end",
+    backgroundColor: "rgba(34, 31, 43, 0.35)",
   },
-  modal: {
-    flex: 1,
-    maxHeight: "90%",
-    backgroundColor: Colors.paper,
-    borderTopLeftRadius: Radii.tile[24],
-    borderTopRightRadius: Radii.tile[24],
-  },
-  modalContent: {
-    padding: Spacing.cardPadding || 20,
+  modalCard: {
+    backgroundColor: Colors.surface,
+    borderTopLeftRadius: Radii.card,
+    borderTopRightRadius: Radii.card,
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 24,
+    paddingBottom: 28,
     gap: 16,
+    ...Shadows.card,
   },
   modalTitle: {
     fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
+    fontSize: 21,
     fontWeight: "800",
     color: Colors.ink,
-    marginBottom: 8,
   },
-  label: {
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldLabel: {
     fontFamily: FontFamilies.hanken[700],
-    fontSize: 11,
+    fontSize: 10,
     fontWeight: "700",
     letterSpacing: 1,
-    textTransform: "uppercase",
-    color: Colors.ink,
+    color: Colors.inkMuted,
   },
-  input: {
+  fieldInput: {
     backgroundColor: Colors.surface,
     borderColor: Colors.fieldBorder,
     borderWidth: 1,
     borderRadius: Radii.tile[14],
     paddingHorizontal: 12,
-    paddingVertical: 12,
+    paddingVertical: 11,
     fontFamily: FontFamilies.hanken[600],
     fontSize: 14,
     fontWeight: "600",
     color: Colors.ink,
   },
-  stepperContainer: {
+  stepper: {
+    alignSelf: "flex-start",
     flexDirection: "row",
     alignItems: "center",
-    gap: 12,
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
   },
-  stepperBtn: {
-    width: 40,
-    height: 40,
-    borderRadius: Radii.tile[12],
-    backgroundColor: Colors.surfaceMuted,
-    justifyContent: "center",
+  stepButton: {
+    width: 44,
+    height: 42,
     alignItems: "center",
+    justifyContent: "center",
   },
-  stepperBtnText: {
-    fontFamily: FontFamilies.hanken[800],
-    fontSize: 18,
-    fontWeight: "800",
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 20,
+    fontWeight: "700",
     color: Colors.burgundy,
   },
-  stepperValue: {
-    flex: 1,
+  stepValue: {
+    minWidth: 44,
     textAlign: "center",
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 16,
-    fontWeight: "800",
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
   modalFooter: {
     flexDirection: "row",
-    gap: 12,
-    marginTop: 16,
+    gap: 10,
+    marginTop: 4,
   },
-  cancelBtn: {
+  cancelButton: {
     flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
-    borderColor: Colors.burgundyBorder,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderColor: Colors.burgundy,
     borderWidth: 1,
-    justifyContent: "center",
-    alignItems: "center",
+    borderRadius: Radii.tile[14],
   },
-  cancelBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
+  cancelButtonText: {
+    ...Typography.primaryButtonCompact,
     color: Colors.burgundy,
   },
-  saveBtn: {
-    flex: 1,
-    paddingVertical: 12,
-    borderRadius: Radii.tile[12],
+  saveButton: {
+    flex: 2,
+    alignItems: "center",
+    justifyContent: "center",
+    minHeight: 48,
+    borderRadius: Radii.tile[14],
     backgroundColor: Colors.burgundy,
-    justifyContent: "center",
-    alignItems: "center",
-    ...Shadows.primaryButton,
   },
-  saveBtnDisabled: {
+  saveButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
     opacity: 0.6,
-  },
-  saveBtnText: {
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 14,
-    fontWeight: "700",
-    color: Colors.surface,
   },
 });
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 5ff9c08c6c36ad11d37ae2b56f1e48e9638ab6e3..370de64bb181162ed7439dfdb42d667232871d81
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -1,11 +1,270 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Alert,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  TextInput,
+  View,
+} from "react-native";
+import { useLocalSearchParams, useRouter } from "expo-router";
+
+import { FilterChips, Toggle } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { TRAINING_DAYS } from "@/constants/days";
+import type { Day } from "@/constants/days";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { upsertSession } from "@/services/admin";
+import type { UpsertSessionInput } from "@/services/admin";
 
+const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map((day) => ({
+  key: day,
+  label: {
+    monday: "PON",
+    tuesday: "UTO",
+    wednesday: "SRE",
+    thursday: "ČET",
+    friday: "PET",
+    saturday: "SUB",
+    sunday: "NED",
+  }[day],
+}));
+
 export default function TrainingDetailScreen() {
+  const router = useRouter();
+  const { id } = useLocalSearchParams<{ id: string }>();
+  const isNew = id === "new";
+  const { trainings, loading, fetchTrainings } = useTrainings();
+  const training = trainings.find((item) => item.id === id);
+  const [title, setTitle] = useState("");
+  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
+  const [time, setTime] = useState("");
+  const [room, setRoom] = useState("");
+  const [durationMin, setDurationMin] = useState<number | null>(null);
+  const [maxParticipants, setMaxParticipants] = useState(10);
+  const [isOpen, setIsOpen] = useState(true);
+  const [submitting, setSubmitting] = useState(false);
+  const [initializedId, setInitializedId] = useState<string | null>(null);
+
+  useEffect(() => {
+    if (!training || initializedId === training.id) return;
+
+    setTitle(training.title);
+    setDayOfWeek(
+      TRAINING_DAYS.includes(training.day_of_week as Day)
+        ? (training.day_of_week as Day)
+        : "monday",
+    );
+    setTime(training.time);
+    setRoom(training.room ?? "");
+    setDurationMin(training.duration_min);
+    setMaxParticipants(
+      Math.min(50, Math.max(1, training.max_participants)),
+    );
+    setIsOpen(training.is_open);
+    setInitializedId(training.id);
+  }, [initializedId, training]);
+
+  const submit = async () => {
+    const normalizedTitle = title.trim();
+    const normalizedTime = time.trim();
+
+    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+      Alert.alert(
+        "Proverite podatke",
+        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
+      );
+      return;
+    }
+
+    const input: UpsertSessionInput = {
+      id: isNew ? null : id,
+      title: normalizedTitle,
+      day_of_week: dayOfWeek,
+      time: normalizedTime,
+      room: room.trim() || null,
+      duration_min: durationMin,
+      max_participants: maxParticipants,
+      is_open: isOpen,
+    };
+
+    setSubmitting(true);
+    try {
+      await upsertSession(input);
+      await fetchTrainings();
+      router.back();
+    } catch (error: unknown) {
+      console.error(error);
+      Alert.alert("Greška", "Trening nije sačuvan.");
+      await fetchTrainings();
+    } finally {
+      setSubmitting(false);
+    }
+  };
+
+  if (!isNew && loading && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (!isNew && !training) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
+        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
+          <Text style={styles.notFoundButtonText}>Nazad</Text>
+        </Pressable>
+      </View>
+    );
+  }
+
   return (
     <View style={styles.screen}>
-      <Text style={styles.title}>Training Detail</Text>
+      <View style={styles.navBar}>
+        <Pressable
+          accessibilityRole="button"
+          onPress={() => router.back()}
+          style={styles.backButton}
+        >
+          <Text style={styles.backChevron}>‹</Text>
+        </Pressable>
+        <Text style={styles.navTitle}>
+          {isNew ? "Novi trening" : "Izmena treninga"}
+        </Text>
+        <View style={styles.navSpacer} />
+      </View>
+
+      <ScrollView
+        style={styles.formScroll}
+        contentContainerStyle={styles.formContent}
+        keyboardShouldPersistTaps="handled"
+        showsVerticalScrollIndicator={false}
+      >
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
+          <TextInput
+            value={title}
+            onChangeText={setTitle}
+            editable={!submitting}
+            style={styles.input}
+          />
+        </View>
+
+        <View style={styles.fieldGroup}>
+          <Text style={styles.fieldLabel}>DAN</Text>
+          <FilterChips
+            options={DAY_OPTIONS}
+            value={dayOfWeek}
+            onChange={setDayOfWeek}
+          />
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>VREME</Text>
+            <TextInput
+              value={time}
+              onChangeText={setTime}
+              placeholder="18:00"
+              placeholderTextColor={Colors.inkFaint}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
+            <TextInput
+              value={durationMin?.toString() ?? ""}
+              onChangeText={(value) =>
+                setDurationMin(
+                  value === "" ? null : Number(value.replace(/\D/g, "")),
+                )
+              }
+              keyboardType="number-pad"
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+        </View>
+
+        <View style={styles.fieldRow}>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>SALA</Text>
+            <TextInput
+              value={room}
+              onChangeText={setRoom}
+              editable={!submitting}
+              style={styles.input}
+            />
+          </View>
+          <View style={styles.columnField}>
+            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
+            <View style={styles.stepper}>
+              <Pressable
+                disabled={submitting || maxParticipants === 1}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.max(1, value - 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>−</Text>
+              </Pressable>
+              <Text style={styles.stepValue}>{maxParticipants}</Text>
+              <Pressable
+                disabled={submitting || maxParticipants === 50}
+                onPress={() =>
+                  setMaxParticipants((value) => Math.min(50, value + 1))
+                }
+                style={styles.stepButton}
+              >
+                <Text style={styles.stepButtonText}>＋</Text>
+              </Pressable>
+            </View>
+          </View>
+        </View>
+
+        <View style={styles.statusCard}>
+          <View style={styles.statusTextBlock}>
+            <Text style={styles.statusTitle}>Status slota</Text>
+            <Text style={styles.statusDescription}>
+              Otvoren za prijave članova
+            </Text>
+          </View>
+          <Toggle
+            value={isOpen}
+            onValueChange={setIsOpen}
+            disabled={submitting}
+          />
+        </View>
+
+        <View style={styles.footer}>
+          <Pressable
+            onPress={() => router.back()}
+            disabled={submitting}
+            style={styles.cancelButton}
+          >
+            <Text style={styles.cancelButtonText}>Otkaži</Text>
+          </Pressable>
+          <Pressable
+            onPress={() => void submit()}
+            disabled={submitting}
+            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+          >
+            {submitting ? (
+              <ActivityIndicator color={Colors.surface} />
+            ) : (
+              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
+            )}
+          </Pressable>
+        </View>
+      </ScrollView>
     </View>
   );
 }
@@ -14,11 +273,194 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
+  },
+  centeredState: {
+    flex: 1,
+    alignItems: "center",
+    justifyContent: "center",
+    gap: 16,
+    backgroundColor: Colors.paper,
+  },
+  notFoundText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
+  notFoundButton: {
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    paddingHorizontal: 18,
+    paddingVertical: 10,
+  },
+  notFoundButtonText: {
+    ...Typography.primaryButtonCompact,
+    color: Colors.burgundy,
+  },
+  navBar: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 16,
+    paddingBottom: 12,
+    borderBottomColor: Colors.border,
+    borderBottomWidth: 1,
+  },
+  backButton: {
+    width: 38,
+    height: 38,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[12],
+    backgroundColor: Colors.surface,
+  },
+  backChevron: {
+    fontFamily: FontFamilies.hanken[500],
+    fontSize: 31,
+    fontWeight: "500",
+    lineHeight: 32,
+    color: Colors.burgundy,
+  },
+  navTitle: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 19,
+    fontWeight: "800",
+    color: Colors.ink,
+  },
+  navSpacer: {
+    width: 38,
+    height: 38,
+  },
+  formScroll: {
+    flex: 1,
+  },
+  formContent: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 22,
+    paddingBottom: 28,
+    gap: 20,
+  },
+  fieldGroup: {
+    gap: 7,
+  },
+  fieldRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  columnField: {
+    flex: 1,
+    gap: 7,
+  },
+  fieldLabel: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 10,
+    fontWeight: "700",
+    letterSpacing: 1,
+    color: Colors.inkMuted,
+  },
+  input: {
+    minHeight: 46,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    paddingHorizontal: 12,
+    paddingVertical: 11,
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 14,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  stepper: {
+    minHeight: 46,
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    overflow: "hidden",
+    borderColor: Colors.fieldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.surface,
+  },
+  stepButton: {
+    width: 38,
+    height: 44,
+    alignItems: "center",
     justifyContent: "center",
+  },
+  stepButtonText: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 19,
+    fontWeight: "700",
+    color: Colors.burgundy,
+  },
+  stepValue: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 15,
+    fontWeight: "700",
+    color: Colors.ink,
+  },
+  statusCard: {
+    flexDirection: "row",
     alignItems: "center",
+    justifyContent: "space-between",
+    gap: 16,
+    borderColor: Colors.goldBorder,
+    borderWidth: 1,
+    borderRadius: Radii.tile[16],
+    backgroundColor: Colors.surfaceWarm,
+    padding: Spacing.cardPadding,
+  },
+  statusTextBlock: {
+    flex: 1,
+    gap: 3,
   },
-  title: {
-    ...Typography.screenTitle,
+  statusTitle: {
+    fontFamily: FontFamilies.bricolage[700],
+    fontSize: 15,
+    fontWeight: "700",
     color: Colors.ink,
   },
+  statusDescription: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 12,
+    fontWeight: "600",
+    color: Colors.inkMuted,
+  },
+  footer: {
+    flexDirection: "row",
+    gap: 10,
+    marginTop: 4,
+  },
+  cancelButton: {
+    flex: 1,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderColor: Colors.burgundy,
+    borderWidth: 1,
+    borderRadius: Radii.tile[14],
+  },
+  cancelButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.burgundy,
+  },
+  saveButton: {
+    flex: 2,
+    minHeight: 50,
+    alignItems: "center",
+    justifyContent: "center",
+    borderRadius: Radii.tile[14],
+    backgroundColor: Colors.burgundy,
+    ...Shadows.primaryButton,
+  },
+  saveButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
+  buttonDisabled: {
+    opacity: 0.6,
+  },
 });

tokens used
57,781
Implemented:

- [users.tsx](</Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/users.tsx>)
- [sessions.tsx](</Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/sessions.tsx>)
- [[id].tsx](</Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/training/[id].tsx>)

Verification passed:

- `tsc --noEmit`
- ESLint on `app/(admin)` and `src/components/admin`

DONE
