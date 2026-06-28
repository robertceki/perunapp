export function clampWeeklyLimit(
  max: number,
  delta: number,
  bookedCount: number,
  maxLimit = 7,
): number {
  return Math.min(maxLimit, Math.max(bookedCount, max + delta));
}
