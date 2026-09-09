# PROGRESS_ARCHIVE.md — Archiv abgeschlossener Phasen (append-only)

> Detail-Blöcke wandern **unverändert** hierher; die Fortschrittstabelle bleibt
> vollständig in `PROGRESS.md` (dauerhafter Index).

---

### Phase 0 — Projektaufsetzung *(abgeschlossen 07/2026)*

**Ziel:** Repo, CI und Doku-Gerüst stehen.

**Abnahme:** CI grün; README erklärt Setup.

**Umfang (Steps):**

- **0.1 Projekt einrichten** — git, npm, Editorconfig
- **0.2 Env & Struktur** — config.ts mit harter Validierung

**Verifikation:** typecheck + 120 Tests grün; Smoke-Deploy auf Staging.

---

### Phase 1 — Daten- und API-Fundament *(abgeschlossen 08/2026)*

**Ziel:** Schema, Migrationen und API-Grundgerüst stehen stabil.

**Abnahme:** typecheck + Suite grün; API-Kontrakt-Tests vorhanden.

**Umfang (Steps):**

- **1.1 Migrations-Skript** — versionierte Migrationen, Re-Run-sicher
- **1.2 Seed-Skript** — reproduzierbare Demo-Daten
- **1.3 API-Grundgerüst** — Health-Endpunkt, Fehlerhandling, Logging

**Verifikation:** 132/132 Tests grün; Kontrakt-Fixtures gegen API geprüft.

---
