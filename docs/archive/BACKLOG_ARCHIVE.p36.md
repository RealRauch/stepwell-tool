# BACKLOG_ARCHIVE.p36.md — Shard (Phase 36, append-only)

> Created 2026-11-14T14:10 — home for item blocks archived in the context of Phase 36 (rotation: last active phase, H14/34.2).
> Contains: items archived during Phase 36. Header is write-once — never edited.

---

### [x] M29 — coverage-gate.test.ts: nested Coverage-Run überläuft eigenen 180s-Timeout unter Volllast — Standard-Verifikation flaky auf langsamen Maschinen — 🟡
- **Location:** `packages/core/tests/coverage-gate.test.ts` (T6-Abnahme: nested `vitest run --coverage` über alle Pakete, eigener Timeout 180s)
- **Problem:** Unter Volllast (paralleler Suite-Run) überschreitet der nested Coverage-Run den eigenen 180s-Timeout — gemessen 11/2026: isoliert grün in 152,9s, im parallelen `npm run test` Timeout. Damit ist die Standard-Verifikation maschinengeschwindigkeits-abhängig flaky (rote Suite ohne echten Fund → Alarm-Ermüdung). Vorbestehendes Umgebungsproblem, nicht durch M28/35.1 verursacht (nur String-Konstanten geändert, kein Laufzeit-Einfluss). Diagnose 11/2026 bestätigt (Flake): 1× Timeout unter Volllast, 1× isoliert grün 152,9s, 1× Volllast `npm run test` grün (490/490) — Randbandbreite, keine echte Gate-Verletzung.
- **Acceptance:** `npm run test` auf dieser Maschine stabil grün, ohne das Gate zu schwächen. Kandidaten: eigenen Timeout des Tests anheben (Test-Edit → Dateiklasse Hoch, explizites Gate gem. Decision 9), nested Run ressourcenschonender (weniger parallele Worker) oder Coverage-Scope des Nested-Runs schmaler. Entscheidung erst bei Ausführung.
- **Packaging:** als Phase 36 (36.1) paketiert — Entscheidung bei Ausführung 11/2026: Harness-Timeout 180s→300s (Gate-Assertions byte-identisch, nichts geschwächt); Freigabe durch Nutzer („prüfen und ggf. fixen“). Dateiklasse Niedrig (keine der Hoch-Klassen der Decision 9 getroffen — kein Test gelöscht, keine Assertion geschwächt); zusätzlich deckt die explizite Freigabe das Gate ab. Verworfen: nested Run auf core-only schmaler — der Gate-Wert liegt gerade im Voll-Scope (alle Pakete gegen die Thresholds).
- **Erledigt:** Phase 36 (36.1: 78d4c48) — Flake-Verdacht bestätigt, Harness-Timeout 180s→300s; Gate-Assertions unverändert, Verifikation 490/490 grün

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- M29 — coverage-gate.test.ts: nested Coverage-Run überläuft eigenen 180s-Timeout unter Volllast — Standard-Verifikation flaky auf langsamen Maschinen — erledigt (Phase 36 (36.1: 78d4c48) — Flake-Verdacht bestätigt, Harness-Timeout 180s→300s; Gate-Assertions unverändert, Verifikation 490/490 grün)
