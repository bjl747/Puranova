# Firebase Setup & Deploy

Puranova runs fully in **demo mode** (localStorage, no sign-in) with zero
configuration — `npm install && npm run dev` just works. Follow this guide only
when you want Google sign-in and cloud sync across devices, and to host the app.

Everything below uses Firebase's free **Spark** plan.

---

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it (e.g. `puranova`), accept defaults, and create it.

## 2. Register a Web App and copy the config

1. In the project, click the **Web** icon (`</>`) to add a web app.
2. Give it a nickname; you do **not** need Firebase Hosting checkbox yet.
3. Firebase shows a `firebaseConfig` object. Copy those values into a
   `.env.local` file at the repo root (copy `.env.example` first):

   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=puranova.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=puranova
   VITE_FIREBASE_STORAGE_BUCKET=puranova.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
   ```

   Restart `npm run dev` after creating the file. The Welcome screen should now
   show **Continue with Google** instead of the demo-mode notice.

## 3. Enable Google sign-in

1. In the console: **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Google** and save.
3. Under **Settings → Authorized domains**, make sure `localhost` is present
   (it is by default) and add your production hosting domain later
   (`puranova.web.app` / your custom domain).

## 4. Create the Firestore database

1. **Build → Firestore Database → Create database**.
2. Choose **Production mode** and a location near your users.
3. Deploy the security rules from this repo (owner-only access):

   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add        # pick your project, alias it "default"
   firebase deploy --only firestore:rules
   ```

The rules (`firestore.rules`) restrict every document to its owning user —
`request.auth.uid == uid` across the whole `users/{uid}` subtree.

## 5. Build & deploy hosting

```bash
npm run build
firebase deploy --only hosting
```

`firebase.json` is already configured:

- `public: dist` — serves the Vite production build
- SPA rewrite of all routes to `/index.html`
- long-cache headers for hashed assets, `no-cache` for the service worker

After deploy, add the hosting domain to **Authentication → Authorized domains**
so Google sign-in works in production.

### Deploy everything at once

```bash
npm run build && firebase deploy
```

---

## Data model

```
users/{uid}                               -> Profile
users/{uid}/fasts/{fastId}                -> Fast
users/{uid}/fasts/{fastId}/checkins/{id}  -> CheckIn   (id == schedule event id)
users/{uid}/achievements/{slug}           -> { unlockedAt, fastId }
```

Schedules are **derived** deterministically from each fast and the user's time
overrides, so they are never stored — only check-ins and overrides are. This
keeps writes tiny and free-tier-friendly.

## PWA install

- **Android/Chrome:** visit the site → menu → *Install app*.
- **iOS/Safari:** Share → *Add to Home Screen*. Note: web notifications on iOS
  require iOS 16.4+ **and** the installed (home-screen) PWA.

## Notifications — current limitation & the v2 path

v1 has **no server push.** Reminders fire from an in-app scheduler while the tab
is open or backgrounded (via the service worker's `showNotification`). They stop
if the tab is fully closed; on return, the ActiveFast screen shows a *Catch up*
list of past-due items.

For true background push (fire even when the app is closed), the v2 path is
**Firebase Cloud Messaging + a scheduled Cloud Function** that sends each user's
upcoming cup/dose/stage notifications. Cloud Functions requires the **Blaze**
(pay-as-you-go) plan, which is why it's deferred.

## Troubleshooting

- **Sign-in popup blocked** → the app automatically falls back to a full-page
  redirect sign-in.
- **Welcome shows demo notice unexpectedly** → a `VITE_FIREBASE_*` var is
  missing or `.env.local` wasn't picked up; restart the dev server.
- **Permission denied on Firestore** → make sure you deployed the rules and are
  signed in; each user can only touch their own `users/{uid}` subtree.
