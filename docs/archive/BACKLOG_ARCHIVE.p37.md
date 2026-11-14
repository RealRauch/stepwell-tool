# BACKLOG_ARCHIVE.p37.md — Shard (Phase 37, append-only)

> Created 2026-11-14T15:09 — home for item blocks archived in the context of Phase 37 (rotation: last active phase, H14/34.2).
> Contains: items archived during Phase 37. Header is write-once — never edited.

---

### [x] L30 — progress_plan_phase-Message nennt veralteten Code-Namen — „PLAN_WITHOUT_WIP resolves with the first 🔄" → PHASE_PLANNED — 🟢
- **Location:** `packages/core/src/mutations.ts:892` (`applyPhasePlan` — Verifikations-Message des Phasen-Plans)
- **Problem:** Die Message sagt „phase is planned but not started yet (**PLAN_WITHOUT_WIP** resolves with the first 🔄)" — veralteter Code-Name: seit M18/27.9 ist der Signalzustand einer rein geplanten Phase das Warning **PHASE_PLANNED**; `PLAN_WITHOUT_WIP` ist nur noch das Orphaned-Finding. Kosmetischer Prosa-Rest in der Tool-Fläche, erstmals beobachtet bei Datacraft-Rückmeldung 11/2026 (Agent meldete korrekt „PHASE_PLANNED-Hinweis", die Tool-Message nannte den falschen Namen).
- **Acceptance:** Message nennt `PHASE_PLANNED`; ggf. Test-Assertion angepasst; `npm run typecheck` + `npm run test` grün; kontraktneutral (Messages/Prosa frei, Decision 13).
- **Packaging:** als Phase 37 (37.1) paketiert — Freigabe durch Nutzer 11/2026 im Zug der Promotion-Planung („erst diese mini phase, dev-push + CI, dann promotion"); Content-Gate: Niedrig (Prosa-String + ggf. Test-Assertion im Step-Scope).
- **Erledigt:** Phase 37 (37.1: 4e77bba/ef51454) — Message nennt PHASE_PLANNED; Verifikation 491/491 grün

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- L30 — progress_plan_phase-Message nennt veralteten Code-Namen — „PLAN_WITHOUT_WIP resolves with the first 🔄" → PHASE_PLANNED — erledigt (Phase 37 (37.1: 4e77bba/ef51454) — Message nennt PHASE_PLANNED; Verifikation 491/491 grün)
