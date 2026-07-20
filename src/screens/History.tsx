import { useEffect, useState } from 'react';
import { useRepo } from '../data/repo';
import { useNow } from '../hooks/useNow';
import { Button, Card, StatTile, EmptyState } from '../components/ui/ui';
import { HoursBarChart } from '../components/charts/HoursBarChart';
import { StreakDots } from '../components/charts/StreakDots';
import { WeightTrendChart } from '../components/charts/WeightTrendChart';
import { WeighInSheet } from '../components/WeighInSheet';
import { computeStats, fastedHours, completedFasts } from '../core/stats';
import { fmtDuration } from '../core/time';
import type { Fast, WeighIn } from '../core/types';
import './History.css';

export function History() {
  const repo = useRepo();
  const { now } = useNow();
  const [fasts, setFasts] = useState<Fast[]>([]);
  const [weighIns, setWeighIns] = useState<WeighIn[]>([]);
  const [weighing, setWeighing] = useState(false);

  useEffect(() => {
    repo.listFasts().then(setFasts);
    const unsub = repo.watchWeighIns(setWeighIns);
    return unsub;
  }, [repo]);

  const firstW = weighIns[0]?.weightLbs;
  const lastW = weighIns[weighIns.length - 1]?.weightLbs;
  const deltaW = firstW != null && lastW != null ? lastW - firstW : null;

  const stats = computeStats(fasts, now);
  const done = completedFasts(fasts).sort((a, b) => b.startAt - a.startAt);

  return (
    <div className="history fade-up stack">
      <header>
        <div className="eyebrow">Your journey</div>
        <h1>History</h1>
      </header>

      <div className="stat-row">
        <StatTile label="Fasts" value={stats.completedCount} accent="#3ff2e0" />
        <StatTile label="Total hrs" value={Math.round(stats.totalHours)} accent="#4dff9e" />
      </div>
      <div className="stat-row">
        <StatTile label="Longest" value={Math.round(stats.longestHours)} unit="h" accent="#8b7bff" />
        <StatTile label="Streak" value={stats.currentStreakWeeks} unit="wk" accent="#ff6b9d" />
      </div>

      <Card>
        <div className="spread" style={{ marginBottom: 6 }}>
          <div>
            <div className="eyebrow">Weight</div>
            {lastW != null ? (
              <div className="weight-line tnum">
                {lastW.toFixed(1)} <span className="muted">lbs</span>
                {deltaW != null && weighIns.length > 1 && (
                  <span
                    className="weight-delta tnum"
                    style={{ color: deltaW <= 0 ? 'var(--accent-bio)' : 'var(--warn)' }}
                  >
                    {deltaW <= 0 ? '▼' : '▲'} {Math.abs(deltaW).toFixed(1)}
                  </span>
                )}
              </div>
            ) : (
              <p className="muted" style={{ fontSize: 13 }}>
                No weigh-ins yet — log your first.
              </p>
            )}
          </div>
          <Button variant="ghost" onClick={() => setWeighing(true)}>
            ⚖️ Weigh in
          </Button>
        </div>
        <WeightTrendChart weighIns={weighIns} />
      </Card>

      {weighing && <WeighInSheet onClose={() => setWeighing(false)} />}

      {done.length === 0 ? (
        <EmptyState
          icon="🌘"
          title="No completed fasts yet"
          body="Finish your first fast and it’ll appear here with charts and streaks."
        />
      ) : (
        <>
          <Card>
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              Recent fasts (hours)
            </div>
            <HoursBarChart fasts={fasts} />
          </Card>

          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              Weekly streak
            </div>
            <StreakDots fasts={fasts} now={now} />
          </Card>

          <Card>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Log
            </div>
            {done.map((f) => (
              <div className="history-row" key={f.id}>
                <div>
                  <strong className="tnum">{fastedHours(f).toFixed(0)}h</strong>
                  <div className="muted history-row__date">
                    {new Date(f.startAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div className="history-row__dur muted tnum">
                  {fmtDuration((f.actualEndAt ?? f.plannedEndAt) - f.startAt)}
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
