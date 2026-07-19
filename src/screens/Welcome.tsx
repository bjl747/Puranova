import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CellularHero } from '../components/CellularHero';
import { Button } from '../components/ui/ui';
import { isInAppBrowser, inAppBrowserName } from '../data/browserEnv';
import './Welcome.css';

export function Welcome() {
  const { firebaseAvailable, signInWithGoogle, startDemo } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inApp = isInAppBrowser();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Couldn’t copy — long-press the address bar to copy the link.');
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError('Sign-in failed. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="welcome">
      <div className="welcome__hero">
        <CellularHero mode="regen" hex="#4dff9e" />
      </div>
      <div className="welcome__content">
        <div className="welcome__mark" aria-hidden="true">
          <span />
        </div>
        <h1 className="welcome__title">Puranova</h1>
        <p className="welcome__tag">
          Fast with intention. Track every stage of cellular renewal — from
          ketosis to deep autophagy — with hydration and electrolytes dialed to
          your body.
        </p>

        <div className="welcome__actions">
          {inApp ? (
            <div className="welcome__inapp">
              <strong>Open in your browser to sign in</strong>
              <p>
                Google sign-in doesn’t work inside {inAppBrowserName()}. Tap the
                menu (•••) and choose <b>Open in Safari</b> or <b>Open in
                Chrome</b> — or copy the link and paste it there.
              </p>
              <Button variant="ghost" full onClick={copyLink}>
                {copied ? 'Link copied ✓' : 'Copy link'}
              </Button>
            </div>
          ) : firebaseAvailable ? (
            <Button full glow onClick={handleGoogle} disabled={busy}>
              <GoogleGlyph />
              {busy ? 'Connecting…' : 'Continue with Google'}
            </Button>
          ) : (
            <div className="welcome__notice">
              Firebase isn’t configured yet — running in local demo mode. Add
              your Firebase keys to enable Google sign-in and cloud sync.
            </div>
          )}
          <Button variant="ghost" full onClick={startDemo}>
            Try the demo
          </Button>
          {error && <p className="welcome__error">{error}</p>}
        </div>

        <p className="welcome__disclaimer">
          Educational tool, not medical advice. Consult a physician before
          extended fasting.
        </p>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
