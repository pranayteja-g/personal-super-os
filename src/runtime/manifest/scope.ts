export const isCollectionKey = (k: string): boolean =>
  k === "collection" || k.endsWith("Collection");

// Namespace every collection reference by app, so apps can't read each
// other's records even if their manifests reuse a collection id.
export function scopeConfig(
  appId: string,
  config: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...config };
  for (const [k, v] of Object.entries(config)) {
    if (isCollectionKey(k) && typeof v === "string") out[k] = `${appId}:${v}`;
  }
  return out;
}
