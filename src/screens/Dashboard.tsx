import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useActiveFast } from '../hooks/useActiveFast';
import { useNow } from '../hooks/useNow';
import { useRepo } from '../data/repo';
import { CellularHero } from '../components/CellularHero';
import { CountdownRing } from '../components/CountdownRing';
import { heroModeForStage } from '../components/stageVisual';
import { Button, Card, StatTile, Pill } from '../components/ui/ui';
import { fmtCountdown, fmtClock, HOUR } from '../core/time';
import { computeStats } from '../core/stats';
import type { Fast } from '../core/types';
import './Dashboard.css';

export function Dashboard() {
  const { profile } = useProfile();
  const { fast, progress, remainingMs, upcoming, elapsedHours } = useActiveFast();
  const { now } = useNow();
  const navigate = useNavigate();
  const repo = useRepo();
  const [fasts, setFasts] = useState<Fast[]>([]);

  useEffect(() => {
    repo.listFasts().then(setFasts);
  }, [repo, fast?.id, fast?.status]);

  const stats = computeStats(fasts, now);
  const firstName = (profile?.displayName ?? 'Explorer').split(' ')[0];

  // Refeed takes over as the main timer once it begins.
  if (fast && fast.status === 'refeed') {
    const lockEndsAt = fast.refeed?.lockEndsAt;
    const lockActive = Boolean(
      fast.refeed?.brothAt && lockEndsAt && now < lockEndsAt,
    );
    const lockRemaining = lockActive ? (lockEndsAt as number) - now : 0;
    const brothPending = !fast.refeed?.brothAt;
    return (
      <div className="dashboard fade-up">
        <header className="dashboard__greeting">
          <div className="eyebrow" style={{ color: 'var(--accent-amber)' }}>
            Refeed in progress
          </div>
          <h1>Hey, {firstName}</h1>
        </header>

        <Card
          className="active-card"
          onClick={() => navigate(`/fast/${fast.id}/refeed`)}
        >
          <div className="active-card__hero">
            <CellularHero mode="regen" hex="#ffb547" />
          </div>
          <div className="active-card__ring">
            <CountdownRing
              progress={lockActive ? 1 - lockRemaining / (45 * 60_000) : brothPending ? 0 : 1}
              size={220}
              color="#ffb547"
            >
              {lockActive ? (
                <>
                  <div className="ring-label muted">digestion window</div>
                  <div className="ring-time tnum">{fmtCountdown(lockRemaining)}</div>
                  <Pill color="#ffb547">until solid food</Pill>
                </>
              ) : brothPending ? (
                <>
                  <div className="ring-label muted">step 1</div>
                  <div className="ring-time" style={{ fontSize: 24 }}>🍳</div>
                  <Pill color="#ffb547">Break your fast gently</Pill>
                </>
              ) : (
                <>
                  <div className="ring-label muted">unlocked</div>
                  <div className="ring-time" style={{ fontSize: 24 }}>🍽️</div>
                  <Pill color="#4dff9e">Time for your solid meal</Pill>
                </>
              )}
            </CountdownRing>
          </div>
        </Card>

        <Button full glow onClick={() => navigate(`/fast/${fast.id}/refeed`)}>
          Open refeed protocol
        </Button>
      </div>
    );
  }

  if (fast) {
    const mode = heroModeForStage(progress?.current.id);
    const color = progress?.current.hex ?? '#3ff2e0';
    const durationHours = (fast.plannedEndAt - fast.startAt) / HOUR;
    return (
      <div className="dashboard fade-up">
        <header className="dashboard__greeting">
          <div className="eyebrow">Fast in progress</div>
          <h1>Hey, {firstName}</h1>
        </header>

        <Card className="active-card" onClick={() => navigate(`/fast/${fast.id}`)}>
          <div className="active-card__hero">
            <CellularHero mode={mode} hex={color} />
          </div>
          <div className="active-card__ring">
            <CountdownRing progress={progress?.overallPct ?? 0} size={220} color={color}>
              <div className="ring-label muted">remaining</div>
              <div className="ring-time tnum">{fmtCountdown(remainingMs)}</div>
              <Pill color={color}>{progress?.current.name}</Pill>
            </CountdownRing>
          </div>
          <div className="active-card__meta">
            <span className="tnum">{elapsedHours.toFixed(1)}h elapsed</span>
            <span className="tnum">{durationHours}h goal</span>
          </div>
        </Card>

        {upcoming.length > 0 && (
          <Card>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Up next</div>
            {upcoming.slice(0, 2).map((e) => (
              <div className="dash-next" key={e.id}>
                <span className="tnum dash-next__time">{fmtClock(e.at)}</span>
                <span>{e.title}</span>
              </div>
            ))}
          </Card>
        )}

        <Button full glow onClick={() => navigate(`/fast/${fast.id}`)}>
          Open live fast
        </Button>
      </div>
    );
  }

  // Idle state
  return (
    <div className="dashboard fade-up">
      <header className="dashboard__greeting">
        <div className="eyebrow">Ready when you are</div>
        <h1>Hey, {firstName}</h1>
      </header>

      <div className="idle-hero">
        <CellularHero mode="idle" hex="#4dff9e" />
        <div className="idle-hero__overlay">
          <p>Your cells are waiting to regenerate.</p>
        </div>
      </div>

      <Button full glow onClick={() => navigate('/fast/new')}>
        Start a fast
      </Button>

      <div className="stat-row">
        <StatTile
          label="Total fasted"
          value={Math.round(stats.totalHours)}
          unit="h"
          accent="#3ff2e0"
        />
        <StatTile
          label="Longest"
          value={Math.round(stats.longestHours)}
          unit="h"
          accent="#8b7bff"
        />
        <StatTile
          label="Streak"
          value={stats.currentStreakWeeks}
          unit="wk"
          accent="#4dff9e"
        />
      </div>

      {stats.completedCount > 0 && (
        <Button variant="ghost" full onClick={() => navigate('/history')}>
          View history
        </Button>
      )}
    </div>
  );
}
