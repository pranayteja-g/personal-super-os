import { create } from "zustand";
import type { MiniAppManifest } from "@/types/manifest";

interface BuilderState {
  draft: MiniAppManifest | null;
  setDraft: (m: MiniAppManifest) => void;
  clear: () => void;
}

// Holds the manifest while the user is building it, so the preview screen
// can render it without stuffing JSON into a route param.
export const useBuilderStore = create<BuilderState>((set) => ({
  draft: null,
  setDraft: (m) => set({ draft: m }),
  clear: () => set({ draft: null }),
}));
