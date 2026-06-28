import { TRAINING_DAYS } from "../../constants/days";
import { getCurrentWeekDates } from "../week";

const WEEK_DAYS = [...TRAINING_DAYS, "sunday"] as const;
const ONE_DAY = 24 * 60 * 60 * 1000;

test("returns exactly six training days", () => {
  const week = getCurrentWeekDates();
  const trainingDates = TRAINING_DAYS.map((day) => week[day]);

  expect(trainingDates).toHaveLength(TRAINING_DAYS.length);
  expect(trainingDates).toHaveLength(6);
  expect(trainingDates.every((date) => date instanceof Date)).toBe(true);
});

test("returns consecutive dates for the ISO week", () => {
  const week = getCurrentWeekDates(
    new Date("2026-01-14T12:00:00+01:00"),
  );

  expect(week.monday).toEqual(new Date(Date.UTC(2026, 0, 12)));
  expect(week.sunday).toEqual(new Date(Date.UTC(2026, 0, 18)));

  WEEK_DAYS.slice(1).forEach((day, index) => {
    expect(week[day].getTime() - week[WEEK_DAYS[index]].getTime()).toBe(
      ONE_DAY,
    );
  });
});

test("anchors Sunday and Monday to the correct ISO weeks", () => {
  const sundayWeek = getCurrentWeekDates(
    new Date("2026-01-11T12:00:00+01:00"),
  );
  const mondayWeek = getCurrentWeekDates(
    new Date("2026-01-12T12:00:00+01:00"),
  );

  expect(sundayWeek.monday).toEqual(new Date(Date.UTC(2026, 0, 5)));
  expect(sundayWeek.sunday).toEqual(new Date(Date.UTC(2026, 0, 11)));
  expect(mondayWeek.monday).toEqual(new Date(Date.UTC(2026, 0, 12)));
  expect(mondayWeek.sunday).toEqual(new Date(Date.UTC(2026, 0, 18)));
});

test("accepts an explicit reference date", () => {
  const referenceDate = new Date("2025-12-31T12:00:00+01:00");

  expect(getCurrentWeekDates(referenceDate).monday).toEqual(
    new Date(Date.UTC(2025, 11, 29)),
  );
});
