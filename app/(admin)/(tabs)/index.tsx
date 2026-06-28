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
    alignItems: "stretch",
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
