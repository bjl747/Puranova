import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useNow } from '../hooks/useNow';
import { useRepo } from '../data/repo';
import { Button, Card, Chip } from '../components/ui/ui';
import { DURATION_PRESETS } from '../core/defaults';
import { stagesForFast } from '../core/stages';
import { supplyCount } from '../core/schedule';
import { projectionBreakdown } from '../core/projection';
import { fmtDuration, HOUR } from '../core/time';
import type { Fast } from '../core/types';
import './FastSetup.css';

function toLocalInputValue(ms: number): string {
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}
function fromLocalInputValue(v: string): number {
  return new Date(v).getTime();
}

export function FastSetup() {
  const { profile } = useProfile();
  const { now } = useNow();
  const repo = useRepo();
  const navigate = useNavigate();

  const [durationH, setDurationH] = useState(72);
  const [custom, setCustom] = useState(false);
  const [startAt, setStartAt] = useState(now);
  const [endAt, setEndAt] = useState(now + 72 * HOUR);
  const [creating, setCreating] = useState(false);

  // Guard: if a fast is already running, don't let a second one be created.
  const [activeId, setActiveId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const unsub = repo.watchActiveFast((f) => setActiveId(f?.id ?? null));
    return unsub;
  }, [repo]);

  const effectiveEnd = custom ? endAt : startAt + durationH * HOUR;
  const effectiveDurationH = Math.max(0, (effectiveEnd - startAt) / HOUR);

  const draftFast: Fast | null = useMemo(() => {
    if (!profile) return null;
    return {
      id: 'draft',
      startAt,
      plannedEndAt: effectiveEnd,
      status: 'active',
      weightAtStart: profile.weightLbs,
      containerOz: profile.containerOz,
      lmntFlavor: profile.lmntFlavor,
      includeCoffee: profile.includeCoffee,
      rhythmSnapshot: profile.rhythm,
    };
  }, [profile, startAt, effectiveEnd]);

  const supplies = draftFast ? supplyCount(draftFast) : null;
  const stages = stagesForFast(effectiveDurationH);

  // All hooks are above this line — safe to short-circuit render now.
  if (activeId) return <Navigate to={`/fast/${activeId}`} replace />;

  const begin = async () => {
    if (!profile || !draftFast) return;
    setCreating(true);
    const id = await repo.createFast({
      startAt,
      plannedEndAt: effectiveEnd,
      status: 'active',
      weightAtStart: profile.weightLbs,
      containerOz: profile.containerOz,
      lmntFlavor: profile.lmntFlavor,
      includeCoffee: profile.includeCoffee,
      rhythmSnapshot: profile.rhythm,
    });
    // Anchor the weight chart with a starting weigh-in.
    await repo.addWeighIn({
      id: `w_${startAt.toString(36)}_start`,
      at: startAt,
      weightLbs: profile.weightLbs,
      fastId: id,
    });
    navigate(`/fast/${id}`, { replace: true });
  };

  return (
    <div className="fast-setup fade-up stack">
      <header>
        <div className="eyebrow">New fast</div>
        <h1>Design your fast</h1>
      </header>

      <Card>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Duration</div>
        <div className="chip-row">
          {DURATION_PRESETS.map((p) => (
            <Chip
              key={p.hours}
              active={!custom && durationH === p.hours}
              onClick={() => {
                setCustom(false);
                setDurationH(p.hours);
              }}
            >
              {p.label}
            </Chip>
          ))}
          <Chip active={custom} onClick={() => setCustom(true)}>
            Custom
          </Chip>
        </div>

        <label className="setup-field">
          <span>Start</span>
          <input
            type="datetime-local"
            className="text-input"
            value={toLocalInputValue(startAt)}
            onChange={(e) => setStartAt(fromLocalInputValue(e.target.value))}
          />
        </label>

        {custom ? (
          <label className="setup-field">
            <span>End</span>
            <input
              type="datetime-local"
              className="text-input"
              value={toLocalInputValue(endAt)}
              onChange={(e) => setEndAt(fromLocalInputValue(e.target.value))}
            />
          </label>
        ) : (
          <div className="setup-field">
            <span>Ends</span>
            <div className="text-input text-input--readonly tnum">
              {new Date(effectiveEnd).toLocaleString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div className="spread">
          <div>
            <div className="eyebrow">Total fast</div>
            <div className="setup-duration tnum">
              {fmtDuration(effectiveEnd - startAt)}
            </div>
          </div>
          <div className="setup-supplies">
            <div>
              <strong className="tnum">{supplies?.cupsPerDay ?? 0}</strong> cups/day
            </div>
            <div>
              <strong className="tnum">{supplies?.lmntPackets ?? 0}</strong> LMNT packets
            </div>
            <div>
              <strong className="tnum">{supplies?.magnesiumCapsules ?? 0}</strong> Mg capsules
            </div>
            {profile && effectiveDurationH >= 4 && (
              <div>
                <strong className="tnum" style={{ color: 'var(--accent-bio)' }}>
                  −
                  {projectionBreakdown(
                    profile.weightLbs,
                    effectiveDurationH,
                  ).totalLbs.toFixed(1)}
                </strong>{' '}
                lbs projected
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          Stages you’ll reach
        </div>
        <div className="setup-stages">
          {stages.map((s) => (
            <div className="setup-stage" key={s.id}>
              <span className="setup-stage__dot" style={{ background: s.hex }} />
              <span className="setup-stage__name">{s.name}</span>
              <span className="setup-stage__hr tnum muted">{s.startHour}h</span>
            </div>
          ))}
        </div>
      </Card>

      <Button
        full
        glow
        disabled={creating || effectiveDurationH < 1}
        onClick={begin}
      >
        {creating ? 'Starting…' : 'Begin fast'}
      </Button>
    </div>
  );
}
