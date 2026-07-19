# Puranova

A mobile-first water-fasting companion with a futuristic, cellular-regeneration
aesthetic. Puranova guides you through a fast — 24, 48, 72 hours, or custom —
with a live metabolic-stage countdown, a hydration and electrolyte schedule
scaled to your body and anchored to your daily rhythm, and a structured refeed
protocol.

> ⚕️ **Educational tool, not medical advice.** Extended fasting isn't right for
> everyone. Talk to a physician before starting one, and stop if you feel unwell.

## Features

- **Live stage timer** — a countdown broken into the metabolic stages of a fast:
  fed state, glycogen depletion, the metabolic switch, ketosis, autophagy,
  growth-hormone peak, and cellular regeneration. Stages are hour-anchored, so a
  24h and a 72h fast hit the same early milestones at the same times.
- **Personalized hydration math** — daily water = body weight (lbs) × 0.45 oz,
  split into container-sized cups across your real waking hours.
- **Electrolyte & supplement schedule** — LMNT Citrus Salt / Watermelon Salt +
  BioEmblem Triple Magnesium placed on your morning and evening cups, with the
  science of *why* explained inline.
- **Black-coffee windows** — fast-safe black coffee, hard-capped at 2 PM to
  protect sleep.
- **Guided refeed** — bone broth / soft-boiled egg → a mandatory 45-minute
  digestion lock → your first solid meal.
- **Google sign-in + cloud sync** (Firebase) with a full **local demo mode** when
  no credentials are configured.
- **Reminders, achievements, history & streaks**, and an animated cellular hero
  visual that evolves with your current stage.
- **Installable PWA**, offline-capable app shell.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL. With no Firebase config the app runs in **demo mode** — tap
**Try the demo** to go through onboarding, start a fast, and (via the hidden
demo *time-travel* control on the fast screen) fast-forward through every stage.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm test` | Vitest core-logic suites (stage/schedule/hydration/refeed/stats math) |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript only |

## Environment variables

Copy `.env.example` to `.env.local` and fill in your Firebase Web App config to
enable Google sign-in and cloud sync. Leave them blank to stay in demo mode.
See **[docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)** for the full setup and
deploy walkthrough.

| Variable | Source |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase console → Web App config |
| `VITE_FIREBASE_AUTH_DOMAIN` | " |
| `VITE_FIREBASE_PROJECT_ID` | " |
| `VITE_FIREBASE_STORAGE_BUCKET` | " |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | " |
| `VITE_FIREBASE_APP_ID` | " |

## Architecture

```
src/
  core/       Pure, fully unit-tested logic (no React/Firebase):
              stages, hydration, schedule, timeline, refeed, stats, achievements
  data/       Repo interface + Firestore and localStorage (demo) backends
  hooks/      useAuth, useProfile, useNow (with demo time-travel), useActiveFast
  notify/     Notification permission, in-app scheduler, catch-up
  components/ CellularHero, CountdownRing, StageTimeline, ScheduleList, charts, UI
  screens/    Welcome, Onboarding, Dashboard, FastSetup, ActiveFast, Refeed,
              History, Achievements, Profile, Learn
  content/    Learn-screen copy + safety disclaimer
```

The core engines are UI- and backend-agnostic. Schedules are **derived**
deterministically from a fast plus per-user time overrides, so only check-ins
and overrides are ever persisted.

## Notifications

Web push without a server can't wake a fully-closed tab, so v1 fires reminders
from an in-app scheduler while the app is open or backgrounded. Install the PWA
and keep it open during a fast for the best experience; the ActiveFast screen
shows a **Catch up** list for anything missed. The v2 background-push path
(Firebase Cloud Messaging + a scheduled Cloud Function) is documented in the
setup guide.

## Tech

React + Vite + TypeScript · Firebase (Auth, Firestore, Hosting) ·
`vite-plugin-pwa` · Vitest. Hand-rolled design system and SVG charts — no UI or
charting libraries.
