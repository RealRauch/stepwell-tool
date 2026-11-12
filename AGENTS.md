# AGENTS.md — stepwell

> Arbeitsanweisungen für AI-Agenten & Mitentwickler.
> **Bindende Methode (STEPWELL):** `docs/PLAYBOOK.md` · **Review-Checkliste:** `docs/LESSONS.md`
> Beide sind verbatim-Kopien der projektunabhängigen Methode — hier nicht projektspezifisch anpassen.

## Überblick

Tool + MCP-Server zum **Lesen, Prüfen und Verwalten** der Methoden-Doku (`BACKLOG.md`,
`PROGRESS.md`, `docs/archive/BACKLOG_ARCHIVE.md`, `docs/archive/PROGRESS_ARCHIVE.md`)
in Projekten, die der PLAYBOOK-Methode folgen.

**Grundsatz: Markdown bleibt Source of Truth.** Das Tool verliert die Doku = Datenverlust
unmöglich; es liest, validiert und assistiert. Schreibzugriffe nur über die Struktur-Tools
(`archive_item`, `progress_update`, `backlog_add/update/remove`, `progress_plan_phase`) —
alles andere (Prosa) editiert der Agent direkt in den Dateien.

## Stack

- Node.js ≥ 22, TypeScript (strict, `NodeNext`), npm workspaces
- Vitest (Test-First, ROT → GRÜN — siehe PLAYBOOK §6)
- MCP: `@modelcontextprotocol/sdk` (stdio, v1.x stable) + zod v3 — TypeScript source executed directly by Node (type stripping, no build step)

## Befehle

- `npm install` — Abhängigkeiten (Root, Workspaces)
- `npm run typecheck` — alle Workspace-tsconfigs + Root-Konfig (Vitest-Config)
- `npm run test` / `npm run test:watch` — Vitest
- `npm run build` — Workspaces (ab Phase 2 relevant)

## Struktur

| Pfad | Zweck |
|------|-------|
| `packages/core` | Parser + Reports + Validierung — **keine** MCP-Abhängigkeit |
| `packages/git` | Git-Satellit `stepwell-git` (Workstream-Sync, Commit-Automation — Decision 14) |
| `packages/mcp` | Dünne MCP-Schicht über core + git (CLI + Tools) |
| `packages/*/tests` | Tests je Paket — **werden typegeprüft** (Lesson L12) |
| `docs/PLAYBOOK.md` | Methode (verbatim) |
| `docs/LESSONS.md` | Checkliste (verbatim) |
| `docs/QUICKSTART.md` | Einstieg (≤5 Min: Kernschleife, vier Dateien, fünf Regeln — Decision 15) |
| `PROGRESS.md` | Step-Paketierung + Fortschritt |
| `BACKLOG.md` | Offene Punkte |

## Kickoff für neue Sessions (in dieser Reihenfolge)

> **Konsum-Schutz (Decision 13, bindend):** Dieses Verzeichnis ist der **eingefrorene
> Konsumer-Stand** — Änderungen nur im Dev-Clone `../stepwell-tool-dev` (Branch `dev`),
> Promotion nur per Ritual; Konsumer-Inventar + Runbook: **privat gepflegt, außerhalb
> des Repos** (aus Leak-Gründen nie published — K2/Phase 28; Mapping der Pseudonyme
> ebenda).

0. **Neu hier?** Zuerst `docs/QUICKSTART.md` (≤5 Minuten: was STEPWELL ist, Kernschleife,
   die vier Dateien, die fünf Regeln) — danach die vollständige Kickoff-Reihenfolge unten.
1. `docs/PLAYBOOK.md` (Methode) + `docs/LESSONS.md` (Checkliste) lesen — beide bindend.
   Fast-Pfad (PLAYBOOK §0.9): Stimmen die von `docs_status`/Read-Tools/Resources gelieferten
   Hashes mit dem letzten bekannten Stand überein, genügt das Lesen des Step-Scopes —
   PLAYBOOK/LESSONS müssen nicht erneut voll gelesen werden; unabhängige Read-Calls
   parallel stellen.
2. `PROGRESS.md` → „Laufende Phasen": nächster offener Step in definierter Reihenfolge.
   Gem. Decision 8 (Backlog-Wurzel) wird jede neue Arbeit aus offenen BACKLOG-Items
   paketiert (Priorität 🔴 → 🟠 → 🟡 → 🟢 → 🔵). Freigabe-Gate gem. Decision 7 —
   Code-Steps erst nach expliziter menschlicher Freigabe; Content-Gates gem. Decision 9
   (Mittel bei Dependency-Manifesten/Tool-Kontrakten). Der aktuelle Stand lebt in
   `PROGRESS.md`/`docs_status` — hier nicht duplizieren.
3. **Testdaten:** `packages/core/tests/fixtures/` — die `README.md` dort ist die arbeitende
   Spezifikation für 1.2–1.6 (erwartete Parser-Ergebnisse + Validate-Funde D1–D15).
   `project-a` = sauberes Musterprojekt (Parser-Positivpfad) · `project-b-drift` = absichtliche Drift-Fälle (Toleranz + Validate).
4. **Realformat-Referenz (nur lesen, nicht verändern):** Geschwister-Repo `../internal-pwa`
   (`BACKLOG.md`, `PROGRESS.md`, `docs/archive/*`) — Original der Struktur.
5. Verifikation vor jedem Abschluss: `npm run typecheck` + `npm run test` (Test-First: ROT → GRÜN).

## Architektur-Entscheidungen

Historische bzw. in die Methode verschobene Decisions (Stack, Fixtures, Nomenklatur-Duplikat, Dokument-Zuordnung, Namens-Kollision, Endgültiges Naming): `docs/archive/AGENTS-decisions-history.md` (append-only, kein inhaltlicher Verlust).

1. **Zwei Schichten:** core ist bibliotheks-fähig (CLI/CI später fast gratis); MCP ist nur Transport.
2. **Fehlertoleranter Parser:** Projekte folgen der Methode, nicht byte-genau. Parser-Drift → strukturierte Warnung im `ParseResult` (Decision 3), kein Crash; `docs_validate` sammelt sie ein. Der Parser macht **keine Format-Annahmen an Item-IDs** (`id` = Token zwischen Checkbox und erstem ` — `, Gleichheit exakt nach Trim, case-sensitiv); die Konvention selbst lebt in PLAYBOOK §3.
3. **Datenmodell (ab 1.2 bindend):** `ParseResult<T> = { value, warnings[] }` mit einheitlichem `Warning = { code, file, line?, message }` — Parse-Warnungen (einzelne Datei) vs. Validate-Funde (Querkonsistenz) getrennt; `docs_validate` aggregiert. Item-Blöcke tragen `span` (Zeilenbereich) + `raw` (verbatim-Block) als Basis für die verbatim-Verschiebung (Lesson L16).
4. **Multi-Projekt:** Der Projekt-Root wird je Tool-Call übergeben — eine MCP-Instanz bedient beliebig viele STEPWELL-Projekte; Resources als Templates mit Root im URI.
5. **Sprache: Englisch für Methoden-Doku + Tool-Fläche, Toleranzschicht für Projektdateien (bindend, 09/2026; erweitert I1/14.1, geschärft I3/16.3):** **Englisch** ist die verbindliche Sprache der **Methoden-Doku und der gesamten Tool-Fläche** — PLAYBOOK/LESSONS (DE-Snapshots in `docs/archive/*`), Sektions-Headings, Feld-Labels (Location, Acceptance, Verification, Scope), Done Index, Statuswörter, Tool-Beschreibungen, CLI-Help, Warning-Messages, Templates, SKILL. **Inhaltstexte** (Item-Bodies, Notizen, Nutzertexte) bleiben bewusst sprachfrei — jeder schreibt sie in seiner Sprache. **Toleranzschicht für Projektdateien:** Die EN-Pflicht gilt nur für die Methoden-Doku — Projekt-Handbücher und Projekt-Doku (AGENTS.md-Prosa wie diese, READMEs, projektspezifische Dateien) dürfen in der Projektsprache bleiben; die Union-Matching-Toleranz (liest DE+EN still für alle Rollen-Synonyme) bleibt für alle offenen Dateien bestehen. **Übergangs-Toleranz (Entscheidung I1/14.6):** Legacy-DE-Labels in offenen Dateien werden stillschweigend gelesen (`profile.ts`) — **keine** `STRUCT_LOCALE`-Warnung in `docs_validate`. Die Toleranz ist Teil der Parser-Semantik, keine Beobachtungspflicht: wer ein Item sowieso anfasst, dreht die Labels beim natürlichen Edit auf EN (gleitend). Append-only-Archive werden nie beanstandet (W2).
    *Vorher (subsumiert, unverändert gültig):* Sämtliche Code- und Tool-Begriffe sind englisch — Typen (`BacklogItem`, `ProgressRow`), Feldnamen (`title`, `priority`, `open`, `location`, `raw`, `span`, `step`, …), Tool-Namen (`docs_status`, …), Parameter (`root`, `dryRun`, `step`, `note`), Warn-Codes (`PRIO_MISSING`, …); dieselben englischen Begriffe (z. B. „Step") werden auch in der Prosa verwendet. `message`-Inhalte von Warnungen sind menschenlesbar und dürfen deutsch sein.
6. **Zeitstempel + Migration (bindend, 09/2026):** Datums-/Zeit-Einträge in den vier Doku-Dateien immer als **ISO 8601** `YYYY-MM-DDTHH:mm` (lokale Zeit, z. B. `2026-09-07T15:23`) — nie nur `MM/JJJJ` (zu ungenau). Der Altbestand (`JJMMDD/HHMM`, z. B. `260907/1523`, und `MM/JJJJ`) wird still gelesen (Toleranzschicht); `docs_validate` warnt für **beide** Alt-Formate (`DATE_LEGACY`) — wie `ID_CONVENTION` — **nur in offenen Dateien**, nie im append-only-Archiv. Migration: offene Dateien beim nächsten natürlichen Edit umstellen, Archive nie anfassen, neue Projekte starten mit allen vier Dateien (PLAYBOOK §3).
7. **Freigabe-Gate + Tool-Pflicht (bindend, 09/2026):** Der Übergang von Planung/Paketierung zur Implementierung erfolgt **erst nach expliziter menschlicher Freigabe** (PLAYBOOK §0.4) — Agenten paketieren vor, starten Code-Steps nicht eigenmächtig. Das Gate ist zeitlich **und** inhaltlich: Content-Gates je Dateiklasse siehe Decision 9. Struktur-Operationen (Statuspflege, Archivierung, Done Index) laufen **immer** über `progress_update`/`archive_item`, niemals per Hand (LESSONS 17); direkte Edits nur für Prosa, die das Tool bewusst nicht verwaltet. Der MCP-Server trägt den Methoden-Namen (`stepwell`).
8. **Workflow: Backlog-Wurzel + Inline-Fix-Lane (bindend, 09/2026):** Jede geplante Arbeit hat eine **BACKLOG-Wurzel** — Phasen werden aus offenen Items paketiert (Verweis Item → Step wird je Item dokumentiert), nicht direkt aus der Chat-Planung. Einzige Ausnahme ist die **Inline-Fix-Lane:** Ein während eines laufenden, freigegebenen 🔄-Steps entdeckter Bug darf sofort gefixt werden, wenn er (a) im Code-Scope des Steps liegt, (b) klein ist (Faustregel ≤ ~10 Zeilen, keine API-/Schema-/Design-Entscheidung, keine neue Abhängigkeit) und (c) die Freigabe des Steps erbt (nur Dateiklasse „Niedrig", Decision 9). **Pflicht danach:** retro `backlog_add` (Serie `F`) + sofortiges `archive_item` mit Commit-Hash — die Kette Fund → Item → Done Index bleibt lückenlos. Alles andere bleibt reguläres offenes Item (methodisch verankert in PLAYBOOK §0).
9. **Content-Gates: Risiko-Matrix (bindend, 09/2026):** Das Freigabe-Gate (Decision 7) wirkt zeitlich (vor Phasenstart) **und** inhaltlich je Dateiklasse: **Niedrig** — Source-/Test-Edits im Step-Scope → autonom; **Mittel** — Dependency-Manifeste, Dockerfiles → anhalten, Freigabe je Vorkommnis; **Hoch** — `.env`, CI-Workflows, Löschen existierender Tests, Schema-Migrationen → explizites menschliches Gate. Jeder Fall ist in einem Satz entscheidbar (welche Dateiklasse, welche Stufe); die Inline-Fix-Lane (Decision 8) erbt ausschließlich Niedrig (PLAYBOOK §0.5/§0.6).
10. **Versionierung: Lockstep-SemVer (bindend, 09/2026):** Root, `stepwell` und `stepwell-core` tragen **immer dieselbe Version** — feste Kopplung gem. Decision 1 (MCP = dünner Transport über Core), keine Kompatibilitäts-Matrix. SemVer-Zuordnung: **MAJOR** = Breaking im Tool-/JSON-/Resource-Kontrakt (Tool-Name/Parameter entfernt/geändert, Resource-URIs, JSON-Output-Struktur) — immer zusammen mit dem Hochzählen des `schema`-Felds (M6); **MINOR** = neue Tools/Parameter/Features; **PATCH** = Fixes/Doku-Only. Die vier Doku-Dateien können konstruktionsbedingt nie brechen (verbatim, append-only) — „Breaking" betrifft ausschließlich die API-Fläche Richtung Agent/Script. 0.x-Phase bis zum bestandenen Feldtest (Breaking innerhalb MINORs erlaubt, SemVer-0-Regel); **1.0.0 = Freigabe-Moment** nach Feldtest, nicht vorher. Release-Ablauf: `Unreleased` im CHANGELOG (Keep a Changelog 1.1.0, Item L6) sammeln → Version in allen drei package.json + CHANGELOG-Eintrag + Git-Tag `v<version>` → `npm publish` (primär `stepwell`). PLAYBOOK-Sync-Schläge triggern kein npm-Release — sie landen im CHANGELOG unter der Version, mit der sie zufällig ausgeliefert werden.
11. **Tool-Surface-Guardrail (bindend, 09/2026, M4):** Tools gibt es nur für konkrete Struktur-/Lese-Operationen — **keine** Guide-/Meta-/How-to-Tools; Methoden-Anleitung bleibt in den Dateien und Resources (PLAYBOOK, SKILL.md, `stepwell://templates/*`). Jedes neue Tool begründet den Surface-Zuwachs per **Alternativprüfung**: Parameter an ein existierendes Tool oder eine Resource statt eines neuen Tools (Beweis-Format: dokumentierte Entscheidung, wie bei L5/docs_review). Agents entdecken eine kleine, operative Oberfläche besser als eine wachsende. Präzedenzen: L5/docs_review (Review läuft über LESSONS-Checkliste + docs_validate) und L19 (Item-bewusste Suche läuft über grep + backlog_show; Reaktivierung als `query`-Parameter an `backlog_list`).
12. **Archiv-Reihenfolge bei Phasen-Abschluss (bindend, 09/2026, M10):** `progress_update` hängt den Detail-Block beim Phasen-Abschluss **ans Dateiende** an — die Archive bleiben strikt append-only, die Reihenfolge ist **chronologisch nach Abschlusszeit**. Konsequenz: Phasennummern im `PROGRESS_ARCHIVE` dürfen **nicht-monoton** sein (nachgeholter Abschluss einer älteren Phase landet hinter jüngeren, z. B. `… 53 → 55 → 54`). **Kein** Einsortieren an der Phasennummer-Position — das wäre ein Insert in bestehende Historie und damit eine bewusste Abweichung vom Archiv-Muster; Lesbarkeit per Nummer ist nicht die Aufgabe des Archives. Der vollständige, dauerhafte Index bleibt die Fortschrittstabelle in `PROGRESS.md`. Belegt durch Fixture `project-h-completion-order` + Tests (M10/19.3).
13. **Konsum-Schutz: Freeze-Split + Promotion-Ritual (bindend, 11/2026, H3):** Der MCP-Server wird von Live-Konsumern direkt aus diesem Verzeichnis geladen — **global user-scoped** für alle ZCode-Sessions (`~/.zcode/cli/config.json` → `packages/mcp/src/serve.ts`; internal-consumer nutzt ihn so) plus projektlokal in internal-pwa (3× src via tsx, 1× `dist/serve.js`). **Entwicklungslinie ist der Clone `../stepwell-tool-dev` (Branch `dev`)**; `main` im eingefrorenen Verzeichnis ist der Konsumer-Stand und bewegt sich ausschließlich per **Promotion-Ritual:** (1) im Clone typecheck + test + `docs_validate` grün, (2) Feldprobe gegen Live-Konsumer (read-only `docs_status` auf internal-pwa + internal-consumer), (3) Merge `dev` → `main` im eingefrorenen Verzeichnis, (4) `npm run build` dort (dist-Konsumer), (5) bei MAJOR-Kontraktänderung Konsumer-Koordination **vor** dem Merge (Runbook: privat gepflegtes Konsumer-Inventar **außerhalb des Repos** — aus Leak-Gründen nie published, K2/Phase 28), (6) Feldprobe wiederholen. **Kontrakt** = Tool-Namen, Parameter, JSON-Antwortformen, Resource-URIs, Warning-Codes (Änderung ⇒ MAJOR gem. Decision 10); Messages/Prosa bleiben frei. PLAYBOOK/LESSONS-Edits sind Cross-Repo-Kontrakte (wortidentisch in alle Sync-Kopien, SHA256-Evidenz). **Alternativprüfung „kein Migrations-Tool" (Decision 11):** für Doc-Stände sind Toleranzschicht + natürliches Edit die bestehende Migrationsfunktion (Decisions 5/6); Infrastruktur-Migration (MCP-Configs, SKILL-Kopien) ist Runbook-Prosa im privat gepflegten Konsumer-Inventar (außerhalb des Repos), kein Tool. Inventar + Discovery-Hinweis (Registrierungen können user-/session-scoped sein — vor Kontrakt-Änderungen mit dem Nutzer gegenprüfen) ebenda; Durchsetzung automatisiert via Contract-Tests (H4/Phase 25).
14. **Workstream-Worktrees: Git-Satellit, transport-neutral (bindend, 11/2026, H5):** Parallele Phasen laufen als **Workstreams** — je Phase ein Git-Worktree + Branch, Merge je Step zurück zum Stamm (Zielbild + Ritual + Race-Modell: BRAINSTORM „Git integration & parallel phases", Methodik: PLAYBOOK). Tool-Projekt-Konsequenzen: **core bleibt git-blind** (liest/schreibt ausschließlich die vier Doku-Dateien); die Git-Intelligenz (Sync pull/push, Commit-Ausführung, Registry-aus-Git, Overlap-Warnung) lebt in einem **eigenen Satelliten-Workspace-Paket** (abhängig von core, abhängig von keinem Transport). Angeboten **CLI-first** (`stepwell sync pull|push`, `--commit`-Flags — der Weg für Skill-ernährte Agenten ohne MCP-Registrierung) und **MCP-optional** (dieselben Ops als Tools, dünner Transport, Decision 1). **Tool-Surface (M4-Alternativprüfung):** Commit-Automation = Parameter am bestehenden Mutations-Interface (`progress_update`/`archive_item` `commit: true`), kein neues Tool; Commits erfassen **nur die Doku-Datei-Menge** (`docFileSet` — kanonische vier + vorhandene Archiv-Shards, H12/32.x; deterministisches Staging, kein Secret-Risiko), Code-Commits bleiben beim Agenten (PLAYBOOK §4); fehlgeschlagener Doku-Commit (z. B. Hooks) lässt die Edits angewendet + strukturierte Meldung — nie Rollback. Einzige echte Surface-Erweiterung ist das **Sync-Tool** (pull/push, Dry-run-Pflicht, Guards: Dirty-Tree, Nicht-Schnellvorlauf → „re-pull nötig", Konflikt → sauberer Abort mit strukturierter Liste) — Alternativprüfung: kein existierendes Tool kann Merge-Choreografie; als Parameter an `progress_update` würde das Tool mit Git-Pflicht überladen und bräche die „nur Struktur-Operationen"-Grenze. Worktree/Branch-**Anlage und Aufräumen** bleiben Agenten-Ritual (Einmal-Setup, kein Tool). Push-Prüfpflicht (Trunk-Kopf ∈ Vorfahren des Branch) macht veraltete Pushes unmöglich; Trunk-Ableitung zero-config (Branch des Haupt-Worktrees). **Feldtest-Leiter (bindend):** Fixtures → Dogfood im eigenen Repo (M12/M13 als zwei Workstreams) → erst danach ein explizit gewähltes unkritisches Projekt; **internal-pwa wird nie Testbed der Mechanik** — dort nur die etablierten verbatim-Doku-Syncs (SHA256-Evidenz) + read-only Feldproben (Decision 13); Workstream-Modus dort ist ein separater, expliziter Entscheid.
15. **QUICKSTART-Verteilung: stepwell-lokal, keine dritte verbatim-Kopie (bindend, 11/2026, M12):** `docs/QUICKSTART.md` bleibt **lokales Einstiegsdokument des Tool-Repos** — PLAYBOOK/LESSONS bleiben die **einzigen** verbatim-Verteilkopien in Zielprojekte (Cross-Repo-Sync-Pflicht, SHA256-Evidenz). Begründung: QUICKSTART ist ein Einstiegs-Aufhänger, keine Methoden-Gesetzestexte; eine dritte Sync-Kopie würde die Sync-Kette (Methoden-Änderungen ⇒ simultan in alle Kopien) ohne Mehrwert verkomplizieren und Drift-Risiko erzeugen. Auffindbarkeit in Zielprojekten läuft stattdessen über die Verteilkanäle, die dort ohnehin ankommen: SKILL.md (Verteilweg M7), Server-`instructions` (bedingt formuliert) und die Zielprojekt-AGENTS. Alternativprüfung (M4): eine `stepwell://quickstart`-Resource wäre Oberflächenzuwachs ohne bekannten Fund — der QUICKSTART-Text lebt im Dateibaum, den Agenten ohnehin lesen (Kickoff Schritt 0); Reaktivierungs-Kriterium: Feldproben zeigen, dass Agenten QUICKSTART vergeblich im Zielprojekt suchen, dann Resource neu bewerten.
