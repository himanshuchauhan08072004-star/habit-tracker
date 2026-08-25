import { useEffect, useState, FormEvent } from "react";
import { Plus, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Habit } from "../types";
import { fetchHabits, createHabit as createHabitApi, checkIn as checkInApi } from "../services/habits";
import { extractApiErrorMessage } from "../services/api";
import { HabitCard } from "../components/HabitCard";
import { ErrorBanner } from "../components/ErrorBanner";
import { formatTodayInTimezone } from "../utils/date";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setHabits(await fetchHabits());
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const habit = await createHabitApi(name, description);
      setHabits((prev) => [habit, ...prev]);
      setName("");
      setDescription("");
      setShowForm(false);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleCheckIn(habitId: string) {
    setError(null);
    setCheckingInId(habitId);
    try {
      const today = formatTodayInTimezone(user!.timezone);
      const result = await checkInApi(habitId, today);
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? {
                ...h,
                currentStreak: result.currentStreak,
                longestStreak: result.longestStreak,
                completedToday: true,
              }
            : h
        )
      );
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setCheckingInId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-slate-900">Habit Tracker</h1>
            {user && (
              <p className="text-xs text-slate-500">
                {user.timezone} · today is {formatTodayInTimezone(user.timezone)}
              </p>
            )}
          </div>
          <button
            onClick={logout}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Your habits</h2>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-1.5"
          >
            <Plus size={16} /> New habit
          </button>
        </div>

        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white border border-slate-200 rounded-xl p-5 mb-6 space-y-3"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Drink water"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 8 glasses a day"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2"
            >
              {creating ? "Creating…" : "Create habit"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : habits.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="mb-1">No habits yet.</p>
            <p className="text-sm">Create your first habit to start tracking a streak.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onCheckIn={handleCheckIn}
                checkingIn={checkingInId === habit.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
