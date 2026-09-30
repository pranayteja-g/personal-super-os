import { create } from "zustand";

export interface ActiveTaskContext {
  itemId: string;
  title: string;
  collectionId: string;
  statusField?: string;
  doneValue?: string;
  notStartedValue?: string;
  source?: "kanban" | "list" | "checklist" | "custom";
}

interface UiState {
  selectedDate: Record<string, string>; // appId -> "yyyy-MM-dd"
  setSelectedDate: (appId: string, date: string) => void;
  activeTask: Record<string, ActiveTaskContext | null>;
  setActiveTask: (appId: string, task: ActiveTaskContext | null, autoStartTimer?: boolean) => void;
  timerAutoStartTrigger: Record<string, number>; // trigger timestamp
}

export const useUiStore = create<UiState>((set) => ({
  selectedDate: {},
  setSelectedDate: (appId, date) =>
    set((s) => ({ selectedDate: { ...s.selectedDate, [appId]: date } })),
  activeTask: {},
  timerAutoStartTrigger: {},
  setActiveTask: (appId, task, autoStartTimer = false) =>
    set((s) => ({
      activeTask: { ...s.activeTask, [appId]: task },
      timerAutoStartTrigger: autoStartTimer
        ? { ...s.timerAutoStartTrigger, [appId]: Date.now() }
        : s.timerAutoStartTrigger,
    })),
}));
