# Scripture Match — Primary Mode (younger-kids mode)

**Date:** 2026-09-20 · **Status:** DRAFT v2 — some decisions locked (§0), §13 gates still open · **Scope:** a second *mode* inside `games/memory.html`, not a new game · **Playbook:** written against `GAME-PLAYBOOK.md` (§1 design gates, §2 integration, §3 pipeline, §4 compliance, §5 layout, §7 helper, §8 testing)

---

## 0. Locked decisions (Lewis, 2026-09-20)

1. **Keep 12 pairs per lesson** — same content volume as Youth mode. The problem was never how much lesson there is, it's how it's delivered.
2. **Fewer cards per board, more boards** — 3 boards × 4 pairs (8 cards each). Boards are chunked **client-side**, so the pipeline emits one flat 12-pair set, same as today.
3. **🙌 Wiggle Break is in** (§7).
4. **The scriptures themselves get simplified, not hidden.** This is now the centre of the design (§6) — v1 of this doc had the verse as teacher-only material, which was the wrong call.

Consequence of #1 + #2: generation stays the same size as the existing memory call (`max_tokens: 8000`, default 180s timeout), so this mode costs about what a Youth generation costs — no Well-of-Words-scale budget needed.

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

**Estimated surface:** `games/memory.html` (mode plumbing + kid skin + client board chunking + Story Card + break) · `api/_lib/pipeline.js` (new gameType branch, prompt, deterministic checks) · `admin.html` (generate button, compliance pill, batch jobs) · `CLAUDE.md`. No new page, no new catalog card, no `vite.config.js` entry.

---

## 2. Audience constraints this design is built around

Design rationale, not new research — the classroom findings in `well-of-words-design.md` §2b apply directly, plus standard early-childhood heuristics:

- **Attention runs roughly a minute per year of age for a single sustained task.** A 6-year-old's focused stretch is ~6 minutes. Any unit of play longer than that must be *chunked*, not shortened — chunking keeps the lesson content and changes only the rhythm.
- **Dual coding / picture superiority** (`well-of-words-design.md` §2b, Paivio): a picture paired with a word beats verbal-only for school-age vocabulary, strongest for younger children. The picture must depict the *meaning*, not decorate.
- **Archaic English is a second language to a six-year-old.** "Fear ye not, stand still" is not hard because it's scripture; it's hard because it's 1611 syntax. Comprehension comes from a plain-language line *first*, with the verbatim phrase alongside it (§6).
- **Pre-readers cannot decode on the clock.** Every line of kid-facing text is either read aloud by the teacher or is one word paired with its picture.
- **Motor:** tap targets ≥60px; no drag, no precision, no double-tap.
- **No timers, no losing.** Visible countdowns create anxiety at this age; Scripture Match already has no fail state — keep it, and keep the single cooperative class outcome (Playbook §1.4: no teams, no individual leaderboards, ever).
- **Movement is not a reward, it's a requirement.** A stand-up beat every few minutes buys back the next few minutes of attention.
- **Accessibility carries over:** uppercase-only word tiles (sidesteps b/d confusion), generous letter-spacing, state changes by fill + motion and never hue alone (washed-out church projectors).

---

## 3. The mode delta

One content set, **two reading levels** selected client-side. The pipeline emits `icon` + `word` + `phrase` + both scripture lines per pair; the reading level decides what's on the back face and how much scripture is on screen. Older kids need no separate generation run.

| | 🧸 **Little (ages ~4–8)** | 📖 **Junior (ages ~8–11)** | 🎓 **Youth (12–18) — today, unchanged** |
|---|---|---|---|
| Pairs per lesson | 12 | 12 | 12 |
| Board layout | 3 boards × 4 pairs (8 cards) | 3 boards × 4 pairs (8 cards) | 1 board × 12 pairs (24 cards) |
| Grid | 4×2 | 4×2 | 6×4 |
| Face A | big emoji + `WORD` | big emoji + `WORD` | ref + title (Orbitron) |
| Face B | **same emoji + same `WORD`** (pure picture match) | emoji + short `phrase` (≤5 words) | application phrase |
| Scripture on screen | plain-language line only, read aloud | plain-language line **+** verbatim phrase in quotes + ref | full KJV verse + ref |
| Match beat | Story Card (§6), ~20–30s | Story Card + one prompt, ~30s | full match modal |
| QR | no | yes (small, teacher-facing corner) | yes |
| Break | 🙌 Wiggle Break between boards | 🙌 Wiggle Break between boards | 💥 Sabotage |
| Miss hold time | ~1.4s | ~1.2s | 0.9s |
| Target board time | ~3 min | ~3 min | ~20 min |

**Why "same emoji on both faces" for Little:** it makes the board a pure visual-memory game — exactly the right cognitive load for pre-readers — and moves 100% of the teaching into the Story Card, where the teacher is talking. Nothing is lost doctrinally; the learning beat was never in the card faces.

### Session math (the thing that has to fit)

| | Little | Junior |
|---|---|---|
| 3 boards of matching | ~9 min | ~9 min |
| 12 Story Cards @ ~25–30s | ~5–6 min | ~6 min |
| 2 Wiggle Breaks @ ~20s | ~1 min | ~1 min |
| Closing screen | ~2 min | ~2 min |
| **Total** | **~17–18 min** | **~18 min** |

That fits a Primary lesson slot with room to spare, and **every board boundary is a safe exit** — a teacher who's out of time stops after board 2 and the class still had a complete experience. That property is worth protecting in the build: never put content the lesson needs *only* in board 3.

---

## 4. Core loop (Little / Junior)

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
- Face: emoji at `clamp(3.5rem, 11vw, 7rem)` — **dominant**; the word secondary at `clamp(1.1rem, 2.6vw, 1.8rem)`, Rajdhani 700 UPPERCASE, letter-spacing `0.08em`. **No Orbitron anywhere a child has to read** (Playbook §5 mandates Rajdhani for anything students decode; kid mode makes it absolute).
- Matched cards stay at full opacity with a soft gold ring; tapping one re-opens its Story Card (the existing revisit behaviour — keep it, teachers use it).
- Flip animation unchanged (500ms rotateY) — reads well on a projector and kids love it.
- Palette: keep the navy base and Scripture Match's green signature (Playbook §5), raise card-front saturation and brightness a step. No light theme — church projectors wash out and the navy base is what the platform is calibrated against.

---

## 6. Scripture simplification — the core of this mode

The verse is the reason the game exists, so it stays on screen. It just stops arriving in 1611 English as a wall of text. **Every pair carries the verse in two registers:**

| Field | What it is | Rules |
|---|---|---|
| `verseSimple` | The verse's meaning in kid language | ≤12 words · present tense · concrete nouns · no archaic forms (thee/thou/wist/behold) · no abstract nouns a child can't picture |
| `versePhrase` | A short **verbatim** fragment of the KJV | ≤10 words · must be a literal substring of the real verse · chosen to be the most quotable, concrete part |
| `verseRef` | Standard reference | Unchanged |

On screen they are **visually distinct, and never confusable**:

```
What it means:   God told Noah to build a big boat.        ← large, plain, kid-facing
"Make thee an ark of gopher wood"  — Genesis 6:14          ← smaller, in quotes, with the ref
```

- The plain line is **never** in quotation marks and **never** carries a reference. Only verbatim text gets quotes and a ref. This is a compliance rule, not a style preference: a paraphrase presented as scripture is a misquotation of scripture, and it must be structurally impossible for the layout to imply one.
- **Little** shows the plain line only (the verbatim phrase and ref sit in the teacher's collapsed "📖 for you" line). **Junior** shows both, as above.
- **Verse selection is part of the simplification.** The prompt instructs: prefer short, concrete, narrative verses; prefer verses from the lesson's children's section; skip any verse that needs surrounding context to make sense, even if it's the lesson's marquee verse. A verse a six-year-old can't picture is the wrong verse for this mode, and picking a different one is always allowed.
- Deterministic check (§8c): `versePhrase` must be a normalised substring of the `verseText` extraction supplied for that ref. This is the guard against the model "simplifying" the scripture itself.

### The Story Card (replaces the match modal)

Youth mode shows six blocks; kid mode shows four, in one glance:

```
┌────────────────────────────────────────────────┐
│  🛶   ARK                                       │  ← giant emoji + the word
├────────────────────────────────────────────────┤
│  God told Noah to build a big boat to keep      │  ← ONE sentence, ≤14 words
│  his family safe.                               │
│                                                 │
│  "Make thee an ark of gopher wood"              │  ← verbatim phrase + ref
│                              — Genesis 6:14     │     (Junior; teacher-line for Little)
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
- Optional auto-advance after N seconds (teacher setting, default off) for a class that's losing the room.

---

## 7. 🙌 Wiggle Break (replaces Sabotage) — locked

Sabotage is a teen mechanic: adversarial, and the word is wrong for a Primary room. Kid mode reuses the same *code path* (shuffle + animation + sound) with a kind framing:

- Fires **between boards**, never mid-board. Mid-board shuffling destroys the spatial memory a five-year-old just built — which is the entire skill being exercised.
- Full-screen card with an action prompt ("Stand up and reach to heaven! 🙌", "March in place while we count to ten!"), ~15–20 seconds, then the next board deals in.
- Prompts come from a small hand-written client-side bank — no pipeline involvement, no API cost, no compliance surface — tied to the lesson theme where one fits.
- Doubles as the pacing instrument: it is the natural place for a teacher to stop early (§3, safe exits).
- The existing `handleSabotage` shuffle stays in Youth mode, untouched.

---

## 8. Content model & pipeline

### 8a. Shape

New gameType `memory-primary`, written to its own top-level key `lessonLibrary/{lessonId}.memoryPrimary` (mirrors `wellOfWords` — Playbook §2, "one new top-level output array key"). Kept separate from `.memory` so the two generations have independent compliance reports and an independent admin ⚡ button.

**12 pairs, flat, in narrative order**, plus 3 board headers covering pairs 1–4, 5–8, 9–12. Boards are assembled client-side.

```json
{
  "topic": "Noah and the Flood",
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
      "verseText": "Make thee an ark of gopher wood; rooms shalt thou make in the ark...",
      "christConnection": "Jesus keeps us safe too.",
      "prompt": "Point to the ark! Who told Noah to build it?",
      "url": "https://www.churchofjesuschrist.org/study/scriptures/ot/gen/6?lang=eng&id=p14#p14",
      "complianceCheck": "PASS"
    }
  ],
  "sourceUrl": "...", "generatedAt": "...", "pipeline": "lesson-pipeline-v3",
  "complianceReport": {}
}
```

`verseText` (the full verse) is carried for the substring check and for the teacher's collapsed line — it is never the kid-facing content.

### 8b. Prompt rules (generation)

- Audience line: **"LDS children ages 4–11"**, not 13–16 — the current memory prompt hardcodes the teen audience at [api/_lib/pipeline.js:753](api/_lib/pipeline.js#L753).
- **Prefer scripture refs from the lesson's children's section.** Extraction already section-tags refs (`section`; `fromChildrenSection` in the extract-lesson skill output) — Primary generation weights those first, falls back to the main section.
- Hard caps, stated in the prompt *and* enforced in §8c: `word` ≤8 chars, single A–Z token · `phrase` ≤5 words · `sentence` ≤14 words · `verseSimple` ≤12 words · `versePhrase` ≤10 words, verbatim · `christConnection` ≤10 words · `prompt` ≤14 words, begins with an action verb.
- **`verseSimple` must not contain archaic forms** (thee, thou, thy, ye, hath, doth, unto, wist, behold, verily) — it's the plain-language line; if it still sounds like scripture it hasn't done its job.
- `icon` must depict the word's **meaning** (the dual-coding caveat) and must be **unique across all 12 pairs** — a duplicate emoji makes a Little board unwinnable, where the emoji *is* the match key.
- Story beats are narrative and concrete (things that happen, things you can picture). Abstract doctrine words (covenant, atonement, agency) live in `sentence` / `christConnection` in kid language, never as the `word`.
- The 12 pairs must be ordered so that pairs 1–4, 5–8 and 9–12 each form a coherent story beat matching their board header, and **each board must stand alone** — a class that stops after board 2 still got a complete lesson.
- `max_tokens: 8000`, default 180s timeout — same as the existing memory generation.

### 8c. Deterministic structural checks (Playbook §3 — "prompt rules are wishes")

A `memory-primary` branch in `runStructuralCompliance`. Everything a model can miscount is counted server-side:

1. Word / char caps on every capped field → `REVIEW: sentence too long (19 words)`.
2. `word` is a single A–Z token ≤8 chars.
3. **`versePhrase` is a normalised substring of `verseText`** (lowercase, strip punctuation and collapse whitespace before comparing). This is the non-negotiable one: it's what stops the model from quietly rewriting scripture into kid language and leaving it in quotes.
4. **`verseSimple` contains no archaic-form token** (fixed blocklist) — deterministic, catches the model drifting back into KJV cadence.
5. **Icon uniqueness across the 12 pairs** → violation is `REVIEW` + the duplicate pair is dropped in backfill. An unwinnable board is a broken board, not a cosmetic flaw.
6. **Reading-level guard:** flag any `sentence` / `verseSimple` / `prompt` containing a word >10 characters outside a small allow-list of proper nouns (Jerusalem, Nephi, …). Crude, deterministic, and it catches "righteousness" in a sentence aimed at six-year-olds.
7. Board integrity: each board needs ≥3 surviving pairs, else the run is `REVIEW_REQUIRED` (with 12 pairs there's no spare capacity — a dropped pair is visible).
8. Existing v3 guarantees all still apply: URL allowlist, `HARD_BLOCK_TERMS` scan, Christ connection per item, `complianceCheck` stamp per pair.
9. Safety review runs on the flat 12-pair list — no flattening helper needed, unlike `flattenWowWords`.

Client re-validates on load (defense in depth): caps, icon uniqueness, pair count per board. A board that fails is skipped with a teacher-visible note rather than rendered broken.

---

## 9. Mode switching — how a teacher gets the right version

One field, three values: **`audience = 'little' | 'junior' | 'youth'`**. Everything below resolves to it.

### 9a. Resolution order (first hit wins)

1. **`?mode=` in the URL** — explicit, shareable, testable. Always wins. (Same shape as Well of Words' `?mode=helper`.)
2. **The classroom's `audience` field** — read from `classrooms/{room}.audience` when `?room=` is present.
3. **`localStorage.kindred_audience`** — the last choice made on this device.
4. **Nothing resolved → the launch-screen picker** (§9c), and the choice is written to #3.

**The classroom field is the one that matters.** A Primary teacher teaches the same age band every week — being asked at every launch is friction, and `localStorage` quietly breaks the moment they use the building's shared laptop or the clerk's projector PC. The classroom doc is the only place the answer is stable, shared across devices, and already scoped correctly: a teacher who has both a Primary class and a youth class already has two classrooms, so the two get different modes for free. Classroom docs already carry `name`, `teacherEmails[]`, `country`, `inviteCodes[]` and a migration pattern for adding fields ([admin.html:1228](admin.html#L1228)) — `audience` is a one-line extension, defaulting to `'youth'` so every existing classroom behaves exactly as it does today.

### 9b. The switching surfaces

| Surface | Who uses it | Behaviour |
|---|---|---|
| **Admin → Classrooms** — audience dropdown per classroom | Admin, once per class | Set it and nobody thinks about it again. The default. |
| **⚙ gear in-game** — "Audience: 🧸 Little · 📖 Junior · 🎓 Youth" | Teacher, mid-session | Lives beside the display-scale presets, mirroring WoW's gear-menu Helper↔Monitor flip. Rewrites the URL param via `history.replaceState`, reloads content, re-deals. |
| **Launch-screen picker** | First run / no classroom | Three big buttons, shown only when nothing resolved. |
| **Portal deep-link** | Everyone | [index.html:2612](index.html#L2612) already appends `?room=`; it appends `&mode=` too when the classroom has an audience. |

The gear entry is the escape hatch that keeps this from needing new permissions: only `lewiswf@gmail.com` can edit classrooms, so a teacher who needs a different mode for one lesson (combined activity day, substituting for another class) flips it themselves and it sticks on their device.

### 9c. What a mode switch actually does

This is the part that will bite if it's treated as a skin toggle. **The mode selects which Firestore field the game reads** — `.memory` for Youth, `.memoryPrimary` for Little/Junior. So a switch is a content reload, not a re-render:

- Switching **re-deals the board.** Mid-game it needs a confirm ("Start over for younger kids?") — a stray gear tap must not wipe a board the class is halfway through.
- Little ↔ Junior is the cheap one: same content set, same board split, only the back face and the amount of scripture on screen change (§3). No reload, no re-deal — just a re-render. Worth implementing as a genuinely different path from Primary ↔ Youth.
- **Never leave the previous mode's pairs on screen.** Clear pairs before the fetch resolves, the same way the library loader clears `retryTimerRef` today.

### 9d. Two integration traps

1. **The portal's ✓ ready pill is currently mode-blind.** [index.html:2624](index.html#L2624) checks `data.memory?.pairs?.length` — a Primary classroom would see "✓ ready" for content that doesn't exist in their mode. The check has to consult the field matching the classroom's audience.
2. **Missing content must not dead-end.** If `memoryPrimary` is absent but `memory` exists, the launch screen says so plainly and offers both exits: play the youth version anyway, or ask the admin to generate the younger-kids version. Admin's missing-counter and both batch jobs count per mode, not per lesson.

---

## 10. Platform integration checklist

1. `games/memory.html` — `?mode=little|junior|youth` param + portal picker; `memoryPrimary` loader (`window.loadMemoryPrimaryFromLibrary`, `cfm-` prefix fallback tried **both ways**, always); board state (`boardIdx`) + the client chunker; kid skin; Story Card; Wiggle Break; reading-level toggle in the ⚙ menu.
2. `admin.html` — ⚡ generate button (🧸 Primary), gameLabel map entry, field ternary, compliance pill + summary chip, missing-counter, **both** batch jobs.
3. `api/_lib/pipeline.js` — prompt branch, `pairs||rounds||stops||puzzles` guards (~6 places), structural branch, backfill, `__testables` export.
4. `api/lesson-pipeline.js` + the `vite.config.js` dev middleware — gameType passthrough only (both are already thin wrappers).
5. `src/lib/cfm-schedule.js` — **no** new `GAME_META` entry (same game). An `audience` dimension in the recommendation engine is deferred (§12).
6. `index.html` — optionally a "🧸 Younger kids" chip on the existing Scripture Match card, deep-linking the mode param. Low cost; decide at build.
7. `CLAUDE.md` + this doc updated in the same commit as the feature (Playbook §2.8).

---

## 11. Compliance & safety deltas

- Everything in pipeline v3 applies unchanged. The additions are the §8c determinism — above all the `versePhrase` substring check — plus one rubric change: **`lesson-reviewer` must be run with an explicit "audience: children 4–11" instruction**, because its default rubric assumes youth. Expect `PASS_WITH_REWRITES`; apply the rewrites verbatim (Playbook §4.4).
- **Paraphrase must never read as scripture.** Quotes and a reference appear only on verbatim text (§6). Worth an explicit line in the reviewer instruction too, since it's the one doctrinal risk this mode introduces that the other games don't have.
- Prompts must never invite self-disclosure (§37.8) — enforced by the action-verb rule in §8b, which structurally cannot produce "tell us about a time you…".
- No student-typed input exists in this mode, so no display scrub beyond what already ships.
- Demo content is real content: hand-write one full 12-pair set (Noah, or the current CFM week) with verified verse phrases, and run it through `lesson-reviewer` exactly like generated content.

---

## 12. Explicitly deferred

- **Teacher-chosen board size** (3 / 4 / 6 pairs per board). Nearly free given client-side chunking, but board titles and takeaways are written against the 3×4 split, so a different size would fall back to "Part 1 / Part 2…". Ship the fixed split, add the setting if a playtest asks for it.
- **Helper / second-device view.** Kid mode has no teacher-gated knowledge — cards are face-down for everyone and the children tap them directly (Playbook §7: build one for hidden knowledge or facilitation controls). Board advance and the Wiggle Break are the only facilitation, and a stray tap costs a shuffle, not a spoiler. Revisit in v1.1 if the playtest disagrees.
- **Audience dimension in the recommendation engine.** `GAME_FIT_MATRIX` keys on lesson type only; a Primary teacher wants "which games suit my age group" as a second axis. Real, but portal-wide, and it should land once more than one game has a kids mode — Well of Words' 💧 Spring (K-6) mode is the other half of that story.
- **Teacher-edited Primary pairs** (classroom-scoped override mirroring `trailLessons`). After the first classroom test.
- **Audio narration of `verseSimple`.** Genuinely valuable for pre-readers; needs a TTS decision. Out of scope for v1.
- **Print-and-cut physical card export.** Primary teachers will ask for it. v1.1 candidate.

---

## 13. Open decision gates (Playbook §1.3)

*Resolved by Lewis 2026-09-20: pair count (12), board split (3 × 4), Wiggle Break in, scriptures simplified on screen — all folded into §0.*

Still open:

1. **Mode label.** "Primary" is the Church's own organisation name — the same class of exposure that kept *Doctrinal Mastery* out of By Heart's name (see `legal-review-2026-04-22.md`). Recommendation: **internal id `primary`, user-facing labels by age** — "🧸 Little Ones (4–8)" / "📖 Junior (8–11)" / "🎓 Youth (12–18)" — with "great for Primary classes" as descriptive body copy only. Alternative: use "Primary" in the UI as a plainly descriptive term. **Your call.**
2. **One kid tier or two?** §3 specs two reading levels off one content set (cheap — a client toggle, no extra generation). Confirm that's worth the toggle versus shipping the Little tier only and letting older Primary classes play it as-is.
3. **Separate generation, as specced** (`memoryPrimary`, own ⚡ button, ≈ the cost of one more Youth generation per lesson), **or** derive kid pairs client-side from the existing Youth pairs (free, but visibly worse — Youth pairs are abstract by design, and there'd be no `verseSimple` at all, which is the whole point of §6). Recommendation: separate generation.
4. **Pre-generation:** should "Generate Next 8 Weeks" include Primary content, roughly doubling that batch's cost and runtime? Recommendation: yes, behind a checkbox.
5. **Is there a real Primary class to playtest with?** Playbook §8.7 is non-negotiable and I can't do it. This design rests on age heuristics; 3–4 rounds of correction from a real 6-year-old is where it becomes right.

---

## 14. Build plan & definition of done

1. Node unit tests for the pure pieces (board chunker, reading-level filter, §8c validators — especially the `versePhrase` normaliser) — passing before anything is inlined.
2. Offline pipeline fixture tests through `__testables` (caps, archaic-form guard, substring check, icon-uniqueness drop, safety-rewrite application).
3. `npm run build` green (all 7 pages).
4. Dev smoke: the mode param renders, boards chunk correctly, `?lesson=` auto-load works with and without the `cfm-` prefix.
5. One **live** pipeline generation on the current real CFM lesson, machine-validated (substring check, caps, icon uniqueness, URL allowlist), uploaded to prod `lessonLibrary` so the picker isn't empty on day one.
6. `lesson-reviewer` PASS (children rubric, rewrites applied) on the demo set and the first generated set.
7. Human playtest: real TV (emoji + word sizes from the back row), a tablet (tap targets), and — the one that matters — a real class of little kids. Budget 3–4 feedback rounds; they are the second half of the build, not scope creep.

---

*Drafted against GAME-PLAYBOOK.md. §0 is locked; §13 is what's left. Once those are answered the doc flips to FINAL and the build prompt comes out of §4–§10.*
