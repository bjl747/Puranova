import { describe, it, expect } from 'vitest';
import {
  fastedHours,
  totalHours,
  longestFastHours,
  currentStreakWeeks,
  computeStats,
} from './stats';
import type { Fast } from './types';

const HOUR = 3600_000;
const DAY = 86_400_000;

function fast(startAt: number, hours: number, status: Fast['status'] = 'completed'): Fast {
  return {
    id: `f-${startAt}`,
    startAt,
    plannedEndAt: startAt + hours * HOUR,
    actualEndAt: startAt + hours * HOUR,
    status,
    weightAtStart: 200,
    containerOz: 40,
    lmntFlavor: 'citrus',
    includeCoffee: false,
    rhythmSnapshot: { wakeTime: '07:00', bedTime: '22:00', workBlocks: [] },
  };
}

const base = new Date(2024, 0, 1, 12, 0).getTime(); // Mon Jan 1 2024

describe('fastedHours', () => {
  it('measures actual duration', () => {
    expect(fastedHours(fast(base, 72))).toBeCloseTo(72);
  });
});

describe('totals', () => {
  it('sums completed only', () => {
    const fasts = [fast(base, 24), fast(base + DAY, 48), fast(base + 2 * DAY, 12, 'abandoned')];
    expect(totalHours(fasts)).toBeCloseTo(72);
    expect(longestFastHours(fasts)).toBeCloseTo(48);
  });
});

describe('currentStreakWeeks', () => {
  it('counts consecutive Mon-anchored weeks with a completed fast', () => {
    // three fasts in three consecutive weeks
    const fasts = [
      fast(base, 24),
      fast(base + 7 * DAY, 24),
      fast(base + 14 * DAY, 24),
    ];
    const now = base + 15 * DAY; // still within the last active week
    expect(currentStreakWeeks(fasts, now)).toBe(3);
  });
  it('breaks the streak after a gap', () => {
    const fasts = [fast(base, 24), fast(base + 21 * DAY, 24)];
    const now = base + 22 * DAY;
    expect(currentStreakWeeks(fasts, now)).toBe(1);
  });
  it('is zero when the most recent fast is 2+ weeks stale', () => {
    const fasts = [fast(base, 24)];
    const now = base + 21 * DAY;
    expect(currentStreakWeeks(fasts, now)).toBe(0);
  });
});

describe('computeStats', () => {
  it('bundles the headline numbers', () => {
    const fasts = [fast(base, 72), fast(base + 7 * DAY, 24)];
    const s = computeStats(fasts, base + 8 * DAY);
    expect(s.completedCount).toBe(2);
    expect(s.totalHours).toBeCloseTo(96);
    expect(s.longestHours).toBeCloseTo(72);
    expect(s.currentStreakWeeks).toBe(2);
  });
});
