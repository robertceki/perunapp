import { Day, TRAINING_DAYS } from "@/constants/days";

export type TrainingWeekDates = Record<Day, Date>;

const BELGRADE_TIME_ZONE = "Europe/Belgrade";

export function getCurrentWeekDates(
  referenceDate: Date = new Date(),
): TrainingWeekDates {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: BELGRADE_TIME_ZONE,
    year: "numeric",
  }).formatToParts(referenceDate);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((value) => value.type === type)?.value);

  const belgradeDate = new Date(
    Date.UTC(part("year"), part("month") - 1, part("day")),
  );
  const isoDay = belgradeDate.getUTCDay() || 7;
  const monday = new Date(belgradeDate);
  monday.setUTCDate(belgradeDate.getUTCDate() - isoDay + 1);

  return TRAINING_DAYS.reduce((week, day, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    week[day] = date;
    return week;
  }, {
    sunday: new Date(
      Date.UTC(
        monday.getUTCFullYear(),
        monday.getUTCMonth(),
        monday.getUTCDate() + 6,
      ),
    ),
  } as TrainingWeekDates);
}
