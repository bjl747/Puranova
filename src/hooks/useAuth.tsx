// ---------------------------------------------------------------------------
// Auth + repo wiring. Provides the current user, sign-in/out, and the correct
// Repo implementation (Firestore when signed in, LocalRepo in demo mode).
// ---------------------------------------------------------------------------

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, db, firebaseAvailable } from '../data/firebase';
import { isMobileOrSafari, isStandalonePWA } from '../data/browserEnv';
import { RepoContext, type Repo } from '../data/repo';
import { LocalRepo } from '../data/localRepo';
import { FirestoreRepo } from '../data/firestoreRepo';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  isDemo: boolean;
  firebaseAvailable: boolean;
  signInWithGoogle: () => Promise<void>;
  startDemo: () => void;
  signOut: () => Promise<void>;
}

const DEMO_USER: AuthUser = {
  uid: 'demo',
  displayName: 'Explorer',
  photoURL: null,
  email: null,
};

const DEMO_FLAG = 'puranova:demo-mode';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore a prior demo session immediately.
    if (localStorage.getItem(DEMO_FLAG) === '1') {
      setIsDemo(true);
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }
    if (!firebaseAvailable || !auth) {
      setLoading(false);
      return;
    }
    // Complete any redirect-based sign-in (mobile/Safari/in-app flows).
    getRedirectResult(auth).catch(() => {
      /* no pending redirect, or it failed — onAuthStateChanged still governs */
    });
    const unsub = onAuthStateChanged(auth, (u: User | null) => {
      setUser(
        u
          ? {
              uid: u.uid,
              displayName: u.displayName,
              photoURL: u.photoURL,
              email: u.email,
            }
          : null,
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error('Firebase not configured');

    // On mobile, Safari, and installed PWAs, popups are unreliable or blocked —
    // go straight to the full-page redirect flow. Desktop browsers get the
    // nicer popup, with a redirect fallback if it's blocked.
    if (isMobileOrSafari() || isStandalonePWA()) {
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (
        code.includes('popup-blocked') ||
        code.includes('cancelled-popup-request') ||
        code.includes('popup-closed-by-user') ||
        code.includes('operation-not-supported')
      ) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw err;
      }
    }
  };

  const startDemo = () => {
    localStorage.setItem(DEMO_FLAG, '1');
    setIsDemo(true);
    setUser(DEMO_USER);
  };

  const signOut = async () => {
    if (isDemo) {
      localStorage.removeItem(DEMO_FLAG);
      setIsDemo(false);
      setUser(null);
      return;
    }
    if (auth) await fbSignOut(auth);
  };

  const repo: Repo | null = useMemo(() => {
    if (!user) return null;
    if (isDemo || !db) return new LocalRepo(user.uid);
    return new FirestoreRepo(db, user.uid);
  }, [user, isDemo]);

  const value: AuthState = {
    user,
    loading,
    isDemo,
    firebaseAvailable,
    signInWithGoogle,
    startDemo,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      <RepoContext.Provider value={repo}>{children}</RepoContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
