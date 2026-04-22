// Come Follow Me 2026 — Old Testament
// Maps each Sunday date to the lesson slug on churchofjesuschrist.org.
// Source: https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-old-testament-2026
//
// Each entry: { weekStart: ISO date (Sunday), slug: lesson path segment, title }
// Lessons cover a 2-week teaching block (1st and 3rd Sundays). weekStart is the
// Sunday the lesson first opens; the lesson is taught for two Sundays.

const CFM_2026_OT = [
  { weekStart: '2025-12-29', slug: '1',  title: 'We Are Responsible for Our Own Learning' },
  { weekStart: '2026-01-05', slug: '2',  title: 'In the Beginning God Created the Heaven and the Earth — Genesis 1–2; Moses 2–3; Abraham 4–5' },
  { weekStart: '2026-01-12', slug: '3',  title: 'The Fall of Adam and Eve — Genesis 3–4; Moses 4–5' },
  { weekStart: '2026-01-19', slug: '4',  title: 'Noah Found Grace in the Eyes of the Lord — Genesis 5; 6; 7; 8; 9; Moses 8' },
  { weekStart: '2026-01-26', slug: '5',  title: 'The Abrahamic Covenant — Genesis 11:27–17; 21:1–7; Abraham 1–2' },
  { weekStart: '2026-02-02', slug: '6',  title: 'Fulfillment of the Covenant — Genesis 24–27' },
  { weekStart: '2026-02-09', slug: '7',  title: 'Jacob, Rachel, and Leah — Genesis 28–33' },
  { weekStart: '2026-02-16', slug: '8',  title: 'Joseph in Egypt — Genesis 37–41' },
  { weekStart: '2026-02-23', slug: '9',  title: 'God Meant It Unto Good — Genesis 42–50' },
  { weekStart: '2026-03-02', slug: '10', title: 'I Am That I Am — Exodus 1–6' },
  { weekStart: '2026-03-09', slug: '11', title: 'Remember This Day — Exodus 7–13' },
  { weekStart: '2026-03-16', slug: '12', title: 'Stand Still and See the Salvation of the Lord — Exodus 14–17' },
  { weekStart: '2026-03-23', slug: '13', title: 'All That the Lord Hath Spoken We Will Do — Exodus 18–20' },
  { weekStart: '2026-03-30', slug: '14', title: 'Sanctify Yourselves — Exodus 24; 31–34' },
  { weekStart: '2026-04-06', slug: '15', title: 'Easter — Jesus Christ Is the Lamb of God' },
  { weekStart: '2026-04-13', slug: '16', title: 'A Tabernacle in the Wilderness — Exodus 35–40; Leviticus 1; 4; 16; 19' },
  { weekStart: '2026-04-20', slug: '17', title: 'Holiness to the Lord — Numbers 11–14; 20–24' },
  { weekStart: '2026-05-04', slug: '18', title: 'Look unto Christ — Numbers 20–24' },
  { weekStart: '2026-05-11', slug: '19', title: 'Fear the Lord and Serve Him — Deuteronomy 6–8; 15; 18; 29–30; 34' },
  { weekStart: '2026-05-25', slug: '20', title: 'Be Strong and of a Good Courage — Joshua 1–8; 23–24' },
  { weekStart: '2026-06-08', slug: '21', title: 'The Lord Raised Up Judges — Judges 2–4; 6–8; 13–16' },
  { weekStart: '2026-06-22', slug: '22', title: 'Whither Thou Goest, I Will Go — Ruth; 1 Samuel 1–3' },
  { weekStart: '2026-07-06', slug: '23', title: 'The Battle Is the Lord\u2019s — 1 Samuel 8–10; 13; 15–18' },
  { weekStart: '2026-07-20', slug: '24', title: 'The Lord Looketh on the Heart — 1 Samuel 18–20; 23–24; 2 Samuel 5–7' },
  { weekStart: '2026-08-03', slug: '25', title: 'Create in Me a Clean Heart — 2 Samuel 11–12; Psalm 51' },
  { weekStart: '2026-08-17', slug: '26', title: 'He Will Give Thee the Desires of Thine Heart — Psalms 1–2; 8; 19–33; 40; 46' },
  { weekStart: '2026-08-31', slug: '27', title: 'Give unto the Lord the Glory Due unto His Name — Psalms 49–51; 61–66; 69–72; 77–78; 85–86' },
  { weekStart: '2026-09-14', slug: '28', title: 'The Lord Is My Shepherd — Psalms 102–3; 110; 116–19; 127–28; 135–39; 146–50' },
  { weekStart: '2026-09-28', slug: '29', title: 'Get Wisdom — 1 Kings 3; 8; 11; Proverbs 1–4; 15–16; 31; Ecclesiastes 1–3; 11–12' },
  { weekStart: '2026-10-12', slug: '30', title: 'I, Even I Only, Am Left — 1 Kings 17–19' },
  { weekStart: '2026-10-26', slug: '31', title: 'Thine Hand Shall Lead Me — 2 Kings 2–7' },
  { weekStart: '2026-11-09', slug: '32', title: 'Woe Is Me! For I Am Undone — Isaiah 1–12' },
  { weekStart: '2026-11-23', slug: '33', title: 'How Beautiful upon the Mountains — Isaiah 40–49' },
  { weekStart: '2026-12-07', slug: '34', title: 'He Hath Borne Our Griefs — Isaiah 50–57' },
  { weekStart: '2026-12-21', slug: '35', title: 'Christmas — A Virgin Shall Conceive, and Bear a Son' },
];

const MANUAL_BASE = 'https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-old-testament-2026';

export function getCfmLessonForDate(date = new Date()) {
  const target = startOfSundayUTC(date);
  let current = CFM_2026_OT[0];
  for (const lesson of CFM_2026_OT) {
    if (new Date(lesson.weekStart + 'T00:00:00Z') <= target) {
      current = lesson;
    } else {
      break;
    }
  }
  return toResolvedLesson(current);
}

export function getCurrentCfmLesson() {
  return getCfmLessonForDate(new Date());
}

export function getNextCfmLesson(date = new Date()) {
  const target = startOfSundayUTC(date);
  for (const lesson of CFM_2026_OT) {
    if (new Date(lesson.weekStart + 'T00:00:00Z') > target) {
      return toResolvedLesson(lesson);
    }
  }
  return toResolvedLesson(CFM_2026_OT[CFM_2026_OT.length - 1]);
}

export function resolveLessonIdFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    // /study/manual/come-follow-me-for-home-and-church-old-testament-2026/{slug}
    const manualIdx = parts.indexOf('manual');
    if (manualIdx >= 0 && parts[manualIdx + 1] && parts[manualIdx + 2]) {
      const manual = parts[manualIdx + 1];
      const slug = parts[manualIdx + 2];
      return `${manual}/${slug}`;
    }
    return u.pathname.replace(/^\//, '').replace(/\//g, '-') || 'lesson';
  } catch {
    return null;
  }
}

function toResolvedLesson(lesson) {
  return {
    ...lesson,
    url: `${MANUAL_BASE}/${lesson.slug}?lang=eng`,
    lessonId: `old-testament-2026-lesson-${lesson.slug}`,
  };
}

function startOfSundayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0 = Sunday
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}
