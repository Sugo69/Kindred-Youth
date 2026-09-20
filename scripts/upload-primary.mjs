// Write a generated Primary set into lessonLibrary/{docId}.memoryPrimary via
// the Firestore REST API (the repo has no firebase npm dep — CDN only).
import fs from 'node:fs'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')
  .filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))

const API = env.VITE_FIREBASE_API_KEY
const PROJ = env.VITE_FIREBASE_PROJECT_ID
const APP_ID = 'exodus-feud-final-v10'

const body = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const docId = process.argv[3]

// JS value → Firestore typed JSON
function enc(v) {
  if (v === null || v === undefined) return { nullValue: null }
  if (typeof v === 'string') return { stringValue: v }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } }
  if (typeof v === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } }
  return { stringValue: String(v) }
}

const tokenResp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API}`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }),
})
const { idToken } = await tokenResp.json()
if (!idToken) { console.error('auth failed'); process.exit(1) }

const path = `projects/${PROJ}/databases/(default)/documents/artifacts/${APP_ID}/public/data/lessonLibrary/${docId}`
const url = `https://firestore.googleapis.com/v1/${path}?updateMask.fieldPaths=memoryPrimary`

const resp = await fetch(url, {
  method: 'PATCH',
  headers: { 'content-type': 'application/json', Authorization: `Bearer ${idToken}` },
  body: JSON.stringify({ fields: { memoryPrimary: enc(body) } }),
})

if (!resp.ok) { console.error('write failed', resp.status, (await resp.text()).slice(0, 400)); process.exit(1) }

// Read it straight back — a write that isn't verified isn't done.
const check = await fetch(`https://firestore.googleapis.com/v1/${path}?mask.fieldPaths=memoryPrimary`, {
  headers: { Authorization: `Bearer ${idToken}` },
}).then(r => r.json())

const mp = check.fields?.memoryPrimary?.mapValue?.fields
console.log('wrote memoryPrimary →', docId)
console.log('  pairs :', mp?.pairs?.arrayValue?.values?.length)
console.log('  boards:', mp?.boards?.arrayValue?.values?.length)
console.log('  topic :', mp?.topic?.stringValue)
console.log('  overall:', mp?.complianceReport?.mapValue?.fields?.overall?.stringValue)
