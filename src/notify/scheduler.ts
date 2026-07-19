// ---------------------------------------------------------------------------
// In-app notification scheduler. Watches the merged timeline and fires each
// event exactly once when it becomes due, deduped via a localStorage set so a
// reload or a second tab doesn't double-fire.
// ---------------------------------------------------------------------------

import type { ScheduleEvent } from '../core/types';
import { showNotification } from './notifications';

const FIRED_KEY = 'puranova:fired-notifications';
const GRACE_MS = 90_000; // don't fire events that are already this stale

function firedSet(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FIRED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}
function persistFired(set: Set<string>) {
  // Keep the set bounded.
  const arr = Array.from(set).slice(-400);
  localStorage.setItem(FIRED_KEY, JSON.stringify(arr));
}

function bodyFor(e: ScheduleEvent): { title: string; body: string } {
  switch (e.kind) {
    case 'stage':
      return { title: `Puranova · ${e.title}`, body: e.detail ?? '' };
    case 'refeed':
      return { title: 'Puranova · Refeed time', body: e.detail ?? '' };
    case 'coffee':
      return { title: 'Puranova · Black coffee window', body: e.detail ?? '' };
    case 'marker':
      return { title: `Puranova · ${e.title}`, body: e.detail ?? '' };
    default:
      return { title: `Puranova · ${e.title}`, body: e.detail ?? 'Time to hydrate.' };
  }
}

/**
 * Fire notifications for any timeline events that became due at or before `now`
 * and haven't fired yet. Returns the number fired.
 */
export function runScheduler(timeline: ScheduleEvent[], now: number): number {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return 0;
  }
  const fired = firedSet();
  let count = 0;
  for (const e of timeline) {
    if (fired.has(e.id)) continue;
    if (e.at > now) continue;
    if (now - e.at > GRACE_MS) {
      // Missed while the app was closed — mark fired without notifying so the
      // catch-up UI (not a burst of stale alerts) handles it.
      fired.add(e.id);
      continue;
    }
    const { title, body } = bodyFor(e);
    void showNotification(title, { body, tag: e.id });
    fired.add(e.id);
    count++;
  }
  if (count > 0 || fired.size !== firedSet().size) persistFired(fired);
  return count;
}
