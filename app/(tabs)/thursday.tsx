import { View } from "react-native";

import { TrainingCard } from "@/components/TreiningCard";
import { useTrainings } from "@/hooks/useTrainings";

export default function Thursday() {
  const { getTrainingsByDay } = useTrainings();

  const thursdayTrainings = getTrainingsByDay("thursday");

  return (
    <View style={{ padding: 20 }}>
      {thursdayTrainings.map((training) => (
        <TrainingCard key={training.id} training={training} />
      ))}
    </View>
  );
}
