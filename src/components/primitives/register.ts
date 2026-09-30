import { componentRegistry } from "@/runtime/registry/componentRegistry";
import { ListComponent } from "./List";
import { CalendarComponent } from "./Calendar";
import { StreakComponent } from "./Streak";
import { ChecklistComponent } from "./Checklist";
import { HeatmapComponent } from "./Heatmap";
import { NumericLoggerComponent } from "./NumericLogger";

let registered = false;

// Call once at app boot (see app/_layout.tsx). Idempotent.
export function registerPrimitives(): void {
  if (registered) return;
  componentRegistry.register(ListComponent as any);
  componentRegistry.register(CalendarComponent as any);
  componentRegistry.register(StreakComponent as any);
  componentRegistry.register(ChecklistComponent as any);
  componentRegistry.register(HeatmapComponent as any);
  componentRegistry.register(NumericLoggerComponent as any);
  registered = true;
}
