# Kindred Game Playbook

**Purpose:** everything we learned shipping Well of Words (game #5, 2026-07-03/04 — one design day, one build day, four playtest rounds, ~30 post-launch fix commits) distilled so game #6 ships with those lessons *built in*. Read this before designing any new Kindred game; the `/project:game-builder` skill walks the process.

**The core meta-lesson:** the initial design survived contact with the classroom about 70%. The other 30% — input feel, text sizes, layout shift, who-controls-what — only surfaced on real hardware with real usage. So: budget for 3-4 playtest rounds as *part of the build*, keep commits small and pushed (Vercel auto-deploys), and treat the teacher's fragmented feedback stream as the primary spec once v1 exists.

---

## 1. Design phase (before any code)

1. **Research with subagents, cheaply.** Three parallel agents was right: codebase integration map (Explore), genre/engagement research (web), IP screen (web). Total <200k tokens. Write the design doc + build prompt before code.
2. **IP process (mandatory):** mechanics are free to clone (idea-expression dichotomy); names and trade dress are not (Tetris v. Xio). Screen every candidate name against app stores + trademark search; avoid all established genre names and "-le" patterns (NYT enforces). **Hold everything uncommitted until Lewis manually clears the name** (TESS + both app stores). Original visual skin, never the genre leader's trade dress.
3. **Decision gates up front:** ask Lewis before building — name, recommendation-engine inclusion, audience scope, deferred features. Use his answers as hard scope; he WILL revise after playing (that's fine, that's the loop).
4. **Design for one cooperative class score.** Teams were designed in and removed on the first playtest. Kindred games are whole-class cooperative unless Lewis asks otherwise; no individual leaderboards ever (gamemaster policy).
5. **Content density beats elegance.** 4-6 items per round felt complete on paper and "emptied fast" in a classroom. Size rounds for 10+ interactions; pick content seeds (capstone words, question pools) for *fertility*, not just doctrinal fit.

## 2. Platform integration (the checklist that worked)

IDs first: gameType `kebab-case`, page `games/{name}.html`, Firestore field `camelCase`, one new top-level output array key. Then:

1. `games/{name}.html` — self-contained (inline CSS/JS; module script for Firebase with `signInAnonymously` BEFORE any read; classic script for game logic; expose cross-script via `window.*` + a ready event).
2. `vite.config.js` rollupOptions.input — one line.
3. `index.html` — catalog card (check for a free `.game-card.{color}` class), room-suffix rewrite, ready-pill OR-check.
4. `src/lib/cfm-schedule.js` — GAME_META (**include `bestFor`** — the limited-fit tile note derives from it) + GAME_FIT_MATRIX row.
5. `api/_lib/pipeline.js` — generation prompt; thread the new array key through EVERY `rounds||pairs||stops||…` guard (~6 places); `runStructuralCompliance` branch; `runSafetyReview` field mapping (flatten nested structures — review works per flat item); backfill; add to `__testables`.
6. `admin.html` — field ternary, gameLabel map, compliance pill + summary chip, ⚡ generate button, missing-counter, BOTH batch jobs.
7. `?lesson=` auto-load with **`cfm-` prefix fallback (try both — always)**.
8. CLAUDE.md + design doc updates ship in the same commit as the feature.

## 3. Pipeline & content rules

- **Deterministic server checks for anything the model can miscount** (letter math, counts, URL allowlists). Prompt rules are wishes; step-3 structural compliance is law. Client validates AGAIN (defense in depth) — the classroom whitelist must never trust the wire.
- **Scrub before scan:** anything you auto-remove (profane bonus words) must be scrubbed BEFORE the JSON.stringify hard-block scan, with the scrub record in a **side map, never on the item** — or the removed word still escalates the lesson to red.
- Severity semantics: auto-fixed problems → amber (`PASS_WITH_REWRITES` via findings); problems still present in displayable content → red (`hardBlockHits`).
- **Big outputs:** per-gameType `max_tokens` and per-call timeout (Well of Words: 12000 tokens / 240s — real generation took 223s and the 180s default killed it). One retry on hung connection. Total pipeline must fit Vercel's `maxDuration: 300`; slim the output (char caps per field, "at most 10 lines of working notes") rather than raising limits you don't have.
- **Content-word rule:** any quoted-scripture hint field must contain the *literal* word (verseBlank must carry the `________` marker); tell the model to pick a different verse rather than emit a marker-less blank.
- URLs from the pipeline are chapter-level; derive verse anchors client-side from the ref (`&id=p{n}#p{n}`, ranges `p{a}-p{b}`). Never ask Claude to invent URLs.
- **Translation labels are volume-aware** — "(KJV)" hardcoded next to Mosiah is a bug class; derive from book name (watch Esther vs Ether).
- **Never ask Claude for spatial layout** (grid coordinates). Compute layouts client-side with a deterministic algorithm, unit-tested standalone in Node BEFORE inlining into the page.
- **Demo content is real content**: full metadata, hand-verified quotes, and it goes through lesson-reviewer like everything else.

## 4. Compliance gates (non-negotiable order)

1. Machine checks offline (unit tests on packer/validators via `__testables` fixtures — no API needed).
2. `npm run build` after every change (catches top-level-await/build-target issues immediately).
3. One **live pipeline run** on a real lesson with machine validation of the output (this caught the timeout; offline tests can't).
4. **lesson-reviewer subagent** on all shipping content — expect `PASS_WITH_REWRITES`, apply its rewrites verbatim. House rules it enforces beyond the spec: EVERY user-facing content unit carries a Christ connection (not just capstones); discussion prompts must never invite public self-disclosure of sins/struggles (§37.8) — "think of one thing, no need to share specifics" is the safe framing.
5. Every string a *student* could put on screen needs a display scrub (client blocklist; biblical words like ass/hell stay allowed per house rule).

## 5. Layout & visual system (the standards)

- **Palette:** navy base (`--bg #0a0a1a`, `--bg-2 #0f0f22`, `--bg-3 #1a1a35`, `--border #2a2a45`, `--ink #e8e8f0`) + ONE signature accent per game (taken: cyan CG, green SM, gold Trail, purple ByHeart, pink WoW) + gold reserved for "special" items. Secondary accents must not collide with sibling games' signatures (WoW uses teal `#2dd4bf` for water, NOT CG's cyan `#00f2ff`).
- **Type:** Orbitron for headers/logos ONLY; Rajdhani for body and anything students must read/decode (game tiles: Rajdhani 700 UPPERCASE, letter-spacing ≥0.08em).
- **⚙ Display-scale gear is a platform standard on every game page** (Lewis directive 2026-07-03): Mobile 0.55 / Tablet 0.75 / HD 1.0 / 4K 1.3 **plus a custom 0.4–1.6 slider**, on shared `localStorage.kindred_display_scale`, applied via `body.style.zoom`, live-refitting the board. Copy the `scale-menu-wrap` block from well-of-words.html.
- **Nothing above the board may change height.** Any dynamic region (hints, status, messages) gets a permanently reserved fixed-height band with a faint idle state; content swaps inside it. Layout shift on a classroom TV is jarring and was explicitly called out.
- **Auto-fit the board, never overflow:** compute cell/tile size from the actual viewport minus measured fixed regions vs. the board's row/col count. The interactive controls must NEVER fall below the fold.
- **Wide screens (≥1000px): two-column play area** (board | input), container height = content (no flex-stretch — that's how you get a wheel floating in dead space), input column vertically centered against the board.
- **TV text sizes:** hint/status labels `clamp(0.85rem, 1.9vw, 1.1rem)`+; reference numbers extra-large with accent glow; secondary chips (tried words) ≥ ~1.1rem bold. If Lewis says "the kids can't read it," it's at least 40% too small.
- **Connect commentary to the board:** when a banner references item #N, item #N's cells glow (border/box-shadow ONLY — zero layout shift). Mirror the same highlight on the helper.
- **Group ambiguous elements visually** (separate dashed boxes per solo word — three 4-letter words read as one 12-letter word without them). Chips need real flex `gap`s — chips inside a single inner span get no gap (recurring bug).

### CSS/JS gotchas that cost us real debugging time
- `getComputedStyle(...).getPropertyValue('--custom-prop')` returns the RAW `clamp()` expression — `parseFloat` silently NaNs. Mirror the clamp math in JS.
- An absolutely-positioned `<svg>` is a replaced element: `inset: 0` does NOT stretch it — it stays 300×150 and clips everything. Set `width/height: 100%`.
- Under `body.style.zoom`, `getBoundingClientRect`/`clientX` are in zoomed pixels but your overlay's coordinate space is layout pixels — divide by the zoom factor.
- Top-level `await` in a module script fails the Vite build target — wrap Firebase init in an async function.

## 6. Input design

- Support **both drag and tap** for any sequential-selection mechanic. Disambiguate: a press is a TAP unless the pointer visits a second element while held; only real drags auto-submit on release. (Shipping without this made tap mode 100% broken and it wasn't caught until a tablet playtest.)
- **Scramble anything that spells an answer.** The pipeline emits letters in capstone order — the wheel, the helper header, ANY sequential display of the letter set leaks the answer unless shuffled (with a re-shuffle guard against identity).
- Buttons: one visually prominent primary per group; every icon button gets a text label + tooltip; themed names (DRAW WORD) are fine but must have a plain-language tooltip.
- Selection feedback (connecting lines, highlights) should reflect **current state persistently**, not just live gestures — draw from the selection model on every change, clear only on submit/clear.
- Show failed-but-clean attempts (tried list) so the class doesn't repeat them; scrub before display.

## 7. Helper / second-device view — when and how

**Build one when** the game has teacher-gated knowledge (answers, hints, reveals) or mid-game facilitation controls. **Skip it** for self-paced practice games (By Heart). Decide at design time; it shipped same-day here because the single-screen hint panel was built word-addressable first.

The pattern (all in the same HTML page):
- `?mode=helper` renders a control-panel scene instead of the game; `?room=` scopes everything.
- Firestore: monitor publishes full display state to `{basePath}/{game}Session/state` after every change; helper writes commands to `.../cmd` with `ts` (monitor ignores `ts <= lastSeen` — protects against stale commands from previous sessions). All sync silently no-ops offline (the game itself must never require network).
- **Access must be trivial:** QR code + copy-link in the teacher panel (params preserved), gear-menu flip Helper↔Monitor on the same device.
- **Answers masked by default even on the helper** (dots + length). Two-step 👁: first tap peeks locally + arms "sure?" (4s); second tap reveals to class. Peeks auto-re-mask after 8s (shoulder-surfers) with an explicit 🙈. This also makes the helper safe to hand to a student aide.
- **Every consequential command carries its own confirmation ON THE HELPER** (two-tap "sure?"). Never `confirm()` on the monitor for a remote command — it blocks a screen nobody is standing at.
- Remote commands must not open local-only UI: audit every code path a command triggers for `openModal()`-type calls (the 🔤+ bug: a toggle branch popped the hints modal on the TV).
- Repeatable ACTIONS (add-a-letter) are exempt from toggle semantics; toggles (show/hide a hint) are exempt from repeat semantics. Classify every button as one or the other.
- Mirror the monitor's "current focus" highlight on the helper row (synced state, not local taps) so the helper always sees where they were.
- **Lewis's control-placement rule:** class-facing screen = zero teacher controls beyond starting/basic flow; ALL facilitation (hints, reveals, puzzle prev/next navigation) lives on the helper. If a control would let a stray classroom tap advance/spoil, it goes helper-side behind two-tap.
- Random > sequential for progressive reveals (sequential letter reveals spell a prefix; first letter then random keeps the guess alive).
- A reveal that *completes* a round skips the per-item celebration and goes straight to the round-complete animation.

## 8. Testing requirements (definition of done)

1. Standalone Node unit tests for every pure algorithm (packer, validators) — written and passing BEFORE inlining.
2. Offline pipeline fixture tests through `__testables` (structural compliance, safety-rewrite application, backfill, collapse cases).
3. `npm run build` green (all pages).
4. Dev-server smoke: page serves, key markers present.
5. **One live pipeline generation** on the current real lesson, machine-validated (spellability/completeness/URLs), uploaded to prod `lessonLibrary` so the picker isn't empty on day one.
6. lesson-reviewer PASS (with rewrites applied) on demo + first generated content.
7. **Human playtest on real hardware**: the actual TV/projector (text sizes, contrast, layout shift), a tablet (touch input), a phone (helper). Claude cannot do this step — hand it to Lewis explicitly, and expect 3-4 feedback rounds. Budget them; they are not scope creep, they are the second half of the build.
8. Recovery story decided: prefer **free round-navigation** (helper-side) over state snapshots — simpler, doubles as pacing control, and covers the realistic failure (accidental refresh). Network loss must not break local play (Firestore is enhancement-only).

## 9. Process rules

- Small commits, descriptive messages, push immediately (auto-deploy = playtester always on latest; say clearly WHERE the latest is — localhost vs prod confusion cost a round).
- The name-clearance hold: everything stays uncommitted until the TM check; after that, commit-and-push per fix.
- Spend the ~$0.50 on live generation tests; flag spend after (house budget rule).
- Update CLAUDE.md, the design doc (mark superseded sections rather than rewriting history), and auto-memory as decisions land — same session, not later.
- When Lewis asks "thoughts?" — give an assessment and a recommendation, then let him counter; his counter-proposals (puzzle nav vs. snapshots) have been consistently simpler and better-fitted to actual classroom use.

---

*Born from the Well of Words build. Update this file after every game ships — the playbook is only as good as its last retrospective.*
