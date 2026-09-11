# stepwell

CLI + MCP server for **reading, checking and managing** the project docs
(`BACKLOG.md`, `PROGRESS.md`, `docs/archive/*`) in repos following the
[STEPWELL method](docs/PLAYBOOK.md) — steps, archive pattern, test-first.

**Status:** fifteen phases complete. Phase 1 — core library (fault-tolerant parsers,
status/validation reports) · Phase 2 — MCP server + CLI (read tools, resources) ·
Phase 3 — mutations (`archive_item`, `progress_update`, each dry-run + apply) ·
Phase 4 — locale profiles (de/en, test-first) · Phase 5 — server name `stepwell` ·
Phase 6 — review fixes (stale span, synonym regexes, CRLF roundtrip, stale check,
`STEP_DUPLICATE`) + tool CRUD (`backlog_add/update/remove`, `progress_plan_phase`,
CLI ASCII aliases, `title` parameter). Phases 7–15: CI + field test + packaging,
archive/index hardening, coverage gate, annotations, init/templates, JSON schema
versioning, token economy, STEPWELL naming, language switch to English primary.
Current state and step history: [`PROGRESS.md`](PROGRESS.md).

---

## Principles

1. **Markdown stays the source of truth.** The tool reads, validates and assists —
   it does not replace the docs. If the docs are lost, no data is lost.
2. **Fault tolerance instead of abort.** Projects follow the method, not byte-exact:
   structure drift is reported as a **structured warning** (`ParseResult<T>` with
   `warnings[]`), never as a crash. Every partial result stays queryable.
3. **Dry-run first.** The two write tools (`archive_item`, `progress_update`)
   return a **plan with a diff preview** by default; writing happens only with
   `dryRun: false` / `--apply` — afterwards the result is freshly parsed and verified.
4. **Narrow write surface.** The error-prone structural operations are automated by
   the tool (verbatim move, Done Index, status cells, item CRUD, phase planning).
   Everything else (prose, goal/acceptance texts) is edited directly in the
   Markdown files by humans/agents.
5. **Multi-project.** The project root is passed **per tool call / CLI invocation** —
   one server instance serves any number of STEPWELL projects.

**File requirement:** all four files are mandatory —
`BACKLOG.md`, `PROGRESS.md`, `docs/archive/BACKLOG_ARCHIVE.md`,
`docs/archive/PROGRESS_ARCHIVE.md`. If one is missing, the project does not
load (hard error with a clear message).

**Format legend** (canonical: [PLAYBOOK](docs/PLAYBOOK.md) §3 + §7):

| Symbol | Meaning | ID series |
|--------|-----------|----------|
| 🔴 critical · 🟠 high · 🟡 medium · 🟢 low | backlog priority = section | `K`/`H`/`M`/`L` (auto numbering) |
| 🔵 test gap | backlog priority = section | no series — explicit ID required |
| ⬜ open · 🔄 in progress · ✅ done · ⛔ blocked | step status in `PROGRESS.md` | steps `<Phase>.<x>` (e.g. `7.2`) |
| other series letters (`R`, `T`, `D`, …) | thematic series, not priority-bound | consecutive, never reused |

---

## Requirements & setup

- **Node.js ≥ 22.18** — the repo ships TypeScript source and uses Node's native
  type stripping (no build step).

```bash
npm install
npm run typecheck   # strict, covers src AND tests
npm run test        # Vitest, protocol-faithful against the fixtures
npm run test:watch
```

---

## MCP server

Server name `stepwell` (transport **stdio**, entry `packages/mcp/src/serve.ts`).

This repo already wires the server into `opencode.json` (restart opencode after
config changes). Other MCP clients (Claude Desktop, Cursor, …) follow the same
pattern:

```json
{
  "mcp": {
    "stepwell": {
      "type": "local",
      "command": ["node", "/path/to/stepwell-tool/packages/mcp/src/serve.ts"],
      "enabled": true
    }
  }
}
```

Manual verification with the inspector:

```bash
npx @modelcontextprotocol/inspector node packages/mcp/src/serve.ts
```

The test suite covers the same protocol path automatically
(`InMemoryTransport` + client, plus a real stdio handshake test).

### Distribution (two channels)

1. **MCP server:** `npx stepwell` (or `serve.ts`) — operational, tools as below.
   The published package ships **compiled `dist`** (since 10.4/H1) and therefore
   runs directly from `node_modules` — `prepublishOnly` builds before publishing.
2. **SKILL.md:** `packages/mcp/skills/stepwell/SKILL.md` (included in the npm pack) —
   portable signpost for skill ecosystems (Claude Skills, Gemini CLI, …): which tool
   when, gates (release/content), test-first, status maintenance only via tools.
   It replaces neither the MCP server nor PLAYBOOK.md — both remain binding.

### Tools

All tools take `root` (absolute path to the project root) **per call**. All JSON text
payloads are **compact** (no indentation — token economy, E1). `docs_validate`,
`progress_update` and `archive_item` also deliver their data as
`structuredContent` only on opt-in with `structured: true` (M3/9.7, dedupe since
E1 — default is text only); error responses (`isError: true`, including
`PROJECT_NOT_INITIALIZED`) carry no `structuredContent`.
Errors (missing mandatory file, unknown ID/phase) return `isError: true`
with a clear message — the server does not crash.

#### Read

| Tool | Parameters | Result |
|------|-----------|--------|
| `docs_status` | `root`, optional `include[]` | Aggregate: open items per priority, 🔄 steps + assigned phases, ✅ quote of the table, all findings + warnings, `hashes` (SHA256 per doc file, E2); with `include: ["nextStepScope"]` (E2) additionally goal/acceptance/scope bullet + merged backlog item of the next step (1 call instead of `progress_show` + `backlog_show`) |
| `backlog_list` | `root`, optional `priority[]`, `open`, `section`, `fields[]` | Items of BACKLOG.md **without `raw`** (lean payload) + parse warnings; with `fields` (e.g. `["id","title","priority","open","section"]`) items are projected onto the listed fields (token economy, E1) |
| `backlog_show` | `root`, `id` | Merge view for one item ID across open BACKLOG ↔ Done Index ↔ BACKLOG_ARCHIVE, including `raw` + `span`; case-sensitive |
| `progress_list` | `root`, optional `status` | Rows of the progress table `{step, name, status}` |
| `progress_show` | `root`, `phase` | Detail block including `raw` — search across running phases **and** archive (name, title or `name — title`) |
| `docs_validate` | `root`, optional `structured` | Validate findings (consistency rules) + collected parse warnings, `ok` |

#### Write (dry-run + apply)

| Tool | Parameters | Behaviour |
|------|-----------|-----------|
| `archive_item` | `root`, `id`, optional `note`, `locale`, `structured`, `detail`, `dryRun` (**default `true`**) | Plans the **verbatim move** of an item: remove the block (span-based) from BACKLOG.md, in the archive copy flip the checkbox → `[x]`, optional `note` becomes the done line; plus a one-liner `- <ID> — <title> — done (note?)` at the end of the Done Index. Apply verifies freshly: ID gone from open, present in archive + index, no findings left. This is the antidote to the `NOT_ARCHIVED` (D2) validate finding. |
| `progress_update` | `root`, `phase`, `step` (string **or string[]** for multi-step in one call, only with `dryRun: false`; all steps are validated before the first write and `detail: "summary"` is rejected for multi-step), `status` (`⬜🔄✅⛔`), optional `title`, `note`, `checkpoint` (commit SHA, 7–40 hex), `locale`, `structured`, `detail`, `dryRun` (**default `true`**) | Sets the status cell(s) of the steps (missing rows are added, name derived from the scope bullet); on 🔄 creates a detail-block skeleton under "Active Phases" (`### Phase …` + `**Scope (Steps):**` + step bullet — **no** invented goal/acceptance texts); `title` renames the block heading consistently (rename → archival in the same call is defined); if afterwards no step of the phase is still 🔄/⬜, the block moves **verbatim** into PROGRESS_ARCHIVE (`note`/`checkpoint` → verification line, response contains the doc-sync reminder) — with step arrays completion is detected automatically at the last step. Apply verifies row, block move and `docs_validate`. |
| `backlog_add` | `root`, `section`, `title`, `priority` (`🔴🟠🟡🟢🔵`), optional `id`, `text`, `detail`, `dryRun` | Creates an open item at the **end of the target section**: ID with convention check (`^[A-Z][0-9]+$`), auto-assignment = next free number of the priority series (K/H/M/L; 🔵 requires an explicit ID), `text` bullets verbatim, `As of:` timestamp in the heading is updated. |
| `backlog_update` | `root`, `id`, optional `title`, `priority`, `section`, `text`, `detail`, `dryRun` | Changes title/priority/text/section in the block format (span recomputation, checkbox and `*(…)*` suffix are preserved). A priority change moves the block into the matching priority section. |
| `backlog_remove` | `root`, `id`, optional `note`, `locale`, `detail`, `dryRun` | **No hard delete:** block moves verbatim into BACKLOG_ARCHIVE (checkbox stays `[ ]`, optional `note` → `**Removed:**` line), the Done Index gets a tail without a done marker (`- <ID> — <title> — removed (note?)`). `docs_validate` deliberately does **not** report checkbox-`[ ]` blocks as `ARCHIVE_WITHOUT_INDEX`. |
| `progress_plan_phase` | `root`, `phase` (`"Phase <N>[ — Title]"`), `steps: [{step, name}]`, optional `detail`, `dryRun` | Plans a phase **ahead**: table rows for all steps (`⬜`, with names) + detail-block skeleton with the full scope. Validates the step prefix (`Phase 7` → `7.x`), duplicates and occupied phases/steps. `PLAN_WITHOUT_WIP` is the defined state until the first 🔄. |

**Response formats:** dry-run returns the plan `{dryRun, changes:[{file, description,
before, after, diff}]}`; apply returns `{written, verification:{ok, messages}}`.
With `detail: "summary"` (E1) dry-run `changes` are projected onto `{file, description,
beforeLines, afterLines}` + top-level marker `detail: "summary"` —
the default stays `"diff"` with the full preview (safety note unchanged).

### Locale profiles

The doc files may be formatted **in German or English** — mixed within the same
repo is forbidden; one language per project. The tool separates:

- **Reading: always language-tolerant (zero-config).** Parser and validator
  recognise the role markers of both languages via union matching — `Erledigt-Index|Done Index`,
  `Ort|Location`, `erledigt|done`, `Ziel|Goal`, `Abnahme|Acceptance`,
  `Verifikation|Verification`, `Umfang|Scope`, `Fortschritt|Progress`,
  `Laufende Phasen|Active Phases`, `abgeschlossen|completed`, `Stand:|As of:`.
- **Writing: the `locale` option** on `archive_item` and `progress_update`/
  `backlog_remove` (`"de" | "en"`; default = **auto-detection** from the
  file context, tie → `en` since 14.3). Generated texts (index line,
  done/verification/removed markers, skeletons) follow the target language;
  CLI equivalent: `--locale de|en`.
- **More languages:** `packages/core/src/profile.ts` holds the role synonyms —
  a new language is a new key per role, no parser rebuild.

### Resources (resource templates)

The root is **percent-encoded** into the URI segment (Windows paths
contain `:` and `\`); the read callback decodes it. Content verbatim,
`text/markdown`:

```
stepwell://{root}/backlog          → BACKLOG.md
stepwell://{root}/progress         → PROGRESS.md
stepwell://{root}/archive/{kind}   → kind = "backlog" | "progress"
stepwell://{root}/phase/{phase}    → phase context: phase verbatim + table rows
                                     + merged backlog item bodies in step order (G5/12.6)
stepwell://{root}/hashes           → SHA256 per doc file (application/json;
                                     hash short-circuit, E2/12.5 — fast-path foundation E3)
stepwell://templates/{kind}        → skeletons of the four mandatory files
                                     (kind = "backlog" | "progress" |
                                      "backlog-archive" | "progress-archive")
```

**M4 alternative check (G5):** resource instead of tool — the phase context is a pure
read path, and the composition happens **at read time** instead of as a duplicate in the
files (anti-drift): a subagent gets phase + item bodies in one read, without a new tool
growing the surface.

Example: `stepwell://D%3A%5Cproj%5Cdemo/backlog`

**Project init (M8, variant A):** for newly created projects the agent reads the four
skeletons from `stepwell://templates/{kind}` and creates the files itself —
deliberately **no** `init_project` write tool (M4 guardrail: keep the write surface
small); the skeletons live canonically in `stepwell-core` (`projectTemplates`) and are
finding-free under `docs_validate`. The init-fallback guidance (`PROJECT_NOT_INITIALIZED`)
points to this path.

---

## CLI

`packages/mcp/src/cli.ts` — runnable directly in the workspace repo
(`node packages/mcp/src/cli.ts …`); from the installed package
(`npm i -g stepwell` or `npx stepwell`) under the bin name
`stepwell`.
Human output on stdout; `--json` returns the core payloads with a leading
`schema` version field (currently **2**, bumped with N1/13.2 — a resource-URI change is a MAJOR contract). Field contract per command:

| Command | Fields (besides `schema`) |
|---------|--------------------------|
| `status` | `openByPriority`, `openTotal`, `runningSteps`, `runningPhases`, `doneQuote`, `nextStep`, `nextPriority`, `warnings` |
| `backlog` | `count`, `items[]` (without `raw`), `warnings` |
| `progress` | `count`, `rows[]`, `warnings` |
| `validate` | `findings[]`, `warnings[]`, `ok` |
| `archive` (dry-run) | `root`, `id`, `dryRun`, `note`, `changes[]` |
| `archive --apply` | `written[]`, `verification{ok, messages[]}` |
| `progress-update` | like `archive` plus `phase`, `step`, `status`, `title`, `completedPhase`, `checkpoint?` |

**Contract rule (M6/Decision 16):** a breaking change to this field set ⇒
bump `schema` (in lockstep with the npm MAJOR).

### Releases (version policy, L6)

- **Format:** [`CHANGELOG.md`](CHANGELOG.md) per Keep a Changelog 1.1.0, `[Unreleased]`
  on top, curated user-relevant aggregates. **Redundancy rule:** no git-log dump,
  no duplication of Done Index/BACKLOG_ARCHIVE — item/commit history stays
  in the STEPWELL files. Date format `YYMMDD/HHMM` (Decision 11) instead of ISO —
  documented deviation.
- **Lockstep SemVer (Decision 16):** root, `stepwell` and `stepwell-core`
  always carry the same version. MAJOR = breaking in the tool/JSON/resource contract
  (always together with the `schema` field), MINOR = new tools/features, PATCH = fixes.
  0.x until the passed field test; `1.0.0` = release moment.
- **Publish checklist:** (1) curate `Unreleased` in the CHANGELOG, (2) bump the version in
  all **three** `package.json` (lockstep), (3) CHANGELOG section `[<version>] - <YYMMDD/HHMM>`,
  (4) git tag `v<version>`, (5) publish **only** `stepwell`
  (`npm publish --otp`, dist-tag `latest`; core is distributed as a dependency),
  (6) CI job `pack-smoke` must be green — dynamic since 10.5/H1, proves the handshake
  against the installed artefact (`server stepwell`).

```bash
# Status aggregate
node packages/mcp/src/cli.ts status --root <project> [--json]

# List/filter backlog — icons or ASCII aliases (red/kritisch/p1, hoch/p2, mittel/p3, niedrig/p4, blue/test/p5)
node packages/mcp/src/cli.ts backlog --root <project> [--priority red,yellow] [--open false] [--section HIGH] [--json]

# Progress table — status as icon or alias (open, running/wip, done, blocked)
node packages/mcp/src/cli.ts progress --root <project> [--status done] [--json]

# Consistency check (exit 1 on findings — CI-suitable)
node packages/mcp/src/cli.ts validate --root <project> [--json]

# Archive a completed item (dry-run preview, then --apply)
node packages/mcp/src/cli.ts archive --root <project> --id H1 [--note "Commit abc1234"] [--locale en] [--apply]

# Maintain step status (dry-run preview, then --apply) — --title renames the block heading
node packages/mcp/src/cli.ts progress-update --root <project> --phase "Phase 2" --step 2.2 --status running [--title "New title"] [--note "…"] [--checkpoint <sha>] [--locale en] [--apply]
```

Invalid values exit with code 2 and the list of allowed aliases (e.g.
`🔴=red/kritisch/p1, …`, `⬜=open, 🔄=running/wip, ✅=done, ⛔=blocked`).

**Exit codes:** `0` success (or no validate findings) · `1` error or
validate findings · `2` usage error (unknown command, missing required option).

---

## CI (optional)

This repo uses GitHub Actions (`.github/workflows/ci.yml`): install → typecheck
→ test (JUnit + coverage report as artefact) → `validate --root .` (exit 1 on
doc findings flips the job).

**For smaller projects the local run suffices** — the pipeline is overkill when
nobody looks at it:

```bash
npm install && npm run typecheck && npm run test && node packages/mcp/src/cli.ts validate --root .
```

STEPWELL projects may copy `ci.yml` as a template; the method (PLAYBOOK) does not
require CI.

---

## Warning codes

**Parse warnings** arise when parsing individual files (drift tolerance),
**validate findings** check cross-file consistency (`docs_validate`
collects both). Convention warnings affect **only open files** — archives
are append-only and never flagged. A UTF-8 BOM (U+FEFF) at the start of a file
is silently tolerated (stripped deterministically, T5/9.13) — no warning.

| Code | Level | Meaning |
|------|-------|-----------|
| `PRIO_MISSING` | parse | no priority suffix in the title — priority taken from the section emoji |
| `PRIO_DUPLICATE` | parse | several priority markers in the title — one is captured |
| `PRIO_UNKNOWN` | parse | unknown priority emoji (e.g. 🟣) — `priority: "unknown"` |
| `BLOCK_UNSTRUCTURED` | parse | item without `**Label:**` bullets — free text captured as `text` |
| `TITLE_EMPTY` | parse | item ID without a title after the separator |
| `STATUS_UNKNOWN` | parse | unknown status icon in the table — `status: "unknown"` |
| `ROW_INCOMPLETE` | parse | table row without a status column |
| `NOT_ARCHIVED` (D2) | validate | `[x]` checkbox still hangs in the open BACKLOG → `archive_item` |
| `ID_DUPLICATE` (D5) | validate | item ID appears twice |
| `ID_CONVENTION` (D14) | validate | ID violates `^[A-Z][0-9]+$` (series letter + number) — warning, item stays listed |
| `INDEX_WITHOUT_ARCHIVE` (D8) | validate | Done Index entry without an archive block |
| `ARCHIVE_WITHOUT_INDEX` (D13) | validate | completed archive block (`[x]`) without a Done Index entry; removed blocks (checkbox `[ ]`, via `backlog_remove`) are deliberately indexless |
| `WIP_WITHOUT_PLAN` (D11) | validate | 🔄 row without a matching detail block |
| `PLAN_WITHOUT_WIP` (D12) | validate | detail block without a 🔄 step (orphaned or planned ahead via `progress_plan_phase`) |
| `STEP_DUPLICATE` (R6) | validate | step number appears twice in the progress table — `progress_update` maintains only the first row |
| `DATE_LEGACY` (D15) | validate | legacy `MM/YYYY` date in open files — canonical is `YYMMDD/HHMM` (e.g. `260907/1523`) |
| `PROJECT_NOT_INITIALIZED` (M5) | validate | root without a STEPWELL project (all four files missing) — exactly one finding with guidance instead of an error desert; `docs_status` returns the zero aggregate + this finding, read/mutation tools a structured error response (`code`/`message`/`missing`). Partial stock (a single file missing) stays a hard error per file. Contract exception: `file` carries the project root (directory) here, not a file path |

---

## Typical workflow (agent + stepwell)

```text
1. docs_status            → where do we stand? Which priorities are open?
2. backlog_list --open    → what is next? (BINDING: sequential by priority)
3. (work on the code, test-first — the agent edits prose directly)
4. progress_plan_phase    → plan a new phase ahead (rows + scope skeleton)
5. progress_update (🔄)   → step started: keep table + detail block clean
6. progress_update (✅)   → step done; if the phase is complete, the block moves into the archive
7. backlog_add/update     → create/change items format-safe (instead of hand-editing)
8. archive_item           → archive the completed item verbatim + Done Index
9. backlog_remove         → move an obsolete item into the archive (without a done marker)
10. docs_validate         → must be clean before committing
```

The PLAYBOOK rules (sequence, test-first, commit discipline, archive pattern) live in
[`docs/PLAYBOOK.md`](docs/PLAYBOOK.md); the review checklist in
[`docs/LESSONS.md`](docs/LESSONS.md).

---

## Architecture

**Design rule (M4/Decision 17):** the tool surface stays small — tools only for
concrete structure/read operations, no guide/meta tools; method knowledge lives in
PLAYBOOK.md, SKILL.md and the resources. Every new tool (or new parameter surface)
justifies the surface growth via the **alternative check** (parameter on an existing
tool/resource instead of a new tool) — documented like the docs_review decision (L5).

```
packages/
├── core/                 stepwell-core — zero dependencies, no MCP dependency
│   ├── src/backlog.ts    BACKLOG parser (sections, item blocks, Done Index)
│   ├── src/progress.ts   PROGRESS parser (table, detail blocks) + scopeSteps
│   ├── src/archive.ts    archive parser (ArchiveItem = BacklogItem + doneLine)
│   ├── src/project.ts    loadProject (4-file requirement, lazy + memoized), backlogShow
│   ├── src/status.ts     docsStatus (aggregate)
│   ├── src/validate.ts   docsValidate (consistency rules + parse warnings)
│   ├── src/mutations.ts  plan/apply: archive_item, progress_update, backlog CRUD, planPhase
│   ├── src/aliases.ts    ASCII aliases for priority emojis and status icons (CLI)
│   ├── src/diff.ts       line-based mini diff for the plan preview
│   ├── src/profile.ts    locale profiles: role synonyms de/en (read union, write canonical)
│   └── tests/fixtures/   project-a (clean) + project-b-drift (cases D1–D15)
│                         + project-d-tablefirst (table before detail blocks),
│                         README there = working specification
└── mcp/                  stepwell — thin transport layer over core
    ├── src/server.ts     createDocsServer (all tools + resources)
    ├── src/tools.ts      tool registration (JSON payloads, isError wrapping)
    ├── src/resources.ts  resource templates (percent-encoded root)
    ├── src/serve.ts      stdio entry
    └── src/cli.ts        stepwell command line
```

- **Stack:** TypeScript (strict, `NodeNext`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`), npm workspaces, Vitest, MCP SDK **v1.x stable**
  (`^1.30.0`) + zod v3. Deliberately decided against build/bundle steps:
  Node ≥ 22.18 executes the TS source directly (type stripping), import specifiers
  therefore end on `.ts`.
- **Data model:** `ParseResult<T> = { value, warnings[] }`,
  `Warning = { code, file, line?, message }` — item blocks carry `span` (lines)
  and `raw` (verbatim) as the basis of the verbatim move.
- **Tests:** 318 tests, developed test-first (RED → GREEN). Mutations in tests run
  **exclusively** against temp copies of the fixtures — the originals are
  read-only and protected by a test.

## Development

```bash
npm install && npm run typecheck && npm run test   # acceptance before every completion
npx vitest run packages/core                       # core only
npx vitest run packages/mcp                        # MCP/CLI only
```

New features follow the STEPWELL method: plan → package in `PROGRESS.md` →
implement test-first → verification → commit → maintain status. Details:
[`AGENTS.md`](AGENTS.md).
