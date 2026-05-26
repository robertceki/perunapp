import { supabase } from "@/services/supabase/client";

export const canJoinSession = async (
  userId: string,
  maxSessions: number,
): Promise<boolean> => {
  const { count, error } = await supabase
    .from("session_participants")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId);

  if (error) {
    console.log("Limit check error:", error);
    return false;
  }

  const current = count || 0;

  return current < maxSessions;
};
