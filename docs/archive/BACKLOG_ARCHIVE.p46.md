# BACKLOG_ARCHIVE.p46.md — Shard (Phase 46, append-only)

> Created 2026-11-21T23:23 — home for item blocks archived in the context of Phase 46 (rotation: last active phase, H14/34.2).
> Contains: items archived during Phase 46. Header is write-once — never edited.

---

### [x] M34 — BACKLOG-Header-Stempel frisst schließende Klammer (Feldfund datacraft) — 🟡
- **Location:** `packages/core/src/mutations.ts` — `STAMP_TOKEN` (`\S+`) + `refreshHeadingStamp` (Schreibpfad backlog_add/update/remove).
- **Problem:** Feldfund aus RealRauch/datacraft (Bug-Report 11/2026): Der Stamp-Token-Match `\S+` frisst nach `As of:`/`Stand:` auch die schließende Klammer (`2026-11-19T23:17)`), der Ersatz (`stampNow()`) schreibt sie nicht zurück — jede Schreiboperation erzeugt `… (As of: <ts>` ohne `)` und überschreibt damit jede Handkorrektur. Belege: datacraft-Commits `4270869` (Handfix mit Klammer) → `1b248e4` (Tool-Schreibvorgang, Klammer wieder weg); eigene Fixtures (`project-k-planned`, `project-l-deps`) tragen dieselbe defekte Form. Der bestehende Test („add refreshes the Stand timestamp") assertet nur die Anwesenheit des Zeitstempels — die Klammer ist für ihn unsichtbar, deshalb überlebte der Defekt.
- **Fix:** STAMP_TOKEN auf Zeitstempel-Grammatik einschränken (ISO `YYYY-MM-DDTHH:mm` | Legacy `YYMMDD/HHMM` | Legacy `MM/YYYY`, Decision 6) statt `\S+`; bei natürlichem Schreibvorgang eine durch den Legacy-Bug offen gebliebene Klammer am Marker reparieren (kanonische Form `… (As of: <ts>)`), parenlose Stile unangetastet lassen (Toleranz). Bestehende Stamp-Test schärfen (Klammer-Assertion). Optional später: docs_validate-Finding für ungeöffnete/unschlossene Klammer — Vertragserweiterung (neuer Code), separat entscheiden.
- **Acceptance:** RED→GRÜN-Test pinnen das Verhalten (kanonisch → Klammer bleibt; defekt → Schreibvorgang repariert; Legacy-DE/EN → ISO-Refresh + Klammer; parenlos → keine Klammer auferlegt); Shards/PROGRESS-Kopf/Seed-Templates auf denselben Defekt geprüft (shardHeader sauber, Seed hat Klammer); typecheck + test + docs_validate grün.
- **Erledigt:** Commit 6f83b17 (fix), 8df4ec0 (RED-Tests), Phase 46 — 508/508 grün

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- M34 — BACKLOG-Header-Stempel frisst schließende Klammer (Feldfund datacraft) — erledigt (Commit 6f83b17 (fix), 8df4ec0 (RED-Tests), Phase 46 — 508/508 grün)
