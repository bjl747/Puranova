// ---------------------------------------------------------------------------
// Schedule generator. Deterministic and pure: the same fast + overrides always
// produces the same event list, so schedules are never persisted — only
// check-ins (keyed by the deterministic event id) and time overrides are.
//
// Layout, anchored to the user's personal rhythm (not fixed clock times):
//   - Waking window = [wake + 30m, bed - 30m]
//   - Cup 1        : window start           + LMNT #1 + Magnesium #1
//   - Cup n-1 / n  : bed - 2h (evening)      + LMNT #2 + Magnesium #2
//   - Cup n (opt.) : bed - 30m               overnight buffer (only when n >= 5)
//   - Middle cups  : evenly spaced, plain water
//   - Coffee       : 1-2 optional black-coffee windows in the morning, each
//                    hard-capped at 14:00 (dropped if it would fall later)
// ---------------------------------------------------------------------------

import type { Fast, ScheduleEvent, ScheduleItem } from './types';
import { cupsPerDay, lastCupIsOptional, doseCupIndices } from './hydration';
import {
  atTimeOnDay,
  fmtHHMM,
  parseHHMM,
  wakingWindow,
  fastDaySpan,
} from './time';

const COFFEE_CUTOFF_MIN = 14 * 60; // 14:00 hard cap for the last coffee

interface SlotTemplate {
  templateId: string; // stable across days, e.g. "cup1", "coffee2"
  minutes: number; // minutes since wake-day midnight (may exceed 1440)
  kind: 'cup' | 'coffee';
  items: ScheduleItem[];
  optional: boolean;
  ounces?: number;
  cupIndex?: number;
  totalCups?: number;
}

/** Build the per-day slot templates (times relative to wake-day midnight). */
export function slotTemplates(fast: Fast): SlotTemplate[] {
  const cups = cupsPerDay(fast.weightAtStart, fast.containerOz);
  const [wake, bed] = wakingWindow(fast.rhythmSnapshot);
  const windowStart = wake + 30;
  const windowEnd = bed - 30;
  const eveningTime = bed - 120; // bed - 2h : the PM dose cup

  const hasOptional = lastCupIsOptional(cups);
  const coreCount = hasOptional ? cups - 1 : cups; // cups in the active spread
  const { pmCup } = doseCupIndices(cups);

  const templates: SlotTemplate[] = [];

  for (let i = 1; i <= cups; i++) {
    const isOptional = hasOptional && i === cups;
    const isAmDose = i === 1;
    const isPmDose = i === pmCup;

    let minutes: number;
    if (i === 1) {
      minutes = windowStart;
    } else if (isOptional) {
      minutes = windowEnd;
    } else if (i === coreCount) {
      minutes = eveningTime;
    } else {
      // Evenly spaced between cup 1 and the PM dose cup.
      const frac = (i - 1) / (coreCount - 1);
      minutes = Math.round(windowStart + frac * (eveningTime - windowStart));
    }

    const items: ScheduleItem[] = ['water'];
    if (isAmDose || isPmDose) items.push('lmnt', 'magnesium');

    templates.push({
      templateId: `cup${i}`,
      minutes,
      kind: 'cup',
      items,
      optional: isOptional,
      ounces: fast.containerOz,
      cupIndex: i,
      totalCups: cups,
    });
  }

  // Black-coffee windows (morning only, hard-capped at 14:00).
  if (fast.includeCoffee) {
    const coffeeSlots = [windowStart, windowStart + 120];
    coffeeSlots.forEach((m, idx) => {
      if (m <= COFFEE_CUTOFF_MIN) {
        templates.push({
          templateId: `coffee${idx + 1}`,
          minutes: m,
          kind: 'coffee',
          items: ['coffee'],
          optional: true,
        });
      }
    });
  }

  return templates.sort((a, b) => a.minutes - b.minutes);
}

/** Resolve a slot's minutes-since-wake-midnight to an epoch on a given day. */
function resolveSlotEpoch(
  startAt: number,
  day: number,
  minutes: number,
  overrideHHMM: string | undefined,
): number {
  const extraDays = Math.floor(minutes / 1440);
  const localMin =
    overrideHHMM !== undefined
      ? parseHHMM(overrideHHMM)
      : minutes - extraDays * 1440;
  return atTimeOnDay(startAt, day + extraDays, fmtHHMM(localMin));
}

/**
 * Generate the hydration/coffee schedule for a fast. Events are clipped to
 * [startAt, plannedEndAt), so partial first and last days trim naturally.
 */
export function generateSchedule(
  fast: Fast,
  overrides: Record<string, string> = {},
): ScheduleEvent[] {
  const templates = slotTemplates(fast);
  const span = fastDaySpan(fast.startAt, fast.plannedEndAt);
  const events: ScheduleEvent[] = [];
  const cups = cupsPerDay(fast.weightAtStart, fast.containerOz);

  let anyCoffeeByDay: Record<number, boolean> = {};

  for (let day = 0; day < span; day++) {
    for (const t of templates) {
      const at = resolveSlotEpoch(
        fast.startAt,
        day,
        t.minutes,
        overrides[t.templateId],
      );
      if (at < fast.startAt || at >= fast.plannedEndAt) continue;

      if (t.kind === 'coffee') anyCoffeeByDay[day] = true;

      events.push({
        id: `${fast.id}-d${day}-${t.templateId}`,
        fastId: fast.id,
        day,
        at,
        kind: t.kind,
        title: eventTitle(t, cups),
        detail: eventDetail(t, fast),
        items: t.items,
        optional: t.optional,
        ounces: t.ounces,
      });
    }

    // Coffee cutoff marker (informational) on days that have coffee.
    if (fast.includeCoffee && anyCoffeeByDay[day]) {
      const at = atTimeOnDay(fast.startAt, day, fmtHHMM(COFFEE_CUTOFF_MIN));
      if (at >= fast.startAt && at < fast.plannedEndAt) {
        events.push({
          id: `${fast.id}-d${day}-cutoff`,
          fastId: fast.id,
          day,
          at,
          kind: 'marker',
          title: 'Coffee cutoff',
          detail: 'No more caffeine past 2:00 PM — protects tonight’s sleep.',
          items: [],
          optional: true,
          informational: true,
        });
      }
    }
  }

  return events.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
}

function eventTitle(t: SlotTemplate, cups: number): string {
  if (t.kind === 'coffee') return 'Black coffee';
  const suffix = t.optional ? ' · optional' : '';
  return `Cup ${t.cupIndex} of ${cups}${suffix}`;
}

function eventDetail(t: SlotTemplate, fast: Fast): string {
  if (t.kind === 'coffee') {
    return 'Black only — no milk, cream, or sugar. Keeps you in the fast.';
  }
  const parts: string[] = [`${t.ounces} oz water`];
  if (t.items.includes('lmnt')) {
    const flavor =
      fast.lmntFlavor === 'watermelon' ? 'Watermelon Salt' : 'Citrus Salt';
    parts.push(`1 LMNT ${flavor} packet`);
  }
  if (t.items.includes('magnesium')) parts.push('1 BioEmblem Magnesium capsule');
  if (t.optional) parts.push('overnight buffer — skip if it disturbs sleep');
  return parts.join(' · ');
}

/** Total LMNT packets and magnesium capsules needed across the whole fast. */
export function supplyCount(fast: Fast): {
  lmntPackets: number;
  magnesiumCapsules: number;
  cupsPerDay: number;
} {
  const events = generateSchedule(fast);
  const lmntPackets = events.filter((e) => e.items.includes('lmnt')).length;
  const magnesiumCapsules = events.filter((e) =>
    e.items.includes('magnesium'),
  ).length;
  return {
    lmntPackets,
    magnesiumCapsules,
    cupsPerDay: cupsPerDay(fast.weightAtStart, fast.containerOz),
  };
}
