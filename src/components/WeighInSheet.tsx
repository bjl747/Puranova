// ---------------------------------------------------------------------------
// Quick weigh-in entry: step on the scale, type the number, save. Updates the
// profile's current weight too so future fasts use the latest reading.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { useRepo } from '../data/repo';
import { useProfile } from '../hooks/useProfile';
import { useNow } from '../hooks/useNow';
import { Button, NumberField } from './ui/ui';
import './WeighInSheet.css';

interface Props {
  fastId?: string;
  onClose: () => void;
  onSaved?: (weightLbs: number) => void;
}

export function WeighInSheet({ fastId, onClose, onSaved }: Props) {
  const repo = useRepo();
  const { profile, save } = useProfile();
  const { now } = useNow();
  const [weight, setWeight] = useState<number | ''>(profile?.weightLbs ?? '');
  const [saving, setSaving] = useState(false);

  const valid = typeof weight === 'number' && weight >= 60 && weight <= 1000;

  const submit = async () => {
    if (!valid || typeof weight !== 'number') return;
    setSaving(true);
    await repo.addWeighIn({
      id: `w_${now.toString(36)}`,
      at: now,
      weightLbs: weight,
      ...(fastId ? { fastId } : {}),
    });
    await save({ weightLbs: weight });
    onSaved?.(weight);
    onClose();
  };

  return (
    <div className="weighin-overlay" onClick={onClose}>
      <div
        className="weighin-sheet glass"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Log a weigh-in"
      >
        <div className="weighin-sheet__grab" aria-hidden="true" />
        <h2>⚖️ Weigh-in</h2>
        <p className="muted">
          Step on the scale and log what you see — any time, day or night.
        </p>
        <NumberField
          value={weight}
          onChange={setWeight}
          suffix="lbs"
          min={60}
          max={1000}
          step={0.1}
          aria-label="Current weight in pounds"
        />
        <div className="weighin-sheet__actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button glow disabled={!valid || saving} onClick={submit}>
            {saving ? 'Saving…' : 'Save weigh-in'}
          </Button>
        </div>
      </div>
    </div>
  );
}
