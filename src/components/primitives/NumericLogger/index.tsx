import React, { useState, useMemo } from "react";
import { z } from "zod";
import { format } from "date-fns";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import type { RecordEntity } from "@/domain/entities";
import { sqliteRecordRepository as repo } from "@/db/repositories/recordRepository";
import { useUiStore } from "@/store/uiStore";
import { useCollection } from "@/runtime/hooks/useCollection";
import { bestValue } from "@/domain/queries/logs";
import { Plus, Trash2, Award } from "lucide-react";

export interface NumericLoggerConfig {
  collection: string;
  dateField: string;
  valueField: string;
  valueLabel?: string;
  unit?: string;
  unitField?: string;
  extraFields?: { field: string; label: string }[];
  itemsCollection?: string;
  itemTitleField?: string;
  itemField?: string;
  showBest?: boolean;
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

  // Auto-select first item if none selected and items exist
  React.useEffect(() => {
    if (hasItems && items.length > 0 && !itemId) {
      setItemId(items[0].id);
    }
  }, [hasItems, items, itemId]);

  const titleOf = (id: unknown) =>
    String(items.find((i) => i.id === id)?.data[config.itemTitleField ?? "title"] ?? "?");

  const addItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const log = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const deleteLog = async (id: string) => {
    await repo.delete(id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      {hasItems && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Select {config.itemTitleField ?? "Exercise"}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {items.map((it) => {
              const isSelected = itemId === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setItemId(it.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-[#4caf50] text-white shadow-sm font-semibold"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {String(it.data[config.itemTitleField ?? "title"] ?? "")}
                </button>
              );
            })}
          </div>
          <form onSubmit={addItem} className="flex gap-2">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={`Add new ${config.itemTitleField ?? "item"}…`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
            />
            <button
              type="submit"
              disabled={!newItem.trim()}
              className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-40 text-xs font-medium flex items-center gap-1 text-gray-700"
            >
              <Plus size={14} /> Add
            </button>
          </form>
        </div>
      )}

      {best !== null && (
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-2 rounded-lg text-xs font-semibold text-green-800 mb-3">
          <Award size={16} className="text-[#4caf50]" />
          <span>
            Personal Best: {best} {config.unit ?? ""}
          </span>
        </div>
      )}

      <form onSubmit={log} className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="number"
          step="any"
          className="flex-1 min-w-[100px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder={`${config.valueLabel ?? "Value"}${config.unit ? " (" + config.unit + ")" : ""}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {extraFields.map((ef) => (
          <input
            key={ef.field}
            type="number"
            step="any"
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder={ef.label}
            value={extras[ef.field] ?? ""}
            onChange={(e) => setExtras((p) => ({ ...p, [ef.field]: e.target.value }))}
          />
        ))}
        <button
          type="submit"
          disabled={!canLog}
          className="bg-[#4caf50] hover:bg-green-600 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Log
        </button>
      </form>

      <div className="border-t border-gray-100 pt-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Logged on {selectedKey}
        </div>
        {todays.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-xs">Nothing logged on this day</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {todays.map((l) => (
              <div key={l.id} className="group flex items-center justify-between py-2 text-sm">
                <span className="text-gray-800 font-medium">{fmt(l)}</span>
                <button
                  type="button"
                  onClick={() => deleteLog(l.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity"
                  title="Delete log entry"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
