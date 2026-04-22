# Opus 4.7 Review — Kindred Backlog

**Reviewer:** Claude Opus 4.7
**Date:** 2026-04-21
**Source inputs:** CLAUDE.md, MEMORY.md, screenshots (portal / Scripture Scout portal + library + mission briefing + gameplay, admin Overview/Teachers/Classrooms/Library), skill files (extract-lesson, youth-leader, gamemaster), code (admin.html, games/memory.html, api/lesson-pipeline.js).

## Framing
Kindred works for **one ward with one admin**. To reach **hundreds of teachers worldwide** across wards, stakes, and countries, three structural gaps must close:

1. **Teacher self-service** — today every teacher must be hand-added by `lewiswf@gmail.com`; this is the hard ceiling on scale.
2. **Church-guideline surface** — the three skills (`extract-lesson`, `youth-leader`, `gamemaster`) encode real policy (Handbook §13, §37.8, Teaching in the Savior's Way, FSY, two-adult rule, copyright). None of that policy metadata reaches the teacher UI. Compliance is invisible.
3. **Game polish & media** — the Gemini Canvas version of Scripture Scout played real sounds, showed scripture + art + video, and played video sequences in narrative order. The Claude port uses oscillator beeps and link lists. Engagement regression is real and visible.

Everything below flows from those three.

Priority scale: **P0** = blocks scaling now · **P1** = teacher experience / compliance · **P2** = Gemini parity & polish · **P3** = analytics & long-term.

Effort: **S** ≤ 1 day · **M** 2–4 days · **L** 1+ week.

---

## P0 — Scale blockers

### OPUS-001 · Teacher self-signup via Google, pending admin approval
**Problem:** Teachers cannot create their own account. Admin must add email + ward manually in `admin.html` before the teacher can even pick a classroom. Blocks growth past a single ward.
**Solution:** On first Google sign-in at [index.html](index.html), if no teacher record exists, create a `pendingTeachers/{email}` doc. Admin sees a "Pending approval" tab with Approve / Deny. On approve, move to `teachers/{email}`, send a welcome email, show the classroom picker. Denied accounts see a polite access-denied screen.
**Acceptance:**
- New Google account signing in creates a pending record and sees "Awaiting approval" screen
- Admin sees pending queue with name / email / ward (user-supplied)
- Approval moves the record and unlocks portal access on next sign-in
- Denial records the decision and reason for audit
**Effort:** M

### OPUS-002 · Stake / ward tenancy above classroom
**Problem:** `classrooms` is a single flat collection under `artifacts/exodus-feud-final-v10/public/data/classrooms`. At 100s of teachers across dozens of wards there is no way to scope who sees what, and ward-level admins cannot manage their own teachers.
**Solution:** Introduce `stakes/{stakeId}/wards/{wardId}/classrooms/{classroomId}`. Add a `role` field on teachers: `global_admin | stake_admin | ward_admin | teacher`. Gate admin tabs by role. Keep `lessonLibrary` global (as noted in CLAUDE.md — correctly).
**Acceptance:**
- Stake admin sees only their stake's wards/classrooms
- Ward admin sees only their ward's classrooms & teachers
- Global admin (lewiswf@gmail.com today) sees everything
- Firestore rules enforce the scope (not just UI)
**Effort:** L

### OPUS-003 · Pre-generated rolling 52-week library
**Problem:** Each teacher clicking "From Lesson URL" calls `/api/lesson-pipeline` — at ~$0.30–$1.00/run × 100s of teachers × weekly = $500–$2,000/month and duplicative work. Library today holds only what the admin happened to enter.
**Solution:** Weekly scheduled job (Vercel Cron or GitHub Action) that pre-generates both Common Ground and Scripture Scout content for the current week's Come Follow Me lesson, writes to `lessonLibrary/{yyyy-ww}`. Teachers see "This Sunday's Lesson — ready to play" on the portal. Admin can still manually add/override.
**Acceptance:**
- Scheduled job populates next Sunday's lesson by Thursday each week
- Portal home shows "This Sunday: <Lesson Title>" with Play buttons for both games
- Library tab shows last 8 weeks + next 2 weeks
- Re-generation does not duplicate (uses week ID as doc ID)
**Effort:** M

### OPUS-004 · Auto-detect current Come Follow Me week
**Problem:** Teachers must hunt for the correct URL on `churchofjesuschrist.org`. Hundreds of teachers making hundreds of mistakes.
**Solution:** Ship a small JSON map of the 2026 CFM schedule: `{ weekStart: '2026-05-11', slug: 'come-follow-me-...-old-testament-2026/20', title: 'Deuteronomy 6–8...' }`. Auto-pick based on today's date. Expose as default URL in Teacher Portal "From Lesson URL" and as the "This Sunday" card.
**Acceptance:**
- Loading any game portal on any Sunday shows the correct lesson
- Week rollover happens at Sunday 00:00 local time
- JSON schedule lives in repo and can be updated once per year
**Effort:** S

### OPUS-005 · Deduplicate library entries
**Problem:** Library screenshot shows "Come Follow Me - May 3, 2026" and "Come Follow Me - May 3, 2026 (2)" — same lesson, two entries. At scale this fragments teacher experience badly.
**Solution:** Derive `lessonId` deterministically from URL (as `extract-lesson` already does: `come-follow-me-...-20` → `old-testament-2026-lesson-20`). Use that as the Firestore doc ID. On "Add Entry", detect an existing ID and offer Replace vs View.
**Acceptance:**
- Adding the same URL twice updates the existing entry, never creates a duplicate
- Existing duplicates are merged or flagged in an admin migration
**Effort:** S

### OPUS-006 · Firestore security rules covering new collections
**Problem:** CLAUDE.md notes "Authenticated users can read/write `/artifacts/{appId}/public/**`" — at 100s of teachers this means any signed-in user can edit any other teacher's game state, library entry, or backlog item. Not acceptable for a multi-ward deployment.
**Solution:** Tighten rules:
- `teachers/{email}` — only global_admin can write; each teacher can read their own doc
- `classrooms/{id}` — only the assigned teacherEmail + any admin can write
- `classrooms/{id}/feudSession/**` — only that classroom's teacher + admin can write; other signed-in users read-only
- `lessonLibrary/**` — admin-only writes; all teachers read
- `backlogItems/**`, `blGuides/**` — admin-only
**Acceptance:**
- Rules unit tests verify each role boundary
- A teacher in Ward A cannot write Ward B's classroom state
**Effort:** M

---

## P1 — Teacher experience & church-guideline compliance

### OPUS-007 · Expose compliance check on every generated lesson
**Problem:** `youth-leader.md` and `gamemaster.md` both require a compliance check (Handbook §13, two-adult rule, §37.8, gender-neutral, testimony-level spread) that emits `PASS` / `REVIEW: <reason>` per question. Zero of that reaches the UI. Teachers have no idea whether AI output meets policy.
**Solution:** `/api/lesson-pipeline` must include `complianceReport` and per-question `complianceCheck` fields in its response. Render in the lesson summary card as a green ✅ badge (all PASS) or amber ⚠ badge (N items need review). Clicking shows the flagged items with suggested rewording.
**Acceptance:**
- Library cards show compliance badges
- Any ⚠ item requires admin acknowledgment before teachers can play
- Badge text cites the specific rule (Handbook §13 / §37.8 / two-adult / age-appropriate)
**Effort:** M

### OPUS-008 · Content safety filter on all AI output
**Problem:** Claude-generated questions can drift — no guardrail enforces "no violence / sexuality / drugs / alcohol / public shaming" before teachers see the content. The policy exists in `gamemaster.md` but nothing validates the output against it.
**Solution:** Second Claude pass in `lesson-pipeline.js` with a strict rubric: reject-or-rewrite any question or answer that mentions explicit violence, sexual content, substances, or could expose a youth's family situation. Return `blockedItems[]` for admin review. Also enforce: all URLs must begin with `https://www.churchofjesuschrist.org/` or `https://media.churchofjesuschrist.org/`.
**Acceptance:**
- Test prompts that try to inject inappropriate content are filtered
- Output never contains non-Church URLs for scripture / media
- Admin gets a "3 items rewritten, 1 blocked" summary
**Effort:** M

### OPUS-009 · Teacher-facing lesson prep screen
**Problem:** The rich artifacts from `youth-leader.md` (50-min lesson plan, chain activities, L1–L4 anchors, QR cards) and `gamemaster.md` (facilitation script, role roster, sabotage deck, printable question cards) are never surfaced to teachers. They only see a game board.
**Solution:** Add a "Prep" view per lesson in each game portal: Lesson Plan tab · Roles tab · Print Cards tab · QR Codes tab. Call `/api/lesson-pipeline` with `mode: 'full'` to get lesson plan + game plan alongside game content. Cache in the library entry.
**Acceptance:**
- Every library lesson shows Prep → Plan / Roles / Cards / QR tabs
- Print Cards renders the `gamemaster.md` card layout as a print-friendly HTML page
- QR codes render from `allScriptureRefs[].url`
**Effort:** L

### OPUS-010 · One-click printable question & sabotage cards
**Problem:** `gamemaster.md` specifies exact card layouts (question cards, Friendly Sabotage deck, Scripture Scout match cards); none are generated. Teachers can't print anything.
**Solution:** `/print/{lessonId}?type=questions|sabotage|scout` route that renders card sheets at 3×3 per page with proper page breaks, QR codes embedded, Letter + A4 sizes.
**Acceptance:**
- Print preview matches the card templates in `gamemaster.md`
- QR codes scan successfully on a printed page
- Works on Chrome print dialog without extra CSS hacks
**Effort:** M

### OPUS-011 · Per-classroom lesson override without affecting the library
**Problem:** `?room={classroomId}` scopes game state but not lesson content — there is no way for a teacher to tweak a library lesson for their class without editing the shared library doc. Today Scripture Scout's "Edit Pairs" edits pairsData in memory; nothing persists it per classroom.
**Solution:** On edit, save a fork to `classrooms/{classroomId}/lessonOverrides/{lessonId}` with the teacher's customizations. The game reads override-first, then falls back to the library lesson. Expose "Reset to library version" button.
**Acceptance:**
- Teacher A editing Ward A's Exodus 14 pairs does not affect Ward B
- Library view labels forks with "Customized for your class"
- Reset button restores the library version
**Effort:** M

### OPUS-012 · Explicit church-policy banner & ToS on teacher signup
**Problem:** No acknowledgment of Children and Youth Protection Training, two-adult rule, or §37.8 at signup. If inappropriate content is ever generated, there is no documented teacher attestation of policy.
**Solution:** First-time sign-in shows a one-page policy acknowledgment: Handbook §13, §37.8, Protection Training completion, "I will not use Kindred content that I have not reviewed." Record `policyAcknowledgedAt` on the teacher doc. Re-prompt annually.
**Acceptance:**
- No teacher can enter the portal without acknowledgment
- Timestamp stored per teacher
- Annual re-prompt on Jan 1
**Effort:** S

### OPUS-013 · Teacher self-service classroom creation (within scope)
**Problem:** Even approved teachers can't create their own classroom — admin does this in `admin.html`. Ward admin should be able to create classrooms within their ward; teachers should be able to request a classroom.
**Solution:** Ward admin UI: create classroom within their ward, assign teacher from their ward's pool. Teacher UI: "Request classroom" → goes to ward admin queue.
**Acceptance:**
- Ward admin creates a classroom scoped to their ward (enforced in rules)
- Teacher request flow works end-to-end
**Effort:** M

### OPUS-014 · Clean up Teacher Portal clunk (screenshot evidence)
**Problem:** Scripture Scout portal has four peer buttons: **📚 Library · 🔗 From Lesson URL · ✏️ Edit Pairs · ↺ Default**. "Default" and "Edit Pairs" are not peers of the content sources — they are actions on the currently loaded set. The crowded row is visible in the screenshot.
**Solution:**
- Primary row: **📚 Library** · **🔗 From Lesson URL** · **✏️ Manual**
- "Edit Pairs" becomes a pencil icon on the **Active Lesson** card (only shown when a lesson is loaded)
- "Default" becomes a small "Reset to Exodus default" link in a minor position
**Acceptance:**
- Three clearly-differentiated content sources
- Edit is contextual to the loaded lesson
**Effort:** S

### OPUS-015 · Remove the legacy `app.js` / old-application overlap
**Problem:** CLAUDE.md notes `app.js` is "the original prototype (pre-Vite, for reference)". It sits alongside the production code and creates confusion for future Claude runs, plus risks duplicated logic drift.
**Solution:** Move to `archive/app.js.legacy` with a note in `archive/README.md` explaining it is reference only. Same treatment for `Exodus Matching Game/` and `Exodus Family Feud Master Prompt.docx` if genuinely legacy.
**Acceptance:**
- Repo root contains only current production files
- Archive directory documents historical pieces
**Effort:** S

### OPUS-016 · Merge index.html and admin.html auth logic
**Problem:** Two separate Google sign-in implementations with near-identical code — both do `onAuthStateChanged`, both split by email, both write to `sessionStorage`. At scale this drifts.
**Solution:** Extract `src/auth.js` that exports `initAuth({ onTeacher, onAdmin, onDenied })`. Both pages import it. One source of truth for role resolution.
**Acceptance:**
- Role check happens in exactly one file
- Adding a new role is a one-file change
**Effort:** S

### OPUS-033 · Marketing-grade teacher signup landing page
**Problem:** The Request Access screen (shipped alongside OPUS-001) is utilitarian — a form card on a black background. It tells a new teacher *what* to enter, not *why* Kindred is worth signing up for, and gives them nothing to share with other teachers, youth leaders, or ward councils. The funnel works but doesn't sell.
**Solution:** Build a dedicated public landing page (`/signup` or the unauthenticated `index.html` hero) that sells Kindred before asking for a Google sign-in. Must include:
- Hero reel: short auto-playing loop of Common Ground rounds + Scripture Scout matches on a classroom TV (muted, captions on)
- "What is Kindred?" in one sentence + three-benefit grid (Come Follow Me ready · Classroom-safe AI · No prep for busy teachers)
- Social proof placeholder: ward / stake adoption counter, testimonials slot, Church-policy compliance badge (links to OPUS-007 compliance surface)
- Clear primary CTA ("Sign up with Google → Request access") and secondary CTA ("Share with another teacher" → prefilled mailto / Messenger / copy-link)
- Open Graph + Twitter card tags so links shared into ward Slack / Messenger / Facebook preview cleanly
- After sign-in, route straight into the existing Request Access form (prefilled from Google profile, same as today)
- Mobile-first layout — most teachers will open this from a phone
**Acceptance:**
- Lighthouse Performance ≥ 90 and Accessibility ≥ 95 on mobile
- "Share" button produces a link that previews correctly in at least Messenger, iOS Messages, and Slack
- New teacher can go from landing page → signed-in Request Access form in ≤ 3 taps
- Analytics event fires on each share action (for OPUS-026 dashboard)
- No regression to the admin-approval pipeline from OPUS-001
**Effort:** M

### OPUS-034 · Automate 120-day abandon + 30-day orphan purge (Vercel cron)
**Problem:** Inactivity review currently runs client-side in [admin.html](admin.html) — an admin must open the admin tab for any cleanup to happen. That's fine for the single-admin MVP, but at 100+ classrooms it won't scale and no cleanup happens if the admin is on vacation. The lifecycle we committed to (14-day warning email at day 106, auto-abandon at day 120, orphan purge at day 30) is not truly automated yet.
**Solution:** Add a Vercel serverless cron job (`api/cron-inactivity.js`) that runs nightly. Uses `firebase-admin` with a service-account key stored in `FIREBASE_SERVICE_ACCOUNT` (JSON, base64-encoded). On each tick: scan `classrooms` for `lastActivityAt >= 106 days` (send email via Resend / SendGrid to every `teacherEmails[]` entry), `>= 120 days` (clear `teacherEmails[]` + `teachers[]`, stamp `abandonedAt`), and orphan classrooms `abandonedAt >= 30 days` (delete). Log every action to a `systemAuditLog` collection so the admin can audit. Remove the client-side "Inactivity review" panel in admin once this is proven in prod for 30 days.
**Acceptance:**
- `vercel.json` declares the cron with daily schedule (`0 3 * * *` in UTC)
- Service-account key documented in `.env.example` and secured as Vercel env var
- Warning email renders with a "Mark active" link that hits a signed endpoint to bump `lastActivityAt`
- `systemAuditLog/{yyyy-mm-dd}` doc per run with counts of warned / abandoned / purged
- Idempotent: second run on same day produces no duplicate writes
- Admin panel in admin.html shows a read-only feed of the last 30 days of cron activity
**Effort:** M

---

## P2 — Scripture Scout Gemini parity & game polish

### OPUS-017 · Real audio library, not oscillator tones
**Problem:** [games/memory.html:121-133](games/memory.html#L121-L133) generates all game sounds via `AudioContext` oscillators — flip/match/mismatch/win/sabotage are beeps. Gemini's version used actual audio (MP3 references exist in `Exodus Matching Game/*.mp3`). Engagement drop is real.
**Solution:** Ship curated, copyright-clear sound set in `public/audio/`: flip, match, mismatch, win, sabotage, scripture-reveal, christ-connection. Use `HTMLAudioElement` with preload. Keep oscillator as fallback if fetch fails.
**Acceptance:**
- Each event plays a distinct, pleasant sample (not a sawtooth)
- Audio files ≤ 50 KB each, CDN-served
- Works offline after first load
**Effort:** S

### OPUS-018 · Image support per Scripture Scout pair
**Problem:** Current match card shows only an emoji icon + text (see screenshot). Gemini's version embedded scripture art that gave the scene visual anchor and massively boosted recall for 14–16 year olds. `gamemaster.md` anticipates this (icon bank + QR code) but image field is absent.
**Solution:** Extend the pair schema: `{ cardA, cardB, icon, image?: { url, alt, credit } }`. When present, show the image above the verse in the match modal. Source: Church Media Library (`media.churchofjesuschrist.org`) URLs only — enforced by OPUS-008.
**Acceptance:**
- `gamemaster` pipeline returns `image.url` where a suitable Church media asset exists
- Match modal displays image with proper credit line
- No image = fall back to icon (current behavior preserved)
**Effort:** M

### OPUS-019 · Sequential video playback for connected narratives
**Problem:** User's explicit callout: *"Gemini would even make sure that the videos found in the memory game were played in order if there was a sequence."* Current portal shows a flat `videoLinks[]` list with no order metadata.
**Solution:** `extract-lesson` already returns videos per section in page order. Preserve `sequenceIndex` through the pipeline. Add a "Play lesson videos in order" button on the portal that opens a Vimeo-style playlist modal auto-advancing through each video. Expose at the end of a Scripture Scout round as a reward.
**Acceptance:**
- Videos in a lesson play in narrative order when "Play All" is clicked
- Order matches the order they appear on the lesson page
- Works for both embedded media and external Vimeo/YouTube refs
**Effort:** M

### OPUS-020 · Match modal shows richer scripture context
**Problem:** Modal currently shows: icon · scene pill · ref · verse · discussion question. The `gamemaster.md` card spec also includes a Christ connection line and QR code. Missing fields break the teacher-facing spec.
**Solution:** Add `christConnection` (already produced by gamemaster skill) + QR code (already in pair.url) into the modal layout. Render QR beside the verse at classroom-readable size.
**Acceptance:**
- Every match shows Christ connection + QR
- QR scans from back of the room to `allScriptureRefs[].url`
**Effort:** S

### OPUS-021 · Common Ground source-scripture surface per question
**Problem:** `scripture_based` and `scripture_application` questions already carry `verseText` + `url` in the generated data. The game doesn't display either during play — teachers lose the teaching anchor mid-round.
**Solution:** Show the source scripture at the top of the Common Ground Monitor View (teacher can toggle hide) and let Admin view reveal it on demand.
**Acceptance:**
- Teacher can toggle scripture visibility per round
- Monitor view reads verse at classroom-visible size
- No regression in the survey reveal mechanic
**Effort:** S

### OPUS-022 · Role assignment UI (Scripture Reader, Captain, Scorekeeper, Encourager)
**Problem:** `gamemaster.md` specifies seven roles so every student participates — no spectators. UI provides none of this. Teachers would need to print and distribute manually.
**Solution:** Add a "Roles" tab to the game portal: lists the seven roles with checkboxes "assigned / open". Teacher can type student initials (not full names — §37.8) to mark assigned. Only visible to teacher, never synced to Monitor View.
**Acceptance:**
- Roles list matches gamemaster.md exactly
- Initials only; no full student names ever stored
- Data lives in the teacher's classroom override, not Firestore public path
**Effort:** M

### OPUS-023 · Friendly Sabotage card deck integration
**Problem:** Scripture Scout has a single Sabotage button that shuffles cards. `gamemaster.md` defines a richer 6-card deck (Scripture Swap, Swap a Player, Double or Nothing, Wild Card, Grace Card, Teacher's Choice), each tied to a scripture. Common Ground has no sabotage at all.
**Solution:** Build a `SabotageDeck` component driven by the lesson's `sabotageCards[]` (already in the gamemaster pipeline). Teacher draws a card; it displays the mechanic + scripture; applies to current round. Works in both games.
**Acceptance:**
- Six-card deck renders in both games
- Grace Card cites 2 Nephi 25:23 verbatim from the skill spec
- Cards never target individuals
**Effort:** M

### OPUS-024 · Opening scripture & testimony invitation bookends
**Problem:** `gamemaster.md` is emphatic: every game begins with a scripture read aloud by a student (Scripture Reader role) and ends with an optional testimony invitation. Current Mission Briefing screen has neither.
**Solution:** Before "Deploy →", show a full-screen "Opening Scripture" panel with the lesson's key verse + assigned reader prompt. After win/end, show "Testimony Invitation" panel with the pre-written open prompt from the skill. Both skippable (teacher discretion) but default-on.
**Acceptance:**
- Opening scripture shows at start, closing invitation shows at end
- Both pull from lesson data (not hardcoded)
- Teacher can skip either
**Effort:** S

### OPUS-025 · Kill the "Default" button or relabel
**Problem:** "Default" on the Scripture Scout portal (visible in screenshot) loads Exodus pairs over the currently loaded lesson. Teachers confused it with "Reset".
**Solution:** Remove from the primary button row. Move to a small "↺ Load Exodus demo pairs" link inside the Edit Pairs panel.
**Acceptance:**
- Not visible in the main portal row
- Functionality preserved for demo / testing
**Effort:** S

---

## P3 — Analytics, observability, long-term

### OPUS-026 · Usage analytics dashboard (ward-safe, no student data)
**Problem:** No way to see which lessons are played, how often, which teachers are active. Essential for improving content at scale. Must be built without collecting any student identity (§37.8).
**Solution:** Log `lessonPlayed` events (`lessonId`, `gameType`, `classroomId`, `timestamp`) in a new `analytics/events` collection. Admin dashboard: lessons-per-week, top lessons, teachers-active-this-month. No student identifiers.
**Acceptance:**
- All events are teacher/classroom scoped, never student
- Admin dashboard shows meaningful trends
- Retention policy: delete raw events after 90 days; keep weekly aggregates
**Effort:** M

### OPUS-027 · Teacher feedback loop per lesson
**Problem:** No way for teachers to flag a bad question, rate a lesson, or suggest a better answer. Content quality cannot improve.
**Solution:** Every library lesson shows a ⚐ flag on each question. Flagged items queue to admin. Lesson-level 1–5 rating. Feedback writes to `lessonLibrary/{id}/feedback/{teacherId}`.
**Acceptance:**
- One-click flag per question with reason dropdown
- Admin sees the queue and can mark resolved / rewrite
- Ratings visible on library cards
**Effort:** M

### OPUS-028 · Claude API cost & error telemetry
**Problem:** `lesson-pipeline.js` retries server-side on 500/503/529 but failures vanish silently. At 100s of teachers running generations, there is no admin visibility.
**Solution:** Log every pipeline run: `{ teacherId, url, durationMs, tokensIn, tokensOut, errorType?, retryCount }`. Admin "Pipeline Health" tab shows last 7 days' success rate + per-model cost. Alert when error rate > 10% in any 1-hour window.
**Acceptance:**
- Run history visible to admin
- Cost per week surfaced
- Alerting via existing admin email
**Effort:** M

### OPUS-029 · Backup strategy for Firestore at scale
**Problem:** Today the app ID `exodus-feud-final-v10` holds everything. One bad migration could orphan data for every teacher. CLAUDE.md already warns against changing it.
**Solution:** Weekly Firestore export to Cloud Storage. Retention: 90 days. Documented restore procedure in `docs/disaster-recovery.md`.
**Acceptance:**
- Automated weekly export runs without intervention
- Restore tested in a staging project
**Effort:** M

### OPUS-030 · Localization framework (EN now, ES / PT next)
**Problem:** All UI copy is hardcoded English. Come Follow Me is taught globally. Spanish + Portuguese cover a large Church population.
**Solution:** Extract UI strings to `src/i18n/{en,es,pt}.json`. Language picker on portal. Scripture text pulled in the user's locale from `churchofjesuschrist.org` (the URLs support `?lang=spa` and `?lang=por`).
**Acceptance:**
- Language switch changes all UI copy
- Scripture URLs respect locale
- Admin can add a new language file without code changes
**Effort:** L

### OPUS-031 · Consolidate the skills pipeline as one service
**Problem:** CLI skills (`extract-lesson`, `youth-leader`, `gamemaster`) and the HTTP `/api/lesson-pipeline` implement overlapping logic in two places. At scale, drift between CLI and HTTP produces different lesson output for the same URL.
**Solution:** Extract a shared `src/pipeline/` module used by both the CLI skills and the Vercel function. Both invoke the same extraction → compliance → generation → safety-filter chain. CLI becomes a thin wrapper.
**Acceptance:**
- Identical input URL produces identical output JSON from CLI and HTTP
- Single place to update prompts / rules
**Effort:** L

### OPUS-032 · CI pipeline that exercises the AI chain against a golden lesson
**Problem:** Prompt drift across Claude versions will silently degrade output quality. No regression test today.
**Solution:** GitHub Action: nightly, runs `lesson-pipeline` against a frozen test URL, compares output against a golden fixture on deterministic fields (question count, type distribution, compliance PASS count, URL validity). Fails the build on regression.
**Acceptance:**
- CI runs nightly without human intervention
- Failure opens a GitHub issue automatically
**Effort:** M
**Note (2026-04-21):** Manual harness already exists at `scripts/opus-test.mjs` — runs Sonnet vs Opus side-by-side against a lesson list and diffs elapsed / rounds / cross-manual ref counts. Wrap it in the GitHub Action to satisfy this ticket.

### OPUS-035 · Unify module system — convert remaining CJS API files to ESM
**Problem:** `npm run dev` logs "The CJS build of Vite's Node API is deprecated" because `vite.config.js` resolves as CJS. Three API files (`api/generate.js`, `api/generate-questions.js`, `api/fetch-content.js`) still use `module.exports` / `require()` while the rest of the codebase (incl. `api/lesson-pipeline.js` and `api/_lib/pipeline.js`) is ESM. The CJS→ESM boundary inside `/api` is a drift risk — any shared helper added in ESM can't be imported by the CJS handlers without a runtime shim. Also adds a startup warning noisy enough that real errors get lost in it.
**Solution:** Convert the three CJS handlers to ESM (`export default async function handler(req, res)`, `import` instead of `require`). Add `"type": "module"` to `package.json`. Verify Vercel serverless functions still deploy (Vercel supports ESM natively for Node ≥18).
**Acceptance:**
- No "CJS build of Vite's Node API is deprecated" warning on `npm run dev`
- All 6 files in `api/*.js` use consistent ESM syntax
- `npm run build` passes
- Vercel preview deploy of `/api/generate`, `/api/generate-questions`, `/api/fetch-content` still returns 200 on a smoke request
**Effort:** S

### OPUS-036 · Extend pre-generation horizon to 60 days, admin-configurable
**Problem:** OPUS-003 assumes "next Sunday's lesson" as the pre-generation target. Real teacher prep starts earlier — users want to glance 6–8 weeks ahead and know content is already waiting. A single-week window also leaves no buffer if a weekly scheduled job misfires.
**Solution:** Weekly scheduled job (builds on OPUS-003) pre-generates any CFM lesson whose `weekEnd` falls within the next 60 days and is missing either Common Ground or Scripture Scout. Admin has a horizon slider (`30 / 60 / 90 days`) stored in a global settings doc, so the user can tune cost vs. lead time without redeploy. Idempotent — skips entries already generated.
**Acceptance:**
- At any time, the library holds pre-generated content for every CFM Sunday ≤ horizon days away
- Admin can change the horizon and see the next run respect it
- Running the job twice in a row does not regenerate already-complete entries
- Cost per run is visible in the run log (per OPUS-028)
**Effort:** M

### OPUS-037 · Teacher-initiated talk generation from index.html
**Problem:** Pre-generation (OPUS-003/036) covers Come Follow Me Sundays, but teachers also want to run a game based on a specific General Conference talk or Ensign article — ad hoc, not on the CFM schedule. Today they'd have to ask the admin to add a library entry and generate.
**Solution:** On `index.html` (Kindred Hub), each classroom-scoped teacher can paste a `churchofjesuschrist.org` URL → "Make game from this talk." Server validates the URL allowlist, runs `lesson-pipeline`, writes the result into `lessonLibrary` (still global) with an owner tag, and returns to the classroom's game launcher. Rate-limited per teacher (e.g. 3/day) to control cost.
**Acceptance:**
- A signed-in teacher on `index.html` can paste a conference-talk URL and get a playable game without admin intervention
- URL allowlist enforced (same rules as `lesson-pipeline`)
- Rate limit visible to teacher ("2 remaining today") and enforced server-side
- Generated entry shows up in admin Library tagged with requesting teacher
**Effort:** M

### OPUS-038 · Simplify Add Library Entry UI to a single URL input
**Problem:** The Add Library Entry form has two fields (name + URL) with an "Or enter manually" divider. Now that title auto-fill from URL works (shipped 2026-04-21), the name field is redundant for the common path and the divider is visual noise.
**Solution:** Collapse to one URL input + single "+ Add Entry" button. On blur, show the auto-filled title as a read-only preview line below the URL with a pencil (✎) to edit if the title is wrong or blank. Keep the ⭐ Fill This Week button above it unchanged.
**Acceptance:**
- Add form is one input + one button for the primary path
- Auto-filled title previews inline and can be edited
- Failed fetch falls back to a manual title input
- Behaviour verified for: CFM lesson URL, General Conference talk URL, non-allowlisted URL (rejected)
**Effort:** S

---

## Cross-cutting observations

1. **The three skills are the product.** The game boards are one surface for them; the printable cards, lesson plans, and facilitation scripts are the other — and today they are invisible to teachers. OPUS-009 + OPUS-010 + OPUS-022 + OPUS-024 together make the policy embedded in the skills visible and actionable for every teacher.

2. **"Safe, friendly, fun" is mostly enforced in prompts, not code.** OPUS-007 + OPUS-008 + OPUS-012 move the guardrails from prompt-land to runtime-land where they can't be drifted away from by the model.

3. **Scale is cheaper than it looks** if OPUS-003 (pre-generation) + OPUS-006 (rules) + OPUS-028 (telemetry) are done early. The dominant cost vector is per-teacher-per-week Claude calls, and library pre-generation collapses that by 99%+.

4. **Gemini-parity matters most for 14–16 year olds.** OPUS-017 (real audio) + OPUS-018 (images) + OPUS-019 (ordered video) are the three things the Gemini version did that Claude currently does not. Recommended as a single Gemini-Parity sprint.

## Suggested sprint grouping

| Sprint | Items | Outcome |
|---|---|---|
| Scale foundation | OPUS-001, 002, 006 | Multi-tenant ready |
| Growth funnel | OPUS-033, 012 | Teachers actually want to sign up and share |
| Content at scale | OPUS-003, 004, 005 | Library auto-populated weekly |
| Compliance surface | OPUS-007, 008, 012 | Policy visible in UI |
| Teacher prep tools | OPUS-009, 010, 022, 024 | Skills' artifacts reach teachers |
| Gemini parity | OPUS-017, 018, 019, 020 | Recover engagement loss |
| Cleanup | OPUS-014, 015, 016, 025 | UI clunk + dead code removed |
| Long-term | OPUS-026–032 | Analytics, telemetry, i18n, CI |

## Comparison hooks for the existing BL-001 – BL-006 backlog
When comparing against the existing 6-item backlog in `admin.html` / Firestore, note:
- Items that overlap: likely LED integration, Library Lesson work, backlog UI (per MEMORY.md).
- Items missing from this review that should stay from BL: hardware/LED items if they serve a different audience goal.
- Items from this review that are genuinely new: OPUS-002 (tenancy), OPUS-007/008 (compliance runtime), OPUS-018/019 (image + ordered video).

The intent is additive: run the Opus review alongside the existing backlog and pick the joint top 10 for the next cycle.
