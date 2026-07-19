// ---------------------------------------------------------------------------
// Refeed protocol. Three steps; the 45-minute digestion lock starts when the
// user checks off step 1 (broth/egg), NOT at the planned fast end — so ending
// early or late both behave correctly.
// ---------------------------------------------------------------------------

import type { Fast, RefeedState } from './types';
import { MINUTE } from './time';

export const REFEED_LOCK_MS = 45 * MINUTE;

export interface RefeedStep {
  id: 'broth' | 'lock' | 'meal';
  index: number;
  title: string;
  body: string;
  /** True once the user has completed this step. */
  done: boolean;
  /** True when the step is actionable now (prior steps done + unlocked). */
  available: boolean;
  /** For the lock step: ms remaining until the meal unlocks (0 when ready). */
  lockRemainingMs?: number;
}

/** The effective end time of a fast (actual if ended, else planned). */
export function fastEndAt(fast: Fast): number {
  return fast.actualEndAt ?? fast.plannedEndAt;
}

/**
 * Compute the three refeed steps and their availability given the current time
 * and the persisted refeed state.
 */
export function refeedSteps(refeed: RefeedState | undefined, now: number): RefeedStep[] {
  const brothDone = refeed?.brothAt != null;
  const lockEndsAt = refeed?.lockEndsAt ?? Infinity;
  const unlocked = brothDone && now >= lockEndsAt;
  const mealDone = refeed?.mealAt != null;

  return [
    {
      id: 'broth',
      index: 1,
      title: 'Break your fast gently',
      body: '1–2 cups of bone broth, or 1 soft-boiled egg. Gentle protein wakes the resting digestive tract with minimal insulin spike.',
      done: brothDone,
      available: !brothDone,
    },
    {
      id: 'lock',
      index: 2,
      title: '45-minute digestion window',
      body: 'Let your gut wake up before solid food. This timer is locked — no solid meal until it completes.',
      done: brothDone && unlocked,
      available: brothDone && !unlocked,
      lockRemainingMs: brothDone ? Math.max(0, lockEndsAt - now) : REFEED_LOCK_MS,
    },
    {
      id: 'meal',
      index: 3,
      title: 'First solid meal',
      body: 'Clean protein + healthy fats. Go easy on carbohydrates and total volume — your body has been resting.',
      done: mealDone,
      available: unlocked && !mealDone,
    },
  ];
}

/** State transition when the user checks off the broth step. */
export function startRefeedLock(now: number): Partial<RefeedState> {
  return { brothAt: now, lockEndsAt: now + REFEED_LOCK_MS };
}

/** Whether all refeed steps are complete (fast fully finished). */
export function refeedComplete(refeed: RefeedState | undefined): boolean {
  return refeed?.mealAt != null;
}
