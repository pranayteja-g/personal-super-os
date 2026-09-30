import React from "react";
import { z } from "zod";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import { useUiStore } from "@/store/uiStore";
import { useCollection } from "@/runtime/hooks/useCollection";

export interface CalendarConfig {
  collection: string;
  dateField: string;
  showRecords?: boolean; // default true; false = date picker only
}

const CalendarConfigSchema = z.object({
  collection: z.string().min(1),
  dateField: z.string().min(1),
  showRecords: z.boolean().optional(),
});

function CalendarView({ appId, config }: { appId: string; config: CalendarConfig }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const selectedKey = useUiStore((s) => s.selectedDate[appId] ?? today);
  const setSelectedDate = useUiStore((s) => s.setSelectedDate);
  const showRecords = config.showRecords !== false;
  const all = useCollection(config.collection);
  const records = showRecords
    ? all.filter((r) => String(r.data[config.dateField] ?? "").startsWith(selectedKey))
    : [];

  const weekStart = startOfWeek(parseISO(selectedKey));
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="flex justify-between items-center py-2">
        {week.map((d) => {
          const k = format(d, "yyyy-MM-dd");
          const isSelected = k === selectedKey;
          const isToday = k === today;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedDate(appId, k)}
              className={`flex flex-col items-center justify-center w-10 py-1.5 rounded-xl transition-all ${
                isSelected
                  ? "bg-[#4caf50] text-white shadow-sm font-bold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className={`text-[10px] uppercase font-medium ${isSelected ? "text-green-100" : "text-gray-400"}`}>
                {format(d, "EEE")}
              </span>
              <span className={`text-sm mt-0.5 ${isSelected ? "text-white" : ""}`}>
                {format(d, "d")}
              </span>
              {isToday && !isSelected && (
                <span className="w-1 h-1 bg-[#4caf50] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {showRecords && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Schedule for {selectedKey}
          </div>
          {records.length === 0 ? (
            <div className="py-4 text-center text-gray-400 text-xs">Nothing on this day</div>
          ) : (
            <div className="space-y-1.5">
              {records.map((item) => (
                <div key={item.id} className="text-xs text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                  {String(item.data.title ?? JSON.stringify(item.data))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const CalendarComponent: ComponentDefinition<CalendarConfig> = {
  type: "calendar",
  version: 1,
  defaultConfig: { collection: "", dateField: "date" },
  validateConfig(config: unknown): ValidationResult {
    const r = CalendarConfigSchema.safeParse(config);
    return r.success ? { ok: true } : { ok: false, errors: r.error.issues.map((i) => i.message) };
  },
  render(context: RenderContext) {
    return <CalendarView appId={context.appId} config={context.config as unknown as CalendarConfig} />;
  },
  getDataDependencies(config) {
    return [{ collectionId: config.collection }];
  },
  getEventSubscriptions() {
    return [];
  },
};
