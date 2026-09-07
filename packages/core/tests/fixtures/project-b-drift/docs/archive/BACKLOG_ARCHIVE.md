# BACKLOG_ARCHIVE.md — Archiv erledigter Items (append-only)

> Diese Datei gehört zum Drift-Projekt und enthält absichtliche Struktur-Drift.
> Erwartete Reaktionen: siehe `../../README.md` (Tabelle D13).

---

### [x] Z9 — Im Archiv, aber NICHT im Erledigt-Index (Validate-Fall) — 🟠 *(erledigt 09/2026)*
- **Ort:** `src/ghost.ts`
- **Problem:** Dieser Archiv-Block hat keinen Einzeiler im Erledigt-Index der `BACKLOG.md`.
- **Fix:** Validator muss die Lücke melden (D13, Spiegelfall zu D8).
- **Erledigt:** Commit `f6a7b8c` (09/2026).

---
