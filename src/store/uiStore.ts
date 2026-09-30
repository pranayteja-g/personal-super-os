import { create } from "zustand";

interface UiState {
  selectedDate: Record<string, string>; // appId -> "yyyy-MM-dd"
  setSelectedDate: (appId: string, date: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedDate: {},
  setSelectedDate: (appId, date) =>
    set((s) => ({ selectedDate: { ...s.selectedDate, [appId]: date } })),
}));
