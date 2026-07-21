import { describe, it, expect } from 'vitest';
import { evaluate, qualifiedIds, ACHIEVEMENTS } from './achievements';
import type { Fast } from './types';

const HOUR = 3600_000;
const DAY = 86_400_000;
const base = new Date(2024, 0, 1, 12, 0).getTime();

function fast(startAt: number, hours: number, extra: Partial<Fast> = {}): Fast {
  return {
    id: `f-${startAt}`,
    startAt,
    plannedEndAt: startAt + hours * HOUR,
    actualEndAt: startAt + hours * HOUR,
    status: 'completed',
    weightAtStart: 200,
    containerOz: 40,
    lmntFlavor: 'citrus',
    includeCoffee: false,
    rhythmSnapshot: { wakeTime: '07:00', bedTime: '22:00', workBlocks: [] },
    ...extra,
  };
}

describe('qualifiedIds thresholds', () => {
  it('unlocks by max fast length', () => {
    const q = qualifiedIds([fast(base, 24)], base + DAY);
    expect(q.has('first-fast')).toBe(true);
    expect(q.has('first-24h')).toBe(true);
    expect(q.has('ketosis-reached')).toBe(true);
    expect(q.has('autophagy-activated')).toBe(false);
  });
  it('unlocks 72h-club and regenerator only with refeed meal', () => {
    const noRefeed = qualifiedIds([fast(base, 72)], base + DAY);
    expect(noRefeed.has('72h-club')).toBe(true);
    expect(noRefeed.has('regenerator')).toBe(false);

    const withMeal = qualifiedIds(
      [fast(base, 72, { refeed: { mealAt: base + 73 * HOUR } })],
      base + DAY,
    );
    expect(withMeal.has('regenerator')).toBe(true);
  });
  it('unlocks century at 100 total hours', () => {
    const fasts = [fast(base, 72), fast(base + 7 * DAY, 48)];
    expect(qualifiedIds(fasts, base + 8 * DAY).has('century')).toBe(true);
  });
});

describe('evaluate idempotence', () => {
  it('returns only newly-unlocked ids', () => {
    const fasts = [fast(base, 24)];
    const first = evaluate(fasts, new Set<string>(), base + DAY);
    expect(first).toContain('first-fast');
    expect(first).toContain('ketosis-reached');

    const second = evaluate(fasts, new Set(first), base + DAY);
    expect(second).toEqual([]);
  });
  it('accepts a record of already-unlocked as well as a set', () => {
    const fasts = [fast(base, 24)];
    const res = evaluate(fasts, { 'first-fast': { unlockedAt: 1 } }, base + DAY);
    expect(res).not.toContain('first-fast');
    expect(res).toContain('first-24h');
  });
});

describe('live (mid-fast) unlocking', () => {
  it('unlocks hour milestones the moment the active fast crosses them', () => {
    const activeFast = fast(base, 72, { status: 'active', actualEndAt: undefined });
    const q = qualifiedIds([activeFast], base + 25 * HOUR, 24.1);
    expect(q.has('first-24h')).toBe(true);
    expect(q.has('ketosis-reached')).toBe(true);
    expect(q.has('autophagy-activated')).toBe(false); // not yet at 36h
  });

  it('does NOT unlock completion-type badges from a live fast', () => {
    const activeFast = fast(base, 72, { status: 'active', actualEndAt: undefined });
    const q = qualifiedIds([activeFast], base + 25 * HOUR, 24.1);
    expect(q.has('first-fast')).toBe(false);
    expect(q.has('triple')).toBe(false);
  });

  it('counts live hours toward the 100h century badge', () => {
    const history = [fast(base, 72)]; // 72 completed hours
    const q = qualifiedIds(history, base + 10 * DAY, 30); // + 30 live
    expect(q.has('century')).toBe(true);
  });

  it('evaluate passes live hours through', () => {
    const activeFast = fast(base, 72, { status: 'active', actualEndAt: undefined });
    const newly = evaluate([activeFast], new Set(), base + 25 * HOUR, 24.1);
    expect(newly).toContain('first-24h');
    expect(newly).not.toContain('first-fast');
  });
});

describe('ACHIEVEMENTS registry', () => {
  it('has unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
