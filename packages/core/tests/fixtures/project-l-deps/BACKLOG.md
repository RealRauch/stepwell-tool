# BACKLOG.md — Open items (As of: 2026-11-11T10:00

> **This file contains only OPEN items.** Completed items are moved to `docs/archive/BACKLOG_ARCHIVE.md` unchanged after completion; this file keeps only a one-liner per item in the Done Index (below). Findings/fix-ideas/decisions are not deleted — moved to the archive.
> Legend: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low · 🔵 test gap
> Working order: sequential by priority (🔴 → 🟠 → 🟡 → 🟢 → 🔵), each item test-first, commit per item.

---

## 🟠 HIGH

### [ ] X1 — Chain head (blocked transitively) — 🟠
- **Location:** `src/chain/head.ts`
- **Depends on:** X2
- **Problem:** M21/30.6 fixture — blocked via X2 → X3.

### [ ] X2 — Chain middle — 🟠
- **Location:** `src/chain/middle.ts`
- **Depends on:** X3
- **Problem:** M21/30.6 fixture — blocked directly by X3.

### [ ] X3 — Chain tail (ready) — 🟠
- **Location:** `src/chain/tail.ts`
- **Problem:** M21/30.6 fixture — no Depends-on bullet, open ⇒ ready.

### [ ] X4 — Cycle left — 🟠
- **Location:** `src/cycle/left.ts`
- **Depends on:** X5
- **Problem:** M21/30.6 fixture — cycle with X5 ⇒ DEP_CYCLE.

### [ ] X5 — Cycle right — 🟠
- **Location:** `src/cycle/right.ts`
- **Depends on:** X4
- **Problem:** M21/30.6 fixture — cycle with X4 ⇒ DEP_CYCLE.

### [ ] X6 — Unknown reference — 🟠
- **Location:** `src/unknown/ref.ts`
- **Depends on:** ZZ9
- **Problem:** M21/30.6 fixture — unknown id ⇒ DEP_UNKNOWN warning, readiness unaffected.

---

## 🟡 MEDIUM

> No open items.

---

## ✅ DONE INDEX

> (One line per completed item, with commit hash; details in archive.)
