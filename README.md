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

### Tools

Alle Tools nehmen `root` (absoluter Pfad zum Projekt-Root) **pro Call**.
Fehler (fehlende Pflichtdatei, unbekannte ID/Phase) liefern `isError: true`
mit klarer Meldung — der Server stürzt nicht ab.

#### Lesen

| Tool | Parameter | Ergebnis |
|------|-----------|----------|
| `docs_status` | `root` | Aggregat: offene Items je Priorität, 🔄-Steps + zugeordnete Phasen, ✅-Quote der Tabelle, alle Funde + Warnungen |
| `backlog_list` | `root`, optional `priority[]`, `open`, `section` | Items der BACKLOG.md **ohne `raw`** (schlanker Payload) + Parse-Warnungen |
| `backlog_show` | `root`, `id` | Merge-Sicht für eine Item-ID über offenes BACKLOG ↔ Erledigt-Index ↔ BACKLOG_ARCHIVE, inkl. `raw` + `span`; case-sensitiv |
| `progress_list` | `root`, optional `status` | Zeilen der Fortschrittstabelle `{step, name, status}` |
| `progress_show` | `root`, `phase` | Detail-Block inkl. `raw` — Suche über laufende Phasen **und** Archiv (Name, Titel oder `Name — Titel`) |
| `docs_validate` | `root` | Validate-Funde (Konsistenzregeln) + eingesammelte Parse-Warnungen, `ok` |

#### Schreiben (Dry-run + Apply)

| Tool | Parameter | Verhalten |
|------|-----------|-----------|
| `archive_item` | `root`, `id`, optional `note`, `locale`, `dryRun` (**Default `true`**) | Plant die **verbatim-Verschiebung** eines Items: Block (span-basiert) aus BACKLOG.md entfernen, im Archiv-Exemplar Checkbox → `[x]`, optionaler `note` wird Erledigt-Zeile; dazu Einzeiler `- <ID> — <Titel> — erledigt (note?)` am Ende des Erledigt-Index. Apply verifiziert frisch: ID weg aus offen, im Archiv + Index, keine Funde mehr. Das ist das Gegenmittel zum Validate-Fund `NOT_ARCHIVED` (D2). |
| `progress_update` | `root`, `phase`, `step`, `status` (`⬜🔄✅⛔`), optional `title`, `note`, `locale`, `dryRun` (**Default `true`**) | Setzt die Statuszelle des Steps (fehlende Zeile wird ergänzt, Name aus dem Scope-Bullet abgeleitet); legt bei 🔄 ein Detail-Block-Skelett unter „Laufende Phasen" an (`### Phase …` + `**Umfang (Steps):**` + Step-Bullet — **keine** erfundenen Ziel-/Abnahme-Texte); `title` benennt den Block-Heading konsistent um (Rename → Archivierung im selben Call ist definiert); ist danach kein Step der Phase mehr 🔄/⬜, wandert der Block **verbatim** ins PROGRESS_ARCHIVE (`note` → Verifikations-Zeile). Apply verifiziert Zeile, Block-Wanderung und `docs_validate`. |
| `backlog_add` | `root`, `section`, `title`, `priority` (`🔴🟠🟡🟢🔵`), optional `id`, `text`, `dryRun` | Legt ein offenes Item am **Ende der Ziel-Sektion** an: ID mit Konventionsprüfung (`^[A-Z][0-9]+$`), Auto-Vergabe = nächste freie Nummer der Prioritäts-Serie (K/H/M/L; 🔵 erfordert explizite ID), `text`-Bullets verbatim, `Stand:`-Zeitstempel im Heading wird aktualisiert. |
| `backlog_update` | `root`, `id`, optional `title`, `priority`, `section`, `text`, `dryRun` | Ändert Titel/Priorität/Text/Sektion im Block-Format (Span-Neuberechnung, Checkbox- und `*(…)*`-Suffix bleiben erhalten). Prioritätswechsel verschiebt den Block in die passende Prioritäts-Sektion. |
| `backlog_remove` | `root`, `id`, optional `note`, `locale`, `dryRun` | **Kein Hard-Delete:** Block wandert verbatim ins BACKLOG_ARCHIVE (Checkbox bleibt `[ ]`, optional `note` → `**Entfernt:**`-Zeile), im Erledigt-Index erscheint ein Tail ohne Erledigt-Marker (`- <ID> — <Titel> — entfernt (note?)`). `docs_validate` meldet Checkbox-`[ ]`-Blöcke bewusst **nicht** als `ARCHIVE_WITHOUT_INDEX`. |
| `progress_plan_phase` | `root`, `phase` (`"Phase <N>[ — Titel]"`), `steps: [{step, name}]`, optional `dryRun` | Plant eine Phase **voraus**: Tabellen-Zeilen für alle Steps (`⬜`, mit Namen) + Detail-Block-Skelett mit vollständigem Scope. Validiert Step-Präfix (`Phase 7` → `7.x`), Duplikate und belegte Phasen/Steps. `PLAN_WITHOUT_WIP` ist bis zum ersten 🔄 der definierte Zustand. |

**Antwortformate:** Dry-run liefert den Plan `{dryRun, changes:[{file, description,
before, after, diff}]}`; Apply liefert `{written, verification:{ok, messages}}`.

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
```

Beispiel: `methoddocs://D%3A%5Cproj%5Cdemo/backlog`

---

## CLI

`packages/mcp/src/cli.ts` (nach `npm install` auch als `npx method-docs`).
Menschliche Ausgabe auf stdout; `--json` liefert die unveränderten core-Payloads.

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
node packages/mcp/src/cli.ts progress-update --root <projekt> --phase "Phase 2" --step 2.2 --status running [--title "Neuer Titel"] [--note "…"] [--locale en] [--apply]
```

Ungültige Werte liefern Exit 2 mit der Liste der erlaubten Aliase (z. B.
`🔴=red/kritisch/p1, …`, `⬜=open, 🔄=running/wip, ✅=done, ⛔=blocked`).

**Exit-Codes:** `0` Erfolg (bzw. keine Validate-Funde) · `1` Fehler bzw.
Validate-Funde · `2` Usage-Fehler (unbekanntes Kommando, fehlende Pflicht-Option).

---

## Warnungs-Codes

**Parse-Warnungen** entstehen beim Parsen einzelner Dateien (Drift-Toleranz),
**Validate-Funde** prüfen Querkonsistenz über Dateien hinweg (`docs_validate`
sammelt beides). Konventions-Warnungen betreffen **nur offene Dateien** — Archive
sind append-only und werden nie beanstandet.

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
