# PROGRESS_ARCHIVE.md — Archiv abgeschlossener Phasen (append-only)

> Detail-Blöcke wandern **unverändert** hierher; die Fortschrittstabelle bleibt
> vollständig in `PROGRESS.md` (dauerhafter Index).

---

---

### Phase 1 — Core-Library (read-only Parser + Reports)

**Ziel:** `@method-docs/core` parst `BACKLOG.md`, `PROGRESS.md` und beide Archive
fehlertolerant und liefert Status- und Validierungs-Reports als Datenstrukturen
(Grundlage für MCP in Phase 2 und die CLI in 2.6).

**Formate (Realität, nicht Idealisierung):** abgeleitet aus `D:\Development\internal-pwa`
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
  internal-pwa-Sync via `archive_item` abgeschlossen; `docs_validate` muss_clean
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
synchronisiert (byte-identisch in internal-pwa); Suite + validate grün.

**Umfang (Steps):**

- **5.1 MCP-Server-Name `stepwell`:** `SERVER_NAME`, Tests, `opencode.json`-Schlüssel,
  README; dazu Methoden-Änderungen (PLAYBOOK §0.4, LESSONS 17) mit Sync-Pflicht
  (BACKLOG M1) — Gate-Regel: Implementierung startet erst nach menschlicher Freigabe.
**Verifikation:** serverInfo.name=stepwell (InMemory+stdio getestet), opencode-Registrierung + README umgestellt; PLAYBOOK 0.3 Freigabe-Gate + LESSONS 17 in allen Kopien synchronisiert (internal-pwa@f6e2277)

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
STEPWELL-Projekt (internal-pwa) validiert die Tools gegen Realformat (D2), und
das Package ist pack-/install-fähig (D3; README-Versprechen `npx method-docs`).
Paketiert aus den Items D1–D3 gem. Decision 14 (Backlog-Wurzel); D4 (PLAYBOOK-Sync) und
D5 (Step-Ergänzung als Tool) folgen im nächsten Packaging.

**Abnahme:** Workflow grün; Feldtest-Protokoll je Tool, Anomalien als BACKLOG-Items;
`npm pack` nur mit Source, bin-Shim funktioniert, Install-Abschnitt stimmt.
Je Step gilt die Abnahme seines Wurzel-Items (D1–D3).

**Umfang (Steps):**

- **7.1 CI-Workflow (typecheck + test + validate)**
- **7.2 Feldtest internal-pwa**
- **7.3 Publishing-Pack-Check**
**Verifikation:** 7.1 CI-Template (df55385) · 7.2 Feldtest-Protokoll + Funde W1/W2 (a35493c) · 7.3 files-Felder + Pack-/Bin-Check (f8a87b7); internal-pwa byte-identisch; typecheck + 190/190 Tests grün

---

### Phase 8 — Feldtest-Fixes & Methoden-Sync

**Ziel:** Die Feldtest-Funde aus internal-pwa (W1/W2) Richtung Realformat beheben —
der Erledigt-Index in Tabellenform wird erkannt, Archiv-Warnungen fluten nicht mehr —,
die letzte bekannte Tool-Lücke schließen (D5: Step zu laufender Phase ergänzen), und
alle offenen Methoden-Ergänzungen in einem textgleichen PLAYBOOK-Sync-Schlag in beide
Kopien bringen (D4 mit G1/G2, A1, G3). Reihenfolge bewusst: W1/W2 und D5 zuerst —
W1 liefert die Methoden-Entscheidung (Index-Tabelle kanonisch ja/nein) für den Sync,
D5 macht die Scope-Erweiterung laufender Phasen selbst tool-gestützt, bevor der
Sync-Schlag als letzter Step läuft.

**Backlog-Wurzel (Decision 14), Item → Step:**
8.1 ← W1 · 8.2 ← W2 · 8.3 ← D5 · 8.4 ← D4 (integriert G1, G2), A1, G3.

**Abnahme:** Je Step gilt die Abnahme seines Wurzel-Items (W1/W2/D5: typecheck + Tests
grün, neue Fixture-Fälle, `docs_validate` am Referenzprojekt internal-pwa ohne die
Feldtest-Funde; 8.4: beide PLAYBOOK-Kopien textgleich ergänzt, deckungsgleich mit
AGENTS Decisions 13/14, `docs_validate` beider Projekte clean).

**Umfang (Steps):**

- **8.1 Erledigt-Index-Tabelle parsen (W1)**
- **8.2 Archiv-Parse-Warnungen ausblenden (W2)**
- **8.3 Step zu laufender Phase ergänzen (D5)**
- **8.4 PLAYBOOK-Sync-Schlag (D4/G1/G2/A1/G3)**
**Verifikation:** 8.1 Index-Tabelle toleriert (54→13 ehrliche Funde) · 8.2 Archiv-Warnungen 55→0 · 8.3 planPhase-Erweiterungs-Modus · 8.4 Sync-Schlag textgleich in beide Kopien (method-docs@abb6dcf, internal-pwa@08d2613) mit Klärung Erledigt-Index-Formate; typecheck + 199/199 Tests grün; docs_validate method-docs clean

---

### Phase 9 — Distribution, Release & Runden

**Umfang (Steps):**

- **9.1 Coverage-Gate: Schwellen + CI (T6)**
- **9.2 MCP-Tool-Annotations (M2)**
- **9.3 Init-Fallback bei leerem Root (M5)**
- **9.4 Projekt-Init: Vorlagen-Auslieferung (M8)**
- **9.5 SKILL.md-Distributionsweg (M7)**
- **9.6 JSON-Output-Schema versionieren (M6)**
- **9.7 structuredContent-Entscheidung (M3)**
- **9.8 Release-Prozess: CHANGELOG + Pack-Smoke (L6)**
- **9.9 Sync-Schlag PLAYBOOK: Verifikations-Format, 🔵-Legende, Session-Einstieg (L3+L8)**
- **9.10 Checkpoint-SHA je Phase (L2)**
- **9.11 Doc-Sync-Reminder bei Phasen-Abschluss (L4)**
- **9.12 Next-Action in docs_status (L7)**
- **9.13 BOM-Toleranz des Parsers (T5)**
- **9.14 docs_review-Alternativprüfung (L5)**
**Verifikation:** `npm run typecheck` — fehlerfrei · `npm run test` — 255/255 Tests grün · `node scripts/pack-smoke.mjs` — OK (statisch, dynamischer Teil an H1 gekoppelt) · `docs_validate` — fund-frei

---

### Phase 10 — Review-Fixes, Distribution & Surface-Guardrail

**Umfang (Steps):**

- **10.1 Coverage-Gate-Rekursion fixen: Nested-Exclude + Output-Assert (R7)**
- **10.2 pack-smoke: Pfad-Quoting bei shell:true (R8)**
- **10.3 Build-Pipeline: tsc → dist in beiden Workspaces (H1/1)**
- **10.4 Manifests auf dist umstellen: exports/bin/files (H1/2, Content-Gate Mittel)**
- **10.5 Dynamischer Pack-Smoke + README-Install-Verifikation (H1/3)**
- **10.6 Surface-Guardrail als Decision verankern + README (M4)**
- **10.7 Coverage-Gate-Exit-Code robust stellen: Ursache klären + Gate Exit-unabhängig (R9, CI-Änderung = Gate Hoch)**
**Verifikation:** `npm run typecheck` — fehlerfrei · `npm run test` — 261/261 grün · Messartefakt klargestellt: PowerShell `$LASTEXITCODE` → vitest exit 1 bei Threshold-Verletzung (isoliert + verschachtelt) — Gate validiert, kein CI-Edit nötig

---

### Phase 11 — Methoden-Sync: Mess-Lesson

**Umfang (Steps):**

- **11.1 Sync-Schlag: Lesson #18 (Exit-Codes mit Host-Sprache messen) in beiden LESSONS-Kopien (G4)**
**Verifikation:** Lesson #18 in beiden Kopien textgleich (SHA256 D40FA413F3A4F42D7BEF2806B5BA6FB5CEED0C70FEE86AE03B8351133530924B; method-docs@6152eb6, internal-pwa@0e5a64c) — Verifikation: npm run typecheck && npm run test (261/261 grün), docs_validate clean (checkpoint: 6152eb6)

---

### Phase 12 — Token-Ökonomie: kompakte Outputs + Runden-Ersparnis

**Umfang (Steps):**

- **12.1 Kompakt-JSON + structuredContent-Opt-in (E1/1)**
- **12.2 backlog_list-Feldprojektion + Plan-Detailstufe (E1/2)**
- **12.3 docs_status: nextStepScope-Include (E2/1)**
- **12.4 progress_update: Multi-Step (E2/2)**
- **12.5 Hash-Kurzschluss: SHA256 in Read-Tools + Resources (E2/3)**
- **12.6 Phase-Kontext-Resource: Items zur Lesezeit mergen (G5)**
**Verifikation:** npm run typecheck && npm run test — beide grün (297/297). Test-Commit e1bd5c1 (ROT: 3), Fix-Commit f9f0e3b.

---

### Phase 13 — Naming-Refactor: STEPWELL durchgängig

**Umfang (Steps):**

- **13.1 Manifests + Lockstep + packaging-Tests (N1/1)**
- **13.2 TOOL_NAME + Resource-URI-Schema (N1/2)**
- **13.3 Doku + Decision + CHANGELOG (N1/3)**
- **13.4 Repo-Rename — explizites Gate (N1/4)**

**Rename-Sequenz (User-Aktionen, zwischen Sessions):**

1. **Ordner moven** — `D:\Development\method-docs` → `D:\Development\stepwell-tool`
   (in einer **frischen** PowerShell, nicht in dieser laufenden Session — der
   Shell-CWD + alle MCP-Tool-Calls zeigen sonst ins Leere).
2. **GitHub-Repo umbenennen** (Settings → General → Repository name).
3. **Remote-URL aktualisieren:**
   `git remote set-url origin <neue-url>` (im neuen Pfad).
4. **Push verifizieren:** `git push --follow-tags` (sollte ohne Konflikte gehen,
   weil die Inhalte gleich sind — nur der Pfad ändert sich).
5. **Neue Session am neuen Pfad öffnen.**
6. **Verifizieren:** `npm install && npm run typecheck && npm test` (308/308 grün),
   `node packages/mcp/src/cli.ts validate --root .` (fund-frei).
7. **13.4 abschließen:** `progress_update` Phase 13 Step 13.4 → ✅
   (Checkpoint = letzter 13.4-Commit).
8. **N1 archivieren:** `archive_item` N1 mit Note = Commit-Hashes der
   13.1–13.4-Commits (`ff6a996`, `bdc9a74`, `f94832f`, `e077599`).
9. **Phase 13 final abschließen:** `progress_update` mit letztem 🔄-Step der
   Phase → Block wandert verbatim ins `PROGRESS_ARCHIVE` (Verifikations-Zeile
   mit `checkpoint: <sha>`).

**Falls Schritt 1–4 zwischen Sessions nicht durchführbar sind:** 13.4 bleibt 🔄,
N1 bleibt 🟡, Phase 13 bleibt in „Laufende Phasen" — kein Verlust, keine
Drift. Die nächste Session am **alten** Pfad kann den Rename dann später
nachholen oder einen anderen Pfad wählen.

---

### Phase 14 — Sprach-Umstellung: Englisch primär

**Scope (Steps):**

- **14.1 Konventions-Flip: PLAYBOOK §2/§3 + Decision 10 (I1/1)**
- **14.2 Offene Dateien beider Repos auf EN-Struktur (I1/2)**
- **14.3 core: detectLocale-Gleichstand + EN-Templates (I1/3)**
- **14.4 Messages + Tool-Beschreibungen + CLI-Help EN (I1/4)**
- **14.5 Fixtures-README EN + gemischtsprachige Fixture (I1/5)**
- **14.6 STRUCT_LOCALE-Entscheid + CHANGELOG (I1/6)**
**Verifikation:** Decision: silent tolerance (no STRUCT_LOCALE warning); AGENTS.md Decision 10 + fixtures README updated; CHANGELOG.md Phase-14 EN entry with contract note (message texts change, schema stays 1); new regression test asserts STRUCT_LOCALE absence.

---

### Phase 15 — Methoden-Sync: Kickoff-Fast-Pfad

**Scope (Steps):**

- **15.1 Fast-Pfad + Parallel-Reads in beiden Kopien (E3)**
**Verifikation:** Verifikation: npm run typecheck && npm run test — 316/316 grün · SHA256-Beleg: PLAYBOOK beider Kopien 6273d4fd643256fb9159603bc4b2dd7f7c327a5edaf781a8f1836826245a73c4, LESSONS beider Kopien d40fa413f3a4f42d7bef2806b5ba6fb5ceed0c70fee86ae03b8351133530924b (unverändert textgleich) · docs_validate: keine neuen Funde (internal-pwa nur dokumentierte Alt-Funde L1–L11/DATE_LEGACY/PRIO_MISSING) (checkpoint: 255f0b3)

---

### Phase 16 — Method-Docs EN Migration

**Umfang (Steps):**

- **16.1 PLAYBOOK.md DE → EN + Snapshot (I3)**
- **16.2 LESSONS.md DE → EN + Snapshot (I3)**
- **16.3 AGENTS Decision 10 wording schärfen (I3)**
- **16.4 README.md DE → EN (I2)**
- **16.5 BRAINSTORM.md → EN + CHANGELOG trailing (I3)**
**Verification:** Verification: npm run typecheck && npm run test — 316/316 green (260911/1823) · docs_validate: no new findings in any step · Phase commits: 16.1@dfc271c, 16.2@6ee2d34, 16.3@b339f94, 16.4@36b8ea4, 16.5 BRAINSTORM EN + CHANGELOG trailing with the archive commit · no internal-pwa sync by design (S1 documents the drift). (checkpoint: 36b8ea4)

---

### Phase 17 — B1 Linux build fix

**Umfang (Steps):**

- **17.1 baseUrl for paths in both MCP-tsconfigs + guard test + BUILD doc (B1)**
**Verification:** Verification: npm run typecheck && npm run test — 317/317 green (incl. guard test, RED evidence in 5408c3b) · CI run 34624130478 (commit e3c4e49): verify ✅ + pack-smoke ✅ on ubuntu-latest Node 24 · Commits: 5408c3b (RED test), 9b4262f (baseUrl), c65f9db (BUILD.md), 0a3c4b8+bd2aad4 (diagnosis), e3c4e49 (npm ci fix, gate approved) (checkpoint: e3c4e49)

---

### Phase 18 — Review follow-ups

**Umfang (Steps):**

- **18.1 M9: multi-step progress_update — validate-before-write + detail handling (Review Findings 1+2)**
- **18.2 L11: EN surface gaps — warnings, zod descriptions, resources, stale comment, README count, CHANGELOG note (Review Findings 3+4+6)**
- **18.3 L12: consolidate step-prefix regex + phaseContext re-parse + duplicate imports (Review Findings 5+6)**
**Verification:** Verification: npm run typecheck && npm run test — 318/318 green (260911/1923) · Refactor behavior-identical, tests unchanged · scopeStepOf/scopeEntryFor as single regex source (4 variants removed); resolveItem via memoized ProjectDocs; duplicate imports merged. (checkpoint: de70733)

---

### Phase 19 — Completion & validate hardening

**Umfang (Steps):**

- **19.1 H2 RED: regression fixture + failing test — multi-step completion with already-✅ steps before and after the open step**
- **19.2 H2: batch-wide completion detection — archive exactly once, verification.ok=true, no false failure (approach fixed at release)**
- **19.3 M10: archive ordering — decision documented (README/AGENTS) + fixture test (append-chronological vs insert at phase-number position)**
- **19.4 L13 RED: acknowledgement fixture + failing test — acknowledged finding → ok:true, counted separately**
- **19.5 L13: acknowledgement mechanism (no new tool) + README/PLAYBOOK validate chapter**
**Verifikation:** npm run typecheck && npm run test — both green (324/324); coverage above thresholds (core 96.9/88.6/99.1/96.9, mcp 95.5/85.0/100/95.5). RED a2f659f+e127bb7 → fix a5a6e11. H2 (multi-step batch completion, fixture project-h-completion-order), M10 (append-only ordering, Decision 19), L13 (inline accepted marker, fixture project-i-acknowledged); PLAYBOOK sync rooted as S2. (checkpoint: a5a6e11)

---

### Phase 20 — K1: progress_update block boundary (mixed line endings)

**Umfang (Steps):**

- **20.1 [K1] RED: adjacent detail blocks + mixed EOL regression fixture/test — span misalignment reproduces the wrong block boundary**
- **20.2 [K1] FIX: align mutation line splitting with the parser (mutations.ts, 8 sites) — span line numbers stay aligned**
- **20.3 [K1] Verification: full suite + docs_validate green, no manual repair; archive K1**
**Verifikation:** typecheck grün · 326 Tests (2 neue K1-Regressionstests) · mixed-EOL-Repro (stadtpfad-Struktur) jetzt archiveOk=true · docs_validate ohne neue Findings

---

### Phase 21 — Q1: Quick-Start entry document

**Umfang (Steps):**

- **21.1 [Q1] docs/QUICKSTART.md (what STEPWELL is, core loop, the four files, the five rules, PLAYBOOK as full reference)**
- **21.2 [Q1] README link + EN surface check + verify, archive Q1**
**Verifikation:** docs/QUICKSTART.md (Kernschleife, vier Dateien, fünf Regeln, PLAYBOOK-Verweis) + README-Link · 326 Tests grün · PLAYBOOK unverändert

---

### Phase 22 — Q3: ISO 8601 timestamps

**Umfang (Steps):**

- **22.1 [Q3] PLAYBOOK §3 + AGENTS Decision 11: ISO 8601 canonical for new entries**
- **22.2 [Q3] core: stampNow → ISO 8601, silent tolerance for YYMMDD/HHMM + MM/YYYY, DATE_LEGACY both legacy forms (open files only)**
- **22.3 [Q3] Tests: stamp format, parse tolerance, DATE_LEGACY scope (open vs archive)**
- **22.4 [Q3] PLAYBOOK sync to internal-pwa + SHA256 proof, verify, archive Q3**
**Verifikation:** PLAYBOOK §3 + AGENTS Decision 11 auf ISO 8601 · stampNow ISO · DATE_LEGACY für beide Alt-Formate (nur offene Dateien) · Fixtures auf ISO migriert · PLAYBOOK-Kopien textgleich (sha256 91498231a452906fdde8c61d67bdf336f963a3571400a608b3499cae255977c1) · typecheck + 329 Tests grün · validate beide Repos ohne neue Findings

---

### Phase 23 — Q2/S2/Q4: method documentation consolidation

**Umfang (Steps):**

- **23.1 [Q2] PLAYBOOK: periodic method retrospective section (every N phases; three guiding questions; stay/demote/drop outcomes)**
- **23.2 [S2] PLAYBOOK: intentionally accepted findings (inline marker syntax, effect on ok, archives exempt)**
- **23.3 [Q4] AGENTS.md: consolidate decisions to ≤12 active (historical facts + PLAYBOOK duplicates → archive/reference)**
- **23.4 [Q2/S2] PLAYBOOK sync to internal-pwa + SHA256 proof**
- **23.5 [Q2/S2/Q4] Verification: typecheck + tests + docs_validate in both repos, archive Q2/S2/Q4**
**Verifikation:** typecheck grün · PLAYBOOK §8 Methoden-Retrospektive + Abschnitt „Intentionally accepted findings" · AGENTS Decisions 19→12 (Umzug nach docs/archive/AGENTS-decisions-history.md, kein Verlust) · Kickoff/Stack entstaubt · PLAYBOOK-Kopien textgleich (sha256 3b481dcda574cf611a7b4e91ac825f8788c2b1b0188a5cf9cbce0de2c7dd34be) · validate beide Repos ohne neue Findings

---

### Phase 24 — M11: PLAYBOOK §2 language-tolerance drift

**Umfang (Steps):**

- **24.1 [M11] PLAYBOOK §2: replace the claimed STRUCT_LOCALE warning with silent tolerance (Decision I1/14.6) in both copies + SHA256 proof**
- **24.2 [M11] Verification: docs_validate both repos without new findings; archive M11**
**Verifikation:** PLAYBOOK §2: behauptete STRUCT_LOCALE-Warnung → stille Toleranz gem. Decision I1/14.6 · beide Kopien textgleich (sha256 6464d1116ab6ada3fad3afe05a5046dd17d01e5220845d5a32dc1469aba39f9c) · validate beide Repos ohne neue Findings (stepwell: keine; stadtpfad: nur 3 Bestands-Findings)

---

### Phase 25 — Consumer Protection

**Umfang (Steps):**

- **25.1 [H3] Decision 13 + docs/CONSUMERS.md (split model, promotion ritual, inventory)**
- **25.2 [H4] Contract tests: tools/list input-schema lock + serve.ts path lock**
- **25.3 Verification + first promotion (merge dev→main, build, field probe)**
**Verifikation:** Field probes green against both live consumers (internal-pwa 954/961, internal-consumer 279/283 with running phase 65 — zero warnings each, via MCP + dev CLI). First promotion executed per Decision 13 ritual. (checkpoint: 14eb7ca)

---

### Phase 26 — Workstream-Worktrees (Git-Satellit)

**Goal:** Git-Satellit gem. Decision 14/H5 — Pull/Push-Sync je Step (Worktree des eigenen Workstream ↔ Stamm), Push-Prüfpflicht (Trunk-Kopf ∈ Vorfahren), saubere Konflikt-Aborts mit strukturierter Liste, Overlap-Warnung + Aktivitätsbericht aus Git; Commit-Automation für die vier Doku-Dateien (`--commit`); CLI-first (Skill-Ernährung), MCP-optional; core bleibt git-blind.

**Acceptance (je Step test-first):** `npm run typecheck` + `npm run test` grün, `docs_validate` clean; 26.7 = Feldtest: M12+M13 als zwei echte parallele Workstreams in diesem Repo (Feldtest-Leiter gem. Decision 14 — Fixtures → eigenes Repo → erst danach unkritisches Projekt; internal-pwa bleibt ausgenommen), Abschluss: M12+M13+H5 archiviert.

**Scope (Steps):**

- **26.1 Satellite package + pull (guards, conflict abort, docs_validate post-merge) [H5]**
- **26.2 Push (precondition, re-pull loop, trunk guards) [H5]**
- **26.3 Commit automation: commit param on progress_update/archive_item, CLI --commit (four docs only) [H5]**
- **26.4 Activity report + overlap warning (read-only git analysis) [H5]**
- **26.5 MCP transport: sync tool + commit param, contract tests (MINOR) [H5]**
- **26.6 Docs: README architecture/ritual, SKILL ritual CLI-first, QUICKSTART pointer, CHANGELOG [H5]**
- **26.7 Dogfood field test: M12+M13 as two parallel workstreams in this repo; archive M12+M13+H5 [H5]**
**Verifikation:** Dogfood field test: M12 (workstream ws/m12: RED 34ddb4b -> GREEN 63d119c, archive + push) and M13 (workstream ws/m13: RED -> GREEN 07072fd, archive + push) ran as two parallel worktrees through the new mechanics - sync status/pull/push, --commit automation, activity report; trunk found the leaked mkdirSync fix the worktrees were missing (2e30b74). Suites green in both merged worktrees (385/385, 386/386), trunk 386/386, docs_validate clean. Verification: npm run typecheck && npm run test (386/386) + docs_validate OK

---

### Phase 28 — Leak-Purge (öffentliches Repo häuten)

**Umfang (Steps):**

- **28.1 Relocate internal docs, anonymize references, history purge (files + name scrub incl. messages), force-push, resync frozen dir [K2]**
**Verifikation:** K2 executed: internal docs relocated to stepwell-internal/ (+ pre-purge backup bundle), AGENTS references privatized, history purge via git-filter-repo in two passes (file removal: docs/CONSUMERS.md + docs/feldtest-stadtpfad-pwa.md; text scrub stadtpfad-pwa->internal-pwa, datacraft->internal-consumer, session-recorder->internal-recorder, finnland-reiseapp->internal-app-1, Finnland 2026->internal-app-2, jpeg-tunnel->internal-app-3 across blobs AND commit messages). Verified: file history empty, pickaxe zero, messages zero; generic Stadtpfad lineage kept. Force-pushed dev (8eae5a2) + main (d20ff2d), frozen dir resynced to rewritten main. Known cost documented: all pre-rewrite SHA references resolve only via the backup bundle. Verification: npm run typecheck && npm run test + docs_validate green; git log --all checks clean

---

### Phase 27 — Phase 27 — Sammel-Batch: Hygiene & Workstream-Härtung

**Goal:** Automatische Hygiene aus dem Dogfood-Fund (11/2026): kein stiller Plattenmüll mehr — Test-Fixtures räumen ihre Worktree-Paare vollständig auf (T7), `workstreamReport` erkennt Husk-Dirs automatisch und das Ritual verifiziert das Aufräumen (M16).

**Acceptance (je Step test-first):** `npm run typecheck` + `npm run test` grün; 27.3 belegt Sweep vorher/nachher = 0 neue `%TEMP%/stepwell-*`-Dirs; `docs_validate` clean; T7+M16 archiviert.

**Scope (Steps):**

- **27.1 Central temp-dir hygiene in test fixtures — registered pair cleanup, no-op afterEach removed, sweep evidence [T7]**
- **27.2 Husk detection in workstreamReport (husks[] for deregistered dirs) + ritual verify/prune note in SKILL/README [M16]**
- **27.3 Verification: sweep before/after full suite = 0 new dirs, suite green; archive T7+M16 [T7/M16]**
- **27.4 Empty-marker invariant: backlog_add removes placeholder, last-removal restores it, validate EMPTY_MARKER_STALE + fixture [H6]**
- **27.5 SCOPE_ROW_MISSING validate finding: table row without detail-block scope entry [M17]**
- **27.6 Pull auto-resolution for deterministic doc conflicts (archive appends, timestamp order, docs_validate gate) [H7]**
- **27.7 .gitattributes text eol=lf for doc files + adoption hint in README [L14]**
- **27.8 CLI: --root defaults to CWD + sync status single-tree setup hint [L15]**
- **27.9 PLAN_WITHOUT_WIP sharpening: purely planned phase = PHASE_PLANNED warning (ok stays true), orphaned block stays finding [M18]**

---

### Phase 29 — Findings batch: phase matching, suite stability, rename guard

**Goal:** Die drei Funde aus Phase 27 umsetzen, bevor die Promotion startet (keine technischen Schulden): `phaseMatches` toleriert reine Phasennummern und der Skeleton-Fallback wird scharfgestellt (H8), die Windows-Suite-Flakes werden an der Ursache behoben (M19), der Title-Rename bekommt den Präfix-Guard (L16).

**Acceptance (je Step test-first):** `npm run typecheck` + `npm run test` grün; M19-Abnahme: wiederholte Full-Runs ohne Fehlalarm, 0 geleakte `%TEMP%`-Dirs, keine Subprocess-Noise; `docs_validate` clean; H8/M19/L16 archiviert; Doc-Sync (CHANGELOG/README/SKILL) vor dem Abschluss-Flip.

**Umfang (Steps):**

- **29.1 progress_update: bare phase number matches "Phase <N>" + refuse phantom skeleton when the step already has a table row [H8]**
- **29.2 suite stability: diagnose Windows worker-load flakes (git subprocess + coverage gate), fix at the cause, no suppressed warnings, no leaked temp dirs [M19]**
- **29.3 progress_update --title: duplicate "Phase <N> —" prefix guard [L16]**
- **29.4 Verification: typecheck + full suite + docs_validate clean; doc-sync (CHANGELOG/README/SKILL); archive H8/M19/L16; phase completion**
**Verifikation:** Verification: npm run typecheck (green) && npm run test (415/415, 42 files) x 10 consecutive full runs, all exit=0, stderr-free, 0 %TEMP% litter; docs_validate clean before completion; L16 dogfood: full heading as --title lands without prefix doubling (checkpoint: 8f25345)

---

### Phase 30 — Validator repair path + workstream foresight: docs_repair, files[], idCollisions, dependencies, position

**Goal:** YOLO-Batch (Entscheid Nutzer 11/2026): alles Code-hafte der offenen Items, das keine Nutzer-Entscheidung braucht — H9 als kompatibilitäts-erhaltenden Tool-Split (`docs_repair` statt fix-Parameter; `docs_validate` bleibt byte-identisch), H10 (`files[]` + `predictedOverlap`), M20 (`idCollisions` + `considerWorktrees`, Default byte-gleich), M21 (toleranter Depends-on-Bullet + `ready`-Filter, keine Semantik-Änderung), L17 (`position`-Parameter). L18 (Bedarfsbeleg = Nutzer-Entscheid) und L19 (kein Code) bleiben offen.

**Acceptance (je Step test-first):** `npm run typecheck` + `npm run test` grün; je repariertem Code: Fix entfernt genau diesen Fund und keinen anderen; dry-run-Defaults schreiben nichts; additiver Kontrakt (MINOR) mit byte-gleichen Default-Pfaden; Kompatibilitäts-Nachweis H9: H4-Eintrag + Annotations-Test unverändert grün, contract-tools nur erweitert; docs_validate clean; Items je Step archiviert; Doc-Sync vor dem Abschluss-Flip.

**Umfang (Steps):**

- **30.1 core: docsRepair orchestration over existing planners + new extraction planners (H6 marker removal, DATE_LEGACY YYMMDD/HHMM → ISO only, ARCHIVE_WITHOUT_INDEX index line after counting) — RED→GRÜN with project-b-drift + new fixtures [H9]**
- **30.2 transport: docs_repair MCP tool (DESTRUCTIVE_ANNOTATIONS, dryRun default true) + CLI repair command + contract-tools test extended ONLY with the docs_repair entry — docs_validate H4 lock + annotations test byte-identical green (compatibility proof) [H9]**
- **30.3 Verification H9: suite + docs_validate clean; archive H9 (phase completion follows at 30.8)**
- **30.4 H10: files[] from Location bullets (tolerant path extraction, no globs) + backlog_list fields extension + workstreamReport predictedOverlap (branch/trunk open-item file intersection, read-only) — overlap[] byte-identical [H10]**
- **30.5 M20: workstreamReport idCollisions (newly added IDs/steps in merge-base..branch ∩ merge-base..trunk) + optional considerWorktrees on backlog_add/progress_plan_phase (transport resolves via satellite, core stays git-blind, fallback with warning) — default path byte-identical [M20]**
- **30.6 M21: tolerant Depends-on bullet (union-matched synonyms) + derived dependsOn/blockedBy/ready + DEP_UNKNOWN warning + DEP_CYCLE finding + backlog_list ready filter + fields extension + fixture project-l-deps [M21]**
- **30.7 L17: position parameter (top/bottom/index) on backlog_update — byte-identical block move within section, section+position combination, out-of-range = structured error (documented in item close) [L17]**
- **30.8 Verification: typecheck + full suite + docs_validate clean; doc-sync (CHANGELOG/README/SKILL); phase completion with title/note/checkpoint**
**Verifikation:** Verification: npm run typecheck (green) && npm run test (456/456, 46 files) green && docs_validate clean; doc-sync BEFORE the completion flip (CHANGELOG Phase-30 section, SKILL tool mentions, README tool table); YOLO batch released by user — H9/H10/M20/M21/L17 implemented test-first (RED->GRÜN each), all archived with refined acceptance notes, F1 fixed via the inline-fix lane; L18 (needs need-evidence) + L19 (not code) stay open by design (checkpoint: 544f21b)
