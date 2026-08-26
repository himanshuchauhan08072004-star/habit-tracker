/**
 * These helpers are for DISPLAY purposes only (e.g. showing "today" in the
 * user's timezone on the dashboard, or defaulting the backfill date picker).
 *
 * They must NEVER be used to decide whether a streak is alive, whether a
 * check-in is a duplicate, or whether a date is in the future — the server
 * is the sole source of truth for all of that, per the assignment's
 * "frontend must never decide if a streak is alive" rule.
 */

export function formatTodayInTimezone(timezone: string): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

export function formatDateReadable(localDate: string): string {
  const [y, m, d] = localDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** Display-only: formats an ISO instant as a wall-clock time, browser-local. Never used for business logic. */
export function formatTimeOfDay(isoInstant: string): string {
  return new Date(isoInstant).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
