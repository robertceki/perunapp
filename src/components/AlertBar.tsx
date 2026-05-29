import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { Text, View } from "react-native";

export default function AlertBar() {
  const { session, profile } = useAuth();
  const { trainings } = useTrainings();

  if (!session || !profile) return null;

  const myBookings = trainings.filter((t) =>
    t.session_participants?.some((p) => p.user_id === session.user.id),
  );

  const bookedCount = myBookings.length;

  const max = profile?.max_sessions_per_week ?? 0;

  const reachedLimit = max > 0 && bookedCount >= max;

  return (
    <View
      style={{
        padding: 10,
        backgroundColor: reachedLimit ? "#ffe5e5" : "#f3f3f3",
      }}
    >
      <Text>
        {bookedCount} / {max} treninga ove nedelje
      </Text>

      {reachedLimit && <Text style={{ color: "red" }}>Dostigli ste limit</Text>}
    </View>
  );
}
