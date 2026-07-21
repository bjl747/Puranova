// ---------------------------------------------------------------------------
// Live achievement watcher. While a fast is running, re-evaluates badges as
// elapsed time crosses each milestone and unlocks them immediately — with a
// celebration toast and (if permitted) a notification. The Badges screen
// listens for the dispatched event to refresh in place.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRepo } from '../data/repo';
import { useActiveFast } from '../hooks/useActiveFast';
import { useNow } from '../hooks/useNow';
import { evaluate, achievementById } from '../core/achievements';
import { showNotification } from './notifications';
import './AchievementHost.css';

export const ACHIEVEMENTS_UPDATED_EVENT = 'puranova:achievements-updated';

interface Toast {
  id: string;
  icon: string;
  name: string;
}

export function AchievementHost() {
  const repo = useRepo();
  const { fast, elapsedHours } = useActiveFast();
  const { now } = useNow();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const busyRef = useRef(false);

  // Re-check when the active fast ticks over each 10-minute bucket (cheap,
  // and catches every hour milestone within minutes of crossing it), plus
  // once on mount / fast change.
  const bucket = fast ? Math.floor((elapsedHours * 60) / 10) : -1;

  useEffect(() => {
    if (!fast || busyRef.current) return;
    busyRef.current = true;
    (async () => {
      try {
        const [fasts, have] = await Promise.all([
          repo.listFasts(),
          repo.listAchievements(),
        ]);
        const newly = evaluate(fasts, have, now, elapsedHours);
        for (const id of newly) {
          await repo.unlockAchievement(id, { unlockedAt: now, fastId: fast.id });
          const a = achievementById(id);
          if (a) {
            setToasts((t) => [...t, { id, icon: a.icon, name: a.name }]);
            void showNotification(`Puranova · Badge unlocked!`, {
              body: `${a.icon} ${a.name} — ${a.description}`,
              tag: `badge-${id}`,
            });
            window.setTimeout(
              () => setToasts((t) => t.filter((x) => x.id !== id)),
              5000,
            );
          }
        }
        if (newly.length) {
          window.dispatchEvent(new CustomEvent(ACHIEVEMENTS_UPDATED_EVENT));
        }
      } finally {
        busyRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fast?.id, bucket]);

  if (toasts.length === 0) return null;
  return createPortal(
    <div className="badge-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div className="badge-toast" key={t.id}>
          <span className="badge-toast__icon">{t.icon}</span>
          <div>
            <strong>Badge unlocked!</strong>
            <div className="badge-toast__name">{t.name}</div>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
