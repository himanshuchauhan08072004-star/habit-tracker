/**
 * DayTrail — the app's signature visual motif.
 *
 * Renders a small connected-dot trail for the last N local days. It is a
 * PURE renderer: it takes a list of local-date strings the server has
 * already computed as "checked in" (from GET /habits/:id/check-ins), plus
 * the server's own `todayLocalDate`, and just draws dots. It does NOT
 * decide what "today" is, does NOT compute a streak, and does NOT use the
 * browser's timezone — every date it receives is a prop, sourced from the
 * API. The weekday letter shown above each dot is derived purely from the
 * date string itself (calendar arithmetic), the same category of pure
 * date-string math the backend uses — not a business decision.
 */

interface DayTrailProps {
  /** Local-date strings ("YYYY-MM-DD") that are checked in, most relevant recent ones. */
  completedDates: string[];
  /** The server's local "today" date string for this user. */
  todayLocalDate: string;
  /** How many days back to show, including today. Default 7. */
  days?: number;
  /** Show a single-letter weekday label above each dot. Default false. */
  showLabels?: boolean;
}

const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

function shiftDate(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

function weekdayLetter(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // Sun=0..Sat=6
  return WEEKDAY_LETTERS[(jsDay + 6) % 7]; // Mon=0..Sun=6
}

export function DayTrail({ completedDates, todayLocalDate, days = 7, showLabels = false }: DayTrailProps) {
  const completedSet = new Set(completedDates);
  const dates = Array.from({ length: days }, (_, i) => shiftDate(todayLocalDate, i - (days - 1)));

  return (
    <div role="img" aria-label={`Last ${days} days activity trail`}>
      {showLabels && (
        <div className="mb-1 flex items-center gap-1">
          {dates.map((date, i) => (
            <div key={date} className="flex items-center">
              <span className="block w-2.5 text-center text-[9px] font-medium text-ink-faint">
                {weekdayLetter(date)}
              </span>
              {i < dates.length - 1 && <span className="w-2.5" />}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1">
        {dates.map((date, i) => {
          const isToday = date === todayLocalDate;
          const isDone = completedSet.has(date);
          return (
            <div key={date} className="flex items-center">
              <span
                title={date}
                className={[
                  "block rounded-full transition-colors",
                  isToday ? "h-2.5 w-2.5" : "h-2 w-2",
                  isDone ? "bg-brand-600" : "bg-line",
                  isToday && !isDone ? "ring-2 ring-brand-200" : "",
                ].join(" ")}
              />
              {i < dates.length - 1 && (
                <span className={`h-px w-2.5 ${isDone ? "bg-brand-400" : "bg-line"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
