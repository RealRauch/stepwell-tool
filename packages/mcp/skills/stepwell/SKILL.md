---
name: stepwell
description: STEPWELL-Arbeitsweise für Projekte mit BACKLOG.md/PROGRESS.md und dem method-docs-MCP-Server (stepwell) — Session-Einstieg, Statuspflege, Archivierung und Release-Disziplin. Aktiv, wenn das Zielprojekt die vier STEPWELL-Dateien enthält oder ein solches aufgesetzt werden soll.
---

# STEPWELL — Arbeitsweise (method-docs)

Bindende Methode: `docs/PLAYBOOK.md` im Zielprojekt (verbatim-Kopie). Checkliste:
`docs/LESSONS.md`. Diese Skill-Datei fasst zusammen, **wann du welches Tool aufrufst** —
sie ersetzt die Tools nicht und die Methode nicht.

## Die vier Dateien

`BACKLOG.md` (nur Offenes, Prioritäts-Sektionen 🔴→🔵), `PROGRESS.md` (Fortschrittstabelle +
Detail-Blöcke **laufender** Phasen), `docs/archive/BACKLOG_ARCHIVE.md` und
`docs/archive/PROGRESS_ARCHIVE.md` (beide **append-only** — nie nachbearbeiten).

Fehlen alle vier im `root`: kein STEPWELL-Projekt → die vier Dateien aus den Vorlagen
anlegen: MCP-Resources `methoddocs://templates/{kind}` (backlog | progress |
backlog-archive | progress-archive), danach `docs_validate` — muss fund-frei sein.

## Session-Einstieg (in dieser Reihenfolge, vor jeder Schreiboperation)

1. `docs_status` (root) — Aggregate + Validierungs-Funde.
2. `progress_show` (root, phase) — Detail-Block der laufenden Phase.
3. Nächster offener Step = erste ⬜-Zeile der laufenden Phase. Sequenziell arbeiten,
   niemals Schritte überspringen.

## Statuspflege — immer über die Tools, nie per Hand (LESSONS 17)

- `progress_update` — Step-Status in Tabelle + Detail-Block (🔄 vor Beginn, ✅ nach
  verifiziertem Abschluss; vollständige Phase wandert automatisch ins Archiv).
  Optionale Parameter: `title` (Phasen-Titel umbenennen), `note` (Verifikations-Zeile
  im Archiv-Block).
- `archive_item` — erledigtes Backlog-Item verbatim ins Archiv + Einzeiler im
  Erledigt-Index (`note` = Commit-Hash).
- `backlog_add` / `backlog_update` / `backlog_remove` — Items format-sicher anlegen,
  ändern, entfernen (statt Hand-Edit).
- `progress_plan_phase` — neue Phase vorausplanen (Tabellen-Zeilen ⬜ + Scope-Skelett).
- `dryRun` ist überall Default `true`: erst Vorschau/Diff, dann mit `dryRun: false`
  schreiben.

## Gates (bindend)

- **Freigabe-Gate:** Planen → Paketieren → **erst nach expliziter menschlicher
  Freigabe** implementieren. Agenten starten Code-Steps nicht eigenmächtig.
- **Content-Gates je Dateiklasse:** Source-/Test-Edits im Step-Scope = autonom;
  Dependency-Manifeste/Dockerfiles = anhalten; `.env`/CI-Workflows/Löschen von Tests/
  Schema-Migrationen = explizites menschliches Gate.
- **Inline-Fix-Lane:** Ein Bug im laufenden, freigegebenen Step-Scope (≤ ~10 Zeilen,
  nur „Niedrig“-Dateien) darf sofort gefixt werden — Pflicht danach: retro
  `backlog_add` (Serie `F`) + sofortiges `archive_item` mit Commit-Hash.
- **Test-First (ROT → GRÜN):** jeder Code-Step bringt seine Tests mit; die ROT-Phase
  wird belegt (eigener Test-Commit mit Failure-Beleg), Verifikation vor jedem ✅:
  `npm run typecheck && npm run test` (oder projektäquivalent) — fehlerfrei.

## Abschlüsse

- **Step fertig:** `progress_update` ✅ erst nach bestandener Verifikation; Commit pro
  Step (Tests zuerst, dann Implementierung — auditierbar im Log).
- **Phase fertig:** `progress_update` verschiebt den Block verbatim ins
  `PROGRESS_ARCHIVE`; danach Doku-Sync prüfen (AGENTS-Kickoff, README, PLAYBOOK-Kopien)
  und Commit.
- Vor jedem Commit: `docs_validate` muss fund-frei sein.

## Werkzeug-Alternativen

Ohne MCP-Server steht dieselbe Oberfläche als CLI bereit (`npx @method-docs/mcp`):
`status`/`backlog`/`progress`/`validate`/`archive`/`progress-update` — `--json`-Ausgaben
tragen das versionierte Schema-Feld (`schema: 1`; Breaking ⇒ Nummer hoch). Die Methode
selbst lebt in PLAYBOOK.md — dieses Skill ist nur der Wegweiser zu den Tools.
