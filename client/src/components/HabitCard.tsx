import { Link } from "react-router-dom";
import { Flame, Trophy, Check, ArrowRight } from "lucide-react";
import { Habit } from "../types";
import { DayTrail } from "./DayTrail";

interface Props {
  habit: Habit;
  todayLocalDate: string;
  recentCompletedDates: string[];
  onCheckIn: (id: string) => void;
  checkingIn: boolean;
}

export function HabitCard({
  habit,
  todayLocalDate,
  recentCompletedDates,
  onCheckIn,
  checkingIn,
}: Props) {
  return (
    <div
      className={[
        "flex flex-col rounded-lg border bg-surface p-5 shadow-card transition-colors",
        habit.completedToday ? "border-good-600/25" : "border-line",
      ].join(" ")}
    >
      <div className="min-w-0">
        <h3 className="truncate font-medium text-ink">{habit.name}</h3>
        {habit.description && (
          <p className="mt-0.5 truncate text-sm text-ink-muted">{habit.description}</p>
        )}
      </div>

      <div className="mt-3.5 flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-amber-600">
          <Flame size={15} aria-hidden="true" />
          {habit.currentStreak} day{habit.currentStreak === 1 ? "" : "s"} streak
        </span>
        <span className="flex items-center gap-1.5 font-medium text-ink-muted">
          <Trophy size={15} aria-hidden="true" />
          {habit.longestStreak} best
        </span>
      </div>

      {todayLocalDate && (
        <div className="mt-3.5">
          <DayTrail completedDates={recentCompletedDates} todayLocalDate={todayLocalDate} showLabels />
        </div>
      )}

      <div className="mt-4">
        {habit.completedToday ? (
          <button
            disabled
            className="flex w-full cursor-default items-center justify-center gap-1.5 rounded-md border border-good-600/25 bg-good-50 py-2 text-sm font-medium text-good-600"
          >
            <Check size={15} aria-hidden="true" /> Completed today
          </button>
        ) : (
          <button
            onClick={() => onCheckIn(habit.id)}
            disabled={checkingIn}
            className="w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white transition-all hover:-translate-y-px hover:bg-brand-700 hover:shadow-card disabled:pointer-events-none disabled:opacity-60"
          >
            {checkingIn ? "Checking in…" : "Check in for today"}
          </button>
        )}
      </div>

      <Link
        to={`/habits/${habit.id}`}
        className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-ink-faint transition-colors hover:text-brand-700"
      >
        View history <ArrowRight size={12} aria-hidden="true" />
      </Link>
    </div>
  );
}
