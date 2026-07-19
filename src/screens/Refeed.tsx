import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNow } from '../hooks/useNow';
import { useRepo } from '../data/repo';
import { CellularHero } from '../components/CellularHero';
import { CountdownRing } from '../components/CountdownRing';
import { Button, Card } from '../components/ui/ui';
import { Splash } from '../components/Splash';
import { Celebration } from '../components/Celebration';
import {
  refeedSteps,
  startRefeedLock,
  refeedComplete,
} from '../core/refeed';
import { evaluate } from '../core/achievements';
import { fmtCountdown } from '../core/time';
import type { Fast } from '../core/types';
import './Refeed.css';

export function Refeed() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { now } = useNow();
  const repo = useRepo();
  const [fast, setFast] = useState<Fast | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (id) repo.getFast(id).then(setFast);
  }, [repo, id]);

  if (!fast) {
    return <Splash label="Loading…" />;
  }

  const steps = refeedSteps(fast.refeed, now);

  const checkBroth = async () => {
    const patch = startRefeedLock(now);
    await repo.updateFast(fast.id, { refeed: { ...fast.refeed, ...patch } });
    setFast({ ...fast, refeed: { ...fast.refeed, ...patch } });
  };

  const checkMeal = async () => {
    const refeed = { ...fast.refeed, mealAt: now };
    await repo.updateFast(fast.id, { refeed, status: 'completed' });
    const updated = { ...fast, refeed, status: 'completed' as const };
    setFast(updated);

    // Evaluate + unlock achievements over the full completed history.
    const all = await repo.listFasts();
    const merged = all.map((f) => (f.id === updated.id ? updated : f));
    const have = await repo.listAchievements();
    const newly = evaluate(merged, have, now);
    for (const aId of newly) {
      await repo.unlockAchievement(aId, { unlockedAt: now, fastId: updated.id });
    }
    setDone(true);
  };

  if (done || refeedComplete(fast.refeed)) {
    const hours = ((fast.actualEndAt ?? fast.plannedEndAt) - fast.startAt) / 3600_000;
    return (
      <div className="refeed refeed--complete fade-up">
        <Celebration />
        <div className="refeed__celebrate">
          <CellularHero mode="regen" hex="#4dff9e" />
        </div>
        <div className="refeed__complete-content">
          <div className="refeed__badge">✨</div>
          <h1>Fast complete</h1>
          <p className="refeed__big tnum">+{hours.toFixed(1)}h</p>
          <p className="muted">
            Beautifully done. Your cells did real work — now nourish them gently.
          </p>
          <Button glow full onClick={() => navigate('/history')}>
            See your history
          </Button>
          <Button variant="ghost" full onClick={() => navigate('/')}>
            Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="refeed fade-up">
      <header>
        <div className="eyebrow" style={{ color: '#4dff9e' }}>Refeed protocol</div>
        <h1>Break your fast with care</h1>
        <p className="muted">
          How you refeed matters as much as the fast. Follow each step.
        </p>
      </header>

      <div className="refeed__steps">
        {steps.map((s) => (
          <Card
            key={s.id}
            className={`refeed-step ${s.done ? 'refeed-step--done' : ''} ${
              s.available ? 'refeed-step--active' : ''
            }`}
          >
            <div className="refeed-step__num">{s.done ? '✓' : s.index}</div>
            <div className="refeed-step__body">
              <strong>{s.title}</strong>
              <p className="muted">{s.body}</p>

              {s.id === 'lock' && s.available && (
                <div className="refeed-lock">
                  <CountdownRing
                    progress={
                      1 - (s.lockRemainingMs ?? 0) / (45 * 60_000)
                    }
                    size={140}
                    stroke={9}
                    color="#ffb547"
                  >
                    <div className="tnum refeed-lock__time">
                      {fmtCountdown(s.lockRemainingMs ?? 0)}
                    </div>
                    <div className="muted" style={{ fontSize: 11 }}>
                      until solid food
                    </div>
                  </CountdownRing>
                </div>
              )}

              {s.id === 'broth' && s.available && (
                <Button glow onClick={checkBroth}>
                  I’ve had broth / egg
                </Button>
              )}
              {s.id === 'meal' && s.available && (
                <Button glow onClick={checkMeal}>
                  I’ve eaten my meal — finish
                </Button>
              )}
              {s.id === 'meal' && !s.available && !s.done && (
                <div className="refeed-step__locked muted">🔒 Locked until the timer completes</div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
