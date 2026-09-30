import { describe, it, expect, beforeAll } from "vitest";
import { componentRegistry } from "@/runtime/registry/componentRegistry";
import { validateManifest } from "@/lib/validation/manifest";
import { isCollectionKey } from "./scope";
import { buildSimpleListManifest, buildHabitManifest, buildLoggerManifest } from "./templates";

beforeAll(() => {
  for (const type of ["list", "calendar", "streak", "checklist", "heatmap", "numeric_logger"]) {
    if (componentRegistry.has(type)) continue;
    componentRegistry.register({
      type,
      version: 1,
      defaultConfig: {},
      validateConfig: () => ({ ok: true }),
      render: () => null as never,
      getDataDependencies: () => [],
      getEventSubscriptions: () => [],
    });
  }
});

function assertSelfConsistent(manifest: ReturnType<typeof buildSimpleListManifest>) {
  const r = validateManifest(manifest);
  expect(r.errors ?? []).toEqual([]);
  expect(r.ok).toBe(true);

  const declared = new Set(manifest.collections.map((c) => c.id));
  for (const page of manifest.pages) {
    for (const comp of page.components) {
      for (const [k, v] of Object.entries(comp.config)) {
        if (isCollectionKey(k) && typeof v === "string") {
          expect(declared.has(v), `${comp.id}.${k} -> "${v}"`).toBe(true);
        }
      }
    }
  }
}

describe("buildSimpleListManifest", () => {
  it("produces a manifest that validates and is self-consistent", () => {
    assertSelfConsistent(buildSimpleListManifest({ name: "Meal Planner" }, "Meal"));
  });

  it("generates a distinct appId each time (no accidental collisions)", () => {
    const a = buildSimpleListManifest({ name: "X" }, "Thing");
    const b = buildSimpleListManifest({ name: "X" }, "Thing");
    expect(a.appId).not.toBe(b.appId);
  });

  it("slugifies odd item labels into a safe collection id", () => {
    const m = buildSimpleListManifest({ name: "X" }, "  Weird Label!! ");
    expect(m.collections[0].id).toBe("weird_labels");
  });
});

describe("buildHabitManifest", () => {
  it("produces a manifest that validates and is self-consistent", () => {
    assertSelfConsistent(buildHabitManifest({ name: "Habit Hub 2" }, "Habit"));
  });

  it("declares two collections (items + logs)", () => {
    const m = buildHabitManifest({ name: "X" }, "Habit");
    expect(m.collections).toHaveLength(2);
  });
});

describe("buildLoggerManifest", () => {
  it("produces a manifest that validates and is self-consistent", () => {
    assertSelfConsistent(buildLoggerManifest({ name: "Gym" }, "Exercise", "Weight", "kg"));
  });

  it("carries the unit through into the logger config", () => {
    const m = buildLoggerManifest({ name: "Gym" }, "Exercise", "Weight", "kg");
    const logger = m.pages[0].components.find((c) => c.type === "numeric_logger")!;
    expect(logger.config.unit).toBe("kg");
    expect(logger.config.valueLabel).toBe("Weight");
  });
});
