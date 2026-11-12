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

Backlog root: `H5` (design item, decision documented 11/2026). Motivation: a
project should be able to run phases **in parallel**, and agents must not disturb
each other — even a foreign PROGRESS.md edit inside "their" working tree was
observed to confuse agents.

### Decision

**Workstream = one parallel phase in its own git worktree + branch.** Agents never
share a working tree; foreign changes reach the own tree only through the own sync
step. Parallelism requires git — without git, a project stays single-tree
sequential.

Full ritual (per-step pull → implement → doc commit → verify → push), race model
(push precondition, clean conflict aborts), commit scope (doc file set only, never
a rollback), architecture (git-blind core + transport-neutral satellite,
CLI-first + MCP-optional) and the field-test ladder are **binding elsewhere** —
they live in PLAYBOOK §1 ("Parallel phases as workstreams"), README
("Workstreams") and AGENTS Decision 14. This section keeps only the origin.

As of 11/2026: **implemented** (Phase 26, steps 26.1–26.7 incl. the M12/M13
dogfood workstreams; archive entry H5) and **dogfooded** (Phase 32 ran
end-to-end as a workstream — the per-step ritual held, two STALE_BRANCH
re-pull rounds against foreign trunk commits resolved cleanly). Archive
sharding (H12/32.x) additionally removed the archive-append merge traffic the
original design still expected.

---

## Decisions as a structured fifth document (ADR file) — idea

Backlog root: none yet (this is a *method* question, not a tool feature).
Trigger: comparison with MrLesk/Backlog.md 11/2026 (`backlog decision create
--context --decision --consequences --alternatives --superseded-by`).

### Problem

STEPWELL *has* decisions as a concept — `AGENTS.md` carries Decisions 1–16,
superseded/duplicate ones live in `docs/archive/AGENTS-decisions-history.md`
(append-only). But they are prose: not parsed, not validated, no query path.
Consequences:

- An agent asking "why is core git-blind?" must know that AGENTS.md is the
  place and then read the whole file (or trust the hash fast path).
- Superseding is a narrative act. "Which decisions are still live?" has no
  mechanical answer, and a reference to a dead decision cannot be detected.
- Project-specific decisions have no home at all: `AGENTS.md` is written by
  the adopting project, but its decision section is not part of the four
  mandatory files, so nothing checks it.

Backlog.md solves this with a first-class decision record (context / decision
/ consequences / alternatives / superseded-by, status, archive+restore).

### Shape that would fit the method

- **Optional fifth file** `docs/DECISIONS.md` — projects without it stay
  finding-free (`PROJECT_NOT_INITIALIZED` still keys on the four mandatory
  files; the fifth is opt-in, exactly like the locale tolerance layer).
- **Block format, not frontmatter** — same reasoning as backlog items: the
  file must stay readable without a parser. One `### DEC-<n> — <title>` block
  with the role bullets `Context / Decision / Consequences / Alternatives /
  Superseded by / Status`. IDs live in their own namespace (`DEC-<n>`), so the
  item convention `^[A-Z][0-9]+$` and the historical validate codes `D1…D16`
  stay untouched.
- **Read path first, write path never (M4):** resource
  `stepwell://{root}/decisions` + a `docs_status` include (`liveDecisions`)
  answer the query case; prose edits stay with the agent, like all non-structure
  text. Write tools (`decision_add`, `decision_supersede`) only if field probes
  show repeated hand-editing errors — the read/validate layer is cheap, the
  mutation layer is the expensive half.
- **Validate codes:** `DECISION_SUPERSEDES_UNKNOWN`, `DECISION_SUPERSEDED_IN_USE`
  (a superseded decision is still cited as `active` elsewhere),
  `DECISION_DUPLICATE_ID`, `DECISION_STATUS_UNKNOWN` — warning level, never
  blocking (decisions are context, not structure).

### Design tensions (why this is not just a feature)

1. **Append-only vs. in place.** The archive doctrine (Decision 12, PLAYBOOK
   §3) says history is never rewritten; Backlog.md *edits* decisions and only
   archives on demand. A STEPWELL variant would keep every decision block
   forever and let `Superseded by` do the work — but then the file grows
   unbounded and needs its own growth limit.
2. **Where do existing decisions go?** Migrating `AGENTS.md` Decisions 1–16
   into the new file would be a real doc migration with cross-repo sync
   (PLAYBOOK/LESSONS copies, SHA256 evidence) — the Q4 consolidation precedent
   shows the effort, and AGENTS.md is project-authored, not a verbatim copy.
3. **Four files vs. five.** The "four mandatory files" is load-bearing in
   `project-files.ts`, in `PROJECT_NOT_INITIALIZED`, in the init templates and
   in the method text. A fifth file is a **method** change, so it passes the
   human gate (Decision 7) and the verbatim-sync ritual — not a tool patch.

### Revisit criterion

Re-evaluate when a real project accumulates decision context it cannot keep in
`AGENTS.md` (e.g. more than ~15 project decisions, or two decisions that
supersede each other), or when field probes show agents re-deriving the same
rationale. Until then: `AGENTS.md` prose + the append-only history file stay
the answer.

As of 11/2026: brainstorming only, no implementation, no backlog root.

---

## GitHub Pull Requests — workstream transport (PARKED 11/2026: separate satellite package)

**Status: parked, no backlog root.** Design decided 11/2026 (satellite package,
silence invariant) and then deliberately shelved; the former roots M22
(read-only PR state), L20 (derived PR body) and L21 (review-to-item ingest)
were removed from the open backlog and rest in `BACKLOG_ARCHIVE` without a
Done marker. Reactivation: when a project that actually works in PRs adopts
STEPWELL, or before 1.0.0 if the field test shows the loop needs it.

Trigger: comparison with MrLesk/Backlog.md 11/2026.

**Framing:** a PR is the remote form of a workstream. The branch already
exists (`ws/m12`, `ws/m13` in this repo), the docs stay the authority, the PR
is transport plus review surface. One direction per lifecycle phase, no
bidirectional field sync — same core rule as the Jira/GitHub Issues bridge.

### Design law: silent when unused (binding)

An optional integration must cost a project that does not use it **nothing**.
This is the acceptance criterion every design choice below is measured against:

1. **No new mandatory file, no config, no init step.** A project without
   GitHub never learns that the satellite exists.
2. **No schema in the four doc files.** PR state is derived and read-only; it
   is never written back into `BACKLOG.md`/`PROGRESS.md`.
3. **No `docs_validate` finding about PRs — ever.** No `REMOTE_PR_MISSING`,
   no traceability gate, no opt-in switch either (a switch is a decision
   surface; we do not want one).
4. **No growth of the main server's surface.** `stepwell` (MCP) and
   `stepwell sync` stay byte-identical; the H4 `tools/list` contract test
   remains the lock. The satellite ships its own binary/server.
5. **Pull-only.** Nothing runs on its own: no git hooks, no daemons, no
   webhooks, no polling. Coupling exists only while a command is invoked.
6. **Degradation is local.** Missing `gh`, missing auth, rate limit → a
   structured error from that one command; every other command behaves
   exactly as before.

### Package

`packages/github` → published as `stepwell-github`, depending on
`stepwell-core` + `stepwell-git`, depending on no transport. **No SDK** —
`gh` CLI is shelled out the same way `runGit` shells out to git, so the
zero-dependency rule of core is untouched and auth stays where the platform
already keeps it.

### Patterns

#### Pattern 0 — CI template (zero coupling, no auth in the tool)
A GitHub Action template (like the optional `ci.yml` template from D1) reads
`BACKLOG.md`/`PROGRESS.md` from the PR diff and comments the step scope,
acceptance and verification expectation. No package needed, works for repos
that only adopt the file convention. Informational only — carries no state.

#### Pattern 1 — read-only PR state (backlog root `M22`)
`stepwell-github pr status` maps each registered worktree branch to
`gh pr list --head <branch> --json number,url,state,isDraft,reviewDecision,mergeable,statusCheckRollup,headRefOid`
and returns `pr?: { … }` per workstream. The agent sees red checks or
"changes requested" without leaving the loop. Missing `gh` → `GH_MISSING` in
that response only; the field is omitted (not `null`-noise) when a branch has
no PR.

#### Pattern 2 — derived PR body (backlog root `L20`)
`stepwell-github pr sync <branch>` creates/updates the body from the phase
block plus item text (Location/Problem/Fix/Acceptance) and the verification
expectation — written **only** between `<!-- stepwell:pr:begin -->` and
`<!-- stepwell:pr:end -->`, so hand-written review text outside survives.
Direction is strictly docs → PR; nothing is written back. Creating or updating
a PR is outward-facing → extends the content-gate matrix (Decision 9) with
"public write operation = high", dry-run default.

**Merge strategy note (belongs in README/SKILL with Pattern 2):** `push`
requires "trunk head ∈ ancestors(branch)" and uses `--ff-only`. A GitHub
**squash merge** rewrites the content, so the branch head is no longer an
ancestor of the new trunk head and the next `push` correctly refuses with
"re-pull necessary". Workstream PRs therefore use **merge commits**; squash
requires an explicit `sync pull` afterwards.

#### Pattern 3 — review-to-item ingest (backlog root `L21`)
`stepwell-github pr ingest <n> --dry-run` reads **unresolved** review threads
and proposes items via `planBacklogAdd` (default 🟡, provenance
`PR #<n> review <comment-id>` as a dedupe marker in the item text). No
webhook, no bot, no polling; creation only after explicit confirmation;
already-ingested comment IDs are skipped by searching the marker across open
files and archives. This is the Issues-bridge Pattern 2 with reviews as the
source.

### Guardrails

1. **Archiving stays with the tool.** `pr.state == MERGED` is a signal
   ("trunk carries stand X"), never a trigger for `archive_item` or phase
   completion — completion requires verification (typecheck/test/validate),
   not a review event.
2. **No findings crossing layers.** Codes such as `GH_MISSING`,
   `GH_UNAUTHENTICATED`, `GH_RATE_LIMIT` live in the satellite's own result
   namespace and never appear in `docs_validate`.
3. **Field-test ladder unchanged:** fixtures → dogfood in this repo (the
   `ws/*` branches already exist) → one explicitly chosen non-critical
   project. **internal-pwa is never a testbed** (Decision 14).
4. **Versioning:** the new package should ride the lockstep version
   (Decision 10) rather than introduce a compatibility matrix — if it ships
   at all, it ships in the same version. Confirm at packaging time.

As of 11/2026: parked — design recorded (satellite package, silence invariant),
implementation not started, no open backlog item. Nothing here is binding until
a reactivation decides the package surface.

