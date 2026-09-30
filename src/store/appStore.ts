import { create } from "zustand";
import type { MiniApp } from "@/domain/entities";
import { sqliteMiniAppRepository } from "@/db/repositories/miniAppRepository";
import { dayPlannerManifest } from "@/runtime/manifest/dayPlanner";
import { habitHubManifest } from "@/runtime/manifest/habitHub";
import { readingLogManifest } from "@/runtime/manifest/readingLog";
import { workoutTrackerManifest } from "@/runtime/manifest/workoutTracker";

interface AppStoreState {
  apps: MiniApp[];
  ready: boolean;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  deleteApp: (id: string) => Promise<void>;
}

const BUILT_INS = [
  dayPlannerManifest,
  habitHubManifest,
  readingLogManifest,
  workoutTrackerManifest,
];

// Upsert built-in manifests on every boot so manifest edits take effect.
// Only mini_apps rows are touched, never user records. Builder-created apps
// are untouched here — they live in the same table, just never reseeded.
async function seedBuiltIns(): Promise<void> {
  const now = new Date().toISOString();
  for (const manifest of BUILT_INS) {
    const existing = await sqliteMiniAppRepository.getById(manifest.appId);
    await sqliteMiniAppRepository.save({
      id: manifest.appId,
      ownerId: null,
      name: manifest.name,
      icon: manifest.icon,
      version: manifest.schemaVersion,
      manifest,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }
}

export const useAppStore = create<AppStoreState>((set) => ({
  apps: [],
  ready: false,
  init: async () => {
    await seedBuiltIns();
    const apps = await sqliteMiniAppRepository.list();
    set({ apps, ready: true });
  },
  refresh: async () => {
    const apps = await sqliteMiniAppRepository.list();
    set({ apps });
  },
  deleteApp: async (id: string) => {
    await sqliteMiniAppRepository.delete(id);
    const apps = await sqliteMiniAppRepository.list();
    set({ apps });
  },
}));
