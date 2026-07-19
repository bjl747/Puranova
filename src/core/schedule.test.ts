import { describe, it, expect } from 'vitest';
import { generateSchedule, slotTemplates, supplyCount } from './schedule';
import type { Fast } from './types';

const HOUR = 3600_000;

function makeFast(overrides: Partial<Fast> = {}): Fast {
  const startAt = new Date(2024, 0, 1, 20, 0, 0).getTime(); // Mon Jan 1 20:00
  return {
    id: 'F1',
    startAt,
    plannedEndAt: startAt + 72 * HOUR,
    status: 'active',
    weightAtStart: 430,
    containerOz: 40,
    lmntFlavor: 'citrus',
    includeCoffee: true,
    rhythmSnapshot: { wakeTime: '06:30', bedTime: '22:00', workBlocks: [] },
    ...overrides,
  };
}

describe('slotTemplates (430lb / 40oz / wake 06:30 / bed 22:00)', () => {
  const t = slotTemplates(makeFast());
  const byId = Object.fromEntries(t.map((s) => [s.templateId, s]));

  it('produces 5 cups + 2 coffee slots', () => {
    expect(t.filter((s) => s.kind === 'cup')).toHaveLength(5);
    expect(t.filter((s) => s.kind === 'coffee')).toHaveLength(2);
  });
  it('places cups at expected wall-clock minutes', () => {
    expect(byId.cup1.minutes).toBe(7 * 60); // 07:00
    expect(byId.cup4.minutes).toBe(20 * 60); // 20:00 evening dose
    expect(byId.cup5.minutes).toBe(21 * 60 + 30); // 21:30 optional
  });
  it('attaches LMNT + magnesium to cup1 and cup4 only', () => {
    expect(byId.cup1.items).toEqual(['water', 'lmnt', 'magnesium']);
    expect(byId.cup4.items).toEqual(['water', 'lmnt', 'magnesium']);
    expect(byId.cup2.items).toEqual(['water']);
    expect(byId.cup5.items).toEqual(['water']);
    expect(byId.cup5.optional).toBe(true);
  });
  it('keeps coffee slots at or before 14:00', () => {
    for (const c of t.filter((s) => s.kind === 'coffee')) {
      expect(c.minutes).toBeLessThanOrEqual(14 * 60);
    }
  });
});

describe('generateSchedule clipping', () => {
  const events = generateSchedule(makeFast());

  it('emits no cup before the 20:00 start on day 0', () => {
    const day0Cups = events.filter((e) => e.day === 0 && e.kind === 'cup');
    // Only the 20:00 evening cup and 21:30 optional survive on the start day.
    expect(day0Cups.map((e) => e.id)).toEqual(['F1-d0-cup4', 'F1-d0-cup5']);
  });
  it('drops the final evening cup that lands exactly on plannedEnd', () => {
    const ids = events.map((e) => e.id);
    expect(ids).not.toContain('F1-d3-cup4'); // 20:00 Jan4 == end, excluded
    expect(ids).toContain('F1-d3-cup1'); // morning of last day survives
  });
  it('is sorted by time', () => {
    for (let i = 1; i < events.length; i++) {
      expect(events[i].at).toBeGreaterThanOrEqual(events[i - 1].at);
    }
  });
  it('produces deterministic ids that are stable across regeneration', () => {
    const again = generateSchedule(makeFast());
    expect(again.map((e) => e.id)).toEqual(events.map((e) => e.id));
  });
  it('never schedules coffee after 14:00 local', () => {
    for (const e of events.filter((x) => x.kind === 'coffee')) {
      const d = new Date(e.at);
      const mins = d.getHours() * 60 + d.getMinutes();
      expect(mins).toBeLessThanOrEqual(14 * 60);
    }
  });
  it('adds a coffee cutoff marker on coffee days', () => {
    const markers = events.filter((e) => e.kind === 'marker');
    expect(markers.length).toBeGreaterThan(0);
    expect(markers[0].informational).toBe(true);
  });
});

describe('generateSchedule overrides', () => {
  it('applies a per-slot time override to every day', () => {
    const events = generateSchedule(makeFast(), { cup1: '08:15' });
    const cup1s = events.filter((e) => e.id.endsWith('cup1'));
    expect(cup1s.length).toBeGreaterThan(0);
    for (const e of cup1s) {
      const d = new Date(e.at);
      expect(d.getHours()).toBe(8);
      expect(d.getMinutes()).toBe(15);
    }
  });
});

describe('coffee dropped for late wakers', () => {
  it('drops coffee slots that would fall after 14:00', () => {
    const fast = makeFast({
      rhythmSnapshot: { wakeTime: '13:30', bedTime: '23:00', workBlocks: [] },
    });
    // windowStart = 14:00 -> coffee1 ok; coffee2 = 16:00 -> dropped
    const t = slotTemplates(fast);
    const coffees = t.filter((s) => s.kind === 'coffee');
    expect(coffees).toHaveLength(1);
    expect(coffees[0].minutes).toBe(14 * 60);
  });
  it('drops all coffee for very late wakers', () => {
    const fast = makeFast({
      includeCoffee: true,
      rhythmSnapshot: { wakeTime: '15:00', bedTime: '23:30', workBlocks: [] },
    });
    const t = slotTemplates(fast);
    expect(t.filter((s) => s.kind === 'coffee')).toHaveLength(0);
  });
});

describe('cross-midnight bedtime', () => {
  it('carries the optional cup past midnight without error', () => {
    const fast = makeFast({
      rhythmSnapshot: { wakeTime: '07:00', bedTime: '01:00', workBlocks: [] },
    });
    const events = generateSchedule(fast);
    expect(events.length).toBeGreaterThan(0);
    // optional cup is at bed-30m = 00:30 (next calendar day)
    const cup5 = events.find((e) => e.id.endsWith('cup5'));
    expect(cup5).toBeTruthy();
  });
});

describe('n=3 degenerate layout', () => {
  it('lays out 3 cups with no optional buffer', () => {
    const fast = makeFast({ weightAtStart: 200, containerOz: 40 }); // 90/40 -> 3
    const t = slotTemplates(fast);
    const cups = t.filter((s) => s.kind === 'cup');
    expect(cups).toHaveLength(3);
    expect(cups.every((c) => !c.optional)).toBe(true);
    // PM dose on cup 3 (the last cup)
    const cup3 = t.find((s) => s.templateId === 'cup3')!;
    expect(cup3.items).toContain('lmnt');
  });
});

describe('supplyCount', () => {
  it('counts LMNT packets and magnesium across the fast', () => {
    const c = supplyCount(makeFast());
    expect(c.cupsPerDay).toBe(5);
    // 2 dose-cups/day for ~3 full days minus clipped edges
    expect(c.lmntPackets).toBe(c.magnesiumCapsules);
    expect(c.lmntPackets).toBeGreaterThan(0);
  });
});
