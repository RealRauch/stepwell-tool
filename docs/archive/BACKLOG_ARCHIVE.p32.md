# BACKLOG_ARCHIVE.p32.md — Shard (Phase 32, append-only)

> Created 2026-11-12T22:04 — home for item blocks archived while Phase 32 was running.
> Contains: items archived during Phase 32. Header is write-once — never edited.

---

### [x] H12 — Rotation als Tool-Op im Phasen-Abschluss: Direktschreib-Modell — Item-Appends an BACKLOG_ARCHIVE.p<n>.md, Phase-Block bei completedPhase an PROGRESS_ARCHIVE.p<n>.md — 🟠
- **Location:** `packages/core/src/mutations.ts` (~8 Append-/Verify-Stellen: `appendToArchive`, `appendIndexLine`, `completedPhase`-Archiv-Append, step-reuse-Guard), `packages/core/src/project-files.ts`. Fund: Design-Dialog 11/2026 (Nutzer-Entscheid „Shard je Phase“, Direktschreib-Variante).
- **Problem:** Alle Appends landen in der einen kanonischen Archiv-Datei — das Wachstums- und Cross-Machine-Merge-Traffic-Problem; ein Agent-Ritual „manuelles Rotieren“ wäre die Hand-Edit-Falle (LESSONS 17).
- **Fix:** Direktschreib-Variante, Shard je Phase: Item-Blöcke, die **während** Phase n archiviert werden, hängen direkt an `BACKLOG_ARCHIVE.p<n>.md`; bei `completedPhase` hängt der Phase-Block an `PROGRESS_ARCHIVE.p<n>.md`; **Kopfzeile je Shard-Datei** beim Anlegen (Phase, Abschluss-Stempel, Enthält-Zeile — nie editiert, greppbar). Die kanonische `*_ARCHIVE.md` bleibt Heim für Legacy-Bestand (frozen, siehe L-Serie Legacy-Rename) und Appends **ohne laufende Phase** (0.1-Baseline, Packaging-Gap). Workstream-Bonus (H5): je Worktree läuft genau eine Phase → Workstreams schreiben auf **unterschiedliche Shard-Dateien** → die H7-Archiv-Merge-Konflikte verschwinden für Item-Appends weitgehend (H7 bleibt für die kanonische Datei und echte Inhaltskonflikte). Rotation ist vollständig Tool-Op, kein Agent-Ritual, keine Hand-Edits.
- **Design-Notizen (Entscheid bei Implementierung):** erstes Append, bevor eine Phase läuft (0.1-Baseline/Kanonik-Regel); Naming bei zwei parallel laufenden Phasen (zwei Worktrees → zwei p<n>-Shard-Dateien desselben Typs — kollisionsfrei, Schema dokumentieren).
- **Acceptance:** RED→GRÜN: Archiv während laufender Phase → Block in p<n>; Phasen-Abschluss → Phase-Block in p<n> + Kopfzeile; Archiv ohne laufende Phase → kanonische Datei; byte-gleiches Verhalten überall sonst; Suite grün.
- **Erledigt:** Commit `5c9d23a` — Rotation als Tool-Op: Shard je Phase (Direktschreib), Kopfzeile je Shard-Datei, Kanonik-Regeln; ~25 Testerwartungen umgestellt

---

### [x] M24 — Done-Index-Kopplung: Index-Zeile lebt dort, wo ihr Block lebt (Shard-Index-Sektionen) — 🟡
- **Location:** `packages/core/src/mutations.ts` (Index-Zeilen-Appends + Schließen-Pfad), `packages/core/src/backlog.ts` (Done-Index-Parse über BACKLOG + Shard-Dateien), `packages/core/src/validate.ts` (INDEX-/ARCHIVE-Strenge). Fund: Design-Dialog 11/2026 (Nutzer-Entscheid „gekoppelt“).
- **Problem:** Der Done Index in BACKLOG.md wächst linear je erledigtem Item — im Shard-Modell bliebe er die einzige immer weiter wachsende offene Datei.
- **Fix:** Gekoppelte Variante (Nutzer-Entscheid): **Index-Zeile lebt dort, wo ihr Block lebt** — beim Schließen einer Shard-Datei wandern die Einzeiler ihrer Blöcke (Inhalt byte-identisch) in eine Done-Index-Sektion der Shard-Datei; der BACKLOG Done Index hält nur Zeilen für Blöcke der kanonischen Datei. Konsequenz explizit dokumentiert (README/SKILL bei Umsetzung): **keine einzelne Indexdatei für „alles Erledigte“ mehr** — der Lese-Pfad ist das Tool (konkateniert BACKLOG + Shard-Index-Sektionen) bzw. verteiltes Grep; dafür friert BACKLOG praktisch ein.
- **Offener Punkt (L13-Muster, Entscheidung bei Implementierung):** „Index-Zeile nicht dort, wo ihr Block lebt“ = FINDING (strenge Lokalität) oder nur globale Existenz-Prüfung?
- **Acceptance:** RED→GRÜN: Schließen einer Shard-Datei verschiebt die zugehörigen Index-Zeilen byte-identisch in die Shard-Index-Sektion; INDEX-/ARCHIVE-Checks über BACKLOG + Shard-Dateien ergebnisgleich; Suite grün.
- **Erledigt:** Commit `6eefbba` — Done-Index-Kopplung: Index-Zeile lebt dort, wo ihr Block lebt (Shard-Index-Sektionen); strenge Lokalität als INDEX_LOCATION-Finding (L13-Muster-Entscheid); repair rekonstruiert in die Datei des Blocks

---

### [x] M25 — Satellit/Hashes/Resources shard-fähig: DOC_FILES-Staging, sync docSet, hashes-Resource, archivePath() — 🟡
- **Location:** `packages/core/src/hashes.ts` (`DOC_FILES` — eine von **drei** separaten Listen: project-files.ts, hashes.ts, mcp/tests/gitattributes.test.ts), `packages/git/src/commit.ts` (DOC_FILES-Staging), `packages/git/src/sync.ts` (`docSet`, H7-Auto-Resolution), `packages/mcp/src/resources.ts` (`archivePath()`, hashes-Resource), `packages/mcp/tests/resources.test.ts` (L114-119 Key-Set), `packages/core/tests/fixtures/README.md` („File Inventory strict“). Fund: Inventur 11/2026 (Explore-Agent).
- **Problem:** Die Vier-Datei-Listen und die Resource-Surface kennen genau vier Dateien — Shard-Dateien würden vom `--commit`-Staging, der H7-Auto-Resolution und dem Hash-Fast-Pfad **stillschweigend ausgeschlossen** (der Fast-Pfad sähe Shard-Änderungen nie → veraltete Hashes → Konsumenten lesen stale Stände).
- **Fix:** (1) Die Vier-Datei-Listen werden zu Doc-File-Sets: Kern-Konstante (project-files) als Quelle, `hashes.ts`/`commit.ts` leiten ab; der gitattributes-Test behält seine feste Methoden-Kopien-Liste und ergänzt die kanonischen Archive. (2) sync docSet: Shard-Dateien zählen als Doku-Dateien (H7-Auto-Resolution pro Datei unverändert). (3) hashes-Resource: Key-Set = kanonische vier + vorhandene Shard-Dateien (dynamisch); Resource-/Contract-Tests additiv. (4) `archivePath()`: kind bleibt `backlog|progress` (Kanonik); Shard-Lesezugriff über die Bestands-Reader statt neuer URI-Kinds (M4: kein Surface-Zuwachs).
- **Acceptance:** RED→GRÜN: `--commit` staged kanonische vier + Shard-Dateien; H7-Auto-Resolution löst einen Shard-Append-Konflikt mechanisch; Hash-Fast-Pfad sieht Shard-Änderungen; Suite grün.
- **Erledigt:** Commit `fcf15eb` — docFileSet als Kern-Quelle (hashes/commit/sync abgeleitet), Fast-Pfad sieht Shard-Änderungen, Both-Added-Shard-Resolve gegen Empty-Base, H7-Mid-File-Präzisierung

---

### [x] M23 — PLAN_WITHOUT_WIP feuert transient bei JEDEM Step-Übergang (✅ geflippt, nächster ⬜ noch nicht 🔄) — sequentieller Zwischenzustand ist legitimer Fortschritt — 🟡
- **Location:** `packages/core/src/validate.ts` (M18-Semantik: gemischt ohne 🔄 = PLAN_WITHOUT_WIP-Finding). Fund: eigene Session 11/2026, Phase 30 — bei JEDEM Step-Übergang (Step N ✅ geflippt, Step N+1 noch ⬜) feuert das Finding transient; ein `docs_validate` in diesem Fenster bricht `&&`-Ketten (exit 1), wie beim 30.3-Flip geschehen.
- **Problem:** M18 unterscheidet rein geplant (Warning) und verwaist (Finding) — aber den dritten legitimen Zustand „Phase läuft, zwischen zwei Steps" (✅…✅ gefolgt von ⬜…⬜, kein 🔄) behandelt sie als Verwaist-Finding. Bei aktiver Arbeit ist das kein Inkonsistenz-Fund, sondern ein Timing-Artefakt der Step-Flips; CI-Validates zwischen Flips würden fälschlich rot.
- **Fix:** Sequentiellen Fortschritt erkennen: alle ✅ liegen vor allen ⬜ in der Tabellen-Ordnung der Phase und kein ⛔/🔄 dazwischen → neues Warning `PHASE_MIDWAY` (kippt kein ok); echtes Verwaist-Sein (✅ NACH ⬜ in Tabellen-Ordnung, oder ⛔-Insel) bleibt PLAN_WITHOUT_WIP-Finding. Code bleibt im Kontrakt (Decision 10), semantisch MINOR + Release-Note; README-Warning-Tabelle nachziehen.
- **Acceptance:** RED→GRÜN-Fixtures: sequentieller Zwischenzustand → nur Warning, ok:true; verwaister Block (✅ nach ⬜) → Finding, ok:false; M18-Fälle unverändert; Suite grün.
- **Erledigt:** Commit `1d1f616` — sequentieller Zwischenzustand → PHASE_MIDWAY-Warning (ok true); Orphaned/⛔-Insel/leerer Scope bleiben PLAN_WITHOUT_WIP-Findings

---

### [x] L22 — Doppelte Parses im Workstream-Report: foreignDocState parst BACKLOG je Branch zweimal, idCollisions berechnet den base-State doppelt — 🟢
- **Location:** `packages/git/src/report.ts` (`foreignDocState`: `parseBacklog` wird je Branch zweimal aufgerufen — items- und doneIndex-Loop parsen denselben String; `idCollisions`/`freshSince`: der base-State wird je Vergleichsseite erneut berechnet). Fund: eigene Session 11/2026, Selbst-Review nach 30.5.
- **Problem:** Doppelte Parses pro Worktree — funktional korrekt, aber verschwendete Arbeit in einer Read-Fläche, die Konsumenten je Status-Call mehrfach treffen (der Report wächst mit H10/M20).
- **Fix:** `parseBacklog` einmal je Branch (items + doneIndex aus einem Parse); base-State in `idCollisions` einmal berechnen und an beide Seiten reichen. Reine Refaktorung, byte-gleiches Verhalten, bestehende Tests als Absicherung.
- **Acceptance:** Suite grün ohne Verhaltensänderung; Refaktor-Note im Item-Close.
- **Erledigt:** Commit `947f81e` — doppelte Parses im Workstream-Report beseitigt (foreignDocState 1× BACKLOG je Branch, idCollisions base-State 1×); byte-gleich

---

### [x] L24 — docs_status Dateigrößen-Report: Zeilen/Bytes je Doku-Datei im Aggregate — 🟢
- **Location:** `packages/core/src/status.ts` (`docsStatus`), `packages/mcp/src/cli.ts` (status-Text), Status-Tests. Fund: Design-Dialog 11/2026 (Visibility vor Reaktivierung).
- **Problem:** Wachstum ist unsichtbar, bis es wehtut — das Reaktivierungs-Kriterium der Shard-Items verlangt empirische Zahlen („Feldproben zeigen die Schmerzgrenze“), die heute niemand misst.
- **Fix:** `docsStatus` liefert additiv `docFiles: [{file, lines, bytes}]` für die vier Doku-Dateien (+ Shard-Dateien, sobald die Shard-Items umgesetzt sind); CLI-Status rendert eine Kompakt-Zeile; JSON additiv (Schema bleibt 2).
- **Acceptance:** RED→GRÜN: Aggregat-Feld deterministisch über project-a; CLI-Text-Zeile; JSON-Kontrakt additiv; Suite grün.
- **Erledigt:** Commit `1b9a044` — docFiles-Aggregat in docs_status + CLI-Kompakt-Zeile; JSON additiv (Schema 2)

---

### [x] L19 — Item-bewusste Suche über offen+Archiv+Done Index: Alternativprüfung dokumentieren statt Tool bauen (Reaktivierungs-Kriterium) — 🟢
- **Location:** `packages/core/src/archive.ts`, `packages/core/src/backlog.ts`, bestehende Reads `backlog_list`/`backlog_show`; keine neue Datei. Vorlage: Backlog.md `search` (`--status`, `--priority`, `--modified-file`).
- **Problem:** „Haben wir das schon entschieden/gebaut?" ist heute nur per grep über sechs Dateien beantwortbar; grep liefert Text, aber keinen Item-Status (offen/erledigt/entfernt) und keine Blockgrenzen. Backlog.md hat dafür eine Suche. Gleichzeitig gilt M4: kein Surface-Zuwachs ohne belegten Fund — Agenten greppen die Dateien nativ, ein Such-Tool wäre teilweise redundant.
- **Fix (Entscheidungs-Item, Muster L5/docs_review):** Alternativprüfung dokumentieren, Ergebnis entweder (a) **kein Tool** — Begründung: grep + `backlog_show` decken den Fall, jeder Suchindex wäre eine zweite Wahrheit; Reaktivierungs-Kriterium: Feldproben zeigen wiederholtes Fehlgreifen (z. B. archivierte Treffer übersehen, falsche ID-Rekonstruktion), dann (b) minimaler Kandidat: Parameter `query` an `backlog_list` (Titel/ID/Text, optional `includeArchived: true`), Treffer als `{ id, status, file, line, snippet }` — kein Fuzzy-Ranking, keine Fremddateien, kein neues Tool.
- **Acceptance:** dokumentierter Entscheid in README/AGENTS inkl. Reaktivierungs-Kriterium (wie L5); falls (b) gebaut wird: RED→GRÜN für offen/archiviert/entfernt und `status` im Treffer; keine neue Abhängigkeit; Suite + typecheck grün.
- **Erledigt:** Commit `34c09a1` — Alternativprüfung dokumentiert: KEIN Such-Tool (grep + backlog_show decken den Fall, M4); Reaktivierungs-Kriterium + Minimal-Kandidat (query an backlog_list) in README/AGENTS

---

### [x] L25 — Methoden-/Doku-Sync bei Sharding-Umsetzung: PLAYBOOK §3 + QUICKSTART + README + AGENTS, Cross-Repo SHA256 — 🟢
- **Location:** `docs/PLAYBOOK.md` §3 („Dateinamen sind Teil des Musters“, append-only), `docs/QUICKSTART.md` („The four files“), `README.md` (File requirement, Archive-Muster), `AGENTS.md` („vier Doku-Dateien“). Fund: Inventur 11/2026.
- **Problem:** Das Shard-Modell ändert die Methoden-Oberfläche (Datei-Menge) — PLAYBOOK §3 ist Cross-Repo-Kontrakt (wortidentische Kopien, SHA256-Evidenz); ohne synchronen Sync driften die Kopien (M15-Muster).
- **Fix:** Begleitet die Umsetzung (nicht vorher): PLAYBOOK §3-Ergänzung (Shard-Modell: p<n>-Naming, Direktschreib, gekoppelter Index, Legacy-Regel) wortidentisch in alle Kopien + SHA256-Evidenz; QUICKSTART/README/AGENTS-Zeilen nachziehen. Reihenfolge im späteren Paket: letzter Umsetzungs-Step vor dem Abschluss.
- **Acceptance:** PLAYBOOK-Kopien textgleich (SHA256 belegt), `docs_validate` in beiden Repos clean.
- **Erledigt:** Commit `c5157bd` — PLAYBOOK §3 Archive-Sharding wortidentisch in beide Kopien (SHA256 af8a2d08), Sibling a039514f; QUICKSTART/README/AGENTS nachgezogen

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- H12 — Rotation als Tool-Op im Phasen-Abschluss: Direktschreib-Modell — Item-Appends an BACKLOG_ARCHIVE.p<n>.md, Phase-Block bei completedPhase an PROGRESS_ARCHIVE.p<n>.md — erledigt (Commit `5c9d23a` — Rotation als Tool-Op: Shard je Phase (Direktschreib), Kopfzeile je Shard-Datei, Kanonik-Regeln; ~25 Testerwartungen umgestellt)
- M24 — Done-Index-Kopplung: Index-Zeile lebt dort, wo ihr Block lebt (Shard-Index-Sektionen) — erledigt (Commit `6eefbba` — Done-Index-Kopplung: Index-Zeile lebt dort, wo ihr Block lebt (Shard-Index-Sektionen); strenge Lokalität als INDEX_LOCATION-Finding (L13-Muster-Entscheid); repair rekonstruiert in die Datei des Blocks)
- M25 — Satellit/Hashes/Resources shard-fähig: DOC_FILES-Staging, sync docSet, hashes-Resource, archivePath() — erledigt (Commit `fcf15eb` — docFileSet als Kern-Quelle (hashes/commit/sync abgeleitet), Fast-Pfad sieht Shard-Änderungen, Both-Added-Shard-Resolve gegen Empty-Base, H7-Mid-File-Präzisierung)
- M23 — PLAN_WITHOUT_WIP feuert transient bei JEDEM Step-Übergang (✅ geflippt, nächster ⬜ noch nicht 🔄) — sequentieller Zwischenzustand ist legitimer Fortschritt — erledigt (Commit `1d1f616` — sequentieller Zwischenzustand → PHASE_MIDWAY-Warning (ok true); Orphaned/⛔-Insel/leerer Scope bleiben PLAN_WITHOUT_WIP-Findings)
- L22 — Doppelte Parses im Workstream-Report: foreignDocState parst BACKLOG je Branch zweimal, idCollisions berechnet den base-State doppelt — erledigt (Commit `947f81e` — doppelte Parses im Workstream-Report beseitigt (foreignDocState 1× BACKLOG je Branch, idCollisions base-State 1×); byte-gleich)
- L24 — docs_status Dateigrößen-Report: Zeilen/Bytes je Doku-Datei im Aggregate — erledigt (Commit `1b9a044` — docFiles-Aggregat in docs_status + CLI-Kompakt-Zeile; JSON additiv (Schema 2))
- L19 — Item-bewusste Suche über offen+Archiv+Done Index: Alternativprüfung dokumentieren statt Tool bauen (Reaktivierungs-Kriterium) — erledigt (Commit `34c09a1` — Alternativprüfung dokumentiert: KEIN Such-Tool (grep + backlog_show decken den Fall, M4); Reaktivierungs-Kriterium + Minimal-Kandidat (query an backlog_list) in README/AGENTS)
- L25 — Methoden-/Doku-Sync bei Sharding-Umsetzung: PLAYBOOK §3 + QUICKSTART + README + AGENTS, Cross-Repo SHA256 — erledigt (Commit `c5157bd` — PLAYBOOK §3 Archive-Sharding wortidentisch in beide Kopien (SHA256 af8a2d08), Sibling a039514f; QUICKSTART/README/AGENTS nachgezogen)
