// Seminary daily lesson schedule — NT 2026–27
// ──────────────────────────────────────────────────────────────────────────
// Source: New Testament Seminary Teacher Manual
//   https://www.churchofjesuschrist.org/study/manual/new-testament-seminary-teacher-manual
// 160 lessons mapped to school days Aug 17, 2026 → Apr 28, 2027.
//
// School holidays excluded (adjust for your district's calendar):
//   Labor Day:      Sep 7, 2026
//   Thanksgiving:   Nov 23–27, 2026
//   Winter break:   Dec 21, 2026 – Jan 2, 2027
//   MLK Day:        Jan 19, 2027
//   Presidents Day: Feb 15, 2027
//   Spring break:   Mar 22–26, 2027
//
// `type` drives the smart-recommendation engine (same matrix as CFM).
// `dmPassage` marks lessons centred on one of the 25 NT Doctrinal Mastery
// passages — these lessons also recommend the "By Heart" memorization game.
//
// Generation policy: Seminary lessons are generated on-demand (not
// pre-generated like CFM). Generated content is cached in Firestore under
// lessonLibrary/{lessonId} for 60 days, then re-generated on next request.

const SEMINARY_2026_NT = [
  // ── Lessons 1–5: Introduction week ──
  { slug:'001', date:'2026-08-17', title:'Introduction to the New Testament',         scriptures:'Overview',                type:'doctrinal', dmPassage:null },
  { slug:'002', date:'2026-08-18', title:'The Plan of Salvation',                     scriptures:'Plan of Salvation',       type:'doctrinal', dmPassage:null },
  { slug:'003', date:'2026-08-19', title:'The Role of the Learner',                   scriptures:'Study Skills',            type:'doctrinal', dmPassage:null },
  { slug:'004', date:'2026-08-20', title:'Studying the Scriptures',                   scriptures:'Study Skills',            type:'doctrinal', dmPassage:null },
  { slug:'005', date:'2026-08-21', title:'Context and Overview of the New Testament', scriptures:'Overview',                type:'doctrinal', dmPassage:null },

  // ── Lessons 6–15: Matthew 1–13 ──
  { slug:'006', date:'2026-08-24', title:'Matthew 1–2',                               scriptures:'Matthew 1–2',             type:'narrative', dmPassage:null },
  { slug:'007', date:'2026-08-25', title:'Matthew 3',                                 scriptures:'Matthew 3',               type:'narrative', dmPassage:null },
  { slug:'008', date:'2026-08-26', title:'Matthew 4',                                 scriptures:'Matthew 4',               type:'narrative', dmPassage:null },
  { slug:'009', date:'2026-08-27', title:'Matthew 5:1–16',                            scriptures:'Matthew 5:1–16',          type:'doctrinal', dmPassage:'Matthew 5:14–16' },
  { slug:'010', date:'2026-08-28', title:'Matthew 5:17–48',                           scriptures:'Matthew 5:17–48',         type:'doctrinal', dmPassage:null },

  { slug:'011', date:'2026-08-31', title:'Matthew 6',                                 scriptures:'Matthew 6',               type:'doctrinal', dmPassage:'Matthew 6:24; Matthew 6:33' },
  { slug:'012', date:'2026-09-01', title:'Matthew 7',                                 scriptures:'Matthew 7',               type:'doctrinal', dmPassage:null },
  { slug:'013', date:'2026-09-02', title:'Matthew 8–10',                              scriptures:'Matthew 8–10',            type:'mixed',     dmPassage:null },
  { slug:'014', date:'2026-09-03', title:'Matthew 11–12',                             scriptures:'Matthew 11–12',           type:'mixed',     dmPassage:null },
  { slug:'015', date:'2026-09-04', title:'Matthew 13:1–23',                           scriptures:'Matthew 13:1–23',         type:'doctrinal', dmPassage:null },

  // Labor Day Sep 7 — no school
  // ── Lessons 16–33: Matthew 13–28 ──
  { slug:'016', date:'2026-09-08', title:'Matthew 13:24–58',                          scriptures:'Matthew 13:24–58',        type:'mixed',     dmPassage:null },
  { slug:'017', date:'2026-09-09', title:'Matthew 14',                                scriptures:'Matthew 14',              type:'narrative', dmPassage:null },
  { slug:'018', date:'2026-09-10', title:'Matthew 15',                                scriptures:'Matthew 15',              type:'mixed',     dmPassage:null },
  { slug:'019', date:'2026-09-11', title:'Matthew 16',                                scriptures:'Matthew 16',              type:'doctrinal', dmPassage:'Matthew 16:15–19' },
  { slug:'020', date:'2026-09-14', title:'Matthew 17',                                scriptures:'Matthew 17',              type:'narrative', dmPassage:null },
  { slug:'021', date:'2026-09-15', title:'Matthew 18',                                scriptures:'Matthew 18',              type:'doctrinal', dmPassage:null },
  { slug:'022', date:'2026-09-16', title:'Matthew 19–20',                             scriptures:'Matthew 19–20',           type:'doctrinal', dmPassage:null },
  { slug:'023', date:'2026-09-17', title:'Matthew 21:1–16',                           scriptures:'Matthew 21:1–16',         type:'narrative', dmPassage:null },
  { slug:'024', date:'2026-09-18', title:'Matthew 21:17–22:14',                       scriptures:'Matthew 21:17–22:14',     type:'mixed',     dmPassage:null },
  { slug:'025', date:'2026-09-21', title:'Matthew 22:15–46',                          scriptures:'Matthew 22:15–46',        type:'doctrinal', dmPassage:null },
  { slug:'026', date:'2026-09-22', title:'Matthew 23',                                scriptures:'Matthew 23',              type:'doctrinal', dmPassage:null },
  { slug:'027', date:'2026-09-23', title:'Joseph Smith—Matthew; Matthew 24',          scriptures:'JS–Matthew; Matthew 24',  type:'doctrinal', dmPassage:null },
  { slug:'028', date:'2026-09-24', title:'Matthew 25:1–13',                           scriptures:'Matthew 25:1–13',         type:'doctrinal', dmPassage:null },
  { slug:'029', date:'2026-09-25', title:'Matthew 25:14–46',                          scriptures:'Matthew 25:14–46',        type:'mixed',     dmPassage:null },
  { slug:'030', date:'2026-09-28', title:'Matthew 26:1–30',                           scriptures:'Matthew 26:1–30',         type:'narrative', dmPassage:null },
  { slug:'031', date:'2026-09-29', title:'Matthew 26:31–75',                          scriptures:'Matthew 26:31–75',        type:'narrative', dmPassage:null },
  { slug:'032', date:'2026-09-30', title:'Matthew 27:1–50',                           scriptures:'Matthew 27:1–50',         type:'narrative', dmPassage:null },
  { slug:'033', date:'2026-10-01', title:'Matthew 27:51–28:20',                       scriptures:'Matthew 27:51–28:20',     type:'mixed',     dmPassage:'Matthew 28:19–20' },

  // ── Lessons 34–42: Mark ──
  { slug:'034', date:'2026-10-02', title:'Mark 1',                                    scriptures:'Mark 1',                  type:'narrative', dmPassage:null },
  { slug:'035', date:'2026-10-05', title:'Mark 2–3',                                  scriptures:'Mark 2–3',                type:'mixed',     dmPassage:null },
  { slug:'036', date:'2026-10-06', title:'Mark 4–5',                                  scriptures:'Mark 4–5',                type:'narrative', dmPassage:null },
  { slug:'037', date:'2026-10-07', title:'Mark 6',                                    scriptures:'Mark 6',                  type:'narrative', dmPassage:null },
  { slug:'038', date:'2026-10-08', title:'Mark 7–8',                                  scriptures:'Mark 7–8',                type:'mixed',     dmPassage:null },
  { slug:'039', date:'2026-10-09', title:'Mark 9:1–29',                               scriptures:'Mark 9:1–29',             type:'narrative', dmPassage:null },
  { slug:'040', date:'2026-10-12', title:'Mark 9:30–50',                              scriptures:'Mark 9:30–50',            type:'doctrinal', dmPassage:null },
  { slug:'041', date:'2026-10-13', title:'Mark 10',                                   scriptures:'Mark 10',                 type:'doctrinal', dmPassage:null },
  { slug:'042', date:'2026-10-14', title:'Mark 11–16',                                scriptures:'Mark 11–16',              type:'narrative', dmPassage:null },

  // ── Lessons 43–59: Luke ──
  { slug:'043', date:'2026-10-15', title:'Luke 1',                                    scriptures:'Luke 1',                  type:'narrative', dmPassage:null },
  { slug:'044', date:'2026-10-16', title:'Luke 2',                                    scriptures:'Luke 2',                  type:'narrative', dmPassage:null },
  { slug:'045', date:'2026-10-19', title:'Luke 3–4',                                  scriptures:'Luke 3–4',                type:'narrative', dmPassage:null },
  { slug:'046', date:'2026-10-20', title:'Luke 5',                                    scriptures:'Luke 5',                  type:'narrative', dmPassage:null },
  { slug:'047', date:'2026-10-21', title:'Luke 6:1–7:18',                             scriptures:'Luke 6–7',                type:'mixed',     dmPassage:null },
  { slug:'048', date:'2026-10-22', title:'Luke 7:18–50',                              scriptures:'Luke 7',                  type:'mixed',     dmPassage:null },
  { slug:'049', date:'2026-10-23', title:'Luke 8–9',                                  scriptures:'Luke 8–9',                type:'narrative', dmPassage:null },
  { slug:'050', date:'2026-10-26', title:'Luke 10:1–37',                              scriptures:'Luke 10:1–37',            type:'mixed',     dmPassage:null },
  { slug:'051', date:'2026-10-27', title:'Luke 10:38–12:59',                          scriptures:'Luke 10–12',              type:'doctrinal', dmPassage:null },
  { slug:'052', date:'2026-10-28', title:'Luke 13–14',                                scriptures:'Luke 13–14',              type:'mixed',     dmPassage:null },
  { slug:'053', date:'2026-10-29', title:'Luke 15',                                   scriptures:'Luke 15',                 type:'narrative', dmPassage:null },
  { slug:'054', date:'2026-10-30', title:'Luke 16',                                   scriptures:'Luke 16',                 type:'doctrinal', dmPassage:null },
  { slug:'055', date:'2026-11-02', title:'Luke 17',                                   scriptures:'Luke 17',                 type:'mixed',     dmPassage:null },
  { slug:'056', date:'2026-11-03', title:'Luke 18–21',                                scriptures:'Luke 18–21',              type:'doctrinal', dmPassage:null },
  { slug:'057', date:'2026-11-04', title:'Luke 22',                                   scriptures:'Luke 22',                 type:'narrative', dmPassage:null },
  { slug:'058', date:'2026-11-05', title:'Luke 23',                                   scriptures:'Luke 23',                 type:'narrative', dmPassage:null },
  { slug:'059', date:'2026-11-06', title:'Luke 24',                                   scriptures:'Luke 24',                 type:'mixed',     dmPassage:null },

  // ── Lessons 60–80: John ──
  { slug:'060', date:'2026-11-09', title:'John 1',                                    scriptures:'John 1',                  type:'doctrinal', dmPassage:'John 1:1–3, 14' },
  { slug:'061', date:'2026-11-10', title:'John 2',                                    scriptures:'John 2',                  type:'narrative', dmPassage:null },
  { slug:'062', date:'2026-11-11', title:'John 3',                                    scriptures:'John 3',                  type:'doctrinal', dmPassage:'John 3:5' },
  { slug:'063', date:'2026-11-12', title:'John 4',                                    scriptures:'John 4',                  type:'narrative', dmPassage:null },
  { slug:'064', date:'2026-11-13', title:'John 5',                                    scriptures:'John 5',                  type:'doctrinal', dmPassage:'John 5:28–29' },
  { slug:'065', date:'2026-11-16', title:'John 6',                                    scriptures:'John 6',                  type:'mixed',     dmPassage:null },
  { slug:'066', date:'2026-11-17', title:'John 7',                                    scriptures:'John 7',                  type:'doctrinal', dmPassage:'John 7:17' },
  { slug:'067', date:'2026-11-18', title:'John 8:1–30',                               scriptures:'John 8:1–30',             type:'mixed',     dmPassage:null },
  { slug:'068', date:'2026-11-19', title:'John 8:31–59',                              scriptures:'John 8:31–59',            type:'doctrinal', dmPassage:null },
  { slug:'069', date:'2026-11-20', title:'John 9',                                    scriptures:'John 9',                  type:'narrative', dmPassage:null },

  // Thanksgiving Nov 23–27 — no school
  { slug:'070', date:'2026-11-30', title:'John 10',                                   scriptures:'John 10',                 type:'doctrinal', dmPassage:null },
  { slug:'071', date:'2026-12-01', title:'John 11',                                   scriptures:'John 11',                 type:'narrative', dmPassage:null },
  { slug:'072', date:'2026-12-02', title:'John 12',                                   scriptures:'John 12',                 type:'narrative', dmPassage:null },
  { slug:'073', date:'2026-12-03', title:'John 13',                                   scriptures:'John 13',                 type:'mixed',     dmPassage:null },
  { slug:'074', date:'2026-12-04', title:'John 14',                                   scriptures:'John 14',                 type:'doctrinal', dmPassage:'John 14:15' },
  { slug:'075', date:'2026-12-07', title:'John 15',                                   scriptures:'John 15',                 type:'doctrinal', dmPassage:null },
  { slug:'076', date:'2026-12-08', title:'John 16',                                   scriptures:'John 16',                 type:'doctrinal', dmPassage:null },
  { slug:'077', date:'2026-12-09', title:'John 17',                                   scriptures:'John 17',                 type:'doctrinal', dmPassage:'John 17:3' },
  { slug:'078', date:'2026-12-10', title:'John 18–19',                                scriptures:'John 18–19',              type:'narrative', dmPassage:null },
  { slug:'079', date:'2026-12-11', title:'John 20',                                   scriptures:'John 20',                 type:'narrative', dmPassage:null },
  { slug:'080', date:'2026-12-14', title:'John 21',                                   scriptures:'John 21',                 type:'narrative', dmPassage:null },

  // ── Lessons 81–98: Acts ──
  { slug:'081', date:'2026-12-15', title:'Acts 1:1–8',                                scriptures:'Acts 1:1–8',              type:'doctrinal', dmPassage:null },
  { slug:'082', date:'2026-12-16', title:'Acts 1:9–26',                               scriptures:'Acts 1:9–26',             type:'narrative', dmPassage:null },
  { slug:'083', date:'2026-12-17', title:'Acts 2',                                    scriptures:'Acts 2',                  type:'mixed',     dmPassage:null },
  { slug:'084', date:'2026-12-18', title:'Acts 3',                                    scriptures:'Acts 3',                  type:'narrative', dmPassage:null },

  // Winter break Dec 21 – Jan 2 — no school
  { slug:'085', date:'2027-01-05', title:'Acts 4–5',                                  scriptures:'Acts 4–5',                type:'narrative', dmPassage:null },
  { slug:'086', date:'2027-01-06', title:'Acts 6–7',                                  scriptures:'Acts 6–7',                type:'mixed',     dmPassage:'Acts 7:55–56' },
  { slug:'087', date:'2027-01-07', title:'Acts 8',                                    scriptures:'Acts 8',                  type:'narrative', dmPassage:null },
  { slug:'088', date:'2027-01-08', title:'Acts 9',                                    scriptures:'Acts 9',                  type:'narrative', dmPassage:null },
  { slug:'089', date:'2027-01-09', title:'Acts 10–11',                                scriptures:'Acts 10–11',              type:'narrative', dmPassage:null },
  { slug:'090', date:'2027-01-12', title:'Acts 12',                                   scriptures:'Acts 12',                 type:'narrative', dmPassage:null },
  { slug:'091', date:'2027-01-13', title:'Acts 13–14',                                scriptures:'Acts 13–14',              type:'narrative', dmPassage:null },
  { slug:'092', date:'2027-01-14', title:'Acts 15',                                   scriptures:'Acts 15',                 type:'doctrinal', dmPassage:null },
  { slug:'093', date:'2027-01-15', title:'Acts 16',                                   scriptures:'Acts 16',                 type:'narrative', dmPassage:null },
  { slug:'094', date:'2027-01-16', title:'Acts 17',                                   scriptures:'Acts 17',                 type:'mixed',     dmPassage:null },

  // MLK Day Jan 19 — no school
  { slug:'095', date:'2027-01-20', title:'Acts 18–19',                                scriptures:'Acts 18–19',              type:'narrative', dmPassage:null },
  { slug:'096', date:'2027-01-21', title:'Acts 20–22',                                scriptures:'Acts 20–22',              type:'narrative', dmPassage:null },
  { slug:'097', date:'2027-01-22', title:'Acts 23–26',                                scriptures:'Acts 23–26',              type:'narrative', dmPassage:null },
  { slug:'098', date:'2027-01-23', title:'Acts 27–28',                                scriptures:'Acts 27–28',              type:'narrative', dmPassage:null },

  // ── Lessons 99–112: Romans; 1–2 Corinthians ──
  { slug:'099', date:'2027-01-26', title:'Romans 1–3',                                scriptures:'Romans 1–3',              type:'doctrinal', dmPassage:'Romans 1:16' },
  { slug:'100', date:'2027-01-27', title:'Romans 4–7',                                scriptures:'Romans 4–7',              type:'doctrinal', dmPassage:null },
  { slug:'101', date:'2027-01-28', title:'Romans 8–11',                               scriptures:'Romans 8–11',             type:'doctrinal', dmPassage:null },
  { slug:'102', date:'2027-01-29', title:'Romans 12–16',                              scriptures:'Romans 12–16',            type:'doctrinal', dmPassage:null },
  { slug:'103', date:'2027-01-30', title:'1 Corinthians 1–2',                         scriptures:'1 Corinthians 1–2',       type:'doctrinal', dmPassage:null },
  { slug:'104', date:'2027-02-02', title:'1 Corinthians 3–4',                         scriptures:'1 Corinthians 3–4',       type:'doctrinal', dmPassage:null },
  { slug:'105', date:'2027-02-03', title:'1 Corinthians 5–6',                         scriptures:'1 Corinthians 5–6',       type:'doctrinal', dmPassage:'1 Corinthians 6:19–20' },
  { slug:'106', date:'2027-02-04', title:'1 Corinthians 7–8',                         scriptures:'1 Corinthians 7–8',       type:'doctrinal', dmPassage:null },
  { slug:'107', date:'2027-02-05', title:'1 Corinthians 9–10',                        scriptures:'1 Corinthians 9–10',      type:'doctrinal', dmPassage:'1 Corinthians 10:13' },
  { slug:'108', date:'2027-02-06', title:'1 Corinthians 11',                          scriptures:'1 Corinthians 11',        type:'doctrinal', dmPassage:null },
  { slug:'109', date:'2027-02-09', title:'1 Corinthians 12',                          scriptures:'1 Corinthians 12',        type:'doctrinal', dmPassage:null },
  { slug:'110', date:'2027-02-10', title:'1 Corinthians 13–14',                       scriptures:'1 Corinthians 13–14',     type:'doctrinal', dmPassage:null },
  { slug:'111', date:'2027-02-11', title:'1 Corinthians 15:1–29',                     scriptures:'1 Corinthians 15:1–29',   type:'doctrinal', dmPassage:'1 Corinthians 15:20–22, 29' },
  { slug:'112', date:'2027-02-12', title:'1 Corinthians 15:30–16:24',                 scriptures:'1 Corinthians 15–16',     type:'doctrinal', dmPassage:null },
  { slug:'113', date:'2027-02-13', title:'2 Corinthians 1–3',                         scriptures:'2 Corinthians 1–3',       type:'doctrinal', dmPassage:null },

  // Presidents Day Feb 15 — no school
  // ── Lessons 114–134: 2 Corinthians through Philemon ──
  { slug:'114', date:'2027-02-16', title:'2 Corinthians 4–5',                         scriptures:'2 Corinthians 4–5',       type:'doctrinal', dmPassage:null },
  { slug:'115', date:'2027-02-17', title:'2 Corinthians 6–7',                         scriptures:'2 Corinthians 6–7',       type:'doctrinal', dmPassage:null },
  { slug:'116', date:'2027-02-18', title:'2 Corinthians 8–9',                         scriptures:'2 Corinthians 8–9',       type:'doctrinal', dmPassage:null },
  { slug:'117', date:'2027-02-19', title:'2 Corinthians 10–13',                       scriptures:'2 Corinthians 10–13',     type:'mixed',     dmPassage:null },
  { slug:'118', date:'2027-02-22', title:'Galatians 1–4',                             scriptures:'Galatians 1–4',           type:'doctrinal', dmPassage:null },
  { slug:'119', date:'2027-02-23', title:'Galatians 5–6',                             scriptures:'Galatians 5–6',           type:'doctrinal', dmPassage:'Galatians 5:22–23' },
  { slug:'120', date:'2027-02-24', title:'Ephesians 1',                               scriptures:'Ephesians 1',             type:'doctrinal', dmPassage:null },
  { slug:'121', date:'2027-02-25', title:'Ephesians 2–3',                             scriptures:'Ephesians 2–3',           type:'doctrinal', dmPassage:null },
  { slug:'122', date:'2027-02-26', title:'Ephesians 4',                               scriptures:'Ephesians 4',             type:'doctrinal', dmPassage:'Ephesians 4:11–14' },
  { slug:'123', date:'2027-03-01', title:'Ephesians 5–6',                             scriptures:'Ephesians 5–6',           type:'doctrinal', dmPassage:null },
  { slug:'124', date:'2027-03-02', title:'Philippians 1–3',                           scriptures:'Philippians 1–3',         type:'doctrinal', dmPassage:null },
  { slug:'125', date:'2027-03-03', title:'Philippians 4',                             scriptures:'Philippians 4',           type:'doctrinal', dmPassage:'Philippians 4:7' },
  { slug:'126', date:'2027-03-04', title:'Colossians',                                scriptures:'Colossians',              type:'doctrinal', dmPassage:null },
  { slug:'127', date:'2027-03-05', title:'1 Thessalonians 1–2',                       scriptures:'1 Thessalonians 1–2',     type:'doctrinal', dmPassage:null },
  { slug:'128', date:'2027-03-08', title:'1 Thessalonians 3–5',                       scriptures:'1 Thessalonians 3–5',     type:'doctrinal', dmPassage:null },
  { slug:'129', date:'2027-03-09', title:'2 Thessalonians',                           scriptures:'2 Thessalonians',         type:'doctrinal', dmPassage:'2 Thessalonians 2:1–3' },
  { slug:'130', date:'2027-03-10', title:'1 Timothy',                                 scriptures:'1 Timothy',               type:'doctrinal', dmPassage:'1 Timothy 4:12' },
  { slug:'131', date:'2027-03-11', title:'2 Timothy 1–2',                             scriptures:'2 Timothy 1–2',           type:'doctrinal', dmPassage:null },
  { slug:'132', date:'2027-03-12', title:'2 Timothy 3–4',                             scriptures:'2 Timothy 3–4',           type:'doctrinal', dmPassage:'2 Timothy 3:15–17' },
  { slug:'133', date:'2027-03-15', title:'Titus',                                     scriptures:'Titus',                   type:'doctrinal', dmPassage:null },
  { slug:'134', date:'2027-03-16', title:'Philemon',                                  scriptures:'Philemon',                type:'narrative', dmPassage:null },

  // ── Lessons 135–150: Hebrews through Jude ──
  { slug:'135', date:'2027-03-17', title:'Hebrews 1–4',                               scriptures:'Hebrews 1–4',             type:'doctrinal', dmPassage:null },
  { slug:'136', date:'2027-03-18', title:'Hebrews 5–6',                               scriptures:'Hebrews 5–6',             type:'doctrinal', dmPassage:'Hebrews 5:4' },
  { slug:'137', date:'2027-03-19', title:'Hebrews 7–10',                              scriptures:'Hebrews 7–10',            type:'doctrinal', dmPassage:null },

  // Spring break Mar 22–26 — no school
  { slug:'138', date:'2027-03-29', title:'Hebrews 11',                                scriptures:'Hebrews 11',              type:'doctrinal', dmPassage:null },
  { slug:'139', date:'2027-03-30', title:'Hebrews 12–13',                             scriptures:'Hebrews 12–13',           type:'doctrinal', dmPassage:null },
  { slug:'140', date:'2027-03-31', title:'James 1',                                   scriptures:'James 1',                 type:'doctrinal', dmPassage:'James 1:5–6' },
  { slug:'141', date:'2027-04-01', title:'James 2',                                   scriptures:'James 2',                 type:'doctrinal', dmPassage:null },
  { slug:'142', date:'2027-04-02', title:'James 3',                                   scriptures:'James 3',                 type:'doctrinal', dmPassage:null },
  { slug:'143', date:'2027-04-05', title:'James 4–5',                                 scriptures:'James 4–5',               type:'mixed',     dmPassage:null },
  { slug:'144', date:'2027-04-06', title:'1 Peter 1–2',                               scriptures:'1 Peter 1–2',             type:'doctrinal', dmPassage:null },
  { slug:'145', date:'2027-04-07', title:'1 Peter 3–5',                               scriptures:'1 Peter 3–5',             type:'doctrinal', dmPassage:null },
  { slug:'146', date:'2027-04-08', title:'2 Peter 1',                                 scriptures:'2 Peter 1',               type:'doctrinal', dmPassage:null },
  { slug:'147', date:'2027-04-09', title:'2 Peter 2–3',                               scriptures:'2 Peter 2–3',             type:'doctrinal', dmPassage:null },
  { slug:'148', date:'2027-04-12', title:'1 John',                                    scriptures:'1 John',                  type:'doctrinal', dmPassage:null },
  { slug:'149', date:'2027-04-13', title:'2 John–3 John',                             scriptures:'2–3 John',                type:'doctrinal', dmPassage:null },
  { slug:'150', date:'2027-04-14', title:'Jude',                                      scriptures:'Jude',                    type:'mixed',     dmPassage:null },

  // ── Lessons 151–160: Revelation ──
  { slug:'151', date:'2027-04-15', title:'Revelation 1',                              scriptures:'Revelation 1',            type:'doctrinal', dmPassage:null },
  { slug:'152', date:'2027-04-16', title:'Revelation 2–3',                            scriptures:'Revelation 2–3',          type:'mixed',     dmPassage:null },
  { slug:'153', date:'2027-04-19', title:'Revelation 4–5',                            scriptures:'Revelation 4–5',          type:'mixed',     dmPassage:null },
  { slug:'154', date:'2027-04-20', title:'Revelation 6–11, Part 1',                   scriptures:'Revelation 6–11',         type:'mixed',     dmPassage:null },
  { slug:'155', date:'2027-04-21', title:'Revelation 6–11, Part 2',                   scriptures:'Revelation 6–11',         type:'mixed',     dmPassage:null },
  { slug:'156', date:'2027-04-22', title:'Revelation 12–13',                          scriptures:'Revelation 12–13',        type:'narrative', dmPassage:null },
  { slug:'157', date:'2027-04-23', title:'Revelation 14–16',                          scriptures:'Revelation 14–16',        type:'mixed',     dmPassage:null },
  { slug:'158', date:'2027-04-26', title:'Revelation 17–19',                          scriptures:'Revelation 17–19',        type:'narrative', dmPassage:null },
  { slug:'159', date:'2027-04-27', title:'Revelation 20',                             scriptures:'Revelation 20',           type:'doctrinal', dmPassage:'Revelation 20:12–13' },
  { slug:'160', date:'2027-04-28', title:'Revelation 21–22',                          scriptures:'Revelation 21–22',        type:'doctrinal', dmPassage:null },
];

// Identifier and URL plumbing — mirrors cfm-schedule's contract so the
// portal renderer treats both schedules through one interface.
const MANUAL_SLUG = 'new-testament-seminary-teacher-manual';
const MANUAL_BASE = `https://www.churchofjesuschrist.org/study/manual/${MANUAL_SLUG}`;

export function getAllSeminaryLessons() {
  return SEMINARY_2026_NT.map(toResolvedLesson);
}

// Returns today's Seminary lesson (Mon–Fri only). On weekends, holidays,
// or after the school year, returns the next upcoming lesson.
export function getCurrentSeminaryLesson(date = new Date()) {
  const today = toUtcMidnight(date);
  for (const lesson of SEMINARY_2026_NT) {
    if (toUtcMidnight(lesson.date) >= today) return toResolvedLesson(lesson);
  }
  // After school year ends, wrap to first lesson of next cycle
  return toResolvedLesson(SEMINARY_2026_NT[0]);
}

// Returns the next `count` Seminary lessons starting from today.
// Used by the portal's "This Week" strip (Mon–Fri view).
export function getUpcomingSeminaryLessons(date = new Date(), count = 5) {
  const today = toUtcMidnight(date);
  return SEMINARY_2026_NT
    .filter(l => toUtcMidnight(l.date) >= today)
    .slice(0, count)
    .map(toResolvedLesson);
}

// Look up a specific lesson by its lessonId (e.g. 'new-testament-seminary-teacher-manual-042').
export function getSeminaryLessonById(lessonId) {
  const lesson = SEMINARY_2026_NT.find(l => `${MANUAL_SLUG}-${l.slug}` === lessonId);
  return lesson ? toResolvedLesson(lesson) : null;
}

// 60-day cache TTL for on-demand generated content.
export const SEMINARY_CACHE_TTL_DAYS = 60;

// Full year is now populated — stub banner no longer shown.
export const SEMINARY_IS_STUB = false;

// ── Internals ────────────────────────────────────────────────────────────
function toResolvedLesson(lesson) {
  const d = parseIsoDate(lesson.date);
  return {
    ...lesson,
    url: `${MANUAL_BASE}/lesson-${lesson.slug}?lang=eng`,
    lessonId: `${MANUAL_SLUG}-${lesson.slug}`,
    displayDate: formatSeminaryDate(d),
    weekday: WEEKDAYS[d.getUTCDay()],
  };
}

const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function formatSeminaryDate(d) {
  return `${WEEKDAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function parseIsoDate(iso) {
  return new Date(iso + 'T00:00:00Z');
}
function toUtcMidnight(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
