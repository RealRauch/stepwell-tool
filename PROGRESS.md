# Projekt-Tracking: method-docs

> Quellen-Methode: `docs/PLAYBOOK.md` (verbatim)
> Fortschrittsdatei — wird nach jedem Step aktualisiert.
> Legende: ⬜ offen · 🔄 in Arbeit · ✅ fertig · ⛔ blockiert

> **Struktur (Archiv-Muster):** Diese Datei enthält die **vollständige Fortschrittstabelle**
> und Detail-Blöcke **nur für laufende/offene Phasen**. Detail-Blöcke abgeschlossener Phasen
> wandern nach Abschluss **unverändert** in `docs/archive/PROGRESS_ARCHIVE.md`.

## Laufende Phasen
### Phase 13 — Naming-Refactor: STEPWELL durchgängig

**Umfang (Steps):**

- **13.1 Manifests + Lockstep + packaging-Tests (N1/1)**
- **13.2 TOOL_NAME + Resource-URI-Schema (N1/2)**
- **13.3 Doku + Decision + CHANGELOG (N1/3)**
- **13.4 Repo-Rename — explizites Gate (N1/4)**
### Phase 14 — Sprach-Umstellung: Englisch primär

**Umfang (Steps):**

- **14.1 Konventions-Flip: PLAYBOOK §2/§3 + Decision 10 (I1/1)**
- **14.2 Offene Dateien beider Repos auf EN-Struktur (I1/2)**
- **14.3 core: detectLocale-Gleichstand + EN-Templates (I1/3)**
- **14.4 Messages + Tool-Beschreibungen + CLI-Help EN (I1/4)**
- **14.5 Fixtures-README EN + gemischtsprachige Fixture (I1/5)**
- **14.6 STRUCT_LOCALE-Entscheid + CHANGELOG (I1/6)**
### Phase 15 — Methoden-Sync: Kickoff-Fast-Pfad

**Umfang (Steps):**

- **15.1 Fast-Pfad + Parallel-Reads in beiden Kopien (E3)**








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
| 13.2 | TOOL_NAME + Resource-URI-Schema (N1/2) | 🔄 |
| 13.3 | Doku + Decision + CHANGELOG (N1/3) | ⬜ |
| 13.4 | Repo-Rename — explizites Gate (N1/4) | ⬜ |
| 14.1 | Konventions-Flip: PLAYBOOK §2/§3 + Decision 10 (I1/1) | ⬜ |
| 14.2 | Offene Dateien beider Repos auf EN-Struktur (I1/2) | ⬜ |
| 14.3 | core: detectLocale-Gleichstand + EN-Templates (I1/3) | ⬜ |
| 14.4 | Messages + Tool-Beschreibungen + CLI-Help EN (I1/4) | ⬜ |
| 14.5 | Fixtures-README EN + gemischtsprachige Fixture (I1/5) | ⬜ |
| 14.6 | STRUCT_LOCALE-Entscheid + CHANGELOG (I1/6) | ⬜ |
| 15.1 | Fast-Pfad + Parallel-Reads in beiden Kopien (E3) | ⬜ |
| 12.6 | Phase-Kontext-Resource: Items zur Lesezeit mergen (G5) | ✅ |
