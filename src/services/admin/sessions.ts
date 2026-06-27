import { supabase } from "../supabase/client";
import { UpsertSessionInput } from "./types";

export async function setSessionOpen(
  sessionId: string,
  open: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("admin_set_session_open", {
    p_session_id: sessionId,
    p_open: open,
  });

  if (error) throw error;
}

export async function upsertSession(
  input: UpsertSessionInput,
): Promise<string> {
  const { data, error } = await supabase.rpc("admin_upsert_session", {
    p_id: input.id,
    p_title: input.title,
    p_day_of_week: input.day_of_week,
    p_time: input.time,
    p_room: input.room,
    p_duration_min: input.duration_min,
    p_max_participants: input.max_participants,
    p_is_open: input.is_open,
  });

  if (error) throw error;
  return data as string;
}
