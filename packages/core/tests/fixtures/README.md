# Fixtures — Test Data for Parser & Validation

> Contents are fictional / anonymized; the **structure** mirrors real projects
> that follow the PLAYBOOK method (reference: sibling repo `../stadtpfad-pwa` —
> read-only). This file is the working **specification** for steps 1.2–1.6:
> parser tests are written **red** against `project-a` first, then driven
> **green** by the implementation.

## Layout

```
fixtures/
├── project-a/             # clean, complete template project (parser positive path)
│   ├── BACKLOG.md
│   ├── PROGRESS.md
│   └── docs/archive/
│       ├── BACKLOG_ARCHIVE.md
│       └── PROGRESS_ARCHIVE.md
├── project-b-drift/       # intentional drift / edge cases (parser tolerance + validate findings)
│   ├── BACKLOG.md
│   ├── PROGRESS.md
│   └── docs/archive/
│       ├── BACKLOG_ARCHIVE.md
│       └── PROGRESS_ARCHIVE.md
├── project-c-en/          # English format (locale profile, Phase 4 — parser positive path)
│   ├── BACKLOG.md
│   ├── PROGRESS.md
│   └── docs/archive/
│       ├── BACKLOG_ARCHIVE.md
│       └── PROGRESS_ARCHIVE.md
├── project-d-tablefirst/  # like project-a, but PROGRESS.md with table BEFORE detail blocks
│   ├── BACKLOG.md         #   (mutation regression R1: row append + phase completion)
│   ├── PROGRESS.md
│   └── docs/archive/
│       ├── BACKLOG_ARCHIVE.md
│       └── PROGRESS_ARCHIVE.md
├── project-e-tableindex/  # like project-a, but Done Index as a table (real format
│   ├── BACKLOG.md         #   stadtpfad-pwa; W1/8.1) — parser positive path of the
│   ├── PROGRESS.md        #   tolerated index-table variant
│   └── docs/archive/
│       ├── BACKLOG_ARCHIVE.md
│       └── PROGRESS_ARCHIVE.md
├── project-g-mixed/       # EN open files + DE archives (I1/14.5 — Decision 10
│   ├── BACKLOG.md         #   migration tolerance). The DE archives are append-only
│   ├── PROGRESS.md        #   and stay in their historical locale; union matching
│   └── docs/archive/      #   tolerates legacy DE bullet labels in EN open files.
│       ├── BACKLOG_ARCHIVE.md
│       └── PROGRESS_ARCHIVE.md

project-empty/             # empty directory (.gitkeep only; M5/9.3) — root WITHOUT a
                           #   STEPWELL project: docs_validate/docs_status → exactly
                           #   one PROJECT_NOT_INITIALIZED finding.

project-f-bom/             # byte-identical to project-a, but all four files start
    ├── BACKLOG.md         #   with a UTF-8 BOM (U+FEFF) (T5/9.13) — parser strips
    ├── PROGRESS.md        #   deterministically; output equals the BOM-less variant;
    └── docs/archive/      #   validate stays finding-free.
        ├── BACKLOG_ARCHIVE.md
        └── PROGRESS_ARCHIVE.md
```

The project root is the folder that contains `BACKLOG.md` / `PROGRESS.md` —
exactly as in real projects.

## Expected Parser Results (project-a) — basis for the red tests

### BACKLOG (`project-a/BACKLOG.md`)

- **Sections** (title + priority from emoji): `🔴 CRITICAL` (empty, "> No open items."),
  `🟠 HIGH` (2 items), `🟡 MEDIUM` (empty), `🟢 LOW` (1 item), `🔵 TEST GAPS` (1 item),
  `📋 OPEN ISSUES R-SERIES` (1 item), `🎨 UI DESIGN REVIEW` (2 items, multi-line
  header rule in a blockquote — the rule lines are **not** items).
- **Item block pattern:** `### [ ] <ID> — <Title> — <Priority>` (+ optional
  `*(…)*` suffix), followed by bullets `**Location:**`, `**Problem:**`/`**Why:**`,
  `**Fix:**`/`**Scope …:**`, `**Acceptance:**`.
- **Open IDs:** H1, H2, L3, T8, R4, U21, U22 (all `open: true`). Priority
  derivation as fixed below: the title suffix wins, otherwise the section emoji —
  `R4` carries 🟠 explicitly in the title, `*(before pilot operation mandatory)*`
  is only the rationale; without any cue it is `unknown` + warning.
- **Done Index:** one-liner under `## ✅ Done Index` with the pattern
  `- <ID> — <short text> — done in <sha7> …` → S1, S2, M7 (`open: false`,
  capture title / short text).

### PROGRESS (`project-a/PROGRESS.md`)

- **Progress table:** rows `| <nr> | <name> | <icon> |` with icons ⬜ 🔄 ✅ ⛔
  (here: 0.1–1.3 ✅, 2.0 ⛔, 2.1 🔄, 2.2/2.3 ⬜).
- **Active Phases:** exactly one detail block `### Phase 2 — UI Polish` with
  `**Goal:**`, `**Acceptance:**`, `**Scope (Steps):**` + bullet list.

### Archive (project-a/docs/archive/)

- `BACKLOG_ARCHIVE.md`: complete item blocks, checkbox `[x]`, end marker
  `**Done:** Commit <sha7> …` → S1, S2, M7 (matches the Done Index exactly).
- `PROGRESS_ARCHIVE.md`: detail blocks `### Phase 0 — …` / `### Phase 1 — …`
  (+ `*(completed MM/YYYY)*` — legacy format, shows tolerance; canonical is
  `YYMMDD/HHMM`), same field structure as active phases.
- **Consistency (basis for `docs_validate`, 1.6):** project-a is **finding-free** —
  index ↔ archive match; every 🔄 row has a detail block and vice versa.

## Expected Parser Results (project-e-tableindex) — Done Index as Table (W1/8.1)

- **Done Index as a table** (real format stadtpfad-pwa): heading in uppercase with
  a bracket note (`## ✅ DONE INDEX (one-liner — …)`), below a GFM table
  `| Series | Item (short) | Commit/Phase |`. The parser recognises the table as a
  **tolerated index variant** (union matching alongside the bullet one-liner):
  - Header row(s) **before** the separator row (`|---|`) are skipped; only data
    rows after the separator are captured.
  - Column `Item` → `id` = first token, `summary` = remainder; column `Commit/Phase` →
    `sha` = first backtick token (a phase reference without backticks → **no** `sha`).
  - Bullet one-liners and table rows may be mixed (both variants count).
- **Expected `doneIndex`:** `K5` ("SQL-Injection Column Whitelist", `sha: d4e5f6a`),
  `M8` ("Cache-Header for static assets", **without** `sha`).
- **Consistency:** project-e is **finding-free** — `docsValidate(project-e-tableindex)`
  reports `ok: true`, in particular **no** `ARCHIVE_WITHOUT_INDEX` (the index table
  fills `doneIndex` exactly matching the archive K5/M8).
- **Edge cases (inline tests, not part of the fixtures):** a range row
  (`L1–L3 …`) is captured as one entry with `id: "L1–L3"` (convention check then
  honestly fails); tables with only two columns read `id` from the first column.

## Expected Findings (project-b-drift) — validate checklist for 1.6

| # | Case | File | Expected reaction |
|---|------|------|-------------------|
| D1 | Item without priority suffix (`K9`) | BACKLOG | list it, `priority: 🔴` from **section fallback** + `PRIO_MISSING` warning |
| D2 | `[x]` checkbox still in the open area (`H9`) | BACKLOG | validate: "not archived" |
| D3 | Duplicate priority marker (`L9`) | BACKLOG | parse without crash, 1× priority |
| D4 | Item without Location/Problem bullets (`L10` no. 1) | BACKLOG | capture free text as `text` |
| D5 | Duplicate item id (`L10` twice) | BACKLOG | validate: "duplicate id" |
| D6 | Unknown section emoji `🟣` (`X1`) | BACKLOG | `priority: unknown` + warning |
| D7 | Id without title after the separator (`T9`) | BACKLOG | tolerate empty title + warning |
| D8 | Index entries **without** an archive block (`S9`, `M9`) | BACKLOG | validate: "missing in archive" |
| D9 | Unknown status icon `❓` (1.2) | PROGRESS | `status: unknown` + warning |
| D10 | Table row without a status column (1.3) | PROGRESS | tolerate + warning |
| D11 | 🔄 row without a detail block (1.4) | PROGRESS | validate: "no package" |
| D12 | Detail block without an active phase | PROGRESS | validate: "orphan block" |
| D13 | Archive block **without** an index entry (`Z9`) | BACKLOG_ARCHIVE | validate: "missing from Done Index" |
| D14 | Id violates the naming convention (`fix_me`) | BACKLOG | `ID_CONVENTION` warning, item still listed |
| D15 | Date only as `MM/YYYY` (the `As of:` header of the drift BACKLOG) | BACKLOG | `DATE_LEGACY` warning — open files only, never archives |
| D16 | Archive block without priority suffix (`Z8`) | BACKLOG_ARCHIVE | parser warns (`PRIO_MISSING`), but `docs_validate`/`docs_status` do **not** pass parse warnings through from archive files (W2/8.2 — "archives are never faulted"); consistency findings (e.g. `ARCHIVE_WITHOUT_INDEX`) remain |

**Parser ground rule (AGENTS.md no. 2):** drift → structured warning, **never abort**.
Each partial result (including `unknown`) stays queryable.

**Priority derivation (binding, decision 09/2026):** title suffix wins → otherwise
section emoji as fallback (+ `PRIO_MISSING` warning) → only when both are missing:
`unknown` + warning.

## Cross-Locale Tolerance (project-g-mixed) — I1/14.5 + I1/14.6

The fixture `project-g-mixed` exercises the Decision 10 migration tolerance:

- **Open files are English** by convention (BACKLOG.md, PROGRESS.md).
- **Archives are append-only** and stay in their historical locale (here: German
  BACKLOG_ARCHIVE.md / PROGRESS_ARCHIVE.md — never re-locale'd).
- **Union matching** tolerates legacy DE bullet labels (`**Ort:**`,
  `**Abnahme:**`, …) inside EN open files, and EN labels inside DE files, without
  warning or block.
- **Done Index entries** in the open file reference IDs that exist in the archive
  regardless of archive locale — the cross-consistency check is locale-agnostic
  (`INDEX_WITHOUT_ARCHIVE` / `ARCHIVE_WITHOUT_INDEX` fire on ID set diffs only).
- **`detectLocale`** returns `en` for the open files and `de` for the archives.

**Decision I1/14.6 — silent tolerance, no `STRUCT_LOCALE` warning:** Legacy DE
labels in open files remain silent (union matching already absorbs them). The
tolerance is part of parser semantics, not an observation duty — anyone who
touches an item anyway flips its labels to EN at the natural edit. The
`project-g-mixed` fixture therefore expects `docsValidate → ok: true`; no
warning code is added to `validate.ts`. Append-only archives are never
faulted (W2). Reactivation criterion: a future dogfooding round in 0.x shows
that legacy DE labels actually accumulate in the open files of a long-running
project, then revisit the `DATE_LEGACY`-pattern warning in a separate decision.

## Interface Reference (binding from 1.2, decision 09/2026)

> **Terminology (binding):** all code and tool terms are **English** — types,
> field names, tool names, parameters, warning codes. German terms (Step, Done
> Index, …) live only in prose / docs, never in the API. `message` content of
> warnings is human-readable and may remain in the author's language.

### Categories (Enums)

| Category | Values | Markdown source | Drift behaviour |
|---|---|---|---|
| `priority` | 🔴 🟠 🟡 🟢 🔵 · `unknown` | title suffix `— 🟠`, fallback section emoji | D1, D3, D6 |
| `open` | `true` `false` | checkbox `[ ]` / `[x]` | `[x]` in the open area → D2 |
| `status` | ⬜ 🔄 ✅ ⛔ · `unknown` | icon column of the progress table | D9, D10 |
| Bullet labels | free set (`Location`, `Problem`/`Why`, `Fix`/`Scope`, `Acceptance`, `Done`, `Goal` …) | `**Label:**` bullets | no bullets → free text as `text` (D4); `location` is the only dedicated field |

### Item IDs (convention, PLAYBOOK §3)

- **Parser (tolerant):** `id` = the token between the checkbox and the first
  ` — `, trimmed, non-empty; equality is exact string comparison (case-sensitive).
  No format assumption.
- **Convention (recommended / checked):** `^[A-Z][0-9]+$` — violation → warning
  `ID_CONVENTION` (D14), never abort.
- **Namespaces:** item IDs and `ProgressRow.step` (`<Phase>.<Nr.>`) are separate.

### Timestamps & Migration (PLAYBOOK §3)

- Canonical format: `YYMMDD/HHMM` (e.g. `260907/1523`) for `*(done …)*`,
  `*(completed …)*` and `As of:` header lines.
- Tolerance: the `MM/YYYY` legacy stock is parsed/validated without abort;
  `DATE_LEGACY` warning **only in open files** — archives are append-only and
  therefore exempt (D15).
- `completedOn` stores the date **verbatim** (no normalisation).

### Data Objects (core)

| Object | Fields | Step |
|---|---|---|
| `ParseResult<T>` | `value`, `warnings[]` | 1.2 |
| `Warning` | `code`, `file` (file path; **exception:** root-level findings like `PROJECT_NOT_INITIALIZED` carry the project root as a directory), `line?`, `message` | 1.2 |
| `BacklogItem` | `id`, `title`, `priority`, `section`, `open`, `location?`, `text`, `span{start,end}`, `raw` | 1.2 |
| `DoneEntry` | `id`, `summary`, `sha?` | 1.2 |
| `Backlog` | `sections[]` (`title`, `emoji`, `headerRule`), `items[]` (flat), `doneIndex[]` | 1.2 |
| `ProgressRow` | `step` (`"2.1"`), `name`, `status` | 1.3 |
| `PhaseBlock` | `name` (`"Phase 2"`), `title`, `goal`, `scope[]`, `acceptance`, `verification?`, `completedOn?` (YYMMDD/HHMM or MM/YYYY stock, verbatim, archive only), `span`, `raw` | 1.3 |
| `ArchiveItem` | = `BacklogItem` + `doneLine` | 1.4 |

### Warning Codes

| Code | Level | Case |
|---|---|---|
| `PRIO_MISSING` | Parse | D1 |
| `PRIO_DUPLICATE` | Parse | D3 · `PRIO_UNKNOWN` D6 |
| `BLOCK_UNSTRUCTURED` | Parse | D4 · `TITLE_EMPTY` D7 |
| `STATUS_UNKNOWN` | Parse | D9 · `ROW_INCOMPLETE` D10 |
| `NOT_ARCHIVED` | Validate | D2 · `ID_DUPLICATE` D5 |
| `INDEX_WITHOUT_ARCHIVE` | Validate | D8 · `ARCHIVE_WITHOUT_INDEX` D13 (only `[x]` blocks; removed blocks with checkbox `[ ]` are intentionally indexless) |
| `ID_CONVENTION` | Validate | D14 |
| `DATE_LEGACY` | Validate | D15 |
| `WIP_WITHOUT_PLAN` | Validate | D11 · `PLAN_WITHOUT_WIP` D12 |
| `STEP_DUPLICATE` | Validate | duplicate step number in the progress table (R6, from 6.6; test via temp copy) |
| `PROJECT_NOT_INITIALIZED` | Validate | root without a STEPWELL project (all four files missing) → exactly one finding with guidance (M5, from 9.3; fixture `project-empty`); partial inventory stays a hard per-file error |

### Tool Parameters (MCP / CLI flags `--root`, `--priority`, `--status`, `--json`)

| Tool | Required | Optional | Notes |
|---|---|---|---|
| `docs_status` | `root` | — | aggregate + warnings |
| `backlog_list` | `root` | `priority[]`, `open`, `section` | **without** `raw` (lean payload) |
| `backlog_show` | `root`, `id` | — | incl. `raw` + `span`; merged view open ↔ index ↔ archive |
| `progress_list` | `root` | `status` | table rows |
| `progress_show` | `root`, `phase` | — | detail block incl. `raw` |
| `docs_validate` | `root` | — | validate findings + collected parse warnings |
| `archive_item` (3.x) | `root`, `id` | `dryRun` (**default `true`**), `note?`, `locale?` *(extensions 09/2026, Phase 3/4: done line on the archive block + index tail; language of generated texts, default auto-detect de/en)* | diff preview before apply |
| `progress_update` (3.3) | `root`, `phase`, `step`, `status` | `title?` *(6.8: rename phase title, block heading consistently)*, `note?`, `checkpoint?` *(9.10/L2: commit SHA 7–40 hex, lands on the verification line of the archive block)*, `locale?`, `dryRun` (**default `true`**) | table + detail block |
| `backlog_add` (6.9) | `root`, `section`, `title`, `priority` | `id?` *(auto-assignment K/H/M/L by priority; convention check)*, `text?`, `dryRun` | item at the end of the section, `As of:` refresh |
| `backlog_update` (6.9) | `root`, `id` | `title?`, `priority?`, `section?`, `text?`, `dryRun` | a priority change moves the block into the matching section |
| `backlog_remove` (6.9) | `root`, `id` | `note?`, `locale?`, `dryRun` | verbatim into the archive, checkbox stays `[ ]`, index tail with `removed` instead of `done` |
| `progress_plan_phase` (6.10) | `root`, `phase`, `steps: [{step, name}]` | `dryRun` | rows `⬜` + skeleton with full scope; step prefix validated; **existing active phase** → extension mode (missing rows + scope bullets, neighbour rows byte-identical; D5/8.3) |

### File Inventory (decision 09/2026: strict)

`BACKLOG.md`, `PROGRESS.md`, `docs/archive/BACKLOG_ARCHIVE.md`,
`docs/archive/PROGRESS_ARCHIVE.md` are **all required** — if any single one is
missing, the project does not load (hard error with a clear message, no tolerance
warning). **If all four are missing** (empty / foreign root, M5/9.3): no per-file
error, but exactly one `PROJECT_NOT_INITIALIZED` finding with guidance —
`docs_validate` as a finding (`ok: false`), `docs_status` as a zero aggregate +
finding, other tools as structured error responses (`{ code, message, missing }`,
`isError`). Applies equally to real projects and fixtures.
