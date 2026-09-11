# BACKLOG.md — Open Issues (As of: 260911/1430)

> **This file contains only OPEN items.** Completed items move **verbatim**
> to `docs/archive/BACKLOG_ARCHIVE.md`; only a one-liner remains in the Done
> Index (below). Append-only archives retain their historical locale.
> Legend: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low · 🔵 test gap
>
> **Mixed-locale tolerance (I1/14.5):** This file is **English** by convention
> (Decision 10). The legacy DE bullet labels (`**Ort:**`, `**Abnahme:**`, …)
> remain parseable via union matching — item M1 below demonstrates it. Item
> bodies stay language-free; labels follow the file's locale.

---

## 🔴 CRITICAL

> No open items.

---

## 🟠 HIGH

### [ ] M1 — Migration to EN bullet labels in old items — 🟠
- **Location:** Historical BACKLOG items with `**Ort:**` / `**Abnahme:**` bullets
- **Problem:** Mixed-language inventory during the migration (I1) — old items still
  carry German bullet labels, new items use English.
- **Fix:** Tolerate DE labels in EN files via union matching; flip labels as items
  are touched naturally; never block parsing on legacy labels.
- **Acceptance:** `parseBacklog` returns zero warnings; `location` field captured
  for both EN and DE bullets within the same file.

### [ ] M2 — Cross-locale consistency check — 🟠
- **Location:** `packages/core/tests/fixtures/project-g-mixed/`
- **Problem:** Parser must accept EN open files + DE archives in the same project
  (Decision 10 migration tolerance).
- **Fix:** Fixture `project-g-mixed` ships DE archives alongside EN open files.
- **Acceptance:** `docsValidate(project-g-mixed)` returns clean (`ok: true`).

---

## 🟡 MEDIUM

> No open items.

---

## 🟢 LOW

### [ ] M3 — Mixed-language item body — 🟢
- **Location:** This very file, item M3.
- **Problem:** Item bodies remain language-free per Decision 10 — but labels
  (Location / Acceptance) follow the file's locale.
- **Fix:** Document the rule in the fixtures README.
- **Acceptance:** README documents that bodies stay language-free while labels
  follow the file's locale.

---

## 🔵 TEST GAPS

### [ ] M4 — Mixed-locale parser edge cases — 🔵
- **Goal:** Cover the union-matching path: DE bullet label in EN file, EN bullet
  label in DE file, mixed labels within one block.
- **Scope:** Unit tests in `packages/core/tests/locale.test.ts` plus the
  `project-g-mixed` fixture.
- **Acceptance:** All union-matching tests green; the mixed fixture parses clean.

---

## ✅ Done Index

> One-liner per completed item (details in the archive). The migration pattern
> keeps the historical IDs visible in the EN open file even when the archive
> is still in DE (cross-consistency check is locale-agnostic).

- S1 — Pilot setup — done in `b1c2d3e` (details: archive)
- A1 — Initial migration hardening — done in `a1b2c3d` (details: archive)
- A2 — Session cookie hardening — done in `c3d4e5f` (details: archive)

---
