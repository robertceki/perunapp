import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { Text, View } from "react-native";

export default function AlertBar() {
  const { session, profile } = useAuth();
  const { bookedCount, reachedLimit } = useTrainings();

  if (!session || !profile) return null;

  const max = profile.max_sessions_per_week ?? 0;
  // Only warn about a reached limit when the user actually has an allowance.
  const atLimit = reachedLimit && max > 0;

  return (
    <View
      style={{
        padding: 10,
        backgroundColor: atLimit ? "#ffe5e5" : "#f3f3f3",
      }}
    >
      <Text>
        {bookedCount} / {max} treninga ove nedelje
      </Text>

      {atLimit && <Text style={{ color: "red" }}>Dostigli ste limit</Text>}
    </View>
  );
}
