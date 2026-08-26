import { useEffect, useMemo, useState } from "react";
import { Flame, Trophy, CheckCircle2, ListChecks, Plus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { Habit } from "../types";
import { fetchHabits, createHabit as createHabitApi, checkIn as checkInApi, fetchCheckIns } from "../services/habits";
import { extractApiErrorMessage } from "../services/api";
import { AppShell } from "../components/AppShell";
import { HabitCard } from "../components/HabitCard";
import { ErrorBanner } from "../components/ErrorBanner";
import { StatCard } from "../components/StatCard";
import { ProgressBar } from "../components/ProgressBar";
import { EmptyState } from "../components/EmptyState";
import { DashboardSkeleton } from "../components/Skeleton";
import { CreateHabitModal } from "../components/CreateHabitModal";
import { formatTodayInTimezone, formatDateReadable } from "../utils/date";

export function DashboardPage() {
  const { user } = useAuth();
  const { showToast, ToastViewport } = useToast();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [recentDatesByHabit, setRecentDatesByHabit] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const habitList = await fetchHabits();
      setHabits(habitList);

      // Reuses the existing GET /habits/:id/check-ins endpoint (already used on
      // the detail page) to drive the 7-day activity strip on each card — real
      // server history, not a new API contract.
      const entries = await Promise.all(
        habitList.map(async (h) => {
          try {
            const checkIns = await fetchCheckIns(h.id);
            return [h.id, checkIns.slice(0, 7).map((c) => c.localDate)] as const;
          } catch {
            return [h.id, []] as const;
          }
        })
      );
      setRecentDatesByHabit(Object.fromEntries(entries));
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(name: string, description: string) {
    setCreateError(null);
    setCreating(true);
    try {
      const habit = await createHabitApi(name, description);
      setHabits((prev) => [habit, ...prev]);
      setRecentDatesByHabit((prev) => ({ ...prev, [habit.id]: [] }));
      setModalOpen(false);
      showToast("Habit created", `“${habit.name}” is ready to track.`);
    } catch (err) {
      setCreateError(extractApiErrorMessage(err));
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
      // The server's own checkIn.localDate — not a client-computed date —
      // is what gets added to the activity strip.
      setRecentDatesByHabit((prev) => ({
        ...prev,
        [habitId]: [result.checkIn.localDate, ...(prev[habitId] ?? [])].slice(0, 7),
      }));
      showToast("Habit completed", `+1 day added — streak is now ${result.currentStreak}.`);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setCheckingInId(null);
    }
  }

  const stats = useMemo(() => {
    const totalHabits = habits.length;
    const completedToday = habits.filter((h) => h.completedToday).length;
    const bestCurrent = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);
    const bestLongest = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0);
    const percent = totalHabits === 0 ? 0 : (completedToday / totalHabits) * 100;
    return { totalHabits, completedToday, bestCurrent, bestLongest, percent };
  }, [habits]);

  const today = user ? formatTodayInTimezone(user.timezone) : "";
  const greeting = user ? greetingForTimezone(user.timezone) : "Welcome";

  return (
    <AppShell>
      <ToastViewport />

      <header className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{greeting} 👋</h1>
        <p className="mt-1 text-sm text-ink-muted">Build consistency, one day at a time.</p>
        {user && (
          <p className="mt-2.5 font-mono text-xs text-ink-faint">
            Today · {formatDateReadable(today)} · {user.timezone}
          </p>
        )}
      </header>

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : habits.length === 0 ? (
        <EmptyState onCreate={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={<Flame size={15} />}
              label="Current streak"
              value={stats.bestCurrent}
              hint={stats.bestCurrent > 0 ? "days · keep it going" : "start today"}
              tone="amber"
            />
            <StatCard
              icon={<Trophy size={15} />}
              label="Longest streak"
              value={stats.bestLongest}
              hint="personal best"
              tone="neutral"
            />
            <StatCard
              icon={<CheckCircle2 size={15} />}
              label="Today"
              value={`${stats.completedToday} / ${stats.totalHabits}`}
              hint={`${Math.round(stats.percent)}% complete`}
              tone="good"
            />
            <StatCard
              icon={<ListChecks size={15} />}
              label="Active habits"
              value={stats.totalHabits}
              hint="all habits"
              tone="brand"
            />
          </div>

          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="mb-2.5 flex items-baseline justify-between">
              <p className="text-sm font-medium text-ink">Today's progress</p>
              <p className="text-sm tabular-nums text-ink-muted">
                {stats.completedToday} of {stats.totalHabits} habits completed
              </p>
            </div>
            <ProgressBar percent={stats.percent} />
            <p className="mt-2 text-xs text-ink-faint">
              {stats.totalHabits - stats.completedToday === 0
                ? "All habits done for today."
                : `${stats.totalHabits - stats.completedToday} habit${
                    stats.totalHabits - stats.completedToday === 1 ? "" : "s"
                  } remaining`}
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Your habits</h2>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                <Plus size={15} /> New habit
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  todayLocalDate={today}
                  recentCompletedDates={recentDatesByHabit[habit.id] ?? []}
                  onCheckIn={handleCheckIn}
                  checkingIn={checkingInId === habit.id}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <CreateHabitModal
        open={modalOpen}
        submitting={creating}
        error={createError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </AppShell>
  );
}

function greetingForTimezone(timezone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", hour12: false }).format(
      new Date()
    )
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
