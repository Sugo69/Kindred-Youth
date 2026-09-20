// Re-run the deterministic checks over an already-generated Primary set.
// No API call — used after tuning the validators.
import fs from 'node:fs'
import { __testables } from '../api/_lib/simplify.js'

const { runStructuralChecks, normaliseSource } = __testables
const body = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const srcDoc = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'))

const val = (v) => {
  if (v == null) return null
  if ('stringValue' in v) return v.stringValue
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)]))
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val)
  return null
}
const sources = val(srcDoc.fields.memory).pairs.map(normaliseSource)

// Reset stamps so the re-check is honest rather than cumulative.
body.pairs.forEach(p => { p.complianceCheck = 'PASS' })

const structural = runStructuralChecks(body.pairs, body.boards, sources)
const safety = body.complianceReport.safety
body.complianceReport.structural = structural
body.complianceReport.passCount = structural.passCount
body.complianceReport.reviewCount = structural.reviewCount
body.complianceReport.overall =
  (safety.blockedCount > 0 || structural.hardBlockHits.length > 0) ? 'REVIEW_REQUIRED'
  : (structural.reviewCount > 0 || safety.rewrittenCount > 0) ? 'PASS_WITH_REWRITES'
  : 'PASS'

console.log('overall:', body.complianceReport.overall,
  '| pass', structural.passCount, '| review', structural.reviewCount,
  '| rewritten', safety.rewrittenCount, '| blocked', safety.blockedCount)
console.log('versePhrase dropped:', structural.versePhraseDropped,
  '| icon collisions:', structural.iconCollisions.length,
  '| hard blocks:', structural.hardBlockHits.length)
if (structural.findings.length) {
  console.log('\nintegrity findings:')
  structural.findings.forEach(x => console.log(' ', x.id || `board ${x.board}`, '→', x.findings.join('; ')))
} else {
  console.log('\nintegrity findings: none')
}
if (structural.lengthNotes.length) {
  console.log('\nlength notes (informational only):')
  structural.lengthNotes.forEach(x => console.log(' ', x.id, '→', x.notes.join('; ')))
}
const boardCounts = body.boards.map(b => body.pairs.filter(p => p.board === b.n).length)
console.log('\nboard sizes:', boardCounts.join(' / '))
console.log('every versePhrase verbatim:', body.pairs.every(p => p.versePhrase === null || p.complianceCheck === 'PASS'))

fs.writeFileSync(process.argv[2], JSON.stringify(body, null, 2))
console.log('updated →', process.argv[2])
