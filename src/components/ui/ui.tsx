// ---------------------------------------------------------------------------
// Small hand-rolled UI primitives shared across screens.
// ---------------------------------------------------------------------------

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './ui.css';

type Variant = 'primary' | 'ghost' | 'subtle' | 'danger';

export function Button({
  variant = 'primary',
  glow,
  full,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  glow?: boolean;
  full?: boolean;
}) {
  return (
    <button
      className={`btn btn--${variant} ${glow ? 'btn--glow' : ''} ${
        full ? 'btn--full' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = '',
  glass,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  glass?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`card ${glass ? 'glass' : ''} ${className} ${
        onClick ? 'card--tappable' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  color,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      className="pill"
      style={color ? { borderColor: color, color } : undefined}
    >
      {children}
    </span>
  );
}

export function StatTile({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  accent?: string;
}) {
  return (
    <div className="stat-tile">
      <div className="stat-tile__value tnum" style={accent ? { color: accent } : undefined}>
        {value}
        {unit && <span className="stat-tile__unit">{unit}</span>}
      </div>
      <div className="stat-tile__label">{label}</div>
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={`chip ${active ? 'chip--active' : ''}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function TimeInput({
  value,
  onChange,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  'aria-label'?: string;
}) {
  return (
    <input
      type="time"
      className="time-input tnum"
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function NumberField({
  value,
  onChange,
  suffix,
  min,
  max,
  step = 1,
  'aria-label': ariaLabel,
}: {
  value: number | '';
  onChange: (v: number | '') => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  'aria-label'?: string;
}) {
  return (
    <div className="number-field">
      <input
        type="number"
        inputMode="decimal"
        className="number-field__input tnum"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel}
        onChange={(e) =>
          onChange(e.target.value === '' ? '' : Number(e.target.value))
        }
      />
      {suffix && <span className="number-field__suffix">{suffix}</span>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="toggle">
      {label && <span>{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle__track ${checked ? 'toggle__track--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle__thumb" />
      </button>
    </label>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h3>{title}</h3>
      {body && <p className="muted">{body}</p>}
    </div>
  );
}
