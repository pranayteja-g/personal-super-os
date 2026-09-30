import { componentRegistry } from "@/runtime/registry/componentRegistry";
import type { ValidationResult } from "@/types/components";

export function validateManifest(manifest: unknown): ValidationResult {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { ok: false, errors: ["Manifest must be an object"] };
  }

  const m = manifest as Record<string, unknown>;

  if (typeof m.schemaVersion !== "number" || m.schemaVersion < 1) {
    errors.push("schemaVersion must be a positive number");
  }

  if (typeof m.name !== "string" || m.name.trim().length === 0) {
    errors.push("name is required and must not be empty");
  }

  if (typeof m.appId !== "string" || m.appId.trim().length === 0) {
    errors.push("appId is required");
  }

  if (m.collections !== undefined && !Array.isArray(m.collections)) {
    errors.push("collections must be an array");
  }

  if (m.pages !== undefined) {
    if (!Array.isArray(m.pages)) {
      errors.push("pages must be an array");
    } else {
      for (let pIdx = 0; pIdx < m.pages.length; pIdx++) {
        const page = m.pages[pIdx] as Record<string, unknown>;
        if (!page || typeof page !== "object") {
          errors.push(`pages[${pIdx}] must be an object`);
          continue;
        }
        if (Array.isArray(page.components)) {
          for (let cIdx = 0; cIdx < page.components.length; cIdx++) {
            const comp = page.components[cIdx] as Record<string, unknown>;
            if (!comp || typeof comp !== "object") {
              errors.push(`pages[${pIdx}].components[${cIdx}] must be an object`);
              continue;
            }
            if (typeof comp.type !== "string") {
              errors.push(`pages[${pIdx}].components[${cIdx}] missing type`);
              continue;
            }
            if (!componentRegistry.has(comp.type)) {
              errors.push(`Unsupported component type "${comp.type}" in page ${pIdx}`);
            }
          }
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
