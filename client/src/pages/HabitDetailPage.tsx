import { useEffect, useState, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Flame, Trophy, Check } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Habit, CheckIn } from "../types";
import { fetchHabit, fetchCheckIns, checkIn as checkInApi } from "../services/habits";
import { extractApiErrorMessage } from "../services/api";
import { ErrorBanner } from "../components/ErrorBanner";
import { formatTodayInTimezone, formatDateReadable } from "../utils/date";

export function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [backfillDate, setBackfillDate] = useState("");

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
    setSubmitting(true);
    try {
      const today = formatTodayInTimezone(user.timezone);
      await checkInApi(id, today);
      await load();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBackfill(e: FormEvent) {
    e.preventDefault();
    if (!id || !backfillDate) return;
    setError(null);
    setSubmitting(true);
    try {
      await checkInApi(id, backfillDate);
      setBackfillDate("");
      await load();
    } catch (err) {
      // Backend errors here map directly to the assignment's required
      // messages: FUTURE_DATE, DATE_BEFORE_HABIT, DUPLICATE_CHECK_IN.
      setError(extractApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>;
  }

  if (!habit) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        <ErrorBanner message={error ?? "Habit not found."} />
      </div>
    );
  }

  const today = user ? formatTodayInTimezone(user.timezone) : "";
  const maxBackfillDate = today;
  const minBackfillDate = habit.createdAt.slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-2">
          <ErrorBanner message={error} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h1 className="text-xl font-semibold text-slate-900">{habit.name}</h1>
          {habit.description && <p className="text-slate-500 mt-1">{habit.description}</p>}

          <div className="flex items-center gap-6 mt-4">
            <span className="flex items-center gap-1.5 text-orange-600 font-medium">
              <Flame size={18} /> {habit.currentStreak} day streak
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 font-medium">
              <Trophy size={18} /> Best: {habit.longestStreak}
            </span>
          </div>

          <div className="mt-4">
            {habit.completedToday ? (
              <button
                disabled
                className="rounded-lg bg-green-50 text-green-700 border border-green-200 py-2 px-4 text-sm font-medium flex items-center gap-1.5 cursor-default"
              >
                <Check size={16} /> Completed today
              </button>
            ) : (
              <button
                onClick={handleCheckInToday}
                disabled={submitting}
                className="rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white py-2 px-4 text-sm font-medium"
              >
                {submitting ? "Checking in…" : "Check in for today"}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-1">Backfill a missed day</h2>
          <p className="text-sm text-slate-500 mb-4">
            Pick a past date between when this habit was created and today.
          </p>
          <form onSubmit={handleBackfill} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                min={minBackfillDate}
                max={maxBackfillDate}
                value={backfillDate}
                onChange={(e) => setBackfillDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !backfillDate}
              className="rounded-lg bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white text-sm font-medium px-4 py-2"
            >
              Backfill
            </button>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">History</h2>
          {checkIns.length === 0 ? (
            <p className="text-sm text-slate-500">No check-ins yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {checkIns.map((c) => (
                <li key={c.localDate} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-green-600" />
                    {formatDateReadable(c.localDate)}
                  </span>
                  <span className="text-slate-400">{c.localDate}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
