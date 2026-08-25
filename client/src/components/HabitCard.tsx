import { Link } from "react-router-dom";
import { Flame, Trophy, Check } from "lucide-react";
import { Habit } from "../types";

interface Props {
  habit: Habit;
  onCheckIn: (id: string) => void;
  checkingIn: boolean;
}

export function HabitCard({ habit, onCheckIn, checkingIn }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link to={`/habits/${habit.id}`} className="font-semibold text-slate-900 hover:text-brand-600">
            {habit.name}
          </Link>
          {habit.description && (
            <p className="text-sm text-slate-500 mt-0.5">{habit.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 text-sm">
        <span className="flex items-center gap-1 text-orange-600 font-medium">
          <Flame size={16} /> {habit.currentStreak} day{habit.currentStreak === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1 text-amber-600 font-medium">
          <Trophy size={16} /> Best: {habit.longestStreak}
        </span>
      </div>

      <div className="mt-4">
        {habit.completedToday ? (
          <button
            disabled
            className="w-full rounded-lg bg-green-50 text-green-700 border border-green-200 py-2 text-sm font-medium flex items-center justify-center gap-1.5 cursor-default"
          >
            <Check size={16} /> Completed today
          </button>
        ) : (
          <button
            onClick={() => onCheckIn(habit.id)}
            disabled={checkingIn}
            className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white py-2 text-sm font-medium transition-colors"
          >
            {checkingIn ? "Checking in…" : "Check in for today"}
          </button>
        )}
      </div>
    </div>
  );
}
