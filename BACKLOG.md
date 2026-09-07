# BACKLOG.md — Offene Punkte (Stand: 260908/0046)

> **Diese Datei enthält nur OFFENE Items.** Erledigte Items werden nach dem Abschluss
> **unverändert** in `docs/archive/BACKLOG_ARCHIVE.md` verschoben; hier bleibt je Item nur ein Einzeiler
> im Erledigt-Index (unten). Fundstellen/Fix-Ideen/Decisions nicht löschen — ins Archiv verschieben.
> Legende: 🔴 kritisch · 🟠 hoch · 🟡 mittel · 🟢 niedrig · 🔵 Test-Lücke
> Abarbeitung: sequenziell nach Priorität, jedes Item test-first, Commit pro Item oder thematischer Gruppe.

---

## 🔴 KRITISCH

> Keine offenen Items.

---

## 🟠 HOCH

> Keine offenen Items.

---

## 🟡 MITTEL

### [ ] T4 — Phasen-Planung als Tool-Operation (Phase anlegen mit Steps) — 🟡
- **Ort:** `packages/core/src/mutations.ts:247-262` (`planProgressUpdate`: neue Phase nur mit 🔄, Folgesteps ohne Scope-Eintrag → Fehler), `packages/mcp`
- **Problem:** Eine neue Phase lässt sich nicht vorausplanen: `planProgressUpdate` lehnt ⬜ für eine neue Phase ab („nur 🔄-Phasen können neu angelegt werden"), generiert Placeholder-Namen (`| 6.1 | 6.1 |`) und verwirft Folgesteps, die nicht im Skelett-Scope stehen. Konsequenz: Phase 6 (Plan-Update 09/2026) musste per direktem Edit in die Tabelle — genau die Struktur-Operation, die LESSONS 17 eigentlich dem Tool zuordnen will. Der direkte Edit ist dokumentiert als unvermeidlicher Workaround.
- **Fix:** `progress_plan_phase` (oder `planPhase` in core): legt Tabelle-Zeilen für alle Steps mit Namen + ⬜ an und optional Detail-Block-Skelett mit vollständigem Scope; Integration in `progress_update` (erste 🔄-Step übernimmt bestehenden Scope statt neuem Skeleton); Validierung: Step-Nummern-Präfix passt zum Phasen-Namen.
- **Abnahme:** Test-first: neue Phase mit 3 Steps planen → apply → Tabelle + Skeleton konsistent, `progress_update` auf Folgesteps ohne Workaround möglich; `npm run typecheck && npm run test` grün.

---

## 🟢 NIEDRIG

---

## 🔵 TEST-LÜCKEN

---

## ✅ Erledigt-Index

> (Einzeiler je abgeschlossenem Item, mit Commit-Hash; Details im Archiv.)
- L1 — Methoden-Änderungen (09/2026) in PLAYBOOK-Kopie von stadtpfad-pwa nachziehen — erledigt (Sync 09/2026 in stadtpfad-pwa@01cbc30, beide Kopien byte-identisch)
- M1 — Methoden-Änderungen (09/2026: Freigabe-Gate, Lesson 17) in PLAYBOOK-/LESSONS-Kopien synchronisieren — erledigt (Sync 09/2026 in stadtpfad-pwa@f6e2277, beide Kopien byte-identisch)
- R1 — planProgressUpdate entfernt bei Row-Ergänzung + Phasen-Abschluss die falschen Zeilen (Stale-Span) — erledigt (Fix `36e89c2` — Block-Entfernung vor Row-Edit, Scope-Name-Extraktion bereinigt; Regressionstests beide Layouts grün)
- R2 — Locale-Synonyme in sechs Regexes hartkodiert statt aus profile.ts abgeleitet — erledigt (Fix `2a0fcdb` — sechs Regexes aus allSynonyms()/synonymPattern() abgeleitet; Suite unverändert grün)
- R3 — CRLF-Projekte: angehängte Archiv-Blöcke bekommen gemischte Zeilenenden — erledigt (Fix `f057966` — raw mit /\\r?\\n/ splitten, mit detektiertem EOL joinen; CRLF-Roundtrip-Tests grün)
- R4 — Apply schreibt Pläne ohne Stale-Check gegen den aktuellen Dateistand — erledigt (Fix `fd38724` — assertFreshChanges vergleicht change.before mit Disk-Stand; Stale-Tests rot→grün)
- R5 — Keine Tests für die Mutation-Edge-Paths aus R1/R3 — erledigt (Tests in `36e89c2`/`f057966`/`fd38724` — R1/R3/R4-Edge-Paths abgedeckt, Fixture project-d-tablefirst ergänzt)
- R6 — docs_validate prüft keine doppelten Step-Nummern in der Fortschrittstabelle — erledigt (Fix `3000192` — STEP_DUPLICATE-Finding ab zweitem Vorkommen, mit Zeilennummer)
- T3 — CLI: Emoji-Prios und Status-Icons über ASCII-Aliase parametrisierbar machen — erledigt (Fix `09d18d8` — core aliases.ts (resolvePriority/resolveStatus + Help-Listen), CLI normalisiert Input, MCP-Schema unverändert)
- T2 — Titel-/Scope-Edits an der Fortschrittstabelle als Tool — erledigt (Fix `1912854` — optionaler title-Parameter: Rename zeilenzahlneutral, Reihenfolge bei Phasen-Abschluss definiert (Rename → Archiv), MCP + CLI angebunden)
- T1 — CRUD-Tools für Backlog-Items ergänzen (Create/Update/Remove) — erledigt (Fix `0c4724a` — planBacklogAdd/Update/Remove + Apply-Verifikation, Serien-ID-Vergabe, Sektionswechsel, Stand:-Refresh, Archiv-Verschub ohne Erledigt-Marker; MCP backlog_add/update/remove)

---
