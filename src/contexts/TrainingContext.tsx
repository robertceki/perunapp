import { createContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase/client";

import { Training } from "@/types/Training";

type TrainingContextType = {
  trainings: Training[];
  loading: boolean;
  fetchTrainings: () => Promise<void>;
  getTrainingsByDay: (day: string) => Training[];
  joinSession: (sessionId: string) => Promise<void>;
  canJoinSession: () => boolean;
  leaveSession: (sessionId: string) => Promise<void>;
  reachedLimit: boolean;
  bookedCount: number;
};

export const TrainingContext = createContext<TrainingContextType>({
  trainings: [],
  loading: true,
  fetchTrainings: async () => {},
  getTrainingsByDay: () => [],
  joinSession: async () => {},
  canJoinSession: () => false,
  leaveSession: async () => {},
  reachedLimit: false,
  bookedCount: 0,
});

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const { session, profile } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrainings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .select(
        `*,session_participants (user_id,
      profiles (
        first_name,
        last_name
      ))`,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching trainings:", error);
    } else {
      console.log("Fetched trainings:", data);
      setTrainings(data as Training[]);
    }
    setLoading(false);
  };

  const getTrainingsByDay = (day: string) => {
    console.log("Filtering trainings for day:", day);
    const t = trainings.filter((training) => training.day_of_week === day);
    console.log("Trainings for day:", t);
    return trainings.filter((training) => training.day_of_week === day);
  };

  const joinSession = async (sessionId: string) => {
    const userId = session?.user.id;

    if (!userId) return;

    const allowed = await canJoinSession(sessionId);

    if (!allowed) {
      console.log("Limit reached");
      return;
    }

    const { data: existing } = await supabase
      .from("session_participants")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      console.log("Already joined");
      return;
    }

    const { error } = await supabase.from("session_participants").insert({
      session_id: sessionId,
      user_id: userId,
    });

    if (error) {
      console.log("Join error:", error);
      return;
    }

    await fetchTrainings();
  };

  const leaveSession = async (sessionId: string) => {
    const userId = session?.user.id;

    if (!userId) return;

    const { error } = await supabase
      .from("session_participants")
      .delete()
      .match({
        session_id: sessionId,
        user_id: userId,
      });

    if (error) {
      console.log("Leave error:", error);

      return;
    }

    await fetchTrainings();
  };

  const canJoinSession = (trainingId: string) => {
    if (!session?.user.id || !profile) return false;

    const userId = session.user.id;

    const count = trainings
      .flatMap((t) => t.session_participants)
      .filter((p) => p.user_id === userId).length;

    return count < (profile?.max_sessions_per_week ?? 0);
  };

  const myBookings = trainings.flatMap((training) =>
    training.session_participants.filter(
      (participant) => participant.user_id === session?.user.id,
    ),
  );
  const bookedCount = myBookings.length;

  const reachedLimit = bookedCount >= (profile?.max_sessions_per_week ?? 0);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const value = useMemo(
    () => ({
      trainings,
      loading,
      fetchTrainings,
      getTrainingsByDay,
      joinSession,
      leaveSession,
      canJoinSession,
      reachedLimit,
      bookedCount,
    }),
    [trainings, loading],
  );

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
}
