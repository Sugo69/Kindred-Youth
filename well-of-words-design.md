# Well of Words — Design & Build Brief

**Date:** 2026-07-03 · **Status:** FINAL — decisions locked with Lewis; ready for build · **Role split:** this doc is the advisor deliverable; the implementing agent ("the DO") codes from §8.

**Locked decisions (2026-07-03):**
1. **Name: Well of Words** (Lewis's pick; screened clean — TESS + app-store manual check still owed before first commit). Fallbacks: Word Grove, Gathered Words.
2. **In the recommendation engine** — add to `GAME_FIT_MATRIX`, not catalog-only.
3. **Teens first** — v1 ships the grades 7-12 mode only; the K-6 "Spring" mode is spec'd here but deferred to v1.1.
4. **Teacher word-list editor deferred** until after the first classroom test (v1.1).

---

## 1. Verdict

**Yes — fully feasible, and it's the easiest game #5 Kindred could add.** The letter-wheel/anagram-crossword mechanic (genre: Wordscapes, Word Trails, Word Cookies) is legally unprotectable as a *mechanic* — only names and look-and-feel carry risk (Tetris v. Xio). The lesson-pipeline v3 was built to branch by `gameType`, the pink `.game-card` slot in the portal is fully styled and unused, and Scripture Trail already provides the classroom-override and reveal-button patterns this game needs. Estimated integration surface: 1 new HTML file + small edits to 5 existing files (checklist in §7).

**Name: Well of Words** — no app-store or trademark hits found; strongest scriptural metaphor of the candidates (living water, John 4:14: *"a well of water springing up into everlasting life"*); alliterative and memorable; fits the *Common Ground / Scripture Match / Scripture Trail / By Heart* naming rhythm.
⚠ Before first commit: 5-minute manual check of "Well of Words" on tmsearch.uspto.gov + both app stores. Web search is a screen, not a clearance.

---

## 2. Research digest

### 2a. Genre mechanics (what to keep / drop / transform)

| Keep (core) | Drop (monetization filler) | Transform |
|---|---|---|
| Letter wheel, drag-to-connect **and** tap-to-build input | Coins, IAP, ads, piggy banks | Hints → 5-step teaching ladder (§4d) |
| Live word preview while dragging | Engineered difficulty spikes | Level themes → scripture settings |
| Word flies into crossword grid, tiles pop in sequence | Daily-event FOMO loops | Level-complete → verse + Christ-connection card |
| Free unlimited **Shuffle** (breaks anagram fixation) | Individual leaderboards | Bonus words → team points from a **pipeline whitelist** (§4e) |
| Bonus/extra words | Coin-gated random hints | Crowns/"Brilliance" → optional class streak |
| No fail state — you can't lose, only not-yet-win | | |

Key findings:
- Drag-wheel is the input used by 6 of the top-10 grossing word games; caps out at ~8 letters — stay at ≤7. Duplicate letters must appear twice on the wheel.
- The genre's stickiness = constant near-term wins + the "snap" of seeing a hidden word after shuffling. Don't over-hint early.
- Juice is where the "feel" budget goes: letter highlight + connecting line while dragging, rising tone per letter, word-fly animation, tile squash-and-stretch, celebration on puzzle complete, dull shake on invalid. Cheap, disproportionate payoff.
- Start every session with one trivially easy word so the first 20 seconds produce a win.
- **Hint research warning:** a 50k-student study (O'Rourke et al.) found free answer-revealing hints *hurt* learning vs. no hints. Hints must be teacher-triggered and walk from conceptual → concrete. This is why the hint ladder is a facilitation tool on the teacher's screen, not a self-serve button.

### 2b. Classroom / age findings
- K-6 wants character warmth, short rounds, whole-class energy, teacher pacing (Blooket-style). Teens want less race-pressure and more strategy — team modes, optional timed blitz (Gimkit pattern). Team scoring only, never individual — matches the existing gamemaster no-spectators policy.
- **Dual coding is real:** pairing a picture with a word beats verbal-only for school-age vocabulary (Paivio; picture-superiority effect strongest for younger kids). Caveat: the picture must depict the word's *meaning* — decorative art adds overload.
- Accessibility: wheel letters ≥60px touch targets; offer tap-to-select as an equal input mode (drag needs sustained fine motor control); uppercase-only tiles sidestep b/d confusion; letter-spacing generous; state changes by fill + motion, never hue alone (washed-out church projectors).

### 2c. IP guardrails (full snapshot in agent report; not legal advice)
- **Avoid these names entirely:** Wordscapes/Wordscape (PeopleFun, USPTO Reg. 5391320/3064972), Word Trails (PlaySimple/Netflix), Word Cookies (BitMango), WordBrain (MAG), Word Trip (PlaySimple), Boggle/Scrabble/Upwords (Hasbro), Wordle + any "-le" naming pattern (NYT — most aggressive enforcer), Bananagrams. Also rejected as conflicted: Word Roots, Word Harvest, Word Weave, Living Letters, Word Spring.
- **Mechanics are free; skin is not.** Do not imitate Wordscapes' trade dress: serene landscape photo backgrounds, its wheel styling, level-map aesthetic, fonts, palette. Kindred's navy/neon language + the original well theme = safe distance.
- **Pictures:** system-font emoji = zero licensing surface (matches Scripture Match's `icon` field). Church Media Library images OK as optional classroom-display enhancement (noncommercial church use; already on the pipeline URL allowlist). Stock photos / Google Images: never.

---

## 3. Concept

> **Well of Words** — draw this week's lesson up from the well. Each puzzle is a well: 6-7 letters carved on the stones around its mouth (the wheel), and the crossword grid above fills as words are drawn up. Solve a word → the bucket comes up full: picture, verse, QR code to the scripture, Christ connection. Fill the grid → **the well overflows** — living water.

Every target word comes from the week's lesson (CFM or Seminary). The draw-it-up moment *is* the teaching moment — mirroring Scripture Match's match-modal beat: word → verse → Christ connection → discussion prompt. The theme is doctrinally resonant on purpose: Jesus at the well, John 4.

---

## 4. Game design spec

### 4a. Core loop
1. **Stone ring**: 5–7 uppercase letters arranged as stones around a circular well mouth at the bottom (original trade dress — deliberately not Wordscapes' plain letter circle); empty crossword grid above; word preview strip between.
2. Player (or teacher, relaying a shouted answer) drags across letters or taps them in sequence. Release/Enter submits.
3. Target word → the bucket rises, the word flies into the grid, tiles pop in sequence, +points chime.
4. **💧 Well Card** (auto, ~5s, teacher can pin): emoji picture of the word · kid-level definition · the verse phrase with the word highlighted in place · scripture ref · QRious QR to the Gospel Library URL · "✝ Christ connection" line on capstone words.
5. Whitelisted bonus word → +small team points, drops into the "🪣 Bucket" side tally (no card).
6. Invalid/unlisted word → gentle ripple-shake + soft thud. No penalty, no red X. (Kind, per no-fail-state finding.)
7. Grid complete → **the well overflows**: water-sparkle/droplet celebration, round score, next puzzle or closing screen with discussion question + testimony-invitation prompt for the teacher.

### 4b. Age modes
**v1 ships 🪣 Well mode only (grades 7-12).** 💧 Spring mode (K-6) is fully spec'd below but **deferred to v1.1** — it is mostly a client-side filter of the same puzzle data, so it can land later without pipeline changes.

| | 💧 **Spring (K-6) — v1.1** | 🪣 **Well (grades 7-12) — v1** |
|---|---|---|
| Wheel | 4-5 letters | 6-7 letters |
| Targets | 3-4 letter words, CVC-heavy | 3-7 letters + one long **capstone** lesson word |
| Input default | Tap-to-build (big tiles ≥60px) | Drag or tap |
| Pictures | Emoji shown beside each *unsolved* slot as a standing clue | Emoji revealed only on solve |
| Bonus words | Off | On (whitelist) |
| Facilitation | Popcorn/shout-out, teacher picks callers | Team turns + steal (Common Ground-familiar), optional 90s blitz |
| Puzzle length | 4-5 words | 5-7 words |

v1 build note: implement the mode toggle plumbing (a `mode` flag + word-length filter function) even though only Well mode is exposed, so Spring is an unhide-and-polish job, not a refactor.

### 4c. Facilitation modes (teacher control strip)
- **Team Turns (default):** alternating teams, ~40s confer, spokesperson calls the word, teacher enters it. Miss → steal opportunity. Bonus words scoreable by either team anytime.
- **Blitz (option):** 90 seconds per team on a fresh puzzle; most target words wins the round.
- **Popcorn:** ships with Spring mode in v1.1.
- Scoring: capstone 40 · other targets 20 · bonus words 5. Team scores only, two renameable team buttons (reuse Common Ground team-name pattern).

### 4d. Hint ladder — teacher-triggered, in order, one per press
1. 💬 **Meaning** — kid-level definition ("a promise between God and His people").
2. 📖 **Verse blank** — "I will establish my ________ with thee" (Gen 6:18). *The pedagogical jackpot: the hint is the lesson.*
3. 🖼 **Picture** — the word's emoji, big.
4. 🔤 **First letter** placed in the grid.
5. 👁 **Reveal** — teacher-only, mirrors Scripture Trail's existing Reveal Answer pattern.

### 4e. Safety-by-design (beyond the standard pipeline)
- **Whitelist-only word validation.** No bundled dictionary. Only pipeline-generated `words[]` + `bonusWords[]` are accepted; anything else gets the gentle ripple-shake. This (a) avoids shipping a dictionary, and (b) makes it impossible for kids to spell crude words on the classroom TV for laughs — every acceptable word passed compliance + AI safety review.
- **Deterministic letter check (pipeline step 3 addition):** every target and bonus word must be spellable from the puzzle's letter multiset; violations → `REVIEW` flag + word dropped client-side. Claude occasionally miscounts letters — this server-side check is non-negotiable.
- All existing pipeline guarantees apply: URL allowlist, HARD_BLOCK_TERMS scan, AI safety review pass/rewrite/block, complianceReport pill in admin.

### 4f. Content model (what the pipeline emits — `lessonLibrary/{id}.wellOfWords`)
```json
{
  "topic": "Covenants — Genesis 6-11",
  "puzzles": [
    {
      "n": 1,
      "theme": "Noah builds in faith",
      "letters": ["P","R","O","M","I","S","E"],
      "capstone": "PROMISE",
      "words": [
        {
          "word": "PROMISE", "isCapstone": true,
          "definition": "something God says He will surely do",
          "verseBlank": "I will establish my ________ with thee",
          "verseText": "But with thee will I establish my covenant...",
          "verseRef": "Genesis 6:18",
          "url": "https://www.churchofjesuschrist.org/study/scriptures/ot/gen/6?lang=eng&id=p18#p18",
          "icon": "🌈", "iconLabel": "rainbow",
          "christConnection": "Every covenant points to Jesus Christ, the surety of all God's promises.",
          "complianceCheck": "PASS"
        },
        { "word": "ROSE", "isCapstone": false, "definition": "...", "verseBlank": "...", "verseRef": "...", "url": "...", "icon": "🌹", "complianceCheck": "PASS" }
      ],
      "bonusWords": ["RIM", "SIP", "MOP", "PRIM", "ROPE"],
      "complianceCheck": "PASS"
    }
  ],
  "sourceUrl": "…", "generatedAt": "…", "videoLinks": [], "talkLinks": [],
  "pipeline": "lesson-pipeline-v3", "complianceReport": { "overall": "PASS" }
}
```
3 puzzles per lesson: #1 easy warm-up (5 letters), #2 medium, #3 capstone puzzle whose long word is the lesson's key term. (Spring mode in v1.1 will use puzzle #1 + a ≤4-letter client-side slice of #2 — same data, no pipeline change.)
**Grid layout is computed client-side, not by Claude** — a small deterministic crossword packer (place longest word horizontally center; greedily cross remaining words on shared letters; un-crossable words go in a side "solo row"). Claude is bad at spatial packing; don't ask it to emit coordinates.

---

## 5. Branding & theme direction

- **Name:** Well of Words. **Card color: pink `#ff007f`** — the unused, fully-styled `.game-card.pink` slot. Brand story: *the well at dusk* — navy night, the water's neon-pink glow rising from the well mouth, teal water accents.
- **Catalog icon:** 💧. Card copy: "Draw words from this week's scriptures". `.game-card-tag`: "best: doctrinal · vocabulary".
- **In-game palette** (follow By Heart's `:root` var pattern): `--bg #0a0a1a`, `--bg-2 #0f0f22`, panels `#1a1a35`, ink `#e8e8f0`, **accent `--glow #ff007f`**, soft glow `#ff5ca8`, **water `#2dd4bf`** (teal — deliberately distinct from Common Ground's cyan #00f2ff; use for water/ripple effects only), gold `#ffc857` for capstone tiles only, borders `#2a2a45`.
- **Type:** Orbitron for headers/logo only. **Letter tiles + grid: Rajdhani 700, UPPERCASE, letter-spacing ≥0.08em** — cleaner glyphs for developing readers; never Orbitron on tiles (too stylized for decoding). Verse text ≥ clamp(1.1rem, 2.5vw, 1.6rem).
- **Juice:** droplet/ripple particle burst on word solve; full-screen water-sparkle overflow on puzzle completion; Web Audio rising pentatonic tone per letter selected, chime on valid, soft thud on invalid (mirror Scripture Match's Web Audio approach — no audio files).
- **Trade-dress distance (deliberate):** no landscape photo backgrounds, no Wordscapes-style level map, no butterfly/serenity iconography; the **stone-ring well mouth** wheel styling is an original differentiator.
- **Responsive:** flex phone → tablet → HD → 4K; read `localStorage.kindred_display_scale` like common-ground.html; clamp() + auto-fit grids everywhere (house rule).

---

## 6. Lesson-pipeline generation guidance (for the new prompt in pipeline.js)

The `buildWellOfWordsGenerationPrompt()` should instruct Claude to:
1. Pick 3 capstone candidates from the extraction's `keyThemes` + `scriptureRefs` — words of 5-7 unique-ish letters that are *the* vocabulary of the week (COVENANT → too long → prefer PROMISE, TEMPLE, MANNA, FAITH+ mix).
2. For each capstone, derive 4-6 target sub-words spellable from its letters, **preferring lesson-relevant words** (ROSE is fine, but words that appear in the cited verses are better) — each with definition, verseBlank (real phrase from the cited verse with the word blanked), verseRef, Gospel Library URL, emoji icon depicting the word's meaning.
3. Emit 5-10 wholesome bonus sub-words (common kid-known words only; no slang, no proper nouns).
4. Capstone words must each carry a `christConnection` (Gamemaster rubric: Jesus Christ is the subject of every round).
5. KJV wording for all verse text, same as other game types.

Server-side additions (step 3 structural compliance): letter-multiset containment check for every `words[].word` + `bonusWords[]`; required fields `word/definition/verseBlank/verseRef/url` per target; `christConnection` required on capstones; bonusWords scanned against HARD_BLOCK_TERMS and run through safety review like everything else.

---

## 7. Integration checklist (from codebase audit — file:line anchors verified 2026-07-03)

IDs: gameType **`well-of-words`** · page **`games/well-of-words.html`** · Firestore field **`wellOfWords`** · output array key **`puzzles`** · vite key **`wellOfWords`** · catalog link id **`link-well-of-words`**.

1. **`games/well-of-words.html`** — new file. Structure template: by-heart.html (scenes, back-nav `← Kindred Hub` → `../index.html`, inline style/script). Plumbing template: common-ground.html for display-scale read (~:1250) and QRious CDN + `new QRious({...})` (~:648/:808). Firebase module script + `signInAnonymously` before any Firestore read (memory.html pattern).
2. **`vite.config.js`** — add `wellOfWords: resolve(__dirname, 'games/well-of-words.html'),` to `rollupOptions.input` (~line 95). Dev middleware needs no change (gameType passes through).
3. **`index.html`** — catalog card `<a id="link-well-of-words" class="game-card pink">` (~line 1998, pink class already styled at :434-481); room-suffix rewrite line (~:2606); ready-pill OR-check add `|| data.wellOfWords?.puzzles?.length` (~:2616).
4. **`src/lib/cfm-schedule.js`** — **(decision #2: yes, in the rec engine)** add to `GAME_META` (~:210): `{icon:'💧', name:'Well of Words', color:'pink', href:'games/well-of-words.html'}`; add `'well-of-words'` to each `GAME_FIT_MATRIX` row (~:196-205): doctrinal `good`, mixed `good`, narrative `limited`.
5. **`api/_lib/pipeline.js`** — (a) `buildWellOfWordsGenerationPrompt()` per §6, branch in `buildGenerationPrompt` (~:577); (b) thread `parsed.puzzles` through every `rounds||pairs||stops` guard (~:133, :146, :151, :173, :267, :331, :398); (c) `well-of-words` branch in `runStructuralCompliance` (~:297) incl. letter-multiset check; (d) map fields into `runSafetyReview` contentForReview (~:334): `word`, `definition`, `verseBlank`, `verseText`, `christConnection`, `bonusWords`; (e) backfill optional.
6. **`admin.html`** — extend field ternary (~:2364) `'well-of-words'→'wellOfWords'`; add compliance badge + summary chip (~:2141/:2149); add `⚡ WoW` generate button (~:2157); `gameLabel` map (~:2313); missing-counter (~:2018) + batch jobs (~:2403/:2459) if batch-generating.
7. **Auto-load** — `autoLoadFromLesson()` reading `?lesson=`, `getDoc(lessonLibrary/{id})` **with `cfm-` prefix fallback** (try both — house gotcha), read `data.wellOfWords`. Mirror common-ground:2288-2342.
8. **CLAUDE.md** — document the new game, field, and page.

**Deferred to v1.1+ (locked decisions #3 and #4):** 💧 Spring mode (K-6) UI exposure; teacher-edited word lists (`classrooms/{room}/wellOfWordsLessons/{lessonId}` override mirroring scripture-trail.html:89-155, with `/api/moderate` on save). **Deferred to v2:** Monitor/Admin Firestore split (Scripture Trail precedent: single screen + teacher controls was sufficient); LED integration; student-device play; Church Media Library pictures.

---

## 8. THE BUILD PROMPT (paste to the implementing agent)

```
Build "Well of Words" — game #5 for the Kindred platform (letter-wheel word puzzle from
the weekly lesson). Read well-of-words-design.md at repo root FIRST and treat it as the
spec; its §7 checklist has verified file:line anchors. Summary of what you're building:

GAME: games/well-of-words.html — single self-contained HTML page (inline CSS/JS, no build
step), following by-heart.html's scene structure and common-ground.html's plumbing
(display-scale from localStorage.kindred_display_scale, QRious CDN for QR codes,
Firebase module script with signInAnonymously before any Firestore read, ?room= / ?lesson=
param handling with cfm- prefix fallback on library reads).

MECHANIC: 5-7 uppercase letters arranged as STONES AROUND A CIRCULAR WELL MOUTH at the
bottom (original styling — not a plain letter circle); empty crossword grid above; live
word-preview strip between. Input: BOTH drag-across-letters (pointer events, connecting
line drawn on a canvas/SVG overlay) AND tap-to-build with backspace + submit. Duplicate
letters appear as separate tiles. Free unlimited Shuffle button. Submitting a target word
animates a bucket rising and the word flying into the grid (tiles pop in sequence, rising
Web Audio tones per selected letter, chime on valid, soft ripple-shake+thud on invalid —
no penalty, no fail state). Grid layout is computed CLIENT-SIDE by a deterministic
crossword packer: longest word horizontal in the center, greedily cross remaining words
on shared letters, un-crossable words go in a labeled solo row beneath the grid. Words
come ONLY from the puzzle data (whitelist validation — never a dictionary): words[] fill
the grid, bonusWords[] land in a "🪣 Bucket" side tally for +5 team points, anything else
politely ripples.

TEACHING BEATS: solving a target word opens a "💧 Well Card" (auto-dismiss ~5s, teacher
can pin): big emoji icon, kid-level definition, verseBlank with the solved word
highlighted in place, verseRef, QRious QR code to the word's Gospel Library URL, and — on
capstone words — a ✝ Christ Connection line. Puzzle completion = "the well overflows"
water-sparkle celebration + round score + the lesson discussion prompt. HINT LADDER
(teacher control strip, one step per press, in order): 1 definition → 2 verseBlank →
3 big emoji → 4 first letter placed in grid → 5 reveal word (👁, mirrors Scripture
Trail's reveal pattern).

MODES: v1 ships 🪣 Well mode only (grades 7-12: full 6-7 letters, capstone word, bonus
words on, team turns with steal + optional 90-second blitz). Implement the mode plumbing
(a mode flag + max-word-length filter over the puzzle data) but do NOT expose the K-6
"💧 Spring" mode in the UI yet — it is v1.1 (see design doc §4b for its spec). Team
scoring only: capstone 40 / target 20 / bonus 5, two renameable team buttons (Common
Ground pattern). No individual leaderboards ever. No teacher word-list editor in v1.

BRANDING: card color pink #ff007f (reuse the existing .game-card.pink class in
index.html). In-game: navy Kindred base (--bg #0a0a1a etc. per by-heart.html's :root
pattern), accent --glow #ff007f, soft #ff5ca8, water teal #2dd4bf for ripple/water
effects only (NOT Common Ground's cyan #00f2ff), gold #ffc857 for capstone tiles ONLY.
Orbitron for headers/logo only; letter tiles and grid use Rajdhani 700 UPPERCASE with
letter-spacing ≥0.08em; wheel letter tiles ≥60px touch targets; all state changes
signaled by fill+motion, never hue alone. Fully responsive phone→4K via clamp() and
auto-fit grids. DO NOT imitate Wordscapes trade dress (no landscape photos, no level
map). Catalog icon 💧, card copy "Draw words from this week's scriptures".

CONTENT + PIPELINE: extend api/_lib/pipeline.js with gameType 'well-of-words' emitting
{ topic, puzzles:[{ n, theme, letters[], capstone, words:[{ word, isCapstone, definition,
verseBlank, verseText, verseRef, url, icon, iconLabel, christConnection?, complianceCheck }],
bonusWords[], complianceCheck }] } — 3 puzzles per lesson (easy 5-letter warm-up, medium,
capstone). Generation prompt per well-of-words-design.md §6 (KJV verse wording,
lesson-relevant sub-words preferred, wholesome bonus words, christConnection required on
capstones). Structural compliance MUST add a deterministic letter-multiset containment
check for every target and bonus word against letters[] (drop+flag violations), plus
required-field checks, and map word/definition/verseBlank/verseText/christConnection/
bonusWords into the safety review. Thread parsed.puzzles through every rounds||pairs||stops
guard. Firestore field: lessonLibrary/{id}.wellOfWords. Wire the admin.html Library tab
generate button (⚡ WoW), compliance pill, and summary chip; vite.config.js MPA entry
(wellOfWords); index.html catalog card + room-suffix rewrite + ready-pill check;
GAME_META + GAME_FIT_MATRIX in cfm-schedule.js (doctrinal good / mixed good / narrative
limited).

CONSTRAINTS (house rules): dev port 5173; ANTHROPIC_API_KEY never gets a VITE_ prefix;
appId stays 'exodus-feud-final-v10'; lessonLibrary reads always try both {lessonId} and
cfm-{lessonId}; raw fetch to Anthropic API (no SDK); back-nav bar '← Kindred Hub' →
../index.html; document the game in CLAUDE.md when done. After building, generate a real
lesson through the pipeline, run the lesson-reviewer subagent on the output, and play a
full puzzle end-to-end in the browser before calling it done.
```

---

## 9. Remaining action items

1. **Lewis:** 5-minute manual check of "Well of Words" on tmsearch.uspto.gov + App Store + Play Store before the first commit (fallbacks: Word Grove, Gathered Words).
2. **v1.1 backlog candidates:** 💧 Spring mode (K-6) exposure; teacher word-list editor with classroom-scoped overrides + `/api/moderate`; both already spec'd above.
3. **v2 backlog candidates:** Monitor/Admin split; Church Media Library pictures on Well Cards.

*IP notes herein are research, not legal advice — same posture as legal-review-2026-04-22.md.*
