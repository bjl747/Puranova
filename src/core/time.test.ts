import { describe, it, expect } from 'vitest';
import {
  parseHHMM,
  fmtHHMM,
  fmt12h,
  atTimeOnDay,
  wakingWindow,
  fmtDuration,
  fmtCountdown,
  fastDaySpan,
} from './time';

describe('parseHHMM / fmtHHMM', () => {
  it('parses valid times to minutes', () => {
    expect(parseHHMM('00:00')).toBe(0);
    expect(parseHHMM('06:30')).toBe(390);
    expect(parseHHMM('23:59')).toBe(1439);
  });
  it('round-trips through fmtHHMM', () => {
    expect(fmtHHMM(390)).toBe('06:30');
    expect(fmtHHMM(1439)).toBe('23:59');
    expect(fmtHHMM(1440)).toBe('00:00');
  });
  it('throws on malformed / out-of-range input', () => {
    expect(() => parseHHMM('bad')).toThrow();
    expect(() => parseHHMM('24:00')).toThrow();
    expect(() => parseHHMM('12:60')).toThrow();
  });
});

describe('fmt12h', () => {
  it('formats 12-hour clock', () => {
    expect(fmt12h(0)).toBe('12:00 AM');
    expect(fmt12h(390)).toBe('6:30 AM');
    expect(fmt12h(720)).toBe('12:00 PM');
    expect(fmt12h(1200)).toBe('8:00 PM');
  });
});

describe('wakingWindow', () => {
  it('returns [wake, bed] with same-day bedtime', () => {
    expect(wakingWindow({ wakeTime: '06:30', bedTime: '22:00' })).toEqual([
      390, 1320,
    ]);
  });
  it('rolls a post-midnight bedtime to the next day', () => {
    expect(wakingWindow({ wakeTime: '07:00', bedTime: '01:00' })).toEqual([
      420, 1500,
    ]);
  });
});

describe('atTimeOnDay', () => {
  it('resolves a wall-clock time on a given fast day', () => {
    // Monday 2024-01-01 20:00 local
    const start = new Date(2024, 0, 1, 20, 0, 0).getTime();
    const d0cup1 = atTimeOnDay(start, 0, '07:00');
    expect(new Date(d0cup1).getHours()).toBe(7);
    expect(new Date(d0cup1).getDate()).toBe(1);
    const d1cup1 = atTimeOnDay(start, 1, '07:00');
    expect(new Date(d1cup1).getDate()).toBe(2);
  });
});

describe('fmtDuration / fmtCountdown', () => {
  it('formats durations', () => {
    expect(fmtDuration(72 * 3600_000)).toBe('72h 00m');
    expect(fmtDuration(90 * 60_000)).toBe('1h 30m');
    expect(fmtDuration(-5)).toBe('0h 00m');
  });
  it('formats countdowns as HH:MM:SS', () => {
    expect(fmtCountdown(3661_000)).toBe('01:01:01');
    expect(fmtCountdown(0)).toBe('00:00:00');
    expect(fmtCountdown(-10)).toBe('00:00:00');
  });
});

describe('fastDaySpan', () => {
  it('counts calendar days a fast touches', () => {
    const start = new Date(2024, 0, 1, 20, 0).getTime();
    const end72 = start + 72 * 3600_000; // ends Jan 4 20:00
    expect(fastDaySpan(start, end72)).toBe(4); // Jan 1,2,3,4
  });
});
