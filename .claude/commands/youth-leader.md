# Youth Leader — Lesson Planner

Generate a complete, handbook-compliant lesson plan, engagement activities, and Family Feud game questions from extracted lesson data.

## Input
Expects the path to a lesson database JSON file (from `/project:extract-lesson`). Example: `$ARGUMENTS` = `lesson-database/old-testament-2026-lesson-20.json`. If a URL is passed instead, run the extract-lesson skill first.

---

## Who you are teaching

| Attribute | Detail |
|-----------|--------|
| Ages | 13–16 |
| Class size | 8–15 students |
| Gender mix | ~50/50 young women / young men |
| Background | Mixed — varying testimony depth, church activity levels, life experiences |
| Sunday School | 1st and 3rd Sundays · 50 minutes · begins and ends with prayer |
| Adults required | At least 2 responsible adults must be present at all times |
| Protection training | All adults must complete Children and Youth Protection Training |

---

## Governing principles (always apply these)

### From Teaching in the Savior's Way
1. **Focus on Jesus Christ** no matter what topic you are teaching — every activity and question should connect back to Him
2. **Love those you teach** — know your students; design for who is actually in the room
3. **Teach by the Spirit** — create conditions for the Spirit to teach; don't crowd it out with content
4. **Teach the Doctrine** — use scriptures as the primary source, not commentaries or your own opinions
5. **Invite diligent learning** — students should do more talking and finding than the teacher

### From General Handbook §13
- Classes begin and end with prayer
- At least two responsible adults present at all times
- Youth assigned by age group; do not publicly single out or shame
- All content must be uplifting, faith-promoting, and appropriate for mixed-gender youth classes
- Teachers support parents — never undermine parental authority or home gospel teaching

### From the teacher's role
1. Connect with and support youth — relationship first, lesson second
2. Help youth connect with each other, not just with the teacher
3. Assist parents in encouraging youth to come unto Christ
4. Teach uplifting and inspirational materials
5. Be an extension of parents' efforts to develop testimony
6. Foster healthy peer relationships within the class

### Hard constraints
- **No PowerPoint or slideshow presentations** — they do not engage this age group
- **Teacher should talk less than students** — lecture mode is a failure state
- **Do not be preachy** — ask questions; don't give answers you expect students to parrot back
- **No public pressure** — students can pass; invitations are always opt-in
- **Phone use is an asset** — QR codes, Church app, Scripture links on phones are encouraged
- **All activities must work at multiple intellectual and testimony levels** — some students have deep faith, some are exploring, some are simply present; no activity should exclude or embarrass either end of that spectrum

---

## Step 1 — Read lesson data

Load the JSON file from `$ARGUMENTS`. Extract:
- `title`, `weekLabel`, `lessonScriptures`
- All `sections[]` with `scriptureRefs`, `questions`, `conferenceMessages`
- `youthThemes.aaronicPriesthoodTheme.relevantPhrases` (HIGH relevance only)
- `youthThemes.youngWomenTheme.relevantPhrases` (HIGH relevance only)
- `fsyConnections[]` where `relevanceScore >= 5`
- `allQuestions[]`
- `allScriptureRefs[]` — for each ref, note `ref`, `verseText`, and `url`
  - Build a quick lookup map: `{ "Deuteronomy 6:5": { text: "...", url: "..." }, ... }`
  - If `verseText` is null for a ref, note it as "⚠ text not fetched — quote from memory or Church app"
- `allVideoLinks[]` — title + url for each video in the lesson
- `allConferenceMessages[]` — title + speaker + url for each talk
- `stats`

---

## Step 2 — Compliance pre-check

Before generating any content, run this internal checklist. Flag any lesson data elements that need adaptation:

| Check | What to flag |
|-------|-------------|
| Age-appropriate | Any scripture or conference talk content that requires adult context to understand safely (e.g., themes of violence, sexuality, deep doctrinal complexity) — note it, suggest an alternative framing for youth |
| Gender-neutral | Any section that only applies to one gender — ensure activities are inclusive |
| Testimony-level spread | Are all 5 lesson sections accessible to a non-member or low-activity youth without requiring a testimony to engage? Flag sections that assume deep faith. |
| Question safety | Any discussion question that could publicly expose a youth's struggles, family situation, or doubts — rephrase as third-person or hypothetical |
| Two-adult rule | Flag any proposed activity that could involve a teacher and student being alone (e.g., one-on-one breakout) |

Document compliance notes in the output. Do not block on compliance — provide the flagged content with suggested rewording.

---

## Step 3 — Design the 50-minute lesson plan

Structure every lesson as follows. Adjust timing based on number of scripture sections in the lesson data.

### Template structure

| Block | Duration | Purpose |
|-------|----------|---------|
| Opening prayer | 2 min | Student-led (rotate weekly) |
| **Ice Breaker** | 5–8 min | Relationship building; theme-adjacent but low-stakes |
| **Bridge to Lesson** | 3–5 min | Connect ice breaker to the lesson theme — one question, not a lecture |
| **Scripture Block 1** | 10–12 min | First major lesson section — use chain activity |
| **Scripture Block 2** | 10–12 min | Second major section |
| **Application Activity** | 8–10 min | Students apply the lesson to their own lives — game, reflection, or discussion |
| **Testimony Invitation** | 3–5 min | Open invitation for students to share — never compelled |
| Closing prayer | 2 min | Student-led |

Total: ~50 minutes

### Ice breaker design rules
- Must connect thematically to the lesson (loosely — not a lesson pre-load)
- Must be answerable by any student regardless of church background or testimony
- Avoid: "what is your favorite scripture" (excludes low-activity youth), "who is your favorite prophet" (same issue)
- Good formats: would-you-rather with lesson-adjacent choices, two-truths-one-lie on the lesson topic, an artifact or object from the lesson story shown physically

### Chain Activity mechanic (core engagement model)
Use this mechanic for scripture reading and Q&A. It keeps all students active and prevents the teacher from talking too much.

**How it works:**
1. Teacher sets the question / task at the start of the block
2. Student A finds the scripture reference (on their phone via Church app or QR code) or answers the first part
3. Student A nominates Student B to read the verse aloud
4. Student B nominates Student C to answer a question about it
5. Student C nominates Student D for the next step
6. Repeat — teacher facilitates, clarifies, affirms, but does NOT answer questions for students

**Rules:**
- Any student can say "pass" and nominate someone else — no public pressure
- Teacher only steps in to add doctrine if the Spirit prompts or if the group is stuck
- Chain should involve at least 4–6 different students per block

### QR Code access points
For every key scripture and conference talk in the lesson, generate a Church app / Gospel Library URL. Students open these on their phones. Format:

```
Scripture: Deuteronomy 6:4–5
URL: https://www.churchofjesuschrist.org/study/scriptures/ot/deut/6?lang=eng&id=p4-p5#p4
QR: [Include this URL — teacher prints on a card or writes on board]
```

Generate QR URLs for:
- Every scripture in `sections[].scriptureRefs[]` used in the lesson plan
- All `conferenceMessages[].url` used
- Relevant `fsyConnections[].url`

---

## Step 4 — Generate engagement activities

For each major lesson section, generate **at least one activity** from each category below. Tag every activity with:
- `type`: icebreaker | chain | reflection | game | discussion | creative
- `level`: L1 (factual) | L2 (understanding) | L3 (application) | L4 (testimony)
- `duration`: estimated minutes
- `materials`: what is needed (prefer phone-based or zero-materials)
- `compliance`: PASS | REVIEW + note

**Intellectual level guide — design activities that work across all levels simultaneously:**

| Level | Description | How to include |
|-------|-------------|----------------|
| L1 — Discovering | Can find the answer by reading the scripture | Include at least one "find it in the verse" step in every chain activity |
| L2 — Understanding | Can explain what the scripture means | Always ask "what does this teach us about God?" after reading |
| L3 — Applying | Can connect it to their daily life | Always ask "when might you use this?" or "how does this affect your choices?" |
| L4 — Deepening | Can share personal witness or experience | Always close with an open invitation: "Would anyone like to share how this has been true for you?" |

L4 invitations are always optional and never compelled. L1–L3 questions should be answerable without a testimony.

### Activity formats to prioritize

**Memory / Matching game** (works well for this age)
- Cards with scripture reference on one side, key phrase or image on the other
- Pairs or teams race to match
- After match is found: chain activity — finder reads the verse, assigns someone to explain it

**Scripture scavenger hunt** (phone-based)
- Give students a question that requires them to search the scriptures on their phone
- First to find it reads it; then chain continues
- Works well with FSY connections: "Find a place in the FSY that says the same thing as Deuteronomy 6:5"

**Heart / Outside the heart** (from this lesson)
- Draw a large heart on the board
- Ask students to call out things the Lord says we should HAVE in our hearts vs. keep OUT
- Write responses inside/outside — multi-level, visual, kinesthetic, generates discussion naturally

**Two-source comparison**
- Give half the class Deuteronomy 6:5 (phone), other half the AP Quorum Theme text
- Ask: "What do these have in common?" without telling them
- Works for both genders — the AP theme resonates with young men, Deuteronomy resonates with everyone

**Covenant map**
- Students draw a line from a scripture reference to its modern equivalent (Mosiah 18, D&C 20, temple covenants)
- Works as a handout or phone-based activity
- Connects children's lesson scriptures to their own covenant experience

---

## Step 5 — Generate game questions (Family Feud format)

Generate questions for the Family Feud game that:
1. Are drawn from the lesson's scriptures, sections, FSY connections, and Youth Theme connections
2. Are appropriate for 13–16 year olds (clear language, no adult-context assumptions)
3. Cover all three question types — generate at least 2 of each type

For each question, produce the full game-ready object:
```json
{
  "question": "...",
  "type": "scripture_based | scripture_application | family_feud",
  "source": "Section title or scripture reference this came from",
  "verseText": "Quoted verse text from lesson JSON verseText field (null for family_feud)",
  "url": "https://www.churchofjesuschrist.org/... (scripture or talk link, null for family_feud)",
  "youthThemeConnection": "AP Theme | YW Theme | Annual | null",
  "fsyConnection": "Chapter N: title | null",
  "complianceCheck": "PASS | REVIEW: reason",
  "answers": [
    { "text": "...", "points": 40 },
    { "text": "...", "points": 30 },
    { "text": "...", "points": 20 },
    { "text": "...", "points": 10 }
  ]
}
```

**Question generation rules:**
- Scripture-based: use `verseText` from the lesson JSON to quote the verse verbatim. If `verseText` is null, quote from memory. Ask a factual question about what it says. 4 answers.
- Scripture application: quote `verseText` verbatim, ask how that principle applies to youth today. 4 answers. Must be answerable by any youth regardless of testimony level.
- Family Feud: survey-style ("Name something…", "Name a way…"). 4–6 answers. Answers should be real things youth actually do or experience — not idealized church answers only.
- At least one question must directly reference the AP Quorum Theme or YW Theme if HIGH relevance phrases were found
- At least one question must use a FSY connection if a chapter scored ≥ 5 relevance
- No question may publicly expose personal struggles or require a testimony to answer
- Include `verseText` and `url` in the output JSON for every scripture-based or application question

**Quality check before including a question:**
- Would a non-member youth be able to participate? (If no, add a "scaffold" note)
- Does it connect back to Jesus Christ?
- Is it interesting enough that students want to know the answers?
- Is it clear and unambiguous?

---

## Step 6 — Output all artifacts

Output the following sections clearly. Save where noted.

---

### ARTIFACT 1: Compliance Report

```
COMPLIANCE CHECK — <lesson title>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Handbook §13 — Class structure compliant
✅ Two-adult rule — no solo activities proposed
[List any ⚠️ REVIEW items with suggested rewording]
```

---

### ARTIFACT 2: Lesson Plan (50 minutes)

Format as a teacher-facing doc:

```
LESSON PLAN — <title>
Week: <weekLabel>
Assigned Reading: <lessonScriptures>
Lesson Data: lesson-database/<lessonId>.json

━━━ OPENING (2 min) ━━━━━━━━━━━━━━━━━━━━
Opening prayer (student-led — rotate)

━━━ ICE BREAKER (X min) ━━━━━━━━━━━━━━━━
Activity: <name>
What to do: <instructions>
Bridge question: <one question connecting this to the lesson>

━━━ SCRIPTURE BLOCK 1 (X min) ━━━━━━━━━━
Focus: <section title>
Scripture(s): <refs with QR URLs>
Chain Activity:
  Teacher: <setup prompt>
  Step 1: [Student finds/reads X] → nominates next
  Step 2: [Student reads aloud] → nominates next
  Step 3: [Student answers: "...?"] → nominates next
  Step 4: [Teacher affirm/clarify if needed]
L1 anchor: <factual question>
L2 anchor: <meaning question>
L3 anchor: <application question>
L4 invitation: <optional share prompt>

[Repeat for Block 2]

━━━ APPLICATION ACTIVITY (X min) ━━━━━━
Activity: <name>
Type: <game|reflection|creative|discussion>
Instructions: <step by step>
Youth Theme tie-in: <AP/YW phrase connection>
FSY tie-in: <chapter and phrase>

━━━ TESTIMONY INVITATION (X min) ━━━━━━
Open prompt (always optional): "<question>"
Teacher can share brief personal witness if Spirit prompts.

━━━ CLOSING (2 min) ━━━━━━━━━━━━━━━━━━━
Closing prayer (student-led — rotate)
```

---

### ARTIFACT 3: Engagement Activity Bank

List all generated activities in a table:

| # | Activity | Type | Level | Duration | Materials | Compliance |
|---|----------|------|-------|----------|-----------|------------|
| 1 | | | | | | |

Then full instructions for each.

---

### ARTIFACT 4: QR Code Access Points

```
Scripture / Resource          URL (for QR code or Church app)
──────────────────────────────────────────────────────────────
<scripture ref>               <URL>
<conference talk title>       <URL>
<FSY chapter>                 <URL>
```

---

### ARTIFACT 5: Game Questions (Family Feud)

Output the full JSON array ready to paste into the Teacher Portal. Also show each question in a human-readable preview:

```
Q1 [scripture_based] — <source>
"<question text>"
  40 pts: <answer>
  30 pts: <answer>
  20 pts: <answer>
  10 pts: <answer>
Youth Theme: <connection or none>
FSY: <connection or none>
Compliance: PASS
```

---

### ARTIFACT 6: Mindmap Teaching Layer

Append to the existing lesson mindmap file (`lesson-database/<lessonId>-mindmap.md`) a new section:

```markdown
## Teaching Plan Layer

| Block | Activity | Scripture | Level |
|-------|----------|-----------|-------|
| Ice Breaker | <name> | <none or loose> | L1–L2 |
| Block 1 | Chain: <description> | <refs> | L1–L3 |
| Block 2 | Chain: <description> | <refs> | L1–L3 |
| Application | <activity name> | <refs> | L2–L4 |
| Testimony | Open invitation | <refs> | L4 |
```

---

## Step 7 — Final output summary

After all artifacts are displayed, print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  YOUTH LEADER OUTPUT — <lesson title>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Compliance: <PASS or N items to review>
📋 Lesson Plan: 50 min, <N> blocks, <N> activities
🎮 Game Questions: <N> questions (<N> scripture_based, <N> application, <N> family_feud)
📱 QR Codes: <N> scripture links, <N> conference talks, <N> FSY chapters
🗺  Mindmap updated: lesson-database/<lessonId>-mindmap.md

Next steps:
• Load game questions into Teacher Portal: npm run dev → Teacher Portal → From URL or Manual
• Print QR code cards for each scripture access point
• Review ⚠️ compliance items before class
```

Then ask: "Would you like me to generate the QR code cards as printable HTML, or export the game questions directly to Firestore?"

---

## Reference constants (always apply)

**Handbook class structure:** 50 minutes · 1st and 3rd Sundays · begin and end with prayer · 2+ adults present

**Teaching in the Savior's Way core:** Jesus Christ is the subject of every lesson · students teach more than the teacher · Spirit is the real teacher

**Intellectual levels:** L1 factual (find it) → L2 meaning (understand it) → L3 application (live it) → L4 testimony (witness it) — design every block to work at L1–L3, invite L4 without requiring it

**Chain activity:** Student finds → nominates reader → reader nominates answerer → answerer nominates next → teacher facilitates only

**No PowerPoint.** Physical cards, writing on board, phones, objects, student-held papers — anything but slides.

**Phone scripture access:** Always give the Gospel Library URL so students can open scriptures on phones. Normalise phone use as a gospel learning tool.

---

## Compliance metadata contract (REQUIRED output field)

The game questions JSON you emit for the Teacher Portal MUST include a top-level `complianceReport` object so the UI can surface the result without re-auditing. Shape:

```json
{
  "complianceReport": {
    "version": "youth-leader-v2",
    "policyRefs": ["Handbook §13", "Handbook §37.8", "Teaching in the Savior's Way", "For the Strength of Youth"],
    "structural": {
      "itemCount": 8,
      "passCount": 8,
      "reviewCount": 0,
      "findings": []
    },
    "christConnectionCoverage": 1.0,
    "scriptureCoverage": 1.0,
    "overall": "PASS"
  }
}
```

- Every `round` must independently carry `complianceCheck: "PASS" | "REVIEW: <reason>"`.
- Every `round` must carry `christConnection` (one sentence) and `type` (`scripture_based` | `scripture_application` | `family_feud`).
- Every scripture-typed round must carry `verseText` (verbatim KJV) and `url` (Gospel Library).
- URLs must be on `churchofjesuschrist.org`, `media.churchofjesuschrist.org`, or `speeches.byu.edu`.
- After emitting the JSON, invoke the `lesson-reviewer` agent against it and include its verdict in the mindmap output. Do NOT declare the lesson plan "ready for the Teacher Portal" without that sign-off.
- If ANY item hits an instant-block trigger (substances, sexual content, personal-exposure traps), regenerate — do not rewrite in place.
