# BACKLOG.md — Offene Punkte (Stand: 260908/2113

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

### [ ] D1 — CI-Workflow einrichten (typecheck + test + validate) — 🟡
- **Ort:** `.github/workflows/` (fehlt bislang)
- **Problem:** Suite und `docs_validate` laufen nur lokal — Regressionen und Drift-Funde landen erst beim nächsten lokalen Lauf; README nennt `validate` „CI-tauglich", nutzt es aber nicht selbst.
- **Fix:** GitHub Actions-Workflow: `npm install` → `typecheck` → `test` → `validate --root .` (Exit 1 bei Funden). Konfig-Ausnahme gem. PLAYBOOK §6 (keine Unit-Tests auf YAML) im Commit vermerken.
- **Abnahme:** Workflow läuft grün auf push/PR; Validate-Exit-Code-Verhalten ist im Workflow sichtbar.
- **Paketierung:** Step 7.1 in Phase 7 (Distribution & Feldtest).

### [ ] D2 — Feldtest gegen stadtpfad-pwa (Realformat) — 🟡
- **Ort:** `../stadtpfad-pwa` (BACKLOG.md, PROGRESS.md, docs/archive/*) — Realformat-Referenz, **nur lesen, nie verändern**.
- **Problem:** Die Tools sind nie gegen ein echtes STEPWELL-Projekt außerhalb der Fixtures gelaufen; Realformat-Abweichungen (Layout, Serien, Kopfregeln, Erledigt-Index-Formate) würden als ungeparste Drift durchrutschen.
- **Fix:** Alle Read-Tools (`docs_status`, `backlog_list/show`, `progress_list/show`, `docs_validate`) plus CLI-Kommandos gegen das Geschwister-Repo laufen lassen; Protokoll je Tool; jede Anomalie → eigenes BACKLOG-Item mit Fundstelle + Abnahmekriterium.
- **Abnahme:** Protokoll je Tool existiert; Anomalien sind als Items erfasst; stadtpfad-pwa bleibt byte-identisch.
- **Paketierung:** Step 7.2 in Phase 7.

### [ ] D4 — PLAYBOOK ergänzen: Backlog-Wurzel + Inline-Fix-Lane (alle Kopien) — 🟡
- **Ort:** `docs/PLAYBOOK.md` §0/§2 — **in allen Kopien simultan** (method-docs, stadtpfad-pwa; Kopfregel der Methode).
- **Problem:** Decision 14 (AGENTS.md) definiert Backlog-Wurzel + Inline-Fix-Lane nur projektlokal — die Methode selbst sagt es nicht, andere Kopien verhalten sich abweichend.
- **Fix:** Zwei Sätze ergänzen: (1) Jeder Step einer Phase ist aus mindestens einem offenen BACKLOG-Item abgeleitet (Verweis Item → Step wird je Item dokumentiert). (2) Inline-Fix-Lane: im freigegebenen laufenden Step entdeckte Bugs (im Code-Scope, ≤ ~10 Zeilen, keine API-/Schema-/Design-Entscheidung) dürfen sofort gefixt werden; Pflicht danach: retro `backlog_add` (Serie `F`) + sofortiges `archive_item` mit Commit-Hash.
- **Abnahme:** Beide PLAYBOOK-Kopien textgleich ergänzt, deckungsgleich mit AGENTS Decision 14; `docs_validate` beider Projekte clean.
- **Bemerkung:** Als Step 7.4 paketierbar, sobald D5 (Step-Ergänzung als Tool) umgesetzt ist — sonst Mikro-Paketierung nach Phase 7.

### [ ] D5 — Tool-Lücke: Step zu laufender Phase ergänzen — 🟡
- **Ort:** `packages/core/src/mutations.ts` (`planPhase` lehnt existierende Phase ab; `planProgressUpdate` wirft „unknown step", wenn der Step weder in Tabelle noch Scope steht)
- **Problem:** Die Scope-Erweiterung einer **laufenden** Phase (z. B. +1 Step) ist nur per Hand-Edit an Tabellen-Zeile und Scope-Bullet möglich — genau die Struktur-Edits, die LESSONS 17 dem Tool zuordnen will. Aufgedeckt bei der Phase-7-Paketierung (PLAYBOOK-Sync wollte als 7.4 rein).
- **Fix:** `progress_plan_phase` für existierende Phasen öffnen oder Zusatz-Modus: fehlende Tabellen-Zeile + Scope-Bullet in bestehender Phase ergänzen (Step-Präfix-Validierung, Dry-run-Modell), test-first.
- **Abnahme:** Laufende Phase wird ohne Hand-Edit um einen Step erweitert; Nachbar-Zeilen byte-identisch; `npm run typecheck && npm run test` grün.

---

## 🟢 NIEDRIG

### [ ] D3 — Publishing-Pack-Check (npm pack, bin, README-Install) — 🟢
- **Ort:** `packages/*/package.json` (keine `files`-Felder), `README.md` (Installations-Abschnitt)
- **Problem:** README verspricht `npx method-docs`; ohne `files`-Felder würde `npm pack` Tests und Fixtures mit ausliefern; der bin-Shim (`.ts`-Entry, Shebang) ist nie real ausgeführt worden; scoped (`@method-docs/mcp`) vs. unscoped Name ist ungeklärt.
- **Fix:** `files`-Felder setzen, `npm pack` Dry-run je Workspace prüfen, bin lokal ausführen (`method-docs status --root .`), README-Installations-Abschnitt korrigieren.
- **Abnahme:** Pack-Inhalt nur Source (keine tests/fixtures), bin funktioniert lokal, Doku stimmt mit dem Package überein.
- **Paketierung:** Step 7.3 in Phase 7.

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
- T4 — Phasen-Planung als Tool-Operation (Phase anlegen mit Steps) — erledigt (Fix `9fea4bc` — planPhase/applyPhasePlan + MCP progress_plan_phase: Tabellen-Zeilen ⬜, Skeleton mit vollem Scope, Prefix-Validierung; PLAN_WITHOUT_WIP bis zum ersten 🔄 definiert)

---
