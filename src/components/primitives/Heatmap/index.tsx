import React, { useMemo } from "react";
import { z } from "zod";
import { format, addDays, startOfWeek, subWeeks } from "date-fns";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import { useUiStore } from "@/store/uiStore";
import { useCollection } from "@/runtime/hooks/useCollection";

export interface HeatmapConfig {
  collection: string;
  dateField: string;
  successField?: string;
  successValue?: string;
  itemField?: string;
  itemValue?: string;
  weeks?: number;
}

const HeatmapConfigSchema = z.object({
  collection: z.string().min(1),
  dateField: z.string().min(1),
  successField: z.string().optional(),
  successValue: z.string().optional(),
  itemField: z.string().optional(),
  itemValue: z.string().optional(),
  weeks: z.number().int().min(1).max(26).optional(),
});

const SHADES = ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"];

function HeatmapView({ appId, config }: { appId: string; config: HeatmapConfig }) {
  const todayKey = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const selectedKey = useUiStore((s) => s.selectedDate[appId] ?? todayKey);
  const setSelectedDate = useUiStore((s) => s.setSelectedDate);
  const rows = useCollection(config.collection);
  const weeks = config.weeks ?? 12;

  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    for (const r of rows) {
      if (config.successField && r.data[config.successField] !== config.successValue) continue;
      if (config.itemField && r.data[config.itemField] !== config.itemValue) continue;
      const raw = r.data[config.dateField];
      if (typeof raw !== "string" || raw.length < 10) continue;
      const day = raw.slice(0, 10);
      next[day] = (next[day] ?? 0) + 1;
    }
    return next;
  }, [rows, config.dateField, config.successField, config.successValue, config.itemField, config.itemValue]);

  // Pre-compute columns with keys so format() is never called inside the render loop
  const columns = useMemo(() => {
    const start = subWeeks(startOfWeek(new Date()), weeks - 1);
    return Array.from({ length: weeks }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const dateObj = addDays(start, w * 7 + d);
        return {
          date: dateObj,
          key: format(dateObj, "yyyy-MM-dd"),
        };
      })
    );
  }, [weeks]);

  const max = useMemo(() => Math.max(1, ...Object.values(counts)), [counts]);
  const level = (n: number) => (n <= 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col items-center">
      <div className="overflow-x-auto max-w-full pb-2">
        <div className="flex gap-[3px]">
          {columns.map((col, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {col.map((cell) => {
                const k = cell.key;
                const future = k > todayKey;
                const n = counts[k] ?? 0;
                const isSelected = k === selectedKey;
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={future}
                    onClick={() => setSelectedDate(appId, k)}
                    title={`${k}: ${n} activity`}
                    style={{ backgroundColor: SHADES[level(n)] }}
                    className={`w-[18px] h-[18px] rounded-[3px] transition-all cursor-pointer ${
                      future ? "opacity-25 cursor-not-allowed" : "hover:scale-110"
                    } ${
                      isSelected ? "ring-2 ring-gray-900 ring-offset-1 z-10 scale-105" : ""
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="text-xs text-gray-500 font-medium mt-1 flex items-center justify-between w-full px-2">
        <span>{selectedKey}</span>
        <span className="font-semibold text-gray-700">{counts[selectedKey] ?? 0} activity</span>
      </div>
    </div>
  );
}

export const HeatmapComponent: ComponentDefinition<HeatmapConfig> = {
  type: "heatmap",
  version: 1,
  defaultConfig: { collection: "", dateField: "date", weeks: 12 },
  validateConfig(config: unknown): ValidationResult {
    const r = HeatmapConfigSchema.safeParse(config);
    return r.success ? { ok: true } : { ok: false, errors: r.error.issues.map((i) => i.message) };
  },
  render(context: RenderContext) {
    return <HeatmapView appId={context.appId} config={context.config as unknown as HeatmapConfig} />;
  },
  getDataDependencies(config) {
    return [{ collectionId: config.collection }];
  },
  getEventSubscriptions() {
    return [];
  },
};
