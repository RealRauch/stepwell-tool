# BACKLOG_ARCHIVE.md — Archiv der erledigten Punkte (append-only)

> Items wandern **verbatim** hierher; spätere Ergänzungen nur als neue Sektion
> unterhalb des Items. Neueste Items unten anhängen. Append-only — keine
> Re-Lokalisierung (PLAYBOOK §2 + Decision 10).

---

### [x] S1 — Pilot-Setup eingerichtet — 🟠 *(erledigt 02/2024)*
- **Ort:** `scripts/pilot-setup.sh`
- **Problem:** Frühere Setups waren ad-hoc und nicht reproduzierbar.
- **Fix:** Skript versioniert, Idempotenz via Marker-Datei im Repo-Root;
  CI-Hook prüft die Marker-Datei vor Pilot-Branches.
- **Abnahme:** Frischer Klon + Skriptlauf führt zu lauffähigem Dev-Stand;
  CI-Hook blockt fehlende Marker.
- **Erledigt:** Commit `b1c2d3e` (02/2024).

---

### [x] A1 — Alte Initial-Migration abgesichert — 🔴 *(erledigt 03/2024)*
- **Ort:** `db/migrations/001_initial.sql`
- **Problem:** Frühe Migration lief ohne Transaktion; Abbruch hinterließ
  inkonsistentes Schema.
- **Fix:** Migration in eine Transaktion gewickelt; Checksum-Spalte ergänzt;
  Wiederhollauf ist idempotent.
- **Abnahme:** Migration läuft zweimal sauber durch; Suite grün.
- **Erledigt:** Commit `a1b2c3d` (03/2024).

---

### [x] A2 — Cookie-Härtung Session-Pfad — 🟠 *(erledigt 06/2024)*
- **Ort:** `src/auth/session.ts`
- **Problem:** `sameSite` fehlte — Restrisiko in eingebetteten Views.
- **Fix:** `sameSite: "lax"` und `secure` in Produktion erzwungen; Vertragstest
  auf Cookie-Flags.
- **Abnahme:** Flags im Integrationstest verifiziert; E2E-Login bleibt grün.
- **Erledigt:** Commit `c3d4e5f` (06/2024).

---
