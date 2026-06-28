import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import BarChart from "@/components/admin/BarChart";
import StatTile from "@/components/admin/StatTile";
import { DAYS } from "@/constants/days";
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { memberSeries, occupancySummary } from "@/services/admin/stats";
import type {
  MemberSeriesPoint,
  OccupancySummary,
} from "@/services/admin/types";

const MONTHS = [
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

function monthLabel(isoMonth: string) {
  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
  return MONTHS[monthIndex] ?? "—";
}

function trendPercent(series: MemberSeriesPoint[]) {
  const first = series[0]?.total_members;
  const last = series.at(-1)?.total_members;

  if (first === undefined || last === undefined || first === 0) return null;
  return Math.round(((last - first) / first) * 100);
}

export default function Pregled() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { loading: trainingsLoading, trainings } = useTrainings();
  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (profile?.role !== "admin") {
      setLoading(false);
      return;
    }

    let active = true;

    Promise.all([memberSeries(6), occupancySummary("6")])
      .then(([memberData, occupancyData]) => {
        if (!occupancyData) throw new Error("Occupancy summary unavailable");
        if (!active) return;
        setSeries(memberData);
        setOccupancy(occupancyData);
      })
      .catch(() => {
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [profile?.role]);

  if (loading || trainingsLoading) {
    return (
      <div className="flex min-h-full items-center justify-center py-20">
        <div
          aria-label="Učitavanje pregleda"
          className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-burgundy"
          role="status"
        />
      </div>
    );
  }

  if (hasError || !occupancy) {
    return (
      <p className="flex min-h-full items-center justify-center px-5 py-20 text-sm font-semibold text-ink-muted">
        Greška pri učitavanju
      </p>
    );
  }

  const now = new Date();
  const latestMembers = series.at(-1)?.total_members;
  const percent = trendPercent(series);
  const today = DAYS[now.getDay()];
  const openToday = trainings.filter(
    (training) => training.is_open && training.day_of_week === today,
  ).length;
  const chartData = series.map((point) => ({
    label: monthLabel(point.month),
    value: point.total_members,
  }));

  return (
    <div className="flex flex-col gap-[18px] px-5 pt-5 pb-6">
      <section>
        <h1 className="font-display text-[25px] font-extrabold leading-tight text-ink">
          Zdravo, Admin
        </h1>
        <p className="mt-1 text-[13.5px] font-semibold text-ink-muted">
          Pregled centra · {MONTHS[now.getMonth()].toLowerCase()} {now.getFullYear()}.
        </p>
      </section>

      <section className="grid auto-rows-fr grid-cols-2 gap-[11px]">
        <StatTile
          delta={
            occupancy.new_this_month === 0
              ? undefined
              : `▲ +${occupancy.new_this_month} ovog meseca`
          }
          deltaColor="text-sage"
          figure={latestMembers?.toString() ?? "—"}
          figureColor="text-burgundy"
          label="aktivnih članova"
        />
        <StatTile
          figure={`${occupancy.avg_pct}%`}
          figureColor="text-gold-deep"
          label="popunjenost"
        />
        <StatTile
          figure={trainings.length.toString()}
          label="treninga ove nedelje"
        />
        <StatTile
          figure={openToday.toString()}
          figureColor="text-sage"
          label="otvorenih slotova danas"
        />
      </section>

      <section className="rounded-[18px] border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[11px] font-extrabold tracking-[0.1em] text-ink-faint">
            ČLANOVI PO MESECU
          </h2>
          <span className="rounded-chip bg-sage-tint px-2.5 py-1 text-[11px] font-bold text-sage">
            {percent === null ? "—" : `▲ ${percent}% / 6m`}
          </span>
        </div>
        <BarChart
          currentIndex={chartData.length - 1}
          data={chartData}
          showValueLabelOnCurrent
        />
      </section>

      <button
        className="w-full rounded-input bg-burgundy p-4 text-[14.5px] font-bold text-surface shadow-sm active:opacity-90"
        onClick={() => navigate("/admin/training/new")}
        type="button"
      >
        ＋ Novi trening
      </button>
    </div>
  );
}
