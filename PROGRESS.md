# Projekt-Tracking: method-docs

> Quellen-Methode: `docs/PLAYBOOK.md` (verbatim)
> Fortschrittsdatei — wird nach jedem Step aktualisiert.
> Legende: ⬜ offen · 🔄 in Arbeit · ✅ fertig · ⛔ blockiert

> **Struktur (Archiv-Muster):** Diese Datei enthält die **vollständige Fortschrittstabelle**
> und Detail-Blöcke **nur für laufende/offene Phasen**. Detail-Blöcke abgeschlossener Phasen
> wandern nach Abschluss **unverändert** in `docs/archive/PROGRESS_ARCHIVE.md`.

## Laufende Phasen
### Phase 7 — Distribution & Feldtest

**Ziel:** Das Tool verlässt das Rechenzentrum des Entwicklers — CI verriegelt die Suite
(D1 — optional als übernehmbares Template, kein Methoden-Pflichtteil), ein echtes
STEPWELL-Projekt (stadtpfad-pwa) validiert die Tools gegen Realformat (D2), und
das Package ist pack-/install-fähig (D3; README-Versprechen `npx method-docs`).
Paketiert aus den Items D1–D3 gem. Decision 14 (Backlog-Wurzel); D4 (PLAYBOOK-Sync) und
D5 (Step-Ergänzung als Tool) folgen im nächsten Packaging.

**Abnahme:** Workflow grün; Feldtest-Protokoll je Tool, Anomalien als BACKLOG-Items;
`npm pack` nur mit Source, bin-Shim funktioniert, Install-Abschnitt stimmt.
Je Step gilt die Abnahme seines Wurzel-Items (D1–D3).

**Umfang (Steps):**

- **7.1 CI-Workflow (typecheck + test + validate)**
- **7.2 Feldtest stadtpfad-pwa**
- **7.3 Publishing-Pack-Check**



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
| 7.2 | Feldtest stadtpfad-pwa | 🔄 |
| 7.3 | Publishing-Pack-Check | ⬜ |
