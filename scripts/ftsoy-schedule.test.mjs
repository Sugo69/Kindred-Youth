// Offline checks for the FSY schedule derivation. No network, no API.
import {
  sundaysInMonth, getFtsoyMonth, getFtsoyLessonForDate, getFtsoyHorizon,
  ftsoyLessonUrl, ftsoyLessonId, isFtsoyUrl, lessonsForTrack,
} from '../src/lib/ftsoy-schedule.js'
import { blockTermsFor } from '../api/_lib/pipeline.js'

let pass = 0, fail = 0
const t = (name, cond) => { if (cond) { pass++; console.log('  ok  ', name) } else { fail++; console.log('  FAIL', name) } }

console.log('\n— Sunday maths —')
// September 2026: Sundays fall on the 6th, 13th, 20th and 27th (today is the 20th).
t('Sep 2026 has 4 Sundays', sundaysInMonth(2026, 9).length === 4)
t('Sep 2026 Sundays are right',
  sundaysInMonth(2026, 9).join(',') === '2026-09-06,2026-09-13,2026-09-20,2026-09-27')
// A month that starts ON a Sunday must count that day.
t('Nov 2026 starts on a Sunday and counts it', sundaysInMonth(2026, 11)[0] === '2026-11-01')
t('Nov 2026 has 5 Sundays', sundaysInMonth(2026, 11).length === 5)
// February in a leap year, and a month whose last day is a Sunday.
t('Feb 2028 (leap) has 4 Sundays', sundaysInMonth(2028, 2).length === 4)
t('every returned date really is a Sunday',
  [[2026, 1], [2026, 6], [2027, 2], [2030, 12]].every(([y, m]) =>
    sundaysInMonth(y, m).every(d => new Date(d + 'T00:00:00Z').getUTCDay() === 0)))

console.log('\n— month shape —')
const sep = getFtsoyMonth(2026, 9)
// Five lesson slots, four teaching Sundays: the last Sunday is split.
t('five lesson slots', sep.lessons.length === 5)
t('four teaching Sundays', sep.teachingSundays.length === 4)
t('a YW class teaches four lessons', lessonsForTrack(sep, 'yw').length === 4)
t('a YM class teaches four lessons', lessonsForTrack(sep, 'ym').length === 4)
t('a YW class never sees the YM lesson',
  lessonsForTrack(sep, 'yw').every(l => l.track !== 'ym'))
t('label reads as a month', sep.monthLabel === 'September 2026')
t('fast Sunday is the first Sunday', sep.lessons.find(l => l.code === '01-fast-sunday').date === '2026-09-06')
t('last-Sunday lessons land on the last Sunday',
  sep.lessons.filter(l => l.sunday === 'last').every(l => l.date === '2026-09-27'))
t('the split is YM and YW on the same date',
  sep.lessons.filter(l => l.date === '2026-09-27').map(l => l.track).sort().join(',') === 'ym,yw')
t('no open Sundays in a 4-Sunday month', sep.openSundays.length === 0)

const nov = getFtsoyMonth(2026, 11)
t('5-Sunday month surfaces the unclaimed Sunday', nov.openSundays.length === 1)
t('...and it is the 4th Sunday, not the last', nov.openSundays[0] === '2026-11-22')
t('...while the split lesson stays on the LAST Sunday',
  nov.lessons.filter(l => l.sunday === 'last').every(l => l.date === '2026-11-29'))

console.log('\n— urls and ids —')
t('lesson url matches the verified pattern',
  ftsoyLessonUrl(2026, 9, '04b-fourth-sunday') ===
  'https://www.churchofjesuschrist.org/study/ftsoy/2026/09/fsy-lessons/04b-fourth-sunday?lang=eng')
t('month is zero-padded', ftsoyLessonUrl(2026, 1, '00-intro').includes('/2026/01/'))
t('ids are ftsoy-prefixed, never cfm-',
  ftsoyLessonId(2026, 9, '01-fast-sunday') === 'ftsoy-2026-09-01-fast-sunday'
  && !ftsoyLessonId(2026, 9, '01-fast-sunday').startsWith('cfm-'))
t('recognises its own urls', isFtsoyUrl('https://www.churchofjesuschrist.org/study/ftsoy/2026/09?lang=eng'))
t('does not claim CFM urls',
  !isFtsoyUrl('https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-old-testament-2026/38?lang=eng'))

console.log('\n— lesson for a date —')
const sunday20 = new Date(Date.UTC(2026, 8, 20))
t('20 Sep 2026 is the third Sunday', getFtsoyLessonForDate(sunday20)?.code === '03-third-sunday')
const sunday27 = new Date(Date.UTC(2026, 8, 27))
t('last Sunday returns the YW lesson for a YW class', getFtsoyLessonForDate(sunday27, 'yw')?.code === '04a-fourth-sunday')
t('last Sunday returns the YM lesson for a YM class', getFtsoyLessonForDate(sunday27, 'ym')?.code === '04b-fourth-sunday')
const weekday = new Date(Date.UTC(2026, 8, 22))
t('a weekday has no lesson', getFtsoyLessonForDate(weekday) === null)

console.log('\n— horizon —')
const horizon = getFtsoyHorizon(new Date(Date.UTC(2026, 8, 20)), 3)
t('three months ahead', horizon.length === 3)
t('starts with the current month', horizon[0].monthLabel === 'September 2026')
t('rolls into the next year cleanly',
  getFtsoyHorizon(new Date(Date.UTC(2026, 11, 1)), 3).map(m => m.monthLabel).join(' | ')
  === 'December 2026 | January 2027 | February 2027')

console.log('\n— compliance posture (the FSY landmine) —')
const def = blockTermsFor('default')
const fsy = blockTermsFor('ftsoy')
t('CFM posture is untouched', def.length === 25)
t('FSY relaxes exactly the curriculum vocabulary', def.length - fsy.length === 9)
// October 2026 is "Your Body Is Sacred" — Word of Wisdom and law of chastity.
t('law of chastity wording passes under FSY', !fsy.some(r => r.test('the law of chastity and sexual purity')))
t('Word of Wisdom wording passes under FSY', !fsy.some(r => r.test('the Word of Wisdom warns about vaping and marijuana')))
t('...but the same wording is still blocked for CFM',
  def.some(r => r.test('sexual')) && def.some(r => r.test('vaping')))
for (const w of ['pornography', 'abuse', 'rape', 'suicide', 'self-harm']) {
  t(`${w} stays blocked even for FSY`, fsy.some(r => r.test(w)))
}

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
