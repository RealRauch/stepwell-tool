# PROGRESS_ARCHIVE.p37.md — Shard (Phase 37, append-only)

> Created 2026-11-14T15:09 — home for the detail block of Phase 37 on completion.
> Contains: Phase 37 — Stale code name in plan-phase message (L30). Header is write-once — never edited.

---

### Phase 37 — Stale code name in plan-phase message (L30)

**Umfang (Steps):**

- **37.1 applyPhasePlan-Message: PLAN_WITHOUT_WIP → PHASE_PLANNED (Test-First) + Vollverifikation**
**Verifikation:** RED 4e77bba (neue Assertion: „planned but not started"-Message nennt PHASE_PLANNED, nicht PLAN_WITHOUT_WIP; 1 failed | 69 passed) → GREEN ef51454 (Message-String korrigiert; bestehende PLAN_WITHOUT_WIP-Finding-Tests unberührt). Verification: typecheck grün; npm run test 491/491 grün. Kontraktneutral (Prosa, Decision 13). (checkpoint: ef51454)
