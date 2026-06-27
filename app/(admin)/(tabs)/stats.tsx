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
