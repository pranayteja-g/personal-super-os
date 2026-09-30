import React, { useMemo } from "react";
import { z } from "zod";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import { useCollection } from "@/runtime/hooks/useCollection";
import { computeDailyStreak } from "@/lib/dates/streak";
import { Flame } from "lucide-react";

export interface StreakConfig {
  collection: string;
  successField: string;
  successValue: string;
  dateField?: string;
  frequency: "daily" | "weekly";
}

const StreakConfigSchema = z.object({
  collection: z.string().min(1),
  successField: z.string().min(1),
  successValue: z.string().min(1),
  dateField: z.string().optional(),
  frequency: z.enum(["daily", "weekly"]),
});

function StreakView({ config }: { config: StreakConfig }) {
  const rows = useCollection(config.collection);

  const streak = useMemo(() => {
    const dates = rows
      .filter((r) => r.data[config.successField] === config.successValue)
      .map((r) => (config.dateField ? r.data[config.dateField] : r.updatedAt))
      .filter((v): v is string => typeof v === "string" && v.length >= 10);
    return computeDailyStreak(dates);
  }, [rows, config.successField, config.successValue, config.dateField]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex flex-col items-center justify-center text-center">
      <div className="flex items-center gap-1.5 text-amber-500 mb-1">
        <Flame size={24} className="fill-amber-500 text-amber-500 animate-pulse" />
      </div>
      <div className="text-4xl font-extrabold text-gray-900 tracking-tight">{streak}</div>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
        day streak
      </div>
    </div>
  );
}

export const StreakComponent: ComponentDefinition<StreakConfig> = {
  type: "streak",
  version: 1,
  defaultConfig: { collection: "", successField: "status", successValue: "completed", frequency: "daily" },
  validateConfig(config: unknown): ValidationResult {
    const r = StreakConfigSchema.safeParse(config);
    return r.success ? { ok: true } : { ok: false, errors: r.error.issues.map((i) => i.message) };
  },
  render(context: RenderContext) {
    return <StreakView config={context.config as unknown as StreakConfig} />;
  },
  getDataDependencies(config) {
    return [{ collectionId: config.collection }];
  },
  getEventSubscriptions() {
    return [];
  },
};
