import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import { z } from "zod";
import { format } from "date-fns";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import type { RecordEntity } from "@/domain/entities";
import { sqliteRecordRepository } from "@/db/repositories/recordRepository";
import { useUiStore } from "@/store/uiStore";
import { useCollection } from "@/runtime/hooks/useCollection";

export interface ListConfig {
  collection: string;
  titleField: string;
  statusField?: string;
  doneValue?: string;
  notStartedValue?: string;
  dateField?: string;
}

const ListConfigSchema = z.object({
  collection: z.string().min(1),
  titleField: z.string().min(1),
  statusField: z.string().optional(),
  doneValue: z.string().optional(),
  notStartedValue: z.string().optional(),
  dateField: z.string().optional(),
});

function ListView({ appId, config }: { appId: string; config: ListConfig }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const selectedKey = useUiStore((s) => s.selectedDate[appId] ?? today);
  const records = useCollection(config.collection);
  const [draft, setDraft] = useState("");

  // Only show items for the selected day (when the list has a dateField).
  const visible = config.dateField
    ? records.filter((r) => String(r.data[config.dateField!] ?? "").startsWith(selectedKey))
    : records;

  const createItem = async () => {
    const title = draft.trim();
    if (!title) return;
    const data: Record<string, unknown> = { [config.titleField]: title };
    if (config.statusField) data[config.statusField] = config.notStartedValue ?? "not_started";
    if (config.dateField) data[config.dateField] = selectedKey;
    await sqliteRecordRepository.create({ collectionId: config.collection, data });
    setDraft("");
  };

  const toggle = async (rec: RecordEntity) => {
    if (!config.statusField) return;
    const done = config.doneValue ?? "completed";
    const notStarted = config.notStartedValue ?? "not_started";
    const isDone = rec.data[config.statusField] === done;
    await sqliteRecordRepository.update(rec.id, {
      data: { [config.statusField]: isDone ? notStarted : done },
    });
  };

  return (
    <View>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Add item…"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={createItem}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={createItem}>
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>
      {visible.length === 0 ? (
        <Text style={styles.empty}>No items yet</Text>
      ) : (
        visible.map((item) => {
          const isDone = config.statusField
            ? item.data[config.statusField] === (config.doneValue ?? "completed")
            : false;
          return (
            <Pressable key={item.id} style={styles.row} onPress={() => toggle(item)}>
              <View style={[styles.checkbox, isDone && styles.checkboxDone]} />
              <Text style={[styles.title, isDone && styles.titleDone]}>
                {String(item.data[config.titleField] ?? "")}
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

export const ListComponent: ComponentDefinition<ListConfig> = {
  type: "list",
  version: 1,
  defaultConfig: { collection: "", titleField: "title", statusField: "status" },
  validateConfig(config: unknown): ValidationResult {
    const r = ListConfigSchema.safeParse(config);
    return r.success ? { ok: true } : { ok: false, errors: r.error.issues.map((i) => i.message) };
  },
  render(context: RenderContext) {
    return <ListView appId={context.appId} config={context.config as unknown as ListConfig} />;
  },
  getDataDependencies(config) {
    return [{ collectionId: config.collection }];
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
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#888", marginRight: 12 },
  checkboxDone: { backgroundColor: "#4caf50", borderColor: "#4caf50" },
  title: { fontSize: 16 },
  titleDone: { textDecorationLine: "line-through", color: "#999" },
  empty: { padding: 16, color: "#999", textAlign: "center" },
});
