# BACKLOG_ARCHIVE.p1.md — Shard je Phase (append-only)

> Shard-Datei für Items, die während Phase 1 archiviert wurden.
> Kopfzeile beim Anlegen — nie editiert. Enthält: Items Phase 1.

---

### [x] S2 — Env-Config failt hart bei fehlenden Secrets — 🔴 *(erledigt 08/2026)*
- **Ort:** `src/config.ts`
- **Problem:** Fehlende Env-Vars erzeugten erst zur Laufzeit kryptische Fehler.
- **Fix:** Validierung beim Start mit klarer Fehlerliste.
- **Abnahme:** Start ohne `.env` bricht mit lesbarer Meldung ab.
- **Erledigt:** Commit `b2c3d4e` (08/2026).

---

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- S2 — Env-Config failt hart bei fehlenden Secrets — erledigt in `b2c3d4e` (Details: Archiv)
