// ---------------------------------------------------------------------------
// Hydration & electrolyte math.
//   F_daily (oz) = weightLbs * 0.45
//   cups/day     = round(F_daily / containerOz), floored at 3
// Example from the regimen: 430 lb, 40 oz container -> 193.5 oz -> ~5 cups.
// ---------------------------------------------------------------------------

/** Modified high-end baseline fluid target in ounces for a body weight. */
export function dailyOunces(weightLbs: number): number {
  return weightLbs * 0.45;
}

/**
 * Number of container-cups per day. Rounded to the nearest whole cup and
 * floored at 3 so very large containers still yield a usable schedule.
 */
export function cupsPerDay(weightLbs: number, containerOz: number): number {
  if (containerOz <= 0) return 3;
  const raw = dailyOunces(weightLbs) / containerOz;
  return Math.max(3, Math.round(raw));
}

/**
 * The optional "overnight buffer" final cup only exists when there are 5+ cups.
 * With fewer cups every cup is part of the core waking-hours schedule.
 */
export function lastCupIsOptional(cups: number): boolean {
  return cups >= 5;
}

/** How LMNT + magnesium doses map onto the day: cup 1 (AM) and cup n-1 (PM). */
export function doseCupIndices(cups: number): { amCup: number; pmCup: number } {
  // AM dose on the first cup; PM dose on the last *non-optional* cup.
  const lastCore = lastCupIsOptional(cups) ? cups - 1 : cups;
  return { amCup: 1, pmCup: lastCore };
}
