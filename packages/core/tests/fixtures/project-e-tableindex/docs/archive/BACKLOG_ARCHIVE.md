# BACKLOG_ARCHIVE.md — Archiv erledigter Items (append-only)

> Items werden **unverändert** hierher verschoben; nachträgliche Ergänzungen nur als
> neuer Abschnitt unterhalb des Items. Neueste Items unten anfügen.

---

### [x] K5 — SQL-Injection Column-Whitelist — 🔴 *(erledigt 260801/0900)*
- **Ort:** `src/reports/query.ts` (Sortier-Parameter)
- **Problem:** Sortierspalte ging ungeprüft in das SQL-Statement — Injection über Query-Parameter möglich.
- **Fix:** Whitelist zulässiger Spaltennamen, Fallback auf Standardsortierung; Test mit manipuliertem Parameter.
- **Abnahme:** Manipulierte Sortier-Parameter liefern 400; Suite grün.
- **Erledigt:** Commit `d4e5f6a` (260801/0900), Verifikation: 85/85 Tests grün.

---

### [x] M8 — Cache-Header für statische Assets — 🟡 *(erledigt 260801/0900)*
- **Ort:** `serve.ts` (Static-Handler)
- **Problem:** Statische Assets ohne Cache-Header — unnötige Re-Fetches auf Mobile.
- **Fix:** `Cache-Control: immutable` mit Versionierungs-Hash, `no-cache` für `index.html`.
- **Abnahme:** Header je Asset-Klasse im Integration-Test geprüft.
- **Erledigt:** Phase 6.3 (260801/0900).

---

