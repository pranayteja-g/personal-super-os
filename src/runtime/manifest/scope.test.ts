import { describe, it, expect } from "vitest";
import { scopeConfig, isCollectionKey } from "./scope";

describe("scopeConfig", () => {
  it("prefixes `collection`", () => {
    expect(scopeConfig("app_a", { collection: "tasks" }).collection).toBe("app_a:tasks");
  });

  it("prefixes every *Collection key", () => {
    const out = scopeConfig("app_a", { itemsCollection: "x", logsCollection: "y" });
    expect(out).toEqual({ itemsCollection: "app_a:x", logsCollection: "app_a:y" });
  });

  it("leaves other keys alone", () => {
    const out = scopeConfig("app_a", { collection: "t", dateField: "d", weeks: 12 });
    expect(out.dateField).toBe("d");
    expect(out.weeks).toBe(12);
  });

  it("does not mutate the input", () => {
    const input = { collection: "tasks" };
    scopeConfig("app_a", input);
    expect(input.collection).toBe("tasks");
  });

  it("gives two apps with the same collection id different scoped ids (leak regression)", () => {
    const a = scopeConfig("app_day_planner", { collection: "tasks" }).collection;
    const b = scopeConfig("app_reading_log", { collection: "tasks" }).collection;
    expect(a).not.toBe(b);
  });

  it("detects collection keys", () => {
    expect(isCollectionKey("collection")).toBe(true);
    expect(isCollectionKey("itemsCollection")).toBe(true);
    expect(isCollectionKey("dateField")).toBe(false);
  });
});
