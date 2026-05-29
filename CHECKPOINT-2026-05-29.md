# Checkpoint — 2026-05-29 (Friday)

Handoff state at the end of a long working session. Use the **re-entry script** at the bottom of this file to resume in a fresh Claude Code thread.

---

## 🚀 What shipped this session (pushed to `main`)

In commit order, oldest → newest:

| Commit | What |
|---|---|
| `6802998` | **Scripture Trail P0** — ported the mockup to `games/scripture-trail.html` with Firebase classroom scoping, lessonLibrary loader with auto-trigger pipeline fallback, 24 Gemini character portraits, the painted Gemini trail board, and the back-nav strip. Added as 5th MPA entry in `vite.config.js`. Gold game tile on the portal. Pipeline `gameType:'scripture-trail'` stubbed (returns 501). Also flipped dev port `5174 → 5173` because the other project on this machine now uses 5174. |
| `2a3db96` | **Landing-page revision** — hero shifted from *"...for Youth Leaders"* to mission-first *"Help youth participate and engage in learning."*. Subhead emphasises personalisation. Mission section added. Problem section softened. Three long feature blocks consolidated into a single three-game toolkit with sub-3-second taglines + smart-recommendation strip. Trust section reduced to four bullets. *"Volunteer"* → *"Teacher"* everywhere. *"LDS"* never used. Added a research stat: *"Students in active-learning classrooms are 1.5× less likely to fall behind"* (Freeman et al., PNAS 2014). |
| `7f02d42` | **Lesson-first portal + smart recommendation** — post-auth catalog was game-first, contradicting what the landing page promises. Replaced with: "This Week" hero card (CFM lesson title + type badge + three game tiles sorted by fit), "Upcoming Lessons" strip (next 6 weeks), then "Or browse by game" catalog at the bottom. `src/lib/cfm-schedule.js` extended with hand-coded `narrative/doctrinal/mixed` for all 52 CFM 2026 OT lessons + the `getGameRecommendations(type)` matrix. Landing-page step 2 updated to match. |
| `43e0e97` | **Seminary tab on the portal** — curriculum-source toggle ("Come Follow Me" / "Seminary"). CFM hero + Upcoming wrapped in tab-content-cfm; parallel tab-content-seminary surfaces today's daily lesson + this week (Mon–Fri) + a stub-content banner. `src/lib/seminary-schedule.js` (new) ships a 2-week stub of NT 2026 Seminary (Aug 17–28) — same shape as cfm-schedule's API so the renderer treats both schedules through one interface. `dmPassage` field marks lessons centred on Doctrinal Mastery passages. |
| `84e3404` | **Toned-down recommendations** — Upcoming cards were showing *"Recommended: Scripture Trail"* five weeks in a row because the OT manual has long narrative stretches. Pulled the loud chip off; quiet `[NARRATIVE]` / `[DOCTRINAL]` / `[MIXED]` badge only on Upcoming. Full recommendation engine still lives on the This Week hero card. |
| `e02bdf4` | **Asset 404 fix on prod** — live site was 404'ing every character portrait and the trail board. Root cause: `games/assets/` was a top-level static folder Vite's production build doesn't auto-copy because the image paths are constructed dynamically in JS. Moved `games/assets/` → `public/games/assets/`. URLs stay identical (no code change). |
| `7f9af5a` | **Shared 24-character pool with sequential team picks** — old setup screen rendered 48 tiles (24 × 2 teams). New setup: single shared 24-tile grid, Team 1 picks first, picked character locks for Team 2 with a coloured border + T1/T2 flag chip. Pulsing dot turn indicator. Start button disabled until both teams have a champion. Initial `state.team1.char`/`team2.char` default to `null`. |

**Vercel auto-deploys from `main`** — by the time you read this, all of the above should be live at `kindred-youth.org`.

---

## 🧠 Key strategic decisions made this session

1. **The three games each map to a different lesson type.** Common Ground (topic-rich/doctrinal), Scripture Match (verse-heavy), Scripture Trail (narrative). Smart-recommendation matrix lives in `cfm-schedule.js`'s `GAME_FIT_MATRIX`. **Scripture Trail is intentionally de-emphasised on the Upcoming strip** to avoid in-app-ad feel during long narrative stretches.
2. **Lesson-first is the right flow.** Teachers think *"I'm teaching Lesson 23 this Sunday,"* not *"I feel like playing Common Ground."* Post-auth portal opens with the lesson, not the game.
3. **Curriculum is a tab axis, not a profile axis (yet).** Both CFM and Seminary tabs visible by default. Profile-based curriculum default is P2 work.
4. **The next game is "By Heart — Doctrinal Mastery"** (Phase A). Cloze-deletion mechanic. Five progressive blanking levels (Read / Echo / Recall / Speak / Heart-Set). The name *Doctrinal Mastery* is treated as a **content category subtitle** and section label, not the game's primary name — because "Doctrinal Mastery" is the official Church-program name and using it as our game name would create trademark/affiliation exposure. **"By Heart"** is the brand; **"Doctrinal Mastery"** is the curriculum target.
5. **FHE families must be able to pick *any* scripture for By Heart**, not just Seminary-scheduled passages. Setup screen needs three picker modes: this-week DM passage, all 25 NT DM passages, custom scripture paste.
6. **The Seminary schedule data is the gating dependency** for everything Seminary-side. Currently 2-week stub. Real NT 2026–27 calendar needed before the Aug 2026 launch. ~180 daily lessons.
7. **Pipeline P1 is a real piece of work** — the `gameType:'scripture-trail'` generator needs arc detection, multiple-choice with plausible distractors, video URL resolution, and board-art selection. Not just a copy of the Common Ground / Memory generators.

---

## 🛠 Live config snapshots

- **Dev port:** `5173` (flipped from 5174 this session — the other project on this machine now uses 5174)
- **Production URL:** `https://kindred-youth.org`
- **MPA entries in `vite.config.js`:** main, admin, commonGround, memory, scriptureTrail (5)
- **Asset folder:** `public/games/assets/` (after the prod-404 fix)
- **Character originals backup:** `c:/Users/lewis/Documents/Kindred-asset-originals/2026-05-29-scripture-trail/` (full 198 MB; the shipped versions are resized to 512px and total ~11 MB)

---

## 🔜 Deferred work (full list in CLAUDE.md "Next actions")

1. **P1** — `/api/lesson-pipeline` `gameType:'scripture-trail'` generator (today: 501 stub)
2. **P1** — Fill NT 2026–27 Seminary daily schedule (today: 2-week stub) — gating for the Aug launch
3. **P1** — "By Heart — Doctrinal Mastery" memorization game with scripture picker
4. **P1** — `src/lib/doctrinal-mastery-nt.js` — hand-coded 25 NT passages
5. **P2** — AI lesson-type detector in the pipeline (replace hand-coded CFM types)
6. **P2** — Curriculum picker in teacher profile (default-tab selection)
7. **P3** — Delete the legacy long feature sections in `index.html` (currently `display:none`)

---

## ⚠️ Known issues to surface in next session

- **Pipeline 501 on non-23 lessons.** Scripture Trail's loader auto-triggers `/api/lesson-pipeline` for any lesson except 23. Until P1 lands, this returns 501 and the game silently falls back to inline lesson-23 content. The console error is expected but noisy — `console.warn('[scripture-trail] Background pipeline failed:', err.message)` in `games/scripture-trail.html`.
- **Seminary stub data.** The Seminary tab shows a `⚠ Stub content` banner because real NT data is pending. Banner disappears once `SEMINARY_IS_STUB` flips to `false` in `src/lib/seminary-schedule.js`.
- **`mockups/` folder is untracked.** The original Scripture Trail design mockup (`mockups/scripture-trail-lesson-23.html`) plus its asset copies live there. 198 MB. Not in git; gitignored implicitly because untracked + heavy. Either commit it as design history, add to `.gitignore`, or delete.

---

## 📋 RE-ENTRY SCRIPT (copy-paste into a fresh Claude Code thread)

Use this verbatim at the start of a fresh session:

```
Resuming Kindred-Youth work after a long session. Please:

1. Read CHECKPOINT-2026-05-29.md in the project root for the full state.
2. Read CLAUDE.md — pay attention to the "Next actions" section near the bottom.
3. Check `git log --oneline -8` so you can see the seven commits I shipped in the last session (6802998 through 7f9af5a).
4. Read MEMORY.md to load durable feedback / project context.

Once you've done that, tell me:
  - What the live site at kindred-youth.org should be doing right now
    (what's live, what's stubbed, what 501s)
  - Which of the queued P1 items you'd recommend tackling first based on
    the August NT Seminary deadline
  - Anything you noticed in the recent commits that looks fragile or
    worth refactoring before we add more on top

Then wait for me to confirm the slice. Don't start coding until I pick.
```
