// ---------------------------------------------------------------------------
// Firebase initialization with graceful degradation. If the VITE_FIREBASE_*
// env vars are missing, `firebaseAvailable` is false and the app runs in demo
// mode (localStorage) instead of throwing.
// ---------------------------------------------------------------------------

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

// Public Firebase web config for project "puranova". These values are NOT
// secret — they ship in every client bundle by design, and access is enforced
// by Firestore security rules and Auth settings, not by hiding them. They act
// as a committed fallback so builds are always connected; env vars (.env.local)
// override them for anyone pointing the app at a different Firebase project.
const DEFAULT_CONFIG = {
  apiKey: 'AIzaSyDwIPGzQbHBo3NAW9upAs5t_DgFKaD_5S8',
  // Use the Hosting domain (same origin the app is served from) so the Google
  // OAuth handshake is first-party. Pointing authDomain at the default
  // *.firebaseapp.com makes the redirect flow rely on cross-domain storage,
  // which Safari/iOS (and increasingly Chrome) block — causing sign-in to
  // "loop" back to Welcome. Firebase Hosting serves the /__/auth/ handler here.
  authDomain: 'puranova.web.app',
  projectId: 'puranova',
  storageBucket: 'puranova.firebasestorage.app',
  messagingSenderId: '458136042300',
  appId: '1:458136042300:web:f9107673e72f1217d0bc39',
};

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_CONFIG.apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_CONFIG.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_CONFIG.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    DEFAULT_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_CONFIG.appId,
};

export const firebaseAvailable = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (firebaseAvailable) {
  app = initializeApp(config);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  // Offline persistence so timers/schedules survive reloads and flaky networks.
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Fallback (e.g. private-mode with no IndexedDB): default in-memory cache.
    db = initializeFirestore(app, {});
  }
}

export { app, auth, db, googleProvider };
