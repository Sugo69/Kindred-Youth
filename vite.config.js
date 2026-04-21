import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '') // load ALL .env vars, not just VITE_

    const formatId = (seq) => `BL-${String(seq).padStart(3, '0')}`

    function buildPrompt(items, batchId) {
        return `You are a senior product manager and software architect. Generate a complete implementation document for the following batch of backlog items from the "Family Feud Game" app.

## App Context
- **Stack:** Single-file HTML/JS + Vite (port 5174) + Firebase Firestore (real-time sync)
- **Views:** TV Monitor (16:9 classroom display) | Admin (phone/iPad controller) | Backlog tracker
- **Deployment:** Vercel (static build + serverless functions in /api)
- **Users:** Church teacher (admin) and LDS youth students age 14-16 (players)
- **Theme:** Neon cyberpunk — Orbitron + Permanent Marker fonts, cyan/pink/purple palette
- **Repo:** github.com/Sugo69/FamilyFeud

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
                                const response = await fetch(url, {
                                    headers: { 'User-Agent': 'Mozilla/5.0 (FamilyFeudApp/1.0)' },
                                    signal: AbortSignal.timeout(10000),
                                })
                                if (!response.ok) { res.statusCode = 502; res.end(JSON.stringify({ error: `Remote ${response.status}` })); return }
                                const html = await response.text()
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
                                res.end(JSON.stringify({ text, sourceUrl: url }))
                            } catch (err) {
                                res.statusCode = 500
                                res.end(JSON.stringify({ error: err.message }))
                            }
                        })
                    })

                    server.middlewares.use('/api/generate-questions', (req, res) => {
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
                                const { text, sourceUrl, questionType = 'scripture_based' } = JSON.parse(body)
                                if (!text) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing text' })); return }
                                const apiKey = env.ANTHROPIC_API_KEY
                                if (!apiKey) { res.statusCode = 500; res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' })); return }
                                const prompts = {
                                    scripture_based: `You are writing scripture-based quiz rounds for an LDS youth Sunday School class (ages 14–16).\n\nSource: ${sourceUrl || 'unknown'}\n\nLesson content:\n---\n${text}\n---\n\nGenerate exactly 4 rounds. For each round:\n- Choose a specific verse or short passage from the lesson text\n- "question" = the scripture quote + a factual question about that passage. Format: "[Scripture text] (Reference). [Factual question]?"\n- Exactly 4 answers that are facts directly from that scripture. Points: 40, 30, 20, 10\n\nCRITICAL: ONLY valid JSON, no markdown.\n{"topic":"lesson topic","questionType":"scripture_based","rounds":[{"question":"[scripture quote (ref)]. [factual question]?","type":"scripture_based","answers":[{"text":"answer","points":40},{"text":"answer","points":30},{"text":"answer","points":20},{"text":"answer","points":10}]}]}`,
                                    scripture_application: `You are writing application-based scripture rounds for an LDS youth Sunday School class (ages 14–16).\n\nSource: ${sourceUrl || 'unknown'}\n\nLesson content:\n---\n${text}\n---\n\nGenerate exactly 4 rounds. For each round:\n- Choose a specific verse or principle from the lesson\n- "question" = short scripture quote + application question. Format: "[Quote] (Reference). Name a way LDS youth today [application]."\n- 4 practical application answers. Points: 40, 30, 20, 10\n\nCRITICAL: ONLY valid JSON, no markdown.\n{"topic":"lesson topic","questionType":"scripture_application","rounds":[{"question":"[scripture quote (ref)]. [application question]?","type":"scripture_application","answers":[{"text":"answer","points":40},{"text":"answer","points":30},{"text":"answer","points":20},{"text":"answer","points":10}]}]}`,
                                    family_feud: `You are a Family Feud question writer for an LDS youth Sunday School class (ages 14-16).\n\nSource: ${sourceUrl || 'unknown'}\n\nContent:\n---\n${text}\n---\n\nGenerate exactly 4 rounds with 6 answers each in classic survey style.\n\nCRITICAL: ONLY valid JSON, no markdown.\n{"topic":"lesson topic","questionType":"family_feud","rounds":[{"question":"We surveyed 100 LDS youth... Name something...","type":"family_feud","answers":[{"text":"answer","points":38},{"text":"answer","points":22},{"text":"answer","points":14},{"text":"answer","points":10},{"text":"answer","points":9},{"text":"answer","points":7}]}]}`
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

                    server.middlewares.use('/api/lesson-pipeline', (req, res) => {
                        if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({error:'Method not allowed'})); return }
                        let body = ''
                        req.on('data', chunk => body += chunk)
                        req.on('end', async () => {
                            res.setHeader('Content-Type', 'application/json')
                            try {
                                const { url, gameType = 'common-ground', questionType = 'mixed' } = JSON.parse(body)
                                if (!url) { res.statusCode = 400; res.end(JSON.stringify({error:'Missing url'})); return }
                                const apiKey = env.ANTHROPIC_API_KEY
                                if (!apiKey) { res.statusCode = 500; res.end(JSON.stringify({error:'ANTHROPIC_API_KEY not set'})); return }

                                const pageResp = await fetch(url, { headers: {'User-Agent':'Mozilla/5.0 (KindredYouth/1.0)'}, signal: AbortSignal.timeout(15000) })
                                if (!pageResp.ok) { res.statusCode = 502; res.end(JSON.stringify({error:`Lesson page returned ${pageResp.status}`})); return }
                                const html = await pageResp.text()
                                const lessonText = html
                                    .replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'')
                                    .replace(/<nav[\s\S]*?<\/nav>/gi,'').replace(/<footer[\s\S]*?<\/footer>/gi,'')
                                    .replace(/<header[\s\S]*?<\/header>/gi,'').replace(/<aside[\s\S]*?<\/aside>/gi,'')
                                    .replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
                                    .replace(/\s{2,}/g,' ').trim().slice(0, 10000)
                                if (lessonText.length < 100) { res.statusCode = 422; res.end(JSON.stringify({error:'Could not extract readable text'})); return }

                                const isMemory = gameType === 'memory'
                                const typeMap = { mixed:'2 scripture_based + 2 scripture_application + 4 family_feud (8 total)', scripture_based:'6 scripture_based rounds', scripture_application:'6 scripture_application rounds', family_feud:'6 family_feud survey rounds' }
                                const prompt = isMemory
                                    ? `You are the Kindred Gamemaster. Generate exactly 12 matching pairs for a Scripture Scout memory game for LDS youth (13–16) based on this lesson from ${url}:\n---\n${lessonText}\n---\nEach pair: cardA = scripture ref + short title, cardB = key phrase or modern application. Include a discussion question and emoji icon per pair. Every pair connects to Jesus Christ. Return ONLY valid JSON: {"topic":"...","pairs":[{"id":"p1","cardA":"...","cardB":"...","question":"...","christConnection":"...","icon":"emoji","iconLabel":"label"}]}`
                                    : `You are the Kindred Gamemaster. Generate ${typeMap[questionType]||typeMap.mixed} for a Common Ground (survey) game for LDS youth (13–16) based on this lesson from ${url}:\n---\n${lessonText}\n---\nRules: every question connects to Jesus Christ; answerable by any youth regardless of testimony; scripture_based quotes a verse + factual question (4 answers 40/30/20/10); scripture_application quotes a verse + how it applies today (4 answers); family_feud = "We surveyed 100 LDS youth… Name something…" (6 answers 38/22/14/10/9/7, include realistic youth responses). Return ONLY valid JSON: {"topic":"...","rounds":[{"question":"...","type":"scripture_based|scripture_application|family_feud","christConnection":"...","answers":[{"text":"...","points":40}]}]}`

                                const claudeOpts = { method:'POST', headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'}, body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:6000, messages:[{role:'user',content:prompt}] }) }
                                let claude = await fetch('https://api.anthropic.com/v1/messages', claudeOpts)
                                if (!claude.ok) {
                                    const t=await claude.text()
                                    const retryable = claude.status===529||claude.status===500||claude.status===503||t.includes('timeout')||t.includes('overloaded')
                                    if (retryable) { await new Promise(r=>setTimeout(r,5000)); claude = await fetch('https://api.anthropic.com/v1/messages', claudeOpts) }
                                    if (!claude.ok) { const t2=await claude.text(); res.statusCode=500; res.end(JSON.stringify({error:`Claude API: ${t2.slice(0,200)}`})); return }
                                }
                                const cd = await claude.json()
                                const raw = cd.content[0].text
                                let parsed
                                try { parsed = JSON.parse(raw) } catch {
                                    const m = raw.match(/\{[\s\S]*\}/)
                                    if (m) { try { parsed=JSON.parse(m[0]) } catch { res.statusCode=502; res.end(JSON.stringify({error:'AI returned malformed JSON'})); return } }
                                    else { res.statusCode=502; res.end(JSON.stringify({error:'AI did not return JSON'})); return }
                                }
                                parsed.sourceUrl = url; parsed.generatedAt = new Date().toISOString(); parsed.pipeline = 'lesson-pipeline'
                                res.end(JSON.stringify(parsed))
                            } catch(err) { res.statusCode=500; res.end(JSON.stringify({error:err.message})) }
                        })
                    })

                    server.middlewares.use('/api/wled', (req, res) => {
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

                    server.middlewares.use('/api/generate', (req, res) => {
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
