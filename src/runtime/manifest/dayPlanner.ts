import type { MiniAppManifest } from "@/types/manifest";

export const dayPlannerManifest: MiniAppManifest = {
  schemaVersion: 1,
  appId: "app_day_planner",
  name: "Day Planner",
  icon: "calendar-check",
  theme: { accent: "blue" },
  collections: [
    {
      id: "tasks",
      name: "Tasks",
      fields: [
        { id: "title", name: "Title", type: "text", required: true },
        { id: "status", name: "Status", type: "enum", required: true, options: ["not_started", "in_progress", "completed"] },
        { id: "priority", name: "Priority", type: "enum", options: ["low", "medium", "high"] },
        { id: "due_date", name: "Due date", type: "date" },
      ],
    },
  ],
  pages: [
    {
      id: "main",
      title: "Today",
      components: [
        {
          id: "heatmap",
          type: "heatmap",
          config: {
            collection: "tasks",
            dateField: "due_date",
            successField: "status",
            successValue: "completed",
            weeks: 12,
          },
        },
        { id: "calendar", type: "calendar", config: { collection: "tasks", dateField: "due_date" } },
        {
          id: "task_list",
          type: "list",
          config: {
            collection: "tasks",
            titleField: "title",
            statusField: "status",
            doneValue: "completed",
            notStartedValue: "not_started",
            dateField: "due_date",
          },
        },
        {
          id: "streak",
          type: "streak",
          config: { collection: "tasks", successField: "status", successValue: "completed", dateField: "due_date", frequency: "daily" },
        },
      ],
    },
  ],
};
