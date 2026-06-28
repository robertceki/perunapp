type BarChartDatum = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: BarChartDatum[];
  currentIndex?: number;
  showValueLabelOnCurrent?: boolean;
};

export default function BarChart({
  data,
  currentIndex = 0,
  showValueLabelOnCurrent = false,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-[13px] font-semibold text-ink-muted">
        Nema podataka za izabrani period.
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex h-40 items-end gap-1 pt-3">
      {data.map((item, index) => {
        const height = Math.max((item.value / maxValue) * 112, 4);
        const current = index === currentIndex;

        return (
          <div
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
            key={`${item.label}-${index}`}
          >
            {showValueLabelOnCurrent && current && (
              <span className="font-display text-sm font-extrabold text-ink">
                {item.value}
              </span>
            )}
            <div
              aria-label={`${item.label}: ${item.value}`}
              className={`w-full rounded-t-[6px] ${
                current
                  ? "bg-linear-to-t from-burgundy to-burgundy-text2"
                  : "bg-linear-to-t from-gold to-gold-border"
              }`}
              role="img"
              style={{ height: `${height}px` }}
            />
            <span className="max-w-full truncate text-[9px] font-bold text-ink-faint">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
