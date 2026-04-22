# Kindred — CLAUDE.md

## Project Overview
**Kindred** ("Youth Learning Together") is a browser-based interactive game platform for LDS church youth groups (ages 14–16). It is a **multi-page Vite app** with a portal home page and two games sharing live state via Firebase Firestore.

**Portal entry point:** `index.html` — Kindred hub (game catalog + display scale gear menu)
**Admin portal:** `admin.html` — Google-authenticated admin for teachers, classrooms, and product backlog

**Games:**
- `games/common-ground.html` — **Common Ground** (survey/Family Feud-style, renamed from "Family Feud" to avoid Fremantle trademark)
- `games/memory.html` — **Scripture Scout** (memory matching pairs, renamed from "Memory Game")

**Each game has:**
- **Monitor View** — full-screen 16:9 TV display for the classroom
- **Admin View** — phone/iPad control panel for the teacher
- **Teacher Portal** — no-code content editor; create and publish custom question sets from a lesson URL

## Tech Stack
- **Frontend**: Vite MPA + vanilla HTML/CSS/JS (`index.html` + `games/*.html`)
- **Scripture Scout**: React 18 + Babel CDN (inline, no build step)
- **Real-time sync**: Firebase Firestore (anonymous auth)
- **AI**: Claude `claude-sonnet-4-6` via Anthropic API (Vite middleware in dev, Vercel functions in prod)
- **Dev port**: 5174 (5173 is reserved for another project on this machine)
- **Deployment target**: Vercel (static build + serverless functions in `/api`)

## Project Structure
```
FamilyFeud/
├── CLAUDE.md
├── index.html                  # Kindred portal — game catalog, display scale gear menu
├── admin.html                  # Admin portal — Google auth (lewiswf@gmail.com), teachers/classrooms/backlog
├── package.json
├── vite.config.js              # MPA build config (4 pages) + ALL dev middleware
├── public/
│   └── favicon.svg             # Kindred "K" logo — dark navy + neon cyan glow
├── games/
│   ├── common-ground.html      # Common Ground game — Monitor + Admin + Teacher Portal
│   └── memory.html             # Scripture Scout game — React 18, memory matching
├── api/
│   ├── generate.js             # Vercel serverless — AI backlog story generator
│   ├── fetch-content.js        # Vercel serverless — URL proxy/scraper for Teacher Portal
│   ├── generate-questions.js   # Vercel serverless — question generator (3 types)
│   ├── lesson-pipeline.js      # Thin Vercel wrapper around _lib/pipeline.js
│   └── _lib/
│       └── pipeline.js         # Shared pipeline v3 — dev + prod use the same module
├── src/
│   └── lib/
│       └── cfm-schedule.js     # Come Follow Me 2026 OT week → Gospel Library URL map
├── .claude/
│   ├── settings.json           # Project-level Claude Code permissions (committed)
│   ├── settings.local.json     # Machine-local permissions (gitignored)
│   ├── commands/
│   │   ├── extract-lesson.md   # /project:extract-lesson — fetch + parse CFM lesson
│   │   ├── youth-leader.md     # /project:youth-leader — generate lesson plan + game questions
│   │   └── gamemaster.md       # /project:gamemaster — privacy-safe classroom game session
│   └── agents/
│       ├── lesson-reviewer.md  # Subagent — per-item PASS/REWRITE/BLOCK verdict vs. Church policy
│       └── content-safety.md   # Subagent — fast child-safety gate (substances, exposure, URLs, TMs)
├── Opus47_Backlog.md           # Opus 4.7 backlog (P0–P3) for scaling Kindred to hundreds of teachers
├── lesson-database/            # Extracted lesson data (local, not Firestore)
│   ├── *.json                  # Structured lesson data with scriptures, themes, FSY connections
│   └── *-mindmap.md            # Mermaid mindmaps per lesson
├── backups/                    # Timestamped backups of CLAUDE.md and MEMORY.md
├── archive/                    # Historical reference — NOT wired into the build
│   ├── README.md               # Why these files are kept
│   ├── app.js.legacy           # Original prototype (pre-Vite)
│   ├── Exodus Matching Game/   # Reference game — HTML + audio assets (*.mp3 for OPUS-017)
│   ├── Exodus Family Feud Master Prompt.docx
│   └── Deployment & Safeguard Guide.docx
├── wled-firmware/
│   └── kindred-leds.ino        # Custom ESP8266 sketch — USB serial LED control (replaces WLED)
├── .env                        # Firebase + Anthropic keys (gitignored)
├── .env.example                # Template for .env
└── .gitignore
```

## Environment Variables
### Firebase (browser-side, `VITE_` prefix)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Anthropic API (server-side only, NO `VITE_` prefix)
- `ANTHROPIC_API_KEY` — used by `vite.config.js` middleware (dev) and all `api/*.js` functions (prod)

> **Security**: Never add `VITE_` prefix to `ANTHROPIC_API_KEY` — that would expose it in the browser bundle.

## Firebase Configuration
- **Project**: `family-feud-game-5b8e7`
- **App ID (Firestore path)**: `exodus-feud-final-v10` (unchanged — preserves all existing data)
- **Anonymous Auth**: Enabled
- **Firestore**: Standard edition, `nam5 (United States)`
- **Security rules**: Authenticated users can read/write `/artifacts/{appId}/public/**`

## Firestore Data Structure
```
artifacts/exodus-feud-final-v10/public/data/
├── feudSession/state                          # Global game state (fallback — no ?room=)
├── activeGame/current                         # Global active game (monitor fallback)
├── games/{gameId}                             # Global saved game sets
├── lessonLibrary/{lessonId}                   # Admin pre-generated lessons (always global)
│   ├── name, url, createdAt
│   ├── commonGround: { topic, rounds[], sourceUrl, generatedAt, videoLinks[], talkLinks[] }
│   └── memory:       { topic, pairs[], sourceUrl, generatedAt, videoLinks[], talkLinks[] }
├── classrooms/{classroomId}/
│   ├── feudSession/state                      # Classroom-scoped game state
│   ├── activeGame/current                     # Classroom-scoped active game
│   └── games/{gameId}                         # Classroom-scoped saved game sets
├── backlogItems/{docId}     # Backlog items (seqId, priority, description, batchIds, notes, createdAt)
└── blGuides/{blDocId}       # AI-generated implementation guides per BL item
```

## Dev Commands
```bash
npm install
npm run dev        # starts at http://localhost:5174 — all AI endpoints live
npm run build      # production build → dist/ (4 pages: index, admin, common-ground, memory)
npm run preview    # preview production build
```

> All `/api/*` endpoints work with `npm run dev` via Vite middleware in `vite.config.js`.
> `ANTHROPIC_API_KEY` must be in `.env` (no VITE_ prefix).

## Vite MPA Build Config
`vite.config.js` uses `rollupOptions.input` to build all four pages:
```js
build: {
    rollupOptions: {
        input: {
            main: resolve(__dirname, 'index.html'),
            admin: resolve(__dirname, 'admin.html'),
            commonGround: resolve(__dirname, 'games/common-ground.html'),
            memory: resolve(__dirname, 'games/memory.html'),
        }
    }
}
```

## Lesson Pipeline (`/api/lesson-pipeline`) — v3 (shared core + compliance)
Two-step Claude pipeline used by both games' Teacher Portal "From Lesson" mode. Mirrors the CLI skills chain (`extract-lesson` → `youth-leader`/`gamemaster`) but runs entirely server-side.

**Shared-module architecture (v3):** Both `api/lesson-pipeline.js` (Vercel handler) and the Vite dev middleware in `vite.config.js` are thin HTTP wrappers around `runLessonPipeline()` exported from [api/_lib/pipeline.js](api/_lib/pipeline.js). Dev and prod execute identical code — no more silent drift.

- **Input**: `{ url, gameType: 'common-ground' | 'memory', questionType: 'mixed' | 'scripture_based' | 'scripture_application' | 'family_feud' }`
- **Source URL allowlist**: hosts `churchofjesuschrist.org` (+ subdomains); path prefixes `/study/manual/`, `/study/general-conference/`, `/study/scriptures/`, `/study/ensign/`, `/study/liahona/`, `/study/new-era/`. Anything else → 400.
- **Output URL allowlist**: every `url` field emitted must be on `churchofjesuschrist.org`, `media.churchofjesuschrist.org`, `abn.churchofjesuschrist.org`, or `speeches.byu.edu`. Non-matching URLs are stripped and flagged.
- **Step 1 — Extraction**: Claude fetches and parses the lesson page, extracting `{ title, weekLabel, scriptureRefs[{ref, verseText, url, section}], videoLinks[], talkLinks[], discussionQuestions[], keyThemes[] }`. Claude supplies `verseText` from its training knowledge of the KJV/standard works.
- **Step 2 — Generation**: Claude consumes the extraction JSON and produces game-ready content using the Kindred Gamemaster rubric (Handbook §13, §37.8, Teaching in the Savior's Way, FSY).
- **Step 3 — Structural compliance (server-side, cannot be prompted away)**: validates required fields (verse/scene/question for pairs; question/answers/christConnection for rounds), scans all string fields against a hard-block keyword regex list (substances, sexual content, self-harm, etc.), stamps every item with `complianceCheck: "PASS" | "REVIEW: <reason>"`.
- **Step 4 — AI safety review** (gated by `ENABLE_SAFETY_REVIEW`, default on): a second Claude pass tags each item `pass | rewrite | block`, rewrites fields in place, and removes blocked items.
- **Common Ground output**: `{ topic, rounds[], sourceUrl, generatedAt, videoLinks[], talkLinks[], pipeline: 'lesson-pipeline-v3', complianceReport }`
- **Scripture Scout output**: `{ topic, pairs[{cardA, cardB, icon, iconLabel, scene, verse, question, christConnection, url, complianceCheck}], sourceUrl, generatedAt, videoLinks[], talkLinks[], pipeline: 'lesson-pipeline-v3', complianceReport }`
- **`complianceReport` shape**: `{ version: 'v3', policyRefs: ['Handbook §13', 'Handbook §37.8', "Teaching in the Savior's Way"], structural: {...}, safety: {...}, passCount, reviewCount, rewrittenCount, blockedCount, overall: 'PASS' | 'PASS_WITH_REWRITES' | 'REVIEW_REQUIRED' }`
- **Server-side retry**: if Claude API returns 500/503/529 or timeout/overload error, waits 5s and retries once
- **Client-side retry**: on any error, shows 30-second countdown in status bar and auto-retries; clicking Generate again cancels the countdown and retries immediately

## Come Follow Me Schedule (`src/lib/cfm-schedule.js`)
Maps every 2026 Old Testament Sunday to its Gospel Library URL and lesson id. Exports `getCurrentCfmLesson()`, `getCfmLessonForDate(date)`, `getNextCfmLesson(date)`, `resolveLessonIdFromUrl(url)`.
- Used by the admin Library tab's **⭐ Fill This Week's Lesson** button to prefill the lesson name + URL.
- Used by `addLibraryEntry()` to derive a deterministic doc ID (`cfm-{manual}-{slug}`) via `setDoc`, so repeat clicks on the same lesson no longer produce duplicate entries.
- Lesson blocks are 2-week teaching cycles (1st + 3rd Sunday); `weekStart` is the Sunday the lesson first opens.

## Compliance surfaces
- **Admin Library cards** ([admin.html](admin.html)) show a pill next to each generated game: `✓ Compliant` (green), `⚠ Rewritten` (amber), `⚠ Review required` (pink). Tooltip expands to pass/review/rewritten/blocked counts and cited policy refs.
- **Claude Code subagents** enforce the same policy outside the runtime pipeline:
  - `.claude/agents/lesson-reviewer.md` — per-item PASS/REWRITE/BLOCK verdict across Handbook §13, §37.8, Teaching in the Savior's Way, FSY. Invoked by the CLI skills before declaring a lesson "classroom-ready."
  - `.claude/agents/content-safety.md` — fast narrow filter for substances, sexual content, personal-exposure traps, URL allowlist, and trademark literals. Pre-commit / pre-deploy gate for user-facing strings.
- **Skills now emit compliance metadata** — `extract-lesson` adds `extractionReport`; `youth-leader` + `gamemaster` add `complianceReport` with `structural`, `christConnectionCoverage`, and an `overall` verdict. The UI trusts the report rather than re-auditing.

## Common Ground Game (`games/common-ground.html`)
- Renamed from "Family Feud" — same survey mechanic, no Fremantle trademark risk
- Back nav: `← Kindred Hub` → `../index.html`
- **Classroom scoping**: `?room={classroomId}` URL param → `basePath` points to `classrooms/{classroomId}` sub-path; falls back to global when no param (Monitor view)
  - `globalBasePath` always points to global path — used for `lessonLibrary` reads
  - All 9 Firestore path literals (`feudSession/state`, `activeGame/current`, `games/`) use `basePath`
- Teacher Portal has three entry points:
  - **📚 Library** (amber button) — dedicated sub-view; loads admin pre-generated lessons instantly, no API call
  - **🔗 From Lesson** — calls `/api/lesson-pipeline` with `gameType:'common-ground'`
  - **⚡ From URL** — calls `/api/fetch-content` then `/api/generate-questions` (original flow)
  - **✏️ Manual** — blank editor
- Display preset dropdown: Mobile (0.55) / Tablet (0.75) / HD (1.0) / 4K (1.3) — stored in `localStorage.kindred_display_scale`
- Game logic unchanged: `getGameRounds()`, Firestore sync, strikes, steal, switch play, undo
- **WLED lighting integration** — see section below

## LED Lighting Integration (Common Ground)
Addressable 9×7 WS2812B matrix (63 LEDs) on ESP8266 NodeMCU, controlled from the Admin view.

### Primary: USB Serial (Web Serial API)
- Custom firmware `wled-firmware/kindred-leds.ino` replaces WLED for direct USB control
- Admin view → **🔌 Connect USB** → Chrome serial port picker → commands sent via USB cable
- **Chrome only** (Web Serial API) — no WiFi, no network, no proxy needed
- Auto-reconnects on page load if Chrome has a previously approved port
- Works at any venue regardless of WiFi (church Liahona captive portal, no cell signal, etc.)

### Fallback: WiFi proxy
- `api/wled.js` (Vercel) + `/api/wled` middleware (Vite dev) proxy browser → WLED device
- IP stored in `localStorage.kindred_wled_ip`; enter in Admin view WiFi section
- Requires WLED firmware (not kindred-leds.ino) and device on same network as server

### Serial commands (`wled-firmware/kindred-leds.ino`)
| Command | Event | Effect |
|---|---|---|
| `STRIKE` | Wrong answer | Red flash × 3 |
| `REVEAL` | Correct answer revealed | Green flash × 1 |
| `STEAL:<text>` | 3rd strike steal | Pink scrolling text |
| `WIN:<text>` | Round win | Gold scrolling text |
| `SWITCH:<text>` | Switch Play | Orange scrolling text |
| `GAMEOVER:<text>` | Game Over | Purple scrolling text |
| `BRI:<0-255>` | Brightness | Live brightness change |

### Hardware
- ESP8266 ESP-12F NodeMCU, data pin D4 (GPIO2)
- 9×7 WS2812B matrix (63 LEDs); matrix layout: top-left, row-major, zigzag
- Arduino libraries: FastLED, FastLED_NeoMatrix, Adafruit GFX Library
- Future: second matrix for Team 2 — extend `wledTrigger(event, teamId)` with two serial ports

### Key functions
- `wledTrigger(event, text)` — prefers serial writer; falls back to WiFi proxy silently
- `window.wledConnectUsb()` — triggers Chrome serial port picker (requires user gesture)
- `buildSerialCmd(event, text)` — formats the serial command string

## Scripture Scout Game (`games/memory.html`)
- React 18 + Babel CDN — no separate build step, inline in single HTML file
- Back nav: `← Kindred Hub` → `../index.html`
- **12 default Exodus pairs** as fallback (no Firestore dependency for playing); each pair has `scene` (narrative context) and `verse` (KJV text) fields
- **Firebase module script** (`<script type="module">` before Babel script):
  - Initialises Firebase + Firestore + calls `signInAnonymously` (required for Firestore rules)
  - Exposes `window.loadMemoryLibrary()` and `window.loadMemoryFromLibrary(lessonId)` for use by React
  - Babel script cannot use ES module `import` — Firebase must be in a separate module script
  - `window.__kindredBasePath` and `window.__kindredGlobalBasePath` set from `?room=` param
- **Classroom scoping**: `?room={classroomId}` → `__kindredBasePath` used for game state; `__kindredGlobalBasePath` for library reads
- Teacher Portal (`portalView` state: `'home' | 'library' | 'lesson' | 'manual'`):
  - **Home view**: 2-column primary row (📚 Library amber · 🔗 From Lesson URL cyan) with subtitle hints; "✏️ Edit current pairs" shown below only when pairs already exist (contextual, not primary). The old "↺ Default" button was removed — default pairs now auto-load on mount.
  - **📚 Library** (amber button) — `portalView='library'`; loads admin pre-generated lessons instantly
    - `useEffect([portalView])` calls `loadMemoryLibrary()` with `cancelled` flag to prevent stale setState
    - On "Load →": calls `loadMemoryFromLibrary`, sets all state, navigates to `portalView='home'`
    - Clears `retryTimerRef` on load to prevent pending generation retries from overwriting pairs
  - **🔗 From Lesson URL** — calls `/api/lesson-pipeline` with `gameType:'memory'`, replaces pairs
  - Generate button disabled after generation for the same URL; re-enabled if URL changes
  - **Edit Pairs** — inline manual editing of cardA, cardB, question per pair
  - **Lesson summary card**: shows topic, pairs count, source URL, timestamp, video/talk links, pairs preview
  - **Gear icon (⚙) dropdown** in portal header — display scale presets (Mobile/Tablet/HD/4K)
- Card faces: both faces show the pair icon — Face A = cyan (scripture ref + title + icon), Face B = purple (key phrase + icon)
- **Match modal** — full-screen classroom-readable layout:
  - Giant icon left panel (orange border)
  - Right panel: scene pill (orange) → scripture ref → verse text (KJV, readable from back of room) → ✝ Christ Connection card (amber) → discussion question → QR code
  - Bottom action bar: Sabotage + Continue buttons
- Sabotage mechanic: shuffles unmatched cards every N matches
- **Scale compensation**: playing view uses inverse-size formula — `width: ${100/scale}vw, height: calc((100vh - 34px) * ${100/scale})` so `transform: scale(sf)` fills exactly the viewport; `top: 34px` offsets the fixed back-nav bar
- Web Audio API for flip/match/mismatch/win/sabotage sounds

## Kindred Portal (`index.html`)
- Hero: "Kindred" logo + "Youth Learning Together" tagline
- **Google Sign-In gate** — all users must sign in with Google
  - `lewiswf@gmail.com` (admin): bypasses classroom picker, enters portal with `room=null`
  - Other teachers: queries `classrooms` collection for `teacherEmail == user.email`
    - 0 classrooms → access-denied screen
    - 1 classroom → auto-selected
    - 2+ classrooms → picker modal
  - Classroom selection stored in `sessionStorage` (`kindred_classroom_id`, `kindred_classroom_name`)
- **Classroom badge** shown in header once signed in; sign-out clears session
- Game links (`#link-common-ground`, `#link-memory`) append `?room={classroomId}` for classroom scoping
- **Display Scale gear menu**: ⚙ button in header opens dropdown with Mobile/Tablet/HD/4K presets — writes `localStorage.kindred_display_scale`
- No backlog on the portal page — backlog lives in `admin.html`

## Admin Portal (`admin.html`)
- **Google Sign-In gate** — only `lewiswf@gmail.com` can access; others see an access-denied screen
- **5 tabs**: Overview, Teachers, Classrooms, Library, Backlog
- **Library tab**:
  - Add library entries: lesson name + churchofjesuschrist.org URL → stored in `lessonLibrary/{lessonId}` via `setDoc` with deterministic id `cfm-{manual}-{slug}` (blocks duplicate entries for the same URL)
  - **⭐ Fill This Week's Lesson** button — reads `getCurrentCfmLesson()` from `src/lib/cfm-schedule.js`, prefills name + URL for the current 2026 OT Sunday
  - Per-entry generate buttons: 🔗 Common Ground / 🧩 Memory → calls `/api/lesson-pipeline` and saves to entry
  - **Compliance pill** next to each generated game (✓ Compliant / ⚠ Rewritten / ⚠ Review required) — reads `complianceReport.overall`; tooltip shows pass/review/rewritten/blocked counts + cited policy refs
  - Expandable "▼ Content" per entry — shows videos, talks, CG rounds (with answer pills + points), Memory pairs (full verse text, icon, question)
  - **Batch generate all** button — generates any missing game type across all entries
  - Delete with confirmation
- **Backlog tab**: full backlog system (add items, priority/batch filters, inline edit + notes, AI Story Generator)
- Firestore collections used: `teachers`, `classrooms`, `lessonLibrary`, `backlogItems`, `blGuides`

## Teacher Portal — Question Types
- `scripture_based` — quotes verse verbatim, asks factual question, 4 answers (40/30/20/10 pts)
- `scripture_application` — quotes verse, asks how it applies today, 4 answers
- `family_feud` — classic survey style ("Name something…"), 6 answers (38/22/14/10/9/7 pts)
- `mixed` (lesson pipeline only) — 2 scripture_based + 2 scripture_application + 4 family_feud (8 total)

## Backlog System
- Items stored in Firestore `backlogItems` collection
- Fields: `seqId` (BL-001 format), `priority` (P0–P3), `description`, `batchIds[]`, `notes`, `createdAt`
- Inline edit per item (including notes), delete with confirmation
- Filter by priority badge or batch ID text search
- **6 seeded items**: BL-001 through BL-006 across BATCH-1, BATCH-2, BATCH-3
- Lives in `admin.html` (Backlog tab) — removed from portal and game pages

## AI Story Generator
- **🤖 Story** button on each backlog item → generates user stories, implementation plan, test cases, validation checklist, and a ready-to-paste Claude Code prompt
- **🤖 Generate Stories** in filter bar → batch mode (all items in a batch)
- Output auto-saved to Firestore `blGuides/{blDocId}`
- **📄 Guide** button (green) replaces 🤖 Story once a guide is saved
- Download as `{BL-ID}-implementation-guide.md` or copy to clipboard
- Model: `claude-sonnet-4-6`, max 8000 tokens
- Lives in `admin.html` (Backlog tab)

## Claude Code Skills (`.claude/commands/`)

### `/project:extract-lesson <URL>`
Fetches a Come Follow Me lesson page and extracts:
- All scripture references (section-aware, duplicate-flagged for children's sections)
- **Scripture verse texts**: fetches each referenced chapter from Gospel Library, parses `<p>` verse elements, attaches `verseText` (KJV, max 400 chars for ranges) to every `allScriptureRefs[]` entry
- Conference messages, video links, discussion questions
- Cross-references against YW Theme, AP Quorum Theme, Annual Youth Theme (HIGH/MEDIUM scoring)
- FSY chapter relevance scoring (fetches chapters scoring ≥5 pts)
- Stats include `verseTextFetched` / `verseTextFailed` counts

Output `allScriptureRefs[]` schema: `{ ref, book, chapter, verses, verseText, url, section, fromChildrenSection, isDuplicate }`
Saves: `lesson-database/{lessonId}.json` + `lesson-database/{lessonId}-mindmap.md`

### `/project:youth-leader <path-to-lesson.json>`
Takes an extracted lesson JSON and generates:
1. **Compliance report** — Handbook §13, age-appropriateness, gender-neutral, question safety
2. **50-minute lesson plan** — ice breaker → 2 scripture blocks (chain activity) → application → testimony invitation
3. **Engagement activity bank** — tagged by type/level/duration/materials
4. **QR code access points** — Gospel Library URLs for every scripture + conference talk + FSY chapter
5. **Game questions JSON** — 8 questions (2 scripture_based, 2 scripture_application, 4 family_feud); each question includes `verseText` (from `allScriptureRefs[]`) and `url` fields
6. **Mindmap teaching layer** — appended to existing lesson mindmap file

Reads `allScriptureRefs[].verseText` from the lesson JSON to quote verses verbatim; also reads `allVideoLinks[]` and `allConferenceMessages[]`.
Teaching model: Teaching in the Savior's Way · Handbook §13 · chain activity mechanic ·
L1 factual → L4 testimony · no PowerPoint · teacher talks <20% of class time

### `/project:gamemaster <path-to-lesson.json>`
Takes lesson JSON (from extract-lesson) and/or lesson plan (from youth-leader) and generates:
1. **Privacy & safety audit** — Handbook §13, §37.8 (personal data), no individual exposure, two-adult rule
2. **Game session plan** — primary game + micro warm-up, full facilitation script, roles for every student
3. **Question cards** (print-ready) — 8–12 questions with scripture anchor + Christ connection per card
4. **Friendly Sabotage deck** (print-ready) — mild disruption cards each tied to a scripture
5. **Game questions JSON** — Teacher Portal-ready; each question includes `verseText` (from `allScriptureRefs[]`) and `url` fields
6. **Mindmap game layer** — appended to existing lesson mindmap file

Reads `allScriptureRefs[].verseText` to quote verses verbatim in facilitation scripts and question cards; also reads `allVideoLinks[]` and `allConferenceMessages[]`.
Design principles: No spectators · team scoring only (no individual leaderboards) · every game includes opening scripture + closing testimony invitation · copyright-clear · Jesus Christ is the subject of every round

## Lesson Database (`lesson-database/`)
Extracted lesson JSON files from Come Follow Me. Not stored in Firestore — local files only.
Current: `old-testament-2026-lesson-20` (Deuteronomy 6–8; 15; 18; 29–30; 34 · May 11–17)

## Reference Assets
Archived under `archive/` (see `archive/README.md` for why they're kept):
- `archive/Exodus Matching Game/Exodus-game.html` — original Scripture memory matching game (reference for Scripture Scout)
- `archive/Exodus Family Feud Master Prompt.docx` — Original game design document
- `archive/Deployment & Safeguard Guide.docx` — Deployment notes
- `archive/app.js.legacy` — Original pre-Vite prototype

## Deployment (Vercel)
1. Push to GitHub (`Sugo69/kindred-youth`, branch `main`)
2. Import repo in Vercel dashboard
3. Set all `VITE_*` env vars + `ANTHROPIC_API_KEY` (no VITE_ prefix)
4. Deploy — Vercel auto-detects Vite MPA; all `api/*.js` files become serverless functions

## Key Constraints
- Dev port **must be 5174** — 5173 is used by another project on this machine
- Firebase anonymous auth — game players use anonymous auth; teachers sign in via Google (index.html + admin.html)
- **Portal + Admin use Google auth** — `lewiswf@gmail.com` is admin; other Google accounts are teachers (must be assigned to a classroom in admin)
- `ANTHROPIC_API_KEY` must never have `VITE_` prefix
- `.mp4` video files are gitignored (too large for GitHub — up to 287MB each)
- `.claude/settings.local.json` is gitignored — contains machine-specific Claude Code permissions
- `getGameRounds()` must always be used instead of direct `gameData[]` access in Common Ground
- `appId = 'exodus-feud-final-v10'` is intentionally kept — changing it would orphan all Firestore data
- Display scale is stored in `localStorage.kindred_display_scale` — read by both games on mount; written by portal gear menu and Scripture Scout portal gear icon
- Scripture Scout playing view scale fix: use inverse-size formula (`width: ${100/scale}vw, height: calc((100vh - 34px) * ${100/scale})` + `top: 34px`) — `transform: scale()` does not affect CSS layout, so logical dimensions must compensate
- **Classroom isolation**: `?room={classroomId}` gates both games to classroom-scoped Firestore. `basePath` variable switches; Monitor view (no param) falls back to global path
- **`lessonLibrary` is always global** — admin populates it; all teachers read from it regardless of `?room=`
- **Scripture Scout Firebase**: module script (`<script type="module">`) must call `signInAnonymously` before any Firestore read; Babel script (`<script type="text/babel">`) cannot use ES module `import`
- `sessionStorage` keys: `kindred_classroom_id` (room ID), `kindred_classroom_name` (display name) — cleared on sign-out
