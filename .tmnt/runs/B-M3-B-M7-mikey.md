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
session id: 019f0af0-6a23-7490-bbfd-14569beb567b
--------
user
TASK: Implement Pregled (Dashboard) and Statistika (Stats) screens for admin UI

CONTEXT
Design source: /Users/uros/Desktop/design_handoff_perun_redesign/README.md (§5 Pregled, §9 Statistika)
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Framework: React Native (Expo) with Tauri 2, TypeScript strict
Files to consider (read before changing):
- app/(admin)/(tabs)/index.tsx (current placeholder)
- app/(admin)/(tabs)/stats.tsx (current placeholder)
- src/components/admin/StatTile.tsx (props: figure, label, figureColor?, delta?, deltaColor?)
- src/components/admin/BarChart.tsx (props: data:[{label,value}][], currentIndex?, showValueLabelOnCurrent?)
- src/components/admin/FilterChips.tsx (generic options/value/onChange)
- src/services/admin/stats.ts (memberSeries(months), occupancySummary(period))
- src/hooks/useTrainings.ts (returns {trainings: Training[], ...})
- src/types/Training.ts (Training type with day_of_week, is_open, session_participants[])
- src/constants/Colors.ts, spacing.ts, typography.ts
- src/constants/... Serbian month/day enums if they exist (otherwise create minimal inline maps)

CODING CONSTRAINTS (non-negotiable)
- Simplicity first: minimum code that solves the problem. No speculative features.
- Surgical changes: touch only the two screen files listed. Do not refactor adjacent components.
- Match existing patterns: use ScrollView for both screens, paper bg, paddingHorizontal Spacing.screenHorizontal=20, showsVerticalScrollIndicator=false, contentContainerStyle paddingBottom ~24.
- Reuse existing components: StatTile, BarChart, FilterChips. Do not create new tokens or design components.
- No new dependencies. RN primitives only.
- NO AdminHeader inside these screens — the layout provides it.
- TypeScript strict, no `any`.
- If a Serbian month/day enum doesn't exist in constants, define a small inline map in each file (e.g., MONTHS_LC, DAY_ABBR). Do not add a shared utility.
- REAL DATA ONLY — every figure must come from RPCs or useTrainings. Never hardcode mock values.

== B-M3 — Pregled (app/(admin)/(tabs)/index.tsx) ==
Load on mount: memberSeries(6) and occupancySummary("6"). Also read useTrainings().trainings.
Show ActivityIndicator while loading; on error console.error + simple "Greška pri učitavanju" text (no crash).

Content:
1. Greeting: "Zdravo, Admin" (Typography.greeting, ink) + subtitle "Pregled centra · {monthLowercase} {year}" (Hanken 13.5/600 inkMuted). Use new Date() to derive current month/year.
2. 2×2 StatTile grid (two rows of two, gap 11, each flex:1):
   - figure = latest memberSeries.total_members; label "aktivnih članova"; figureColor burgundy; delta = "▲ +{occupancy.new_this_month} ovog meseca" (#4E7A5C) [omit if new_this_month === 0].
   - figure = `${occupancy.avg_pct}%`; label "popunjenost"; figureColor goldDeep [no delta].
   - figure = `${trainings.length}`; label "treninga ove nedelje"; figureColor ink [no delta].
   - figure = count of trainings where is_open && day_of_week === today (enum); label "otvorenih slotova danas"; figureColor sage [no delta].
3. Trend chart card (white, border, Radii.tile[18], Shadows.card, padding 16):
   - Header row: micro label "ČLANOVI PO MESECU" (Typography.microLabel inkFaint) + green badge "▲ {pct}% / 6m" (#4E7A5C on #E9F1EB pill) where pct = round((last.total_members - first.total_members) / max(first, 1) * 100). If first === 0 or no data, show "—".
   - <BarChart data={memberSeries.map(p=>({label:monthAbbrevFrom(p.month), value:p.total_members}))} currentIndex={len-1} showValueLabelOnCurrent={true} />
4. Full-width burgundy button "＋ Novi trening" (Radii.tile[16], Shadows.primaryButton, padding 16, Typography.primaryButton white), onPress router.push("/(admin)/training/new").

== B-M7 — Statistika (app/(admin)/(tabs)/stats.tsx) ==
State: selectedPeriod in {"12", "6", "all"} (default "12"); months = 12 | 6 | 24 (for "all").
Reload memberSeries(months) + occupancySummary(selectedPeriod) when selectedPeriod changes.
Loading + error handling: ActivityIndicator while loading, console.error on error, simple "Greška pri učitavanju" fallback.

Content:
1. Title "Statistika" (override screenTitle fontSize to 23) + subtitle "Trendovi članstva i posećenosti" (Hanken 13.5/600 inkMuted).
2. FilterChips options=[{key:"12",label:"12 meseci"},{key:"6",label:"6 meseci"},{key:"all",label:"Sve"}], value=selectedPeriod, onChange=setSelectedPeriod.
3. Members chart card: micro label "ČLANOVA UKUPNO" + big figure = latest total_members (Bricolage 28/800 ink) + green badge "▲ {pct}% / {months}m" (same logic as Pregled). Then <BarChart data={...} currentIndex={len-1} />.
4. Secondary tiles row (gap 12, flex:1 each, two cards):
   - "NOVIH / MES." → figure +{occupancy.new_this_month} goldDeep, delta "▲ vs +{occupancy.prev_new} (prošli mesec)" in #4E7A5C (or factual, no arrow if prev_new >= new_this_month).
   - "PROS. POPUNJ." → figure {occupancy.avg_pct}% burgundy, delta "najjači dan: {DAY_ABBR[occupancy.top_day]}" in inkMuted.
   (You may reuse StatTile or build inline; match StatTile look, keep consistent.)

== Helpers ==
Create inline (no shared util):
- MONTHS_LC: Serbian 3-letter month abbreviations (jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec) [actually, uppercase like JAN..DEC; match design].
- DAY_ABBR: Enum string "monday".."sunday" -> Serbian 3-letter ("PON", "UTO", "SRE", "ČET", "PET", "SUB", "NED").
- monthAbbrevFrom(isoMonth: string) -> 3-letter abbrev from "YYYY-MM".
- getTodayEnum() -> day_of_week enum string ("monday".."sunday") from new Date().getDay().

DEFINITION OF DONE
- Both screens render with REAL data from memberSeries/occupancySummary/useTrainings. Loading + error states.
- No AdminHeader inside screens. ScrollView wrapper, paper bg, correct spacing/padding.
- Reuse StatTile/BarChart/FilterChips. Match design spec: figures, labels, colors, deltas.
- `npx tsc --noEmit` exits 0 (no type errors, strict mode).
- `npx eslint "app/(admin)" src/components/admin` reports no NEW errors.
- No commit.

Output: produce the code changes. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the two screens, reused components, service/type contracts, constants, and the referenced design sections before editing. Then I’ll run TypeScript and the scoped ESLint command.
exec
/bin/zsh -lc "sed -n '1,240p' 'app/(admin)/(tabs)/index.tsx'
sed -n '1,260p' 'app/(admin)/(tabs)/stats.tsx'
sed -n '1,220p' src/components/admin/StatTile.tsx
sed -n '1,240p' src/components/admin/BarChart.tsx
sed -n '1,220p' src/components/admin/FilterChips.tsx" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
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
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/typography";

export default function StatsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Statistika</Text>
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
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies } from "@/constants/typography";

interface StatTileProps {
  figure: string;
  label: string;
  figureColor?: string;
  delta?: string;
  deltaColor?: string;
}

export default function StatTile({ figure, label, figureColor = Colors.ink, delta, deltaColor }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.figure, { color: figureColor }]}>{figure}</Text>
      <Text style={styles.label}>{label}</Text>
      {delta && <Text style={[styles.delta, { color: deltaColor }]}>{delta}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    gap: 4,
    ...Shadows.card,
  },
  figure: { fontFamily: FontFamilies.bricolage[800], fontSize: 26, fontWeight: "800" },
  label: { fontFamily: FontFamilies.hanken[600], fontSize: 11.5, fontWeight: "600", color: Colors.inkMuted },
  delta: { fontFamily: FontFamilies.hanken[700], fontSize: 11, fontWeight: "700" },
});
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { FontFamilies } from "@/constants/typography";

interface BarChartProps {
  data: { label: string; value: number }[];
  currentIndex?: number;
  showValueLabelOnCurrent?: boolean;
}

export default function BarChart({ data, currentIndex = 0, showValueLabelOnCurrent = false }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 120;

  return (
    <View style={styles.container}>
      {data.map((item, idx) => {
        const barHeight = Math.max((item.value / maxValue) * chartHeight, 4);
        const isCurrentIdx = idx === currentIndex;
        const barColor = isCurrentIdx ? Colors.burgundy : Colors.gold;

        return (
          <View key={idx} style={styles.barColumn}>
            {showValueLabelOnCurrent && isCurrentIdx && (
              <Text style={styles.valueLabel}>{item.value}</Text>
            )}
            <View style={[styles.bar, { height: barHeight, backgroundColor: barColor }]}>
              <View style={[styles.highlight, { height: 3 }]} />
            </View>
            <Text style={styles.barLabel}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: 4, justifyContent: "space-evenly", height: 160 },
  barColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 2 },
  bar: { width: "100%", borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  highlight: { backgroundColor: Colors.goldTint, width: "100%" },
  barLabel: { fontFamily: FontFamilies.hanken[700], fontSize: 9, fontWeight: "700", color: Colors.inkFaint },
  valueLabel: { fontFamily: FontFamilies.bricolage[800], fontSize: 14, fontWeight: "800", color: Colors.ink, marginBottom: 4 },
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

exec
/bin/zsh -lc "sed -n '1,260p' src/services/admin/stats.ts
sed -n '1,260p' src/hooks/useTrainings.ts
sed -n '1,260p' src/types/Training.ts
sed -n '1,260p' src/constants/Colors.ts
sed -n '1,260p' src/constants/spacing.ts
sed -n '1,300p' src/constants/typography.ts
rg -n \"monday|MONTH|Mesec|month|DAY_ABBR|day_of_week|PON|JAN\" src/constants src/types app | head -200" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
import { supabase } from "../supabase/client";
import { MemberSeriesPoint, OccupancySummary } from "./types";

export async function memberSeries(
  months: number,
): Promise<MemberSeriesPoint[]> {
  const { data, error } = await supabase.rpc("admin_member_series", {
    p_months: months,
  });

  if (error) throw error;
  return (data ?? []) as MemberSeriesPoint[];
}

export async function occupancySummary(
  period: string,
): Promise<OccupancySummary | null> {
  const { data, error } = await supabase.rpc("admin_occupancy_summary", {
    p_period: period,
  });

  if (error) throw error;
  return (data?.[0] ?? null) as OccupancySummary | null;
}
import { useContext } from "react";

import { TrainingContext } from "@/contexts/TrainingContext";

export function useTrainings() {
  return useContext(TrainingContext);
}
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
src/types/Training.ts:3:  day_of_week: string;
app/(tabs)/_layout.tsx:18:  monday: "PONEDELJAK",
app/(tabs)/_layout.tsx:26:const MONTH_NAMES = [
app/(tabs)/_layout.tsx:27:  "JAN",
app/(tabs)/_layout.tsx:42:  const [selectedDay, setSelectedDay] = useState<Day>("monday");
app/(tabs)/_layout.tsx:47:  const dateLabel = `${selectedDate.getUTCDate()}. ${MONTH_NAMES[selectedDate.getUTCMonth()]}`;
app/profile.tsx:16:  monday: "PON",
app/profile.tsx:46:        isTrainingDay(training.day_of_week) &&
app/profile.tsx:53:        weekDates[a.day_of_week as Day].getTime() -
app/profile.tsx:54:        weekDates[b.day_of_week as Day].getTime();
app/profile.tsx:179:            const day = training.day_of_week as Day;
src/constants/days.ts:2:// DAYS array includes all 7 days for completeness (matching DB schema day_of_week field).
src/constants/days.ts:8:  | "monday"
src/constants/days.ts:18:  "monday",
src/constants/days.ts:28:  "monday",
src/constants/__tests__/days.test.ts:6:    "monday",
src/constants/__tests__/days.test.ts:14:    "monday",

exec
/bin/zsh -lc "sed -n '1,220p' src/services/admin/types.ts
sed -n '1,160p' src/constants/days.ts
rg -n \"§5|Pregled|§9|Statistika\" '/Users/uros/Desktop/design_handoff_perun_redesign/README.md'" in /Users/uros/Documents/Private/Projects/PerunApp
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
320:border `border`, ~24 bottom padding for the home indicator). Four tabs: **Pregled**,
321:**Korisnici**, **Treninzi**, **Statistika**. Active tab = `burgundy` icon + label (700);
325:## 5. Admin — Pregled (Dashboard)
329:- **Greeting**: "Zdravo, Admin" (Bricolage 25/800) + "Pregled centra · jun 2026."
341:- Bottom nav, **Pregled** active.
388:## 9. Admin — Statistika
390:- **Header**: "Statistika" + "Trendovi članstva i posećenosti".
397:- Bottom nav, **Statistika** active.

exec
/bin/zsh -lc "sed -n '300,420p' '/Users/uros/Desktop/design_handoff_perun_redesign/README.md'
find 'app/(admin)' -maxdepth 3 -type f -name '*.tsx' -print
sed -n '1,280p' 'app/(admin)/(tabs)/users.tsx'
sed -n '1,280p' 'app/(admin)/(tabs)/trainings.tsx'
sed -n '1,240p' 'app/(admin)/(tabs)/_layout.tsx'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
- `src/components/DayFilter.tsx` → week selector
- `src/components/AlertBar.tsx` → weekly progress / limit alert
- `src/components/TreiningCard.tsx` → TrainingCard (all states)
- `src/constants/Colors.ts` → replace with the token table above
- New: a Profile screen (Screen 4) — not present in the current repo; add a route/tab.

> Note the existing component filename is `TreiningCard.tsx` (typo for "Training"). Keep or
> rename consistently — your call.

---

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
app/(admin)/training/[id].tsx
app/(admin)/(tabs)/index.tsx
app/(admin)/(tabs)/sessions.tsx
app/(admin)/(tabs)/stats.tsx
app/(admin)/(tabs)/users.tsx
app/(admin)/(tabs)/_layout.tsx
app/(admin)/_layout.tsx
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
sed: app/(admin)/(tabs)/trainings.tsx: No such file or directory
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

exec
/bin/zsh -lc "sed -n '1,320p' src/contexts/TrainingContext.tsx
sed -n '1,320p' 'app/(admin)/(tabs)/sessions.tsx'
sed -n '1,340p' 'app/(admin)/training/[id].tsx'
cat tsconfig.json
cat package.json" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
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

codex
The contracts return nullable occupancy data and may return an empty member series. I’ll treat a missing occupancy summary as a load error, while rendering “—” for an empty series so no synthetic figures are introduced. Dashboard loading will also wait for `useTrainings().loading`.
apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/index.tsx
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/stats.tsx
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..5ec82ccefc47938324c0d9e12a1084a8db68ce5b
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,190 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months = selectedPeriod === "all" ? 24 : Number(selectedPeriod);
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay = DAY_ABBR[occupancy.top_day] ?? occupancy.top_day.toUpperCase() ?? "—";
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay || "—"}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +192,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
   },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..5ec82ccefc47938324c0d9e12a1084a8db68ce5b
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,190 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months = selectedPeriod === "all" ? 24 : Number(selectedPeriod);
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay = DAY_ABBR[occupancy.top_day] ?? occupancy.top_day.toUpperCase() ?? "—";
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay || "—"}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +192,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
   },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

exec
/bin/zsh -lc "npx prettier --write 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx'
npx tsc --noEmit" in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..5ec82ccefc47938324c0d9e12a1084a8db68ce5b
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,190 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months = selectedPeriod === "all" ? 24 : Number(selectedPeriod);
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay = DAY_ABBR[occupancy.top_day] ?? occupancy.top_day.toUpperCase() ?? "—";
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay || "—"}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +192,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
   },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

 succeeded in 2256ms:
app/(admin)/(tabs)/index.tsx 59ms
app/(admin)/(tabs)/stats.tsx 23ms

codex
Both screens are implemented and TypeScript passes. I’m running the requested scoped lint now, then I’ll inspect the diff for accidental changes and any layout/data edge cases.
exec
/bin/zsh -lc "npx eslint 'app/(admin)' src/components/admin" in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..5ec82ccefc47938324c0d9e12a1084a8db68ce5b
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,190 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months = selectedPeriod === "all" ? 24 : Number(selectedPeriod);
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay = DAY_ABBR[occupancy.top_day] ?? occupancy.top_day.toUpperCase() ?? "—";
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay || "—"}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +192,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
   },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

 succeeded in 1420ms:
exec
/bin/zsh -lc "git status --short
git diff --check
git diff -- 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
 M .claude/agents/memory/michelangelo-memory.md
 M app/_layout.tsx
?? .claude/agents/tmnt/session-logs/2026-06-27-S7-michelangelo.md
?? .tmnt/runs/B-M3-B-M7-mikey.md
?? .tmnt/runs/B-M8-B-M2-B-M1-mikey.md
?? .tmnt/runs/B-M8-components.md
?? app/(admin)/
?? src/components/admin/

diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..5ec82ccefc47938324c0d9e12a1084a8db68ce5b
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,190 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months = selectedPeriod === "all" ? 24 : Number(selectedPeriod);
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay = DAY_ABBR[occupancy.top_day] ?? occupancy.top_day.toUpperCase() ?? "—";
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay || "—"}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +192,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
   },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

exec
/bin/zsh -lc "sed -n '1,360p' 'app/(admin)/(tabs)/index.tsx'
sed -n '1,380p' 'app/(admin)/(tabs)/stats.tsx'
rg -n \"admin_member_series|admin_occupancy_summary\" . --glob '"'!node_modules/**'"' --glob '"'!.git/**'"'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
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
  greeting: {
    ...Typography.greeting,
    color: Colors.ink,
  },
  subtitle: {
    ...Typography.meta,
    color: Colors.inkMuted,
    marginTop: 3,
  },
  tileGrid: {
    gap: 11,
  },
  tileRow: {
    flexDirection: "row",
    gap: 11,
  },
  tileCell: {
    flex: 1,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    ...Shadows.card,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  microLabel: {
    ...Typography.microLabel,
    color: Colors.inkFaint,
  },
  trendBadge: {
    borderRadius: Radii.chip,
    backgroundColor: "#E9F1EB",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  trendText: {
    ...Typography.chip,
    color: "#4E7A5C",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: Radii.tile[16],
    padding: 16,
    ...Shadows.primaryButton,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    ...Typography.primaryButton,
    color: Colors.surface,
  },
});
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
  const months = selectedPeriod === "all" ? 24 : Number(selectedPeriod);

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
    DAY_ABBR[occupancy.top_day] ?? occupancy.top_day.toUpperCase() ?? "—";

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
            najjači dan: {topDay || "—"}
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
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    ...Shadows.card,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  microLabel: {
    ...Typography.microLabel,
    color: Colors.inkFaint,
  },
  memberFigure: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 28,
    fontWeight: "800",
    color: Colors.ink,
    marginTop: 3,
  },
  trendBadge: {
    borderRadius: Radii.chip,
    backgroundColor: "#E9F1EB",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  trendText: {
    ...Typography.chip,
    color: "#4E7A5C",
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryTile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    gap: 4,
    ...Shadows.card,
  },
  secondaryFigure: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 26,
    fontWeight: "800",
  },
  secondaryDelta: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 11,
    fontWeight: "700",
  },
});
./src/services/admin/stats.ts:7:  const { data, error } = await supabase.rpc("admin_member_series", {
./src/services/admin/stats.ts:18:  const { data, error } = await supabase.rpc("admin_occupancy_summary", {
./supabase/migrations/20260627170300_admin_stats.sql:7:create or replace function public.admin_member_series(p_months integer)
./supabase/migrations/20260627170300_admin_stats.sql:59:revoke all on function public.admin_member_series(integer) from public, anon;
./supabase/migrations/20260627170300_admin_stats.sql:60:grant execute on function public.admin_member_series(integer) to authenticated;
./supabase/migrations/20260627170300_admin_stats.sql:68:create or replace function public.admin_occupancy_summary(p_period text)
./supabase/migrations/20260627170300_admin_stats.sql:134:revoke all on function public.admin_occupancy_summary(text) from public, anon;
./supabase/migrations/20260627170300_admin_stats.sql:135:grant execute on function public.admin_occupancy_summary(text) to authenticated;

diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..5ec82ccefc47938324c0d9e12a1084a8db68ce5b
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,190 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months = selectedPeriod === "all" ? 24 : Number(selectedPeriod);
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay = DAY_ABBR[occupancy.top_day] ?? occupancy.top_day.toUpperCase() ?? "—";
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay || "—"}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +192,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
   },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

exec
/bin/zsh -lc "sed -n '1,160p' supabase/migrations/20260627170300_admin_stats.sql" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
begin;

-- Member growth series: new + cumulative members per month (last N months).
-- Source of truth = auth.users.created_at (never deleted, even after profile
-- removal). Timezone = Europe/Belgrade (consistent with the rest of the app).
-- plpgsql (not sql) so we can enforce the admin guard with raise.
create or replace function public.admin_member_series(p_months integer)
returns table(month text, total_members bigint, new_members bigint)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  return query
  with date_series as (
    select
      (date_trunc('month', now() at time zone 'Europe/Belgrade')::date
        - (interval '1 month' * i))::date as month_start
    from generate_series(0, p_months - 1) as i
  ),
  month_boundaries as (
    select
      month_start,
      (month_start + interval '1 month' - interval '1 day')::date as month_end,
      to_char(month_start, 'YYYY-MM') as month_text
    from date_series
  ),
  new_counts as (
    select
      mb.month_text,
      mb.month_start,
      coalesce(count(*) filter (
        where au.created_at at time zone 'Europe/Belgrade' >= mb.month_start
          and au.created_at at time zone 'Europe/Belgrade' <= (mb.month_end || ' 23:59:59')::timestamp
      ), 0) as new_in_month
    from month_boundaries mb
    cross join auth.users au
    group by mb.month_text, mb.month_start
  )
  select
    nc.month_text as month,
    (
      select coalesce(count(*), 0)
      from auth.users au
      where au.created_at at time zone 'Europe/Belgrade'
        <= ((nc.month_start + interval '1 month' - interval '1 day')::date || ' 23:59:59')::timestamp
    )::bigint as total_members,
    nc.new_in_month::bigint as new_members
  from new_counts nc
  order by nc.month_start asc;
end;
$$;

revoke all on function public.admin_member_series(integer) from public, anon;
grant execute on function public.admin_member_series(integer) to authenticated;

-- Occupancy + recruitment summary.
-- CAVEAT: session_participants is wiped every Sunday 00:00 Europe/Belgrade, so
-- occupancy is a CURRENT snapshot, not historical. Member growth
-- (new_this_month/prev_new) comes from auth.users, which persists.
-- p_period is accepted for signature stability with the chart period control
-- but does not change the math.
create or replace function public.admin_occupancy_summary(p_period text)
returns table(avg_pct numeric, top_day text, new_this_month bigint, prev_new bigint)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  return query
  with session_occupancy as (
    select
      (count(sp.user_id)::numeric / nullif(s.max_participants::numeric, 0) * 100) as occupancy_pct
    from public.sessions s
    left join public.session_participants sp on sp.session_id = s.id
    group by s.id, s.max_participants
  ),
  occupancy_avg as (
    select coalesce(round(avg(occupancy_pct), 1), 0) as avg_occupancy
    from session_occupancy
  ),
  session_day_counts as (
    select s.day_of_week, count(sp.user_id) as booking_count
    from public.sessions s
    left join public.session_participants sp on sp.session_id = s.id
    group by s.day_of_week
  ),
  top_day_result as (
    select sdc.day_of_week
    from session_day_counts sdc
    order by sdc.booking_count desc
    limit 1
  ),
  month_boundaries as (
    select
      date_trunc('month', now() at time zone 'Europe/Belgrade')::date as curr_month_start,
      (date_trunc('month', now() at time zone 'Europe/Belgrade')::date - interval '1 month')::date as prev_month_start,
      ((date_trunc('month', now() at time zone 'Europe/Belgrade')::date + interval '1 month' - interval '1 day')::date || ' 23:59:59')::timestamp as curr_month_end,
      ((date_trunc('month', now() at time zone 'Europe/Belgrade')::date - interval '1 day')::date || ' 23:59:59')::timestamp as prev_month_end
  ),
  new_counts as (
    select
      coalesce(count(*) filter (
        where au.created_at at time zone 'Europe/Belgrade' >= mb.curr_month_start
          and au.created_at at time zone 'Europe/Belgrade' <= mb.curr_month_end
      ), 0) as new_current,
      coalesce(count(*) filter (
        where au.created_at at time zone 'Europe/Belgrade' >= mb.prev_month_start
          and au.created_at at time zone 'Europe/Belgrade' <= mb.prev_month_end
      ), 0) as new_previous
    from auth.users au
    cross join month_boundaries mb
  )
  select
    oa.avg_occupancy::numeric as avg_pct,
    coalesce((select td.day_of_week::text from top_day_result td), '') as top_day,
    nc.new_current::bigint as new_this_month,
    nc.new_previous::bigint as prev_new
  from occupancy_avg oa
  cross join new_counts nc;
end;
$$;

revoke all on function public.admin_occupancy_summary(text) from public, anon;
grant execute on function public.admin_occupancy_summary(text) to authenticated;

commit;

diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..5ec82ccefc47938324c0d9e12a1084a8db68ce5b
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,190 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months = selectedPeriod === "all" ? 24 : Number(selectedPeriod);
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay = DAY_ABBR[occupancy.top_day] ?? occupancy.top_day.toUpperCase() ?? "—";
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay || "—"}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +192,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
   },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

exec
/bin/zsh -lc "sed -n '20,45p' 'app/(tabs)/_layout.tsx'
git diff --numstat -- 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx'
git ls-files --error-unmatch 'app/(admin)/(tabs)/index.tsx' >/dev/null 2>&1; echo "'$?' in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
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
1

diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..5ec82ccefc47938324c0d9e12a1084a8db68ce5b
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,190 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months = selectedPeriod === "all" ? 24 : Number(selectedPeriod);
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay = DAY_ABBR[occupancy.top_day] ?? occupancy.top_day.toUpperCase() ?? "—";
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay || "—"}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +192,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
   },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/stats.tsx
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..1a8613947ee3937ebfc39864b64cca82e3ad100a
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,189 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months = selectedPeriod === "all" ? 24 : Number(selectedPeriod);
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay =
+    DAY_ABBR[occupancy.top_day] ??
+    (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +191,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
+    alignItems: "center",
     justifyContent: "center",
-    alignItems: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..1a8613947ee3937ebfc39864b64cca82e3ad100a
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,189 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months = selectedPeriod === "all" ? 24 : Number(selectedPeriod);
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay =
+    DAY_ABBR[occupancy.top_day] ??
+    (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +191,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
+    alignItems: "center",
     justifyContent: "center",
-    alignItems: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/stats.tsx
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..23542459a42a8a534685faae85a0dfe5a6e77157
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,190 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months: 12 | 6 | 24 =
+    selectedPeriod === "all" ? 24 : selectedPeriod === "12" ? 12 : 6;
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay =
+    DAY_ABBR[occupancy.top_day] ??
+    (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +192,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
   },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..23542459a42a8a534685faae85a0dfe5a6e77157
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,190 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months: 12 | 6 | 24 =
+    selectedPeriod === "all" ? 24 : selectedPeriod === "12" ? 12 : 6;
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay =
+    DAY_ABBR[occupancy.top_day] ??
+    (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +192,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
   },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

exec
/bin/zsh -lc "npx prettier --check 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx'
npx tsc --noEmit
npx eslint 'app/(admin)' src/components/admin
git diff --check" in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..23542459a42a8a534685faae85a0dfe5a6e77157
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,190 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months: 12 | 6 | 24 =
+    selectedPeriod === "all" ? 24 : selectedPeriod === "12" ? 12 : 6;
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay =
+    DAY_ABBR[occupancy.top_day] ??
+    (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +192,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
   },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

 succeeded in 3714ms:
Checking formatting...
All matched files use Prettier code style!

codex
Implemented both admin screens with real RPC/training data, loading/error states, charts, filters, tiles, and navigation.

Validated:

- `npx tsc --noEmit`
- Scoped ESLint
- Prettier
- `git diff --check`

DONE
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 31c973fd15a1f0f63a7c85069474462dc61ef1d2..745f90283a7c9853578fd2942c0ab6cfe9cfc804
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -1,12 +1,209 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  Pressable,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+import { useRouter } from "expo-router";
+
+import BarChart from "@/components/admin/BarChart";
+import StatTile from "@/components/admin/StatTile";
 import { Colors } from "@/constants/Colors";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { Typography } from "@/constants/typography";
+import { useTrainings } from "@/hooks/useTrainings";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+import type { Day } from "@/constants/days";
 
+const MONTHS_LC = [
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
+
+const DAYS_BY_INDEX: readonly Day[] = [
+  "sunday",
+  "monday",
+  "tuesday",
+  "wednesday",
+  "thursday",
+  "friday",
+  "saturday",
+];
+
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function getTodayEnum() {
+  return DAYS_BY_INDEX[new Date().getDay()];
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function PregledScreen() {
+  const router = useRouter();
+  const { trainings, loading: trainingsLoading } = useTrainings();
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+
+  useEffect(() => {
+    let active = true;
+
+    Promise.all([memberSeries(6), occupancySummary("6")])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, []);
+
+  if (loading || trainingsLoading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const now = new Date();
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const today = getTodayEnum();
+  const openToday = trainings.filter(
+    (training) => training.is_open && training.day_of_week === today,
+  ).length;
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Pregled</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.greeting}>Zdravo, Admin</Text>
+        <Text style={styles.subtitle}>
+          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()} {now.getFullYear()}
+        </Text>
+      </View>
+
+      <View style={styles.tileGrid}>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={latestMembers?.toString() ?? "—"}
+              label="aktivnih članova"
+              figureColor={Colors.burgundy}
+              delta={
+                occupancy.new_this_month === 0
+                  ? undefined
+                  : `▲ +${occupancy.new_this_month} ovog meseca`
+              }
+              deltaColor="#4E7A5C"
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={`${occupancy.avg_pct}%`}
+              label="popunjenost"
+              figureColor={Colors.goldDeep}
+            />
+          </View>
+        </View>
+        <View style={styles.tileRow}>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={trainings.length.toString()}
+              label="treninga ove nedelje"
+              figureColor={Colors.ink}
+            />
+          </View>
+          <View style={styles.tileCell}>
+            <StatTile
+              figure={openToday.toString()}
+              label="otvorenih slotova danas"
+              figureColor={Colors.sage}
+            />
+          </View>
+        </View>
+      </View>
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / 6m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart
+          data={chartData}
+          currentIndex={chartData.length - 1}
+          showValueLabelOnCurrent
+        />
+      </View>
+
+      <Pressable
+        accessibilityRole="button"
+        onPress={() => router.push("/(admin)/training/new")}
+        style={({ pressed }) => [
+          styles.primaryButton,
+          pressed && styles.primaryButtonPressed,
+        ]}
+      >
+        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
+      </Pressable>
+    </ScrollView>
   );
 }
 
@@ -14,11 +211,82 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
+  },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
   },
-  title: {
-    ...Typography.screenTitle,
+  greeting: {
+    ...Typography.greeting,
     color: Colors.ink,
   },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  tileGrid: {
+    gap: 11,
+  },
+  tileRow: {
+    flexDirection: "row",
+    gap: 11,
+  },
+  tileCell: {
+    flex: 1,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  primaryButton: {
+    alignItems: "center",
+    backgroundColor: Colors.burgundy,
+    borderRadius: Radii.tile[16],
+    padding: 16,
+    ...Shadows.primaryButton,
+  },
+  primaryButtonPressed: {
+    opacity: 0.9,
+  },
+  primaryButtonText: {
+    ...Typography.primaryButton,
+    color: Colors.surface,
+  },
 });
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index aca30fa84a00926dfe30a8927b2048351d39fbeb..23542459a42a8a534685faae85a0dfe5a6e77157
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -1,12 +1,190 @@
-import { View, Text, StyleSheet } from "react-native";
+import { useEffect, useState } from "react";
+import {
+  ActivityIndicator,
+  ScrollView,
+  StyleSheet,
+  Text,
+  View,
+} from "react-native";
+
+import BarChart from "@/components/admin/BarChart";
+import FilterChips from "@/components/admin/FilterChips";
 import { Colors } from "@/constants/Colors";
-import { Typography } from "@/constants/typography";
+import { Radii, Shadows, Spacing } from "@/constants/spacing";
+import { FontFamilies, Typography } from "@/constants/typography";
+import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import type {
+  MemberSeriesPoint,
+  OccupancySummary,
+} from "@/services/admin/types";
+
+type Period = "12" | "6" | "all";
+
+const PERIOD_OPTIONS: { key: Period; label: string }[] = [
+  { key: "12", label: "12 meseci" },
+  { key: "6", label: "6 meseci" },
+  { key: "all", label: "Sve" },
+];
+
+const MONTHS_LC = [
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
+
+const DAY_ABBR: Record<string, string> = {
+  monday: "PON",
+  tuesday: "UTO",
+  wednesday: "SRE",
+  thursday: "ČET",
+  friday: "PET",
+  saturday: "SUB",
+  sunday: "NED",
+};
 
+function monthAbbrevFrom(isoMonth: string) {
+  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
+  return MONTHS_LC[monthIndex] ?? "—";
+}
+
+function trendPercent(series: MemberSeriesPoint[]) {
+  const first = series[0]?.total_members;
+  const last = series.at(-1)?.total_members;
+
+  if (first === undefined || last === undefined || first === 0) return null;
+  return Math.round(((last - first) / Math.max(first, 1)) * 100);
+}
+
 export default function StatsScreen() {
+  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
+  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
+  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [loading, setLoading] = useState(true);
+  const [hasError, setHasError] = useState(false);
+  const months: 12 | 6 | 24 =
+    selectedPeriod === "all" ? 24 : selectedPeriod === "12" ? 12 : 6;
+
+  useEffect(() => {
+    let active = true;
+    setLoading(true);
+    setHasError(false);
+
+    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
+      .then(([memberData, occupancyData]) => {
+        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
+        if (!active) return;
+        setSeries(memberData);
+        setOccupancy(occupancyData);
+      })
+      .catch((error: unknown) => {
+        console.error(error);
+        if (active) setHasError(true);
+      })
+      .finally(() => {
+        if (active) setLoading(false);
+      });
+
+    return () => {
+      active = false;
+    };
+  }, [months, selectedPeriod]);
+
+  if (loading) {
+    return (
+      <View style={styles.centeredState}>
+        <ActivityIndicator color={Colors.burgundy} />
+      </View>
+    );
+  }
+
+  if (hasError || !occupancy) {
+    return (
+      <View style={styles.centeredState}>
+        <Text style={styles.errorText}>Greška pri učitavanju</Text>
+      </View>
+    );
+  }
+
+  const chartData = series.map((point) => ({
+    label: monthAbbrevFrom(point.month),
+    value: point.total_members,
+  }));
+  const latestMembers = series.at(-1)?.total_members;
+  const pct = trendPercent(series);
+  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
+  const topDay =
+    DAY_ABBR[occupancy.top_day] ??
+    (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+
   return (
-    <View style={styles.screen}>
-      <Text style={styles.title}>Statistika</Text>
-    </View>
+    <ScrollView
+      style={styles.screen}
+      contentContainerStyle={styles.content}
+      showsVerticalScrollIndicator={false}
+    >
+      <View>
+        <Text style={styles.title}>Statistika</Text>
+        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
+      </View>
+
+      <FilterChips
+        options={PERIOD_OPTIONS}
+        value={selectedPeriod}
+        onChange={setSelectedPeriod}
+      />
+
+      <View style={styles.chartCard}>
+        <View style={styles.chartHeader}>
+          <View>
+            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
+            <Text style={styles.memberFigure}>
+              {latestMembers?.toString() ?? "—"}
+            </Text>
+          </View>
+          <View style={styles.trendBadge}>
+            <Text style={styles.trendText}>
+              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
+            </Text>
+          </View>
+        </View>
+        <BarChart data={chartData} currentIndex={chartData.length - 1} />
+      </View>
+
+      <View style={styles.secondaryRow}>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>NOVIH / MES.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
+            +{occupancy.new_this_month}
+          </Text>
+          <Text
+            style={[
+              styles.secondaryDelta,
+              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
+            ]}
+          >
+            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
+          </Text>
+        </View>
+        <View style={styles.secondaryTile}>
+          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
+          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
+            {occupancy.avg_pct}%
+          </Text>
+          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
+            najjači dan: {topDay}
+          </Text>
+        </View>
+      </View>
+    </ScrollView>
   );
 }
 
@@ -14,11 +192,91 @@
   screen: {
     flex: 1,
     backgroundColor: Colors.paper,
-    justifyContent: "center",
+  },
+  content: {
+    paddingHorizontal: Spacing.screenHorizontal,
+    paddingTop: 20,
+    paddingBottom: 24,
+    gap: 18,
+  },
+  centeredState: {
+    flex: 1,
     alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: Colors.paper,
   },
+  errorText: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+  },
   title: {
     ...Typography.screenTitle,
+    fontSize: 23,
+    color: Colors.ink,
+  },
+  subtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 3,
+  },
+  chartCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  chartHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    marginBottom: 4,
+  },
+  microLabel: {
+    ...Typography.microLabel,
+    color: Colors.inkFaint,
+  },
+  memberFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 28,
+    fontWeight: "800",
     color: Colors.ink,
+    marginTop: 3,
+  },
+  trendBadge: {
+    borderRadius: Radii.chip,
+    backgroundColor: "#E9F1EB",
+    paddingHorizontal: 9,
+    paddingVertical: 4,
+  },
+  trendText: {
+    ...Typography.chip,
+    color: "#4E7A5C",
+  },
+  secondaryRow: {
+    flexDirection: "row",
+    gap: 12,
+  },
+  secondaryTile: {
+    flex: 1,
+    minWidth: 0,
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    gap: 4,
+    ...Shadows.card,
+  },
+  secondaryFigure: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+  },
+  secondaryDelta: {
+    fontFamily: FontFamilies.hanken[700],
+    fontSize: 11,
+    fontWeight: "700",
   },
 });

tokens used
44,308
Implemented both admin screens with real RPC/training data, loading/error states, charts, filters, tiles, and navigation.

Validated:

- `npx tsc --noEmit`
- Scoped ESLint
- Prettier
- `git diff --check`

DONE
