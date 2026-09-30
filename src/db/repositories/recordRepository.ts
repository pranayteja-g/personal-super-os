import type { RecordEntity } from "@/domain/entities";
import { eventBus } from "@/domain/events/bus";
import { newId } from "@/lib/ids";

const STORAGE_KEY = "personal_super_os_records";

class RecordRepository {
  private records: Map<string, RecordEntity> = new Map();
  private loaded = false;

  private load(): void {
    if (this.loaded) return;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const list: RecordEntity[] = JSON.parse(raw);
          for (const item of list) {
            this.records.set(item.id, item);
          }
        }
      }
    } catch (e) {
      console.warn("Could not read records from localStorage:", e);
    }
    this.loaded = true;
  }

  private persist(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const list = Array.from(this.records.values());
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.warn("Could not persist records to localStorage:", e);
    }
  }

  async list(filter?: { collectionId?: string }): Promise<RecordEntity[]> {
    this.load();
    const all = Array.from(this.records.values());
    if (filter?.collectionId) {
      return all.filter((r) => r.collectionId === filter.collectionId);
    }
    return all;
  }

  async getById(id: string): Promise<RecordEntity | null> {
    this.load();
    return this.records.get(id) ?? null;
  }

  async create(data: { collectionId: string; data: Record<string, unknown> }): Promise<RecordEntity> {
    this.load();
    const now = new Date().toISOString();
    const id = newId("rec");
    const rec: RecordEntity = {
      id,
      collectionId: data.collectionId,
      data: data.data,
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(id, rec);
    this.persist();
    eventBus.emit({ type: "record.created", entityType: data.collectionId, id });
    return rec;
  }

  async update(id: string, update: { data: Record<string, unknown> }): Promise<RecordEntity | null> {
    this.load();
    const existing = this.records.get(id);
    if (!existing) return null;
    const now = new Date().toISOString();
    const updated: RecordEntity = {
      ...existing,
      data: { ...existing.data, ...update.data },
      updatedAt: now,
    };
    this.records.set(id, updated);
    this.persist();
    eventBus.emit({ type: "record.updated", entityType: existing.collectionId, id });
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    this.load();
    const existing = this.records.get(id);
    if (!existing) return false;
    const collectionId = existing.collectionId;
    this.records.delete(id);
    this.persist();
    eventBus.emit({ type: "record.deleted", entityType: collectionId, id });
    return true;
  }

  async clear(): Promise<void> {
    this.records.clear();
    this.persist();
  }
}

export const sqliteRecordRepository = new RecordRepository();
