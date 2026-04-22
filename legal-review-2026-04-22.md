# Kindred — Legal / Trademark / Copyright Risk Inventory
*Assessment date: 2026-04-22 · Assessed by: general-purpose research agent · **NOT legal advice***

## Executive summary

1. **The product reproduces Church scripture text and lesson-page structure, at scale, on a commercial hosting plan, and reproduces Church policy-document names directly in the UI.** The Church's IP Office (https://www.churchofjesuschrist.org/legal/intellectual-property) grants only limited, personal, non-commercial use; the product's current distribution model (Vercel, public self-serve target) is unlikely to fall inside that grant. This is the single biggest issue to resolve before broadening access.
2. **"Kindred" is a heavily-occupied trademark in education and software classes** and will need a real clearance search before any brand spend, domain purchase, or logo investment. "Common Ground" and "Scripture Scout" are similarly generic and each need clearance in Class 9 / Class 41.
3. **Family Feud residue is still in the production codebase, not just the archive.** `api/generate-questions.js` line 57 literally tells the LLM "You are a Family Feud question writer," and `api/_lib/pipeline.js` line 627 includes the signature phrase "We surveyed 100 LDS youth…". Renaming the surface UI was not enough; Fremantle could cite the prompt strings and generated output as trade-dress copying.
4. **The product has no privacy policy, no terms of use, no cookie notice, no data-processing disclosure, and no account/age disclosures anywhere.** Firestore collects teacher email, name, calling, country, and ward — i.e., enough to trigger GDPR (UK, EU) and CCPA/CPRA (California) duties the moment a non-US teacher signs up. The signup form already offers UK, AU, NZ, Brazil, Mexico, Philippines as country choices.
5. **The "✓ Compliant — Handbook §13 / §37.8 / Teaching in the Savior's Way / For the Strength of Youth" badge and the footer tag "LDS Youth Platform" together create a material false-association / implied-endorsement risk under Lanham §43(a).** The Church has not reviewed or approved anything, yet the landing page displays policy references as if they had. This is independent of the trademark analysis below and is the single risk most likely to produce a cease-and-desist from the Church's IP office.

---

## Section 1 — Trademark

### 1.1 "Kindred" brand name
- **Issue**: "Kindred" is used as a product name in Class 41 (education / entertainment services) and Class 9 (downloadable software) contexts without any clearance record in the repo.
- **Severity**: Medium–High
- **Rationale**: "Kindred" is a commonly-used registered mark across education, social, healthcare, and media categories. A cursory USPTO TESS (https://tmsearch.uspto.gov/search/search-information) query will return numerous live marks for "Kindred" — including healthcare (Kindred Healthcare), publishing, and software. Church-youth distribution narrows the likelihood of confusion somewhat but does not eliminate it, especially if monetization/ads appear later. If the plan is international rollout, add EUIPO (https://euipo.europa.eu), UKIPO, IP Australia, and CIPO to the search.
- **What to ask an attorney**: "Given our intended Class 9 / Class 41 use in the US + UK + AU + NZ + CA + BR + MX + PH, run a full clearance on 'Kindred,' 'Kindred Youth,' and 'Kindred — Youth Learning Together' and tell us the top three conflicting live marks. If conflicts exist, suggest three alternative names that survive the same clearance."

### 1.2 "Common Ground" game title
- **Issue**: Generic phrase, widely used in games, media, non-profits, and apps. Rename from "Family Feud" was correct, but "Common Ground" itself is not obviously clear.
- **Severity**: Medium
- **Rationale**: The phrase is already a registered board game mark in at least the UK and has been used as a podcast title, training product, and TV show. Not an obvious conflict in the youth-ministry niche, but needs a real search before the brand is cemented.
- **What to ask an attorney**: "Is 'Common Ground' clear for use as a game-product title in Class 9 / Class 41 in our target jurisdictions, and do we have any residual dress/look-and-feel exposure from Fremantle given the rules mirror Family Feud (two teams, strikes, steal, scoring pyramid 40/30/20/10)?"
- **Related trade-dress point**: the pipeline prompt at `api/_lib/pipeline.js:627` and `api/generate-questions.js:57–69` still embeds the iconic Fremantle survey-format language ("Family Feud question writer", "We surveyed 100 LDS youth…"). Fremantle enforces aggressively against Family Feud clones; these strings would be the first exhibit in any complaint. They need to be removed from the code, not only the UI.

### 1.3 "Scripture Scout"
- **Issue**: Unknown clearance status.
- **Severity**: Medium
- **Rationale**: "Scripture Scout" is not famous but is not unique — there are Scripture-themed apps, children's characters, and YouTube channels using that phrase or minor variants. There is also the separate question of whether "Scout" brings any Boy Scouts of America / Scouting Ireland / World Scout Bureau association, since BSA holds strong rights in the word "Scout" in youth-education contexts. The product is LDS-adjacent, which is historically linked with scouting in the US; that proximity may raise BSA's temperature.
- **What to ask an attorney**: "Clear 'Scripture Scout' in Class 9 / Class 41. Separately, does our use of 'Scout' in a youth-education/LDS context create any Boy Scouts of America mark concerns — BSA has asserted 'Scout' rights broadly?"

### 1.4 Church of Jesus Christ of Latter-day Saints marks used literally in the product
- **Issue**: The product places Church-owned trademarks directly in UI text, compliance badges, and marketing copy without any endorsement, license, or disclaimer.

  Concrete instances found in the code:
  - `index.html:954, 1058, 1094, 1100, 1113, 1154` — "Come Follow Me" used as a product feature label on the public landing page. "Come Follow Me" is a Church program name.
  - `index.html:1177, 1189–1192` — "Handbook §13," "Handbook §37.8," "Teaching in the Savior's Way," "For the Strength of Youth" shown as compliance-reference chips on the landing page.
  - `index.html:1218, 1377` — "Built for LDS Sunday School youth" and "LDS Youth Platform" in the footer.
  - `admin.html:900, 932, 2317, 2323, 2328` — "Come Follow Me" in admin UI button labels and confirmation dialogs.
  - `games/memory.html:500`, `games/common-ground.html:387` — "Pick a 2026 Come Follow Me lesson" in the Teacher Portal.
  - `api/_lib/pipeline.js:494, 552, 603, 540–548, 625–627` — server prompts refer to "LDS youth," "Come Follow Me," and the Handbook/FSY rubric.
  - `api/generate-questions.js:15, 36, 47, 51, 57` — "LDS youth Sunday School class (ages 14–16)" in every prompt.

- **Severity**: High
- **Rationale**: The Church's IP policy (https://www.churchofjesuschrist.org/legal/intellectual-property-policy) explicitly lists "Come Follow Me," "For the Strength of Youth," "Teaching in the Savior's Way," "Latter-day Saints," "LDS," the "Church of Jesus Christ of Latter-day Saints" wordmark, and the Angel Moroni symbol as protected marks. The policy restricts commercial/third-party use of these marks even in descriptive contexts when they could suggest sponsorship or affiliation. A product literally named, branded, and marketed around these marks — including putting policy citations on the landing page as trust signals — is a plain implied-endorsement fact pattern.
- **What to ask an attorney**: "We want to describe our tool as 'built for teachers of Come Follow Me' without implying sponsorship. (a) Is that defensible under nominative fair use, or do we need an express license from the Church IP Office? (b) What disclaimer language would be sufficient — 'Not affiliated with or endorsed by The Church of Jesus Christ of Latter-day Saints' placed where? (c) Do we need to remove 'LDS' and 'Latter-day Saints' from the product name and footer? (d) Do we need to remove the Handbook §13 / §37.8 / FSY references from the landing page entirely, or can we refactor them as internal-only policy references?"

### 1.5 Implied endorsement / Lanham §43(a) false association
- **Issue**: Landing page design communicates Church-program branding: the cadence "Built for LDS Sunday School youth," the "Compliance" section listing four Church policy documents, and the screenshots showing Deuteronomy verses on a classroom TV combine to present the product as a Church-approved or Church-endorsed platform when it is not.
- **Severity**: High
- **Rationale**: Lanham §43(a) (15 U.S.C. §1125(a)) covers false designations of origin and false suggestion of affiliation/endorsement. The Church has a well-documented history of enforcing this posture against third-party products that appear to claim official status; recent disputes with "OnwardLDS," "Mormon Stories" merchandise, and multiple Etsy sellers are public. Showing a "COMPLIANT" badge next to Church policy references is the aggravating factor — it represents to teachers that content has been cleared against Church policy, which is factually a claim about Church standards even though no Church body has audited it.
- **What to ask an attorney**: "Does the current landing page create an implied-endorsement risk sufficient for the Church IP office to demand a name change or takedown, and what rewrite of the trust section (currently `index.html:1164–1194`) would eliminate that risk while keeping the useful signal to teachers?"

### 1.6 Family Feud trade-dress residue
- **Issue**: The visible renames (Common Ground / Scripture Scout) are correct, but trade-dress elements remain in code and mechanics.
- **Severity**: Medium
- **Rationale**: Fremantle's enforcement posture against Family Feud clones is aggressive. The production pipeline code still (a) instructs the LLM to write as a "Family Feud question writer" (`api/generate-questions.js:57`), (b) generates output with the signature "We surveyed 100 LDS youth…" phrasing (`api/_lib/pipeline.js:627`, `api/generate-questions.js:69`), (c) uses the 40/30/20/10 and 38/22/14/10/9/7 Family Feud point pyramids, and (d) uses "strike / steal / switch-play" terminology lifted verbatim from the show. Internally the repo is still named `FamilyFeud` and the user-agent string sent to churchofjesuschrist.org is `Mozilla/5.0 (FamilyFeudApp/1.0)` (`api/fetch-content.js:20`, `vite.config.js:115`) — an external observer, including a Church server log, can trivially identify the clone origin.
- **What to ask an attorney**: "Beyond the name change, what specific Fremantle trade-dress elements (visual, mechanical, verbal) do we need to change to reduce the Family Feud claim surface, and is rewording 'We surveyed 100 LDS youth' and removing 'Family Feud question writer' from server prompts sufficient?"

---

## Section 2 — Copyright & Church content

### 2.1 Scripture verse text reproduction — volumes themselves
- **Issue**: The product reproduces verbatim scripture text from the KJV Old/New Testament, the Book of Mormon, Doctrine and Covenants, and Pearl of Great Price in game cards, monitor displays, pipeline outputs, and the Firestore `lessonLibrary`.
- **Severity**: Low (on the texts themselves) — but see 2.2.
- **Rationale**:
  - **KJV**: public domain in the US. In the UK, the Crown holds a perpetual "Crown copyright/letters patent" restricting printing of the KJV, but this is a UK-only issue and is not enforced against ordinary digital quotation.
  - **Book of Mormon (1830)**, **Pearl of Great Price (compiled 1851; canonized 1880)**, and the **Doctrine and Covenants core sections (pre-1923)** are in US public domain because first publication predates 1929. D&C Official Declarations 1 (1890) and 2 (1978) are both pre-1929 and post-1923 respectively — OD2 is technically post-1923, but courts have treated the Church's foundational canonical text as in the public domain for practical purposes.
  - **Footnotes, chapter headings, study helps, the "LDS Edition" chapter organization, and the Bible Dictionary** inside Gospel Library are **separately copyrighted** by Intellectual Reserve, Inc. Do not reproduce those.
- **What to ask an attorney**: "Confirm that the standard works in their base text form are public domain in all our target jurisdictions, and identify which paratext elements (chapter headings, footnotes, study helps, topical guide, Bible Dictionary) are copyrighted by Intellectual Reserve and therefore cannot be reproduced in our cards or pipeline output."

### 2.2 Fetching, scraping, and re-serving `churchofjesuschrist.org` lesson pages
- **Issue**: The `lesson-pipeline` (`api/_lib/pipeline.js:52–69`) fetches Come Follow Me lesson pages on server request, strips HTML, pulls out scripture reference lists, discussion questions, and talk/video links, and stores a reworked version in Firestore `lessonLibrary` for re-serving to teachers. The `api/fetch-content.js` endpoint (still wired to `admin.html:2162`) does the same for arbitrary URLs with no host allowlist at all.
- **Severity**: High
- **Rationale**:
  - Church Terms of Use (https://www.churchofjesuschrist.org/legal/terms-of-use) restrict users to "personal, noncommercial" use and "as otherwise permitted by the fair use provisions of the United States copyright law."
  - Church IP policy (https://www.churchofjesuschrist.org/legal/intellectual-property-policy) permits quoting limited amounts of Church material for personal, non-commercial, classroom use, but explicitly requires permission for republication, commercial use, or distribution beyond those contexts.
  - Kindred fetches entire lesson pages, stores derivative JSON copies, and re-serves them through a platform distributed on commercial infrastructure (Vercel) with a future monetization path implied by the "validate AI costs" language in the hero. Even if Kindred stays free, commercial hosting plus multi-classroom re-distribution puts it clearly outside "personal, non-commercial classroom use."
  - The **discussion questions**, **topic organization**, and **weekly cadence** of the Come Follow Me manual are creative selection/arrangement that attract their own copyright (per Feist-line cases). The pipeline lifts these and hands them to the LLM as direct inputs, producing output that is a derivative work of the Come Follow Me manual.
  - The user-agent header `KindredYouth/1.0 lesson-pipeline` (`api/_lib/pipeline.js:57`) identifies you in Church server logs — they can see every fetch.
  - `api/fetch-content.js` has NO allowlist and scrapes arbitrary HTML on teacher command. That widens the copyright exposure to any site a teacher pastes, not just Church content.
- **What to ask an attorney**: "We fetch churchofjesuschrist.org lesson pages server-side and store structured derivatives. Three questions: (a) Is this fair use under §107 given our non-profit/classroom posture, or does the commercial hosting cross the line? (b) What contact at the Church IP office should we approach for an express written license? (c) If no license is possible, is there a 'thin' redesign — e.g., teachers paste the URL client-side, we never fetch or store, we only ask the LLM to generate questions using its own training knowledge of the KJV — that would remove the scraping exposure entirely?"

### 2.3 "Quote verseText verbatim from your knowledge of the KJV/standard works" — LLM as source
- **Issue**: The pipeline prompt at `api/_lib/pipeline.js:510` and `:535` asks Claude to "quote the actual verse text verbatim from your knowledge of the KJV scriptures and LDS standard works" — i.e., the text is emitted from the model's training weights, not scraped from the Church site.
- **Severity**: Low–Medium
- **Rationale**:
  - On the KJV and pre-1929 Church canon, model-emitted text is reproducing public-domain content. That's clean.
  - Risk #1: models frequently misquote scripture, and mislabelled model output carrying the "✓ Compliant" badge and being displayed on a classroom TV with a Handbook citation raises a defamation/misrepresentation tail — see §4.1.
  - Risk #2: if the model ever emits copyrighted paratext (e.g., an LDS Edition chapter heading, a Bible Dictionary snippet, or a conference-talk paragraph), the platform is redistributing it, not the Church. The "churchofjesuschrist.org-adjacent" disclosure means it probably came from Church sources ingested into the model.
- **What to ask an attorney**: "If Claude occasionally emits copyrighted Church paratext (chapter headings, study helps, conference-talk passages) and we publish it in teacher-facing Firestore content, where does liability sit between Anthropic, Kindred, and the teacher under a DMCA §512(c) analysis?"

### 2.4 Church video embedding / deep-linking
- **Issue**: The pipeline extracts video links from lesson pages (`api/_lib/pipeline.js:226–233`) and the allowlist explicitly includes `media.churchofjesuschrist.org` for output URLs. Youth may also be shown `daily-bread-*.mp4` files in the archive. The CLAUDE.md notes `.mp4` files up to 287MB were gitignored.
- **Severity**: Low (deep-linking) / Medium (local mp4 copies)
- **Rationale**:
  - Deep-linking to `media.churchofjesuschrist.org` — i.e., letting a teacher click a link and play the video on the Church's own servers — is generally permissible under the Church's Terms of Use and is analogous to embedding a YouTube video. Low risk.
  - But `archive/Exodus Matching Game/*.mp4` files are **local copies of Church-produced videos** (`daily-bread-pattern-eng-1080p.mp4`, `daily-bread-change-eng-1080p.mp4`, `daily-restoration.mp4`). These are copyrighted by Intellectual Reserve. Even though they are gitignored and not wired into the build, they sit in an `archive/` directory inside a production repo that is about to be public — redistribution of those files (e.g., by someone cloning the repo with LFS, or by accident during a deploy) is straight copyright infringement.
- **What to ask an attorney**: "Can we deep-link to `media.churchofjesuschrist.org/video/...` URLs inside a commercial teacher portal without permission? And what do we do with the local `.mp4` copies in `archive/Exodus Matching Game/` — delete them entirely, or are they safe because they are gitignored and never served?"

### 2.5 Audio assets (flip, match, mismatch, win, klaxon, sabotage `.mp3`)
- **Issue**: The `.mp3` files in `archive/Exodus Matching Game/` are described in CLAUDE.md as "the ones the Gemini version used" and are flagged for future migration to `public/audio/` under OPUS-017. Provenance is undocumented.
- **Severity**: Medium — if they ever ship in `public/audio/`. Low while they stay in archive.
- **Rationale**: "Klaxon" in particular is a signature Family Feud strike sound; if it is actually lifted from the TV show it's direct infringement of Fremantle's audio mark / sound recording. The other sounds could be stock, AI-generated, or lifted from the original Exodus game. Without provenance documentation — vendor, license, transaction ID — there is no way to defend shipping any of them.
- **What to ask an attorney**: Not one for the attorney yet — this is a **sourcing diligence question** the owner needs to resolve internally before OPUS-017 ships. For each `.mp3` file, either (a) produce a purchase receipt or license text, (b) replace with an explicitly-licensed audio-library equivalent (Epidemic Sound, Pond5, Freesound CC0), or (c) generate new sounds from scratch. Do not ship any `.mp3` file whose provenance is "I think Gemini made it."

### 2.6 Marketing claims on the landing page
- **Issue**: Copy on `index.html` makes assertions that are partly unsupported.
- **Severity**: Low–Medium
- **Rationale**: Three specific lines to flag:
  - `index.html:1057` — "Default Exodus pack ships immediately — no setup required." Fine.
  - `index.html:955` — "turns a Come Follow Me lesson URL into a classroom-ready, scripture-anchored game in under a minute." The "under a minute" claim is a timed assertion and could attract FTC advertising-substantiation scrutiny if the actual p95 is multi-minute; the pipeline comment at `api/_lib/pipeline.js:435–439` acknowledges calls "can legitimately take 90–120s" just for one step, and the full pipeline runs two Claude calls plus a safety review. Under-a-minute is aspirational, not typical.
  - `index.html:1200–1201` — "We're in an invite-only pilot while we validate AI costs and complete legal review for broader distribution." This is actually a helpful admission — it frames current exposure as pilot-scale. Keep that framing until the legal review is done.
- **What to ask an attorney**: "Before we remove 'INVITE-ONLY PILOT' and move to self-serve, do any of the landing-page claims — 'under a minute,' 'every match,' 'compliant,' 'built for LDS youth,' 'Handbook §13 / §37.8 / Teaching in the Savior's Way / For the Strength of Youth' — need to be reworded to avoid (a) FTC advertising-substantiation exposure and (b) Church endorsement implication?"

---

## Section 3 — Privacy & youth data

### 3.1 No privacy policy, no terms of use, no data-processing disclosure
- **Issue**: There is zero privacy/ToS/cookie/consent surface anywhere in the product. A full-repo grep returns no matches for "privacy policy," "terms of service," "terms of use," "cookie," or any parental-consent language.
- **Severity**: High
- **Rationale**:
  - In the US, the FTC treats the absence of a privacy notice on a site that collects identifiable information as per se unfair/deceptive under §5 of the FTC Act.
  - California CCPA/CPRA (Cal. Civ. Code §1798.100 et seq.) requires a privacy notice at or before collection for any California consumer. The moment any signed-in teacher is a California resident, Kindred is subject.
  - GDPR Art. 13/14 requires the same for any data subject in the EU/EEA/UK. The signup country dropdown already offers UK.
  - Firebase itself requires the developer to provide privacy disclosures for any data stored through its service (Firebase terms §3, https://firebase.google.com/terms).
  - Google Sign-In (OAuth) requires an OAuth consent screen that references a published privacy policy; without one, Google may suspend the OAuth client under its Limited Use requirements.
- **What to ask an attorney**: "Draft a privacy policy, terms of use, and DPA-ready data-processing disclosure covering: (a) the data we actually collect (teacher Google profile — email, display name, picture URL — plus calling, country, ward name, classroom name, and generated content derived from Church lesson pages); (b) that we use Firebase (Google) + Anthropic Claude as sub-processors; (c) that we do not collect student data, do not use student PII, and that students use anonymous Firebase auth; (d) our stance on teacher-entered data about third parties (co-teacher names, student team names if a teacher ever types a real name)."

### 3.2 Students age 13–16 — US youth privacy regime
- **Issue**: Players are all under 18. Per CLAUDE.md line 4, target age is 14–16; the landing page says 13–16.
- **Severity**: Medium
- **Rationale**:
  - **COPPA (15 U.S.C. §6501 et seq., 16 CFR Part 312)** covers under-13. Students in this product are explicitly 14+, so COPPA *directly* does not apply. The architecture (anonymous Firebase auth, team names only, no student PII) is already aligned with COPPA even though it's out of scope. Keep that architecture.
  - **California AADC (AB 2273, Cal. Civ. Code §1798.99.28 et seq., effective 2024)** applies to online services "likely to be accessed by children" (under 18) and requires age-appropriate design, data minimization, and a Data Protection Impact Assessment. Kindred is explicitly marketed to a 13–16 audience, so it squarely qualifies. Enforcement is currently tangled in 9th Circuit litigation (NetChoice v. Bonta) but the statute is live.
  - **Utah Social Media Regulation Act (HB 311 as amended)** targets "social media platforms" (user-to-user content). Kindred is a classroom display, not a social platform, so it's unlikely to be in scope.
  - **Florida HB 3 (2024)** restricts under-14 accounts on social platforms — same analysis as Utah, probably out of scope.
  - **FTC's COPPA amendments (January 2025)** extended notice/consent-style protections in some knowing-teen-data cases; the architecture here (no student account, no student identifier) should stay clean.
- **What to ask an attorney**: "We market to 13–16 year-olds but do not collect any identifying information about students — they never log in, never type their names, play via a classroom TV. Can we rely on that architecture alone to stay out of COPPA, California AADC, and Utah/Florida youth-social-media laws, or do we still need (a) a minor-appropriate design DPIA, (b) the AADC disclosures, (c) an age-appropriate design framework document that a school or ward could audit?"

### 3.3 International distribution / youth-data regimes
- **Issue**: The signup country selector offers US, CA, MX, GB, AU, NZ, BR, PH, and "Other." Each jurisdiction adds duties.
- **Severity**: High at scale, Medium today.
- **Rationale**:
  - **UK Age-Appropriate Design Code** ("Children's Code," ICO, 2021) — applies to any online service likely to be accessed by children in the UK. Requires 15 specific standards including default high-privacy settings, DPIAs, minimum data, no nudge patterns. Enforced by ICO.
  - **UK/EU GDPR Art. 8** — age of consent for data processing is 13 in UK, 16 in several EU states (Germany, France 15). Teacher is the controller for classroom use, but the platform is still a processor/controller depending on architecture.
  - **Brazil LGPD (Lei 13.709/2018) Art. 14** — children's data requires "specific and prominent" parental consent; Art. 14 has been read aggressively by the ANPD. The country dropdown invites Brazil signups with no LGPD posture.
  - **Canada PIPEDA + Quebec Law 25** — Law 25 (in force 2023) specifically enhances consent rules for under-14 processing.
  - **Australia Privacy Act 1988 + APPs** — Australia is mid-reform (2024–26 amendments). The new Children's Online Privacy Code is expected.
  - **Philippines Data Privacy Act (RA 10173)** — minors require parental consent.
- **What to ask an attorney**: "If we ship self-serve to UK, AU, CA, BR, PH (currently in our signup dropdown), which jurisdictions would force non-trivial product changes — e.g., DPIA, regional data residency, parental consent UI, data-subject-access-request endpoints — before launch? Is a phased rollout (US only first, then add one country at a time with localized privacy notices) the right sequencing?"

### 3.4 Teacher data stored in Firestore
- **Issue**: Firestore stores teacher email, name, calling (a religious/political affiliation proxy), country, ward/branch name (a location/church-membership proxy), and classroom name. See `admin.html:1177–1196` and `index.html:1691–1701`.
- **Severity**: Medium
- **Rationale**:
  - "Calling" and "ward" together effectively identify the teacher's religious membership. Under GDPR Art. 9 this is **"special category data"** (religious belief) requiring explicit consent and additional safeguards.
  - Firestore `nam5 (United States)` location means EU/UK data is transferred to the US — needs either an adequacy mechanism (US-EU Data Privacy Framework if you self-certify) or SCCs.
  - A teacher's Google profile photo URL (returned by Google Sign-In) is also personal data.
  - Firestore security rules as documented ("authenticated users can read/write `/artifacts/{appId}/public/**`") need a careful look — the `public/` path combined with anonymous auth (for players) could let any signed-in game player read teacher metadata. Worth confirming with the attorney but more importantly worth confirming in a Firestore rules audit.
- **What to ask an attorney**: "We collect teachers' religious calling and ward/branch name. Under GDPR Art. 9 and equivalent laws, that is special-category data (religious belief). What explicit-consent UI do we need at signup, and should we make those fields optional with a 'prefer not to say' default?"

### 3.5 QR codes linking students to churchofjesuschrist.org
- **Issue**: The Scripture Scout match modal renders a QR code to the scripture's Gospel Library URL. Students scan with personal phones.
- **Severity**: Low
- **Rationale**:
  - Kindred does not capture the scan, does not know who scanned, does not instrument the destination. A QR code is a printed URL — no data leaves the classroom toward Kindred.
  - After the scan, the student is on churchofjesuschrist.org, which has its own privacy policy. The student's data goes to the Church, not Kindred.
  - The only residual concern: a privacy-policy transparency requirement ("we surface third-party links in game play; those third parties have their own policies") — easy to address in the TOS.
- **What to ask an attorney**: No material risk here. Just add a line to the privacy policy noting that QR codes surface third-party (Gospel Library) URLs.

### 3.6 FERPA
- **Issue**: Sunday School is not a FERPA-covered education context.
- **Severity**: N/A
- **Rationale**: FERPA applies to schools receiving federal education funding. LDS Sunday School classrooms are not within scope. No action needed unless Kindred is later adopted by a FERPA-covered school.

---

## Section 4 — AI-generated content

### 4.1 Doctrinal errors in generated questions
- **Issue**: Claude writes scripture-application questions, Christ-connection sentences, and survey-format "Name something LDS youth…" rounds. Errors are inevitable.
- **Severity**: Medium
- **Rationale**:
  - An AI-written Christ connection that misrepresents LDS doctrine (e.g., conflates LDS doctrine with mainstream Protestant positions) could embarrass the teacher, misinform the youth, and generate reputational harm for the Church or the teacher personally.
  - Under US law, a platform generally has no tort duty for pure AI content unless it (a) markets the AI output as verified/approved or (b) fails to warn users that content is AI-generated. Kindred currently does both things on the wrong side — it markets output as "✓ Compliant" with Handbook/FSY citations, and the AI-generation disclosure is minimal.
  - Defamation / product-liability theories for AI-generated religious content are still developing (see e.g., Walters v. OpenAI, pending). The safe harbor is a visible AI disclosure plus a "teacher reviews before classroom use" attestation.
- **What to ask an attorney**: "(a) What disclaimer language — on every lesson-library card, in the teacher portal at generation time, and at game-launch — is enough to put the doctrinal-accuracy risk on the teacher rather than the platform? (b) Do we need a click-through teacher attestation 'I have reviewed and accept responsibility for classroom use of this generated content' each time a library entry is added?"

### 4.2 The "✓ Compliant" badge
- **Issue**: `admin.html` displays a green "✓ Compliant" / amber "⚠ Rewritten" / pink "⚠ Review required" pill against `complianceReport.overall`. Tooltip cites Handbook §13, §37.8, Teaching in the Savior's Way. The source landing page (`index.html:1102, 1119, 1129`) shows the "COMPLIANT" pill as a marketing feature.
- **Severity**: High
- **Rationale**:
  - The badge is generated by (a) a keyword regex list and (b) a second Claude pass using a prompt that names Church policy documents. **No Church authority, no attorney, no human reviewer looked at the content.** The badge represents to the teacher that the content has been audited against named Church policies.
  - This is simultaneously (i) a false-association issue (the policies are Church-owned; their presence next to "COMPLIANT" implies Church audit); (ii) a consumer-deception issue (teacher is led to believe there's a human audit gate); and (iii) a doctrinal-misrepresentation issue (if the auto-compliance is wrong and the teacher relies on it, the platform is materially responsible for the resulting classroom harm).
  - Rename the badge so it factually describes what happened. "Kindred automated-check passed" or "Keyword filter + AI safety pass: PASS" would be defensible. "Compliant" citing named Church policies is not.
- **What to ask an attorney**: "We auto-generate a 'Compliant' badge from a keyword filter plus an AI safety pass, and show it alongside references to 'Handbook §13, §37.8, Teaching in the Savior's Way, For the Strength of Youth.' (a) Is that a material misrepresentation to teachers who read the badge as a human-audit assertion? (b) Is it a Lanham §43(a) implied-endorsement problem because it invokes Church policy authority? (c) Redraft the badge label and the tooltip so it honestly describes what the pipeline did."

### 4.3 Reproducing Handbook policy text in reviewer prompts
- **Issue**: `.claude/agents/lesson-reviewer.md:10–17` and `api/_lib/pipeline.js:325` name Church policy documents and describe their content ("two-adult rule, no public shaming, mixed-gender sensitivity") in server-side prompts that are themselves shipped with the product.
- **Severity**: Low–Medium
- **Rationale**:
  - The **prompts summarize** policy in the platform's own words; they do not reproduce Handbook text verbatim. Summaries of copyrighted works are generally fair use when short and transformative, and a policy-rubric summary qualifies.
  - Risk tightens if the prompts ever include verbatim excerpts ("from Handbook §37.8, paragraph 3: …"). A quick audit of the prompts confirms they do not today — they only reference document titles and paraphrase the rule.
  - The names of Church documents are marks (see §1.4), not copyrighted works. Referring to "Handbook §13" by name is the same question as §1.4 — it's trademark/endorsement, not copyright.
- **What to ask an attorney**: "Our server prompts reference the General Handbook, Teaching in the Savior's Way, and For the Strength of Youth by name and paraphrase their rules. (a) Does this summary use clear copyright fair-use? (b) Does invoking the titles in prompts that produce user-facing content change the §1.4 implied-endorsement analysis?"

### 4.4 Content filter / safety disclaimer adequacy
- **Issue**: The pipeline has a "softening preamble" retry logic (`api/_lib/pipeline.js:428–474`) that pushes past Anthropic content-filter refusals. No disclaimers elsewhere flag that content is AI-generated.
- **Severity**: Low–Medium
- **Rationale**:
  - The softening retry is a pragmatic engineering choice but it means the pipeline actively tries to route around safety signals. On rare scriptural-violence topics (e.g., Levitical laws, massacre narratives) this is defensible; combined with the "COMPLIANT" badge, it's another weak link if content ever generates a complaint.
  - Document why the retry exists (scriptural narrative cannot always be bowdlerized) and log when it fires. Add an operator alert when the softened retry is used on a lesson that's later marked COMPLIANT, so a human can spot-check those.
- **What to ask an attorney**: Not a primary attorney question — this is a product-safety operational concern. Raise with the attorney only if the compliance-badge analysis (§4.2) produces a need for documented human review.

---

## Recommended next steps

Prioritized checklist — highest urgency first.

**Before inviting a single teacher outside the current Gmail-approved list:**

1. **Add a privacy policy, terms of use, and an AI-content disclosure page.** Link from `index.html` footer, the Google OAuth consent screen, and the admin portal. Base them on: Google sub-processor, Anthropic sub-processor, Firestore US data residency, no student data collected, teacher data retained for X months, deletion on request. An attorney should draft, but use a template (Termly, iubenda, Vanta) as a starting point.
2. **Rewrite the "COMPLIANT" badge.** Rename to "Kindred auto-check: PASS" or similar. Remove Handbook/FSY references from the pill tooltip. Move the named-policy list into an internal developer/about page, not classroom-facing chrome. (Files: `admin.html` Library tab, `index.html:1102, 1119, 1129, 1164–1194`.)
3. **Add a disclaimer line on the landing page and under every library card**: "Kindred is not affiliated with or endorsed by The Church of Jesus Christ of Latter-day Saints. Come Follow Me, For the Strength of Youth, and other Church program names are trademarks of Intellectual Reserve, Inc." Put a copy in the admin portal too. (https://www.churchofjesuschrist.org/legal/intellectual-property-policy)
4. **Strip Family Feud residue from the code, not just the UI.** Specifically:
   - `api/generate-questions.js:57` — remove "Family Feud question writer"
   - `api/_lib/pipeline.js:627` — rephrase "We surveyed 100 LDS youth…" (pick a neutral phrasing: "Ask 100 youth in a classroom poll: …")
   - `api/fetch-content.js:20` and `vite.config.js:115` — change the User-Agent string away from `FamilyFeudApp/1.0`
   - Rename the GitHub repo from `FamilyFeud` to `kindred` or `kindred-youth` once the product name is cleared.
5. **Add a host allowlist to `api/fetch-content.js`**, mirroring `api/_lib/pipeline.js`. Currently any teacher can paste any URL and the server will fetch and proxy it — that's both a copyright exposure (any site) and an SSRF exposure.
6. **Delete the Church `.mp4` files from `archive/Exodus Matching Game/`** or replace them with a `README` pointer to the `media.churchofjesuschrist.org` URLs. Do NOT push these files to a public repo.
7. **Write a one-paragraph provenance note for each `.mp3` in the archive.** If provenance cannot be documented, earmark them for replacement in OPUS-017 rather than migration.
8. **Reach out to the Church IP Office** at **ip@ChurchofJesusChrist.org** (per https://www.churchofjesuschrist.org/legal/intellectual-property-policy). Short, factual intro: "I'm a volunteer LDS Sunday School teacher building a free tool that turns Come Follow Me URLs into classroom games. We fetch lesson pages server-side and want to confirm this is permissible. If a written permission or limited license is required for us to move past invite-only distribution, please advise on the process." Get this in flight now — their response time is slow.
9. **Run a basic USPTO TESS search on "Kindred," "Common Ground," "Scripture Scout"** (https://tmsearch.uspto.gov) and EUIPO on the same terms. Record the top 10 conflicts per mark. Attorney will then do the thorough version — having a starter list shortens their meter.

**Before self-serve / broader rollout:**

10. Retain a trademark + IP attorney and pay for formal clearance on the final three names. Budget USD 1.5k–5k per mark per key jurisdiction (US/UK/EU).
11. Retain a privacy attorney to validate the privacy policy against CCPA/CPRA, UK GDPR, EU GDPR, LGPD, and the California AADC. Budget USD 2k–6k for a first draft.
12. Run a Firestore security-rules audit — specifically confirm that `/artifacts/{appId}/public/**` with authenticated anonymous auth does not leak teacher-level metadata to any player.
13. Add a teacher click-through attestation at signup ("I have read Handbook §13 and §37.8; I will review generated content before classroom use; I will not enter student PII"). This is the §37.8 documentation piece Opus47_Backlog.md already flags at lines 134–.
14. Commission a DPIA (Data Protection Impact Assessment) — required by UK AADC, and best practice for CCPA. Template available from the ICO: https://ico.org.uk/for-organisations/advice-for-small-organisations/resources/.
15. Decide on monetization posture and disclose it. "Free while we validate costs" is fine for pilot; "free forever," "donations accepted," "paid tier coming" each carry different compliance obligations (payment processor, refund policy, clear ad disclosures). The current landing page is silent on what comes after the pilot.

**Before any international launch:**

16. Remove countries from the signup dropdown that you haven't cleared: either lock to US only until the privacy attorney signs off, or complete per-jurisdiction DPIAs for UK/AU/BR/CA/PH/MX.
17. If EU/UK teachers will ever sign up, decide on EU-US Data Privacy Framework self-certification vs. SCCs, and designate a UK representative under Art. 27 UK GDPR.

---

## Open questions for the owner

These are questions only the owner can answer — an attorney will ask these first.

1. **Business structure.** Sole proprietorship? LLC? 501(c)(3)? "Religious non-profit" would meaningfully change the Church IP conversation. If no entity exists, form one before the first non-pilot signup — it caps personal liability.
2. **Monetization model.** Free forever? Donations? Freemium with paid classrooms? "Free while we validate costs" implies a paid tier is on the roadmap. The answer changes the copyright/fair-use analysis on Church content (commercial use narrows fair use).
3. **Insurance.** Is there any general liability, tech E&O (errors and omissions), or cyber/privacy liability policy in place? If not, get quotes from Hiscox or Vouch before any non-pilot teacher signs up — USD 500–2,000/yr gets meaningful coverage at this scale.
4. **Volume / scale targets.** Ten classrooms? A hundred? A thousand? The risk posture for "30 teachers in my stake" is meaningfully different from "10,000 teachers worldwide." An attorney will scope the advice to the intended scale.
5. **Geographic rollout sequence.** US-only for 12 months, then opt in country-by-country, is the cheapest compliance path. Global day-one is the most expensive.
6. **Church relationship.** Has anyone at the local stake, area, or Salt Lake been informally briefed? If a stake president or area authority is aware and supportive, a written permission request to the IP office is materially more likely to succeed.
7. **Who handles incoming abuse reports / DMCA / privacy requests?** Right now the only contact is `lewiswf@gmail.com` in the footer. Once self-serve, that mailbox will receive DMCA notices, data-subject access requests, and Church IP-office contact. Plan the intake flow — even a forwarding address at a cheap domain (e.g., `legal@kindred.app`) is better than a personal Gmail.
8. **Data retention.** How long are teacher accounts kept after inactivity? How long are generated library entries kept? What is the deletion-on-request SLA? The privacy policy will need concrete numbers, not TBDs.
9. **Is any student data ever captured?** Current architecture says no, but team names are typed by teachers — is there any path where a teacher types a student's name as a team name? If so, document that risk and consider a regex warning in the team-name input.
10. **Do teachers share library entries cross-classroom?** `lessonLibrary` is global per CLAUDE.md line 374. If Teacher A generates something mildly inappropriate and Teacher B reuses it in Classroom B, who is responsible? Confirm the contractual answer in the Teacher Terms.

---

*This inventory is a research artifact, not legal advice. Walk in to the first meeting with a real attorney carrying this list, the concrete file citations above, and a USPTO starter search — you will pay for less discovery time.*
