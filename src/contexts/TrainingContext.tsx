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
  leaveSession: (sessionId: string) => Promise<void>;
  canJoinSession: () => boolean;
  reachedLimit: boolean;
  bookedCount: number;
};

export const TrainingContext = createContext<TrainingContextType>({
  trainings: [],
  loading: true,
  fetchTrainings: async () => {},
  getTrainingsByDay: () => [],
  joinSession: async () => {},
  leaveSession: async () => {},
  canJoinSession: () => false,
  reachedLimit: false,
  bookedCount: 0,
});

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const { session, profile } = useAuth();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // FETCH
  // -------------------------
  const fetchTrainings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("sessions")
      .select(
        `*,session_participants (
          user_id,
          profiles (
            first_name,
            last_name
          )
        )`,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // IMPORTANT: new reference
    setTrainings([...(data as Training[])]);

    setLoading(false);
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  // -------------------------
  // FILTER
  // -------------------------
  const getTrainingsByDay = (day: string) =>
    trainings.filter((t) => t.day_of_week === day);

  // -------------------------
  // BOOKED COUNT
  // -------------------------
  const bookedCount = trainings
    .flatMap((t) => t.session_participants)
    .filter((p) => p.user_id === session?.user.id).length;

  const reachedLimit = bookedCount >= (profile?.max_sessions_per_week ?? 0);

  // -------------------------
  // GUARD
  // -------------------------
  const canJoinSession = () => {
    if (!session?.user.id || !profile) return false;

    return bookedCount < (profile.max_sessions_per_week ?? 0);
  };

  // -------------------------
  // JOIN (SAFE - NO FAKE DATA)
  // -------------------------
  const joinSession = async (sessionId: string) => {
    const userId = session?.user.id;
    if (!userId) return;

    if (!canJoinSession()) return;

    const target = trainings.find((t) => t.id === sessionId);

    const alreadyJoined = target?.session_participants.some(
      (p) => p.user_id === userId,
    );

    if (alreadyJoined) return;

    const { error } = await supabase.from("session_participants").insert({
      session_id: sessionId,
      user_id: userId,
    });

    if (error) {
      console.log(error);
      return;
    }

    // ALWAYS REFRESH (CONSISTENT STATE)
    await fetchTrainings();
  };

  // -------------------------
  // LEAVE
  // -------------------------
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
      console.log(error);
      return;
    }

    await fetchTrainings();
  };

  // -------------------------
  // MEMO
  // -------------------------
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
    [trainings, loading, bookedCount, reachedLimit],
  );

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
}
