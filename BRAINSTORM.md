# BRAINSTORM.md — Considered future extensions (outside parser scope)

> This file deliberately lives **outside** the stepwell parser scope. It is
> **not** read or parsed by `BACKLOG.md`/`PROGRESS.md`/`docs/archive/*` or by
> `docs_status`, `docs_validate`, `backlog_list`, etc.
>
> **Purpose:** free prose for brainstorming, half-ideas, "considered future
> extensions" — things that are (not yet) an official backlog item.
> As soon as something becomes commit-worthy: lift it as an item (e.g. via
> `backlog_add`) into `BACKLOG.md`.
>
> **Conventions:**
> - Free Markdown prose — no structure requirements
> - Wiki links to Obsidian vault notes are allowed and encouraged
> - No item IDs, no step numbers, no section headings needed
> - This file is **not** moved into the archive

---

## MCP remote (HTTP transport)

stepwell-MCP currently runs as a stdio subprocess per editor/agent. It could be
switched to Streamable-HTTP / SSE (MCP spec 2025-03-26) — SDK 1.30 supports it
officially.

**Pro:** several agents/editors share one server, index cache warms once,
read requests aggregate better.

**Contra:** the main use is writing (`archive_item`/`progress_update`/
`backlog_*`) — same repo mount + network = race conditions + security risk.
The current use case is single-user/single-repo local — no scaling pressure.
HTTP transport makes auth/authz/CORS mandatory. Latency: stdio ≈ 0 ms locally vs.
HTTP round trip + reverse proxy slows every `docs_status` by a factor of 10–50.

**Remote makes more sense for:** multi-repo aggregation (a dedicated
`stepwell-hub` product), a read-only mirror for CI dashboards, a shared index across
several workspaces for team status.

**If ever:** create a BACKLOG item (R10?), uphold the M4 guardrail (read tools only
+ an explicit `mutation` namespace with auth tokens per tool), a dedicated `serve-http`
entry point in the bin (lockstep Decision 16: new bin = no API break), strict
tests against a real HTTP client. Phase after B1 (build cross-platform) and I2
(README) — as a 1.x feature, not before 1.0.0.

As of 09/2026: deliberately **not** implemented, no item created.

---

## ZooKeeper integration — STEPWELL viewer (parked)

Concept discussion 09/2026 with the sibling repo `../ZooKeeper` (Tauri-2 desktop
dashboard: Rust scanner + React frontend, pnpm/Vite). "Option B" — STEPWELL as a
**product feature** there, not a method adoption. Parked until the tool is stable
(1.0-near); this section is the reminder + fleshed-out draft (former item Z1).

**Idea:** ZooKeeper scans local projects and shows metadata — STEPWELL projects
(BACKLOG.md + PROGRESS.md at the root) could be detected and displayed
(progress tab, dashboard aggregation, health-score factor).

**Concept:**
1. **Rust scanner:** detection via root markers + mini aggregates
   (checkbox/priority/phase counts) for snapshots/DB/health — deliberately **no**
   full parser port (drift risk).
2. **"Progress" detail tab (React):** file contents via the existing
   `read_md_file` → `stepwell-core` in the WebView bundle
   (parseBacklog/parseProgress/archive parsers/validate — pure, zero-dep).
3. **Markdown editor** for the four structure files read-only (LESSONS 17:
   structure edits only via tools; a later write lane at most via a spawned
   stepwell CLI, never via a mutations import).
4. **Deliberately not:** embedding the MCP server (stdio transport is for
   agents, worthless in a UI).

**Interop contract:** the Rust mini aggregates are tested against the same
fixtures (`packages/core/tests/fixtures` + the README spec there) as core —
shared fixtures as the contract between the two repos.

**Prerequisites (in this repo, before starting):** (a) pure/I-O split in core —
`node:fs` imports at module level (backlog/progress/status/validate/project.ts)
break the browser bundle; (b) add a LICENSE file (missing); (c) consumption via
pnpm `file:`/git link with an exactly pinned version (0.x lockstep, breaking
changes possible within MINORs); (d) warning codes documented as stable
identifiers for ZooKeeper i18n (messages stay human-readable, Decision 10).

**Reactivation criterion:** core field-tested (1.0-near) and prerequisites
(a)–(d) done → ZooKeeper track (conductor format) in three steps: scan
detection → progress tab → dashboard aggregation, dogfooded: ZooKeeper shows
its own status.

As of 09/2026: brainstorming only, no implementation.

---

## Obsidian integration

Obsidian + stepwell fit surprisingly well — both local, both Markdown,
both files-on-disk. Four to five integration directions, prioritized by
effort/value:

### Variant 1 — daily note with status block (Templater + CLI)

A Templater snippet `<% tp.user.statusBlock() %>` calls `npx stepwell status --root
<project> --json`. When the daily note is created, the current
project status sits at the top. No plugin needed, just Templater + a bash snippet
(~30 lines of Templater user script). Threshold: 1–2 h.

### Variant 2 — item → vault-note linking (parser extension)

The `Location:` field in BACKLOG items accepts `[[notes/project-research]]`
wiki-link syntax. The parser surfaces the links in tool output (clickable
via an `obsidian://` URI in the console). BACKLOG becomes the index; vault notes
hold research/discussion/images/code snippets. Threshold: 4–6 h (parser +
one test fixture).

### Variant 3 — Obsidian plugin "STEPWELL sidebar"

A dedicated community plugin that displays `docs_status`/`backlog_list` directly.
View option "Switch project root" for multi-project tracking. Live updates via
a file watcher (chokidar) or polling every 30 s. Uses the MCP server over stdio
or `stepwell-core` directly as a library. Threshold: 1–2 days (plugin boilerplate,
then view code).

### Variant 4 — daily-note generator in vault format

`npx stepwell daily --root <project> --vault <vault-path> --date 2026-09-12`
generates `Daily/2026-09-12.md` with: date header, status aggregate, open
items, next step, commit notes. Uses vault conventions (frontmatter,
Dataview-compatible fields, wiki links to item notes). Can be hooked into the
workflow via Templater or as a cron hook. Threshold: 1 day.

### Variant 5 — bidirectional sync vault↔BACKLOG (big)

The vault note is the canonical source; BACKLOG.md is generated. Complex:
conflict handling, write order, schema mapping. Rather a dedicated product
(`stepwell-vault`) than a feature. 2.x version.

**Gut feeling:** #1 + #2 are the best effort/value pair. #1 in 1–2 hours as a
quick win; #2 gives the method its "research anchor" in the vault. #3 is
nice-to-have once stepwell is used intensively.

As of 09/2026: brainstorming only, no implementation.

---

## Jira & GitHub Issues bridge

Bridge between the repository's local Markdown tracking and external issue trackers
(Jira, GitHub Issues). External trackers serve as stakeholder reflection or high-level
backlog sources, while STEPWELL Markdown remains the operative source of truth for
developers and AI agents.

**Core rule:** avoid naive bidirectional two-way sync (field mapping, race conditions,
and rich-text/markdown format drift make bidirectional sync fragile). Keep a clear
one-way authority per lifecycle phase.

### Integration patterns

#### Pattern 1 — Markdown as source of truth (Push / Mirror)
The agent and developer work purely in the repository. The bridge reflects progress
outward:
- Backlog items carry an optional metadata bullet: `- **Issue:** GH-42` (or `PROJ-1082`).
- On `backlog_add`: creates an issue or links an existing one.
- On `progress_update`: transitions ticket to *In Progress* (`🔄`).
- On `archive_item`: closes the issue/ticket with reference to the commit SHA (`checkpoint`)
  and completion note.
- **Pro:** deterministic, offline-capable for agents, preserves the local-first principle.

#### Pattern 2 — Issue tracker as requirement source (Ingest / Sprint planning)
Requirements originate in Jira / GitHub Issues (created by PM / product owner):
- An ingest command (e.g. `stepwell-bridge import --sprint 42` or a CLI script) pulls
  open issues and generates structured backlog items in `BACKLOG.md` via `planBacklogAdd`
  (mapping priorities: Highest → 🔴, High → 🟠, etc.).
- The agent packages them into phases/steps in `PROGRESS.md` and implements them test-first.
- On merge/completion, CI or a push action notifies the external tracker.

#### Pattern 3 — Git & CI hook integration (Zero-API coupling)
No direct API integration in the tool itself:
- Completed items in `BACKLOG.md`'s `Done Index` already record commit SHAs and titles.
- Git commit messages or a CI job parse newly archived entries from PR diffs and trigger
  standard tracker automations (e.g. `Closes #42` or Jira smart commits `PROJ-1082 #done`).

### Architecture & guardrails

1. **Keep `stepwell-core` zero-dependency:** under no circumstances bundle tracker SDKs
   (`@octokit/rest`, Jira client, Axios) into `stepwell-core` or `stepwell` MCP.
2. **Dedicated adapter/plugin:** either a separate satellite package (e.g. `packages/bridge-github`),
   an independent CLI tool/GitHub Action, or a separate MCP server that interoperates with
   `stepwell-core` as a library.
3. **Optional validation rule:** potential `docs_validate` check `REMOTE_ISSUE_MISSING`
   if a project mandates 100% issue-traceability.

As of 09/2026: brainstorming only, no implementation.

---

## Git integration & parallel phases per project — DECIDED: workstream worktrees

Backlog root: `H5` (design item, decision documented 11/2026). Motivation:
a project should be able to run phases **in parallel**, and agents must not
disturb each other — even a foreign PROGRESS.md edit inside "their" working
tree was observed to confuse agents. Target picture and tool role are now
decided; implementation steps follow in `PROGRESS.md`.

### Decision

**Workstream = one parallel phase in its own git worktree + branch.** Agents
never share a working tree; foreign changes reach the own tree only through
the own sync step. Parallelism requires git — without git, a project stays
single-tree sequential.

**Per-step ritual** (divergence ≤ 1 step):

```
pull (trunk→branch, fresh base) → implement → code commit (agent)
→ doc commit (tool, four files only) → pull → verify (typecheck+test)
→ push (branch→trunk; precondition: trunk head ∈ ancestors(branch))
```

- **WIP visibility:** the 🔄 doc commit happens at step **start**, not only at
  completion — trunk always shows the true state (🔄 = someone is actively
  working). Activity/liveness is derived from git itself (existing workstream
  branches + last-commit times), never from a registry file or heartbeat.
- **Trunk derivation, zero config:** trunk = the branch checked out in the
  main worktree (e.g. `main`, `dev`).
- **Race model:** races are not eliminated but shaped into visible, harmless
  events. Push precondition (trunk head must be an ancestor of the branch)
  makes stale pushes impossible; git's `index.lock` + atomic branch moves
  serialize the residual TOCTOU window; conflicts surface as clean aborts
  with structured reports — never silent lost updates. Livelock guidance:
  on repeated push failure, pause and re-sync. Local single-machine scope;
  cross-machine via `origin` is explicitly out of scope.
- **Doc-conflict rule:** keep both sides; in archives, order blocks by
  completion timestamps (one guidance line in PLAYBOOK, no tool logic).

**Merge help for code (the agent keeps code semantics):** the tool never
resolves code conflicts — but (1) the merge order forces code conflicts into
the agent's own tree before trunk moves, (2) aborts come with a structured
conflict list (which file, which side changed what), (3) a preventive
overlap warning flags files touched by parallel workstreams, (4) docs_validate
mechanically re-checks merged doc consistency.

**Commit scope:** the tool commits **only the four method docs** (deterministic
staging, no secret risk); code commits remain the agent's duty (PLAYBOOK §4).
A failed doc commit (e.g. hooks) leaves the edits applied with a structured
message — never a rollback (no data-loss path).

**Architecture:** `core` stays git-blind (reads/writes only the four files).
Git intelligence lives in a **transport-neutral satellite layer** (own
workspace package, depends on core, zero transport dependency) — exposed
**CLI-first** (skill-fed agents run `stepwell sync pull|push`, `--commit`
flags, no MCP registration needed) and **MCP-optional** (same ops as tools,
thin transport, Decision 1). Commit automation is a parameter on the existing
mutation surface (`progress_update`/`archive_item --commit`), not a new tool.
The only genuinely new surface is the **sync tool** (pull/push direction,
dry-run mandatory like all mutations, dirty-tree and non-fast-forward guards)
— Alternativprüfung documented in AGENTS (Decision 14). Worktree/branch
**creation** and **cleanup** stay agent rituals (one-time setup — no tool).

**Surface guardrail (M4):** no guide/meta tools; workstream count is guidance,
not a limit ("as many as useful — each additional workstream multiplies
per-step merge traffic; two or three are typically practical").

**Related open items:** M15/M14 (PLAYBOOK/LESSONS drift sync from
internal-pwa) run **before** the H5 PLAYBOOK edits; M12 (QUICKSTART
discoverability) provides the distribution path for the ritual text; M13
(neutral foreign-repo messaging) becomes more important with git tooling;
after the mechanics ship, **M12 + M13 dogfooded as two parallel workstreams
in this repo** (field test, minimal file overlap).

**Field-test ladder (binding):** fixtures → dogfood in this repo → only
afterwards a non-critical project, explicitly chosen. **internal-pwa is
never a testbed for the workstream mechanics** — it receives only the
established verbatim PLAYBOOK/LESSONS syncs (SHA256-evidenced cross-repo
contract) and the read-only field probes (Decision 13). Adopting workstream
mode in internal-pwa is a separate, explicit decision.

As of 11/2026: decision documented, implementation not started (Phase 26
packaging follows; PLAYBOOK sync on the M15-synced basis first).

