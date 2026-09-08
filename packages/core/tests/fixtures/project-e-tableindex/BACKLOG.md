# BACKLOG.md — Offene Punkte (Stand: 260801/0900)

> **Diese Datei enthält nur OFFENE Items.** Erledigte Items werden nach dem Abschluss
> **unverändert** in `docs/archive/BACKLOG_ARCHIVE.md` verschoben; hier bleibt je Item nur ein Einzeiler
> im Erledigt-Index (unten). Fundstellen/Fix-Ideen/Decisions nicht löschen — ins Archiv verschieben.
> Legende: 🔴 kritisch · 🟠 hoch · 🟡 mittel · 🟢 niedrig · 🔵 Test-Lücke
> Abarbeitung: sequenziell nach Priorität (🔴 → 🟠 → 🟡 → 🟢), jedes Item test-first, Commit pro Item oder thematischer Gruppe.

---

## 🔴 KRITISCH

> Keine offenen Items.

---

## 🟠 HOCH

### [ ] H4 — Backup-Wiederherstellung ungeprüft — 🟠
- **Ort:** `ops/backup.md` (Wiederherstellungs-Prozedur)
- **Problem:** Restore wurde nie als Probe durchgeführt — reiner Dokumentations-Glaube.
- **Fix:** Wiederherstellung in Staging durchspielen, Dauer messen, Prozedur nachschärfen.
- **Abnahme:** Dokumentierter Restore-Lauf mit gemessener Dauer; Prozedur aktualisiert.

---

## 🟡 MITTEL

> Keine offenen Items.

---

## 🟢 NIEDRIG

### [ ] L5 — NPM-Audit-Befunde triagieren — 🟢
- **Ort:** `package-lock.json` (Audit-Report 07/2026)
- **Problem:** Audit meldet Funde unbekannter Dringlichkeit — keine Einordnung vorhanden.
- **Fix:** Je Fund Entscheidung (fix/begründen/ignorieren) dokumentieren; direkte Upgrades ziehen.
- **Abnahme:** Audit-Report je Fund mit Entscheidung; direkte Upgrades eingespielt, Suite grün.

---

## 🔵 TEST-LÜCKEN

> Keine offenen Items.

---

## ✅ ERLEDIGT-INDEX (Einzeiler — Details/Funde/Decisions: `docs/archive/BACKLOG_ARCHIVE.md`)

| Serie | Item (kurz) | Commit/Phase |
|-------|-------------|--------------|
| K | K5 SQL-Injection Column-Whitelist | `d4e5f6a` |
| M | M8 Cache-Header für statische Assets | Phase 6.3 |

---
