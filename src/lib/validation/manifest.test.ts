import { describe, it, expect, beforeAll } from "vitest";
import { componentRegistry } from "@/runtime/registry/componentRegistry";
import { validateManifest } from "./manifest";
import { isCollectionKey } from "@/runtime/manifest/scope";
import type { MiniAppManifest } from "@/types/manifest";
import { dayPlannerManifest } from "@/runtime/manifest/dayPlanner";
import { habitHubManifest } from "@/runtime/manifest/habitHub";
import { readingLogManifest } from "@/runtime/manifest/readingLog";
import { workoutTrackerManifest } from "@/runtime/manifest/workoutTracker";

const BUILT_INS: MiniAppManifest[] = [
  dayPlannerManifest,
  habitHubManifest,
  readingLogManifest,
  workoutTrackerManifest,
];

// Stub definitions: the real primitives import react-native, which vitest can't load.
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

const base = (over: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  appId: "app_t",
  name: "T",
  collections: [],
  pages: [{ id: "p", title: "P", components: [] }],
  ...over,
});

describe("validateManifest", () => {
  it("accepts a minimal manifest", () => {
    expect(validateManifest(base()).ok).toBe(true);
  });

  it("rejects an unknown component type", () => {
    const m = base({
      pages: [{ id: "p", title: "P", components: [{ id: "a", type: "hologram", config: {} }] }],
    });
    expect(validateManifest(m).ok).toBe(false);
  });

  it("rejects a missing schemaVersion", () => {
    const m: Record<string, unknown> = base();
    delete m.schemaVersion;
    expect(validateManifest(m).ok).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(validateManifest(base({ name: "" })).ok).toBe(false);
  });

  it("rejects non-objects", () => {
    expect(validateManifest(null).ok).toBe(false);
    expect(validateManifest("x").ok).toBe(false);
  });
});

describe.each(BUILT_INS.map((m) => [m.name, m] as const))("built-in: %s", (_name, manifest) => {
  it("passes validation", () => {
    const r = validateManifest(manifest);
    expect(r.errors ?? []).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("only references collections it declares", () => {
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
  });
});
