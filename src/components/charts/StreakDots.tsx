// Dot-calendar of the last N weeks; a week glows if it contains a completed fast.
import type { Fast } from '../../core/types';
import { completedFasts, fastedHours } from '../../core/stats';

const DAY = 86_400_000;

export function StreakDots({
  fasts,
  now,
  weeks = 8,
}: {
  fasts: Fast[];
  now: number;
  weeks?: number;
}) {
  const done = completedFasts(fasts);

  const weekIndex = (ms: number) => {
    const d = new Date(ms);
    const dow = (d.getDay() + 6) % 7;
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow).getTime();
    return Math.floor(monday / (7 * DAY));
  };

  const thisWeek = weekIndex(now);
  const active = new Map<number, number>(); // week -> max hours
  for (const f of done) {
    const wk = weekIndex(f.actualEndAt ?? f.plannedEndAt);
    active.set(wk, Math.max(active.get(wk) ?? 0, fastedHours(f)));
  }

  const cells = Array.from({ length: weeks }, (_, i) => {
    const wk = thisWeek - (weeks - 1 - i);
    return { wk, hours: active.get(wk) ?? 0 };
  });

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {cells.map((c) => {
        const on = c.hours > 0;
        const intensity = Math.min(1, c.hours / 72);
        return (
          <div
            key={c.wk}
            title={on ? `${Math.round(c.hours)}h` : 'no fast'}
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: on
                ? `rgba(77,255,158,${0.25 + intensity * 0.75})`
                : 'var(--surface-strong)',
              border: '1px solid var(--border)',
              boxShadow: on ? '0 0 10px rgba(77,255,158,0.4)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}
