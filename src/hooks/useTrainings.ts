import { createContext, useContext } from "react";

import type { TrainingContextValue } from "@/contexts/TrainingContext";

export const TrainingContext = createContext<TrainingContextValue | null>(null);

export function useTrainings() {
  const context = useContext(TrainingContext);

  if (!context) {
    throw new Error("useTrainings must be used within TrainingProvider");
  }

  return context;
}
