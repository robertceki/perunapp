import { View } from "react-native";

import { TrainingCard } from "@/components/TreiningCard";
import { useTrainings } from "@/hooks/useTrainings";

export default function Monday() {
  const { getTrainingsByDay } = useTrainings();

  const mondayTrainings = getTrainingsByDay("monday");

  return (
    <View style={{ padding: 20 }}>
      {mondayTrainings.map((training) => (
        <TrainingCard key={training.id} training={training} />
      ))}
    </View>
  );
}
