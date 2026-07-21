// ---------------------------------------------------------------------------
// Achievements. `evaluate` is pure: given fasts + already-unlocked ids it
// returns the newly-unlocked ones (idempotent — never re-returns existing).
// ---------------------------------------------------------------------------

import type { Achievement, Fast } from './types';
import { completedFasts, fastedHours, totalHours, currentStreakWeeks } from './stats';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-fast', name: 'First Steps', description: 'Complete your first fast.', icon: '🌱' },
  { id: 'first-24h', name: 'Full Day', description: 'Fast for 24 hours.', icon: '🌗' },
  { id: 'ketosis-reached', name: 'Ketone Ignition', description: 'Reach 24h — ketosis onset.', icon: '🔥' },
  { id: 'autophagy-activated', name: 'Self-Cleaning', description: 'Reach 36h — autophagy ramp.', icon: '♻️' },
  { id: '48h-club', name: '48-Hour Club', description: 'Fast for 48 hours.', icon: '🌀' },
  { id: 'gh-peak', name: 'Repair Mode', description: 'Reach 56h — growth hormone peak.', icon: '🧬' },
  { id: '72h-club', name: '72-Hour Club', description: 'Complete a full 72-hour fast.', icon: '💠' },
  { id: 'regenerator', name: 'Regenerator', description: 'Finish a 72h fast including refeed.', icon: '✨' },
  { id: 'century', name: 'Centurion', description: 'Accumulate 100 total fasted hours.', icon: '🏛️' },
  { id: 'triple', name: 'Triple Threat', description: 'Complete 3 fasts.', icon: '🔱' },
  { id: 'streak-3', name: 'On a Roll', description: 'Fast in 3 consecutive weeks.', icon: '📈' },
  { id: 'ten-fasts', name: 'Devotee', description: 'Complete 10 fasts.', icon: '👑' },
];

const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export function achievementById(id: string): Achievement | undefined {
  return BY_ID.get(id);
}

/**
 * All achievement ids the given history qualifies for.
 *
 * `liveElapsedHours` is the elapsed time of a currently ACTIVE fast, so
 * hour-milestone badges (24h, ketosis, 48h, …) unlock in real time the moment
 * the line is crossed — not only after the fast completes. Completion-type
 * badges (first-fast, counts, streaks, regenerator) still require finishing.
 */
export function qualifiedIds(
  fasts: Fast[],
  now: number,
  liveElapsedHours = 0,
): Set<string> {
  const done = completedFasts(fasts);
  const ids = new Set<string>();

  const maxHours = Math.max(
    done.length ? Math.max(...done.map(fastedHours)) : 0,
    liveElapsedHours,
  );
  // Century counts every fasted hour, including the fast in progress.
  const total = totalHours(fasts) + liveElapsedHours;

  if (maxHours >= 24) {
    ids.add('first-24h');
    ids.add('ketosis-reached');
  }
  if (maxHours >= 36) ids.add('autophagy-activated');
  if (maxHours >= 48) ids.add('48h-club');
  if (maxHours >= 56) ids.add('gh-peak');
  if (maxHours >= 72) ids.add('72h-club');
  if (total >= 100) ids.add('century');

  if (done.length > 0) {
    ids.add('first-fast');
    if (done.length >= 3) ids.add('triple');
    if (done.length >= 10) ids.add('ten-fasts');
    if (currentStreakWeeks(fasts, now) >= 3) ids.add('streak-3');
    // Regenerator: a >=72h fast that also completed the refeed meal step.
    if (done.some((f) => fastedHours(f) >= 72 && f.refeed?.mealAt != null)) {
      ids.add('regenerator');
    }
  }

  return ids;
}

/**
 * Newly-unlocked achievement ids: qualified minus already-unlocked.
 * Deterministic order (ACHIEVEMENTS order) for stable UI reveal.
 */
export function evaluate(
  fasts: Fast[],
  alreadyUnlocked: Set<string> | Record<string, unknown>,
  now: number,
  liveElapsedHours = 0,
): string[] {
  const have =
    alreadyUnlocked instanceof Set
      ? alreadyUnlocked
      : new Set(Object.keys(alreadyUnlocked));
  const qualified = qualifiedIds(fasts, now, liveElapsedHours);
  return ACHIEVEMENTS.filter((a) => qualified.has(a.id) && !have.has(a.id)).map(
    (a) => a.id,
  );
}
