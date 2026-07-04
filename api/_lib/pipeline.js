// Shared lesson-pipeline core.
// Used by both the Vercel serverless handler (api/lesson-pipeline.js) and the
// Vite dev middleware (vite.config.js). Keep HTTP concerns out of this file —
// runLessonPipeline takes plain inputs and returns { status, body }.

// ── Allowlists ───────────────────────────────────────────────────────────────
const ALLOWED_SOURCE_HOSTS = new Set([
    'www.churchofjesuschrist.org',
    'churchofjesuschrist.org',
])
const ALLOWED_SOURCE_PATH_PREFIXES = [
    '/study/manual/',
    '/study/general-conference/',
    '/study/scriptures/',
    '/study/ensign/',
    '/study/liahona/',
    '/study/new-era/',
]
const ALLOWED_OUTPUT_HOSTS = new Set([
    'www.churchofjesuschrist.org',
    'churchofjesuschrist.org',
    'media.churchofjesuschrist.org',
    'abn.churchofjesuschrist.org',
    'speeches.byu.edu',
])
const HARD_BLOCK_TERMS = [
    // Sexual / explicit content
    /\bporn/i, /\bnudity\b/i, /\bsexual\b/i, /\bsexually\b/i,
    /\brape\b/i, /\babus(?:e|ed|er|ive)\b/i,
    // Modern profanity — no KJV/biblical usage; safe to hard-block
    // (biblical words like ass/hell/naked/harlot/whore/bastard are intentionally NOT listed)
    /\bshit\b/i, /\bf+u+c+k+(?:ing|ed|er|ers)?\b/i, /\bcunt\b/i,
    /\basshole\b/i, /\bbullshit\b/i, /\bmotherfuck/i, /\bbitch(?:es)?\b/i,
    /\bcock\b(?!atrice|roach)/i,  // block cock (slang) but not cockatrice/cockroach
    /\bpussy\b(?!\s*willow)/i,     // block pussy (slang) but not pussy willow
    // Mental health / self-harm
    /\bsuicid/i, /\bself[-\s]?harm\b/i,
    // Violence beyond scripture narrative
    /\bmurder(?:er|ers|ous)\b/i,  // allow 'murder' as commandment topic; block murderer/murderous
    // Substances
    /\bcannabis\b/i, /\bmarijuana\b/i, /\bheroin\b/i, /\bcocaine\b/i,
    /\bvap(?:e|ing)\b/i, /\bcrack\s+cocaine\b/i, /\bmeth(?:amphetamine)?\b/i,
]

// ── Public entrypoint ────────────────────────────────────────────────────────
const DEFAULT_MODELS = {
    extraction: 'claude-sonnet-4-6',
    generation: 'claude-sonnet-4-6',
    safety:     'claude-sonnet-4-6',
}

export async function runLessonPipeline({ url, gameType = 'common-ground', questionType = 'mixed', apiKey, enableSafetyReview = true, models = {} }) {
    if (!url) return { status: 400, body: { error: 'Missing URL' } }
    if (!apiKey) return { status: 500, body: { error: 'ANTHROPIC_API_KEY not configured' } }

    const activeModels = { ...DEFAULT_MODELS, ...models }

    const runId = Math.random().toString(36).slice(2, 8)
    const t0 = Date.now()
    const tag = `[pipeline ${runId} ${gameType}]`
    const stage = (msg) => console.log(`${tag} ${((Date.now() - t0) / 1000).toFixed(1)}s · ${msg}`)
    stage(`START url=${url}`)

    const sourceCheck = validateSourceUrl(url)
    if (!sourceCheck.ok) return { status: 400, body: { error: sourceCheck.reason } }

    stage('fetching lesson page…')
    const pageResp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (KindredYouth/1.0 lesson-pipeline)' },
        signal: AbortSignal.timeout(15000),
    })
    if (!pageResp.ok) return { status: 502, body: { error: `Lesson page returned ${pageResp.status}` } }
    const html = await pageResp.text()
    stage(`lesson page fetched (${html.length} bytes)`)

    const { talkLinks, scriptureLinks, videoLinks } = prescrape(html)
    const lessonText = stripHtml(html).slice(0, 9000)
    if (lessonText.length < 100) {
        return { status: 422, body: { error: 'Could not extract readable text from this URL. Try a direct lesson page.' } }
    }
    stage(`prescraped: ${talkLinks.length} talks, ${scriptureLinks.length} scriptures, ${videoLinks.length} videos`)

    const claudeHeaders = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
    }

    // Step 1: extraction — Sonnet 4.6
    // Tried Haiku 4.5 (3–5× faster) but it hallucinated cross-manual content on complex
    // lessons — pulled Helaman 5:12 and Exodus 14 into a Leviticus/Tabernacle lesson.
    // Sonnet stays grounded in the provided HTML. max_tokens: 8000 so lessons with many
    // cross-refs don't truncate JSON mid-verse.
    stage(`→ Claude extraction call (${activeModels.extraction}, max_tokens=8000)…`)
    const extractResp = await callClaude(claudeHeaders, {
        model: activeModels.extraction,
        max_tokens: 8000,
        messages: [{ role: 'user', content: buildExtractionPrompt(lessonText, url, { talkLinks, scriptureLinks, videoLinks }) }],
    })
    if (extractResp.error) {
        console.error(`${tag} Extraction API error:`, { url, gameType, error: extractResp.error })
        return { status: 500, body: { error: `Extraction step: ${extractResp.error}`, step: 'extraction', debugExcerpt: extractResp.error } }
    }
    stage(`← extraction returned (${extractResp.text?.length || 0} chars)`)
    const lessonStructure = parseJsonLoose(extractResp.text)
    if (!lessonStructure) {
        const excerpt = (extractResp.text || '').slice(0, 800)
        console.error(`${tag} Extraction returned malformed JSON for ${url}\n--- Raw Claude response (first 800 chars) ---\n${excerpt}\n--- end ---`)
        return { status: 502, body: { error: 'Extraction step returned malformed JSON', step: 'extraction', debugExcerpt: excerpt } }
    }
    stage(`extraction parsed: ${(lessonStructure.scriptureRefs || []).length} scriptureRefs, ${(lessonStructure.keyThemes || []).length} themes`)

    // Step 2: generation
    // max_tokens: 8000 — matches extraction. Claude occasionally truncates mid-JSON
    // at lower limits even when the full response would fit; 8000 gives headroom for
    // Memory's 12 pairs and Common Ground's 8 rounds with all their Christ connections.
    const generationBody = {
        model: activeModels.generation,
        // well-of-words emits 3 puzzles × 10-12 words each with verse texts — needs more headroom
        max_tokens: gameType === 'well-of-words' ? 12000 : 8000,
        messages: [{ role: 'user', content: buildGenerationPrompt(lessonStructure, url, gameType, questionType) }],
    }
    const generationTimeoutMs = gameType === 'well-of-words' ? 240000 : 180000
    stage(`→ Claude generation call (${activeModels.generation})…`)
    let generateResp = await callClaude(claudeHeaders, generationBody, generationTimeoutMs)
    if (generateResp.error) {
        console.error(`${tag} Generation API error:`, { url, gameType, error: generateResp.error })
        return { status: 500, body: { error: `Generation step: ${generateResp.error}`, step: 'generation', debugExcerpt: generateResp.error } }
    }
    stage(`← generation returned (${generateResp.text?.length || 0} chars)`)
    let parsed = parseJsonLoose(generateResp.text)

    // Retry once on parse failure — intermittent Claude truncations happen and
    // the same prompt often succeeds on a second call.
    if (!parsed?.rounds?.length && !parsed?.pairs?.length && !parsed?.stops?.length && !parsed?.puzzles?.length) {
        const firstExcerpt = (generateResp.text || '').slice(0, 800)
        console.warn(`${tag} Generation missing rounds/pairs/stops/puzzles — retrying once. First-attempt excerpt:\n${firstExcerpt}`)
        stage('↻ generation retry (parse failed, first attempt truncated or malformed)…')
        generateResp = await callClaude(claudeHeaders, generationBody, generationTimeoutMs)
        if (generateResp.error) {
            console.error(`${tag} Generation retry API error:`, { url, gameType, error: generateResp.error })
            return { status: 500, body: { error: `Generation step (retry): ${generateResp.error}`, step: 'generation', debugExcerpt: generateResp.error } }
        }
        stage(`← generation retry returned (${generateResp.text?.length || 0} chars)`)
        parsed = parseJsonLoose(generateResp.text)
    }

    if (!parsed?.rounds?.length && !parsed?.pairs?.length && !parsed?.stops?.length && !parsed?.puzzles?.length) {
        const excerpt = (generateResp.text || '').slice(0, 800)
        console.error(`${tag} Generation missing rounds/pairs/stops/puzzles after retry for ${url}\n--- Raw Claude response (first 800 chars) ---\n${excerpt}\n--- end ---`)
        return { status: 502, body: { error: 'Generation step missing rounds/pairs/stops/puzzles (after retry)', step: 'generation', debugExcerpt: excerpt } }
    }
    stage(`generation parsed: ${(parsed.rounds || parsed.pairs || parsed.stops || parsed.puzzles || []).length} items`)

    // Step 3: structural compliance (server-side, cannot be prompted away)
    const structural = runStructuralCompliance(parsed, lessonStructure, gameType)
    stage(`structural compliance: pass=${structural.passCount} review=${structural.reviewCount}`)

    // Step 4: optional AI safety review
    let safetyReport = { enabled: false, items: [], blockedCount: 0, rewrittenCount: 0 }
    if (enableSafetyReview) {
        stage('→ Claude safety-review call…')
        const r = await runSafetyReview(claudeHeaders, parsed, gameType, activeModels.safety)
        if (r.error) {
            console.warn(`${tag} safety review soft-failed: ${r.error}`)
            safetyReport = { enabled: true, items: [], blockedCount: 0, rewrittenCount: 0, warning: r.error }
        } else {
            safetyReport = r
            applySafetyRewrites(parsed, safetyReport, gameType)
            stage(`← safety review: rewrote=${r.rewrittenCount} blocked=${r.blockedCount}`)
        }
    }

    // Step 5: verse text backfill for memory pairs and trail stops
    if (parsed.pairs?.length) backfillPairs(parsed, lessonStructure)
    if (parsed.stops?.length) backfillStops(parsed, lessonStructure)
    if (parsed.puzzles?.length) backfillPuzzles(parsed, lessonStructure)
    stage(`DONE in ${((Date.now() - t0) / 1000).toFixed(1)}s`)

    // Step 6: assemble response
    parsed.sourceUrl = url
    parsed.generatedAt = new Date().toISOString()
    parsed.pipeline = 'lesson-pipeline-v3'
    if (lessonStructure.videoLinks?.length) parsed.videoLinks = lessonStructure.videoLinks
    if (lessonStructure.talkLinks?.length) parsed.talkLinks = lessonStructure.talkLinks

    parsed.complianceReport = {
        version: 'v3',
        policyRefs: ['Handbook §13', 'Handbook §37.8', "Teaching in the Savior's Way"],
        structural,
        safety: safetyReport,
        passCount: structural.passCount,
        reviewCount: structural.reviewCount + safetyReport.items.filter(i => i.action === 'review').length,
        rewrittenCount: safetyReport.rewrittenCount,
        blockedCount: safetyReport.blockedCount,
        overall: decideOverall(structural, safetyReport),
    }

    return { status: 200, body: parsed }
}

// ── Validation ───────────────────────────────────────────────────────────────
function validateSourceUrl(raw) {
    let u
    try { u = new URL(raw) } catch { return { ok: false, reason: 'Invalid URL' } }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return { ok: false, reason: 'HTTP/HTTPS only' }
    if (!ALLOWED_SOURCE_HOSTS.has(u.hostname)) {
        return { ok: false, reason: `Source must be on churchofjesuschrist.org (got ${u.hostname})` }
    }
    const allowedPrefix = ALLOWED_SOURCE_PATH_PREFIXES.some(p => u.pathname.startsWith(p))
    if (!allowedPrefix) {
        return { ok: false, reason: `Source path must be a /study/ page (got ${u.pathname})` }
    }
    return { ok: true }
}

function isOutputUrlAllowed(raw) {
    if (!raw) return false
    try {
        const u = new URL(raw)
        return (u.protocol === 'https:' || u.protocol === 'http:') && ALLOWED_OUTPUT_HOSTS.has(u.hostname)
    } catch { return false }
}

// ── Pre-scrape & strip ───────────────────────────────────────────────────────
function prescrape(html) {
    const talkSet = new Set()
    for (const m of html.matchAll(/href="((?:https?:\/\/www\.churchofjesuschrist\.org)?\/study\/(?:general-conference|manual|ensign|liahona|new-era)[^"#?]*?)(?:[#?][^"]*)?"[^>]*>([^<]{5,80})</g)) {
        const href = m[1].startsWith('http') ? m[1] : `https://www.churchofjesuschrist.org${m[1]}`
        talkSet.add(JSON.stringify({ url: href, label: m[2].trim().replace(/\s+/g, ' ') }))
    }
    const talkLinks = [...talkSet].slice(0, 12).map(s => JSON.parse(s))

    const scriptureSet = new Set()
    for (const m of html.matchAll(/href="((?:https?:\/\/www\.churchofjesuschrist\.org)?\/study\/scriptures\/[^"#?]*?)(?:[#?][^"]*)?"[^>]*>([^<]{3,60})</g)) {
        const href = m[1].startsWith('http') ? m[1] : `https://www.churchofjesuschrist.org${m[1]}`
        const label = m[2].trim().replace(/\s+/g, ' ')
        if (label.length > 3) scriptureSet.add(JSON.stringify({ url: href, label }))
    }
    const scriptureLinks = [...scriptureSet].slice(0, 20).map(s => JSON.parse(s))

    const videoSet = new Set()
    for (const m of html.matchAll(/(?:src|data-src)="(https?:\/\/(?:www\.youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/|www\.churchofjesuschrist\.org\/media\/video\/)[^"]+)"/g)) {
        videoSet.add(m[1])
    }
    for (const m of html.matchAll(/href="(https?:\/\/(?:www\.youtube\.com\/watch\?v=|youtu\.be\/)[^"]+)"/g)) {
        videoSet.add(m[1])
    }
    const videoLinks = [...videoSet].slice(0, 6)

    return { talkLinks, scriptureLinks, videoLinks }
}

function stripHtml(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<aside[\s\S]*?<\/aside>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/\s{2,}/g, ' ').trim()
}

// ── Structural compliance ────────────────────────────────────────────────────

// Letter-multiset containment: can `word` be spelled from the puzzle's letters,
// using each letter at most as many times as it appears? Deterministic — Claude
// occasionally miscounts letters, so this check cannot live in the prompt.
function spellableFrom(word, letters) {
    const pool = {}
    for (const ch of letters) pool[ch] = (pool[ch] || 0) + 1
    for (const ch of String(word).toUpperCase()) {
        if (!pool[ch]) return false
        pool[ch]--
    }
    return true
}

function runStructuralCompliance(parsed, lessonStructure, gameType) {
    const items = parsed.rounds || parsed.pairs || parsed.stops || parsed.puzzles || []

    // well-of-words pre-pass: scrub the bonus whitelist BEFORE the generic
    // hard-block scan below, so an already-removed word can't escalate the
    // whole lesson to REVIEW_REQUIRED. Unspellable/invalid bonus words are
    // dropped silently (mechanical fix); profane ones are dropped AND flagged.
    // Scrub records live in a side map, NOT on the item — the hard-block scan
    // stringifies the item and must never see the removed words.
    const scrubbedBonusByIdx = new Map()
    if (gameType === 'well-of-words') {
        items.forEach((p, i) => {
            p.letters = (p.letters || []).map(l => String(l).toUpperCase())
            const kept = [], removedProfane = []
            for (const b0 of (p.bonusWords || [])) {
                const b = String(b0).toUpperCase()
                if (!/^[A-Z]{2,}$/.test(b) || !spellableFrom(b, p.letters)) continue
                if (HARD_BLOCK_TERMS.some(rx => rx.test(b))) { removedProfane.push(b); continue }
                kept.push(b)
            }
            p.bonusWords = kept
            if (removedProfane.length) scrubbedBonusByIdx.set(i, removedProfane)
        })
    }

    const report = {
        itemCount: items.length,
        passCount: 0,
        reviewCount: 0,
        findings: [],
        urlAllowlistViolations: [],
        hardBlockHits: [],
    }

    items.forEach((item, idx) => {
        const findings = []

        // URL allowlist enforcement: strip non-Church URLs, flag the item.
        if (item.url && !isOutputUrlAllowed(item.url)) {
            report.urlAllowlistViolations.push({ idx, field: 'url', value: item.url })
            findings.push(`Non-allowlisted URL stripped: ${item.url}`)
            item.url = null
        }

        // Hard-block keyword scan across all string fields.
        const text = JSON.stringify(item).toLowerCase()
        for (const rx of HARD_BLOCK_TERMS) {
            if (rx.test(text)) {
                report.hardBlockHits.push({ idx, term: rx.source })
                findings.push(`Hard-block term matched: ${rx.source}`)
            }
        }

        // Required fields per type
        if (gameType === 'well-of-words') {
            // item is a puzzle: { letters[], capstone, words[{word,...}], bonusWords[] }
            const letters = item.letters
            if (scrubbedBonusByIdx.has(idx)) {
                findings.push(`Bonus word removed: ${scrubbedBonusByIdx.get(idx).join(', ')}`)
            }
            if (letters.length < 6 || letters.length > 7 || !letters.every(l => /^[A-Z]$/.test(l))) {
                findings.push('letters must be 6–7 single A–Z characters')
            }
            if (!Array.isArray(item.words) || item.words.length < 10) findings.push(`Fewer than 10 target words (${(item.words || []).length})`)
            let capstoneCount = 0
            for (const w of (item.words || [])) {
                w.word = String(w.word || '').toUpperCase()
                const label = w.word || '(empty)'
                if (!/^[A-Z]{2,}$/.test(w.word)) findings.push(`Invalid word: ${label}`)
                else if (!spellableFrom(w.word, letters)) {
                    w._unspellable = true
                    findings.push(`Word not spellable from letters: ${label}`)
                }
                if (w.isCapstone) {
                    capstoneCount++
                    if (!w.christConnection?.trim()) findings.push(`Capstone ${label} missing Christ connection`)
                }
                if (!w.definition?.trim()) findings.push(`${label} missing definition`)
                if (!w.verseBlank?.trim()) findings.push(`${label} missing verseBlank`)
                if (!w.verseRef?.trim()) findings.push(`${label} missing verseRef`)
                if (w.url && !isOutputUrlAllowed(w.url)) {
                    report.urlAllowlistViolations.push({ idx, field: `words.${label}.url`, value: w.url })
                    findings.push(`Non-allowlisted URL stripped on ${label}`)
                    w.url = null
                }
            }
            if (capstoneCount !== 1) findings.push(`Expected exactly 1 capstone word, got ${capstoneCount}`)
        } else if (gameType === 'memory') {
            if (!item.verse?.trim()) findings.push('Missing verse text')
            if (!item.scene?.trim()) findings.push('Missing scene')
            if (!item.question?.trim()) findings.push('Missing discussion question')
        } else if (gameType === 'scripture-trail') {
            if (!item.verse?.trim()) findings.push('Missing verse text')
            if (!item.objective?.trim() && !item.question?.trim()) findings.push('Missing objective/question')
            if (!Array.isArray(item.choices) || item.choices.length !== 3) findings.push('choices must be array of exactly 3')
            else if (item.choices.filter(c => c.correct).length !== 1) findings.push('Must have exactly 1 correct choice')
            if (!item.christ?.trim() && !item.christConnection?.trim()) findings.push('Missing Christ connection')
        } else {
            if (!item.question?.trim()) findings.push('Missing question')
            if (!Array.isArray(item.answers) || item.answers.length < 4) findings.push('Fewer than 4 answers')
            if (item.type && item.type !== 'family_feud' && !item.verseText?.trim()) findings.push('Scripture question missing verseText')
        }

        // Christ-connection requirement for non-trail types (trail and
        // well-of-words check it above, at their own levels)
        if (gameType !== 'scripture-trail' && gameType !== 'well-of-words' && !item.christConnection?.trim()) findings.push('Missing Christ connection')

        if (findings.length > 0) {
            report.reviewCount++
            item.complianceCheck = `REVIEW: ${findings.join('; ')}`
            report.findings.push({ idx, findings })
        } else {
            report.passCount++
            item.complianceCheck = 'PASS'
        }
    })

    return report
}

// ── AI safety review ─────────────────────────────────────────────────────────

// well-of-words nests words inside puzzles; the safety review works on a flat
// per-item list, so we review the flattened words (plus each puzzle's bonus
// list) and map verdicts back through this same flattening in applySafetyRewrites.
function flattenWowWords(parsed) {
    const flat = []
    ;(parsed.puzzles || []).forEach((p, pi) => {
        (p.words || []).forEach((w, wi) => flat.push({ pi, wi, w, puzzle: p }))
    })
    return flat
}

async function runSafetyReview(headers, parsed, gameType, model = DEFAULT_MODELS.safety) {
    const isWow = gameType === 'well-of-words'
    const wowFlat = isWow ? flattenWowWords(parsed) : null
    const items = isWow ? wowFlat.map(f => f.w)
        : (parsed.rounds || parsed.pairs || parsed.stops || [])
    if (items.length === 0) return { enabled: true, items: [], blockedCount: 0, rewrittenCount: 0 }

    const contentForReview = items.map((it, i) => ({
        idx: i,
        question: it.question || it.objective || null,
        answers: it.answers || it.choices || null,
        verseText: it.verseText || it.verse || null,
        cardA: it.cardA || null,
        cardB: it.cardB || null,
        summary: it.summary || null,
        discussion: it.discussion || null,
        christConnection: it.christConnection || it.christ || null,
        word: it.word || null,
        definition: it.definition || null,
        verseBlank: it.verseBlank || null,
        // surface each puzzle's bonus whitelist once (on its first word) so the
        // reviewer sees every word a classroom screen could ever display
        bonusWords: isWow && wowFlat[i].wi === 0 ? wowFlat[i].puzzle.bonusWords : null,
    }))

    const prompt = `You are a child-safety reviewer for an LDS youth Sunday School game (ages 13–16). You apply General Handbook §13 and §37.8 plus For the Strength of Youth standards.

Review each item below. For EACH item decide one of three actions:
- "pass"   — content is age-appropriate, doctrinally sound, and cannot expose a youth's personal life
- "rewrite" — content is mostly fine but one or more fields must be softened; supply the rewritten field values
- "block"  — content violates policy and cannot be rewritten safely

A rewrite or block is REQUIRED for any of these:
- Explicit or implied sexual content, nudity, dating-culture pressure
- Violence beyond scriptural narrative level (torture, gore, graphic killing)
- Substances (alcohol, tobacco, vaping, drugs) used as an answer option
- Questions that could publicly expose a youth's family situation, mental health, doubt, or sin
- Any claim about an individual's worthiness or testimony level
- Content that singles out or shames any group (gender, race, family structure)
- Content that is not clearly connectable to Jesus Christ or the lesson
- Any URL that is not on churchofjesuschrist.org or media.churchofjesuschrist.org

For "rewrite" items, return only the fields that must change with their replacement values.

Return ONLY valid JSON in this exact shape:
{
  "items": [
    {
      "idx": 0,
      "action": "pass" | "rewrite" | "block",
      "reason": "short reason",
      "rewrites": { "question": "...", "answers": [{"text":"...","points":40}], "verseText": "...", "christConnection": "..." }
    }
  ]
}

gameType: ${gameType}

items:
${JSON.stringify(contentForReview, null, 2)}`

    const resp = await callClaude(headers, {
        model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
    })
    if (resp.error) return { enabled: true, error: resp.error, items: [], blockedCount: 0, rewrittenCount: 0 }

    const parsedReview = parseJsonLoose(resp.text)
    if (!parsedReview?.items) return { enabled: true, error: 'Safety review returned malformed JSON', items: [], blockedCount: 0, rewrittenCount: 0 }

    const blockedCount = parsedReview.items.filter(i => i.action === 'block').length
    const rewrittenCount = parsedReview.items.filter(i => i.action === 'rewrite').length
    return { enabled: true, items: parsedReview.items, blockedCount, rewrittenCount }
}

function applySafetyRewrites(parsed, safetyReport, gameType) {
    if (gameType === 'well-of-words') {
        // Flat indices map to nested puzzle words — apply rewrites in place,
        // then remove blocked words per puzzle (descending so indices hold).
        const flat = flattenWowWords(parsed)
        for (const review of safetyReport.items) {
            if (review.action !== 'rewrite' || !review.rewrites) continue
            const f = flat[review.idx]
            if (!f) continue
            for (const [k, v] of Object.entries(review.rewrites)) {
                if (v !== undefined && v !== null && k !== 'bonusWords') f.w[k] = v
            }
            if (Array.isArray(review.rewrites.bonusWords)) f.puzzle.bonusWords = review.rewrites.bonusWords
            f.w.complianceCheck = `REWRITTEN: ${review.reason || 'safety review'}`
        }
        const blocked = safetyReport.items.filter(i => i.action === 'block')
            .map(i => flat[i.idx]).filter(Boolean)
            .sort((a, b) => b.wi - a.wi)
        for (const f of blocked) parsed.puzzles[f.pi].words.splice(f.wi, 1)
        // A puzzle that lost its capstone or dropped below 3 words is no longer playable
        parsed.puzzles = parsed.puzzles.filter(p =>
            (p.words || []).length >= 3 && p.words.some(w => w.isCapstone))
        return
    }

    const items = parsed.rounds || parsed.pairs || parsed.stops
    if (!items) return

    const blockedIdx = safetyReport.items.filter(i => i.action === 'block').map(i => i.idx).sort((a, b) => b - a)
    for (const idx of blockedIdx) {
        if (items[idx]) items.splice(idx, 1)
    }

    for (const review of safetyReport.items) {
        if (review.action !== 'rewrite' || !review.rewrites) continue
        const item = items[review.idx]
        if (!item) continue
        for (const [k, v] of Object.entries(review.rewrites)) {
            if (v !== undefined && v !== null) item[k] = v
        }
        item.complianceCheck = `REWRITTEN: ${review.reason || 'safety review'}`
    }
}

function backfillPairs(parsed, lessonStructure) {
    const verseLookup = {}
    const urlLookup = {}
    for (const s of (lessonStructure.scriptureRefs || [])) {
        const key = s.ref?.toLowerCase().replace(/\s+/g, '')
        if (!key) continue
        if (s.verseText?.trim()) verseLookup[key] = s.verseText.trim()
        if (s.url?.trim()) urlLookup[key] = s.url.trim()
    }
    for (const p of parsed.pairs) {
        const refKey = (p.cardA || '').split('—')[0].trim().toLowerCase().replace(/\s+/g, '')
        if (!p.verse?.trim()) p.verse = verseLookup[refKey] || null
        if (!p.scene?.trim()) p.scene = (p.cardA || '').split('—')[0].trim() || null
        if (!p.url?.trim() && urlLookup[refKey]) p.url = urlLookup[refKey]
    }
    parsed.pairs = parsed.pairs.filter(p => p.verse?.trim())
}

function backfillStops(parsed, lessonStructure) {
    const verseLookup = {}
    const urlLookup = {}
    for (const s of (lessonStructure.scriptureRefs || [])) {
        const key = s.ref?.toLowerCase().replace(/\s+/g, '')
        if (!key) continue
        if (s.verseText?.trim()) verseLookup[key] = s.verseText.trim()
        if (s.url?.trim() && isOutputUrlAllowed(s.url)) urlLookup[key] = s.url.trim()
    }
    for (const stop of parsed.stops) {
        const key = (stop.ref || '').toLowerCase().replace(/\s+/g, '')
        if (!stop.verse?.trim() && verseLookup[key]) stop.verse = verseLookup[key]
        if (!stop.url && urlLookup[key]) stop.url = urlLookup[key]
        // Normalise field aliases
        if (!stop.christConnection && stop.christ) stop.christConnection = stop.christ
        if (!stop.question && stop.objective) stop.question = stop.objective
        // Ensure n is set
        if (!stop.n) stop.n = parsed.stops.indexOf(stop) + 1
    }
    // Drop stops that have neither verse nor ref
    parsed.stops = parsed.stops.filter(s => s.verse?.trim() || s.ref?.trim())
}

function backfillPuzzles(parsed, lessonStructure) {
    const verseLookup = {}
    const urlLookup = {}
    for (const s of (lessonStructure.scriptureRefs || [])) {
        const key = s.ref?.toLowerCase().replace(/\s+/g, '')
        if (!key) continue
        if (s.verseText?.trim()) verseLookup[key] = s.verseText.trim()
        if (s.url?.trim() && isOutputUrlAllowed(s.url)) urlLookup[key] = s.url.trim()
    }
    for (const p of parsed.puzzles) {
        // Drop words the structural check proved unspellable — the client
        // whitelist must never contain a word the wheel cannot produce.
        p.words = (p.words || []).filter(w => !w._unspellable)
        for (const w of p.words) {
            delete w._unspellable
            const key = (w.verseRef || '').toLowerCase().replace(/\s+/g, '').replace(/\(kjv\)/g, '')
            if (!w.verseText?.trim() && verseLookup[key]) w.verseText = verseLookup[key]
            if (!w.url && urlLookup[key]) w.url = urlLookup[key]
        }
        if (!p.capstone) p.capstone = p.words.find(w => w.isCapstone)?.word || null
    }
    // Unplayable puzzles (fewer than 3 spellable words, or no capstone left) are dropped
    parsed.puzzles = parsed.puzzles.filter(p =>
        (p.words || []).length >= 3 && p.words.some(w => w.isCapstone))
}

function decideOverall(structural, safety) {
    if (safety.blockedCount > 0 || structural.hardBlockHits.length > 0) return 'REVIEW_REQUIRED'
    if (structural.reviewCount > 0 || safety.rewrittenCount > 0) return 'PASS_WITH_REWRITES'
    return 'PASS'
}

function parseJsonLoose(text) {
    if (!text) return null
    try { return JSON.parse(text) } catch {}
    const m = text.match(/\{[\s\S]*\}/)
    if (m) { try { return JSON.parse(m[0]) } catch {} }
    return null
}

const SOFTENING_PREAMBLE = `SAFETY NOTE: You are generating content for 13–16 year olds in an LDS Sunday School setting. Keep every field extra gentle and reverent. Paraphrase any scriptural violence at the level of a children's Primary manual — no graphic wording, no clinical terms for harm. Avoid any phrasing that could trip a safety filter. If a scriptural event is inherently graphic, describe only its outcome and spiritual lesson, never its mechanics.

`

async function callClaude(headers, bodyObj, timeoutMs = 180000) {
    // Per-call timeout so a silently hung Claude connection surfaces as an
    // error instead of keeping the whole pipeline waiting forever. Sonnet 4.6
    // generation on 25+ scripture-ref lessons can legitimately take 90–120s;
    // well-of-words generation (30+ words with verse texts) passes 240s.
    const callWith = (obj) => fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers, body: JSON.stringify(obj),
        signal: AbortSignal.timeout(timeoutMs),
    })

    try {
        let resp
        try {
            resp = await callWith(bodyObj)
        } catch (e) {
            if (e.name !== 'TimeoutError' && e.name !== 'AbortError') throw e
            // One retry on a dead/hung connection — transient network stalls
            // to api.anthropic.com are the most common generation failure.
            await new Promise(r => setTimeout(r, 3000))
            resp = await callWith(bodyObj)
        }
        if (!resp.ok) {
            const txt = await resp.text()
            const isOverload = resp.status === 529 || resp.status === 500 || resp.status === 503 ||
                txt.includes('overloaded') || txt.includes('timeout')
            const isContentFilter = txt.includes('content filtering policy') ||
                txt.includes('content_filter') || txt.includes('content_policy')

            if (isOverload) {
                await new Promise(r => setTimeout(r, 5000))
                resp = await callWith(bodyObj)
                if (!resp.ok) return { error: (await resp.text()).slice(0, 200) }
            } else if (isContentFilter) {
                // Same inputs will trip the same filter — prepend a softening preamble
                // to the last user message and retry once with a lower temperature.
                const softened = {
                    ...bodyObj,
                    temperature: 0.3,
                    messages: bodyObj.messages.map((m, i, arr) => {
                        if (i !== arr.length - 1 || m.role !== 'user') return m
                        if (typeof m.content !== 'string') return m
                        return { ...m, content: SOFTENING_PREAMBLE + m.content }
                    }),
                }
                await new Promise(r => setTimeout(r, 2000))
                resp = await callWith(softened)
                if (!resp.ok) {
                    const txt2 = await resp.text()
                    return { error: `Content filter blocked output even after softening retry: ${txt2.slice(0, 200)}` }
                }
            } else {
                return { error: txt.slice(0, 200) }
            }
        }
        const data = await resp.json()
        return { text: data.content[0].text }
    } catch (e) {
        if (e.name === 'TimeoutError' || e.name === 'AbortError') {
            return { error: 'Claude API timeout after 180s (no response from api.anthropic.com)' }
        }
        return { error: `Network error: ${e.message}` }
    }
}

// ── Prompts ──────────────────────────────────────────────────────────────────
function buildExtractionPrompt(lessonText, sourceUrl, media = {}) {
    const { talkLinks = [], scriptureLinks = [], videoLinks = [] } = media
    let mediaBlock = ''
    if (videoLinks.length) mediaBlock += `\nVideos found:\n${videoLinks.map(v => `- ${v}`).join('\n')}\n`
    if (talkLinks.length) mediaBlock += `\nConference talks/articles linked:\n${talkLinks.map(t => `- ${t.label}: ${t.url}`).join('\n')}\n`
    if (scriptureLinks.length) mediaBlock += `\nScripture links found:\n${scriptureLinks.map(s => `- ${s.label}: ${s.url}`).join('\n')}\n`

    return `You are extracting structured lesson data from a Come Follow Me lesson page for LDS youth Sunday School.

Source URL: ${sourceUrl}

Lesson text (HTML stripped):
---
${lessonText}
---
${mediaBlock}
## Your task
Extract the following and return as JSON only (no markdown):

1. **title** — lesson title
2. **weekLabel** — date range (e.g. "May 11–17")
3. **scriptureRefs** — array of every scripture reference found. For each:
   - ref: human-readable reference (e.g. "Deuteronomy 6:5")
   - verseText: quote the actual verse text verbatim from your knowledge of the KJV scriptures and LDS standard works. For ranges, quote all verses. Max 400 chars. This is critical — always provide verse text.
   - url: construct the Gospel Library URL: https://www.churchofjesuschrist.org/study/scriptures/{volume}/{slug}/{chapter}?lang=eng#{anchor} (use p1, p2... for verse anchors). Use any matching URL from the scripture links above if available.
   - section: which lesson section this appeared in
4. **videoLinks** — all video URLs found (YouTube, Church media). Use the video list above plus any in the lesson text.
5. **talkLinks** — all conference talk / article links. Use the talk list above plus any in the lesson text. Each: { title, speaker (if known), url }
6. **discussionQuestions** — key discussion questions from the lesson text (max 8)
7. **keyThemes** — 3–5 core spiritual themes of this lesson

Return ONLY valid JSON:
{
  "title": "...",
  "weekLabel": "...",
  "scriptureRefs": [
    { "ref": "...", "verseText": "...", "url": "...", "section": "..." }
  ],
  "videoLinks": ["..."],
  "talkLinks": [{ "title": "...", "speaker": "...", "url": "..." }],
  "discussionQuestions": ["..."],
  "keyThemes": ["..."]
}`
}

function buildGenerationPrompt(lessonStructure, sourceUrl, gameType, questionType) {
    if (gameType === 'scripture-trail') return buildTrailGenerationPrompt(lessonStructure, sourceUrl)
    if (gameType === 'well-of-words') return buildWellOfWordsGenerationPrompt(lessonStructure, sourceUrl)
    const isMemory = gameType === 'memory'
    const scriptureList = (lessonStructure.scriptureRefs || [])
        .map(s => `- ${s.ref}: "${s.verseText?.trim() || '[supply verbatim from your KJV knowledge]'}" [${s.url || ''}]`).join('\n')
    const talkList = (lessonStructure.talkLinks || [])
        .map(t => `- ${t.title}${t.speaker ? ` (${t.speaker})` : ''}: ${t.url}`).join('\n')
    const videoList = (lessonStructure.videoLinks || []).map(v => `- ${v}`).join('\n')

    const POLICY_RUBRIC = `## Church policy rubric (MUST follow — your output will be audited)
- **Handbook §13**: content must be uplifting, faith-promoting, appropriate for mixed-gender classes. No public shaming, no singling out.
- **Handbook §37.8**: never request or imply the collection of personal info about youth.
- **Teaching in the Savior's Way**: every question must connect back to Jesus Christ. Students talk more than the teacher. No L4 testimony-required answers for L1–L3 questions.
- **Content safety**: NEVER include explicit violence, sexual content, substances (alcohol, drugs, tobacco, vaping), self-harm, or content that could expose a youth's family situation or mental-health struggles.
- **URL safety**: every URL in your output must be on churchofjesuschrist.org, media.churchofjesuschrist.org, or speeches.byu.edu. Do NOT use external sites.
- **Copyright**: scripture quotes only from the LDS standard works; no copyrighted game boards or trademarked names (Family Feud®, Sorry®).

For every item, include a "christConnection" field — one sentence tying the item to Jesus Christ.
`

    if (isMemory) {
        return `You are the Kindred Gamemaster designing a Scripture Match memory matching game for LDS youth (ages 13–16).

Lesson: ${lessonStructure.title} (${lessonStructure.weekLabel || ''})
Source: ${sourceUrl}

Key themes: ${(lessonStructure.keyThemes || []).join(', ')}

Scriptures with verse texts:
${scriptureList}

Conference talks:
${talkList || 'None found'}

Videos:
${videoList || 'None found'}

Discussion questions from lesson:
${(lessonStructure.discussionQuestions || []).map(q => `- ${q}`).join('\n')}

${POLICY_RUBRIC}

## Your task
Generate exactly 12 matching pairs. Use the verse texts above verbatim — do NOT paraphrase or invent scripture text.

Return ONLY valid JSON:
{
  "topic": "...",
  "pairs": [
    {
      "id": "p1",
      "cardA": "Scripture ref — Short title",
      "cardB": "Key phrase or modern application",
      "scene": "Where/when this happens",
      "verse": "Verbatim verse text from the scriptures above",
      "question": "Discussion question for class (L2 meaning or L3 application)",
      "christConnection": "One sentence connecting to Jesus Christ",
      "icon": "emoji",
      "iconLabel": "2-3 word label",
      "url": "https://www.churchofjesuschrist.org/..."
    }
  ]
}`
    }

    const typeInstructions = {
        mixed: 'Generate exactly 8 rounds: 2 scripture_based + 2 scripture_application + 4 family_feud.',
        scripture_based: 'Generate exactly 6 scripture_based rounds.',
        scripture_application: 'Generate exactly 6 scripture_application rounds.',
        family_feud: 'Generate exactly 6 family_feud rounds.',
    }

    return `You are the Kindred Gamemaster designing Common Ground (survey-style) game questions for LDS youth (ages 13–16).

Lesson: ${lessonStructure.title} (${lessonStructure.weekLabel || ''})
Source: ${sourceUrl}

Key themes: ${(lessonStructure.keyThemes || []).join(', ')}

Scriptures with verse texts:
${scriptureList}

Conference talks:
${talkList || 'None found'}

Discussion questions from lesson:
${(lessonStructure.discussionQuestions || []).map(q => `- ${q}`).join('\n')}

${POLICY_RUBRIC}

## Your task
${typeInstructions[questionType] || typeInstructions.mixed}

Rules per type:
- scripture_based: quote verseText verbatim, ask factual question. 4 answers (40/30/20/10).
- scripture_application: quote verseText verbatim, ask how it applies to youth today. 4 answers (40/30/20/10).
- family_feud: survey style ("Ask 100 youth in a classroom poll: …"). 6 answers (38/22/14/10/9/7). Real youth behaviors, not just idealized church answers.

Return ONLY valid JSON:
{
  "topic": "...",
  "rounds": [
    {
      "question": "...",
      "type": "scripture_based|scripture_application|family_feud",
      "verseText": "verbatim verse (null for family_feud)",
      "christConnection": "one sentence",
      "url": "https://... or null",
      "answers": [{ "text": "...", "points": 40 }]
    }
  ]
}`
}

// ── Well of Words generation prompt ──────────────────────────────────────────
function buildWellOfWordsGenerationPrompt(lessonStructure, sourceUrl) {
    const scriptureList = (lessonStructure.scriptureRefs || [])
        .map(s => `- ${s.ref}: "${s.verseText?.trim() || '[supply verbatim KJV]'}" [${s.url || ''}]`).join('\n')

    return `You are the Kindred Gamemaster designing a Well of Words puzzle set for LDS youth (ages 13–16).
Well of Words is a letter-wheel word game: 5–7 letters sit on stones around a well mouth, and the class
spells lesson vocabulary from those letters to fill a small crossword. Every solved word opens a
teaching card (definition → verse → Christ connection), so the words ARE the lesson.

Lesson: ${lessonStructure.title} (${lessonStructure.weekLabel || ''})
Source: ${sourceUrl}

Key themes: ${(lessonStructure.keyThemes || []).join(', ')}

Scripture references with verse texts:
${scriptureList || 'None — use your KJV knowledge for the lesson scriptures.'}

## Church policy rubric (MUST follow — your output will be audited)
- Handbook §13: uplifting, faith-promoting, appropriate for mixed-gender classes. No public shaming.
- Handbook §37.8: never request or imply collection of personal info about youth.
- Teaching in the Savior's Way: the capstone word of every puzzle must connect to Jesus Christ.
- URL safety: every URL must be on churchofjesuschrist.org. Never invent or guess URLs — reuse the
  exact URLs from the scripture references above, or use null.
- Content safety: no violence, sexual content, substances, self-harm, slang, or brand names —
  in TARGET WORDS and in BONUS WORDS alike. Every word may appear on a classroom TV.

## Your task
Generate exactly 3 puzzles, easiest first:
- Puzzle 1: 6-letter capstone (warm-up), Puzzles 2–3: 6–7-letter capstones; Puzzle 3's capstone
  is THE key vocabulary word of this lesson.
- Choose FERTILE capstones — words whose letters yield many real sub-words (e.g. MASTER, HEAVENS,
  PRAISED, SERVANT). A doctrinally perfect capstone with only 4 sub-words is the wrong choice.

### The letter rule (CRITICAL — checked by a machine, violations are discarded)
"letters" is exactly the letters of the capstone word, one array entry per letter, in order.
EVERY word in "words" and "bonusWords" must be spellable from those letters, using each letter
AT MOST as many times as it appears in the array. Before including any word, verify letter-by-letter.
Example: letters ["P","R","O","M","I","S","E"] → ROSE ✓, RIPE ✓, MOSES ✗ (needs two S), SEER ✗ (needs two E).

### Word rules
- 10–12 target "words" per puzzle including the capstone; lengths 3–7. Prefer words that appear in
  this lesson's scriptures, then broader KJV vocabulary (any word must appear in SOME KJV verse so it
  can carry a verseBlank). Exactly ONE word per puzzle has isCapstone: true.
- Each word: "definition" (kid-level, max 12 words), "verseBlank" (a real KJV phrase from the cited
  verse with the word replaced by ________ — the word MUST literally appear in the verse; if it
  doesn't, pick a different verse where it does, or a different word. Never emit a verseBlank
  without the ________ marker), "verseText" (verbatim scripture text or its key clause, max 180 chars —
  KJV for the Bible, exact LDS standard-works text for Book of Mormon / D&C / Pearl of Great Price),
  "verseRef", "url" (exact Gospel Library URL from the references above, or null),
  "icon" (one emoji depicting the word's MEANING — not decoration), "iconLabel" (2–3 words).
- EVERY word gets "christConnection" — one short sentence tying it to Jesus Christ (the capstone's
  should be the strongest). Every solved word shows its card to the class; every card returns to Christ.
- "bonusWords": 3–8 additional simple sub-words teens know (common nouns/verbs only; no proper nouns,
  no abbreviations, no slang). These earn small points but show no card.
- Each puzzle: "theme" (3–6 word title) and "discussion" (one open class question a teacher asks
  after the puzzle is solved).

Verify letter-by-letter SILENTLY — before the JSON output at most 10 short lines of working notes,
then the JSON. Keep all prose fields tight; long responses get cut off.

Return valid JSON (no markdown fences):
{
  "topic": "...",
  "puzzles": [
    {
      "n": 1,
      "theme": "Short Puzzle Title",
      "letters": ["P","R","O","M","I","S","E"],
      "capstone": "PROMISE",
      "words": [
        {
          "word": "PROMISE",
          "isCapstone": true,
          "definition": "something God says He will surely do",
          "verseBlank": "For the ________ is unto you, and to your children",
          "verseText": "For the promise is unto you, and to your children, and to all that are afar off.",
          "verseRef": "Acts 2:39",
          "url": "https://www.churchofjesuschrist.org/... or null",
          "icon": "🌈",
          "iconLabel": "promise kept",
          "christConnection": "Every promise of God is kept through Jesus Christ."
        }
      ],
      "bonusWords": ["PRIME", "ROPES"],
      "discussion": "Open question for the class after this puzzle."
    }
  ]
}`
}

// Internal hooks for offline unit tests (test scripts only — not used by handlers)
export const __testables = { spellableFrom, runStructuralCompliance, applySafetyRewrites, backfillPuzzles, buildWellOfWordsGenerationPrompt }

// ── Scripture Trail generation prompt ─────────────────────────────────────────
function buildTrailGenerationPrompt(lessonStructure, sourceUrl) {
    const scriptureList = (lessonStructure.scriptureRefs || [])
        .map(s => `- ${s.ref}: "${s.verseText?.trim() || '[supply verbatim KJV]'}" [${s.url || ''}]`).join('\n')
    const videoList = (lessonStructure.videoLinks || []).map((v, i) => `  Video ${i+1}: ${v}`).join('\n')
    const talkList = (lessonStructure.talkLinks || [])
        .map(t => `- ${t.title}${t.speaker ? ` (${t.speaker})` : ''}: ${t.url}`).join('\n')

    return `You are the Kindred Gamemaster designing a Scripture Trail game for LDS youth (ages 13–16).
Scripture Trail is a story-walkthrough board game: students advance along a trail by answering
multiple-choice questions at each stop. Each stop anchors to one key verse from the lesson.

Lesson: ${lessonStructure.title} (${lessonStructure.weekLabel || ''})
Source: ${sourceUrl}

Key themes: ${(lessonStructure.keyThemes || []).join(', ')}

Scripture references with verse texts:
${scriptureList || 'None — use your KJV knowledge for the lesson scriptures.'}

Available videos (Church media only — assign to arcs where thematically appropriate):
${videoList || '  None found'}

Conference talks:
${talkList || 'None found'}

## Church policy rubric (MUST follow — your output will be audited)
- Handbook §13: uplifting, faith-promoting, appropriate for mixed-gender classes. No public shaming.
- Handbook §37.8: never request or imply collection of personal info about youth.
- Teaching in the Savior's Way: every stop must connect to Jesus Christ. No graphic violence.
- URL safety: every URL must be on churchofjesuschrist.org. Do NOT invent or guess URLs.
- Content safety: no explicit violence, sexual content, substances, self-harm, or family-exposure.
- Distractors: plausible but clearly wrong on reflection — not trick questions or obscure trivia.
- Distractor safety: wrong-answer options must themselves be doctrinally safe and non-offensive.

## Your task
Generate exactly 7 stops grouped into 2–3 story arcs.

### Arc rules
- Identify 2–3 distinct story segments (by character, event cluster, or theme shift).
- The FIRST stop of each arc carries the arc object. All other stops in that arc omit the arc field (set to null).
- Each arc should have a Church video assigned from the Available videos list above, or null if none fits.
- Arc video URL must be on churchofjesuschrist.org — if unsure, use null.

### Stop rules
- Exactly 3 choices: 1 correct + 2 plausible distractors. Shuffle order (correct is not always first).
- "objective" is the question students must answer to advance.
- "discussion" is an open question the teacher asks the class after the answer is revealed.
- "christ" is one sentence connecting this stop to Jesus Christ as the central figure.
- "points" is 15, 20, or 25 (vary across stops; arc-opener stops earn 20 or 25).
- "verse" must be verbatim KJV text from the scripture references above — never paraphrase.
- "url" must be the exact Gospel Library URL from the scripture references above, or null.

Return ONLY valid JSON (no markdown, no explanation):
{
  "topic": "...",
  "stops": [
    {
      "n": 1,
      "title": "Short Title (3–5 words)",
      "ref": "Book Chapter:Verse",
      "verse": "Verbatim KJV verse text",
      "verseRef": "Book Chapter:Verse (KJV)",
      "url": "https://www.churchofjesuschrist.org/... or null",
      "arc": {
        "id": "unique-arc-id",
        "region": "PLACE NAME(S)",
        "title": "Arc Story Title",
        "subtitle": "One-line arc theme",
        "context": "2–3 sentence teacher setup read before this arc's first stop is opened.",
        "icon": "single emoji",
        "stopRange": "Stops 1–3",
        "video": { "title": "Video title", "duration": "1:30", "url": "https://www.churchofjesuschrist.org/..." }
      },
      "summary": "2–3 sentence narrative summary of what happened in this story moment.",
      "objective": "The question students answer to open this stop.",
      "choices": [
        { "text": "Answer text", "correct": true },
        { "text": "Plausible distractor", "correct": false },
        { "text": "Another plausible distractor", "correct": false }
      ],
      "answer": "1–2 sentences explaining the correct answer and its scriptural basis.",
      "discussion": "Open discussion question the teacher asks the class after revealing the answer.",
      "christ": "One sentence: how this moment points to Jesus Christ.",
      "points": 20
    }
  ]
}`
}
