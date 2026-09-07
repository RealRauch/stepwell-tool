# Fixtures — Testdaten für Parser & Validierung

> Inhalte frei erfunden/anonymisiert; die **Struktur** spiegelt Realprojekte, die der
> PLAYBOOK-Methode folgen (Referenz: Geschwister-Repo `../stadtpfad-pwa` — nur lesen).
> Diese Datei ist die arbeitende **Spezifikation** für die Steps 1.2–1.6:
> Parser-Tests werden zuerst ROT gegen `project-a` geschrieben, dann grün implementiert.

## Layout

```
fixtures/
├── project-a/            # sauberes, vollständiges Musterprojekt (Parser-Positivfälle)
│   ├── BACKLOG.md
│   ├── PROGRESS.md
│   └── docs/archive/
│       ├── BACKLOG_ARCHIVE.md
│       └── PROGRESS_ARCHIVE.md
└── project-b-drift/      # absichtliche Drift-/Edge-Cases (Parser-Toleranz + Validate-Funde)
    ├── BACKLOG.md
    ├── PROGRESS.md
    └── docs/archive/
        ├── BACKLOG_ARCHIVE.md
        └── PROGRESS_ARCHIVE.md
└── project-c-en/         # englisches Format (Locale-Profile, Phase 4 — Parser-Positivpfad)
    ├── BACKLOG.md
    ├── PROGRESS.md
    └── docs/archive/
        ├── BACKLOG_ARCHIVE.md
        └── PROGRESS_ARCHIVE.md
```

Projekt-Root ist jeweils der Ordner mit `BACKLOG.md`/`PROGRESS.md` — genau wie in Realprojekten.

## Erwartete Parser-Ergebnisse (project-a) — Grundlage der roten Tests

### BACKLOG (`project-a/BACKLOG.md`)

- **Sektionen** (Titel + Priorität aus Emoji): `🔴 KRITISCH` (leer, „> Keine offenen Items."),
  `🟠 HOCH` (2 Items), `🟡 MITTEL` (leer), `🟢 NIEDRIG` (1 Item), `🔵 TEST-LÜCKEN` (1 Item),
  `📋 OFFENE PUNKTE R-SERIE` (1 Item), `🎨 UI-DESIGN-REVIEW` (2 Items, mehrzeilige
  Kopfregel im Blockquote — Kopfzeilen sind **nicht** Items).
- **Item-Block-Muster:** `### [ ] <ID> — <Titel> — <Prio>` (+ optional `*(…)*`-Suffix),
  danach Bullets `**Ort:**`, `**Problem:**`/`**Warum:**`, `**Fix:**`/`**Umfang …:**`, `**Abnahme:**`.
- **Offene IDs:** H1, H2, L3, T8, R4, U21, U22 (alle `open: true`). Prio-Ableitung wie
  unten bindend festgelegt: Titel-Suffix gewinnt, sonst Sektions-Emoji — `R4` trägt 🟠
  explizit im Titel, `*(vor Pilotbetrieb zwingend)*` ist nur die Begründung; ohne jeden
  Anhaltspunkt gilt `unknown` + Warnung.
- **Erledigt-Index:** Einzeiler unter `## ✅ Erledigt-Index` mit Muster
  `- <ID> — <Kurztext> — erledigt in <sha7> …` → S1, S2, M7 (`open: false`, Titel/Kurztext erfassen).

### PROGRESS (`project-a/PROGRESS.md`)

- **Fortschrittstabelle:** Zeilen `| <nr> | <name> | <icon> |` mit Icons ⬜ 🔄 ✅ ⛔
  (hier: 0.1–1.3 ✅, 2.0 ⛔, 2.1 🔄, 2.2/2.3 ⬜).
- **Laufende Phasen:** genau ein Detail-Block `### Phase 2 — UI-Polish` mit
  `**Ziel:**`, `**Abnahme:**`, `**Umfang (Steps):**` + Bullet-Liste.

### Archive (project-a/docs/archive/)

- `BACKLOG_ARCHIVE.md`: vollständige Item-Blöcke, Checkbox `[x]`, Endmarker
  `**Erledigt:** Commit <sha7> …` → S1, S2, M7 (deckungsgleich mit Erledigt-Index).
- `PROGRESS_ARCHIVE.md`: Detail-Blöcke `### Phase 0 — …` / `### Phase 1 — …`
  (+ `*(abgeschlossen MM/JJJJ)*` — Legacy-Format, zeigt die Toleranz; kanonisch ist
  `JJMMDD/HHMM`), gleiche Feldstruktur wie laufende Phasen.
- **Konsistenz (Basis für `docs_validate`, 1.6):** project-a ist **fundi-frei** —
  Index ↔ Archiv deckungsgleich; jede 🔄-Zeile hat einen Detail-Block und umgekehrt.

## Erwartete Funde (project-b-drift) — Validate-Checkliste für 1.6

| # | Fall | Datei | Erwartete Reaktion |
|---|------|-------|--------------------|
| D1 | Item ohne Prioritäts-Suffix (`K9`) | BACKLOG | listen, `priority: 🔴` aus **Sektions-Fallback** + Warnung `PRIO_MISSING` |
| D2 | `[x]`-Checkbox noch im offenen Bereich (`H9`) | BACKLOG | Validate: „nicht archiviert" |
| D3 | Doppelter Prioritäts-Marker (`L9`) | BACKLOG | ohne Crash parsen, 1× Prio |
| D4 | Item ohne Ort/Problem-Bullets (`L10` Nr. 1) | BACKLOG | Freitext als `text` erfassen |
| D5 | Duplizierte Item-ID (`L10` zweimal) | BACKLOG | Validate: „doppelte ID" |
| D6 | Unbekanntes Sektions-Emoji `🟣` (`X1`) | BACKLOG | `priority: unknown` + Warnung |
| D7 | ID ohne Titel nach Trenner (`T9`) | BACKLOG | Titel leer tolerieren + Warnung |
| D8 | Index-Einträge **ohne** Archiv-Block (`S9`, `M9`) | BACKLOG | Validate: „fehlt im Archiv" |
| D9 | Unbekanntes Status-Icon `❓` (1.2) | PROGRESS | `status: unknown` + Warnung |
| D10 | Tabellenzeile ohne Status-Spalte (1.3) | PROGRESS | tolerieren + Warnung |
| D11 | 🔄-Zeile ohne Detail-Block (1.4) | PROGRESS | Validate: „keine Paketierung" |
| D12 | Detail-Block ohne laufende Phase | PROGRESS | Validate: „verwaister Block" |
| D13 | Archiv-Block **ohne** Index-Eintrag (`Z9`) | BACKLOG_ARCHIVE | Validate: „fehlt im Erledigt-Index" |
| D14 | ID verletzt Nomenklatur (`fix_me`) | BACKLOG | Warnung `ID_CONVENTION`, Item trotzdem listen |
| D15 | Datum nur als `MM/JJJJ` (`Stand:`-Kopfzeile des Drift-BACKLOG) | BACKLOG | Warnung `DATE_LEGACY` — nur offene Dateien, Archive nie |

**Parser-Grundregel (AGENTS.md Nr. 2):** Drift → strukturierte Warnung, **niemals Abbruch**.
Jedes Teil-Ergebnis (auch `unknown`) bleibt abfragbar.

**Prio-Ableitung (bindend, Beschluss 09/2026):** Titel-Suffix gewinnt → sonst
Sektions-Emoji als Fallback (+ Warnung `PRIO_MISSING`) → nur wenn beides fehlt:
`unknown` + Warnung.

## Schnittstellen-Referenz (bindend ab 1.2, Beschluss 09/2026)

> **Terminologie (bindend):** Sämtliche Code- und Tool-Begriffe sind **englisch** —
> Typen, Feldnamen, Tool-Namen, Parameter, Warn-Codes. Deutsche Begriffe (Step,
> Erledigt-Index …) leben nur in Prosa/Doku, nie in der API. `message`-Inhalte der
> Warnungen sind menschenlesbar und dürfen deutsch sein.

### Kategorien (Enums)

| Kategorie | Werte | Quelle im Markdown | Drift-Verhalten |
|---|---|---|---|
| `priority` | 🔴 🟠 🟡 🟢 🔵 · `unknown` | Titel-Suffix `— 🟠`, Fallback Sektions-Emoji | D1, D3, D6 |
| `open` | `true` `false` | Checkbox `[ ]` / `[x]` | `[x]` im offenen Bereich → D2 |
| `status` | ⬜ 🔄 ✅ ⛔ · `unknown` | Icon-Spalte Fortschrittstabelle | D9, D10 |
| Bullet-Labels | freie Menge (`Ort`, `Problem`/`Warum`, `Fix`/`Umfang`, `Abnahme`, `Erledigt`, `Ziel` …) | `**Label:**`-Bullets | keine Bullets → Freitext als `text` (D4); `location` ist einziges eigenes Feld |

### Item-IDs (Konvention, PLAYBOOK §3)

- **Parser (tolerant):** `id` = Token zwischen Checkbox und erstem ` — `, getrimmt,
  nicht leer; Gleichheit = exakter String-Vergleich (case-sensitiv). Keine Format-Annahme.
- **Konvention (empfohlen/geprüft):** `^[A-Z][0-9]+$` — Verstoß → Warnung
  `ID_CONVENTION` (D14), nie Abbruch.
- **Namespaces:** Item-IDs und `ProgressRow.step` (`<Phase>.<Nr.>`) sind getrennt.

### Zeitstempel & Migration (PLAYBOOK §3)

- Kanonisches Format: `JJMMDD/HHMM` (z. B. `260907/1523`) für `*(erledigt …)*`,
  `*(abgeschlossen …)*` und `Stand:`-Kopfzeilen.
- Toleranz: `MM/JJJJ`-Bestand wird geparst/validiert ohne Abbruch; Warnung
  `DATE_LEGACY` **nur in offenen Dateien** — Archive sind append-only und damit
  ausgenommen (D15).
- `completedOn` speichert das Datum **verbatim** (keine Normalisierung).

### Datenobjekte (core)

| Objekt | Felder | Step |
|---|---|---|
| `ParseResult<T>` | `value`, `warnings[]` | 1.2 |
| `Warning` | `code`, `file`, `line?`, `message` | 1.2 |
| `BacklogItem` | `id`, `title`, `priority`, `section`, `open`, `location?`, `text`, `span{start,end}`, `raw` | 1.2 |
| `DoneEntry` | `id`, `summary`, `sha?` | 1.2 |
| `Backlog` | `sections[]` (`title`, `emoji`, `headerRule`), `items[]` (flach), `doneIndex[]` | 1.2 |
| `ProgressRow` | `step` (`"2.1"`), `name`, `status` | 1.3 |
| `PhaseBlock` | `name` (`"Phase 2"`), `title`, `goal`, `scope[]`, `acceptance`, `verification?`, `completedOn?` (JJMMDD/HHMM oder MM/JJJJ-Bestand, verbatim, nur Archiv), `span`, `raw` | 1.3 |
| `ArchiveItem` | = `BacklogItem` + `doneLine` | 1.4 |

### Warnungs-Codes

| Code | Ebene | Fall |
|---|---|---|
| `PRIO_MISSING` | Parse | D1 |
| `PRIO_DUPLICATE` | Parse | D3 · `PRIO_UNKNOWN` D6 |
| `BLOCK_UNSTRUCTURED` | Parse | D4 · `TITLE_EMPTY` D7 |
| `STATUS_UNKNOWN` | Parse | D9 · `ROW_INCOMPLETE` D10 |
| `NOT_ARCHIVED` | Validate | D2 · `ID_DUPLICATE` D5 |
| `INDEX_WITHOUT_ARCHIVE` | Validate | D8 · `ARCHIVE_WITHOUT_INDEX` D13 |
| `ID_CONVENTION` | Validate | D14 |
| `DATE_LEGACY` | Validate | D15 |
| `WIP_WITHOUT_PLAN` | Validate | D11 · `PLAN_WITHOUT_WIP` D12 |

### Tool-Parameter (MCP / CLI-Flags `--root`, `--priority`, `--status`, `--json`)

| Tool | Pflicht | Optional | Bemerkung |
|---|---|---|---|
| `docs_status` | `root` | — | Aggregat + Warnungen |
| `backlog_list` | `root` | `priority[]`, `open`, `section` | **ohne** `raw` (schlanker Payload) |
| `backlog_show` | `root`, `id` | — | inkl. `raw`+`span`; Merge-Sicht offen ↔ Index ↔ Archiv |
| `progress_list` | `root` | `status` | Tabellenzeilen |
| `progress_show` | `root`, `phase` | — | Detail-Block inkl. `raw` |
| `docs_validate` | `root` | — | Validate-Funde + eingesammelte Parse-Warnungen |
| `archive_item` (3.x) | `root`, `id` | `dryRun` (**Default `true`**), `note?`, `locale?` *(Erweiterungen 09/2026, Phase 3/4: Erledigt-Zeile am Archiv-Block + Index-Tail; Sprache generierter Texte, Default Auto-Erkennung de/en)* | Diff-Vorschau vor Apply |
| `progress_update` (3.3) | `root`, `phase`, `step`, `status` | `dryRun` (**Default `true`**), `note?`, `locale?` *(Phase 4)* | Tabelle + Detail-Block |

### Datei-Pflicht (Beschluss 09/2026: strikt)

`BACKLOG.md`, `PROGRESS.md`, `docs/archive/BACKLOG_ARCHIVE.md`, `docs/archive/PROGRESS_ARCHIVE.md`
sind **alle Pflicht** — fehlt eine, lädt das Projekt nicht (harter Fehler mit klarer Meldung,
keine Toleranz-Warnung). Gilt für Realprojekte und Fixtures gleichermaßen.
