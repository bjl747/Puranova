// ---------------------------------------------------------------------------
// Horizontal strip of the fasting stages with a marker at current progress.
// ---------------------------------------------------------------------------

import { stagesForFast } from '../core/stages';
import './StageTimeline.css';

interface Props {
  durationHours: number;
  elapsedHours: number;
}

export function StageTimeline({ durationHours, elapsedHours }: Props) {
  const stages = stagesForFast(durationHours);
  const markerPct = Math.max(
    0,
    Math.min(100, (elapsedHours / durationHours) * 100),
  );

  return (
    <div className="stage-timeline">
      <div className="stage-timeline__bar">
        {stages.map((s) => {
          const startPct = (s.startHour / durationHours) * 100;
          const widthPct =
            ((s.clippedEndHour - s.startHour) / durationHours) * 100;
          const active =
            elapsedHours >= s.startHour && elapsedHours < s.clippedEndHour;
          const done = elapsedHours >= s.clippedEndHour;
          return (
            <div
              key={s.id}
              className={`stage-seg ${active ? 'stage-seg--active' : ''} ${
                done ? 'stage-seg--done' : ''
              }`}
              style={{
                left: `${startPct}%`,
                width: `${widthPct}%`,
                background: done || active ? s.hex : undefined,
                boxShadow: active ? `0 0 12px ${s.hex}` : undefined,
              }}
              title={`${s.name} · ${s.startHour}–${
                s.endHour === Infinity ? '∞' : s.endHour
              }h`}
            />
          );
        })}
        <div
          className="stage-timeline__marker"
          style={{ left: `${markerPct}%` }}
        />
      </div>
      <div className="stage-timeline__labels">
        {stages.map((s) => (
          <div
            key={s.id}
            className="stage-timeline__tick"
            style={{ left: `${(s.startHour / durationHours) * 100}%` }}
          >
            {s.startHour}h
          </div>
        ))}
      </div>
    </div>
  );
}
