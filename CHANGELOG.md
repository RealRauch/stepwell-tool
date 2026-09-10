# Changelog

All notable changes to `@method-docs/mcp` / `@method-docs/core` are documented here.

Format: [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), adhering to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Documented deviation
(Step 9.8/L6): dates use the project-wide `JJMMDD/HHMM` format (Decision 11) instead
of ISO-8601 — one date format across the repo.

**Redundanz-Regel:** Dieses CHANGELOG ist ein kuratiertes, nutzerrelevantes Aggregat
je Release — kein Git-Log-Dump und keine Duplikation von Erledigt-Index oder
`BACKLOG_ARCHIVE` (dort bleibt die Item-/Commit-Historie).

## [Unreleased]

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
  `methoddocs://{root}/hashes` liefert dasselbe Manifest kompakt als JSON —
  Clients vergleichen gegen den letzten bekannten Stand und überspringen
  Voll-Lese (Fast-Pfad-Fundament E3). Kontrakt-Notiz: Output-Kompaktierung
  und Removal des `structuredContent`-Defaults sind Vertragsänderungen im 0.x-Fenster
  (SemVer-0-Regel, Decision 16); das CLI-`schema`-Feld (M6) bleibt unverändert auf `1`
  — die JSON-Struktur der Daten ändert sich nicht, nur die Serialisierung.

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
