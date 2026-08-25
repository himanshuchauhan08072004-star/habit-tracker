import { api } from "./api";
import { Habit, CheckIn } from "../types";

export async function fetchHabits(): Promise<Habit[]> {
  const res = await api.get("/habits");
  return res.data.data;
}

export async function fetchHabit(id: string): Promise<Habit> {
  const res = await api.get(`/habits/${id}`);
  return res.data.data;
}

export async function createHabit(name: string, description: string): Promise<Habit> {
  const res = await api.post("/habits", { name, description });
  return res.data.data;
}

export async function deleteHabit(id: string): Promise<void> {
  await api.delete(`/habits/${id}`);
}

export async function checkIn(
  habitId: string,
  localDate: string
): Promise<{ checkIn: CheckIn; currentStreak: number; longestStreak: number }> {
  const res = await api.post(`/habits/${habitId}/check-ins`, { localDate });
  return res.data.data;
}

export async function fetchCheckIns(habitId: string): Promise<CheckIn[]> {
  const res = await api.get(`/habits/${habitId}/check-ins`);
  return res.data.data.checkIns;
}
