# Project Tracking: Demo Project Mixed-Locale

> Source method: `docs/PLAYBOOK.md`
> Progress file — updated after every step.
> Legend: ⬜ open · 🔄 in progress · ✅ done · ⛔ blocked

> **Structure (archive pattern):** Active phases live here; completed phases
> move verbatim to `docs/archive/PROGRESS_ARCHIVE.md` (which stays in German
> for this fixture, per the append-only rule — Decision 10).

## Active Phases

### Phase 14 — Language switch: English primary

**Goal:** Open files of this project are English; archives stay in their
historical locale (Decision 10 — append-only archives are never re-locale'd).

**Acceptance:** `parseProgress` and `docsValidate` green on this root; DE
archives parse without warnings; union matching tolerates legacy DE bullet
labels in EN open files.

**Scope (Steps):**

- **14.5 Fixtures README EN + mixed-locale fixture (I1/5)**
- **14.6 STRUCT_LOCALE decision + CHANGELOG (I1/6)**

---

## Progress

| # | Step | Status |
|---|------|--------|
| 0.1 | Project setup | ✅ |
| 0.2 | Env & structure | ✅ |
| 1.1 | Migration script | ✅ |
| 14.5 | Fixtures README EN + mixed fixture | 🔄 |
| 14.6 | STRUCT_LOCALE decision + CHANGELOG | ⬜ |
