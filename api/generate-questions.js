import { applyCors } from './_lib/origin.js';
import { requireAuth } from './_lib/auth.js';

export default async function handler(req, res) {
    if (!applyCors(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const claims = await requireAuth(req, res, process.env.VITE_FIREBASE_PROJECT_ID);
    if (!claims) return;

    const { text, sourceUrl, questionType = 'scripture_based' } = req.body ?? {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Missing page text' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

    const prompts = {
        scripture_based: `You are writing scripture-based quiz rounds for an LDS youth Sunday School class (ages 14–16).

Source URL: ${sourceUrl || 'unknown'}

Lesson content:
---
${text}
---

Generate exactly 4 rounds. For each round:
- Choose a specific verse or short passage from the lesson text
- The "question" field MUST be the scripture quote itself (verbatim or paraphrased closely) followed by a factual question drawn directly from that passage. Format: "[Scripture text] (Reference). [Factual question about that passage]?"
- Provide exactly 4 answers that are facts found directly in the scripture passage
- Points: 40, 30, 20, 10

Example question: "Moses was told to remove his sandals because the ground was holy (Exodus 3:5). Name something God told Moses to do at the burning bush."
Example answers: Remove sandals (40), Do not come near (30), Look not upon God's face (20), Go to Pharaoh (10)

CRITICAL: Respond with ONLY valid JSON, no markdown, no code fences.
{"topic":"lesson topic","questionType":"scripture_based","rounds":[{"question":"[scripture quote (ref)]. [factual question]?","type":"scripture_based","answers":[{"text":"answer","points":40},{"text":"answer","points":30},{"text":"answer","points":20},{"text":"answer","points":10}]}]}`,

        scripture_application: `You are writing application-based scripture rounds for an LDS youth Sunday School class (ages 14–16).

Source URL: ${sourceUrl || 'unknown'}

Lesson content:
---
${text}
---

Generate exactly 4 rounds. For each round:
- Choose a specific verse or principle from the lesson
- The "question" field MUST quote the scripture briefly, then ask how that principle applies to youth today. Format: "[Short scripture quote] (Reference). Name a way LDS youth today [application]."
- Provide exactly 4 practical application answers (how students live this principle today)
- Points: 40, 30, 20, 10

Example question: "Love the Lord your God with all your heart, soul, and might (Deuteronomy 6:5). Name a way LDS youth show love for God in daily life."
Example answers: Daily scripture study (40), Pray morning and night (30), Keep the Sabbath day holy (20), Be kind to others (10)

CRITICAL: Respond with ONLY valid JSON, no markdown, no code fences.
{"topic":"lesson topic","questionType":"scripture_application","rounds":[{"question":"[scripture quote (ref)]. [application question]?","type":"scripture_application","answers":[{"text":"answer","points":40},{"text":"answer","points":30},{"text":"answer","points":20},{"text":"answer","points":10}]}]}`,

        family_feud: `You are a survey-style question writer for a youth Sunday School class (ages 14–16). Questions must be faith-appropriate and based on the provided content.

Source URL: ${sourceUrl || 'unknown'}

Lesson content:
---
${text}
---

Generate exactly 4 survey-style rounds with 6 answers each.

CRITICAL: Respond with ONLY valid JSON, no markdown, no code fences.
{"topic":"lesson topic","questionType":"family_feud","rounds":[{"question":"Ask 100 youth in a classroom poll: name something...","type":"family_feud","answers":[{"text":"answer","points":38},{"text":"answer","points":22},{"text":"answer","points":14},{"text":"answer","points":10},{"text":"answer","points":9},{"text":"answer","points":7}]}]}`
    };

    const prompt = prompts[questionType] || prompts.scripture_based;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 3000,
                messages: [{ role: 'user', content: prompt }]
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(500).json({ error: `Claude API error: ${errText}` });
        }

        const data = await response.json();
        const rawContent = data.content[0].text;

        let parsed;
        try {
            parsed = JSON.parse(rawContent);
        } catch {
            const match = rawContent.match(/\{[\s\S]*\}/);
            if (match) {
                try { parsed = JSON.parse(match[0]); }
                catch { return res.status(502).json({ error: 'AI returned invalid JSON', raw: rawContent.slice(0, 300) }); }
            } else {
                return res.status(502).json({ error: 'AI returned non-JSON response', raw: rawContent.slice(0, 300) });
            }
        }

        if (!parsed.rounds?.length) return res.status(502).json({ error: 'AI response missing rounds array' });

        parsed.sourceUrl = sourceUrl;
        parsed.generatedAt = new Date().toISOString();
        return res.status(200).json(parsed);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
