# Projekt-Tracking: stepwell

> Source method: `docs/PLAYBOOK.md` (verbatim)
> Progress file — updated after every step.
> Legend: ⬜ open · 🔄 in progress · ✅ done · ⛔ blocked

> **Structure (archive pattern):** This file contains the **full progress table**
> and detail blocks **only for active/open phases**. Detail blocks of completed phases
> are moved to `docs/archive/PROGRESS_ARCHIVE.md` unchanged after completion.

## Active Phases
### Phase 33 — Field test rung 3 (finnland-reiseapp Umbau)

**Umfang (Steps):**

- **33.1 [H13] Protokoll docs/fieldtest-finland.md — Beobachtungsfelder (Rotation, gekoppelter Index, PHASE_MIDWAY-Fenster, validate-Signale), Fund-Klassen (Bug/Methoden-Drift/UX-Friktion), Abnahmekriterium; Verlinkung im Konsumer vor Umbau-Start**
- **33.2 [H13] Begleit-Feldproben während des Umbaus — Fund-Log im Protokoll, Funde als BACKLOG-Items hier (Muster T6/M16)**
- **33.3 [H13] Auswertung — 1.0.0-Entscheidvorlage (freigeben / weiter 0.x; npm-Publish-Frage), Feldtest-Eintrag in README/CHANGELOG**


























---

## Progress

| # | Step | Status |
|---|----------|--------|
| 1.1 | Monorepo-Grundgerüst | ✅ |
| 1.2 | BACKLOG-Parser | ✅ |
| 1.3 | PROGRESS-Parser | ✅ |
| 1.4 | Archiv-Reader | ✅ |
| 1.5 | docs_status | ✅ |
| 1.6 | docs_validate | ✅ |
| 2.1 | SDK-Festlegung + Grundserver | ✅ |
| 2.2 | MCP Read-Tools backlog | ✅ |
| 2.3 | MCP Read-Tools progress + validate | ✅ |
| 2.4 | MCP Resources | ✅ |
| 2.5 | opencode-Integration + Doku | ✅ |
| 2.6 | CLI | ✅ |
| 3.1 | archive_item (Dry-run) | ✅ |
| 3.2 | archive_item (Apply) + Verifikation | ✅ |
| 3.3 | progress_update (Dry-run + Apply) | ✅ |
| 4.1 | Locale-Profile (lesen) | ✅ |
| 4.2 | Locale-Profile (schreiben + Schnittstellen) | ✅ |
| 5.1 | MCP-Server-Name stepwell + Prozess-Verankerung | ✅ |
| 6.1 | Mutation-Regressionstests (R5) | ✅ |
| 6.2 | Stale-Span-Fix planProgressUpdate (R1) | ✅ |
| 6.3 | Locale-Synonyme zentralisieren (R2) | ✅ |
| 6.4 | CRLF-Roundtrip Archiv-Anhang (R3) | ✅ |
| 6.5 | Stale-Check beim Apply (R4) | ✅ |
| 6.6 | STEP_DUPLICATE-Validate (R6) | ✅ |
| 6.7 | CLI-ASCII-Aliase für Prio/Status (T3) | ✅ |
| 6.8 | Titel-/Scope-Edits als Tool (T2) | ✅ |
| 6.9 | Backlog-CRUD-Tools (T1) | ✅ |
| 6.10 | Phasen-Planung als Tool (T4) | ✅ |
| 7.1 | CI-Workflow (typecheck + test + validate) | ✅ |
| 7.2 | Feldtest internal-pwa | ✅ |
| 7.3 | Publishing-Pack-Check | ✅ |
| 8.1 | Erledigt-Index-Tabelle parsen (W1) | ✅ |
| 8.2 | Archiv-Parse-Warnungen ausblenden (W2) | ✅ |
| 8.3 | Step zu laufender Phase ergänzen (D5) | ✅ |
| 8.4 | PLAYBOOK-Sync-Schlag (D4/G1/G2/A1/G3) | ✅ |
| 9.1 | Coverage-Gate: Schwellen + CI (T6) | ✅ |
| 9.2 | MCP-Tool-Annotations (M2) | ✅ |
| 9.3 | Init-Fallback bei leerem Root (M5) | ✅ |
| 9.4 | Projekt-Init: Vorlagen-Auslieferung (M8) | ✅ |
| 9.5 | SKILL.md-Distributionsweg (M7) | ✅ |
| 9.6 | JSON-Output-Schema versionieren (M6) | ✅ |
| 9.7 | structuredContent-Entscheidung (M3) | ✅ |
| 9.8 | Release-Prozess: CHANGELOG + Pack-Smoke (L6) | ✅ |
| 9.9 | Sync-Schlag PLAYBOOK: Verifikations-Format, 🔵-Legende, Session-Einstieg (L3+L8) | ✅ |
| 9.10 | Checkpoint-SHA je Phase (L2) | ✅ |
| 9.11 | Doc-Sync-Reminder bei Phasen-Abschluss (L4) | ✅ |
| 9.12 | Next-Action in docs_status (L7) | ✅ |
| 9.13 | BOM-Toleranz des Parsers (T5) | ✅ |
| 9.14 | docs_review-Alternativprüfung (L5) | ✅ |
| 10.1 | Coverage-Gate-Rekursion fixen: Nested-Exclude + Output-Assert (R7) | ✅ |
| 10.2 | pack-smoke: Pfad-Quoting bei shell:true (R8) | ✅ |
| 10.3 | Build-Pipeline: tsc → dist in beiden Workspaces (H1/1) | ✅ |
| 10.4 | Manifests auf dist umstellen: exports/bin/files (H1/2, Content-Gate Mittel) | ✅ |
| 10.5 | Dynamischer Pack-Smoke + README-Install-Verifikation (H1/3) | ✅ |
| 10.6 | Surface-Guardrail als Decision verankern + README (M4) | ✅ |
| 10.7 | Coverage-Gate-Exit-Code robust stellen: Ursache klären + Gate Exit-unabhängig (R9, CI-Änderung = Gate Hoch) | ✅ |
| 11.1 | Sync-Schlag: Lesson #18 (Exit-Codes mit Host-Sprache messen) in beiden LESSONS-Kopien (G4) | ✅ |
| 12.1 | Kompakt-JSON + structuredContent-Opt-in (E1/1) | ✅ |
| 12.2 | backlog_list-Feldprojektion + Plan-Detailstufe (E1/2) | ✅ |
| 12.3 | docs_status: nextStepScope-Include (E2/1) | ✅ |
| 12.4 | progress_update: Multi-Step (E2/2) | ✅ |
| 12.5 | Hash-Kurzschluss: SHA256 in Read-Tools + Resources (E2/3) | ✅ |
| 13.1 | Manifests + Lockstep + packaging-Tests (N1/1) | ✅ |
| 13.2 | TOOL_NAME + Resource-URI-Schema (N1/2) | ✅ |
| 13.3 | Doku + Decision + CHANGELOG (N1/3) | ✅ |
| 13.4 | Repo-Rename — explizites Gate (N1/4) | ✅ |
| 14.1 | Konventions-Flip: PLAYBOOK §2/§3 + Decision 10 (I1/1) | ✅ |
| 14.2 | Offene Dateien beider Repos auf EN-Struktur (I1/2) | ✅ |
| 14.3 | core: detectLocale-Gleichstand + EN-Templates (I1/3) | ✅ |
| 14.4 | Messages + Tool-Beschreibungen + CLI-Help EN (I1/4) | ✅ |
| 14.5 | Fixtures-README EN + gemischtsprachige Fixture (I1/5) | ✅ |
| 14.6 | STRUCT_LOCALE-Entscheid + CHANGELOG (I1/6) | ✅ |
| 15.1 | Fast-Pfad + Parallel-Reads in beiden Kopien (E3) | ✅ |
| 12.6 | Phase-Kontext-Resource: Items zur Lesezeit mergen (G5) | ✅ |
| 16.1 | PLAYBOOK.md DE → EN + Snapshot (I3) | ✅ |
| 16.2 | LESSONS.md DE → EN + Snapshot (I3) | ✅ |
| 16.3 | AGENTS Decision 10 wording schärfen (I3) | ✅ |
| 16.4 | README.md DE → EN (I2) | ✅ |
| 16.5 | BRAINSTORM.md → EN + CHANGELOG trailing (I3) | ✅ |
| 17.1 | baseUrl for paths in both MCP-tsconfigs + guard test + BUILD doc (B1) | ✅ |
| 18.1 | M9: multi-step progress_update — validate-before-write + detail handling (Review Findings 1+2) | ✅ |
| 18.2 | L11: EN surface gaps — warnings, zod descriptions, resources, stale comment, README count, CHANGELOG note (Review Findings 3+4+6) | ✅ |
| 18.3 | L12: consolidate step-prefix regex + phaseContext re-parse + duplicate imports (Review Findings 5+6) | ✅ |
| 19.1 | H2 RED: regression fixture + failing test — multi-step completion with already-✅ steps before and after the open step | ✅ |
| 19.2 | H2: batch-wide completion detection — archive exactly once, verification.ok=true, no false failure (approach fixed at release) | ✅ |
| 19.3 | M10: archive ordering — decision documented (README/AGENTS) + fixture test (append-chronological vs insert at phase-number position) | ✅ |
| 19.4 | L13 RED: acknowledgement fixture + failing test — acknowledged finding → ok:true, counted separately | ✅ |
| 19.5 | L13: acknowledgement mechanism (no new tool) + README/PLAYBOOK validate chapter | ✅ |
| 20.1 | [K1] RED: adjacent detail blocks + mixed EOL regression fixture/test — span misalignment reproduces the wrong block boundary | ✅ |
| 20.2 | [K1] FIX: align mutation line splitting with the parser (mutations.ts, 8 sites) — span line numbers stay aligned | ✅ |
| 20.3 | [K1] Verification: full suite + docs_validate green, no manual repair; archive K1 | ✅ |
| 21.1 | [Q1] docs/QUICKSTART.md (what STEPWELL is, core loop, the four files, the five rules, PLAYBOOK as full reference) | ✅ |
| 21.2 | [Q1] README link + EN surface check + verify, archive Q1 | ✅ |
| 22.1 | [Q3] PLAYBOOK §3 + AGENTS Decision 11: ISO 8601 canonical for new entries | ✅ |
| 22.2 | [Q3] core: stampNow → ISO 8601, silent tolerance for YYMMDD/HHMM + MM/YYYY, DATE_LEGACY both legacy forms (open files only) | ✅ |
| 22.3 | [Q3] Tests: stamp format, parse tolerance, DATE_LEGACY scope (open vs archive) | ✅ |
| 22.4 | [Q3] PLAYBOOK sync to internal-pwa + SHA256 proof, verify, archive Q3 | ✅ |
| 23.1 | [Q2] PLAYBOOK: periodic method retrospective section (every N phases; three guiding questions; stay/demote/drop outcomes) | ✅ |
| 23.2 | [S2] PLAYBOOK: intentionally accepted findings (inline marker syntax, effect on ok, archives exempt) | ✅ |
| 23.3 | [Q4] AGENTS.md: consolidate decisions to ≤12 active (historical facts + PLAYBOOK duplicates → archive/reference) | ✅ |
| 23.4 | [Q2/S2] PLAYBOOK sync to internal-pwa + SHA256 proof | ✅ |
| 23.5 | [Q2/S2/Q4] Verification: typecheck + tests + docs_validate in both repos, archive Q2/S2/Q4 | ✅ |
| 24.1 | [M11] PLAYBOOK §2: replace the claimed STRUCT_LOCALE warning with silent tolerance (Decision I1/14.6) in both copies + SHA256 proof | ✅ |
| 24.2 | [M11] Verification: docs_validate both repos without new findings; archive M11 | ✅ |
| 25.1 | [H3] Decision 13 + docs/CONSUMERS.md (split model, promotion ritual, inventory) | ✅ |
| 25.2 | [H4] Contract tests: tools/list input-schema lock + serve.ts path lock | ✅ |
| 25.3 | Verification + first promotion (merge dev→main, build, field probe) | ✅ |
| 26.1 | Satellite package + pull (guards, conflict abort, docs_validate post-merge) [H5] | ✅ |
| 26.2 | Push (precondition, re-pull loop, trunk guards) [H5] | ✅ |
| 26.3 | Commit automation: commit param on progress_update/archive_item, CLI --commit (four docs only) [H5] | ✅ |
| 26.4 | Activity report + overlap warning (read-only git analysis) [H5] | ✅ |
| 26.5 | MCP transport: sync tool + commit param, contract tests (MINOR) [H5] | ✅ |
| 26.6 | Docs: README architecture/ritual, SKILL ritual CLI-first, QUICKSTART pointer, CHANGELOG [H5] | ✅ |
| 26.7 | Dogfood field test: M12+M13 as two parallel workstreams in this repo; archive M12+M13+H5 [H5] | ✅ |
| 27.1 | Central temp-dir hygiene in test fixtures — registered pair cleanup, no-op afterEach removed, sweep evidence [T7] | ✅ |
| 27.2 | Husk detection in workstreamReport (husks[] for deregistered dirs) + ritual verify/prune note in SKILL/README [M16] | ✅ |
| 27.3 | Verification: sweep before/after full suite = 0 new dirs, suite green; archive T7+M16 [T7/M16] | ✅ |
| 27.4 | Empty-marker invariant: backlog_add removes placeholder, last-removal restores it, validate EMPTY_MARKER_STALE + fixture [H6] | ✅ |
| 27.5 | SCOPE_ROW_MISSING validate finding: table row without detail-block scope entry [M17] | ✅ |
| 27.6 | Pull auto-resolution for deterministic doc conflicts (archive appends, timestamp order, docs_validate gate) [H7] | ✅ |
| 27.7 | .gitattributes text eol=lf for doc files + adoption hint in README [L14] | ✅ |
| 27.8 | CLI: --root defaults to CWD + sync status single-tree setup hint [L15] | ✅ |
| 27.9 | PLAN_WITHOUT_WIP sharpening: purely planned phase = PHASE_PLANNED warning (ok stays true), orphaned block stays finding [M18] | ✅ |
| 28.1 | Relocate internal docs, anonymize references, history purge (files + name scrub incl. messages), force-push, resync frozen dir [K2] | ✅ |
| 29.1 | progress_update: bare phase number matches "Phase <N>" + refuse phantom skeleton when the step already has a table row [H8] | ✅ |
| 29.2 | suite stability: diagnose Windows worker-load flakes (git subprocess + coverage gate), fix at the cause, no suppressed warnings, no leaked temp dirs [M19] | ✅ |
| 29.3 | progress_update --title: duplicate "Phase <N> —" prefix guard [L16] | ✅ |
| 29.4 | Verification: typecheck + full suite + docs_validate clean; doc-sync (CHANGELOG/README/SKILL); archive H8/M19/L16; phase completion | ✅ |
| 30.1 | core: docsRepair orchestration over existing planners + new extraction planners (H6 marker removal, DATE_LEGACY YYMMDD/HHMM → ISO only, ARCHIVE_WITHOUT_INDEX index line after counting) — RED→GRÜN with project-b-drift + new fixtures [H9] | ✅ |
| 30.2 | transport: docs_repair MCP tool (DESTRUCTIVE_ANNOTATIONS, dryRun default true) + CLI repair command + contract-tools test extended ONLY with the docs_repair entry — docs_validate H4 lock + annotations test byte-identical green (compatibility proof) [H9] | ✅ |
| 30.3 | Verification: typecheck + suite + docs_validate clean; doc-sync (README tool table + M4 justification, CHANGELOG); archive H9; phase completion | ✅ |
| 30.4 | H10: files[] from Location bullets (tolerant path extraction, no globs) + backlog_list fields extension + workstreamReport predictedOverlap (branch/trunk open-item file intersection, read-only) — overlap[] byte-identical [H10] | ✅ |
| 30.5 | M20: workstreamReport idCollisions (newly added IDs/steps in merge-base..branch ∩ merge-base..trunk) + optional considerWorktrees on backlog_add/progress_plan_phase (transport resolves via satellite, core stays git-blind, fallback with warning) — default path byte-identical [M20] | ✅ |
| 30.6 | M21: tolerant Depends-on bullet (union-matched synonyms) + derived dependsOn/blockedBy/ready + DEP_UNKNOWN warning + DEP_CYCLE finding + backlog_list ready filter + fields extension + fixture project-l-deps [M21] | ✅ |
| 30.7 | L17: position parameter (top/bottom/index) on backlog_update — byte-identical block move within section, section+position combination, out-of-range = structured error (documented in item close) [L17] | ✅ |
| 30.8 | Verification: typecheck + full suite + docs_validate clean; doc-sync (CHANGELOG/README/SKILL); phase completion with title/note/checkpoint | ✅ |
| 31.1 | Retro review + protocol: PLAYBOOK §§ / LESSONS sections / AGENTS decisions × 3 guiding questions → stay/demote/drop outcomes; BRAINSTORM evaluator verdicts (ADR, PR satellite, Obsidian V1/V2, ZooKeeper, HTTP, Jira); scope-model decision (section tags, closed vocabulary) + topology limitation documented — protocol docs/retro-2026-11.md [M26] | ✅ |
| 31.2 | LESSONS changes sync: new Lesson #32 (sync child-process stderr leak, M19 evidence) + section scope tags — textually identical in both copies (stadtpfad-pwa), SHA256 evidence; verify; archive M26; phase completion [M26] | ✅ |
| 32.1 | [H11] core: shard-fähiges Archiv-Lesen — Glob docs/archive/*_ARCHIVE*.md + konkatenierter Parse (p<n> aufsteigend, kanonisch zuletzt), Inventory hartkodierter Archiv-Pfade, RED→GRÜN Fixture | ✅ |
| 32.2 | [H13] core: Rotation als Tool-Op — Shard je Phase (Direktschreib): Item-Appends an BACKLOG_ARCHIVE.p<n>.md, Phase-Block bei completedPhase an PROGRESS_ARCHIVE.p<n>.md, Kopfzeile je Shard-Datei | ✅ |
| 32.3 | [M24] core: Done-Index-Kopplung — Index-Zeile lebt dort, wo ihr Block lebt (Shard-Index-Sektionen; L13-Muster-Entscheid: strenge Lokalität vs. globale Existenz-Prüfung) | ✅ |
| 32.4 | [M25] core/git/mcp: Satellit/Hashes/Resources shard-fähig — Doc-File-Sets (DOC_FILES-Staging), sync docSet, hashes-Resource, archivePath() | ✅ |
| 32.5 | [M23] core validate: PLAN_WITHOUT_WIP transient bei Step-Übergängen — sequentieller Fortschritt → PHASE_MIDWAY-Warning, verwaist bleibt Finding | ✅ |
| 32.6 | [L22] git: Workstream-Report — doppelte Parses beseitigen (foreignDocState, idCollisions base-State), byte-gleich | ✅ |
| 32.7 | [L24] core/mcp: docs_status docFiles-Aggregat (Zeilen/Bytes je Doku-Datei) + CLI-Kompakt-Zeile, JSON additiv | ✅ |
| 32.8 | [L19] Item-bewusste Suche über offen+Archiv+Done Index: Alternativprüfung dokumentieren statt Tool bauen (Muster L5, Reaktivierungs-Kriterium) | ✅ |
| 32.9 | [L25] Methoden-/Doku-Sync Sharding: PLAYBOOK §3 wortidentisch in alle Kopien + SHA256-Evidenz, QUICKSTART/README/AGENTS nachziehen | ✅ |
| 32.10 | Verification: typecheck + full suite + docs_validate clean; offene Items archivieren; Phasen-Abschluss | ✅ |
| 33.1 | [H13] Protokoll docs/fieldtest-finland.md — Beobachtungsfelder (Rotation, gekoppelter Index, PHASE_MIDWAY-Fenster, validate-Signale), Fund-Klassen (Bug/Methoden-Drift/UX-Friktion), Abnahmekriterium; Verlinkung im Konsumer vor Umbau-Start | ✅ |
| 33.2 | [H13] Begleit-Feldproben während des Umbaus — Fund-Log im Protokoll, Funde als BACKLOG-Items hier (Muster T6/M16) | 🔄 |
| 33.3 | [H13] Auswertung — 1.0.0-Entscheidvorlage (freigeben / weiter 0.x; npm-Publish-Frage), Feldtest-Eintrag in README/CHANGELOG | ⬜ |
