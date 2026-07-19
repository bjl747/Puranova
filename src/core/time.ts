// ---------------------------------------------------------------------------
// Time utilities. All schedule times are treated as WALL-CLOCK LOCAL times.
// We deliberately avoid a date library; epoch-ms + local Date fields are enough.
// ---------------------------------------------------------------------------

export const MINUTE = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

/** Parse "HH:mm" into minutes-since-midnight. Throws on malformed input. */
export function parseHHMM(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) throw new Error(`Invalid time string: "${s}"`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) {
    throw new Error(`Time out of range: "${s}"`);
  }
  return h * 60 + min;
}

/** Format minutes-since-midnight as "HH:mm" (24h). */
export function fmtHHMM(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Format a time as a human 12-hour clock, e.g. "6:30 AM". */
export function fmt12h(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  let h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(min).padStart(2, '0')} ${ampm}`;
}

/** Format an epoch-ms timestamp as a local 12-hour clock. */
export function fmtClock(at: number): string {
  const d = new Date(at);
  return fmt12h(d.getHours() * 60 + d.getMinutes());
}

/**
 * Given a fast's start timestamp, return the epoch-ms for `timeStr` (HH:mm)
 * on calendar day `dayOffset` relative to the start's local calendar date.
 * Uses local time so DST shifts stay wall-clock-correct.
 */
export function atTimeOnDay(
  startAt: number,
  dayOffset: number,
  timeStr: string,
): number {
  const minutes = parseHHMM(timeStr);
  const base = new Date(startAt);
  const d = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + dayOffset,
    Math.floor(minutes / 60),
    minutes % 60,
    0,
    0,
  );
  return d.getTime();
}

/**
 * Compute the waking window for a rhythm, in minutes-since-midnight, resolving
 * a bedtime that is "before" wake time as belonging to the next day.
 * Returns [wakeMin, bedMin] where bedMin may exceed 1440 (next-day bedtime).
 */
export function wakingWindow(rhythm: {
  wakeTime: string;
  bedTime: string;
}): [number, number] {
  const wake = parseHHMM(rhythm.wakeTime);
  let bed = parseHHMM(rhythm.bedTime);
  if (bed <= wake) bed += 1440; // bedtime after midnight
  return [wake, bed];
}

/** Format a duration in ms as "72h 00m" style. */
export function fmtDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / MINUTE));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** Format a duration as compact HH:MM:SS for live countdowns. */
export function fmtCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Number of calendar days a fast spans (for day iteration). */
export function fastDaySpan(startAt: number, endAt: number): number {
  const start = new Date(startAt);
  const startMidnight = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  ).getTime();
  return Math.floor((endAt - startMidnight) / DAY) + 1;
}
