import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
import { runLessonPipeline } from './api/_lib/pipeline.js'
import { applyCors } from './api/_lib/origin.js'
import { requireAuth } from './api/_lib/auth.js'

function extractPageTitle(html) {
    const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
    const tw = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i)
    const tt = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const raw = (og?.[1] || tw?.[1] || tt?.[1] || '').trim()
    return cleanTitle(decodeEntities(raw))
}
function decodeEntities(s) {
    const map = { amp:'&', quot:'"', apos:"'", lsquo:'\u2018', rsquo:'\u2019', ldquo:'\u201C', rdquo:'\u201D', mdash:'\u2014', ndash:'\u2013', hellip:'\u2026', nbsp:' ', lt:'<', gt:'>' }
    return s.replace(/&(#?\w+);/g, (_, e) => {
        if (map[e]) return map[e]
        if (e.startsWith('#x')) return String.fromCharCode(parseInt(e.slice(2), 16))
        if (e.startsWith('#')) return String.fromCharCode(parseInt(e.slice(1), 10))
        return ''
    })
}
function cleanTitle(s) {
    return s
        .replace(/\s*\|\s*The Church of Jesus Christ of Latter-day Saints\s*$/i, '')
        .replace(/\s*\|\s*ChurchofJesusChrist\.org\s*$/i, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '') // load ALL .env vars, not just VITE_

    const formatId = (seq) => `BL-${String(seq).padStart(3, '0')}`

    function buildPrompt(items, batchId) {
        return `You are a senior product manager and software architect. Generate a complete implementation document for the following batch of backlog items from the Kindred-Youth app (kindred-youth.org).

## App Context
- **Stack:** Vite MPA (port 5174) + Firebase Firestore (real-time sync)
- **Views:** TV Monitor (16:9 classroom display) | Admin (phone/iPad controller) | Backlog tracker
- **Deployment:** Vercel (static build + serverless functions in /api)
- **Users:** Sunday School teacher (admin) and youth students age 13–16 (players)
- **Theme:** Neon cyberpunk — Orbitron + Permanent Marker fonts, cyan/pink/purple palette
- **Repo:** github.com/Sugo69/Kindred-Youth

## Batch: ${batchId}

${items.map(i => `### ${formatId(i.seqId)} [${i.priority}]\n${i.description}`).join('\n\n')}

---

Generate the following sections as a clean Markdown document:

## 1. User Stories
For each item write:
- **User Story:** As a [role], I want [feature], so that [benefit]
- **Acceptance Criteria:** 4-5 testable bullet points

## 2. Technical Implementation Plan
For each item:
- **Approach:** 2-3 sentence technical strategy
- **Files to Create/Modify:** Specific file paths
- **Steps:** Numbered, copy-paste-ready implementation steps a Claude Code agent can execute

## 3. Test Cases
For each item, 3-5 scenarios with: Test name | Steps | Expected result

## 4. Validation Checklist
A numbered checklist the teacher/developer runs in the browser after deployment to confirm the batch is production-ready. Be specific — include URLs, UI interactions, and expected visual outcomes.

## 5. Claude Code Prompt
A ready-to-paste prompt the developer can drop into Claude Code to implement this entire batch. Include all context needed (file paths, current architecture, acceptance criteria) so Claude Code can execute without additional clarification.`
    }

    return {
        server: {
            port: 5174,
            strictPort: true,
        },
        preview: {
            port: 5174,
        },
        build: {
            rollupOptions: {
                input: {
                    main: resolve(__dirname, 'index.html'),
                    admin: resolve(__dirname, 'admin.html'),
                    commonGround: resolve(__dirname, 'games/common-ground.html'),
                    memory: resolve(__dirname, 'games/memory.html'),
                }
            }
        },
        plugins: [
            {
                name: 'api-dev-middleware',
                configureServer(server) {
                    server.middlewares.use('/api/fetch-content', (req, res) => {
                        if (!applyCors(req, res)) return
                        if (req.method !== 'POST') {
                            res.statusCode = 405
                            res.setHeader('Content-Type', 'application/json')
                            res.end(JSON.stringify({ error: 'Method not allowed' }))
                            return
                        }
                        let body = ''
                        req.on('data', chunk => body += chunk)
                        req.on('end', async () => {
                            res.setHeader('Content-Type', 'application/json')
                            try {
                                const { url } = JSON.parse(body)
                                if (!url) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing URL' })); return }
                                let parsedUrl
                                try { parsedUrl = new URL(url) } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'Invalid URL' })); return }
                                if (!['http:', 'https:'].includes(parsedUrl.protocol)) { res.statusCode = 400; res.end(JSON.stringify({ error: 'HTTP/HTTPS only' })); return }
                                const host = (parsedUrl.hostname || '').toLowerCase()
                                const hostAllowed = host === 'churchofjesuschrist.org' || host.endsWith('.churchofjesuschrist.org') || host === 'speeches.byu.edu'
                                if (!hostAllowed) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Host not allowed. Kindred only fetches churchofjesuschrist.org lesson pages and speeches.byu.edu talks.' })); return }
                                const response = await fetch(url, {
                                    headers: { 'User-Agent': 'KindredYouth/1.0 (+https://kindred-youth.org)' },
                                    signal: AbortSignal.timeout(10000),
                                })
                                if (!response.ok) { res.statusCode = 502; res.end(JSON.stringify({ error: `Remote ${response.status}` })); return }
                                const html = await response.text()
                                const title = extractPageTitle(html)
                                const text = html
                                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                                    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
                                    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
                                    .replace(/<header[\s\S]*?<\/header>/gi, '')
                                    .replace(/<[^>]+>/g, ' ')
                                    .replace(/&nbsp;/g, ' ')
                                    .replace(/&amp;/g, '&')
                                    .replace(/\s{2,}/g, ' ')
                                    .trim()
                                    .slice(0, 8000)
                                res.end(JSON.stringify({ text, title, sourceUrl: url }))
                            } catch (err) {
                                res.statusCode = 500
                                res.end(JSON.stringify({ error: err.message }))
                            }
                        })
                    })

                    server.middlewares.use('/api/generate-questions', async (req, res) => {
                        if (!applyCors(req, res)) return
                        if (req.method !== 'POST') {
                            res.statusCode = 405
                            res.setHeader('Content-Type', 'application/json')
                            res.end(JSON.stringify({ error: 'Method not allowed' }))
                            return
                        }
                        const claims = await requireAuth(req, res, env.VITE_FIREBASE_PROJECT_ID)
                        if (!claims) return
                        let body = ''
                        req.on('data', chunk => body += chunk)
                        req.on('end', async () => {
                            res.setHeader('Content-Type', 'application/json')
                            try {
                                const { text, sourceUrl, questionType = 'scripture_based' } = JSON.parse(body)
                                if (!text) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing text' })); return }
                                const apiKey = env.ANTHROPIC_API_KEY
                                if (!apiKey) { res.statusCode = 500; res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' })); return }
                                const prompts = {
                                    scripture_based: `You are writing scripture-based quiz rounds for an LDS youth Sunday School class (ages 14–16).\n\nSource: ${sourceUrl || 'unknown'}\n\nLesson content:\n---\n${text}\n---\n\nGenerate exactly 4 rounds. For each round:\n- Choose a specific verse or short passage from the lesson text\n- "question" = the scripture quote + a factual question about that passage. Format: "[Scripture text] (Reference). [Factual question]?"\n- Exactly 4 answers that are facts directly from that scripture. Points: 40, 30, 20, 10\n\nCRITICAL: ONLY valid JSON, no markdown.\n{"topic":"lesson topic","questionType":"scripture_based","rounds":[{"question":"[scripture quote (ref)]. [factual question]?","type":"scripture_based","answers":[{"text":"answer","points":40},{"text":"answer","points":30},{"text":"answer","points":20},{"text":"answer","points":10}]}]}`,
                                    scripture_application: `You are writing application-based scripture rounds for an LDS youth Sunday School class (ages 14–16).\n\nSource: ${sourceUrl || 'unknown'}\n\nLesson content:\n---\n${text}\n---\n\nGenerate exactly 4 rounds. For each round:\n- Choose a specific verse or principle from the lesson\n- "question" = short scripture quote + application question. Format: "[Quote] (Reference). Name a way LDS youth today [application]."\n- 4 practical application answers. Points: 40, 30, 20, 10\n\nCRITICAL: ONLY valid JSON, no markdown.\n{"topic":"lesson topic","questionType":"scripture_application","rounds":[{"question":"[scripture quote (ref)]. [application question]?","type":"scripture_application","answers":[{"text":"answer","points":40},{"text":"answer","points":30},{"text":"answer","points":20},{"text":"answer","points":10}]}]}`,
                                    family_feud: `You are a survey-style question writer for a youth Sunday School class (ages 14-16).\n\nSource: ${sourceUrl || 'unknown'}\n\nContent:\n---\n${text}\n---\n\nGenerate exactly 4 survey-style rounds with 6 answers each.\n\nCRITICAL: ONLY valid JSON, no markdown.\n{"topic":"lesson topic","questionType":"family_feud","rounds":[{"question":"Ask 100 youth in a classroom poll: name something...","type":"family_feud","answers":[{"text":"answer","points":38},{"text":"answer","points":22},{"text":"answer","points":14},{"text":"answer","points":10},{"text":"answer","points":9},{"text":"answer","points":7}]}]}`
                                }
                                const prompt = prompts[questionType] || prompts.scripture_based
                                const response = await fetch('https://api.anthropic.com/v1/messages', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
                                    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] })
                                })
                                if (!response.ok) { const t = await response.text(); res.statusCode = 500; res.end(JSON.stringify({ error: `Claude API: ${t}` })); return }
                                const data = await response.json()
                                const rawContent = data.content[0].text
                                let parsed
                                try { parsed = JSON.parse(rawContent) } catch {
                                    const match = rawContent.match(/\{[\s\S]*\}/)
                                    if (match) { try { parsed = JSON.parse(match[0]) } catch { res.statusCode = 502; res.end(JSON.stringify({ error: 'AI returned invalid JSON' })); return } }
                                    else { res.statusCode = 502; res.end(JSON.stringify({ error: 'AI returned non-JSON' })); return }
                                }
                                if (!parsed.rounds?.length) { res.statusCode = 502; res.end(JSON.stringify({ error: 'AI response missing rounds' })); return }
                                parsed.sourceUrl = sourceUrl
                                parsed.generatedAt = new Date().toISOString()
                                res.end(JSON.stringify(parsed))
                            } catch (err) {
                                res.statusCode = 500
                                res.end(JSON.stringify({ error: err.message }))
                            }
                        })
                    })

                    server.middlewares.use('/api/lesson-pipeline', async (req, res) => {
                        if (!applyCors(req, res)) return
                        if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({error:'Method not allowed'})); return }
                        const claims = await requireAuth(req, res, env.VITE_FIREBASE_PROJECT_ID)
                        if (!claims) return
                        let body = ''
                        req.on('data', chunk => body += chunk)
                        req.on('end', async () => {
                            res.setHeader('Content-Type', 'application/json')
                            let payload
                            try { payload = JSON.parse(body) } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'Invalid JSON body' })); return }
                            try {
                                const { status, body: out } = await runLessonPipeline({
                                    url: payload.url,
                                    gameType: payload.gameType || 'common-ground',
                                    questionType: payload.questionType || 'mixed',
                                    apiKey: env.ANTHROPIC_API_KEY,
                                    enableSafetyReview: env.ENABLE_SAFETY_REVIEW !== 'false',
                                })
                                res.statusCode = status
                                res.end(JSON.stringify(out))
                            } catch (err) {
                                console.error('[lesson-pipeline dev]', err)
                                res.statusCode = 500
                                res.end(JSON.stringify({ error: err.message || 'Pipeline failure' }))
                            }
                        })
                    })

                    server.middlewares.use('/api/wled', (req, res) => {
                        if (!applyCors(req, res)) return
                        if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ error: 'Method not allowed' })); return }
                        let body = ''
                        req.on('data', chunk => body += chunk)
                        req.on('end', async () => {
                            res.setHeader('Content-Type', 'application/json')
                            try {
                                const { ip, payload } = JSON.parse(body)
                                if (!ip) { res.statusCode = 400; res.end(JSON.stringify({ error: 'No IP provided' })); return }
                                await fetch(`http://${ip}/json/state`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload),
                                    signal: AbortSignal.timeout(3000),
                                })
                                res.end(JSON.stringify({ ok: true }))
                            } catch {
                                res.statusCode = 502
                                res.end(JSON.stringify({ error: 'WLED unreachable' }))
                            }
                        })
                    })

                    server.middlewares.use('/api/generate', async (req, res) => {
                        if (!applyCors(req, res)) return
                        if (req.method !== 'POST') {
                            res.statusCode = 405
                            res.setHeader('Content-Type', 'application/json')
                            res.end(JSON.stringify({ error: 'Method not allowed' }))
                            return
                        }
                        const claims = await requireAuth(req, res, env.VITE_FIREBASE_PROJECT_ID)
                        if (!claims) return
                        let body = ''
                        req.on('data', chunk => body += chunk)
                        req.on('end', async () => {
                            res.setHeader('Content-Type', 'application/json')
                            try {
                                const { items, batchId } = JSON.parse(body)
                                const apiKey = env.ANTHROPIC_API_KEY
                                if (!apiKey) {
                                    res.statusCode = 500
                                    res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in .env file' }))
                                    return
                                }
                                const response = await fetch('https://api.anthropic.com/v1/messages', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'x-api-key': apiKey,
                                        'anthropic-version': '2023-06-01'
                                    },
                                    body: JSON.stringify({
                                        model: 'claude-sonnet-4-6',
                                        max_tokens: 8000,
                                        messages: [{ role: 'user', content: buildPrompt(items, batchId) }]
                                    })
                                })
                                if (!response.ok) {
                                    const text = await response.text()
                                    res.statusCode = 500
                                    res.end(JSON.stringify({ error: `Claude API: ${text}` }))
                                    return
                                }
                                const data = await response.json()
                                res.end(JSON.stringify({ content: data.content[0].text }))
                            } catch (err) {
                                res.statusCode = 500
                                res.end(JSON.stringify({ error: err.message }))
                            }
                        })
                    })
                }
            }
        ]
    }
})
