# BACKLOG_ARCHIVE.p42.md — Shard (Phase 42, append-only)

> Created 2026-11-14T16:57 — home for item blocks archived in the context of Phase 42 (rotation: last active phase, H14/34.2).
> Contains: items archived during Phase 42. Header is write-once — never edited.

---

### [x] M31 — L32-Nachbrenner: bin-Normalisierung bricht pack-smoke-/packaging-Erwartungen (CI rot auf main) — 🟡
- **Location:** `scripts/pack-smoke.mjs:67` · `packages/mcp/tests/packaging.test.ts:47` · `packages/mcp/tests/packaging.test.ts:70` (jeweils Erwartung `./dist/cli.js`)
- **Problem:** L32/Phase 40 normalisierte den bin-Wert auf `dist/cli.js` (npm-12-Fixer-Forderung), aber die Pack-Verifikation erwartete weiter die alte `./`-Form → CI auf main ROT nach dem H15-Merge (Run 43611864405: 4 Tests failed, pack-smoke „unexpected bin mapping"). Ursache: bei L32 wurde die Suite nicht mitgefahren (nur pkg fix + pack dry-run) — Verifikationsversäumnis im 40.1-Abschluss, hier eingestanden; die CI-Rotsituation ist der RED-Evidenznachtrag.
- **Acceptance:** 3 Erwartungsstellen auf `dist/cli.js` gepolstert (skript + 2 Assertions); lokale Vollsuite grün (491) + pack-smoke OK; Merge → main, CI-Lauf GRÜN (Nachweis-Run); Danach Phase 41.3 fortsetzen.
- **Packaging:** als Phase 42 (42.1) paketiert — Freigabe: Fortsetzung der vom Nutzer getragenen H15/41-Kette (CI-Heilung ist Bedingung des Freigabekontexts); Content-Gate: Niedrig (skript-/Test-Erwartungen im Fund-Scope).
- **Erledigt:** Phase 42 (42.1: efd4339) — Erwartungen geflippt, CI-Nachweis 43612705709 grün; L32-Lektion: Vollsuite vor jedem Abschluss

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- M31 — L32-Nachbrenner: bin-Normalisierung bricht pack-smoke-/packaging-Erwartungen (CI rot auf main) — erledigt (Phase 42 (42.1: efd4339) — Erwartungen geflippt, CI-Nachweis 43612705709 grün; L32-Lektion: Vollsuite vor jedem Abschluss)
