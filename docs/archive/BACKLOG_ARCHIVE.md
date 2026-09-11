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

---

### [x] L7 — docs_status um Next-Action-Empfehlung ergänzen — 🟢
- **Ort:** `packages/core` (Status-Report) + `packages/mcp` (docs_status-Antwort); Fundstelle: Conductor-Status-Skill („Next Action Needed", „Current Phase and Task", „Blockers").
- **Problem:** docs_status liefert Aggregate (offene Items je Prio, 🔄-Steps, ✅-Quote), aber keine Ableitung „was ist als Nächstes zu tun" — der Session-Kickoff braucht derzeit den zweiten Blick in progress_list/backlog_list.
- **Fix:** Zwei abgeleitete Zeilen ergänzen: „nächster offener Step" (erste ⬜-Zeile der laufenden Phase in definierter Reihenfolge) und „nächste Priorität mit offenen Items" (erste nicht-leere Prioritäts-Sektion 🔴→🔵); rein ableitend aus geparsten Daten, keine neue Tool-Oberfläche.
- **Abnahme:** Beide Felder deterministisch über Fixtures project-a/-b getestet; CLI `status` zeigt sie; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `ab2af81` (Test-Commit `f7b8233`, 4× ROT belegt) — DocsStatus.nextStep (erste ⬜-Zeile einer laufenden Phase in Tabellen-Ordnung) + nextPriority (erste nicht-leere Sektion 🔴→🔵), deterministisch über project-a/-b getestet; CLI `status` zeigt beide Zeilen; JSON-Contract additiv erweitert (schema bleibt 1, Snapshot-Test aktualisiert); ohne laufende Phase/offene Items → undefined (auch im M5-Zero-State)

---

### [x] T5 — BOM-Toleranz des Parsers (UTF-8-BOM in Datei-Köpfen) — 🔵
- **Ort:** `packages/core` (Datei-Einlesen/Parser); Fundstelle: eigene Prüfung 09/2026 (`rg feff|bom packages` = leer) — Windows-Editoren/PowerShell (`Out-File`, Notepad) schreiben gern UTF-8-BOM.
- **Problem:** Der zeilenbasierte Parser liest Heading/Kopfregeln ab Zeile 1; ein BOM vor `# BACKLOG.md` bzw. vor der ersten Sektion kann Kopfregel-/Sektionserkennung brechen oder als ungeklärte Drift durchrutschen — exakt die Zielklasse des fehlertoleranten Parsers, aber ungetestet.
- **Fix:** BOM am Dateianfang (U+FEFF) deterministisch strippen — stille Toleranz, dokumentiert, keine Warnung; Test-first: Fixture mit BOM, Parser-Positivpfad + Validate-Lauf dagegen.
- **Abnahme:** BOM-Datei parst identisch zur BOM-losen Variante (Assert auf Ergebnis-Gleichheit); Toleranz in README/Format-Doku erwähnt; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `f6921f1` (Test-Commit `9b96c4f`, ROT belegt) — stripBom (U+FEFF am Dateianfang) in parseBacklog/parseProgress (Archive delegieren) — stille Toleranz, keine Warnung; Fixture project-f-bom (project-a-Zwilling mit BOM in allen vier Dateien): Parsing + docsValidate ergebnisgleich zum BOM-losen Original; ROT-Befund: BOM vor der ersten Sektion brach die Sektionserkennung (Layout-abhängige Zufalls-Toleranz beseitigt); README + Fixtures-Spec dokumentiert

---

### [x] L5 — docs_review-Tool-Idee: Phasen-Review gegen Plan/Spec — 🟢
- **Ort:** `packages/core` + `packages/mcp` (neues Tool — Surface-Gewinn muss die M4-Guardrail bestehen); Fundstelle: Google Conductor — review-Skill (Plan-Compliance-Check, strukturierter Report mit Severity-Findings + Diff-Vorschlägen; Review-Fixes werden als Tasks getrackt — entspricht unserer Inline-Fix-Lane, Decision 14).
- **Problem:** Review läuft heute manuell (LESSONS-Checkliste + docs_validate); ein diff-basiertes Review „Phase X gegen ihre Steps/Items" (Plan-Compliance, Tests gelaufen?, Findings mit Datei/Zeile) ist nicht tool-gestützt.
- **Fix:** Erst Alternativprüfung nach M4 (Parameter an docs_status/progress_show? Resource?), dann Minimal-Entwurf: Review-Report als Read-Only-Tool; Findings-Format ans Warning-Modell (Decision 6) anlehnen.
- **Abnahme:** Entwurfsentscheidung dokumentiert (neues Tool vs. Erweiterung Bestand); falls Tool: Annotations, Tests und M4-Begründung im README.
- **Erledigt:** Entscheidung (Alternativprüfung nach M4, 09/2026): KEIN docs_review-Tool. (1) Plan-Compliance ist bereits abgedeckt: docs_validate prüft 🔄↔Detail-Block (WIP_WITHOUT_PLAN/PLAN_WITHOUT_WIP), progress_show liefert Ziel/Abnahme/Scope verbatim, docs_status aggregiert Findings + Next-Action; ein Review-Tool würde diese Funde doppelt ausgeben. (2) „Tests gelaufen?" ist aus den vier Doku-Dateien nicht ableitbar — das Tool müsste CI-/Log-Quellen lesen und bräche die Architektur-Grenze (core liest nur die vier Dateien). (3) M4-Guardrail: kein bekannter Fund des Feldtests/ Betriebs, der den Surface-Zuwachs rechtfertigt; Review läuft über LESSONS-Checkliste + docs_validate. Reaktivierungs-Kriterium: zeigen Feldtests, dass Plan-Compliance-Reviews wiederholt manuell nachgebaut werden, dann Minimal-Entwurf als Read-Only-Tool neu bewerten (Findings im Warning-Modell gem. Decision 6, Annotations + M4-Begründung im README)

---

### [x] L9 — Review-Polish: Warning.file-Kontrakt dokumentieren + Template-Resource-URIs auflisten — 🟢
- **Ort:** `packages/mcp/src/resources.ts` (Templates-Resource), `packages/core/src/types.ts` + Fixture-Spec (Warning-Kontrakt); Fundstelle: Code-Review Phase 9 (Low-Funde), Entscheidung im Dialog 09/2026.
- **Problem:** (1) Der `Warning`-Kontrakt dokumentiert `file` nur als Dateipfad, M5 trägt aber den Root (Verzeichnis) ein — Vertrag still gelockert ohne Doku. (2) Die Templates-Resource ist mit `list: undefined` registriert — Clients können die vier gültigen `kind`-Werte nicht auflisten, obwohl der Init-Fallback dorthin lenkt.
- **Fix:** (1) Vertrag dokumentieren: `file` = Datei **oder** Root bei Root-level-Funden (types.ts-Kommentar + Fixture-Spec + README-Warnungs-Codes). (2) Statischen List-Callback ergänzen, der die vier Template-URIs liefert.
- **Abnahme:** `listResources` liefert die vier Template-URIs (Test-first); Doku-Stellen nachgezogen; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `9a369c9` (Test-Commit `be7b5f0`, ROT belegt) — Templates-Resource mit statischem List-Callback (`listResources` liefert die vier URIs, mimeType text/markdown); Warning.file-Kontrakt dokumentiert (Datei oder Root bei Root-level-Funden) in types.ts-Kommentar + Fixture-Spec + README; 256/256 grün

---

### [x] L10 — nextStep-Kaskade: Fallback auf rein vorausgeplante Phasen — 🟢
- **Ort:** `packages/core/src/status.ts` (nextStep-Ableitung, L7); Fundstelle: Code-Review Phase 9 (Low-Fund) + Dialog-Entscheidung 09/2026 (Option C).
- **Problem:** `nextStep` betrachtet nur Phasen mit mindestens einem 🔄 — eine rein vorausgeplante Phase (alle Zeilen ⬜, frisch per `progress_plan_phase`) liefert `nextStep: undefined`, obwohl „starte den ersten Step" die offensichtliche nächste Aktion ist; der Session-Einstieg braucht dann den zweiten Blick über `PLAN_WITHOUT_WIP`.
- **Fix:** Kaskade: (1) erste ⬜-Zeile in einer Phase **mit** 🔄 (heutiges Verhalten, Vorrang laufender Arbeit), (2) sonst erste ⬜-Zeile in rein vorausgeplanten Phasen (Tabellen-Ordnung), (3) sonst `undefined`. Deterministisch, bestehende Fixture-Ergebnisse unverändert.
- **Abnahme:** Kaskade per Test belegt (reine Plan-Phase → Fallback greift; laufende Phase gewinnt gegen spätere Plan-Phase); project-a/-b-Ergebnisse identisch; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `14093de` (Test-Commit `b40be1f`, 3× ROT belegt) — nextStep-Kaskade: (1) erste ⬜-Zeile einer Phase mit 🔄 (Vorrang laufender Arbeit), (2) sonst erste ⬜-Zeile rein vorausgeplanter Phasen (Tabellen-Ordnung), (3) sonst undefined; per Test belegt: Fallback bei reiner Plan-Phase (2.1), Vorrang der laufenden gegen spätere Plan-Phase (2.2 vor 3.1), Durchfall bei erledigter früherer Phase (3.1); project-a/-b-Ergebnisse unverändert; 259/259 grün

---

### [x] R7 — Coverage-Gate-Test rekurriert: Nested-Run startet sich selbst, Gate-Akzeptanz nicht beweisbar — 🟠
- **Ort:** `packages/core/tests/coverage-gate.test.ts:21` (Nested-Config `HIGH_THRESHOLD_CONFIG`); Fundstelle: Code-Review Phase 9 (09/2026) — empirisch belegt via `test-results/`-Logs (Gate-Test 93–110 s gegenüber ~4 s Rest-Suite; `Unhandled Error: Timeout calling "onTaskUpdate"`).
- **Problem:** Die temporäre Nested-Config erbt `include: ["packages/*/tests/**/*.test.ts"]` ohne den Gate-Test selbst auszuschließen — vitest behält `root` beim Repo-cwd, also startet der Nested-Run `coverage-gate.test.ts` erneut (Rekursion), bis ein Worker crasht. Folgen: (1) `exitCode !== 0` kann durch den gecrashten Nested-Run statt durch echtes Threshold-Versagen zustande kommen — die 9.1-Akzeptanz ist nicht beweisbar; (2) der Unhandled Error kann den Outer-Run failen (nondeterministische Suite, einmal beobachtet); (3) auf langsamen CI-Runnern kann die Kette das Timeout sprengen.
- **Fix:** Gate-Datei in der Nested-Config ausschließen (`exclude: ["**/coverage-gate.test.ts"]`), sodass genau eine Nested-Ebene läuft; Assertion auf die Ursache schärfen (Output enthält Threshold-Meldung, nicht nur Exit-Code). Nebeneffekt: Gate-Test von ~100 s auf ~10 s.
- **Abnahme:** Gate-Test beweist deterministisch das Versagen am Threshold (Output-Assert), Rest-Suite unverändert grün, Laufzeit deutlich reduziert; `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix `4c03eb8` — Nested-Config schließt die Gate-Datei selbst aus (`configDefaults.exclude` + Glob) → genau eine Nested-Ebene; Assertion auf die Ursache geschärft (Threshold-Meldung `does not meet "<glob>" threshold`, Format empirisch verifiziert); Gate-Test 128 s → 7 s, Gesamtsuite ~2 min → ~9 s; Beiwerk: neuer Fund R9 (Exit-Code umgebungsabhängig) als 🔴-Item, Step 10.7 folgt

---

### [x] R8 — pack-smoke: unquoted Argumente bei shell:true brechen bei Leerzeichen im Windows-Temp-Pfad — 🟡
- **Ort:** `scripts/pack-smoke.mjs` (`run()`-Hilfe, `shell: true` auf win32); Fundstelle: Code-Review Phase 9 (09/2026).
- **Problem:** `spawnSync("npm", args, { shell: true })` verkettet Argumente **unquoted**; unter Windows brechen Tarball-/Install-Pfade, wenn das Temp-Verzeichnis Leerzeichen enthält (z. B. `C:\Users\John Smith\...`). CI (ubuntu, kein Shell-Parsing-Problem) ist nicht betroffen — nur lokale Windows-Läufe in solchen Umgebungen.
- **Fix:** Pfad-Argumente beim Shell-Aufruf explizit quoting (doppelte Anführungszeichen, interne `"` escapen) oder npm ohne Shell auflösen (`npm.cmd` auf win32 via `where`/feste Kandidaten).
- **Abnahme:** pack-smoke läuft mit Leerzeichen im Temp-Pfad (Test via `TMP`/`TEMP`-Override mit Leerzeichen-Verzeichnis); REST unverändert grün.
- **Erledigt:** Fix `9976d3b` (Test-Commit `7f532e6`, ROT belegt) — pack-smoke quotet Shell-Argumente bei win32 (`quoteForShell`: doppelte Anführungszeichen + internes `\"`-Escaping); Abnahme per Test: Smoke mit `TMP/TEMP/TMPDIR` auf Leerzeichen-Verzeichnis läuft grün (npm pack + install gegen spaced paths)

---

### [x] H1 — Dist-Blocker: npm-Artefakt enthält TS-Source und läuft nicht aus node_modules (Build/dist-Schritt nötig) — 🟠
- **Ort:** `packages/*/package.json` (files/exports/bin), Build-Konfiguration; Fundstelle: Pack-Smoke 9.8/L6 (`scripts/pack-smoke.mjs`) — installiertes Artefakt startet nicht: Node verweigert TS-Stripping unter `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`, Node 22.23 lokal; by design auch in neueren Versionen).
- **Problem:** `@method-docs/mcp` shippt reine `.ts`-Source (`files: ["src"]`); Verbraucher (`npm i -g`, `npx @method-docs/mcp`, README-Install-Abschnitt) bekommen ein nicht lauffähiges Paket — die dynamischen Smoke-Anteile (stdio-Handshake, CLI-Bin gegen das Artefakt) mussten deshalb auf statische Checks reduziert werden.
- **Fix:** Build-/dist-Schritt ergänzen (tsc → `dist/` in beiden Workspaces), `exports`/`bin` auf `dist` umstellen, `files` entsprechend, CI-Job auf den dynamischen Smoke (Handshake + Bin gegen `dist`-Artefakt) erweitern; Variante diskutieren: `tsc` in prepublishOnly oder committed dist. Achtung Content-Gate: Dependency-/Manifest-Änderungen = Mittel (Freigabe je Vorkommnis).
- **Abnahme:** `node node_modules/@method-docs/mcp/src/…`-Äquivalent (dist-Einstieg) startet aus Installation; pack-smoke mit dynamischem Handshake grün; README-Install verifiziert (`npx @method-docs/mcp`); `npm run typecheck && npm run test` grün.
- **Erledigt:** Fix in drei Teilen: 10.3 `028e7c5` (tsconfig.build je Workspace, rewriteRelativeImportExtensions, mcp gegen core-dist-Declarations) · 10.4 `2187585` (Manifests: files dist(+skills), exports/bin → dist, prepublishOnly build; vitest-Alias + typecheck-Paths als Konsequenz) · 10.5 `cb10583` (dynamischer Pack-Smoke: stdio-Handshake + CLI-Bin gegen das installierte Artefakt; dabei Fund: Direct-Run-Guard matchte nur cli.ts — installiertes Bin startete nicht, gefixt `cli\.(ts|js)$`); Abnahme erfüllt: installiertes dist-Artefakt startet (handshake OK, server stepwell), README-Install verifiziert, CHANGELOG-Eintrag

---

### [x] M4 — Tool-Surface-Guardrail: keine Guide-/Meta-Tools, Surface klein halten — 🟡
- **Ort:** AGENTS.md (Architektur-Entscheidungen); Fundstelle: MrLesk/Backlog.md BACK-408 (vier Workflow-Guide-Tools zu einem Enum-Selector konsolidiert — „simpler for agents to discover"); Sync-Kandidat für den D4-Schlag.
- **Problem:** Ohne Guardrail wachsen Meta-/Guide-/How-to-Tools in die Tool-Liste; Agenten entdecken die operative Oberfläche dann schlechter. Methoden-Wissen lebt bei uns bereits in PLAYBOOK.md + Resources — das soll so bleiben.
- **Fix:** Entscheidung ergänzen: Tools nur für konkrete Struktur-/Lese-Operationen; Methoden-Anleitung bleibt in Dateien/Resources; jedes neue Tool begründet den Surface-Zuwachs (Alternativprüfung: Parameter an existierendes Tool oder Resource statt neues Tool).
- **Abnahme:** Regel als Decision verankert; Tool-Liste enthält kein reines Doku-/Guide-Tool; Begründungspflicht im README (Contribution/Entwurfs-Abschnitt) erwähnt.
- **Erledigt:** Fix `e73ba2f` — Decision 17 in AGENTS.md verankert (nur Struktur-/Lese-Tools, keine Guide-/Meta-Tools, Alternativprüfung als Beweis-Format); README-Architektur-Abschnitt nennt die Begründungspflicht; Tool-Liste enthält kein reines Doku-/Guide-Tool (docs_review-Präzedenz L5: Entscheidung dokumentiert statt Tool)

---

### [x] R9 — Coverage-Gate-Exit-Code: Fehlalarm durch cmd-%ERRORLEVEL%-Messartefakt — Gate funktioniert korrekt — 🔴
- **Ort:** Coverage-Gate (vitest `coverage.thresholds`) + CI-Job (`npx vitest run --coverage` in `.github/workflows/ci.yml`); Fundstelle: Diagnose im Step 10.1/R7 (09/2026) — ursprünglicher Verdacht „isolated CLI exit 0 trotz Threshold-ERROR".
- **Problem (ursprünglich):** Exit-Code sei umgebungsabhängig und das CI-Gate potenziell wirkungslos.
- **Ergebnis der Klärung (10.7):** **Fehlalarm — Messartefakt.** `cmd /c "... & echo %ERRORLEVEL%"` expandiert `%ERRORLEVEL%` zur Parse-Zeit (Wert vor dem Lauf), jede Messung lieferte deshalb 0. Mit korrekter Messung (PowerShell `$LASTEXITCODE`): vitest exitet bei Threshold-Verletzung deterministisch mit 1 — isoliert (node vitest.mjs, Glob- wie Global-Schwellen) wie verschachtelt. Das Gate funktioniert wie gebaut; kein CI-Edit, kein Vitest-Upgrade nötig (Wrapper-Versuch verworfen, KISS/M4). Bleibender Wert aus 10.7: Ursachen-Assert im Gate-Test (Threshold-Meldung, wrap-/ANSI-tolerant) und die Messmethoden-Falle als Lesson-Kandidat.
- **Abnahme:** Threshold-Verletzung → vitest exit 1 (PowerShell-Messung, isoliert belegt); Gate-Test grün; `npm run typecheck && npm run test` grün.
- **Erledigt:** Ergebnis 10.7: Fehlalarm — Messartefakt. Ursprung: `cmd /c "... & echo %ERRORLEVEL%"` expandiert die Variable zur Parse-Zeit (immer 0); mit korrekter Messung (PowerShell `$LASTEXITCODE`) exitet vitest bei Threshold-Verletzung deterministisch mit 1 — isoliert (node vitest.mjs, Glob- wie Global-Schwellen) wie verschachtelt. Gate funktioniert wie gebaut: kein CI-Edit, kein Vitest-Upgrade, Wrapper-Versuch verworfen (KISS/M4 — nie committed). Bleibender Wert: Ursachen-Assert im Gate-Test (Threshold-Meldung, wrap-/ANSI-tolerant, R7-Fix) + Messmethoden-Falle als Lesson-Kandidat. Beweis: VITEST_PS_EXIT:1 / WRAPPER_PS_EXIT:1 (wrapper-Prototyp, verworfen)

---

### [x] G4 — Sync-Schlag: Lesson „Exit-Codes mit der Host-Sprache messen“ in LESSONS-Kopien (aus R9/Messartefakt) — 🟢
- **Ort:** `docs/LESSONS.md` (Abschnitt D. Build & Prozess) in **beiden** Repos (method-docs + stadtpfad-pwa); Fundstelle: R9-Klärung in 10.7 (09/2026) — der vermeintliche Coverage-Gate-Defekt war ein Messartefakt: `cmd /c "... & echo %ERRORLEVEL%"` expandiert `%ERRORLEVEL%` zur Parse-Zeit (Wert vor dem Lauf), sodass Exit-Codes nach `&` immer den alten Wert zeigen.
- **Problem:** Falsch gemessene Exit-Codes erzeugen Phantom-Bugs (hier: 🔴-Item, Diagnose-Aufwand, verworfener Wrapper-Bau) — die Falle ist in Script- und CI-Umgebungen (cmd-Verkettungen) allgegenwärtig und hatte als Fundstelle noch keine Checklisten-Zeile.
- **Fix:** Lesson #18 in LESSONS.md ergänzen (Abschnitt D): „Exit-Codes mit der Host-Sprache messen — PowerShell `$LASTEXITCODE`, POSIX `$?`/`$status` — nie mit cmd-`%ERRORLEVEL%`-Expansion nach `&`; in cmd selbst nur mit `!ERRORLEVEL!` bei `/v:on`." Beweis: R9 (method-docs 09/2026 — Fehlalarm 🔴 → Messartefakt).
- **Abnahme:** Lesson #18 in beiden LESSONS-Kopien textgleich (Hash-Vergleich als Beleg im Erledigt-Index); docs_validate method-docs clean; Commit je Repo.
- **Erledigt:** Sync-Schlag 09/2026 — Lesson #18 in beiden LESSONS-Kopien textgleich (method-docs@6152eb6, stadtpfad-pwa@0e5a64c, SHA256 D40FA413…30924B); docs_validate clean; Step 11.1/Phase 11 abgeschlossen

---

### [x] E1 — Token-Ökonomie I: kompakte Tool-Outputs (JSON-Dedupe, Feldprojektion, Plan-Detailstufe) — 🟡
- **Ort:** `packages/mcp/src/tools.ts` — `textResult`/`structuredResult` (`JSON.stringify(…, null, 2)` bzw. structuredContent-Duplikat), `backlog_list` (liefert volle Item-`text`-Bodies), Dry-run-Pläne der Mutations (volle Diff-Preview).
- **Problem:** Jedes Tool-Result kostet unnötig Tokens: Pretty-Print-JSON (+25–40 %) und das `structuredContent`-Duplikat (bis ~50 % auf Mutations-Calls — dieselben Daten zweimal im Result); `backlog_list` liefert vollen Item-Body auch wenn nur Übersicht gebraucht wird; Routine-Statuspflege druckt volle Diffs.
- **Arbeitsschritte (Entwurf):** (1) Kompakt-JSON (ohne Indent) als Default für `textResult`/`structuredResult`. (2) `structuredContent`-Dedupe: nur Text-Content by default, `structuredContent` als Opt-in — Kontrakt-Prüfung nötig (Client-Fläche gem. MCP-Spec; Removal im 0.x-Fenster zulässig, schema-Feld M6 beachten). (3) `backlog_list`: `fields`-Param oder `text: false` — schlanke Items (id/title/priority/open/section) für Übersichts-Calls. (4) Mutations: `detail: "summary" | "diff"` für Dry-run-Pläne (summary = Headline + Zeilenzahlen, diff = voll — Default diff, Sicherheitshinweis bleibt).
- **Abnahme:** Tests je Schalter; `npm run typecheck` + `npm run test` grün; `docs_validate` clean; CHANGELOG-Eintrag (MINOR — neue Parameter, Output-Kompaktierung mit Kontrakt-Notiz); Timing: vor 1.0.0, sinnvoll vor/mit I1 (kleinere Doku-Fläche für die EN-Migration).
- **Step-Paketierung:** Phase 12 — 12.1 (E1/1), 12.2 (E1/2).
- **Erledigt:** Commit `8b4a800` (12.1: Kompakt-JSON + structuredContent-Opt-in, Test-Commit `ce94b7f`) + `7afed7e` (12.2: backlog_list-Feldprojektion + Plan-Detailstufe, Test-Commit `5e71c8f`) — 273/273 grün, Steps 12.1/12.2.

---

### [x] E2 — Token-Ökonomie II: Runden-Ersparnis (docs_status-Scope-Include, Multi-Step-Update, Hash-Kurzschluss) — 🟡
- **Ort:** `packages/core/src/status.ts` + `packages/mcp/src/tools.ts` (`docs_status`, `progress_update`), `packages/mcp/src/resources.ts`; Read-Pfad des Kerns.
- **Problem:** Ein Step-Zyklus kostet mehrere Round-Trips (`docs_status` → `progress_show` → `backlog_show`; `progress_update` je Step am Phasenende); der Session-Kickoff liest PROGRESS/BACKLOG voll, auch wenn seit der letzten Session nichts geändert hat.
- **Arbeitsschritte (Entwurf):** (1) `docs_status`: `include`-Param (`"nextStepScope"`) — liefert Scope + Akzeptanz des nächsten Steps (aus Detail-Block bzw. zugehörigem Backlog-Item) mit → 1 Call statt 3. (2) `progress_update`: `step` als `string | string[]` — Multi-Step-Statuspflege in einem Call (Phasenabschluss). (3) Hash-Kurzschluss: Read-Tools/Resources liefern SHA256 je gelesener Datei mit; Client vergleicht gegen letzten bekannten Stand — Voll-Lesen überspringbar. Server bleibt stateless (Zero-Cache-Prinzip intakt); Grundlage für den Fast-Pfad aus E3.
- **Abnahme:** Tests je Param; bestehende Resource-/Tool-Verträge unverändert außer neuen optionalen Feldern (MINOR gem. Decision 16); `npm run typecheck` + `npm run test` grün; CHANGELOG-Eintrag; Timing: vor 1.0.0.
- **Step-Paketierung:** Phase 12 — 12.3 (E2/1), 12.4 (E2/2), 12.5 (E2/3).
- **Erledigt:** Commits `9676e3c` (12.3: docs_status nextStepScope-Include, Test `42388e0`) + `153537f` (12.4: Multi-Step-Update, Test `6badfce`) + `5b18a9e` (12.5: Hash-Kurzschluss, Test `61fcba8`) — 290/290 grün, Steps 12.3–12.5.

---

### [x] G5 — Phase-Kontext-Resource: Phase + Item-Bodies zur Lesezeit mergen (Subagent-Kontext in einem Read) — 🟡
- **Ort:** `packages/core/src/context.ts` (neu — `phaseContext`), `packages/mcp/src/resources.ts` (Resource `methoddocs://{root}/phase/{phase}`); Phasen-Suche analog `progress_show` (`matchesPhase` + Archiv-Fallback), Item-Auflösung via `loadProject`/`backlogShow`-Muster.
- **Problem:** Ein Subagent, der einen Step umsetzt, braucht heute Phase-Block und BACKLOG-Items als getrennte Reads; die Details leben im Item (Single Source), der Step verweist nur per `(E1/1)`-Ref im Namen. Ein zusammengesetzter Lese-Pfad spart Round-Trips, ohne Daten zu duplizieren (Anti-Drift: keine Kopie in Dateien — Merge existiert nur zur Lesezeit).
- **Fix (Entwurf):** core: `phaseContext(root, phase) → { phase, rows, items, unresolved, markdown }` — Phase verbatim, Tabellen-Zeilen der Phase, gemergte Item-Bodies in Step-Reihenfolge (offen bevorzugt, sonst Archiv), `unresolved` toleranter als Crash (Decision 6). Generated Headings über die Locale-Maschine (`canonical(role, detectLocale(…))` aus `profile.ts`) — nach Phase 14 automatisch EN. MCP: Read-Only-Resource `methoddocs://{root}/phase/{phase}` (percent-encoded, mimeType text/markdown; URI-Schema wandert mit N1/13.2 auf `stepwell://`). Kein Schreibpfad, kein Cache (Zero-Cache bleibt).
- **Tests (ROT→GRÜN):** project-a: Phase mit zwei Item-Refs → Block verbatim + beide Bodies in Step-Reihenfolge; unbekannter Ref → `unresolved` + Hinweiszeile im Markdown, kein Fehler; Phase im Archiv → Fallback greift; Block ohne Refs → Phase + Rows genügen.
- **Abnahme:** `npm run typecheck` + `npm run test` grün; `docs_validate` clean; README-Resource-Zeile + CHANGELOG (MINOR — neue Resource); M4-Alternativprüfung dokumentiert (Resource statt Tool, Komposition statt Duplikat).
- **Step-Paketierung:** Phase 12 — 12.6.
- **Erledigt:** Commit `f9f0e3b` (12.6: phaseContext + Resource `methoddocs://{root}/phase/{phase}`, Test-Commit `e1bd5c1`) — 297/297 grün, Step 12.6; M4-Alternativprüfung im README dokumentiert.

---

### [x] N1 — Naming-Refactor: method-docs-Reste → STEPWELL durchgängig (Pakete, Bin, URI-Schema, Repo) — 🟡
- **Ort:** Beide Workspaces + Root-Manifest (`@method-docs/core` in packages/core/package.json:2, `@method-docs/mcp` + bin `method-docs` + dep `@method-docs/core` in packages/mcp/package.json:2,16,19), Root-`name: "method-docs"`, `TOOL_NAME` (packages/core/src/index.ts:83), Resource-URI-Schema `methoddocs://templates/{kind}` (packages/mcp/src/resources.ts), tsconfigs/vitest.config/packaging-Tests (Namens-Assertions), README/AGENTS/SKILL/Doku-Prosa, opencode.json, und das Repo selbst (Verzeichnis `D:\Development\method-docs` + Git-Remote); Fund per grep 09/2026 — ~27 Dateien (exkl. Archiv/historische Prosa).
- **Problem:** Der Methoden-Name STEPWELL ist etabliert (Decision 12; MCP-Server heißt bereits `stepwell`, Decision 13), aber die Tool-Artefakte tragen weiter den Arbeitstitel `method-docs` — zwei Namen für dieselbe Sache in npm-Scope, Bin, URI-Schema, TOOL_NAME und Repo-Ordner. Nach dem ersten npm-Publish wird ein Rename teuer (Deprecation/Aliase); die bestehende Halb-Migration ist verwirrender als jedes der beiden Extreme.
- **Verfügbarkeits-Check (260909, Schritt 0 — erledigt):** npm-Paket `stepwell` frei (Registry 404) · npm-Scope `@stepwell` **belegt** (Org existiert, 0 Pakete — Kontrolltest: nicht existierende Scopes liefern „Scope not found“) · `stepwell-core`, `stepwell-mcp`, `stepwell-cli` frei (je 404) · npm-Search „stepwell“ 0 Treffer · GitHub-Org `github.com/stepwell` existiert (0 public Repos) — für unser Repo kein Blocker (liegt unter persönlichem Account), nur Namens-Nähe zur Kenntnis genommen.
- **Zielbild (angepasst an Check):** **Flat-Naming statt Scope:** npm `stepwell` = primäres Paket (das heutige `@method-docs/mcp`; bin `stepwell`; Install: `npx stepwell`), core als `stepwell-core` (flat) oder bewusst workspace-intern ohne npm-Publish (Entscheid im Sync); `TOOL_NAME = "stepwell"`, Resource-URIs `stepwell://templates/{kind}`, Repo/Remote `stepwell` (oder `stepwell-tool`), Doku-Prosa durchgängig STEPWELL. Kein `@stepwell/*`.
- **Arbeitsschritte (Entwurf):** (0) ~~npm-Verfügbarkeit prüfen~~ **erledigt 260909** — Ergebnis oben; einziger Rest: flat vs. intern-only für core im Sync klären. (1) Manifests + Dependencies + Lockstep-Versionierung (Decision 16) umbenennen; packaging-Tests als Namens-Wächter anpassen. (2) `TOOL_NAME` + Resource-URIs (URI-Schema ist Kontrakt gem. Decision 16/MAJOR — im 0.x-Fenster zulässig, schema-Feld-Regel beachten). (3) Doku: README/AGENTS/SKILL/PLAYBOOK-Kopien (falls betroffen) + CHANGELOG-Eintrag. (4) Repo-Rename als eigener letzter Schritt (GitHub-Rename + Remote-URL + lokalen Ordner; laufende Sessions/MCP-Configs mit alten Pfaden vorher abschließen). (5) Endgültiges Naming als Decision in AGENTS.md verankern. (6) Optional diskutieren: `stepwell` (flat, heute frei) durch zeitigen Placeholder-Publish sichern — ist Release-Entscheid mit Freigabe-Gate, kein Muss.
- **Abnahme:** `rg "method-docs|methoddocs"` über Code + Config (exkl. Archiv/historische Prosa) → 0 Treffer; pack-smoke grün gegen die neuen Namen; installiertes Artefakt startet als `stepwell` (Handshake); Templates-Resource unter `stepwell://` erreichbar; CHANGELOG + Decision-Eintrag; Timing: zusammen mit/vor I1, sicher vor dem ersten npm-Publish bzw. 1.0. Hinweis: Z1 nennt `@method-docs/core` — nach Umbenennung (flat: `stepwell-core`) lesen.
- **Step-Paketierung:** Phase 13 — 13.1 (N1/1), 13.2 (N1/2), 13.3 (N1/3), 13.4 (N1/4 — Repo-Rename als explizites menschliches Gate, letzter Schritt).
- **Erledigt:** 13.1@ff6a996, 13.2@bdc9a74, 13.3@f94832f, 13.4@7902677 (opencode.json npx tsx) + Repo angelegt https://github.com/RealRauch/stepwell-tool (public)

---

### [x] I1 — Sprach-Umstellung: Englisch als Primärsprache für Methoden-Struktur + Tool-Surface — 🟡
- **Location:** Vier Doku-Dateien beider Repos (method-docs + stadtpfad-pwa), PLAYBOOK-/LESSONS-Kopien, AGENTS.md, README, SKILL.md, CHANGELOG-Prosa, Fixtures-README (`packages/core/tests/fixtures/README.md` — arbeitende Parser-Spec), core (`profile.ts`, `templates.ts`), MCP-/CLI-Texte; Entscheidung 09/2026 (Chat-Kontext: Nicht-Deutschsprachige sollen die Methode lesen können; Inhaltstexte bleiben sprachfrei). **Explizit auch die Projekt-Doku dieses Repos selbst** — method-docs wendet die Regel zuerst auf sich an (Dogfooding).
- **Problem:** Struktur und Prosa der Methode sind deutsch — für Dritte nicht lesbar. Zielbild: **Englisch als Primärsprache für alles Strukturelle und Tool-Seitige** (Sektions-Headings, Feld-Labels, Erledigt-Index, Statuswörter, Tool-Beschreibungen, CLI-Help, Warning-Messages, Templates, PLAYBOOK/LESSONS/AGENTS/README/SKILL); **Inhaltstexte** (Item-Bodies, Notizen, Nutzertexte) bleiben bewusst sprachfrei — jeder schreibt sie in seiner Sprache.
- **Ist-Stand (gut):** Parser ist bereits zweisprachig — `profile.ts` kennt Locale `"en"` mit allen Rollen-Synonymen (Done Index, Active Phases, Location, Acceptance, Verification, As of:, done, removed …), Union-Matching liest DE+EN gemischt, `canonical(role, locale)` generiert sprachabhängig, `detectLocale` existiert. Der Umbau ist primär Migration + Konventions-Flip, kein Parser-Neubau.
- **Arbeitsschritte (Entwurf):** (1) Konventions-Flip: PLAYBOOK §2/§3 + AGENTS Decision 10 — Englisch primär für Struktur/API/Messages, Inhaltstexte sprachfrei; Sync-Schlag beide Kopien. (2) Migration der offenen Dateien (nur Struktur-Labels; Archive nie anfassen): Headings (KRITISCH→CRITICAL, HOCH→HIGH, MITTEL→MEDIUM, NIEDRIG→LOW, TEST-LÜCKEN→TEST GAPS, Erledigt-Index→Done Index, Laufende Phasen→Active Phases), Feld-Labels (Ort→Location, Abnahme→Acceptance, Verifikation→Verification, Umfang→Scope), Stand:→As of:, erledigt→done — in beiden Repos, Commit je Repo mit Hash-Beleg. (3) `detectLocale`-Gleichstand de→en drehen (Generierung kanonisch en). (4) `projectTemplates` → EN-Skeletons. (5) Warning-Messages, Tool-Beschreibungen, CLI-Help, SKILL.md → EN. (6) Projekt-Doku: CHANGELOG — neue Einträge EN, deutscher Bestand bleibt als historische Einträge stehen (KAC-Historie wie Archiv behandeln); Fixtures-README → EN (arbeitsnahe Spec, zeitgleich mit gemischtsprachiger Fixture); Feldtest-Protokoll (`docs/feldtest-stadtpfad-pwa.md`) als historischer Beleg auf DE belassen (Archiv-Regel). (7) Toleranz-Entscheid im Sync-Schlag: Legacy-DE-Labels in offenen Dateien still tolerieren (Union-Matching tut es ohnehin) oder STRUCT_LOCALE-Warnung nach DATE_LEGACY-Muster.
- **Acceptance:** Beide PLAYBOOK-/LESSONS-Kopien textgleich EN (SHA256-Beleg wie L8); vier offene Dateien in beiden Repos mit EN-Struktur, `docs_validate` je Repo clean; Tests grün inkl. neuer gemischtsprachiger Fixture (DE-Archiv + EN-offene Datei); Fixtures-README EN; neue Projekte starten mit EN-Templates; Decision 10 nachgezogen; CHANGELOG-Eintrag mit Kontrakt-Notiz (message-Texte ändern sich, schema bleibt 1 — Struktur unverändert); Timing: vor 1.0.0 (Freigabe-Moment = englische öffentliche Fläche).
- **Step-Paketierung:** Phase 14 — 14.1 (I1/1), 14.2 (I1/2), 14.3 (I1/3), 14.4 (I1/4), 14.5 (I1/5), 14.6 (I1/6).
- **Erledigt:** Phase 14 complete (14.1–14.6); Step 14.6 closes the loop with STRUCT_LOCALE = silent tolerance + CHANGELOG entry.

---

### [x] E3 — Methoden-Fast-Pfad: Kickoff-Token sparen (Hash-gestützte Überspringbarkeit, Parallel-Reads) — 🟢
- **Location:** `docs/PLAYBOOK.md` + `docs/LESSONS.md` in **beiden** Repos (method-docs + stadtpfad-pwa) — Sync-Schlag nach D4/G4-Muster, Commit je Repo, Hash-Beleg; zusätzlich SKILL.md und AGENTS.md (Kickoff-Abschnitt).
- **Problem:** Der Session-Kickoff (PLAYBOOK + LESSONS + PROGRESS + Backlog voll lesen) ist der größte fixe Token-Block pro Session — auch wenn sich seit der letzten Session nichts geändert hat. E2 (Hash-Lieferung) ist die technische Voraussetzung; der Fast-Pfad selbst ist Methoden-Prosa.
- **Fix:** PLAYBOOK-Kickoff-Abschnitt um Fast-Pfad ergänzen: „Stimmt der von `docs_status`/Resources gelieferte Datei-Hash mit dem letzten bekannten Stand überein, genügt das Lesen des Step-Scopes; PLAYBOOK/LESSONS müssen nicht erneut voll gelesen werden" + Merksatz: unabhängige Read-Calls parallel stellen. Reihenfolge zu E2 im Item dokumentieren (Prosa nach/vor Code-Fähigkeit — Toleranz: Fast-Pfad erst nutzen, wenn Hash geliefert wird).
- **Acceptance:** Beide PLAYBOOK-/LESSONS-Kopien textgleich (SHA256-Beleg wie L8/G4 im Erledigt-Index); `docs_validate` je Repo clean; Commit je Repo.
- **Step-Paketierung:** Phase 15 — 15.1; bewusst **nach** Phase 14 gelegt (Sync-Schlag schreibt direkt auf der EN-Fläche, keine Doppel-Übersetzung), technische Voraussetzung ist E2/12.5 (Hash-Lieferung).
- **Erledigt:** Commits: 255f0b3 (stepwell-tool: PLAYBOOK §0.9 + SKILL.md + AGENTS.md + CHANGELOG) + 366ce4a (stadtpfad-pwa: PLAYBOOK §0.9)

---

### [x] I3 — Method-Docs EN Migration (PLAYBOOK/LESSONS/AGENTS/BRAINSTORM/CHANGELOG) — 🟡
- **Location:** `docs/PLAYBOOK.md`, `docs/LESSONS.md`, `AGENTS.md`, `BRAINSTORM.md`, `CHANGELOG.md` in method-docs (kein Touch in stadtpfad-pwa — siehe S1).
- **Problem:** Nach I1-Close (Phase 14, 14.6 ✅) bleiben vier Methoden-Doku-Dateien mit DE-Prosa — der „English only for method docs"-Schritt aus Decision 10 ist konzeptuell beschlossen, an diesen Dateien aber noch nicht umgesetzt. I2 übernimmt README separat; diese Dateien sind der Rest.
- **Fix:** Schritt-für-Schritt-Migration: 16.1 PLAYBOOK, 16.2 LESSONS, 16.3 AGENTS-Wording schärfen (D10: „English only for method docs; tolerance layer stays for project files"), 16.4 README (eigenes Item I2), 16.5 BRAINSTORM + CHANGELOG-trailing. DE-Snapshots in `docs/archive/PLAYBOOK-2026-09-snapshot.md` und `docs/archive/LESSONS-2026-09-snapshot.md` mit Header „historische DE-Fassung, vor 16.1/16.2, nicht mehr gepflegt". CHANGELOG: neue Einträge EN, alte DE bleiben (Append-only). Kein Sync-Schlag nach stadtpfad-pwa — dort übernimmt deren Agent (S1 dokumentiert die Drift).
- **Acceptance:** alle fünf Dateien in method-docs auf EN-Struktur; `docs_validate` clean; kein DE-Schatten mehr in Method-Doku; S1 dokumentiert die stadtpfad-pwa-Drift zentral.
- **Verification:** Phase 16 Steps 16.1–16.5 ✅; Done-Index-Eintrag mit Commit-Hash; CHANGELOG-Eintrag für I3-Abschluss; Backlog-Wurzel intakt.
- **Done:** Phase 16 complete: 16.1@dfc271c (PLAYBOOK EN + snapshot), 16.2@6ee2d34 (LESSONS EN + snapshot), 16.3@b339f94 (Decision 10 sharpened), 16.5 BRAINSTORM EN + CHANGELOG trailing (archive commit)

---

### [x] I2 — README.md EN-Migration (aus 14.4 extrahiert — Scope zu groß für einen Step) — 🟢
- **Location:** `README.md` (stepwell-tool) + README in stadtpfad-pwa.
- **Problem:** 14.4 hat core Warning-Messages, MCP Tool-Descriptions, CLI-Help und SKILL.md auf EN migriert (Commit `7b22635`). README.md ist nach Decision 10 ebenfalls strukturelle Sprache — sie wurde aus 14.4 ausgegliedert, weil der Schritt sonst zu groß geworden wäre (10+ Sektionen mit ~150 Zeilen Prosa, Tool-Reference-Tabelle, Architektur-Abschnitt). Backlog-Item I1 erwähnt README explizit; nur die Migration wurde verschoben.
- **Current state (good):** Parser ist zweisprachig, Union-Matching liest DE+EN weiter still. Tools/SKILL/CLI sind auf EN. Verbleibende DE-Inhalte in README sind Inhalts-Prosa (User-content, sprachfrei laut Decision 10) UND Strukturen, die mit den anderen Phase-14-Migrationen identisch sind.
- **Acceptance:** No remaining structural DE labels in README headers/tool-reference-table; SKILL.md/CLI/Tools bleiben EN; npm run test 308/308; README-Tool-Reference-Tabelle-Tests optional analog cli.test.ts.
- **Reihenfolge:** Nach 14.6 (Phase 14 abgeschlossen). Vor 1.0.0 (Freigabe-Moment = englische öffentliche Fläche).
- **Aufwand:** ~30 Min, mehrere Edit-Aufrufe pro Sektion.
- **Done:** Commit 36b8ea4 — README fully EN; stale status line (phases 1–15), test count 316 and locale tie-break (en, since 14.3) refreshed during migration
