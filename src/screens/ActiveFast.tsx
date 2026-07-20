import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useActiveFast } from '../hooks/useActiveFast';
import { useProfile } from '../hooks/useProfile';
import { useNow } from '../hooks/useNow';
import { useAuth } from '../hooks/useAuth';
import { useRepo } from '../data/repo';
import { CellularHero } from '../components/CellularHero';
import { CountdownRing } from '../components/CountdownRing';
import { StageTimeline } from '../components/StageTimeline';
import { ScheduleList } from '../components/ScheduleList';
import { heroModeForStage } from '../components/stageVisual';
import { Button, Card, Pill } from '../components/ui/ui';
import { useNotificationPermission } from '../notify/notifications';
import { Splash } from '../components/Splash';
import { useSpeech } from '../hooks/useSpeech';
import { buildNarration } from '../core/narration';
import { WeighInSheet } from '../components/WeighInSheet';
import { WeightChart } from '../components/charts/WeightChart';
import { projectionBreakdown } from '../core/projection';
import { fmtCountdown, fmtDuration, HOUR } from '../core/time';
import type { ScheduleEvent, WeighIn } from '../core/types';
import { useEffect } from 'react';
import './ActiveFast.css';

const NOTIF_PROMPT_DISMISSED = 'puranova:notif-prompt-dismissed';

function sameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function ActiveFast() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDemo } = useAuth();
  const { now, addHours, offsetMs, reset } = useNow();
  const { profile, save } = useProfile();
  const repo = useRepo();
  const {
    fast,
    checkIns,
    schedule,
    elapsedHours,
    remainingMs,
    progress,
    overdue,
  } = useActiveFast();

  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [menu, setMenu] = useState(false);
  const [weighing, setWeighing] = useState(false);
  const [weighIns, setWeighIns] = useState<WeighIn[]>([]);

  useEffect(() => {
    const unsub = repo.watchWeighIns(setWeighIns);
    return unsub;
  }, [repo]);

  const { speak, stop: stopSpeech, speaking, supported: speechSupported } =
    useSpeech();
  const { permission, request, supported } = useNotificationPermission();
  const [notifDismissed, setNotifDismissed] = useState(
    () => localStorage.getItem(NOTIF_PROMPT_DISMISSED) === '1',
  );
  const showNotifPrompt =
    supported && permission === 'default' && !notifDismissed;
  const dismissNotif = () => {
    localStorage.setItem(NOTIF_PROMPT_DISMISSED, '1');
    setNotifDismissed(true);
  };

  if (!fast || fast.id !== id) {
    return <Splash label="Loading your fast…" />;
  }

  const durationHours = (fast.plannedEndAt - fast.startAt) / HOUR;
  const finished = now >= fast.plannedEndAt || fast.status === 'refeed';
  const mode = heroModeForStage(progress?.current.id);
  const color = progress?.current.hex ?? '#3ff2e0';

  const toggleCheck = (e: ScheduleEvent) => {
    const done = Boolean(checkIns[e.id]?.completedAt);
    repo.setCheckIn(fast.id, {
      id: e.id,
      fastId: fast.id,
      scheduledAt: e.at,
      completedAt: done ? undefined : now,
    });
  };

  const editTime = (templateId: string, hhmm: string) => {
    save({
      timeOverrides: { ...(profile?.timeOverrides ?? {}), [templateId]: hhmm },
    });
  };

  const startRefeed = async () => {
    await repo.updateFast(fast.id, {
      status: 'refeed',
      actualEndAt: Math.min(now, fast.plannedEndAt) === now ? now : fast.plannedEndAt,
    });
    navigate(`/fast/${fast.id}/refeed`);
  };

  const endEarly = async () => {
    await repo.updateFast(fast.id, { status: 'refeed', actualEndAt: now });
    navigate(`/fast/${fast.id}/refeed`);
  };

  const abandon = async () => {
    await repo.updateFast(fast.id, { status: 'abandoned', actualEndAt: now });
    navigate('/', { replace: true });
  };

  const visible = showAll
    ? schedule
    : schedule.filter((e) => sameDay(e.at, now) || e.at > now);
  const todayVisible = visible.filter((e) => sameDay(e.at, now));
  const listEvents = showAll ? schedule : todayVisible;

  return (
    <div className="active-fast fade-up">
      <div className="active-fast__bg">
        <CellularHero mode={mode} hex={color} />
      </div>

      <header className="active-fast__top">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="Back">
          ‹
        </button>
        <Pill color={color}>{progress?.current.tagline}</Pill>
        <button className="icon-btn" onClick={() => setMenu((m) => !m)} aria-label="Menu">
          ⋯
        </button>
      </header>

      {menu && (
        <Card className="active-menu">
          <button onClick={endEarly}>End fast &amp; start refeed</button>
          <button className="danger" onClick={abandon}>
            Abandon fast
          </button>
          <button onClick={() => setMenu(false)}>Cancel</button>
        </Card>
      )}

      <div className="active-fast__ring glass-card">
        <CountdownRing progress={progress?.overallPct ?? 0} size={280} color={color}>
          <div className="ring-label muted">{finished ? 'goal reached' : 'remaining'}</div>
          <div
            className="ring-time tnum"
            role="timer"
            aria-live="off"
            aria-label={`${fmtDuration(remainingMs)} remaining`}
          >
            {fmtCountdown(remainingMs)}
          </div>
          <div className="ring-elapsed tnum muted">
            {fmtDuration(now - fast.startAt)} elapsed
          </div>
        </CountdownRing>
      </div>

      <Card className="stage-card" onClick={() => setExpanded((x) => !x)}>
        <div className="spread">
          <div>
            <div className="eyebrow">Current stage</div>
            <h2 style={{ color }}>{progress?.current.name}</h2>
          </div>
          {progress?.hoursToNext != null && progress.next && (
            <div className="stage-card__next">
              <div className="tnum stage-card__next-h">
                {progress.hoursToNext.toFixed(1)}h
              </div>
              <div className="muted">to {progress.next.name}</div>
            </div>
          )}
        </div>
        <p className={`stage-card__body ${expanded ? 'open' : ''}`}>
          {progress?.current.body}
        </p>
        <div className="stage-card__hint muted">
          {expanded ? 'Tap to collapse' : 'Tap for what’s happening in your body'}
        </div>
      </Card>

      {speechSupported && progress && (
        <button
          className={`voice-btn ${speaking ? 'voice-btn--on' : ''}`}
          onClick={() =>
            speaking ? stopSpeech() : speak(buildNarration(progress))
          }
          aria-pressed={speaking}
          style={{ borderColor: speaking ? color : undefined }}
        >
          <span className="voice-btn__icon" aria-hidden="true">
            {speaking ? '❚❚' : '►'}
          </span>
          <span className="voice-btn__label">
            {speaking ? 'Stop narration' : 'Hear where you are'}
          </span>
          {speaking && (
            <span className="voice-btn__wave" aria-hidden="true">
              <i /><i /><i /><i />
            </span>
          )}
        </button>
      )}

      <div className="timeline-wrap">
        <StageTimeline durationHours={durationHours} elapsedHours={elapsedHours} />
      </div>

      <Card>
        <div className="spread" style={{ marginBottom: 6 }}>
          <div>
            <div className="eyebrow">Weight journey</div>
            <div className="weight-now tnum">
              {(weighIns.length
                ? weighIns[weighIns.length - 1].weightLbs
                : fast.weightAtStart
              ).toFixed(1)}{' '}
              <span className="muted">lbs</span>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setWeighing(true)}>
            ⚖️ Weigh in
          </Button>
        </div>

        <div className="chart-legend">
          <span className="chart-legend__item">
            <i className="chart-legend__swatch chart-legend__swatch--actual" />
            Your weigh-ins
          </span>
          <span className="chart-legend__item">
            <i className="chart-legend__swatch chart-legend__swatch--proj" />
            Projected
          </span>
          <span className="chart-legend__item">
            <i className="chart-legend__swatch chart-legend__swatch--band" />
            Normal range
          </span>
        </div>

        <WeightChart
          startWeightLbs={fast.weightAtStart}
          fastStartAt={fast.startAt}
          durationHours={durationHours}
          weighIns={weighIns}
          nowMs={now}
        />

        {(() => {
          const nowProj = projectionBreakdown(fast.weightAtStart, elapsedHours);
          const endProj = projectionBreakdown(fast.weightAtStart, durationHours);
          const nextMark = Math.min(
            durationHours,
            (Math.floor(elapsedHours / 4) + 1) * 4,
          );
          const next = projectionBreakdown(fast.weightAtStart, nextMark);
          return (
            <div className="weight-stats">
              <div>
                <span className="tnum">−{nowProj.totalLbs.toFixed(1)}</span>
                <label>projected now</label>
              </div>
              <div>
                <span className="tnum">−{next.totalLbs.toFixed(1)}</span>
                <label>by hour {nextMark}</label>
              </div>
              <div>
                <span className="tnum">−{endProj.totalLbs.toFixed(1)}</span>
                <label>by the end</label>
              </div>
              <div>
                <span className="tnum" style={{ color: 'var(--accent-violet)' }}>
                  −{endProj.keepsOffLbs.toFixed(1)}
                </span>
                <label>stays off (fat)</label>
              </div>
            </div>
          );
        })()}
        <p className="weight-footnote muted">
          The projection is research-based for your start weight on this
          regimen. Early scale loss is mostly glycogen water that returns after
          refeeding — the violet “stays off” number is the true fat loss.
        </p>

        {(() => {
          const current = weighIns.length
            ? weighIns[weighIns.length - 1].weightLbs
            : fast.weightAtStart;
          const change = current - fast.weightAtStart;
          return (
            <div className="weight-summary">
              <div>
                <label>Starting weight</label>
                <span className="tnum">{fast.weightAtStart.toFixed(1)} lbs</span>
              </div>
              <div className="weight-summary__arrow" aria-hidden="true">
                →
              </div>
              <div>
                <label>Current weight</label>
                <span className="tnum">{current.toFixed(1)} lbs</span>
              </div>
              <div>
                <label>Change</label>
                <span
                  className="tnum"
                  style={{
                    color:
                      change < 0
                        ? 'var(--accent-bio)'
                        : change > 0
                          ? 'var(--warn)'
                          : 'var(--text-dim)',
                  }}
                >
                  {change > 0 ? '+' : ''}
                  {change.toFixed(1)} lbs
                </span>
              </div>
            </div>
          );
        })()}
      </Card>

      {showNotifPrompt && (
        <Card className="notif-prompt">
          <div className="notif-prompt__body">
            <span className="notif-prompt__icon" aria-hidden="true">🔔</span>
            <div>
              <strong>Stay on schedule</strong>
              <p className="muted">
                Get nudged for cups, electrolytes, and each stage transition.
              </p>
            </div>
          </div>
          <div className="notif-prompt__actions">
            <Button
              variant="ghost"
              onClick={async () => {
                await request();
                dismissNotif();
              }}
            >
              Enable reminders
            </Button>
            <button
              className="notif-prompt__dismiss"
              onClick={dismissNotif}
              aria-label="Dismiss reminder prompt"
            >
              Not now
            </button>
          </div>
        </Card>
      )}

      {finished && (
        <Card className="refeed-banner" onClick={startRefeed}>
          <div>
            <div className="eyebrow" style={{ color: '#4dff9e' }}>Fast complete</div>
            <strong>Time to break your fast</strong>
            <p className="muted">Start the guided refeed protocol →</p>
          </div>
        </Card>
      )}

      {overdue.length > 0 && (
        <Card className="catchup">
          <div className="eyebrow" style={{ color: 'var(--accent-amber)' }}>
            Catch up ({overdue.length})
          </div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
            Past-due items — tap to log them.
          </p>
          <ScheduleList
            events={overdue.slice(0, 4)}
            checkIns={checkIns}
            now={now}
            onToggle={toggleCheck}
          />
        </Card>
      )}

      <Card>
        <div className="spread" style={{ marginBottom: 8 }}>
          <div className="eyebrow">{showAll ? 'Full schedule' : 'Today'}</div>
          <button className="link-btn" onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Show today' : 'Show all'}
          </button>
        </div>
        <ScheduleList
          events={listEvents}
          checkIns={checkIns}
          now={now}
          onToggle={toggleCheck}
          onEditTime={editTime}
          editable
        />
      </Card>

      {weighing && (
        <WeighInSheet fastId={fast.id} onClose={() => setWeighing(false)} />
      )}

      {isDemo && (
        <Card className="timetravel">
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Demo time-travel
          </div>
          <div className="timetravel__btns">
            <Button variant="ghost" onClick={() => addHours(1)}>+1h</Button>
            <Button variant="ghost" onClick={() => addHours(6)}>+6h</Button>
            <Button variant="ghost" onClick={() => addHours(24)}>+24h</Button>
            {offsetMs !== 0 && (
              <Button variant="subtle" onClick={reset}>Reset</Button>
            )}
          </div>
          {offsetMs !== 0 && (
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              Clock advanced {fmtDuration(offsetMs)}.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
