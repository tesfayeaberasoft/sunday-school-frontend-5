import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CalendarMode } from "@/lib/format";

interface UiState {
  calendar: CalendarMode;
  sidebarCollapsed: boolean;
  simulateOffline: boolean;
  setCalendar: (c: CalendarMode) => void;
  toggleCalendar: () => void;
  toggleSidebar: () => void;
  setSimulateOffline: (v: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      calendar: "et",
      sidebarCollapsed: false,
      simulateOffline: false,
      setCalendar: (calendar) => set({ calendar }),
      toggleCalendar: () => set((s) => ({ calendar: s.calendar === "et" ? "gc" : "et" })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSimulateOffline: (simulateOffline) => set({ simulateOffline }),
    }),
    { name: "ssms-ui", storage: createJSONStorage(() => localStorage) },
  ),
);
