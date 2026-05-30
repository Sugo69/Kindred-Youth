// Shared moderation logic — used by api/moderate.js (Vercel) and vite.config.js (dev).
// Uses raw fetch like pipeline.js — no @anthropic-ai/sdk dependency.

const MODERATE_MODEL = 'claude-haiku-4-5-20251001';

export async function runModeration({ rounds, apiKey }) {
    if (!apiKey) return { results: [], apiError: true };
    if (!Array.isArray(rounds) || rounds.length === 0) return { results: [] };

    const items = rounds.map((r, i) => ({
        i,
        q: (r.question || '').slice(0, 250),
        a: (r.answers || []).map(a => (a.text || '').slice(0, 120)).filter(Boolean),
    }));

    const prompt = `You are a content safety reviewer for a Latter-day Saint youth classroom (ages 14–16). A teacher has entered or edited these Common Ground game questions and answers.

Your job: decide if each item is safe for a youth Sunday School class.

Rules:
- PASS items that use scriptural/biblical language correctly (ass=donkey, hell=Sheol/Gehenna, harlot, naked in Eden, concubine, bastard in Deut 23:2, etc.)
- PASS questions about difficult gospel topics handled age-appropriately
- FLAG items that are inappropriate regardless of context:
  * Modern profanity or sexual slang
  * Content that sexualises, demeans, or could embarrass a specific youth
  * Questions designed to expose private family situations or mental health
  * Content that promotes harmful or illegal behaviour
  * Anything that would make a reasonable parent concerned

Be concise. Reasons must be under 12 words.

Content to review:
${JSON.stringify(items, null, 2)}

Respond with ONLY valid JSON — no markdown, no explanation:
{"results":[{"i":0,"verdict":"PASS"},{"i":1,"verdict":"FLAG","reason":"reason here"}]}`;

    try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: MODERATE_MODEL,
                max_tokens: 600,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!resp.ok) {
            console.warn('[moderate] API status', resp.status);
            return { results: [], apiError: true };
        }

        const data = await resp.json();
        const raw = data.content?.[0]?.text || '';
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) {
            console.warn('[moderate] no JSON in response');
            return { results: [], apiError: true };
        }
        return JSON.parse(match[0]);
    } catch (err) {
        console.error('[moderate]', err.message);
        return { results: [], apiError: true };
    }
}
