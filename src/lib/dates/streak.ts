import { format, subDays } from "date-fns";

const formatDateKey = (d: Date | string): string => {
  if (typeof d === "string") {
    // If it's already "YYYY-MM-DD" or ISO string, extract first 10 chars
    if (d.length >= 10 && d[4] === "-" && d[7] === "-") {
      return d.slice(0, 10);
    }
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? "" : format(parsed, "yyyy-MM-dd");
  }
  return format(d, "yyyy-MM-dd");
};

// Consecutive days ending today (or yesterday if today has none yet).
export function computeDailyStreak(dates: (Date | string)[]): number {
  if (dates.length === 0) return 0;

  const days = new Set<string>();
  for (const d of dates) {
    const k = formatDateKey(d);
    if (k) days.add(k);
  }

  let cursor = new Date();
  let cursorKey = format(cursor, "yyyy-MM-dd");

  if (!days.has(cursorKey)) {
    cursor = subDays(cursor, 1);
    cursorKey = format(cursor, "yyyy-MM-dd");
  }

  let streak = 0;
  while (days.has(cursorKey)) {
    streak += 1;
    cursor = subDays(cursor, 1);
    cursorKey = format(cursor, "yyyy-MM-dd");
  }

  return streak;
}
