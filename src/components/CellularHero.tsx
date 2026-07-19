// ---------------------------------------------------------------------------
// Ambient "cellular regeneration" canvas animation. Particles drift, divide,
// and connect; hue and behavior are driven by the current fasting stage.
// Performance-guarded: DPR capped, pauses when hidden, degrades on low FPS or
// prefers-reduced-motion.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

export type HeroMode =
  | 'idle'
  | 'fed'
  | 'burning'
  | 'ketosis'
  | 'autophagy'
  | 'regen';

interface Props {
  mode?: HeroMode;
  hex?: string;
  className?: string;
}

interface Cell {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pulse: number;
  seed: number;
}

const MODE_CONFIG: Record<HeroMode, { count: number; speed: number; debris: number }> = {
  idle: { count: 34, speed: 0.12, debris: 0 },
  fed: { count: 30, speed: 0.1, debris: 0 },
  burning: { count: 40, speed: 0.22, debris: 4 },
  ketosis: { count: 46, speed: 0.28, debris: 3 },
  autophagy: { count: 52, speed: 0.2, debris: 12 },
  regen: { count: 60, speed: 0.32, debris: 6 },
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function CellularHero({ mode = 'idle', hex = '#3ff2e0', className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  const hexRef = useRef(hex);
  modeRef.current = mode;
  hexRef.current = hex;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Stable non-null alias so narrowing survives inside the rAF closures.
    const g: CanvasRenderingContext2D = ctx;

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let cells: Cell[] = [];
    let debris: { x: number; y: number; r: number; life: number }[] = [];
    let raf = 0;
    let lowPerf = reduced;
    let frameSamples: number[] = [];
    let last = 0;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect?.width ?? canvas.clientWidth;
      height = rect?.height ?? canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const rand = (n: number) => {
      // Deterministic-ish variation without Math.random dependence on seed.
      return ((Math.sin(n * 12.9898) * 43758.5453) % 1 + 1) % 1;
    };

    function seed() {
      const cfg = MODE_CONFIG[modeRef.current];
      const target = lowPerf ? Math.min(14, cfg.count) : cfg.count;
      cells = Array.from({ length: target }, (_, i) => ({
        x: rand(i + 1) * width,
        y: rand(i + 99) * height,
        vx: (rand(i + 7) - 0.5) * cfg.speed,
        vy: (rand(i + 31) - 0.5) * cfg.speed,
        r: 3 + rand(i + 3) * 7,
        pulse: rand(i + 5) * Math.PI * 2,
        seed: i,
      }));
      debris = Array.from({ length: lowPerf ? 0 : cfg.debris }, (_, i) => ({
        x: rand(i + 200) * width,
        y: rand(i + 300) * height,
        r: 1.5 + rand(i + 400) * 2,
        life: rand(i + 500),
      }));
    }

    function step(t: number) {
      const cfg = MODE_CONFIG[modeRef.current];
      const [cr, cg, cb] = hexToRgb(hexRef.current);
      const dt = last ? t - last : 16;
      last = t;

      // FPS probe over the first ~2s.
      if (!reduced && frameSamples.length < 120) {
        frameSamples.push(dt);
        if (frameSamples.length === 120) {
          const avg = frameSamples.reduce((a, b) => a + b, 0) / 120;
          if (avg > 33 && !lowPerf) {
            lowPerf = true;
            seed();
          }
        }
      }

      g.clearRect(0, 0, width, height);

      // connective lines
      if (!lowPerf) {
        g.lineWidth = 1;
        for (let i = 0; i < cells.length; i++) {
          for (let j = i + 1; j < cells.length; j++) {
            const a = cells[i];
            const b = cells[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 9000) {
              const alpha = (1 - d2 / 9000) * 0.14;
              g.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
              g.beginPath();
              g.moveTo(a.x, a.y);
              g.lineTo(b.x, b.y);
              g.stroke();
            }
          }
        }
      }

      // debris (autophagy: cells "consume" these)
      for (const d of debris) {
        d.life -= 0.003;
        if (d.life <= 0) {
          d.x = rand(d.x + t) * width;
          d.y = rand(d.y + t * 1.3) * height;
          d.life = 1;
        }
        g.fillStyle = `rgba(150,160,175,${0.18 * d.life})`;
        g.beginPath();
        g.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        g.fill();
      }

      // cells
      for (const c of cells) {
        c.x += c.vx * (reduced ? 0 : 1);
        c.y += c.vy * (reduced ? 0 : 1);
        if (c.x < -20) c.x = width + 20;
        if (c.x > width + 20) c.x = -20;
        if (c.y < -20) c.y = height + 20;
        if (c.y > height + 20) c.y = -20;
        c.pulse += 0.02;
        const glow = 0.55 + Math.sin(c.pulse) * 0.25;
        const rr = c.r * (1 + Math.sin(c.pulse) * 0.08);

        const grad = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, rr * 3);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${glow * 0.9})`);
        grad.addColorStop(0.4, `rgba(${cr},${cg},${cb},${glow * 0.25})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(c.x, c.y, rr * 3, 0, Math.PI * 2);
        g.fill();

        // bright nucleus (regen mode = brighter division cores)
        g.fillStyle =
          cfg.debris && modeRef.current === 'regen'
            ? `rgba(255,255,255,${glow})`
            : `rgba(${cr},${cg},${cb},${glow})`;
        g.beginPath();
        g.arc(c.x, c.y, Math.max(1, rr * 0.35), 0, Math.PI * 2);
        g.fill();
      }

      if (!reduced) raf = requestAnimationFrame(step);
    }

    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        last = 0;
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    if (reduced) {
      // Static single frame.
      step(0);
    } else {
      raf = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
