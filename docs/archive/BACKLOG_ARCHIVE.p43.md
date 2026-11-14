# BACKLOG_ARCHIVE.p43.md — Shard (Phase 43, append-only)

> Created 2026-11-14T22:47 — home for item blocks archived in the context of Phase 43 (rotation: last active phase, H14/34.2).
> Contains: items archived during Phase 43. Header is write-once — never edited.

---

### [x] H14 — Shard-Rotation verfehlt den Agenten-Standard-Workflow — Item-Appends landen kanonisch, weil die Rotation am 🔄-Fenster hängt (Feldfund F1) — 🟠
- **Location:** `packages/core/src/mutations.ts` (`runningPhaseNumber` — H12/32.2-Rotation), Standard-Agenten-Workflow im Konsumer. Fund: Feldtest Sprocke 3, Umbau-Phase 30 in finnland-reiseapp (11/2026, Protokoll docs/fieldtest-finland.md, Feld 1) — N5–N8 wurden im kanonischen BACKLOG_ARCHIVE archiviert (86 Blöcke, gewachsen), obwohl Phase 30 lief.
- **Problem (ursprünglich, F1):** Der reale Agenten-Workflow ist „Step auf ✅ abschließen → Items archivieren → nächsten Step auf 🔄 drehen". Im Archivierungs-Moment existiert kein 🔄 (sequentieller Zwischenzustand) → kanonische Datei. Die Shard-Rotation verfehlt damit ihren Zweck (kanonisch einfrieren, Merge-Traffic) im häufigsten Fall — der Phasen-Block selbst landet korrekt im Shard, die Items nicht.
- **Fix (Design-Entscheid bei Implementierung):** Rotation an die „aktive Phase" statt an das 🔄-Fenster koppeln — Kandidaten: (a) letzte Zeile ≠ ⬜ in Tabellen-Ordnung der Phase (sequentieller Fortschritt als Aktivitätssignal, M23-Konzept rückwärts gelesen); (b) Detail-Block-basiert (Phase mit Block unter Active Phases und nicht-rein-geplant); (c) explizites Phase-Argument auf `archive_item`/`backlog_remove`. Nachweis im Protokoll-Log (finnland-reiseapp 2026-11-14).
- **Rezidiv F4 (11/2026, implementierter 34.2-Anker besiegt):** Phase 31 im Feldprojekt (Session lief auf 0.2.5-Dist, Build-Gate-Modell) — ALLE Item-Appends (N9–N15, F8) landeten erneut kanonisch, das ganze Phase-Fenster über. Ursache per Sandbox-Repro lokalisiert (Doc-Snapshot des Feldprojekts + Probe-Item gegen `packages/core/dist`, Plan: „canonical, no running phase"): das Feld-Table endet auf **nicht nummerierten Nachtrags-Zeilen** (Step-Spalte `—`: F4/H22/U1/M16-Nachträge, alle ✅, Zeilen 169–172); der 34.2-Anker „letzte 🔄/✅-Zeile" matcht `^(\d+)\.` nicht → `undefined` → kanonisch. Das eigene Repo hat keine solchen Zeilen — der Defekt ist dort unsichtbar.
- **Fix-Erweiterung:** Der Anker wandert rückwärts über die aktiven Zeilen zur letzten **nummerierten** aktiven Zeile (nicht nummerierte Zeilen überspringen statt `undefined` liefern); Acceptance-Fixture um ein Table mit Nachtrags-Zeilen am Ende erweitern (Feldprojekt-Snapshot als Vorlage).
- **Acceptance:** RED→GRÜN mit Fixtures, die den realen Workflow abbilden: (1) Step ✅ → archive_item im ✅-Fenster → Block im p<n>-Shard; (2) Table mit trailing `—`-Nachtrags-Zeilen (✅) → Anker springt zur letzten nummerierten Zeile; kanonische Datei im Feldprojekt-Fall friert; Standard-Flows byte-gleich sonst.
- **Erledigt:** fixed in 5d76ace (43.2) — RED-Test db668e8, Feld-Snapshot plant jetzt p31-Shard

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- H14 — Shard-Rotation verfehlt den Agenten-Standard-Workflow — Item-Appends landen kanonisch, weil die Rotation am 🔄-Fenster hängt (Feldfund F1) — erledigt (fixed in 5d76ace (43.2) — RED-Test db668e8, Feld-Snapshot plant jetzt p31-Shard)
