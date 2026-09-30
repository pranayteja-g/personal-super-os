import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { subDays } from "date-fns";
import { computeDailyStreak } from "./streak";

const ago = (n: number) => subDays(new Date(), n);

describe("computeDailyStreak", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 28, 12, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is 0 with no dates", () => {
    expect(computeDailyStreak([])).toBe(0);
  });

  it("counts today alone as 1", () => {
    expect(computeDailyStreak([ago(0)])).toBe(1);
  });

  it("keeps the streak alive if today is not done yet", () => {
    expect(computeDailyStreak([ago(1)])).toBe(1);
    expect(computeDailyStreak([ago(1), ago(2), ago(3)])).toBe(3);
  });

  it("counts consecutive days ending today", () => {
    expect(computeDailyStreak([ago(0), ago(1), ago(2)])).toBe(3);
  });

  it("stops at a gap", () => {
    expect(computeDailyStreak([ago(0), ago(1), ago(3)])).toBe(2);
  });

  it("counts several entries on one day once", () => {
    expect(computeDailyStreak([ago(0), ago(0), ago(1)])).toBe(2);
  });

  it("is 0 if the last done day is 2+ days ago", () => {
    expect(computeDailyStreak([ago(2), ago(3)])).toBe(0);
  });
});
