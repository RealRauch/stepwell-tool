# Field test — rung 3 (finnland-reiseapp Umbau)

> STEPWELL 0.2.1 under field test in an explicitly chosen uncritical third project
> (Decision 14, field-test ladder: fixtures ✓ → own-repo dogfood ✓ (M12/M13, Phase 32)
> → **this rung**). This protocol is the observation contract for Phase 33
> (backlog root H13); its outcome feeds the 1.0.0 decision template (step 33.3).

## Subject and environment

| | |
|---|---|
| **Subject under test** | stepwell 0.2.1 (v0.2.1, promoted frozen checkout `stepwell-tool`) |
| **Field project** | `D:\Development\finnland-reiseapp` — uncritical (owner classification 11/2026), ~29 phases of method history, **Umbau (rebuild) upcoming** |
| **Consumption** | global user-scoped MCP registration (frozen dir, node src) + CLI probes |
| **Method copies** | PLAYBOOK `8a029fed…`, LESSONS `2cdde3db…` (synced 11/2026, `f97ff2d`) |
| **Not part of this test** | datacraft + stadtpfad-pwa (critical/established consumers), ZooKeeper viewer (parked, separate) |

## Observation fields

1. **Sharding live** — item archives during the Umbau land on
   `BACKLOG_ARCHIVE.p<n>.md` with write-once headers; the phase block of the
   Umbau phase lands on its own `PROGRESS_ARCHIVE.p<n>.md`; the canonical
   archives freeze. Coupled Done Index: lines live where their blocks live.
2. **PHASE_MIDWAY windows** — `docs_validate` between two step flips stays green
   (ok: true) during active work; no false CI breaks.
3. **Validation signals** — findings/warnings during real work are precise,
   actionable, and agree with the actual file state (no false positives on
   legitimate states, no silent misses).
4. **Workflow mechanics under real use** — commit automation (`--commit`), hash
   fast path in real sessions, `sync` machinery if workstreams occur,
   `considerWorktrees` on planning if parallel work happens.
5. **Documentation drift** — README/PLAYBOOK/SKILL claims vs. observed behavior;
   stale copy detection via the SHA256-anchored syncs.

## Finding classes

| Class | Meaning | Feedback path |
|-------|---------|---------------|
| **Bug** | the tool misbehaves against the documented contract | BACKLOG item in stepwell-tool (patch/minor release if contract-relevant) |
| **Method drift** | docs/method claims diverge from what real projects need | BACKLOG item (method wording or tolerance layer) |
| **UX friction** | works, but hurts in real use | BACKLOG item (🟢 unless systemic) |

Findings enter as items **while observed** (Decision 8: work grows from findings,
not from planning) — the already-logged pre-protocol evidence is the template:

- **T6** (stadtpfad-pwa promotion probe): 32.3 regression on removed blocks with
  table Done-Index entries → fixed in 0.2.1.
- **M16** (finnland-reiseapp probe): ghost-tracking (pre-adoption item with index
  line, no block) → reconstructed block from verifiable facts (`4a5173f`).
- **H12→H13 collision + EMPTY_MARKER_STALE** (packaging probes): a pre-32 session
  server blind to shards produced two artifacts the current `docs_validate`
  caught immediately.

## Acceptance (rung 3 complete when)

1. The Umbau ran to completion **without data loss** (archives append-only,
   byte-integrity of moved blocks).
2. `docs_validate` on the field project is **clean at the end** (open files).
3. All findings are documented as items here, classified, and dispositioned
   (fix / accept / park).
4. Step 33.3 delivers a **justified 1.0.0 recommendation** (release vs. stay 0.x,
   incl. the npm-publish question) — the ladder's purpose.

## Log

| Date | Entry |
|------|-------|
| 2026-11-13 | Protocol created; pre-protocol evidence logged (T6, M16, vintage-session artifacts). Baseline: `docs_validate` clean on the field project after the M16 reconstruction. |
| 2026-11-13 | **Umbau started** (owner report). Snapshot at start: HEAD `4a5173f`, tree clean, 1 open item (🟡), 118/118 done, 4 doc files (no shards yet — the first phase packaging will create them), `docs_validate` clean. Observation field 33.2 flipped 🔄 in this repo via the **new MCP surface** (flip itself ran clean — first live observation). |
| 2026-11-14 | **Umbau phase completed** — Phase 30 "Tour-Metadaten als Daten" (30.1–30.8, Suite 404/404, Coverage 93.28 %, deployed `6d087a3`). **Field 1 confirmed (phase block):** `PROGRESS_ARCHIVE.p30.md` created with write-once header (ISO Created-stamp, Contains = final heading) + verbatim block + full verification line — exactly per contract. **Field 1 MISSED (item rotation — finding F1 → H14):** N5–N8 landed in the canonical BACKLOG_ARCHIVE (86 blocks, grew) instead of a shard — the real agent workflow is "flip step ✅ → archive items → flip next 🔄", and `runningPhaseNumber` sees no 🔄 in that window, so the append went canonical. Design gap: rotation anchored to the 🔄-window misses the most common case. **Field 2:** no PHASE_MIDWAY breakage observed; the agent pre-planned Phase 31 → `PHASE_PLANNED` warning, ok stayed green (M18 live-correct). **Field 3:** `docs_validate` clean across the whole run; `docFiles` = 5 (4 canonical + p30 shard), hashes include the shard. **Field 5 / UX friction (finding F2 → L29):** done-index lines carry a doubled ID prefix ("N5 — N5 — …") from an ID-prefixed `backlog_add` title plus "done (done in …)" duplication via the note. **No data loss**; acceptance criterion 1 satisfied for this phase. |
