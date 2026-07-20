import { describe, it, expect } from 'vitest';
import { stageAt, stagesForFast, stageProgress, STAGES } from './stages';

describe('stageAt', () => {
  it('maps elapsed hours to the correct stage at boundaries', () => {
    expect(stageAt(0).id).toBe('fed');
    expect(stageAt(3.99).id).toBe('fed');
    expect(stageAt(4).id).toBe('early');
    expect(stageAt(12).id).toBe('glycogen');
    expect(stageAt(18).id).toBe('switch');
    expect(stageAt(23.99).id).toBe('switch');
    expect(stageAt(24).id).toBe('ketosis');
    expect(stageAt(36).id).toBe('autophagy');
    expect(stageAt(48).id).toBe('deep');
    expect(stageAt(56).id).toBe('regen');
    expect(stageAt(71.99).id).toBe('regen');
    expect(stageAt(72).id).toBe('extended');
    expect(stageAt(200).id).toBe('extended');
  });
  it('clamps negative to fed', () => {
    expect(stageAt(-5).id).toBe('fed');
  });
});

describe('stagesForFast', () => {
  it('returns only stages that begin before the fast ends, last clipped', () => {
    const s24 = stagesForFast(24);
    expect(s24.map((s) => s.id)).toEqual([
      'fed',
      'early',
      'glycogen',
      'switch',
    ]);
    // switch stage clipped exactly to 24h
    expect(s24[s24.length - 1].clippedEndHour).toBe(24);
    expect(s24[s24.length - 1].reached).toBe(true);
  });
  it('includes the extended stage for a 96h fast', () => {
    const s96 = stagesForFast(96);
    expect(s96.map((s) => s.id)).toContain('extended');
    expect(s96[s96.length - 1].clippedEndHour).toBe(96);
  });
  it('72h fast ends exactly at the regen boundary', () => {
    const s72 = stagesForFast(72);
    expect(s72.map((s) => s.id)).not.toContain('extended');
    expect(s72[s72.length - 1].id).toBe('regen');
  });
  it('always returns at least the fed stage', () => {
    expect(stagesForFast(0).map((s) => s.id)).toEqual(['fed']);
  });
});

describe('stageProgress', () => {
  it('computes hours to the next stage', () => {
    const p = stageProgress(20, 72);
    expect(p.current.id).toBe('switch');
    expect(p.next?.id).toBe('ketosis');
    expect(p.hoursToNext).toBeCloseTo(4); // 24 - 20
    expect(p.overallPct).toBeCloseTo(20 / 72);
  });
  it('handles the terminal stage (no next)', () => {
    const p = stageProgress(80, 72);
    expect(p.current.id).toBe('extended');
    expect(p.next).toBeNull();
    expect(p.hoursToNext).toBeNull();
    expect(p.overallPct).toBe(1);
  });
  it('stagePct progresses within a stage', () => {
    const p = stageProgress(30, 72); // ketosis 24-36, halfway
    expect(p.stagePct).toBeCloseTo(0.5);
  });
});

describe('STAGES table integrity', () => {
  it('is contiguous with no gaps', () => {
    for (let i = 1; i < STAGES.length; i++) {
      expect(STAGES[i].startHour).toBe(STAGES[i - 1].endHour);
    }
    expect(STAGES[STAGES.length - 1].endHour).toBe(Infinity);
  });

  it('every stage has complete, non-empty expectation copy', () => {
    for (const s of STAGES) {
      expect(s.feeling.length).toBeGreaterThan(10);
      for (const key of ['hunger', 'head', 'stomach', 'energy', 'mind'] as const) {
        expect(s.expect[key].length, `${s.id}.${key}`).toBeGreaterThan(20);
      }
    }
  });
});
