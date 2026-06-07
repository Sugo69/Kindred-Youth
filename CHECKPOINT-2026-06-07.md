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
7. **P3 — `mockups/` folder cleanup.** Still untracked at ~198 MB.
