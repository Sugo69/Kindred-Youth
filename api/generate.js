import { applyCors } from './_lib/origin.js';
import { requireAuth } from './_lib/auth.js';

export default async function handler(req, res) {
    if (!applyCors(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const claims = await requireAuth(req, res, process.env.VITE_FIREBASE_PROJECT_ID);
    if (!claims) return;

    const { items, batchId } = req.body;
    if (!items?.length || !batchId) return res.status(400).json({ error: 'items and batchId required' });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

    const formatId = (seq) => `BL-${String(seq).padStart(3, '0')}`;

    const prompt = `You are a senior product manager and software architect. Generate a complete implementation document for the following batch of backlog items from the Kindred-Youth app (kindred-youth.org).

## App Context
- **Stack:** Vite MPA + Firebase Firestore (real-time sync)
- **Views:** TV Monitor (16:9 classroom display) | Admin (phone/iPad controller) | Backlog tracker
- **Deployment:** Vercel (static build + serverless functions in /api)
- **Users:** Sunday School teacher (admin) and youth students age 13–16 (players)
- **Theme:** Neon cyberpunk — Orbitron + Permanent Marker fonts, cyan/pink/purple palette
- **Repo:** github.com/Sugo69/Kindred-Youth

## Batch: ${batchId}

${items.map(i => `### ${formatId(i.seqId)} [${i.priority}]
${i.description}`).join('\n\n')}

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
A numbered checklist the teacher/developer runs in the browser after deployment to confirm the batch is production-ready before marking it released. Be specific — include URLs, UI interactions, and expected visual outcomes.

## 5. Claude Code Prompt
A ready-to-paste prompt the developer can drop into Claude Code to implement this entire batch. Include all context needed (file paths, current architecture, acceptance criteria) so Claude Code can execute without additional clarification.`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 8000,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const text = await response.text();
            return res.status(500).json({ error: `Claude API error: ${text}` });
        }

        const data = await response.json();
        res.json({ content: data.content[0].text });
    } catch (err) {
        console.error('Generate error:', err);
        res.status(500).json({ error: err.message });
    }
}
