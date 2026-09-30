import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { z } from "zod";
import { format, addDays, startOfWeek, subWeeks } from "date-fns";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import { useUiStore } from "@/store/uiStore";
import { useCollection } from "@/runtime/hooks/useCollection";

export interface HeatmapConfig {
  collection: string;
  dateField: string;
  successField?: string; // count only records where field == successValue
  successValue?: string;
  itemField?: string; // optional filter, e.g. one habit
  itemValue?: string;
  weeks?: number; // default 12
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
const CELL = 18;
const GAP = 3;

const key = (d: Date) => format(d, "yyyy-MM-dd");

function HeatmapView({ appId, config }: { appId: string; config: HeatmapConfig }) {
  const todayKey = key(new Date());
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

  const columns = useMemo(() => {
    const start = subWeeks(startOfWeek(new Date()), weeks - 1);
    return Array.from({ length: weeks }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d))
    );
  }, [weeks]);

  const max = Math.max(1, ...Object.values(counts));
  const level = (n: number) => (n <= 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));

  return (
    <View>
      <View style={styles.grid}>
        {columns.map((col, w) => (
          <View key={w} style={styles.col}>
            {col.map((d) => {
              const k = key(d);
              const future = k > todayKey;
              const n = counts[k] ?? 0;
              return (
                <Pressable
                  key={k}
                  disabled={future}
                  onPress={() => setSelectedDate(appId, k)}
                  style={[
                    styles.cell,
                    { backgroundColor: SHADES[level(n)] },
                    future && styles.future,
                    k === selectedKey && styles.selected,
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
      <Text style={styles.caption}>
        {selectedKey}: {counts[selectedKey] ?? 0}
      </Text>
    </View>
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

const styles = StyleSheet.create({
  grid: { flexDirection: "row", alignSelf: "center" },
  col: { marginRight: GAP },
  cell: { width: CELL, height: CELL, borderRadius: 3, marginBottom: GAP },
  future: { opacity: 0.25 },
  selected: { borderWidth: 2, borderColor: "#333" },
  caption: { textAlign: "center", color: "#888", fontSize: 12, marginTop: 4 },
});
