// ---------------------------------------------------------------------------
// Firestore-backed Repo. Data lives under users/{uid}/... (owner-only rules).
// ---------------------------------------------------------------------------

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Firestore,
} from 'firebase/firestore';
import type { Repo, Unsubscribe } from './repo';
import type {
  Profile,
  Fast,
  CheckIn,
  UnlockedAchievement,
  WeighIn,
} from '../core/types';

export class FirestoreRepo implements Repo {
  constructor(
    private db: Firestore,
    private uid: string,
  ) {}

  private userDoc() {
    return doc(this.db, 'users', this.uid);
  }
  private fastsCol() {
    return collection(this.db, 'users', this.uid, 'fasts');
  }
  private fastDoc(id: string) {
    return doc(this.db, 'users', this.uid, 'fasts', id);
  }
  private checkInsCol(fastId: string) {
    return collection(this.db, 'users', this.uid, 'fasts', fastId, 'checkins');
  }
  private achievementsCol() {
    return collection(this.db, 'users', this.uid, 'achievements');
  }

  async getProfile(): Promise<Profile | null> {
    const snap = await getDoc(this.userDoc());
    return snap.exists() ? (snap.data() as Profile) : null;
  }

  async saveProfile(patch: Partial<Profile>): Promise<void> {
    await setDoc(this.userDoc(), patch, { merge: true });
  }

  async createFast(fast: Omit<Fast, 'id'>): Promise<string> {
    const ref = doc(this.fastsCol());
    await setDoc(ref, { ...fast, id: ref.id });
    return ref.id;
  }

  async updateFast(id: string, patch: Partial<Fast>): Promise<void> {
    await setDoc(this.fastDoc(id), patch, { merge: true });
  }

  async getFast(id: string): Promise<Fast | null> {
    const snap = await getDoc(this.fastDoc(id));
    return snap.exists() ? (snap.data() as Fast) : null;
  }

  async listFasts(): Promise<Fast[]> {
    const snap = await getDocs(
      query(this.fastsCol(), orderBy('startAt', 'desc')),
    );
    return snap.docs.map((d) => d.data() as Fast);
  }

  watchActiveFast(cb: (fast: Fast | null) => void): Unsubscribe {
    const q = query(
      this.fastsCol(),
      where('status', 'in', ['active', 'refeed']),
    );
    return onSnapshot(
      q,
      (snap) => {
        const fasts = snap.docs.map((d) => d.data() as Fast);
        // Most recently started, if more than one somehow exists.
        fasts.sort((a, b) => b.startAt - a.startAt);
        cb(fasts[0] ?? null);
      },
      () => cb(null),
    );
  }

  async setCheckIn(fastId: string, checkIn: CheckIn): Promise<void> {
    await setDoc(doc(this.checkInsCol(fastId), checkIn.id), checkIn);
  }

  async listCheckIns(fastId: string): Promise<CheckIn[]> {
    const snap = await getDocs(this.checkInsCol(fastId));
    return snap.docs.map((d) => d.data() as CheckIn);
  }

  watchCheckIns(fastId: string, cb: (checkIns: CheckIn[]) => void): Unsubscribe {
    return onSnapshot(
      this.checkInsCol(fastId),
      (snap) => cb(snap.docs.map((d) => d.data() as CheckIn)),
      () => cb([]),
    );
  }

  async unlockAchievement(
    id: string,
    meta: UnlockedAchievement,
  ): Promise<void> {
    await setDoc(doc(this.achievementsCol(), id), meta, { merge: true });
  }

  async listAchievements(): Promise<Record<string, UnlockedAchievement>> {
    const snap = await getDocs(this.achievementsCol());
    const out: Record<string, UnlockedAchievement> = {};
    snap.docs.forEach((d) => (out[d.id] = d.data() as UnlockedAchievement));
    return out;
  }

  private weighInsCol() {
    return collection(this.db, 'users', this.uid, 'weighins');
  }

  async addWeighIn(weighIn: WeighIn): Promise<void> {
    await setDoc(doc(this.weighInsCol(), weighIn.id), weighIn);
  }

  async listWeighIns(): Promise<WeighIn[]> {
    const snap = await getDocs(query(this.weighInsCol(), orderBy('at', 'asc')));
    return snap.docs.map((d) => d.data() as WeighIn);
  }

  watchWeighIns(cb: (weighIns: WeighIn[]) => void): Unsubscribe {
    return onSnapshot(
      query(this.weighInsCol(), orderBy('at', 'asc')),
      (snap) => cb(snap.docs.map((d) => d.data() as WeighIn)),
      () => cb([]),
    );
  }
}
