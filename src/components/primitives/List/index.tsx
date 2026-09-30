import React, { useState, useMemo, useCallback } from "react";
import { z } from "zod";
import { format } from "date-fns";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import type { RecordEntity } from "@/domain/entities";
import { sqliteRecordRepository } from "@/db/repositories/recordRepository";
import { useUiStore } from "@/store/uiStore";
import { useCollection } from "@/runtime/hooks/useCollection";
import { Check, Plus, Trash2, Play, Target } from "lucide-react";

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
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const selectedKey = useUiStore((s) => s.selectedDate[appId] ?? today);
  const records = useCollection(config.collection);
  const [draft, setDraft] = useState("");

  const activeTask = useUiStore((s) => s.activeTask[appId]);
  const setActiveTask = useUiStore((s) => s.setActiveTask);

  const done = config.doneValue ?? "completed";
  const notStarted = config.notStartedValue ?? "not_started";

  // Memoize visible items so typing in draft doesn't re-filter collection
  const visible = useMemo(() => {
    return config.dateField
      ? records.filter((r) => String(r.data[config.dateField!] ?? "").startsWith(selectedKey))
      : records;
  }, [records, config.dateField, selectedKey]);

  const createItem = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const title = draft.trim();
      if (!title) return;
      const data: Record<string, unknown> = { [config.titleField]: title };
      if (config.statusField) data[config.statusField] = notStarted;
      if (config.dateField) data[config.dateField] = selectedKey;
      await sqliteRecordRepository.create({ collectionId: config.collection, data });
      setDraft("");
    },
    [draft, config.titleField, config.statusField, notStarted, config.dateField, selectedKey, config.collection]
  );

  const toggle = useCallback(
    async (rec: RecordEntity) => {
      if (!config.statusField) return;
      const isDone = rec.data[config.statusField] === done;
      const nextVal = isDone ? notStarted : done;
      await sqliteRecordRepository.update(rec.id, {
        data: { [config.statusField]: nextVal },
      });
      // If completed and was the active focus target, clear active task
      if (nextVal === done && activeTask?.itemId === rec.id) {
        setActiveTask(appId, null);
      }
    },
    [config.statusField, done, notStarted, activeTask, setActiveTask, appId]
  );

  const deleteItem = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (activeTask?.itemId === id) {
        setActiveTask(appId, null);
      }
      await sqliteRecordRepository.delete(id);
    },
    [activeTask, setActiveTask, appId]
  );

  const startFocusOnTask = (e: React.MouseEvent, item: RecordEntity, title: string) => {
    e.stopPropagation();
    if (activeTask?.itemId === item.id) {
      setActiveTask(appId, null);
    } else {
      setActiveTask(
        appId,
        {
          itemId: item.id,
          title,
          collectionId: config.collection,
          statusField: config.statusField,
          doneValue: done,
          notStartedValue: notStarted,
          source: "list",
        },
        true // auto-start timer
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tasks</span>
        {activeTask?.source === "list" && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Target size={11} /> 1 Active Focus Task
          </span>
        )}
      </div>

      <form onSubmit={createItem} className="flex items-center gap-2 mb-3">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Add item…"
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

      {visible.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">No items yet</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {visible.map((item) => {
            const isDone = config.statusField
              ? item.data[config.statusField] === done
              : false;
            const title = String(item.data[config.titleField] ?? "");
            const isFocusing = activeTask?.itemId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => toggle(item)}
                className={`group flex items-center py-2.5 px-2 rounded-lg transition-all cursor-pointer ${
                  isFocusing
                    ? "bg-green-50/70 border border-green-200"
                    : "hover:bg-gray-50"
                }`}
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
                  className={`flex-1 text-sm ${
                    isDone ? "line-through text-gray-400" : "text-gray-800"
                  }`}
                >
                  {title}
                </span>

                <div className="flex items-center gap-1.5 ml-2">
                  {!isDone && (
                    <button
                      type="button"
                      onClick={(e) => startFocusOnTask(e, item, title)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isFocusing
                          ? "bg-[#4caf50] text-white shadow-2xs"
                          : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                      }`}
                      title={isFocusing ? "Active focus target" : "Start focus timer for this task"}
                    >
                      <Play size={10} className={isFocusing ? "fill-white" : "fill-emerald-600"} />
                      <span>{isFocusing ? "Focusing" : "Focus"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => deleteItem(e, item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
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
