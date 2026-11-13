# PROGRESS_ARCHIVE.p34.md — Shard (Phase 34, append-only)

> Created 2026-11-14T00:51 — home for the detail block of Phase 34 on completion.
> Contains: Phase 34 — Rotation folgt dem realen Workflow (H14). Header is write-once — never edited.

---

### Phase 34 — Rotation folgt dem realen Workflow (H14)

**Umfang (Steps):**

- **34.1 [H14] RED: Fixture-Test für den realen Workflow — Step auf ✅ geflippt (Phase abgeschlossen) → archive_item im ✅-Fenster → Block muss in p<n>-Shard landen (aktuell: kanonisch)**
- **34.2 [H14] GRÜN: Aktivitäts-basierte Phase-Ableitung — letzte 🔄/✅-Zeile in Tabellen-Ordnung statt 🔄-Fenster; bestehende Testerwartungen auf die neue Semantik umstellen; Header-Wording anpassen; Suite grün**
- **34.3 Release 0.2.2 (Patch) + Promotion: Lockstep-Bump, Tag, Push, CI grün, frozen dir, Feldprobe; Live-Verifikation folgt mit reiseapp Phase 31 im Feldtest-Log (33.2)**
**Verifikation:** Release 0.2.2: Lockstep+Lockfile synchron, Tag v0.2.2, CI grün (43527912135), frozen dir promotet+gebaut, GitHub-Release; Live-Verifikation koppelt an reiseapp Phase 31 (Feldtest-Log) (checkpoint: 172ed51)
