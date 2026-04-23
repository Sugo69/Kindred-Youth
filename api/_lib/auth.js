// Firebase ID token verifier — no firebase-admin SDK, just Node crypto + Google's
// public x509 certs. Keeps the serverless cold start fast (no service account JSON,
// no large dep). Verifies JWT signature, then validates iss/aud/exp/iat claims and
// requires `email` to be present (which blocks anonymous-auth tokens — anonymous
// signin is silent and bots can mint tokens that way, defeating the gate).
//
// Cache: Google's certs are fetched once per cold start and refreshed every hour
// or on a kid-miss (key rotation).

import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
const CERT_TTL_MS = 60 * 60 * 1000

let certCache = { keys: null, fetchedAt: 0 }

async function getGoogleCerts({ force = false } = {}) {
    if (!force && certCache.keys && Date.now() - certCache.fetchedAt < CERT_TTL_MS) {
        return certCache.keys
    }
    const resp = await fetch(GOOGLE_CERTS_URL)
    if (!resp.ok) throw new Error(`Google cert fetch failed (${resp.status})`)
    const keys = await resp.json()
    certCache = { keys, fetchedAt: Date.now() }
    return keys
}

function b64urlDecode(s) {
    const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
    return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

function parseJwt(token) {
    const parts = token.split('.')
    if (parts.length !== 3) throw new Error('Malformed JWT')
    const [headerB64, payloadB64, sigB64] = parts
    const header = JSON.parse(b64urlDecode(headerB64).toString('utf8'))
    const payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8'))
    const signature = b64urlDecode(sigB64)
    const signedData = Buffer.from(`${headerB64}.${payloadB64}`, 'utf8')
    return { header, payload, signature, signedData }
}

export async function verifyFirebaseIdToken(token, projectId) {
    if (!token || typeof token !== 'string') throw new Error('No token')
    if (!projectId) throw new Error('No projectId configured')

    const { header, payload, signature, signedData } = parseJwt(token)

    if (header.alg !== 'RS256') throw new Error(`Unsupported alg ${header.alg}`)
    if (!header.kid) throw new Error('Missing kid')

    let keys = await getGoogleCerts()
    let pem = keys[header.kid]
    if (!pem) {
        // Possible rotation — refresh once and retry.
        keys = await getGoogleCerts({ force: true })
        pem = keys[header.kid]
        if (!pem) throw new Error('Unknown kid')
    }

    const pubKey = crypto.createPublicKey(pem)
    const ok = crypto.verify('RSA-SHA256', signedData, pubKey, signature)
    if (!ok) throw new Error('Invalid signature')

    const now = Math.floor(Date.now() / 1000)
    const skew = 60
    if (typeof payload.exp !== 'number' || payload.exp <= now - skew) throw new Error('Token expired')
    if (typeof payload.iat !== 'number' || payload.iat > now + skew) throw new Error('Token iat in future')
    if (payload.auth_time && payload.auth_time > now + skew) throw new Error('auth_time in future')
    if (!payload.sub) throw new Error('Missing sub')
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Bad iss')
    if (payload.aud !== projectId) throw new Error('Bad aud')
    // Block anonymous tokens — they're free to mint and would defeat the gate.
    if (!payload.email) throw new Error('Sign-in required (email-bearing token only)')

    return payload
}

// Helper for both Vercel handlers and Vite middleware.
// Returns the verified claims on success, or null if a 401 was already written.
export async function requireAuth(req, res, projectId) {
    const headers = req.headers || {}
    const raw = headers.authorization || headers.Authorization || ''
    const m = String(raw).match(/^Bearer\s+(.+)$/i)
    if (!m) {
        res.statusCode = 401
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Authentication required' }))
        return null
    }
    try {
        return await verifyFirebaseIdToken(m[1].trim(), projectId)
    } catch (e) {
        res.statusCode = 401
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: `Invalid token: ${e.message}` }))
        return null
    }
}
