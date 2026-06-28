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
  const dayOfWeek = currentDate.getUTCDay();
  const sunday = new Date(currentDate);
  sunday.setUTCDate(currentDate.getUTCDate() - dayOfWeek);

  return TRAINING_DAYS.reduce(
    (week, day, index) => {
      const date = new Date(sunday);
      date.setUTCDate(sunday.getUTCDate() + index + 1);
      week[day] = date;
      return week;
    },
    { sunday: new Date(sunday) } as TrainingWeekDates,
  );
}
