import { supabase } from "../supabase/client";
import { AdminUser, UpdateUserPatch } from "./types";

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc("admin_list_users");

  if (error) throw error;
  return (data ?? []) as AdminUser[];
}

export async function updateUser(
  target: string,
  patch: UpdateUserPatch,
): Promise<void> {
  const { error } = await supabase.rpc("admin_update_user", {
    p_target: target,
    p_first_name: patch.first_name ?? null,
    p_last_name: patch.last_name ?? null,
    p_role: patch.role ?? null,
    p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
  });

  if (error) throw error;
}

export async function deleteUser(target: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_user", {
    p_target: target,
  });

  if (error) throw error;
}
