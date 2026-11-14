# BACKLOG_ARCHIVE.p35.md — Shard (Phase 35, append-only)

> Created 2026-11-14T01:46 — home for item blocks archived in the context of Phase 35 (rotation: last active phase, H14/34.2).
> Contains: items archived during Phase 35. Header is write-once — never edited.

---

### [x] M28 — Deutsch-Reste in der Tool-Fläche auf Englisch — Plan-Descriptions, DOC_SYNC_REMINDER, Errors, Echo-Schema (Audit 11/2026) — 🟡
- **Location:** `packages/core/src/mutations.ts` (+ `packages/core/src/context.ts`), `packages/mcp/src/server.ts`, `packages/mcp/src/tools.ts`
- **Problem:** ~25 deutsche Strings laufen in Tool-Outputs und landen so im Agenten-Kontext — Verstoß gegen Decision 5 (Tool-Fläche englisch): (1) Echo-Tool-Schema `describe("Der zurückzugebende Text.")` (server.ts:29, einziger deutscher String in der deklarierten Fläche), (2) Plan-Descriptions der Mutations-Tools (mutations.ts:248, 653, 1215, 1305–1308, 1406, 1412), (3) `DOC_SYNC_REMINDER` (mutations.ts:82, Feld `docSyncReminder` + Verifikations-Message bei Phasen-Abschluss), (4) Error-Messages (mutations.ts:147, 190, 556, 561, 566, 790, 1038, 1059, 1141, 1157, 1198; context.ts:80; tools.ts:257, 314), (5) Mischform-Reste "Erledigt-Index"/"Erledigt-Marker" (mutations.ts:422–423, 1440). Audit 11/2026: sauber sind Server-Instructions, Tool-/Resource-Beschreibungen, Templates, SKILL, CLI-Help, Validate-Warnungen, git-Satellit.
- **Acceptance:** alle gefundenen Strings EN; Kontrakt unverändert (keine Tool-Namen/Parameter/JSON-Antwortformen/Resource-URIs/Warning-Codes — Decision 13); Tests aktualisiert (Test-First: Assertions zuerst EN, RED-Evidenz); `npm run typecheck` + `npm run test` grün; `docs_validate` grün; bewusstes Deutsch bleibt: `--locale de|en`-Feature, profile.ts-Toleranzschicht, Code-Kommentare.
- **Packaging:** als Phase 35 (35.1 core, 35.2 mcp) paketiert — Freigabe durch Nutzer 11/2026 („ggf. auch ausführen“); Content-Gate: Niedrig (Source/Test-Edits im Step-Scope).
- **Erledigt:** Phase 35 (35.1: 726a28f/ecf2500 · 35.2: 226eb55/c932ec4) — Audit 11/2026: alle gefundenen Tool-Output-Strings EN; bewusstes Deutsch (locale-Feature, Toleranzschicht, Kommentare) unverändert

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- M28 — Deutsch-Reste in der Tool-Fläche auf Englisch — Plan-Descriptions, DOC_SYNC_REMINDER, Errors, Echo-Schema (Audit 11/2026) — erledigt (Phase 35 (35.1: 726a28f/ecf2500 · 35.2: 226eb55/c932ec4) — Audit 11/2026: alle gefundenen Tool-Output-Strings EN; bewusstes Deutsch (locale-Feature, Toleranzschicht, Kommentare) unverändert)
