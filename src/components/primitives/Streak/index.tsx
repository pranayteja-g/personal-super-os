import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { z } from "zod";
import { parseISO } from "date-fns";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import { useCollection } from "@/runtime/hooks/useCollection";
import { computeDailyStreak } from "@/lib/dates/streak";

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
  const dates = rows
    .filter((r) => r.data[config.successField] === config.successValue)
    .map((r) => (config.dateField ? r.data[config.dateField] : r.updatedAt))
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .map((v) => parseISO(v));
  const streak = computeDailyStreak(dates);

  return (
    <View style={styles.wrap}>
      <Text style={styles.count}>{streak}</Text>
      <Text style={styles.label}>day streak</Text>
    </View>
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

const styles = StyleSheet.create({
  wrap: { alignItems: "center", padding: 16 },
  count: { fontSize: 40, fontWeight: "700" },
  label: { fontSize: 14, color: "#888" },
});
