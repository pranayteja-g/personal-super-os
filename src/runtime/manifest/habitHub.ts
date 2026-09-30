import type { MiniAppManifest } from "@/types/manifest";

export const habitHubManifest: MiniAppManifest = {
  schemaVersion: 1,
  appId: "app_habit_hub",
  name: "Habit Hub",
  icon: "repeat",
  theme: { accent: "green" },
  collections: [
    {
      id: "habits",
      name: "Habits",
      fields: [{ id: "title", name: "Habit", type: "text", required: true }],
    },
    {
      id: "habit_logs",
      name: "Habit Logs",
      fields: [
        { id: "habit_id", name: "Habit", type: "relation", required: true },
        { id: "date", name: "Date", type: "date", required: true },
        { id: "status", name: "Status", type: "enum", options: ["not_started", "completed"] },
      ],
    },
  ],
  pages: [
    {
      id: "main",
      title: "Habits",
      components: [
        {
          id: "heatmap",
          type: "heatmap",
          config: {
            collection: "habit_logs",
            dateField: "date",
            successField: "status",
            successValue: "completed",
            weeks: 12,
          },
        },
        {
          id: "calendar",
          type: "calendar",
          config: { collection: "habit_logs", dateField: "date", showRecords: false },
        },
        {
          id: "habits",
          type: "checklist",
          config: {
            itemsCollection: "habits",
            itemTitleField: "title",
            logsCollection: "habit_logs",
            logItemField: "habit_id",
            logDateField: "date",
            logStatusField: "status",
            doneValue: "completed",
            notStartedValue: "not_started",
          },
        },
      ],
    },
  ],
};
