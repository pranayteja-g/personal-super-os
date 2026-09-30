import { format, subDays } from "date-fns";

const key = (d: Date) => format(d, "yyyy-MM-dd");

// Consecutive days ending today (or yesterday if today has none yet).
export function computeDailyStreak(dates: Date[]): number {
  const days = new Set(dates.map(key));
  let cursor = new Date();
  if (!days.has(key(cursor))) cursor = subDays(cursor, 1);
  let streak = 0;
  while (days.has(key(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}
