# BACKLOG.md — Offene Punkte (Stand: 260907/1200)

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

### [ ] H1 — Upload-Endpunkt ohne Größenlimit — 🟠
- **Ort:** `src/routes/upload.ts:42` (Multipart-Handler)
- **Problem:** Kein `limits.fileSize` gesetzt — beliebig große Bodies drücken den Speicher (Fund bei Lasttest 09/2026).
- **Fix:** `fileSize` auf 5 MB begrenzen, 413-Antwort mit sauberer Fehlermeldung, Test mit Oversize-Body.
- **Abnahme:** Oversize-Upload liefert 413; reguläre Uploads bis Limit funktionieren; Suite grün.

### [ ] H2 — Session-Cookie ohne SameSite — 🟠
- **Ort:** `src/auth/session.ts:18` (Cookie-Serializer)
- **Problem:** `sameSite` nicht gesetzt → CSRF-Restrisiko in eingebetteten Views.
- **Fix:** `sameSite: "lax"`, `secure` in Produktion erzwingen; Kontrakt-Test auf Cookie-Flags.
- **Abnahme:** Cookie-Flags im Integration-Test geprüft; E2E-Login unverändert grün.

---

## 🟡 MITTEL

> Keine offenen Items.

---

## 🟢 NIEDRIG

### [ ] L3 — Docs-Build-Warnungen aufräumen — 🟢
- **Ort:** `docs/` (strikter Build, 4 Warnungen)
- **Problem:** Tote Links/Anker veralten unbemerkt.
- **Fix:** Warnungen beheben, strikten Build in CI aufnehmen.
- **Abnahme:** Strikter Build ohne Warnung in CI grün.

---

## 🔵 TEST-LÜCKEN (aus dem Review abgeleitet)

### [ ] T8 — Fehlverhalten bei leerer DB abdecken — 🔵 *(OPTIONAL, vor Pilotbetrieb)*
- **Ziel:** Integration-Tests für Empty-States aller Listen-Endpunkte (200 + leere Arrays statt 500).
- **Umfang:** Fixtures ohne Seed, je Endpunkt ein Assert; keine Produktionsänderung erwartet.
- **Abnahme:** 5 neue Tests grün auf leerer DB.

---

## 📋 OFFENE PUNKTE R-SERIE (nach dem Review; Richtung Pilotbetrieb)

> Betriebs- und Produkt-Punkte nach Abschluss der Review-Fixes.
> Jedes Item ist so beschrieben, dass es später als eigene Phase in `PROGRESS.md`
> paketiert werden kann (Umfang in Step + Abnahmekriterium). Priorisierung wie oben.

### [ ] R4 — Feldtest auf Zielgeräten — 🟠 *(vor Pilotbetrieb zwingend)*
- **Warum:** Mechanik ist getestet, Geräte-Realität nicht.
- **Ort:** kein Code-Ort — Testprotokoll.
- **Umfang (Steps):** (1) Checkliste erarbeiten; (2) auf 2 Geräten durchspielen; (3) Befunde als Items eintragen.
- **Abnahme:** Checkliste abgehakt; Befunde dokumentiert.

---

## 🎨 UI-DESIGN-REVIEW (U-Reihe, 09/2026 — Design-Kritik Admin-Bereich)

> Systematische UI-Kritik des Admin-Bereichs.
> Zielbild: intuitiv ohne Vorkenntnisse.
> **Quick-Wins:** U21 (Fehlertexte), U22 (Ladezustände).
> Abarbeitung: priorisiert 🔴 → 🟠 → 🟡 → 🟢, test-first, Commit pro Item/Gruppe; Paketierung in PROGRESS bei Start.
>
> **Paketier-Regel i18n-ready — verbindlich:**
> Erst Fundament-Block (Strings-Modul), danach alle anderen Items; Texte ab dann nur noch zentral.

### [ ] U21 — Fehlertexte vom Techniker- ins Anwender-Deutsch — 🟡
- **Ort:** `web/src/pages/*.tsx` (hardcodierte Fehlermeldungen)
- **Problem:** Meldungen nennen HTTP-Codes und Feldnamen statt nächstem Schritt.
- **Fix:** Strings-Modul `messages.ts`, je Meldung Nutzer-Text + Handlungsvorschlag; Tests auf Vorhandensein.
- **Abnahme:** Keine Hardcode-Meldung mehr in Listen-Ansichten; Snapshot-Tests aktualisiert.

### [ ] U22 — Lade- und Leerzustände für alle Listen — 🟡
- **Ort:** `web/src/components/ListView.tsx` u. a.
- **Problem:** Spinner ohne Skeleton; leere Liste ohne Hinweis wirkt kaputt.
- **Fix:** Skeleton-Komponente + Empty-State mit Leer-Ziel; Story je Zustand.
- **Abnahme:** Alle Listen zeigen Skeleton/Empty-State; visuelle Regressionstests grün.

---

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details im Archiv).

- S1 — Schema-Migration 001→002 abgesichert — erledigt in `a1b2c3d` (Details: Archiv)
- S2 — Env-Config failt hart bei fehlenden Secrets — erledigt in `b2c3d4e` (Details: Archiv)
- M7 — Duplizierte Geo-Logik auf Shared-Helper umgestellt — erledigt in `c3d4e5f` (Details: Archiv)

---
