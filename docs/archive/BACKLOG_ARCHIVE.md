# BACKLOG_ARCHIVE.md — Archiv erledigter Items (append-only)

> Items werden **unverändert** hierher verschoben; nachträgliche Ergänzungen nur als
> neuer Abschnitt unterhalb des Items. Neueste Items unten anfügen.

---

---

### [x] L1 — Methoden-Änderungen (09/2026) in PLAYBOOK-Kopie von stadtpfad-pwa nachziehen — 🟢
- **Ort:** `D:\Development\stadtpfad-pwa\docs\PLAYBOOK.md` (+ `LESSONS.md`, dort unverändert)
- **Warum:** Die Methode wurde erweitert (Beschluss 09/2026: Sync-Regel im Kopfbereich,
  §2 Zuordnungsregel, §3 Item-ID-Nomenklatur + Zeitstempel + Migration, §7 Blockiert-Regel,
  Terminologie „Step" statt „Häppchen", Methoden-Name „STEPWELL");
  die Geschwister-Kopie ist verbatim-pflichtig und driftet sonst vom Original weg.
- **Fix:** Alle geänderten Abschnitte unverändert in die stadtpfad-Kopie übernehmen;
  künftige Methoden-Änderungen immer simultan in allen Kopien (Sync-Regel).
- **Abnahme:** Diff von `PLAYBOOK.md` und `LESSONS.md` zwischen beiden Repos ist leer
  (byte-identisch).
- **Erledigt:** Sync 09/2026 in stadtpfad-pwa@01cbc30, beide Kopien byte-identisch

---

### [x] M1 — Methoden-Änderungen (09/2026: Freigabe-Gate, Lesson 17) in PLAYBOOK-/LESSONS-Kopien synchronisieren — 🟡
- **Ort:** `D:\Development\stadtpfad-pwa\docs\PLAYBOOK.md` + `docs\LESSONS.md`
- **Problem:** Die Methode wurde erweitert (PLAYBOOK §0.3 Freigabe-Gate: Implementierung startet
  erst nach menschlicher Freigabe; LESSONS 17: Struktur-Operationen gehören dem Tool);
  die Geschwister-Kopie ist verbatim-pflichtig und driftet sonst vom Original weg.
- **Fix:** Beide Dateien unverändert in die stadtpfad-Kopie übernehmen; künftig Methoden-Änderungen
  immer simultan in allen Kopien (Sync-Regel).
- **Abnahme:** Diff von `PLAYBOOK.md` und `LESSONS.md` zwischen beiden Repos ist leer (byte-identisch).
- **Erledigt:** Sync 09/2026 in stadtpfad-pwa@f6e2277, beide Kopien byte-identisch

---

### [x] R1 — planProgressUpdate entfernt bei Row-Ergänzung + Phasen-Abschluss die falschen Zeilen (Stale-Span) — 🟡
- **Ort:** `packages/core/src/mutations.ts:279-331` (`editProgress`: Tabellen-Zeile wird eingefügt, danach `removeSpan` mit dem unveränderten `block.span`)
- **Problem:** Ist der Step nicht in der Tabelle (Zeile wird ergänzt) und schließt mit demselben Call die Phase ab (`completedPhase`), verschiebt das Einfügen alle Folgezeilen um +1 — `removeSpan` löscht dann in einem PROGRESS.md, dessen Tabelle **vor** den Detail-Blöcken steht, eine Zeile über dem Block an und lässt die letzte Block-Zeile als Fragment zurück. Reproduziert (Layout Tabelle-first); die Verifikation (`applyProgressPlan`) meldet trotzdem `ok`, da das Fragment nicht mehr als Phase geparst wird. Fixture-/Referenz-Projekte (Blöcke zuerst) sind nicht betroffen — daher 🟡, nicht 🔴.
- **Fix:** Entfernen des Blocks vor dem Row-Einfügen durchführen (bottom-up) oder `span` um die eingefügte Zeilenzahl verschieben; Edge-Case-Test „fehlende Tabellen-Zeile + Phasen-Abschluss" in beiden Layouts.
- **Abnahme:** Test mit Tabelle-first-Layout: PROGRESS.md bleibt nach Apply konsistent (kein Fragment, keine verschobenen Löschungen), Verifikation `ok`.
- **Erledigt:** Fix `36e89c2` — Block-Entfernung vor Row-Edit, Scope-Name-Extraktion bereinigt; Regressionstests beide Layouts grün

---

### [x] R2 — Locale-Synonyme in sechs Regexes hartkodiert statt aus profile.ts abgeleitet — 🟡
- **Ort:** `packages/core/src/backlog.ts:19-20` (Ort/Location, erledigt/done), `packages/core/src/archive.ts:5` (Erledigt/Done), `packages/core/src/mutations.ts:62` (Erledigt-Index/Done Index), `packages/core/src/progress.ts:18` (abgeschlossen/completed), `packages/core/src/validate.ts:8-9` (Stand:/As of: u. a.)
- **Problem:** Decision 5/4.1 verspricht „neue Sprache = neuer Schlüssel je Rolle" in `SYNONYMS` — die genannten Regexes umgehen `allSynonyms()`/`synonymPattern()` und müssen bei jeder neuen Locale mitgezogen werden, sonst werden generierte Marker (Erledigt-Index-Zeile, doneLine, Phasen-Abschluss) nicht mehr zurückgelesen und `docs_validate` meldet Schein-Funde (INDEX_WITHOUT_ARCHIVE o. Ä.).
- **Fix:** Regexes aus `synonymPattern()`/`allSynonyms()` bauen (Muster wie `progressHeading` in `progress.ts:102`).
- **Abnahme:** `npm run typecheck && npm run test` grün; keine Verhaltensänderung für de/en (Union-Matching identisch).
- **Erledigt:** Fix `2a0fcdb` — sechs Regexes aus allSynonyms()/synonymPattern() abgeleitet; Suite unverändert grün

---

### [x] R3 — CRLF-Projekte: angehängte Archiv-Blöcke bekommen gemischte Zeilenenden — 🟢
- **Ort:** `packages/core/src/mutations.ts:130-140` (`appendToArchive`: `item.raw.split(eol)`) und `packages/core/src/mutations.ts:346-354` (`block.raw.split(eol)`)
- **Problem:** Der Parser normalisiert `raw` auf `\n` (`backlog.ts:171`); `split("\r\n")` teilt diesen String nicht — bei Projekten mit CRLF (Windows-Checkout ohne `.gitattributes`) bleibt der angehängte „verbatim"-Block LF-only im CRLF-File. Parst weiter, Verifikation `ok`, aber git/editors sehen gemischte EOLs. Reproduziert.
- **Fix:** `raw` mit `/\r?\n/` splitten und mit detektiertem `eol` joinen.
- **Abnahme:** Test: CRLF-Fixture durch `archive_item`/`progress_update` (Phasen-Abschluss) → Archiv-Datei hat durchgängig CRLF.
- **Erledigt:** Fix `f057966` — raw mit /\\r?\\n/ splitten, mit detektiertem EOL joinen; CRLF-Roundtrip-Tests grün

---

### [x] R4 — Apply schreibt Pläne ohne Stale-Check gegen den aktuellen Dateistand — 🟢
- **Ort:** `packages/core/src/mutations.ts:158-191` (`applyArchivePlan`) und `:361-404` (`applyProgressPlan`)
- **Problem:** `apply*` schreibt `change.after` bedingungslos; `change.before` wird nicht mit dem aktuellen Disk-Stand verglichen. Im MCP-/CLI-Pfad (plan+apply synchron) ist das Fenster klein, aber Core-Konsumenten, die einen `dryRun: false`-Plan halten und später anwenden, überschreiben zwischenzeitliche Edits. Die Post-Write-Verifikation prüft nur die eigene ID/Step, nicht Integrität.
- **Fix:** Vor dem Schreiben je Change: aktueller Inhalt === `change.before`, sonst mit klarer Fehlermeldung abbrechen (Neu-Planung erzwingen).
- **Abnahme:** Test: Plan erstellen, Datei ändern, Apply → Fehler statt Überschreiben.
- **Erledigt:** Fix `fd38724` — assertFreshChanges vergleicht change.before mit Disk-Stand; Stale-Tests rot→grün

---

### [x] R5 — Keine Tests für die Mutation-Edge-Paths aus R1/R3 — 🔵
- **Ort:** `packages/core/tests/mutations.test.ts`
- **Problem:** Ungedeckt: (a) `planProgressUpdate` mit fehlender Tabellen-Zeile + gleichzeitigem Phasen-Abschluss (deckt R1, beide Layouts), (b) CRLF-Roundtrip bei `archive_item`/Phasen-Abschluss (deckt R3), (c) Apply nach zwischenzeitlicher Datei-Änderung (deckt R4).
- **Fix:** Test-first zu R1–R4 ergänzen; Layout-Variante „Tabelle vor Blöcken" als Fixture ableiten.
- **Abnahme:** R1 fällt vor dem Fix rot; nach den Fixes alle grün.
- **Erledigt:** Tests in `36e89c2`/`f057966`/`fd38724` — R1/R3/R4-Edge-Paths abgedeckt, Fixture project-d-tablefirst ergänzt

---

### [x] R6 — docs_validate prüft keine doppelten Step-Nummern in der Fortschrittstabelle — 🟢
- **Ort:** `packages/core/src/validate.ts:58-73` (nur `ID_DUPLICATE` für BACKLOG-IDs)
- **Problem:** Doppelte Step-Nummern in der Tabelle werden nicht gemeldet; `progress_update` aktualisiert bei Dubletten nur die erste Zeile (`findIndex`), die zweite bleibt dauerhaft stale — analog zu `ID_DUPLICATE`, nur ohne Prüfung.
- **Fix:** `STEP_DUPLICATE`-Finding in `docs_validate` (Folgezeilen ab zweitem Vorkommen).
- **Abnahme:** Fixture mit doppelter Step-Zeile → Finding; `npm run test` grün.
- **Erledigt:** Fix `3000192` — STEP_DUPLICATE-Finding ab zweitem Vorkommen, mit Zeilennummer

---

### [x] T3 — CLI: Emoji-Prios und Status-Icons über ASCII-Aliase parametrisierbar machen — 🟡
- **Ort:** `packages/mcp/src/cli.ts:50,53,312-315` (`--priority`/`--status` validieren nur Literal-Emojis), Abbildung idealerweise zentral in `packages/core` (neben `profile.ts`)
- **Problem:** `progress-update --status` akzeptiert nur `⬜/🔄/✅/⛔`, `--priority` nur `🔴/🟠/🟡/🟢/🔵` — Zeichen, die auf gängigen Tastaturen nicht direkt tippar sind (Cop-and-Paste nötig, in Shell-History/Scripts fehleranfällig). Die CLI ist damit für Menschen praktisch unbenutzbar ohne Copy-Paste; Alias-Serien der ID-Konvention (`K/H/M/L`) liegen nahe, werden aber nicht als Werte akzeptiert.
- **Fix:** ASCII-Aliase je Wert definieren und in einer zentralen Map (core, exports) pflegen, z. B. Prio: `red|orange|yellow|green|blue` **oder** `kritisch|hoch|mittel|niedrig|test` **oder** `p1…p5`; Status: `open|running|done|blocked` (ggf. `wip`); CLI normalisiert Input → internes Emoji, Fehlermeldung listet erlaubte Aliase; MCP-Schema unverändert lassen (Agenten emittieren Emojis zuverlässig), Ausgabe/Help zeigt beide Formen.
- **Abnahme:** Test-first: `progress-update --status running --apply` erzeugt `🔄`-Zeile; `backlog-list --priority red,yellow` filtert korrekt; ungültiger Alias → Usage-Fehler mit Alias-Liste; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `09d18d8` — core aliases.ts (resolvePriority/resolveStatus + Help-Listen), CLI normalisiert Input, MCP-Schema unverändert

---

### [x] T2 — Titel-/Scope-Edits an der Fortschrittstabelle als Tool — 🟡
- **Ort:** `packages/core/src/mutations.ts` (Erweiterung `planProgressUpdate` oder neues `progress_rename`), `packages/mcp`, `packages/core/tests/mutations.test.ts`
- **Problem:** `progress_update` deckt nur Status, Row-Ergänzung, Detail-Block-Skelett und Phasen-Archivierung ab — Step-/Phasen-Titel in der Tabelle und die Überschrift der Detail-Blöcke („Laufende Phasen") lassen sich nur per direktem Edit ändern. Das ist Grenzfall zwischen Prosa und Struktur: beide Stellen (Tabellen-Zeile, Block-Heading) werden vom Parser gematcht (`progress.ts`), ein inkonsistenter manueller Edit trennt Tabelle und Detail-Block (z. B. `progress_show`/`progress_update` finden die Phase nicht mehr bzw. doppelt).
- **Fix:** Optionaler `title`-Parameter an `progress_update` (oder separates Tool), der Tabelle **und** Detail-Block-Heading konsistent setzt — im Plan/Dry-run-Modell, mit Span-Neuberechnung und Kopfzeilen-Zeitstempel; Verhalten bei geplantem Phasen-Abschluss im selben Call definieren (Reihenfolge!).
- **Abnahme:** Test-first: Titel-Änderung → Tabelle + Detail-Block konsistent, `progress_show` findet Phase unter neuem Titel; Nachbar-Zeilen/Blöcke byte-identisch; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `1912854` — optionaler title-Parameter: Rename zeilenzahlneutral, Reihenfolge bei Phasen-Abschluss definiert (Rename → Archiv), MCP + CLI angebunden

---

### [x] T1 — CRUD-Tools für Backlog-Items ergänzen (Create/Update/Remove) — 🟡
- **Ort:** `packages/core/src/mutations.ts` (Plan/Apply-Funktionen neben `planArchiveItem`), `packages/mcp` (Tool-Exposition), `packages/core/tests/mutations.test.ts`
- **Problem:** Es existieren nur Read (`backlog_list/show`) und Struktur-Write (`archive_item`, `progress_update`) — Anlegen, Ändern und Entfernen offener Items fehlen. Agenten legen Items deshalb per direktem Edit an und müssen Formatregeln von Hand nachahmen (ID-Serie, Emoji-Prio, Sektions-Kopfregeln, `JJMMDD/HHMM`-Zeitstempel); der Review-Workflow 09/2026 (R1–R6) hat die Lücke praktisch demonstriert. Fehlgeschlagene Nachahmung erzeugt Parse-Warnungen bzw. Drift.
- **Fix:** `backlog_add` / `backlog_update` / `backlog_remove` im Plan/Dry-run-Modell: ID-Vergabe mit Serien-Konventionsprüfung (`^[A-Z][0-9]+$`, K/H/M/L = Prio-Serien), Sektions-Pflege inkl. Verschieben zwischen Prioritäts-Sektionen bei Update, Zeitstempel-Aktualisierung der Kopfzeile, Span-Neuberechnung; `remove` **kein** Hard-Delete — Kopfregel („Fundstellen nicht löschen") verlangt verbatim-Verschub ins Archiv (analog `archive_item`, aber ohne Erledigt-Marker im Index); MCP-Exposition wie bei `archive_item`.
- **Abnahme:** Test-first je Operation: Fixture → plan → apply → neu parsen (Nachbar-Items byte-identisch erhalten); Update über Sektionsgrenze; `remove` landet im Archiv; `npm run typecheck && npm run test` grün; Archive bleiben sonst unangetastet (append-only).
- **Erledigt:** Fix `0c4724a` — planBacklogAdd/Update/Remove + Apply-Verifikation, Serien-ID-Vergabe, Sektionswechsel, Stand:-Refresh, Archiv-Verschub ohne Erledigt-Marker; MCP backlog_add/update/remove

---

### [x] T4 — Phasen-Planung als Tool-Operation (Phase anlegen mit Steps) — 🟡
- **Ort:** `packages/core/src/mutations.ts:247-262` (`planProgressUpdate`: neue Phase nur mit 🔄, Folgesteps ohne Scope-Eintrag → Fehler), `packages/mcp`
- **Problem:** Eine neue Phase lässt sich nicht vorausplanen: `planProgressUpdate` lehnt ⬜ für eine neue Phase ab („nur 🔄-Phasen können neu angelegt werden"), generiert Placeholder-Namen (`| 6.1 | 6.1 |`) und verwirft Folgesteps, die nicht im Skelett-Scope stehen. Konsequenz: Phase 6 (Plan-Update 09/2026) musste per direktem Edit in die Tabelle — genau die Struktur-Operation, die LESSONS 17 eigentlich dem Tool zuordnen will. Der direkte Edit ist dokumentiert als unvermeidlicher Workaround.
- **Fix:** `progress_plan_phase` (oder `planPhase` in core): legt Tabelle-Zeilen für alle Steps mit Namen + ⬜ an und optional Detail-Block-Skelett mit vollständigem Scope; Integration in `progress_update` (erste 🔄-Step übernimmt bestehenden Scope statt neuem Skeleton); Validierung: Step-Nummern-Präfix passt zum Phasen-Namen.
- **Abnahme:** Test-first: neue Phase mit 3 Steps planen → apply → Tabelle + Skeleton konsistent, `progress_update` auf Folgesteps ohne Workaround möglich; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `9fea4bc` — planPhase/applyPhasePlan + MCP progress_plan_phase: Tabellen-Zeilen ⬜, Skeleton mit vollem Scope, Prefix-Validierung; PLAN_WITHOUT_WIP bis zum ersten 🔄 definiert

---

### [x] D1 — CI-Workflow einrichten (typecheck + test + validate) — 🟡
- **Ort:** `.github/workflows/` (fehlt bislang)
- **Problem:** Suite und `docs_validate` laufen nur lokal — Regressionen und Drift-Funde landen erst beim nächsten lokalen Lauf. **Einwand 09/2026: CI muss optional bleiben** — für kleinere Projekte ist eine Pipeline Kanonen auf Spatzen; PLAYBOOK §5 (lokale Verifikation) bleibt der Pflichtteil.
- **Fix:** GitHub Actions-Workflow in **diesem** Repo als freiwillig übernehmbares Template (`npm install` → `typecheck` → `test` → `validate --root .`, Exit 1 bei Funden); Test-Report maschinenlesbar (Vitest JUnit-Reporter) und Coverage-Report im Workflow-Artefakt; README-Abschnitt „CI (optional)" mit Copy-Vorlage und Hinweis, dass der lokale Lauf für kleine Projekte genügt. Kein Methoden- und kein Tool-Zwang.
- **Abnahme:** Workflow läuft grün auf push/PR; JUnit-Report wird erzeugt; README kennzeichnet CI explizit als optional; weder PLAYBOOK noch Tools machen CI zur Pflicht.
- **Paketierung:** Step 7.1 in Phase 7 (Distribution & Feldtest).
- **Erledigt:** Fix `df55385` — ci.yml als optional Template (push/PR), JUnit + Coverage im Artefakt, validate-Schritt mit Exit 1; @vitest/coverage-v8 als devDep; README-Abschnitt „CI (optional)"

---

### [x] D2 — Feldtest gegen stadtpfad-pwa (Realformat) — 🟡
- **Ort:** `../stadtpfad-pwa` (BACKLOG.md, PROGRESS.md, docs/archive/*) — Realformat-Referenz, **nur lesen, nie verändern**.
- **Problem:** Die Tools sind nie gegen ein echtes STEPWELL-Projekt außerhalb der Fixtures gelaufen; Realformat-Abweichungen (Layout, Serien, Kopfregeln, Erledigt-Index-Formate) würden als ungeparste Drift durchrutschen.
- **Fix:** Alle Read-Tools (`docs_status`, `backlog_list/show`, `progress_list/show`, `docs_validate`) plus CLI-Kommandos gegen das Geschwister-Repo laufen lassen; Protokoll je Tool; jede Anomalie → eigenes BACKLOG-Item mit Fundstelle + Abnahmekriterium.
- **Abnahme:** Protokoll je Tool existiert; Anomalien sind als Items erfasst; stadtpfad-pwa bleibt byte-identisch.
- **Paketierung:** Step 7.2 in Phase 7.
- **Erledigt:** Feldtest `260908` — Protokoll `docs/feldtest-stadtpfad-pwa.md`; Tools crash-frei am Realprojekt; Funde als W1 (Index-Tabelle) und W2 (Archiv-Warnungen) wurzelt; stadtpfad-pwa byte-identisch

---

### [x] D3 — Publishing-Pack-Check (npm pack, bin, README-Install) — 🟢
- **Ort:** `packages/*/package.json` (keine `files`-Felder), `README.md` (Installations-Abschnitt)
- **Problem:** README verspricht `npx method-docs`; ohne `files`-Felder würde `npm pack` Tests und Fixtures mit ausliefern; der bin-Shim (`.ts`-Entry, Shebang) ist nie real ausgeführt worden; scoped (`@method-docs/mcp`) vs. unscoped Name ist ungeklärt.
- **Fix:** `files`-Felder setzen, `npm pack` Dry-run je Workspace prüfen, bin lokal ausführen (`method-docs status --root .`), README-Installations-Abschnitt korrigieren.
- **Abnahme:** Pack-Inhalt nur Source (keine tests/fixtures), bin funktioniert lokal, Doku stimmt mit dem Package überein.
- **Paketierung:** Step 7.3 in Phase 7.
- **Erledigt:** Fix `f8a87b7` — files: [\"src\"] in beiden Workspaces, npm pack nur Source (17,8/8,6 kB), Bin lokal verifiziert, README-Install korrigiert (npx @method-docs/mcp)

---

### [x] W1 — Erledigt-Index im Tabellenformat parsen (Feldtest stadtpfad-pwa) — 🟡
- **Ort:** `packages/core/src/backlog.ts` (`DONE_LINE`-Regex, nur Bullet-Format) + `docs/archive/BACKLOG_ARCHIVE.md`-Parsing (`doneLine` 0/52 im Realprojekt); Protokoll: `docs/feldtest-stadtpfad-pwa.md`
- **Problem:** stadtpfad-pwa pflegt den Erledigt-Index als Tabelle (`| Serie | Item (kurz) | Commit/Phase |`) — der Parser erkennt nur `- ID — Titel — erledigt …`. Folge im Feldtest: 54× `ARCHIVE_WITHOUT_INDEX` (K1–D1), `validate` Exit 1 am Referenzprojekt; der Index **existiert** aber — die Findung ist faktisch ein Falsch-Positiv.
- **Fix:** Entscheidung zwei Ebenen: (a) **Tool:** Index-Tabelle als tolerierte Variante parsen (Union-Matching, `doneIndex` füllen, Spalten `Item` → ID+Titel, `Commit/Phase` → sha). (b) **Methode:** klären, ob die Tabelle eine kanonische Index-Variante ist (PLAYBOOK §3 sagt „Einzeiler") — wenn ja, in D4-Sync aufnehmen; wenn nein, stadtpfad migriert beim nächsten natürlichen Edit.
- **Abnahme:** `docs_validate` auf stadtpfad-pwa meldet keine `ARCHIVE_WITHOUT_INDEX`-Funde mehr (bei Variante a) bzw. nach Migration (Variante b); Suite mit neuem Fixture-Fall grün.
- **Paketierung:** Kandidat nächstes Packaging.
- **Erledigt:** Fix `9e9d334` (Test-Commit `55773ae` vorab, Suite 5× ROT belegt) — Tabellen-Index als tolerierte Variante geparst (Union, Header-Skip, Item→ID+Titel, Commit/Phase→sha, 2-Spalten-Toleranz); Fixture project-e-tableindex; Realprojekt: 54→13 `ARCHIVE_WITHOUT_INDEX` — Rest = ehrliche Funde an Kompakt-Zeilen (L1–L11-Range, R1-A/B-Sammelzeile), Klärung kanonisch ja/nein in D4 (8.4-Sync) nachgetragen

---

### [x] W2 — Archiv-Parse-Warnungen nicht als offene Befunde melden — 🟡
- **Ort:** `packages/core/src/validate.ts` (Warn-Sammel-Block: alle vier Dateien inkl. Archive) + `status.ts`; Protokoll: `docs/feldtest-stadtpfad-pwa.md`
- **Problem:** Parse-Warnungen der **Archiv-Dateien** (~50× `PRIO_MISSING`, 4× `BLOCK_UNSTRUCTURED` bei stadtpfad-pwa) fluten `docs_validate`/`docs_status` und übertönen die offenen Befunde — das kontert den Grundsatz „Archive werden nie beanstandet" (PLAYBOOK §3, Migration bindend: Konventions-Warnungen nur offene Dateien).
- **Fix:** Parse-Warnungen aus `BACKLOG_ARCHIVE.md`/`PROGRESS_ARCHIVE.md` unterdrücken (wie `ID_CONVENTION`/`DATE_LEGACY` schon) **oder** mit deutlichem Code-Präfix (`ARCHIVE_…`) kennzeichnen und in `docs_status` standardmäßig ausblenden — Entscheidung bei Umsetzung, test-first.
- **Abnahme:** `docs_status` auf stadtpfad-pwa meldet keine Warnungen aus Archiv-Dateien mehr (bzw. nur noch gekennzeichnet); Fixtures-Suite unverändert grün.
- **Paketierung:** Kandidat nächstes Packaging.
- **Erledigt:** Fix `3d224bf` (Test-Commit `69fe002`, 5× ROT belegt) — Aggregation in validate.ts sammelt Parse-Warnungen nur noch aus offenen Dateien; Konsistenz-Funde auf Archiv-Dateien (ARCHIVE_WITHOUT_INDEX) bleiben. Drift-Fall D16 (Z8) als Fixture; Realprojekt: Archiv-Warnungen 55→0

---

### [x] D5 — Tool-Lücke: Step zu laufender Phase ergänzen — 🟡
- **Ort:** `packages/core/src/mutations.ts` (`planPhase` lehnt existierende Phase ab; `planProgressUpdate` wirft „unknown step", wenn der Step weder in Tabelle noch Scope steht)
- **Problem:** Die Scope-Erweiterung einer **laufenden** Phase (z. B. +1 Step) ist nur per Hand-Edit an Tabellen-Zeile und Scope-Bullet möglich — genau die Struktur-Edits, die LESSONS 17 dem Tool zuordnen will. Aufgedeckt bei der Phase-7-Paketierung (PLAYBOOK-Sync wollte als 7.4 rein).
- **Fix:** `progress_plan_phase` für existierende Phasen öffnen oder Zusatz-Modus: fehlende Tabellen-Zeile + Scope-Bullet in bestehender Phase ergänzen (Step-Präfix-Validierung, Dry-run-Modell), test-first.
- **Abnahme:** Laufende Phase wird ohne Hand-Edit um einen Step erweitert; Nachbar-Zeilen byte-identisch; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `14b9e3a` (Test-Commit `15d867e`, 2× ROT belegt) — planPhase im Erweiterungs-Modus geöffnet: existierende laufende Phase bekommt fehlende Tabellen-Zeilen + Scope-Bullets (Einfügepunkt = letzter Scope-Bullet, Nachbar-Zeilen byte-identisch, reine Einfügung per Test belegt); Guards: Step bereits in Tabelle oder Scope → Fehler, archivierte Phase bleibt gesperrt; MCP-Beschreibung + Fixture-Spec (D5/8.3) nachgezogen

---

### [x] D4 — PLAYBOOK ergänzen: Backlog-Wurzel + Inline-Fix-Lane (alle Kopien) — 🟡
- **Ort:** `docs/PLAYBOOK.md` §0/§2/§4/§6 — **in allen Kopien simultan** (method-docs, stadtpfad-pwa; Kopfregel der Methode).
- **Problem:** Decision 14 (AGENTS.md) definiert Backlog-Wurzel + Inline-Fix-Lane nur projektlokal — die Methode selbst sagt es nicht. Hinzu kommen die Guardrail-Funde G1 (Risk-Matrix-Gates) und G2 (beweisbare RED-Phase), ebenfalls nur diskutiert, nicht methodisch verankert.
- **Fix:** Bündel in einem Sync-Schlag ergänzen: (1) **Backlog-Wurzel:** Jeder Step einer Phase ist aus mindestens einem offenen BACKLOG-Item abgeleitet (Verweis Item → Step wird je Item dokumentiert). (2) **Inline-Fix-Lane:** im freigegebenen laufenden Step entdeckte Bugs (im Code-Scope, ≤ ~10 Zeilen, keine Design-Entscheidung) dürfen sofort gefixt werden; Pflicht: retro `backlog_add` (Serie `F`) + sofortiges `archive_item` mit Commit-Hash. (3) **Risk-Matrix-Gates (G1):** Content-basierte Stufen Niedrig/Mittel/Hoch mit Freigabe-Pflicht. (4) **RED-Nachweis (G2):** `test(scope):`-Commit vor `feat(scope):`-Commit, Failure-Beleg in Step-Notiz.
- **W1-Nachtrag (8.1):** Erledigt-Index-Tabelle wird als tolerierte Index-Variante geparst (Union neben dem Bullet-Einzeiler). Offene Klärung für diesen Sync: (a) ist die Tabelle kanonische PLAYBOOK-§3-Variante? (b) sind Kompakt-Zeilen (Range `L1–L11`, Sammelzeile `R1 … + R1-A …`) zulässig oder Fund? Realprojekt-Stand: 13 ehrliche `ARCHIVE_WITHOUT_INDEX`-Funde genau an diesen Kompakt-Zeilen.
- **Abnahme:** Beide PLAYBOOK-Kopien textgleich ergänzt, deckungsgleich mit AGENTS Decisions 13/14 und den Items G1/G2; `docs_validate` beider Projekte clean.
- **Bemerkung:** Als Step 7.4 paketierbar, sobald D5 (Step-Ergänzung als Tool) umgesetzt ist — sonst Mikro-Paketierung nach Phase 7.
- **Erledigt:** Sync-Schlag 09/2026 in beiden PLAYBOOK-Kopien textgleich (method-docs@abb6dcf, stadtpfad-pwa@08d2613): Backlog-Wurzel (§0.3) + Inline-Fix-Lane (§0.6) methodisch verankert; W1-Klärung als §3 „Erledigt-Index-Formate" (Tabelle = tolerierte Lesvariante, Kompakt-Zeilen = Fund); AGENTS D13-Referenz §0.4, D14 verankert-vermerkt + Decision 15 (Risiko-Matrix) ergänzt; docs_validate method-docs clean

---

### [x] G1 — Content-basierte Approval-Gates (Risiko-Matrix) ergänzen — 🟡
- **Ort:** AGENTS.md Decision 13 (Freigabe-Gate ist **zeitlich** — vor Phasenstart —, nicht **inhaltlich**); Fundstelle: Best-Practices-Doku 09/2026, Abschnitt „Universal Approval Gates (Risk Matrix)".
- **Problem:** Innerhalb eines freigegebenen Steps wären riskante Datei-Operationen ohne erneute Freigabe möglich: Dependency-Manifeste ändern, Tests löschen, Workflows/`.env` anfassen, Migrationen — die Inline-Fix-Lane (Decision 14) begrenzt Größe, aber nicht die **Dateiklasse**.
- **Fix:** Risiko-Matrix als Decision (später via D4 in PLAYBOOK): **Niedrig** — Source/Test-Edits im Step-Scope → autonom; **Mittel** — Dependency-Manifeste/Dockerfiles → anhalten, Freigabe je Vorkommnis; **Hoch** — `.env`, CI-Workflows, Löschen existierender Tests, Migrationen → explizites menschliches Gate. Inline-Fix-Lane erbt ausschließlich Niedrig.
- **Abnahme:** Matrix ist als Decision verankert und in Decision 14 referenziert; PLAYBOOK-Sync textgleich über D4; jeder Gate-Fall ist in einem Satz entscheidbar (welche Dateiklasse, welche Stufe).
- **Paketierung:** Kandidat nächstes Packaging (mit D4/D5).
- **Erledigt:** Fix `abb6dcf` — Risiko-Matrix als AGENTS Decision 15 verankert, in Decision 13/14 referenziert; PLAYBOOK §0.5 (Content-Gates) textgleich in beiden Kopien (stadtpfad-pwa@08d2613)

---

### [x] G2 — RED-Phase beweisbar machen (test-first auditierbar) — 🟡
- **Ort:** PLAYBOOK §4 (Commit-Diskiplin) / §6 (Test-First) — Praxis in diesem Repo; Fundstelle: Best-Practices-Doku 09/2026, Abschnitt „sprachunabhängige TDD-Schleife".
- **Problem:** Test-First ist Ehrenkodex: ROT wird nur behauptet (Augenschein im Chat), nicht nachgewiesen. Weil Test + Implementierung in **einem** Commit landen (z. B. Phase 6, `36e89c2`), ist die RED-Phase nachträglich unauditierbar — ein Tautologie-Test wäre nicht erkennbar.
- **Fix:** Commit-Konvention: neuer Test zuerst im eigenen `test(scope): …`-Commit (Suite ist ROT; das Failure-Log belegt den Befund in der Commit-Message bzw. Step-Notiz), danach `feat(scope): …` mit der Implementierung. PLAYBOOK-Sync über D4.
- **Abnahme:** Konvention steht in PLAYBOOK §4/§6 (beide Kopien, via D4); im ersten Code-Step danach ist die Kette test-Commit → feat-Commit im Log sichtbar.
- **Paketierung:** Kandidat nächstes Packaging (mit D4/D5).
- **Erledigt:** Fix `abb6dcf` — Commit-Konvention in PLAYBOOK §4 + §6 („ROT wird belegt, nicht behauptet") beider Kopien (stadtpfad-pwa@08d2613); Kette test-Commit → feat-Commit seit 8.1–8.3 im Log sichtbar (55773ae→9e9d334, 69fe002→3d224bf, 15d867e→14b9e3a)

---

### [x] A1 — PLAYBOOK ergänzen: Adoptions-Modell für Bestandsprojekte — 🟡
- **Ort:** `docs/PLAYBOOK.md` — neuer Abschnitt „Adoption Bestandsprojekte" (bei §3); **in allen Kopien simultan** (gemeinsamer Sync-Schlag mit D4/G3); Fundstelle: Session-Diskussion 09/2026 („Greenfield ist einfach — wie Gray/Brownfield?").
- **Problem:** PLAYBOOK §3 regelt nur Format-Migration *innerhalb* bestehender STEPWELL-Projekte; die Einführung in Projekten ohne die vier Dateien ist undefiniert. stadtpfad-pwa war Brownfield, ohne dass das Modell dokumentiert wäre; der Feldtest (W1/W2) zeigt den Adoptions-Report-Charakter der Validate-Funde.
- **Fix (Regelwerk):** (1) **Adoption = Snapshot:** Vier Dateien beim Adoptions-Commit mit IST-Zustand anlegen; BACKLOG nur bekannte offene Punkte; Erledigt-Index/Archive leer; PROGRESS-Tabelle mit genau einer Zeile `0.1 STEPWELL-Adoption (Baseline <sha>)` ✅ — keine rückwirkende Historie, nie. (2) **Budget-Inventar:** ein zeitgeboxter Inventar-Step (Kopf-Wissen, TODO-/FIXME-Scan, Issue-Import → Items); danach entsteht BACKLOG-Wissen nur in Arbeit (Fund → Item). (3) **Verifikationsstufen, deklariert in der PROGRESS-Kopfzeile:** Stufe 0 = kein automatisierter Test (Verifikation als Prüfprotokoll in der Step-Notiz; neue Kernlogik bringt ihren Test mit) · Stufe 1 = Characterization-/Golden-Master-Tests (dürfen grün sein — Beobachtung vor Spezifikation) · Stufe 2 = volles ROT→GRÜN; Stufenwechsel = Commit. (4) **Strangler:** Standards gelten für neue Arbeit und angefasste Zonen; keine Sanierungsphase.
- **Abnahme:** Beide PLAYBOOK-Kopien textgleich ergänzt; ein fiktiver Adoptions-Durchlauf ist allein anhand des Textes ohne Rückfragen nachvollziehbar; `docs_validate` beider Projekte clean.
- **Bemerkung:** Bewusst **ohne Tool-Teil** (KISS) — Scaffolding erst bei einem echten Adoptlings-Projekt; Deklarationsort ist die PROGRESS-Kopfzeile (Entscheid 09/2026).
- **Erledigt:** Fix `abb6dcf` — PLAYBOOK §3 „Adoption Bestandsprojekte" (Snapshot, Budget-Inventar, Verifikationsstufen 0–2 in der PROGRESS-Kopfzeile, Strangler) textgleich in beiden Kopien (stadtpfad-pwa@08d2613); bewusst ohne Tool-Teil (KISS)

---

### [x] G3 — PLAYBOOK ergänzen: Smell-Budget als optionales Qualitäts-Gate — 🟡
- **Ort:** `docs/PLAYBOOK.md` §5 (Verifikation) — dritte **optionale** Säule; **in allen Kopien simultan** (gemeinsamer Sync-Schlag mit D4/A1); Fundstelle: Session-Diskussion 09/2026 („Code-Smells als Quality Gate").
- **Problem:** Smells sind heuristisch, Gates müssen binär — ein fuzzy Gate würde die Determinismus-Prämisse des Freigabe-Gates (Decision 13) untergraben. Gleichzeitig fehlt der objektive Kern der Smell-Lehre (Datei-/Funktionslänge, Komplexität, Duplikation, Lint-Regeln) als Schutz gegen Struktur-Erosion, besonders bei agentisch erzeugtem Code („funktionsfähig, aber Struktur zerstört").
- **Fix (drei Rollen):** (1) **Weiche Smells** (Feature Envy, Gott-Konzept, Namensgebung) = Funde → BACKLOG-Items (Decision-14-Weg), nie Gates. (2) **Harte Smells = Delta-Budget:** ein Step darf die Smell-Last seiner angefassten Dateien nicht erhöhen; deklariert als einfache Schwellen-/„keine Verschlechterung"-Regel in der PROGRESS-Kopfzeile (Verifikationszeile, gem. A1); Absolut-Schwellen nur in Greenfield ab Tag 1; Schwellen aktualisiert nur sinkend, beim natürlichen Anlass. (3) **Delta-Report = Freigabe-Kontext**, nie Sperre; das Gate bleibt binär (Budget eingehalten ja/nein, lokal oder CI prüfbar).
- **Abnahme:** Regel steht in PLAYBOOK §5 beider Kopien; explizite Optionalität verankert (wer nichts deklariert, hat kein Budget — Kanonen-auf-Spatzen-Schutz wie bei CI/D1).
- **Bemerkung:** KISS — kein Ratchet-JSON, kein Budget-Tool; Enforcement über lokale Befehle bzw. optional CI. Tool-Unterstützung (Ratchet-Prüfung) ist Kandidat für ein separates W-Item, falls Bedarf entsteht.
- **Erledigt:** Fix `abb6dcf` — Smell-Budget als optionale dritte Säule in PLAYBOOK §5 beider Kopien (stadtpfad-pwa@08d2613): weiche Smells = Funde→Items, harte Smells = Delta-Budget in der PROGRESS-Kopfzeile, Delta-Report = Freigabe-Kontext; explizite Optionalität verankert (keine Deklaration → kein Budget)

---

### [x] T6 — Coverage-Schwellen in Vitest-Config + CI-Gate — 🔵
- **Ort:** Vitest-Konfiguration (Root/Workspaces) + `.github/workflows/ci.yml`; Fundstelle: D1 (Coverage-Artefakt vorhanden, kein Gate); Conductor-Workflow („>80 %"-Quality-Gate als Vorbild).
- **Problem:** `@vitest/coverage-v8` erzeugt Artefakte, aber ohne `thresholds` kann die Abdeckung lautlos sinken — PLAYBOOK §6 erzwingt Test-First, misst aber nicht, dass die Suite vollständig bleibt.
- **Fix:** `thresholds` in der Vitest-Config setzen (Zahlen im Step festlegen, Vorschlag: core statements/lines 90, branches 85 · mcp 85/80); CI scheitert bei Unterschreitung; Ausschlüsse nur für Boilerplate (types-only), dokumentiert.
- **Abnahme:** Gate aktiv und belegt (künstlicher Coverage-Abfall → CI rot); Suite inkl. Thresholds grün.
- **Erledigt:** 9.1: vitest.config.ts-Thresholds (core 90/85/95/90, mcp 85/78/90/85 per-glob), exclude types-only + barrels + stdio-Bootstrap; CI-Aktivierung via bestehendes --coverage in .github/workflows/ci.yml (Phase 7.1).

---

### [x] M2 — MCP-Tool-Annotations ergänzen (readOnly/destructive/idempotent) — 🟡
- **Ort:** `packages/mcp/src/tools.ts` (alle registerTool-Aufrufe); Fundstelle: Tool-Vergleich mit MrLesk/Backlog.md 09/2026 (dort konsequente Annotations auf der gesamten MCP-Surface).
- **Problem:** Unsere Tools tragen nur `title`/`description` — die MCP-Annotations `readOnlyHint`/`destructiveHint`/`idempotentHint` fehlen; Clients können Sicherheits-Entscheidungen (Autonomie, Retry) nicht aus den Metadaten ableiten.
- **Fix:** Annotations je Tool nachfügen: readOnly für echo/docs_status/docs_validate/backlog_show/backlog_list/progress_list/progress_show; destruktiv für archive_item/backlog_remove; progress_update/backlog_add/backlog_update/progress_plan_phase als nicht-destruktiv mit dryRun-Default; Read-Tools zusätzlich idempotent. Test-first: Zuordnung über die registrierten Metadaten asserten.
- **Abnahme:** Alle Tools tragen vollständige Annotations; Metadaten-Test grün; `npm run typecheck && npm run test` grün.
- **Erledigt:** Commit f6fe0f1

---

### [x] M5 — Init-Fallback: klare Anleitung bei Root ohne STEPWELL-Projekt — 🟡
- **Ort:** `packages/core` (Parser/validate-Aggregation) + `packages/mcp` (Fehlerantworten); Vorbild: `backlog://init-required`-Fallback bei MrLesk/Backlog.md (klare Anleitung statt stummer Fehler).
- **Problem:** Tool-Calls gegen einen Root ohne PLAYBOOK-Projekt (alle vier Dateien fehlen) liefern eine Warn-/Fehler-Wüste pro Datei statt einem klaren Befund „hier ist kein STEPWELL-Projekt" mit Anleitung.
- **Fix:** Erkennung „kein Projekt" (alle vier Dateien fehlen) → genau ein Finding mit eigenem Code (z. B. `PROJECT_NOT_INITIALIZED`) + Anleitung (vier Dateien anlegen, PLAYBOOK-Referenz); Teilbestand (einzelne Datei fehlt) bleibt wie gehabt Einzel-Warnungen. Test-first über neues Fixture (leerer Ordner).
- **Abnahme:** Leeres Verzeichnis → genau ein Finding mit Anleitung; Teilbestand unverändert; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `a07f759` (Test-Commit `ebcfc44`, ROT belegt) — PROJECT_NOT_INITIALIZED: loadProject/readBacklog/readProgress werfen bei allen vier fehlenden Dateien den Fehler mit Anleitung; docsValidate → genau ein Finding (ok: false), docsStatus → Zero-Aggregate + Fund, MCP asResult → strukturierte { code, message, missing }-Fehlerantwort für alle Tools; Teilbestand bleibt harter Fehler pro Datei; Fixture project-empty, README + Fixture-Spec nachgezogen

---

### [x] M8 — Projekt-Init: Vorlagen-Auslieferung klären (Resources vs. init_project) — 🟡
- **Ort:** `packages/core` (kanonische Skeletons, von CLI + MCP geteilt) + `packages/mcp` (Resources oder neues Tool); Fundstelle: Google Conductor — `/conductor:setup` scaffolded die Kontext-Dateien (product.md, workflow.md, …); Lücke verwandt mit M5 (Init-Fallback liefert bisher nur Anleitung zum Selbst-Anlegen).
- **Problem:** Neuanlage eines STEPWELL-Projekts erfordert manuelles Nachbauen der vier Pflichtdateien (Kopfregeln, Legende, Prioritäts-Sektionen, Erledigt-Index) — Drift-Quelle ab Minute null; das Tool kann lesen/prüfen/schreiben, aber nicht aufsetzen.
- **Fix:** Entscheidung zwischen zwei Varianten: **A** Templates als Read-Only-Resources (`methoddocs://templates/backlog|progress|archive/…`), Agent legt Dateien selbst an (kein Write-Surface-Wachstum) — oder **B** `init_project`-Tool (scaffold nur wenn alle vier Dateien fehlen, sonst harter Fehler; Dry-run-Modell wie gehabt; M4-Guardrail-Begründung nötig). Skeletons kanonisch in `packages/core` ablegen, Abgleich mit Fixture `project-a` (Parser-Positivpfad); M5-Anleitung auf den neuen Weg verweisen.
- **Abnahme:** Entscheidung (inkl. Begründung) dokumentiert; gewählte Variante test-first umgesetzt (Resources bzw. Tool inkl. Guard-Fälle „Datei existiert bereits"); `docs_validate` an den geleerten Skeletons clean; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `fdf6907` (Test-Commit `f17573e`, ROT belegt) — Entscheidung Variante A (Templates als Read-Only-Resources, Begründung M4-Guardrail, im README dokumentiert): projectTemplates (4 Skeletons) kanonisch in core, Resource `methoddocs://templates/{kind}` mit Kind-Validierung; Skeleton-Projekt docs_validate-fund-frei; M5-Anleitung verweist auf Templates

---

### [x] M7 — SKILL.md als ergänzender Distributionsweg (stepwell-Skill) — 🟡
- **Ort:** Repo-Root/`packages/mcp` (neues Asset `skills/stepwell/SKILL.md`); Fundstelle: Google Conductor — verteilt die Methode als portable Markdown-Skills (Gemini CLI, Antigravity, Claude Code, Codex-Port), agent-übergreifend; passt zu Phase 7 „Distribution & Feldtest".
- **Problem:** Unser Vertriebsweg ist nur MCP (Server-Setup nötig); Agenten in Skill-Ökosystemen (SKILL.md-Format) bekommen keine Anleitung, WANN sie welches stepwell-Tool aufrufen — die Methoden-Disziplin lebt sonst nur in AGENTS.md-Kopien.
- **Fix:** Schlankes SKILL.md („wann rufe ich welches Tool auf": Statuspflege nur via Tools, Freigabe-Gate, Test-First) als zweiter Distributionskanal neben MCP; verweist auf die MCP-Tools, ersetzt sie nicht; Decisions 13/15 einpreisen.
- **Abnahme:** Skill-Datei liegt im npm-Pack (files-Check), Inhalt konsistent mit PLAYBOOK; README-Distributionsabschnitt nennt beide Kanäle.
- **Erledigt:** Fix `57ffc54` (2× ROT belegt) — packages/mcp/skills/stepwell/SKILL.md (Session-Einstieg, Tool-Zuordnung, Freigabe-/Content-Gates, Inline-Fix-Lane, Test-First, Abschlüsse; konsistent mit PLAYBOOK, ohne nicht existierende Parameter); files-Feld um "skills" erweitert (Pack-Check im packaging-Test); README-Abschnitt "Distribution (zwei Kanäle)"

---

### [x] M6 — JSON-Output-Kontrakt der CLI versionieren (schema-Feld + Doku) — 🟡
- **Ort:** `packages/mcp/src/cli.ts` (`--json`-Zweig gibt den Roh-Payload unverändert aus); Fundstelle: Backlog.md „stable, versioned JSON for scripts"; D1 (CI) nutzt den JSON-/Exit-1-Weg bereits — Versionierung ist die offene Lücke.
- **Problem:** Der `--json`-Output ist ein unversionierter Roh-Payload — Scripts/CI koppeln sich implizit an die aktuelle Feldstruktur; Kern-Änderungen brechen Verbraucher lautlos.
- **Fix:** JSON-Output um Versionsfeld ergänzen (z. B. `{ schema: 1, ...payload }`); Schema (Felder je Command) im README dokumentieren; Regel: Breaking-Änderung am Schema ⇒ Versionsnummer hoch.
- **Abnahme:** Alle `--json`-Ausgaben tragen das Versionsfeld; Contract-/Snapshot-Test je Command; README-Doku; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `5224662` (Test-Commit `596cb8b`, 3× ROT belegt) — JSON_SCHEMA_VERSION=1 als erstes Feld jeder --json-Ausgabe (status/backlog/progress/validate/archive/progress-update, Dry-run + Apply); Contract-Tests je Command inkl. Top-Level-Key-Snapshot; README-Feldkontrakt-Tabelle + Kontrakt-Regel (Breaking ⇒ schema hoch, Lockstep Decision 16); SKILL.md-Erwähnung

---

### [x] M3 — structuredContent für Tool-Antworten prüfen (MCP-Spec-Compliance) — 🟡
- **Ort:** `packages/mcp/src/tools.ts` (Antwort-Formate); Fundstelle: MrLesk/Backlog.md v1.43 „MCP spec compliance overhaul"; eigenes Warning-Modell (Decision 6) liefert bereits strukturierte Daten.
- **Problem:** Tool-Antworten sind reine Text-Payloads; maschinelle Weiterverarbeitung (CI, Scripts, Agent-Tooling) müsste Text parsen, obwohl Findings/Warnings/Pläne intern strukturiert vorliegen.
- **Fix:** Entscheiden (mit Feldtest-Ergebnis aus Phase 7): Findings/Warnings/Plan-Diffs **zusätzlich** als `structuredContent` ausliefern (Text bleibt menschenlesbar). Kandidaten: docs_validate, progress_update, archive_item (Plan-Antwort).
- **Abnahme:** Entscheidung (inkl. Begründung) dokumentiert; falls ja: mindestens docs_validate + progress_update mit structuredContent, Client-Verträglichkeit verifiziert.
- **Erledigt:** Fix `e7847cc` (Test-Commit `1565238`, 3× ROT belegt) — Entscheidung JA (Feldtest 7.2: CI/Script-Weiterverarbeitung; Warning-Modell liegt strukturiert vor): docs_validate/progress_update/archive_item liefern Payload zusätzlich als structuredContent (Text unverändert, Fehler ohne structuredContent, Read-Tools bleiben plain — per Test abgesichert); Client-Verträglichkeit via InMemory-Client geprüft; README dokumentiert

---

### [x] L6 — Release-Prozess: CHANGELOG, Versionspolitik, Pack-Smoke in CI — 🟢
- **Ort:** Repo-Root (`CHANGELOG.md`), `package.json` beider Workspaces + Root, `.github/workflows/ci.yml`; Fundstelle: D3 (Pack-Check nur lokal, kein Publish-Flow), M6 (JSON-Schema-Version braucht Versionspolitik), **Decision 16 (Lockstep-SemVer)**; Format-Vorgabe: **Keep a Changelog 1.1.0** (https://keepachangelog.com/en/1.1.0/), im Wesentlichen übernehmen.
- **Problem:** Kein CHANGELOG, keine Versionierungs-Konvention, kein Smoke gegen das gepackte Artefakt — Distribution (Phase 7) endet am Pack-Inhalt, nicht am veröffentlichten Paket.
- **Fix:** CHANGELOG.md nach KAC 1.1.0: `## [<version>] - <Datum>` mit Sektionen Added/Changed/Deprecated/Removed/Fixed/Security, neueste Version zuerst, `## [Unreleased]` oben, SemVer-Referenz; Abweichung erlaubt **nur beim Datums-/Zeitformat** (JJMMDD/HHMM gem. Decision 11 statt ISO — Entscheidung im Step dokumentieren); **Redundanz-Regel:** CHANGELOG = kuratierte, nutzerrelevante Aggregate je Release — kein Git-Log-Dump und keine Duplikation von Erledigt-Index/BACKLOG_ARCHIVE (dort bleibt die Item-/Commit-Historie; Regel im README festhalten). Release-Mechanik gem. Decision 16: Lockstep-Bump in allen **drei** package.json + Git-Tag `v<version>` (Tags existieren noch nicht); CI-Job: npm pack beider Workspaces → Tarball installieren → stdio-Handshake-Smoke gegen das Artefakt; Publish-Checkliste im README (otp, dist-tag, nur `@method-docs/mcp` publizieren).
- **Abnahme:** CHANGELOG seit Phase 1 im KAC-Format (Historie kuratiert aus dem Erledigt-Index abgeleitet, ohne Index-Duplikation); CI-Smoke grün gegen Tarball; README-Abschnitt „Releases" nennt Format, Lockstep-Regel + Redundanz-Regel.
- **Erledigt:** Fix `8ec8aef` (Test-Commit `1d0817c`, 2× ROT belegt) — CHANGELOG.md (KAC 1.1.0, [Unreleased], kuratiert seit Phase 1, Redundanz-Regel + Datumsformat-Abweichung JJMMDD/HHMM dokumentiert); README-Abschnitt "Releases" (Format, Lockstep-SemVer Decision 16, Publish-Checkliste); scripts/pack-smoke.mjs + CI-Job `pack-smoke` (CI-Edit durch Sammel-Freigabe 9.x gedeckt): pack → install → statische Artefakt-Checks. Fund: Node verweigert TS-Stripping unter node_modules → dynamischer Handshake blockiert → neuer Blocker-Item H1 (Build/dist)

---

### [x] L3 — Verifikation als ausführbarer Plan formatieren — 🟢
- **Ort:** PLAYBOOK-Kopien (§6 Verifikation) + Konvention für die Verifikations-Zeile bei progress_update; Fundstelle: Google Conductor — „Manual Verification Steps" (Command, Ausführung, erwartetes Ergebnis) mit Pause bis expliziter menschlicher Bestätigung.
- **Problem:** Unsere Verifikation reduziert sich auf „typecheck + test grün" — die Zeile dokumentiert, DASS geprüft wurde, aber nicht WIE ein Mensch nachprüft; Reproduzierbarkeit für Dritte (Review, Feldtest, neue Session) leidet.
- **Fix:** Konvention ergänzen (Prosa-Edit, keine Code-Änderung): Verifikations-Zeile/-Liste nennt mindestens einen nachlaufbaren Befehl + erwartetes Ergebnis; Vorlage in PLAYBOOK §6; bewusst ohne docs_validate-Warnung (zu weich, reine Konvention).
- **Abnahme:** PLAYBOOK-Änderung in beiden Kopien textgleich; ein Beispiel-Verifikationsblock im Archiv zeigt das Format.
- **Erledigt:** Sync-Schlag 09/2026 — PLAYBOOK §6 „Verifikation als ausführbarer Plan (Konvention)" (nachlaufbarer Befehl + erwartetes Ergebnis) in beiden Kopien textgleich (method-docs@ee00f9c, stadtpfad-pwa@eed7ae9, SHA256 4BAEBA88…AE0D); Beispiel-Verifikationsblock entsteht mit dem Phase-9-Abschluss im Archiv

---

### [x] L8 — Sync-Schlag: 🔵-Semantik + Session-Einstieg kanonisieren (PLAYBOOK-Kopien) — 🟢
- **Ort:** PLAYBOOK-Kopien (§3 ID-/Serien-Konvention, §0/§2 Ablauf) in **beiden** Repos (method-docs + stadtpfad-pwa); Muster: D4-Sync-Schlag (textgleich, Commit je Repo).
- **Problem:** „🔵 = Test-Lücke" existiert nur als BACKLOG-Legende, nicht kanonisch im PLAYBOOK; der Standard-Session-Einstieg (docs_status → progress_show → nächste ⬜ vor jeder Schreiboperation) ist Projekt-Konvention (AGENTS-Kickoff), aber nicht Methode — neue Projekte raten.
- **Fix:** Sync-Schlag in beiden Kopien textgleich: §3 ergänzt „🔵 = Test-Lücken (explizite ID, keine Serie)"; kurzer Absatz „Session-Einstieg" (§0 oder §2); danach byte-identischer Abgleich beider Kopien (Hash-Vergleich als Beleg).
- **Abnahme:** Beide PLAYBOOK-Kopien textgleich (Diff-/Hash-Beleg im Erledigt-Index); docs_validate method-docs clean.
- **Erledigt:** Sync-Schlag 09/2026 — PLAYBOOK §3 „🔵 = Test-Lücken" (thematische Serien-ID, nie Auto-Nummer aus Prioritäts-Serie) + §0.8 „Session-Einstieg (bindend)" (PLAYBOOK/LESSONS → PROGRESS nächster Step 🔄 → BACKLOG) in beiden Kopien textgleich (method-docs@ee00f9c, stadtpfad-pwa@eed7ae9, SHA256 4BAEBA88…AE0D); docs_validate method-docs clean

---

### [x] L2 — Checkpoint-SHA je Phase in PROGRESS verankern — 🟢
- **Ort:** `packages/core` (Phasen-Abschluss in planProgressUpdate) + `packages/mcp` (progress_update-Parameter); Fundstelle: Google Conductor (gemini-cli-extensions/conductor, 09/2026) — `[checkpoint: <sha>]` je Phase im plan.md, Phase-Diff-Scoping über den vorherigen Checkpoint-SHA.
- **Problem:** Commit-SHAs landen bei uns nur im Erledigt-Index (archive_item-note); PROGRESS speichert pro Phase keinen Verifikations-Anker — „was hat diese Phase geändert?" ist nachträglich nicht per Git beantwortbar (Diff-Range fehlt), logisches Revert je Phase nicht ableitbar.
- **Fix:** progress_update bei Phase-Abschluss optionalen `checkpoint`-Parameter (SHA) spendieren, der in die **Verifikation:**-Zeile des Archiv-Blocks bzw. den Index-Einzeiler übernommen wird; Format grob validieren (7–40 Hex), keine Pflicht. Test-first: Plan-/Apply-Tests für die SHA-Durchreichung.
- **Abnahme:** Phase-Abschluss mit checkpoint-SHA erscheint verbatim in Archiv + Index; ohne Parameter unverändertes Verhalten; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `e3ff79f` (Test-Commit `af48a97`, 4× ROT belegt) — progress_update checkpoint-Parameter (7–40 Hex validiert, lowercase) erscheint bei Phasen-Abschluss verbatim in der **Verifikation:**-Zeile des Archiv-Blocks — allein (`(checkpoint: <sha>)`) oder kombiniert mit note; ohne Parameter unverändertes Verhalten; MCP-Schema + CLI `--checkpoint`; README/Fixtures-Spec/SKILL.md nachgezogen; Apply-Roundtrip per Test

---

### [x] L4 — Doc-Sync-Reminder bei Phasen-Abschluss — 🟢
- **Ort:** `packages/mcp` (progress_update-Antwort bei Phasen-Abschluss); Fundstelle: Google Conductor — „Synchronize Project Documentation": nach Track-Abschluss werden product.md/tech-stack.md-Updates vorgeschlagen (Diff + Approval).
- **Problem:** Nach Phasen-Abschluss erinnert nichts daran, dass Projekt-Doku sync-bedürftig sein kann (AGENTS-Kickoff, README, PLAYBOOK-Abweichungen) — der Sync-Schlag hängt aktuell an Erinnerung.
- **Fix:** Plan-Antwort bei Phasen-Abschluss um statischen Reminder-Bullet ergänzen („Doku-Sync prüfen: AGENTS-Kickoff, README, PLAYBOOK-Kopien"); reiner Textbaustein ohne Logik; Test auf Antwortinhalt.
- **Abnahme:** Phasen-Abschluss-Antwort enthält Reminder; übrige Antworten unverändert; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `a093a1e` (Test-Commit `830def8`, 2× ROT belegt) — statischer Reminder „Doku-Sync prüfen: AGENTS-Kickoff, README, PLAYBOOK-Kopien" bei Phasen-Abschluss: ProgressUpdatePlan.docSyncReminder (nur bei completedPhase, sonst undefined) + Apply-Verifikations-Messages; übrige Antworten unverändert (per Test); README-Tool-Zeile nachgezogen
