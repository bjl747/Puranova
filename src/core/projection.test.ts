import { describe, it, expect } from 'vitest';
import {
  projectionBreakdown,
  projectionCurve,
  projectionMarkers,
  estimatedDailyKcal,
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
