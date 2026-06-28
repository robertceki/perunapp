import type { Day } from "@/constants/days";
import { TRAINING_DAYS } from "@/constants/days";

export type TrainingWeekDates = Record<Day, Date>;

export function getCurrentWeekDates(referenceDate: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Belgrade",
    year: "numeric",
  }).formatToParts(referenceDate);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const currentDate = new Date(
    Date.UTC(getPart("year"), getPart("month") - 1, getPart("day")),
  );
  const isoDay = currentDate.getUTCDay() || 7;
  const monday = new Date(currentDate);
  monday.setUTCDate(currentDate.getUTCDate() - isoDay + 1);

  return TRAINING_DAYS.reduce(
    (week, day, index) => {
      const date = new Date(monday);
      date.setUTCDate(monday.getUTCDate() + index);
      week[day] = date;
      return week;
    },
    {
      sunday: new Date(
        Date.UTC(
          monday.getUTCFullYear(),
          monday.getUTCMonth(),
          monday.getUTCDate() + 6,
        ),
      ),
    } as TrainingWeekDates,
  );
}
