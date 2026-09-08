# Projekt-Tracking: method-docs

> Quellen-Methode: `docs/PLAYBOOK.md` (verbatim)
> Fortschrittsdatei — wird nach jedem Step aktualisiert.
> Legende: ⬜ offen · 🔄 in Arbeit · ✅ fertig · ⛔ blockiert

> **Struktur (Archiv-Muster):** Diese Datei enthält die **vollständige Fortschrittstabelle**
> und Detail-Blöcke **nur für laufende/offene Phasen**. Detail-Blöcke abgeschlossener Phasen
> wandern nach Abschluss **unverändert** in `docs/archive/PROGRESS_ARCHIVE.md`.

## Laufende Phasen
### Phase 8 — Feldtest-Fixes & Methoden-Sync

**Ziel:** Die Feldtest-Funde aus stadtpfad-pwa (W1/W2) Richtung Realformat beheben —
der Erledigt-Index in Tabellenform wird erkannt, Archiv-Warnungen fluten nicht mehr —,
die letzte bekannte Tool-Lücke schließen (D5: Step zu laufender Phase ergänzen), und
alle offenen Methoden-Ergänzungen in einem textgleichen PLAYBOOK-Sync-Schlag in beide
Kopien bringen (D4 mit G1/G2, A1, G3). Reihenfolge bewusst: W1/W2 und D5 zuerst —
W1 liefert die Methoden-Entscheidung (Index-Tabelle kanonisch ja/nein) für den Sync,
D5 macht die Scope-Erweiterung laufender Phasen selbst tool-gestützt, bevor der
Sync-Schlag als letzter Step läuft.

**Backlog-Wurzel (Decision 14), Item → Step:**
8.1 ← W1 · 8.2 ← W2 · 8.3 ← D5 · 8.4 ← D4 (integriert G1, G2), A1, G3.

**Abnahme:** Je Step gilt die Abnahme seines Wurzel-Items (W1/W2/D5: typecheck + Tests
grün, neue Fixture-Fälle, `docs_validate` am Referenzprojekt stadtpfad-pwa ohne die
Feldtest-Funde; 8.4: beide PLAYBOOK-Kopien textgleich ergänzt, deckungsgleich mit
AGENTS Decisions 13/14, `docs_validate` beider Projekte clean).

**Umfang (Steps):**

- **8.1 Erledigt-Index-Tabelle parsen (W1)**
- **8.2 Archiv-Parse-Warnungen ausblenden (W2)**
- **8.3 Step zu laufender Phase ergänzen (D5)**
- **8.4 PLAYBOOK-Sync-Schlag (D4/G1/G2/A1/G3)**

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
| 7.2 | Feldtest stadtpfad-pwa | ✅ |
| 7.3 | Publishing-Pack-Check | ✅ |
| 8.1 | Erledigt-Index-Tabelle parsen (W1) | ⬜ |
| 8.2 | Archiv-Parse-Warnungen ausblenden (W2) | ⬜ |
| 8.3 | Step zu laufender Phase ergänzen (D5) | ⬜ |
| 8.4 | PLAYBOOK-Sync-Schlag (D4/G1/G2/A1/G3) | ⬜ |
