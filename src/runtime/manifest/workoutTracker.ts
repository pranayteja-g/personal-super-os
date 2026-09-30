import type { MiniAppManifest } from "@/types/manifest";

export const workoutTrackerManifest: MiniAppManifest = {
  schemaVersion: 1,
  appId: "app_workout_tracker",
  name: "Workout Tracker",
  icon: "dumbbell",
  theme: { accent: "orange" },
  collections: [
    {
      id: "exercises",
      name: "Exercises",
      fields: [{ id: "title", name: "Exercise", type: "text", required: true }],
    },
    {
      id: "sets",
      name: "Sets",
      fields: [
        { id: "exercise_id", name: "Exercise", type: "relation", required: true },
        { id: "date", name: "Date", type: "date", required: true },
        { id: "weight", name: "Weight", type: "decimal", required: true },
        { id: "reps", name: "Reps", type: "integer" },
        { id: "unit", name: "Unit", type: "text" },
      ],
    },
  ],
  pages: [
    {
      id: "main",
      title: "Workout",
      components: [
        {
          id: "heatmap",
          type: "heatmap",
          config: { collection: "sets", dateField: "date", weeks: 12 },
        },
        {
          id: "calendar",
          type: "calendar",
          config: { collection: "sets", dateField: "date", showRecords: false },
        },
        {
          id: "logger",
          type: "numeric_logger",
          config: {
            collection: "sets",
            dateField: "date",
            valueField: "weight",
            valueLabel: "Weight",
            unit: "kg",
            unitField: "unit",
            extraFields: [{ field: "reps", label: "Reps" }],
            itemsCollection: "exercises",
            itemTitleField: "title",
            itemField: "exercise_id",
            showBest: true,
          },
        },
      ],
    },
  ],
};
