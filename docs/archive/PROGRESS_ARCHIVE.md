# PROGRESS_ARCHIVE.md — Archiv abgeschlossener Phasen (append-only)

> Detail-Blöcke wandern **unverändert** hierher; die Fortschrittstabelle bleibt
> vollständig in `PROGRESS.md` (dauerhafter Index).

---

---

### Phase 1 — Core-Library (read-only Parser + Reports)

**Ziel:** `@method-docs/core` parst `BACKLOG.md`, `PROGRESS.md` und beide Archive
fehlertolerant und liefert Status- und Validierungs-Reports als Datenstrukturen
(Grundlage für MCP in Phase 2 und die CLI in 2.6).

**Formate (Realität, nicht Idealisierung):** abgeleitet aus `D:\Development\stadtpfad-pwa`
— Sektionen mit eigenen Kopfregeln (z. B. R-/U-Serien), Emoji-Prioritäten
(🔴🟠🟡🟢🔵), Item-Blöcke `### [ ] ID — Titel — prio`, Erledigt-Index als Einzeiler,
Fortschrittstabelle `| # | Step | Status |`, Status-Icons ⬜🔄✅⛔.

**Abnahme (je Step test-first):** `npm run typecheck` + `npm run test` grün;
Parser gegen Fixtures (`packages/core/tests/fixtures/`) — realistische, anonymisierte
Nachbauten inkl. Drift-/Edge-Cases (fehlende Sektion, unbekanntes Icon, kaputter Block).
**Fixtures v1 liegen bereits** (Session-Prep 09/2026, Commit siehe Log): `project-a` (sauber)
+ `project-b-drift` (Fälle D1–D15) — Spezifikation/Erwartungen in `fixtures/README.md`;
1.2 beginnt mit den roten Tests dagegen.

**Datenmodell (ab 1.2 bindend):**
- `ParseResult<T> = { value: T, warnings: Warning[] }` mit
  `Warning = { code, file, line?, message }` — **Parse-Warnungen** (D1, D3, D4, D6,
  D7, D9, D10) entstehen beim Parsen einzelner Dateien; **Validate-Funde** (D2, D5,
  D8, D11–D15) prüfen Querkonsistenz über Dateien hinweg. `docs_validate` = Aggregator
  (Konsistenzregeln + eingesammelte Parse-Warnungen).
- Item-Blöcke tragen ab 1.2 `span: { start, end }` (Zeilenbereich) und `raw`
  (verbatim-Block) — Basis für die verbatim-Verschiebung in Phase 3 (`archive_item`,
  Lesson L16).
- **Prio-Ableitung:** Titel-Suffix gewinnt → Sektions-Emoji als Fallback (Warnung
  `PRIO_MISSING`) → erst dann `unknown` (Beschluss 09/2026, siehe fixtures/README).
- **Datei-Pflicht:** Alle 4 Dateien (BACKLOG, PROGRESS, beide Archive) sind Pflicht —
  fehlt eine → harter Fehler, keine Toleranz.
- **Zeitstempel:** Doku-Daten immer `JJMMDD/HHMM` (z. B. `260907/1523`); `MM/JJJJ`-Bestand
  toleriert, Warnung `DATE_LEGACY` nur in offenen Dateien — Migration siehe PLAYBOOK §3.
- Vollständige Parameter-/Kategorien-Referenz: `packages/core/tests/fixtures/README.md`
  („Schnittstellen-Referenz") — dort gepinnt, nicht hier dupliziert.

**Umfang (Steps):**

- **1.1 Monorepo-Grundgerüst:** npm workspaces (`core`, `mcp` folgt Phase 2), TS strict
  (`NodeNext`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), Vitest,
  typecheck deckt **src UND tests** ab (Lesson L12), Smoke-Test ROT→GRÜN als Toolchain-Nachweis.
- **1.2 BACKLOG-Parser:** Sektionen + Prioritäten erkennen; Item-Blöcke zu
  `{id, title, priority, section, open, location, text, span, raw}`; `[ ]`/`[x]`; Erledigt-Index-Einzeiler
  separat modelliert. Drift (unbekannte Struktur) → Warnung, kein Abbruch.
- **1.3 PROGRESS-Parser:** Fortschrittstabelle (`{step, name, status}`) +
  „Laufende Phasen"-Blöcke `{phase, goal, scope[], acceptance}`; Status-Icons mappen.
- **1.4 Archiv-Reader:** `BACKLOG_ARCHIVE.md` (Item-Blöcke) + `PROGRESS_ARCHIVE.md`
  (Detail-Blöcke) parsen; Merge-Sicht `backlog_show(id)` über offen + Erledigt-Index + Archiv.
- **1.5 docs_status:** Aggregation — offene Items je Prio, laufende Phase(n), ✅-Quote
  der Tabelle, eingebettete Validierungs-Warnungen.
- **1.6 docs_validate:** Konsistenzregeln: (a) Erledigt-Index-Eintrag ↔ Archiv-Block
  beidseitig, (b) `[x]`-Checkbox ohne Archivierung, (c) 🔄-Phase ohne Detail-Block bzw.
  umgekehrt, (d) Parser-Drift-Warnungen gesammelt.
**Verifikation:** Phase 1 verifiziert: typecheck + 122 Tests grün

---

### Phase 2 — MCP-Server (stdio)

**Ziel:** `@method-docs/mcp` stellt die core-Reports als MCP-Tools + Resources bereit.

**SDK-Festlegung (2.1, Beschluss 09/2026):** `@modelcontextprotocol/sdk` **v1.x stabil
(pinning `^1.30.0`)** mit `McpServer.registerTool` + `StdioServerTransport` und zod v3.
Gegen v2-alpha (`registerTool` mit z.object/zod v4, `serveStdio`) bewusst entschieden —
v2 ist nicht stabil. Tests laufen protokollecht über `InMemoryTransport.createLinkedPair()`
+ `Client` (automatisierter Ersatz für den manuellen Inspector-Test; Inspector bleibt als
manuelle Verifikation dokumentiert). **Multi-Projekt-Prinzip:** Der Projekt-Root wird
**je Tool-Call** übergeben; Resources sind Resource-Templates mit **percent-encoded Root**
im URI (`methoddocs://{root}/backlog`) — Windows-Pfade enthalten `/` und `:`, daher wird
der Root ausschließlich encoded in den URI eingesetzt und im Read-Callback dekodiert.

**Umfang (Steps):**

- **2.1 SDK-Festlegung + Grundserver:** Workspace `packages/mcp` (package.json, tsconfig,
  deps), `createDocsServer()` mit Echo-Tool, Protokoll-Tests via InMemory-Client
  (tools/list, callTool), stdio-Einstieg `serve.ts`.
- **2.2 Read-Tools backlog:** `backlog_list(root, priority[], open?, section?)` **ohne
  `raw`** (schlanker Payload), `backlog_show(root, id)` inkl. `raw`+`span` (Merge-Sicht
  aus core). Fehler (fehlende Pflichtdatei, unbekannte ID) → `isError: true` mit klarer
  Meldung, kein Absturz des Servers.
- **2.3 Read-Tools progress + validate:** `progress_list(root, status?)`,
  `progress_show(root, phase)`, `docs_status(root)`, `docs_validate(root)` — JSON-Payloads
  aus core, `isError`-Kapselung wie 2.2.
- **2.4 Resources + Resource-Templates:** `methoddocs://{root}/backlog`,
  `methoddocs://{root}/progress`, `methoddocs://{root}/archive/{kind}`
  (kind ∈ backlog|progress), mimeType `text/markdown`; Read-Callback dekodiert den Root.
- **2.5 opencode-Integration + Doku:** `opencode.json` im Repo (lokaler stdio-Server,
  Node ≥ 22.18 — natives TS-Stripping), README-Ausbau (Tools, Resources, CLI, Inspector).
- **2.6 CLI:** `method-docs <status|backlog|progress|validate>` mit Flags `--root`,
  `--priority`, `--open`, `--status`, `--json`; `bin`-Eintrag auf TS-Entry (Node ≥ 22.18
  führt sie direkt aus), testbare `runCli(args, stdout)`-Funktion über core.
**Verifikation:** Phase 2 verifiziert: 6 Steps, Suite + stdio-Handshake grün

---

### Phase 3 — Mutation (`archive_item`, `progress_update`)

**Ziel:** Genau **zwei** schreibende Tools, beide **Dry-run + Apply**:
- `archive_item` — verbatim-Verschiebung in `docs/archive/BACKLOG_ARCHIVE.md`
  + Einzeiler im Erledigt-Index + Status-Pflege in `PROGRESS.md`.
- `progress_update` — Statuspflege in `PROGRESS.md` (Detail-Block + Fortschrittstabelle;
  PLAYBOOK §2-Dokumentationspflicht, 🔄 vor Beginn / ✅ nach Abschluss).

Bewusste Grenze: Alles andere editiert der Agent **direkt** in den Markdown-Dateien —
das Tool automatisiert nur die fehleranfälligen, strukturellen Operationen (Lesson L16).

**Fein-Paketierung (bei Phasenstart 09/2026; das Bewährungs-Gate wurde durch
Nutzer-Freigabe „Phase 3 komplett implementieren" aufgehoben):**

- **3.1 `archive_item` (Dry-run):** core `planArchiveItem(root, id, {note?})` — Plan aus
  genau zwei Datei-Änderungen: (a) Item-Block **span-basiert und verbatim** aus
  `BACKLOG.md` entfernen (Lesson L16), im Archiv-Exemplar die Checkbox zu `[x]` kippen;
  optionale `note` wird als `- **Erledigt:** <note>` an den Archiv-Block angehängt;
  (b) Einzeiler `- <ID> — <Titel> — erledigt (note?)` ans **Ende** der Sektion
  „✅ Erledigt-Index". Je Änderung `before`/`after` + eigenhändiger Mini-Diff
  (zeilenbasiert, Kontext 2, `src/diff.ts`). MCP-Tool `archive_item` mit `dryRun`
  **Default `true`**; `dryRun: false` wird in 3.1 noch mit klarem Fehler abgelehnt
  (Apply folgt in 3.2). Keine Status-Pflege in `PROGRESS.md` durch `archive_item` —
  die Phasen-„Status-Pflege" aus der Ziel-Beschreibung ist Aufgabe von
  `progress_update` (3.3); Verhalten hiermit festgelegt.
- **3.2 Apply + Verifikation:** core `applyArchivePlan(plan)` schreibt beide Dateien
  (EOL-erhaltend); anschließend Frisch-Verifikation: ID nicht mehr in offenen Items,
  Block im Archiv, Einzeiler im Index, `docs_validate` ohne ID-bezogene Funde
  (Ergebnis im `ApplyResult.verification`). Freischaltung: MCP `dryRun: false` und
  CLI `archive --apply`. Tests **ausschließlich gegen Temp-Kopien der Fixtures**
  (`fs.cpSync` nach `os.tmpdir()`, Originale unberührt — abgesichert per
  Vorher/Nachher-Vergleich).
- **3.3 `progress_update` (Dry-run + Apply):** core `planProgressUpdate(root, phase,
  step, status, {note?})` — Fortschrittstabelle: Status-Zelle je Step setzen; fehlt
  die Zeile, wird sie ergänzt (Name aus dem Scope-Bullet des Blocks abgeleitet, sonst
  der Step selbst). Detail-Block: fehlt er bei 🔄, wird ein Skelett unter „Laufende
  Phasen" angelegt (`### <Phase>` + `**Umfang (Steps):**` + Step-Bullet) — keine
  erfundenen Ziel-/Abnahme-Texte (die füllt der Agent direkt); fehlt der Step-Bullet
  im Block, wird er ergänzt. Ist nach dem Update **kein** Step der Phase mehr 🔄/⬜
  (Phasen-Präfix `<Nr>.` aus dem Blocknamen), wandert der Block **verbatim** ins
  `PROGRESS_ARCHIVE` (optionale `note` dabei als `**Verifikation:**`-Zeile am Block).
  MCP-Tool + CLI `progress-update --apply`.
- **Interface-Erweiterung (Beschluss 09/2026):** `archive_item` erhält zusätzlich
  `note?` (Erledigt-Zeile am Archiv-Block + Index-Tail) — Abweichung von der
  1.2-Schnittstellentafel, dokumentiert in `packages/core/tests/fixtures/README.md`
  (dort wird die Tool-Tabelle mitgepflegt).
- **Dogfood nach 3.3 (Echtbetriebs-Verifikation):** Dieses Repo erfüllt die
  4-Datei-Pflicht (Archive-Skelette angelegt, 09/2026); die Detail-Blöcke Phase 1+2
  werden via `progress_update` ins Archiv verschoben und BACKLOG-Item `L1` nach dem
  stadtpfad-pwa-Sync via `archive_item` abgeschlossen; `docs_validate` muss_clean
  laufen.
- **Testdaten-Muster:** Player für Mutationen sind ausschließlich Temp-Kopien;
  `project-a`/`project-b-drift` bleiben forever read-only.
**Verifikation:** Phase 3 verifiziert: Dry-run + Apply + Frisch-Verifikation, Suite gruen

---

### Phase 4 — Mehrsprachigkeit (Locale-Profile)

**Ziel:** Die Doku-Dateien bleiben deutsch (dieses Repo), müssen aber auch in
anderen Sprachen — vor allem Englisch — parse- und schreibbar sein.

**Abnahme:** Parser/Validator lesen de- UND en-Formatiere ohne Konfiguration
(Fixture `project-c-en`, Funde-frei); die schreibenden Tools erzeugen Index-Zeilen,
Erledigt-/Verifikations-Marker und Skeletons in der Ziel-Sprache (`locale`-Option,
Auto-Erkennung, Default `de`); Suite + Typecheck grün.

**Umfang (Steps):**

- **4.1 Locale-Profile (lesen):** zentrale `src/profile.ts` mit Rollen-Synonymen
  (de/en) — Union-Matching im Parser (`Erledigt-Index|Done Index`, `Ort|Location`,
  `erledigt|done`, `Ziel|Goal`, `Abnahme|Acceptance`, `Verifikation|Verification`,
  `Umfang|Scope`, `Fortschritt|Progress`, `Laufende Phasen|Active Phases`,
  `abgeschlossen|completed`, `Stand:|As of:`); Validator (`DATE_LEGACY`) bilingual;
  neues Fixture `project-c-en` als Spezifikation, test-first.
- **4.2 Locale-Profile (schreiben + Schnittstellen):** `locale`-Option auf
  `archive_item`/`progress_update` (Default `de`, `en`, Auto-Erkennung aus dem
  Datei-Kontext); MCP-Param + CLI `--locale`; README + Interface-Tafel gepflegt.
**Verifikation:** Parser/Validator bilingual (project-c-en fund-frei), locale-Option auf archive_item/progress_update mit Auto-Erkennung, CLI --locale; Suite 146/146 gruen

---

### Phase 5 — Identität und Prozess-Schärfung

**Ziel:** Der MCP-Server trägt den Methoden-Namen (`stepwell`), und die
Prozess-Lektionen aus Phase 3/4 sind bindend verankert (Menschen-Gate,
Tool-Pflicht für Strukturen).

**Abnahme:** `serverInfo.name` ist `stepwell` (InMemory- + stdio-Test),
opencode-Registry-Schlüssel und README entsprechend; PLAYBOOK §0.4 (Freigabe-Gate)
und LESSONS 17 (Struktur-Operationen gehören dem Tool) sind verankert und
synchronisiert (byte-identisch in stadtpfad-pwa); Suite + validate grün.

**Umfang (Steps):**

- **5.1 MCP-Server-Name `stepwell`:** `SERVER_NAME`, Tests, `opencode.json`-Schlüssel,
  README; dazu Methoden-Änderungen (PLAYBOOK §0.4, LESSONS 17) mit Sync-Pflicht
  (BACKLOG M1) — Gate-Regel: Implementierung startet erst nach menschlicher Freigabe.
**Verifikation:** serverInfo.name=stepwell (InMemory+stdio getestet), opencode-Registrierung + README umgestellt; PLAYBOOK 0.3 Freigabe-Gate + LESSONS 17 in allen Kopien synchronisiert (stadtpfad-pwa@f6e2277)

---

### Phase 6

**Umfang (Steps):**

- **6.1 Mutation-Regressionstests (R5)**
- **6.2 Stale-Span-Fix planProgressUpdate (R1)**
- **6.3 Locale-Synonyme zentralisieren (R2)**
- **6.4 CRLF-Roundtrip Archiv-Anhang (R3)**
- **6.5 Stale-Check beim Apply (R4)**
- **6.6 STEP_DUPLICATE-Validate (R6)**
- **6.7 CLI-ASCII-Aliase für Prio/Status (T3)**
- **6.8 Titel-/Scope-Edits als Tool (T2)**
- **6.9 Backlog-CRUD-Tools (T1)**
- **6.10 Phasen-Planung als Tool (T4)**
**Verifikation:** Alle 10 Steps verifiziert: typecheck + 188/188 Tests grün; R1–R6/T1–T4 archiviert. Commits 36e89c2…9fea4bc.

---

### Phase 7 — Distribution & Feldtest

**Ziel:** Das Tool verlässt das Rechenzentrum des Entwicklers — CI verriegelt die Suite
(D1 — optional als übernehmbares Template, kein Methoden-Pflichtteil), ein echtes
STEPWELL-Projekt (stadtpfad-pwa) validiert die Tools gegen Realformat (D2), und
das Package ist pack-/install-fähig (D3; README-Versprechen `npx method-docs`).
Paketiert aus den Items D1–D3 gem. Decision 14 (Backlog-Wurzel); D4 (PLAYBOOK-Sync) und
D5 (Step-Ergänzung als Tool) folgen im nächsten Packaging.

**Abnahme:** Workflow grün; Feldtest-Protokoll je Tool, Anomalien als BACKLOG-Items;
`npm pack` nur mit Source, bin-Shim funktioniert, Install-Abschnitt stimmt.
Je Step gilt die Abnahme seines Wurzel-Items (D1–D3).

**Umfang (Steps):**

- **7.1 CI-Workflow (typecheck + test + validate)**
- **7.2 Feldtest stadtpfad-pwa**
- **7.3 Publishing-Pack-Check**
**Verifikation:** 7.1 CI-Template (df55385) · 7.2 Feldtest-Protokoll + Funde W1/W2 (a35493c) · 7.3 files-Felder + Pack-/Bin-Check (f8a87b7); stadtpfad-pwa byte-identisch; typecheck + 190/190 Tests grün
