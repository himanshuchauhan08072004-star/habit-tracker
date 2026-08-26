/**
 * HabitCalendar — renders a month grid of check-ins.
 *
 * Pure display component: takes the list of local-date strings the
 * server has recorded as check-ins, plus the server's local "today,"
 * and colors cells accordingly. It does not compute completion itself.
 */

interface HabitCalendarProps {
  completedDates: string[];
  todayLocalDate: string;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Mon=0 .. Sun=6, for a UTC-anchored date (kept purely as a calendar-grid calculation). */
function weekdayIndex(year: number, month: number, day: number): number {
  const jsDay = new Date(Date.UTC(year, month, day)).getUTCDay(); // Sun=0..Sat=6
  return (jsDay + 6) % 7;
}

export function HabitCalendar({ completedDates, todayLocalDate }: HabitCalendarProps) {
  const [y, m] = todayLocalDate.split("-").map(Number);
  const year = y;
  const month = m - 1;
  const completedSet = new Set(completedDates);
  const total = daysInMonth(year, month);
  const leadingBlanks = weekdayIndex(year, month, 1);

  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const cells: { date: string | null; done: boolean; isToday: boolean }[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push({ date: null, done: false, isToday: false });
  for (let d = 1; d <= total; d++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date, done: completedSet.has(date), isToday: date === todayLocalDate });
  }

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-ink">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="text-center text-[11px] font-medium text-ink-faint">
            {w}
          </div>
        ))}
        {cells.map((cell, i) =>
          cell.date === null ? (
            <div key={`blank-${i}`} />
          ) : (
            <div
              key={cell.date}
              title={cell.date}
              className={[
                "flex aspect-square items-center justify-center rounded-md text-[11px] tabular-nums",
                cell.done ? "bg-brand-600 text-white font-medium" : "bg-canvas text-ink-faint",
                cell.isToday && !cell.done ? "ring-2 ring-brand-400 ring-inset" : "",
              ].join(" ")}
            >
              {Number(cell.date.slice(-2))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
