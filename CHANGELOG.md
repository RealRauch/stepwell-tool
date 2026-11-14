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

## [0.2.3] — 2026-11-14

**Packages:** `stepwell` · `stepwell-core` · `stepwell-git` — 0.2.3 (Lockstep, Decision 10)

### Fixed

- **Tool-surface language (M28/Phase 35):** remaining German output strings now emit English —
  mutation plan descriptions, error messages, the phase-completion doc-sync reminder and the
  echo tool's parameter schema; the archive shard Done-Index placeholder follows the heading
  locale (DE heading keeps its DE placeholder). Contract unchanged (no tool names, parameters,
  JSON shapes, resource URIs or warning codes touched); the deliberate `--locale de|en` feature
  for generated archive texts is untouched.
- **Coverage-gate harness budget (M29/Phase 36):** the nested full-suite coverage run exceeded
  its own 180 s test budget under parallel load on slower machines (measured margin flake:
  ~153 s isolated, >180 s under load — never a real gate failure). Budget raised to 300 s;
  gate assertions (exit code + threshold message) untouched.
- **Plan-phase verification wording (L30/Phase 37):** the "planned but not started" verification
  message names the current `PHASE_PLANNED` warning instead of the stale `PLAN_WITHOUT_WIP`
  finding code (M18/27.9).

## [0.2.2] — 2026-11-14

**Packages:** `stepwell` · `stepwell-core` · `stepwell-git` — 0.2.2 (Lockstep, Decision 10)

### Fixed
- **Shard rotation follows the real agent workflow (H14, field finding F1 — finnland-reiseapp Phase 30):**
  item rotation anchored to the 🔄 window only — but the real workflow is "flip step ✅ →
  archive items → flip next 🔄", so every archive in that window went CANONICAL (field
  evidence: N5–N8 in the canonical archive despite Phase 30 running). The active phase is
  now derived from the LAST 🔄 or ✅ row in table order (planned ⬜ / blocked ⛔ phases never
  hijack; no active rows → canonical 0.1-baseline). Shard header wording updated for new
  shards ("in the context of Phase n").

## [0.2.1] — 2026-11-13

**Packages:** `stepwell` · `stepwell-core` · `stepwell-git` — 0.2.1 (Lockstep, Decision 10)

### Fixed
- **INDEX_WITHOUT_ARCHIVE regression (promotion field probe, stadtpfad-pwa T6):** the
  32.3 union check skipped `[ ]`-removed archive blocks when resolving Done-Index
  entries — removed blocks are deliberately indexless in the ARCHIVE direction but
  their removed tail IS a valid index target (pre-32 semantics). Regression test
  added (project-e-tableindex with a flipped checkbox); the fixture path could not
  catch it because removed bullet tails are not parsed as index entries by design —
  the real-world trigger was a Done-Index **table** row (W1/8.1).

## [0.2.0] — 2026-11-13

**Packages:** `stepwell` · `stepwell-core` · `stepwell-git` — 0.2.0 (Lockstep, Decision 10; npm-publish vertagt bis 1.0.0-Feldtest)

### Phase 32 — Archive sharding (completed 2026-11-12)

#### Added
- **Archive sharding (H11/H12/32.1–32.2):** `docs/archive/*_ARCHIVE*.md` shards are read
  concatenated (p<n> NUMBER-ascending, canonical last); rotation writes item blocks to
  `BACKLOG_ARCHIVE.p<n>.md` during the running phase and the phase block to
  `PROGRESS_ARCHIVE.p<n>.md` on completion — write-once shard headers, canonical files
  freeze as legacy homes. Commit staging stages canonical four + existing shards.
- **Coupled Done Index (M24/32.3):** an index line lives where its block lives — BACKLOG's
  Done Index for canonical blocks, each shard's own section for shard blocks. New
  `INDEX_LOCATION` finding (strict locality); `docs_repair` reconstructs into the right file.
- **Derived doc file sets (M25/32.4):** `docFileSet(root)` (canonical four + existing
  shards) drives the hash fast path, commit staging and sync docSet; hashes manifest keys
  include shards. `workstream_sync` pull resolves both-added shard collisions against an
  empty base and preserves mid-file conflict regions (append-path regions stay file-end-only).
- **`PHASE_MIDWAY` warning (M23/32.5):** a sequential intermediate state (✅ before ⬜,
  none running, no ⛔) no longer fires `PLAN_WITHOUT_WIP` — docs_validate between two step
  flips stays green (ok: true). Orphaned states stay findings.
- **Doc files aggregate (L24/32.7):** `docs_status`/CLI `status` report
  `docFiles: [{file, lines, bytes}]` (canonical four + shards) and render a compact
  `Doc files:` line — archive growth stays measurable (additive JSON, schema 2).
- **Workstream report refactor (L22/32.6):** `foreignDocState` parses BACKLOG once per
  branch, `idCollisions` computes the base state once — byte-identical behavior.
- **Method/doc sync (L25/32.9):** PLAYBOOK §3 gained the "Archive sharding" section
  (p<n> naming by phase number, tool-op rotation with write-once headers, coupled
  Done Index, strict locality, legacy rule) — word-identical in both copies with
  SHA256 evidence; QUICKSTART/README/AGENTS lines updated.
- **Search alternative check documented (L19/32.8):** no search tool (M4) — grep +
  `backlog_show` cover the case; reactivation criterion and the minimal candidate
  (`query` on `backlog_list`) documented in README/AGENTS.



### Phase 30 — Validator repair path + workstream foresight (2026-11-11T22:00)

#### Added
- **`docs_repair` tool + CLI `repair` (H9/30.1–30.3):** mechanical repair path for
  validate findings over the responsible planners, never text manipulation —
  `EMPTY_MARKER_STALE` placeholder removal, `DATE_LEGACY` `YYMMDD/HHMM` → ISO (MM/YYYY
  stays a finding — the day is not reconstructible), `NOT_ARCHIVED` (delegates to
  `archive_item`), `ARCHIVE_WITHOUT_INDEX` (Done-Index line from the archive block
  title), `WIP_WITHOUT_PLAN` (skeleton only when the phase has no other table rows —
  sibling scope is never invented). Applies sequentially with re-validation between
  repairs; refusals are reported, never retried; dry-run default. Deliberately a
  **separate** tool from `docs_validate`, which stays byte-identical read-only (H4
  schema lock + annotations untouched — a tool cannot be read-only AND mutating; the
  static readOnly annotation protects consumer auto-approval flows; M4 justification
  documented). New tool = additive (MINOR).
- **`files[]` + `predictedOverlap` (H10/30.4):** every item carries `files[]` —
  path-like tokens extracted tolerantly from the Location bullet (backticks,
  `file.ts:12` refs, lists; prose, dates and globs skipped; no invention, no glob
  expansion). `workstreamReport` gains per-worktree `predictedOverlap[]`: files that
  OPEN items on BOTH sides name (branch vs trunk doc states, read-only derivation in
  the satellite — core stays git-blind), visible before anyone edits the file. The
  factual `overlap[]` is unchanged.
- **`idCollisions` + `considerWorktrees` (M20/30.5):** the report names item ids and
  table steps that BOTH sides newly added since the merge base — the parallel
  same-next-id collision surfaces before the merge. `considerWorktrees` (default
  `false`) on `backlog_add`/`progress_plan_phase` skips/refuses what foreign worktree
  doc states already occupy (the transport collects via the new `foreignDocState`
  satellite helper and passes core exclusion options; per-branch read failures become
  additive `worktreeWarnings[]`; explicit ids are never filtered).
- **Dependencies as data (M21/30.6):** optional `Depends on:` bullet (DE variant read
  silently, union matching), derived `blockedBy[]` (transitive open ancestors) and
  `ready` per item; `DEP_CYCLE` finding, `DEP_UNKNOWN` warning (never blocks);
  `backlog_list` gains the `ready` filter and the three projectable fields.
  Section/priority semantics untouched — readiness is a filter, not an order.
- **`position` on `backlog_update` (L17/30.7):** places the block within its (target)
  section — `top`/`bottom`/1-based slot, byte-identical content; with `section` the
  order is first switch, then place; out-of-range slots are a structured error (never
  clamped).

#### Fixed
- **Marker tolerance (F1/30.7):** the H6 placeholder invariant missed the real-world
  DE wording „Keine offenen Items." (project-a / internal-pwa heritage) — drop,
  restore and `EMPTY_MARKER_STALE` now cover it; found by the position test inserting
  into a marker section of a real fixture.

### Phase 29 — Findings batch: phase matching, suite stability, rename guard (2026-11-11T17:30)

#### Fixed
- **Bare phase numbers + phantom-skeleton refusal (H8/29.1):** `progress_update` accepts
  the natural CLI form `--phase 29` (matches `Phase 29`; phase matching is consolidated
  into a single `phaseMatches` in core). A 🔄-flip whose step already has a table row but
  no matching detail block now fails with a structured error instead of silently
  inserting a phantom skeleton (`### 27` + scope) — the row flip still succeeded before,
  which made the corruption easy to miss. Skeletons stay reserved for genuinely new
  phases. New refusal replaces undocumented silent corruption (MINOR).
- **`--title` prefix guard (L16/29.3):** a full heading text passed as the new title
  (`"Phase 2 — UI Polish"`) no longer doubles the prefix in the renamed heading or in
  the archive block heading at phase completion (the phase-27 archive heading carries
  the doubled prefix as the incident's residue — append-only, left as is).
- **Suite hardening for Windows load (M19/29.2):** root causes established empirically —
  `execFileSync` leaks child-process stderr to the console (worktree progress,
  `autocrlf` warnings, HEAD notes); temp repos inherited the machine's
  `core.autocrlf` (LF/CRLF warning noise); failed git-heavy tests under AV/indexer load
  leaked their `%TEMP%` directories and hit the 5 s default timeout. Fixes at the
  cause: `core.autocrlf=false` in every test repo, leak-proof `rmSync` (maxRetries),
  explicit `stdio` piping in every test git wrapper (stderr still surfaces in thrown
  errors — no suppression), `testTimeout` 20 s for git-heavy files. Acceptance:
  consecutive full runs green, stderr-free, zero temp litter.

### Phase 27 — Sammel-Batch: Hygiene & Workstream-Härtung (2026-11-11T16:30)

#### Fixed
- **Test temp hygiene (T7/27.1+27.3):** worktree-pair fixtures register both sides for
  after-each cleanup; sweep evidence: clean baseline → full suite → `0` new
  `%TEMP%/stepwell-*` directories per run.
- **Workstream husk detection (M16/27.2):** `workstreamReport` surfaces leftover
  worktree husk directories mechanically — `husks[]` (stale `.git` pointer into this
  repo's admin area) and `prunable[]` (registrations git wants pruned); ritual
  verify/prune note in SKILL + README. Plain untracked-content leftovers stay
  ritual-covered (mechanically indistinguishable from real sibling projects).
- **Empty-marker invariant (H6/27.4):** `backlog_add` drops a stale `> No open items.`
  placeholder when a section receives its first item; archiving/removing/moving the last
  item restores it; `docs_validate` reports `EMPTY_MARKER_STALE` for pre-tool drift
  (offene Dateien only). The drift datacraft/internal-consumer live with becomes visible
  after the next promotion and is repaired there per natural edit.
- **`SCOPE_ROW_MISSING` (M17/27.5):** validate finding for a progress-table row whose
  active detail block carries no scope entry (the lost-scope-bullet incident shape);
  active blocks only — archives and adoption/legacy rows stay exempt (W2).
- **Pull auto-resolution (H7/27.6):** provably mechanical doc conflicts resolve in
  `sync pull` — parallel appends (ordered by completion timestamps, archives AND section
  items) and disjoint deletions (union of kept lines; emptied sections restore the H6
  marker); single-line As-of stamp pairs take the later stamp. Everything else
  (table-row edits, real content conflicts) still aborts cleanly; the resolver never
  guesses content semantics, `docs_validate` remains the post-merge gate.
- **`PHASE_PLANNED` warning vs `PLAN_WITHOUT_WIP` finding (M18/27.9):** a purely planned
  phase (block exists, every table step ⬜ — the `progress_plan_phase` state) is now a
  warning that does not flip `ok` instead of permanent finding-nagging; a mixed state
  (✅ + ⬜, none running — orphaned block) stays a finding. New warning code is additive
  (MINOR, Decision 10).

#### Added
- **`.gitattributes` EOL contract test + adoption snippet (L14/27.7):** the repo-wide
  `* text=auto eol=lf` glob predates this step; the new test locks the effective
  contract (`git check-attr eol` → `lf` for the four doc files + method copies) and the
  README workstream section carries the one-glob adoption hint for target projects.
- **CLI ergonomics (L15/27.8):** `runCli` accepts an injectable `defaultRoot`; the
  direct-run entry falls back to `process.cwd()` so `stepwell status` works inside a
  project without `--root` (library callers without a default keep the usage-error
  contract; JSON unchanged). `sync status` in single-tree mode appends a one-line
  `git worktree add` setup hint.

### Phase 28 — Leak purge: internal inventory removed from public history (2026-11-11T00:30)

#### Security
- **Consumer inventory and field-test protocol purged from the public repo and its entire
  history (K2/28.1):** two internal docs (consumer wiring inventory incl. local paths, and a
  field-test protocol describing an internal project) had been public on GitHub since Phase 25 —
  plain removal would have left them retrievable from history. Both files now live in a
  local-only directory (never pushed), references were privatized, and a git-filter-repo pass
  (two runs: blobs, then commit messages) removed the files from every commit and scrubbed
  internal project names across the whole history (pseudonyms: `internal-pwa`,
  `internal-consumer`, `internal-recorder`, `internal-app-1/2/3`; "Stadtpfad" as the generic
  method origin intentionally stays). Known cost, documented: every pre-rewrite commit-SHA
  reference in the Done Index/archives resolves only via the local pre-purge backup bundle.
- **Force-push notice:** `dev` and `main` were force-pushed — published clones should
  re-clone or `git fetch --prune` + reset. Consumers loading the MCP server from local paths
  are unaffected.
- The name↔pseudonym mapping lives in the private inventory directory, deliberately not in
  this repo (a public mapping would have re-leaked what the purge removed).

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
