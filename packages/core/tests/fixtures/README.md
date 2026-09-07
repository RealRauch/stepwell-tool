# Fixtures — Testdaten für Parser & Validierung

> Inhalte frei erfunden/anonymisiert; die **Struktur** spiegelt Realprojekte, die der
> PLAYBOOK-Methode folgen (Referenz: Geschwister-Repo `../stadtpfad-pwa` — nur lesen).
> Diese Datei ist die arbeitende **Spezifikation** für Häppchen 1.2–1.6:
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
    └── PROGRESS.md
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
- **Offene IDs:** H1, H2, L3, T8, R4, U21, U22 (alle `offen: true`, Prio teils im Titel,
  teils aus der Sektion ableitbar — `R4` trägt den Marker `*(vor Pilotbetrieb zwingend)*`
  → 🟠; ohne jeden Anhaltspunkt gilt `unknown` + Warnung).
- **Erledigt-Index:** Einzeiler unter `## ✅ Erledigt-Index` mit Muster
  `- <ID> — <Kurztext> — erledigt in <sha7> …` → S1, S2, M7 (`offen: false`, Titel/Kurztext erfassen).

### PROGRESS (`project-a/PROGRESS.md`)

- **Fortschrittstabelle:** Zeilen `| <nr> | <name> | <icon> |` mit Icons ⬜ 🔄 ✅ ⛔
  (hier: 0.1–1.3 ✅, 2.0 ⛔, 2.1 🔄, 2.2/2.3 ⬜).
- **Laufende Phasen:** genau ein Detail-Block `### Phase 2 — UI-Polish` mit
  `**Ziel:**`, `**Abnahme:**`, `**Umfang (Häppchen):**` + Bullet-Liste.

### Archive (project-a/docs/archive/)

- `BACKLOG_ARCHIVE.md`: vollständige Item-Blöcke, Checkbox `[x]`, Endmarker
  `**Erledigt:** Commit <sha7> …` → S1, S2, M7 (deckungsgleich mit Erledigt-Index).
- `PROGRESS_ARCHIVE.md`: Detail-Blöcke `### Phase 0 — …` / `### Phase 1 — …`
  (+ `*(abgeschlossen MM/YYYY)*`), gleiche Feldstruktur wie laufende Phasen.
- **Konsistenz (Basis für `docs_validate`, 1.6):** project-a ist **fundi-frei** —
  Index ↔ Archiv deckungsgleich; jede 🔄-Zeile hat einen Detail-Block und umgekehrt.

## Erwartete Funde (project-b-drift) — Validate-Checkliste für 1.6

| # | Fall | Datei | Erwartete Reaktion |
|---|------|-------|--------------------|
| D1 | Item ohne Prioritäts-Suffix (`K9`) | BACKLOG | listen, `prio: unknown` + Warnung |
| D2 | `[x]`-Checkbox noch im offenen Bereich (`H9`) | BACKLOG | Validate: „nicht archiviert" |
| D3 | Doppelter Prioritäts-Marker (`L9`) | BACKLOG | ohne Crash parsen, 1× Prio |
| D4 | Item ohne Ort/Problem-Bullets (`L10` Nr. 1) | BACKLOG | Freitext als `text` erfassen |
| D5 | Duplizierte Item-ID (`L10` zweimal) | BACKLOG | Validate: „doppelte ID" |
| D6 | Unbekanntes Sektions-Emoji `🟣` (`X1`) | BACKLOG | `prio: unknown` + Warnung |
| D7 | ID ohne Titel nach Trenner (`T9`) | BACKLOG | Titel leer tolerieren + Warnung |
| D8 | Index-Einträge **ohne** Archiv-Block (`S9`, `M9`) | BACKLOG | Validate: „fehlt im Archiv" |
| D9 | Unbekanntes Status-Icon `❓` (1.2) | PROGRESS | `status: unknown` + Warnung |
| D10 | Tabellenzeile ohne Status-Spalte (1.3) | PROGRESS | tolerieren + Warnung |
| D11 | 🔄-Zeile ohne Detail-Block (1.4) | PROGRESS | Validate: „keine Paketierung" |
| D12 | Detail-Block ohne laufende Phase | PROGRESS | Validate: „verwaister Block" |

**Parser-Grundregel (AGENTS.md Nr. 2):** Drift → strukturierte Warnung, **niemals Abbruch**.
Jedes Teil-Ergebnis (auch `unknown`) bleibt abfragbar.
