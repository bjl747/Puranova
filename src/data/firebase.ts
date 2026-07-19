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

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
