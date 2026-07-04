# Game Builder — New Kindred Game, Playbook-Driven

Design and ship a new game for the Kindred platform using everything learned from previous game builds. This is the engineering counterpart to `/project:gamemaster` (which designs classroom *sessions* for existing games — do not confuse them).

## Invocation
`$ARGUMENTS` = a game concept (e.g. "a bingo-style game for conference talks"). If empty, ask what game Lewis wants to build.

## Step 0 — Read the playbook (mandatory)
Read `GAME-PLAYBOOK.md` at repo root IN FULL before anything else. It encodes the shipped lessons from prior builds (layout standards, helper-view pattern, pipeline rules, testing gates, CSS/JS gotchas). Every step below assumes its rules. Also read `CLAUDE.md` for current platform state and `well-of-words-design.md` as the reference design doc + integration checklist.

## Step 1 — Design phase (no code yet)
1. Spawn up to 3 parallel research subagents: codebase integration map (verify current file:line anchors — they drift), genre/mechanics research, IP/name screen. Keep total spend modest.
2. Draft the design doc at repo root (`{name}-design.md`) following well-of-words-design.md's structure: verdict, research digest, concept, game-design spec, branding, pipeline schema, integration checklist, build prompt, open decisions.
3. **Bake in the playbook defaults**: single cooperative class score; 10+ interactions per round; both drag AND tap input where sequential; ⚙ scale gear with custom slider; fixed-height dynamic bands; two-column wide layout with auto-fit board; helper view if the game has teacher-gated knowledge (decide now, per playbook §7); free round-navigation as the recovery story; whitelist-only student-facing content with display scrub.
4. Ask Lewis the decision gates with AskUserQuestion: name (top pick + fallbacks from the IP screen), rec-engine inclusion, audience scope, v1 vs v1.1 deferrals, helper view yes/no.
5. **HOLD everything uncommitted until Lewis clears the name** (manual TESS + app-store check).

## Step 2 — Build order
1. Pure algorithms first, standalone in Node with unit tests (scratchpad), then inline.
2. `games/{name}.html` — copy plumbing patterns from `games/well-of-words.html` (Firebase module script + sync export + ready event, scale gear block, fixed hint/status band, helper scene + state/cmd sync, two-column layout with measured auto-fit).
3. Pipeline gameType: generation prompt + deterministic structural checks + flattened safety-review mapping + backfill + `__testables` + per-gameType max_tokens/timeout if output is large.
4. Platform wiring: vite input, catalog card (free color check), room suffix, ready pill, GAME_META (with `bestFor`) + GAME_FIT_MATRIX, admin buttons/pills/batch jobs, `?lesson=` auto-load with `cfm-` fallback.
5. Update CLAUDE.md in the same commit.

## Step 3 — Verification gates (all required before "done")
1. Node unit tests pass; offline pipeline fixtures pass.
2. `npm run build` green; dev-server smoke test.
3. One LIVE pipeline run on the current real CFM/Seminary lesson; machine-validate output; upload to prod lessonLibrary so the picker has content.
4. `lesson-reviewer` subagent on demo + generated content; apply every rewrite it returns.
5. Hand Lewis an explicit hardware test list: TV (text sizes, layout shift, contrast), tablet (touch), phone (helper). State clearly whether the latest build is on localhost or prod.

## Step 4 — Playtest loop (this IS part of the build)
Expect 3-4 rounds of fragmented feedback. For each item: reproduce/diagnose from the screenshot, fix, build, commit with a message stating symptom AND root cause, push immediately, and tell Lewis what changed and where to see it. Check every fix against the playbook's gotcha list (zoom coordinates, SVG sizing, custom-prop parseFloat, toggle-vs-action button semantics, remote commands opening local UI).

## Step 5 — Retrospective (closes the loop)
After the game stabilizes: `git log` the post-launch fixes, extract any lesson not already in `GAME-PLAYBOOK.md`, update the playbook, update auto-memory, and note superseded sections in the design doc. The playbook only stays useful if every build feeds it.

## House rules that always apply
- Dev port 5173 · `ANTHROPIC_API_KEY` never gets `VITE_` prefix · appId stays `exodus-feud-final-v10` · raw fetch to Anthropic (no SDK) · lessonLibrary reads try both `{id}` and `cfm-{id}` · back-nav `← Kindred Hub` → `../index.html` · commit+push after every accepted change · flag API spend afterward · no individual student leaderboards, ever.
