# Feldtest: stadtpfad-pwa (Step 7.2, D2)

> Stand: 260908/0200 · Realformat-Referenz `../stadtpfad-pwa` — **nur lesend** getestet,
> byte-identisch geblieben (`git status` clean). Ziel: die Tools gegen ein echtes
> STEPWELL-Projekt (34 offene Items, 114 Tabellenzeilen, 22 Archiv-Phasen) laufen lassen.

## Protokoll je Tool

| Tool/Kommando | Ergebnis |
|---------------|----------|
| `docs_status` | ✓ läuft crash-frei; 34 offene Items (4× unknown-Prio), ✅-Quote 113/114; Warn-/Fundliste sehr groß (siehe W1/W2) |
| `backlog_list` (CLI `backlog --json`) | ✓ 34 Items, Prio-Ableitung korrekt (Titel-Suffix → Sektions-Fallback → unknown), Filter ungetestet am Realprojekt, aber identischer Codepfad wie Fixtures |
| `backlog_show` | ✓ Merge-Sicht für `U23` korrekt (id/prio/title) |
| `progress_list` (CLI `progress --json`) | ✓ 114 Zeilen, 0 Parse-Warnungen; einzige Nicht-✅-Zeile: `10.6 ⛔` |
| `progress_show` (via Archiv-Reader) | ✓ 22 Phasen (Phase 0–21) erkannt; Detail-Block Phase 10 inkl. Titel; `scope: 0` (altes Block-Format ohne Umfang-Bullets — wird toleriert) |
| `docs_validate` | ✓ funktioniert — und macht auf echte Funde aufmerksam (W1, W2); DATE_LEGACY nur auf offener Datei ✓ |
| CLI `status`/`backlog`/`progress`/`validate` | ✓ Exit-Codes korrekt (`validate` → 1 wegen W1-Funden) |

## Bestätigte korrekte Verhaltensweisen (D-Spec)

- `U23/U39/U40/U41` → `priority: unknown` + `PRIO_MISSING` (Sektions-Emoji 🎨 ist keine Priorität) — entspricht D6.
- `T7/H7` → Priorität aus Sektions-Fallback 🔵 mit Warnung — entspricht D1.
- `DATE_LEGACY` für `Stand: 09/2026` nur in der offenen BACKLOG.md, nie im Archiv — entspricht D15.
- Archiv-IDs `R1-A/R1-B` werden (korrekt) keiner Konventions-Prüfung unterzogen — Prüfungen betreffen nur offene Dateien.

## Funde (→ BACKLOG)

- **W1 — Erledigt-Index als Tabelle:** Das Realprojekt pflegt den Index als Tabelle
  (`| Serie | Item (kurz) | Commit/Phase |`); der Parser kennt nur Einzeiler-Bullets
  (`- ID — Titel — erledigt …`). Folge: 54× `ARCHIVE_WITHOUT_INDEX` (K1–D1) und
  `doneLine: 0/52` im Archiv. Offene Frage an die Methoden-Eigentümerin: Tabelle als
  tolerierte Variante parsen (Union-Matching) oder Realprojekt auf Einzeiler migrieren.
- **W2 — Parse-Warnungen aus Archiven:** `docs_validate`/`docs_status` sammeln
  Parse-Warnungen der Archiv-Dateien ein (~50× `PRIO_MISSING`, 4× `BLOCK_UNSTRUCTURED`).
  Das kontert den Grundsatz „Archive werden nie beanstandet" (PLAYBOOK §3) und übertönt
  die offenen Befunde. Fix-Richtung: Archiv-Parse-Warnungen unterdrücken oder explizit
  als solche kennzeichnen.
