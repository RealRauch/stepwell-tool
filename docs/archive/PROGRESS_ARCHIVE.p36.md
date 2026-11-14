# PROGRESS_ARCHIVE.p36.md — Shard (Phase 36, append-only)

> Created 2026-11-14T14:09 — home for the detail block of Phase 36 on completion.
> Contains: Phase 36 — Coverage-gate harness timeout (M29). Header is write-once — never edited.

---

### Phase 36 — Coverage-gate harness timeout (M29)

**Umfang (Steps):**

- **36.1 Harness-Timeout des coverage-gate-Tests 180s→300s (Gate-Assertions unverändert) + Vollverifikation**
**Verifikation:** Diagnose bestätigt (Flake: 1× Timeout unter Volllast, 1× isoliert grün 152,9s, 1× Volllast grün) → Fix 78d4c48: Harness-Timeout 180s→300s, Gate-Assertions byte-identisch, Scope-Reduktion verworfen (Gate-Wert = Voll-Scope). §6-Ausnahme (Timeout-Konstante = Konfiguration) im Commit begründet. Verification: npm run typecheck grün; npm run test 490/490 grün (50 Dateien) — nested coverage-gate-Run diesmal unter Volllast in der Suite durchgelaufen. Kontrakt unverändert. (checkpoint: 78d4c48)
