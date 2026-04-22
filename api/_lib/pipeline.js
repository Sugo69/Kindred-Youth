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
    /\bporn/i, /\bnudity\b/i, /\bsexual\b/i, /\bsexually\b/i,
    /\brape\b/i, /\babus(?:e|ed|er|ive)\b/i,
    /\bsuicid/i, /\bself[-\s]?harm\b/i,
    /\bmurder\b/i, /\bcannabis\b/i, /\bmarijuana\b/i, /\bheroin\b/i, /\bcocaine\b/i,
    /\bvap(?:e|ing)\b/i,
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
        max_tokens: 8000,
        messages: [{ role: 'user', content: buildGenerationPrompt(lessonStructure, url, gameType, questionType) }],
    }
    stage(`→ Claude generation call (${activeModels.generation})…`)
    let generateResp = await callClaude(claudeHeaders, generationBody)
    if (generateResp.error) {
        console.error(`${tag} Generation API error:`, { url, gameType, error: generateResp.error })
        return { status: 500, body: { error: `Generation step: ${generateResp.error}`, step: 'generation', debugExcerpt: generateResp.error } }
    }
    stage(`← generation returned (${generateResp.text?.length || 0} chars)`)
    let parsed = parseJsonLoose(generateResp.text)

    // Retry once on parse failure — intermittent Claude truncations happen and
    // the same prompt often succeeds on a second call.
    if (!parsed?.rounds?.length && !parsed?.pairs?.length) {
        const firstExcerpt = (generateResp.text || '').slice(0, 800)
        console.warn(`${tag} Generation missing rounds/pairs — retrying once. First-attempt excerpt:\n${firstExcerpt}`)
        stage('↻ generation retry (parse failed, first attempt truncated or malformed)…')
        generateResp = await callClaude(claudeHeaders, generationBody)
        if (generateResp.error) {
            console.error(`${tag} Generation retry API error:`, { url, gameType, error: generateResp.error })
            return { status: 500, body: { error: `Generation step (retry): ${generateResp.error}`, step: 'generation', debugExcerpt: generateResp.error } }
        }
        stage(`← generation retry returned (${generateResp.text?.length || 0} chars)`)
        parsed = parseJsonLoose(generateResp.text)
    }

    if (!parsed?.rounds?.length && !parsed?.pairs?.length) {
        const excerpt = (generateResp.text || '').slice(0, 800)
        console.error(`${tag} Generation missing rounds/pairs after retry for ${url}\n--- Raw Claude response (first 800 chars) ---\n${excerpt}\n--- end ---`)
        return { status: 502, body: { error: 'Generation step missing rounds/pairs (after retry)', step: 'generation', debugExcerpt: excerpt } }
    }
    stage(`generation parsed: ${(parsed.rounds || parsed.pairs || []).length} items`)

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
            applySafetyRewrites(parsed, safetyReport)
            stage(`← safety review: rewrote=${r.rewrittenCount} blocked=${r.blockedCount}`)
        }
    }

    // Step 5: verse text backfill for memory pairs
    if (parsed.pairs?.length) backfillPairs(parsed, lessonStructure)
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
function runStructuralCompliance(parsed, lessonStructure, gameType) {
    const items = parsed.rounds || parsed.pairs || []
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
        if (gameType === 'memory') {
            if (!item.verse?.trim()) findings.push('Missing verse text')
            if (!item.scene?.trim()) findings.push('Missing scene')
            if (!item.question?.trim()) findings.push('Missing discussion question')
        } else {
            if (!item.question?.trim()) findings.push('Missing question')
            if (!Array.isArray(item.answers) || item.answers.length < 4) findings.push('Fewer than 4 answers')
            if (item.type && item.type !== 'family_feud' && !item.verseText?.trim()) findings.push('Scripture question missing verseText')
        }

        // Christ-connection requirement (Teaching in the Savior's Way)
        if (!item.christConnection?.trim()) findings.push('Missing Christ connection')

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
async function runSafetyReview(headers, parsed, gameType, model = DEFAULT_MODELS.safety) {
    const items = parsed.rounds || parsed.pairs || []
    if (items.length === 0) return { enabled: true, items: [], blockedCount: 0, rewrittenCount: 0 }

    const contentForReview = items.map((it, i) => ({
        idx: i,
        question: it.question || null,
        answers: it.answers || null,
        verseText: it.verseText || it.verse || null,
        cardA: it.cardA || null,
        cardB: it.cardB || null,
        christConnection: it.christConnection || null,
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

function applySafetyRewrites(parsed, safetyReport) {
    const items = parsed.rounds || parsed.pairs
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

async function callClaude(headers, bodyObj) {
    // 180s per-call timeout so a silently hung Claude connection surfaces as an
    // error instead of keeping the whole pipeline waiting forever. Sonnet 4.6
    // generation on 25+ scripture-ref lessons can legitimately take 90–120s.
    const callWith = (obj) => fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers, body: JSON.stringify(obj),
        signal: AbortSignal.timeout(180000),
    })

    try {
        let resp = await callWith(bodyObj)
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
        return `You are the Kindred Gamemaster designing a Scripture Scout memory matching game for LDS youth (ages 13–16).

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
- family_feud: survey style ("We surveyed 100 LDS youth…"). 6 answers (38/22/14/10/9/7). Real youth behaviors, not just idealized church answers.

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
