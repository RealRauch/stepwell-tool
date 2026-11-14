# PROGRESS_ARCHIVE.p39.md — Shard (Phase 39, append-only)

> Created 2026-11-14T16:14 — home for the detail block of Phase 39 on completion.
> Contains: Phase 39 — npm package READMEs (M30). Header is write-once — never edited.

---

### Phase 39 — npm package READMEs (M30)

**Umfang (Steps):**

- **39.1 Package-READMEs ×3 (stepwell/core/git, kompakt EN)**
- **39.2 Root-README Install-Abschnitt + Release 0.2.5 + Promotion + publish-Handoff**
**Verifikation:** Root-README Install-Abschnitt (Registry-Links, npx-Beispiele, MCP-Config-Verweis) + repository-Metadatum in die 3 package.jsons (kein Dependency-Change → Niedrig, dokumentiert) + Release 0.2.5 (4× package.json, Lockfile). Verification: typecheck + Suite + pack-smoke grün; Promotion: Probe ✓ (beide Konsumer gesund) → ff-Merge a554c03 → Mirror-Push → CI grün (43608922769) → build → dist-Handshake 0.2.5. npm publish 0.2.5 an Nutzer übergeben (Browser-Auth). (checkpoint: a554c03)
