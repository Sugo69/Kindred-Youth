export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' })
        return
    }
    const { ip, payload } = req.body
    if (!ip) { res.status(400).json({ error: 'No IP provided' }); return }
    try {
        await fetch(`http://${ip}/json/state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(3000),
        })
        res.status(200).json({ ok: true })
    } catch {
        res.status(502).json({ error: 'WLED unreachable' })
    }
}
