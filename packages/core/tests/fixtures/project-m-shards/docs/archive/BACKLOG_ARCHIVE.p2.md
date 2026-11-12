# BACKLOG_ARCHIVE.p2.md — Shard je Phase (append-only)

> Shard-Datei für Items, die während Phase 2 archiviert wurden.
> Kopfzeile beim Anlegen — nie editiert. Enthält: Items Phase 2.

---

### [x] M7 — Duplizierte Geo-Logik auf Shared-Helper umgestellt — 🟡 *(erledigt 09/2026)*
- **Ort:** `src/geo.ts`, `tests/helpers/geo.ts`
- **Problem:** Zwei Implementierungen drifteten auseinander (Abweichungen im Meterbereich).
- **Fix:** Eine Implementierung + Golden-Testdaten.
- **Abnahme:** Beide Call-Sites nutzen den Shared-Helper; Golden-Tests grün.
- **Erledigt:** Commit `c3d4e5f` (09/2026).

---

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- M7 — Duplizierte Geo-Logik auf Shared-Helper umgestellt — erledigt in `c3d4e5f` (Details: Archiv)
