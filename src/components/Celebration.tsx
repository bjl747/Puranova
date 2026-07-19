// One-shot particle burst for the fast-completion moment. Pure canvas, no deps.
// Respects prefers-reduced-motion (renders nothing).
import { useEffect, useRef } from 'react';

const COLORS = ['#4dff9e', '#3ff2e0', '#8b7bff', '#ffb547', '#ff6b9d'];

export function Celebration() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const g = ctx;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = (canvas.width = window.innerWidth * dpr);
    const h = (canvas.height = window.innerHeight * dpr);
    g.scale(dpr, dpr);
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const originX = vw / 2;
    const originY = vh * 0.4;
    const parts = Array.from({ length: 90 }, (_, i) => {
      const angle = (i / 90) * Math.PI * 2 + Math.sin(i) * 0.4;
      const speed = 3 + ((i * 37) % 60) / 12;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        r: 2 + ((i * 13) % 30) / 8,
        color: COLORS[i % COLORS.length],
        life: 1,
      };
    });

    let raf = 0;
    let frame = 0;
    const tick = () => {
      frame++;
      g.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of parts) {
        p.vy += 0.12; // gravity
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.012;
        if (p.life > 0) {
          alive = true;
          g.globalAlpha = Math.max(0, p.life);
          g.fillStyle = p.color;
          g.beginPath();
          g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.globalAlpha = 1;
      if (alive && frame < 400) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        pointerEvents: 'none',
      }}
    />
  );
}
