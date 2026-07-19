// ---------------------------------------------------------------------------
// Metabolic stage engine. Stages are hour-anchored from fast start (NOT
// proportional to fast length), so a 24h fast and a 72h fast share the same
// early stages at the same clock offsets.
// ---------------------------------------------------------------------------

import type { Stage, StageProgress, StageWindow } from './types';
import { clamp } from './time';

export const STAGES: Stage[] = [
  {
    id: 'fed',
    startHour: 0,
    endHour: 4,
    name: 'Fed State',
    tagline: 'Digesting & storing',
    body: "Your body is digesting your last meal. Insulin is elevated, glucose is the primary fuel, and nutrients are being stored. mTOR — the cellular growth switch — is active.",
    colorVar: '--stage-fed',
    hex: '#6ea8ff',
  },
  {
    id: 'early',
    startHour: 4,
    endHour: 12,
    name: 'Early Post-Absorptive',
    tagline: 'Insulin falling',
    body: 'Insulin is dropping. Your liver begins releasing stored glycogen to keep blood sugar steady, and fat burning starts to tick upward.',
    colorVar: '--stage-early',
    hex: '#58c4d6',
  },
  {
    id: 'glycogen',
    startHour: 12,
    endHour: 18,
    name: 'Glycogen Depletion',
    tagline: 'Tapping the reserves',
    body: 'Liver glycogen reserves are running low. Your body ramps up fat mobilization and prepares alternative fuel pathways. Hunger waves often peak here — they pass.',
    colorVar: '--stage-glycogen',
    hex: '#3ff2e0',
  },
  {
    id: 'switch',
    startHour: 18,
    endHour: 24,
    name: 'The Metabolic Switch',
    tagline: 'Fat-powered',
    body: 'Gluconeogenesis takes over: your liver makes glucose from fat-derived glycerol while lipolysis becomes the dominant energy source. You are now primarily fat-powered.',
    colorVar: '--stage-switch',
    hex: '#45e0a8',
  },
  {
    id: 'ketosis',
    startHour: 24,
    endHour: 36,
    name: 'Ketosis Onset',
    tagline: 'Brain on ketones',
    body: 'Ketone production is climbing. Your brain begins running on β-hydroxybutyrate — many people feel a calm, clear focus. Appetite hormones start to flatten.',
    colorVar: '--stage-ketosis',
    hex: '#4dff9e',
  },
  {
    id: 'autophagy',
    startHour: 36,
    endHour: 48,
    name: 'Autophagy Ramp',
    tagline: 'Cellular recycling',
    body: 'With insulin low and AMPK high, mTOR is suppressed and autophagy accelerates: cells tag and recycle damaged proteins, misfolded structures, and worn-out mitochondria.',
    colorVar: '--stage-autophagy',
    hex: '#8b7bff',
  },
  {
    id: 'deep',
    startHour: 48,
    endHour: 56,
    name: 'Deep Autophagy + GH Peak',
    tagline: 'Repair & protect',
    body: 'Autophagy is near maximal. Growth hormone secretion rises sharply — protecting lean muscle and priming tissue repair for refeeding.',
    colorVar: '--stage-deep',
    hex: '#b07bff',
  },
  {
    id: 'regen',
    startHour: 56,
    endHour: 72,
    name: 'Cellular Regeneration',
    tagline: 'Immune reset',
    body: 'Prolonged fasting triggers immune-cell turnover: old white blood cells are cleared and stem cells activate to help regenerate the immune system.',
    colorVar: '--stage-regen',
    hex: '#ff6b9d',
  },
  {
    id: 'extended',
    startHour: 72,
    endHour: Infinity,
    name: 'Extended Regeneration',
    tagline: 'Advanced territory',
    body: 'Regenerative signaling continues. Beyond 72 hours is advanced territory — electrolytes and self-monitoring matter more with each passing hour.',
    colorVar: '--stage-extended',
    hex: '#ffb547',
  },
];

/** The stage active at a given elapsed-hours value. */
export function stageAt(elapsedHours: number): Stage {
  const h = Math.max(0, elapsedHours);
  for (const s of STAGES) {
    if (h >= s.startHour && h < s.endHour) return s;
  }
  return STAGES[STAGES.length - 1];
}

/** Index of the stage active at elapsedHours. */
export function stageIndexAt(elapsedHours: number): number {
  const h = Math.max(0, elapsedHours);
  for (let i = 0; i < STAGES.length; i++) {
    if (h >= STAGES[i].startHour && h < STAGES[i].endHour) return i;
  }
  return STAGES.length - 1;
}

/**
 * The stages a fast of `durationHours` will pass through. The final stage is
 * clipped to the fast duration. Only stages that begin before the fast ends
 * are included (plus, always, the stage in progress at the finish line).
 */
export function stagesForFast(durationHours: number): StageWindow[] {
  const out: StageWindow[] = [];
  for (const s of STAGES) {
    if (s.startHour >= durationHours) break;
    const clippedEndHour = Math.min(s.endHour, durationHours);
    out.push({
      ...s,
      clippedEndHour,
      reached: durationHours >= s.endHour,
    });
  }
  // A zero/near-zero duration still shows at least the Fed State.
  if (out.length === 0) {
    out.push({ ...STAGES[0], clippedEndHour: durationHours, reached: false });
  }
  return out;
}

/** Rich progress snapshot for the live timer. */
export function stageProgress(
  elapsedHours: number,
  plannedDurationHours: number,
): StageProgress {
  const h = Math.max(0, elapsedHours);
  const idx = stageIndexAt(h);
  const current = STAGES[idx];
  const next = idx < STAGES.length - 1 ? STAGES[idx + 1] : null;

  const hoursIntoStage = h - current.startHour;
  const stageSpan =
    current.endHour === Infinity ? Infinity : current.endHour - current.startHour;
  const stagePct =
    stageSpan === Infinity ? 1 : clamp(hoursIntoStage / stageSpan, 0, 1);
  const hoursToNext = next ? Math.max(0, next.startHour - h) : null;

  const overallPct =
    plannedDurationHours > 0 ? clamp(h / plannedDurationHours, 0, 1) : 0;

  return {
    current,
    next,
    elapsedHours: h,
    hoursIntoStage,
    hoursToNext,
    stagePct,
    overallPct,
  };
}
