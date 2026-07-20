// All-time weight trend line across every logged weigh-in.
import type { WeighIn } from '../../core/types';

const W = 340;
const H = 160;
const PAD = { l: 38, r: 12, t: 12, b: 22 };

export function WeightTrendChart({ weighIns }: { weighIns: WeighIn[] }) {
  if (weighIns.length < 2) return null;
  const sorted = [...weighIns].sort((a, b) => a.at - b.at);
  const t0 = sorted[0].at;
  const t1 = sorted[sorted.length - 1].at;
  const span = Math.max(1, t1 - t0);
  const ws = sorted.map((w) => w.weightLbs);
  const yMin = Math.min(...ws) - 1;
  const yMax = Math.max(...ws) + 1;

  const x = (at: number) => PAD.l + ((W - PAD.l - PAD.r) * (at - t0)) / span;
  const y = (w: number) =>
    PAD.t + ((H - PAD.t - PAD.b) * (yMax - w)) / (yMax - yMin);

  const path = sorted
    .map((p, i) => `${i ? 'L' : 'M'}${x(p.at).toFixed(1)},${y(p.weightLbs).toFixed(1)}`)
    .join(' ');

  const stepV = yMax - yMin > 12 ? 5 : yMax - yMin > 6 ? 2 : 1;
  const ticks: number[] = [];
  for (let v = Math.ceil(yMin / stepV) * stepV; v <= yMax; v += stepV)
    ticks.push(v);

  const fmtDate = (at: number) =>
    new Date(at).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Weight trend over time"
      style={{ overflow: 'visible' }}
    >
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
      <text x={PAD.l} y={H - 4} fill="var(--text-faint)" fontSize="9">
        {fmtDate(t0)}
      </text>
      <text
        x={W - PAD.r}
        y={H - 4}
        fill="var(--text-faint)"
        fontSize="9"
        textAnchor="end"
      >
        {fmtDate(t1)}
      </text>
      <path
        d={path}
        fill="none"
        stroke="#4dff9e"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 6px rgba(77,255,158,0.55))' }}
      />
      {sorted.map((p, i) => (
        <circle
          key={i}
          cx={x(p.at)}
          cy={y(p.weightLbs)}
          r="3.4"
          fill="#4dff9e"
          stroke="#04231c"
          strokeWidth="1.4"
        />
      ))}
    </svg>
  );
}
