# Projekt-Tracking: method-docs

> Quellen-Methode: `docs/PLAYBOOK.md` (verbatim)
> Fortschrittsdatei — wird nach jedem Step aktualisiert.
> Legende: ⬜ offen · 🔄 in Arbeit · ✅ fertig · ⛔ blockiert

> **Struktur (Archiv-Muster):** Diese Datei enthält die **vollständige Fortschrittstabelle**
> und Detail-Blöcke **nur für laufende/offene Phasen**. Detail-Blöcke abgeschlossener Phasen
> wandern nach Abschluss **unverändert** in `docs/archive/PROGRESS_ARCHIVE.md`.

## Laufende Phasen

### Phase 1 — Core-Library (read-only Parser + Reports)

**Ziel:** `@method-docs/core` parst `BACKLOG.md`, `PROGRESS.md` und beide Archive
fehlertolerant und liefert Status- und Validierungs-Reports als Datenstrukturen
(Grundlage für MCP in Phase 2 und die CLI in 2.6).

**Formate (Realität, nicht Idealisierung):** abgeleitet aus `D:\Development\stadtpfad-pwa`
— Sektionen mit eigenen Kopfregeln (z. B. R-/U-Serien), Emoji-Prioritäten
(🔴🟠🟡🟢🔵), Item-Blöcke `### [ ] ID — Titel — prio`, Erledigt-Index als Einzeiler,
Fortschrittstabelle `| # | Step | Status |`, Status-Icons ⬜🔄✅⛔.

**Abnahme (je Step test-first):** `npm run typecheck` + `npm run test` grün;
Parser gegen Fixtures (`packages/core/tests/fixtures/`) — realistische, anonymisierte
Nachbauten inkl. Drift-/Edge-Cases (fehlende Sektion, unbekanntes Icon, kaputter Block).
**Fixtures v1 liegen bereits** (Session-Prep 09/2026, Commit siehe Log): `project-a` (sauber)
+ `project-b-drift` (Fälle D1–D15) — Spezifikation/Erwartungen in `fixtures/README.md`;
1.2 beginnt mit den roten Tests dagegen.

**Datenmodell (ab 1.2 bindend):**
- `ParseResult<T> = { value: T, warnings: Warning[] }` mit
  `Warning = { code, file, line?, message }` — **Parse-Warnungen** (D1, D3, D4, D6,
  D7, D9, D10) entstehen beim Parsen einzelner Dateien; **Validate-Funde** (D2, D5,
  D8, D11–D15) prüfen Querkonsistenz über Dateien hinweg. `docs_validate` = Aggregator
  (Konsistenzregeln + eingesammelte Parse-Warnungen).
- Item-Blöcke tragen ab 1.2 `span: { start, end }` (Zeilenbereich) und `raw`
  (verbatim-Block) — Basis für die verbatim-Verschiebung in Phase 3 (`archive_item`,
  Lesson L16).
- **Prio-Ableitung:** Titel-Suffix gewinnt → Sektions-Emoji als Fallback (Warnung
  `PRIO_MISSING`) → erst dann `unknown` (Beschluss 09/2026, siehe fixtures/README).
- **Datei-Pflicht:** Alle 4 Dateien (BACKLOG, PROGRESS, beide Archive) sind Pflicht —
  fehlt eine → harter Fehler, keine Toleranz.
- **Zeitstempel:** Doku-Daten immer `JJMMDD/HHMM` (z. B. `260907/1523`); `MM/JJJJ`-Bestand
  toleriert, Warnung `DATE_LEGACY` nur in offenen Dateien — Migration siehe PLAYBOOK §3.
- Vollständige Parameter-/Kategorien-Referenz: `packages/core/tests/fixtures/README.md`
  („Schnittstellen-Referenz") — dort gepinnt, nicht hier dupliziert.

**Umfang (Steps):**

- **1.1 Monorepo-Grundgerüst:** npm workspaces (`core`, `mcp` folgt Phase 2), TS strict
  (`NodeNext`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), Vitest,
  typecheck deckt **src UND tests** ab (Lesson L12), Smoke-Test ROT→GRÜN als Toolchain-Nachweis.
- **1.2 BACKLOG-Parser:** Sektionen + Prioritäten erkennen; Item-Blöcke zu
  `{id, title, priority, section, open, location, text, span, raw}`; `[ ]`/`[x]`; Erledigt-Index-Einzeiler
  separat modelliert. Drift (unbekannte Struktur) → Warnung, kein Abbruch.
- **1.3 PROGRESS-Parser:** Fortschrittstabelle (`{step, name, status}`) +
  „Laufende Phasen"-Blöcke `{phase, goal, scope[], acceptance}`; Status-Icons mappen.
- **1.4 Archiv-Reader:** `BACKLOG_ARCHIVE.md` (Item-Blöcke) + `PROGRESS_ARCHIVE.md`
  (Detail-Blöcke) parsen; Merge-Sicht `backlog_show(id)` über offen + Erledigt-Index + Archiv.
- **1.5 docs_status:** Aggregation — offene Items je Prio, laufende Phase(n), ✅-Quote
  der Tabelle, eingebettete Validierungs-Warnungen.
- **1.6 docs_validate:** Konsistenzregeln: (a) Erledigt-Index-Eintrag ↔ Archiv-Block
  beidseitig, (b) `[x]`-Checkbox ohne Archivierung, (c) 🔄-Phase ohne Detail-Block bzw.
  umgekehrt, (d) Parser-Drift-Warnungen gesammelt.

### Phase 2 — MCP-Server (stdio)

**Ziel:** `@method-docs/mcp` stellt die core-Reports als MCP-Tools + Resources bereit
(Tools: `docs_status`, `backlog_list`, `backlog_show`, `progress_list`, `progress_show`,
`docs_validate`; Resources: `methoddocs://backlog`, `methoddocs://progress`, `methoddocs://archive/{kind}`).

**Multi-Projekt-Prinzip:** Der Projekt-Root wird **je Tool-Call** übergeben
(eine Server-Instanz bedient beliebig viele Projekte). Resources laufen als
Resource-Templates mit Root im URI (z. B. `methoddocs://{root}/backlog`) — Details
in 2.1/2.4 festzurren.

**Offen vor Start:** SDK-Version festlegen (v1 stabil vs. v2-alpha: `registerTool`/`serveStdio`-API,
Zod v4) — Recherche-Step 2.1. Detaillierte Paketierung erfolgt bei Phasenstart hier.

**Umfang (grob):** 2.1 SDK-Festlegung + Grundserver (Echo-Tool, Inspector-Test) ·
2.2 Read-Tools backlog_* · 2.3 Read-Tools progress_* + docs_validate ·
2.4 Resources + Resource-Templates · 2.5 opencode-Integration (`opencode.json`) + README ·
2.6 CLI (`method-docs <status|backlog|progress|validate>`, bin-Eintrag, stdout-Reports;
Thin-Wrapper über core, Basis für `npx`-Nutzung in beliebigen Folgeprojekten).

### Phase 3 — Mutation (`archive_item`, `progress_update`)

**Ziel:** Genau **zwei** schreibende Tools, beide **Dry-run + Apply**:
- `archive_item` — verbatim-Verschiebung in `docs/archive/BACKLOG_ARCHIVE.md`
  + Einzeiler im Erledigt-Index + Status-Pflege in `PROGRESS.md`.
- `progress_update` — Statuspflege in `PROGRESS.md` (Detail-Block + Fortschrittstabelle;
  PLAYBOOK §2-Dokumentationspflicht, 🔄 vor Beginn / ✅ nach Abschluss).

Bewusste Grenze: Alles andere editiert der Agent **direkt** in den Markdown-Dateien —
das Tool automatisiert nur die fehleranfälligen, strukturellen Operationen (Lesson L16).
**Nicht vor** Bewährung von Phase 1+2 starten; detaillierte Paketierung bei Phasenstart.

---

## Fortschritt

| # | Step | Status |
|---|----------|--------|
| 1.1 | Monorepo-Grundgerüst | ✅ |
| 1.2 | BACKLOG-Parser | ✅ |
| 1.3 | PROGRESS-Parser | ✅ |
| 1.4 | Archiv-Reader | ✅ |
| 1.5 | docs_status | ✅ |
| 1.6 | docs_validate | ✅ |
| 2.1 | SDK-Festlegung + Grundserver | ⬜ |
| 2.2 | MCP Read-Tools backlog | ⬜ |
| 2.3 | MCP Read-Tools progress + validate | ⬜ |
| 2.4 | MCP Resources | ⬜ |
| 2.5 | opencode-Integration + Doku | ⬜ |
| 2.6 | CLI | ⬜ |
| 3.1 | archive_item (Dry-run) | ⬜ |
| 3.2 | archive_item (Apply) + Verifikation | ⬜ |
| 3.3 | progress_update (Dry-run + Apply) | ⬜ |
