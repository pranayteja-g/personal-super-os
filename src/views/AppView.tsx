import React from "react";
import { useAppStore } from "@/store/appStore";
import { useUiStore } from "@/store/uiStore";
import { ManifestRenderer } from "@/runtime/renderer/ManifestRenderer";
import {
  ArrowLeft,
  CalendarCheck,
  Repeat,
  BookOpen,
  Dumbbell,
  Layers,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";

interface Props {
  appId: string;
  onBack: () => void;
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

export function AppView({ appId, onBack }: Props) {
  const apps = useAppStore((s) => s.apps);
  const app = apps.find((a) => a.id === appId);

  const today = format(new Date(), "yyyy-MM-dd");
  const selectedDate = useUiStore((s) => s.selectedDate[appId] ?? today);
  const setSelectedDate = useUiStore((s) => s.setSelectedDate);

  if (!app) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Mini-app not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 text-sm font-semibold text-[#4caf50] hover:underline"
        >
          Return to apps
        </button>
      </div>
    );
  }

  const isToday = selectedDate === today;

  return (
    <div className="space-y-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-white border border-gray-200/80 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
            title="Back to Apps"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
            {getAppIcon(app.icon)}
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-base leading-tight">{app.name}</h1>
            <p className="text-[11px] text-gray-400 font-mono">{app.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedDate(appId, today)}
              className="text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
            >
              <CalendarIcon size={12} /> Today
            </button>
          )}
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
            {selectedDate}
          </span>
        </div>
      </div>

      {/* Manifest Renderer */}
      <ManifestRenderer manifest={app.manifest} />
    </div>
  );
}
