export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
}

export type ActivityStatus = 'Belum Dimulai' | 'Sedang Berjalan' | 'Selesai' | 'Dilewati';
export type ActivityPriority = 'Tinggi' | 'Sedang' | 'Rendah';

export interface Activity {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  title: string;
  category: string;
  priority: ActivityPriority;
  status: ActivityStatus;
  notes: string;
  recurrence_group?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: string;
  frequency: string;
  weekly_target: number;
  start_date: string;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
}

export type HabitLogStatus = 'Selesai' | 'Dilewati' | 'Belum';

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  status: HabitLogStatus;
  notes: string;
}

export type GoalPeriod = 'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan' | 'Jangka Panjang';
export type GoalStatus = 'Belum Dimulai' | 'Berjalan' | 'Selesai' | 'Ditunda' | 'Dibatalkan';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  period: GoalPeriod;
  start_date: string;
  deadline: string;
  target_metric: string;
  target_value: number;
  current_value: number;
  progress: number;
  status: GoalStatus;
  evaluation_notes: string;
  created_at: string;
  updated_at: string;
}

export interface Journal {
  id: string;
  user_id: string;
  date: string;
  mood: number; // 1 to 5
  achievements: string;
  gratitude: string;
  obstacles: string;
  lessons: string;
  tomorrow_focus: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  activity_categories: string[];
  goal_categories: string[];
  first_day_of_week: string;
  timezone: string;
  theme: string;
}

export interface DailyAnalytics {
  date: string;
  kpi: {
    totalScheduled: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    skipped: number;
    percentage: number | null;
    percentageDisplay: string;
  };
  activities: Activity[];
  journal: Journal | null;
  habits: (Habit & { todayStatus: HabitLogStatus; todayNotes: string })[];
  urgentGoals: Goal[];
}
