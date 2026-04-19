import { defineConfig, loadEnv } from 'vite'

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
        plugins: [
            {
                name: 'api-dev-middleware',
                configureServer(server) {
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
