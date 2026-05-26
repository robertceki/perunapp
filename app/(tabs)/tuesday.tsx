import { View } from "react-native";

import { TrainingCard } from "@/components/TreiningCard";
import { useTrainings } from "@/hooks/useTrainings";

export default function Tuesday() {
  const { getTrainingsByDay } = useTrainings();

  const tuesdayTrainings = getTrainingsByDay("tuesday");

  return (
    <View style={{ padding: 20 }}>
      {tuesdayTrainings.map((training) => (
        <TrainingCard key={training.id} training={training} />
      ))}
    </View>
  );
}
