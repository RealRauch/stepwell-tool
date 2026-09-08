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
