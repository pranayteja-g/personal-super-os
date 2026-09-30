import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
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
    <View>
      <View style={styles.week}>
        {week.map((d) => {
          const k = format(d, "yyyy-MM-dd");
          return (
            <Pressable key={k} onPress={() => setSelectedDate(appId, k)} style={styles.dayCol}>
              <Text style={styles.dayLabel}>{format(d, "EEE")}</Text>
              <Text style={[styles.dayNum, k === selectedKey && styles.dayNumActive]}>
                {format(d, "d")}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {showRecords &&
        (records.length === 0 ? (
          <Text style={styles.empty}>Nothing on this day</Text>
        ) : (
          records.map((item) => (
            <Text key={item.id} style={styles.item}>
              {String(item.data.title ?? JSON.stringify(item.data))}
            </Text>
          ))
        ))}
    </View>
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

const styles = StyleSheet.create({
  week: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  dayCol: { alignItems: "center", width: 40 },
  dayLabel: { fontSize: 11, color: "#888" },
  dayNum: { fontSize: 16, marginTop: 4 },
  dayNumActive: { fontWeight: "700", color: "#4caf50" },
  item: { paddingVertical: 6, fontSize: 14, color: "#555" },
  empty: { padding: 16, color: "#999", textAlign: "center" },
});
