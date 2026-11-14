# PROGRESS_ARCHIVE.p40.md — Shard (Phase 40, append-only)

> Created 2026-11-14T16:23 — home for the detail block of Phase 40 on completion.
> Contains: Phase 40 — bin path normalization (L32). Header is write-once — never edited.

---

### Phase 40 — bin path normalization (L32)

**Umfang (Steps):**

- **40.1 bin-Wert normalisieren (./dist/cli.js → dist/cli.js) + npm pkg fix diff-los**
**Verifikation:** bin-Wert „./dist/cli.js" → „dist/cli.js" (425243b). Verification: npm pkg fix diff-los auf dem committed Stand (No-op bewiesen); npm pack --dry-run warn-frei (0 Treffer warn/invalid/removed). Kontraktneutral (Manifest-Metadatum); published Artefakte waren funktional nie betroffen (Fixer korrigierte im Speicher). Fährt mit dem nächsten regulären Release mit. (checkpoint: 425243b)
