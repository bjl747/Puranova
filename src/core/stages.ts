// ---------------------------------------------------------------------------
// Metabolic stage engine. Stages are hour-anchored from fast start (NOT
// proportional to fast length), so a 24h fast and a 72h fast share the same
// early stages at the same clock offsets.
// ---------------------------------------------------------------------------

import type { Stage, StageProgress, StageWindow } from './types';
import { clamp } from './time';

export const STAGES: Stage[] = [
  {
    id: 'fed',
    startHour: 0,
    endHour: 4,
    name: 'Fed State',
    tagline: 'Digesting & storing',
    body: "Your body is digesting your last meal. Insulin is elevated, glucose is the primary fuel, and nutrients are being stored. mTOR — the cellular growth switch — is active.",
    feeling: 'comfortable and satisfied — maybe still a little full from your last meal',
    expect: {
      hunger: 'None — you\'re satisfied, maybe even still full. Enjoy it; this is the calm before the first waves.',
      head: 'Clear and normal. No headache risk yet.',
      stomach: 'Actively digesting your last meal. You may feel full or slightly heavy. Bowels behave completely normally.',
      energy: 'Steady. Some people feel a post-meal dip as insulin peaks — that\'s normal digestion, not the fast.',
      mind: 'Normal. If you ate a big last meal you might feel the classic food-coma drowsiness for an hour or two.',
    },
    colorVar: '--stage-fed',
    hex: '#6ea8ff',
  },
  {
    id: 'early',
    startHour: 4,
    endHour: 12,
    name: 'Early Post-Absorptive',
    tagline: 'Insulin falling',
    body: 'Insulin is dropping. Your liver begins releasing stored glycogen to keep blood sugar steady, and fat burning starts to tick upward.',
    feeling: 'mostly normal, with the first light pangs of hunger as your body changes fuel',
    expect: {
      hunger: 'The first gentle waves appear, usually around your habitual meal times. They\'re conditioned habit as much as need — a glass of water usually dissolves them.',
      head: 'Still clear for most people. If you\'re caffeine-dependent and skipping coffee, a withdrawal headache can start here.',
      stomach: 'Your stomach finishes emptying and starts to growl — that rumbling (borborygmi) is normal motility, not an emergency. Bowels still regular.',
      energy: 'Essentially normal. Great window for a walk or light work.',
      mind: 'Normal focus. No fog yet.',
    },
    colorVar: '--stage-early',
    hex: '#58c4d6',
  },
  {
    id: 'glycogen',
    startHour: 12,
    endHour: 18,
    name: 'Glycogen Depletion',
    tagline: 'Tapping the reserves',
    body: 'Liver glycogen reserves are running low. Your body ramps up fat mobilization and prepares alternative fuel pathways. Hunger waves often peak here — they pass.',
    feeling: 'real hunger waves, and maybe a little irritable — this is the hardest stretch, and it peaks here before it fades',
    expect: {
      hunger: 'This is the peak. Strong hunger waves roll in, last 15–20 minutes, and pass. They do NOT keep building forever — ride each one out with water or an electrolyte cup.',
      head: 'First real headache risk as sodium drops with your glycogen water. This is exactly what your LMNT packet is for — don\'t skip it.',
      stomach: 'Loud growling and an empty, hollow feeling. You may have a normal bowel movement as your gut clears its last load.',
      energy: 'Dips are common, especially late in this window. Keep activity light and don\'t schedule anything demanding.',
      mind: 'Some irritability and scattered focus — the classic \'hangry\' stretch. It\'s temporary and it\'s the hardest part of the whole fast.',
    },
    colorVar: '--stage-glycogen',
    hex: '#3ff2e0',
  },
  {
    id: 'switch',
    startHour: 18,
    endHour: 24,
    name: 'The Metabolic Switch',
    tagline: 'Fat-powered',
    body: 'Gluconeogenesis takes over: your liver makes glucose from fat-derived glycerol while lipolysis becomes the dominant energy source. You are now primarily fat-powered.',
    feeling: 'a dip in energy or a bit of brain fog as you cross over — it lifts as fat becomes your main fuel',
    expect: {
      hunger: 'Waves continue but start arriving less often and leaving faster. Your appetite hormones are beginning to stand down.',
      head: 'Headache risk peaks here if electrolytes are behind — dizziness on standing can appear too. Stay on the schedule; rise from chairs slowly.',
      stomach: 'Noticeably quieter. Possibly one last small bowel movement; after this, little-to-no output is completely normal — there\'s simply nothing coming in.',
      energy: 'For many people this is the low point — the body is mid-handoff between fuel systems. Rest, nap if you can, keep the evening easy.',
      mind: 'Brain fog is most likely right here, as your brain waits for ketones to arrive. It lifts — usually dramatically — within hours.',
    },
    colorVar: '--stage-switch',
    hex: '#45e0a8',
  },
  {
    id: 'ketosis',
    startHour: 24,
    endHour: 36,
    name: 'Ketosis Onset',
    tagline: 'Brain on ketones',
    body: 'Ketone production is climbing. Your brain begins running on β-hydroxybutyrate — many people feel a calm, clear focus. Appetite hormones start to flatten.',
    feeling: 'a surprising calm and mental clarity as ketones rise, with hunger starting to flatten out',
    expect: {
      hunger: 'A famous shift: hunger flattens out. Ghrelin pulses weaken, and many people are surprised how little they think about food.',
      head: 'Clears for most, provided electrolytes are on point. Some notice a metallic or fruity taste (acetone breath) — a sign of ketosis, not a problem.',
      stomach: 'Quiet and settled. Bowels go dormant — expect little or nothing, and don\'t force it.',
      energy: 'A genuine rebound. Steady, even energy without the spikes and dips of a fed day.',
      mind: 'The calm, sharp clarity fasting is famous for begins here — your brain running on β-hydroxybutyrate, an exceptionally clean fuel.',
    },
    colorVar: '--stage-ketosis',
    hex: '#4dff9e',
  },
  {
    id: 'autophagy',
    startHour: 36,
    endHour: 48,
    name: 'Autophagy Ramp',
    tagline: 'Cellular recycling',
    body: 'With insulin low and AMPK high, mTOR is suppressed and autophagy accelerates: cells tag and recycle damaged proteins, misfolded structures, and worn-out mitochondria.',
    feeling: 'lighter and clear-headed, with hunger mostly gone as your body cleans house',
    expect: {
      hunger: 'Mostly gone. Occasional \'ghost cravings\' triggered by smells or habit, but true hunger is rare and brief.',
      head: 'Light and clear. Keep the magnesium going — it guards against the muscle cramps that can show up around now.',
      stomach: 'Silent. Your digestive tract is fully at rest — this is the point of the whole exercise. No bowel activity is expected or needed.',
      energy: 'Smooth and even. Gentle movement (walks, light stretching) feels good and supports the process. Avoid intense training.',
      mind: 'Clear, focused, often mildly elevated mood. Many people do their best deep work in this window.',
    },
    colorVar: '--stage-autophagy',
    hex: '#8b7bff',
  },
  {
    id: 'deep',
    startHour: 48,
    endHour: 56,
    name: 'Deep Autophagy + GH Peak',
    tagline: 'Repair & protect',
    body: 'Autophagy is near maximal. Growth hormone secretion rises sharply — protecting lean muscle and priming tissue repair for refeeding.',
    feeling: 'steady and focused — some fatigue is normal here, so rest whenever you need to',
    expect: {
      hunger: 'Minimal. Your body is fully fat-adapted and not asking for outside fuel.',
      head: 'Generally fine, but light-headedness when standing up quickly becomes more common — always rise slowly and pause.',
      stomach: 'Completely at rest. Any mild nausea usually means you need sodium — sip an electrolyte cup.',
      energy: 'Steady but with a smaller reserve tank. Daily life is fine; hard exertion is not — growth hormone is protecting your muscle, so let it.',
      mind: 'Deeply clear. Some people report a mild, pleasant euphoria as ketones peak alongside growth hormone.',
    },
    colorVar: '--stage-deep',
    hex: '#b07bff',
  },
  {
    id: 'regen',
    startHour: 56,
    endHour: 72,
    name: 'Cellular Regeneration',
    tagline: 'Immune reset',
    body: 'Prolonged fasting triggers immune-cell turnover: old white blood cells are cleared and stem cells activate to help regenerate the immune system.',
    feeling: 'a deep calm and a real sense of accomplishment — move gently and honor what your body is doing',
    expect: {
      hunger: 'Low, with occasional brief waves. Interestingly, real appetite often returns right as the fast ends — your body knows the schedule.',
      head: 'Stay attentive: keep electrolytes precise, stand slowly, and rest when your body asks.',
      stomach: 'Fully rested and quiet — and being gently prepared for refeeding. Start thinking about your bone broth.',
      energy: 'Conserve it. Gentle walks are great; treat this stretch like the final miles of a marathon — dignified and unhurried.',
      mind: 'Calm, meditative, and a genuine sense of accomplishment. The finish line is in sight.',
    },
    colorVar: '--stage-regen',
    hex: '#ff6b9d',
  },
  {
    id: 'extended',
    startHour: 72,
    endHour: Infinity,
    name: 'Extended Regeneration',
    tagline: 'Advanced territory',
    body: 'Regenerative signaling continues. Beyond 72 hours is advanced territory — electrolytes and self-monitoring matter more with each passing hour.',
    feeling: 'in advanced territory — you know your body best now, so stay attentive and keep your electrolytes up',
    expect: {
      hunger: 'Low, but can return in waves. Respect real, persistent hunger — it\'s information.',
      head: 'Monitor closely. Any palpitations, fainting, or confusion means stop the fast and refeed — no badge is worth it.',
      stomach: 'Still fully at rest. The longer the fast, the gentler your eventual refeed needs to be.',
      energy: 'Noticeably lower reserves each day. Rest generously and keep every electrolyte dose.',
      mind: 'Usually clear, but self-awareness is the skill now: you know your body best. Stay honest with yourself.',
    },
    colorVar: '--stage-extended',
    hex: '#ffb547',
  },
];

/** The stage active at a given elapsed-hours value. */
export function stageAt(elapsedHours: number): Stage {
  const h = Math.max(0, elapsedHours);
  for (const s of STAGES) {
    if (h >= s.startHour && h < s.endHour) return s;
  }
  return STAGES[STAGES.length - 1];
}

/** Index of the stage active at elapsedHours. */
export function stageIndexAt(elapsedHours: number): number {
  const h = Math.max(0, elapsedHours);
  for (let i = 0; i < STAGES.length; i++) {
    if (h >= STAGES[i].startHour && h < STAGES[i].endHour) return i;
  }
  return STAGES.length - 1;
}

/**
 * The stages a fast of `durationHours` will pass through. The final stage is
 * clipped to the fast duration. Only stages that begin before the fast ends
 * are included (plus, always, the stage in progress at the finish line).
 */
export function stagesForFast(durationHours: number): StageWindow[] {
  const out: StageWindow[] = [];
  for (const s of STAGES) {
    if (s.startHour >= durationHours) break;
    const clippedEndHour = Math.min(s.endHour, durationHours);
    out.push({
      ...s,
      clippedEndHour,
      reached: durationHours >= s.endHour,
    });
  }
  // A zero/near-zero duration still shows at least the Fed State.
  if (out.length === 0) {
    out.push({ ...STAGES[0], clippedEndHour: durationHours, reached: false });
  }
  return out;
}

/** Rich progress snapshot for the live timer. */
export function stageProgress(
  elapsedHours: number,
  plannedDurationHours: number,
): StageProgress {
  const h = Math.max(0, elapsedHours);
  const idx = stageIndexAt(h);
  const current = STAGES[idx];
  const next = idx < STAGES.length - 1 ? STAGES[idx + 1] : null;

  const hoursIntoStage = h - current.startHour;
  const stageSpan =
    current.endHour === Infinity ? Infinity : current.endHour - current.startHour;
  const stagePct =
    stageSpan === Infinity ? 1 : clamp(hoursIntoStage / stageSpan, 0, 1);
  const hoursToNext = next ? Math.max(0, next.startHour - h) : null;

  const overallPct =
    plannedDurationHours > 0 ? clamp(h / plannedDurationHours, 0, 1) : 0;

  return {
    current,
    next,
    elapsedHours: h,
    hoursIntoStage,
    hoursToNext,
    stagePct,
    overallPct,
  };
}
