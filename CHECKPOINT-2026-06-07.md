# Checkpoint — 2026-06-07

Polish session — 12 commits. All work is UX/stability improvements to the Common Ground monitor and admin views, plus a By Heart utility feature. No new games, no schema changes, no pipeline changes.

Last commit at handoff: **`9e2b683`**

---

## 🚀 What shipped this session

| Commit | What |
|---|---|
| `1281c01` | **QR floats right of question box** — `positionQrCode()` uses `getBoundingClientRect()` on `#q-txt`, sets `position:fixed` left/top. Zero layout impact. Runs on render + `window resize`. |
| `e8d3387` | **QR monitor-only** — CSS guard `body.mode-admin #monitor-qr-block { display:none }` |
| `3a60982` | **QR hidden in `setView()`** — explicit `style.display = 'none'` when switching to admin/teacher; re-shows + repositions on contestant. Root cause: Firestore snapshot could re-render while body was still `mode-contestant`. |
| `dd61834` | **Admin/Controller → Admin View** rename. **By Heart verse lookup** — 🔍 Look up button in Any Verse tab hits `bible-api.com/{ref}?translation=kjv` (CORS-enabled, free), auto-fills verse textarea. |
| `7199471` | **QR links to per-round scripture verse** — uses `data.url` (Gospel Library verse URL with `#verse` anchor) instead of lesson overview URL. Fallback to `currentGameSourceUrl` for family_feud rounds. |
| `18882c2` | **Admin button press feedback** — `.admin-btn:active`: `transition:none` (instant fill cyan/gold), 0.15s ease release, `scale(0.95)`. `-webkit-tap-highlight-color:transparent` + `touch-action:manipulation` removes 300ms tap delay on mobile. `.admin-ans-card button:active` gets scale+opacity. |
| `4d7ac64` | **Hide scripture on monitor option** — checkbox in lesson launch view persists to `localStorage.kindred_cg_hide_scripture`. `getShowScriptureDefault()` + `activateGame()` writes `showScripture` to Firestore state on every activation. QR canvas 130→150px. |
| `4217f26` | **Hide-scripture toggle moved to Admin View section 4** — was only in lesson launch (rarely hit). Now a permanent checkbox at top of section 4, initialised from localStorage when Admin View opens. |
| `7706e9f` | **QR visibility bug fixed** — was gated on `currentGameGeneratedBy` which is `null` on games activated before that field existed. Removed the check; `qrUrl` alone guards visibility. |
| `e982cc8` | **Team name buttons show real names** — "Light Playing"/"Star Playing" replaced with `${t1Name} Playing`/`${t2Name} Playing` updated live in `syncUI()`. Names truncate at 8 chars (`…`). CSS `overflow:hidden; text-overflow:ellipsis` as safety net. |
| `168773c` | **Question auto-sizing** — `autoSizeQuestion()` steps through `[3.8, 3.2, 2.7, 2.2, 1.9, 1.65]em`, stops when `scrollHeight <= clientHeight + 4`. Requires `max-height:42vh + overflow:hidden` on `.question-box.tv-q`. `transition: font-size 0.2s ease`. Called on syncUI + window resize. `min-height` reduced 4.5em → 2em. |
| `cfd58fd` | **Monitor locked to viewport** — `body.mode-contestant { height:100vh; overflow:hidden }` prevents scroll jump when question font changes between rounds. |
| `803eeaa` | **Scripture strip smooth transition** — replaced `display:none/block` with `max-height/opacity/padding` transitions (0.35s ease). `autoSizeQuestion()` re-runs after toggle so font re-evaluates newly available space. |
| `9e2b683` | **Hide on Monitor button permanent** — pulled out of `admin-scripture-row` (which only rendered when `hasVerse` was true, disappearing on family_feud rounds). Now a standalone button always visible at top of section 4, with "Default" checkbox inline. `admin-scripture-row` shows verse text preview only. |

---

## Architecture / pattern notes

### QR code
- Lives at `#monitor-qr-block`, `position:fixed`, JS-positioned by `positionQrCode()` reading `#q-txt.getBoundingClientRect()`
- Condition: `qrUrl && document.body.classList.contains('mode-contestant')` — no `generatedBy` check
- `qrUrl = data.url || currentGameSourceUrl` — per-round scripture URL takes priority
- Hidden explicitly in `setView()` for non-contestant modes; shown + repositioned on contestant

### Scripture strip (`#tv-scripture`)
- Initial state: `max-height:0; opacity:0; overflow:hidden; padding:0` (no `display:none`)
- Show: `maxHeight:'160px'; opacity:'1'; padding:'14px 22px'; marginBottom:'12px'`
- Hide: `maxHeight:'0'; opacity:'0'; padding:'0 22px'; marginBottom:'0'`
- CSS `transition` on `max-height, opacity, padding, margin-bottom, box-shadow`

### Monitor layout
- `body.mode-contestant { height:100vh; overflow:hidden }` — no scroll
- `.question-box.tv-q`: `max-height:42vh; overflow:hidden; min-height:2em`
- `autoSizeQuestion()` called from `syncUI()` (twice — after question text set and after scripture toggle)
- `window.addEventListener('resize', autoSizeQuestion)` and `window.addEventListener('resize', positionQrCode)`

### "Hide on Monitor" toggle
- Always-visible button in admin section 4
- `toggleScripture()` → `cloudUpdate({showScripture: next})` → Firestore → all listeners update
- Default persists in `localStorage.kindred_cg_hide_scripture`
- `activateGame()` writes `showScripture: getShowScriptureDefault()` on every game activation

---

## Remaining work (from CLAUDE.md backlog)

1. **P1 — Run "Generate Next 8 Weeks"** in Admin → Library. Still manual.
2. **P2 — Student Roster** per classroom. Prerequisite for By Heart individual pass-off, badges, certificates.
3. **P2 — Lesson-type detector** AI step in pipeline. Replace hand-coded CFM `type` field.
4. **P2 — Curriculum picker** in teacher profile (CFM vs Seminary default tab).
5. **P2 — Southern hemisphere Seminary support.** North-only (Aug→May).
6. **P3 — Delete hidden legacy `display:none` sections** in `index.html`.
7. ~~**P3 — `mockups/` folder cleanup.**~~ ✅ Done — gitignored (see continuation below).

---

# Continuation (same 2026-07-03 working day) — monitor-layout REWRITE + P1 + repo scrub

Picked up as Dev Orchestrator after the handoff above. Two things to know up front:

> ⚠️ **The monitor-layout rows above (`168773c`, `cfd58fd`, `803eeaa`, `9e2b683`) are SUPERSEDED.**
> That approach (step-list font sizes + `max-height:42vh` + no vertical skeleton) still let the
> answer board and score HUD get pushed off-screen, sized the question inconsistently, and the
> QR drifted onto the text. It was replaced by a flex skeleton + deterministic auto-fit (below).
> The `autoSizeQuestion()` name survives but its internals were rewritten.

## Commits this continuation (oldest → newest), all on `main`

| Commit | What |
|---|---|
| `a14808f` | **P1 — Scripture Trail on-demand generation now caches.** `triggerScriptureTrailPipeline()` generated content but never persisted it, so every load with no library entry re-ran the paid pipeline. Added `saveTrailToLibrary()` (merge-write to global `lessonLibrary`, enriches an existing `cfm-` entry), loader now tries bare + `cfm-` ids, and a 60-day TTL that expires **only** `autoGenerated` entries (curated content never expires). |
| `1fbbbd9` | **Full-height flex skeleton for monitor view + draggable QR.** `mode-contestant` is now a flex column: title/round/strikes/scripture/board = `flex:0 0 auto`; question box = `flex:1 1 0`; score HUD pinned bottom. Board + score **always** visible. QR is now `position:fixed`, draggable (pointer events), viewport-clamped, persisted to `localStorage.kindred_cg_qr_pos` — no longer tied to the question box. |
| `14dd909` | **Reliable question + answer auto-fit.** First cut of binary-search fit + `fitAnswerSlots()` (long revealed answers auto-shrink to their slot). |
| `0db7f42` | **Deterministic question fit via inner span.** Question text moved into `#q-txt-inner` (full-width block); auto-fit measures the span, not the flex-centred box. |
| `2e2ec7b` | **Stop flashing (ResizeObserver feedback loop).** Pinned the question box `width:100%` so font changes can't change its border box; RO ignores no-op size fires. |
| `e6e2f1f` | **Remove `transition: font-size` on the question box.** The transition made auto-fit measure a mid-animation font → dancing text. Auto-fit must set size synchronously. |
| `485b676` | **docs:** finish "Scripture Scout → Scripture Match" rename (agent/skill/legal docs). |
| `e93b24d` | **chore:** gitignore local `mockups/` (198 MB of design PNGs, not in the build). |
| `6d8c6bf` | **chore:** remove regenerable `lesson-database/opus-test/*.json`, gitignore the output dir; filed local-folder rename as **OPUS-061**. |

## Monitor layout — the working architecture (supersedes the notes above)

- **Skeleton (CSS, `body.mode-contestant` only):** `#scale-root`, `.container`, `.contestant-only` are `flex:1; min-height:0` flex columns. Inside `.contestant-only`: header/scripture/board are `flex:0 0 auto`; `.question-box` is `flex:1 1 0; min-height:0; width:100%; box-sizing:border-box; transition:none`. `.bottom-hud` is `flex:0 0 auto` → pinned to the bottom at any `--monitor-scale`.
- **Question auto-fit (`autoSizeQuestion`):** binary-search font `1.0–5.0em`; measures the **inner span** `#q-txt-inner` against the box content area (recomputed each trial because padding is em-based). A **ResizeObserver** on the box (border-box) re-fits on real size changes — scripture-slide frames, display-scale, resize — so timing is never guessed.
- **Answer auto-fit (`fitAnswerSlots`):** each revealed answer wraps and steps its font down until the inner span fits the fixed-height slot.
- **QR:** `positionQrCode()` reads/saves `localStorage.kindred_cg_qr_pos`, defaults top-right, clamps to viewport; `makeQrDraggable()` (pointer events) persists on drop and suppresses the link click mid-drag.

## Three hard-won gotchas (do not re-introduce)

1. **Never measure text fit on a flex-centred box** (`scrollHeight` under-reports overflow that spills above centre). Measure a normal-flow inner element.
2. **A `transition` on the property you're auto-fitting = infinite/jittery fits** — the measure reads an in-flight value. Keep `transition:none` on the question box.
3. **ResizeObserver + an element whose size depends on its own content = feedback loop.** Pin the observed dimension (here `width:100%`) and guard the callback against no-op fires.

## State at close

- Working tree **clean and pushed** — **except** `well-of-words-design.md`, which is **intentionally held uncommitted** pending Lewis's 5-min TESS + app-store check on the name "Well of Words" (per that doc's §9). Do not commit it until that check is done.
- Build passing (6 pages). No schema/pipeline changes in this continuation except the trail-cache write path.
- FamilyFeud code residue from the legal review is already remediated (user-agent = `KindredYouth/1.0`; generation prompts neutral). Only the **local folder name** remains (→ OPUS-061).
