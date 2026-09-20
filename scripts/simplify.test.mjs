// Offline checks for the simplify pass validators — no API calls.
import { __testables } from '../api/_lib/simplify.js'

const { isVerbatimFragment, cleanWord, rebalanceBoards, runStructuralChecks, normaliseSource, reanchor, buildBoards } = __testables

let pass = 0, fail = 0
const t = (name, cond) => { if (cond) { pass++; console.log('  ok  ', name) } else { fail++; console.log('  FAIL', name) } }

console.log('\n— isVerbatimFragment (the headline guarantee) —')
const verse = 'Behold, God is my salvation; I will trust, and not be afraid: for the Lord JEHOVAH is my strength and my song'
t('exact fragment matches', isVerbatimFragment('God is my salvation', verse))
t('punctuation/case differences still match', isVerbatimFragment('behold god is my salvation', verse))
t('fragment spanning punctuation matches', isVerbatimFragment('I will trust and not be afraid', verse))
t('MODERNISED paraphrase is rejected', !isVerbatimFragment('God is the one who saves me', verse))
t('reworded fragment is rejected', !isVerbatimFragment('God is my saviour', verse))
t('empty is rejected', !isVerbatimFragment('', verse))

console.log('\n— cleanWord —')
t('uppercases and strips', cleanWord('ark!', 'boat') === 'ARK')
t('falls back to iconLabel', cleanWord('', 'Song of Trust') === 'SONGOFTR')
t('falls back to WORD', cleanWord('', '') === 'WORD')

console.log('\n— rebalanceBoards (4/4/4 regardless of model counting) —')
const lop = Array.from({ length: 12 }, (_, i) => ({ id: `p${i + 1}`, board: i < 9 ? 1 : 3 }))
const bal = rebalanceBoards(lop, 3, 4)
const counts = [1, 2, 3].map(n => bal.filter(p => p.board === n).length)
t('boards are 4/4/4', JSON.stringify(counts) === '[4,4,4]')

console.log('\n— reanchor drops invented ids and fails on omissions —')
const sources = Array.from({ length: 4 }, (_, i) => normaliseSource({
  id: `p${i + 1}`, cardA: `Isaiah ${i + 1} — Title`, verse, icon: '🎵', iconLabel: 'song', url: 'https://x/y',
}, i))
const withGhost = [...sources.map(s => ({ id: s.id, board: 1, word: 'X', sentence: 's', verseSimple: 'v' })), { id: 'GHOST', board: 1 }]
const r1 = reanchor(withGhost, sources, 2, 2)
t('invented id dropped', !r1.fatal && r1.pairsOut.length === 4)
const r2 = reanchor([{ id: 'p1', board: 1 }], sources, 2, 2)
t('omitted pairs are fatal', !!r2.fatal)

console.log('\n— runStructuralChecks flags a deliberately bad card —')
const bad = [{
  id: 'p1', board: 1, icon: '🎵', iconLabel: 'song',
  verseRef: 'Isaiah 99', // drifted
  verse, url: 'https://x/y',
  word: 'SALVATIONWORD',                                  // too long
  phrase: 'one two three four five six seven',            // >6 words (hard limit)
  sentence: 'The righteousness of the Lord Jehovah shall be established forever and ever and ever amen truly indeed and also again and again forever',  // >22 words + long word
  verseSimple: 'Behold, thou shalt trust in the Lord',     // archaic
  versePhrase: 'God is the one who saves me',              // NOT verbatim
  christConnection: 'Jesus',
  prompt: 'Tell us about a time you were afraid',          // not an action verb
  complianceCheck: 'PASS',
}]
const src1 = [{ ...sources[0], id: 'p1', verseRef: 'Isaiah 1', verse, url: 'https://x/y', icon: '🎵' }]
const rep = runStructuralChecks(bad, buildBoards([], 1), src1)
const f = rep.findings[0]?.findings.join(' | ') || ''
t('non-verbatim versePhrase dropped', bad[0].versePhrase === null && rep.versePhraseDropped === 1)
t('archaic verseSimple flagged', /archaic/.test(f))
t('word length flagged', /word must be/.test(f))
t('phrase length is a HARD finding (card geometry)', /phrase too long for a card face/.test(f))
t('sentence length is a SOFT note, not a finding', !/sentence too long/.test(f) && rep.lengthNotes.some(n => n.notes.join(' ').includes('sentence runs long')))
t('non-action prompt flagged', /action verb/.test(f))
t('ref drift flagged', /verseRef drifted/.test(f))
t('long words flagged', /too long for early readers/.test(f))
t('card marked REVIEW', bad[0].complianceCheck.startsWith('REVIEW:'))

console.log('\n— icon collision detection —')
const dup = [
  { id: 'p1', board: 1, icon: '🎵', verseRef: 'a', verse, url: 'u', word: 'A', phrase: 'a', sentence: 'a b', verseSimple: 'a b', christConnection: 'Jesus saves', prompt: 'Point here now' },
  { id: 'p2', board: 1, icon: '🎵', verseRef: 'a', verse, url: 'u', word: 'B', phrase: 'b', sentence: 'a b', verseSimple: 'a b', christConnection: 'Jesus saves', prompt: 'Point here now' },
]
const rep2 = runStructuralChecks(dup, buildBoards([], 1), [])
t('duplicate icons detected', rep2.iconCollisions.length === 1)

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
