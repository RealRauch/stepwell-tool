# Projekt-Tracking: method-docs

> Quellen-Methode: `docs/PLAYBOOK.md` (verbatim)
> Fortschrittsdatei — wird nach jedem Step aktualisiert.
> Legende: ⬜ offen · 🔄 in Arbeit · ✅ fertig · ⛔ blockiert

> **Struktur (Archiv-Muster):** Diese Datei enthält die **vollständige Fortschrittstabelle**
> und Detail-Blöcke **nur für laufende/offene Phasen**. Detail-Blöcke abgeschlossener Phasen
> wandern nach Abschluss **unverändert** in `docs/archive/PROGRESS_ARCHIVE.md`.

## Laufende Phasen

### Phase 4 — Mehrsprachigkeit (Locale-Profile)

**Ziel:** Die Doku-Dateien bleiben deutsch (dieses Repo), müssen aber auch in
anderen Sprachen — vor allem Englisch — parse- und schreibbar sein.

**Abnahme:** Parser/Validator lesen de- UND en-Formatiere ohne Konfiguration
(Fixture `project-c-en`, Funde-frei); die schreibenden Tools erzeugen Index-Zeilen,
Erledigt-/Verifikations-Marker und Skeletons in der Ziel-Sprache (`locale`-Option,
Auto-Erkennung, Default `de`); Suite + Typecheck grün.

**Umfang (Steps):**

- **4.1 Locale-Profile (lesen):** zentrale `src/profile.ts` mit Rollen-Synonymen
  (de/en) — Union-Matching im Parser (`Erledigt-Index|Done Index`, `Ort|Location`,
  `erledigt|done`, `Ziel|Goal`, `Abnahme|Acceptance`, `Verifikation|Verification`,
  `Umfang|Scope`, `Fortschritt|Progress`, `Laufende Phasen|Active Phases`,
  `abgeschlossen|completed`, `Stand:|As of:`); Validator (`DATE_LEGACY`) bilingual;
  neues Fixture `project-c-en` als Spezifikation, test-first.
- **4.2 Locale-Profile (schreiben + Schnittstellen):** `locale`-Option auf
  `archive_item`/`progress_update` (Default `de`, `en`, Auto-Erkennung aus dem
  Datei-Kontext); MCP-Param + CLI `--locale`; README + Interface-Tafel gepflegt.

---

## Fortschritt

| # | Step | Status |
|---|----------|--------|
| 1.1 | Monorepo-Grundgerüst | ✅ |
| 1.2 | BACKLOG-Parser | ✅ |
| 1.3 | PROGRESS-Parser | ✅ |
| 1.4 | Archiv-Reader | ✅ |
| 1.5 | docs_status | ✅ |
| 1.6 | docs_validate | ✅ |
| 2.1 | SDK-Festlegung + Grundserver | ✅ |
| 2.2 | MCP Read-Tools backlog | ✅ |
| 2.3 | MCP Read-Tools progress + validate | ✅ |
| 2.4 | MCP Resources | ✅ |
| 2.5 | opencode-Integration + Doku | ✅ |
| 2.6 | CLI | ✅ |
| 3.1 | archive_item (Dry-run) | ✅ |
| 3.2 | archive_item (Apply) + Verifikation | ✅ |
| 3.3 | progress_update (Dry-run + Apply) | ✅ |
| 4.1 | Locale-Profile (lesen) | 🔄 |
