# STEPWELL — Quick Start

> Five-minute entry point. The **full, binding reference** is
> [`PLAYBOOK.md`](PLAYBOOK.md) (plus the review checklist in
> [`LESSONS.md`](LESSONS.md)) — this file introduces the method, it does not
> replace it.

## What STEPWELL is

STEPWELL is a lightweight working method for projects built from **many small,
each load-bearing steps** — like a stepwell, layer upon layer. It keeps exactly
**four Markdown files** as the single source of truth: what is open, what is in
progress, and what was completed with which evidence. Markdown stays the source
of truth — a tool (this repo's `stepwell` CLI/MCP server) reads, checks and
maintains the structure, but the files survive without it.

## The core loop

```
Plan → Package → Release → Implement → Verify → Archive
```

1. **Plan** — think the work through first (goal, scope, order, risks); never
   implement "off the cuff".
2. **Package** — break the plan into small numbered steps in `PROGRESS.md`,
   each derived from an open `BACKLOG.md` item.
3. **Release** — implementation starts **only after explicit human release**;
   agents package ahead but do not start on their own.
4. **Implement** — step by step, test-first, committing per step.
5. **Verify** — type check + test suite must pass before a step counts as done.
6. **Archive** — completed items and phases move **verbatim** into the archives;
   the open files stay lean.

## The four files

| File | What belongs in it |
|------|--------------------|
| `BACKLOG.md` | **Only open items** (finding, risk, idea) with location + acceptance criterion, sorted by priority 🔴 → 🟠 → 🟡 → 🟢 → 🔵; plus a one-line **Done Index** per completed item. |
| `PROGRESS.md` | The **committed phase sequence**: the full progress table (permanent index) and detail blocks only for the active/open phases. |
| `docs/archive/BACKLOG_ARCHIVE.md` | Completed and removed backlog items, moved in **verbatim** — append-only history. |
| `docs/archive/PROGRESS_ARCHIVE.md` | Completed phase detail blocks, moved in **verbatim** — append-only history. |

All four files are mandatory: if one is missing, the project does not load.

## The five rules that matter most

1. **Test-first (RED → GREEN) — binding.** No feature/step code without tests:
   write the failing test first, then implement until green. RED is evidenced
   (own `test(...)` commit), not claimed.
2. **Commit discipline.** Commit after every completed step, mandatory after
   every completed phase; stage only intended files, never secrets or `.env`;
   short imperative English messages in the repo style; never amend a failed
   commit — fix and commit again.
3. **Release gate.** The move from planning/packaging to implementation needs
   explicit human release. Content gates apply per file class: **Low** (source/
   tests in step scope) autonomous · **Medium** (dependency manifests, Docker)
   release per occurrence · **High** (`.env`, CI, deleting tests, schema
   migrations) explicit human gate.
4. **Archive pattern.** `BACKLOG.md`/`PROGRESS.md` hold only open content;
   completed blocks move **unchanged** into the archives. Archives are
   append-only and never edited again. IDs and step numbers are never reused.
5. **Documentation duty.** Living documents, always current: status in
   `PROGRESS.md` after every step, `README.md` after every behaviour change, a
   `BACKLOG.md` item for every found bug/risk. The rule: **no code without a
   step in `PROGRESS.md`, no known problem without an entry in `BACKLOG.md`.**

## Where to go next

- Full method, all rules and edge cases: [`PLAYBOOK.md`](PLAYBOOK.md).
- Review checklist for completions: [`LESSONS.md`](LESSONS.md).
- Tool usage (CLI + MCP, the four files' format): [`../README.md`](../README.md).
- Project-specific commands and decisions: [`../AGENTS.md`](../AGENTS.md).
