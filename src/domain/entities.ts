import type { MiniAppManifest } from "@/types/manifest";

export interface RecordEntity {
  id: string;
  collectionId: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MiniApp {
  id: string;
  ownerId: string | null;
  name: string;
  icon?: string;
  version: number;
  manifest: MiniAppManifest;
  createdAt: string;
  updatedAt: string;
}
