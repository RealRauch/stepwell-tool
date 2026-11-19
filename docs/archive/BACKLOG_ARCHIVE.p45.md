# BACKLOG_ARCHIVE.p45.md — Shard (Phase 45, append-only)

> Created 2026-11-19T23:52 — home for item blocks archived in the context of Phase 45 (rotation: last active phase, H14/34.2).
> Contains: items archived during Phase 45. Header is write-once — never edited.

---

### [x] M33 — Bootstrap-Fall leere Progress-Tabelle: progress_plan_phase legt die erste Step-Zeile selbst an — 🟡
- **Location:** `packages/core/src/mutations.ts` (`planPhase` — der Pfad, der mindestens eine existierende Step-Zeile verlangt), `packages/core/src/templates.ts` (progress-Template mit leerer Tabelle), Fixtures `packages/core/tests/fixtures/`.
- **Problem:** Feldprobe StarSearch (11/2026, dasselbe Feld wie M32): das frische progress-Template hat keine Step-Zeilen, und **beide** Pfade scheitern — `progress_plan_phase` verlangt eine existierende Zeile, der Ausweichpfad `progress_update` (🔄, legt Zeile + Skeleton an) genauso („Beide Pfade brauchen eine existierende Zeile"). Henne-Ei: die erste Zeile kann nur von Hand ins Markdown geseedet werden — der Probe-Agent tat genau das. Jedes neue Projekt läuft in diesen Fall.
- **Fix:** Erweiterung des bestehenden Tools (M4-Alternativen-Check dokumentiert): wenn die Tabelle **keine** Zeile hat (Bootstrap-Fall), legt `progress_plan_phase` die Zeilen der Zielphase inkl. der ersten selbst an (Detail-Block-Skeleton wie heute, dry-run-first bleibt). Bestandsprojekte mit vorhandenen Zeilen: Verhalten byte-identisch. Toleranz-Layer (handgeseedete Zeilen, legacy-Labels) bleibt unberührt — der Fall „Zeile existiert schon" ist heute ja bereits der Normalpfad.
- **Acceptance:** RED→GRÜN mit neuem/erweitertem Fixture (leeres progress-Template): `plan_phase` auf leerer Tabelle erzeugt Phase-Zeilen + Skeleton; Dry-run zeigt den Diff vor dem Schreiben; zweiter Lauf no-op (idempotent); Bestands-Fixtures ergebnisgleich (kein Verhaltenswechsel bei vorhandenen Zeilen); Suite + typecheck grün; ggf. Note in PLAYBOOK §3, falls die Bootstrap-Passage einen Satz zur Tool-Unterstützung verdient — ansonsten kein PLAYBOOK-Sync (Tool-Verhalten, keine Methodenänderung).
- **Erledigt:** Commits 4159cf6 (RED: Fixture project-n-empty-table + 3 Bootstrap-Tests) + 5244f98 (GRÜN: appendTableRows-Separator-Fallback) — Phase 45.1/45.2; Core-Suite byte-identisch grün

---

### [x] M32 — Templates für Kaltstart über Tool-Oberfläche liefern: docs_status-Bootstrap-Hinweis statt toter Resource-/QUICKSTART-Zeiger — 🟡
- **Location:** `packages/core/src/status.ts` (`docsStatus` — Verhalten auf nicht initialisiertem Root), `packages/core/src/templates.ts` (`projectTemplates`), `packages/mcp/src/server.ts` (instructions-Text), `packages/mcp/src/resources.ts` (`stepwell://templates/{kind}`).
- **Problem:** Feldprobe StarSearch (11/2026, Kaltstart eines Zielprojekts): die Templates sind nur als MCP-Resources exponiert, aber ZCode reicht Resources nicht an den Agenten durch (nur Tools) — der instructions-Hinweis „templates are available as resources" ist zur Laufzeit eine tote Tür. Zugleich zeigt derselbe Hinweis auf `docs/QUICKSTART.md`, das in Zielprojekten bewusst nicht existiert (Decision 15). Ergebnis im Probe-Chat: der Agent suchte das Dateisystem ab und fand die Templates nur zufällig (Sibling-Checkout dieses Repos). Das ist exakt der Reactivation-Trigger, den Decision 15 selbst definiert.
- **Fix:** **Kein neues Tool (M4):** `docs_status` liefert auf nicht initialisiertem Root (keine der vier Dateien) einen strukturierten Bootstrap-Hinweis — die vier Dateipfade plus die vier Skeletons **inline** (Resources sind in ZCode unbelesbar, also muss der Inhalt durch das Tool selbst). Opt-in über einen Parameter (z. B. `includeTemplates`) statt immer-full-Payload; Default-Verhalten unverändert für initialisierte Roots. Dazu den instructions-Text reparieren: QUICKSTART-Zeiger ersetzen (in Zielprojekten tot) durch den tool-erreichbaren Weg; Decision 15 (QUICKSTART-Distribution, keine dritte Verbatim-Kopie) bleibt unangetastet — hier ändert sich nur der Hinweistext.
- **Acceptance:** RED→GRÜN: `docs_status` auf leerem Root liefert Hinweis + Skeletons ohne Schreibzugriff; initialisierte Roots unverändert; zweiter Aufruf mit `includeTemplates` idempotent; instructions-Text aktualisiert; `docs_validate` ohne neue Findings; Suite + typecheck grün. Decision-15-Vermerk im Item-Close: Reactivation-Kriterium ausgelöst und abgearbeitet (Fund dokumentiert).
- **Erledigt:** Commit 418065c (docs_status include "templates" + instructions-Bootstrap-Hinweis) + Doc-Sync b5e861f — Phase 45.3/45.4; Decision-15-Vermerk: Reactivation-Kriterium ausgelöst und abgearbeitet — QUICKSTART bleibt nur im Tool-Repo (keine dritte Verbatim-Kopie), Findbarkeit läuft jetzt über den Tool-kanal (include "templates")

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- M33 — Bootstrap-Fall leere Progress-Tabelle: progress_plan_phase legt die erste Step-Zeile selbst an — erledigt (Commits 4159cf6 (RED: Fixture project-n-empty-table + 3 Bootstrap-Tests) + 5244f98 (GRÜN: appendTableRows-Separator-Fallback) — Phase 45.1/45.2; Core-Suite byte-identisch grün)
- M32 — Templates für Kaltstart über Tool-Oberfläche liefern: docs_status-Bootstrap-Hinweis statt toter Resource-/QUICKSTART-Zeiger — erledigt (Commit 418065c (docs_status include "templates" + instructions-Bootstrap-Hinweis) + Doc-Sync b5e861f — Phase 45.3/45.4; Decision-15-Vermerk: Reactivation-Kriterium ausgelöst und abgearbeitet — QUICKSTART bleibt nur im Tool-Repo (keine dritte Verbatim-Kopie), Findbarkeit läuft jetzt über den Tool-kanal (include "templates"))
