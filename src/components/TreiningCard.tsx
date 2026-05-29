import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { Training } from "@/types/Training";
import { Pressable, Text, View } from "react-native";

export function TrainingCard({ training }: { training: Training }) {
  const { session } = useAuth();
  const { joinSession, leaveSession, reachedLimit } = useTrainings();

  const userId = session?.user.id;

  const participants = training.session_participants ?? [];

  const isBooked = participants.some((p) => p.user_id === userId);

  const bookedCount = participants.length;

  const isFull = bookedCount >= training.max_participants;

  const canJoin = !isFull && !reachedLimit && !isBooked;

  return (
    <View
      style={{
        marginBottom: 16,
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
        borderColor: "#eee",
      }}
    >
      {/* TITLE */}
      <Text style={{ fontWeight: "700", fontSize: 16 }}>{training.title}</Text>

      <Text style={{ marginTop: 4 }}>{training.time}</Text>

      {/* CAPACITY */}
      <Text style={{ marginTop: 8 }}>
        {bookedCount} / {training.max_participants}
      </Text>

      {/* ACTION */}
      {isBooked ? (
        <Pressable onPress={() => leaveSession(training.id)}>
          <Text
            style={{
              color: "red",
              marginTop: 10,
            }}
          >
            Odjavi se
          </Text>
        </Pressable>
      ) : (
        <Pressable disabled={!canJoin} onPress={() => joinSession(training.id)}>
          <Text
            style={{
              marginTop: 10,
              color: canJoin ? "green" : "gray",
              fontWeight: "600",
            }}
          >
            {reachedLimit
              ? "Nedeljni limit dostignut"
              : isFull
                ? "Popunjeno"
                : "Prijavi se"}
          </Text>
        </Pressable>
      )}

      {/* PARTICIPANTS */}
      <Text
        style={{
          marginTop: 12,
          fontWeight: "600",
        }}
      >
        Participants:
      </Text>

      {(participants ?? []).map((p) => (
        <Text key={p.user_id}>
          {p.profiles?.first_name ?? ""} {p.profiles?.last_name ?? ""}
        </Text>
      ))}
    </View>
  );
}
