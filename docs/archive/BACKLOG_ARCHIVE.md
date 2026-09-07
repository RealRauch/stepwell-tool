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
