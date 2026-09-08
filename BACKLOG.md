# BACKLOG.md — Offene Punkte (Stand: 260908/2229

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

### [ ] M2 — MCP-Tool-Annotations ergänzen (readOnly/destructive/idempotent) — 🟡
- **Ort:** `packages/mcp/src/tools.ts` (alle registerTool-Aufrufe); Fundstelle: Tool-Vergleich mit MrLesk/Backlog.md 09/2026 (dort konsequente Annotations auf der gesamten MCP-Surface).
- **Problem:** Unsere Tools tragen nur `title`/`description` — die MCP-Annotations `readOnlyHint`/`destructiveHint`/`idempotentHint` fehlen; Clients können Sicherheits-Entscheidungen (Autonomie, Retry) nicht aus den Metadaten ableiten.
- **Fix:** Annotations je Tool nachfügen: readOnly für echo/docs_status/docs_validate/backlog_show/backlog_list/progress_list/progress_show; destruktiv für archive_item/backlog_remove; progress_update/backlog_add/backlog_update/progress_plan_phase als nicht-destruktiv mit dryRun-Default; Read-Tools zusätzlich idempotent. Test-first: Zuordnung über die registrierten Metadaten asserten.
- **Abnahme:** Alle Tools tragen vollständige Annotations; Metadaten-Test grün; `npm run typecheck && npm run test` grün.

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

### [ ] M5 — Init-Fallback: klare Anleitung bei Root ohne STEPWELL-Projekt — 🟡
- **Ort:** `packages/core` (Parser/validate-Aggregation) + `packages/mcp` (Fehlerantworten); Vorbild: `backlog://init-required`-Fallback bei MrLesk/Backlog.md (klare Anleitung statt stummer Fehler).
- **Problem:** Tool-Calls gegen einen Root ohne PLAYBOOK-Projekt (alle vier Dateien fehlen) liefern eine Warn-/Fehler-Wüste pro Datei statt einem klaren Befund „hier ist kein STEPWELL-Projekt" mit Anleitung.
- **Fix:** Erkennung „kein Projekt" (alle vier Dateien fehlen) → genau ein Finding mit eigenem Code (z. B. `PROJECT_NOT_INITIALIZED`) + Anleitung (vier Dateien anlegen, PLAYBOOK-Referenz); Teilbestand (einzelne Datei fehlt) bleibt wie gehabt Einzel-Warnungen. Test-first über neues Fixture (leerer Ordner).
- **Abnahme:** Leeres Verzeichnis → genau ein Finding mit Anleitung; Teilbestand unverändert; `npm run typecheck && npm run test` grün.

### [ ] M6 — JSON-Output-Kontrakt der CLI versionieren (schema-Feld + Doku) — 🟡
- **Ort:** `packages/mcp/src/cli.ts` (`--json`-Zweig gibt den Roh-Payload unverändert aus); Fundstelle: Backlog.md „stable, versioned JSON for scripts"; D1 (CI) nutzt den JSON-/Exit-1-Weg bereits — Versionierung ist die offene Lücke.
- **Problem:** Der `--json`-Output ist ein unversionierter Roh-Payload — Scripts/CI koppeln sich implizit an die aktuelle Feldstruktur; Kern-Änderungen brechen Verbraucher lautlos.
- **Fix:** JSON-Output um Versionsfeld ergänzen (z. B. `{ schema: 1, ...payload }`); Schema (Felder je Command) im README dokumentieren; Regel: Breaking-Änderung am Schema ⇒ Versionsnummer hoch.
- **Abnahme:** Alle `--json`-Ausgaben tragen das Versionsfeld; Contract-/Snapshot-Test je Command; README-Doku; `npm run typecheck && npm run test` grün.

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

---
