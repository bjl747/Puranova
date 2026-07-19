import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useNow } from '../hooks/useNow';
import {
  Button,
  Chip,
  NumberField,
  TimeInput,
  Toggle,
} from '../components/ui/ui';
import { CONTAINER_PRESETS, defaultProfile } from '../core/defaults';
import { cupsPerDay, dailyOunces } from '../core/hydration';
import { generateSchedule } from '../core/schedule';
import { fmtClock } from '../core/time';
import type { Fast, LmntFlavor, WorkBlock } from '../core/types';
import './Onboarding.css';

export function Onboarding() {
  const { user } = useAuth();
  const { save } = useProfile();
  const { now } = useNow();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const base = defaultProfile(user?.displayName ?? 'Explorer');

  const [name, setName] = useState(base.displayName);
  const [weight, setWeight] = useState<number | ''>(base.weightLbs);
  const [container, setContainer] = useState(base.containerOz);
  const [flavor, setFlavor] = useState<LmntFlavor>(base.lmntFlavor);
  const [includeCoffee, setIncludeCoffee] = useState(base.includeCoffee);
  const [wakeTime, setWakeTime] = useState(base.rhythm.wakeTime);
  const [bedTime, setBedTime] = useState(base.rhythm.bedTime);
  const [workBlocks, setWorkBlocks] = useState<WorkBlock[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const weightNum = typeof weight === 'number' ? weight : 0;
  const cups = weightNum ? cupsPerDay(weightNum, container) : 0;

  const previewFast = useMemo<Fast>(() => {
    const startAt = now;
    return {
      id: 'preview',
      startAt,
      plannedEndAt: startAt + 24 * 3600_000,
      status: 'active',
      weightAtStart: weightNum || 180,
      containerOz: container,
      lmntFlavor: flavor,
      includeCoffee,
      rhythmSnapshot: { wakeTime, bedTime, workBlocks, notes },
    };
  }, [now, weightNum, container, flavor, includeCoffee, wakeTime, bedTime, workBlocks, notes]);

  const sampleDay = useMemo(() => {
    // Build a full-day preview by anchoring a fast to local midnight.
    const d = new Date(now);
    const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const f: Fast = {
      ...previewFast,
      startAt: midnight,
      plannedEndAt: midnight + 24 * 3600_000,
    };
    return generateSchedule(f).filter((e) => e.kind !== 'marker');
  }, [previewFast, now]);

  const canNext =
    step === 0
      ? name.trim().length > 0 && weightNum >= 60 && weightNum <= 1000
      : true;

  const finish = async () => {
    setSaving(true);
    await save({
      displayName: name.trim(),
      weightLbs: weightNum,
      containerOz: container,
      lmntFlavor: flavor,
      includeCoffee,
      rhythm: { wakeTime, bedTime, workBlocks, notes },
      timeOverrides: {},
      onboarded: true,
      createdAt: now,
    });
    navigate('/', { replace: true });
  };

  const addWorkBlock = () =>
    setWorkBlocks((b) => [...b, { label: 'Work', start: '09:00', end: '17:00' }]);
  const updateBlock = (i: number, patch: Partial<WorkBlock>) =>
    setWorkBlocks((b) => b.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
  const removeBlock = (i: number) =>
    setWorkBlocks((b) => b.filter((_, idx) => idx !== i));

  return (
    <div className="onboarding fade-up">
      <div className="onboarding__progress">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>

      {step === 0 && (
        <section className="stack">
          <header>
            <div className="eyebrow">Step 1 of 4</div>
            <h1>Let’s set your baseline</h1>
            <p className="muted">
              Your weight drives how much water and electrolytes you’ll need.
            </p>
          </header>
          <label className="field">
            <span>Your name</span>
            <input
              className="text-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
          </label>
          <label className="field">
            <span>Current weight</span>
            <NumberField
              value={weight}
              onChange={setWeight}
              suffix="lbs"
              min={60}
              max={1000}
              aria-label="Weight in pounds"
            />
          </label>
          {weightNum > 0 && (
            <div className="hint">
              ≈ {Math.round(dailyOunces(weightNum))} oz of water per day
            </div>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="stack">
          <header>
            <div className="eyebrow">Step 2 of 4</div>
            <h1>Your water container</h1>
            <p className="muted">
              We’ll count your day in cups of this size.
            </p>
          </header>
          <div className="chip-row">
            {CONTAINER_PRESETS.map((c) => (
              <Chip key={c} active={container === c} onClick={() => setContainer(c)}>
                {c} oz
              </Chip>
            ))}
          </div>
          <label className="field">
            <span>Custom size</span>
            <NumberField
              value={container}
              onChange={(v) => setContainer(typeof v === 'number' ? v : 0)}
              suffix="oz"
              min={8}
              max={128}
              aria-label="Container size in ounces"
            />
          </label>
          {cups > 0 && (
            <div className="preview-callout">
              You’ll drink about <strong>{cups} × {container} oz</strong> cups a
              day.
            </div>
          )}

          <div className="field">
            <span>Preferred LMNT flavor</span>
            <div className="chip-row">
              <Chip active={flavor === 'citrus'} onClick={() => setFlavor('citrus')}>
                Citrus Salt
              </Chip>
              <Chip
                active={flavor === 'watermelon'}
                onClick={() => setFlavor('watermelon')}
              >
                Watermelon Salt
              </Chip>
            </div>
          </div>

          <div className="toggle-row">
            <div>
              <div style={{ fontWeight: 600 }}>Include black coffee</div>
              <div className="muted" style={{ fontSize: 13 }}>
                Morning windows only, capped at 2 PM.
              </div>
            </div>
            <Toggle checked={includeCoffee} onChange={setIncludeCoffee} />
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="stack">
          <header>
            <div className="eyebrow">Step 3 of 4</div>
            <h1>Your daily rhythm</h1>
            <p className="muted">
              We’ll schedule cups and doses around your real day — not fixed
              clock times.
            </p>
          </header>
          <div className="time-grid">
            <label className="field">
              <span>Wake up</span>
              <TimeInput value={wakeTime} onChange={setWakeTime} aria-label="Wake time" />
            </label>
            <label className="field">
              <span>Bedtime</span>
              <TimeInput value={bedTime} onChange={setBedTime} aria-label="Bed time" />
            </label>
          </div>

          <div className="field">
            <span>Work or fixed blocks (optional)</span>
            {workBlocks.map((w, i) => (
              <div className="work-block" key={i}>
                <input
                  className="text-input work-block__label"
                  value={w.label}
                  onChange={(e) => updateBlock(i, { label: e.target.value })}
                  placeholder="Label"
                />
                <TimeInput
                  value={w.start}
                  onChange={(v) => updateBlock(i, { start: v })}
                  aria-label="Block start"
                />
                <TimeInput
                  value={w.end}
                  onChange={(v) => updateBlock(i, { end: v })}
                  aria-label="Block end"
                />
                <button className="work-block__remove" onClick={() => removeBlock(i)}>
                  ✕
                </button>
              </div>
            ))}
            <Button variant="subtle" onClick={addWorkBlock}>
              + Add a block
            </Button>
          </div>

          <label className="field">
            <span>Anything else about your day?</span>
            <textarea
              className="text-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. I train at 6 PM, or I drive mornings…"
            />
          </label>
        </section>
      )}

      {step === 3 && (
        <section className="stack">
          <header>
            <div className="eyebrow">Step 4 of 4</div>
            <h1>Your sample day</h1>
            <p className="muted">
              Here’s a full day of hydration. You can fine-tune every time later.
            </p>
          </header>
          <div className="sample-schedule">
            {sampleDay.map((e) => (
              <div className="sample-row" key={e.id}>
                <span className="sample-row__time tnum">{fmtClock(e.at)}</span>
                <span className={`sample-row__dot sample-row__dot--${e.kind}`} />
                <span className="sample-row__body">
                  <strong>{e.title}</strong>
                  <span className="muted">{e.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="onboarding__nav">
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button glow full={step === 0} disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button glow disabled={saving} onClick={finish}>
            {saving ? 'Saving…' : 'Looks good — start'}
          </Button>
        )}
      </div>
    </div>
  );
}
