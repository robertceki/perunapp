import { clampWeeklyLimit } from "../limits";

describe("clampWeeklyLimit", () => {
  test("cannot decrement below the booked session count", () => {
    expect(clampWeeklyLimit(3, -1, 3)).toBe(3);
  });

  test("cannot increment beyond the default maximum of seven", () => {
    expect(clampWeeklyLimit(7, 1, 0)).toBe(7);
  });

  test("increments normally within the allowed range", () => {
    expect(clampWeeklyLimit(4, 1, 2)).toBe(5);
  });

  test("decrements normally within the allowed range", () => {
    expect(clampWeeklyLimit(4, -1, 2)).toBe(3);
  });

  test("clamps an out-of-range current value", () => {
    expect(clampWeeklyLimit(20, -1, 2)).toBe(7);
    expect(clampWeeklyLimit(-5, 1, 2)).toBe(2);
  });

  test("respects a custom maximum limit", () => {
    expect(clampWeeklyLimit(5, 1, 1, 5)).toBe(5);
  });
});
