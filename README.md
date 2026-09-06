# method-docs

CLI + MCP-Server zum Lesen, Prüfen und Verwalten der Projekt-Doku
(`BACKLOG.md`, `PROGRESS.md`, Archive) in Repos, die der
[PLAYBOOK-Methode](docs/PLAYBOOK.md) folgen (Häppchen, Archiv-Muster, Test-First).

**Status:** früher Aufbau — Phase 1 (Core-Library, read-only). Siehe `PROGRESS.md`.

## Prinzip

Markdown bleibt Source of Truth. Das Tool liest, validiert und assistiert —
es ersetzt die Doku nicht. Konsistenzregeln (Erledigt-Index ↔ Archiv, verwaiste
Checkboxen, Parser-Drift) werden als Warnungen gemeldet.

## Setup

```bash
npm install
npm run typecheck
npm run test
```

## Pakete

| Paket | Zweck |
|-------|-------|
| `@method-docs/core` | Parser + Status-/Validierungs-Reports (kein MCP) |
| `@method-docs/mcp` | MCP-Server (stdio) über core *(Phase 2)* |
