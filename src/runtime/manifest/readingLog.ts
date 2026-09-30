import type { MiniAppManifest } from "@/types/manifest";

export const readingLogManifest: MiniAppManifest = {
  schemaVersion: 1,
  appId: "app_reading_log",
  name: "Reading Log",
  icon: "book",
  theme: { accent: "purple" },
  collections: [
    {
      id: "reading_sessions",
      name: "Reading",
      fields: [
        { id: "title", name: "Book", type: "text", required: true },
        { id: "status", name: "Status", type: "enum", options: ["not_started", "completed"] },
        { id: "read_date", name: "Date", type: "date" },
      ],
    },
  ],
  pages: [
    {
      id: "main",
      title: "Reading",
      components: [
        { id: "cal", type: "calendar", config: { collection: "reading_sessions", dateField: "read_date" } },
        {
          id: "list",
          type: "list",
          config: {
            collection: "reading_sessions",
            titleField: "title",
            statusField: "status",
            doneValue: "completed",
            notStartedValue: "not_started",
            dateField: "read_date",
          },
        },
        {
          id: "streak",
          type: "streak",
          config: { collection: "reading_sessions", successField: "status", successValue: "completed", dateField: "read_date", frequency: "daily" },
        },
      ],
    },
  ],
};
