// One-off runner: simplify a lesson's Youth pairs into Primary content.
// Usage: node run-simplify.tmp.mjs <firestore-doc.json> <out.json>
import fs from 'node:fs'
import { runSimplifyPairs } from '../api/_lib/simplify.js'

const key = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')
  .find(l => l.startsWith('ANTHROPIC_API_KEY='))?.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '')

const doc = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const f = doc.fields

const val = (v) => {
  if (v == null) return null
  if ('stringValue' in v) return v.stringValue
  if ('integerValue' in v) return Number(v.integerValue)
  if ('booleanValue' in v) return v.booleanValue
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)]))
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val)
  return null
}

const memory = val(f.memory)
console.log('lesson :', val(f.name))
console.log('topic  :', memory.topic)
console.log('pairs  :', memory.pairs.length)

const t0 = Date.now()
const { status, body } = await runSimplifyPairs({
  pairs: memory.pairs,
  topic: memory.topic,
  lessonId: val(f.lessonId),
  apiKey: key,
  enableSafetyReview: true,
})
console.log(`\nstatus ${status} in ${((Date.now() - t0) / 1000).toFixed(1)}s`)

if (status !== 200) { console.log(body); process.exit(1) }

const cr = body.complianceReport
console.log('overall:', cr.overall, '| pass', cr.passCount, '| review', cr.reviewCount,
  '| rewritten', cr.rewrittenCount, '| blocked', cr.blockedCount)
console.log('versePhrase dropped:', cr.structural.versePhraseDropped,
  '| icon collisions:', cr.structural.iconCollisions.length,
  '| hard blocks:', cr.structural.hardBlockHits.length)

if (cr.structural.findings.length) {
  console.log('\nfindings:')
  cr.structural.findings.forEach(x => console.log(' ', x.id || `board ${x.board || '?'}`, '→', x.findings.join('; ')))
}
if (Array.isArray(cr.safety.notes) && cr.safety.notes.length) {
  console.log('\nsafety notes:')
  cr.safety.notes.forEach(n => console.log(' ', typeof n === 'string' ? n : `${n.id}: ${n.verdict} — ${n.reason}`))
}

console.log('\n── boards ──')
body.boards.forEach(b => console.log(`  ${b.n}. ${b.title} — ${b.takeaway}`))

console.log('\n── cards ──')
body.pairs.forEach(p => {
  console.log(`\n[b${p.board}] ${p.icon}  ${p.word}   (${p.phrase})   ${p.verseRef}`)
  console.log(`   sentence : ${p.sentence}`)
  console.log(`   means    : ${p.verseSimple}`)
  console.log(`   verbatim : ${p.versePhrase === null ? '(none — plain line only)' : '"' + p.versePhrase + '"'}`)
  console.log(`   christ   : ${p.christConnection}`)
  console.log(`   prompt   : ${p.prompt}`)
  if (!p.complianceCheck.startsWith('PASS')) console.log(`   ⚠ ${p.complianceCheck}`)
})

fs.writeFileSync(process.argv[3], JSON.stringify(body, null, 2))
console.log('\nsaved →', process.argv[3])
