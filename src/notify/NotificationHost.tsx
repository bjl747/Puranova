// ---------------------------------------------------------------------------
// Mounts once inside the signed-in app. Drives the notification scheduler on a
// 15s tick (and on visibility changes) against the active fast's timeline.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import { useActiveFast } from '../hooks/useActiveFast';
import { runScheduler } from './scheduler';

export function NotificationHost() {
  const { timeline } = useActiveFast();
  const timelineRef = useRef(timeline);
  timelineRef.current = timeline;

  useEffect(() => {
    const tick = () => runScheduler(timelineRef.current, Date.now());
    tick();
    const id = window.setInterval(tick, 15_000);
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return null;
}
