import { useEffect, useState } from 'react';
import { useRepo } from '../data/repo';
import { useNow } from '../hooks/useNow';
import { useActiveFast } from '../hooks/useActiveFast';
import { ACHIEVEMENTS } from '../core/achievements';
import { ACHIEVEMENTS_UPDATED_EVENT } from '../notify/AchievementHost';
import { BadgeSheet } from '../components/BadgeSheet';
import type { Achievement, Fast, UnlockedAchievement } from '../core/types';
import './Achievements.css';

export function Achievements() {
  const repo = useRepo();
  const { now } = useNow();
  const { elapsedHours } = useActiveFast();
  const [unlocked, setUnlocked] = useState<Record<string, UnlockedAchievement>>({});
  const [fasts, setFasts] = useState<Fast[]>([]);
  const [selected, setSelected] = useState<Achievement | null>(null);

  useEffect(() => {
    const load = () => {
      repo.listAchievements().then(setUnlocked);
      repo.listFasts().then(setFasts);
    };
    load();
    // Refresh in place when the live watcher unlocks a badge mid-fast.
    window.addEventListener(ACHIEVEMENTS_UPDATED_EVENT, load);
    return () => window.removeEventListener(ACHIEVEMENTS_UPDATED_EVENT, load);
  }, [repo]);

  const count = Object.keys(unlocked).length;

  return (
    <div className="achievements fade-up stack">
      <header>
        <div className="eyebrow">Milestones</div>
        <h1>Badges</h1>
        <p className="muted">
          {count} of {ACHIEVEMENTS.length} unlocked · tap any badge for its
          story and your history
        </p>
      </header>

      <div className="badge-grid">
        {ACHIEVEMENTS.map((a) => {
          const on = Boolean(unlocked[a.id]);
          return (
            <button
              key={a.id}
              className={`badge ${on ? 'badge--on' : ''}`}
              onClick={() => setSelected(a)}
            >
              <div className="badge__icon">{a.icon}</div>
              <div className="badge__name">{a.name}</div>
              <div className="badge__desc muted">{a.description}</div>
            </button>
          );
        })}
      </div>

      {selected && (
        <BadgeSheet
          achievement={selected}
          unlocked={unlocked[selected.id]}
          fasts={fasts}
          now={now}
          liveElapsedHours={elapsedHours}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
