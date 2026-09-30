import React from "react";
import { useAppStore } from "@/store/appStore";
import type { MiniApp } from "@/domain/entities";
import {
  CalendarCheck,
  Repeat,
  BookOpen,
  Dumbbell,
  Layers,
  Plus,
  Trash2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface Props {
  onOpenApp: (appId: string) => void;
  onOpenBuilder: () => void;
}

function getAppIcon(iconName?: string) {
  switch (iconName) {
    case "calendar-check":
      return <CalendarCheck className="w-5 h-5 text-blue-500" />;
    case "repeat":
      return <Repeat className="w-5 h-5 text-green-500" />;
    case "book":
      return <BookOpen className="w-5 h-5 text-purple-500" />;
    case "dumbbell":
      return <Dumbbell className="w-5 h-5 text-orange-500" />;
    default:
      return <Layers className="w-5 h-5 text-emerald-500" />;
  }
}

export function HomeView({ onOpenApp, onOpenBuilder }: Props) {
  const apps = useAppStore((s) => s.apps);
  const deleteApp = useAppStore((s) => s.deleteApp);

  const builtInIds = new Set([
    "app_day_planner",
    "app_habit_hub",
    "app_reading_log",
    "app_workout_tracker",
  ]);

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
          className="flex items-center gap-1.5 bg-[#4caf50] hover:bg-green-600 text-white font-semibold text-sm px-4 py-2 rounded-full shadow-sm transition-all hover:shadow active:scale-95"
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
                  {getAppIcon(app.icon)}
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

              <div className="flex items-center gap-2">
                {!isBuiltIn && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete mini-app "${app.name}"?`)) {
                        deleteApp(app.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-2 rounded-lg transition-all"
                    title="Delete app"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {apps.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-6">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading mini-apps...</p>
        </div>
      )}
    </div>
  );
}
