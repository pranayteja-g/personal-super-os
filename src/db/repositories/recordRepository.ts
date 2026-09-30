import type { RecordEntity } from "@/domain/entities";
import { eventBus } from "@/domain/events/bus";
import { newId } from "@/lib/ids";

const STORAGE_KEY = "personal_super_os_records";

class RecordRepository {
  private records: Map<string, RecordEntity> = new Map();
  private collectionIndex: Map<string, Set<string>> = new Map();
  private snapshots: Map<string, RecordEntity[]> = new Map();
  private listeners: Map<string, Set<() => void>> = new Map();
  private loaded = false;
  private persistTimer: number | null = null;

  private load(): void {
    if (this.loaded) return;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const list: RecordEntity[] = JSON.parse(raw);
          for (const item of list) {
            this.records.set(item.id, item);
            this.addToIndex(item.collectionId, item.id);
          }
        }
      }
    } catch (e) {
      console.warn("Could not read records from localStorage:", e);
    }
    this.loaded = true;
  }

  private addToIndex(collectionId: string, recordId: string): void {
    let set = this.collectionIndex.get(collectionId);
    if (!set) {
      set = new Set();
      this.collectionIndex.set(collectionId, set);
    }
    set.add(recordId);
    this.snapshots.delete(collectionId);
  }

  private removeFromIndex(collectionId: string, recordId: string): void {
    const set = this.collectionIndex.get(collectionId);
    if (set) {
      set.delete(recordId);
      if (set.size === 0) {
        this.collectionIndex.delete(collectionId);
      }
    }
    this.snapshots.delete(collectionId);
  }

  private notifyListeners(collectionId: string): void {
    const subs = this.listeners.get(collectionId);
    if (subs) {
      for (const listener of subs) {
        try {
          listener();
        } catch (err) {
          console.error("Collection listener error:", err);
        }
      }
    }
  }

  /**
   * Batched debounce persistence to avoid main-thread UI stutters on rapid updates
   */
  private schedulePersist(): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (this.persistTimer !== null) return;

    this.persistTimer = window.setTimeout(() => {
      this.persistTimer = null;
      try {
        const list = Array.from(this.records.values());
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn("Could not persist records to localStorage:", e);
      }
    }, 150);
  }

  /**
   * Fast synchronous subscription for React's useSyncExternalStore
   */
  subscribe(collectionId: string, listener: () => void): () => void {
    let set = this.listeners.get(collectionId);
    if (!set) {
      set = new Set();
      this.listeners.set(collectionId, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
      if (set?.size === 0) {
        this.listeners.delete(collectionId);
      }
    };
  }

  /**
   * Returns a cached, referentially stable snapshot array for the given collection.
   * If the collection data hasn't changed, returns the exact same array reference.
   */
  getCollectionSnapshot(collectionId?: string): RecordEntity[] {
    this.load();
    if (!collectionId) return [];

    let snapshot = this.snapshots.get(collectionId);
    if (!snapshot) {
      const ids = this.collectionIndex.get(collectionId);
      if (!ids || ids.size === 0) {
        snapshot = [];
      } else {
        snapshot = [];
        for (const id of ids) {
          const rec = this.records.get(id);
          if (rec) snapshot.push(rec);
        }
      }
      this.snapshots.set(collectionId, snapshot);
    }
    return snapshot;
  }

  async list(filter?: { collectionId?: string }): Promise<RecordEntity[]> {
    this.load();
    if (filter?.collectionId) {
      return [...this.getCollectionSnapshot(filter.collectionId)];
    }
    return Array.from(this.records.values());
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
    this.addToIndex(data.collectionId, id);
    this.schedulePersist();
    this.notifyListeners(data.collectionId);
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
    this.snapshots.delete(existing.collectionId);
    this.schedulePersist();
    this.notifyListeners(existing.collectionId);
    eventBus.emit({ type: "record.updated", entityType: existing.collectionId, id });
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    this.load();
    const existing = this.records.get(id);
    if (!existing) return false;
    const collectionId = existing.collectionId;
    this.records.delete(id);
    this.removeFromIndex(collectionId, id);
    this.schedulePersist();
    this.notifyListeners(collectionId);
    eventBus.emit({ type: "record.deleted", entityType: collectionId, id });
    return true;
  }

  async clear(): Promise<void> {
    this.records.clear();
    this.collectionIndex.clear();
    this.snapshots.clear();
    this.schedulePersist();
  }
}

export const sqliteRecordRepository = new RecordRepository();
