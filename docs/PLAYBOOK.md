# PLAYBOOK.md — STEPWELL-Arbeitsweise (projektunabhängig, wiederverwendbar)

> Verallgemeinerte Methode, extrahiert aus dem Stadtpfad-Projekt (09/2026).
> Die Dateinamen (`BACKLOG.md`, `PROGRESS.md`, `docs/archive/*`) sind Teil des Musters —
> beim Kopieren in ein neues Projekt unverändert übernehmen.
> Gilt für Menschen und AI-Agenten gleichermaßen.
> Die Methode heißt **STEPWELL** — wie ein Stufenbrunnen: viele kleine, jede
> tragende Steps, Schicht um Schicht.
> Methoden-Änderungen (diese Datei, LESSONS.md) erfolgen **simultan in allen Kopien** —
> weicht eine Projektkopie ab, sofort Sync-Eintrag in deren `BACKLOG.md`.

## 0. Planung vor Umsetzung (Workflow — bindend)

Die Reihenfolge ist immer: **Planen → Paketieren → Implementieren.**

1. **Planen:** Vor jeder Umsetzung werden die Schritte zuerst geplant (Ziel, Umfang, Reihenfolge, Risiken) — keine Implementierung „aus dem Handgelenk".
2. **Paketieren:** Der Plan wird in `PROGRESS.md` in konkrete Aufträge mit **kleinen Step** zerlegt (nummeriert, mit Status und kurzem Umfang je Step).
3. **Backlog-Wurzel (bindend):** Jeder Step einer Phase ist aus mindestens einem offenen Item in `BACKLOG.md` abgeleitet (Verweis Item → Step wird je Item dokumentiert) — die Kette Fund → Item → Step bleibt lückenlos; Planung entsteht nicht lautlos im Chat.
4. **Freigabe-Gate (bindend):** Der Übergang von Planung und Paketierung zur Implementierung erfolgt **erst nach expliziter Freigabe durch den Menschen** — Agenten wie Menschen paketieren vor, implementieren aber erst auf Freigabe.
5. **Content-Gates (Risiko-Matrix, bindend):** Die Freigabe wirkt zeitlich (vor Phasenstart) **und** inhaltlich je Dateiklasse: **Niedrig** — Source-/Test-Edits im Step-Scope → autonom; **Mittel** — Dependency-Manifeste, Dockerfiles → anhalten, Freigabe je Vorkommnis; **Hoch** — `.env`, CI-Workflows, Löschen existierender Tests, Schema-Migrationen → explizites menschliches Gate. Jeder Fall ist in einem Satz entscheidbar: welche Dateiklasse, welche Stufe.
6. **Inline-Fix-Lane (einzige Ausnahme von der Step-Grenze, bindend):** Ein während eines freigegebenen, laufenden Steps entdeckter Bug darf sofort gefixt werden, wenn er (a) im Code-Scope des Steps liegt, (b) klein ist (Faustregel ≤ ~10 Zeilen; keine API-/Schema-/Design-Entscheidung, keine neue Abhängigkeit) und (c) ausschließlich die Dateiklasse „Niedrig" berührt. **Pflicht danach:** retro als Item (Serie `F`) ins `BACKLOG.md` und sofortige Archivierung mit Commit-Hash — die Kette Fund → Item → Erledigt-Index bleibt lückenlos. Alles andere bleibt reguläres offenes Item.
7. **Implementieren:** Erst danach wird implementiert — Step für Step nach den Regeln unten (Test-First, Verifikation, Commit).
8. **Session-Einstieg (bindend):** Jede Session startet in dieser Reihenfolge: (1) Diese Datei und `LESSONS.md` lesen; (2) `PROGRESS.md` — den nächsten offenen Step der laufenden Phase identifizieren und als 🔄 markieren; (3) `BACKLOG.md` für offene Items und Blocker sichten. Erst danach folgen Schreiboperationen an Code oder Doku.

## 1. Sequenzielles Vorgehen

- Arbeit NIEMALS willkürlich. Step für Step in der definierten Reihenfolge abarbeiten.
- Jedes Step baut auf dem vorherigen auf. Ein neues Step erst starten, wenn das vorherige **verifiziert** abgeschlossen ist.
- Nach Abschluss der Grund-Phasen: Weiterarbeit aus `BACKLOG.md` nach Priorität (🔴 → 🟠 → 🟡 → 🟢 → 🔵), gleiche Regeln (Test-First, Verifikation, Commit pro Item/Gruppe).

## 2. Dokumentationspflicht (lebende Dokumente — bindend)

`README.md`, `PROGRESS.md` und `BACKLOG.md` sind **lebende Dokumente und müssen immer aktuell sein:**

- **Nach jedem Step:** Status in `PROGRESS.md` pflegen (🔄 vor Beginn, ✅ nach verifiziertem Abschluss — Detail-Liste UND Fortschrittstabelle).
- **Nach jeder Verhaltens-/Feature-/Umgebungsänderung:** `README.md` anpassen (Features, Befehle, Env-Variablen, Deploy).
- **Bei jedem gefundenen Fehler/Risiko/Checklisten-Mangel:** Eintrag in `BACKLOG.md` (mit Fundstelle + Abnahmekriterium).
- **Zuordnung:** Die committete Phasenfolge lebt in `PROGRESS.md` („Laufende Phasen") — auch grob paketiert (Fein-Paketierung bei Phasenstart). Alles Offene **außerhalb** dieser Folge (Ideen, Feature-Requests, Risiken, Funde) gehört als Item ins `BACKLOG.md` — mit Fundstelle + Abnahmekriterium. Entscheidungshilfe: „Gehört es zur festgelegten Phasenfolge?" → PROGRESS; sonst → BACKLOG.
- Es gilt: **kein Code ohne Step in `PROGRESS.md`, kein bekanntes Problem ohne Eintrag in `BACKLOG.md`.**

### Language (binding, 09/2026)

The structural language of the method is **English primary**: section headings, field labels (Location, Acceptance, Verification, Scope), the Done Index (was: Erledigt-Index), status words, tool descriptions, CLI help, warning messages, templates, PLAYBOOK/LESSONS/AGENTS/README/SKILL. **Content texts** (item bodies, notes, user prose) stay deliberately language-free — everyone writes them in their language. Rationale: structure/API code and prose stay congruent; non-German speakers can read the method. **Transition tolerance:** legacy DE-labels in open files are silently read by the parser (union-matching reads DE+EN); `docs_validate` reports them as `STRUCT_LOCALE` warning following the `DATE_LEGACY` pattern — **only in open files**, never in the append-only archive. Migration: open files at the next natural edit (Phase 14, Step 14.2 in `stepwell-tool`); archives never touched; new projects start directly with EN templates. Method-changes to this language convention apply synchronously in both PLAYBOOK/LESSONS copies (textually identical, SHA256-evidence per copy).

## 3. Wachstumsbegrenzung (Archiv-Muster)

`BACKLOG.md` und `PROGRESS.md` enthalten nur **Offenes**:

- **Erledigtes Backlog-Item:** vollständigen Block **unverändert** in `docs/archive/BACKLOG_ARCHIVE.md` verschieben; in `BACKLOG.md` bleibt ein Einzeiler im Erledigt-Index (mit Commit-Hash).
- **Abgeschlossene Phase:** Detail-Block **unverändert** in `docs/archive/PROGRESS_ARCHIVE.md` verschieben; die **Fortschrittstabelle bleibt vollständig** in `PROGRESS.md` (dauerhafter Index).
- Archive sind **append-only Historie** — Inhalte dort nicht nachbearbeitet.

### Item-ID-Nomenklatur (bindend)

Item-IDs folgen dem Muster `<Serienbuchstabe><Nummer>` (z. B. `H1`, `R4`, `U21`):

- **Serienbuchstabe:** `K`/`H`/`M`/`L` = Prioritäts-Serien (🔴/🟠/🟡/🟢); weitere Buchstaben = thematische Serien (z. B. `T` = Test-Lücken, `R`/`U` = Review-/Themen-Reihen).
- **🔵 = Test-Lücken:** Die Priorität 🔵 kennzeichnet Test-Lücken als Item-Klasse; solche Items tragen thematische Serien-IDs (z. B. `T5`) und erhalten **keine** Auto-Nummer aus einer Prioritäts-Serie — die ID wird explizit vergeben.
- **Nummer:** innerhalb der Serie fortlaufend, aufsteigend, **nie wiederverwendet** — auch nicht nach Archivierung (Append-only-Historie verträgt keine ID-Kollisionen).
- **Eindeutigkeit:** IDs sind projektweit eindeutig über offene Items, Erledigt-Index und Archive — case-sensitiv, exakter Vergleich.
- **Getrennte Namespaces:** Item-IDs (`BACKLOG.md`) und Step-Nummern in der Fortschrittstabelle (`<Phase>.<Nr.>`, z. B. `2.1`) haben nichts miteinander zu tun.

### Zeitstempel (bindend)

Datums-/Zeit-Angaben in den vier Doku-Dateien werden immer im Format `JJMMDD/HHMM` angelegt (z. B. `260907/1523`) — betrifft `*(erledigt …)*`- und `*(abgeschlossen …)*`-Marker sowie `Stand:`-Kopfzeilen. Der 4-stellige `MM/JJJJ`-Bestand bleibt gültig (Toleranz), wird aber nicht mehr neu angelegt.

### Migration Bestandsprojekte (bindend)

- Archive werden **nie** nachbearbeitet (append-only) — Altformate bleiben dort dauerhaft gültig.
- Offene Dateien (`BACKLOG.md`, `PROGRESS.md`): Umstellung auf ID-Nomenklatur und Zeitstempelformat erfolgt beim nächsten natürlichen Edit — kein Sammel-Umbau, keine Sonder-Aktion.
- Konventions-Warnungen (`ID_CONVENTION`, `DATE_LEGACY`) betreffen **nur offene Dateien**, nie Archive.
- Neue Projekte legen **alle vier Dateien** (inkl. leerer Archive) bei Projektstart an.

### Erledigt-Index-Formate (bindend)

- **Kanonisch** ist der Bullet-Einzeiler je erledigtem Item: `- <ID> — <Kurztext> — erledigt in <sha> …` — alle Schreibpfade (auch Tools) erzeugen genau dieses Format.
- **Toleriert beim Lesen:** Ein Erledigt-Index als Tabelle (`| Serie | Item (kurz) | Commit/Phase |`) wird erkannt und geparst (Spalte `Item` → ID + Kurztext, Spalte `Commit/Phase` → Commit-Hash); neu angelegt wird sie nicht — Bestands-Tabellen migrieren beim nächsten natürlichen Edit in Einzeiler.
- **Kompakt-Zeilen sind Drift:** Range-Zeilen (`L1–L11 …`) und Sammel-Zeilen (`R1 … + R1-A …`) gelten nicht als Index-Eintrag je Item — die Validierung meldet jeden `[x]`-Archiv-Block ohne eigenen Einzeiler als Fund.

### Adoption Bestandsprojekte (bindend)

Die Einführung von STEPWELL in einem Projekt **ohne** die vier Dateien (Gray-/Brownfield) folgt diesem Modell — Greenfield-Projekte starten direkt mit allen vier Dateien:

1. **Adoption = Snapshot:** Die vier Dateien werden beim Adoptions-Commit mit dem IST-Zustand angelegt: `BACKLOG.md` nur mit den **bekannten** offenen Punkten, Erledigt-Index und Archive **leer**, `PROGRESS.md` mit genau einer Zeile `0.1 STEPWELL-Adoption (Baseline <sha>)` ✅ — keine rückwirkende Historie, nie.
2. **Budget-Inventar:** Ein zeitgeboxter Inventar-Step (Kopf-Wissen, TODO-/FIXME-Scan, Issue-Import) füllt `BACKLOG.md` mit den wichtigsten Items. Danach entsteht BACKLOG-Wissen nur noch in Arbeit: Fund → Item.
3. **Verifikationsstufen (deklariert in der `PROGRESS.md`-Kopfzeile):** **Stufe 0** — kein automatisierter Test (Verifikation als Prüfprotokoll in der Step-Notiz; neue Kernlogik bringt ihren Test mit) · **Stufe 1** — Characterization-/Golden-Master-Tests (dürfen grün sein — Beobachtung vor Spezifikation) · **Stufe 2** — volles ROT→GRÜN. Ein Stufenwechsel ist ein Commit.
4. **Strangler-Prinzip:** Die STEPWELL-Standards gelten für neue Arbeit und angefasste Zonen — keine Sanierungsphase, keine Großumstellung des Bestands.

## 4. Commit-Disziplin

- Commit nach jedem abgeschlossenen Step, zwingend nach jeder vollständig abgeschlossenen Phase.
- Vor dem Commit: `git status`, `git diff`, `git log --oneline -10` inspizieren.
- Nur intendierte Dateien stagen. Keine Secrets, keine `.env`-Dateien.
- Konsistente, kurze Commit-Messages im Repo-Stil (imperativ, Englisch, kleingeschrieben, z. B. `feat: add env config`).
- Test-First-Kette auditierbar im Log: neue Tests zuerst im eigenen `test(scope): …`-Commit (die Suite ist ROT; der Failure-Beleg steht in der Commit-Message bzw. der Step-Notiz), danach `feat(scope): …` mit der Implementierung.
- Schlägt ein Commit fehl (Hooks): Fehler fixen und neuen Commit erstellen — nicht amendieren.

## 5. Verifikation vor Abschluss

- Typprüfung (strict), Unit-/Integration-Suite und E2E-Suite müssen **fehlerfrei** laufen (projektspezifische Befehle: siehe `AGENTS.md`).
- Kein Step als „fertig" markieren ohne bestandene Verifikation.
- **Optional — Smell-Budget (Qualitäts-Gate):** Wer es in der `PROGRESS.md`-Kopfzeile deklariert, für den gilt: (1) **Weiche Smells** (Feature Envy, Gott-Konzept, Namensgebung) sind Funde → Items im `BACKLOG.md`, nie Gates. (2) **Harte Smells** (Datei-/Funktionslänge, Komplexität, Duplikation, Lint-Regeln) bilden ein **Delta-Budget**: Ein Step darf die Smell-Last seiner angefassten Dateien nicht erhöhen; Absolut-Schwellen nur in Greenfield ab Tag 1, Schwellen werden nur gesenkt und nur beim natürlichen Anlass aktualisiert. (3) Ein Delta-Report ist Freigabe-Kontext, nie Sperre — das Gate bleibt binär (Budget eingehalten ja/nein, lokal oder in CI prüfbar). Wer nichts deklariert, hat kein Budget.

## 6. Test-First (ROT → GRÜN) — bindend

- **Jeder geschriebene Code muss von Tests abgedeckt werden.** Kein Feature-/Step-Code ohne zugehörige Tests.
- Reihenfolge: **zuerst** die Tests schreiben (sie schlagen anfangs fehl = ROT, weil die Funktion noch fehlt), **dann** die Implementierung, bis die Tests grün sind (GRÜN).
- **ROT wird belegt, nicht behauptet:** Die ROT-Phase ist Teil des Nachweises — neuer Test zuerst im eigenen `test(scope): …`-Commit mit Failure-Beleg (Commit-Message oder Step-Notiz), erst dann der `feat(scope): …`-Implementierungs-Commit (siehe §4).
- Damit steht am Ende jedes Steps eine reproduzierbare Test-Suite, die die Umsetzung belegt.
- Ausnahmen nur, wenn Tests objektiv nicht sinnvoll sind (z. B. reine Konfigurations-/Strukturdateien); der Grund wird im Commit vermerkt.
- Neue Tests gehören ins zentrale Testverzeichnis und werden von der Standard-Suite erfasst.
- **Verifikation als ausführbarer Plan (Konvention):** Die Verifikations-Zeile/-Liste eines Steps (Step-Notiz, Commit-Message bzw. `**Verifikation:**`-Zeile am Archiv-Block) nennt mindestens **einen nachlaufbaren Befehl** und das **erwartete Ergebnis** (z. B. `npm run typecheck && npm run test` — beide grün). Bewusst ohne Validate-Warnung — reine Konvention, kein Gate.

## 7. Status-Legende

⬜ offen · 🔄 in Arbeit · ✅ fertig · ⛔ blockiert (mit kurzer Begründung).

Ein blockierter Step wird **nie** als fertig gemeldet; der Blocker gehört — sofern er ein echter offener Punkt ist — als Item ins `BACKLOG.md`, damit er nicht verloren geht.
