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
- MCP: `@modelcontextprotocol/sdk` (stdio) — **erst Phase 2**, Version dort festlegen und aktuelle API prüfen (SDK v1 stabil vs. v2-alpha mit `registerTool`/`serveStdio`)

## Befehle

- `npm install` — Abhängigkeiten (Root, Workspaces)
- `npm run typecheck` — alle Workspace-tsconfigs + Root-Konfig (Vitest-Config)
- `npm run test` / `npm run test:watch` — Vitest
- `npm run build` — Workspaces (ab Phase 2 relevant)

## Struktur

| Pfad | Zweck |
|------|-------|
| `packages/core` | Parser + Reports + Validierung — **keine** MCP-Abhängigkeit |
| `packages/mcp` | Dünne MCP-Schicht über core (Phase 2) |
| `packages/*/tests` | Tests je Paket — **werden typegeprüft** (Lesson L12) |
| `docs/PLAYBOOK.md` | Methode (verbatim) |
| `docs/LESSONS.md` | Checkliste (verbatim) |
| `PROGRESS.md` | Step-Paketierung + Fortschritt |
| `BACKLOG.md` | Offene Punkte |

## Kickoff für neue Sessions (in dieser Reihenfolge)

1. `docs/PLAYBOOK.md` (Methode) + `docs/LESSONS.md` (Checkliste) lesen — beide bindend.
2. `PROGRESS.md` → „Laufende Phasen": nächster offener Step in definierter Reihenfolge
   (Phasen 1–12 sind abgeschlossen und archiviert — 11 „Methoden-Sync: Mess-Lesson" (G4),
   12 „Token-Ökonomie" (E1/E2/G5); Phase 13 „Naming-Refactor" ist vorausgeplant.
   Achtung: 13.1–13.3 berühren Dependency-Manifeste/Tool-Kontrakte → Content-Gate
   **Mittel** gem. Decision 15 (Freigabe je Vorkommnis), 13.4 (Repo-Rename) ist
   explizites menschliches Gate; Freigabe-Gate gem. Decision 13 — Code-Steps erst
   nach expliziter menschlicher Freigabe; Backlog-Wurzel-Pflicht gem. Decision 14).
3. **Testdaten:** `packages/core/tests/fixtures/` — die `README.md` dort ist die arbeitende
   Spezifikation für 1.2–1.6 (erwartete Parser-Ergebnisse + Validate-Funde D1–D15).
   `project-a` = sauberes Musterprojekt (Parser-Positivpfad) · `project-b-drift` = absichtliche Drift-Fälle (Toleranz + Validate).
4. **Realformat-Referenz (nur lesen, nicht verändern):** Geschwister-Repo `../stadtpfad-pwa`
   (`BACKLOG.md`, `PROGRESS.md`, `docs/archive/*`) — Original der Struktur.
5. Verifikation vor jedem Abschluss: `npm run typecheck` + `npm run test` (Test-First: ROT → GRÜN).

## Architektur-Entscheidungen

1. **Zwei Schichten:** core ist bibliotheks-fähig (CLI/CI später fast gratis); MCP ist nur Transport.
2. **Fehlertoleranter Parser:** Projekte folgen der Methode, nicht byte-genau. Parser-Drift → strukturierte Warnung im `ParseResult` (Decision 6), kein Crash; `docs_validate` sammelt sie ein.
3. **Archiv-Muster respektieren:** Archive sind append-only; `archive_item` (Phase 3) verschiebt verbatim + Einzeiler im Erledigt-Index, Dry-run zuerst.
4. **Fixtures:** Parser-Steps testen gegen realistische, anonymisierte Fixtures (abgeleitet aus stadtpfad-pwa; Sektionen mit Kopfregeln, R-/U-Serien, Erledigt-Index, Emoji-Prios).
5. **Nomenklatur:** Der **Parser** macht keine Format-Annahmen an Item-IDs (`id` = Token zwischen Checkbox und erstem ` — `; Gleichheit exakt nach Trim, case-sensitiv). Die **Konvention** (PLAYBOOK §3) ist `<Serienbuchstabe><Nummer>` (`^[A-Z][0-9]+$`): `K`/`H`/`M`/`L` = Prioritäts-Serien, sonst thematische Serien; Nummern fortlaufend, nie wiederverwendet. `docs_validate` warnt (`ID_CONVENTION`), wenn ein Item die Konvention verletzt — Warnung, nie Abbruch.
6. **Datenmodell (ab 1.2 bindend):** `ParseResult<T> = { value, warnings[] }` mit einheitlichem `Warning = { code, file, line?, message }` — Parse-Warnungen (einzelne Datei) vs. Validate-Funde (Querkonsistenz) getrennt; `docs_validate` aggregiert. Item-Blöcke tragen `span` (Zeilenbereich) + `raw` (verbatim-Block) als Basis für die verbatim-Verschiebung in Phase 3 (Lesson L16).
7. **Multi-Projekt:** Der Projekt-Root wird je Tool-Call übergeben — eine MCP-Instanz bedient beliebig viele PLAYBOOK-Projekte; Resources als Templates mit Root im URI.
8. **Stack final (TS/Node):** Bewusst gegen Python/Rust entschieden — MCP-SDK ist in TS First-Class, `npx` verteilt das Tool mühelos in Zielprojekte (Node dort omnipräsent), und die Workload (wenige Markdown-Dateien) ist perf-irrelevant, sodass kein Stack-Vorteil den Neuanfang rechtfertigt. „Schlank" wird erreicht durch: Zero-Dependencies-Kern (zeilenbasiertes Parsen, kein markdown-AST-Framework), faules Parsen (nur die Dateien, die ein Tool-Call braucht), stdio-Server ohne Daemon/Caches.
9. **Dokument-Zuordnung:** Regel lebt bindend in PLAYBOOK §2 (committete Phasenfolge → `PROGRESS.md`, alles andere Offene → `BACKLOG.md` mit Fundstelle + Abnahmekriterium). Projektspezifische Konsequenz hier: BACKLOG ist prioritäts-sortiert (🔴→🔵), nicht reihenfolge-sortiert — Sequenz-Information lebt ausschließlich in PROGRESS.
10. **Sprache: Englisch primär für Struktur/API/Messages (bindend, 09/2026, erweitert I1/14.1):** **Englisch** als Primärsprache für alles Strukturelle und Tool-Seitige — Sektions-Headings, Feld-Labels (Location, Acceptance, Verification, Scope), Erledigt-Index (Done Index), Statuswörter, Tool-Beschreibungen, CLI-Help, Warning-Messages, Templates, PLAYBOOK/LESSONS/AGENTS/README/SKILL. **Inhaltstexte** (Item-Bodies, Notizen, Nutzertexte) bleiben bewusst sprachfrei — jeder schreibt sie in seiner Sprache. Begründung: API/Struktur-Code und Prosa bleiben deckungsgleich; Nicht-Deutschsprachige können die Methode lesen. **Übergangs-Toleranz:** Legacy-DE-Labels in offenen Dateien still gelesen (Union-Matching liest DE+EN), `docs_validate` meldet sie als `STRUCT_LOCALE`-Warnung nach `DATE_LEGACY`-Muster — **nur in offenen Dateien**, nie im append-only-Archiv. Verbleibende deutsche Begriffe (Erledigt-Index, Fundstelle, …) leben nur in historischer Prosa — Migration in 14.2 macht sie zu kanonischen EN-Begriffen oder dokumentiert die Toleranz.
    *Vorher (subsumiert, unverändert gültig):* Sämtliche Code- und Tool-Begriffe sind englisch — Typen (`BacklogItem`, `ProgressRow`), Feldnamen (`title`, `priority`, `open`, `location`, `raw`, `span`, `step`, …), Tool-Namen (`docs_status`, …), Parameter (`root`, `dryRun`, `step`, `note`), Warn-Codes (`PRIO_MISSING`, …); dieselben englischen Begriffe (z. B. „Step") werden auch in der Prosa verwendet. Verbleibende deutsche Begriffe leben nur in Prosa/Doku — nie in der API. `message`-Inhalte von Warnungen sind menschenlesbar und dürfen deutsch sein.
11. **Zeitstempel + Migration (bindend):** Datums-/Zeit-Einträge in den vier Doku-Dateien immer als `JJMMDD/HHMM` (z. B. `260907/1523`) — nie nur `MM/JJJJ` (zu ungenau). Der `MM/JJJJ`-Bestand wird toleriert; `docs_validate` warnt (`DATE_LEGACY`) — wie `ID_CONVENTION` — **nur in offenen Dateien**, nie im append-only-Archiv. Migration Bestandsprojekte: offene Dateien beim nächsten natürlichen Edit umstellen, Archive nie anfassen, neue Projekte starten mit allen vier Dateien (PLAYBOOK §3).
12. **Methoden-Name „STEPWELL":** Die Arbeitsweise trägt einen eigenen Namen (Untertitel in PLAYBOOK/README). Kollisions-Check 09/2026: „STEP"/„STEPcode" ist belegt (ISO 10303; NIST-Fork stepcode), „STAIRS" durch eine formale Methode — STEPWELL ist im Tech-Kontext frei und hält die Step-Metapher: viele kleine, jede tragende Steps.
13. **Freigabe-Gate + Tool-Pflicht (bindend, 09/2026):** Der Übergang von Planung/Paketierung zur Implementierung erfolgt **erst nach expliziter menschlicher Freigabe** (PLAYBOOK §0.4) — Agenten paketieren vor, starten Code-Steps nicht eigenmächtig. Das Gate ist zeitlich **und** inhaltlich: Content-Gates je Dateiklasse siehe Decision 15. Struktur-Operationen (Statuspflege, Archivierung, Erledigt-Index) laufen **immer** über `progress_update`/`archive_item`, niemals per Hand (LESSONS 17); direkte Edits nur für Prosa, die das Tool bewusst nicht verwaltet. Der MCP-Server trägt den Methoden-Namen (`stepwell`).
14. **Workflow: Backlog-Wurzel + Inline-Fix-Lane (bindend, 09/2026):** Jede geplante Arbeit hat eine **BACKLOG-Wurzel** — Phasen werden aus offenen Items paketiert (Verweis Item → Step wird je Item dokumentiert), nicht direkt aus der Chat-Planung. Einzige Ausnahme ist die **Inline-Fix-Lane:** Ein während eines laufenden, freigegebenen 🔄-Steps entdeckter Bug darf sofort gefixt werden, wenn er (a) im Code-Scope des Steps liegt, (b) klein ist (Faustregel ≤ ~10 Zeilen, keine API-/Schema-/Design-Entscheidung, keine neue Abhängigkeit) und (c) die Freigabe des Steps erbt (nur Dateiklasse „Niedrig", Decision 15). **Pflicht danach:** retro `backlog_add` (Serie `F`) + sofortiges `archive_item` mit Commit-Hash — die Kette Fund → Item → Erledigt-Index bleibt lückenlos. Alles andere (außerhalb des Step-Scope, zu groß, Fund ohne laufenden Step) bleibt reguläres offenes Item. Methoden-Seitig verankert in PLAYBOOK §0 (Sync-Schlag 09/2026).
15. **Content-Gates: Risiko-Matrix (bindend, 09/2026):** Das Freigabe-Gate (Decision 13) wirkt zeitlich (vor Phasenstart) **und** inhaltlich je Dateiklasse: **Niedrig** — Source-/Test-Edits im Step-Scope → autonom; **Mittel** — Dependency-Manifeste, Dockerfiles → anhalten, Freigabe je Vorkommnis; **Hoch** — `.env`, CI-Workflows, Löschen existierender Tests, Schema-Migrationen → explizites menschliches Gate. Jeder Fall ist in einem Satz entscheidbar (welche Dateiklasse, welche Stufe); die Inline-Fix-Lane (Decision 14) erbt ausschließlich Niedrig. Methoden-Seitig verankert in PLAYBOOK §0.5/§0.6.
16. **Versionierung: Lockstep-SemVer (bindend, 09/2026):** Root, `stepwell` und `stepwell-core` tragen **immer dieselbe Version** — feste Kopplung gem. Decision 1 (MCP = dünner Transport über Core), keine Kompatibilitäts-Matrix. SemVer-Zuordnung: **MAJOR** = Breaking im Tool-/JSON-/Resource-Kontrakt (Tool-Name/Parameter entfernt/geändert, Resource-URIs, JSON-Output-Struktur) — immer zusammen mit dem Hochzählen des `schema`-Felds (M6); **MINOR** = neue Tools/Parameter/Features; **PATCH** = Fixes/Doku-Only. Die vier Doku-Dateien können konstruktionsbedingt nie brechen (verbatim, append-only) — „Breaking" betrifft ausschließlich die API-Fläche Richtung Agent/Script. 0.x-Phase bis zum bestandenen Feldtest (Breaking innerhalb MINORs erlaubt, SemVer-0-Regel); **1.0.0 = Freigabe-Moment** nach Feldtest, nicht vorher. Release-Ablauf: `Unreleased` im CHANGELOG (Keep a Changelog 1.1.0, Item L6) sammeln → Version in allen drei package.json + CHANGELOG-Eintrag + Git-Tag `v<version>` → `npm publish` (primär `stepwell`). PLAYBOOK-Sync-Schläge triggern kein npm-Release — sie landen im CHANGELOG unter der Version, mit der sie zufällig ausgeliefert werden.
17. **Tool-Surface-Guardrail (bindend, 09/2026, M4):** Tools gibt es nur für konkrete Struktur-/Lese-Operationen — **keine** Guide-/Meta-/How-to-Tools; Methoden-Anleitung bleibt in den Dateien und Resources (PLAYBOOK, SKILL.md, `stepwell://templates/*`). Jedes neue Tool begründet den Surface-Zuwachs per **Alternativprüfung**: Parameter an ein existierendes Tool oder eine Resource statt eines neuen Tools (Beweis-Format: dokumentierte Entscheidung, wie bei L5/docs_review). Agents entdecken eine kleine, operative Oberfläche besser als eine wachsende.

18. **Endgültiges Naming — STEPWELL durchgängig (bindend, 09/2026, N1/13.3):** Paketnamen (`stepwell` flat für MCP + CLI; `stepwell-core` flat für die Bibliothek), Bin-Name (`stepwell`), TOOL_NAME (`stepwell`), MCP-Server-Name (`stepwell`, `serverInfo.name`), Resource-URI-Schema (`stepwell://templates/{kind}`, `stepwell://{root}/...`), Repo-Pfad (`stepwell-tool`, 13.4). **Kein** `@stepwell/*`-Scope, kein `@method-docs/*`-Rest. Begründung: nach erstem npm-Publish wäre ein Rename teuer (Deprecation/Aliase); die Halb-Migration mit halb-aktualisierten Arteen war bereits verwirrender als jedes der beiden Extreme. Lockstep-SemVer Decision 16 erzwingt dieselbe Version auf allen Arteen. Archive bleiben append-only und behalten historische Namen als Belegstellen; nur offene Dateien werden auf den neuen Stand migriert.
