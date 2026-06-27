import { DAYS, TRAINING_DAYS } from "../days";

test("defines a consistent Sunday-start training week", () => {
  expect(DAYS).toEqual([
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ]);
  expect(TRAINING_DAYS).toEqual([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ]);
  expect(TRAINING_DAYS).toEqual(DAYS.filter((day) => day !== "sunday"));
});
