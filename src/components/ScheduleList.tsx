// ---------------------------------------------------------------------------
// A day's hydration/coffee schedule with check-off circles and inline time
// editing (which writes per-slot overrides to the profile).
// ---------------------------------------------------------------------------

import { useState } from 'react';
import type { CheckIn, ScheduleEvent } from '../core/types';
import { fmtClock, fmtHHMM } from '../core/time';
import { TimeInput } from './ui/ui';
import './ScheduleList.css';

interface Props {
  events: ScheduleEvent[];
  checkIns: Record<string, CheckIn>;
  now: number;
  onToggle: (event: ScheduleEvent) => void;
  onEditTime?: (templateId: string, hhmm: string) => void;
  editable?: boolean;
}

const ITEM_GLYPH: Record<string, string> = {
  water: '💧',
  lmnt: '🧂',
  magnesium: '🧬',
  coffee: '☕',
};

/** Extract the stable template id (e.g. "cup1") from an event id. */
function templateIdOf(event: ScheduleEvent): string {
  const m = /-d\d+-(.+)$/.exec(event.id);
  return m ? m[1] : event.id;
}

export function ScheduleList({
  events,
  checkIns,
  now,
  onToggle,
  onEditTime,
  editable,
}: Props) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <ul className="schedule-list">
      {events.map((e) => {
        const done = Boolean(checkIns[e.id]?.completedAt);
        const overdue = !done && e.at <= now && !e.informational;
        const tId = templateIdOf(e);
        return (
          <li
            key={e.id}
            className={`sched ${done ? 'sched--done' : ''} ${
              overdue ? 'sched--overdue' : ''
            } ${e.informational ? 'sched--info' : ''}`}
          >
            {!e.informational ? (
              <button
                className={`sched__check ${done ? 'sched__check--on' : ''}`}
                onClick={() => onToggle(e)}
                aria-label={done ? 'Mark incomplete' : 'Mark complete'}
              >
                {done ? '✓' : ''}
              </button>
            ) : (
              <span className="sched__marker-dot" />
            )}

            <div className="sched__body">
              <div className="sched__head">
                <strong>{e.title}</strong>
                <div className="sched__glyphs">
                  {e.items.map((it) => (
                    <span key={it} title={it}>
                      {ITEM_GLYPH[it]}
                    </span>
                  ))}
                </div>
              </div>
              {e.detail && <div className="sched__detail muted">{e.detail}</div>}
            </div>

            <div className="sched__time">
              {editable && !e.informational && editing === e.id ? (
                <TimeInput
                  value={fmtHHMM(
                    new Date(e.at).getHours() * 60 + new Date(e.at).getMinutes(),
                  )}
                  onChange={(v) => {
                    onEditTime?.(tId, v);
                    setEditing(null);
                  }}
                  aria-label="Edit time"
                />
              ) : (
                <button
                  className="sched__time-btn tnum"
                  onClick={() => editable && !e.informational && setEditing(e.id)}
                  disabled={!editable || e.informational}
                >
                  {fmtClock(e.at)}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
