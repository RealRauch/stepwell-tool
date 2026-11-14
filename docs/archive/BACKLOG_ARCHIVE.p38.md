# BACKLOG_ARCHIVE.p38.md — Shard (Phase 38, append-only)

> Created 2026-11-14T15:31 — home for item blocks archived in the context of Phase 38 (rotation: last active phase, H14/34.2).
> Contains: items archived during Phase 38. Header is write-once — never edited.

---

### [x] L31 — SERVER_VERSION-Decoupling: Inventar verlangt Release-Bump in server.ts, Praxis hält 0.1.0 (auch 0.2.3) — 🟢
- **Location:** `packages/mcp/src/server.ts` (`SERVER_VERSION = "0.1.0"`) + `packages/mcp/tests/server.test.ts` (Assertion 0.1.0); Konsumer-Inventar `stepwell-internal/CONSUMERS.md` („Release-Bump = 3× package.json + server.ts (+ zugehörige Tests)").
- **Problem:** Das Inventar verlangt pro Release auch den `SERVER_VERSION`-Bump in `server.ts` (MCP-Handshake-Version), aber die Praxis hält `0.1.0` fest — auch 0.2.1/0.2.2/0.2.3 haben es nicht gezogen. Inkonsistenz zwischen dokumentierter Release-Prozedur und gelebter Praxis; Konsumer sehen dauerhaft 0.1.0. Gleiche Drift-Klasse: `TOOL_VERSION = "0.1.0"` in `packages/core/src/index.ts` (nur Export + Smoke-Assertion, nie gezogen).
- **Acceptance:** Entscheidung gefällt und umgesetzt ODER Inventar-Text korrigiert: (a) `SERVER_VERSION` künftig automatisch mit Lockstep-Ziehen (server.ts + Test im Release-Commit) oder (b) Inventar-Zeile an Praxis anpassen (SERVER_VERSION bewusst statisch, Kontrakt dokumentiert). Beides kontraktneutral (Versions-Report, kein Surface-Change).
- **Packaging:** als Phase 38 (38.1) paketiert — Entscheidung bei Ausführung 11/2026: Variante (a) verschärft als **Derive-Lösung** — `SERVER_VERSION`/`TOOL_VERSION` werden per `createRequire` aus dem jeweiligen package.json abgeleitet (mcp + core), sodass der Release-Bump künftig mechanisch korrekt ist (nur 4× package.json, keine Version-Konstante mehr); Lesson 26 (mechanisch statt Prosa). `TOOL_VERSION` als Inline-Fix im Step-Scope (≤10 Zeilen, gleiche Dateiklasse). Inventar-Zeile wird im Zug aktualisiert. Freigabe: Nutzer („L31 noch bitte umsetzen!").
- **Erledigt:** Phase 38 (38.1: 1bbf108/eee71b4) — SERVER_VERSION/TOOL_VERSION per createRequire abgeleitet; Inventar-Zeile aktualisiert; 491/491 + pack-smoke grün

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- L31 — SERVER_VERSION-Decoupling: Inventar verlangt Release-Bump in server.ts, Praxis hält 0.1.0 (auch 0.2.3) — erledigt (Phase 38 (38.1: 1bbf108/eee71b4) — SERVER_VERSION/TOOL_VERSION per createRequire abgeleitet; Inventar-Zeile aktualisiert; 491/491 + pack-smoke grün)
