# AGENTS.md — method-docs

> Arbeitsanweisungen für AI-Agenten & Mitentwickler.
> **Bindende Methode:** `docs/PLAYBOOK.md` · **Review-Checkliste:** `docs/LESSONS.md`
> Beide sind verbatim-Kopien der projektunabhängigen Methode — hier nicht projektspezifisch anpassen.

## Überblick

Tool + MCP-Server zum **Lesen, Prüfen und Verwalten** der Methoden-Doku (`BACKLOG.md`,
`PROGRESS.md`, `docs/archive/BACKLOG_ARCHIVE.md`, `docs/archive/PROGRESS_ARCHIVE.md`)
in Projekten, die der PLAYBOOK-Methode folgen.

**Grundsatz: Markdown bleibt Source of Truth.** Das Tool verliert die Doku = Datenverlust
unmöglich; es liest, validiert und assistiert. Schreibzugriffe nur Phase 3 (`archive_item`).

## Stack

- Node.js ≥ 22, TypeScript (strict, `NodeNext`), npm workspaces
- Vitest (Test-First, ROT → GRÜN — siehe PLAYBOOK §6)
- MCP: `@modelcontextprotocol/sdk` (stdio) — **erst Phase 2**, Version dort festlegen und aktuelle API prüfen (SDK v1 stabil vs. v2-alpha mit `registerTool`/`serveStdio`)

## Befehle

- `npm install` — Abhängigkeiten (Root, Workspaces)
- `npm run typecheck` — alle Workspace-tsconfigs + Root-Konfig (Vitest-Config)
- `npm run test` / `npm run test:watch` — Vitest
- `npm run build` — Workspaces (ab Phase 2 relevant)

## Struktur

| Pfad | Zweck |
|------|-------|
| `packages/core` | Parser + Reports + Validierung — **keine** MCP-Abhängigkeit |
| `packages/mcp` | Dünne MCP-Schicht über core (Phase 2) |
| `packages/*/tests` | Tests je Paket — **werden typegeprüft** (Lesson L12) |
| `docs/PLAYBOOK.md` | Methode (verbatim) |
| `docs/LESSONS.md` | Checkliste (verbatim) |
| `PROGRESS.md` | Häppchen-Paketierung + Fortschritt |
| `BACKLOG.md` | Offene Punkte |

## Kickoff für neue Sessions (in dieser Reihenfolge)

1. `docs/PLAYBOOK.md` (Methode) + `docs/LESSONS.md` (Checkliste) lesen — beide bindend.
2. `PROGRESS.md` → „Laufende Phasen": nächstes offenes Häppchen in definierter Reihenfolge (aktuell: 1.2 BACKLOG-Parser).
3. **Testdaten:** `packages/core/tests/fixtures/` — die `README.md` dort ist die arbeitende
   Spezifikation für 1.2–1.6 (erwartete Parser-Ergebnisse + Validate-Funde D1–D12).
   `project-a` = sauberes Musterprojekt (Parser-Positivpfad) · `project-b-drift` = absichtliche Drift-Fälle (Toleranz + Validate).
4. **Realformat-Referenz (nur lesen, nicht verändern):** Geschwister-Repo `../stadtpfad-pwa`
   (`BACKLOG.md`, `PROGRESS.md`, `docs/archive/*`) — Original der Struktur.
5. Verifikation vor jedem Abschluss: `npm run typecheck` + `npm run test` (Test-First: ROT → GRÜN).

## Architektur-Entscheidungen

1. **Zwei Schichten:** core ist bibliotheks-fähig (CLI/CI später fast gratis); MCP ist nur Transport.
2. **Fehlertoleranter Parser:** Projekte folgen der Methode, nicht byte-genau. Parser-Drift → Validierungs-Warnung (`docs_validate`), kein Crash.
3. **Archiv-Muster respektieren:** Archive sind append-only; `archive_item` (Phase 3) verschiebt verbatim + Einzeiler im Erledigt-Index, Dry-run zuerst.
4. **Fixtures:** Parser-Häppchen testen gegen realistische, anonymisierte Fixtures (abgeleitet aus stadtpfad-pwa; Sektionen mit Kopfregeln, R-/U-Serien, Erledigt-Index, Emoji-Prios).
5. **Nomenklatur:** Item-IDs sind projekt-spezifisch (L12, T7, R5, U23 …) — Parser macht keine Annahmen über das Format außer `[ ]`/`[x]` + `—`-Struktur.
