/**
 * localDay.service.ts
 *
 * ALL timezone / "what calendar day is this?" logic lives here, and ONLY here.
 * Nothing else in the codebase should call Date methods directly to decide
 * what day a check-in belongs to.
 *
 * Why this matters (the assignment's central rule):
 *   A streak is measured in the user's own local days, not elapsed hours.
 *   `new Date().toISOString().split("T")[0]` gives the UTC day, which is
 *   WRONG for any user not in UTC+0. We must always convert through the
 *   user's IANA timezone using the platform's real timezone database so
 *   DST transitions etc. are handled correctly for free.
 */

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const LOCAL_DATE_FORMAT = "yyyy-MM-dd";
const LOCAL_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate that a string is a real IANA timezone identifier
 * (e.g. "Asia/Kolkata"), not just any string.
 */
export function isValidTimezone(timezone: string): boolean {
  if (!timezone || typeof timezone !== "string") return false;
  try {
    // Intl throws RangeError for unknown zone names.
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert a UTC instant to the user's local calendar date string (YYYY-MM-DD).
 * This is THE function that answers "which local day does this check-in belong to?"
 */
export function utcToLocalDate(utcInstant: Date, timezone: string): string {
  return formatInTimeZone(utcInstant, timezone, LOCAL_DATE_FORMAT);
}

/**
 * What is "today" right now, in the user's timezone?
 * Server-side only — we never trust a client-supplied "today".
 */
export function getTodayLocalDate(timezone: string, now: Date = new Date()): string {
  return utcToLocalDate(now, timezone);
}

/**
 * Yesterday's local date string, relative to a given local date string.
 * Used by the streak algorithm and by "today or yesterday" validation.
 */
export function previousLocalDate(localDate: string): string {
  const [y, m, d] = localDate.split("-").map(Number);
  // Use UTC noon as a neutral anchor so we never cross a DST boundary
  // while just doing pure calendar-day arithmetic.
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  anchor.setUTCDate(anchor.getUTCDate() - 1);
  return formatInTimeZone(anchor, "UTC", LOCAL_DATE_FORMAT);
}

/** Is `a` exactly one calendar day before `b`? (pure YYYY-MM-DD arithmetic) */
export function isNextConsecutiveDay(a: string, b: string): boolean {
  return previousLocalDate(b) === a;
}

/** Basic shape + real-calendar-date validation for a "YYYY-MM-DD" string. */
export function isValidLocalDateString(value: string): boolean {
  if (!LOCAL_DATE_REGEX.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/**
 * When a user checks in "for today", we still need a concrete UTC instant
 * to store as `checkedInAt`. We just use the real current instant — the
 * local date is what we independently computed via getTodayLocalDate.
 *
 * When a user *backfills* a past date, there is no real "instant" the
 * check-in happened at, so we anchor it at local noon on that date
 * (converted to UTC) purely so `checkedInAt` is a sensible, sortable
 * timestamp. `localDate` — not `checkedInAt` — is the field all business
 * logic (streaks, duplicate checks) is based on.
 */
export function localDateToUtcInstant(localDate: string, timezone: string): Date {
  // "local noon" wall-clock time, interpreted in the user's timezone,
  // converted to the equivalent UTC instant. DST-safe because it goes
  // through the real IANA tz database rather than a fixed offset.
  return fromZonedTime(`${localDate}T12:00:00`, timezone);
}
