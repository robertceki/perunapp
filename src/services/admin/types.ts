export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  role: "user" | "admin";
  max_sessions_per_week: number;
  enabled: boolean | null;
}

export interface MemberSeriesPoint {
  month: string;
  total_members: number;
  new_members: number;
}

export interface OccupancySummary {
  avg_pct: number;
  top_day: string;
  new_this_month: number;
  prev_new: number;
}

export interface UpsertSessionInput {
  id: string | null;
  title: string;
  day_of_week: string;
  time: string;
  room: string | null;
  duration_min: number | null;
  max_participants: number;
  is_open: boolean;
}

export interface UpdateUserPatch {
  first_name?: string | null;
  last_name?: string | null;
  role?: "user" | "admin" | null;
  max_sessions_per_week?: number | null;
}
