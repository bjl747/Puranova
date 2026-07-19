// ---------------------------------------------------------------------------
// localStorage-backed Repo for demo mode (and offline dev). Namespaced by a
// user id so a signed-out demo user and a signed-in user never collide.
// ---------------------------------------------------------------------------

import type { Repo, Unsubscribe } from './repo';
import type {
  Profile,
  Fast,
  CheckIn,
  UnlockedAchievement,
} from '../core/types';

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export class LocalRepo implements Repo {
  private ns: string;
  private activeWatchers = new Set<(f: Fast | null) => void>();
  private checkInWatchers = new Map<string, Set<(c: CheckIn[]) => void>>();

  constructor(uid: string) {
    this.ns = `puranova:${uid}`;
  }

  private k(...parts: string[]) {
    return [this.ns, ...parts].join(':');
  }

  async getProfile(): Promise<Profile | null> {
    return readJSON<Profile | null>(this.k('profile'), null);
  }

  async saveProfile(patch: Partial<Profile>): Promise<void> {
    const cur = (await this.getProfile()) ?? ({} as Profile);
    writeJSON(this.k('profile'), { ...cur, ...patch });
  }

  private allFasts(): Fast[] {
    return readJSON<Fast[]>(this.k('fasts'), []);
  }

  private writeFasts(fasts: Fast[]): void {
    writeJSON(this.k('fasts'), fasts);
    this.emitActive();
  }

  async createFast(fast: Omit<Fast, 'id'>): Promise<string> {
    const id = `fast_${fast.startAt.toString(36)}_${Math.floor(
      (fast.plannedEndAt - fast.startAt) / 60000,
    ).toString(36)}`;
    const fasts = this.allFasts();
    fasts.push({ ...fast, id });
    this.writeFasts(fasts);
    return id;
  }

  async updateFast(id: string, patch: Partial<Fast>): Promise<void> {
    const fasts = this.allFasts().map((f) =>
      f.id === id ? { ...f, ...patch } : f,
    );
    this.writeFasts(fasts);
  }

  async getFast(id: string): Promise<Fast | null> {
    return this.allFasts().find((f) => f.id === id) ?? null;
  }

  async listFasts(): Promise<Fast[]> {
    return this.allFasts().sort((a, b) => b.startAt - a.startAt);
  }

  private activeFast(): Fast | null {
    return (
      this.allFasts().find(
        (f) => f.status === 'active' || f.status === 'refeed',
      ) ?? null
    );
  }

  private emitActive(): void {
    const f = this.activeFast();
    this.activeWatchers.forEach((cb) => cb(f));
  }

  watchActiveFast(cb: (fast: Fast | null) => void): Unsubscribe {
    this.activeWatchers.add(cb);
    cb(this.activeFast());
    return () => this.activeWatchers.delete(cb);
  }

  private allCheckIns(fastId: string): CheckIn[] {
    return readJSON<CheckIn[]>(this.k('checkins', fastId), []);
  }

  async setCheckIn(fastId: string, checkIn: CheckIn): Promise<void> {
    const list = this.allCheckIns(fastId).filter((c) => c.id !== checkIn.id);
    list.push(checkIn);
    writeJSON(this.k('checkins', fastId), list);
    this.checkInWatchers.get(fastId)?.forEach((cb) => cb(list));
  }

  async listCheckIns(fastId: string): Promise<CheckIn[]> {
    return this.allCheckIns(fastId);
  }

  watchCheckIns(fastId: string, cb: (checkIns: CheckIn[]) => void): Unsubscribe {
    let set = this.checkInWatchers.get(fastId);
    if (!set) {
      set = new Set();
      this.checkInWatchers.set(fastId, set);
    }
    set.add(cb);
    cb(this.allCheckIns(fastId));
    return () => set!.delete(cb);
  }

  async unlockAchievement(
    id: string,
    meta: UnlockedAchievement,
  ): Promise<void> {
    const cur = await this.listAchievements();
    if (cur[id]) return; // idempotent
    cur[id] = meta;
    writeJSON(this.k('achievements'), cur);
  }

  async listAchievements(): Promise<Record<string, UnlockedAchievement>> {
    return readJSON<Record<string, UnlockedAchievement>>(
      this.k('achievements'),
      {},
    );
  }
}
