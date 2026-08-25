/**
 * streak.service.ts
 *
 * Pure functions over a list of local-date strings ("YYYY-MM-DD").
 * No DB access, no HTTP — this makes streak logic trivial to unit test
 * and keeps it decoupled from persistence. The API layer is responsible
 * for loading the check-in local dates and calling into this module;
 * the frontend never computes streaks itself.
 */

import { isNextConsecutiveDay, previousLocalDate } from "./localDay.service";

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

/**
 * currentStreak = consecutive local days ending TODAY, or ending YESTERDAY
 * if today has not been logged yet. If neither today nor yesterday is
 * logged, the streak is broken -> 0.
 */
function calculateCurrentStreak(sortedDatesDesc: string[], todayLocalDate: string): number {
  if (sortedDatesDesc.length === 0) return 0;

  const mostRecent = sortedDatesDesc[0];
  const yesterday = previousLocalDate(todayLocalDate);

  if (mostRecent !== todayLocalDate && mostRecent !== yesterday) {
    return 0; // most recent check-in is older than yesterday -> streak is dead
  }

  let streak = 1;
  for (let i = 0; i < sortedDatesDesc.length - 1; i++) {
    const current = sortedDatesDesc[i];
    const prev = sortedDatesDesc[i + 1];
    if (isNextConsecutiveDay(prev, current)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function calculateLongestStreak(sortedDatesAsc: string[]): number {
  if (sortedDatesAsc.length === 0) return 0;

  let longest = 1;
  let running = 1;

  for (let i = 1; i < sortedDatesAsc.length; i++) {
    if (isNextConsecutiveDay(sortedDatesAsc[i - 1], sortedDatesAsc[i])) {
      running++;
    } else {
      running = 1;
    }
    longest = Math.max(longest, running);
  }
  return longest;
}

/**
 * Main entry point. `localDates` may be unsorted and must already be
 * de-duplicated (the DB unique index guarantees this in practice, but we
 * defensively de-dupe here too so this function is safe in isolation).
 */
export function computeStreaks(localDates: string[], todayLocalDate: string): StreakResult {
  const unique = Array.from(new Set(localDates)).sort(); // ascending YYYY-MM-DD sorts correctly as strings
  const descending = [...unique].reverse();

  return {
    currentStreak: calculateCurrentStreak(descending, todayLocalDate),
    longestStreak: calculateLongestStreak(unique),
  };
}

export function isCompletedToday(localDates: string[], todayLocalDate: string): boolean {
  return localDates.includes(todayLocalDate);
}
