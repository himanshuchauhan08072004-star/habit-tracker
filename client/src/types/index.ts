export interface User {
  id: string;
  email: string;
  timezone: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
}

export interface CheckIn {
  localDate: string;
  checkedInAt: string;
}

export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string };
}
