import { describe, it, expect } from 'vitest';
import { buildNarration } from './narration';
import { stageProgress } from './stages';

describe('buildNarration', () => {
  it('mentions the current stage, a feeling, and the next stage', () => {
    const p = stageProgress(20, 72); // Metabolic Switch, next = Ketosis
    const text = buildNarration(p);
    expect(text).toContain('The Metabolic Switch');
    expect(text).toContain('Ketosis Onset');
    expect(text.toLowerCase()).toContain('you might feel');
    expect(text).toMatch(/into your fast/);
  });

  it('handles the very start (minutes, not hours)', () => {
    const p = stageProgress(0.25, 72);
    const text = buildNarration(p);
    expect(text).toContain('just getting started');
    expect(text).toContain('Fed State');
  });

  it('handles the terminal stage with no next stage', () => {
    const p = stageProgress(90, 72); // Extended Regeneration, no next
    const text = buildNarration(p);
    expect(text).toContain('Extended Regeneration');
    expect(text).toContain('deepest phase');
    expect(text).not.toMatch(/move into (undefined|null)/);
  });

  it('produces a non-trivial spoken script', () => {
    const text = buildNarration(stageProgress(30, 72));
    expect(text.length).toBeGreaterThan(120);
  });
});
