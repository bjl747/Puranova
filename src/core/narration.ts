// ---------------------------------------------------------------------------
// Builds the spoken narration script for the "hear where you are" voice button.
// Pure function of the live stage progress, so it can be unit-tested and reused
// by any speech backend.
// ---------------------------------------------------------------------------

import type { StageProgress } from './types';

function roundHours(h: number): string {
  if (h < 1) {
    const mins = Math.max(1, Math.round(h * 60));
    return `${mins} minute${mins === 1 ? '' : 's'}`;
  }
  const rounded = Math.round(h * 10) / 10;
  const whole = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
  return `${whole} hour${rounded === 1 ? '' : 's'}`;
}

/**
 * Compose a warm, spoken update: where you are, what your body is doing, what
 * you're likely feeling, and what's coming next.
 */
export function buildNarration(progress: StageProgress): string {
  const { current, next, elapsedHours, hoursToNext } = progress;
  const parts: string[] = [];

  // Opening — how far in.
  if (elapsedHours < 1) {
    parts.push(`You're just getting started — about ${roundHours(elapsedHours)} into your fast.`);
  } else {
    parts.push(`You're ${roundHours(elapsedHours)} into your fast.`);
  }

  // Current stage + what's happening.
  parts.push(`Right now you're in ${current.name}. ${current.body}`);

  // What you're likely feeling.
  parts.push(`Around now, you might feel ${current.feeling}.`);

  // What's coming.
  if (next && hoursToNext != null) {
    parts.push(
      `In about ${roundHours(hoursToNext)}, you'll move into ${next.name}, where ${lowerFirst(next.tagline)} takes over. As you get there, expect to feel ${next.feeling}.`,
    );
  } else {
    parts.push(
      `You're in the deepest phase now. Keep listening to your body, and lean on your water and electrolytes.`,
    );
  }

  // Supportive close.
  parts.push(
    `Keep sipping your water, take your electrolytes and magnesium on schedule, and trust the process. Your cells are already doing the work. You've got this.`,
  );

  return parts.join(' ');
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
