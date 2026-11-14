# BACKLOG_ARCHIVE.p40.md — Shard (Phase 40, append-only)

> Created 2026-11-14T16:23 — home for item blocks archived in the context of Phase 40 (rotation: last active phase, H14/34.2).
> Contains: items archived during Phase 40. Header is write-once — never edited.

---

### [x] L32 — bin-`./`-Präfix triggert npm-Publish-Warnung — normalisieren (bin: „dist/cli.js") — 🟢
- **Location:** `packages/mcp/package.json` — `"bin": { "stepwell": "./dist/cli.js" }`
- **Problem:** npm 12 (12.2.1) meldet bei JEDEM Publish von `stepwell`: „bin[stepwell] script name dist/cli.js was invalid and removed" — der `./`-Präfix im bin-Wert löst den Publish-Fixer aus (`npm pkg fix` normalisiert zu `dist/cli.js`, diff beweist es). Funkenneutral: der Fixer korrigiert im Speicher, die published Artefakte (0.2.4/0.2.5) haben den bin-Eintrag und sind funktionstüchtig (Shim + Boot + Live-Validierung gegen datacraft verifiziert) — aber die Warnung feuert warnhygienisch bei jedem Publish.
- **Acceptance:** bin-Wert normalisiert (`dist/cli.js`), `npm pkg fix` in packages/mcp diff-los, `npm pack --dry-run` warn-frei; kontraktneutral (Metadatum). Fährt mit dem nächsten regulären Release mit — kein Extra-Release.
- **Packaging:** als Phase 40 (40.1) paketiert — Freigabe implizit durch Fund-Meldung des Nutzers 11/2026 (Warnung gepostet); Content-Gate: Niedrig (Manifest-Metadatum, kein Dependency-Change).
- **Erledigt:** Phase 40 (40.1: 425243b) — bin-Pfad normalisiert, npm pkg fix No-op bewiesen, pack warn-frei; fährt mit dem nächsten Release mit

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- L32 — bin-`./`-Präfix triggert npm-Publish-Warnung — normalisieren (bin: „dist/cli.js") — erledigt (Phase 40 (40.1: 425243b) — bin-Pfad normalisiert, npm pkg fix No-op bewiesen, pack warn-frei; fährt mit dem nächsten Release mit)
