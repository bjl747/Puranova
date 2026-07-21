import { describe, it, expect } from 'vitest';
import {
  projectionBreakdown,
  projectionCurve,
  projectionMarkers,
  estimatedDailyKcal,
  calibrationFactor,
  calibratedBreakdown,
  calibratedCurve,
} from './projection';

describe('projectionBreakdown', () => {
  it('is zero at hour 0 and strictly increases', () => {
    expect(projectionBreakdown(430, 0).totalLbs).toBeCloseTo(0);
    let prev = 0;
    for (let h = 4; h <= 72; h += 4) {
      const t = projectionBreakdown(430, h).totalLbs;
      expect(t).toBeGreaterThan(prev);
      prev = t;
    }
  });

  it('components sum to the total', () => {
    const b = projectionBreakdown(430, 48);
    expect(b.waterGlycogenLbs + b.gutClearanceLbs + b.fatLbs).toBeCloseTo(
      b.totalLbs,
    );
  });

  it('matches research ranges: ~180 lb person loses ~3-7 lb over 72h', () => {
    const total = projectionBreakdown(180, 72).totalLbs;
    expect(total).toBeGreaterThan(3);
    expect(total).toBeLessThan(7);
  });

  it('projects a plausibly larger loss for a 430 lb person (7-11 lb / 72h)', () => {
    const total = projectionBreakdown(430, 72).totalLbs;
    expect(total).toBeGreaterThan(7);
    expect(total).toBeLessThan(11);
  });

  it('front-loads water: most of the water pool is gone by 24h', () => {
    const b24 = projectionBreakdown(430, 24);
    const b72 = projectionBreakdown(430, 72);
    expect(b24.waterGlycogenLbs / b72.waterGlycogenLbs).toBeGreaterThan(0.8);
  });

  it('keepsOff is dominated by fat and always below total', () => {
    const b = projectionBreakdown(430, 72);
    expect(b.keepsOffLbs).toBeLessThan(b.totalLbs);
    expect(b.keepsOffLbs).toBeGreaterThan(b.fatLbs);
  });
});

describe('estimatedDailyKcal', () => {
  it('scales sub-linearly with weight (power law, not linear)', () => {
    const k180 = estimatedDailyKcal(180);
    const k430 = estimatedDailyKcal(430);
    expect(k430).toBeGreaterThan(k180);
    expect(k430 / k180).toBeLessThan(430 / 180); // sub-linear
  });
});

describe('projectionCurve', () => {
  it('spans 0..duration inclusive with the band ordered low<expected<high', () => {
    const pts = projectionCurve(430, 72, 4);
    expect(pts[0].hours).toBe(0);
    expect(pts[pts.length - 1].hours).toBe(72);
    for (const p of pts.slice(1)) {
      expect(p.low).toBeLessThan(p.expected);
      expect(p.high).toBeGreaterThan(p.expected);
      expect(p.weight).toBeCloseTo(430 - p.expected);
    }
  });
});

describe('calibrationFactor', () => {
  it('is 1 with no usable weigh-ins', () => {
    expect(calibrationFactor(430, [])).toBe(1);
    // start-of-fast anchor only → no signal
    expect(calibrationFactor(430, [{ hours: 0, weightLbs: 430 }])).toBe(1);
  });

  it('recovers the true factor when losses run ahead of the model', () => {
    // Fabricate weigh-ins that lose exactly 1.3x the modeled amount.
    const samples = [16, 24, 32].map((h) => ({
      hours: h,
      weightLbs: 430 - projectionBreakdown(430, h).totalLbs * 1.3,
    }));
    expect(calibrationFactor(430, samples)).toBeCloseTo(1.3, 2);
  });

  it('recovers a slower-than-model factor too', () => {
    const samples = [20, 30].map((h) => ({
      hours: h,
      weightLbs: 430 - projectionBreakdown(430, h).totalLbs * 0.8,
    }));
    expect(calibrationFactor(430, samples)).toBeCloseTo(0.8, 2);
  });

  it('clamps runaway factors to a physiological range', () => {
    const wild = [{ hours: 24, weightLbs: 380 }]; // -50 lbs in a day
    expect(calibrationFactor(430, wild)).toBe(1.6);
    const reverse = [{ hours: 24, weightLbs: 435 }]; // gained
    expect(calibrationFactor(430, reverse)).toBe(0.6);
  });

  it('down-weights early noisy readings automatically', () => {
    // A crazy hour-1 reading plus two sane later ones → still near 1.
    const samples = [
      { hours: 1, weightLbs: 426 }, // -4 lbs in an hour (scale noise)
      { hours: 24, weightLbs: 430 - projectionBreakdown(430, 24).totalLbs },
      { hours: 32, weightLbs: 430 - projectionBreakdown(430, 32).totalLbs },
    ];
    expect(calibrationFactor(430, samples)).toBeLessThan(1.15);
  });
});

describe('calibratedBreakdown / calibratedCurve', () => {
  it('scales every component and total by k', () => {
    const base = projectionBreakdown(430, 48);
    const cal = calibratedBreakdown(430, 48, 1.3);
    expect(cal.totalLbs).toBeCloseTo(base.totalLbs * 1.3);
    expect(cal.keepsOffLbs).toBeCloseTo(base.keepsOffLbs * 1.3);
    expect(
      cal.waterGlycogenLbs + cal.gutClearanceLbs + cal.fatLbs,
    ).toBeCloseTo(cal.totalLbs);
  });

  it('tightens the band once calibrated', () => {
    const un = projectionCurve(430, 72, 4).at(-1)!;
    const cal = calibratedCurve(430, 72, 1.3, 4).at(-1)!;
    const unSpread = (un.high - un.low) / un.expected;
    const calSpread = (cal.high - cal.low) / cal.expected;
    expect(calSpread).toBeLessThan(unSpread);
  });

  it('k=1 leaves the expected line unchanged', () => {
    const a = projectionCurve(430, 72, 8);
    const b = calibratedCurve(430, 72, 1, 8);
    a.forEach((p, i) => expect(b[i].expected).toBeCloseTo(p.expected));
  });
});

describe('projectionMarkers', () => {
  it('emits a marker every 4 hours across a 72h fast', () => {
    const m = projectionMarkers(430, 72, 4);
    expect(m).toHaveLength(18);
    expect(m[0].hours).toBe(4);
    expect(m[m.length - 1].hours).toBe(72);
  });
  it('supports daily (24h) markers too', () => {
    expect(projectionMarkers(430, 72, 24)).toHaveLength(3);
  });
});
