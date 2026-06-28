import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { TrainingContext } from "@/hooks/useTrainings";
import { getBookingErrorMessage } from "@/lib/bookingErrors";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/Profile";
import type { Training } from "@/types/Training";

export type BookingError = Error & { rawMessage: string };

export type TrainingContextValue = {
  trainings: Training[];
  loading: boolean;
  fetchTrainings: () => Promise<void>;
  getTrainingsByDay: (day: string) => Training[];
  joinSession: (sessionId: string) => Promise<BookingError | null>;
  leaveSession: (sessionId: string) => Promise<BookingError | null>;
  canJoinSession: () => boolean;
  reachedLimit: boolean;
  bookedCount: number;
};

type TrainingProviderProps = {
  children: ReactNode;
  session: Session | null;
  profile: Profile | null;
};

function createBookingError(rawMessage: string, mapRpcCodes = true) {
  const error = new Error(
    getBookingErrorMessage(rawMessage, mapRpcCodes),
  ) as BookingError;
  error.rawMessage = rawMessage;
  return error;
}

export function TrainingProvider({
  children,
  session,
  profile,
}: TrainingProviderProps) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = session?.user.id;

  const fetchTrainings = useCallback(async () => {
    if (!userId) {
      setTrainings([]);
      setLoading(false);
      return;
    }

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
      .order("created_at", { ascending: false });

    if (!error) {
      setTrainings([...(data as Training[])]);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      void fetchTrainings();
    } else {
      setTrainings([]);
      setLoading(false);
    }
  }, [fetchTrainings, userId]);

  const getTrainingsByDay = useCallback(
    (day: string) =>
      trainings.filter((training) => training.day_of_week === day),
    [trainings],
  );

  const bookedCount = trainings
    .flatMap((training) => training.session_participants)
    .filter((participant) => participant.user_id === userId).length;
  const maxSessions = profile?.max_sessions_per_week ?? 0;
  const reachedLimit = bookedCount >= maxSessions;

  const canJoinSession = useCallback(
    () => Boolean(userId && profile && bookedCount < maxSessions),
    [bookedCount, maxSessions, profile, userId],
  );

  const joinSession = useCallback(
    async (sessionId: string) => {
      if (!userId || !canJoinSession()) return null;

      const { error } = await supabase.rpc("join_session", {
        p_session_id: sessionId,
      });

      if (error) return createBookingError(error.message);

      await fetchTrainings();
      return null;
    },
    [canJoinSession, fetchTrainings, userId],
  );

  const leaveSession = useCallback(
    async (sessionId: string) => {
      if (!userId) return null;

      const { error } = await supabase
        .from("session_participants")
        .delete()
        .match({ session_id: sessionId, user_id: userId });

      if (error) return createBookingError(error.message, false);

      await fetchTrainings();
      return null;
    },
    [fetchTrainings, userId],
  );

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
    [
      trainings,
      loading,
      fetchTrainings,
      getTrainingsByDay,
      joinSession,
      leaveSession,
      canJoinSession,
      reachedLimit,
      bookedCount,
    ],
  );

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
}
