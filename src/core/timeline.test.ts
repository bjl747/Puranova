import { describe, it, expect } from 'vitest';
import { buildTimeline, stageEvents, refeedEvents } from './timeline';
import type { Fast } from './types';

const HOUR = 3600_000;

function makeFast(): Fast {
  const startAt = new Date(2024, 0, 1, 20, 0, 0).getTime();
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
  };
}

describe('stageEvents', () => {
  it('emits a marker for each stage boundary inside the fast (skipping hour 0)', () => {
    const evs = stageEvents(makeFast());
    const ids = evs.map((e) => e.id);
    expect(ids).toContain('F1-stage-ketosis'); // 24h boundary
    expect(ids).toContain('F1-stage-regen'); // 56h boundary
    expect(ids).not.toContain('F1-stage-fed'); // hour 0 skipped
    expect(ids).not.toContain('F1-stage-extended'); // 72h == end, not < end
    evs.forEach((e) => expect(e.kind).toBe('stage'));
  });
});

describe('refeedEvents', () => {
  it('places a refeed marker at the fast end', () => {
    const fast = makeFast();
    const [ev] = refeedEvents(fast);
    expect(ev.kind).toBe('refeed');
    expect(ev.at).toBe(fast.plannedEndAt);
  });
});

describe('buildTimeline', () => {
  it('merges cups, stages, and refeed into one sorted stream', () => {
    const t = buildTimeline(makeFast());
    expect(t.some((e) => e.kind === 'cup')).toBe(true);
    expect(t.some((e) => e.kind === 'stage')).toBe(true);
    expect(t.some((e) => e.kind === 'refeed')).toBe(true);
    for (let i = 1; i < t.length; i++) {
      expect(t[i].at).toBeGreaterThanOrEqual(t[i - 1].at);
    }
  });
});
