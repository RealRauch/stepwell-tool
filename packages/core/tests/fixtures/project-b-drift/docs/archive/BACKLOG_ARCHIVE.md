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

### [x] Z8 — Archiv-Block ohne Prioritäts-Suffix (W2-Fall)
- **Ort:** `src/legacy-archive.ts`
- **Problem:** Dieser Archiv-Block trägt keinen Prioritäts-Marker; der Parser warnt
  (`PRIO_MISSING`), die Aggregation darf die Archiv-Warnung aber nicht durchreichen.
- **Fix:** docs_validate/docs_status unterdrücken Parse-Warnungen aus Archiv-Dateien.
- **Erledigt:** Commit `x9y8z7a` (09/2026).

---
