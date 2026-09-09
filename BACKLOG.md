# BACKLOG.md — Offene Punkte (Stand: 260909/2206

> **Diese Datei enthält nur OFFENE Items.** Erledigte Items werden nach dem Abschluss
> **unverändert** in `docs/archive/BACKLOG_ARCHIVE.md` verschoben; hier bleibt je Item nur ein Einzeiler
> im Erledigt-Index (unten). Fundstellen/Fix-Ideen/Decisions nicht löschen — ins Archiv verschieben.
> Legende: 🔴 kritisch · 🟠 hoch · 🟡 mittel · 🟢 niedrig · 🔵 Test-Lücke
> Abarbeitung: sequenziell nach Priorität, jedes Item test-first, Commit pro Item oder thematischer Gruppe.

---

## 🔴 KRITISCH

> Keine offenen Items.

### [ ] R9 — Coverage-Gate: Exit-Code bei Threshold-Verletzung umgebungsabhängig (isolated CLI exit 0) — CI-Gate potenziell wirkungslos — 🔴
- **Ort:** Coverage-Gate (vitest `coverage.thresholds`) + CI-Job (`npx vitest run --coverage` in `.github/workflows/ci.yml`); Fundstelle: Diagnose im Step 10.1/R7 (09/2026) — isolierte CLI-Läufe mit 99%-Schwellen (Glob- wie Global-Form, `npx` wie direkter `node node_modules/vitest/vitest.mjs`-Aufruf, Vitest 3.2.7) endeten mit **exit 0**, obwohl `ERROR: Coverage for lines (36.73%) does not meet global threshold (99%)` geloggt wurde; im vitest-verschachtelten Spawn (geerbte Process-Env) lief derselbe Lauf korrekt mit exit 1 + Meldung. Kandidat aus der Vitest-Quelle: der `exit(force)`-Watchdog ruft bei hängendem Shutdown `process.exit()` ohne Argument (= 0) und überschreibt das gesetzte `process.exitCode`.
- **Problem:** Das Coverage-Gate (T6/9.1) stützt sich auf den vitest-Exit-Code — ist der umgebungsabhängig unzuverlässig, ist das Gate in CI (ubuntu, kein äußeres vitest) potenziell wirkungslos und Coverage-Degradation würde lautlos durchgehen.
- **Fix:** Ursache klären (Watchdog-/Shutdown-Pfad in Vitest 3.2.7 bzw. Verhalten unter Ubuntu-CI verifizieren) und das Gate robust stellen: entweder Versions-Upgrade (Dep-Änderung = Content-Gate Mittel) oder Exit-Code-unabhängige Auswertung (Threshold-Meldung im Output bzw. `coverage-summary.json`-Prüfung als Gate) — Entscheidung im Step dokumentieren; CI-Job entsprechend anpassen (CI-Workflows = Content-Gate Hoch, Freigabe je Vorkommnis).
- **Abnahme:** Threshold-Verletzung führt deterministisch (lokal Windows UND ubuntu-CI) zum Scheitern des Runs; Abnahme-Test bleibt grün (Exit + Meldung); `npm run typecheck && npm run test` grün.

---

## 🟠 HOCH

> Keine offenen Items.

### [ ] H1 — Dist-Blocker: npm-Artefakt enthält TS-Source und läuft nicht aus node_modules (Build/dist-Schritt nötig) — 🟠
- **Ort:** `packages/*/package.json` (files/exports/bin), Build-Konfiguration; Fundstelle: Pack-Smoke 9.8/L6 (`scripts/pack-smoke.mjs`) — installiertes Artefakt startet nicht: Node verweigert TS-Stripping unter `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`, Node 22.23 lokal; by design auch in neueren Versionen).
- **Problem:** `@method-docs/mcp` shippt reine `.ts`-Source (`files: ["src"]`); Verbraucher (`npm i -g`, `npx @method-docs/mcp`, README-Install-Abschnitt) bekommen ein nicht lauffähiges Paket — die dynamischen Smoke-Anteile (stdio-Handshake, CLI-Bin gegen das Artefakt) mussten deshalb auf statische Checks reduziert werden.
- **Fix:** Build-/dist-Schritt ergänzen (tsc → `dist/` in beiden Workspaces), `exports`/`bin` auf `dist` umstellen, `files` entsprechend, CI-Job auf den dynamischen Smoke (Handshake + Bin gegen `dist`-Artefakt) erweitern; Variante diskutieren: `tsc` in prepublishOnly oder committed dist. Achtung Content-Gate: Dependency-/Manifest-Änderungen = Mittel (Freigabe je Vorkommnis).
- **Abnahme:** `node node_modules/@method-docs/mcp/src/…`-Äquivalent (dist-Einstieg) startet aus Installation; pack-smoke mit dynamischem Handshake grün; README-Install verifiziert (`npx @method-docs/mcp`); `npm run typecheck && npm run test` grün.

---

## 🟡 MITTEL

### [ ] M4 — Tool-Surface-Guardrail: keine Guide-/Meta-Tools, Surface klein halten — 🟡
- **Ort:** AGENTS.md (Architektur-Entscheidungen); Fundstelle: MrLesk/Backlog.md BACK-408 (vier Workflow-Guide-Tools zu einem Enum-Selector konsolidiert — „simpler for agents to discover"); Sync-Kandidat für den D4-Schlag.
- **Problem:** Ohne Guardrail wachsen Meta-/Guide-/How-to-Tools in die Tool-Liste; Agenten entdecken die operative Oberfläche dann schlechter. Methoden-Wissen lebt bei uns bereits in PLAYBOOK.md + Resources — das soll so bleiben.
- **Fix:** Entscheidung ergänzen: Tools nur für konkrete Struktur-/Lese-Operationen; Methoden-Anleitung bleibt in Dateien/Resources; jedes neue Tool begründet den Surface-Zuwachs (Alternativprüfung: Parameter an existierendes Tool oder Resource statt neues Tool).
- **Abnahme:** Regel als Decision verankert; Tool-Liste enthält kein reines Doku-/Guide-Tool; Begründungspflicht im README (Contribution/Entwurfs-Abschnitt) erwähnt.

### [ ] R8 — pack-smoke: unquoted Argumente bei shell:true brechen bei Leerzeichen im Windows-Temp-Pfad — 🟡
- **Ort:** `scripts/pack-smoke.mjs` (`run()`-Hilfe, `shell: true` auf win32); Fundstelle: Code-Review Phase 9 (09/2026).
- **Problem:** `spawnSync("npm", args, { shell: true })` verkettet Argumente **unquoted**; unter Windows brechen Tarball-/Install-Pfade, wenn das Temp-Verzeichnis Leerzeichen enthält (z. B. `C:\Users\John Smith\...`). CI (ubuntu, kein Shell-Parsing-Problem) ist nicht betroffen — nur lokale Windows-Läufe in solchen Umgebungen.
- **Fix:** Pfad-Argumente beim Shell-Aufruf explizit quoting (doppelte Anführungszeichen, interne `"` escapen) oder npm ohne Shell auflösen (`npm.cmd` auf win32 via `where`/feste Kandidaten).
- **Abnahme:** pack-smoke läuft mit Leerzeichen im Temp-Pfad (Test via `TMP`/`TEMP`-Override mit Leerzeichen-Verzeichnis); REST unverändert grün.

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
- M3 — structuredContent für Tool-Antworten prüfen (MCP-Spec-Compliance) — erledigt (Fix `e7847cc` (Test-Commit `1565238`, 3× ROT belegt) — Entscheidung JA (Feldtest 7.2: CI/Script-Weiterverarbeitung; Warning-Modell liegt strukturiert vor): docs_validate/progress_update/archive_item liefern Payload zusätzlich als structuredContent (Text unverändert, Fehler ohne structuredContent, Read-Tools bleiben plain — per Test abgesichert); Client-Verträglichkeit via InMemory-Client geprüft; README dokumentiert)
- L6 — Release-Prozess: CHANGELOG, Versionspolitik, Pack-Smoke in CI — erledigt (Fix `8ec8aef` (Test-Commit `1d0817c`, 2× ROT belegt) — CHANGELOG.md (KAC 1.1.0, [Unreleased], kuratiert seit Phase 1, Redundanz-Regel + Datumsformat-Abweichung JJMMDD/HHMM dokumentiert); README-Abschnitt "Releases" (Format, Lockstep-SemVer Decision 16, Publish-Checkliste); scripts/pack-smoke.mjs + CI-Job `pack-smoke` (CI-Edit durch Sammel-Freigabe 9.x gedeckt): pack → install → statische Artefakt-Checks. Fund: Node verweigert TS-Stripping unter node_modules → dynamischer Handshake blockiert → neuer Blocker-Item H1 (Build/dist))
- L3 — Verifikation als ausführbarer Plan formatieren — erledigt (Sync-Schlag 09/2026 — PLAYBOOK §6 „Verifikation als ausführbarer Plan (Konvention)" (nachlaufbarer Befehl + erwartetes Ergebnis) in beiden Kopien textgleich (method-docs@ee00f9c, stadtpfad-pwa@eed7ae9, SHA256 4BAEBA88…AE0D); Beispiel-Verifikationsblock entsteht mit dem Phase-9-Abschluss im Archiv)
- L8 — Sync-Schlag: 🔵-Semantik + Session-Einstieg kanonisieren (PLAYBOOK-Kopien) — erledigt (Sync-Schlag 09/2026 — PLAYBOOK §3 „🔵 = Test-Lücken" (thematische Serien-ID, nie Auto-Nummer aus Prioritäts-Serie) + §0.8 „Session-Einstieg (bindend)" (PLAYBOOK/LESSONS → PROGRESS nächster Step 🔄 → BACKLOG) in beiden Kopien textgleich (method-docs@ee00f9c, stadtpfad-pwa@eed7ae9, SHA256 4BAEBA88…AE0D); docs_validate method-docs clean)
- L2 — Checkpoint-SHA je Phase in PROGRESS verankern — erledigt (Fix `e3ff79f` (Test-Commit `af48a97`, 4× ROT belegt) — progress_update checkpoint-Parameter (7–40 Hex validiert, lowercase) erscheint bei Phasen-Abschluss verbatim in der **Verifikation:**-Zeile des Archiv-Blocks — allein (`(checkpoint: <sha>)`) oder kombiniert mit note; ohne Parameter unverändertes Verhalten; MCP-Schema + CLI `--checkpoint`; README/Fixtures-Spec/SKILL.md nachgezogen; Apply-Roundtrip per Test)
- L4 — Doc-Sync-Reminder bei Phasen-Abschluss — erledigt (Fix `a093a1e` (Test-Commit `830def8`, 2× ROT belegt) — statischer Reminder „Doku-Sync prüfen: AGENTS-Kickoff, README, PLAYBOOK-Kopien" bei Phasen-Abschluss: ProgressUpdatePlan.docSyncReminder (nur bei completedPhase, sonst undefined) + Apply-Verifikations-Messages; übrige Antworten unverändert (per Test); README-Tool-Zeile nachgezogen)
- L7 — docs_status um Next-Action-Empfehlung ergänzen — erledigt (Fix `ab2af81` (Test-Commit `f7b8233`, 4× ROT belegt) — DocsStatus.nextStep (erste ⬜-Zeile einer laufenden Phase in Tabellen-Ordnung) + nextPriority (erste nicht-leere Sektion 🔴→🔵), deterministisch über project-a/-b getestet; CLI `status` zeigt beide Zeilen; JSON-Contract additiv erweitert (schema bleibt 1, Snapshot-Test aktualisiert); ohne laufende Phase/offene Items → undefined (auch im M5-Zero-State))
- T5 — BOM-Toleranz des Parsers (UTF-8-BOM in Datei-Köpfen) — erledigt (Fix `f6921f1` (Test-Commit `9b96c4f`, ROT belegt) — stripBom (U+FEFF am Dateianfang) in parseBacklog/parseProgress (Archive delegieren) — stille Toleranz, keine Warnung; Fixture project-f-bom (project-a-Zwilling mit BOM in allen vier Dateien): Parsing + docsValidate ergebnisgleich zum BOM-losen Original; ROT-Befund: BOM vor der ersten Sektion brach die Sektionserkennung (Layout-abhängige Zufalls-Toleranz beseitigt); README + Fixtures-Spec dokumentiert)
- L5 — docs_review-Tool-Idee: Phasen-Review gegen Plan/Spec — erledigt (Entscheidung (Alternativprüfung nach M4, 09/2026): KEIN docs_review-Tool. (1) Plan-Compliance ist bereits abgedeckt: docs_validate prüft 🔄↔Detail-Block (WIP_WITHOUT_PLAN/PLAN_WITHOUT_WIP), progress_show liefert Ziel/Abnahme/Scope verbatim, docs_status aggregiert Findings + Next-Action; ein Review-Tool würde diese Funde doppelt ausgeben. (2) „Tests gelaufen?" ist aus den vier Doku-Dateien nicht ableitbar — das Tool müsste CI-/Log-Quellen lesen und bräche die Architektur-Grenze (core liest nur die vier Dateien). (3) M4-Guardrail: kein bekannter Fund des Feldtests/ Betriebs, der den Surface-Zuwachs rechtfertigt; Review läuft über LESSONS-Checkliste + docs_validate. Reaktivierungs-Kriterium: zeigen Feldtests, dass Plan-Compliance-Reviews wiederholt manuell nachgebaut werden, dann Minimal-Entwurf als Read-Only-Tool neu bewerten (Findings im Warning-Modell gem. Decision 6, Annotations + M4-Begründung im README))
- L9 — Review-Polish: Warning.file-Kontrakt dokumentieren + Template-Resource-URIs auflisten — erledigt (Fix `9a369c9` (Test-Commit `be7b5f0`, ROT belegt) — Templates-Resource mit statischem List-Callback (`listResources` liefert die vier URIs, mimeType text/markdown); Warning.file-Kontrakt dokumentiert (Datei oder Root bei Root-level-Funden) in types.ts-Kommentar + Fixture-Spec + README; 256/256 grün)
- L10 — nextStep-Kaskade: Fallback auf rein vorausgeplante Phasen — erledigt (Fix `14093de` (Test-Commit `b40be1f`, 3× ROT belegt) — nextStep-Kaskade: (1) erste ⬜-Zeile einer Phase mit 🔄 (Vorrang laufender Arbeit), (2) sonst erste ⬜-Zeile rein vorausgeplanter Phasen (Tabellen-Ordnung), (3) sonst undefined; per Test belegt: Fallback bei reiner Plan-Phase (2.1), Vorrang der laufenden gegen spätere Plan-Phase (2.2 vor 3.1), Durchfall bei erledigter früherer Phase (3.1); project-a/-b-Ergebnisse unverändert; 259/259 grün)
- R7 — Coverage-Gate-Test rekurriert: Nested-Run startet sich selbst, Gate-Akzeptanz nicht beweisbar — erledigt (Fix `4c03eb8` — Nested-Config schließt die Gate-Datei selbst aus (`configDefaults.exclude` + Glob) → genau eine Nested-Ebene; Assertion auf die Ursache geschärft (Threshold-Meldung `does not meet "<glob>" threshold`, Format empirisch verifiziert); Gate-Test 128 s → 7 s, Gesamtsuite ~2 min → ~9 s; Beiwerk: neuer Fund R9 (Exit-Code umgebungsabhängig) als 🔴-Item, Step 10.7 folgt)

---
