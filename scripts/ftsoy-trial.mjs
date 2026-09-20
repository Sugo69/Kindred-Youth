// One-off: generate a Common Ground game from a real FSY lesson to see whether
// topical third-hour material produces a usable game. Phase 1's whole purpose.
import fs from 'node:fs'
import { runLessonPipeline } from '../api/_lib/pipeline.js'

const key = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')
  .find(l => l.startsWith('ANTHROPIC_API_KEY='))?.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '')

const url = process.argv[2]
const t0 = Date.now()
const { status, body } = await runLessonPipeline({
  url, gameType: 'common-ground', questionType: 'mixed',
  curriculum: 'ftsoy', apiKey: key,
})
console.log(`status ${status} in ${((Date.now()-t0)/1000).toFixed(1)}s`)
if (status !== 200) { console.log(body); process.exit(1) }
const cr = body.complianceReport
console.log('topic  :', body.topic)
console.log('rounds :', (body.rounds||[]).length)
console.log('overall:', cr.overall, '| pass', cr.passCount, '| review', cr.reviewCount, '| rewritten', cr.rewrittenCount, '| blocked', cr.blockedCount)
console.log('hard blocks:', cr.structural.hardBlockHits.length)
;(body.rounds||[]).slice(0,4).forEach((r,i)=>{
  console.log(`\n${i+1}. ${r.question}`)
  ;(r.answers||[]).slice(0,4).forEach(a=>console.log(`     ${a.points ?? ''} ${a.text ?? a.answer ?? ''}`))
  if (r.christConnection) console.log(`     ✦ ${r.christConnection}`)
  if (!String(r.complianceCheck||'').startsWith('PASS')) console.log(`     ⚠ ${r.complianceCheck}`)
})
fs.writeFileSync(process.argv[3], JSON.stringify(body,null,2))
console.log('\nsaved →', process.argv[3])
