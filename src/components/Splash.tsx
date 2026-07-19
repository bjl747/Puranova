// Branded loading splash — a pulsing cell mark with an optional label.
export function Splash({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="center-screen">
      <div className="splash-mark" />
      <p className="muted" style={{ marginTop: 16 }}>
        {label}
      </p>
    </div>
  );
}
