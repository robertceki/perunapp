import { useEffect, useState } from "react";

import BarChart from "@/components/admin/BarChart";
import FilterChips from "@/components/admin/FilterChips";
import { useAuth } from "@/hooks/useAuth";
import {
  memberSeries,
  occupancySummary,
  slotPopularity,
} from "@/services/admin/stats";
import type {
  MemberSeriesPoint,
  OccupancySummary,
  SlotPopularity,
} from "@/services/admin/types";

type Period = "12" | "6" | "all";

const PERIOD_OPTIONS: readonly { key: Period; label: string }[] = [
  { key: "12", label: "12 meseci" },
  { key: "6", label: "6 meseci" },
  { key: "all", label: "Sve" },
];

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

const DAY_ABBR: Record<string, string> = {
  monday: "PON",
  tuesday: "UTO",
  wednesday: "SRE",
  thursday: "ČET",
  friday: "PET",
  saturday: "SUB",
  sunday: "NED",
};

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

export default function Statistika() {
  const { profile } = useAuth();
  const [period, setPeriod] = useState<Period>("12");
  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
  const [slots, setSlots] = useState<SlotPopularity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const months: 6 | 12 | 24 = period === "all" ? 24 : period === "12" ? 12 : 6;

  useEffect(() => {
    if (profile?.role !== "admin") {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setHasError(false);

    Promise.all([
      memberSeries(months),
      occupancySummary(period),
      slotPopularity(period),
    ])
      .then(([memberData, occupancyData, slotData]) => {
        if (!occupancyData) throw new Error("Occupancy summary unavailable");
        if (!active) return;
        setSeries(memberData);
        setOccupancy(occupancyData);
        setSlots(slotData);
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
  }, [months, period, profile?.role]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center py-20">
        <div
          aria-label="Učitavanje statistike"
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

  const chartData = series.map((point) => ({
    label: monthLabel(point.month),
    value: point.total_members,
  }));
  const latestMembers = series.at(-1)?.total_members;
  const percent = trendPercent(series);
  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
  const topDay =
    DAY_ABBR[occupancy.top_day] || occupancy.top_day.toUpperCase() || "—";
  const visibleSlots = slots
    .toSorted((first, second) => second.bookings - first.bookings)
    .slice(0, 8);
  const maxBookings = Math.max(...visibleSlots.map((slot) => slot.bookings), 1);

  return (
    <div className="flex flex-col gap-[18px] px-5 pt-5 pb-6">
      <section>
        <h1 className="font-display text-[23px] font-extrabold text-ink">
          Statistika
        </h1>
        <p className="mt-1 text-[13.5px] font-semibold text-ink-muted">
          Trendovi članstva i posećenosti
        </p>
      </section>

      <FilterChips options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />

      <section className="rounded-[18px] border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[11px] font-extrabold tracking-[0.1em] text-ink-faint">
              ČLANOVA UKUPNO
            </h2>
            <p className="mt-1 font-display text-[28px] font-extrabold text-ink">
              {latestMembers?.toString() ?? "—"}
            </p>
          </div>
          <span className="rounded-chip bg-sage-tint px-2.5 py-1 text-[11px] font-bold text-sage">
            {percent === null ? "—" : `▲ ${percent}% / ${months}m`}
          </span>
        </div>
        <BarChart currentIndex={chartData.length - 1} data={chartData} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <article className="min-w-0 rounded-[18px] border border-border bg-surface p-4 shadow-sm">
          <h2 className="text-[11px] font-extrabold tracking-[0.1em] text-ink-faint">
            NOVIH / MES.
          </h2>
          <p className="mt-1 font-display text-[26px] font-extrabold text-gold-deep">
            +{occupancy.new_this_month}
          </p>
          <p
            className={`mt-1 text-[11px] font-bold ${
              gainedMembers ? "text-sage" : "text-ink-muted"
            }`}
          >
            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
          </p>
        </article>
        <article className="min-w-0 rounded-[18px] border border-border bg-surface p-4 shadow-sm">
          <h2 className="text-[11px] font-extrabold tracking-[0.1em] text-ink-faint">
            PROS. POPUNJ.
          </h2>
          <p className="mt-1 font-display text-[26px] font-extrabold text-burgundy">
            {occupancy.avg_pct}%
          </p>
          <p className="mt-1 text-[11px] font-bold text-ink-muted">
            najjači dan: {topDay}
          </p>
        </article>
      </section>

      <section className="rounded-[18px] border border-border bg-surface p-4 shadow-sm">
        <h2 className="text-[11px] font-extrabold tracking-[0.1em] text-ink-faint">
          POPULARNOST TERMINA
        </h2>
        <p className="mt-1 text-[13px] font-semibold text-ink-muted">
          Najtraženiji termini
        </p>

        {visibleSlots.length === 0 ? (
          <p className="py-7 text-center text-[13px] font-semibold text-ink-muted">
            Još nema podataka o prijavama.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-[13px]">
            {visibleSlots.map((slot) => {
              const day =
                DAY_ABBR[slot.day_of_week] ?? slot.day_of_week.toUpperCase();
              const width = (slot.bookings / maxBookings) * 100;

              return (
                <div key={`${slot.day_of_week}-${slot.time}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-semibold text-ink">
                      {day} · {slot.time.slice(0, 5)}
                    </span>
                    <span className="font-display text-base font-extrabold text-ink">
                      {slot.bookings}
                    </span>
                  </div>
                  <div className="mt-1 h-[3px] overflow-hidden bg-track">
                    <div
                      className="h-full bg-gold"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
