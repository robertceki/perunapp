import { TrainingCard } from "@/components/TreiningCard";
import { useTrainings } from "@/hooks/useTrainings";
import { View } from "react-native";
export default function Wednesday() {
  const { getTrainingsByDay } = useTrainings();

  const wednesdayTrainings = getTrainingsByDay("wednesday");
  return (
    <View style={{ padding: 20 }}>
      {wednesdayTrainings.map((training) => (
        <TrainingCard key={training.id} training={training} />
      ))}
    </View>
  );
}
