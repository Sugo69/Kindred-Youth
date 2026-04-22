# Extract Lesson Details

Extract all key elements from a Come Follow Me lesson page, cross-reference with For the Strength of Youth and Youth Themes, and build a structured local database + Mermaid mindmap. Results feed into game question generation.

## Invocation
User provides a Come Follow Me lesson URL. Access it via `$ARGUMENTS`. If no URL is given, ask for one.

---

## Step 1 — Fetch the lesson page

Use WebFetch on `$ARGUMENTS`. Read the full HTML content.

---

## Step 2 — Fetch supporting reference materials (parallel fetches)

Fetch ALL of the following alongside the lesson. Use the content for relevance matching in Step 4.

### Youth Themes (fetch once, cache for session)

**Young Women Theme** (static — no fetch needed, use this verbatim):
> "I am a beloved daughter of heavenly parents, with a divine nature and eternal destiny. As a disciple of Jesus Christ, I strive to become like Him. I seek and act upon personal revelation and minister to others in His holy name. I will stand as a witness of God at all times and in all things and in all places. As I strive to qualify for exaltation, I cherish the gift of repentance and seek to improve each day. With faith, I will strengthen my home and family, make and keep sacred covenants, and receive the ordinances and blessings of the holy temple."

**Aaronic Priesthood Quorum Theme** (static — use verbatim):
> "I am a beloved son of God, and He has a work for me to do. With all my heart, might, mind, and strength, I will love God, keep His commandments, and use this priesthood to serve others, beginning in my own home. As I strive to serve, exercise faith, repent, and improve each day, I will qualify to receive the Melchizedek Priesthood and make and keep temple covenants. Pressing forward with steadfastness in Christ, I will fulfill my divine destiny."

**Annual Youth Theme** — WebFetch: `https://www.churchofjesuschrist.org/study/youth/youth-theme?lang=eng`
Extract: theme text, key scripture, year.

### For the Strength of Youth (FSY) — Chapter index

| Ch | Title | Header Scripture |
|----|-------|-----------------|
| 1  | God's plan is for you | Alma 22:13 |
| 2  | God wants to communicate with you | D&C 8:2–3 |
| 3  | You can help with God's work | Moses 1:39 |
| 4  | Jesus Christ will help you | Psalm 147:3 |
| 5  | Walk in God's light | Galatians 5:25 |
| 6  | Love God, love your neighbor | Matthew 22:37–40 |
| 7  | Ordinances and covenants give you access to God's blessings | D&C 84:20 |
| 8  | Temple ordinances and covenants give you greater access | D&C 95:8 |
| 9  | You are blessed by priesthood keys and authority | Matthew 16:18–19 |
| 10 | Your body is sacred | 1 Corinthians 6:18–20 |
| 11 | Truth will make you free | John 8:32 |
| 12 | Jesus Christ brings joy | D&C 101:36 |

Base URL pattern: `https://www.churchofjesuschrist.org/study/manual/for-the-strength-of-youth/{slug}?lang=eng`

**Do NOT fetch all 12 chapters upfront.** Fetch only chapters that score HIGH relevance in Step 4. Fetch the chapter index page first if needed for title matching.

---

## Step 3 — Extract lesson content

### A. Lesson ID
Derive a slug from the URL path. Example: `/study/manual/come-follow-me-for-home-and-church-old-testament-2026/20` → `old-testament-2026-lesson-20`.

### B. Lesson title, week label, assigned scriptures
- Title: `<h1>` or page title
- Week label: date prefix (e.g., "May 11–17")
- Assigned scriptures: the reading block at the top of the lesson (e.g., "Deuteronomy 6–8; 15; 18; 29–30; 34") — split into individual ranges

### C. Sections
Every `<h2>` / `<h3>` is a section boundary. Track title and order. Sections under "Ideas for Teaching Children" are `isChildrenSection: true`.

### D. Scripture References
Every scripture citation in body text. Formats: explicit links, parenthetical `(see X)`, inline `X 6:4–9`, abbreviations.
Record: `{ ref, book, chapter, verses, section, fromChildrenSection, isDuplicate }`.
A ref is `isDuplicate: true` if the same or overlapping range appeared in a main-lesson section.

### D2. Fetch scripture verse texts

After collecting all scripture references, group them by **chapter** (book + chapter number) to minimise fetches. For each unique chapter:

1. Build the Gospel Library URL using this book-slug table:

| Book | Slug | Volume |
|------|------|--------|
| Genesis | gen | ot |
| Exodus | ex | ot |
| Leviticus | lev | ot |
| Numbers | num | ot |
| Deuteronomy | deut | ot |
| Joshua | josh | ot |
| Judges | judg | ot |
| Ruth | ruth | ot |
| 1 Samuel | 1-sam | ot |
| 2 Samuel | 2-sam | ot |
| 1 Kings | 1-kgs | ot |
| 2 Kings | 2-kgs | ot |
| Psalms | ps | ot |
| Proverbs | prov | ot |
| Isaiah | isa | ot |
| Jeremiah | jer | ot |
| Ezekiel | ezek | ot |
| Matthew | matt | nt |
| Mark | mark | nt |
| Luke | luke | nt |
| John | john | nt |
| Acts | acts | nt |
| Romans | rom | nt |
| 1 Corinthians | 1-cor | nt |
| 2 Corinthians | 2-cor | nt |
| Galatians | gal | nt |
| Ephesians | eph | nt |
| Philippians | philip | nt |
| Colossians | col | nt |
| Hebrews | heb | nt |
| James | james | nt |
| Revelation | rev | nt |
| 1 Nephi | 1-ne | bofm |
| 2 Nephi | 2-ne | bofm |
| Jacob | jacob | bofm |
| Mosiah | mosiah | bofm |
| Alma | alma | bofm |
| Helaman | hel | bofm |
| 3 Nephi | 3-ne | bofm |
| 4 Nephi | 4-ne | bofm |
| Mormon | morm | bofm |
| Ether | ether | bofm |
| Moroni | moro | bofm |
| D&C | dc | dc-testament |
| Moses | moses | pgp |
| Abraham | abr | pgp |
| Articles of Faith | a-of-f | pgp |

URL pattern: `https://www.churchofjesuschrist.org/study/scriptures/{volume}/{slug}/{chapter}?lang=eng`

2. WebFetch that URL. Parse the HTML for verse elements — look for `<p>` tags containing a `<sup>` or `<span class="verse-number">` verse number, e.g.:
   ```
   <p ...><sup>5</sup>And thou shalt love the Lord thy God...</p>
   ```
   Extract each verse as `{ verseNum: 5, text: "And thou shalt love the Lord thy God..." }` stripping leading verse numbers and HTML tags.

3. For each scripture reference in the lesson, look up the fetched verse data and attach:
   ```json
   { "verseText": "And thou shalt love the Lord thy God with all thine heart..." }
   ```
   For ranges (e.g., 6:4–9), concatenate verses 4 through 9 with a space. Truncate combined text to 400 characters if very long, adding `…`.

4. If a chapter fetch fails (404, timeout, JS-rendered), set `verseText: null` and log a warning — do not block the rest of extraction.

5. Batch fetches in groups of 4 (parallel) to stay within rate limits.

### E. Video Links
Links/iframes to media.churchofjesuschrist.org, YouTube, or video embeds.
Record: `{ title, url, section, fromChildrenSection }`.

### F. Conference Messages
Links whose URL contains `/general-conference/` or speeches.byu.edu.
Record: `{ title, speaker, publication, monthYear, pages, url, section, fromChildrenSection }`.

### G. Discussion Questions
Sentences ending with `?` OR starting with "What", "How", "Why", "Consider", "Ponder", "Think about", "Name", "What are", "How do". Also explicit "Invitation" or "Question" boxes.
Record: `{ text, section, fromChildrenSection }`.

---

## Step 4 — Relevance matching against FSY and Youth Themes

### 4A. Youth Themes — phrase-level matching

For **each phrase** in the YW Theme and AP Quorum Theme, check if it:
- Contains a scripture reference that overlaps with lesson scriptures
- Uses vocabulary central to the lesson (heart, covenant, commandment, love God, remember, choose, etc.)
- Echoes a section title or key teaching

Score each phrase: **HIGH** (direct scripture quote or near-verbatim echo), **MEDIUM** (shared vocabulary/concept), **NONE**.

Record: `{ source: "YW"|"AP"|"Annual", phrase, connection, relevanceScore, lessonSection }`.

**Key known connection to always flag:**
The AP Quorum Theme phrase *"With all my heart, might, mind, and strength, I will love God"* is a direct restatement of Deuteronomy 6:5 / Matthew 22:37. Always flag this when the lesson covers Deuteronomy 6 or the Shema.

### 4B. FSY chapters — keyword scoring

Score each chapter against the lesson without fetching them all:

| Signal | Points |
|--------|--------|
| Chapter's header scripture is cited in the lesson | +10 |
| Chapter title uses exact vocabulary from a section title | +5 |
| Chapter's main theme matches a lesson section theme | +3 |
| Chapter uses vocabulary present in 3+ lesson sections | +2 |

Fetch and fully extract any chapter scoring **≥ 5 points**. For chapters scoring 3–4, include a brief note only. Skip chapters scoring < 3.

For fetched chapters, extract:
- Full title + header scripture
- All "Eternal Truths" statements (verbatim)
- All "Invitations" (verbatim)
- All scripture references
- All questions/Q&A
- Matching phrases from the lesson

Record per chapter: `{ chapter, title, headerScripture, relevanceScore, connectionSummary, relevantPhrases[], scriptureRefs[], questions[] }`.

---

## Step 5 — Build the output data structure

```json
{
  "lessonId": "...",
  "url": "...",
  "title": "...",
  "weekLabel": "...",
  "extractedAt": "ISO timestamp",

  "lessonScriptures": ["..."],

  "sections": [
    {
      "id": "...",
      "title": "...",
      "order": 0,
      "isChildrenSection": false,
      "bodyText": "...",
      "scriptureRefs": [{ "ref": "...", "context": "...", "isDuplicate": false }],
      "questions": ["..."],
      "videoLinks": [{ "title": "...", "url": "..." }],
      "conferenceMessages": [{ "title": "...", "speaker": "...", "publication": "...", "monthYear": "...", "url": "..." }]
    }
  ],

  "allScriptureRefs": [
    {
      "ref": "Deuteronomy 6:5",
      "book": "Deuteronomy",
      "chapter": 6,
      "verses": "5",
      "verseText": "And thou shalt love the Lord thy God with all thine heart, and with all thy soul, and with all thy might.",
      "url": "https://www.churchofjesuschrist.org/study/scriptures/ot/deut/6?lang=eng#p5",
      "section": "Love the Lord",
      "fromChildrenSection": false,
      "isDuplicate": false
    }
  ],
  "allVideoLinks": [],
  "allConferenceMessages": [],
  "allQuestions": [],

  "youthThemes": {
    "youngWomenTheme": {
      "fullText": "...",
      "relevantPhrases": [
        { "phrase": "...", "connection": "...", "relevanceScore": "HIGH|MEDIUM", "lessonSection": "..." }
      ]
    },
    "aaronicPriesthoodTheme": {
      "fullText": "...",
      "relevantPhrases": [
        { "phrase": "...", "connection": "...", "relevanceScore": "HIGH|MEDIUM", "lessonSection": "..." }
      ]
    },
    "annualTheme": {
      "year": "...",
      "text": "...",
      "scripture": "...",
      "relevantPhrases": []
    }
  },

  "fsyConnections": [
    {
      "chapter": 6,
      "title": "Love God, love your neighbor",
      "headerScripture": "Matthew 22:37–40",
      "relevanceScore": 10,
      "connectionSummary": "...",
      "relevantPhrases": [
        { "fsyText": "...", "lessonEcho": "...", "lessonSection": "..." }
      ],
      "scriptureRefs": [],
      "questions": [],
      "keyTeachings": []
    }
  ],

  "stats": {
    "sectionCount": 0,
    "mainSectionCount": 0,
    "childrenSectionCount": 0,
    "scriptureRefCount": 0,
    "uniqueScriptureRefCount": 0,
    "duplicateScriptureRefCount": 0,
    "verseTextFetched": 0,
    "verseTextFailed": 0,
    "videoCount": 0,
    "conferenceMessageCount": 0,
    "questionCount": 0,
    "mainQuestionCount": 0,
    "childrenQuestionCount": 0,
    "fsyChaptersMatched": 0,
    "youthThemePhrasesMatched": 0
  }
}
```

---

## Step 6 — Save files

- **Database**: `lesson-database/<lessonId>.json`
- **Mindmap**: `lesson-database/<lessonId>-mindmap.md`

Overwrite if files already exist; log that it was refreshed.

---

## Step 7 — Generate the Mermaid mindmap

Structure:

```
mindmap
  root((Lesson Title))
    Assigned Reading
      Each scripture range
    <Section 1 Title>
      📖 Scripture refs (max 6, "+ N more" if truncated)
      ❓ Questions (first 8 words, max 3)
      🎥 Video title
      🎙 Conference talk
    ...main sections...
    Ideas for Children
      Unique refs (♻ dup / ✨ NEW)
      Questions
    Youth Theme Connections
      🟡 YW: "phrase" → section link
      🔵 AP: "phrase" → section link
      🟢 Annual: "phrase" → section link
    FSY Connections
      HIGH relevance chapters
        Chapter title
          Key teaching phrase
          Header scripture
```

Escape parentheses in node labels. Truncate node text to 50 chars with `…`.

Add a **Key Connections** table below the diagram:

| Source | Phrase | Lesson Section | Why It Matters |
|--------|--------|----------------|----------------|
| AP Theme | "With all my heart, might, mind…" | Love the Lord | Direct restatement of Deut 6:5 |
| FSY Ch.6 | Matthew 22:37–40 header | Love the Lord | Jesus quoting the Shema |
| ... | | | |

---

## Step 8 — Display terminal summary

```
═══════════════════════════════════════════════════════
  LESSON: <title>
  Week:   <weekLabel>
  Saved:  lesson-database/<lessonId>.json
          lesson-database/<lessonId>-mindmap.md
═══════════════════════════════════════════════════════

📚 ASSIGNED READING  (<N> ranges)
  • ...

🏷  SECTIONS  (<N> main + <N> children)
  Each section: title [refs · questions]

📖 SCRIPTURE REFERENCES  (<N> unique / <M> total — <V> verse texts fetched, <F> failed)
  Grouped by section. Mark ♻ duplicates and ✨ children-only.
  For each ref: show first 80 chars of verseText (or "⚠ text unavailable" if null).

🎥 VIDEOS  (<N>)
🎙 CONFERENCE MESSAGES  (<N>)
❓ QUESTIONS  (<N> main + <N> children)

━━━ YOUTH THEMES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟡 Young Women Theme  (<N> HIGH + <N> MEDIUM phrases matched)
  HIGH: "phrase" → <lesson section> — <why>
  ...
🔵 Aaronic Priesthood Theme  (<N> HIGH + <N> MEDIUM)
  HIGH: "phrase" → <lesson section> — <why>
  ...
🟢 Annual Theme  (<N> matches)
  ...

━━━ FOR THE STRENGTH OF YOUTH ━━━━━━━━━━━━━━━━━━━━━━
<relevance score> Ch <N>: "<title>" (<header scripture>)
  Connection: <one-line summary>
  Key echo: "<FSY phrase>" ↔ "<lesson phrase>"
  ...

🗺  MINDMAP: lesson-database/<lessonId>-mindmap.md
```

---

## Step 9 — Offer next step

Ask: "Would you like me to generate game questions from this lesson data now, or review/edit anything first?"

---

## Extraction notes

- Scripture ranges from the assigned block and inline refs are **different lists** — never merge them.
- Children's section refs that overlap with main lesson refs get `isDuplicate: true` — do not omit them.
- If the page is thin (JavaScript-rendered), extract what static HTML is available and note the limitation.
- For FSY relevance: the connection between FSY Ch. 6 (Matthew 22:37–40) and any lesson covering Deuteronomy 6 (the Shema) is always HIGH — Jesus was directly quoting the Shema when He named the greatest commandment.
- Always check the AP Quorum Theme for "heart, might, mind, and strength" when the lesson covers Deuteronomy 6 or Matthew 22.

---

## Compliance metadata contract (REQUIRED output field)

The extraction JSON you save to `lesson-database/{lessonId}.json` MUST include a top-level `extractionReport` so downstream skills (`youth-leader`, `gamemaster`) and the runtime pipeline know what the extraction produced and what it could not produce. Shape:

```json
{
  "extractionReport": {
    "version": "extract-lesson-v2",
    "sourceUrl": "https://www.churchofjesuschrist.org/study/manual/...",
    "scriptureRefCount": 14,
    "verseTextFetched": 14,
    "verseTextFailed": 0,
    "videoLinkCount": 3,
    "talkLinkCount": 5,
    "fsyChaptersMatched": ["ch-6", "ch-9"],
    "youthThemeHits": [{"theme":"YW", "phrase":"With God all things are possible", "score":"HIGH"}],
    "urlAllowlistViolations": [],
    "warnings": []
  }
}
```

- Every `allScriptureRefs[]` entry must carry `ref`, `url`, `section`, and `verseText` (verbatim KJV / standard works — max 400 chars for ranges).
- Every `allVideoLinks[]` and `allConferenceMessages[]` URL must be on `churchofjesuschrist.org`, `media.churchofjesuschrist.org`, `abn.churchofjesuschrist.org`, or `speeches.byu.edu`. Off-allowlist URLs go into `urlAllowlistViolations` and are dropped from the main arrays.
- Never merge children's-section refs with main-section refs; `isDuplicate: true` preserves provenance.
- If `verseTextFailed > 0`, write a `warnings[]` entry so `youth-leader` / `gamemaster` know to regenerate or prompt the teacher — do not silently emit pairs/rounds without verse text.
