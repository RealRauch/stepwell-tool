# Projekt-Tracking: method-docs

> Quellen-Methode: `docs/PLAYBOOK.md` (verbatim)
> Fortschrittsdatei — wird nach jedem Häppchen aktualisiert.
> Legende: ⬜ offen · 🔄 in Arbeit · ✅ fertig · ⛔ blockiert

> **Struktur (Archiv-Muster):** Diese Datei enthält die **vollständige Fortschrittstabelle**
> und Detail-Blöcke **nur für laufende/offene Phasen**. Detail-Blöcke abgeschlossener Phasen
> wandern nach Abschluss **unverändert** in `docs/archive/PROGRESS_ARCHIVE.md`.

## Laufende Phasen

### Phase 1 — Core-Library (read-only Parser + Reports)

**Ziel:** `@method-docs/core` parst `BACKLOG.md`, `PROGRESS.md` und beide Archive
fehlertolerant und liefert Status- und Validierungs-Reports als Datenstrukturen
(Grundlage für CLI in 1.7 und MCP in Phase 2).

**Formate (Realität, nicht Idealisierung):** abgeleitet aus `D:\Development\stadtpfad-pwa`
— Sektionen mit eigenen Kopfregeln (z. B. R-/U-Serien), Emoji-Prioritäten
(🔴🟠🟡🟢🔵), Item-Blöcke `### [ ] ID — Titel — prio`, Erledigt-Index als Einzeiler,
Fortschrittstabelle `| # | Häppchen | Status |`, Status-Icons ⬜🔄✅⛔.

**Abnahme (je Häppchen test-first):** `npm run typecheck` + `npm run test` grün;
Parser gegen Fixtures (`packages/core/tests/fixtures/`) — realistische, anonymisierte
Nachbauten inkl. Drift-/Edge-Cases (fehlende Sektion, unbekanntes Icon, kaputter Block).
**Fixtures v1 liegen bereits** (Session-Prep 09/2026, Commit siehe Log): `project-a` (sauber)
+ `project-b-drift` (Fälle D1–D12) — Spezifikation/Erwartungen in `fixtures/README.md`;
1.2 beginnt mit den roten Tests dagegen.

**Umfang (Häppchen):**

- **1.1 Monorepo-Grundgerüst:** npm workspaces (`core`, `mcp` folgt Phase 2), TS strict
  (`NodeNext`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), Vitest,
  typecheck deckt **src UND tests** ab (Lesson L12), Smoke-Test ROT→GRÜN als Toolchain-Nachweis.
- **1.2 BACKLOG-Parser:** Sektionen + Prioritäten erkennen; Item-Blöcke zu
  `{id, titel, prio, sektion, offen, ort, text}`; `[ ]`/`[x]`; Erledigt-Index-Einzeiler
  separat modelliert. Drift (unbekannte Struktur) → Warnung, kein Abbruch.
- **1.3 PROGRESS-Parser:** Fortschrittstabelle (`{nummer, häppchen, status}`) +
  „Laufende Phasen"-Blöcke `{phase, ziel, umfang[], abnahme}`; Status-Icons mappen.
- **1.4 Archiv-Reader:** `BACKLOG_ARCHIVE.md` (Item-Blöcke) + `PROGRESS_ARCHIVE.md`
  (Detail-Blöcke) parsen; Merge-Sicht `backlog_find(id)` über offen + Erledigt-Index + Archiv.
- **1.5 docs_status:** Aggregation — offene Items je Prio, laufende Phase(n), ✅-Quote
  der Tabelle, eingebettete Validierungs-Warnungen.
- **1.6 docs_validate:** Konsistenzregeln: (a) Erledigt-Index-Eintrag ↔ Archiv-Block
  beidseitig, (b) `[x]`-Checkbox ohne Archivierung, (c) 🔄-Phase ohne Detail-Block bzw.
  umgekehrt, (d) Parser-Drift-Warnungen gesammelt.
- **1.7 CLI:** `method-docs <status|backlog|progress|validate>` (bin-Eintrag, stdout-Reports);
  Basis für `npx`-Nutzung in beliebigen Folgeprojekten.

### Phase 2 — MCP-Server (stdio)

**Ziel:** `@method-docs/mcp` stellt die core-Reports als MCP-Tools + Resources bereit
(Tools: `docs_status`, `backlog_list`, `backlog_show`, `progress_list`, `progress_show`,
`docs_validate`; Resources: `methoddocs://backlog`, `methoddocs://progress`, `methoddocs://archive/{kind}`).

**Offen vor Start:** SDK-Version festlegen (v1 stabil vs. v2-alpha: `registerTool`/`serveStdio`-API,
Zod v4) — Recherche-Häppchen 2.1. Detaillierte Paketierung erfolgt bei Phasenstart hier.

**Umfang (grob):** 2.1 SDK-Festlegung + Grundserver (Echo-Tool, Inspector-Test) ·
2.2 Read-Tools backlog_* · 2.3 Read-Tools progress_* + docs_validate ·
2.4 Resources + Resource-Templates · 2.5 opencode-Integration (`opencode.json`) + README.

### Phase 3 — Mutation (`archive_item`)

**Ziel:** Genau **ein** schreibendes Tool: `archive_item` (Dry-run + Apply) — verbatim-Verschiebung
in `docs/archive/BACKLOG_ARCHIVE.md` + Einzeiler im Erledigt-Index + Status-Pflege in `PROGRESS.md`.
**Nicht vor** Bewährung von Phase 1+2 starten; detaillierte Paketierung bei Phasenstart.

---

## Fortschritt

| # | Häppchen | Status |
|---|----------|--------|
| 1.1 | Monorepo-Grundgerüst | ✅ |
| 1.2 | BACKLOG-Parser | ⬜ |
| 1.3 | PROGRESS-Parser | ⬜ |
| 1.4 | Archiv-Reader | ⬜ |
| 1.5 | docs_status | ⬜ |
| 1.6 | docs_validate | ⬜ |
| 1.7 | CLI | ⬜ |
| 2.1 | SDK-Festlegung + Grundserver | ⬜ |
| 2.2 | MCP Read-Tools backlog | ⬜ |
| 2.3 | MCP Read-Tools progress + validate | ⬜ |
| 2.4 | MCP Resources | ⬜ |
| 2.5 | opencode-Integration + Doku | ⬜ |
| 3.1 | archive_item (Dry-run) | ⬜ |
| 3.2 | archive_item (Apply) + Verifikation | ⬜ |
