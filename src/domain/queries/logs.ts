import { parseISO } from "date-fns";
import type { RecordEntity } from "@/domain/entities";

// A "log" points at an "item" through itemField (a relation stored as an id).

export function findLog(
  logs: RecordEntity[],
  o: { itemField: string; itemId: string; dateField: string; date: string }
): RecordEntity | undefined {
  return logs.find((l) => l.data[o.itemField] === o.itemId && l.data[o.dateField] === o.date);
}

// Dates on which this item was marked done (feed into computeDailyStreak).
export function doneDates(
  logs: RecordEntity[],
  o: { itemField: string; itemId: string; dateField: string; statusField: string; doneValue: string }
): Date[] {
  return logs
    .filter((l) => l.data[o.itemField] === o.itemId && l.data[o.statusField] === o.doneValue)
    .map((l) => l.data[o.dateField])
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .map((v) => parseISO(v));
}

// Max numeric value for one item. Derived from history, never stored.
export function bestValue(
  logs: RecordEntity[],
  o: { itemField: string; itemId: string; valueField: string }
): number | null {
  let best: number | null = null;
  for (const l of logs) {
    if (l.data[o.itemField] !== o.itemId) continue;
    const v = l.data[o.valueField];
    if (typeof v === "number" && (best === null || v > best)) best = v;
  }
  return best;
}
