// Hand-rolled SVG bar chart of recent fast durations.
import type { Fast } from '../../core/types';
import { recentFastHours } from '../../core/stats';

export function HoursBarChart({ fasts, n = 10 }: { fasts: Fast[]; n?: number }) {
  const data = recentFastHours(fasts, n);
  if (data.length === 0) return null;

  const w = 320;
  const h = 140;
  const pad = 20;
  const max = Math.max(72, ...data.map((d) => d.hours));
  const barW = (w - pad * 2) / data.length;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      role="img"
      aria-label="Recent fast durations"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#3ff2e0" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#4dff9e" />
        </linearGradient>
      </defs>
      {[24, 48, 72].map((mark) =>
        mark <= max ? (
          <g key={mark}>
            <line
              x1={pad}
              x2={w - pad}
              y1={h - pad - ((h - pad * 2) * mark) / max}
              y2={h - pad - ((h - pad * 2) * mark) / max}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="3 4"
            />
            <text
              x={2}
              y={h - pad - ((h - pad * 2) * mark) / max + 3}
              fill="var(--text-faint)"
              fontSize="8"
            >
              {mark}
            </text>
          </g>
        ) : null,
      )}
      {data.map((d, i) => {
        const bh = ((h - pad * 2) * d.hours) / max;
        return (
          <rect
            key={d.fast.id}
            x={pad + i * barW + barW * 0.18}
            y={h - pad - bh}
            width={barW * 0.64}
            height={bh}
            rx={3}
            fill="url(#barGrad)"
          />
        );
      })}
    </svg>
  );
}
