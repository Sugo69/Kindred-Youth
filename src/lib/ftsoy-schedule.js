// For the Strength of Youth (FSY) — YM/YW third-hour curriculum.
//
// Unlike CFM (a static year array) and Seminary (on-demand with a cache), this
// schedule is DERIVED: once a month's issue is published, every lesson URL
// follows a fixed slug pattern, so the month's lessons come from calendar maths
// plus that pattern. Nothing is scraped and nothing is hardcoded per month.
//
//   /study/ftsoy/{YYYY}/{MM}/fsy-lessons/{code}?lang=eng
//
// The only dynamic question is whether a month has been published yet; the
// magazine runs about a month ahead (the October 2026 issue carried November).
//
// See ftsoy-ymyw-design.md.

const MAGAZINE_BASE = 'https://www.churchofjesuschrist.org/study/ftsoy';
const GUIDE_URL = 'https://www.churchofjesuschrist.org/study/manual/for-the-strength-of-youth?lang=eng';

// Fixed per-issue slugs, verified against the September and October 2026 issues.
export const FTSOY_SLOTS = [
  { code: '00-intro',          label: 'Introduction',  kind: 'intro',    track: 'shared', sunday: null },
  { code: '01-fast-sunday',    label: 'Fast Sunday',   kind: 'lesson',   track: 'shared', sunday: 1 },
  { code: '02-second-sunday',  label: 'Second Sunday', kind: 'lesson',   track: 'shared', sunday: 2 },
  { code: '03-third-sunday',   label: 'Third Sunday',  kind: 'lesson',   track: 'shared', sunday: 3 },
  { code: '04a-fourth-sunday', label: 'Last Sunday',   kind: 'lesson',   track: 'yw',     sunday: 'last' },
  { code: '04b-fourth-sunday', label: 'Last Sunday',   kind: 'lesson',   track: 'ym',     sunday: 'last' },
  { code: '05a-activity-idea', label: 'Activity Idea', kind: 'activity', track: 'shared', sunday: null },
  { code: '05b-activity-idea', label: 'Activity Idea', kind: 'activity', track: 'shared', sunday: null },
];

const TRACK_LABEL = { shared: 'YM + YW', ym: 'Aaronic Priesthood Quorums', yw: 'Young Women' };

// ── Calendar ─────────────────────────────────────────────────────────────────

// Every Sunday in a month, as YYYY-MM-DD. Built in UTC so a machine in any
// timezone produces the same dates — a local-time Date() here would shift the
// first Sunday by one day for anyone west of GMT.
export function sundaysInMonth(year, month) {
  const out = [];
  const d = new Date(Date.UTC(year, month - 1, 1));
  while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCMonth() === month - 1) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return out;
}

// Which date does a slot fall on? `sunday` is an ordinal (1-based) or 'last'.
function dateForSlot(slot, sundays) {
  if (slot.sunday === null) return null;
  if (slot.sunday === 'last') return sundays[sundays.length - 1] || null;
  return sundays[slot.sunday - 1] || null;
}

// ── Public API ───────────────────────────────────────────────────────────────

export function ftsoyMonthUrl(year, month) {
  return `${MAGAZINE_BASE}/${year}/${String(month).padStart(2, '0')}?lang=eng`;
}

export function ftsoyLessonUrl(year, month, code) {
  return `${MAGAZINE_BASE}/${year}/${String(month).padStart(2, '0')}/fsy-lessons/${code}?lang=eng`;
}

// Deliberately NOT the `cfm-` prefix: the cfm-/bare-id fallback has caused
// lookup bugs twice, and FSY ids must never be dragged into it.
export function ftsoyLessonId(year, month, code) {
  return `ftsoy-${year}-${String(month).padStart(2, '0')}-${code}`;
}

export const FTSOY_GUIDE_URL = GUIDE_URL;

/**
 * The full shape of one month's YM/YW curriculum.
 * Pure calendar + slug derivation — it does not know or care whether the issue
 * has actually been published. Callers check that separately.
 */
export function getFtsoyMonth(year, month) {
  const sundays = sundaysInMonth(year, month);
  const monthLabel = new Date(Date.UTC(year, month - 1, 1))
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const slots = FTSOY_SLOTS.map(slot => {
    const date = dateForSlot(slot, sundays);
    return {
      ...slot,
      date,
      trackLabel: TRACK_LABEL[slot.track],
      url: ftsoyLessonUrl(year, month, slot.code),
      lessonId: ftsoyLessonId(year, month, slot.code),
      // What a teacher sees in the library list.
      name: `${monthLabel} — ${slot.label}${slot.track === 'shared' ? '' : ` (${TRACK_LABEL[slot.track]})`}`,
    };
  });

  // A five-Sunday month has a Sunday no lesson claims. Surfaced rather than
  // silently absorbed, because the magazine labels the split lesson "Last
  // Sunday" while its slug says "fourth" — see ftsoy-ymyw-design.md §7.1.
  const claimed = new Set(slots.map(s => s.date).filter(Boolean));
  const openSundays = sundays.filter(d => !claimed.has(d));

  return {
    year,
    month,
    monthLabel,
    monthUrl: ftsoyMonthUrl(year, month),
    guideUrl: GUIDE_URL,
    sundays,
    openSundays,
    slots,
    // FIVE lesson slots across FOUR teaching Sundays — the last Sunday carries
    // a YM lesson and a YW lesson on the same date. The library wants all five;
    // a single classroom wants four (see lessonsForTrack).
    lessons: slots.filter(s => s.kind === 'lesson'),
    teachingSundays: [...new Set(slots.filter(s => s.kind === 'lesson').map(s => s.date))],
  };
}

/** The four lessons one classroom actually teaches, given its track. */
export function lessonsForTrack(month, track = 'shared') {
  return month.lessons.filter(l => l.track === 'shared' || l.track === track);
}

/** The months a teacher could plausibly want: this one plus the next two. */
export function getFtsoyHorizon(from = new Date(), count = 3) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i, 1));
    out.push(getFtsoyMonth(d.getUTCFullYear(), d.getUTCMonth() + 1));
  }
  return out;
}

/** Which FSY lesson does a given Sunday belong to, for a given track? */
export function getFtsoyLessonForDate(date = new Date(), track = 'shared') {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const iso = new Date(Date.UTC(y, date.getUTCMonth(), date.getUTCDate())).toISOString().slice(0, 10);
  const { lessons } = getFtsoyMonth(y, m);
  const onDate = lessons.filter(l => l.date === iso);
  if (!onDate.length) return null;
  // The last Sunday has a YM lesson and a YW lesson on the same date.
  return onDate.find(l => l.track === track) || onDate.find(l => l.track === 'shared') || onDate[0];
}

/** True for a URL this module owns — used to route library entries. */
export function isFtsoyUrl(url) {
  return typeof url === 'string' && /churchofjesuschrist\.org\/study\/ftsoy\//i.test(url);
}

export const __testables = { dateForSlot, TRACK_LABEL };
