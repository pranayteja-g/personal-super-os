import React, { useState, useMemo, useCallback } from "react";
import { z } from "zod";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import type { RecordEntity } from "@/domain/entities";
import { sqliteRecordRepository as repo } from "@/db/repositories/recordRepository";
import { useCollection } from "@/runtime/hooks/useCollection";
import { useUiStore } from "@/store/uiStore";
import { Plus, Trash2, ArrowRight, ArrowLeft, Play, Target } from "lucide-react";

export interface KanbanColumn {
  id: string;
  label: string;
  color?: string;
}

export interface KanbanConfig {
  collection: string;
  titleField: string;
  statusField: string;
  columns?: KanbanColumn[];
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: "todo", label: "To Do", color: "#3b82f6" },
  { id: "in_progress", label: "In Progress", color: "#f59e0b" },
  { id: "done", label: "Done", color: "#10b981" },
];

const KanbanConfigSchema = z.object({
  collection: z.string().min(1),
  titleField: z.string().min(1),
  statusField: z.string().min(1),
  columns: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        color: z.string().optional(),
      })
    )
    .optional(),
});

function KanbanView({ appId, config }: { appId: string; config: KanbanConfig }) {
  const records = useCollection(config.collection);
  const columns = config.columns && config.columns.length > 0 ? config.columns : DEFAULT_COLUMNS;
  const [activeColInput, setActiveColInput] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const activeTask = useUiStore((s) => s.activeTask[appId]);
  const setActiveTask = useUiStore((s) => s.setActiveTask);

  const doneColId = columns[columns.length - 1]?.id ?? "done";

  const cardsByCol = useCallback(
    (colId: string) =>
      records.filter((r) => (r.data[config.statusField] ?? columns[0]?.id) === colId),
    [records, config.statusField, columns]
  );

  const addCard = async (colId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = draftTitle.trim();
    if (!title) return;
    await repo.create({
      collectionId: config.collection,
      data: {
        [config.titleField]: title,
        [config.statusField]: colId,
      },
    });
    setDraftTitle("");
    setActiveColInput(null);
  };

  const moveCard = async (record: RecordEntity, targetColId: string) => {
    await repo.update(record.id, {
      data: { [config.statusField]: targetColId },
    });
    // If card moved to done and was active task, clear active task
    if (targetColId === doneColId && activeTask?.itemId === record.id) {
      setActiveTask(appId, null);
    }
  };

  const deleteCard = async (id: string) => {
    if (activeTask?.itemId === id) {
      setActiveTask(appId, null);
    }
    await repo.delete(id);
  };

  const startFocusOnCard = (card: RecordEntity, title: string) => {
    // If already focusing on this card, clicking stops or toggles
    if (activeTask?.itemId === card.id) {
      setActiveTask(appId, null);
    } else {
      setActiveTask(
        appId,
        {
          itemId: card.id,
          title,
          collectionId: config.collection,
          statusField: config.statusField,
          doneValue: doneColId,
          source: "kanban",
        },
        true // auto-start timer
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span>Kanban Board</span>
          {activeTask?.source === "kanban" && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Target size={11} /> 1 Active Focus Task
            </span>
          )}
        </span>
        <span className="text-[11px] font-normal text-gray-400">{records.length} cards</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {columns.map((col, idx) => {
          const cards = cardsByCol(col.id);
          const prevCol = idx > 0 ? columns[idx - 1] : null;
          const nextCol = idx < columns.length - 1 ? columns[idx + 1] : null;
          const isAdding = activeColInput === col.id;
          const isDoneCol = col.id === doneColId;

          return (
            <div
              key={col.id}
              className="w-64 min-w-[240px] flex-shrink-0 bg-gray-50/80 rounded-xl p-3 border border-gray-200/60 flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.color ?? "#4caf50" }}
                  />
                  <h3 className="text-xs font-bold text-gray-800 tracking-tight">{col.label}</h3>
                  <span className="text-[11px] font-bold text-gray-500 bg-white border border-gray-200 px-1.5 py-0.2 rounded-full shadow-2xs">
                    {cards.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveColInput(isAdding ? null : col.id);
                    setDraftTitle("");
                  }}
                  className="w-6 h-6 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
                  title="Add card to column"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add Input if active */}
              {isAdding && (
                <form onSubmit={(e) => addCard(col.id, e)} className="mb-2.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter card title…"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    className="w-full text-xs border border-green-500 rounded-lg p-2 bg-white shadow-2xs focus:outline-none mb-1.5"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      disabled={!draftTitle.trim()}
                      className="flex-1 bg-[#4caf50] hover:bg-green-600 disabled:opacity-40 text-white text-[11px] font-semibold py-1 rounded-md transition-colors cursor-pointer"
                    >
                      Add Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveColInput(null)}
                      className="px-2 bg-gray-200 text-gray-700 text-[11px] font-medium py-1 rounded-md cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Card List */}
              <div className="space-y-2 flex-1 min-h-[60px]">
                {cards.length === 0 && !isAdding && (
                  <div className="h-16 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-[11px] text-gray-400">
                    No cards
                  </div>
                )}
                {cards.map((card) => {
                  const title = String(card.data[config.titleField] ?? "Untitled");
                  const isFocusing = activeTask?.itemId === card.id;

                  return (
                    <div
                      key={card.id}
                      className={`group bg-white rounded-lg p-2.5 border transition-all ${
                        isFocusing
                          ? "border-[#4caf50] ring-2 ring-green-100 shadow-sm"
                          : "border-gray-200/80 shadow-2xs hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span
                          className={`text-xs font-medium leading-snug flex-1 ${
                            isDoneCol ? "line-through text-gray-400" : "text-gray-800"
                          }`}
                        >
                          {title}
                        </span>

                        <button
                          type="button"
                          onClick={() => deleteCard(card.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-0.5 transition-opacity cursor-pointer"
                          title="Delete card"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Movement & Focus Actions */}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100 text-[10px]">
                        <div className="flex items-center gap-1">
                          {prevCol && (
                            <button
                              type="button"
                              onClick={() => moveCard(card, prevCol.id)}
                              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 px-1 py-0.5 rounded transition-colors flex items-center gap-0.5 cursor-pointer"
                              title={`Move to ${prevCol.label}`}
                            >
                              <ArrowLeft size={10} />
                            </button>
                          )}

                          {!isDoneCol && (
                            <button
                              type="button"
                              onClick={() => startFocusOnCard(card, title)}
                              className={`px-1.5 py-0.5 rounded font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                isFocusing
                                  ? "bg-[#4caf50] text-white"
                                  : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                              }`}
                              title={isFocusing ? "Active focus target" : "Start focus timer for this card"}
                            >
                              <Play size={9} className={isFocusing ? "fill-white" : "fill-emerald-600"} />
                              <span>{isFocusing ? "Focusing" : "Focus"}</span>
                            </button>
                          )}
                        </div>

                        {nextCol && (
                          <button
                            type="button"
                            onClick={() => moveCard(card, nextCol.id)}
                            className="flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-1.5 py-0.5 rounded transition-colors ml-auto cursor-pointer"
                            title={`Move to ${nextCol.label}`}
                          >
                            <span>{nextCol.label}</span>
                            <ArrowRight size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const KanbanComponent: ComponentDefinition<KanbanConfig> = {
  type: "kanban",
  version: 1,
  defaultConfig: {
    collection: "",
    titleField: "title",
    statusField: "status",
    columns: DEFAULT_COLUMNS,
  },
  validateConfig(config: unknown): ValidationResult {
    const r = KanbanConfigSchema.safeParse(config);
    return r.success ? { ok: true } : { ok: false, errors: r.error.issues.map((i) => i.message) };
  },
  render(context: RenderContext) {
    return <KanbanView appId={context.appId} config={context.config as unknown as KanbanConfig} />;
  },
  getDataDependencies(config) {
    return [{ collectionId: config.collection }];
  },
  getEventSubscriptions() {
    return [];
  },
};
