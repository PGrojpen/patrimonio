import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SavedScenario } from "@/types/api";

interface ScenarioStore {
  scenarios: SavedScenario[];
  addScenario: (scenario: Omit<SavedScenario, "id" | "createdAt">) => void;
  removeScenario: (id: string) => void;
  clearScenarios: () => void;
}

export const useScenarioStore = create<ScenarioStore>()(
  persist(
    (set) => ({
      scenarios: [],
      addScenario: (scenario) =>
        set((state) => {
          if (state.scenarios.length >= 4) {
            // Keep last 3 and add new one
            return {
              scenarios: [
                ...state.scenarios.slice(-3),
                {
                  ...scenario,
                  id: crypto.randomUUID(),
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          }
          return {
            scenarios: [
              ...state.scenarios,
              {
                ...scenario,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }),
      removeScenario: (id) =>
        set((state) => ({
          scenarios: state.scenarios.filter((s) => s.id !== id),
        })),
      clearScenarios: () => set({ scenarios: [] }),
    }),
    { name: "patrimonio-scenarios" }
  )
);
