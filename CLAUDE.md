# Exodus Family Feud — CLAUDE.md

## Project Overview
A browser-based Family Feud-style game for the Exodus Sunday School youth group (ages 14–16). Two views share live state via Firebase Firestore:
- **Monitor View** — full-screen 16:9 TV display for the classroom
- **Admin View** — phone/iPad control panel for the teacher

## Tech Stack
- **Frontend**: Vite + vanilla HTML/CSS/JS (single `index.html`)
- **Real-time sync**: Firebase Firestore (anonymous auth)
- **Dev port**: 5174 (5173 is reserved for another project)
- **Deployment target**: Vercel (static) or Railway

## Project Structure
```
FamilyFeud/
├── CLAUDE.md
├── index.html          # Main game (TV + Admin views in one file)
├── package.json
├── vite.config.js
├── .env.example        # Firebase config template
├── .env                # Firebase config (gitignored)
└── .gitignore
```

## Firebase Configuration
Firebase config is injected via Vite env vars (never hardcoded). All vars prefixed `VITE_`:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

For Vercel: set these as Environment Variables in the Vercel dashboard.

## Anthropic API (AI Story Generator)
- `ANTHROPIC_API_KEY` — server-side only (not VITE_ prefixed, never exposed to browser)
- Used by `api/generate.js` Vercel serverless function
- Calls `claude-sonnet-4-6` to generate user stories + implementation guides per batch

## Game Rules / Logic
- 10 rounds of Exodus-themed questions (see `gameData` array in `index.html`)
- 3 strikes = opponent gets steal opportunity
- After 2 consecutive wins by same team → switch play (fairness rule)
- Auto-advances round 6s after a win banner
- Undo last action supported (prevState stored in Firestore)
- Full game reset requires double-tap confirmation

## Views
**Monitor (TV)** — `/` with `?view=monitor` or via settings menu
- Neon cyberpunk theme (Orbitron + Permanent Marker fonts)
- Answer board flips cards on reveal
- Strike tracker (3 X marks), score HUD at bottom
- Sound effects via Web Audio API

**Admin (Phone/iPad)** — same URL, switch via ⚙️ menu
- Teams & Scoring (name, ±5 score, manual win)
- Match Play (Face-Off / Team Playing, wrong answer, clear strikes)
- Management (undo, dismiss banner, next/prev round, end game)
- Reveal Answers (per-answer reveal buttons)

## Dev Commands
```bash
npm install
npm run dev        # starts at http://localhost:5174 — includes AI Story Generator
npm run build      # production build → dist/
npm run preview    # preview production build
```

> **AI Story Generator** works with `npm run dev`. Vite serves `/api/generate`
> as a built-in middleware plugin. Requires `ANTHROPIC_API_KEY` in `.env`.

## Deployment (Vercel)
1. Push to GitHub (repo: Sugo69/FamilyFeud)
2. Import repo in Vercel dashboard
3. Set all `VITE_*` env vars
4. Deploy — Vercel auto-detects Vite

## Key Constraints
- Dev port MUST be 5174 (not 5173 — used by another project)
- Firebase anonymous auth (no login required for players)
- Game state lives in: `artifacts/{appId}/public/data/feudSession/state`
