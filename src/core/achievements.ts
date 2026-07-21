// ---------------------------------------------------------------------------
// Achievements. `evaluate` is pure: given fasts + already-unlocked ids it
// returns the newly-unlocked ones (idempotent — never re-returns existing).
// ---------------------------------------------------------------------------

import type {
  Achievement,
  AchievementProgress,
  Fast,
  MilestoneHit,
} from './types';
import { completedFasts, fastedHours, totalHours, currentStreakWeeks } from './stats';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-fast', name: 'First Steps', description: 'Complete your first fast.', icon: '🌱',
    kind: 'count', threshold: 1,
    explanation:
      'Every journey starts with a single completed fast — any length counts. Finishing (not just starting) is the skill: you planned it, rode out the hunger waves, and landed the refeed. The first one is the hardest you will ever do.',
  },
  {
    id: 'first-24h', name: 'Full Day', description: 'Fast for 24 hours.', icon: '🌗',
    kind: 'hour', threshold: 24,
    explanation:
      'A full rotation of the Earth without food. By hour 24 your liver glycogen is largely spent, insulin has fallen to baseline, and your metabolism has completed its switch to running on fat. Most people never experience this — you have.',
  },
  {
    id: 'ketosis-reached', name: 'Ketone Ignition', description: 'Reach 24h — ketosis onset.', icon: '🔥',
    kind: 'hour', threshold: 24,
    explanation:
      'Around the 24-hour mark, ketone production ramps up and your brain begins burning β-hydroxybutyrate — an exceptionally clean fuel. This is the calm, clear-headed state fasters chase, and the doorway to every deeper benefit.',
  },
  {
    id: 'autophagy-activated', name: 'Self-Cleaning', description: 'Reach 36h — autophagy ramp.', icon: '♻️',
    kind: 'hour', threshold: 36,
    explanation:
      'By 36 hours, with insulin low and AMPK high, autophagy accelerates: your cells tag damaged proteins and worn-out mitochondria and recycle them for parts. This cellular housekeeping is the core reason to fast beyond a day.',
  },
  {
    id: '48h-club', name: '48-Hour Club', description: 'Fast for 48 hours.', icon: '🌀',
    kind: 'hour', threshold: 48,
    explanation:
      'Two full days. Autophagy is running deep, insulin sensitivity is resetting, and growth hormone is climbing to protect your muscle. From here on, every hour is elite territory that few ever visit.',
  },
  {
    id: 'gh-peak', name: 'Repair Mode', description: 'Reach 56h — growth hormone peak.', icon: '🧬',
    kind: 'hour', threshold: 56,
    explanation:
      'By ~56 hours growth hormone secretion has risen several-fold above baseline — your body\'s way of guarding lean muscle and priming tissue repair for the refeed. You are in full repair mode.',
  },
  {
    id: '72h-club', name: '72-Hour Club', description: 'Reach a full 72 hours fasted.', icon: '💠',
    kind: 'hour', threshold: 72,
    explanation:
      'The summit. At 72 hours, research points to immune-cell turnover: old white blood cells cleared out and stem cells activated to regenerate the immune system. This is the full cellular-renewal fast, complete.',
  },
  {
    id: 'regenerator', name: 'Regenerator', description: 'Finish a 72h fast including refeed.', icon: '✨',
    kind: 'special', threshold: 72,
    explanation:
      'The complete arc, done right: 72 fasted hours AND the disciplined landing — broth, the 45-minute digestion window, then a clean first meal. The refeed is where many stumble; finishing it properly is mastery.',
  },
  {
    id: 'century', name: 'Centurion', description: 'Accumulate 100 total fasted hours.', icon: '🏛️',
    kind: 'cumulative', threshold: 100,
    explanation:
      'One hundred lifetime hours in the fasted state — hours your digestive system rested, your insulin stayed low, and your cells cleaned house. This badge honors accumulation: the quiet compounding of many fasts.',
  },
  {
    id: 'triple', name: 'Triple Threat', description: 'Complete 3 fasts.', icon: '🔱',
    kind: 'count', threshold: 3,
    explanation:
      'Three completed fasts. Once is an experiment, twice is a test — three times is a practice. Your body now recognizes the pattern and switches into ketosis faster each time.',
  },
  {
    id: 'streak-3', name: 'On a Roll', description: 'Fast in 3 consecutive weeks.', icon: '📈',
    kind: 'streak', threshold: 3,
    explanation:
      'A completed fast in three consecutive weeks. Rhythm beats heroics: regular fasting keeps insulin sensitivity high and makes each fast easier than the last. This badge is about consistency, not duration.',
  },
  {
    id: 'ten-fasts', name: 'Devotee', description: 'Complete 10 fasts.', icon: '👑',
    kind: 'count', threshold: 10,
    explanation:
      'Ten completed fasts. Fasting is no longer something you try — it is part of who you are. At this level you know your hunger waves, your rhythms, and your refeeds by heart.',
  },
];

const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export function achievementById(id: string): Achievement | undefined {
  return BY_ID.get(id);
}

/**
 * The user's personal history for one badge: every qualifying occurrence,
 * plus a progress fraction toward the threshold. The active fast (if any)
 * counts as an in-progress hit for hour-based milestones it has crossed.
 */
export function achievementHistory(
  a: Achievement,
  fasts: Fast[],
  now: number,
  liveElapsedHours = 0,
): { hits: MilestoneHit[]; progress: AchievementProgress } {
  const done = completedFasts(fasts);
  const active = fasts.find(
    (f) => f.status === 'active' || f.status === 'refeed',
  );

  const hitOf = (f: Fast): MilestoneHit => ({
    fastId: f.id,
    at: f.startAt,
    hours: fastedHours(f),
    inProgress: false,
  });
  const liveHit: MilestoneHit | null = active
    ? {
        fastId: active.id,
        at: active.startAt,
        hours: liveElapsedHours,
        inProgress: true,
      }
    : null;

  let hits: MilestoneHit[] = [];
  let progress: AchievementProgress;

  switch (a.kind) {
    case 'hour': {
      hits = done.filter((f) => fastedHours(f) >= a.threshold).map(hitOf);
      if (liveHit && liveElapsedHours >= a.threshold) hits.push(liveHit);
      const maxH = Math.max(
        done.length ? Math.max(...done.map(fastedHours)) : 0,
        liveElapsedHours,
      );
      progress = { current: Math.min(maxH, a.threshold), target: a.threshold, unit: 'h' };
      break;
    }
    case 'special': {
      // Regenerator: >=72h completed fasts with the refeed meal logged.
      hits = done
        .filter((f) => fastedHours(f) >= a.threshold && f.refeed?.mealAt != null)
        .map(hitOf);
      progress = { current: hits.length ? 1 : 0, target: 1, unit: 'done' };
      break;
    }
    case 'count': {
      hits = done.map(hitOf);
      progress = {
        current: Math.min(done.length, a.threshold),
        target: a.threshold,
        unit: 'fasts',
      };
      break;
    }
    case 'cumulative': {
      hits = done.map(hitOf);
      if (liveHit && liveElapsedHours > 0) hits.push(liveHit);
      progress = {
        current: Math.min(totalHours(fasts) + liveElapsedHours, a.threshold),
        target: a.threshold,
        unit: 'h',
      };
      break;
    }
    case 'streak': {
      hits = done.map(hitOf);
      progress = {
        current: Math.min(currentStreakWeeks(fasts, now), a.threshold),
        target: a.threshold,
        unit: 'weeks',
      };
      break;
    }
  }

  hits.sort((x, y) => y.at - x.at);
  return { hits, progress };
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
