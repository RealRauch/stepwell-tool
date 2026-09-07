# BACKLOG_ARCHIVE.md — Archiv erledigter Items (append-only)

> Items werden **unverändert** hierher verschoben; nachträgliche Ergänzungen nur als
> neuer Abschnitt unterhalb des Items. Neueste Items unten anfügen.

---

---

### [x] L1 — Methoden-Änderungen (09/2026) in PLAYBOOK-Kopie von stadtpfad-pwa nachziehen — 🟢
- **Ort:** `D:\Development\stadtpfad-pwa\docs\PLAYBOOK.md` (+ `LESSONS.md`, dort unverändert)
- **Warum:** Die Methode wurde erweitert (Beschluss 09/2026: Sync-Regel im Kopfbereich,
  §2 Zuordnungsregel, §3 Item-ID-Nomenklatur + Zeitstempel + Migration, §7 Blockiert-Regel,
  Terminologie „Step" statt „Häppchen", Methoden-Name „STEPWELL");
  die Geschwister-Kopie ist verbatim-pflichtig und driftet sonst vom Original weg.
- **Fix:** Alle geänderten Abschnitte unverändert in die stadtpfad-Kopie übernehmen;
  künftige Methoden-Änderungen immer simultan in allen Kopien (Sync-Regel).
- **Abnahme:** Diff von `PLAYBOOK.md` und `LESSONS.md` zwischen beiden Repos ist leer
  (byte-identisch).
- **Erledigt:** Sync 09/2026 in stadtpfad-pwa@01cbc30, beide Kopien byte-identisch

---

### [x] M1 — Methoden-Änderungen (09/2026: Freigabe-Gate, Lesson 17) in PLAYBOOK-/LESSONS-Kopien synchronisieren — 🟡
- **Ort:** `D:\Development\stadtpfad-pwa\docs\PLAYBOOK.md` + `docs\LESSONS.md`
- **Problem:** Die Methode wurde erweitert (PLAYBOOK §0.3 Freigabe-Gate: Implementierung startet
  erst nach menschlicher Freigabe; LESSONS 17: Struktur-Operationen gehören dem Tool);
  die Geschwister-Kopie ist verbatim-pflichtig und driftet sonst vom Original weg.
- **Fix:** Beide Dateien unverändert in die stadtpfad-Kopie übernehmen; künftig Methoden-Änderungen
  immer simultan in allen Kopien (Sync-Regel).
- **Abnahme:** Diff von `PLAYBOOK.md` und `LESSONS.md` zwischen beiden Repos ist leer (byte-identisch).
- **Erledigt:** Sync 09/2026 in stadtpfad-pwa@f6e2277, beide Kopien byte-identisch
