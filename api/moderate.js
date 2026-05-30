import { applyCors } from './_lib/origin.js';
import { runModeration } from './_lib/moderate.js';

export default async function handler(req, res) {
    if (!applyCors(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

    const { rounds } = req.body ?? {};
    if (!Array.isArray(rounds) || rounds.length === 0) {
        return res.status(400).json({ error: 'rounds array required' });
    }

    const result = await runModeration({ rounds, apiKey });
    return res.json(result);
}
