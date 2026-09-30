import React, { useState, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import { z } from "zod";
import { format } from "date-fns";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import type { RecordEntity } from "@/domain/entities";
import { sqliteRecordRepository as repo } from "@/db/repositories/recordRepository";
import { useUiStore } from "@/store/uiStore";
import { useCollection } from "@/runtime/hooks/useCollection";
import { bestValue } from "@/domain/queries/logs";

export interface NumericLoggerConfig {
  collection: string;
  dateField: string;
  valueField: string;
  valueLabel?: string;
  unit?: string;
  unitField?: string; // store the unit on each record
  extraFields?: { field: string; label: string }[]; // more number inputs, e.g. reps
  itemsCollection?: string; // optional picker, e.g. exercises
  itemTitleField?: string;
  itemField?: string; // relation on the log record -> item id
  showBest?: boolean; // max valueField for the selected item, from history
}

const ConfigSchema = z
  .object({
    collection: z.string().min(1),
    dateField: z.string().min(1),
    valueField: z.string().min(1),
    valueLabel: z.string().optional(),
    unit: z.string().optional(),
    unitField: z.string().optional(),
    extraFields: z.array(z.object({ field: z.string().min(1), label: z.string().min(1) })).optional(),
    itemsCollection: z.string().optional(),
    itemTitleField: z.string().optional(),
    itemField: z.string().optional(),
    showBest: z.boolean().optional(),
  })
  .refine((c) => !c.itemsCollection || (c.itemTitleField && c.itemField), {
    message: "itemsCollection needs itemTitleField and itemField",
  });

const num = (s: string): number | null => {
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

function LoggerView({ appId, config }: { appId: string; config: NumericLoggerConfig }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const selectedKey = useUiStore((s) => s.selectedDate[appId] ?? today);
  const logs = useCollection(config.collection);
  const rawItems = useCollection(config.itemsCollection);
  const items = useMemo(() => [...rawItems].reverse(), [rawItems]);
  const [itemId, setItemId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [newItem, setNewItem] = useState("");

  const hasItems = !!config.itemsCollection;
  const extraFields = config.extraFields ?? [];

  const titleOf = (id: unknown) =>
    String(items.find((i) => i.id === id)?.data[config.itemTitleField ?? "title"] ?? "?");

  const addItem = async () => {
    const t = newItem.trim();
    if (!t || !config.itemsCollection) return;
    const rec = await repo.create({
      collectionId: config.itemsCollection,
      data: { [config.itemTitleField ?? "title"]: t },
    });
    setNewItem("");
    setItemId(rec.id);
  };

  const canLog = num(value) !== null && (!hasItems || !!itemId);

  const log = async () => {
    const v = num(value);
    if (v === null || (hasItems && !itemId)) return;
    const data: Record<string, unknown> = {
      [config.dateField]: selectedKey,
      [config.valueField]: v,
    };
    if (config.unitField && config.unit) data[config.unitField] = config.unit;
    if (hasItems && config.itemField) data[config.itemField] = itemId;
    for (const ef of extraFields) {
      const n = num(extras[ef.field] ?? "");
      if (n !== null) data[ef.field] = n;
    }
    await repo.create({ collectionId: config.collection, data });
    setValue("");
    setExtras({});
  };

  const todays = logs.filter((l) => String(l.data[config.dateField] ?? "").startsWith(selectedKey));

  const best =
    config.showBest && hasItems && itemId && config.itemField
      ? bestValue(logs, { itemField: config.itemField, itemId, valueField: config.valueField })
      : null;

  const fmt = (l: RecordEntity) => {
    const v = l.data[config.valueField];
    const u = config.unitField ? l.data[config.unitField] : config.unit;
    const ex = extraFields
      .filter((ef) => l.data[ef.field] !== undefined)
      .map((ef) => `${ef.label} ${l.data[ef.field]}`)
      .join(" · ");
    const head = hasItems && config.itemField ? `${titleOf(l.data[config.itemField])}: ` : "";
    return `${head}${v}${u ? " " + u : ""}${ex ? " · " + ex : ""}`;
  };

  return (
    <View>
      {hasItems && (
        <View>
          <View style={styles.chips}>
            {items.map((it) => (
              <Pressable
                key={it.id}
                onPress={() => setItemId(it.id)}
                style={[styles.chip, itemId === it.id && styles.chipOn]}
              >
                <Text style={[styles.chipText, itemId === it.id && styles.chipTextOn]}>
                  {String(it.data[config.itemTitleField ?? "title"] ?? "")}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="New item…"
              value={newItem}
              onChangeText={setNewItem}
              onSubmitEditing={addItem}
              returnKeyType="done"
            />
            <Pressable style={styles.btnSmall} onPress={addItem}>
              <Text style={styles.btnText}>+</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder={`${config.valueLabel ?? "Value"}${config.unit ? " (" + config.unit + ")" : ""}`}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
        />
        {extraFields.map((ef) => (
          <TextInput
            key={ef.field}
            style={styles.input}
            placeholder={ef.label}
            value={extras[ef.field] ?? ""}
            onChangeText={(t) => setExtras((p) => ({ ...p, [ef.field]: t }))}
            keyboardType="decimal-pad"
          />
        ))}
        <Pressable style={[styles.btn, !canLog && styles.btnOff]} onPress={log} disabled={!canLog}>
          <Text style={styles.btnText}>Log</Text>
        </Pressable>
      </View>

      {best !== null && (
        <Text style={styles.best}>
          Best: {best}
          {config.unit ? " " + config.unit : ""}
        </Text>
      )}

      {todays.length === 0 ? (
        <Text style={styles.empty}>Nothing logged on {selectedKey}</Text>
      ) : (
        todays.map((l) => (
          <Pressable key={l.id} onLongPress={() => repo.delete(l.id)} style={styles.entry}>
            <Text style={styles.entryText}>{fmt(l)}</Text>
          </Pressable>
        ))
      )}
      {todays.length > 0 && <Text style={styles.hint}>Long-press an entry to delete</Text>}
    </View>
  );
}

export const NumericLoggerComponent: ComponentDefinition<NumericLoggerConfig> = {
  type: "numeric_logger",
  version: 1,
  defaultConfig: { collection: "", dateField: "date", valueField: "value" },
  validateConfig(config: unknown): ValidationResult {
    const r = ConfigSchema.safeParse(config);
    return r.success ? { ok: true } : { ok: false, errors: r.error.issues.map((i) => i.message) };
  },
  render(context: RenderContext) {
    return <LoggerView appId={context.appId} config={context.config as unknown as NumericLoggerConfig} />;
  },
  getDataDependencies(config) {
    const deps = [{ collectionId: config.collection }];
    if (config.itemsCollection) deps.push({ collectionId: config.itemsCollection });
    return deps;
  },
  getEventSubscriptions() {
    return [];
  },
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginRight: 6 },
  btn: { paddingHorizontal: 14, height: 38, borderRadius: 8, backgroundColor: "#4caf50", alignItems: "center", justifyContent: "center" },
  btnSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#4caf50", alignItems: "center", justifyContent: "center" },
  btnOff: { backgroundColor: "#bbb" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "#ccc", marginRight: 6, marginBottom: 6 },
  chipOn: { backgroundColor: "#4caf50", borderColor: "#4caf50" },
  chipText: { color: "#555" },
  chipTextOn: { color: "#fff", fontWeight: "600" },
  best: { fontWeight: "700", color: "#4caf50", marginBottom: 6 },
  entry: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ddd" },
  entryText: { fontSize: 15 },
  empty: { padding: 12, color: "#999", textAlign: "center" },
  hint: { color: "#aaa", fontSize: 11, marginTop: 6, textAlign: "center" },
});
