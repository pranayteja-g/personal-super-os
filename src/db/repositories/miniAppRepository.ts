import type { MiniApp } from "@/domain/entities";
import { eventBus } from "@/domain/events/bus";

const STORAGE_KEY = "personal_super_os_apps";
const DELETED_KEY = "personal_super_os_deleted_apps";

class MiniAppRepository {
  private apps: Map<string, MiniApp> = new Map();
  private deletedIds: Set<string> = new Set();
  private loaded = false;

  private load(): void {
    if (this.loaded) return;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const delRaw = window.localStorage.getItem(DELETED_KEY);
        if (delRaw) {
          const list: string[] = JSON.parse(delRaw);
          this.deletedIds = new Set(list);
        }

        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const list: MiniApp[] = JSON.parse(raw);
          for (const item of list) {
            if (!this.deletedIds.has(item.id)) {
              this.apps.set(item.id, item);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Could not read apps from localStorage:", e);
    }
    this.loaded = true;
  }

  private persist(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const list = Array.from(this.apps.values());
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        window.localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(this.deletedIds)));
      }
    } catch (e) {
      console.warn("Could not persist apps to localStorage:", e);
    }
  }

  isDeleted(id: string): boolean {
    this.load();
    return this.deletedIds.has(id);
  }

  async list(): Promise<MiniApp[]> {
    this.load();
    return Array.from(this.apps.values());
  }

  async getById(id: string): Promise<MiniApp | null> {
    this.load();
    return this.apps.get(id) ?? null;
  }

  async save(app: MiniApp): Promise<void> {
    this.load();
    this.deletedIds.delete(app.id);
    const isNew = !this.apps.has(app.id);
    this.apps.set(app.id, app);
    this.persist();
    eventBus.emit({ type: isNew ? "app.created" : "app.updated", id: app.id });
  }

  async delete(id: string): Promise<boolean> {
    this.load();
    this.deletedIds.add(id);
    this.apps.delete(id);
    this.persist();
    eventBus.emit({ type: "app.deleted", id });
    return true;
  }

  async restoreAll(): Promise<void> {
    this.load();
    this.deletedIds.clear();
    this.persist();
  }
}

export const sqliteMiniAppRepository = new MiniAppRepository();
