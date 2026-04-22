// Come Follow Me 2026 — Old Testament
// Source of truth: https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-old-testament-2026
// Slugs and date ranges taken verbatim from the manual's table of contents.
//
// Each entry:
//   slug       — URL path segment (internal routing only; teachers see dates, not numbers)
//   weekStart  — Monday (start of study week)
//   weekEnd    — Sunday (the teaching / Sunday School delivery day — this is the date that matters to teachers)
//   title      — scripture range as published by the Church

const CFM_2026_OT = [
  { slug: '01', weekStart: '2025-12-29', weekEnd: '2026-01-04', title: 'Introduction to the Old Testament' },
  { slug: '02', weekStart: '2026-01-05', weekEnd: '2026-01-11', title: 'Moses 1; Abraham 3' },
  { slug: '03', weekStart: '2026-01-12', weekEnd: '2026-01-18', title: 'Genesis 1–2; Moses 2–3; Abraham 4–5' },
  { slug: '04', weekStart: '2026-01-19', weekEnd: '2026-01-25', title: 'Genesis 3–4; Moses 4–5' },
  { slug: '05', weekStart: '2026-01-26', weekEnd: '2026-02-01', title: 'Genesis 5; Moses 6' },
  { slug: '06', weekStart: '2026-02-02', weekEnd: '2026-02-08', title: 'Moses 7' },
  { slug: '07', weekStart: '2026-02-09', weekEnd: '2026-02-15', title: 'Genesis 6–11; Moses 8' },
  { slug: '08', weekStart: '2026-02-16', weekEnd: '2026-02-22', title: 'Genesis 12–17; Abraham 1–2' },
  { slug: '09', weekStart: '2026-02-23', weekEnd: '2026-03-01', title: 'Genesis 18–23' },
  { slug: '10', weekStart: '2026-03-02', weekEnd: '2026-03-08', title: 'Genesis 24–33' },
  { slug: '11', weekStart: '2026-03-09', weekEnd: '2026-03-15', title: 'Genesis 37–41' },
  { slug: '12', weekStart: '2026-03-16', weekEnd: '2026-03-22', title: 'Genesis 42–50' },
  { slug: '13', weekStart: '2026-03-23', weekEnd: '2026-03-29', title: 'Exodus 1–6' },
  { slug: '14', weekStart: '2026-03-30', weekEnd: '2026-04-05', title: 'Easter' },
  { slug: '15', weekStart: '2026-04-06', weekEnd: '2026-04-12', title: 'Exodus 7–13' },
  { slug: '16', weekStart: '2026-04-13', weekEnd: '2026-04-19', title: 'Exodus 14–18' },
  { slug: '17', weekStart: '2026-04-20', weekEnd: '2026-04-26', title: 'Exodus 19–20; 24; 31–34' },
  { slug: '18', weekStart: '2026-04-27', weekEnd: '2026-05-03', title: 'Exodus 35–40; Leviticus 1; 4; 16; 19' },
  { slug: '19', weekStart: '2026-05-04', weekEnd: '2026-05-10', title: 'Numbers 11–14; 20–24; 27' },
  { slug: '20', weekStart: '2026-05-11', weekEnd: '2026-05-17', title: 'Deuteronomy 6–8; 15; 18; 29–30; 34' },
  { slug: '21', weekStart: '2026-05-18', weekEnd: '2026-05-24', title: 'Joshua 1–8; 23–24' },
  { slug: '22', weekStart: '2026-05-25', weekEnd: '2026-05-31', title: 'Judges 2–4; 6–8; 13–16' },
  { slug: '23', weekStart: '2026-06-01', weekEnd: '2026-06-07', title: 'Ruth; 1 Samuel 1–7' },
  { slug: '24', weekStart: '2026-06-08', weekEnd: '2026-06-14', title: '1 Samuel 8–10; 13; 15–16' },
  { slug: '25', weekStart: '2026-06-15', weekEnd: '2026-06-21', title: '1 Samuel 17–18; 24–26; 2 Samuel 5–7' },
  { slug: '26', weekStart: '2026-06-22', weekEnd: '2026-06-28', title: '2 Samuel 11–12; 1 Kings 3; 6–9; 11' },
  { slug: '27', weekStart: '2026-06-29', weekEnd: '2026-07-05', title: '1 Kings 12–13; 17–22' },
  { slug: '28', weekStart: '2026-07-06', weekEnd: '2026-07-12', title: '2 Kings 2–7' },
  { slug: '29', weekStart: '2026-07-13', weekEnd: '2026-07-19', title: '2 Kings 16–25' },
  { slug: '30', weekStart: '2026-07-20', weekEnd: '2026-07-26', title: '2 Chronicles 14–20; 26; 30' },
  { slug: '31', weekStart: '2026-07-27', weekEnd: '2026-08-02', title: 'Ezra 1; 3–7; Nehemiah 2; 4–6; 8' },
  { slug: '32', weekStart: '2026-08-03', weekEnd: '2026-08-09', title: 'Esther' },
  { slug: '33', weekStart: '2026-08-10', weekEnd: '2026-08-16', title: 'Job 1–3; 12–14; 19; 21–24; 38–40; 42' },
  { slug: '34', weekStart: '2026-08-17', weekEnd: '2026-08-23', title: 'Psalms 1–2; 8; 19–33; 40; 46' },
  { slug: '35', weekStart: '2026-08-24', weekEnd: '2026-08-30', title: 'Psalms 49–51; 61–66; 69–72; 77–78; 85–86' },
  { slug: '36', weekStart: '2026-08-31', weekEnd: '2026-09-06', title: 'Psalms 102–3; 110; 116–19; 127–28; 135–39; 146–50' },
  { slug: '37', weekStart: '2026-09-07', weekEnd: '2026-09-13', title: 'Proverbs 1–4; 15–16; 22; 31; Ecclesiastes 1–3; 11–12' },
  { slug: '38', weekStart: '2026-09-14', weekEnd: '2026-09-20', title: 'Isaiah 1–12' },
  { slug: '39', weekStart: '2026-09-21', weekEnd: '2026-09-27', title: 'Isaiah 13–14; 22; 24–30; 35' },
  { slug: '40', weekStart: '2026-09-28', weekEnd: '2026-10-04', title: 'Isaiah 40–49' },
  { slug: '41', weekStart: '2026-10-05', weekEnd: '2026-10-11', title: 'Isaiah 50–57' },
  { slug: '42', weekStart: '2026-10-12', weekEnd: '2026-10-18', title: 'Isaiah 58–66' },
  { slug: '43', weekStart: '2026-10-19', weekEnd: '2026-10-25', title: 'Jeremiah 1–3; 7; 16–18; 20' },
  { slug: '44', weekStart: '2026-10-26', weekEnd: '2026-11-01', title: 'Jeremiah 31–33; 36–38; Lamentations 1; 3' },
  { slug: '45', weekStart: '2026-11-02', weekEnd: '2026-11-08', title: 'Ezekiel 1–3; 33–34; 36–37; 47' },
  { slug: '46', weekStart: '2026-11-09', weekEnd: '2026-11-15', title: 'Daniel 1–7' },
  { slug: '47', weekStart: '2026-11-16', weekEnd: '2026-11-22', title: 'Hosea 1–6; 10–14; Joel' },
  { slug: '48', weekStart: '2026-11-23', weekEnd: '2026-11-29', title: 'Amos; Obadiah; Jonah' },
  { slug: '49', weekStart: '2026-11-30', weekEnd: '2026-12-06', title: 'Micah; Nahum; Habakkuk; Zephaniah' },
  { slug: '50', weekStart: '2026-12-07', weekEnd: '2026-12-13', title: 'Haggai 1–2; Zechariah 1–4; 7–14' },
  { slug: '51', weekStart: '2026-12-14', weekEnd: '2026-12-20', title: 'Malachi' },
  { slug: '52', weekStart: '2026-12-21', weekEnd: '2026-12-27', title: 'Christmas' },
];

const MANUAL_SLUG = 'come-follow-me-for-home-and-church-old-testament-2026';
const MANUAL_BASE = `https://www.churchofjesuschrist.org/study/manual/${MANUAL_SLUG}`;

export function getAllCfmLessons() {
  return CFM_2026_OT.map(toResolvedLesson);
}

// Returns the lesson whose teaching Sunday (weekEnd) is the soonest Sunday >= today.
// Mon–Sat: returns next Sunday's lesson (prep mode).
// Sun:     returns today's lesson.
// After the manual ends: returns the final lesson.
export function getCfmLessonForDate(date = new Date()) {
  const today = toUtcMidnight(date);
  for (const lesson of CFM_2026_OT) {
    if (toUtcMidnight(lesson.weekEnd) >= today) {
      return toResolvedLesson(lesson);
    }
  }
  return toResolvedLesson(CFM_2026_OT[CFM_2026_OT.length - 1]);
}

export function getCurrentCfmLesson() {
  return getCfmLessonForDate(new Date());
}

// Returns the lesson *after* the current one.
export function getNextCfmLesson(date = new Date()) {
  const current = getCfmLessonForDate(date);
  const idx = CFM_2026_OT.findIndex(l => l.slug === current.slug);
  const next = CFM_2026_OT[Math.min(idx + 1, CFM_2026_OT.length - 1)];
  return toResolvedLesson(next);
}

export function resolveLessonIdFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const manualIdx = parts.indexOf('manual');
    if (manualIdx >= 0 && parts[manualIdx + 1] && parts[manualIdx + 2]) {
      const manual = parts[manualIdx + 1];
      const slug = parts[manualIdx + 2];
      return `${manual}-${slug}`;
    }
    return u.pathname.replace(/^\//, '').replace(/\//g, '-') || 'lesson';
  } catch {
    return null;
  }
}

// ── Display formatters ───────────────────────────────────────────────────────
// Teachers think in dates ("the lesson I'm teaching on April 19"), not lesson
// numbers. These helpers surface the human-readable forms for the UI.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

// "April 13–19, 2026"
export function formatLessonDateRange(lesson) {
  const s = parseIsoDate(lesson.weekStart);
  const e = parseIsoDate(lesson.weekEnd);
  const sameMonth = s.getUTCMonth() === e.getUTCMonth();
  if (sameMonth) {
    return `${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()}–${e.getUTCDate()}, ${e.getUTCFullYear()}`;
  }
  return `${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()} – ${MONTHS[e.getUTCMonth()]} ${e.getUTCDate()}, ${e.getUTCFullYear()}`;
}

// "Sunday, April 19, 2026" — the delivery day
export function formatTeachingDate(lesson) {
  const d = parseIsoDate(lesson.weekEnd);
  return `Sunday, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

// Compact human label for UI entries: "Apr 19 — Exodus 14–18"
export function formatLessonLabel(lesson) {
  const d = parseIsoDate(lesson.weekEnd);
  const month = MONTHS[d.getUTCMonth()].slice(0, 3);
  return `${month} ${d.getUTCDate()} — ${lesson.title}`;
}

// ── Internals ────────────────────────────────────────────────────────────────
function toResolvedLesson(lesson) {
  return {
    ...lesson,
    url: `${MANUAL_BASE}/${lesson.slug}?lang=eng`,
    lessonId: `${MANUAL_SLUG}-${lesson.slug}`,
    displayLabel: formatLessonLabel(lesson),
    dateRange: formatLessonDateRange(lesson),
    teachingDate: formatTeachingDate(lesson),
  };
}

function parseIsoDate(iso) {
  return new Date(iso + 'T00:00:00Z');
}

function toUtcMidnight(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
