import type { ComponentDefinition } from "@/types/components";

class ComponentRegistry {
  private components = new Map<string, ComponentDefinition<any>>();

  register(def: ComponentDefinition<any>): void {
    this.components.set(def.type, def);
  }

  get(type: string): ComponentDefinition<any> | undefined {
    return this.components.get(type);
  }

  has(type: string): boolean {
    return this.components.has(type);
  }

  list(): ComponentDefinition<any>[] {
    return Array.from(this.components.values());
  }
}

export const componentRegistry = new ComponentRegistry();
