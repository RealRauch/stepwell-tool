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

### [x] S2 — Env-Config failt hart bei fehlenden Secrets — 🔴 *(erledigt 08/2026)*
- **Ort:** `src/config.ts`
- **Problem:** Fehlende Env-Vars erzeugten erst zur Laufzeit kryptische Fehler.
- **Fix:** Validierung beim Start mit klarer Fehlerliste.
- **Abnahme:** Start ohne `.env` bricht mit lesbarer Meldung ab.
- **Erledigt:** Commit `b2c3d4e` (08/2026).

---

### [x] M7 — Duplizierte Geo-Logik auf Shared-Helper umgestellt — 🟡 *(erledigt 09/2026)*
- **Ort:** `src/geo.ts`, `tests/helpers/geo.ts`
- **Problem:** Zwei Implementierungen drifteten auseinander (Abweichungen im Meterbereich).
- **Fix:** Eine Implementierung + Golden-Testdaten.
- **Abnahme:** Beide Call-Sites nutzen den Shared-Helper; Golden-Tests grün.
- **Erledigt:** Commit `c3d4e5f` (09/2026).

---
