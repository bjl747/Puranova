// ---------------------------------------------------------------------------
// Weight-loss projection model for a water fast following the Puranova regimen
// (water + electrolytes + magnesium + optional black coffee, zero calories).
//
// Grounded in fasting physiology research:
//  - Liver + muscle glycogen (~400–500 g) binds 3–4× its weight in water and
//    is depleted mostly within the first 24–36 h → a front-loaded, exponential
//    "water weight" drop of roughly 3–6.5 lb depending on body size.
//  - Digestive-tract contents clear over the first ~36 h (~1–2.5 lb).
//  - Fat loss accrues from the energy deficit. Resting metabolic rate scales
//    with body mass by a power law (obesity-validated weight-only estimates,
//    e.g. Livingston–Kohlstadt RMR ≈ C · kg^0.43), NOT linearly — a 430 lb
//    body does not burn 2.4× a 180 lb body. Fat covers ~40% of fuel at hour 0,
//    ramping to ~93% once ketosis is established (~24 h).
//
// The model is deliberately presented as a RANGE (low/expected/high): water
// weight varies a lot between people. It also separates "scale loss" from
// "fat loss (keeps off)" because most glycogen-water returns at refeed.
// ---------------------------------------------------------------------------

const LB_PER_KG = 2.20462;
const KCAL_PER_LB_FAT = 3500;

export interface ProjectionPoint {
  hours: number;
  /** Projected total scale-weight loss (lbs) at this hour. */
  expected: number;
  low: number;
  high: number;
  /** Projected absolute weight (lbs) on the expected line. */
  weight: number;
}

export interface ProjectionBreakdown {
  hours: number;
  waterGlycogenLbs: number;
  gutClearanceLbs: number;
  fatLbs: number;
  totalLbs: number;
  /** Estimate of loss that persists after refeed (≈ fat + a little gut). */
  keepsOffLbs: number;
}

/** Total glycogen + bound-water pool, scaled gently with body size. */
function glycogenWaterPool(startLbs: number): number {
  return Math.min(6.5, Math.max(3, startLbs * 0.011));
}

/** Digesta cleared from the gut over the first ~day and a half. */
function gutPool(startLbs: number): number {
  return Math.min(2.5, Math.max(1, startLbs * 0.004));
}

/**
 * Daily energy expenditure (kcal) from weight alone, using a power-law RMR
 * (validated for high body weights) times a light-activity factor for a
 * normal day lived while fasting.
 */
export function estimatedDailyKcal(startLbs: number): number {
  const kg = startLbs / LB_PER_KG;
  const rmr = 270 * Math.pow(kg, 0.43);
  return rmr * 1.15;
}

/**
 * Cumulative fat burned (lbs) by elapsed hour t. The fat fuel fraction ramps
 * 0.4 → 0.93 as ketosis establishes: f(τ) = 0.4 + 0.53(1 − e^(−τ/14)), and
 * this is its closed-form integral times hourly energy burn.
 */
function fatLossLbs(startLbs: number, hours: number): number {
  const kcalPerHour = estimatedDailyKcal(startLbs) / 24;
  // ∫0..t f(τ) dτ = 0.93 t − 0.53·14 (1 − e^(−t/14))
  const integral = 0.93 * hours - 0.53 * 14 * (1 - Math.exp(-hours / 14));
  return (kcalPerHour * integral) / KCAL_PER_LB_FAT;
}

/** Component breakdown of projected loss at elapsed `hours`. */
export function projectionBreakdown(
  startLbs: number,
  hours: number,
): ProjectionBreakdown {
  const h = Math.max(0, hours);
  const waterGlycogenLbs =
    glycogenWaterPool(startLbs) * (1 - Math.exp(-h / 12));
  const gutClearanceLbs = gutPool(startLbs) * (1 - Math.exp(-h / 16));
  const fatLbs = fatLossLbs(startLbs, h);
  const totalLbs = waterGlycogenLbs + gutClearanceLbs + fatLbs;
  return {
    hours: h,
    waterGlycogenLbs,
    gutClearanceLbs,
    fatLbs,
    totalLbs,
    keepsOffLbs: fatLbs + gutClearanceLbs * 0.3,
  };
}

/**
 * The projection curve for a fast: one point per `stepHours` from 0 to
 * `durationHours` (inclusive). Low/high band reflects individual variation in
 * water weight and metabolic rate (~±20%, asymmetric).
 */
export function projectionCurve(
  startLbs: number,
  durationHours: number,
  stepHours = 1,
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  for (let h = 0; h <= durationHours + 1e-9; h += stepHours) {
    const hours = Math.min(h, durationHours);
    const { totalLbs } = projectionBreakdown(startLbs, hours);
    points.push({
      hours,
      expected: totalLbs,
      low: totalLbs * 0.78,
      high: totalLbs * 1.18,
      weight: startLbs - totalLbs,
    });
    if (hours >= durationHours) break;
  }
  return points;
}

/** Milestone markers (default every 4 h) for the projection table/narration. */
export function projectionMarkers(
  startLbs: number,
  durationHours: number,
  everyHours = 4,
): ProjectionBreakdown[] {
  const out: ProjectionBreakdown[] = [];
  for (let h = everyHours; h <= durationHours + 1e-9; h += everyHours) {
    out.push(projectionBreakdown(startLbs, Math.min(h, durationHours)));
  }
  return out;
}
