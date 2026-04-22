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
  Reference implementation for Scripture Scout (`games/memory.html`).
  The `.mp3` assets are the ones the Gemini version used; keeping them
  here for eventual migration into `public/audio/` when OPUS-017 ships.
- `Exodus Family Feud Master Prompt.docx` — original design doc for the
  Family Feud game (now Common Ground).
- `Deployment & Safeguard Guide.docx` — original deployment notes.

If you find yourself wanting to edit anything here, the answer is almost
certainly "change the live code instead."
