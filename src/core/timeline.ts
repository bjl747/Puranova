// ---------------------------------------------------------------------------
// Merges the hydration/coffee schedule with metabolic stage-transition markers
// and refeed steps into one time-sorted stream for the UI and notifications.
// ---------------------------------------------------------------------------

import type { Fast, ScheduleEvent } from './types';
import { generateSchedule } from './schedule';
import { STAGES } from './stages';
import { HOUR } from './time';
import { fastEndAt } from './refeed';

/** Stage-transition events for each boundary that falls inside the fast. */
export function stageEvents(fast: Fast): ScheduleEvent[] {
  const durationH = (fast.plannedEndAt - fast.startAt) / HOUR;
  const out: ScheduleEvent[] = [];
  for (const s of STAGES) {
    if (s.startHour <= 0) continue; // skip the initial fed-state marker
    if (s.startHour >= durationH) break;
    out.push({
      id: `${fast.id}-stage-${s.id}`,
      fastId: fast.id,
      day: Math.floor(s.startHour / 24),
      at: fast.startAt + s.startHour * HOUR,
      kind: 'stage',
      title: `Entering ${s.name}`,
      detail: s.tagline,
      items: [],
      optional: false,
      informational: true,
    });
  }
  return out;
}

/** The refeed prompt marker at the fast's end. */
export function refeedEvents(fast: Fast): ScheduleEvent[] {
  const end = fastEndAt(fast);
  return [
    {
      id: `${fast.id}-refeed`,
      fastId: fast.id,
      day: Math.floor((end - fast.startAt) / (24 * HOUR)),
      at: end,
      kind: 'refeed',
      title: 'Begin Refeed Protocol',
      detail: 'Break your fast gently — bone broth or a soft-boiled egg.',
      items: [],
      optional: false,
      informational: true,
    },
  ];
}

/** Full merged, sorted timeline. */
export function buildTimeline(
  fast: Fast,
  overrides: Record<string, string> = {},
): ScheduleEvent[] {
  return [
    ...generateSchedule(fast, overrides),
    ...stageEvents(fast),
    ...refeedEvents(fast),
  ].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
}
