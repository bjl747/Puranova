// ---------------------------------------------------------------------------
// Journey tab: a vertical map of the fast. Shows where you are right now and
// lets you tap ANY phase — past or upcoming — to see what to expect (hunger,
// head, stomach & bowels, energy, mind) plus the science of what's happening.
// Works during a fast (live position) and between fasts (72h reference map).
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveFast } from '../hooks/useActiveFast';
import { stagesForFast } from '../core/stages';
import { fmtDuration, HOUR } from '../core/time';
import { Button, Pill } from '../components/ui/ui';
import type { StageExpectations } from '../core/types';
import './Journey.css';

const DIMENSIONS: { key: keyof StageExpectations; icon: string; label: string }[] = [
  { key: 'hunger', icon: '🍽️', label: 'Hunger' },
  { key: 'head', icon: '🤕', label: 'Head feel' },
  { key: 'stomach', icon: '🫄', label: 'Stomach & bowels' },
  { key: 'energy', icon: '⚡', label: 'Energy' },
  { key: 'mind', icon: '🧠', label: 'Mind & clarity' },
];

export function Journey() {
  const { fast, elapsedHours, progress } = useActiveFast();
  const navigate = useNavigate();

  const live = Boolean(fast);
  const durationHours = fast
    ? (fast.plannedEndAt - fast.startAt) / HOUR
    : 72;
  const stages = stagesForFast(durationHours);
  const currentId = live ? progress?.current.id : null;

  const [open, setOpen] = useState<string | null>(null);
  const openId = open ?? currentId ?? stages[0].id;

  return (
    <div className="journey fade-up">
      <header>
        <div className="eyebrow">{live ? 'Fast in progress' : 'The road map'}</div>
        <h1>Your journey</h1>
        {live && progress ? (
          <p className="muted">
            {fmtDuration(elapsedHours * HOUR)} in ·{' '}
            <span style={{ color: progress.current.hex, fontWeight: 700 }}>
              {progress.current.name}
            </span>
            {progress.next && progress.hoursToNext != null && (
              <>
                {' '}
                · next phase in{' '}
                <span className="tnum">{progress.hoursToNext.toFixed(1)}h</span>
              </>
            )}
          </p>
        ) : (
          <p className="muted">
            The full 72-hour path. Tap any phase to see what to expect — start a
            fast and this page tracks you live.
          </p>
        )}
      </header>

      <ol className="journey-track">
        {stages.map((s) => {
          const done = live && elapsedHours >= s.clippedEndHour;
          const isCurrent = s.id === currentId;
          const upcoming = live && !done && !isCurrent;
          const isOpen = s.id === openId;
          const hoursUntil = live ? Math.max(0, s.startHour - elapsedHours) : null;

          return (
            <li
              key={s.id}
              className={`jstage ${isCurrent ? 'jstage--current' : ''} ${
                done ? 'jstage--done' : ''
              }`}
            >
              <span
                className="jstage__node"
                style={{
                  background: done || isCurrent ? s.hex : undefined,
                  boxShadow: isCurrent ? `0 0 14px ${s.hex}` : undefined,
                }}
              >
                {done ? '✓' : ''}
              </span>

              <div className="jstage__card">
                <button
                  className="jstage__head"
                  onClick={() => setOpen(isOpen ? '' : s.id)}
                  aria-expanded={isOpen}
                >
                  <div className="jstage__title">
                    <span className="jstage__hours tnum" style={{ color: s.hex }}>
                      {s.startHour}
                      {s.endHour === Infinity
                        ? 'h+'
                        : `–${s.clippedEndHour}h`}
                    </span>
                    <strong>{s.name}</strong>
                    <span className="muted jstage__tag">{s.tagline}</span>
                  </div>
                  <div className="jstage__status">
                    {isCurrent && <Pill color={s.hex}>Now</Pill>}
                    {upcoming && hoursUntil != null && hoursUntil > 0 && (
                      <span className="muted tnum jstage__eta">
                        in {hoursUntil.toFixed(1)}h
                      </span>
                    )}
                    <span className="jstage__chev">{isOpen ? '−' : '+'}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="jstage__body">
                    <div className="jstage__science">
                      <div className="jstage__dim-label">🔬 What's happening</div>
                      <p>{s.body}</p>
                    </div>
                    {DIMENSIONS.map((d) => (
                      <div className="jstage__dim" key={d.key}>
                        <div className="jstage__dim-label">
                          {d.icon} {d.label}
                        </div>
                        <p>{s.expect[d.key]}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {!live && (
        <Button full glow onClick={() => navigate('/fast/new')}>
          Start this journey
        </Button>
      )}
    </div>
  );
}
