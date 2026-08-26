import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Flame, Trophy, Check, Clock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { Habit, CheckIn } from "../types";
import { fetchHabit, fetchCheckIns, checkIn as checkInApi } from "../services/habits";
import { extractApiErrorMessage } from "../services/api";
import { AppShell } from "../components/AppShell";
import { ErrorBanner } from "../components/ErrorBanner";
import { DayTrail } from "../components/DayTrail";
import { HabitCalendar } from "../components/HabitCalendar";
import { BackfillForm } from "../components/BackfillForm";
import { HabitCardSkeleton } from "../components/Skeleton";
import { formatTodayInTimezone, formatDateReadable, formatTimeOfDay } from "../utils/date";

export function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast, ToastViewport } = useToast();

  const [habit, setHabit] = useState<Habit | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);

  const [backfillError, setBackfillError] = useState<string | null>(null);
  const [backfillSubmitting, setBackfillSubmitting] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const [h, c] = await Promise.all([fetchHabit(id), fetchCheckIns(id)]);
      setHabit(h);
      setCheckIns(c);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleCheckInToday() {
    if (!id || !user) return;
    setError(null);
    setCheckInSubmitting(true);
    try {
      const today = formatTodayInTimezone(user.timezone);
      const result = await checkInApi(id, today);
      await load();
      showToast("Habit completed", `+1 day added — streak is now ${result.currentStreak}.`);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setCheckInSubmitting(false);
    }
  }

  async function handleBackfill(date: string) {
    if (!id) return;
    setBackfillError(null);
    setBackfillSubmitting(true);
    try {
      await checkInApi(id, date);
      await load();
      showToast("Check-in added", `${formatDateReadable(date)} is now recorded.`);
    } catch (err) {
      // Maps directly to the backend's FUTURE_DATE / DATE_BEFORE_HABIT / DUPLICATE_CHECK_IN messages.
      setBackfillError(extractApiErrorMessage(err));
    } finally {
      setBackfillSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <HabitCardSkeleton />
      </AppShell>
    );
  }

  if (!habit) {
    return (
      <AppShell>
        <ErrorBanner message={error ?? "Habit not found."} />
      </AppShell>
    );
  }

  const today = user ? formatTodayInTimezone(user.timezone) : "";
  const localDates = checkIns.map((c) => c.localDate);
  const mostRecentCheckIn = checkIns[0];

  return (
    <AppShell>
      <ToastViewport />

      <Link
        to="/dashboard"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to dashboard
      </Link>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="mb-5 rounded-lg border border-line bg-surface p-6">
        <h1 className="text-lg font-semibold text-ink">{habit.name}</h1>
        {habit.description && <p className="mt-1 text-sm text-ink-muted">{habit.description}</p>}

        <div className="mt-4 flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
            <Flame size={16} /> {habit.currentStreak} day streak
          </span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-ink-muted">
            <Trophy size={16} /> {habit.longestStreak} best
          </span>
        </div>

        <div className="mt-4">
          <DayTrail completedDates={localDates} todayLocalDate={today} showLabels />
        </div>

        <div className="mt-5 flex items-center gap-3">
          {habit.completedToday ? (
            <button
              disabled
              className="flex cursor-default items-center gap-1.5 rounded-md border border-good-600/25 bg-good-50 px-4 py-2 text-sm font-medium text-good-600"
            >
              <Check size={15} /> Completed today
            </button>
          ) : (
            <button
              onClick={handleCheckInToday}
              disabled={checkInSubmitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkInSubmitting ? "Checking in…" : "Check in for today"}
            </button>
          )}
          {mostRecentCheckIn && (
            <span className="flex items-center gap-1 font-mono text-xs text-ink-faint">
              <Clock size={12} /> last: {formatTimeOfDay(mostRecentCheckIn.checkedInAt)}
            </span>
          )}
        </div>
      </div>

      <div className="mb-5">
        <BackfillForm
          minDate={habit.createdAt.slice(0, 10)}
          maxDate={today}
          submitting={backfillSubmitting}
          error={backfillError}
          onSubmit={handleBackfill}
        />
      </div>

      <div className="rounded-lg border border-line bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">History</h2>
          <span className="font-mono text-xs text-ink-faint">{checkIns.length} total check-ins</span>
        </div>

        {checkIns.length === 0 ? (
          <p className="text-sm text-ink-muted">No check-ins yet.</p>
        ) : (
          <>
            <HabitCalendar completedDates={localDates} todayLocalDate={today} />
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {checkIns.map((c) => (
                <li key={c.localDate} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="flex items-center gap-2 text-ink">
                    <Check size={14} className="text-good-600" aria-hidden="true" />
                    {formatDateReadable(c.localDate)}
                  </span>
                  <span className="font-mono text-xs text-ink-faint">{c.localDate}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AppShell>
  );
}
