# method-docs

CLI + MCP-Server zum **Lesen, Prüfen und Verwalten** der Projekt-Doku
(`BACKLOG.md`, `PROGRESS.md`, `docs/archive/*`) in Repos, die der
[STEPWELL-Methode](docs/PLAYBOOK.md) folgen — Steps, Archiv-Muster, Test-First.

**Status:** Sechs Phasen fertig. Phase 1 — Core-Library (fehlertolerante Parser,
Status-/Validierungs-Reports) · Phase 2 — MCP-Server + CLI (Read-Tools, Resources) ·
Phase 3 — Mutation (`archive_item`, `progress_update`, jeweils Dry-run + Apply) ·
Phase 4 — Locale-Profile (de/en, test-first) · Phase 5 — Server-Name `stepwell` ·
Phase 6 — Review-Fixes (Stale-Span, Synonym-Regexes, CRLF-Roundtrip, Stale-Check,
`STEP_DUPLICATE`) + Tool-CRUD (`backlog_add/update/remove`, `progress_plan_phase`,
CLI-ASCII-Aliase, `title`-Parameter).
Aktueller Stand und Step-Historie: [`PROGRESS.md`](PROGRESS.md).

---

## Prinzip

1. **Markdown bleibt Source of Truth.** Das Tool liest, validiert und assistiert —
   es ersetzt die Doku nicht. Geht die Doku verloren, sind keine Daten verloren.
2. **Fehlertoleranz statt Abbruch.** Projekte folgen der Methode, nicht byte-genau:
   Struktur-Drift wird als **strukturierte Warnung** gemeldet (`ParseResult<T>` mit
   `warnings[]`), nie als Crash. Jedes Teil-Ergebnis bleibt abfragbar.
3. **Dry-run zuerst.** Die beiden schreibenden Tools (`archive_item`,
   `progress_update`) liefern standardmäßig einen **Plan mit Diff-Vorschau**;
   geschrieben wird erst mit `dryRun: false` bzw. `--apply` — danach wird das
   Ergebnis frisch geparst und verifiziert.
4. **Enge Grenze für Schreibzugriffe.** Die fehleranfälligen, strukturellen
   Operationen automatisiert das Tool (verbatim-Verschiebung, Erledigt-Index,
   Statuszellen, Item-CRUD, Phasen-Planung). Alles andere (Prosa, Ziel-/Abnahme-
   Texte) editieren Menschen/Agenten direkt in den Markdown-Dateien.
5. **Multi-Projekt.** Der Projekt-Root wird **je Tool-Call bzw. CLI-Aufruf**
   übergeben — eine Server-Instanz bedient beliebig viele STEPWELL-Projekte.

**Datei-Pflicht:** Alle vier Dateien sind Pflicht —
`BACKLOG.md`, `PROGRESS.md`, `docs/archive/BACKLOG_ARCHIVE.md`,
`docs/archive/PROGRESS_ARCHIVE.md`. Fehlt eine, lädt das Projekt nicht
(harter Fehler mit klarer Meldung).

**Format-Legende** (kanonisch: [PLAYBOOK](docs/PLAYBOOK.md) §3 + §7):

| Symbol | Bedeutung | ID-Serie |
|--------|-----------|----------|
| 🔴 kritisch · 🟠 hoch · 🟡 mittel · 🟢 niedrig | Backlog-Priorität = Sektion | `K`/`H`/`M`/`L` (Auto-Nummerierung) |
| 🔵 Test-Lücke | Backlog-Priorität = Sektion | keine Serie — explizite ID Pflicht |
| ⬜ offen · 🔄 in Arbeit · ✅ fertig · ⛔ blockiert | Step-Status in `PROGRESS.md` | Steps `<Phase>.<x>` (z. B. `7.2`) |
| weitere Serienbuchstaben (`R`, `T`, `D`, …) | thematische Serien, nicht prioritätsgebunden | fortlaufend, nie wiederverwendet |

---

## Anforderungen & Setup

- **Node.js ≥ 22.18** — das Repo verteilt TypeScript-Source und nutzt das native
  Type-Stripping von Node (kein Build-Schritt).

```bash
npm install
npm run typecheck   # strict, deckt src UND tests ab
npm run test        # Vitest, protokollecht gegen die Fixtures
npm run test:watch
```

---

## MCP-Server

Server-Name `stepwell` (Transport **stdio**, Entry `packages/mcp/src/serve.ts`).

Dieses Repo bindet den Server bereits in `opencode.json` ein (nach Änderungen an
der Config opencode **neu starten**). Für andere MCP-Clients (Claude Desktop,
Cursor, …) das gleiche Muster:

```json
{
  "mcp": {
    "stepwell": {
      "type": "local",
      "command": ["node", "/pfad/zu/method-docs/packages/mcp/src/serve.ts"],
      "enabled": true
    }
  }
}
```

Manuelle Verifikation mit dem Inspector:

```bash
npx @modelcontextprotocol/inspector node packages/mcp/src/serve.ts
```

Die Test-Suite deckt denselben Protokoll-Pfad automatisiert ab
(`InMemoryTransport` + Client, plus ein echter stdio-Handshake-Test).

### Distribution (zwei Kanäle)

1. **MCP-Server:** `npx @method-docs/mcp` (bzw. `serve.ts`) — operativ, Tools wie unten.
   Das veröffentlichte Package shippt **kompiliertes `dist`** (seit 10.4/H1) und ist damit
   direkt aus `node_modules` lauffähig — `prepublishOnly` baut vor dem Publish.
2. **SKILL.md:** `packages/mcp/skills/stepwell/SKILL.md` (liegt im npm-Pack) —
   portabler Wegweiser für Skill-Ökosysteme (Claude Skills, Gemini CLI, …): wann
   welches Tool, Gates (Freigabe/Content), Test-First, Statuspflege nur via Tools.
   Er ersetzt weder MCP-Server noch PLAYBOOK.md — beides bleibt bindend.

### Tools

Alle Tools nehmen `root` (absoluter Pfad zum Projekt-Root) **pro Call**. Alle JSON-Text-Payloads
sind **kompakt** (ohne Einrückung — Token-Ökonomie, E1). `docs_validate`,
`progress_update` und `archive_item` liefern ihre Daten **zusätzlich** als
`structuredContent` nur auf Opt-in mit `structured: true` (M3/9.7, Dedupe seit E1 —
Default ist nur Text); Fehlerantworten (`isError: true`, inkl. `PROJECT_NOT_INITIALIZED`)
tragen kein `structuredContent`.
Fehler (fehlende Pflichtdatei, unbekannte ID/Phase) liefern `isError: true`
mit klarer Meldung — der Server stürzt nicht ab.

#### Lesen

| Tool | Parameter | Ergebnis |
|------|-----------|----------|
| `docs_status` | `root`, optional `include[]` | Aggregat: offene Items je Priorität, 🔄-Steps + zugeordnete Phasen, ✅-Quote der Tabelle, alle Funde + Warnungen, `hashes` (SHA256 je Doku-Datei, E2); mit `include: ["nextStepScope"]` (E2) zusätzlich Ziel/Abnahme/Scope-Bullet + gemergtes Backlog-Item des nächsten Steps (1 Call statt `progress_show` + `backlog_show`) |
| `backlog_list` | `root`, optional `priority[]`, `open`, `section`, `fields[]` | Items der BACKLOG.md **ohne `raw`** (schlanker Payload) + Parse-Warnungen; mit `fields` (z. B. `["id","title","priority","open","section"]`) sind Items auf die genannten Felder projiziert (Token-Ökonomie, E1) |
| `backlog_show` | `root`, `id` | Merge-Sicht für eine Item-ID über offenes BACKLOG ↔ Erledigt-Index ↔ BACKLOG_ARCHIVE, inkl. `raw` + `span`; case-sensitiv |
| `progress_list` | `root`, optional `status` | Zeilen der Fortschrittstabelle `{step, name, status}` |
| `progress_show` | `root`, `phase` | Detail-Block inkl. `raw` — Suche über laufende Phasen **und** Archiv (Name, Titel oder `Name — Titel`) |
| `docs_validate` | `root`, optional `structured` | Validate-Funde (Konsistenzregeln) + eingesammelte Parse-Warnungen, `ok` |

#### Schreiben (Dry-run + Apply)

| Tool | Parameter | Verhalten |
|------|-----------|-----------|
| `archive_item` | `root`, `id`, optional `note`, `locale`, `structured`, `detail`, `dryRun` (**Default `true`**) | Plant die **verbatim-Verschiebung** eines Items: Block (span-basiert) aus BACKLOG.md entfernen, im Archiv-Exemplar Checkbox → `[x]`, optionaler `note` wird Erledigt-Zeile; dazu Einzeiler `- <ID> — <Titel> — erledigt (note?)` am Ende des Erledigt-Index. Apply verifiziert frisch: ID weg aus offen, im Archiv + Index, keine Funde mehr. Das ist das Gegenmittel zum Validate-Fund `NOT_ARCHIVED` (D2). |
| `progress_update` | `root`, `phase`, `step` (String **oder String[]** für Multi-Step in einem Call, nur mit `dryRun: false`), `status` (`⬜🔄✅⛔`), optional `title`, `note`, `checkpoint` (Commit-SHA, 7–40 Hex), `locale`, `structured`, `detail`, `dryRun` (**Default `true`**) | Setzt die Statuszelle(n) der Steps (fehlende Zeilen werden ergänzt, Name aus dem Scope-Bullet abgeleitet); legt bei 🔄 ein Detail-Block-Skelett unter „Laufende Phasen" an (`### Phase …` + `**Umfang (Steps):**` + Step-Bullet — **keine** erfundenen Ziel-/Abnahme-Texte); `title` benennt den Block-Heading konsistent um (Rename → Archivierung im selben Call ist definiert); ist danach kein Step der Phase mehr 🔄/⬜, wandert der Block **verbatim** ins PROGRESS_ARCHIVE (`note`/`checkpoint` → Verifikations-Zeile, Antwort enthält den Doku-Sync-Reminder) — bei Step-Arrays wird der Abschluss automatisch am letzten Step erkannt. Apply verifiziert Zeile, Block-Wanderung und `docs_validate`. |
| `backlog_add` | `root`, `section`, `title`, `priority` (`🔴🟠🟡🟢🔵`), optional `id`, `text`, `detail`, `dryRun` | Legt ein offenes Item am **Ende der Ziel-Sektion** an: ID mit Konventionsprüfung (`^[A-Z][0-9]+$`), Auto-Vergabe = nächste freie Nummer der Prioritäts-Serie (K/H/M/L; 🔵 erfordert explizite ID), `text`-Bullets verbatim, `Stand:`-Zeitstempel im Heading wird aktualisiert. |
| `backlog_update` | `root`, `id`, optional `title`, `priority`, `section`, `text`, `detail`, `dryRun` | Ändert Titel/Priorität/Text/Sektion im Block-Format (Span-Neuberechnung, Checkbox- und `*(…)*`-Suffix bleiben erhalten). Prioritätswechsel verschiebt den Block in die passende Prioritäts-Sektion. |
| `backlog_remove` | `root`, `id`, optional `note`, `locale`, `detail`, `dryRun` | **Kein Hard-Delete:** Block wandert verbatim ins BACKLOG_ARCHIVE (Checkbox bleibt `[ ]`, optional `note` → `**Entfernt:**`-Zeile), im Erledigt-Index erscheint ein Tail ohne Erledigt-Marker (`- <ID> — <Titel> — entfernt (note?)`). `docs_validate` meldet Checkbox-`[ ]`-Blöcke bewusst **nicht** als `ARCHIVE_WITHOUT_INDEX`. |
| `progress_plan_phase` | `root`, `phase` (`"Phase <N>[ — Titel]"`), `steps: [{step, name}]`, optional `detail`, `dryRun` | Plant eine Phase **voraus**: Tabellen-Zeilen für alle Steps (`⬜`, mit Namen) + Detail-Block-Skelett mit vollständigem Scope. Validiert Step-Präfix (`Phase 7` → `7.x`), Duplikate und belegte Phasen/Steps. `PLAN_WITHOUT_WIP` ist bis zum ersten 🔄 der definierte Zustand. |

**Antwortformate:** Dry-run liefert den Plan `{dryRun, changes:[{file, description,
before, after, diff}]}`; Apply liefert `{written, verification:{ok, messages}}`.
Mit `detail: "summary"` (E1) werden Dry-run-`changes` auf `{file, description,
beforeLines, afterLines}` + Top-Level-Marker `detail: "summary"` projiziert —
Default bleibt `"diff"` mit voller Vorschau (Sicherheitshinweis unangetastet).

### Mehrsprachigkeit (Locale-Profile)

Die Doku-Dateien können **deutsch oder englisch** formatiert sein — gemischt im
gleichen Repo ist verboten, pro Projekt gilt eine Sprache. Das Tool trennt dabei:

- **Lesen: immer sprachtolerant (zero-config).** Parser und Validator erkennen die
  Rollen-Marker beider Sprachen per Union-Matching — `Erledigt-Index|Done Index`,
  `Ort|Location`, `erledigt|done`, `Ziel|Goal`, `Abnahme|Acceptance`,
  `Verifikation|Verification`, `Umfang|Scope`, `Fortschritt|Progress`,
  `Laufende Phasen|Active Phases`, `abgeschlossen|completed`, `Stand:|As of:`.
- **Schreiben: `locale`-Option** auf `archive_item` und `progress_update`/
  `backlog_remove` (`"de" | "en"`; Default = **Auto-Erkennung** aus dem
  Datei-Kontext, Gleichstand → `de`). Generierte Texte (Index-Zeile,
  Erledigt-/Verifikations-/Entfernt-Marker, Skeletons) folgen der Ziel-Sprache;
  CLI-Äquivalent: `--locale de|en`.
- **Weitere Sprachen:** `packages/core/src/profile.ts` hält die Rollen-Synonyme —
  eine neue Sprache ist ein neuer Schlüssel je Rolle, kein Parser-Umbau.

### Resources (Resource-Templates)

Der Root wird **percent-encoded** als URI-Segment eingesetzt (Windows-Pfade
enthalten `:` und `\`); der Read-Callback dekodiert ihn. Inhalt jeweils verbatim,
`text/markdown`:

```
methoddocs://{root}/backlog          → BACKLOG.md
methoddocs://{root}/progress         → PROGRESS.md
methoddocs://{root}/archive/{kind}   → kind = "backlog" | "progress"
methoddocs://{root}/phase/{phase}    → Phasen-Kontext: Phase verbatim + Tabellen-Zeilen
                                       + gemergte Item-Bodies in Step-Reihenfolge (G5/12.6)
methoddocs://{root}/hashes           → SHA256 je Doku-Datei (application/json;
                                       Hash-Kurzschluss, E2/12.5 — Fast-Pfad-Fundament E3)
methoddocs://templates/{kind}        → Skeletons der vier Pflichtdateien
                                       (kind = "backlog" | "progress" |
                                        "backlog-archive" | "progress-archive")
```

**M4-Alternativprüfung (G5):** Resource statt Tool — der Phasen-Kontext ist reiner
Lese-Pfad, und die Komposition passiert **zur Lesezeit** statt als Duplikat in den
Dateien (Anti-Drift): ein Subagent bekommt Phase + Item-Bodies in einem Read, ohne
dass ein neues Tool die Surface vergrößert.

Beispiel: `methoddocs://D%3A%5Cproj%5Cdemo/backlog`

**Projekt-Init (M8, Variante A):** Bei neu angelegten Projekten liest der Agent die vier
Skeletons aus `methoddocs://templates/{kind}` und legt die Dateien damit selbst an —
bewusst **kein** `init_project`-Schreib-Tool (M4-Guardrail: Write-Surface klein halten);
die Skeletons liegen kanonisch in `@method-docs/core` (`projectTemplates`) und sind an
`docs_validate` fund-frei. Die Init-Fallback-Anleitung (`PROJECT_NOT_INITIALIZED`)
verweist auf diesen Weg.

---

## CLI

`packages/mcp/src/cli.ts` — im Workspace-Repo direkt ausführbar
(`node packages/mcp/src/cli.ts …`); aus dem installierten Package
(`npm i -g @method-docs/mcp` bzw. `npx @method-docs/mcp`) unter dem Bin-Namen
`method-docs`.
Menschliche Ausgabe auf stdout; `--json` liefert die core-Payloads mit vorangestelltem
Versionsfeld `schema` (aktuell **1**). Feldkontrakt je Command:

| Command | Felder (neben `schema`) |
|---------|--------------------------|
| `status` | `openByPriority`, `openTotal`, `runningSteps`, `runningPhases`, `doneQuote`, `nextStep`, `nextPriority`, `warnings` |
| `backlog` | `count`, `items[]` (ohne `raw`), `warnings` |
| `progress` | `count`, `rows[]`, `warnings` |
| `validate` | `findings[]`, `warnings[]`, `ok` |
| `archive` (Dry-run) | `root`, `id`, `dryRun`, `note`, `changes[]` |
| `archive --apply` | `written[]`, `verification{ok, messages[]}` |
| `progress-update` | wie `archive` plus `phase`, `step`, `status`, `title`, `completedPhase`, `checkpoint?` |

**Kontrakt-Regel (M6/Decision 16):** Breaking-Änderung an diesem Feldbestand ⇒
`schema` hochzählen (in Lockstep mit dem npm-MAJOR).

### Releases (Versionspolitik, L6)

- **Format:** [`CHANGELOG.md`](CHANGELOG.md) nach Keep a Changelog 1.1.0, `[Unreleased]`
  oben, kuratierte nutzerrelevante Aggregate. **Redundanz-Regel:** kein Git-Log-Dump,
  keine Duplikation von Erledigt-Index/BACKLOG_ARCHIVE — Item-/Commit-Historie bleibt
  in den STEPWELL-Dateien. Datumsformat `JJMMDD/HHMM` (Decision 11) statt ISO —
  dokumentierte Abweichung.
- **Lockstep-SemVer (Decision 16):** Root, `@method-docs/core` und `@method-docs/mcp`
  tragen immer dieselbe Version. MAJOR = Breaking im Tool-/JSON-/Resource-Kontrakt
  (immer zusammen mit dem `schema`-Feld), MINOR = neue Tools/Features, PATCH = Fixes.
  0.x bis zum bestandenen Feldtest; `1.0.0` = Freigabe-Moment.
- **Publish-Checkliste:** (1) `Unreleased` im CHANGELOG kuratieren, (2) Version in
  allen **drei** `package.json` bumpen (Lockstep), (3) CHANGELOG-Sektion `[<version>] - <JJMMDD/HHMM>`,
  (4) Git-Tag `v<version>`, (5) **nur** `@method-docs/mcp` publizieren
  (`npm publish --otp`, dist-tag `latest`; core wird als Abhängigkeit mit verteilt),
  (6) CI-Job `pack-smoke` muss grün sein — aktueller Stand: statische Checks, der
  dynamische Teil ist an den Dist-Blocker H1 (Build/dist-Schritt) gekoppelt.

```bash
# Status-Aggregat
node packages/mcp/src/cli.ts status --root <projekt> [--json]

# Backlog listen/filtern — Icons oder ASCII-Aliase (red/kritisch/p1, hoch/p2, mittel/p3, niedrig/p4, blue/test/p5)
node packages/mcp/src/cli.ts backlog --root <projekt> [--priority red,yellow] [--open false] [--section HOCH] [--json]

# Fortschrittstabelle — Status als Icon oder Alias (open, running/wip, done, blocked)
node packages/mcp/src/cli.ts progress --root <projekt> [--status done] [--json]

# Konsistenzprüfung (Exit 1 bei Funden — CI-tauglich)
node packages/mcp/src/cli.ts validate --root <projekt> [--json]

# Erledigtes Item archivieren (Dry-run-Vorschau, dann --apply)
node packages/mcp/src/cli.ts archive --root <projekt> --id H1 [--note "Commit abc1234"] [--locale en] [--apply]

# Step-Status pflegen (Dry-run-Vorschau, dann --apply) — --title benennt den Block-Heading um
node packages/mcp/src/cli.ts progress-update --root <projekt> --phase "Phase 2" --step 2.2 --status running [--title "Neuer Titel"] [--note "…"] [--checkpoint <sha>] [--locale en] [--apply]
```

Ungültige Werte liefern Exit 2 mit der Liste der erlaubten Aliase (z. B.
`🔴=red/kritisch/p1, …`, `⬜=open, 🔄=running/wip, ✅=done, ⛔=blocked`).

**Exit-Codes:** `0` Erfolg (bzw. keine Validate-Funde) · `1` Fehler bzw.
Validate-Funde · `2` Usage-Fehler (unbekanntes Kommando, fehlende Pflicht-Option).

---

## CI (optional)

Dieses Repo nutzt GitHub Actions (`.github/workflows/ci.yml`): install → typecheck
→ test (JUnit- + Coverage-Report als Artefakt) → `validate --root .` (Exit 1 bei
Doku-Funden schlägt den Job um).

**Für kleinere Projekte genügt der lokale Lauf** — die Pipeline ist Kanonen auf
Spatzen, wenn niemand auf sie schaut:

```bash
npm install && npm run typecheck && npm run test && node packages/mcp/src/cli.ts validate --root .
```

STEPWELL-Projekte können `ci.yml` als Vorlage kopieren; die Methode (PLAYBOOK)
verlangt keine CI.

---

## Warnungs-Codes

**Parse-Warnungen** entstehen beim Parsen einzelner Dateien (Drift-Toleranz),
**Validate-Funde** prüfen Querkonsistenz über Dateien hinweg (`docs_validate`
sammelt beides). Konventions-Warnungen betreffen **nur offene Dateien** — Archive
sind append-only und werden nie beanstandet. Ein UTF-8-BOM (U+FEFF) am Dateianfang
wird still toleriert (deterministisch gestrippt, T5/9.13) — keine Warnung.

| Code | Ebene | Bedeutung |
|------|-------|-----------|
| `PRIO_MISSING` | Parse | Kein Prioritäts-Suffix im Titel — Priorität aus dem Sektions-Emoji übernommen |
| `PRIO_DUPLICATE` | Parse | Mehrere Prioritäts-Marker im Titel — einer wird erfasst |
| `PRIO_UNKNOWN` | Parse | Unbekanntes Prioritäts-Emoji (z. B. 🟣) — `priority: "unknown"` |
| `BLOCK_UNSTRUCTURED` | Parse | Item ohne `**Label:**`-Bullets — Freitext als `text` erfasst |
| `TITLE_EMPTY` | Parse | Item-ID ohne Titel nach dem Trenner |
| `STATUS_UNKNOWN` | Parse | Unbekanntes Status-Icon in der Tabelle — `status: "unknown"` |
| `ROW_INCOMPLETE` | Parse | Tabellenzeile ohne Status-Spalte |
| `NOT_ARCHIVED` (D2) | Validate | `[x]`-Checkbox hängt noch im offenen BACKLOG → `archive_item` |
| `ID_DUPLICATE` (D5) | Validate | Item-ID kommt doppelt vor |
| `ID_CONVENTION` (D14) | Validate | ID verletzt `^[A-Z][0-9]+$` (Serienbuchstabe + Nummer) — Warnung, Item bleibt gelistet |
| `INDEX_WITHOUT_ARCHIVE` (D8) | Validate | Erledigt-Index-Eintrag ohne Archiv-Block |
| `ARCHIVE_WITHOUT_INDEX` (D13) | Validate | Erledigter Archiv-Block (`[x]`) ohne Erledigt-Index-Eintrag; entfernte Blöcke (Checkbox `[ ]`, via `backlog_remove`) sind bewusst indexlos |
| `WIP_WITHOUT_PLAN` (D11) | Validate | 🔄-Zeile ohne passenden Detail-Block |
| `PLAN_WITHOUT_WIP` (D12) | Validate | Detail-Block ohne 🔄-Step (verwaist oder via `progress_plan_phase` vorausgeplant) |
| `STEP_DUPLICATE` (R6) | Validate | Step-Nummer kommt doppelt in der Fortschrittstabelle vor — `progress_update` pflegt nur die erste Zeile |
| `DATE_LEGACY` (D15) | Validate | `MM/JJJJ`-Datum in offenen Dateien — kanonisch ist `JJMMDD/HHMM` (z. B. `260907/1523`) |
| `PROJECT_NOT_INITIALIZED` (M5) | Validate | Root ohne STEPWELL-Projekt (alle vier Dateien fehlen) — genau ein Fund mit Anleitung statt Fehler-Wüste; `docs_status` liefert den Zero-Aggregate + diesen Fund, Read-/Mutation-Tools eine strukturierte Fehlerantwort (`code`/`message`/`missing`). Teilbestand (einzelne Datei fehlt) bleibt harter Fehler pro Datei. Kontrakt-Ausnahme: `file` trägt hier den Projekt-Root (Verzeichnis), nicht einen Dateipfad |

---

## Typischer Workflow (Agent + method-docs)

```text
1. docs_status            → Wo stehen wir? Welche Prioritäten sind offen?
2. backlog_list --open    → Was ist als nächstes dran? (BINDEND: sequenziell nach Prio)
3. (Arbeit am Code, test-first — Prosa editiert der Agent direkt)
4. progress_plan_phase    → neue Phase vorausplanen (Zeilen + Scope-Skelett)
5. progress_update (🔄)   → Step begonnen: Tabelle + Detail-Block sauber halten
6. progress_update (✅)   → Step fertig; ist die Phase komplett, wandert der Block ins Archiv
7. backlog_add/update     → Items format-sicher anlegen/ändern (statt Hand-Edit)
8. archive_item           → erledigtes Item verbatim archivieren + Erledigt-Index
9. backlog_remove         → obsoletes Item ins Archiv verschieben (ohne Erledigt-Marker)
10. docs_validate         → muss clean sein, bevor committed wird
```

Die PLAYBOOK-Regeln (Sequenz, Test-First, Commit-Diskiplin, Archiv-Muster) stehen
in [`docs/PLAYBOOK.md`](docs/PLAYBOOK.md); die Review-Checkliste in
[`docs/LESSONS.md`](docs/LESSONS.md).

---

## Architektur

**Entwurfs-Regel (M4/Decision 17):** Die Tool-Oberfläche bleibt klein — Tools nur für
konkrete Struktur-/Lese-Operationen, keine Guide-/Meta-Tools; Methoden-Wissen lebt in
PLAYBOOK.md, SKILL.md und den Resources. Jedes neue Tool (oder neue Parameter-Fläche)
begründet den Surface-Zuwachs per **Alternativprüfung** (Parameter an ein existierendes
Tool/Resource statt neues Tool) — dokumentiert wie bei der docs_review-Entscheidung (L5).

```
packages/
├── core/                 @method-docs/core — Zero-Dependencies, keine MCP-Abhängigkeit
│   ├── src/backlog.ts    BACKLOG-Parser (Sektionen, Item-Blöcke, Erledigt-Index)
│   ├── src/progress.ts   PROGRESS-Parser (Tabelle, Detail-Blöcke) + scopeSteps
│   ├── src/archive.ts    Archiv-Parser (ArchiveItem = BacklogItem + doneLine)
│   ├── src/project.ts    loadProject (4-Datei-Pflicht, lazy + memoized), backlogShow
│   ├── src/status.ts     docsStatus (Aggregat)
│   ├── src/validate.ts   docsValidate (Konsistenzregeln + Parse-Warnungen)
│   ├── src/mutations.ts  plan/apply: archive_item, progress_update, backlog-CRUD, planPhase
│   ├── src/aliases.ts    ASCII-Aliase für Prioritäts-Emojis und Status-Icons (CLI)
│   ├── src/diff.ts       zeilenbasierter Mini-Diff für die Plan-Vorschau
│   ├── src/profile.ts    Locale-Profile: Rollen-Synonyme de/en (Lesen union, Schreiben kanonisch)
│   └── tests/fixtures/   project-a (sauber) + project-b-drift (Fälle D1–D15)
│                         + project-d-tablefirst (Tabelle vor Detail-Blöcken),
│                         README.md dort = arbeitende Spezifikation
└── mcp/                  @method-docs/mcp — dünne Transport-Schicht über core
    ├── src/server.ts     createDocsServer (alle Tools + Resources)
    ├── src/tools.ts      Tool-Registrierung (JSON-Payloads, isError-Kapselung)
    ├── src/resources.ts  Resource-Templates (percent-encoded Root)
    ├── src/serve.ts      stdio-Einstieg
    └── src/cli.ts        method-docs-Kommandozeile
```

- **Stack:** TypeScript (strict, `NodeNext`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`), npm workspaces, Vitest, MCP-SDK **v1.x stabil**
  (`^1.30.0`) + zod v3. Bewusst gegen Build-/Bundle-Schritte entschieden:
  Node ≥ 22.18 führt die TS-Source direkt aus (Type-Stripping), Import-Specifiers
  enden deshalb auf `.ts`.
- **Datenmodell:** `ParseResult<T> = { value, warnings[] }`,
  `Warning = { code, file, line?, message }` — Item-Blöcke tragen `span` (Zeilen)
  und `raw` (verbatim) als Basis der verbatim-Verschiebung.
- **Tests:** 188 Tests, Test-First entwickelt (ROT → GRÜN). Mutationen laufen in
  Tests **ausschließlich** gegen Temp-Kopien der Fixtures — die Originale sind
  read-only und werden per Test abgesichert.

## Entwicklung

```bash
npm install && npm run typecheck && npm run test   # Abnahme vor jedem Abschluss
npx vitest run packages/core                       # nur core
npx vitest run packages/mcp                        # nur MCP/CLI
```

Neue Features folgen der STEPWELL-Methode: Planen → in `PROGRESS.md` paketieren →
test-first implementieren → Verifikation → Commit → Status pflegen. Details:
[`AGENTS.md`](AGENTS.md).
