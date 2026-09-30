import type { MiniAppManifest, CollectionDef, ComponentDef } from "@/types/manifest";
import { newId } from "@/lib/ids";

export interface BuilderMeta {
  name: string;
  icon?: string;
}

export interface FreeformBlock {
  id: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
}

function slug(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "item";
}

export function buildSimpleListManifest(meta: BuilderMeta, itemLabel: string): MiniAppManifest {
  const collection = slug(itemLabel) + "s";
  return {
    schemaVersion: 1,
    appId: `app_${newId()}`,
    name: meta.name,
    icon: meta.icon ?? "calendar-check",
    collections: [
      {
        id: collection,
        name: itemLabel,
        fields: [
          { id: "title", name: "Title", type: "text", required: true },
          { id: "status", name: "Status", type: "enum", options: ["not_started", "completed"] },
          { id: "due_date", name: "Date", type: "date" },
        ],
      },
    ],
    pages: [
      {
        id: "main",
        title: meta.name,
        components: [
          { id: "heatmap", type: "heatmap", config: { collection, dateField: "due_date", successField: "status", successValue: "completed", weeks: 12 } },
          { id: "calendar", type: "calendar", config: { collection, dateField: "due_date" } },
          {
            id: "list", type: "list",
            config: { collection, titleField: "title", statusField: "status", doneValue: "completed", notStartedValue: "not_started", dateField: "due_date" },
          },
          { id: "streak", type: "streak", config: { collection, successField: "status", successValue: "completed", dateField: "due_date", frequency: "daily" } },
        ],
      },
    ],
  };
}

export function buildHabitManifest(meta: BuilderMeta, itemLabel: string): MiniAppManifest {
  const items = slug(itemLabel) + "s";
  const logs = items + "_logs";
  return {
    schemaVersion: 1,
    appId: `app_${newId()}`,
    name: meta.name,
    icon: meta.icon ?? "repeat",
    collections: [
      { id: items, name: itemLabel, fields: [{ id: "title", name: "Title", type: "text", required: true }] },
      {
        id: logs, name: `${itemLabel} logs`,
        fields: [
          { id: "item_id", name: itemLabel, type: "relation", required: true },
          { id: "date", name: "Date", type: "date", required: true },
          { id: "status", name: "Status", type: "enum", options: ["not_started", "completed"] },
        ],
      },
    ],
    pages: [
      {
        id: "main",
        title: meta.name,
        components: [
          { id: "heatmap", type: "heatmap", config: { collection: logs, dateField: "date", successField: "status", successValue: "completed", weeks: 12 } },
          { id: "calendar", type: "calendar", config: { collection: logs, dateField: "date", showRecords: false } },
          {
            id: "checklist", type: "checklist",
            config: {
              itemsCollection: items, itemTitleField: "title",
              logsCollection: logs, logItemField: "item_id", logDateField: "date", logStatusField: "status",
              doneValue: "completed", notStartedValue: "not_started",
            },
          },
        ],
      },
    ],
  };
}

export function buildLoggerManifest(meta: BuilderMeta, itemLabel: string, valueLabel: string, unit?: string): MiniAppManifest {
  const items = slug(itemLabel) + "s";
  const logs = items + "_logs";
  return {
    schemaVersion: 1,
    appId: `app_${newId()}`,
    name: meta.name,
    icon: meta.icon ?? "dumbbell",
    collections: [
      { id: items, name: itemLabel, fields: [{ id: "title", name: "Title", type: "text", required: true }] },
      {
        id: logs, name: `${itemLabel} logs`,
        fields: [
          { id: "item_id", name: itemLabel, type: "relation", required: true },
          { id: "date", name: "Date", type: "date", required: true },
          { id: "value", name: valueLabel, type: "decimal", required: true },
        ],
      },
    ],
    pages: [
      {
        id: "main",
        title: meta.name,
        components: [
          { id: "heatmap", type: "heatmap", config: { collection: logs, dateField: "date", weeks: 12 } },
          { id: "calendar", type: "calendar", config: { collection: logs, dateField: "date", showRecords: false } },
          {
            id: "logger", type: "numeric_logger",
            config: {
              collection: logs, dateField: "date", valueField: "value", valueLabel, unit,
              itemsCollection: items, itemTitleField: "title", itemField: "item_id", showBest: true,
            },
          },
        ],
      },
    ],
  };
}

export function buildKanbanManifest(meta: BuilderMeta, itemLabel: string = "Task"): MiniAppManifest {
  const collection = slug(itemLabel) + "s";
  return {
    schemaVersion: 1,
    appId: `app_${newId()}`,
    name: meta.name,
    icon: meta.icon ?? "kanban",
    collections: [
      {
        id: collection,
        name: itemLabel,
        fields: [
          { id: "title", name: "Title", type: "text", required: true },
          { id: "status", name: "Status", type: "enum", options: ["todo", "in_progress", "done"], required: true },
        ],
      },
    ],
    pages: [
      {
        id: "main",
        title: meta.name,
        components: [
          {
            id: "kanban_board",
            type: "kanban",
            config: {
              collection,
              titleField: "title",
              statusField: "status",
              columns: [
                { id: "todo", label: "To Do", color: "#3b82f6" },
                { id: "in_progress", label: "In Progress", color: "#f59e0b" },
                { id: "done", label: "Done", color: "#10b981" },
              ],
            },
          },
        ],
      },
    ],
  };
}

export function buildTimerManifest(meta: BuilderMeta, label: string = "Focus Session", defaultMinutes: number = 25): MiniAppManifest {
  const logs = "focus_sessions";
  return {
    schemaVersion: 1,
    appId: `app_${newId()}`,
    name: meta.name,
    icon: meta.icon ?? "clock",
    collections: [
      {
        id: logs,
        name: "Focus Logs",
        fields: [
          { id: "title", name: "Session", type: "text" },
          { id: "date", name: "Date", type: "date", required: true },
          { id: "minutes", name: "Minutes", type: "integer", required: true },
        ],
      },
    ],
    pages: [
      {
        id: "main",
        title: meta.name,
        components: [
          {
            id: "focus_timer",
            type: "timer",
            config: {
              collection: logs,
              durationMinutes: defaultMinutes,
              label,
              dateField: "date",
              durationField: "minutes",
            },
          },
          {
            id: "timer_streak",
            type: "streak",
            config: {
              collection: logs,
              successField: "date",
              successValue: "",
              dateField: "date",
              frequency: "daily",
            },
          },
        ],
      },
    ],
  };
}

// Builds a custom manifest from a user-assembled stack of freeform blocks
export function buildFreeformManifest(meta: BuilderMeta, blocks: FreeformBlock[]): MiniAppManifest {
  const collectionsMap = new Map<string, CollectionDef>();
  const components: ComponentDef[] = [];

  for (const block of blocks) {
    const compId = `comp_${newId()}`;
    const cfg = { ...block.config };

    if (block.type === "list") {
      const coll = (cfg.collection as string) || "tasks";
      collectionsMap.set(coll, {
        id: coll,
        name: "Tasks",
        fields: [
          { id: "title", name: "Title", type: "text", required: true },
          { id: "status", name: "Status", type: "enum", options: ["not_started", "completed"] },
          { id: "due_date", name: "Due date", type: "date" },
        ],
      });
      components.push({
        id: compId,
        type: "list",
        config: {
          collection: coll,
          titleField: "title",
          statusField: "status",
          doneValue: "completed",
          notStartedValue: "not_started",
          dateField: "due_date",
          ...cfg,
        },
      });
    } else if (block.type === "checklist") {
      const items = (cfg.itemsCollection as string) || "habits";
      const logs = (cfg.logsCollection as string) || "habit_logs";
      collectionsMap.set(items, {
        id: items,
        name: "Habits",
        fields: [{ id: "title", name: "Title", type: "text", required: true }],
      });
      collectionsMap.set(logs, {
        id: logs,
        name: "Habit Logs",
        fields: [
          { id: "item_id", name: "Habit", type: "relation", required: true },
          { id: "date", name: "Date", type: "date", required: true },
          { id: "status", name: "Status", type: "enum", options: ["not_started", "completed"] },
        ],
      });
      components.push({
        id: compId,
        type: "checklist",
        config: {
          itemsCollection: items,
          itemTitleField: "title",
          logsCollection: logs,
          logItemField: "item_id",
          logDateField: "date",
          logStatusField: "status",
          doneValue: "completed",
          notStartedValue: "not_started",
          ...cfg,
        },
      });
    } else if (block.type === "streak") {
      const coll = (cfg.collection as string) || "tasks";
      components.push({
        id: compId,
        type: "streak",
        config: {
          collection: coll,
          successField: "status",
          successValue: "completed",
          dateField: "due_date",
          frequency: "daily",
          ...cfg,
        },
      });
    } else if (block.type === "calendar") {
      const coll = (cfg.collection as string) || "tasks";
      components.push({
        id: compId,
        type: "calendar",
        config: {
          collection: coll,
          dateField: "due_date",
          showRecords: true,
          ...cfg,
        },
      });
    } else if (block.type === "heatmap") {
      const coll = (cfg.collection as string) || "tasks";
      components.push({
        id: compId,
        type: "heatmap",
        config: {
          collection: coll,
          dateField: "due_date",
          successField: "status",
          successValue: "completed",
          weeks: 12,
          ...cfg,
        },
      });
    } else if (block.type === "numeric_logger") {
      const items = (cfg.itemsCollection as string) || "metrics_items";
      const logs = (cfg.collection as string) || "metrics_logs";
      collectionsMap.set(items, {
        id: items,
        name: "Items",
        fields: [{ id: "title", name: "Title", type: "text", required: true }],
      });
      collectionsMap.set(logs, {
        id: logs,
        name: "Logs",
        fields: [
          { id: "item_id", name: "Item", type: "relation", required: true },
          { id: "date", name: "Date", type: "date", required: true },
          { id: "value", name: "Value", type: "decimal", required: true },
        ],
      });
      components.push({
        id: compId,
        type: "numeric_logger",
        config: {
          collection: logs,
          dateField: "date",
          valueField: "value",
          valueLabel: (cfg.valueLabel as string) || "Value",
          unit: (cfg.unit as string) || undefined,
          itemsCollection: items,
          itemTitleField: "title",
          itemField: "item_id",
          showBest: true,
          ...cfg,
        },
      });
    } else if (block.type === "kanban") {
      const coll = (cfg.collection as string) || "kanban_cards";
      collectionsMap.set(coll, {
        id: coll,
        name: "Cards",
        fields: [
          { id: "title", name: "Title", type: "text", required: true },
          { id: "status", name: "Status", type: "enum", options: ["todo", "in_progress", "done"], required: true },
        ],
      });
      components.push({
        id: compId,
        type: "kanban",
        config: {
          collection: coll,
          titleField: "title",
          statusField: "status",
          columns: [
            { id: "todo", label: "To Do", color: "#3b82f6" },
            { id: "in_progress", label: "In Progress", color: "#f59e0b" },
            { id: "done", label: "Done", color: "#10b981" },
          ],
          ...cfg,
        },
      });
    } else if (block.type === "timer") {
      const coll = (cfg.collection as string) || "timer_sessions";
      collectionsMap.set(coll, {
        id: coll,
        name: "Timer Sessions",
        fields: [
          { id: "title", name: "Session", type: "text" },
          { id: "date", name: "Date", type: "date", required: true },
          { id: "minutes", name: "Minutes", type: "integer", required: true },
        ],
      });
      components.push({
        id: compId,
        type: "timer",
        config: {
          collection: coll,
          durationMinutes: 25,
          label: (cfg.label as string) || "Focus Session",
          dateField: "date",
          durationField: "minutes",
          ...cfg,
        },
      });
    }
  }

  // Ensure at least one collection exists if none was created
  if (collectionsMap.size === 0) {
    collectionsMap.set("items", {
      id: "items",
      name: "Items",
      fields: [{ id: "title", name: "Title", type: "text", required: true }],
    });
  }

  return {
    schemaVersion: 1,
    appId: `app_${newId()}`,
    name: meta.name,
    icon: meta.icon ?? "layers",
    collections: Array.from(collectionsMap.values()),
    pages: [
      {
        id: "main",
        title: meta.name,
        components,
      },
    ],
  };
}
