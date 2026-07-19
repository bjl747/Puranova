import { describe, it, expect } from 'vitest';
import {
  refeedSteps,
  startRefeedLock,
  refeedComplete,
  REFEED_LOCK_MS,
  fastEndAt,
} from './refeed';
import type { Fast } from './types';

const now0 = 1_700_000_000_000;

describe('startRefeedLock', () => {
  it('locks for 45 minutes from the broth check-in', () => {
    const s = startRefeedLock(now0);
    expect(s.brothAt).toBe(now0);
    expect(s.lockEndsAt).toBe(now0 + REFEED_LOCK_MS);
    expect(REFEED_LOCK_MS).toBe(45 * 60_000);
  });
});

describe('refeedSteps gating', () => {
  it('only step 1 is available before broth', () => {
    const steps = refeedSteps(undefined, now0);
    expect(steps[0].available).toBe(true);
    expect(steps[1].available).toBe(false);
    expect(steps[2].available).toBe(false);
  });
  it('locks the meal until 45 minutes elapse after broth', () => {
    const refeed = startRefeedLock(now0);
    const midLock = refeedSteps(refeed, now0 + 20 * 60_000);
    expect(midLock[0].done).toBe(true);
    expect(midLock[1].available).toBe(true); // lock ticking
    expect(midLock[1].lockRemainingMs).toBe(25 * 60_000);
    expect(midLock[2].available).toBe(false); // meal still locked

    const unlocked = refeedSteps(refeed, now0 + 46 * 60_000);
    expect(unlocked[1].done).toBe(true);
    expect(unlocked[1].lockRemainingMs).toBe(0);
    expect(unlocked[2].available).toBe(true); // meal now allowed
  });
  it('lock timing keys off broth check-in, not fast end', () => {
    // brothAt is well after any planned end; lock still measured from brothAt
    const refeed = startRefeedLock(now0 + 10 * 3600_000);
    const steps = refeedSteps(refeed, now0 + 10 * 3600_000 + 44 * 60_000);
    expect(steps[2].available).toBe(false);
  });
});

describe('refeedComplete', () => {
  it('is true once the meal step is recorded', () => {
    expect(refeedComplete(undefined)).toBe(false);
    expect(refeedComplete({ brothAt: now0, lockEndsAt: now0 })).toBe(false);
    expect(refeedComplete({ mealAt: now0 })).toBe(true);
  });
});

describe('fastEndAt', () => {
  it('prefers actual end over planned end', () => {
    const base = {
      id: 'x',
      startAt: 0,
      plannedEndAt: 100,
      status: 'completed',
      weightAtStart: 200,
      containerOz: 40,
      lmntFlavor: 'citrus',
      includeCoffee: false,
      rhythmSnapshot: { wakeTime: '07:00', bedTime: '22:00', workBlocks: [] },
    } as Fast;
    expect(fastEndAt(base)).toBe(100);
    expect(fastEndAt({ ...base, actualEndAt: 80 })).toBe(80);
  });
});
