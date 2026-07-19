// ---------------------------------------------------------------------------
// Profile loading/saving, exposed app-wide via context so screens share one
// source of truth (and re-render when it changes).
// ---------------------------------------------------------------------------

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRepo } from '../data/repo';
import { useAuth } from './useAuth';
import type { Profile } from '../core/types';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  save: (patch: Partial<Profile>) => Promise<void>;
  reload: () => Promise<void>;
}

const ProfileContext = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const repo = useRepo();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const p = await repo.getProfile();
    setProfile(p);
    setLoading(false);
  }, [repo]);

  useEffect(() => {
    reload();
  }, [reload, user?.uid]);

  const save = useCallback(
    async (patch: Partial<Profile>) => {
      await repo.saveProfile(patch);
      setProfile((prev) => ({ ...(prev ?? ({} as Profile)), ...patch }));
    },
    [repo],
  );

  return (
    <ProfileContext.Provider value={{ profile, loading, save, reload }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileState {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
