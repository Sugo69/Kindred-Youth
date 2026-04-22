# Backup Routine

End-of-session checklist. Run this before closing a conversation or hitting "clear conversation" so the next session starts from a clean, recoverable state.

## Invocation

User invokes with `/backup-routine`. No arguments expected. If the user passes a note or reason in `$ARGUMENTS`, include it in the commit message and checkpoint tag.

---

## What this routine guarantees

At the end of the routine:
1. **CLAUDE.md** and **MEMORY.md** are snapshotted to `backups/` with a timestamp.
2. **Uncommitted work** is either committed to git or the user has explicitly said to skip it.
3. A **git checkpoint tag** marks this session's end state so it can be returned to by name.
4. **Backlog items** (`Opus47_Backlog.md` and any Firestore `backlogItems` surfaced in the conversation) reflect what actually happened this session — new items added, done items marked, priority shifts recorded.

Never skip steps silently. If any step cannot run (e.g. nothing to commit, no backlog changes), explicitly tell the user that step was a no-op before moving on.

---

## Step 1 — Capture the timestamp

Use a single timestamp across all artifacts so they correlate. Format: `YYYY-MM-DDTHHMM` (local time, to match existing `backups/` naming).

```bash
date +%Y-%m-%dT%H%M
```

Store the value; reuse it for file suffixes, the commit message, and the tag.

---

## Step 2 — Backup CLAUDE.md and MEMORY.md

Copy (do not move) both files into `backups/`, matching the existing naming convention:

- `backups/CLAUDE.md.{timestamp}.bak`
- `backups/MEMORY.md.{timestamp}.bak`

MEMORY.md lives at `C:\Users\lewis\.claude\projects\c--Users-lewis-OneDrive-Documents-GitHub-FamilyFeud\memory\MEMORY.md`. Copy that exact file.

If either file has not changed since the most recent backup in `backups/`, say so and skip the redundant copy. Do not blindly produce duplicate backups.

---

## Step 3 — Commit uncommitted repo changes

Run `git status` and `git diff --stat` to see what is uncommitted. Then:

- If the working tree is clean, say "Nothing to commit" and move on.
- If there are changes:
  1. Group the changes by intent (feature / fix / doc / backup).
  2. Propose a commit message that summarizes **why** the changes were made, not just what files moved. Keep subject under 70 chars.
  3. Ask the user to confirm before committing — e.g. "Commit N files with subject: `...`? (y/n)".
  4. On confirmation, stage named files (never `git add -A`) and commit.
  5. Include the Claude Code co-author trailer.

Never force-push, never amend, never `--no-verify`. If a hook fails, fix the cause and create a new commit.

---

## Step 4 — Create a checkpoint tag

Create a lightweight git tag named `checkpoint-{timestamp}` pointing at `HEAD` after step 3. This makes the session's end state addressable — `git checkout checkpoint-2026-04-21T2230` will drop the user back at exactly this point.

```bash
git tag "checkpoint-{timestamp}" -m "Backup routine checkpoint: {one-line summary of session}"
```

Do not push the tag by default (it's a local safety net, not a release marker). If the user asks to push, use `git push origin checkpoint-{timestamp}`.

---

## Step 5 — Review and update backlog items

Two surfaces:
- **`Opus47_Backlog.md`** — the canonical roadmap (P0–P3, OPUS-001 onward).
- **Firestore `backlogItems` collection** — items visible in the admin portal (BL-001 onward). The user manages these through `admin.html` → Backlog tab, but the routine should still flag if items surfaced this session haven't been logged.

Do:
1. List everything the conversation discussed that looks like backlog material — new feature ideas, deferred fixes, P2/P3 observations, items that were completed.
2. For each, check whether `Opus47_Backlog.md` already has an entry (grep by keyword).
3. For items that are genuinely new, propose an `OPUS-xxx` id (next available number) with Problem / Solution / Acceptance / Effort fields, and ask the user to confirm before writing.
4. For items that were **completed** this session, do NOT delete the backlog entry — append a `**Status:** Done ({timestamp})` line under the entry. This preserves history.
5. If there are Firestore items (BL-xxx) that the user mentioned but which have no counterpart in `Opus47_Backlog.md`, ask whether to mirror them into the file.

If nothing backlog-relevant came up, say "No backlog changes — skipped."

---

## Step 6 — Summary report

End with a short report the user can scan in 5 seconds:

```
Backup Routine complete — {timestamp}
  ✓ CLAUDE.md backup    → backups/CLAUDE.md.{ts}.bak
  ✓ MEMORY.md backup    → backups/MEMORY.md.{ts}.bak
  ✓ Commit              → {sha} "{subject}"   (or: no changes)
  ✓ Checkpoint tag      → checkpoint-{ts}
  ✓ Backlog updates     → {n} added, {m} marked done   (or: no changes)

Safe to /clear.
```

If any step failed or was skipped, replace ✓ with ⚠ or ⊘ and say why in one line.

---

## Failure modes to watch for

- **OneDrive file lock** — CLAUDE.md lives under OneDrive; occasionally a sync operation holds the file. If `cp` fails with a lock error, wait 2s and retry once before reporting the failure.
- **Detached HEAD** — if the repo is in detached HEAD state, stop the routine before creating the checkpoint tag and ask the user whether to tag the current commit anyway or return to `main` first.
- **Unpushed commits on `main`** — not this routine's problem. Flag them in the summary ("⚠ N local commits on main not pushed") but do not push.
- **Memory rules** — a user correction or validated approach that came up this session may belong in `memory/` as a feedback memory. If anything matches, note it in the summary as "consider saving feedback memory: …" and let the user decide.
