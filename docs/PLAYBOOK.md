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
3. **Freigabe-Gate (bindend):** Der Übergang von Planung und Paketierung zur Implementierung erfolgt **erst nach expliziter Freigabe durch den Menschen** — Agenten wie Menschen paketieren vor, implementieren aber erst auf Freigabe.
4. **Implementieren:** Erst danach wird implementiert — Step für Step nach den Regeln unten (Test-First, Verifikation, Commit).

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

## 3. Wachstumsbegrenzung (Archiv-Muster)

`BACKLOG.md` und `PROGRESS.md` enthalten nur **Offenes**:

- **Erledigtes Backlog-Item:** vollständigen Block **unverändert** in `docs/archive/BACKLOG_ARCHIVE.md` verschieben; in `BACKLOG.md` bleibt ein Einzeiler im Erledigt-Index (mit Commit-Hash).
- **Abgeschlossene Phase:** Detail-Block **unverändert** in `docs/archive/PROGRESS_ARCHIVE.md` verschieben; die **Fortschrittstabelle bleibt vollständig** in `PROGRESS.md` (dauerhafter Index).
- Archive sind **append-only Historie** — Inhalte dort nicht nachbearbeitet.

### Item-ID-Nomenklatur (bindend)

Item-IDs folgen dem Muster `<Serienbuchstabe><Nummer>` (z. B. `H1`, `R4`, `U21`):

- **Serienbuchstabe:** `K`/`H`/`M`/`L` = Prioritäts-Serien (🔴/🟠/🟡/🟢); weitere Buchstaben = thematische Serien (z. B. `T` = Test-Lücken, `R`/`U` = Review-/Themen-Reihen).
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

## 4. Commit-Disziplin

- Commit nach jedem abgeschlossenen Step, zwingend nach jeder vollständig abgeschlossenen Phase.
- Vor dem Commit: `git status`, `git diff`, `git log --oneline -10` inspizieren.
- Nur intendierte Dateien stagen. Keine Secrets, keine `.env`-Dateien.
- Konsistente, kurze Commit-Messages im Repo-Stil (imperativ, Englisch, kleingeschrieben, z. B. `feat: add env config`).
- Schlägt ein Commit fehl (Hooks): Fehler fixen und neuen Commit erstellen — nicht amendieren.

## 5. Verifikation vor Abschluss

- Typprüfung (strict), Unit-/Integration-Suite und E2E-Suite müssen **fehlerfrei** laufen (projektspezifische Befehle: siehe `AGENTS.md`).
- Kein Step als „fertig" markieren ohne bestandene Verifikation.

## 6. Test-First (ROT → GRÜN) — bindend

- **Jeder geschriebene Code muss von Tests abgedeckt werden.** Kein Feature-/Step-Code ohne zugehörige Tests.
- Reihenfolge: **zuerst** die Tests schreiben (sie schlagen anfangs fehl = ROT, weil die Funktion noch fehlt), **dann** die Implementierung, bis die Tests grün sind (GRÜN).
- Damit steht am Ende jedes Steps eine reproduzierbare Test-Suite, die die Umsetzung belegt.
- Ausnahmen nur, wenn Tests objektiv nicht sinnvoll sind (z. B. reine Konfigurations-/Strukturdateien); der Grund wird im Commit vermerkt.
- Neue Tests gehören ins zentrale Testverzeichnis und werden von der Standard-Suite erfasst.

## 7. Status-Legende

⬜ offen · 🔄 in Arbeit · ✅ fertig · ⛔ blockiert (mit kurzer Begründung).

Ein blockierter Step wird **nie** als fertig gemeldet; der Blocker gehört — sofern er ein echter offener Punkt ist — als Item ins `BACKLOG.md`, damit er nicht verloren geht.
