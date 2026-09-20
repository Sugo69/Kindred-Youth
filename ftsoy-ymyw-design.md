# YM/YW (Third Hour) — For the Strength of Youth curriculum

**Date:** 2026-09-20 · **Status:** Phase 1 BUILT + trialled 2026-09-20 — Phases 2-4 open · **Scope:** a third *curriculum*, not a new game · **Playbook:** `GAME-PLAYBOOK.md`

---

## 1. Verdict

**This is a curriculum source, not a product.** Kindred already runs two curricula — `cfm-schedule.js` and `seminary-schedule.js` — through one pipeline into five games. FSY becomes a third schedule module feeding the same pipeline and the same games. No new game, no new page, no change to how a lesson becomes a game.

Verified against the live site (2026-09-20):

- **The magazine is machine-discoverable.** Once a month is published, every lesson URL is *derivable*, not scrapeable:
  `/study/ftsoy/{YYYY}/{MM}/fsy-lessons/{code}?lang=eng` with fixed codes
  `00-intro · 01-fast-sunday · 02-second-sunday · 03-third-sunday · 04a-fourth-sunday (YW) · 04b-fourth-sunday (AP) · 05a/05b-activity-idea`.
- **Publication runs about a month ahead.** The October 2026 issue carries both October ("Your Body Is Sacred") and November ("Truth Will Make You Free"). So the year cannot be pre-loaded like CFM, but the horizon is comfortable — one existence check per month, not a scraper.
- **The YM/YW split is one lesson a month.** Only the last Sunday differs (`04a` Young Women / `04b` Aaronic Priesthood). Everything else is shared.

## 2. The two findings that shaped the design

### 2a. The magazine lesson is a pattern, not content

`01-fast-sunday` is ~250–300 words and reads as a teaching *framework* ("select an eternal truth · read supporting scriptures · share experiences · bear testimony · choose an invitation"). It carries no discussion questions of its own and no leader quotes. The substance is in the guide chapter it points to — for September, *"You are blessed by priesthood keys and authority"*, pages 46–49 of the FSY guide.

**Predicted consequence:** generation would need to read the **FSY guide chapter** as its content source, because generating from the magazine page alone would produce a game about how to teach a lesson rather than about the doctrine.

> **TRIAL RESULT (2026-09-20) — this did not happen.** Two live runs against the September issue, including the thinnest page (`01-fast-sunday`, which is literally "study the chapter from the FSY guide"):
>
> | lesson | rounds | structural | safety | hard blocks |
> |---|---|---|---|---|
> | `03-third-sunday` (priesthood keys) | 8 | 8 pass / 0 review | 2 rewritten | 0 |
> | `01-fast-sunday` (guide chapter) | 8 | 8 pass / 0 review | 3 rewritten | 0 |
>
> Both produced real doctrinal questions with correct citations (D&C 13:1, 65:2, 107:8, 27:12–13) and a Christ connection on every round. The extraction step follows the page's scripture references rather than being limited to its prose, so the thin page was not a thin lesson. **Reading the guide chapter is therefore a Phase 2+ enhancement, not a prerequisite.** Both games are seeded in the library under `ftsoy-2026-09-*` for inspection.

Structurally, a month is therefore: **one guide chapter + four weekly angles**, which is a nicer shape than CFM (where each week is an unrelated block of scripture).

### 2b. The compliance list will reject legitimate FSY curriculum

`HARD_BLOCK_TERMS` in `api/_lib/pipeline.js` hard-blocks `sexual`, `vap(e|ing)`, `marijuana`, `cannabis`, `cocaine`, `heroin`, `meth`, `abuse` and more. That list was tuned for CFM scripture lessons for 14–16s, where those words only ever appear as a safety failure.

FSY teaches these topics **on purpose**: October 2026 is "Your Body Is Sacred" — Word of Wisdom (second Sunday) and the law of chastity (third Sunday). The first October generation would flag legitimate curriculum as `REVIEW_REQUIRED` and strip real content.

**This is the single biggest technical risk in the project** and it must be handled before any FSY content is generated. *(Handled in Phase 1 — see below. Neither September trial tripped a hard block, but September's theme is priesthood keys; October's "Your Body Is Sacred" is the real test and should be generated before that month is taught.)*

The precedent already exists: the block list deliberately allows biblical words (`ass`, `hell`, `harlot`) because a scripture lesson needs them. The same reasoning extends to curriculum-aware handling — the rule is not "never say these words", it is "never say these words *inappropriately*", which is a job for the AI safety review, not a regex.

**Approach:** the structural scan becomes curriculum-aware. For `curriculum: 'ftsoy'`, a defined set of doctrinal-topic terms (chastity/morality and Word of Wisdom vocabulary) moves out of the hard-block regex and into the safety review's remit, which judges *context*. Everything genuinely off-limits (explicit content, self-harm, abuse-as-narrative) stays hard-blocked for every curriculum. The compliance report records which posture was used, so a reviewer can see it.

## 3. The schedule model

Unlike CFM (a static year array) and Seminary (on-demand with a cache), FSY is **derived**. `src/lib/ftsoy-schedule.js` computes everything from the calendar plus the fixed slug pattern:

| Code | Label | Sunday | Track |
|---|---|---|---|
| `01-fast-sunday` | Fast Sunday | 1st Sunday of the month | shared |
| `02-second-sunday` | Second Sunday | 2nd Sunday | shared |
| `03-third-sunday` | Third Sunday | 3rd Sunday | shared |
| `04a-fourth-sunday` | Last Sunday | **last** Sunday | YW |
| `04b-fourth-sunday` | Last Sunday | **last** Sunday | YM (Aaronic Priesthood) |

`00-intro` supplies the month theme and the guide-chapter pointer; `05a/05b-activity-idea` are activity ideas, not Sunday lessons.

**Open question (§7.1):** the slug says *fourth* but the magazine labels it *Last*. In a five-Sunday month those differ. The module treats it as the last Sunday and marks the spare Sunday `open`, which is also how fifth Sundays usually behave in practice — but this needs confirming against a real five-Sunday month.

**Library ids:** `ftsoy-{YYYY}-{MM}-{code}` — deliberately *not* the `cfm-` prefix. The `cfm-`/bare-id fallback has caused bugs twice; FSY ids stay distinct and no code should extend that fallback to them.

## 4. Classroom model

Two orthogonal fields, neither of which disturbs what exists:

- `audience` — `'youth' | 'primary'` (already shipped, reading level).
- `curriculum` — `'sunday-school' | 'ymyw'` (new; defaults to `sunday-school`, so every current classroom is unchanged).
- `track` — `'ym' | 'yw'`, only meaningful when `curriculum === 'ymyw'`, and only affects the last Sunday of each month.

**This field is what stops the portal getting complicated.** The portal's "this week" logic assumes one lesson per week; YM/YW adds a second lesson on the same Sunday. A classroom sees *its own* curriculum's week and nothing else. A teacher looking at all three curricula at once is the failure mode to avoid.

## 5. The 30-minute constraint

The new schedule gives YM/YW about 30 minutes, minus theme recitation and class business — call it 18–20 minutes of lesson. Common Ground's eight rounds does not fit.

What fits is the structure built for Primary mode on 2026-09-20: **short boards with a safe exit at every boundary.** A short form of the existing games is worth more here than any new game. Not Phase 1, but it is the reason no new game is proposed.

## 6. Phasing

**Phase 1 — BUILT 2026-09-20** (commit `ab0506a`), 41 offline tests:
1. `src/lib/ftsoy-schedule.js` + unit tests (Sunday maths is exactly what deterministic tests are for).
2. `/study/ftsoy/` added to the pipeline source allowlist (it is currently rejected with a 400).
3. Curriculum-aware compliance posture (§2b).
4. Admin **"➕ Add FSY month"** — creates that month's library entries with correct URLs, labels, track and guide chapter; generation uses the existing ⚡ buttons.

Phase 1 deliberately adds **no portal changes and no new infrastructure**. It answers the real unknown: does the pipeline make good games out of topical FSY material rather than scripture narrative?

**Phase 2** — portal YM/YW tab; classroom `curriculum`/`track`; `GAME_FIT_MATRIX` row for topical lessons (Scripture Trail likely fits poorly).
**Phase 3** — daily Vercel cron checking this month + the next two, idempotent, with a notification (the notification system already exists) when a new month lands. Plus a manual "Check now".
**Phase 4** — the opening sequence: theme slide sized for unison reading, optional business timer, guide-chapter summary, then the game.

## 7. Open questions

1. **Five-Sunday months** — is the split lesson on the fourth Sunday or the last? (§3)
2. **Guide chapter mapping** — the intro page names the chapter in prose ("pages 46–49"). Is a stable chapter URL derivable, or does each month need the pointer parsed from `00-intro`?
3. **Theme text** — the youth themes page only links to the theme statements; the actual wording needs one more fetch. Phase 4 concern.
4. **Copyright posture** — FSY magazine and guide are Church-copyrighted prose, not scripture. The platform's existing stance (link, paraphrase, quote only the standard works verbatim) should hold, but it is worth a line in the legal review since this is the first non-scripture curriculum source.

---

*Phase 1 is the only committed scope. Everything past §6 Phase 1 waits until we have seen real generated FSY output.*
