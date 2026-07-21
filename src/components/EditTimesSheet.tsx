// ---------------------------------------------------------------------------
// Mid-fast plan editor: change the start or end time of the running fast.
// Everything downstream (countdown, stages, schedule, weight targets) derives
// from these two timestamps, so one save recalculates the whole plan.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRepo } from '../data/repo';
import { Button, Chip } from './ui/ui';
import { fmtDuration, HOUR } from '../core/time';
import type { Fast } from '../core/types';
import './WeighInSheet.css';
import './EditTimesSheet.css';

interface Props {
  fast: Fast;
  now: number;
  onClose: () => void;
  onSaved?: (patch: { startAt: number; plannedEndAt: number }) => void;
}

function toLocalInputValue(ms: number): string {
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}
function fromLocalInputValue(v: string): number {
  return new Date(v).getTime();
}

const PRESETS = [24, 48, 72];

export function EditTimesSheet({ fast, now, onClose, onSaved }: Props) {
  const repo = useRepo();
  const [startAt, setStartAt] = useState(fast.startAt);
  const [endAt, setEndAt] = useState(fast.plannedEndAt);
  const [saving, setSaving] = useState(false);

  const durationH = (endAt - startAt) / HOUR;
  const startValid = startAt <= now;
  const endValid = endAt > startAt + HOUR;
  const endInPast = endAt <= now;
  const valid = startValid && endValid && Number.isFinite(durationH);

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    await repo.updateFast(fast.id, { startAt, plannedEndAt: endAt });
    onSaved?.({ startAt, plannedEndAt: endAt });
    onClose();
  };

  return createPortal(
    <div className="weighin-overlay" onClick={onClose}>
      <div
        className="weighin-sheet glass"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Edit fast times"
      >
        <div className="weighin-sheet__grab" aria-hidden="true" />
        <h2>🕑 Edit fast times</h2>
        <p className="muted">
          Plans change — adjust your start or end and everything recalculates:
          countdown, schedule, stages, and weight targets.
        </p>

        <label className="edit-times__field">
          <span>Start</span>
          <input
            type="datetime-local"
            className="text-input"
            value={toLocalInputValue(startAt)}
            onChange={(e) => setStartAt(fromLocalInputValue(e.target.value))}
          />
        </label>

        <label className="edit-times__field">
          <span>End</span>
          <input
            type="datetime-local"
            className="text-input"
            value={toLocalInputValue(endAt)}
            onChange={(e) => setEndAt(fromLocalInputValue(e.target.value))}
          />
        </label>

        <div className="edit-times__presets">
          {PRESETS.map((h) => (
            <Chip
              key={h}
              active={Math.abs(durationH - h) < 0.02}
              onClick={() => setEndAt(startAt + h * HOUR)}
            >
              {h}h total
            </Chip>
          ))}
        </div>

        <div className="edit-times__summary tnum">
          New total: <strong>{fmtDuration(Math.max(0, endAt - startAt))}</strong>
        </div>

        {!startValid && (
          <p className="edit-times__warn">Start must be in the past.</p>
        )}
        {!endValid && (
          <p className="edit-times__warn">
            End must be at least 1 hour after the start.
          </p>
        )}
        {valid && endInPast && (
          <p className="edit-times__warn">
            That end time has already passed — saving will mark your goal
            reached, and the refeed banner will appear.
          </p>
        )}

        <div className="weighin-sheet__actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button glow disabled={!valid || saving} onClick={save}>
            {saving ? 'Saving…' : 'Save new plan'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
