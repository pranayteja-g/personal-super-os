import React, { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { useUiStore } from "@/store/uiStore";
import { ManifestRenderer } from "@/runtime/renderer/ManifestRenderer";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

interface Props {
  appId: string;
  onBack: () => void;
}

export function AppView({ appId, onBack }: Props) {
  const apps = useAppStore((s) => s.apps);
  const deleteApp = useAppStore((s) => s.deleteApp);
  const app = apps.find((a) => a.id === appId);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleDelete = async () => {
    await deleteApp(app.id);
    setShowDeleteModal(false);
    onBack();
  };

  return (
    <div className="space-y-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-white border border-gray-200/80 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
            title="Back to Apps"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
            <AppIcon name={app.icon} size={18} />
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
              className="text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CalendarIcon size={12} /> Today
            </button>
          )}
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
            {selectedDate}
          </span>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
            title="Delete this app"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Manifest Renderer */}
      <ManifestRenderer manifest={app.manifest} />

      {/* In-App Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowDeleteModal(false)}
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
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{app.name}"</span>?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
