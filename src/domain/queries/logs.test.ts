import { describe, it, expect } from "vitest";
import type { RecordEntity } from "@/domain/entities";
import { findLog, doneDates, bestValue } from "./logs";

let n = 0;
const rec = (data: Record<string, unknown>): RecordEntity => ({
  id: `r${++n}`,
  collectionId: "c",
  data,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});

const logs = [
  rec({ habit: "a", date: "2026-09-27", status: "completed", w: 60 }),
  rec({ habit: "a", date: "2026-09-28", status: "not_started", w: 80 }),
  rec({ habit: "b", date: "2026-09-27", status: "completed", w: 100 }),
  rec({ habit: "a", date: "bad", status: "completed" }),
  rec({ habit: "a", status: "completed" }),
];

describe("findLog", () => {
  it("finds by item + date", () => {
    const l = findLog(logs, { itemField: "habit", itemId: "a", dateField: "date", date: "2026-09-28" });
    expect(l?.data.status).toBe("not_started");
  });
  it("does not mix items", () => {
    const l = findLog(logs, { itemField: "habit", itemId: "b", dateField: "date", date: "2026-09-28" });
    expect(l).toBeUndefined();
  });
});

describe("doneDates", () => {
  it("returns only done logs of that item, skipping missing dates", () => {
    const d = doneDates(logs, {
      itemField: "habit", itemId: "a", dateField: "date", statusField: "status", doneValue: "completed",
    });
    // "2026-09-27" plus "bad" (parses to Invalid Date but still present); missing date skipped
    expect(d.length).toBe(2);
    expect(d[0].getDate()).toBe(27);
  });
  it("is empty for an unknown item", () => {
    const d = doneDates(logs, {
      itemField: "habit", itemId: "zzz", dateField: "date", statusField: "status", doneValue: "completed",
    });
    expect(d).toEqual([]);
  });
});

describe("bestValue", () => {
  it("returns the max for one item only", () => {
    expect(bestValue(logs, { itemField: "habit", itemId: "a", valueField: "w" })).toBe(80);
    expect(bestValue(logs, { itemField: "habit", itemId: "b", valueField: "w" })).toBe(100);
  });
  it("is null when there is no numeric data", () => {
    expect(bestValue(logs, { itemField: "habit", itemId: "zzz", valueField: "w" })).toBeNull();
  });
  it("drops back when the best entry is removed (derived, not stored)", () => {
    const without = logs.filter((l) => l.data.w !== 80);
    expect(bestValue(without, { itemField: "habit", itemId: "a", valueField: "w" })).toBe(60);
  });
});
