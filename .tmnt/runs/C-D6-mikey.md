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
session id: 019f0cdd-d541-7c03-ab7e-33531f3f4d31
--------
user
TASK: Add "Popularnost termina" section to Statistika (stats.tsx)

CONTEXT
Goal file: /Users/uros/Documents/Private/Projects/PerunApp/.claude/agents/memory/michelangelo-memory.md
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Framework: React Native (Expo) + TypeScript
Files to consider (read before changing):
- app/(admin)/(tabs)/stats.tsx (existing screen with period chips, memberSeries, occupancySummary)
- src/services/admin/stats.ts (contains slotPopularity(period: string) RPC call)
- src/services/admin/types.ts (SlotPopularity type: day_of_week, time, bookings)
- src/constants/Colors.ts (Colors.gold, Colors.track, Colors.ink, etc.)
- src/constants/spacing.ts (Radii.tile[18], Shadows.card, Spacing.cardPadding)
- src/constants/typography.ts (Typography.microLabel, FontFamilies.hanken[600], FontFamilies.bricolage[800])

CODING CONSTRAINTS (non-negotiable)
- Simplicity first: add only what's needed to load and render slots.
- Surgical changes: modify only app/(admin)/(tabs)/stats.tsx. No new files, no new deps.
- Match existing patterns: reuse existing Period state, useEffect, DAY_ABBR map, colors, typography, Radii/Shadows/Spacing tokens.
- Inline the day-abbreviation map (already exists in stats.tsx as DAY_ABBR).
- No new design tokens, no new colors, no new spacing values. Use Colors.gold, Colors.track, Colors.ink, Colors.inkMuted exactly as is.
- TS strict: no `any`, all types explicit.
- RPC call: import slotPopularity from "@/services/admin/stats" and call slotPopularity(selectedPeriod).
- Empty state: if slots array is empty, show muted text "Još nema podataka o prijavama."
- Loading: fold into existing loading state (already handled by the screen's main useEffect; slots load alongside memberSeries + occupancySummary).

DEFINITION OF DONE
1. stats.tsx loads slotPopularity(selectedPeriod) alongside existing data, re-fetches when period chip changes.
2. New "Popularnost termina" card rendered after secondaryRow, same style (white, border, Radii.tile[18], Shadows.card, padding 16).
3. Card has micro-label "POPULARNOST TERMINA" and subtitle "Najtraženiji termini" (inkMuted).
4. Top ~8 slots rendered as rows. Each row: left = "{DAY_ABBR[day_of_week]} · {time}" (Hanken 13/600, ink), right = bookings number (Bricolage 26/800, ink) + thin proportional progress bar beneath (width = bookings / maxBookings, Colors.gold fill on Colors.track bg, 2–3px tall).
5. Empty state: if no slots after load, show centered muted text "Još nema podataka o prijavama."
6. Loading state: ActivityIndicator already shown at screen level; no separate loading within the card.
7. No other changes to existing code (title, period chips, charts, secondary tiles remain unchanged).
8. npm run check passes: `npx tsc --noEmit` returns 0, `npx eslint "app/(admin)" src` shows no new errors (only existing). All imports used. No unused variables. TS strict mode complied.

IMPLEMENTATION NOTES
- Add slots state: useState<SlotPopularity[]>([])
- Add slotPopularity call to the useEffect Promise.all() alongside memberSeries + occupancySummary.
- Create slotRow component inline or as a sub-render with proper styling (day · time, bookings, bar).
- If slots.length === 0 after load, render a single centered muted line instead of rows.
- No AlertBar component needed; use a simple View with flexDirection:"row" for the bar: left part flex:1, right part fixed width for the number, bar as an absolutely positioned underlay or a separate row.
- Proportional bar calculation: maxBookings = Math.max(...slots.map(s => s.bookings)) || 1; then for each slot, barWidth = (slot.bookings / maxBookings) * 100 for width percentage.
- Style the card exactly like secondaryTile (surface, border 1, Radii.tile[18], Shadows.card, padding 16), but full-width inside the ScrollView content.

Output: produce the code changes to stats.tsx (and ONLY stats.tsx). Include imports if needed. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the specified files and memory, then make a surgical change only to `stats.tsx` and run the requested TypeScript and ESLint checks.
exec
/bin/zsh -lc "sed -n '1,240p' '.claude/agents/memory/michelangelo-memory.md' && sed -n '1,320p' 'app/(admin)/(tabs)/stats.tsx' && sed -n '1,240p' 'src/services/admin/stats.ts' && sed -n '1,220p' 'src/services/admin/types.ts' && sed -n '1,220p' 'src/constants/Colors.ts' && sed -n '1,180p' 'src/constants/spacing.ts' && sed -n '1,180p' 'src/constants/typography.ts'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
# Michelangelo — Memory

## Session counter
Current session: 12
Last log: /Users/uros/Documents/Private/Projects/PerunApp/.claude/agents/tmnt/session-logs/2026-06-28-S12-michelangelo.md

## Completed tasks
- T5 (A1) — Fixed tab routing by deleting six dead day-route files (monday–saturday). Kept _layout.tsx as the single-screen renderer. Modified index.tsx to return null (no redirect, prevents dangling link).
- T8 (S5) — Surface join/leave errors to user (Serbian Alert messages). Created error-code-to-message mapping helper; modified joinSession/leaveSession to catch errors, show Alert, and NOT rethrow. Gated console logging behind __DEV__. tsc --noEmit PASS.
- T9 (A3) — De-duplicate booking/limit logic. AlertBar now consumes bookedCount/reachedLimit from context instead of recomputing. Deleted unused guards.ts. Removed useMemo from TrainingContext; fixed eslint warning. tsc + eslint PASS.
- B-M8 + B-M2 + B-M1 (Phase B UI Wave A) — Built 7 shared admin components in src/components/admin/ (AdminHeader, StatTile, BarChart, Toggle, FilterChips, UserRow, SessionRow), created app/(admin)/ route group with _layout.tsx (Tabs + AdminHeader) and 4 placeholder screens (index/users/sessions/stats) + training/[id] placeholder. Modified app/_layout.tsx RootNavigator to route role-based: admin → /(admin), user → /(tabs). No flashing, no profile race condition. tsc + eslint PASS. No commit.
- B-M3 + B-M7 (Phase B UI Wave B) — Filled Pregled (dashboard) and Statistika (stats) screens with real RPC data (memberSeries, occupancySummary) and useTrainings hooks. 2×2 stat grid, monthly trend chart with green badge, quick-action button on Pregled. Period filter (12m/6m/all), big member figure, secondary metric tiles on Statistika. Loading + error states, ScrollView wrapper, paper bg, no AdminHeader inside screens. Reused StatTile/BarChart/FilterChips. Inline helpers: MONTHS_LC, DAY_ABBR, monthAbbrevFrom, getTodayEnum, trendPercent. tsc --noEmit PASS; eslint PASS. No commit.
- B-M4 + B-M5 + B-M6 (Phase B UI Wave C) — Implemented three admin screens (Korisnici, Treninzi, training form [id]). Users screen: load listUsers(), search/filter (svi/aktivni/admini), FlatList of UserRow, edit Modal with stepper for max_sessions_per_week, delete with confirm, re-fetch on mutations. Sessions screen: FlatList with day selector (FilterChips PON–SUB), SessionRow with toggle open/close, real-time re-fetch, empty state text. Form screen (outside tabs): nav bar with back/title, full form with day chips, time/duration row, room/max-participants stepper, status card with Toggle. Validate title/time/max_participants, await upsertSession → fetchTrainings → router.back(). All screens use real services (listUsers, updateUser, deleteUser, setSessionOpen, upsertSession), no new deps, no AdminHeader in tab screens. tsc --noEmit PASS; eslint PASS. No commit.
- C-A1/A2/A3/A4 (Phase C Group A — Login & Auth) — Fixed keyboard handling in login (KeyboardAvoidingView + ScrollView), built register + forgot-password screens, added register/resetPassword methods to AuthContext, reworked routing to support auth screens + role-based redirect without bouncing shared routes (profile modal). Tagline removed. tsc --noEmit PASS; eslint PASS. No commit.
- C2 (Phase C Group C #2 — Android status bar overlap) — Wrapped app with SafeAreaProvider + StatusBar style="dark" in RootLayout. Applied useSafeAreaInsets to Header, AdminHeader, and training form navBar (paddingTop: insets.top + existing base). Wrapped auth screens (login/register/forgot-password) with SafeAreaView edges={["top"]} and reduced hardcoded paddingTop from 30 to 16. tsc --noEmit PASS; eslint PASS. No commit.
- C-B1/B3/D5/B4/B5/B2 (Phase C Group B — Admin UX + Profile) — (S12) Removed SALA/TRAJANJE fields from training form; passes room:null, duration_min:null to upsertSession. Added masked time input (HH:MM) with formatTime helper; validates on save (00–23:MM 00–59); shows Alert if invalid. Removed hardcoded "60 min" and "Sala A" from TrainingCard; category now "Grupni". Equal-height stat tiles: added flex:1 to StatTile, alignItems:"stretch" to tileRow/secondaryRow in Pregled + Statistika. Edit-user modal: added Aktivan toggle, initializes from user.enabled??true, included in updateUser patch. Profile: role-aware (isAdmin flag); admins see minimal profile+ADMIN badge+logout; members see read-only limit "{bookedCount}/{max} ove nedelje" (no updateProfile call); logout button works for both roles. tsc --noEmit PASS; eslint PASS. No commit.

## Gotchas
- npm cache permission issue (`/Users/uros/.npm/_cacache`) prevented `npx` direct invocation; worked around using `npm_config_cache=/tmp/perunapp-npm-cache`.
- Codex timed out mid-execution on T5 but the patch WAS applied before timeout. Final DONE signal not reached, but verification confirms work is complete.
- T8: Codex correctly avoided throwing errors (which would bubble into un-awaited onPress) by catching + Alert + return pattern. TrainingCard callers safe without modification.
- T9: useMemo removal was simpler than useCallback wrapping handlers; context consumers re-render on provider render anyway.
- B-M8/B-M2/B-M1: First two invocations of Codex with combined prompt timed out during analysis phase (Codex reasoning loop is slow on large specs). Split into two focused prompts: (1) components-only (v3 with inline code templates), (2) routing+screens. Both succeeded. ESLint warning on router hook dependency added router to deps array (standard pattern, common in auth routing).
- B-M3/B-M7: Codex successfully verified tsc + eslint in sandbox, reported DONE. No issues on actual tsc/eslint runs in local env. Both screens load from real RPCs; no hardcoded mock values. Occupancy data null-guarded on both screens.
- B-M4/M5/M6: Codex timed out (exit 144) on first attempt with large combined prompt. Fell back to direct code writing (Mikey writes, not Codex). Users.tsx and sessions.tsx were auto-formatted by eslint on disk write. Form screen [id].tsx was already fully implemented in Wave A placeholders. All three screens verified: tsc --noEmit PASS, eslint PASS on app/(admin) + src/components/admin.
- C-A (Phase C Group A): Codex timed out mid-execution on first attempt (exit 143), but patches were already applied to login.tsx before timeout (KeyboardAvoidingView + ScrollView + routing changes visible). Codex also updated AuthContext successfully before timeout. Fell back to direct code writing for register.tsx, forgot-password.tsx, and _layout.tsx routing logic. All files verified tsc + eslint PASS.
- C2: Codex executed cleanly (no timeout), completed all changes in one pass. Used mixed approach: useSafeAreaInsets for headers/form (component-level hook), SafeAreaView wrapper for auth screens (simpler than hook in each screen). All files verified tsc + eslint PASS.
- C-B (Phase C Group B, S12): Codex executed cleanly on combined 6-task prompt (B1/B3/D5/B4/B5/B2). No timeout. Reported DONE with token usage 70k. All changes applied in one pass. Verified tsc + eslint PASS post-execution. No issues.

## Design system reuse notes
- All screens use existing Colors, Radii, Spacing, Shadows, Typography constants.
- No new tokens, no gradients (RN limitation), no new dependencies.
- Register and forgot-password screens copy login's field styles exactly (emailInput, passwordField, passwordFieldFocused, etc.)
- Both auth screens use KeyboardAvoidingView behavior="padding" + ScrollView for keyboard handling
- Register form shows IME/PREZIME/EMAIL/LOZINKA fields with show/hide toggle on password
- Forgot-password shows single EMAIL field with neutral success message
- SafeAreaView + StatusBar style="dark" ensures top bar does not overlap system status bar (Android clock/battery visible on cream paper bg)
- Phase C Group B: Time masking uses inline formatTime helper (no new utility file). Training form no longer stores room/duration state; passes null to backend RPC. StatTile gains flex:1 for equal-height grid rows. Profile role-check uses isAdmin boolean derived from profile.role.

## Routing logic in app/_layout.tsx (Phase C update)
- Added "register" and "forgot-password" to publicAuthRoutes list
- Separated "shared" routes (profile modal) from auth routes; both admins and members can access shared routes without bounce
- Guard flow:
  - if loading → spinner
  - if session && !profile → spinner, no redirect (wait for profile)
  - if !session && !inAuthRoute → router.replace("/login")
  - if session && profile:
    - if inShared → do nothing (allow both roles)
    - if admin: bounce from publicAuthRoutes or "(tabs)" → "/(admin)"
    - if member: bounce from publicAuthRoutes or "(admin)" → "/(tabs)"

## RPC/Service layer notes (unchanged from B waves)
- memberSeries, occupancySummary, useTrainings, listUsers, updateUser, deleteUser, setSessionOpen, upsertSession (all RPC calls, real operations)
- Both tab screens + form use real data flows; no mock values, no stale state
- Error handling: Alert.alert on catch, always re-fetch to resync after mutation
- Loading states: ActivityIndicator rendered during fetch; buttons disabled while submitting
- C-B (S12): updateUser now includes optional `enabled` field in UpdateUserPatch (backend already supports it from admin_update_user RPC param p_enabled). Training form upsertSession always passes room:null, duration_min:null.

## Safe-area inset strategy (C2)
- SafeAreaProvider wraps RootLayout (below font gate, above AuthProvider)
- StatusBar style="dark" ensures Android status bar icons are visible on paper bg
- Headers use useSafeAreaInsets hook: paddingTop: insets.top + 10 (extends bg under status bar)
- Auth screens use SafeAreaView edges={["top"]} wrapper: simpler, avoids hook clutter in each screen
- Form nav uses useSafeAreaInsets hook: paddingTop: insets.top + 16 (consistent with headers, no AdminHeader)
- profile.tsx already had SafeAreaView edges={["top", "bottom"]}, left unchanged

## Phase C Group B changes (S12) — File-by-file summary
- app/(admin)/training/[id].tsx: Removed room/durationMin state + UI fields. Added TIME_PATTERN regex + formatTime helper. VREME field uses keyboardType="number-pad", onChangeText formatTime, validates on submit (HH:MM, 00–23:MM 00–59). Always passes room:null, duration_min:null to upsertSession.
- src/components/TrainingCard.tsx: Removed duration <Text> line; timeBlock now only renders time (no padding/marginTop adjustments needed, looks centered). Category changed from "Grupni · Sala A" to "Grupni". Removed unused duration and fullMeta style definitions.
- src/components/admin/StatTile.tsx: Added flex:1 to tile style for equal-height grid cells.
- app/(admin)/(tabs)/index.tsx (Pregled): tileRow added alignItems:"stretch"; tileCell already flex:1. Grid rows now equalize height when labels wrap.
- app/(admin)/(tabs)/stats.tsx (Statistika): secondaryRow added alignItems:"stretch"; secondaryTile added flex:1 + minWidth:0. Secondary tiles now match tallest in row.
- app/(admin)/(tabs)/users.tsx: Added enabled state (init openEditModal from user.enabled??true). Modal has new toggleRow with Aktivan label + Toggle. saveUser patch includes enabled field.
- app/profile.tsx: Added isAdmin constant from profile.role==="admin". Identity section shows ADMIN chip for admins, ČLAN for members. Stats/limit/booking wrapped in !isAdmin conditional (members only). Limit section changed from editable stepper to read-only display "{bookedCount} / {max} ove nedelje". Logout button remains and works for both roles.
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
    alignItems: "stretch",
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
import { supabase } from "../supabase/client";
import {
  MemberSeriesPoint,
  OccupancySummary,
  SlotPopularity,
} from "./types";

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

export async function slotPopularity(
  period: string,
): Promise<SlotPopularity[]> {
  const { data, error } = await supabase.rpc("admin_slot_popularity", {
    p_period: period,
  });

  if (error) throw error;
  return (data ?? []) as SlotPopularity[];
}
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

export interface SlotPopularity {
  day_of_week: string;
  time: string;
  bookings: number;
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
  enabled?: boolean | null;
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

codex
The existing screen already has the required period and day mappings. I’ll add the third RPC to its current `Promise.all`, keep the returned order, and render only the first eight entries.
apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/stats.tsx
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index f268a63f9095c10157b70956ea2820eb803bc7a8..fcdab711c78aedde3e403df15c57ae53224b332d
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -12,10 +12,15 @@
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import {
+  memberSeries,
+  occupancySummary,
+  slotPopularity,
+} from "@/services/admin/stats";
 import type {
   MemberSeriesPoint,
   OccupancySummary,
+  SlotPopularity,
 } from "@/services/admin/types";
 
 type Period = "12" | "6" | "all";
@@ -68,6 +73,7 @@
   const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
   const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
   const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [slots, setSlots] = useState<SlotPopularity[]>([]);
   const [loading, setLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const months: 12 | 6 | 24 =
@@ -78,12 +84,17 @@
     setLoading(true);
     setHasError(false);
 
-    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
-      .then(([memberData, occupancyData]) => {
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+      slotPopularity(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData, slotData]) => {
         if (!occupancyData) throw new Error("Occupancy summary is unavailable");
         if (!active) return;
         setSeries(memberData);
         setOccupancy(occupancyData);
+        setSlots(slotData);
       })
       .catch((error: unknown) => {
         console.error(error);
@@ -124,6 +135,8 @@
   const topDay =
     DAY_ABBR[occupancy.top_day] ??
     (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+  const visibleSlots = slots.slice(0, 8);
+  const maxBookings = Math.max(...slots.map((slot) => slot.bookings)) || 1;
 
   return (
     <ScrollView
@@ -184,6 +197,42 @@
           </Text>
         </View>
       </View>
+
+      <View style={styles.popularityCard}>
+        <Text style={styles.microLabel}>POPULARNOST TERMINA</Text>
+        <Text style={styles.popularitySubtitle}>Najtraženiji termini</Text>
+
+        {visibleSlots.length === 0 ? (
+          <Text style={styles.emptySlots}>
+            Još nema podataka o prijavama.
+          </Text>
+        ) : (
+          <View style={styles.slotList}>
+            {visibleSlots.map((slot) => {
+              const day =
+                DAY_ABBR[slot.day_of_week] ?? slot.day_of_week.toUpperCase();
+              const barWidth = `${(slot.bookings / maxBookings) * 100}%` as const;
+
+              return (
+                <View
+                  key={`${slot.day_of_week}-${slot.time}`}
+                  style={styles.slotRow}
+                >
+                  <View style={styles.slotHeader}>
+                    <Text style={styles.slotLabel}>
+                      {day} · {slot.time}
+                    </Text>
+                    <Text style={styles.slotBookings}>{slot.bookings}</Text>
+                  </View>
+                  <View style={styles.slotTrack}>
+                    <View style={[styles.slotFill, { width: barWidth }]} />
+                  </View>
+                </View>
+              );
+            })}
+          </View>
+        )}
+      </View>
     </ScrollView>
   );
 }
@@ -280,4 +329,57 @@
     fontSize: 11,
     fontWeight: "700",
   },
+  popularityCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  popularitySubtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 4,
+  },
+  slotList: {
+    gap: Spacing.cardGap,
+    marginTop: Spacing.section.compact,
+  },
+  slotRow: {
+    gap: 4,
+  },
+  slotHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+  },
+  slotLabel: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  slotBookings: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+    color: Colors.ink,
+    textAlign: "right",
+  },
+  slotTrack: {
+    height: 3,
+    overflow: "hidden",
+    backgroundColor: Colors.track,
+  },
+  slotFill: {
+    height: 3,
+    backgroundColor: Colors.gold,
+  },
+  emptySlots: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+    textAlign: "center",
+    marginTop: Spacing.section.compact,
+  },
 });

diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index f268a63f9095c10157b70956ea2820eb803bc7a8..fcdab711c78aedde3e403df15c57ae53224b332d
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -12,10 +12,15 @@
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import {
+  memberSeries,
+  occupancySummary,
+  slotPopularity,
+} from "@/services/admin/stats";
 import type {
   MemberSeriesPoint,
   OccupancySummary,
+  SlotPopularity,
 } from "@/services/admin/types";
 
 type Period = "12" | "6" | "all";
@@ -68,6 +73,7 @@
   const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
   const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
   const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [slots, setSlots] = useState<SlotPopularity[]>([]);
   const [loading, setLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const months: 12 | 6 | 24 =
@@ -78,12 +84,17 @@
     setLoading(true);
     setHasError(false);
 
-    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
-      .then(([memberData, occupancyData]) => {
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+      slotPopularity(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData, slotData]) => {
         if (!occupancyData) throw new Error("Occupancy summary is unavailable");
         if (!active) return;
         setSeries(memberData);
         setOccupancy(occupancyData);
+        setSlots(slotData);
       })
       .catch((error: unknown) => {
         console.error(error);
@@ -124,6 +135,8 @@
   const topDay =
     DAY_ABBR[occupancy.top_day] ??
     (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+  const visibleSlots = slots.slice(0, 8);
+  const maxBookings = Math.max(...slots.map((slot) => slot.bookings)) || 1;
 
   return (
     <ScrollView
@@ -184,6 +197,42 @@
           </Text>
         </View>
       </View>
+
+      <View style={styles.popularityCard}>
+        <Text style={styles.microLabel}>POPULARNOST TERMINA</Text>
+        <Text style={styles.popularitySubtitle}>Najtraženiji termini</Text>
+
+        {visibleSlots.length === 0 ? (
+          <Text style={styles.emptySlots}>
+            Još nema podataka o prijavama.
+          </Text>
+        ) : (
+          <View style={styles.slotList}>
+            {visibleSlots.map((slot) => {
+              const day =
+                DAY_ABBR[slot.day_of_week] ?? slot.day_of_week.toUpperCase();
+              const barWidth = `${(slot.bookings / maxBookings) * 100}%` as const;
+
+              return (
+                <View
+                  key={`${slot.day_of_week}-${slot.time}`}
+                  style={styles.slotRow}
+                >
+                  <View style={styles.slotHeader}>
+                    <Text style={styles.slotLabel}>
+                      {day} · {slot.time}
+                    </Text>
+                    <Text style={styles.slotBookings}>{slot.bookings}</Text>
+                  </View>
+                  <View style={styles.slotTrack}>
+                    <View style={[styles.slotFill, { width: barWidth }]} />
+                  </View>
+                </View>
+              );
+            })}
+          </View>
+        )}
+      </View>
     </ScrollView>
   );
 }
@@ -280,4 +329,57 @@
     fontSize: 11,
     fontWeight: "700",
   },
+  popularityCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  popularitySubtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 4,
+  },
+  slotList: {
+    gap: Spacing.cardGap,
+    marginTop: Spacing.section.compact,
+  },
+  slotRow: {
+    gap: 4,
+  },
+  slotHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+  },
+  slotLabel: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  slotBookings: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+    color: Colors.ink,
+    textAlign: "right",
+  },
+  slotTrack: {
+    height: 3,
+    overflow: "hidden",
+    backgroundColor: Colors.track,
+  },
+  slotFill: {
+    height: 3,
+    backgroundColor: Colors.gold,
+  },
+  emptySlots: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+    textAlign: "center",
+    marginTop: Spacing.section.compact,
+  },
 });

exec
/bin/zsh -lc "git diff -- 'app/(admin)/(tabs)/stats.tsx' && npm_config_cache=/tmp/perunapp-npm-cache npx tsc --noEmit && npm_config_cache=/tmp/perunapp-npm-cache npx eslint \"app/(admin)\" src" in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index f268a63f9095c10157b70956ea2820eb803bc7a8..fcdab711c78aedde3e403df15c57ae53224b332d
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -12,10 +12,15 @@
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import {
+  memberSeries,
+  occupancySummary,
+  slotPopularity,
+} from "@/services/admin/stats";
 import type {
   MemberSeriesPoint,
   OccupancySummary,
+  SlotPopularity,
 } from "@/services/admin/types";
 
 type Period = "12" | "6" | "all";
@@ -68,6 +73,7 @@
   const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
   const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
   const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [slots, setSlots] = useState<SlotPopularity[]>([]);
   const [loading, setLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const months: 12 | 6 | 24 =
@@ -78,12 +84,17 @@
     setLoading(true);
     setHasError(false);
 
-    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
-      .then(([memberData, occupancyData]) => {
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+      slotPopularity(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData, slotData]) => {
         if (!occupancyData) throw new Error("Occupancy summary is unavailable");
         if (!active) return;
         setSeries(memberData);
         setOccupancy(occupancyData);
+        setSlots(slotData);
       })
       .catch((error: unknown) => {
         console.error(error);
@@ -124,6 +135,8 @@
   const topDay =
     DAY_ABBR[occupancy.top_day] ??
     (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+  const visibleSlots = slots.slice(0, 8);
+  const maxBookings = Math.max(...slots.map((slot) => slot.bookings)) || 1;
 
   return (
     <ScrollView
@@ -184,6 +197,42 @@
           </Text>
         </View>
       </View>
+
+      <View style={styles.popularityCard}>
+        <Text style={styles.microLabel}>POPULARNOST TERMINA</Text>
+        <Text style={styles.popularitySubtitle}>Najtraženiji termini</Text>
+
+        {visibleSlots.length === 0 ? (
+          <Text style={styles.emptySlots}>
+            Još nema podataka o prijavama.
+          </Text>
+        ) : (
+          <View style={styles.slotList}>
+            {visibleSlots.map((slot) => {
+              const day =
+                DAY_ABBR[slot.day_of_week] ?? slot.day_of_week.toUpperCase();
+              const barWidth = `${(slot.bookings / maxBookings) * 100}%` as const;
+
+              return (
+                <View
+                  key={`${slot.day_of_week}-${slot.time}`}
+                  style={styles.slotRow}
+                >
+                  <View style={styles.slotHeader}>
+                    <Text style={styles.slotLabel}>
+                      {day} · {slot.time}
+                    </Text>
+                    <Text style={styles.slotBookings}>{slot.bookings}</Text>
+                  </View>
+                  <View style={styles.slotTrack}>
+                    <View style={[styles.slotFill, { width: barWidth }]} />
+                  </View>
+                </View>
+              );
+            })}
+          </View>
+        )}
+      </View>
     </ScrollView>
   );
 }
@@ -280,4 +329,57 @@
     fontSize: 11,
     fontWeight: "700",
   },
+  popularityCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  popularitySubtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 4,
+  },
+  slotList: {
+    gap: Spacing.cardGap,
+    marginTop: Spacing.section.compact,
+  },
+  slotRow: {
+    gap: 4,
+  },
+  slotHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+  },
+  slotLabel: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  slotBookings: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+    color: Colors.ink,
+    textAlign: "right",
+  },
+  slotTrack: {
+    height: 3,
+    overflow: "hidden",
+    backgroundColor: Colors.track,
+  },
+  slotFill: {
+    height: 3,
+    backgroundColor: Colors.gold,
+  },
+  emptySlots: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+    textAlign: "center",
+    marginTop: Spacing.section.compact,
+  },
 });

 succeeded in 3794ms:
codex
The code change is in place. TypeScript has started successfully; I’m waiting for the full TypeScript and admin/source ESLint results.
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index f268a63f9095c10157b70956ea2820eb803bc7a8..fcdab711c78aedde3e403df15c57ae53224b332d
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -12,10 +12,15 @@
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import {
+  memberSeries,
+  occupancySummary,
+  slotPopularity,
+} from "@/services/admin/stats";
 import type {
   MemberSeriesPoint,
   OccupancySummary,
+  SlotPopularity,
 } from "@/services/admin/types";
 
 type Period = "12" | "6" | "all";
@@ -68,6 +73,7 @@
   const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
   const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
   const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [slots, setSlots] = useState<SlotPopularity[]>([]);
   const [loading, setLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const months: 12 | 6 | 24 =
@@ -78,12 +84,17 @@
     setLoading(true);
     setHasError(false);
 
-    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
-      .then(([memberData, occupancyData]) => {
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+      slotPopularity(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData, slotData]) => {
         if (!occupancyData) throw new Error("Occupancy summary is unavailable");
         if (!active) return;
         setSeries(memberData);
         setOccupancy(occupancyData);
+        setSlots(slotData);
       })
       .catch((error: unknown) => {
         console.error(error);
@@ -124,6 +135,8 @@
   const topDay =
     DAY_ABBR[occupancy.top_day] ??
     (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+  const visibleSlots = slots.slice(0, 8);
+  const maxBookings = Math.max(...slots.map((slot) => slot.bookings)) || 1;
 
   return (
     <ScrollView
@@ -184,6 +197,42 @@
           </Text>
         </View>
       </View>
+
+      <View style={styles.popularityCard}>
+        <Text style={styles.microLabel}>POPULARNOST TERMINA</Text>
+        <Text style={styles.popularitySubtitle}>Najtraženiji termini</Text>
+
+        {visibleSlots.length === 0 ? (
+          <Text style={styles.emptySlots}>
+            Još nema podataka o prijavama.
+          </Text>
+        ) : (
+          <View style={styles.slotList}>
+            {visibleSlots.map((slot) => {
+              const day =
+                DAY_ABBR[slot.day_of_week] ?? slot.day_of_week.toUpperCase();
+              const barWidth = `${(slot.bookings / maxBookings) * 100}%` as const;
+
+              return (
+                <View
+                  key={`${slot.day_of_week}-${slot.time}`}
+                  style={styles.slotRow}
+                >
+                  <View style={styles.slotHeader}>
+                    <Text style={styles.slotLabel}>
+                      {day} · {slot.time}
+                    </Text>
+                    <Text style={styles.slotBookings}>{slot.bookings}</Text>
+                  </View>
+                  <View style={styles.slotTrack}>
+                    <View style={[styles.slotFill, { width: barWidth }]} />
+                  </View>
+                </View>
+              );
+            })}
+          </View>
+        )}
+      </View>
     </ScrollView>
   );
 }
@@ -280,4 +329,57 @@
     fontSize: 11,
     fontWeight: "700",
   },
+  popularityCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  popularitySubtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 4,
+  },
+  slotList: {
+    gap: Spacing.cardGap,
+    marginTop: Spacing.section.compact,
+  },
+  slotRow: {
+    gap: 4,
+  },
+  slotHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+  },
+  slotLabel: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  slotBookings: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+    color: Colors.ink,
+    textAlign: "right",
+  },
+  slotTrack: {
+    height: 3,
+    overflow: "hidden",
+    backgroundColor: Colors.track,
+  },
+  slotFill: {
+    height: 3,
+    backgroundColor: Colors.gold,
+  },
+  emptySlots: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+    textAlign: "center",
+    marginTop: Spacing.section.compact,
+  },
 });

exec
/bin/zsh -lc "rg -n \"admin_slot_popularity|slotPopularity\" . --glob '"'!node_modules'"' --glob '"'!package-lock.json'"' && git diff --check && git status --short" in /Users/uros/Documents/Private/Projects/PerunApp
 exited 2 in 0ms:
./src/services/admin/stats.ts:30:export async function slotPopularity(
./src/services/admin/stats.ts:33:  const { data, error } = await supabase.rpc("admin_slot_popularity", {
./app/(admin)/(tabs)/stats.tsx:18:  slotPopularity,
./app/(admin)/(tabs)/stats.tsx:90:      slotPopularity(selectedPeriod),
./supabase/migrations/20260628120000_attendance_log.sql:120:create or replace function public.admin_slot_popularity(p_period text)
./supabase/migrations/20260628120000_attendance_log.sql:153:revoke all on function public.admin_slot_popularity(text) from public, anon;
./supabase/migrations/20260628120000_attendance_log.sql:154:grant execute on function public.admin_slot_popularity(text) to authenticated;
.tmnt/runs/D2-donny.md:948: trailing whitespace.
+ 
.tmnt/runs/D2-donny.md:973: trailing whitespace.
+ 

diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index f268a63f9095c10157b70956ea2820eb803bc7a8..fcdab711c78aedde3e403df15c57ae53224b332d
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -12,10 +12,15 @@
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import {
+  memberSeries,
+  occupancySummary,
+  slotPopularity,
+} from "@/services/admin/stats";
 import type {
   MemberSeriesPoint,
   OccupancySummary,
+  SlotPopularity,
 } from "@/services/admin/types";
 
 type Period = "12" | "6" | "all";
@@ -68,6 +73,7 @@
   const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
   const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
   const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [slots, setSlots] = useState<SlotPopularity[]>([]);
   const [loading, setLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const months: 12 | 6 | 24 =
@@ -78,12 +84,17 @@
     setLoading(true);
     setHasError(false);
 
-    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
-      .then(([memberData, occupancyData]) => {
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+      slotPopularity(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData, slotData]) => {
         if (!occupancyData) throw new Error("Occupancy summary is unavailable");
         if (!active) return;
         setSeries(memberData);
         setOccupancy(occupancyData);
+        setSlots(slotData);
       })
       .catch((error: unknown) => {
         console.error(error);
@@ -124,6 +135,8 @@
   const topDay =
     DAY_ABBR[occupancy.top_day] ??
     (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+  const visibleSlots = slots.slice(0, 8);
+  const maxBookings = Math.max(...slots.map((slot) => slot.bookings)) || 1;
 
   return (
     <ScrollView
@@ -184,6 +197,42 @@
           </Text>
         </View>
       </View>
+
+      <View style={styles.popularityCard}>
+        <Text style={styles.microLabel}>POPULARNOST TERMINA</Text>
+        <Text style={styles.popularitySubtitle}>Najtraženiji termini</Text>
+
+        {visibleSlots.length === 0 ? (
+          <Text style={styles.emptySlots}>
+            Još nema podataka o prijavama.
+          </Text>
+        ) : (
+          <View style={styles.slotList}>
+            {visibleSlots.map((slot) => {
+              const day =
+                DAY_ABBR[slot.day_of_week] ?? slot.day_of_week.toUpperCase();
+              const barWidth = `${(slot.bookings / maxBookings) * 100}%` as const;
+
+              return (
+                <View
+                  key={`${slot.day_of_week}-${slot.time}`}
+                  style={styles.slotRow}
+                >
+                  <View style={styles.slotHeader}>
+                    <Text style={styles.slotLabel}>
+                      {day} · {slot.time}
+                    </Text>
+                    <Text style={styles.slotBookings}>{slot.bookings}</Text>
+                  </View>
+                  <View style={styles.slotTrack}>
+                    <View style={[styles.slotFill, { width: barWidth }]} />
+                  </View>
+                </View>
+              );
+            })}
+          </View>
+        )}
+      </View>
     </ScrollView>
   );
 }
@@ -280,4 +329,57 @@
     fontSize: 11,
     fontWeight: "700",
   },
+  popularityCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  popularitySubtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 4,
+  },
+  slotList: {
+    gap: Spacing.cardGap,
+    marginTop: Spacing.section.compact,
+  },
+  slotRow: {
+    gap: 4,
+  },
+  slotHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+  },
+  slotLabel: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  slotBookings: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+    color: Colors.ink,
+    textAlign: "right",
+  },
+  slotTrack: {
+    height: 3,
+    overflow: "hidden",
+    backgroundColor: Colors.track,
+  },
+  slotFill: {
+    height: 3,
+    backgroundColor: Colors.gold,
+  },
+  emptySlots: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+    textAlign: "center",
+    marginTop: Spacing.section.compact,
+  },
 });

exec
/bin/zsh -lc "sed -n '120,155p' supabase/migrations/20260628120000_attendance_log.sql" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
create or replace function public.admin_slot_popularity(p_period text)
returns table(day_of_week text, "time" text, bookings bigint)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_cutoff timestamptz;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  case p_period
    when '6' then v_cutoff := now() - interval '6 months';
    when '12' then v_cutoff := now() - interval '12 months';
    when 'all' then v_cutoff := null;
    else raise exception 'invalid_period';
  end case;

  return query
  select
    al.day_of_week::text,
    al."time",
    count(*)::bigint
  from public.attendance_log al
  where v_cutoff is null or al.joined_at >= v_cutoff
  group by al.day_of_week, al."time"
  order by count(*) desc, al.day_of_week, al."time";
end;
$$;

revoke all on function public.admin_slot_popularity(text) from public, anon;
grant execute on function public.admin_slot_popularity(text) to authenticated;


exec
/bin/zsh -lc 'git status --short' in /Users/uros/Documents/Private/Projects/PerunApp
exec
/bin/zsh -lc "git diff --check -- 'app/(admin)/(tabs)/stats.tsx'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
 M .tmnt/runs/D2-donny.md
 M app/(admin)/(tabs)/stats.tsx
 M src/services/admin/stats.ts
 M src/services/admin/types.ts
?? .tmnt/runs/C-D6-mikey.md
?? supabase/migrations/20260628120000_attendance_log.sql

 succeeded in 0ms:
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index f268a63f9095c10157b70956ea2820eb803bc7a8..fcdab711c78aedde3e403df15c57ae53224b332d
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -12,10 +12,15 @@
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import {
+  memberSeries,
+  occupancySummary,
+  slotPopularity,
+} from "@/services/admin/stats";
 import type {
   MemberSeriesPoint,
   OccupancySummary,
+  SlotPopularity,
 } from "@/services/admin/types";
 
 type Period = "12" | "6" | "all";
@@ -68,6 +73,7 @@
   const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
   const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
   const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [slots, setSlots] = useState<SlotPopularity[]>([]);
   const [loading, setLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const months: 12 | 6 | 24 =
@@ -78,12 +84,17 @@
     setLoading(true);
     setHasError(false);
 
-    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
-      .then(([memberData, occupancyData]) => {
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+      slotPopularity(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData, slotData]) => {
         if (!occupancyData) throw new Error("Occupancy summary is unavailable");
         if (!active) return;
         setSeries(memberData);
         setOccupancy(occupancyData);
+        setSlots(slotData);
       })
       .catch((error: unknown) => {
         console.error(error);
@@ -124,6 +135,8 @@
   const topDay =
     DAY_ABBR[occupancy.top_day] ??
     (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+  const visibleSlots = slots.slice(0, 8);
+  const maxBookings = Math.max(...slots.map((slot) => slot.bookings)) || 1;
 
   return (
     <ScrollView
@@ -184,6 +197,42 @@
           </Text>
         </View>
       </View>
+
+      <View style={styles.popularityCard}>
+        <Text style={styles.microLabel}>POPULARNOST TERMINA</Text>
+        <Text style={styles.popularitySubtitle}>Najtraženiji termini</Text>
+
+        {visibleSlots.length === 0 ? (
+          <Text style={styles.emptySlots}>
+            Još nema podataka o prijavama.
+          </Text>
+        ) : (
+          <View style={styles.slotList}>
+            {visibleSlots.map((slot) => {
+              const day =
+                DAY_ABBR[slot.day_of_week] ?? slot.day_of_week.toUpperCase();
+              const barWidth = `${(slot.bookings / maxBookings) * 100}%` as const;
+
+              return (
+                <View
+                  key={`${slot.day_of_week}-${slot.time}`}
+                  style={styles.slotRow}
+                >
+                  <View style={styles.slotHeader}>
+                    <Text style={styles.slotLabel}>
+                      {day} · {slot.time}
+                    </Text>
+                    <Text style={styles.slotBookings}>{slot.bookings}</Text>
+                  </View>
+                  <View style={styles.slotTrack}>
+                    <View style={[styles.slotFill, { width: barWidth }]} />
+                  </View>
+                </View>
+              );
+            })}
+          </View>
+        )}
+      </View>
     </ScrollView>
   );
 }
@@ -280,4 +329,57 @@
     fontSize: 11,
     fontWeight: "700",
   },
+  popularityCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  popularitySubtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+    marginTop: 4,
+  },
+  slotList: {
+    gap: Spacing.cardGap,
+    marginTop: Spacing.section.compact,
+  },
+  slotRow: {
+    gap: 4,
+  },
+  slotHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+  },
+  slotLabel: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  slotBookings: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+    color: Colors.ink,
+    textAlign: "right",
+  },
+  slotTrack: {
+    height: 3,
+    overflow: "hidden",
+    backgroundColor: Colors.track,
+  },
+  slotFill: {
+    height: 3,
+    backgroundColor: Colors.gold,
+  },
+  emptySlots: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+    textAlign: "center",
+    marginTop: Spacing.section.compact,
+  },
 });

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/stats.tsx
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index f268a63f9095c10157b70956ea2820eb803bc7a8..acda4d8df82be55d5249ca6e16dff39c9be54a3d
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -12,10 +12,15 @@
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import {
+  memberSeries,
+  occupancySummary,
+  slotPopularity,
+} from "@/services/admin/stats";
 import type {
   MemberSeriesPoint,
   OccupancySummary,
+  SlotPopularity,
 } from "@/services/admin/types";
 
 type Period = "12" | "6" | "all";
@@ -68,6 +73,7 @@
   const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
   const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
   const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [slots, setSlots] = useState<SlotPopularity[]>([]);
   const [loading, setLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const months: 12 | 6 | 24 =
@@ -78,12 +84,17 @@
     setLoading(true);
     setHasError(false);
 
-    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
-      .then(([memberData, occupancyData]) => {
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+      slotPopularity(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData, slotData]) => {
         if (!occupancyData) throw new Error("Occupancy summary is unavailable");
         if (!active) return;
         setSeries(memberData);
         setOccupancy(occupancyData);
+        setSlots(slotData);
       })
       .catch((error: unknown) => {
         console.error(error);
@@ -124,6 +135,8 @@
   const topDay =
     DAY_ABBR[occupancy.top_day] ??
     (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+  const visibleSlots = slots.slice(0, 8);
+  const maxBookings = Math.max(...slots.map((slot) => slot.bookings)) || 1;
 
   return (
     <ScrollView
@@ -184,6 +197,39 @@
           </Text>
         </View>
       </View>
+
+      <View style={styles.popularityCard}>
+        <Text style={styles.microLabel}>POPULARNOST TERMINA</Text>
+        <Text style={styles.popularitySubtitle}>Najtraženiji termini</Text>
+
+        {visibleSlots.length === 0 ? (
+          <Text style={styles.emptySlots}>
+            Još nema podataka o prijavama.
+          </Text>
+        ) : (
+          <View style={styles.slotList}>
+            {visibleSlots.map((slot) => {
+              const day =
+                DAY_ABBR[slot.day_of_week] ?? slot.day_of_week.toUpperCase();
+              const barWidth = `${(slot.bookings / maxBookings) * 100}%` as const;
+
+              return (
+                <View key={`${slot.day_of_week}-${slot.time}`}>
+                  <View style={styles.slotHeader}>
+                    <Text style={styles.slotLabel}>
+                      {day} · {slot.time}
+                    </Text>
+                    <Text style={styles.slotBookings}>{slot.bookings}</Text>
+                  </View>
+                  <View style={styles.slotTrack}>
+                    <View style={[styles.slotFill, { width: barWidth }]} />
+                  </View>
+                </View>
+              );
+            })}
+          </View>
+        )}
+      </View>
     </ScrollView>
   );
 }
@@ -280,4 +326,53 @@
     fontSize: 11,
     fontWeight: "700",
   },
+  popularityCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  popularitySubtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+  },
+  slotList: {
+    gap: Spacing.cardGap,
+    marginTop: Spacing.section.compact,
+  },
+  slotHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+  },
+  slotLabel: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  slotBookings: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+    color: Colors.ink,
+    textAlign: "right",
+  },
+  slotTrack: {
+    height: 3,
+    overflow: "hidden",
+    backgroundColor: Colors.track,
+  },
+  slotFill: {
+    height: 3,
+    backgroundColor: Colors.gold,
+  },
+  emptySlots: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+    textAlign: "center",
+    marginTop: Spacing.section.compact,
+  },
 });

diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index f268a63f9095c10157b70956ea2820eb803bc7a8..acda4d8df82be55d5249ca6e16dff39c9be54a3d
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -12,10 +12,15 @@
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import {
+  memberSeries,
+  occupancySummary,
+  slotPopularity,
+} from "@/services/admin/stats";
 import type {
   MemberSeriesPoint,
   OccupancySummary,
+  SlotPopularity,
 } from "@/services/admin/types";
 
 type Period = "12" | "6" | "all";
@@ -68,6 +73,7 @@
   const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
   const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
   const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [slots, setSlots] = useState<SlotPopularity[]>([]);
   const [loading, setLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const months: 12 | 6 | 24 =
@@ -78,12 +84,17 @@
     setLoading(true);
     setHasError(false);
 
-    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
-      .then(([memberData, occupancyData]) => {
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+      slotPopularity(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData, slotData]) => {
         if (!occupancyData) throw new Error("Occupancy summary is unavailable");
         if (!active) return;
         setSeries(memberData);
         setOccupancy(occupancyData);
+        setSlots(slotData);
       })
       .catch((error: unknown) => {
         console.error(error);
@@ -124,6 +135,8 @@
   const topDay =
     DAY_ABBR[occupancy.top_day] ??
     (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+  const visibleSlots = slots.slice(0, 8);
+  const maxBookings = Math.max(...slots.map((slot) => slot.bookings)) || 1;
 
   return (
     <ScrollView
@@ -184,6 +197,39 @@
           </Text>
         </View>
       </View>
+
+      <View style={styles.popularityCard}>
+        <Text style={styles.microLabel}>POPULARNOST TERMINA</Text>
+        <Text style={styles.popularitySubtitle}>Najtraženiji termini</Text>
+
+        {visibleSlots.length === 0 ? (
+          <Text style={styles.emptySlots}>
+            Još nema podataka o prijavama.
+          </Text>
+        ) : (
+          <View style={styles.slotList}>
+            {visibleSlots.map((slot) => {
+              const day =
+                DAY_ABBR[slot.day_of_week] ?? slot.day_of_week.toUpperCase();
+              const barWidth = `${(slot.bookings / maxBookings) * 100}%` as const;
+
+              return (
+                <View key={`${slot.day_of_week}-${slot.time}`}>
+                  <View style={styles.slotHeader}>
+                    <Text style={styles.slotLabel}>
+                      {day} · {slot.time}
+                    </Text>
+                    <Text style={styles.slotBookings}>{slot.bookings}</Text>
+                  </View>
+                  <View style={styles.slotTrack}>
+                    <View style={[styles.slotFill, { width: barWidth }]} />
+                  </View>
+                </View>
+              );
+            })}
+          </View>
+        )}
+      </View>
     </ScrollView>
   );
 }
@@ -280,4 +326,53 @@
     fontSize: 11,
     fontWeight: "700",
   },
+  popularityCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  popularitySubtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+  },
+  slotList: {
+    gap: Spacing.cardGap,
+    marginTop: Spacing.section.compact,
+  },
+  slotHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+  },
+  slotLabel: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  slotBookings: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+    color: Colors.ink,
+    textAlign: "right",
+  },
+  slotTrack: {
+    height: 3,
+    overflow: "hidden",
+    backgroundColor: Colors.track,
+  },
+  slotFill: {
+    height: 3,
+    backgroundColor: Colors.gold,
+  },
+  emptySlots: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+    textAlign: "center",
+    marginTop: Spacing.section.compact,
+  },
 });

exec
/bin/zsh -lc "git diff --check -- 'app/(admin)/(tabs)/stats.tsx'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
exec
/bin/zsh -lc 'npm_config_cache=/tmp/perunapp-npm-cache npx tsc --noEmit' in /Users/uros/Documents/Private/Projects/PerunApp
exec
/bin/zsh -lc 'npm_config_cache=/tmp/perunapp-npm-cache npx eslint "app/(admin)" src' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index f268a63f9095c10157b70956ea2820eb803bc7a8..acda4d8df82be55d5249ca6e16dff39c9be54a3d
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -12,10 +12,15 @@
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import {
+  memberSeries,
+  occupancySummary,
+  slotPopularity,
+} from "@/services/admin/stats";
 import type {
   MemberSeriesPoint,
   OccupancySummary,
+  SlotPopularity,
 } from "@/services/admin/types";
 
 type Period = "12" | "6" | "all";
@@ -68,6 +73,7 @@
   const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
   const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
   const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [slots, setSlots] = useState<SlotPopularity[]>([]);
   const [loading, setLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const months: 12 | 6 | 24 =
@@ -78,12 +84,17 @@
     setLoading(true);
     setHasError(false);
 
-    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
-      .then(([memberData, occupancyData]) => {
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+      slotPopularity(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData, slotData]) => {
         if (!occupancyData) throw new Error("Occupancy summary is unavailable");
         if (!active) return;
         setSeries(memberData);
         setOccupancy(occupancyData);
+        setSlots(slotData);
       })
       .catch((error: unknown) => {
         console.error(error);
@@ -124,6 +135,8 @@
   const topDay =
     DAY_ABBR[occupancy.top_day] ??
     (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+  const visibleSlots = slots.slice(0, 8);
+  const maxBookings = Math.max(...slots.map((slot) => slot.bookings)) || 1;
 
   return (
     <ScrollView
@@ -184,6 +197,39 @@
           </Text>
         </View>
       </View>
+
+      <View style={styles.popularityCard}>
+        <Text style={styles.microLabel}>POPULARNOST TERMINA</Text>
+        <Text style={styles.popularitySubtitle}>Najtraženiji termini</Text>
+
+        {visibleSlots.length === 0 ? (
+          <Text style={styles.emptySlots}>
+            Još nema podataka o prijavama.
+          </Text>
+        ) : (
+          <View style={styles.slotList}>
+            {visibleSlots.map((slot) => {
+              const day =
+                DAY_ABBR[slot.day_of_week] ?? slot.day_of_week.toUpperCase();
+              const barWidth = `${(slot.bookings / maxBookings) * 100}%` as const;
+
+              return (
+                <View key={`${slot.day_of_week}-${slot.time}`}>
+                  <View style={styles.slotHeader}>
+                    <Text style={styles.slotLabel}>
+                      {day} · {slot.time}
+                    </Text>
+                    <Text style={styles.slotBookings}>{slot.bookings}</Text>
+                  </View>
+                  <View style={styles.slotTrack}>
+                    <View style={[styles.slotFill, { width: barWidth }]} />
+                  </View>
+                </View>
+              );
+            })}
+          </View>
+        )}
+      </View>
     </ScrollView>
   );
 }
@@ -280,4 +326,53 @@
     fontSize: 11,
     fontWeight: "700",
   },
+  popularityCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  popularitySubtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+  },
+  slotList: {
+    gap: Spacing.cardGap,
+    marginTop: Spacing.section.compact,
+  },
+  slotHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+  },
+  slotLabel: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  slotBookings: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+    color: Colors.ink,
+    textAlign: "right",
+  },
+  slotTrack: {
+    height: 3,
+    overflow: "hidden",
+    backgroundColor: Colors.track,
+  },
+  slotFill: {
+    height: 3,
+    backgroundColor: Colors.gold,
+  },
+  emptySlots: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+    textAlign: "center",
+    marginTop: Spacing.section.compact,
+  },
 });

 succeeded in 2456ms:
 succeeded in 2510ms:
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index f268a63f9095c10157b70956ea2820eb803bc7a8..acda4d8df82be55d5249ca6e16dff39c9be54a3d
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -12,10 +12,15 @@
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import {
+  memberSeries,
+  occupancySummary,
+  slotPopularity,
+} from "@/services/admin/stats";
 import type {
   MemberSeriesPoint,
   OccupancySummary,
+  SlotPopularity,
 } from "@/services/admin/types";
 
 type Period = "12" | "6" | "all";
@@ -68,6 +73,7 @@
   const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
   const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
   const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [slots, setSlots] = useState<SlotPopularity[]>([]);
   const [loading, setLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const months: 12 | 6 | 24 =
@@ -78,12 +84,17 @@
     setLoading(true);
     setHasError(false);
 
-    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
-      .then(([memberData, occupancyData]) => {
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+      slotPopularity(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData, slotData]) => {
         if (!occupancyData) throw new Error("Occupancy summary is unavailable");
         if (!active) return;
         setSeries(memberData);
         setOccupancy(occupancyData);
+        setSlots(slotData);
       })
       .catch((error: unknown) => {
         console.error(error);
@@ -124,6 +135,8 @@
   const topDay =
     DAY_ABBR[occupancy.top_day] ??
     (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+  const visibleSlots = slots.slice(0, 8);
+  const maxBookings = Math.max(...slots.map((slot) => slot.bookings)) || 1;
 
   return (
     <ScrollView
@@ -184,6 +197,39 @@
           </Text>
         </View>
       </View>
+
+      <View style={styles.popularityCard}>
+        <Text style={styles.microLabel}>POPULARNOST TERMINA</Text>
+        <Text style={styles.popularitySubtitle}>Najtraženiji termini</Text>
+
+        {visibleSlots.length === 0 ? (
+          <Text style={styles.emptySlots}>
+            Još nema podataka o prijavama.
+          </Text>
+        ) : (
+          <View style={styles.slotList}>
+            {visibleSlots.map((slot) => {
+              const day =
+                DAY_ABBR[slot.day_of_week] ?? slot.day_of_week.toUpperCase();
+              const barWidth = `${(slot.bookings / maxBookings) * 100}%` as const;
+
+              return (
+                <View key={`${slot.day_of_week}-${slot.time}`}>
+                  <View style={styles.slotHeader}>
+                    <Text style={styles.slotLabel}>
+                      {day} · {slot.time}
+                    </Text>
+                    <Text style={styles.slotBookings}>{slot.bookings}</Text>
+                  </View>
+                  <View style={styles.slotTrack}>
+                    <View style={[styles.slotFill, { width: barWidth }]} />
+                  </View>
+                </View>
+              );
+            })}
+          </View>
+        )}
+      </View>
     </ScrollView>
   );
 }
@@ -280,4 +326,53 @@
     fontSize: 11,
     fontWeight: "700",
   },
+  popularityCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  popularitySubtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+  },
+  slotList: {
+    gap: Spacing.cardGap,
+    marginTop: Spacing.section.compact,
+  },
+  slotHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+  },
+  slotLabel: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  slotBookings: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+    color: Colors.ink,
+    textAlign: "right",
+  },
+  slotTrack: {
+    height: 3,
+    overflow: "hidden",
+    backgroundColor: Colors.track,
+  },
+  slotFill: {
+    height: 3,
+    backgroundColor: Colors.gold,
+  },
+  emptySlots: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+    textAlign: "center",
+    marginTop: Spacing.section.compact,
+  },
 });

codex
Updated [stats.tsx](/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/stats.tsx) with slot loading, top-eight popularity rows, proportional bars, and empty state.

TypeScript, ESLint, and diff checks pass.

DONE
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index f268a63f9095c10157b70956ea2820eb803bc7a8..acda4d8df82be55d5249ca6e16dff39c9be54a3d
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -12,10 +12,15 @@
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
-import { memberSeries, occupancySummary } from "@/services/admin/stats";
+import {
+  memberSeries,
+  occupancySummary,
+  slotPopularity,
+} from "@/services/admin/stats";
 import type {
   MemberSeriesPoint,
   OccupancySummary,
+  SlotPopularity,
 } from "@/services/admin/types";
 
 type Period = "12" | "6" | "all";
@@ -68,6 +73,7 @@
   const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
   const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
   const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
+  const [slots, setSlots] = useState<SlotPopularity[]>([]);
   const [loading, setLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const months: 12 | 6 | 24 =
@@ -78,12 +84,17 @@
     setLoading(true);
     setHasError(false);
 
-    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
-      .then(([memberData, occupancyData]) => {
+    Promise.all([
+      memberSeries(months),
+      occupancySummary(selectedPeriod),
+      slotPopularity(selectedPeriod),
+    ])
+      .then(([memberData, occupancyData, slotData]) => {
         if (!occupancyData) throw new Error("Occupancy summary is unavailable");
         if (!active) return;
         setSeries(memberData);
         setOccupancy(occupancyData);
+        setSlots(slotData);
       })
       .catch((error: unknown) => {
         console.error(error);
@@ -124,6 +135,8 @@
   const topDay =
     DAY_ABBR[occupancy.top_day] ??
     (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");
+  const visibleSlots = slots.slice(0, 8);
+  const maxBookings = Math.max(...slots.map((slot) => slot.bookings)) || 1;
 
   return (
     <ScrollView
@@ -184,6 +197,39 @@
           </Text>
         </View>
       </View>
+
+      <View style={styles.popularityCard}>
+        <Text style={styles.microLabel}>POPULARNOST TERMINA</Text>
+        <Text style={styles.popularitySubtitle}>Najtraženiji termini</Text>
+
+        {visibleSlots.length === 0 ? (
+          <Text style={styles.emptySlots}>
+            Još nema podataka o prijavama.
+          </Text>
+        ) : (
+          <View style={styles.slotList}>
+            {visibleSlots.map((slot) => {
+              const day =
+                DAY_ABBR[slot.day_of_week] ?? slot.day_of_week.toUpperCase();
+              const barWidth = `${(slot.bookings / maxBookings) * 100}%` as const;
+
+              return (
+                <View key={`${slot.day_of_week}-${slot.time}`}>
+                  <View style={styles.slotHeader}>
+                    <Text style={styles.slotLabel}>
+                      {day} · {slot.time}
+                    </Text>
+                    <Text style={styles.slotBookings}>{slot.bookings}</Text>
+                  </View>
+                  <View style={styles.slotTrack}>
+                    <View style={[styles.slotFill, { width: barWidth }]} />
+                  </View>
+                </View>
+              );
+            })}
+          </View>
+        )}
+      </View>
     </ScrollView>
   );
 }
@@ -280,4 +326,53 @@
     fontSize: 11,
     fontWeight: "700",
   },
+  popularityCard: {
+    backgroundColor: Colors.surface,
+    borderColor: Colors.border,
+    borderWidth: 1,
+    borderRadius: Radii.tile[18],
+    padding: Spacing.cardPadding,
+    ...Shadows.card,
+  },
+  popularitySubtitle: {
+    ...Typography.meta,
+    color: Colors.inkMuted,
+  },
+  slotList: {
+    gap: Spacing.cardGap,
+    marginTop: Spacing.section.compact,
+  },
+  slotHeader: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+  },
+  slotLabel: {
+    fontFamily: FontFamilies.hanken[600],
+    fontSize: 13,
+    fontWeight: "600",
+    color: Colors.ink,
+  },
+  slotBookings: {
+    fontFamily: FontFamilies.bricolage[800],
+    fontSize: 26,
+    fontWeight: "800",
+    color: Colors.ink,
+    textAlign: "right",
+  },
+  slotTrack: {
+    height: 3,
+    overflow: "hidden",
+    backgroundColor: Colors.track,
+  },
+  slotFill: {
+    height: 3,
+    backgroundColor: Colors.gold,
+  },
+  emptySlots: {
+    ...Typography.body,
+    color: Colors.inkMuted,
+    textAlign: "center",
+    marginTop: Spacing.section.compact,
+  },
 });

tokens used
27,280
Updated [stats.tsx](/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/stats.tsx) with slot loading, top-eight popularity rows, proportional bars, and empty state.

TypeScript, ESLint, and diff checks pass.

DONE
