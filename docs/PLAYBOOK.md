# PLAYBOOK.md — Arbeitsweise (projektunabhängig, wiederverwendbar)

> Verallgemeinerte Methode, extrahiert aus dem Stadtpfad-Projekt (09/2026).
> Die Dateinamen (`BACKLOG.md`, `PROGRESS.md`, `docs/archive/*`) sind Teil des Musters —
> beim Kopieren in ein neues Projekt unverändert übernehmen.
> Gilt für Menschen und AI-Agenten gleichermaßen.

## 0. Planung vor Umsetzung (Workflow — bindend)

Die Reihenfolge ist immer: **Planen → Paketieren → Implementieren.**

1. **Planen:** Vor jeder Umsetzung werden die Schritte zuerst geplant (Ziel, Umfang, Reihenfolge, Risiken) — keine Implementierung „aus dem Handgelenk".
2. **Paketieren:** Der Plan wird in `PROGRESS.md` in konkrete Aufträge mit **kleinen Häppchen** zerlegt (nummeriert, mit Status und kurzem Umfang je Häppchen).
3. **Implementieren:** Erst danach wird implementiert — Häppchen für Häppchen nach den Regeln unten (Test-First, Verifikation, Commit).

## 1. Sequenzielles Vorgehen

- Arbeit NIEMALS willkürlich. Häppchen für Häppchen in der definierten Reihenfolge abarbeiten.
- Jedes Häppchen baut auf dem vorherigen auf. Ein neues Häppchen erst starten, wenn das vorherige **verifiziert** abgeschlossen ist.
- Nach Abschluss der Grund-Phasen: Weiterarbeit aus `BACKLOG.md` nach Priorität (🔴 → 🟠 → 🟡 → 🟢 → 🔵), gleiche Regeln (Test-First, Verifikation, Commit pro Item/Gruppe).

## 2. Dokumentationspflicht (lebende Dokumente — bindend)

`README.md`, `PROGRESS.md` und `BACKLOG.md` sind **lebende Dokumente und müssen immer aktuell sein:**

- **Nach jedem Häppchen:** Status in `PROGRESS.md` pflegen (🔄 vor Beginn, ✅ nach verifiziertem Abschluss — Detail-Liste UND Fortschrittstabelle).
- **Nach jeder Verhaltens-/Feature-/Umgebungsänderung:** `README.md` anpassen (Features, Befehle, Env-Variablen, Deploy).
- **Bei jedem gefundenen Fehler/Risiko/Checklisten-Mangel:** Eintrag in `BACKLOG.md` (mit Fundstelle + Abnahmekriterium).
- Es gilt: **kein Code ohne Häppchen in `PROGRESS.md`, kein bekanntes Problem ohne Eintrag in `BACKLOG.md`.**

## 3. Wachstumsbegrenzung (Archiv-Muster)

`BACKLOG.md` und `PROGRESS.md` enthalten nur **Offenes**:

- **Erledigtes Backlog-Item:** vollständigen Block **unverändert** in `docs/archive/BACKLOG_ARCHIVE.md` verschieben; in `BACKLOG.md` bleibt ein Einzeiler im Erledigt-Index (mit Commit-Hash).
- **Abgeschlossene Phase:** Detail-Block **unverändert** in `docs/archive/PROGRESS_ARCHIVE.md` verschieben; die **Fortschrittstabelle bleibt vollständig** in `PROGRESS.md` (dauerhafter Index).
- Archive sind **append-only Historie** — Inhalte dort nicht nachbearbeitet.

## 4. Commit-Disziplin

- Commit nach jedem abgeschlossenen Häppchen, zwingend nach jeder vollständig abgeschlossenen Phase.
- Vor dem Commit: `git status`, `git diff`, `git log --oneline -10` inspizieren.
- Nur intendierte Dateien stagen. Keine Secrets, keine `.env`-Dateien.
- Konsistente, kurze Commit-Messages im Repo-Stil (imperativ, Englisch, kleingeschrieben, z. B. `feat: add env config`).
- Schlägt ein Commit fehl (Hooks): Fehler fixen und neuen Commit erstellen — nicht amendieren.

## 5. Verifikation vor Abschluss

- Typprüfung (strict), Unit-/Integration-Suite und E2E-Suite müssen **fehlerfrei** laufen (projektspezifische Befehle: siehe `AGENTS.md`).
- Kein Häppchen als „fertig" markieren ohne bestandene Verifikation.

## 6. Test-First (ROT → GRÜN) — bindend

- **Jeder geschriebene Code muss von Tests abgedeckt werden.** Kein Feature-/Häppchen-Code ohne zugehörige Tests.
- Reihenfolge: **zuerst** die Tests schreiben (sie schlagen anfangs fehl = ROT, weil die Funktion noch fehlt), **dann** die Implementierung, bis die Tests grün sind (GRÜN).
- Damit steht am Ende jedes Häppchens eine reproduzierbare Test-Suite, die die Umsetzung belegt.
- Ausnahmen nur, wenn Tests objektiv nicht sinnvoll sind (z. B. reine Konfigurations-/Strukturdateien); der Grund wird im Commit vermerkt.
- Neue Tests gehören ins zentrale Testverzeichnis und werden von der Standard-Suite erfasst.

## 7. Status-Legende

⬜ offen · 🔄 in Arbeit · ✅ fertig · ⛔ blockiert (mit kurzer Begründung).
