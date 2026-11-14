# AGENTS.md — stepwell

> Working instructions for AI agents & co-developers.
> **Binding method (STEPWELL):** `docs/PLAYBOOK.md` · **Review checklist:** `docs/LESSONS.md`
> Both are verbatim copies of the project-independent method — do not adapt them project-specifically here.

## Overview

Tool + MCP server for **reading, checking and managing** the method docs (`BACKLOG.md`,
`PROGRESS.md`, `docs/archive/BACKLOG_ARCHIVE.md`, `docs/archive/PROGRESS_ARCHIVE.md`)
in projects that follow the PLAYBOOK method.

**Principle: Markdown remains the source of truth.** The tool can never lose the docs
(= data loss impossible); it reads, validates and assists. Write access only via the
structure tools (`archive_item`, `progress_update`, `backlog_add/update/remove`,
`progress_plan_phase`) — everything else (prose) is edited by the agent directly in the files.

## Stack

- Node.js ≥ 22, TypeScript (strict, `NodeNext`), npm workspaces
- Vitest (test-first, RED → GREEN — see PLAYBOOK §6)
- MCP: `@modelcontextprotocol/sdk` (stdio, v1.x stable) + zod v3 — TypeScript source executed directly by Node (type stripping, no build step)

## Commands

- `npm install` — dependencies (root, workspaces)
- `npm run typecheck` — all workspace tsconfigs + root config (Vitest config)
- `npm run test` / `npm run test:watch` — Vitest
- `npm run build` — workspaces (relevant from phase 2 on)

## Structure

| Path | Purpose |
|------|---------|
| `packages/core` | parser + reports + validation — **no** MCP dependency |
| `packages/git` | git satellite `stepwell-git` (workstream sync, commit automation — Decision 14) |
| `packages/mcp` | thin MCP layer over core + git (CLI + tools) |
| `packages/*/tests` | tests per package — **are typechecked** (Lesson L12) |
| `docs/PLAYBOOK.md` | method (verbatim) |
| `docs/LESSONS.md` | checklist (verbatim) |
| `docs/QUICKSTART.md` | entry point (≤5 min: core loop, four files, five rules — Decision 15) |
| `PROGRESS.md` | step packaging + progress |
| `BACKLOG.md` | open items |

## Kickoff for new sessions (in this order)

> **Consumer protection (Decision 13, binding):** This directory is the **frozen
> consumer state** — changes only in the dev clone `../stepwell-tool-dev` (branch `dev`),
> promotion only via the ritual; consumer inventory + runbook: **maintained privately,
> outside the repo** (never published, to prevent leaks — K2/Phase 28; the mapping of the
> pseudonyms lives there too).

0. **New here?** First read `docs/QUICKSTART.md` (≤5 minutes: what STEPWELL is, the core
   loop, the four files, the five rules) — then the full kickoff order below.
1. Read `docs/PLAYBOOK.md` (method) + `docs/LESSONS.md` (checklist) — both binding.
   Fast path (PLAYBOOK §0.9): if the hashes delivered by `docs_status`/read tools/resources
   match the last known state, reading the step scope suffices —
   PLAYBOOK/LESSONS do not need to be read in full again; place independent read calls
   in parallel.
2. `PROGRESS.md` → "Active Phases": next open step in the defined order.
   Per Decision 8 (backlog root), every new piece of work is packaged from open BACKLOG
   items (priority 🔴 → 🟠 → 🟡 → 🟢 → 🔵). Approval gate per Decision 7 —
   code steps only after explicit human approval; content gates per Decision 9
   (medium for dependency manifests/tool contracts). The current state lives in
   `PROGRESS.md`/`docs_status` — do not duplicate it here.
3. **Test data:** `packages/core/tests/fixtures/` — the `README.md` there is the working
   specification for 1.2–1.6 (expected parser results + validate findings D1–D15).
   `project-a` = clean sample project (parser positive path) · `project-b-drift` = intentional drift cases (tolerance + validate).
4. **Real-format reference (read-only):** sibling repo `../internal-pwa`
   (`BACKLOG.md`, `PROGRESS.md`, `docs/archive/*`) — origin of the structure.
5. Verification before every completion: `npm run typecheck` + `npm run test` (test-first: RED → GREEN).

## Architecture decisions

Historical decisions or ones moved into the method (stack, fixtures, nomenclature duplicate, document assignment, name collision, final naming): `docs/archive/AGENTS-decisions-history.md` (append-only, no content loss).

1. **Two layers:** core is library-capable (CLI/CI later nearly free); MCP is transport only.
2. **Fault-tolerant parser:** projects follow the method, not byte-exact. Parser drift → structured warning in the `ParseResult` (Decision 3), no crash; `docs_validate` collects them. The parser makes **no format assumptions about item ids** (`id` = token between the checkbox and the first ` — `, equality exact after trim, case-sensitive); the convention itself lives in PLAYBOOK §3.
3. **Data model (binding as of 1.2):** `ParseResult<T> = { value, warnings[] }` with a uniform `Warning = { code, file, line?, message }` — parse warnings (single file) vs. validate findings (cross-consistency) kept separate; `docs_validate` aggregates. Item blocks carry `span` (line range) + `raw` (verbatim block) as the basis for the verbatim move (Lesson L16).
4. **Multi-project:** the project root is passed per tool call — one MCP instance serves any number of STEPWELL projects; resources as templates with the root in the URI.
5. **Language: English for method docs + tool surface, tolerance layer for project files (binding, 09/2026; extends I1/14.1, sharpened by I3/16.3):** **English** is the binding language of the **method docs and the entire tool surface** — PLAYBOOK/LESSONS (DE snapshots in `docs/archive/*`), section headings, field labels (Location, Acceptance, Verification, Scope), Done Index, status words, tool descriptions, CLI help, warning messages, templates, SKILL. **Content texts** (item bodies, notes, user texts) remain deliberately language-free — everyone writes them in their language. **Tolerance layer for project files:** the EN requirement applies only to the method docs — project manuals and project docs (AGENTS.md prose like this, READMEs, project-specific files) may stay in the project language; the union-matching tolerance (reads DE+EN silently for all role synonyms) remains in force for all open files. **Transition tolerance (Decision I1/14.6):** legacy DE labels in open files are read silently (`profile.ts`) — **no** `STRUCT_LOCALE` warning in `docs_validate`. The tolerance is part of the parser semantics, not an observation duty: whoever touches an item anyway flips the labels to EN in the natural edit (gradual). Append-only archives are never flagged (W2).
    *Previously (subsumed, still valid):* all code and tool terms are English — types (`BacklogItem`, `ProgressRow`), field names (`title`, `priority`, `open`, `location`, `raw`, `span`, `step`, …), tool names (`docs_status`, …), parameters (`root`, `dryRun`, `step`, `note`), warning codes (`PRIO_MISSING`, …); the same English terms (e.g. "step") are also used in prose. `message` contents of warnings are human-readable and may be German.
6. **Timestamps + migration (binding, 09/2026):** date/time entries in the four doc files always as **ISO 8601** `YYYY-MM-DDTHH:mm` (local time, e.g. `2026-09-07T15:23`) — never just `MM/YYYY` (too imprecise). The legacy stock (`YYMMDD/HHMM`, e.g. `260907/1523`, and `MM/YYYY`) is read silently (tolerance layer); `docs_validate` warns for **both** legacy formats (`DATE_LEGACY`) — like `ID_CONVENTION` — **only in open files**, never in the append-only archive. Migration: switch open files over at the next natural edit, never touch archives, new projects start with all four files (PLAYBOOK §3).
7. **Approval gate + tool obligation (binding, 09/2026):** the transition from planning/packaging to implementation happens **only after explicit human approval** (PLAYBOOK §0.4) — agents package ahead, do not start code steps on their own. The gate is temporal **and** content-related: content gates per file class, see Decision 9. Structure operations (status maintenance, archival, Done Index) always run via `progress_update`/`archive_item`, never by hand (LESSONS 17); direct edits only for prose the tool deliberately does not manage. The MCP server carries the method name (`stepwell`).
8. **Workflow: backlog root + inline-fix lane (binding, 09/2026):** every planned piece of work has a **BACKLOG root** — phases are packaged from open items (the item → step reference is documented per item), not directly from chat planning. The only exception is the **inline-fix lane:** a bug discovered during a running, approved 🔄 step may be fixed immediately if it (a) lies within the step's code scope, (b) is small (rule of thumb ≤ ~10 lines, no API/schema/design decision, no new dependency) and (c) inherits the step's approval (file class "Low" only, Decision 9). **Obligation afterwards:** retroactive `backlog_add` (series `F`) + immediate `archive_item` with the commit hash — the chain finding → item → Done Index remains gapless. Everything else stays a regular open item (methodically anchored in PLAYBOOK §0).
9. **Content gates: risk matrix (binding, 09/2026):** the approval gate (Decision 7) acts temporally (before phase start) **and** content-wise per file class: **Low** — source/test edits within the step scope → autonomous; **Medium** — dependency manifests, Dockerfiles → stop, approval per occurrence; **High** — `.env`, CI workflows, deleting existing tests, schema migrations → explicit human gate. Every case is decidable in one sentence (which file class, which level); the inline-fix lane (Decision 8) inherits Low only (PLAYBOOK §0.5/§0.6).
10. **Versioning: lockstep SemVer (binding, 09/2026):** root, `stepwell` and `stepwell-core` always carry **the same version** — fixed coupling per Decision 1 (MCP = thin transport over core), no compatibility matrix. SemVer mapping: **MAJOR** = breaking in the tool/JSON/resource contract (tool name/parameter removed/changed, resource URIs, JSON output structure) — always together with bumping the `schema` field (M6); **MINOR** = new tools/parameters/features; **PATCH** = fixes/docs-only. The four doc files can never break by construction (verbatim, append-only) — "breaking" concerns only the API surface towards agent/script. 0.x phase until the passed field test (breaking within MINORs allowed, SemVer-0 rule); **1.0.0 = release moment** after the field test, not before. Release flow: collect `Unreleased` in the CHANGELOG (Keep a Changelog 1.1.0, item L6) → version in all three package.json files + CHANGELOG entry + git tag `v<version>` → `npm publish` (primarily `stepwell`). PLAYBOOK sync hits do not trigger an npm release — they land in the CHANGELOG under the version they happen to ship with.
11. **Tool-surface guardrail (binding, 09/2026, M4):** tools exist only for concrete structure/read operations — **no** guide/meta/how-to tools; method guidance stays in the files and resources (PLAYBOOK, SKILL.md, `stepwell://templates/*`). Every new tool justifies the surface growth via the **alternatives check**: a parameter on an existing tool or a resource instead of a new tool (proof format: documented decision, as with L5/docs_review). Agents discover a small, operational surface better than a growing one. Precedents: L5/docs_review (review runs over the LESSONS checklist + docs_validate) and L19 (item-aware search runs over grep + backlog_show; reactivation as a `query` parameter on `backlog_list`).
12. **Archive order at phase completion (binding, 09/2026, M10):** `progress_update` appends the detail block at phase completion **to the end of the file** — the archives stay strictly append-only, the order is **chronological by completion time**. Consequence: phase numbers in `PROGRESS_ARCHIVE` may be **non-monotonic** (a belatedly completed older phase lands behind younger ones, e.g. `… 53 → 55 → 54`). **No** insertion at the phase-number position — that would be an insert into existing history and thus a deliberate deviation from the archive pattern; readability by number is not the archive's job. The complete, durable index remains the progress table in `PROGRESS.md`. Backed by fixture `project-h-completion-order` + tests (M10/19.3).
13. **Consumer protection: freeze split + promotion ritual (binding, 11/2026, H3):** the MCP server is loaded by live consumers directly from this directory — **global user-scoped** for all ZCode sessions (`~/.zcode/cli/config.json` → `packages/mcp/src/serve.ts`; internal-consumer uses it that way) plus project-local in internal-pwa (3× src via tsx, 1× `dist/serve.js`). **The development line is the clone `../stepwell-tool-dev` (branch `dev`)**; `main` in the frozen directory is the consumer state and moves exclusively via the **promotion ritual:** (1) in the clone typecheck + test + `docs_validate` green, (2) field probe against the live consumer (read-only `docs_status` on internal-pwa + internal-consumer), (3) merge `dev` → `main` in the frozen directory, (4) `npm run build` there (dist consumer), (5) for MAJOR contract changes, consumer coordination **before** the merge (runbook: privately maintained consumer inventory **outside the repo** — never published, to prevent leaks, K2/Phase 28), (6) repeat the field probe. **Contract** = tool names, parameters, JSON response shapes, resource URIs, warning codes (change ⇒ MAJOR per Decision 10); messages/prose remain free. PLAYBOOK/LESSONS edits are cross-repo contracts (word-identical into all sync copies, SHA256 evidence). **Alternatives check "no migration tool" (Decision 11):** for doc states, the tolerance layer + natural edit are the existing migration function (Decisions 5/6); infrastructure migration (MCP configs, SKILL copies) is runbook prose in the privately maintained consumer inventory (outside the repo), not a tool. Inventory + discovery hint (registrations can be user-/session-scoped — cross-check with the user before contract changes) live in the same place; enforcement automated via contract tests (H4/Phase 25).
14. **Workstream worktrees: git satellite, transport-neutral (binding, 11/2026, H5):** parallel phases run as **workstreams** — one git worktree + branch per phase, merge per step back to the trunk (target picture + ritual + race model: BRAINSTORM "Git integration & parallel phases", methodology: PLAYBOOK). Tool-project consequences: **core stays git-blind** (reads/writes only the four doc files); the git intelligence (sync pull/push, commit execution, registry-from-git, overlap warning) lives in a **separate satellite workspace package** (depends on core, depends on no transport). Offered **CLI-first** (`stepwell sync pull|push`, `--commit` flags — the path for skill-fed agents without MCP registration) and **MCP-optional** (the same ops as tools, thin transport, Decision 1). **Tool surface (M4 alternatives check):** commit automation = parameter on the existing mutation interface (`progress_update`/`archive_item` `commit: true`), not a new tool; commits capture **only the doc file set** (`docFileSet` — canonical four + existing archive shards, H12/32.x; deterministic staging, no secret risk), code commits stay with the agent (PLAYBOOK §4); a failed doc commit (e.g. hooks) leaves the edits applied + a structured message — never a rollback. The only genuine surface extension is the **sync tool** (pull/push, dry-run obligation, guards: dirty tree, non-fast-forward → "re-pull needed", conflict → clean abort with a structured list) — alternatives check: no existing tool can do merge choreography; as a parameter on `progress_update` the tool would be overloaded with a git obligation and would break the "structure operations only" boundary. Worktree/branch **creation and cleanup** remain agent ritual (one-time setup, not a tool). The push ancestor check (trunk head ∈ ancestors of the branch) makes stale pushes impossible; trunk derivation is zero-config (branch of the main worktree). **Field-test ladder (binding):** fixtures → dogfood in the own repo (M12/M13 as two workstreams) → only then an explicitly chosen uncritical project; **internal-pwa is never the testbed for the mechanics** — there only the established verbatim doc syncs (SHA256 evidence) + read-only field probes (Decision 13); workstream mode there is a separate, explicit decision.
15. **QUICKSTART distribution: stepwell-local, no third verbatim copy (binding, 11/2026, M12):** `docs/QUICKSTART.md` remains the **local entry document of the tool repo** — PLAYBOOK/LESSONS remain the **only** verbatim distribution copies into target projects (cross-repo sync obligation, SHA256 evidence). Rationale: QUICKSTART is an entry hook, not method statute text; a third sync copy would complicate the sync chain (method changes ⇒ simultaneously into all copies) without added value. Findability in target projects runs instead over the distribution channels that arrive there anyway: SKILL.md (distribution path M7), server `instructions` (formulated conditionally) and the target project's AGENTS. Alternatives check (M4): a `stepwell://quickstart` resource would be surface growth without a known finding — the QUICKSTART text lives in the file tree agents read anyway (kickoff step 0); reactivation criterion: field probes show agents searching for QUICKSTART in vain in the target project, then re-evaluate the resource.
