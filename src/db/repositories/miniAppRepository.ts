import type { MiniApp } from "@/domain/entities";
import { eventBus } from "@/domain/events/bus";

const STORAGE_KEY = "personal_super_os_apps";

class MiniAppRepository {
  private apps: Map<string, MiniApp> = new Map();
  private loaded = false;

  private load(): void {
    if (this.loaded) return;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const list: MiniApp[] = JSON.parse(raw);
          for (const item of list) {
            this.apps.set(item.id, item);
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
      }
    } catch (e) {
      console.warn("Could not persist apps to localStorage:", e);
    }
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
    const isNew = !this.apps.has(app.id);
    this.apps.set(app.id, app);
    this.persist();
    eventBus.emit({ type: isNew ? "app.created" : "app.updated", id: app.id });
  }

  async delete(id: string): Promise<boolean> {
    this.load();
    const exists = this.apps.has(id);
    if (!exists) return false;
    this.apps.delete(id);
    this.persist();
    eventBus.emit({ type: "app.deleted", id });
    return true;
  }
}

export const sqliteMiniAppRepository = new MiniAppRepository();
