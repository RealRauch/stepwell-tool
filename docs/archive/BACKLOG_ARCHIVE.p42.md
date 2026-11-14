# BACKLOG_ARCHIVE.p42.md — Shard (Phase 42, append-only)

> Created 2026-11-14T16:57 — home for item blocks archived in the context of Phase 42 (rotation: last active phase, H14/34.2).
> Contains: items archived during Phase 42. Header is write-once — never edited.

---

### [x] M31 — L32-Nachbrenner: bin-Normalisierung bricht pack-smoke-/packaging-Erwartungen (CI rot auf main) — 🟡
- **Location:** `scripts/pack-smoke.mjs:67` · `packages/mcp/tests/packaging.test.ts:47` · `packages/mcp/tests/packaging.test.ts:70` (jeweils Erwartung `./dist/cli.js`)
- **Problem:** L32/Phase 40 normalisierte den bin-Wert auf `dist/cli.js` (npm-12-Fixer-Forderung), aber die Pack-Verifikation erwartete weiter die alte `./`-Form → CI auf main ROT nach dem H15-Merge (Run 43611864405: 4 Tests failed, pack-smoke „unexpected bin mapping"). Ursache: bei L32 wurde die Suite nicht mitgefahren (nur pkg fix + pack dry-run) — Verifikationsversäumnis im 40.1-Abschluss, hier eingestanden; die CI-Rotsituation ist der RED-Evidenznachtrag.
- **Acceptance:** 3 Erwartungsstellen auf `dist/cli.js` gepolstert (skript + 2 Assertions); lokale Vollsuite grün (491) + pack-smoke OK; Merge → main, CI-Lauf GRÜN (Nachweis-Run); Danach Phase 41.3 fortsetzen.
- **Packaging:** als Phase 42 (42.1) paketiert — Freigabe: Fortsetzung der vom Nutzer getragenen H15/41-Kette (CI-Heilung ist Bedingung des Freigabekontexts); Content-Gate: Niedrig (skript-/Test-Erwartungen im Fund-Scope).
- **Erledigt:** Phase 42 (42.1: efd4339) — Erwartungen geflippt, CI-Nachweis 43612705709 grün; L32-Lektion: Vollsuite vor jedem Abschluss

---

### [x] H15 — Freeze-Split beenden — single-repo + build-gated consumers: Decision 13 neu, 4 Bindungen auf dist/serve.js, dev-Repo schließen — 🟠
- **Location:** AGENTS.md (Decision 13 + Kickoff-Block) · `docs/archive/AGENTS-decisions-history.md` (Altfassung) · `stepwell-internal/CONSUMERS.md` (Runbook + Bindungsliste) · `C:\Users\sebas\.zcode\cli\config.json` (global) · `D:\Development\stadtpfad-pwa\.zcode/config.json` · `opencode.json` · `.agents/plugins/stepwell/mcp_config.json` (alle pwa: tsx-src → dist)
- **Problem:** Freeze-Split (Decision 13, 11/2026): Entwicklung nur im dev-Clone, Konsumer binden an `src` des eingefrorenen Verzeichnisses, Promotion per Ritual. Nutzer-Entscheid 11/2026: Modell beenden — Entwicklung direkt im Haupt-Repo, Konsumer **build-gated** auf `dist/serve.js` umbinden (Konsumer sehen nur Builds/Releases, nie den Arbeitsstand). Nutzerwille beantwortet die Kernfrage selbst: Konsumer verlieren das Tool nicht — sie laden künftig das gebaute Artefakt statt src.
- **Acceptance:** Decision 13 neu gefasst (single-repo + build-gated consumers), Altfassung append-only im History-Archiv; CONSUMERS.md-Runbook neu (Bindungsliste, Altlasten-Räumung inkl. toter `.zcode/config.json` im Haupt-Repo); 4 Registrierungen umgebunden (global + 3× pwa; `.agents/mcp.json` ist bereits dist) mit je Handshake-Probe; dev-Repo: Backup-Push + ff-Merge → main (CI grün) + Verzeichnis gelöscht; `docs_validate` im Haupt-Repo grün; npm/Release-Fluss unberührt (0.2.6 läuft erstmals direkt aus dem Haupt-Repo, L32 fährt mit).
- **Packaging:** als Phase 41 (41.1 Model-Doku, 41.2 Umbinden, 41.3 dev-Repo schließen) paketiert — Freigabe durch Nutzer 11/2026 („Alle 4 auf dist/serve.js (empfohlen)" + „Ja — nach Umbinden löschen"); Content-Gates: AGENTS/CONSUMERS = Projekt-Prosa (Niedrig); Config-Änderungen in fremden Repos + user-scope = je Vorkommnis vom Nutzer freigegeben (explizit im AskUserQuestion bestätigt).
- **Erledigt:** Phase 41 (41.1: ec03575 · 41.2: Bindungen dist · 41.3: Merge+CI 43612705709) — Freeze-Split beendet, single-repo + build-gated consumers; M31-Heilung efd4339 trägt; dev-Verzeichnis nach diesem Archiv-Commit gelöscht

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- M31 — L32-Nachbrenner: bin-Normalisierung bricht pack-smoke-/packaging-Erwartungen (CI rot auf main) — erledigt (Phase 42 (42.1: efd4339) — Erwartungen geflippt, CI-Nachweis 43612705709 grün; L32-Lektion: Vollsuite vor jedem Abschluss)
- H15 — Freeze-Split beenden — single-repo + build-gated consumers: Decision 13 neu, 4 Bindungen auf dist/serve.js, dev-Repo schließen — erledigt (Phase 41 (41.1: ec03575 · 41.2: Bindungen dist · 41.3: Merge+CI 43612705709) — Freeze-Split beendet, single-repo + build-gated consumers; M31-Heilung efd4339 trägt; dev-Verzeichnis nach diesem Archiv-Commit gelöscht)
