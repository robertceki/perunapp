export type Training = {
  id: string;
  day_of_week: string;
  title: string;
  time: string;
  max_participants: number;
  created_at: string;
  is_open: boolean;
  room: string | null;
  duration_min: number | null;
  session_participants: {
    user_id: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  }[];
};
