import React, { useState, useMemo } from "react";
import { z } from "zod";
import { format } from "date-fns";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import type { RecordEntity } from "@/domain/entities";
import { sqliteRecordRepository as repo } from "@/db/repositories/recordRepository";
import { useUiStore } from "@/store/uiStore";
import { computeDailyStreak } from "@/lib/dates/streak";
import { useCollection } from "@/runtime/hooks/useCollection";
import { findLog, doneDates } from "@/domain/queries/logs";
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
  const today = format(new Date(), "yyyy-MM-dd");
  const selectedKey = useUiStore((s) => s.selectedDate[appId] ?? today);
  const rawItems = useCollection(config.itemsCollection);
  const logs = useCollection(config.logsCollection);
  const items = useMemo(() => [...rawItems].reverse(), [rawItems]);
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

  const addItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const deleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await repo.delete(id);
  };

  const doneCount = items.filter((it) => isDoneOn(it.id)).length;

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
          className="w-9 h-9 rounded-full bg-[#4caf50] hover:bg-green-600 disabled:opacity-50 text-white flex items-center justify-center transition-colors flex-shrink-0"
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
            const isDone = isDoneOn(item.id);
            const streak = streakFor(item.id);
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
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity"
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
