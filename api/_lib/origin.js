// Origin gate for the /api/* endpoints.
// Stops opportunistic browser-side abuse from other sites embedding our endpoints
// to mint Claude calls on our Anthropic key. Not a wall — Origin is forgeable
// from non-browser clients (curl, scripts) — but it shuts down 99% of automated
// bot probes that don't bother spoofing it. Real auth (Firebase token check) is
// the next layer, tracked separately.

const ALLOWED_ORIGINS = new Set([
    'https://kindred-youth.org',
    'https://www.kindred-youth.org',
    'http://localhost:5173',
])

export function applyCors(req, res) {
    const origin = (req.headers && (req.headers.origin || req.headers.Origin)) || ''
    const allowed = ALLOWED_ORIGINS.has(origin)

    res.setHeader('Vary', 'Origin')

    if (allowed) {
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Access-Control-Max-Age', '86400')
    }

    if (req.method === 'OPTIONS') {
        if (allowed) {
            res.statusCode = 204
            res.end()
        } else {
            res.statusCode = 403
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Origin not allowed' }))
        }
        return false
    }

    if (!allowed) {
        res.statusCode = 403
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Origin not allowed' }))
        return false
    }

    return true
}
