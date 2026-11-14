# PROGRESS_ARCHIVE.p38.md — Shard (Phase 38, append-only)

> Created 2026-11-14T15:31 — home for the detail block of Phase 38 on completion.
> Contains: Phase 38 — SERVER_VERSION derives from package.json (L31). Header is write-once — never edited.

---

### Phase 38 — SERVER_VERSION derives from package.json (L31)

**Umfang (Steps):**

- **38.1 SERVER_VERSION aus packages/mcp/package.json ableiten (Test-First) + pack-smoke + Vollverifikation**
**Verifikation:** RED 1bbf108 (3 Version-Assertions auf package.json-Derivat; 3 failed | 3 passed) → GREEN eee71b4 (SERVER_VERSION + TOOL_VERSION per createRequire aus dem jeweiligen package.json abgeleitet; TOOL_VERSION als Inline-Fix im Step-Scope, ≤10 Zeilen). Inventar CONSUMERS.md Versionierung-Zeile aktualisiert (Pflegepflicht). Verification: typecheck grün; npm run test 491/491; pack-smoke OK (Handshake gegen src+dist mit abgeleiteter Version). Kontraktneutral (Handshake-Metadaten, kein Surface-Change). (checkpoint: eee71b4)
