import { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import {
  Button,
  Card,
  Chip,
  NumberField,
  TimeInput,
  Toggle,
} from '../components/ui/ui';
import { CONTAINER_PRESETS } from '../core/defaults';
import { cupsPerDay } from '../core/hydration';
import { useNotificationPermission } from '../notify/notifications';
import type { LmntFlavor } from '../core/types';
import './Profile.css';

export function Profile() {
  const { profile, save } = useProfile();
  const { user, isDemo, signOut } = useAuth();
  const { permission, request } = useNotificationPermission();
  const [saved, setSaved] = useState(false);

  if (!profile) return null;

  const flash = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  const update = async (patch: Parameters<typeof save>[0]) => {
    await save(patch);
    flash();
  };

  const cups = cupsPerDay(profile.weightLbs, profile.containerOz);

  return (
    <div className="profile fade-up stack">
      <header className="profile__header">
        <div className="profile__avatar">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" />
          ) : (
            (profile.displayName || 'E')[0].toUpperCase()
          )}
        </div>
        <div>
          <h1>{profile.displayName}</h1>
          <p className="muted">
            {isDemo ? 'Demo mode' : user?.email ?? 'Signed in'}
          </p>
        </div>
      </header>

      {saved && <div className="profile__saved">Saved ✓</div>}

      <Card>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Body</div>
        <label className="prof-field">
          <span>Weight</span>
          <NumberField
            value={profile.weightLbs}
            onChange={(v) => typeof v === 'number' && update({ weightLbs: v })}
            suffix="lbs"
            min={60}
            max={1000}
          />
        </label>
        <div className="prof-field">
          <span>Container</span>
          <div className="chip-row">
            {CONTAINER_PRESETS.map((c) => (
              <Chip
                key={c}
                active={profile.containerOz === c}
                onClick={() => update({ containerOz: c })}
              >
                {c} oz
              </Chip>
            ))}
          </div>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          → {cups} cups/day at your current settings.
        </p>
      </Card>

      <Card>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Daily rhythm</div>
        <div className="prof-times">
          <label className="prof-field">
            <span>Wake</span>
            <TimeInput
              value={profile.rhythm.wakeTime}
              onChange={(v) =>
                update({ rhythm: { ...profile.rhythm, wakeTime: v } })
              }
            />
          </label>
          <label className="prof-field">
            <span>Bed</span>
            <TimeInput
              value={profile.rhythm.bedTime}
              onChange={(v) =>
                update({ rhythm: { ...profile.rhythm, bedTime: v } })
              }
            />
          </label>
        </div>
      </Card>

      <Card>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Supplements</div>
        <div className="prof-field">
          <span>LMNT flavor</span>
          <div className="chip-row">
            {(['citrus', 'watermelon'] as LmntFlavor[]).map((f) => (
              <Chip
                key={f}
                active={profile.lmntFlavor === f}
                onClick={() => update({ lmntFlavor: f })}
              >
                {f === 'citrus' ? 'Citrus Salt' : 'Watermelon Salt'}
              </Chip>
            ))}
          </div>
        </div>
        <div className="toggle-row" style={{ marginTop: 12 }}>
          <div>Include black coffee</div>
          <Toggle
            checked={profile.includeCoffee}
            onChange={(v) => update({ includeCoffee: v })}
          />
        </div>
      </Card>

      {Object.keys(profile.timeOverrides).length > 0 && (
        <Card>
          <div className="spread" style={{ marginBottom: 8 }}>
            <div className="eyebrow">Custom times</div>
            <button
              className="link-btn"
              onClick={() => update({ timeOverrides: {} })}
            >
              Reset all
            </button>
          </div>
          <p className="muted" style={{ fontSize: 13 }}>
            {Object.keys(profile.timeOverrides).length} slot time(s) customized.
          </p>
        </Card>
      )}

      <Card>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Notifications</div>
        {permission === 'granted' ? (
          <p className="muted" style={{ fontSize: 14 }}>
            ✓ Enabled — you’ll get nudges for cups, doses, and stage changes.
          </p>
        ) : permission === 'denied' ? (
          <p className="muted" style={{ fontSize: 14 }}>
            Blocked in your browser settings. Re-enable there to get reminders.
          </p>
        ) : (
          <Button variant="ghost" onClick={request}>
            Enable reminders
          </Button>
        )}
      </Card>

      <Button variant="danger" full onClick={signOut}>
        {isDemo ? 'Exit demo' : 'Sign out'}
      </Button>
    </div>
  );
}
