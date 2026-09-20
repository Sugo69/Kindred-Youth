// One-off migration + reusable audit: replace cross icons in stored lesson
// content. The Church does not use the cross as a symbol of its faith, so a ✝
// on a classroom screen reads as wrong to these students.
//
//   node scripts/fix-cross-icons.mjs           # audit only
//   node scripts/fix-cross-icons.mjs --write   # apply
import fs from 'node:fs'

const WRITE = process.argv.includes('--write')
const env = Object.fromEntries(fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))

const API = env.VITE_FIREBASE_API_KEY
const PROJ = env.VITE_FIREBASE_PROJECT_ID
const APP_ID = 'exodus-feud-final-v10'
const COL = `projects/${PROJ}/databases/(default)/documents/artifacts/${APP_ID}/public/data/lessonLibrary`

const CROSS = /[✝✞✟†☨✚]/

// Context-chosen replacements, checked against the other icons in each set so
// they don't collide (a duplicate icon breaks Primary mode, where the emoji is
// the match key). Anything not listed falls back to 🙏.
const OVERRIDES = {
  'Lifted Up': '🙌',            // Helaman 8:15 — the serpent lifted up
  'Prophecy Fulfilled': '📜',   // Psalm 22:1 → Matthew 27:46
  'our Saviour': '🛟',          // "rescues us from sin and death"
}
const FALLBACK = '🙏'

const val = (v) => {
  if (v == null) return null
  if ('stringValue' in v) return v.stringValue
  if ('integerValue' in v) return Number(v.integerValue)
  if ('doubleValue' in v) return v.doubleValue
  if ('booleanValue' in v) return v.booleanValue
  if ('nullValue' in v) return null
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)]))
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val)
  return null
}
const enc = (v) => {
  if (v === null || v === undefined) return { nullValue: null }
  if (typeof v === 'string') return { stringValue: v }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } }
  if (typeof v === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } }
  return { stringValue: String(v) }
}

const { idToken } = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API}`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }),
}).then(r => r.json())
if (!idToken) { console.error('auth failed'); process.exit(1) }

const list = await fetch(`https://firestore.googleapis.com/v1/${COL}?pageSize=300`, {
  headers: { Authorization: `Bearer ${idToken}` },
}).then(r => r.json())

let found = 0, fixed = 0

for (const d of list.documents || []) {
  const id = d.name.split('/').pop()
  const data = Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, val(v)]))
  const touched = new Set()

  const fixIcon = (holder, where) => {
    if (!holder || !CROSS.test(holder.icon || '')) return
    found++
    const next = OVERRIDES[holder.iconLabel] || FALLBACK
    console.log(`${id}\n    ${where}: ${holder.icon} → ${next}   (${holder.iconLabel || holder.word || ''})`)
    holder.icon = next
  }

  ;(data.memory?.pairs || []).forEach((p, i) => { const before = p.icon; fixIcon(p, `memory.pairs[${i}]`); if (p.icon !== before) touched.add('memory') })
  ;(data.wellOfWords?.puzzles || []).forEach((pz, pi) => {
    ;(pz.words || []).concat(pz.bonusWords || []).forEach((w, wi) => {
      const before = w.icon; fixIcon(w, `wellOfWords.puzzles[${pi}].words[${wi}]`); if (w.icon !== before) touched.add('wellOfWords')
    })
  })
  ;(data.memoryPrimary?.pairs || []).forEach((p, i) => { const before = p.icon; fixIcon(p, `memoryPrimary.pairs[${i}]`); if (p.icon !== before) touched.add('memoryPrimary') })

  if (!touched.size || !WRITE) continue

  const mask = [...touched].map(f => `updateMask.fieldPaths=${f}`).join('&')
  const fields = Object.fromEntries([...touched].map(f => [f, enc(data[f])]))
  const resp = await fetch(`https://firestore.googleapis.com/v1/${COL}/${id}?${mask}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields }),
  })
  if (!resp.ok) { console.error('  write failed:', resp.status, (await resp.text()).slice(0, 200)); continue }
  fixed += touched.size
  console.log(`  ✓ wrote ${[...touched].join(', ')}`)
}

console.log(`\n${found} cross icon(s) found across ${(list.documents || []).length} lessons.`)
console.log(WRITE ? `${fixed} field(s) updated.` : 'Audit only — re-run with --write to apply.')
