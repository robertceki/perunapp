import { TRAINING_DAYS } from "@/constants/days";
import { getCurrentWeekDates } from "@/lib/week";

const DAY_LABELS: Record<string, string> = {
  monday: "PON",
  tuesday: "UTO",
  wednesday: "SRE",
  thursday: "ČET",
  friday: "PET",
  saturday: "SUB",
};

type DayFilterProps = {
  selectedDay: string;
  onSelectDay: (day: string) => void;
};

export default function DayFilter({
  selectedDay,
  onSelectDay,
}: DayFilterProps) {
  const weekDates = getCurrentWeekDates();

  return (
    <div className="flex gap-2 overflow-x-auto bg-paper px-5 pt-[18px]">
      {TRAINING_DAYS.map((day) => {
        const active = selectedDay === day;
        const dateNumber = String(weekDates[day].getUTCDate()).padStart(2, "0");

        return (
          <button
            aria-pressed={active}
            className={`flex min-w-[48px] flex-1 flex-col items-center gap-1 rounded-chip py-2.5 active:opacity-90 ${active ? "bg-burgundy shadow-sm" : "bg-transparent"}`}
            key={day}
            onClick={() => onSelectDay(day)}
            type="button"
          >
            <span
              className={`text-[10px] font-extrabold tracking-[0.05em] ${active ? "text-burgundy-border" : "text-ink-faint"}`}
            >
              {DAY_LABELS[day]}
            </span>
            <span
              className={`font-display text-base font-extrabold ${active ? "text-surface" : "text-ink"}`}
            >
              {dateNumber}
            </span>
          </button>
        );
      })}
    </div>
  );
}
