# BACKLOG.md — Offene Punkte (Stand: 260908/2333

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

### [ ] M3 — structuredContent für Tool-Antworten prüfen (MCP-Spec-Compliance) — 🟡
- **Ort:** `packages/mcp/src/tools.ts` (Antwort-Formate); Fundstelle: MrLesk/Backlog.md v1.43 „MCP spec compliance overhaul"; eigenes Warning-Modell (Decision 6) liefert bereits strukturierte Daten.
- **Problem:** Tool-Antworten sind reine Text-Payloads; maschinelle Weiterverarbeitung (CI, Scripts, Agent-Tooling) müsste Text parsen, obwohl Findings/Warnings/Pläne intern strukturiert vorliegen.
- **Fix:** Entscheiden (mit Feldtest-Ergebnis aus Phase 7): Findings/Warnings/Plan-Diffs **zusätzlich** als `structuredContent` ausliefern (Text bleibt menschenlesbar). Kandidaten: docs_validate, progress_update, archive_item (Plan-Antwort).
- **Abnahme:** Entscheidung (inkl. Begründung) dokumentiert; falls ja: mindestens docs_validate + progress_update mit structuredContent, Client-Verträglichkeit verifiziert.

### [ ] M4 — Tool-Surface-Guardrail: keine Guide-/Meta-Tools, Surface klein halten — 🟡
- **Ort:** AGENTS.md (Architektur-Entscheidungen); Fundstelle: MrLesk/Backlog.md BACK-408 (vier Workflow-Guide-Tools zu einem Enum-Selector konsolidiert — „simpler for agents to discover"); Sync-Kandidat für den D4-Schlag.
- **Problem:** Ohne Guardrail wachsen Meta-/Guide-/How-to-Tools in die Tool-Liste; Agenten entdecken die operative Oberfläche dann schlechter. Methoden-Wissen lebt bei uns bereits in PLAYBOOK.md + Resources — das soll so bleiben.
- **Fix:** Entscheidung ergänzen: Tools nur für konkrete Struktur-/Lese-Operationen; Methoden-Anleitung bleibt in Dateien/Resources; jedes neue Tool begründet den Surface-Zuwachs (Alternativprüfung: Parameter an existierendes Tool oder Resource statt neues Tool).
- **Abnahme:** Regel als Decision verankert; Tool-Liste enthält kein reines Doku-/Guide-Tool; Begründungspflicht im README (Contribution/Entwurfs-Abschnitt) erwähnt.

---

## 🟢 NIEDRIG

### [ ] L2 — Checkpoint-SHA je Phase in PROGRESS verankern — 🟢
- **Ort:** `packages/core` (Phasen-Abschluss in planProgressUpdate) + `packages/mcp` (progress_update-Parameter); Fundstelle: Google Conductor (gemini-cli-extensions/conductor, 09/2026) — `[checkpoint: <sha>]` je Phase im plan.md, Phase-Diff-Scoping über den vorherigen Checkpoint-SHA.
- **Problem:** Commit-SHAs landen bei uns nur im Erledigt-Index (archive_item-note); PROGRESS speichert pro Phase keinen Verifikations-Anker — „was hat diese Phase geändert?" ist nachträglich nicht per Git beantwortbar (Diff-Range fehlt), logisches Revert je Phase nicht ableitbar.
- **Fix:** progress_update bei Phase-Abschluss optionalen `checkpoint`-Parameter (SHA) spendieren, der in die **Verifikation:**-Zeile des Archiv-Blocks bzw. den Index-Einzeiler übernommen wird; Format grob validieren (7–40 Hex), keine Pflicht. Test-first: Plan-/Apply-Tests für die SHA-Durchreichung.
- **Abnahme:** Phase-Abschluss mit checkpoint-SHA erscheint verbatim in Archiv + Index; ohne Parameter unverändertes Verhalten; `npm run typecheck && npm run test` grün.

### [ ] L3 — Verifikation als ausführbarer Plan formatieren — 🟢
- **Ort:** PLAYBOOK-Kopien (§6 Verifikation) + Konvention für die Verifikations-Zeile bei progress_update; Fundstelle: Google Conductor — „Manual Verification Steps" (Command, Ausführung, erwartetes Ergebnis) mit Pause bis expliziter menschlicher Bestätigung.
- **Problem:** Unsere Verifikation reduziert sich auf „typecheck + test grün" — die Zeile dokumentiert, DASS geprüft wurde, aber nicht WIE ein Mensch nachprüft; Reproduzierbarkeit für Dritte (Review, Feldtest, neue Session) leidet.
- **Fix:** Konvention ergänzen (Prosa-Edit, keine Code-Änderung): Verifikations-Zeile/-Liste nennt mindestens einen nachlaufbaren Befehl + erwartetes Ergebnis; Vorlage in PLAYBOOK §6; bewusst ohne docs_validate-Warnung (zu weich, reine Konvention).
- **Abnahme:** PLAYBOOK-Änderung in beiden Kopien textgleich; ein Beispiel-Verifikationsblock im Archiv zeigt das Format.

### [ ] L4 — Doc-Sync-Reminder bei Phasen-Abschluss — 🟢
- **Ort:** `packages/mcp` (progress_update-Antwort bei Phasen-Abschluss); Fundstelle: Google Conductor — „Synchronize Project Documentation": nach Track-Abschluss werden product.md/tech-stack.md-Updates vorgeschlagen (Diff + Approval).
- **Problem:** Nach Phasen-Abschluss erinnert nichts daran, dass Projekt-Doku sync-bedürftig sein kann (AGENTS-Kickoff, README, PLAYBOOK-Abweichungen) — der Sync-Schlag hängt aktuell an Erinnerung.
- **Fix:** Plan-Antwort bei Phasen-Abschluss um statischen Reminder-Bullet ergänzen („Doku-Sync prüfen: AGENTS-Kickoff, README, PLAYBOOK-Kopien"); reiner Textbaustein ohne Logik; Test auf Antwortinhalt.
- **Abnahme:** Phasen-Abschluss-Antwort enthält Reminder; übrige Antworten unverändert; `npm run typecheck && npm run test` grün.

### [ ] L5 — docs_review-Tool-Idee: Phasen-Review gegen Plan/Spec — 🟢
- **Ort:** `packages/core` + `packages/mcp` (neues Tool — Surface-Gewinn muss die M4-Guardrail bestehen); Fundstelle: Google Conductor — review-Skill (Plan-Compliance-Check, strukturierter Report mit Severity-Findings + Diff-Vorschlägen; Review-Fixes werden als Tasks getrackt — entspricht unserer Inline-Fix-Lane, Decision 14).
- **Problem:** Review läuft heute manuell (LESSONS-Checkliste + docs_validate); ein diff-basiertes Review „Phase X gegen ihre Steps/Items" (Plan-Compliance, Tests gelaufen?, Findings mit Datei/Zeile) ist nicht tool-gestützt.
- **Fix:** Erst Alternativprüfung nach M4 (Parameter an docs_status/progress_show? Resource?), dann Minimal-Entwurf: Review-Report als Read-Only-Tool; Findings-Format ans Warning-Modell (Decision 6) anlehnen.
- **Abnahme:** Entwurfsentscheidung dokumentiert (neues Tool vs. Erweiterung Bestand); falls Tool: Annotations, Tests und M4-Begründung im README.

### [ ] L6 — Release-Prozess: CHANGELOG, Versionspolitik, Pack-Smoke in CI — 🟢
- **Ort:** Repo-Root (`CHANGELOG.md`), `package.json` beider Workspaces + Root, `.github/workflows/ci.yml`; Fundstelle: D3 (Pack-Check nur lokal, kein Publish-Flow), M6 (JSON-Schema-Version braucht Versionspolitik), **Decision 16 (Lockstep-SemVer)**; Format-Vorgabe: **Keep a Changelog 1.1.0** (https://keepachangelog.com/en/1.1.0/), im Wesentlichen übernehmen.
- **Problem:** Kein CHANGELOG, keine Versionierungs-Konvention, kein Smoke gegen das gepackte Artefakt — Distribution (Phase 7) endet am Pack-Inhalt, nicht am veröffentlichten Paket.
- **Fix:** CHANGELOG.md nach KAC 1.1.0: `## [<version>] - <Datum>` mit Sektionen Added/Changed/Deprecated/Removed/Fixed/Security, neueste Version zuerst, `## [Unreleased]` oben, SemVer-Referenz; Abweichung erlaubt **nur beim Datums-/Zeitformat** (JJMMDD/HHMM gem. Decision 11 statt ISO — Entscheidung im Step dokumentieren); **Redundanz-Regel:** CHANGELOG = kuratierte, nutzerrelevante Aggregate je Release — kein Git-Log-Dump und keine Duplikation von Erledigt-Index/BACKLOG_ARCHIVE (dort bleibt die Item-/Commit-Historie; Regel im README festhalten). Release-Mechanik gem. Decision 16: Lockstep-Bump in allen **drei** package.json + Git-Tag `v<version>` (Tags existieren noch nicht); CI-Job: npm pack beider Workspaces → Tarball installieren → stdio-Handshake-Smoke gegen das Artefakt; Publish-Checkliste im README (otp, dist-tag, nur `@method-docs/mcp` publizieren).
- **Abnahme:** CHANGELOG seit Phase 1 im KAC-Format (Historie kuratiert aus dem Erledigt-Index abgeleitet, ohne Index-Duplikation); CI-Smoke grün gegen Tarball; README-Abschnitt „Releases" nennt Format, Lockstep-Regel + Redundanz-Regel.

### [ ] L7 — docs_status um Next-Action-Empfehlung ergänzen — 🟢
- **Ort:** `packages/core` (Status-Report) + `packages/mcp` (docs_status-Antwort); Fundstelle: Conductor-Status-Skill („Next Action Needed", „Current Phase and Task", „Blockers").
- **Problem:** docs_status liefert Aggregate (offene Items je Prio, 🔄-Steps, ✅-Quote), aber keine Ableitung „was ist als Nächstes zu tun" — der Session-Kickoff braucht derzeit den zweiten Blick in progress_list/backlog_list.
- **Fix:** Zwei abgeleitete Zeilen ergänzen: „nächster offener Step" (erste ⬜-Zeile der laufenden Phase in definierter Reihenfolge) und „nächste Priorität mit offenen Items" (erste nicht-leere Prioritäts-Sektion 🔴→🔵); rein ableitend aus geparsten Daten, keine neue Tool-Oberfläche.
- **Abnahme:** Beide Felder deterministisch über Fixtures project-a/-b getestet; CLI `status` zeigt sie; `npm run typecheck && npm run test` grün.

### [ ] L8 — Sync-Schlag: 🔵-Semantik + Session-Einstieg kanonisieren (PLAYBOOK-Kopien) — 🟢
- **Ort:** PLAYBOOK-Kopien (§3 ID-/Serien-Konvention, §0/§2 Ablauf) in **beiden** Repos (method-docs + stadtpfad-pwa); Muster: D4-Sync-Schlag (textgleich, Commit je Repo).
- **Problem:** „🔵 = Test-Lücke" existiert nur als BACKLOG-Legende, nicht kanonisch im PLAYBOOK; der Standard-Session-Einstieg (docs_status → progress_show → nächste ⬜ vor jeder Schreiboperation) ist Projekt-Konvention (AGENTS-Kickoff), aber nicht Methode — neue Projekte raten.
- **Fix:** Sync-Schlag in beiden Kopien textgleich: §3 ergänzt „🔵 = Test-Lücken (explizite ID, keine Serie)"; kurzer Absatz „Session-Einstieg" (§0 oder §2); danach byte-identischer Abgleich beider Kopien (Hash-Vergleich als Beleg).
- **Abnahme:** Beide PLAYBOOK-Kopien textgleich (Diff-/Hash-Beleg im Erledigt-Index); docs_validate method-docs clean.

---

## 🔵 TEST-LÜCKEN

### [ ] T5 — BOM-Toleranz des Parsers (UTF-8-BOM in Datei-Köpfen) — 🔵
- **Ort:** `packages/core` (Datei-Einlesen/Parser); Fundstelle: eigene Prüfung 09/2026 (`rg feff|bom packages` = leer) — Windows-Editoren/PowerShell (`Out-File`, Notepad) schreiben gern UTF-8-BOM.
- **Problem:** Der zeilenbasierte Parser liest Heading/Kopfregeln ab Zeile 1; ein BOM vor `# BACKLOG.md` bzw. vor der ersten Sektion kann Kopfregel-/Sektionserkennung brechen oder als ungeklärte Drift durchrutschen — exakt die Zielklasse des fehlertoleranten Parsers, aber ungetestet.
- **Fix:** BOM am Dateianfang (U+FEFF) deterministisch strippen — stille Toleranz, dokumentiert, keine Warnung; Test-first: Fixture mit BOM, Parser-Positivpfad + Validate-Lauf dagegen.
- **Abnahme:** BOM-Datei parst identisch zur BOM-losen Variante (Assert auf Ergebnis-Gleichheit); Toleranz in README/Format-Doku erwähnt; `npm run typecheck && npm run test` grün.

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
- W1 — Erledigt-Index im Tabellenformat parsen (Feldtest stadtpfad-pwa) — erledigt (Fix `9e9d334` (Test-Commit `55773ae` vorab, Suite 5× ROT belegt) — Tabellen-Index als tolerierte Variante geparst (Union, Header-Skip, Item→ID+Titel, Commit/Phase→sha, 2-Spalten-Toleranz); Fixture project-e-tableindex; Realprojekt: 54→13 `ARCHIVE_WITHOUT_INDEX` — Rest = ehrliche Funde an Kompakt-Zeilen (L1–L11-Range, R1-A/B-Sammelzeile), Klärung kanonisch ja/nein in D4 (8.4-Sync) nachgetragen)
- W2 — Archiv-Parse-Warnungen nicht als offene Befunde melden — erledigt (Fix `3d224bf` (Test-Commit `69fe002`, 5× ROT belegt) — Aggregation in validate.ts sammelt Parse-Warnungen nur noch aus offenen Dateien; Konsistenz-Funde auf Archiv-Dateien (ARCHIVE_WITHOUT_INDEX) bleiben. Drift-Fall D16 (Z8) als Fixture; Realprojekt: Archiv-Warnungen 55→0)
- D5 — Tool-Lücke: Step zu laufender Phase ergänzen — erledigt (Fix `14b9e3a` (Test-Commit `15d867e`, 2× ROT belegt) — planPhase im Erweiterungs-Modus geöffnet: existierende laufende Phase bekommt fehlende Tabellen-Zeilen + Scope-Bullets (Einfügepunkt = letzter Scope-Bullet, Nachbar-Zeilen byte-identisch, reine Einfügung per Test belegt); Guards: Step bereits in Tabelle oder Scope → Fehler, archivierte Phase bleibt gesperrt; MCP-Beschreibung + Fixture-Spec (D5/8.3) nachgezogen)
- D4 — PLAYBOOK ergänzen: Backlog-Wurzel + Inline-Fix-Lane (alle Kopien) — erledigt (Sync-Schlag 09/2026 in beiden PLAYBOOK-Kopien textgleich (method-docs@abb6dcf, stadtpfad-pwa@08d2613): Backlog-Wurzel (§0.3) + Inline-Fix-Lane (§0.6) methodisch verankert; W1-Klärung als §3 „Erledigt-Index-Formate" (Tabelle = tolerierte Lesvariante, Kompakt-Zeilen = Fund); AGENTS D13-Referenz §0.4, D14 verankert-vermerkt + Decision 15 (Risiko-Matrix) ergänzt; docs_validate method-docs clean)
- G1 — Content-basierte Approval-Gates (Risiko-Matrix) ergänzen — erledigt (Fix `abb6dcf` — Risiko-Matrix als AGENTS Decision 15 verankert, in Decision 13/14 referenziert; PLAYBOOK §0.5 (Content-Gates) textgleich in beiden Kopien (stadtpfad-pwa@08d2613))
- G2 — RED-Phase beweisbar machen (test-first auditierbar) — erledigt (Fix `abb6dcf` — Commit-Konvention in PLAYBOOK §4 + §6 („ROT wird belegt, nicht behauptet") beider Kopien (stadtpfad-pwa@08d2613); Kette test-Commit → feat-Commit seit 8.1–8.3 im Log sichtbar (55773ae→9e9d334, 69fe002→3d224bf, 15d867e→14b9e3a))
- A1 — PLAYBOOK ergänzen: Adoptions-Modell für Bestandsprojekte — erledigt (Fix `abb6dcf` — PLAYBOOK §3 „Adoption Bestandsprojekte" (Snapshot, Budget-Inventar, Verifikationsstufen 0–2 in der PROGRESS-Kopfzeile, Strangler) textgleich in beiden Kopien (stadtpfad-pwa@08d2613); bewusst ohne Tool-Teil (KISS))
- G3 — PLAYBOOK ergänzen: Smell-Budget als optionales Qualitäts-Gate — erledigt (Fix `abb6dcf` — Smell-Budget als optionale dritte Säule in PLAYBOOK §5 beider Kopien (stadtpfad-pwa@08d2613): weiche Smells = Funde→Items, harte Smells = Delta-Budget in der PROGRESS-Kopfzeile, Delta-Report = Freigabe-Kontext; explizite Optionalität verankert (keine Deklaration → kein Budget))
- T6 — Coverage-Schwellen in Vitest-Config + CI-Gate — erledigt (9.1: vitest.config.ts-Thresholds (core 90/85/95/90, mcp 85/78/90/85 per-glob), exclude types-only + barrels + stdio-Bootstrap; CI-Aktivierung via bestehendes --coverage in .github/workflows/ci.yml (Phase 7.1).)
- M2 — MCP-Tool-Annotations ergänzen (readOnly/destructive/idempotent) — erledigt (Commit f6fe0f1)
- M5 — Init-Fallback: klare Anleitung bei Root ohne STEPWELL-Projekt — erledigt (Fix `a07f759` (Test-Commit `ebcfc44`, ROT belegt) — PROJECT_NOT_INITIALIZED: loadProject/readBacklog/readProgress werfen bei allen vier fehlenden Dateien den Fehler mit Anleitung; docsValidate → genau ein Finding (ok: false), docsStatus → Zero-Aggregate + Fund, MCP asResult → strukturierte { code, message, missing }-Fehlerantwort für alle Tools; Teilbestand bleibt harter Fehler pro Datei; Fixture project-empty, README + Fixture-Spec nachgezogen)
- M8 — Projekt-Init: Vorlagen-Auslieferung klären (Resources vs. init_project) — erledigt (Fix `fdf6907` (Test-Commit `f17573e`, ROT belegt) — Entscheidung Variante A (Templates als Read-Only-Resources, Begründung M4-Guardrail, im README dokumentiert): projectTemplates (4 Skeletons) kanonisch in core, Resource `methoddocs://templates/{kind}` mit Kind-Validierung; Skeleton-Projekt docs_validate-fund-frei; M5-Anleitung verweist auf Templates)
- M7 — SKILL.md als ergänzender Distributionsweg (stepwell-Skill) — erledigt (Fix `57ffc54` (2× ROT belegt) — packages/mcp/skills/stepwell/SKILL.md (Session-Einstieg, Tool-Zuordnung, Freigabe-/Content-Gates, Inline-Fix-Lane, Test-First, Abschlüsse; konsistent mit PLAYBOOK, ohne nicht existierende Parameter); files-Feld um "skills" erweitert (Pack-Check im packaging-Test); README-Abschnitt "Distribution (zwei Kanäle)")
- M6 — JSON-Output-Kontrakt der CLI versionieren (schema-Feld + Doku) — erledigt (Fix `5224662` (Test-Commit `596cb8b`, 3× ROT belegt) — JSON_SCHEMA_VERSION=1 als erstes Feld jeder --json-Ausgabe (status/backlog/progress/validate/archive/progress-update, Dry-run + Apply); Contract-Tests je Command inkl. Top-Level-Key-Snapshot; README-Feldkontrakt-Tabelle + Kontrakt-Regel (Breaking ⇒ schema hoch, Lockstep Decision 16); SKILL.md-Erwähnung)

---
