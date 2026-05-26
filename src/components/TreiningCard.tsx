import { Pressable, Text, View } from "react-native";

import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { Training } from "@/types/Training";

type Props = {
  training: Training;
};

export function TrainingCard({ training }: Props) {
  const { session } = useAuth();
  const { joinSession, leaveSession, canJoinSession } = useTrainings();
  const canJoin = canJoinSession(training.id);
  const isBooked = training.session_participants.some(
    (p) => p.user_id === session?.user.id,
  );
  return (
    <View
      style={{
        marginBottom: 20,
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
      }}
    >
      <Text>{training.time}</Text>

      <Text>{training.title}</Text>

      <Text>Max participants: {training.max_participants}</Text>
      <Text>Booked: {training.session_participants.length}</Text>

      {isBooked ? (
        <Pressable onPress={() => leaveSession(training.id)}>
          <Text style={{ color: "red" }}>Odjavi se</Text>
        </Pressable>
      ) : (
        <Pressable disabled={!canJoin} onPress={() => joinSession(training.id)}>
          <Text
            style={{
              color: canJoin ? "green" : "gray",
            }}
          >
            {canJoin ? "Prijavi se" : "Limit dostignut"}
          </Text>
        </Pressable>
      )}

      <Text
        style={{
          marginTop: 10,
          fontWeight: "bold",
        }}
      >
        Participants:
      </Text>

      {training.session_participants.map((participant) => (
        <Text key={participant.user_id}>
          {participant.profiles.first_name} {participant.profiles.last_name}
        </Text>
      ))}
    </View>
  );
}
