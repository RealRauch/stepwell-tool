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

### [ ] T1 — CRUD-Tools für Backlog-Items ergänzen (Create/Update/Remove) — 🟡
- **Ort:** `packages/core/src/mutations.ts` (Plan/Apply-Funktionen neben `planArchiveItem`), `packages/mcp` (Tool-Exposition), `packages/core/tests/mutations.test.ts`
- **Problem:** Es existieren nur Read (`backlog_list/show`) und Struktur-Write (`archive_item`, `progress_update`) — Anlegen, Ändern und Entfernen offener Items fehlen. Agenten legen Items deshalb per direktem Edit an und müssen Formatregeln von Hand nachahmen (ID-Serie, Emoji-Prio, Sektions-Kopfregeln, `JJMMDD/HHMM`-Zeitstempel); der Review-Workflow 09/2026 (R1–R6) hat die Lücke praktisch demonstriert. Fehlgeschlagene Nachahmung erzeugt Parse-Warnungen bzw. Drift.
- **Fix:** `backlog_add` / `backlog_update` / `backlog_remove` im Plan/Dry-run-Modell: ID-Vergabe mit Serien-Konventionsprüfung (`^[A-Z][0-9]+$`, K/H/M/L = Prio-Serien), Sektions-Pflege inkl. Verschieben zwischen Prioritäts-Sektionen bei Update, Zeitstempel-Aktualisierung der Kopfzeile, Span-Neuberechnung; `remove` **kein** Hard-Delete — Kopfregel („Fundstellen nicht löschen") verlangt verbatim-Verschub ins Archiv (analog `archive_item`, aber ohne Erledigt-Marker im Index); MCP-Exposition wie bei `archive_item`.
- **Abnahme:** Test-first je Operation: Fixture → plan → apply → neu parsen (Nachbar-Items byte-identisch erhalten); Update über Sektionsgrenze; `remove` landet im Archiv; `npm run typecheck && npm run test` grün; Archive bleiben sonst unangetastet (append-only).

### [ ] T2 — Titel-/Scope-Edits an der Fortschrittstabelle als Tool — 🟡
- **Ort:** `packages/core/src/mutations.ts` (Erweiterung `planProgressUpdate` oder neues `progress_rename`), `packages/mcp`, `packages/core/tests/mutations.test.ts`
- **Problem:** `progress_update` deckt nur Status, Row-Ergänzung, Detail-Block-Skelett und Phasen-Archivierung ab — Step-/Phasen-Titel in der Tabelle und die Überschrift der Detail-Blöcke („Laufende Phasen") lassen sich nur per direktem Edit ändern. Das ist Grenzfall zwischen Prosa und Struktur: beide Stellen (Tabellen-Zeile, Block-Heading) werden vom Parser gematcht (`progress.ts`), ein inkonsistenter manueller Edit trennt Tabelle und Detail-Block (z. B. `progress_show`/`progress_update` finden die Phase nicht mehr bzw. doppelt).
- **Fix:** Optionaler `title`-Parameter an `progress_update` (oder separates Tool), der Tabelle **und** Detail-Block-Heading konsistent setzt — im Plan/Dry-run-Modell, mit Span-Neuberechnung und Kopfzeilen-Zeitstempel; Verhalten bei geplantem Phasen-Abschluss im selben Call definieren (Reihenfolge!).
- **Abnahme:** Test-first: Titel-Änderung → Tabelle + Detail-Block konsistent, `progress_show` findet Phase unter neuem Titel; Nachbar-Zeilen/Blöcke byte-identisch; `npm run typecheck && npm run test` grün.

### [ ] T3 — CLI: Emoji-Prios und Status-Icons über ASCII-Aliase parametrisierbar machen — 🟡
- **Ort:** `packages/mcp/src/cli.ts:50,53,312-315` (`--priority`/`--status` validieren nur Literal-Emojis), Abbildung idealerweise zentral in `packages/core` (neben `profile.ts`)
- **Problem:** `progress-update --status` akzeptiert nur `⬜/🔄/✅/⛔`, `--priority` nur `🔴/🟠/🟡/🟢/🔵` — Zeichen, die auf gängigen Tastaturen nicht direkt tippar sind (Cop-and-Paste nötig, in Shell-History/Scripts fehleranfällig). Die CLI ist damit für Menschen praktisch unbenutzbar ohne Copy-Paste; Alias-Serien der ID-Konvention (`K/H/M/L`) liegen nahe, werden aber nicht als Werte akzeptiert.
- **Fix:** ASCII-Aliase je Wert definieren und in einer zentralen Map (core, exports) pflegen, z. B. Prio: `red|orange|yellow|green|blue` **oder** `kritisch|hoch|mittel|niedrig|test` **oder** `p1…p5`; Status: `open|running|done|blocked` (ggf. `wip`); CLI normalisiert Input → internes Emoji, Fehlermeldung listet erlaubte Aliase; MCP-Schema unverändert lassen (Agenten emittieren Emojis zuverlässig), Ausgabe/Help zeigt beide Formen.
- **Abnahme:** Test-first: `progress-update --status running --apply` erzeugt `🔄`-Zeile; `backlog-list --priority red,yellow` filtert korrekt; ungültiger Alias → Usage-Fehler mit Alias-Liste; `npm run typecheck && npm run test` grün.

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

---
