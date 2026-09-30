import React, { useState, useMemo } from "react";
import { useAppStore } from "@/store/appStore";
import type { MiniApp } from "@/domain/entities";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  Layers,
  Plus,
  Trash2,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface Props {
  onOpenApp: (appId: string) => void;
  onOpenBuilder: () => void;
}

export function HomeView({ onOpenApp, onOpenBuilder }: Props) {
  const apps = useAppStore((s) => s.apps);
  const deleteApp = useAppStore((s) => s.deleteApp);
  const restoreDefaults = useAppStore((s) => s.restoreDefaults);

  const [appToDelete, setAppToDelete] = useState<MiniApp | null>(null);

  const builtInIds = useMemo(
    () =>
      new Set([
        "app_day_planner",
        "app_habit_hub",
        "app_reading_log",
        "app_workout_tracker",
      ]),
    []
  );

  const confirmDelete = async () => {
    if (!appToDelete) return;
    await deleteApp(appToDelete.id);
    setAppToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Your Mini-Apps</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Modular personal OS driven by declarative JSON manifests
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenBuilder}
          className="flex items-center gap-1.5 bg-[#4caf50] hover:bg-green-600 text-white font-semibold text-sm px-4 py-2 rounded-full shadow-sm transition-all hover:shadow active:scale-95 cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New</span>
        </button>
      </div>

      {/* Mini-App List */}
      <div className="grid gap-3">
        {apps.map((app: MiniApp) => {
          const isBuiltIn = builtInIds.has(app.id);
          const compCount = app.manifest?.pages?.[0]?.components?.length ?? 0;
          return (
            <div
              key={app.id}
              onClick={() => onOpenApp(app.id)}
              className="group bg-white hover:bg-gray-50 border border-gray-200/80 rounded-2xl p-4 shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <AppIcon name={app.icon} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900 text-base">{app.name}</h2>
                    {isBuiltIn ? (
                      <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        Built-in
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles size={10} /> Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {compCount} components · {app.manifest?.collections?.[0]?.name ?? "Records"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Delete button (now available for any app, with in-app confirmation modal) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAppToDelete(app);
                  }}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                  title={`Delete ${app.name}`}
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {apps.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <Layers className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-700 font-semibold text-sm">No mini-apps yet</p>
          <p className="text-gray-400 text-xs">
            Create your first custom mini-app or restore built-in apps.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={onOpenBuilder}
              className="bg-[#4caf50] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-green-600 transition-colors"
            >
              + Create App
            </button>
            <button
              type="button"
              onClick={() => restoreDefaults()}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              Restore Built-in Apps
            </button>
          </div>
        </div>
      )}

      {/* Restore defaults button at bottom if any were deleted */}
      {apps.length > 0 && apps.length < 4 && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => restoreDefaults()}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1.5 mx-auto py-1 px-3 rounded-full hover:bg-gray-200/60 transition-colors"
          >
            <RotateCcw size={12} /> Restore Default Apps
          </button>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (NO window.confirm) */}
      {appToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setAppToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Delete Mini-App</h3>
                <p className="text-xs text-gray-500">This action removes the app definition.</p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{appToDelete.name}"</span>?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAppToDelete(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
