# Changelog

All notable changes to `stepwell` / `stepwell-core` are documented here.

Format: [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), adhering to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Dates use the project-wide
ISO 8601 `YYYY-MM-DDTHH:mm` format (Decision 11) — one date format across the repo.
Older sections keep their historical legacy-format dates (archive rule).

**Redundanz-Regel:** Dieses CHANGELOG ist ein kuratiertes, nutzerrelevantes Aggregat
je Release — kein Git-Log-Dump und keine Duplikation von Erledigt-Index oder
`BACKLOG_ARCHIVE` (dort bleibt die Item-/Commit-Historie).

## [Unreleased]

### Phase 26 — Workstream worktrees: git satellite (2026-11-10T23:00)

#### Added
- **`stepwell-git` satellite package (H5/26.1, Decision 14):** `core` stays git-blind; git
  intelligence lives transport-neutral — CLI-first (`stepwell sync`, skill-fed agents need no
  MCP registration), MCP-optional (`workstream_sync` tool). `pullTrunk` merges trunk → branch
  with a guard chain (`GIT_MISSING`, `NOT_A_GIT_REPO`, `DETACHED_HEAD`, `DIRTY_TREE`) and aborts
  merge conflicts cleanly with a structured report (files + per-side commit counts);
  `docs_validate` re-checks the merged docs as the mechanical net.
- **`pushTrunk` (H5/26.2):** branch → trunk with the ancestor precondition made atomic
  (`--ff-only` in the main worktree — a trunk move inside the race window becomes a clean
  `STALE_BRANCH` refusal for the re-pull → verify → push loop); codes `STALE_BRANCH`,
  `TRUNK_DIRTY`, `ON_TRUNK_BRANCH`.
- **Commit automation (H5/26.3):** `commit: true` / CLI `--commit` on `archive_item` and
  `progress_update` — stages ONLY the four doc files (deterministic, no secret risk);
  `COMMIT_BLOCKED` on a pre-staged index, `COMMIT_FAILED` keeps the edits applied (never a
  rollback). Generated subjects: `docs(backlog): archive <ID>` / `docs(progress): step <n> <icon>`;
  `commitMessage`/`--commit-message` override. Response/JSON gains an additive `commit` section
  (schema stays 2); a failed commit exits 1 while `verification.ok` stays true. Contract surface
  extended additively (MINOR, Decision 10).
- **`workstreamReport` / `stepwell sync status` (H5/26.4):** read-only liveness + conflict
  candidates derived from git itself (branches + last-commit times — no registry file, no
  heartbeats); per worktree branch/ahead/behind/dirty/last-activity plus `overlap[]` (files
  touched on both sides since the merge base — the likely conflicts of the next pull).
- **`syncPreview` (H5/26.5):** dry-run default for pull/push shares the EXACT guard chain of
  the real operation (extracted `pullGuards`/`pushGuards`) — a preview can never disagree with
  the merge it forecasts.
- **Docs:** README workstream section (ritual, guards, field-test ladder), SKILL workstream
  ritual (CLI-first), QUICKSTART pointer, PLAYBOOK §1/§4/§5 workstream model (both copies,
  SHA256-evidenced sync, H5).

#### Changed
- **pack-smoke packs three tarballs (H5/26.3):** `stepwell-git` ships as a dependency of the
  `stepwell` MCP/CLI artifact; the smoke asserts its dist artifacts and the manifest dependency.
- **Method: PLAYBOOK §1 "Sequential approach & parallel workstreams" (H5):** parallel phases
  run as workstreams (one phase per worktree+branch, per-step merge to trunk, WIP visibility via
  step-start doc commits, trunk = main worktree's branch, no hard workstream limit); §4 tool
  doc-commits cover only the four docs; §5 verification runs after pull, before push. Word-identical
  in both copies (SHA256 PLAYBOOK `861bc78a…`, LESSONS `2d0b9ef2…`); LESSONS grew 18 → 31 via the
  M15/M14 drift sync from internal-pwa.

### Phase 20–24 — Field robustness & method docs (2026-09-17T18:40)

#### Fixed
- **Mixed line endings shifted block boundaries (K1/20.2):** a CRLF file touched by a lone
  LF edit made `progress_update` remove the wrong phase-block range — the following block's
  heading and scope label were deleted and `applyProgressPlan` reported `archiveOk=false`
  despite a correct archive append. Mutations now split lines exactly like the parsers
  (`/\r?\n/`) and normalise stray endings on write; new regression fixture
  `project-j-adjacent-blocks`.

#### Added
- **Quick-Start guide (Q1/21.1):** `docs/QUICKSTART.md` — a five-minute entry point (core
  loop, the four files, the five rules) that points to PLAYBOOK as the full reference.
- **Method retrospective (Q2/23.1):** PLAYBOOK §8 — periodic pruning with three guiding
  questions and the outcomes stay/demote/drop (no obligation to prune).

#### Changed
- **ISO 8601 timestamps (Q3/22.2):** new entries use `YYYY-MM-DDTHH:mm` (`stampNow`,
  templates, PLAYBOOK §3, Decision 11); both legacy forms (`YYMMDD/HHMM` and `MM/YYYY`) are
  read silently and reported as `DATE_LEGACY` in open files only.
- **Accepted findings in the method (S2/23.2):** PLAYBOOK documents the inline
  `*(accepted: CODE[, CODE])*` marker, its effect on `ok`, and the archive exemption.
- **Architecture decisions consolidated (Q4/23.3):** `AGENTS.md` lists 12 active decisions;
  historical and PLAYBOOK-duplicate entries moved verbatim into
  `docs/archive/AGENTS-decisions-history.md`.
- **PLAYBOOK §2 tolerance fixed (M11/24.1):** the section no longer claims a `STRUCT_LOCALE`
  warning — silent tolerance per decision I1/14.6.

### Phase 19 - Completion & validate hardening (260916)

#### Fixed
- **Multi-step phase completion no longer reports success as an error (H2/19.2):**
  a `progress_update` step array whose steps include already-✅ ones around the last
  open step now completes the phase idempotently - the archive block is appended
  exactly once and `verification.ok` stays `true` (previously `unknown phase … failed
  after partially applying` after the first step had already archived the block).

#### Added
- **Inline accepted findings (L13/19.5):** a deliberately accepted deviation is marked
  on the line the finding points at with `*(accepted: CODE[, CODE])*`; `docs_validate`
  moves such findings into `acknowledged[]` (count stays visible) and `ok` reflects
  only the unmarked findings. No config file, no new tool; `DoneEntry` now carries the
  source `line`.

#### Changed
- **Archive ordering documented (M10/19.3):** completed phase blocks are appended
  chronologically at the end of `PROGRESS_ARCHIVE.md` - phase numbers there may be
  non-monotonic (append-only, no insert at the number position); Decision 19, fixture
  `project-h-completion-order`.

### Phase 18 — Review follow-ups (260911)

#### Fixed
- **Multi-step `progress_update` no longer persists before validating (M9/18.1):**
  all steps of a `step` array are planned up-front (read-only) — an invalid step
  fails before the first write; residual apply-time failures report the
  already-written files and the failing step. `detail: "summary"` is now
  rejected for multi-step instead of being silently ignored.
- **EN tool surface completed (L11/18.2):** residual German strings migrated —
  `STATUS_UNKNOWN`/`ROW_INCOMPLETE` warning messages, shared zod field
  descriptions (visible in MCP tool introspection), resource titles/descriptions
  and error strings, echo tool description. Stale `detectLocale` comment
  corrected (tie → `en` since 14.3). README test count refreshed. Message/
  description texts change; `schema` unchanged.

#### Changed
- **Core consolidation (L12/18.3):** `scopeStepOf`/`scopeEntryFor` in
  `stepwell-core` replace four copies of the scope-step-prefix regex;
  `phaseContext`/`resolveNextStepScope` resolve items via the memoized
  `ProjectDocs` instead of re-parsing per item ref. Behavior-identical.

### Phase 17 — CI: Linux build fix (260911)

#### Fixed
- **pack-smoke job ran without dependencies (B1/17.1):** the CI job had no
  install step and executed the build against an empty `node_modules` — the
  fallback `tsc` (npx cache, v6) rejected the configs (`baseUrl` removed in
  TS6, missing `@types/node`). Both CI jobs now run `npm ci` (lockfile-pinned,
  tsc 5.9.3). Additionally: MCP tsconfigs declare `baseUrl` for `paths`
  (rejected strictly by tsc 5.x on Linux; guard test added in
  `packages/mcp/tests/packaging.test.ts`), pack-smoke failures now surface
  stdout (tsc writes errors there), and `BUILD.md` documents the
  cross-workspace resolution rules.

### Phase 16 — Method-docs EN migration (260911)

#### Changed
- **Method docs fully English (I3/16.1–16.5):** `docs/PLAYBOOK.md` and
  `docs/LESSONS.md` migrated DE → EN; historical German versions preserved
  verbatim as snapshots (`docs/archive/PLAYBOOK-2026-09-snapshot.md`,
  `docs/archive/LESSONS-2026-09-snapshot.md`, treated append-only).
  `AGENTS.md` Decision 10 sharpened: English is binding for the method docs and
  the tool surface; the tolerance layer stays for project files (AGENTS prose,
  READMEs, project-specific files). `README.md` and `BRAINSTORM.md` migrated to
  English (stale status line, test count and locale tie-break refreshed during
  the README migration). No sync to the internal-pwa copies — that drift is
  documented centrally as item S1 and carried by their agent.

### Phase 15 — Method sync: kickoff fast path (260911)

#### Added
- **Kickoff fast path as PLAYBOOK §0.9 (E3/15.1):** when the file hashes delivered by
  `docs_status`, the Read-Tools or resources match the last known state, re-reading
  PLAYBOOK/LESSONS in full is not required — reading the current step scope suffices.
  Includes the parallel-reads rule of thumb. Synced textually identical into both
  method copies (stepwell-tool, internal-pwa); SKILL.md session entry and AGENTS.md
  kickoff updated to reference the fast path.

### Phase 14 — Language switch: English primary (260911)

#### Added
- **EN primary across the structure / API / message surface** (Decision 10,
  I1/14.1). English is now the canonical language for all structural text
  in the four doc files, PLAYBOOK / LESSONS copies, AGENTS.md, README, SKILL,
  CHANGELOG, templates, tool descriptions, CLI help, and warning messages.
  Content text (item bodies, notes, user prose) stays language-free by design —
  authors keep their language.
- **Locale profile with English synonyms** in `core/profile.ts`: every role
  (Done Index, Active Phases, Location, Acceptance, Verification, As of:,
  Scope, Goal, done, removed, completed) now has an English synonym alongside
  its German one. `canonical(role, "en")` returns the English form for
  generation; `detectLocale` returns `"en"` for EN files and `"de"` for DE
  files.
- **Union matching across DE+EN** for all role synonyms (locationLabel,
  doneLabel, goalLabel, acceptanceLabel, verificationLabel, scopeLabel,
  doneWord, removedWord, removedLabel, completedMarker, standMarker, and the
  three headings). Mixed-locale files parse without warning.
- **Mixed-locale fixture `project-g-mixed`** (EN open files + DE
  append-only archives) plus 6 new tests in `locale.test.ts`. The fixture
  is finding-free under `docsValidate` and proves the cross-locale
  consistency check is locale-agnostic (ID-based, not text-based).
- **Project templates in English** (EN skeletons, `projectTemplates`).
  New STEPWELL projects start in English; German is available for legacy
  imports via union matching.

#### Changed
- **Structural labels in the open files are now English** (CRITICAL, HIGH,
  MEDIUM, LOW, TEST GAPS, Done Index, Active Phases, Location, Acceptance,
  Verification, Scope, As of:, done). **Archive files are unchanged**
  (append-only, Decision 10 — the German historical record stays German).
- **`detectLocale` default** for generation is now `"en"` (canonical
  English templates, EN-skeletoned project templates).
- **Tool descriptions, CLI help, SKILL.md, warning message texts** are
  English. The `message` field of warnings remains human-readable and may
  be in the author's language for legacy projects.
- **PLAYBOOK / LESSONS / AGENTS / README** were updated to match the
  English-primary structure (both repos in sync where applicable).

#### Fixed
- None in this phase.

**Contract note (binding, Decision 16):** Phase 14 changes the **human-readable
text** of warnings, tool descriptions, CLI help, and templates. The
**JSON contract** (`schema: 1`) and the **data object shapes** (`ParseResult`,
`BacklogItem`, `ProgressRow`, `PhaseBlock`, `Warning`, `DoneEntry`, `Backlog`,
`PhaseBlock`, `ArchiveItem`, …) are unchanged — the data structure is
identical, only the user-facing strings changed. Per Lockstep-SemVer
(Decision 16) this is a `MINOR` change in the 0.x window (SemVer-0 allows
breaking within MINORs); the next released version will carry this entry as
its `Added` / `Changed` set.

**Decision I1/14.6 — silent tolerance, no `STRUCT_LOCALE` warning:** Legacy DE
labels in open files stay silently accepted (union matching already absorbs
them). No warning code is added to `validate.ts`; the `project-g-mixed`
fixture stays finding-free. Append-only archives are never faulted (W2).
Reactivation criterion: a future dogfooding round shows legacy DE labels
actually accumulate in a long-running project's open files, then revisit the
`DATE_LEGACY`-pattern warning in a separate decision.

---

### Historical entries below — pre-Phase-14 (German, kept verbatim as KAC history per I1/14.6)

Keine Version veröffentlicht — `1.0.0` ist der Freigabe-Moment nach bestandenem
Feldtest (Decision 16); bis dahin 0.x mit Lockstep über alle drei `package.json`.

### Added
- STEPWELL-Core: tolerante Parser für `BACKLOG.md`, `PROGRESS.md` und beide Archive
  (Zeilen-basiert, `ParseResult`-Warnmodell statt Crash, span/raw für verbatim-Shifts).
- MCP-Server `stepwell` (stdio): Read-Tools (`docs_status`, `docs_validate`,
  `backlog_list/show`, `progress_list/show`), Resources für Root-Dateien und
  Projekt-Vorlagen (`methoddocs://templates/{kind}`), CLI (`method-docs`).
- Mutations mit Dry-run/Apply: `archive_item`, `progress_update`, `backlog_add/update/remove`,
  `progress_plan_phase` — inkl. verbatim-Archivierung, Erledigt-Index-Pflege und
  Stand-Refresh.
- Locale-Profile (de/en) fürs Lesen und für generierte Texte; ASCII-Aliase für
  Prioritäten/Status in CLI und Tools.
- Init-Fallback: `PROJECT_NOT_INITIALIZED` mit Anleitung statt Fehler-Wüste;
  strukturierte Fehlerantworten (`{ code, message, missing }`).
- MCP-Annotations (readOnly/destructive/idempotent) auf der gesamten Tool-Surface;
  `structuredContent` zusätzlich bei `docs_validate`, `progress_update`, `archive_item`.
- Versionierter JSON-Output: `schema: 1` als erstes Feld jeder CLI-`--json`-Ausgabe.
- Neue Resource `methoddocs://{root}/phase/{phase}` (G5): Phase verbatim +
  Tabellen-Zeilen + gemergte Backlog-Item-Bodies in Step-Reihenfolge als Markdown —
  Subagent-Kontext in einem Read, Komposition zur Lesezeit statt Duplikat in den
  Dateien (M4-Alternativprüfung: Resource statt Tool).
- `stepwell`-SKILL.md als zweiter Distributionskanal (liegt im npm-Pack).
- Verifikation: Coverage-Gate je Glob in Vitest + CI; Pack-Smoke gegen die npm-Artefakte
  (statisch, dynamischer Teil blockiert durch Dist-Blocker H1).

### Changed
- **Token-Ökonomie I (E1):** Alle MCP-Tool-Text-Payloads sind **kompaktes JSON** (ohne
  Einrückung) statt Pretty-Print; `structuredContent` wird bei `docs_validate`,
  `progress_update` und `archive_item` **nur noch auf Opt-in** (`structured: true`)
  geliefert — Default ist nur Text-Content (Dedupe); `backlog_list` akzeptiert
  `fields[]` zur Feldprojektion (schlanke Übersichts-Calls); Mutations akzeptieren
  `detail: "summary" | "diff"` für Dry-run-Pläne (summary = Headline + Zeilenzahlen,
  Default bleibt `diff`); `docs_status` akzeptiert `include: ["nextStepScope"]`
  und liefert dann Ziel/Abnahme/Scope-Bullet + das über `(X/n)` gemergte Backlog-Item
  des nächsten Steps mit (Runden-Ersparnis: 1 Call statt 3, E2); `progress_update`
  akzeptiert `step` als Array für Multi-Step-Statuspflege in einem Call
  (Phasenabschluss am letzten Step, nur mit `dryRun: false`, E2); `docs_status`
  trägt additiv `hashes` (SHA256 je Doku-Datei) und die neue Read-Only-Resource
  `stepwell://{root}/hashes` liefert dasselbe Manifest kompakt als JSON —
  Clients vergleichen gegen den letzten bekannten Stand und überspringen
  Voll-Lese (Fast-Pfad-Fundament E3). Kontrakt-Notiz: Output-Kompaktierung
  und Removal des `structuredContent`-Defaults sind Vertragsänderungen im 0.x-Fenster
  (SemVer-0-Regel, Decision 16); das CLI-`schema`-Feld (M6) bleibt dabei unverändert —
  die JSON-Struktur der Daten ändert sich nicht, nur die Serialisierung
  *(Stand 09/2026: `schema` wurde zwischenzeitlich durch N1/13.2 auf `2` gebumpt —
  siehe unten; zum Zeitpunkt dieses Eintrags war `1` korrekt)*.
- **Naming-Refactor N1/13 (Phase 13 abgeschlossen, Decision 18):** `method-docs`
  → `stepwell` durchgängig.
  - npm-Pakete: `stepwell` (ehemals `@method-docs/mcp`, flat — kein `@stepwell/*`-Scope),
    `stepwell-core` (ehemals `@method-docs/core`, flat). Lockstep-Versionen, `prepublishOnly`-Builds.
  - Bin: `stepwell` (ehemals `method-docs`); Install via `npx stepwell`.
  - Resource-URI-Schema: `stepwell://…` (ehemals `methoddocs://…`) — Templates, Root-Dateien, Phase-Kontext, Hashes.
  - TOOL_NAME: `stepwell` (ehemals `method-docs`); `serverInfo.name = "stepwell"`.
  - JSON-Output-Kontrakt: `schema: 1` → `2` (Resource-URI-Änderung = MAJOR-Kontrakt, Decision 16).
  - CLI-Usage-String, SKILL.md-Description, README/CHANGELOG/AGENTS-Prosa, Doku-Pfade: durchgängig `stepwell`.
  - Repo-Pfad (`D:\Development\method-docs` → `D:\Development\stepwell-tool`) folgt in 13.4 als eigenes Gate.

### Fixed
- **npm-Artefakt lauffähig aus `node_modules` (H1):** beide Workspaces shippen kompiliertes
  `dist` (js + d.ts) statt `.ts`-Source, `exports`/`bin` entsprechend umgestellt,
  `prepublishOnly` baut; Pack-Smoke beweist stdio-Handshake + CLI-Bin gegen das installierte
  Artefakt. Zuvor verweigerte Node das TS-Stripping unter `node_modules` — das Paket war
  für Verbraucher nicht startbar.
- Phasen-Paketierung/Abschluss: Stale-Span bei Row-Ergänzung und Phasen-Abschluss,
  frische-Check vor jedem Apply, CRLF-Roundtrip bei Archiv-Anhängen.
- Validierung: doppelte Step-Nummern (`STEP_DUPLICATE`), tolerierter Tabellen-Index
  (W1), keine Parse-Warnungen mehr aus append-only-Archiven (W2).
