# Scripture Match — Primary Mode (younger-kids mode)

**Date:** 2026-09-20 · **Status:** BUILT v1 — shipped to prod 2026-09-20, awaiting first classroom playtest · **Scope:** a second *mode* inside `games/memory.html` + one small API endpoint · **Playbook:** written against `GAME-PLAYBOOK.md` (§1 design gates, §2 integration, §3 pipeline, §4 compliance, §5 layout, §7 helper, §8 testing)

---

## 0. Locked decisions (Lewis, 2026-09-20)

> **Build note (2026-09-20):** v1 shipped the same day for a live Primary class. Implemented in
> `games/memory.html`, `api/_lib/simplify.js`, `api/simplify-pairs.js`, `admin.html`, `index.html`,
> `vite.config.js`. Tests: `scripts/simplify.test.mjs` (22 checks). Ops: `scripts/simplify-lesson.mjs`,
> `scripts/revalidate-primary.mjs`, `scripts/upload-primary.mjs`.
> Two rules changed during the build and this doc has been updated to match — see #9 and #10 below.

1. **Keep 12 pairs per lesson** — same content volume as Youth mode. The problem was never how much lesson there is, it's how it's delivered.
2. **Fewer cards per board, more boards** — 3 boards × 4 pairs (8 cards each), chunked **client-side**.
3. **🙌 Wiggle Break is in** (§7).
4. **The scriptures themselves get simplified, not hidden** (§6) — the centre of this design. Draft v1 had the verse as teacher-only material; that was the wrong call.
5. **UI labels: "🧸 Primary" and "🎓 Youth."** The org-name exposure was raised (the reasoning that kept *Doctrinal Mastery* out of By Heart's name) and Lewis's call is to use the plainly descriptive term. Recorded here so the decision is traceable if it's ever revisited.
6. **One younger tier, not two.** A single Primary mode spanning ages ~4–11 — no Little/Junior split. See §3 for how one tier serves both a pre-reader and a ten-year-old without patronising either.
7. **Primary content is derived from the Youth pairs by a cheap simplify pass** (§8) — `/api/simplify-pairs` takes the *already generated* Youth pairs as input and rewrites them into kid language, cached to `lessonLibrary/{id}.memoryPrimary`. No second lesson extraction, no new `gameType` branch in the pipeline.
8. **Pre-generation:** "Generate Next 8 Weeks" includes the Primary pass behind a checkbox, default on for classrooms whose audience is Primary. *(Not yet built — the per-entry ⚡ Primary button shipped first; batch wiring is the remaining admin task.)*
9. **Meaning beats brevity** (added mid-build). The first real Isaiah run flagged all 12 cards for running over the word caps while the content itself was good. Caps are now *guidance* for every field except `phrase` (which must physically fit a card face), and going over is a **soft note, not a compliance finding**. Only integrity problems — archaic language, a misquoted fragment, a drifted reference, a hard-blocked term — turn a card amber. `CAPS` in `api/_lib/simplify.js` feeds both the prompt and the validator, so the model can never be told one limit and judged against another.
10. **Gospel vocabulary is not "too hard"** (added mid-build). The reading-level guard flagged *righteousness*, *commandment* and *understanding* — words a Primary child hears every week. Flagging them would push the model to water down doctrine, which is the opposite of the goal, so the long-word allowlist now carries weekly Primary vocabulary.

---

## 1. Verdict

**The mechanic is already right; the content and the pacing are wrong.** Memory-matching is one of the oldest children's games there is — face-down pairs, no reading required to *play*, no fail state, everyone participates. That part of Scripture Match needs no redesign for a younger class.

What blocks it today is everything wrapped around the mechanic:

| Today (youth, 14–16) | Why it fails a 5–8 year old |
|---|---|
| 12 pairs / 24 cards on one board | 20–30 min to clear; attention is gone by card 8 |
| Face A = `"Exodus 14:13-14 — Stand Still"` in Orbitron | A scripture reference is unreadable and meaningless pre-reading |
| Face B = abstract application phrase (`"The Lord will fight for you"`) | Text-to-text inference — the hardest possible match |
| Full KJV verse in the match modal (`"Fear ye not, stand still, and see the salvation of the Lord…"`) | Archaic grammar, 20+ words, no comprehension without unpacking |
| Modal = scene pill + ref + verse + Christ connection + discussion question + QR | 6 dense blocks; the room is lost in ~8 seconds |
| "💥 Execute Sabotage!" | Adversarial framing; the word is off-register for Primary |
| No pacing structure | Nothing to break on; no movement, no reset point |

Primary mode is therefore: **the same 12 pairs, split across 3 short boards, with picture-first cards, scripture rewritten to be understandable, one movement break per board change.** The React component, the flip/match state machine, the Firebase plumbing, the library loader and the scale gear are all reused unchanged.

**Estimated surface:** `games/memory.html` (mode plumbing + kid skin + client board chunking + Story Card + break) · `api/simplify-pairs.js` + `api/_lib/simplify.js` + the matching Vite dev middleware · `admin.html` (⚡ Primary button, compliance pill, batch checkbox) · `index.html` (audience-aware ready pill, mode deep-link) · `CLAUDE.md`. **No new page, no new catalog card, no `vite.config.js` build entry, and no new `gameType` threaded through `pipeline.js`.**

---

## 2. Audience constraints this design is built around

Design rationale, not new research — the classroom findings in `well-of-words-design.md` §2b apply directly, plus standard early-childhood heuristics:

- **Attention runs roughly a minute per year of age for a single sustained task.** A 6-year-old's focused stretch is ~6 minutes. Any unit of play longer than that must be *chunked*, not shortened — chunking keeps the lesson content and changes only the rhythm.
- **Dual coding / picture superiority** (`well-of-words-design.md` §2b, Paivio): a picture paired with a word beats verbal-only for school-age vocabulary, strongest for younger children. The picture must depict the *meaning*, not decorate.
- **Archaic English is a second language to a six-year-old.** "Fear ye not, stand still" is not hard because it's scripture; it's hard because it's 1611 syntax. Comprehension comes from a plain-language line *first*, with the verbatim phrase alongside it (§6).
- **Pre-readers cannot decode on the clock.** Every line of kid-facing text is either read aloud by the teacher or is one word paired with its picture — and no text is ever *required* to play (§3).
- **Motor:** tap targets ≥60px; no drag, no precision, no double-tap.
- **No timers, no losing.** Visible countdowns create anxiety at this age; Scripture Match already has no fail state — keep it, and keep the single cooperative class outcome (Playbook §1.4: no teams, no individual leaderboards, ever).
- **Movement is not a reward, it's a requirement.** A stand-up beat every few minutes buys back the next few minutes of attention.
- **Accessibility carries over:** uppercase-only word tiles (sidesteps b/d confusion), generous letter-spacing, state changes by fill + motion and never hue alone (washed-out church projectors).

---

## 3. The mode delta

| | 🧸 **Primary (ages ~4–11)** | 🎓 **Youth (12–18) — today, unchanged** |
|---|---|---|
| Pairs per lesson | 12 | 12 |
| Board layout | 3 boards × 4 pairs (8 cards) | 1 board × 12 pairs (24 cards) |
| Grid | 4×2 | 6×4 |
| Face A | big emoji + `WORD` | ref + title (Orbitron) |
| Face B | **same emoji** + short `phrase` (≤5 words) | application phrase |
| Match key | the **emoji** — text is additive, never required | text |
| Scripture on screen | plain-language line **+** verbatim phrase in quotes + ref | full KJV verse + ref |
| Match beat | Story Card (§6), ~25–30s | full match modal |
| QR | yes, small, corner | yes |
| Break | 🙌 Wiggle Break between boards | 💥 Sabotage |
| Miss hold time | ~1.4s | 0.9s |
| Target board time | ~3 min | ~20 min |

### How one tier serves both a four-year-old and a ten-year-old

This is the design problem created by locked decision #6, and the answer is **put the emoji on both faces and make the text additive**:

- **Both faces carry the same emoji**, so the board is always solvable by picture alone. A pre-reader plays a pure visual-memory game and is never blocked.
- **Face B also carries a short phrase** under the emoji. A ten-year-old reads it and gets a second, richer cue; a five-year-old ignores it and loses nothing.
- Nobody is patronised: the older child isn't handed an obviously babyish identical-picture board, and the younger child isn't handed a reading test.

That single choice replaces the whole Little/Junior split from draft v2 at no cost.

### Session math (the thing that has to fit)

| | |
|---|---|
| 3 boards of matching | ~9 min |
| 12 Story Cards @ ~25–30s | ~5–6 min |
| 2 Wiggle Breaks @ ~20s | ~1 min |
| Closing screen | ~2 min |
| **Total** | **~17–18 min** |

That fits a Primary lesson slot with room to spare, and **every board boundary is a safe exit** — a teacher who's out of time stops after board 2 and the class still had a complete experience. Worth protecting in the build: never put content the lesson needs *only* in board 3.

---

## 4. Core loop

1. **Board opens** with a title bar naming the story beat ("Noah Builds the Ark") and 8 face-down cards, big and rounded.
2. A child taps a card → flip sound, big emoji + word appear. Teacher reads the word aloud. Tap a second card.
3. **Match** → cheerful chime, cards lock **lit** (not dimmed to 40% like Youth mode — they're the record of what the class has found), **Story Card** opens (§6).
4. **Miss** → both cards stay up a beat longer than Youth mode (younger kids need the extra time to encode position), soft neutral tone, gentle wobble. No red, no buzzer.
5. Board complete → confetti + "We found them all!" + the board's one-line takeaway.
6. **🙌 Wiggle Break** (§7), then the next board deals in.
7. After board 3 → closing screen: the three takeaways as a picture strip + a testimony-invitation prompt for the teacher.

**The first pair is always a gimme.** Board 1 opens with the most visually distinctive pair in the set (mirrors Well of Words' "start with a trivially easy word" finding) — the first 20 seconds must produce a win.

**Progress is a picture strip, never a number.** A row of grey emoji at the top that light up as pairs are found. No "3/4", no percentage.

---

## 5. Card design

- Cards: ≥140px min tile, `border-radius: 1.25rem`, 2px border, drop shadow. Back face = friendly motif (soft `?` in a rounded badge), not the Youth cyan hairline. With only 8 cards on a 16:9 screen the tiles get genuinely large — that's the point.
- Face: emoji at `clamp(3.5rem, 11vw, 7rem)` — **dominant**; the word or phrase secondary at `clamp(1.1rem, 2.6vw, 1.8rem)`, Rajdhani 700 UPPERCASE, letter-spacing `0.08em`. **No Orbitron anywhere a child has to read** (Playbook §5 mandates Rajdhani for anything students decode; Primary mode makes it absolute).
- Matched cards stay at full opacity with a soft gold ring; tapping one re-opens its Story Card (the existing revisit behaviour — keep it, teachers use it).
- Flip animation unchanged (500ms rotateY) — reads well on a projector and kids love it.
- Palette: keep the navy base and Scripture Match's green signature (Playbook §5), raise card-front saturation and brightness a step. No light theme — church projectors wash out and the navy base is what the platform is calibrated against.

---

## 6. Scripture simplification — the core of this mode

The verse is the reason the game exists, so it stays on screen. It just stops arriving in 1611 English as a wall of text. **Every pair carries the verse in two registers:**

| Field | What it is | Rules |
|---|---|---|
| `verseSimple` | The verse's meaning in kid language | present tense · concrete nouns · no archaic forms (thee/thou/ye/hath/unto/wist/behold) · aim ~22 words but **keep what the verse promises or commands** — simplify the language, never the doctrine |
| `versePhrase` | A short **verbatim** fragment of the KJV | must be a literal substring of the Youth pair's `verse` · the shortest fragment that still means something · length is guidance only, because truncating scripture to hit a number damages the quote |
| `verseRef` | Standard reference | **Copied verbatim from the Youth pair — never regenerated** |

On screen they are **visually distinct and never confusable**:

```
What it means:   God told Noah to build a big boat.        ← large, plain, kid-facing
"Make thee an ark of gopher wood"  — Genesis 6:14          ← smaller, in quotes, with the ref
```

- The plain line is **never** in quotation marks and **never** carries a reference. Only verbatim text gets quotes and a ref. This is a compliance rule, not a style preference: a paraphrase presented as scripture is a misquotation of scripture, and the layout must make that structurally impossible.
- **Verse selection is constrained by the source.** The simplify pass works from the Youth pair's existing verse, so it cannot wander to a different scripture — it picks the most concrete *fragment* of the verse it was given. If no fragment of that verse works for a child, it emits `versePhrase: null` and the card shows the plain line only; it must never substitute a different verse (that would silently detach the Primary card from the Youth card it was derived from).
- Deterministic check (§8c): `versePhrase` must be a normalised substring of the source `verse`, and `verseRef` / `url` must be byte-identical to the source pair's.

### The Story Card (replaces the match modal)

Youth mode shows six blocks; Primary mode shows four, in one glance:

```
┌────────────────────────────────────────────────┐
│  🛶   ARK                                       │  ← giant emoji + the word
├────────────────────────────────────────────────┤
│  God told Noah to build a big boat to keep      │  ← ONE sentence, ≤14 words
│  his family safe.                               │
│                                                 │
│  "Make thee an ark of gopher wood"              │  ← verbatim phrase + ref
│                              — Genesis 6:14     │
│                                                 │
│  ✝  Jesus keeps us safe too.                    │  ← Christ connection, ≤10 words
├────────────────────────────────────────────────┤
│  👉  Point to the ark! Who told Noah to         │  ← ONE prompt, action-first
│      build it?                                  │
│                                    [ Next → ]   │
└────────────────────────────────────────────────┘
```

- **≤30 seconds of teacher material.** If it can't be said in 30 seconds it doesn't belong on the card.
- Prompts are **action-first**: "Point to…", "Show me with your hands…", "Everybody say…". Never "Tell us about a time you…" — that invites self-disclosure and is prohibited framing anyway (Handbook §37.8; Playbook §4 house rule).
- The QR sits small in the corner, linking the same verse URL as the Youth card.
- Optional auto-advance after N seconds (teacher setting, default off) for a class that's losing the room.

---

## 7. 🙌 Wiggle Break (replaces Sabotage) — locked

Sabotage is a teen mechanic: adversarial, and the word is wrong for a Primary room. Primary mode reuses the same *code path* (shuffle + animation + sound) with a kind framing:

- Fires **between boards**, never mid-board. Mid-board shuffling destroys the spatial memory a five-year-old just built — which is the entire skill being exercised.
- Full-screen card with an action prompt ("Stand up and reach to heaven! 🙌", "March in place while we count to ten!"), ~15–20 seconds, then the next board deals in.
- Prompts come from a small hand-written client-side bank — no API cost, no compliance surface — tied to the lesson theme where one fits.
- Doubles as the pacing instrument: the natural place for a teacher to stop early (§3, safe exits).
- The existing `handleSabotage` shuffle stays in Youth mode, untouched.

---

## 8. Content — the simplify pass

### 8a. Why this shape

Primary content is a **transformation of the Youth pairs**, not a second reading of the lesson. That means no extraction call, no new `gameType` threaded through the six `rounds||pairs||stops||puzzles` guards in `pipeline.js`, and a small, cheap call: the input is 12 already-compliant pairs, not a scraped lesson page.

It also means **Youth content is a prerequisite.** The ⚡ Primary button is disabled until `lessonLibrary/{id}.memory` exists, and the batch job runs memory → simplify in sequence.

### 8b. Endpoint

`POST /api/simplify-pairs` — thin Vercel handler over `api/_lib/simplify.js`, with the matching Vite dev middleware so dev and prod run identical code (the `pipeline.js` pattern).

- **Input:** `{ lessonId, topic, pairs[] }` — the existing `.memory` pairs.
- **Output:** `lessonLibrary/{lessonId}.memoryPrimary` = `{ topic, boards[3], pairs[12], derivedFrom: 'memory', generatedAt, pipeline: 'simplify-v1', complianceReport }`.
- **Model: `claude-sonnet-4-6`, not Haiku.** This pass touches scripture, and Haiku hallucinated cross-manual references during earlier pipeline testing on this repo. The input is small, so Sonnet is still only a few cents per lesson.
- `max_tokens: 6000`, default 180s timeout, one retry on 500/503/529 — same retry semantics as the pipeline.

**What the model may write:** `word`, `phrase`, `verseSimple`, `versePhrase`, `sentence`, `christConnection`, `prompt`, and the three board headers (`title`, `takeaway`).
**What it must copy verbatim from the source pair:** `verseRef`, `url`, `verse` (carried through for the substring check and the teacher's collapsed line), `icon`, `iconLabel`. The Youth pairs already carry `icon` + `iconLabel`, so Primary mode inherits a hand-checked picture for free.

```json
{
  "topic": "Noah and the Flood",
  "derivedFrom": "memory",
  "boards": [
    { "n": 1, "title": "Noah Builds the Ark", "takeaway": "Noah obeyed God even when it was hard." },
    { "n": 2, "title": "The Rain Comes",      "takeaway": "God kept Noah's family safe." },
    { "n": 3, "title": "God's Promise",       "takeaway": "God always keeps His promises." }
  ],
  "pairs": [
    {
      "id": "p1", "board": 1,
      "icon": "🛶", "iconLabel": "ark",
      "word": "ARK",
      "phrase": "a big boat God planned",
      "sentence": "God told Noah to build a big boat to keep his family safe.",
      "verseSimple": "God told Noah to build a big boat.",
      "versePhrase": "Make thee an ark of gopher wood",
      "verseRef": "Genesis 6:14",
      "verse": "Make thee an ark of gopher wood; rooms shalt thou make in the ark...",
      "christConnection": "Jesus keeps us safe too.",
      "prompt": "Point to the ark! Who told Noah to build it?",
      "url": "https://www.churchofjesuschrist.org/study/scriptures/ot/gen/6?lang=eng&id=p14#p14",
      "complianceCheck": "PASS"
    }
  ]
}
```

### 8c. Deterministic checks (Playbook §3 — "prompt rules are wishes")

Run inside `api/_lib/simplify.js` before anything is written:

1. **`versePhrase` is a normalised substring of the source pair's `verse`** (lowercase, strip punctuation, collapse whitespace). The non-negotiable one: it's what stops the model from rewriting scripture into kid language and leaving it in quotes. Failure → `versePhrase: null` + `REVIEW` flag, card falls back to the plain line.
2. **`verseRef`, `url`, `icon` are byte-identical to the source pair.** Any drift is an error, not a rewrite — the Primary card must stay anchored to the Youth card it came from.
3. **`verseSimple` contains no archaic-form token** (fixed blocklist) — deterministic, catches the model drifting back into KJV cadence.
4. Word / char caps: `word` ≤8 chars single A–Z token · `phrase` ≤5 words · `sentence` ≤14 words · `verseSimple` ≤12 words · `versePhrase` ≤10 words · `christConnection` ≤10 words · `prompt` ≤14 words starting with an action verb.
5. **Reading-level guard:** flag any `sentence` / `verseSimple` / `prompt` containing a word >10 characters outside a small proper-noun allow-list (Jerusalem, Nephi, …). Crude, deterministic, catches "righteousness" in a sentence aimed at six-year-olds.
6. **Icon uniqueness across the 12 pairs** — the emoji is the match key (§3), so a duplicate makes a board unwinnable. Inherited icons come from Youth content that never had this constraint, so the pass must detect collisions and ask for a distinct alternate for the later pair; unresolved → `REVIEW_REQUIRED`.
7. **Pair count and board balance:** exactly 12 pairs out, 4 per board, every source `id` present exactly once. A dropped pair is a bug, not a degradation — there's no spare capacity.
8. `HARD_BLOCK_TERMS` scan + per-pair `complianceCheck` stamp + a `complianceReport` in the v3 shape, so the admin pill works unchanged.
9. `runSafetyReview` on the flat 12-pair list, same `ENABLE_SAFETY_REVIEW` gate. The source content already passed a safety review, but the kid-language rewrite is new text and Playbook §4 wants every shipping string reviewed.

Client re-validates on load (defense in depth): caps, icon uniqueness, 4-per-board. A board that fails is skipped with a teacher-visible note rather than rendered broken.

---

## 9. Mode switching — how a teacher gets the right version

One field, two values: **`audience = 'primary' | 'youth'`** (default `'youth'`, so every existing classroom behaves exactly as it does today).

### 9a. Resolution order (first hit wins)

1. **`?mode=primary|youth` in the URL** — explicit, shareable, testable. Always wins. (Same shape as Well of Words' `?mode=helper`.)
2. **The classroom's `audience` field** — read from `classrooms/{room}.audience` when `?room=` is present.
3. **`localStorage.kindred_audience`** — the last choice made on this device.
4. **Nothing resolved → the launch-screen picker**, whose answer writes to #3.

**The classroom field is the one that matters.** A Primary teacher teaches the same age band every week — being asked at every launch is friction, and `localStorage` quietly breaks the moment they use the building's shared laptop or the clerk's projector PC. The classroom doc is the only place the answer is stable, shared across devices, and already scoped correctly: a teacher with both a Primary class and a youth class already has two classrooms, so the two get different modes for free. Classroom docs already carry `name`, `teacherEmails[]`, `country`, `inviteCodes[]` and a field-migration pattern ([admin.html:1228](admin.html#L1228)) — `audience` is a one-line extension.

### 9b. The switching surfaces

| Surface | Who uses it | Behaviour |
|---|---|---|
| **Admin → Classrooms** — audience dropdown per classroom | Admin, once per class | Set it and nobody thinks about it again. The default. |
| **⚙ gear in-game** — "Audience: 🧸 Primary · 🎓 Youth" | Teacher, mid-session | Lives beside the display-scale presets, mirroring WoW's gear-menu Helper↔Monitor flip. Rewrites the URL param via `history.replaceState`, reloads content, re-deals. |
| **Launch-screen picker** | First run / no classroom | Two big buttons, shown only when nothing resolved. |
| **Portal deep-link** | Everyone | [index.html:2612](index.html#L2612) already appends `?room=`; it appends `&mode=` too when the classroom has an audience. |

The gear entry is the escape hatch that keeps this from needing new permissions: only `lewiswf@gmail.com` can edit classrooms, so a teacher who needs the other mode for one lesson (combined activity day, substituting) flips it themselves and it sticks on their device.

### 9c. What a mode switch actually does

**The mode selects which Firestore field the game reads** — `.memory` for Youth, `.memoryPrimary` for Primary. A switch is a content reload, not a re-render:

- Switching **re-deals the board.** Mid-game it needs a confirm ("Start over for younger kids?") — a stray gear tap must not wipe a board the class is halfway through.
- **Never leave the previous mode's pairs on screen.** Clear pairs before the fetch resolves, the way the library loader clears `retryTimerRef` today.

### 9d. Two integration traps

1. **The portal's ✓ ready pill is currently mode-blind.** [index.html:2624](index.html#L2624) checks `data.memory?.pairs?.length` — a Primary classroom would see "✓ ready" for content that doesn't exist in their mode. The check must consult the field matching the classroom's audience.
2. **Missing content must not dead-end.** If `memoryPrimary` is absent but `memory` exists, the launch screen says so plainly and offers both exits: play the Youth version anyway, or ask the admin to generate the Primary version. Admin's missing-counter and both batch jobs count per mode.

---

## 10. Platform integration checklist

1. `games/memory.html` — `?mode=` param + launch picker; `memoryPrimary` loader (`window.loadMemoryPrimaryFromLibrary`, `cfm-` prefix fallback tried **both ways**, always); board state (`boardIdx`) + the client chunker; Primary skin; Story Card; Wiggle Break; audience item in the ⚙ menu.
2. `api/simplify-pairs.js` + `api/_lib/simplify.js` + Vite dev middleware in `vite.config.js` (middleware only — **no** new `rollupOptions.input` entry).
3. `admin.html` — ⚡ Primary button (disabled until `.memory` exists), gameLabel entry, compliance pill + summary chip, missing-counter, Primary checkbox on both batch jobs.
4. `admin.html` Classrooms tab — `audience` dropdown + a one-line default in the existing field migration.
5. `index.html` — audience-aware ✓ ready pill ([index.html:2624](index.html#L2624)), `&mode=` on the Scripture Match link ([index.html:2612](index.html#L2612)), optional "🧸 Primary" chip on the card.
6. `src/lib/cfm-schedule.js` — **no** `GAME_META` change (same game). An `audience` axis in the recommendation engine is deferred (§12).
7. `CLAUDE.md` + this doc updated in the same commit as the feature (Playbook §2.8).

---

## 11. Compliance & safety deltas

- **The `versePhrase` substring check (§8c.1) is the headline guarantee** — with a model rewriting scripture-adjacent text, it's what makes "we never misquote scripture" a machine fact rather than a prompt instruction. Paired with §8c.2, a Primary card can't drift off the Youth card's reference either.
- **Paraphrase must never read as scripture.** Quotes and a reference appear only on verbatim text (§6) — the one doctrinal risk this mode introduces that the other games don't have. It goes in the `lesson-reviewer` instruction explicitly.
- **`lesson-reviewer` must be run with an explicit "audience: children 4–11" instruction** — its default rubric assumes youth. Expect `PASS_WITH_REWRITES`; apply rewrites verbatim (Playbook §4.4).
- Prompts never invite self-disclosure (§37.8) — enforced by the action-verb rule, which structurally cannot produce "tell us about a time you…".
- No student-typed input in this mode, so no display scrub beyond what already ships.
- Demo content is real content: run the simplify pass on the existing 12 Exodus default pairs, hand-verify, and put the result through `lesson-reviewer` like generated content. That doubles as the offline fixture.

---

## 12. Explicitly deferred

- **Teacher-chosen board size** (3 / 4 / 6 pairs per board). Nearly free given client-side chunking, but board titles and takeaways are written against the 3×4 split. Ship fixed; add the setting if a playtest asks.
- **Helper / second-device view.** Primary mode has no teacher-gated knowledge — cards are face-down for everyone and the children tap them directly (Playbook §7). Board advance and the Wiggle Break are the only facilitation, and a stray tap costs a shuffle, not a spoiler.
- **Audience axis in the recommendation engine.** `GAME_FIT_MATRIX` keys on lesson type only; "which games suit my age group" is a second axis, portal-wide, and should land once more than one game has a kids mode — Well of Words' 💧 Spring (K-6) mode is the other half.
- **Teacher-edited Primary pairs** (classroom-scoped override mirroring `trailLessons`). After the first classroom test.
- **Audio narration of `verseSimple`.** Genuinely valuable for pre-readers; needs a TTS decision.
- **Print-and-cut physical card export.** Primary teachers will ask for it. v1.1 candidate.

---

## 13. Remaining open question

Everything else was answered on 2026-09-20 and is recorded in §0. One left:

**Is there a real Primary class to playtest with?** Playbook §8.7 is non-negotiable and Claude can't do it. This design rests on age heuristics; 3–4 rounds of correction from a real 6-year-old is where it becomes right. If there isn't one available, the build should ship behind the classroom `audience` flag and stay unannounced until it's been in front of actual kids.

---

## 14. Build plan & definition of done

1. Node unit tests for the pure pieces — board chunker, the `versePhrase` normaliser + substring check, archaic-form guard, icon-collision detector — passing before anything is inlined.
2. Offline fixture tests for `api/_lib/simplify.js` via `__testables`: the 12 Exodus default pairs in, kid pairs out, every §8c check exercised including the failure paths (null `versePhrase`, icon collision, ref drift).
3. `npm run build` green (all 7 pages).
4. Dev smoke: `?mode=primary` renders, boards chunk 4/4/4, `?lesson=` auto-load works with and without the `cfm-` prefix, mode switch mid-game confirms before re-dealing.
5. One **live** simplify run on the current real CFM lesson, machine-validated, written to prod `lessonLibrary` so the picker isn't empty on day one (a few cents).
6. `lesson-reviewer` PASS (children 4–11 rubric, rewrites applied) on the demo set and the first generated set.
7. Human playtest: real TV (emoji + word sizes from the back row), a tablet (tap targets), and — the one that matters — a real class of little kids. Budget 3–4 feedback rounds; they are the second half of the build, not scope creep.

---

*Drafted against GAME-PLAYBOOK.md. §0 is locked and §13 is the only open question — the build prompt comes out of §3–§10.*
