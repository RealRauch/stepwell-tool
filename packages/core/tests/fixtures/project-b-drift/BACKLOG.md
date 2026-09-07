# BACKLOG.md — Offene Punkte (Stand: 09/2026)

> Diese Datei enthält absichtlich **Struktur-Drift** für Parser-/Validate-Tests.
> Erwartete Reaktionen je Fall: siehe `../README.md` (Tabelle D1–D8).

---

## 🔴 KRITISCH

### [ ] K9 — Item ohne Prioritäts-Suffix im Titel
- **Ort:** `src/legacy.ts`
- **Problem:** Kein `— 🔴` am Titelende; Parser muss Priorität aus der Sektion ableiten.
- **Fix:** Priorität aus Sektions-Emoji übernehmen, sonst `unknown` + Warnung.

---

## 🟠 HOCH

### [x] H9 — Abgehakt, aber noch nicht archiviert (Validate-Fall) — 🟠
- **Ort:** `src/x.ts`
- **Problem:** Checkbox ist `[x]`, das Item hängt aber noch im offenen Bereich.
- **Fix:** In Archiv verschieben + Einzeiler im Erledigt-Index.

---

## 🟡 MITTEL

> Keine offenen Items.

---

## 🟢 NIEDRIG

### [ ] L9 — Titel mit doppeltem Prioritäts-Marker — 🟢 — 🟢
- **Ort:** `docs/x.md`
- **Problem:** Priorität doppelt angegeben; Parser darf nicht crashen und nur 1× erfassen.

### [ ] L10 — Item ohne Ort/Problem-Struktur
Nur ein Absatz ohne Bullet-Liste. Der Parser soll den Text trotzdem
vollständig als `text` erfassen und das Item listen.

### [ ] L10 — Duplizierte ID (Validate-Fall)
- **Ort:** `docs/y.md`
- **Problem:** Diese ID kommt doppelt vor; Validator muss die Kollision melden.

---

## 🟣 EXPERIMENTELL (unbekannte Priorität)

> Sektion mit unbekanntem Emoji-Header.

### [ ] X1 — Item in unbekannter Sektion — 🟣
- **Ort:** `src/z.ts`
- **Problem:** Priorität und Sektion unbekannt; Warnung erwarten, Item trotzdem listen.

---

## 🔵 TEST-LÜCKEN

### [ ] T9
- **Ort:** `tests/x.ts`
- **Problem:** ID ohne Titel nach dem Trenner; Parser soll leeren Titel tolerieren + warnen.

---

## ✅ Erledigt-Index

- S9 — Im Index, aber NICHT im Archiv (Validate-Fall) — erledigt in `d4e5f6a`
- M9 — Auch im Index, fehlt im Archiv — erledigt in `e5f6a7b`

---
