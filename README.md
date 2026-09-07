# method-docs

CLI + MCP-Server zum Lesen, Prüfen und Verwalten der Projekt-Doku
(`BACKLOG.md`, `PROGRESS.md`, Archive) in Repos, die der
[STEPWELL-Methode](docs/PLAYBOOK.md) folgen (Steps, Archiv-Muster, Test-First).

**Status:** Phase 1 (Core-Library) und Phase 2 (MCP-Server + CLI) fertig —
schreibende Tools (`archive_item`, `progress_update`) folgen erst in Phase 3,
nach Bewährung. Siehe `PROGRESS.md`.

## Prinzip

Markdown bleibt Source of Truth. Das Tool liest, validiert und assistiert —
es ersetzt die Doku nicht. Konsistenzregeln (Erledigt-Index ↔ Archiv, verwaiste
Checkboxen, Parser-Drift) werden als Warnungen gemeldet.

**Multi-Projekt:** Der Projekt-Root wird je Tool-Call/CLI-Aufruf übergeben —
eine Server-Instanz bedient beliebig viele STEPWELL-Projekte.

**Datei-Pflicht:** Alle vier Dateien (`BACKLOG.md`, `PROGRESS.md`,
`docs/archive/BACKLOG_ARCHIVE.md`, `docs/archive/PROGRESS_ARCHIVE.md`) sind
Pflicht — fehlt eine, lädt das Projekt nicht (harter Fehler).

## Setup

```bash
npm install
npm run typecheck
npm run test
```

Voraussetzung: Node ≥ 22.18 (natives TypeScript-Stripping — Tests wie CLI/Server
laufen direkt auf TS-Source ohne Build-Schritt).

## Pakete

| Paket | Zweck |
|-------|-------|
| `@method-docs/core` | Parser + Status-/Validierungs-Reports (kein MCP) |
| `@method-docs/mcp` | MCP-Server (stdio) + CLI über core |

## MCP-Server

Server-Name: `method-docs` (stdio, Entry: `packages/mcp/src/serve.ts`).
Im Repo ist der Server über `opencode.json` vorkonfiguriert — nach Änderungen
opencode neu starten.

### Tools (Root je Call)

| Tool | Parameter | Ergebnis |
|------|-----------|----------|
| `docs_status` | `root` | Aggregat: offene Items je Prio, laufende Steps/Phasen, ✅-Quote, alle Warnungen |
| `backlog_list` | `root`, optional `priority[]`, `open`, `section` | Items **ohne `raw`** + Parse-Warnungen |
| `backlog_show` | `root`, `id` | Merge-Sicht offen ↔ Erledigt-Index ↔ Archiv, inkl. `raw`+`span` |
| `progress_list` | `root`, optional `status` | Fortschrittstabelle |
| `progress_show` | `root`, `phase` | Detail-Block inkl. `raw` (laufende Phasen + Archiv) |
| `docs_validate` | `root` | Validate-Funde (Konsistenz) + eingesammelte Parse-Warnungen, `ok` |

Fehler (fehlende Pflichtdatei, unbekannte ID/Phase) liefern `isError: true` mit
klarer Meldung — der Server stürzt nicht ab.

### Resources (Resource-Templates)

Der Root wird **percent-encoded** als einziges URI-Segment eingesetzt
(Windows-Pfade enthalten `/` und `:`):

```
methoddocs://{root}/backlog
methoddocs://{root}/progress
methoddocs://{root}/archive/{kind}    # kind = backlog | progress
```

Beispiel: `methoddocs://D%3A%5Cproj%5Cdemo%2C…/backlog` — Inhalt jeweils verbatim
(`text/markdown`).

### Manuelle Verifikation mit dem Inspector

```bash
npx @modelcontextprotocol/inspector node packages/mcp/src/serve.ts
```

Die automatisierte Suite (`packages/mcp/tests/`) deckt denselben Protokoll-Pfad
über `InMemoryTransport` plus einen echten stdio-Handshake-Test ab.

## CLI

```bash
node packages/mcp/src/cli.ts status   --root <projekt> [--json]
node packages/mcp/src/cli.ts backlog  --root <projekt> [--priority 🔴,🟠] [--open false] [--section HOCH] [--json]
node packages/mcp/src/cli.ts progress --root <projekt> [--status 🔄] [--json]
node packages/mcp/src/cli.ts validate --root <projekt> [--json]
```

Menschliche Ausgabe auf stdout, `--json` liefert die unveränderten core-Payloads.
Exit-Codes: 0 = Erfolg bzw. keine Validate-Funde, 1 = Fehler/Funde, 2 = Usage.
Nach `npm install` steht im Repo auch `npx method-docs …` (via `bin`-Eintrag).

## Architektur

- **core** (`packages/core`): zeilenbasierter, fehlertoleranter Parser
  (`ParseResult<T>` mit strukturierten Warnungen — Drift bricht nie ab),
  Status-/Validierungs-Reports, Merge-Sichten. Zero-Dependencies.
- **mcp** (`packages/mcp`): dünne Transport-Schicht — Tools/Resources mappen
  1:1 auf core-Funktionen. MCP-SDK v1.x stabil (`^1.30.0`), zod v3.
- **Tests:** Vitest, protokollecht gegen die Fixtures in
  `packages/core/tests/fixtures/` (`project-a` = sauber, `project-b-drift` =
  Fälle D1–D15); Server-Tests via `InMemoryTransport` + `Client`.
