import { useState } from 'react';
import { LEARN_SECTIONS, SAFETY_DISCLAIMER } from '../content/learn';
import './Learn.css';

export function Learn() {
  const [open, setOpen] = useState<string | null>(LEARN_SECTIONS[0].id);

  return (
    <div className="learn fade-up stack">
      <header>
        <div className="eyebrow">The science</div>
        <h1>Learn</h1>
        <p className="muted">
          Why the protocol works — the supplements, the timing, and the biology.
        </p>
      </header>

      {LEARN_SECTIONS.map((s) => {
        const isOpen = open === s.id;
        return (
          <div key={s.id} className={`learn-card ${isOpen ? 'learn-card--open' : ''}`}>
            <button
              className="learn-card__head"
              onClick={() => setOpen(isOpen ? null : s.id)}
              aria-expanded={isOpen}
            >
              <span className="learn-card__icon">{s.icon}</span>
              <span className="learn-card__title">{s.title}</span>
              <span className="learn-card__chevron">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="learn-card__body">
                {s.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="learn-disclaimer">
        <strong>⚕️ Safety first</strong>
        <p>{SAFETY_DISCLAIMER}</p>
      </div>
    </div>
  );
}
