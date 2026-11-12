---
name: stepwell
description: STEPWELL method for projects with BACKLOG.md/PROGRESS.md and the stepwell-MCP-Server — session entry, status maintenance, archival and release discipline. Active when the target project contains the four STEPWELL files or the user explicitly asks for STEPWELL.
---

# STEPWELL — Method (stepwell)

Binding method: `docs/PLAYBOOK.md` in the target project (verbatim copy). Checklist:
`docs/LESSONS.md`. This skill file summarises **when to call which tool** —
it does not replace the tools nor the method.

**New to STEPWELL?** Start from `docs/QUICKSTART.md` in the tool repo (≤5 minutes:
core loop, the four files, the five rules) — this pointer is the fast entry; the
binding method remains PLAYBOOK.md (Decision 15: QUICKSTART is stepwell-local, not a
distributed verbatim copy).

## The four files

`BACKLOG.md` (only open items, priority sections 🔴→🔵), `PROGRESS.md` (progress table +
detail blocks of **active** phases), `docs/archive/BACKLOG_ARCHIVE.md` and
`docs/archive/PROGRESS_ARCHIVE.md` (both **append-only** — never edited afterwards).
Large projects may split the archives into shards per phase
(`docs/archive/*_ARCHIVE.p<n>.md`) — the tools rotate them automatically while a phase
runs; every reader (validate/status/show/hashes) sees the concatenated view.

If all four are missing in `root`: no STEPWELL project here — **no action required**
(read access is harmless and triggers nothing) unless the user explicitly asks to
adopt STEPWELL; only then create the files from the templates: MCP resources
`stepwell://templates/{kind}` (backlog | progress | backlog-archive |
progress-archive), then run `docs_validate` — must be clean.

## Session entry (in this order, before any write operation)

1. `docs_status` (root) — aggregate + validation findings.
2. `progress_show` (root, phase) — detail block of the active phase.
3. Next open step = first ⬜ row of the active phase. Work sequentially, never skip steps.
4. Fast path (PLAYBOOK §0.9): when the hashes delivered by `docs_status`/Read-Tools/resources match the last known state, skip re-reading PLAYBOOK/LESSONS in full — the step scope suffices. Place independent read calls in parallel.

## Status maintenance — always via the tools, never by hand (LESSONS 17)

- `progress_update` — step status in the table + detail block (🔄 before starting, ✅
  after verified completion; a complete phase moves to its own archive shard
  `PROGRESS_ARCHIVE.p<n>.md` automatically).
  Optional parameters: `title` (rename phase title), `note` (verification line in
  the archive block), `checkpoint` (commit SHA of the phase, 7–40 hex).
- `archive_item` — completed backlog item verbatim into the archive + one-liner where
  the block lives (BACKLOG Done Index, or the shard's own index section while a phase
  runs; `note` = commit hash).
- `backlog_add` / `backlog_update` / `backlog_remove` — add/change/remove items in a
  format-safe way (instead of hand-editing).
- `progress_plan_phase` — plan a new phase ahead (table rows ⬜ + scope skeleton).
- `docs_repair` — mechanical repair of validate findings (H9/30.2): placeholder stamps,
  legacy `YYMMDD/HHMM` dates, un-archived checked-off items, missing index lines,
  single-row WIP skeletons. Dry-run first; everything needing judgment stays a finding.
  `docs_validate` stays the read-only diagnostic — repair is a separate tool by design.
- In parallel workstreams: `workstream_sync status` names file collisions before they
  happen (`predictedOverlap`, H10/30.4) and id/step collisions across worktrees
  (`idCollisions`, M20/30.5); `considerWorktrees: true` on `backlog_add`/`progress_plan_phase`
  keeps the next free id/phase/step collision-free across trees (M20/30.5).
- `dryRun` defaults to `true` everywhere: preview/diff first, then write with
  `dryRun: false`.

## Gates (binding)

- **Release gate:** plan → package → **only after explicit human release** implement.
  Agents do not start code steps on their own.
- **Content gates per file class:** source/test edits in step scope = autonomous;
  dependency manifests / Dockerfiles = pause; `.env` / CI workflows / deleting tests /
  schema migrations = explicit human gate.
- **Inline-fix lane:** a bug in a running, released step scope (≤ ~10 lines, only
  "low" file classes) may be fixed on the spot — required afterwards: retro
  `backlog_add` (series `F`) + immediate `archive_item` with the commit hash.
- **Test-first (RED → GREEN):** every code step brings its tests; the RED phase is
  evidenced (own test commit with failure evidence), verification before every ✅:
  `npm run typecheck && npm run test` (or project equivalent) — must be clean.

## Closures

- **Step done:** `progress_update` ✅ only after passing verification; commit per
  step (tests first, then implementation — auditable in the log).
- **Phase done:** `progress_update` moves the block verbatim into `PROGRESS_ARCHIVE`;
  then check doc sync (AGENTS kickoff, README, PLAYBOOK copies) and commit.
- Before every commit: `docs_validate` must be clean.

## Workstream mode — parallel phases via git worktrees (PLAYBOOK §1, H5)

When a phase runs as a **workstream** (own git worktree + branch, one phase per
workstream), the per-step ritual is CLI-first — no MCP registration needed:

1. `stepwell sync pull --root <worktree>` — merge trunk into your branch (dry-run
   preview by default; add `--apply`). Conflicts surface HERE, in your own tree:
   clean abort + structured report — resolve, then pull again.
2. Implement; commit code yourself (PLAYBOOK §4); verify (`typecheck` + suite).
3. `stepwell progress-update … --apply --commit` — the tool commits ONLY the four
   doc files on your branch (never code, never foreign files; `COMMIT_BLOCKED` on a
   pre-staged index; a failed commit keeps the edits applied — commit yourself then).
4. Verify the merged state, then `stepwell sync push --root <worktree> --apply` —
   trunk fast-forwards only (precondition: trunk head already pulled; a stale branch
   gets `STALE_BRANCH` → go to 1).
5. `stepwell sync status --root <worktree>` — who else is active (branches + last
   commit times) and which files overlap with your work.

Worktree/branch creation and cleanup stay manual rituals (`git worktree add …`,
`git worktree remove` after phase completion). **Verify the removal (M16):**
`worktree remove` deregisters but can leave a husk directory when untracked content
(e.g. `node_modules`) survived — `stepwell sync status` reports such leftovers
(`husks[]`, a stale `.git` pointer) and prunable registrations (`prunable[]`);
resolve with `git worktree prune` + `rm -rf <dir>`. Without git, a project stays
single-tree sequential. Details: README "Workstreams" + PLAYBOOK §1.

## Tool alternatives

Without the MCP server, the same surface is available as a CLI (`npx stepwell`):
`status`/`backlog`/`progress`/`validate`/`archive`/`progress-update`/`sync` — `--json`
output carries the versioned schema field (`schema: <n>`; breaking ⇒ bump the number).
`--commit` on `archive`/`progress-update` automates the four-doc commit (H5). The
method itself lives in PLAYBOOK.md — this skill is only the pointer to the tools.