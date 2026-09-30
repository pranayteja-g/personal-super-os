import React, { useState, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import { z } from "zod";
import { format } from "date-fns";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import type { RecordEntity } from "@/domain/entities";
import { sqliteRecordRepository as repo } from "@/db/repositories/recordRepository";
import { useUiStore } from "@/store/uiStore";
import { computeDailyStreak } from "@/lib/dates/streak";
import { useCollection } from "@/runtime/hooks/useCollection";
import { findLog, doneDates } from "@/domain/queries/logs";

// Items (definitions) + logs (one record per item per day, linked by an id
// field). Each item gets a check for the selected day and its own streak.
export interface ChecklistConfig {
  itemsCollection: string;
  itemTitleField: string;
  logsCollection: string;
  logItemField: string; // relation: log -> item id
  logDateField: string;
  logStatusField: string;
  doneValue?: string;
  notStartedValue?: string;
}

const ChecklistConfigSchema = z.object({
  itemsCollection: z.string().min(1),
  itemTitleField: z.string().min(1),
  logsCollection: z.string().min(1),
  logItemField: z.string().min(1),
  logDateField: z.string().min(1),
  logStatusField: z.string().min(1),
  doneValue: z.string().optional(),
  notStartedValue: z.string().optional(),
});

function ChecklistView({ appId, config }: { appId: string; config: ChecklistConfig }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const selectedKey = useUiStore((s) => s.selectedDate[appId] ?? today);
  const rawItems = useCollection(config.itemsCollection);
  const logs = useCollection(config.logsCollection);
  const items = useMemo(() => [...rawItems].reverse(), [rawItems]); // oldest first
  const [draft, setDraft] = useState("");

  const done = config.doneValue ?? "completed";
  const notStarted = config.notStartedValue ?? "not_started";

  const logOn = (itemId: string): RecordEntity | undefined =>
    findLog(logs, {
      itemField: config.logItemField,
      itemId,
      dateField: config.logDateField,
      date: selectedKey,
    });

  const isDoneOn = (itemId: string) => logOn(itemId)?.data[config.logStatusField] === done;

  const streakFor = (itemId: string) =>
    computeDailyStreak(
      doneDates(logs, {
        itemField: config.logItemField,
        itemId,
        dateField: config.logDateField,
        statusField: config.logStatusField,
        doneValue: done,
      })
    );

  const addItem = async () => {
    const title = draft.trim();
    if (!title) return;
    await repo.create({ collectionId: config.itemsCollection, data: { [config.itemTitleField]: title } });
    setDraft("");
  };

  const toggle = async (item: RecordEntity) => {
    const existing = logOn(item.id);
    if (existing) {
      const isDone = existing.data[config.logStatusField] === done;
      await repo.update(existing.id, { data: { [config.logStatusField]: isDone ? notStarted : done } });
    } else {
      await repo.create({
        collectionId: config.logsCollection,
        data: {
          [config.logItemField]: item.id,
          [config.logDateField]: selectedKey,
          [config.logStatusField]: done,
        },
      });
    }
  };

  const doneCount = items.filter((it) => isDoneOn(it.id)).length;

  return (
    <View>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="New habit…"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={addItem}>
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.summary}>
        {doneCount}/{items.length} done on {selectedKey}
      </Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>Nothing yet. Long-press an item to delete it.</Text>
      ) : (
        items.map((item) => {
          const isDone = isDoneOn(item.id);
          return (
            <Pressable
              key={item.id}
              style={styles.row}
              onPress={() => toggle(item)}
              onLongPress={() => repo.delete(item.id)}
            >
              <View style={[styles.checkbox, isDone && styles.checkboxDone]} />
              <Text style={[styles.title, isDone && styles.titleDone]}>
                {String(item.data[config.itemTitleField] ?? "")}
              </Text>
              <Text style={styles.streak}>{streakFor(item.id)}d</Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

export const ChecklistComponent: ComponentDefinition<ChecklistConfig> = {
  type: "checklist",
  version: 1,
  defaultConfig: {
    itemsCollection: "",
    itemTitleField: "title",
    logsCollection: "",
    logItemField: "item_id",
    logDateField: "date",
    logStatusField: "status",
  },
  validateConfig(config: unknown): ValidationResult {
    const r = ChecklistConfigSchema.safeParse(config);
    return r.success ? { ok: true } : { ok: false, errors: r.error.issues.map((i) => i.message) };
  },
  render(context: RenderContext) {
    return <ChecklistView appId={context.appId} config={context.config as unknown as ChecklistConfig} />;
  },
  getDataDependencies(config) {
    return [{ collectionId: config.itemsCollection }, { collectionId: config.logsCollection }];
  },
  getEventSubscriptions() {
    return [];
  },
};

const styles = StyleSheet.create({
  addRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  addBtn: { marginLeft: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: "#4caf50", alignItems: "center", justifyContent: "center" },
  addBtnText: { color: "#fff", fontSize: 20, lineHeight: 22 },
  summary: { color: "#888", marginBottom: 6, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#888", marginRight: 12 },
  checkboxDone: { backgroundColor: "#4caf50", borderColor: "#4caf50" },
  title: { fontSize: 16, flex: 1 },
  titleDone: { textDecorationLine: "line-through", color: "#999" },
  streak: { fontSize: 14, fontWeight: "700", color: "#4caf50", marginLeft: 8 },
  empty: { padding: 16, color: "#999", textAlign: "center" },
});
