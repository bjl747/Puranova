// ---------------------------------------------------------------------------
// Aggregate stats over a user's fast history. Pure functions.
// ---------------------------------------------------------------------------

import type { Fast } from './types';
import { HOUR, DAY } from './time';
import { fastEndAt } from './refeed';

export interface FastStats {
  completedCount: number;
  totalHours: number;
  longestHours: number;
  currentStreakWeeks: number;
}

/** Only completed fasts count toward stats. */
export function completedFasts(fasts: Fast[]): Fast[] {
  return fasts.filter((f) => f.status === 'completed');
}

/** Effective fasted duration in hours for a completed fast. */
export function fastedHours(fast: Fast): number {
  const end = fastEndAt(fast);
  return Math.max(0, (end - fast.startAt) / HOUR);
}

export function totalHours(fasts: Fast[]): number {
  return completedFasts(fasts).reduce((sum, f) => sum + fastedHours(f), 0);
}

export function longestFastHours(fasts: Fast[]): number {
  return completedFasts(fasts).reduce(
    (max, f) => Math.max(max, fastedHours(f)),
    0,
  );
}

/**
 * Current streak measured in consecutive ISO-ish weeks (Mon-anchored) that
 * contain at least one completed fast, counting back from the most recent
 * completed fast's week. Returns 0 if there are none.
 */
export function currentStreakWeeks(fasts: Fast[], now: number): number {
  const done = completedFasts(fasts);
  if (done.length === 0) return 0;

  const weekOf = (ms: number) => {
    const d = new Date(ms);
    const dow = (d.getDay() + 6) % 7; // Mon=0
    const monday = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate() - dow,
    ).getTime();
    return Math.floor(monday / (7 * DAY));
  };

  const weeks = new Set(done.map((f) => weekOf(fastEndAt(f))));
  const thisWeek = weekOf(now);
  const lastActive = Math.max(...weeks);

  // If the most recent completed week is older than last week, streak is broken.
  if (thisWeek - lastActive > 1) return 0;

  let streak = 0;
  let cursor = lastActive;
  while (weeks.has(cursor)) {
    streak++;
    cursor--;
  }
  return streak;
}

/** Buckets for the history bar chart: last N completed fasts, oldest first. */
export function recentFastHours(
  fasts: Fast[],
  n: number,
): { fast: Fast; hours: number }[] {
  return completedFasts(fasts)
    .slice()
    .sort((a, b) => a.startAt - b.startAt)
    .slice(-n)
    .map((f) => ({ fast: f, hours: fastedHours(f) }));
}

export function computeStats(fasts: Fast[], now: number): FastStats {
  return {
    completedCount: completedFasts(fasts).length,
    totalHours: totalHours(fasts),
    longestHours: longestFastHours(fasts),
    currentStreakWeeks: currentStreakWeeks(fasts, now),
  };
}
