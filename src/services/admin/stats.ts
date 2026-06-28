import { supabase } from "@/lib/supabase";
import type {
  MemberSeriesPoint,
  OccupancySummary,
  SlotPopularity,
} from "./types";

export async function memberSeries(
  months: number,
): Promise<MemberSeriesPoint[]> {
  const { data, error } = await supabase.rpc("admin_member_series", {
    p_months: months,
  });

  if (error) throw error;
  return (data ?? []) as MemberSeriesPoint[];
}

export async function occupancySummary(
  period: string,
): Promise<OccupancySummary | null> {
  const { data, error } = await supabase.rpc("admin_occupancy_summary", {
    p_period: period,
  });

  if (error) throw error;
  return (data?.[0] ?? null) as OccupancySummary | null;
}

export async function slotPopularity(
  period: string,
): Promise<SlotPopularity[]> {
  const { data, error } = await supabase.rpc("admin_slot_popularity", {
    p_period: period,
  });

  if (error) throw error;
  return (data ?? []) as SlotPopularity[];
}
