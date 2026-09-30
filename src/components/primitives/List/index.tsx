import React, { useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import type { RecordEntity } from "@/domain/entities";
import { sqliteRecordRepository } from "@/db/repositories/recordRepository";
import { useUiStore } from "@/store/uiStore";
import { useCollection } from "@/runtime/hooks/useCollection";
import { Check, Plus, Trash2 } from "lucide-react";

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

  const createItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const deleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await sqliteRecordRepository.delete(id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
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
          className="w-9 h-9 rounded-full bg-[#4caf50] hover:bg-green-600 disabled:opacity-50 text-white flex items-center justify-center transition-colors flex-shrink-0"
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
              ? item.data[config.statusField] === (config.doneValue ?? "completed")
              : false;
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
                  className={`flex-1 text-sm ${
                    isDone ? "line-through text-gray-400" : "text-gray-800"
                  }`}
                >
                  {String(item.data[config.titleField] ?? "")}
                </span>
                <button
                  type="button"
                  onClick={(e) => deleteItem(e, item.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity"
                  title="Delete"
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
