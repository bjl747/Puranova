// ---------------------------------------------------------------------------
// Subscribes to the active fast + its check-ins and derives the live schedule,
// stage progress, and next/overdue events. One hook the ActiveFast screen and
// notification scheduler both build on.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';
import { useRepo } from '../data/repo';
import { useNow } from './useNow';
import { useProfile } from './useProfile';
import type { CheckIn, Fast, ScheduleEvent } from '../core/types';
import { generateSchedule } from '../core/schedule';
import { stageProgress } from '../core/stages';
import { buildTimeline } from '../core/timeline';
import { HOUR } from '../core/time';

export interface ActiveFastView {
  fast: Fast | null;
  loading: boolean;
  checkIns: Record<string, CheckIn>;
  /** Hydration + coffee schedule events (no stage/refeed markers). */
  schedule: ScheduleEvent[];
  /** Everything merged + sorted: cups, coffee, stage transitions, refeed. */
  timeline: ScheduleEvent[];
  elapsedHours: number;
  remainingMs: number;
  progress: ReturnType<typeof stageProgress> | null;
  /** Upcoming events (not yet due, not checked). */
  upcoming: ScheduleEvent[];
  /** Past-due actionable events without a check-in. */
  overdue: ScheduleEvent[];
}

export function useActiveFast(): ActiveFastView {
  const repo = useRepo();
  const { profile } = useProfile();
  const { now } = useNow();
  const [fast, setFast] = useState<Fast | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInList, setCheckInList] = useState<CheckIn[]>([]);

  useEffect(() => {
    setLoading(true);
    const unsub = repo.watchActiveFast((f) => {
      setFast(f);
      setLoading(false);
    });
    return unsub;
  }, [repo]);

  useEffect(() => {
    if (!fast) {
      setCheckInList([]);
      return;
    }
    const unsub = repo.watchCheckIns(fast.id, setCheckInList);
    return unsub;
  }, [repo, fast?.id]);

  const overrides = profile?.timeOverrides ?? {};

  const schedule = useMemo(
    () => (fast ? generateSchedule(fast, overrides) : []),
    [fast, overrides],
  );
  const timeline = useMemo(
    () => (fast ? buildTimeline(fast, overrides) : []),
    [fast, overrides],
  );

  const checkIns = useMemo(() => {
    const map: Record<string, CheckIn> = {};
    for (const c of checkInList) map[c.id] = c;
    return map;
  }, [checkInList]);

  const elapsedHours = fast ? Math.max(0, (now - fast.startAt) / HOUR) : 0;
  const remainingMs = fast ? Math.max(0, fast.plannedEndAt - now) : 0;
  const plannedHours = fast
    ? (fast.plannedEndAt - fast.startAt) / HOUR
    : 0;

  const progress = fast ? stageProgress(elapsedHours, plannedHours) : null;

  const actionable = schedule.filter((e) => !e.informational);
  const upcoming = actionable
    .filter((e) => e.at > now && !checkIns[e.id]?.completedAt)
    .slice(0, 6);
  const overdue = actionable.filter(
    (e) => e.at <= now && !checkIns[e.id]?.completedAt && !checkIns[e.id]?.skipped,
  );

  return {
    fast,
    loading,
    checkIns,
    schedule,
    timeline,
    elapsedHours,
    remainingMs,
    progress,
    upcoming,
    overdue,
  };
}
