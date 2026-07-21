// ---------------------------------------------------------------------------
// Badge detail popup: the milestone's story, unlock state, progress toward it,
// and the user's personal history of every time they've hit it.
// ---------------------------------------------------------------------------

import { createPortal } from 'react-dom';
import type {
  Achievement,
  Fast,
  UnlockedAchievement,
} from '../core/types';
import { achievementHistory } from '../core/achievements';
import './BadgeSheet.css';

interface Props {
  achievement: Achievement;
  unlocked?: UnlockedAchievement;
  fasts: Fast[];
  now: number;
  liveElapsedHours: number;
  onClose: () => void;
}

function fmtDate(at: number): string {
  return new Date(at).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BadgeSheet({
  achievement: a,
  unlocked,
  fasts,
  now,
  liveElapsedHours,
  onClose,
}: Props) {
  const { hits, progress } = achievementHistory(a, fasts, now, liveElapsedHours);
  const pct = progress.target > 0 ? progress.current / progress.target : 0;
  const isUnlocked = Boolean(unlocked);

  return createPortal(
    <div className="badge-overlay" onClick={onClose}>
      <div
        className="badge-sheet glass"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${a.name} badge details`}
      >
        <div className="badge-sheet__grab" aria-hidden="true" />

        <div className={`badge-sheet__hero ${isUnlocked ? 'on' : ''}`}>
          <span className="badge-sheet__icon">{a.icon}</span>
          <h2>{a.name}</h2>
          <p className="badge-sheet__desc">{a.description}</p>
          {isUnlocked ? (
            <span className="badge-sheet__state badge-sheet__state--on">
              ✓ Unlocked {fmtDate(unlocked!.unlockedAt)}
            </span>
          ) : (
            <span className="badge-sheet__state">🔒 Locked</span>
          )}
        </div>

        <div className="badge-sheet__section">
          <div className="eyebrow">The milestone</div>
          <p className="badge-sheet__explain">{a.explanation}</p>
        </div>

        {!isUnlocked && progress.unit !== 'done' && (
          <div className="badge-sheet__section">
            <div className="eyebrow">Your progress</div>
            <div className="badge-progress">
              <div className="badge-progress__bar">
                <span style={{ width: `${Math.min(100, pct * 100)}%` }} />
              </div>
              <span className="badge-progress__label tnum">
                {progress.unit === 'h'
                  ? `${progress.current.toFixed(0)} / ${progress.target}h`
                  : `${progress.current} / ${progress.target} ${progress.unit}`}
              </span>
            </div>
          </div>
        )}

        <div className="badge-sheet__section">
          <div className="eyebrow">
            Times you’ve hit this ({hits.length})
          </div>
          {hits.length === 0 ? (
            <p className="muted badge-sheet__none">
              Not yet — your first time will be listed here.
            </p>
          ) : (
            <ul className="badge-hits">
              {hits.map((h) => (
                <li key={`${h.fastId}-${h.inProgress}`}>
                  <span className="badge-hits__date">{fmtDate(h.at)}</span>
                  <span className="badge-hits__hours tnum">
                    {h.hours.toFixed(h.hours >= 10 ? 0 : 1)}h fast
                  </span>
                  {h.inProgress && (
                    <span className="badge-hits__live">● in progress</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button className="badge-sheet__close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}
