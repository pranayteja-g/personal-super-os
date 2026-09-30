import type { MiniAppManifest } from "@/types/manifest";
import { newId } from "@/lib/ids";

// These three functions turn a few user-entered labels into a manifest built
// entirely from the existing primitives (list/calendar/streak/checklist/
// heatmap/numeric_logger). No new engine concepts — this is what the
// structured Builder UI (spec §12) produces instead of a free-form canvas.

export interface BuilderMeta {
  name: string;
  icon?: string;
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
    icon: meta.icon,
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
    icon: meta.icon,
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
    icon: meta.icon,
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
