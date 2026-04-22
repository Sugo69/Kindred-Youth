// Lesson Pipeline API — v3 Vercel handler.
// Thin HTTP wrapper around the shared pipeline in ./_lib/pipeline.js so that
// dev (Vite middleware) and prod (this handler) execute identical logic.
//
// Supports:
//   gameType: 'common-ground' | 'memory'
//   questionType: 'mixed' | 'scripture_based' | 'scripture_application' | 'family_feud'

import { runLessonPipeline } from './_lib/pipeline.js'

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') { res.status(200).end(); return }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

    let raw = ''
    await new Promise(resolve => { req.on('data', c => raw += c); req.on('end', resolve) })

    let payload
    try { payload = JSON.parse(raw) } catch { res.status(400).json({ error: 'Invalid JSON body' }); return }

    try {
        const { status, body } = await runLessonPipeline({
            url: payload.url,
            gameType: payload.gameType || 'common-ground',
            questionType: payload.questionType || 'mixed',
            apiKey: process.env.ANTHROPIC_API_KEY,
            enableSafetyReview: process.env.ENABLE_SAFETY_REVIEW !== 'false',
        })
        res.status(status).json(body)
    } catch (err) {
        console.error('lesson-pipeline fatal:', err)
        res.status(500).json({ error: err.message || 'Pipeline failure' })
    }
}
