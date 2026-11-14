# BACKLOG_ARCHIVE.p44.md — Shard (Phase 44, append-only)

> Created 2026-11-14T23:41 — home for item blocks archived in the context of Phase 44 (rotation: last active phase, H14/34.2).
> Contains: items archived during Phase 44. Header is write-once — never edited.

---

### [x] L29 — backlog_add: Titel mit ID-Präfix erzeugt doppelt präfixierte Done-Index-Zeilen — Normalisieren/Warnung (Feldfund F2) — 🟢
- **Location:** `packages/core/src/mutations.ts` (`planBacklogAdd`), `backlog_add`-Surface. Fund: Feldtest Sprocke 3 (finnland-reiseapp 11/2026) — Done-Index-Zeilen der Form `- N5 — N5 — Karten-Overlay … — done (done in ace6d94)`.
- **Problem:** Der Konsumer-Agent lieferte beim `backlog_add` den Titel MIT ID-Präfix („N5 — Karten-Overlay…") — die generierte Index-Zeile dupliziert die ID sichtbar („N5 — N5 — …"), ebenso die doppelte „done (done in …)"-Konstruktion durch `note: "done in <sha>"` (Note enthält das done-Wort).
- **Rezidiv-Beleg (11/2026, Phase 31 im Feldprojekt):** Das Muster trat unverändert wieder auf — Done-Index-Zeilen „N9 — N9 — …", „F8 — F8 — …", „N15 — N15 — …" inkl. „done (done in 70390dc)"-Dopplung; der Konsumer-Agent lieferte die Titel erneut mit ID-Präfix. Ohne Tool-Unterstützung reproduziert der Fehler sich bei jedem Agenten — die Warnung/Normalisierung ist der wirksame Hebel, nicht Agentenschulung.
- **Fix (leichtgewichtig, UX-Friktion nicht Korruption):** (a) `backlog_add` warnt (Warning im Plan) wenn der Titel mit `<id> —` beginnt und stript den Präfix als Vorschlag; (b) Dokumentations-Hinweis im SKILL/README: Note soll die Commit-Referenz tragen, nicht das done-Wort. Kein Breaking, additive Warning.
- **Acceptance:** RED→GRÜN: Titel mit ID-Präfix → Warning im Plan + unverändertes Verhalten ohne Warning im Normalfall; Suite grün.

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- L29 — backlog_add: Titel mit ID-Präfix erzeugt doppelt präfixierte Done-Index-Zeilen — Normalisieren/Warnung (Feldfund F2) — erledigt
