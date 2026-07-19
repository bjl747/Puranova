import { useEffect, useState } from 'react';
import { useRepo } from '../data/repo';
import { ACHIEVEMENTS } from '../core/achievements';
import type { UnlockedAchievement } from '../core/types';
import './Achievements.css';

export function Achievements() {
  const repo = useRepo();
  const [unlocked, setUnlocked] = useState<Record<string, UnlockedAchievement>>({});

  useEffect(() => {
    repo.listAchievements().then(setUnlocked);
  }, [repo]);

  const count = Object.keys(unlocked).length;

  return (
    <div className="achievements fade-up stack">
      <header>
        <div className="eyebrow">Milestones</div>
        <h1>Badges</h1>
        <p className="muted">
          {count} of {ACHIEVEMENTS.length} unlocked
        </p>
      </header>

      <div className="badge-grid">
        {ACHIEVEMENTS.map((a) => {
          const on = Boolean(unlocked[a.id]);
          return (
            <div key={a.id} className={`badge ${on ? 'badge--on' : ''}`}>
              <div className="badge__icon">{a.icon}</div>
              <div className="badge__name">{a.name}</div>
              <div className="badge__desc muted">{a.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
