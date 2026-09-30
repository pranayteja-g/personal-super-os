import React from "react";
import { useBuilderStore } from "@/store/builderStore";
import { ManifestRenderer } from "@/runtime/renderer/ManifestRenderer";
import { sqliteMiniAppRepository } from "@/db/repositories/miniAppRepository";
import { useAppStore } from "@/store/appStore";
import { AlertTriangle, ArrowLeft, Check } from "lucide-react";

interface Props {
  onBackToEdit: () => void;
  onSaved: (appId: string) => void;
}

export function PreviewView({ onBackToEdit, onSaved }: Props) {
  const draft = useBuilderStore((s) => s.draft);
  const clear = useBuilderStore((s) => s.clear);
  const refreshApps = useAppStore((s) => s.refresh);

  if (!draft) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-gray-500">No draft to preview.</p>
        <button
          type="button"
          onClick={onBackToEdit}
          className="mt-4 text-sm font-semibold text-[#4caf50] hover:underline"
        >
          Return to builder
        </button>
      </div>
    );
  }

  const save = async () => {
    const now = new Date().toISOString();
    await sqliteMiniAppRepository.save({
      id: draft.appId,
      ownerId: null,
      name: draft.name,
      icon: draft.icon,
      version: draft.schemaVersion,
      manifest: draft,
      createdAt: now,
      updatedAt: now,
    });
    await refreshApps();
    clear();
    onSaved(draft.appId);
  };

  return (
    <div className="space-y-4">
      {/* Preview Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-800 font-medium">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-600" />
          <span>Preview mode — interactive preview before saving</span>
        </div>
        <span className="font-mono bg-amber-100 px-2 py-0.5 rounded text-[11px]">
          {draft.name}
        </span>
      </div>

      {/* Manifest Preview */}
      <ManifestRenderer manifest={draft} />

      {/* Footer Controls */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl p-3 shadow-lg flex gap-3">
        <button
          type="button"
          onClick={onBackToEdit}
          className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <ArrowLeft size={16} /> Edit
        </button>
        <button
          type="button"
          onClick={save}
          className="flex-1 bg-[#4caf50] hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
        >
          <Check size={16} strokeWidth={2.5} /> Save & use
        </button>
      </div>
    </div>
  );
}
