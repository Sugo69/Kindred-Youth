// Scripture Match — Primary mode content API.
// Thin HTTP wrapper around ./_lib/simplify.js so dev (Vite middleware) and
// prod (this handler) execute identical logic — the lesson-pipeline pattern.
//
// Input:  { lessonId, topic, pairs[] }  — the lesson's ALREADY-generated Youth pairs
// Output: the memoryPrimary payload to store at lessonLibrary/{lessonId}.memoryPrimary

import { runSimplifyPairs } from './_lib/simplify.js'
import { applyCors } from './_lib/origin.js'
import { requireAuth } from './_lib/auth.js'

export default async function handler(req, res) {
    if (!applyCors(req, res)) return
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

    const claims = await requireAuth(req, res, process.env.VITE_FIREBASE_PROJECT_ID)
    if (!claims) return

    let raw = ''
    await new Promise(resolve => { req.on('data', c => raw += c); req.on('end', resolve) })

    let payload
    try { payload = JSON.parse(raw) } catch { res.status(400).json({ error: 'Invalid JSON body' }); return }

    try {
        const { status, body } = await runSimplifyPairs({
            pairs: payload.pairs,
            topic: payload.topic,
            lessonId: payload.lessonId,
            apiKey: process.env.ANTHROPIC_API_KEY,
            enableSafetyReview: process.env.ENABLE_SAFETY_REVIEW !== 'false',
        })
        res.status(status).json(body)
    } catch (err) {
        console.error('simplify-pairs fatal:', err)
        res.status(500).json({ error: err.message || 'Simplify failure' })
    }
}
