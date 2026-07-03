# Archive — historical reference only

These files predate the current Kindred build. They are kept for design
provenance and because their audio assets (`.mp3`) are useful reference
for OPUS-017 (real audio library).

**Nothing in this folder is wired into the production build.** Do not add
imports, script tags, or Vite inputs pointing here.

## Contents

- `app.js.legacy` — original pre-Vite prototype. Rolled into the current
  `games/common-ground.html` and `admin.html` during the 2026 Kindred rebuild.
- `Exodus Matching Game/` — the standalone Exodus HTML memory-match game.
  Reference implementation for Scripture Match (`games/memory.html`).
  The `.mp3` assets are the ones the Gemini version used; sourcing /
  provenance is **undocumented** and they must NOT be migrated into
  `public/audio/` until each file has a receipt, license, or replacement
  from an explicitly-licensed source (Epidemic Sound, Pond5, Freesound CC0,
  or newly generated). Tracked against OPUS-017.
- `Exodus Family Feud Master Prompt.docx` — original design doc for the
  Common Ground game (pre-rename).
- `Deployment & Safeguard Guide.docx` — original deployment notes.

## Removed 2026-04-22

The following Church-produced videos were previously stored in
`Exodus Matching Game/` as local copies and have been deleted from disk:

- `daily-bread-pattern-eng-1080p.mp4`
- `daily-bread-change-eng-1080p.mp4`
- `daily-bread-experience-eng-1080p.mp4`
- `daily-restoration.mp4`

These are copyrighted by Intellectual Reserve, Inc. and were never served
by the build (they are gitignored via `*.mp4`). If a game ever needs to
reference them, deep-link to `media.churchofjesuschrist.org` on the
Church's own servers — do not store a local copy. See
`legal-review-2026-04-22.md` §2.4 for the rationale.

If you find yourself wanting to edit anything here, the answer is almost
certainly "change the live code instead."
