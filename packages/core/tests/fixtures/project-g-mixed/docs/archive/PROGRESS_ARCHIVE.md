# PROGRESS_ARCHIVE.md — Archiv der abgeschlossenen Phasen (append-only)

> Detail-Blöcke wandern **verbatim** hierher; die Fortschrittstabelle bleibt
> vollständig in `PROGRESS.md` (permanenter Index). Append-only — keine
> Re-Lokalisierung (Decision 10).

---

### Phase 0 — Bootstrap *(abgeschlossen 01/2024)*

**Ziel:** Repo aufgesetzt, CI-Skelett steht, Doku-Stub da.

**Abnahme:** CI grün; README erklärt Setup.

**Umfang (Steps):**

- **0.1 Projekt-Setup** — git, npm, editorconfig
- **0.2 Env & Struktur** — config.ts mit harter Validierung

**Verifikation:** typecheck + 80 Tests grün; Smoke-Deploy auf Staging.

---

### Phase 1 — Datenmigration *(abgeschlossen 03/2024)*

**Ziel:** Erste produktive Migration läuft idempotent.

**Abnahme:** Migrations-Skript zweimal sauber; Schema-Diff leer.

**Umfang (Steps):**

- **1.1 Migrations-Skript** — idempotent, mit Checksum

**Verifikation:** Commit `a1b2c3d` auf main; Backup/Restore-Runbook im Repo.

---
