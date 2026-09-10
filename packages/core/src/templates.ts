/**
 * Kanonische Skeletons für die vier Pflichtdateien eines STEPWELL-Projekts
 * (M8/9.4 — Variante A: Vorlagen als Read-Only-Resource, kein init_project-Tool,
 * M4-Guardrail). contents frei: projektname ersetzen, sonst unverändert übernehmen.
 * docs_validate bleibt an den geleerten Skeletons fund-frei (Test: templates.test.ts).
 */
export type TemplateKind = "backlog" | "progress" | "backlog-archive" | "progress-archive";

export const TEMPLATE_KINDS: readonly TemplateKind[] = [
  "backlog",
  "progress",
  "backlog-archive",
  "progress-archive",
];

const BACKLOG = `# BACKLOG.md — Open items (As of: JJMMDD/HHMM)

> **This file contains only OPEN items.** Completed items are moved to \`docs/archive/BACKLOG_ARCHIVE.md\` unchanged after completion; this file keeps only a one-liner per item in the Done Index (below). Findings/fix-ideas/decisions are not deleted — moved to the archive.
> Legend: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low · 🔵 test gap
> Working order: sequential by priority (🔴 → 🟠 → 🟡 → 🟢 → 🔵), each item test-first, commit per item.

---

## 🔴 CRITICAL

> No open items.

---

## 🟠 HIGH

> No open items.

---

## 🟡 MEDIUM

> No open items.

---

## 🟢 LOW

> No open items.

---

## 🔵 TEST GAPS

> No open items.

---

## ✅ DONE INDEX

> (One line per completed item, with commit hash; details in archive.)
`;

const PROGRESS = `# Project tracking: <project name>

> Source method: \`docs/PLAYBOOK.md\` (verbatim)
> Progress file — updated after every step.
> Legend: ⬜ open · 🔄 in progress · ✅ done · ⛔ blocked

> **Structure (archive pattern):** This file contains the **full progress table**
> and detail blocks **only for active/open phases**. Detail blocks of completed phases
> are moved to \`docs/archive/PROGRESS_ARCHIVE.md\` unchanged after completion.

## Active Phases

---

## Progress

| # | Step | Status |
|---|------|--------|
`;

const BACKLOG_ARCHIVE = `# BACKLOG_ARCHIVE.md — Archive of completed items (append-only)

> Items are moved here **unchanged**; follow-up additions only as a new section
> below the item. Newest items are appended at the bottom.

---
`;

const PROGRESS_ARCHIVE = `# PROGRESS_ARCHIVE.md — Archive of completed phases (append-only)

> Detail blocks are moved here **unchanged**; the progress table remains
> complete in \`PROGRESS.md\` (durable index).

---
`;

export const projectTemplates: Record<TemplateKind, string> = {
  backlog: BACKLOG,
  progress: PROGRESS,
  "backlog-archive": BACKLOG_ARCHIVE,
  "progress-archive": PROGRESS_ARCHIVE,
};
