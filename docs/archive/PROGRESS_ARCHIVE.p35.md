# PROGRESS_ARCHIVE.p35.md — Shard (Phase 35, append-only)

> Created 2026-11-14T01:46 — home for the detail block of Phase 35 on completion.
> Contains: Phase 35 — Tool-surface language cleanup (EN). Header is write-once — never edited.

---

### Phase 35 — Tool-surface language cleanup (EN)

**Umfang (Steps):**

- **35.1 Core: deutsche Output-Strings → EN (mutations.ts, context.ts; Test-First)**
- **35.2 MCP: echo-Schema + Error-Strings → EN (server.ts, tools.ts; Test-First) + CHANGELOG + Verifikation**
**Verifikation:** RED 226eb55 (3 neue EN-Assertions: echo-Schema, unknown-id, unknown-phase; 3 failed | 28 passed) → GREEN c932ec4 (echo-Schema „The text to return.“, backlog_show/progress_show Errors EN, Muster-Token <Nr>→<N>) + CHANGELOG-Unreleased-Eintrag. Verification: npm run typecheck grün; npm run test 490/490 grün (50 Dateien) inkl. coverage-gate — der M29-Umgebungs-Flake trat diesmal nicht auf, Item bleibt offen. Kontrakt unverändert (Decision 13). (checkpoint: c932ec4)
