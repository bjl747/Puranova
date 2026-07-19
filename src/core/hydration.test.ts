import { describe, it, expect } from 'vitest';
import {
  dailyOunces,
  cupsPerDay,
  lastCupIsOptional,
  doseCupIndices,
} from './hydration';

describe('dailyOunces', () => {
  it('applies weight * 0.45', () => {
    expect(dailyOunces(430)).toBe(193.5);
    expect(dailyOunces(200)).toBe(90);
  });
});

describe('cupsPerDay', () => {
  it('matches the regimen example (430 lb / 40 oz -> 5 cups)', () => {
    expect(cupsPerDay(430, 40)).toBe(5); // 193.5/40 = 4.84 -> 5
  });
  it('rounds to nearest whole cup', () => {
    expect(cupsPerDay(400, 40)).toBe(5); // 180/40 = 4.5 -> 5 (round half up)
    expect(cupsPerDay(390, 40)).toBe(4); // 175.5/40 = 4.39 -> 4
  });
  it('floors at 3 cups for huge containers', () => {
    expect(cupsPerDay(200, 64)).toBe(3); // 90/64 = 1.4 -> floored to 3
  });
  it('handles zero container defensively', () => {
    expect(cupsPerDay(200, 0)).toBe(3);
  });
});

describe('lastCupIsOptional', () => {
  it('is optional only when 5+ cups', () => {
    expect(lastCupIsOptional(5)).toBe(true);
    expect(lastCupIsOptional(4)).toBe(false);
    expect(lastCupIsOptional(3)).toBe(false);
  });
});

describe('doseCupIndices', () => {
  it('doses the AM cup 1 and the last non-optional cup', () => {
    expect(doseCupIndices(5)).toEqual({ amCup: 1, pmCup: 4 }); // cup5 optional
    expect(doseCupIndices(4)).toEqual({ amCup: 1, pmCup: 4 });
    expect(doseCupIndices(3)).toEqual({ amCup: 1, pmCup: 3 });
  });
});
