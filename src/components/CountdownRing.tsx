// ---------------------------------------------------------------------------
// SVG progress ring with a big centered readout. Used for the fast countdown
// and the refeed digestion lock.
// ---------------------------------------------------------------------------

import type { ReactNode } from 'react';

interface Props {
  /** 0..1 progress. */
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children: ReactNode;
  glow?: boolean;
}

export function CountdownRing({
  progress,
  size = 260,
  stroke = 14,
  color = '#3ff2e0',
  trackColor = 'rgba(255,255,255,0.08)',
  glow = true,
  children,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = c * (1 - clamped);

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        margin: '0 auto',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#8b7bff" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.6s ease',
            filter: glow ? `drop-shadow(0 0 10px ${color}88)` : undefined,
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 12%',
        }}
      >
        {children}
      </div>
    </div>
  );
}
