import { View } from "react-native";

import { TrainingCard } from "@/components/TreiningCard";
import { useTrainings } from "@/hooks/useTrainings";

export default function Saturday() {
  const { getTrainingsByDay } = useTrainings();

  const saturdayTrainings = getTrainingsByDay("saturday");
  return (
    <View style={{ padding: 20 }}>
      {saturdayTrainings.map((training) => (
        <TrainingCard key={training.id} training={training} />
      ))}
    </View>
  );
}
