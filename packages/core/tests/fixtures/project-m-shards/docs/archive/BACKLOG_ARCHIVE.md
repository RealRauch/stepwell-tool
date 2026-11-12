# BACKLOG_ARCHIVE.md — Archiv erledigter Items (append-only)

> Items werden **unverändert** hierher verschoben; nachträgliche Ergänzungen nur als
> neuer Abschnitt unterhalb des Items. Neueste Items unten anfügen.

---

### [x] S1 — Schema-Migration 001→002 abgesichert — 🔴 *(erledigt 08/2026)*
- **Ort:** `db/migrations/002_*.sql`
- **Problem:** Migration lief ohne Transaktion; Abbruch in der Hälfte hinterließ inkonsistentes Schema.
- **Fix:** Migration in Transaktion, Checksummen-Spalte; Re-Run idempotent.
- **Abnahme:** Migration läuft doppelt fehlerfrei; Suite grün.
- **Erledigt:** Commit `a1b2c3d` (08/2026), Verifikation: 120/120 Tests grün.

---
