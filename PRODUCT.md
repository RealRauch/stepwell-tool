# stepwell — product context

## What it is
CLI + MCP server for reading, checking, and managing the STEPWELL method docs (`BACKLOG.md`,
`PROGRESS.md`, `docs/archive/*`) in repos that follow the method: steps, archive pattern,
test-first. Markdown stays the source of truth; the tool reads, validates, assists — structural
writes only via dry-run-first tools (`archive_item`, `progress_update`, backlog CRUD,
`progress_plan_phase`, `docs_repair`), verified after apply.

## Audience
Developers and agency teams running MCP-capable coding agents (Claude Code, Cursor, OpenCode,
ZCode) whose multi-session progress docs drift. Secondary: method authors distributing STEPWELL
to consumer repos.

## Visitor's job (landing page, Persuade mode)
Within seconds: understand what stepwell enforces and why it is safe (deterministic mutations,
dry-run first, audit trails), see the real tool surface as proof, and take one action —
`npx stepwell` / register the MCP server / read PLAYBOOK.

## Proof that earns belief
Real tool outputs (status aggregate, plan diffs, validate report, sync report, repair run),
test count (483, suite green), tool surface (14 tools, JSON schema v2), zero-dependency core,
Node ≥ 22.18, the method files themselves (PLAYBOOK/LESSONS/QUICKSTART).

## Brand commitments
- The delivered logo (`website/assets/stepwell-logo.jpg`, 2026-11-12) pins the visual world:
  paper ground, navy ink, teal structure, amber reserved for "the path down the well"
  (active step/target), isometric stepped-well motif. Light ground chosen against the
  dark-neon generated-UI cluster the user flagged.
- Display face Montserrat, chosen to match the logo's wordmark letterforms.
- Copy claims must be backed by the repo (tool names, counts, shapes verified against code);
  no invented benchmarks or customers.

## Constraints
- Static site only (`website/`), no build step, no backend.
- Content is frozen at the post-Phase-32 state; copy changes need the same evidence bar as code.
