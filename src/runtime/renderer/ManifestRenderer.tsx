import React from "react";
import type { MiniAppManifest, PageDef } from "@/types/manifest";
import { componentRegistry } from "@/runtime/registry/componentRegistry";
import { validateManifest } from "@/lib/validation/manifest";
import { scopeConfig } from "@/runtime/manifest/scope";
import { AlertCircle } from "lucide-react";

interface Props {
  manifest: MiniAppManifest;
  pageId?: string;
}

export function ManifestRenderer({ manifest, pageId }: Props) {
  const validation = validateManifest(manifest);
  if (!validation.ok) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
        <div className="flex items-center gap-2 font-bold mb-2">
          <AlertCircle size={18} />
          <span>Manifest invalid</span>
        </div>
        <ul className="list-disc pl-5 space-y-1">
          {validation.errors?.map((e, idx) => (
            <li key={idx}>{e}</li>
          ))}
        </ul>
      </div>
    );
  }

  const page: PageDef | undefined = pageId
    ? manifest.pages.find((p) => p.id === pageId)
    : manifest.pages[0];

  if (!page) {
    return <div className="p-4 text-center text-gray-500">No page to render</div>;
  }

  return (
    <div className="space-y-4">
      {page.components.map((c) => {
        const def = componentRegistry.get(c.type);
        if (!def) {
          return (
            <div key={c.id} className="p-3 bg-red-50 text-red-700 rounded-xl text-xs">
              Unsupported component: {c.type}
            </div>
          );
        }
        const configCheck = def.validateConfig(c.config);
        if (!configCheck.ok) {
          return (
            <div key={c.id} className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs">
              Bad config for {c.id}: {configCheck.errors?.join(", ")}
            </div>
          );
        }
        return (
          <div key={c.id} className="component-wrap">
            {def.render({
              config: scopeConfig(manifest.appId, c.config),
              appId: manifest.appId,
            })}
          </div>
        );
      })}
    </div>
  );
}
