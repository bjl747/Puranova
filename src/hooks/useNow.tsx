// ---------------------------------------------------------------------------
// Ticking clock with an optional demo "time-travel" offset. The offset lets
// demo users fast-forward through fasting stages without waiting in real time.
// ---------------------------------------------------------------------------

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface NowState {
  now: number;
  offsetMs: number;
  addHours: (h: number) => void;
  reset: () => void;
}

const NowContext = createContext<NowState | null>(null);

const OFFSET_KEY = 'puranova:time-offset';

export function NowProvider({
  children,
  tickMs = 1000,
}: {
  children: ReactNode;
  tickMs?: number;
}) {
  const [offsetMs, setOffsetMs] = useState<number>(() => {
    const raw = Number(localStorage.getItem(OFFSET_KEY));
    return Number.isFinite(raw) ? raw : 0;
  });
  const [now, setNow] = useState(() => Date.now() + offsetMs);
  const offsetRef = useRef(offsetMs);
  offsetRef.current = offsetMs;

  useEffect(() => {
    const tick = () => setNow(Date.now() + offsetRef.current);
    tick();
    const id = window.setInterval(tick, tickMs);
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [tickMs]);

  const addHours = useCallback((h: number) => {
    setOffsetMs((prev) => {
      const next = prev + h * 3600_000;
      localStorage.setItem(OFFSET_KEY, String(next));
      return next;
    });
    setNow(Date.now() + offsetRef.current + h * 3600_000);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(OFFSET_KEY);
    setOffsetMs(0);
    setNow(Date.now());
  }, []);

  return (
    <NowContext.Provider value={{ now, offsetMs, addHours, reset }}>
      {children}
    </NowContext.Provider>
  );
}

export function useNow(): NowState {
  const ctx = useContext(NowContext);
  if (!ctx) throw new Error('useNow must be used within NowProvider');
  return ctx;
}
