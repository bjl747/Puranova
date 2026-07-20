// ---------------------------------------------------------------------------
// Persistence interface. Both the Firestore and localStorage (demo) backends
// implement this, so the UI never knows which one is active.
// ---------------------------------------------------------------------------

import { createContext, useContext } from 'react';
import type {
  Profile,
  Fast,
  CheckIn,
  UnlockedAchievement,
  WeighIn,
} from '../core/types';

export type Unsubscribe = () => void;

export interface Repo {
  getProfile(): Promise<Profile | null>;
  saveProfile(patch: Partial<Profile>): Promise<void>;

  createFast(fast: Omit<Fast, 'id'>): Promise<string>;
  updateFast(id: string, patch: Partial<Fast>): Promise<void>;
  getFast(id: string): Promise<Fast | null>;
  listFasts(): Promise<Fast[]>;
  /** Live subscription to the currently active/refeed fast (or null). */
  watchActiveFast(cb: (fast: Fast | null) => void): Unsubscribe;

  setCheckIn(fastId: string, checkIn: CheckIn): Promise<void>;
  listCheckIns(fastId: string): Promise<CheckIn[]>;
  watchCheckIns(fastId: string, cb: (checkIns: CheckIn[]) => void): Unsubscribe;

  unlockAchievement(id: string, meta: UnlockedAchievement): Promise<void>;
  listAchievements(): Promise<Record<string, UnlockedAchievement>>;

  addWeighIn(weighIn: WeighIn): Promise<void>;
  listWeighIns(): Promise<WeighIn[]>;
  watchWeighIns(cb: (weighIns: WeighIn[]) => void): Unsubscribe;
}

export const RepoContext = createContext<Repo | null>(null);

export function useRepo(): Repo {
  const repo = useContext(RepoContext);
  if (!repo) throw new Error('useRepo must be used within a RepoProvider');
  return repo;
}
