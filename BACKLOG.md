# BACKLOG.md — Offene Punkte (Stand: 260908/2139

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

### [ ] D4 — PLAYBOOK ergänzen: Backlog-Wurzel + Inline-Fix-Lane (alle Kopien) — 🟡
- **Ort:** `docs/PLAYBOOK.md` §0/§2/§4/§6 — **in allen Kopien simultan** (method-docs, stadtpfad-pwa; Kopfregel der Methode).
- **Problem:** Decision 14 (AGENTS.md) definiert Backlog-Wurzel + Inline-Fix-Lane nur projektlokal — die Methode selbst sagt es nicht. Hinzu kommen die Guardrail-Funde G1 (Risk-Matrix-Gates) und G2 (beweisbare RED-Phase), ebenfalls nur diskutiert, nicht methodisch verankert.
- **Fix:** Bündel in einem Sync-Schlag ergänzen: (1) **Backlog-Wurzel:** Jeder Step einer Phase ist aus mindestens einem offenen BACKLOG-Item abgeleitet (Verweis Item → Step wird je Item dokumentiert). (2) **Inline-Fix-Lane:** im freigegebenen laufenden Step entdeckte Bugs (im Code-Scope, ≤ ~10 Zeilen, keine Design-Entscheidung) dürfen sofort gefixt werden; Pflicht: retro `backlog_add` (Serie `F`) + sofortiges `archive_item` mit Commit-Hash. (3) **Risk-Matrix-Gates (G1):** Content-basierte Stufen Niedrig/Mittel/Hoch mit Freigabe-Pflicht. (4) **RED-Nachweis (G2):** `test(scope):`-Commit vor `feat(scope):`-Commit, Failure-Beleg in Step-Notiz.
- **Abnahme:** Beide PLAYBOOK-Kopien textgleich ergänzt, deckungsgleich mit AGENTS Decisions 13/14 und den Items G1/G2; `docs_validate` beider Projekte clean.
- **Bemerkung:** Als Step 7.4 paketierbar, sobald D5 (Step-Ergänzung als Tool) umgesetzt ist — sonst Mikro-Paketierung nach Phase 7.

### [ ] D5 — Tool-Lücke: Step zu laufender Phase ergänzen — 🟡
- **Ort:** `packages/core/src/mutations.ts` (`planPhase` lehnt existierende Phase ab; `planProgressUpdate` wirft „unknown step", wenn der Step weder in Tabelle noch Scope steht)
- **Problem:** Die Scope-Erweiterung einer **laufenden** Phase (z. B. +1 Step) ist nur per Hand-Edit an Tabellen-Zeile und Scope-Bullet möglich — genau die Struktur-Edits, die LESSONS 17 dem Tool zuordnen will. Aufgedeckt bei der Phase-7-Paketierung (PLAYBOOK-Sync wollte als 7.4 rein).
- **Fix:** `progress_plan_phase` für existierende Phasen öffnen oder Zusatz-Modus: fehlende Tabellen-Zeile + Scope-Bullet in bestehender Phase ergänzen (Step-Präfix-Validierung, Dry-run-Modell), test-first.
- **Abnahme:** Laufende Phase wird ohne Hand-Edit um einen Step erweitert; Nachbar-Zeilen byte-identisch; `npm run typecheck && npm run test` grün.

### [ ] G1 — Content-basierte Approval-Gates (Risiko-Matrix) ergänzen — 🟡
- **Ort:** AGENTS.md Decision 13 (Freigabe-Gate ist **zeitlich** — vor Phasenstart —, nicht **inhaltlich**); Fundstelle: Best-Practices-Doku 09/2026, Abschnitt „Universal Approval Gates (Risk Matrix)".
- **Problem:** Innerhalb eines freigegebenen Steps wären riskante Datei-Operationen ohne erneute Freigabe möglich: Dependency-Manifeste ändern, Tests löschen, Workflows/`.env` anfassen, Migrationen — die Inline-Fix-Lane (Decision 14) begrenzt Größe, aber nicht die **Dateiklasse**.
- **Fix:** Risiko-Matrix als Decision (später via D4 in PLAYBOOK): **Niedrig** — Source/Test-Edits im Step-Scope → autonom; **Mittel** — Dependency-Manifeste/Dockerfiles → anhalten, Freigabe je Vorkommnis; **Hoch** — `.env`, CI-Workflows, Löschen existierender Tests, Migrationen → explizites menschliches Gate. Inline-Fix-Lane erbt ausschließlich Niedrig.
- **Abnahme:** Matrix ist als Decision verankert und in Decision 14 referenziert; PLAYBOOK-Sync textgleich über D4; jeder Gate-Fall ist in einem Satz entscheidbar (welche Dateiklasse, welche Stufe).
- **Paketierung:** Kandidat nächstes Packaging (mit D4/D5).

### [ ] G2 — RED-Phase beweisbar machen (test-first auditierbar) — 🟡
- **Ort:** PLAYBOOK §4 (Commit-Diskiplin) / §6 (Test-First) — Praxis in diesem Repo; Fundstelle: Best-Practices-Doku 09/2026, Abschnitt „sprachunabhängige TDD-Schleife".
- **Problem:** Test-First ist Ehrenkodex: ROT wird nur behauptet (Augenschein im Chat), nicht nachgewiesen. Weil Test + Implementierung in **einem** Commit landen (z. B. Phase 6, `36e89c2`), ist die RED-Phase nachträglich unauditierbar — ein Tautologie-Test wäre nicht erkennbar.
- **Fix:** Commit-Konvention: neuer Test zuerst im eigenen `test(scope): …`-Commit (Suite ist ROT; das Failure-Log belegt den Befund in der Commit-Message bzw. Step-Notiz), danach `feat(scope): …` mit der Implementierung. PLAYBOOK-Sync über D4.
- **Abnahme:** Konvention steht in PLAYBOOK §4/§6 (beide Kopien, via D4); im ersten Code-Step danach ist die Kette test-Commit → feat-Commit im Log sichtbar.
- **Paketierung:** Kandidat nächstes Packaging (mit D4/D5).

### [ ] W1 — Erledigt-Index im Tabellenformat parsen (Feldtest stadtpfad-pwa) — 🟡
- **Ort:** `packages/core/src/backlog.ts` (`DONE_LINE`-Regex, nur Bullet-Format) + `docs/archive/BACKLOG_ARCHIVE.md`-Parsing (`doneLine` 0/52 im Realprojekt); Protokoll: `docs/feldtest-stadtpfad-pwa.md`
- **Problem:** stadtpfad-pwa pflegt den Erledigt-Index als Tabelle (`| Serie | Item (kurz) | Commit/Phase |`) — der Parser erkennt nur `- ID — Titel — erledigt …`. Folge im Feldtest: 54× `ARCHIVE_WITHOUT_INDEX` (K1–D1), `validate` Exit 1 am Referenzprojekt; der Index **existiert** aber — die Findung ist faktisch ein Falsch-Positiv.
- **Fix:** Entscheidung zwei Ebenen: (a) **Tool:** Index-Tabelle als tolerierte Variante parsen (Union-Matching, `doneIndex` füllen, Spalten `Item` → ID+Titel, `Commit/Phase` → sha). (b) **Methode:** klären, ob die Tabelle eine kanonische Index-Variante ist (PLAYBOOK §3 sagt „Einzeiler") — wenn ja, in D4-Sync aufnehmen; wenn nein, stadtpfad migriert beim nächsten natürlichen Edit.
- **Abnahme:** `docs_validate` auf stadtpfad-pwa meldet keine `ARCHIVE_WITHOUT_INDEX`-Funde mehr (bei Variante a) bzw. nach Migration (Variante b); Suite mit neuem Fixture-Fall grün.
- **Paketierung:** Kandidat nächstes Packaging.

### [ ] W2 — Archiv-Parse-Warnungen nicht als offene Befunde melden — 🟡
- **Ort:** `packages/core/src/validate.ts` (Warn-Sammel-Block: alle vier Dateien inkl. Archive) + `status.ts`; Protokoll: `docs/feldtest-stadtpfad-pwa.md`
- **Problem:** Parse-Warnungen der **Archiv-Dateien** (~50× `PRIO_MISSING`, 4× `BLOCK_UNSTRUCTURED` bei stadtpfad-pwa) fluten `docs_validate`/`docs_status` und übertönen die offenen Befunde — das kontert den Grundsatz „Archive werden nie beanstandet" (PLAYBOOK §3, Migration bindend: Konventions-Warnungen nur offene Dateien).
- **Fix:** Parse-Warnungen aus `BACKLOG_ARCHIVE.md`/`PROGRESS_ARCHIVE.md` unterdrücken (wie `ID_CONVENTION`/`DATE_LEGACY` schon) **oder** mit deutlichem Code-Präfix (`ARCHIVE_…`) kennzeichnen und in `docs_status` standardmäßig ausblenden — Entscheidung bei Umsetzung, test-first.
- **Abnahme:** `docs_status` auf stadtpfad-pwa meldet keine Warnungen aus Archiv-Dateien mehr (bzw. nur noch gekennzeichnet); Fixtures-Suite unverändert grün.
- **Paketierung:** Kandidat nächstes Packaging.

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
- T4 — Phasen-Planung als Tool-Operation (Phase anlegen mit Steps) — erledigt (Fix `9fea4bc` — planPhase/applyPhasePlan + MCP progress_plan_phase: Tabellen-Zeilen ⬜, Skeleton mit vollem Scope, Prefix-Validierung; PLAN_WITHOUT_WIP bis zum ersten 🔄 definiert)
- D1 — CI-Workflow einrichten (typecheck + test + validate) — erledigt (Fix `df55385` — ci.yml als optional Template (push/PR), JUnit + Coverage im Artefakt, validate-Schritt mit Exit 1; @vitest/coverage-v8 als devDep; README-Abschnitt „CI (optional)")
- D2 — Feldtest gegen stadtpfad-pwa (Realformat) — erledigt (Feldtest `260908` — Protokoll `docs/feldtest-stadtpfad-pwa.md`; Tools crash-frei am Realprojekt; Funde als W1 (Index-Tabelle) und W2 (Archiv-Warnungen) wurzelt; stadtpfad-pwa byte-identisch)
- D3 — Publishing-Pack-Check (npm pack, bin, README-Install) — erledigt (Fix `f8a87b7` — files: [\"src\"] in beiden Workspaces, npm pack nur Source (17,8/8,6 kB), Bin lokal verifiziert, README-Install korrigiert (npx @method-docs/mcp))

---
