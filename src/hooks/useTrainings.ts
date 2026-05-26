import { useContext } from "react";

import { TrainingContext } from "@/contexts/TrainingContext";

export function useTrainings() {
  return useContext(TrainingContext);
}
