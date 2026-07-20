// ---------------------------------------------------------------------------
// Line graph of projected vs actual weight across a fast: a soft low/high
// projection band, the expected line, and glowing dots for real weigh-ins.
// Hand-rolled SVG to match the app's bioluminescent look.
// ---------------------------------------------------------------------------

import { projectionCurve } from '../../core/projection';
import type { WeighIn } from '../../core/types';
import { HOUR } from '../../core/time';

interface Props {
  startWeightLbs: number;
  fastStartAt: number;
  durationHours: number;
  weighIns: WeighIn[]; // any set; the chart filters to the fast window
  nowMs: number;
}

const W = 340;
const H = 190;
const PAD = { l: 38, r: 12, t: 12, b: 24 };

export function WeightChart({
  startWeightLbs,
  fastStartAt,
  durationHours,
  weighIns,
  nowMs,
}: Props) {
  const curve = projectionCurve(startWeightLbs, durationHours, 1);
  const actual = weighIns
    .filter(
      (w) =>
        w.at >= fastStartAt - HOUR &&
        w.at <= fastStartAt + durationHours * HOUR + HOUR,
    )
    .map((w) => ({
      hours: Math.max(0, (w.at - fastStartAt) / HOUR),
      weight: w.weightLbs,
    }))
    .sort((a, b) => a.hours - b.hours);

  // Y domain: cover band + actuals with a little headroom.
  const yVals = [
    startWeightLbs,
    ...curve.map((p) => startWeightLbs - p.high),
    ...actual.map((a) => a.weight),
  ];
  const yMin = Math.min(...yVals) - 1;
  const yMax = Math.max(...yVals) + 1;

  const x = (h: number) =>
    PAD.l + ((W - PAD.l - PAD.r) * h) / durationHours;
  const y = (w: number) =>
    PAD.t + ((H - PAD.t - PAD.b) * (yMax - w)) / (yMax - yMin);

  const expectedPath = curve
    .map((p, i) => `${i ? 'L' : 'M'}${x(p.hours).toFixed(1)},${y(startWeightLbs - p.expected).toFixed(1)}`)
    .join(' ');
  const bandPath =
    curve
      .map((p, i) => `${i ? 'L' : 'M'}${x(p.hours).toFixed(1)},${y(startWeightLbs - p.low).toFixed(1)}`)
      .join(' ') +
    ' ' +
    [...curve]
      .reverse()
      .map((p) => `L${x(p.hours).toFixed(1)},${y(startWeightLbs - p.high).toFixed(1)}`)
      .join(' ') +
    ' Z';
  const actualPath = actual
    .map((a, i) => `${i ? 'L' : 'M'}${x(a.hours).toFixed(1)},${y(a.weight).toFixed(1)}`)
    .join(' ');

  const nowH = Math.min(durationHours, Math.max(0, (nowMs - fastStartAt) / HOUR));

  // Y-axis gridlines: 3 round-number ticks.
  const span = yMax - yMin;
  const step = span > 12 ? 5 : span > 6 ? 2 : 1;
  const ticks: number[] = [];
  for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) ticks.push(v);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Weight: projection versus actual weigh-ins"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="wBand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3ff2e0" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#8b7bff" stopOpacity="0.10" />
        </linearGradient>
      </defs>

      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(v)}
            y2={y(v)}
            stroke="rgba(255,255,255,0.07)"
          />
          <text x={4} y={y(v) + 3} fill="var(--text-faint)" fontSize="9">
            {v}
          </text>
        </g>
      ))}
      {[0, 24, 48, 72]
        .filter((h) => h <= durationHours)
        .map((h) => (
          <text
            key={h}
            x={x(h)}
            y={H - 6}
            fill="var(--text-faint)"
            fontSize="9"
            textAnchor="middle"
          >
            {h}h
          </text>
        ))}

      {/* projection band + expected line */}
      <path d={bandPath} fill="url(#wBand)" />
      <path
        d={expectedPath}
        fill="none"
        stroke="#3ff2e0"
        strokeWidth="1.6"
        strokeDasharray="5 4"
        opacity="0.85"
      />

      {/* now marker */}
      <line
        x1={x(nowH)}
        x2={x(nowH)}
        y1={PAD.t}
        y2={H - PAD.b}
        stroke="rgba(255,255,255,0.25)"
        strokeDasharray="2 3"
      />

      {/* actual line + points */}
      {actual.length > 1 && (
        <path
          d={actualPath}
          fill="none"
          stroke="#4dff9e"
          strokeWidth="2.4"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 6px rgba(77,255,158,0.6))' }}
        />
      )}
      {actual.map((a, i) => (
        <circle
          key={i}
          cx={x(a.hours)}
          cy={y(a.weight)}
          r="4"
          fill="#4dff9e"
          stroke="#04231c"
          strokeWidth="1.5"
          style={{ filter: 'drop-shadow(0 0 8px rgba(77,255,158,0.8))' }}
        />
      ))}
    </svg>
  );
}
