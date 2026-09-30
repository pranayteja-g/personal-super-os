import React, { useState, useMemo, useCallback } from "react";
import { z } from "zod";
import { format } from "date-fns";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import type { RecordEntity } from "@/domain/entities";
import { sqliteRecordRepository as repo } from "@/db/repositories/recordRepository";
import { useUiStore } from "@/store/uiStore";
import { computeDailyStreak } from "@/lib/dates/streak";
import { useCollection } from "@/runtime/hooks/useCollection";
import { Check, Plus, Trash2, Flame } from "lucide-react";

export interface ChecklistConfig {
  itemsCollection: string;
  itemTitleField: string;
  logsCollection: string;
  logItemField: string;
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
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const selectedKey = useUiStore((s) => s.selectedDate[appId] ?? today);
  const rawItems = useCollection(config.itemsCollection);
  const logs = useCollection(config.logsCollection);
  const items = useMemo(() => [...rawItems].reverse(), [rawItems]);
  const [draft, setDraft] = useState("");

  const done = config.doneValue ?? "completed";
  const notStarted = config.notStartedValue ?? "not_started";

  // O(L) single-pass lookup index for the selected date's logs
  const selectedDayLogByItem = useMemo(() => {
    const map = new Map<string, RecordEntity>();
    for (const log of logs) {
      const dateVal = String(log.data[config.logDateField] ?? "");
      if (dateVal.startsWith(selectedKey)) {
        const itemId = String(log.data[config.logItemField] ?? "");
        if (itemId) map.set(itemId, log);
      }
    }
    return map;
  }, [logs, config.logDateField, selectedKey, config.logItemField]);

  // O(L) single-pass grouped streaks per habit item
  const streaksByItem = useMemo(() => {
    const datesMap = new Map<string, string[]>();
    for (const log of logs) {
      if (log.data[config.logStatusField] === done) {
        const itemId = String(log.data[config.logItemField] ?? "");
        const rawDate = log.data[config.logDateField];
        if (itemId && typeof rawDate === "string" && rawDate.length >= 10) {
          let arr = datesMap.get(itemId);
          if (!arr) {
            arr = [];
            datesMap.set(itemId, arr);
          }
          arr.push(rawDate.slice(0, 10));
        }
      }
    }

    const streakMap = new Map<string, number>();
    for (const [itemId, dates] of datesMap.entries()) {
      streakMap.set(itemId, computeDailyStreak(dates));
    }
    return streakMap;
  }, [logs, config.logStatusField, done, config.logItemField, config.logDateField]);

  const addItem = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const title = draft.trim();
      if (!title) return;
      await repo.create({
        collectionId: config.itemsCollection,
        data: { [config.itemTitleField]: title },
      });
      setDraft("");
    },
    [draft, config.itemsCollection, config.itemTitleField]
  );

  const toggle = useCallback(
    async (item: RecordEntity) => {
      const existing = selectedDayLogByItem.get(item.id);
      if (existing) {
        const isDone = existing.data[config.logStatusField] === done;
        await repo.update(existing.id, {
          data: { [config.logStatusField]: isDone ? notStarted : done },
        });
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
    },
    [selectedDayLogByItem, config.logStatusField, done, notStarted, config.logsCollection, config.logItemField, selectedKey]
  );

  const deleteItem = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await repo.delete(id);
  }, []);

  const doneCount = useMemo(() => {
    let count = 0;
    for (const item of items) {
      const log = selectedDayLogByItem.get(item.id);
      if (log?.data[config.logStatusField] === done) count++;
    }
    return count;
  }, [items, selectedDayLogByItem, config.logStatusField, done]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <form onSubmit={addItem} className="flex items-center gap-2 mb-2">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="New habit…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="w-9 h-9 rounded-full bg-[#4caf50] hover:bg-green-600 disabled:opacity-50 text-white flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
          title="Add"
        >
          <Plus size={18} />
        </button>
      </form>

      <div className="text-xs font-medium text-gray-500 mb-3 px-1">
        {doneCount}/{items.length} done on <span className="font-semibold text-gray-700">{selectedKey}</span>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">Nothing yet. Add your first habit above!</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const log = selectedDayLogByItem.get(item.id);
            const isDone = log?.data[config.logStatusField] === done;
            const streak = streaksByItem.get(item.id) ?? 0;

            return (
              <div
                key={item.id}
                onClick={() => toggle(item)}
                className="group flex items-center py-2.5 px-1 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                    isDone
                      ? "bg-[#4caf50] border-[#4caf50] text-white"
                      : "border-gray-400 hover:border-gray-500"
                  }`}
                >
                  {isDone && <Check size={14} strokeWidth={3} />}
                </div>
                <span
                  className={`flex-1 text-sm font-medium ${
                    isDone ? "line-through text-gray-400" : "text-gray-800"
                  }`}
                >
                  {String(item.data[config.itemTitleField] ?? "")}
                </span>

                <div className="flex items-center gap-1 text-xs font-bold text-[#4caf50] bg-green-50 px-2 py-0.5 rounded-full mr-2">
                  <Flame size={12} className="fill-[#4caf50]" />
                  <span>{streak}d</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => deleteItem(e, item.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity cursor-pointer"
                  title="Delete habit"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
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
