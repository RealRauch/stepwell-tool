---
name: stepwell
description: STEPWELL method for projects with BACKLOG.md/PROGRESS.md and the stepwell-MCP-Server — session entry, status maintenance, archival and release discipline. Active when the target project contains the four STEPWELL files or one is to be set up.
---

# STEPWELL — Method (stepwell)

Binding method: `docs/PLAYBOOK.md` in the target project (verbatim copy). Checklist:
`docs/LESSONS.md`. This skill file summarises **when to call which tool** —
it does not replace the tools nor the method.

## The four files

`BACKLOG.md` (only open items, priority sections 🔴→🔵), `PROGRESS.md` (progress table +
detail blocks of **active** phases), `docs/archive/BACKLOG_ARCHIVE.md` and
`docs/archive/PROGRESS_ARCHIVE.md` (both **append-only** — never edited afterwards).

If all four are missing in `root`: no STEPWELL project → create the four files
from the templates: MCP resources `stepwell://templates/{kind}` (backlog | progress |
backlog-archive | progress-archive), then run `docs_validate` — must be clean.

## Session entry (in this order, before any write operation)

1. `docs_status` (root) — aggregate + validation findings.
2. `progress_show` (root, phase) — detail block of the active phase.
3. Next open step = first ⬜ row of the active phase. Work sequentially, never skip steps.

## Status maintenance — always via the tools, never by hand (LESSONS 17)

- `progress_update` — step status in the table + detail block (🔄 before starting, ✅
  after verified completion; a complete phase is moved to the archive automatically).
  Optional parameters: `title` (rename phase title), `note` (verification line in
  the archive block), `checkpoint` (commit SHA of the phase, 7–40 hex).
- `archive_item` — completed backlog item verbatim into the archive + one-liner in the
  Done Index (`note` = commit hash).
- `backlog_add` / `backlog_update` / `backlog_remove` — add/change/remove items in a
  format-safe way (instead of hand-editing).
- `progress_plan_phase` — plan a new phase ahead (table rows ⬜ + scope skeleton).
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

## Tool alternatives

Without the MCP server, the same surface is available as a CLI (`npx stepwell`):
`status`/`backlog`/`progress`/`validate`/`archive`/`progress-update` — `--json` output
carries the versioned schema field (`schema: <n>`; breaking ⇒ bump the number). The
method itself lives in PLAYBOOK.md — this skill is only the pointer to the tools.