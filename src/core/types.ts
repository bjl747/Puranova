// ---------------------------------------------------------------------------
// Puranova core domain types. Pure data — no React, no Firebase.
// ---------------------------------------------------------------------------

/** Which LMNT flavor the user drinks in their electrolyte cups. */
export type LmntFlavor = 'citrus' | 'watermelon';

export interface WorkBlock {
  label: string;
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

export interface DailyRhythm {
  wakeTime: string; // "HH:mm"
  bedTime: string; // "HH:mm" (may be < wakeTime, meaning it lands next day)
  workBlocks: WorkBlock[];
  notes?: string;
}

export interface Profile {
  displayName: string;
  weightLbs: number;
  containerOz: number; // default 40
  lmntFlavor: LmntFlavor; // preferred flavor for schedule copy
  includeCoffee: boolean; // whether to schedule black-coffee windows
  rhythm: DailyRhythm;
  /** slotId -> "HH:mm" user overrides applied to every fast day. */
  timeOverrides: Record<string, string>;
  onboarded: boolean;
  createdAt: number;
}

export type FastStatus = 'active' | 'refeed' | 'completed' | 'abandoned';

export interface RefeedState {
  brothAt?: number; // when step 1 (broth/egg) was checked off
  lockEndsAt?: number; // brothAt + 45min
  mealAt?: number; // when step 3 (solid meal) was checked off -> completes fast
}

export interface Fast {
  id: string;
  startAt: number; // epoch ms
  plannedEndAt: number; // epoch ms
  actualEndAt?: number; // epoch ms (set when fast ends, early or on time)
  status: FastStatus;
  // Snapshots taken at creation so profile edits don't rewrite an active fast.
  weightAtStart: number;
  containerOz: number;
  lmntFlavor: LmntFlavor;
  includeCoffee: boolean;
  rhythmSnapshot: DailyRhythm;
  refeed?: RefeedState;
}

/** A supplement/beverage item attached to a schedule event. */
export type ScheduleItem = 'water' | 'lmnt' | 'magnesium' | 'coffee';

export type ScheduleEventKind = 'cup' | 'coffee' | 'stage' | 'refeed' | 'marker';

export interface ScheduleEvent {
  id: string; // deterministic, e.g. `${fastId}-d0-cup1`
  fastId: string;
  day: number; // 0-based fast day
  at: number; // epoch ms (after applying overrides)
  kind: ScheduleEventKind;
  title: string;
  detail?: string;
  items: ScheduleItem[];
  optional: boolean;
  ounces?: number; // for cups: how much water this cup holds
  /** For 'marker' events (e.g. coffee cutoff) that are informational only. */
  informational?: boolean;
}

export interface CheckIn {
  id: string; // == ScheduleEvent.id
  fastId: string;
  scheduledAt: number;
  completedAt?: number;
  skipped?: boolean;
}

/** What to expect in a stage, dimension by dimension (Journey explorer). */
export interface StageExpectations {
  hunger: string;
  head: string; // head feel / headache risk
  stomach: string; // stomach & bowels
  energy: string;
  mind: string; // clarity vs brain fog
}

/** A metabolic stage window, hour-anchored from fast start. */
export interface Stage {
  id: string;
  startHour: number;
  endHour: number; // Infinity on the last
  name: string;
  tagline: string;
  body: string;
  feeling: string; // what the user commonly feels in this stage (for narration)
  expect: StageExpectations;
  colorVar: string; // CSS var name, e.g. "--stage-ketosis"
  hex: string; // resolved hex for canvas use
}

export interface StageWindow extends Stage {
  /** endHour truncated to the fast duration (for stagesForFast). */
  clippedEndHour: number;
  reached: boolean; // whether the fast is long enough to fully enter it
}

export interface StageProgress {
  current: Stage;
  next: Stage | null;
  elapsedHours: number;
  hoursIntoStage: number;
  hoursToNext: number | null;
  stagePct: number; // 0-1 through the current stage
  overallPct: number; // 0-1 through the whole planned fast
}

/** A scale reading the user logs at any time (fasting or not). */
export interface WeighIn {
  id: string;
  at: number; // epoch ms
  weightLbs: number;
  fastId?: string; // set when logged during an active fast
}

export type AchievementKind =
  | 'hour' // reach N elapsed hours in a single fast
  | 'count' // complete N fasts
  | 'cumulative' // accumulate N total fasted hours
  | 'streak' // fast in N consecutive weeks
  | 'special'; // bespoke condition (e.g. regenerator)

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or short glyph
  kind: AchievementKind;
  /** Threshold in the kind's unit (hours, fasts, hours, weeks). */
  threshold: number;
  /** The full story: what this milestone means and why it matters. */
  explanation: string;
}

/** One qualifying occurrence of a milestone in the user's history. */
export interface MilestoneHit {
  fastId: string;
  at: number; // when the qualifying fast started
  hours: number; // its fasted duration (elapsed-so-far if in progress)
  inProgress: boolean;
}

export interface AchievementProgress {
  current: number;
  target: number;
  unit: string; // 'h' | 'fasts' | 'weeks'
}

export interface UnlockedAchievement {
  unlockedAt: number;
  fastId: string;
}
