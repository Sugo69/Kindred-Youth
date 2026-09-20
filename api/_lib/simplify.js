// Scripture Match — Primary mode simplify pass (simplify-v1).
//
// Transforms an ALREADY-GENERATED set of Youth Scripture Match pairs
// (lessonLibrary/{id}.memory.pairs) into kid-facing Primary content
// (lessonLibrary/{id}.memoryPrimary). This is a transformation, not a second
// reading of the lesson: no extraction call, no new gameType in pipeline.js.
//
// The model may ONLY write kid-facing language. Everything that anchors a card
// to scripture — the reference, the URL, the verse text, the icon — is copied
// verbatim from the source pair in code below. See §6/§8 of
// scripture-match-primary-design.md.

import { callClaude, parseJsonLoose, decideOverall, HARD_BLOCK_TERMS } from './pipeline.js'

const DEFAULT_MODEL = 'claude-sonnet-4-6'

// Archaic forms that mean the "plain language" line hasn't actually been
// translated out of KJV cadence. Deterministic guard — prompt rules are wishes.
const ARCHAIC_TOKENS = [
    'thee', 'thou', 'thy', 'thine', 'ye', 'hath', 'doth', 'unto', 'wist',
    'behold', 'verily', 'shalt', 'saith', 'whither', 'thence', 'wherefore',
    'ere', 'nigh', 'smote', 'begat', 'cometh', 'goeth', 'spake',
]

// Long words a child can't decode are flagged — except the ones a Primary
// child already hears every week. Gospel vocabulary is the POINT of the lesson:
// flagging "righteousness" as too hard would push the model to water down
// doctrine, which is the opposite of the goal (meaning beats simplicity).
const LONG_WORD_ALLOWLIST = new Set([
    // Names
    'jerusalem', 'israelites', 'bethlehem', 'nebuchadnezzar', 'jehovah',
    'immanuel', 'emmanuel', 'counsellor', 'counselor',
    // Weekly Primary vocabulary
    'everlasting', 'wilderness', 'commandments', 'commandment', 'testimony',
    'heavenly', 'righteousness', 'righteous', 'understanding', 'forgiveness',
    'repentance', 'salvation', 'sacrifice', 'scriptures', 'prophecies',
    'prophecy', 'baptism', 'resurrection', 'atonement', 'temptation',
])

// A Primary prompt must be an instruction to DO something, never an invitation
// to disclose. Enforced structurally so "tell us about a time you…" can't appear.
const ACTION_VERBS = new Set([
    'point', 'show', 'say', 'find', 'touch', 'count', 'stand', 'clap', 'look',
    'name', 'whisper', 'wave', 'sing', 'repeat', 'raise', 'hold', 'pretend',
    'act', 'draw', 'listen', 'think', 'smile', 'hug', 'march', 'reach',
    'shine', 'jump', 'nod', 'open', 'close', 'tap', 'copy', 'follow', 'trace',
    'breathe', 'spread', 'lift', 'bow', 'shake', 'stretch', 'put', 'make',
])

// Word guidance. Read by BOTH the validator and the prompt, so the limits the
// model is told are by construction the limits it is judged against.
//
// Lewis's rule (2026-09-20): meaning beats brevity. Going over these is a SOFT
// note, not a compliance finding — a faithful line that needs a few more words
// takes them. Only `phrase` is a hard limit, because it must physically fit on
// a card face. Integrity problems (archaic language, a misquoted fragment, a
// drifted reference) are what turn a card amber; prose length never does.
const CAPS = {
    phrase: 6,            // HARD — card-face geometry
    sentence: 22,
    verseSimple: 22,
    versePhrase: 20,      // verbatim scripture: truncating it damages the quote
    christConnection: 14,
    prompt: 18,
}

const POLICY_REFS = ['Handbook §13', 'Handbook §37.8', "Teaching in the Savior's Way"]

// ── Public entrypoint ────────────────────────────────────────────────────────

export async function runSimplifyPairs({ pairs, topic, lessonId, apiKey, enableSafetyReview = true, model = DEFAULT_MODEL }) {
    if (!apiKey) return { status: 500, body: { error: 'ANTHROPIC_API_KEY not configured' } }
    if (!Array.isArray(pairs) || pairs.length < 4) {
        return { status: 400, body: { error: 'pairs array required (the lesson\'s existing Youth pairs)' } }
    }
    if (pairs.length > 24) {
        return { status: 400, body: { error: `Too many pairs (${pairs.length}); expected 12` } }
    }

    const sources = pairs.map(normaliseSource)
    const boardCount = 3
    const perBoard = Math.floor(sources.length / boardCount)
    if (perBoard < 2) {
        return { status: 400, body: { error: `Need at least ${boardCount * 2} pairs to build ${boardCount} boards` } }
    }

    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
    }

    const prompt = buildSimplifyPrompt(sources, topic, boardCount, perBoard)
    const call = await callClaude(headers, {
        model,
        max_tokens: 6000,
        messages: [{ role: 'user', content: prompt }],
    }, 180000)

    if (call.error) return { status: 502, body: { error: `Simplify call failed: ${call.error}` } }

    const parsed = parseJsonLoose(call.text)
    if (!parsed || !Array.isArray(parsed.pairs)) {
        return { status: 502, body: { error: 'Model did not return parseable {boards, pairs} JSON' } }
    }

    // Re-anchor every kid pair to its source pair. Anything the model tried to
    // change about the scripture itself is discarded here, not merely flagged.
    const { pairsOut, fatal } = reanchor(parsed.pairs, sources, boardCount, perBoard)
    if (fatal) return { status: 502, body: { error: fatal } }

    const boardsOut = buildBoards(parsed.boards, boardCount)
    const structural = runStructuralChecks(pairsOut, boardsOut, sources)

    let safety = { reviewed: 0, passCount: 0, rewrittenCount: 0, blockedCount: 0, skipped: true }
    if (enableSafetyReview) {
        safety = await runKidSafetyReview(headers, pairsOut, model)
    }

    const complianceReport = {
        version: 'simplify-v1',
        policyRefs: POLICY_REFS,
        structural,
        safety,
        passCount: structural.passCount,
        reviewCount: structural.reviewCount,
        rewrittenCount: safety.rewrittenCount || 0,
        blockedCount: safety.blockedCount || 0,
        overall: decideOverall(structural, safety),
    }

    return {
        status: 200,
        body: {
            topic: topic || 'Primary lesson',
            lessonId: lessonId || null,
            derivedFrom: 'memory',
            boards: boardsOut,
            pairs: pairsOut,
            generatedAt: new Date().toISOString(),
            pipeline: 'simplify-v1',
            complianceReport,
        },
    }
}

// ── Source normalisation ─────────────────────────────────────────────────────

// Youth pairs carry the reference inside cardA ("Isaiah 12 — God Is My
// Salvation"); memory.html itself derives it with the same split. Doing it in
// code keeps the reference out of the model's reach entirely.
function normaliseSource(p, i) {
    const cardA = String(p.cardA || '')
    const verseRef = cardA.split(' — ')[0].split(' - ')[0].trim()
    return {
        id: String(p.id || `p${i + 1}`),
        cardA,
        cardB: String(p.cardB || ''),
        scene: String(p.scene || ''),
        verse: String(p.verse || ''),
        question: String(p.question || ''),
        christConnection: String(p.christConnection || ''),
        icon: String(p.icon || '📖'),
        iconLabel: String(p.iconLabel || ''),
        url: String(p.url || ''),
        verseRef,
    }
}

// ── Re-anchoring ─────────────────────────────────────────────────────────────

function reanchor(modelPairs, sources, boardCount, perBoard) {
    const byId = new Map(sources.map(s => [s.id, s]))
    const seen = new Set()
    const out = []

    for (const mp of modelPairs) {
        const src = byId.get(String(mp.id))
        if (!src) continue                 // invented id — drop it
        if (seen.has(src.id)) continue     // duplicate — keep the first
        seen.add(src.id)

        out.push({
            id: src.id,
            board: clampBoard(mp.board, boardCount),
            // Copied verbatim — never model-authored:
            icon: src.icon,
            iconLabel: src.iconLabel,
            verseRef: src.verseRef,
            verse: src.verse,
            url: src.url,
            // Model-authored kid language:
            word: cleanWord(mp.word, src.iconLabel),
            phrase: String(mp.phrase || '').trim(),
            sentence: String(mp.sentence || '').trim(),
            verseSimple: String(mp.verseSimple || '').trim(),
            versePhrase: mp.versePhrase ? String(mp.versePhrase).trim() : null,
            christConnection: String(mp.christConnection || '').trim(),
            prompt: String(mp.prompt || '').trim(),
            complianceCheck: 'PASS',
        })
    }

    const missing = sources.filter(s => !seen.has(s.id))
    if (missing.length) {
        // Every source pair must survive — a dropped pair is a bug, not a
        // degradation: the board would render with a hole in it.
        return { pairsOut: [], fatal: `Model omitted ${missing.length} of ${sources.length} pairs (${missing.map(m => m.id).join(', ')})` }
    }

    return { pairsOut: rebalanceBoards(out, boardCount, perBoard), fatal: null }
}

function clampBoard(n, boardCount) {
    const b = parseInt(n, 10)
    return Number.isFinite(b) && b >= 1 && b <= boardCount ? b : 1
}

// The model groups pairs into story beats; this guarantees the arithmetic
// regardless of how it counted. Order within a board is preserved.
function rebalanceBoards(pairsOut, boardCount, perBoard) {
    const ordered = [...pairsOut].sort((a, b) => a.board - b.board)
    return ordered.map((p, i) => ({ ...p, board: Math.min(boardCount, Math.floor(i / perBoard) + 1) }))
}

function cleanWord(w, fallbackLabel) {
    const raw = String(w || '').trim().toUpperCase().replace(/[^A-Z]/g, '')
    if (raw) return raw
    return String(fallbackLabel || 'WORD').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) || 'WORD'
}

function buildBoards(modelBoards, boardCount) {
    const out = []
    for (let n = 1; n <= boardCount; n++) {
        const b = Array.isArray(modelBoards) ? modelBoards.find(x => parseInt(x?.n, 10) === n) : null
        out.push({
            n,
            title: String(b?.title || `Part ${n}`).trim(),
            takeaway: String(b?.takeaway || '').trim(),
        })
    }
    return out
}

// ── Deterministic checks (design doc §8c) ────────────────────────────────────

export function normaliseForMatch(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

// The headline guarantee: a quoted fragment must actually appear in the verse
// it claims to quote. Without this, "simplify the scripture" silently becomes
// "rewrite the scripture and leave it in quotation marks".
export function isVerbatimFragment(fragment, verse) {
    const f = normaliseForMatch(fragment)
    const v = normaliseForMatch(verse)
    if (!f || !v) return false
    return v.includes(f)
}

function wordCount(s) {
    return String(s || '').trim().split(/\s+/).filter(Boolean).length
}

function findArchaic(s) {
    const toks = normaliseForMatch(s).split(' ')
    return ARCHAIC_TOKENS.filter(a => toks.includes(a))
}

function findLongWords(s) {
    return normaliseForMatch(s).split(' ')
        .filter(w => w.length > 10 && !LONG_WORD_ALLOWLIST.has(w))
}

export function runStructuralChecks(pairsOut, boardsOut, sources) {
    const report = {
        checked: pairsOut.length,
        passCount: 0,
        reviewCount: 0,
        findings: [],
        hardBlockHits: [],
        versePhraseDropped: 0,
        iconCollisions: [],
        lengthNotes: [],
    }

    // Icon uniqueness — in Primary mode the emoji is the match key, so a
    // duplicate makes a board unwinnable. Icons are inherited from Youth
    // content, which never had this constraint.
    const iconSeen = new Map()
    pairsOut.forEach(p => {
        if (iconSeen.has(p.icon)) report.iconCollisions.push({ icon: p.icon, ids: [iconSeen.get(p.icon), p.id] })
        else iconSeen.set(p.icon, p.id)
    })

    const srcById = new Map((sources || []).map(s => [s.id, s]))

    pairsOut.forEach((p, idx) => {
        const findings = []     // integrity — these make a card amber
        const notes = []        // length — informational only (meaning beats brevity)
        const src = srcById.get(p.id)

        // 1. versePhrase must be a verbatim fragment of the SOURCE verse.
        if (p.versePhrase) {
            if (!src || !isVerbatimFragment(p.versePhrase, src.verse)) {
                findings.push('versePhrase is not a verbatim fragment of the source verse — dropped')
                p.versePhrase = null
                report.versePhraseDropped++
            } else if (wordCount(p.versePhrase) > CAPS.versePhrase) {
                notes.push(`versePhrase runs long (${wordCount(p.versePhrase)} words)`)
            }
        }

        // 2. Anchors must match the source exactly.
        if (src) {
            if (p.verseRef !== src.verseRef) findings.push('verseRef drifted from source')
            if (p.url !== src.url) findings.push('url drifted from source')
            if (p.icon !== src.icon) findings.push('icon drifted from source')
        }

        // 3. Plain line must actually be plain.
        const archaic = findArchaic(p.verseSimple)
        if (archaic.length) findings.push(`verseSimple still archaic (${archaic.join(', ')})`)

        // 4. Caps.
        if (!p.word || p.word.length > 8) findings.push(`word must be 1–8 letters (got "${p.word}")`)
        // phrase is the one hard length rule — it has to fit on a card face.
        if (wordCount(p.phrase) > CAPS.phrase) findings.push(`phrase too long for a card face (${wordCount(p.phrase)} words)`)
        // The rest are soft: a longer line that keeps the scripture's meaning is
        // the right trade, so these are recorded but never fail a card.
        if (wordCount(p.sentence) > CAPS.sentence) notes.push(`sentence runs long (${wordCount(p.sentence)} words)`)
        if (wordCount(p.verseSimple) > CAPS.verseSimple) notes.push(`verseSimple runs long (${wordCount(p.verseSimple)} words)`)
        if (wordCount(p.christConnection) > CAPS.christConnection) notes.push(`christConnection runs long (${wordCount(p.christConnection)} words)`)
        if (wordCount(p.prompt) > CAPS.prompt) notes.push(`prompt runs long (${wordCount(p.prompt)} words)`)
        if (!p.sentence) findings.push('Missing sentence')
        if (!p.verseSimple) findings.push('Missing verseSimple')
        if (!p.christConnection) findings.push('Missing Christ connection')

        // 5. Prompt must be an action, not an invitation to disclose (§37.8).
        const firstWord = normaliseForMatch(p.prompt).split(' ')[0]
        if (p.prompt && !ACTION_VERBS.has(firstWord)) {
            findings.push(`prompt should start with an action verb (got "${firstWord}")`)
        }

        // 6. Reading level.
        const longWords = [...findLongWords(p.sentence), ...findLongWords(p.verseSimple), ...findLongWords(p.prompt)]
        if (longWords.length) findings.push(`words too long for early readers (${[...new Set(longWords)].join(', ')})`)

        // 7. Hard blocks across everything kid-facing.
        const blob = [p.word, p.phrase, p.sentence, p.verseSimple, p.christConnection, p.prompt].join(' ')
        for (const rx of HARD_BLOCK_TERMS) {
            if (rx.test(blob)) {
                report.hardBlockHits.push({ id: p.id, term: String(rx) })
                findings.push('Hard-blocked term present')
                break
            }
        }

        if (notes.length) report.lengthNotes.push({ id: p.id, notes })

        if (findings.length) {
            report.reviewCount++
            p.complianceCheck = `REVIEW: ${findings.join('; ')}`
            report.findings.push({ idx, id: p.id, findings })
        } else {
            report.passCount++
            p.complianceCheck = 'PASS'
        }
    })

    // Board integrity.
    boardsOut.forEach(b => {
        const n = pairsOut.filter(p => p.board === b.n).length
        if (n < 2) report.findings.push({ board: b.n, findings: [`Board ${b.n} has only ${n} pairs`] })
        if (!b.takeaway) report.findings.push({ board: b.n, findings: [`Board ${b.n} missing takeaway`] })
    })

    if (report.iconCollisions.length) {
        report.findings.push({ findings: [`Duplicate icons make a board unwinnable: ${report.iconCollisions.map(c => c.icon).join(' ')}`] })
    }

    return report
}

// ── Safety review ────────────────────────────────────────────────────────────

// The source pairs already passed the pipeline's safety review, but the kid
// rewrite is new text, and Playbook §4 wants every shipping string reviewed.
async function runKidSafetyReview(headers, pairsOut, model) {
    const items = pairsOut.map(p => ({
        id: p.id,
        sentence: p.sentence,
        verseSimple: p.verseSimple,
        christConnection: p.christConnection,
        prompt: p.prompt,
    }))

    const call = await callClaude(headers, {
        model,
        max_tokens: 4000,
        messages: [{
            role: 'user',
            content: `You are reviewing Scripture Match "Primary mode" content written for LDS children ages 4–11.

Policy: Handbook §13, §37.8, Teaching in the Savior's Way. Rules:
- Nothing frightening, graphic, or shaming. Scriptural hardship may be named gently, never depicted.
- No prompt may invite a child to disclose personal or family struggles (§37.8). Prompts must ask children to DO something (point, show, say, count).
- Language must be understandable to a 6-year-old.
- Doctrine must be accurate and Christ-centred.

For each item return a verdict:
  "pass"    — fine as written
  "rewrite" — provide corrected field values in "fields"
  "block"   — unsalvageable

Items:
${JSON.stringify(items, null, 1)}

Return ONLY JSON:
{ "verdicts": [ { "id": "p1", "verdict": "pass|rewrite|block", "reason": "...", "fields": { "sentence": "...", "prompt": "..." } } ] }`,
        }],
    }, 180000)

    const report = { reviewed: items.length, passCount: 0, rewrittenCount: 0, blockedCount: 0, notes: [], skipped: false }
    if (call.error) {
        report.skipped = true
        report.notes.push(`Safety review unavailable: ${call.error}`)
        return report
    }

    const parsed = parseJsonLoose(call.text)
    const verdicts = parsed?.verdicts
    if (!Array.isArray(verdicts)) {
        report.skipped = true
        report.notes.push('Safety review returned unparseable output')
        return report
    }

    const byId = new Map(pairsOut.map(p => [p.id, p]))
    for (const v of verdicts) {
        const p = byId.get(String(v.id))
        if (!p) continue
        if (v.verdict === 'block') {
            report.blockedCount++
            p.complianceCheck = `REVIEW: blocked by safety review — ${v.reason || 'no reason given'}`
            report.notes.push({ id: p.id, verdict: 'block', reason: v.reason || '' })
        } else if (v.verdict === 'rewrite' && v.fields) {
            let changed = false
            for (const k of ['sentence', 'verseSimple', 'christConnection', 'prompt']) {
                if (typeof v.fields[k] === 'string' && v.fields[k].trim() && v.fields[k].trim() !== p[k]) {
                    p[k] = v.fields[k].trim()
                    changed = true
                }
            }
            if (changed) {
                report.rewrittenCount++
                report.notes.push({ id: p.id, verdict: 'rewrite', reason: v.reason || '' })
            } else {
                report.passCount++
            }
        } else {
            report.passCount++
        }
    }

    return report
}

// ── Prompt ───────────────────────────────────────────────────────────────────

function buildSimplifyPrompt(sources, topic, boardCount, perBoard) {
    const list = sources.map(s => `- id: ${s.id}
  picture: ${s.icon} (${s.iconLabel})
  reference: ${s.verseRef}
  verse (verbatim KJV): "${s.verse}"
  youth key phrase: ${s.cardB}
  youth Christ connection: ${s.christConnection}`).join('\n')

    return `You are the Kindred Gamemaster adapting an existing Scripture Match game for **LDS children ages 4–11** (a Primary class).

Lesson topic: ${topic || 'this week\'s lesson'}

You are NOT writing new lesson content. You are rewriting ${sources.length} existing cards into language a young child understands. Each card keeps its picture, its scripture reference and its verse — you only change the words.

## Source cards
${list}

## LENGTH — meaning first, brevity second
| field | aim for | rule |
|---|---|---|
| phrase | ≤${CAPS.phrase} words | **hard limit** — it must fit on a card face |
| sentence | ~${CAPS.sentence} words | guidance |
| verseSimple | ~${CAPS.verseSimple} words | guidance |
| versePhrase | ~${CAPS.versePhrase} words | guidance |
| christConnection | ~${CAPS.christConnection} words | guidance |
| prompt | ~${CAPS.prompt} words | guidance |

Write as short as you can **without losing what the scripture actually says.** If a verse's meaning genuinely needs a few more words, take them — a faithful, complete thought in 20 simple words beats a clipped 12-word version that loses the point. Never drop a key idea, a name, or a promise just to hit a number. What you must never do is pad: every extra word must be carrying meaning.

Only "phrase" is a hard limit; it sits on the card face and cannot wrap.

## What you must produce for every card
- "id": copy the source id exactly. Every id must appear exactly once.
- "board": ${boardCount} boards of ${perBoard} cards each, numbered 1–${boardCount}. Group cards into story beats that belong together, and order them so each board makes sense on its own — a class that stops after board 2 must still have had a complete lesson.
- "word": ONE word, 1–8 letters, UPPERCASE, A–Z only. The concrete thing in the picture (ARK, LAMB, LIGHT). Never an abstract doctrine word.
- "phrase": a simple clue a 9-year-old can read ("a big boat God planned").
- "sentence": what happens on this card, in grade-1/2 vocabulary. This is what the teacher reads aloud.
- "verseSimple": what the VERSE means, in plain modern words a 6-year-old understands. Present tense. Concrete nouns. **Never use thee, thou, thy, ye, hath, unto, behold, verily, shalt, saith.** If it still sounds like scripture, it has not done its job. Keep what the verse actually promises or commands — if that takes a few more plain words, use them. Simplify the LANGUAGE, never the doctrine.
- "versePhrase": a SHORT fragment copied **word-for-word** from the verse above. Pick the most concrete, quotable part — the shortest fragment that still means something on its own. You MUST copy the exact characters from the verse: do not modernise, shorten words, or fix grammar inside it. If no fragment of that verse works for a young child, use null.
- "christConnection": kid language, connecting the card to Jesus Christ.
- "prompt": one thing the class DOES together. It MUST begin with an action verb: Point, Show, Say, Find, Touch, Count, Stand, Clap, Look, Name, Whisper, Wave, Sing, Repeat, Raise, Hold, Pretend, Act, Draw, Listen, Think, Smile, March, Reach, Shine. NEVER ask a child to talk about their own life, family, feelings or struggles.

Also produce ${boardCount} board headers:
- "title": ≤5 words naming that beat ("Noah Builds the Ark").
- "takeaway": ≤12 words, the one thing the class learned on that board.

## Rules that are not negotiable
- Do NOT change, modernise or "fix" the verse text. The only verbatim scripture you output is "versePhrase", copied character-for-character from the verse given above.
- The plain-language line ("verseSimple") is a paraphrase and will be shown WITHOUT quotation marks. Never write it as if it were scripture.
- Everything must be picturable. If a verse is abstract, describe the concrete image inside it.
- Nothing frightening or graphic. Scriptural hardship is named gently or skipped entirely.
- Jesus Christ is the point of every card.

Return ONLY valid JSON:
{
  "boards": [ { "n": 1, "title": "...", "takeaway": "..." } ],
  "pairs": [
    { "id": "p1", "board": 1, "word": "ARK", "phrase": "a big boat God planned",
      "sentence": "God told Noah to build a big boat.",
      "verseSimple": "God tells Noah to build a boat.",
      "versePhrase": "Make thee an ark of gopher wood",
      "christConnection": "Jesus keeps us safe too.",
      "prompt": "Point to the ark! Who told Noah to build it?" }
  ]
}`
}

export const __testables = {
    normaliseSource, reanchor, buildBoards, runStructuralChecks,
    isVerbatimFragment, normaliseForMatch, cleanWord, rebalanceBoards,
    buildSimplifyPrompt, ARCHAIC_TOKENS, ACTION_VERBS,
}
