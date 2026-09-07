# BACKLOG_ARCHIVE.md — Archive of completed items (append-only)

> Items are moved here **verbatim**; later additions only as a new section below the item.
> Append the newest items at the bottom.

---

### [x] F1 — Migration hardening — 🔴 *(completed 08/2026)*
- **Location:** `db/migrations/002_*.sql`
- **Problem:** The migration ran without a transaction; aborting halfway left an inconsistent schema.
- **Fix:** Wrap the migration in a transaction, add a checksum column; re-run is idempotent.
- **Acceptance:** Migration runs twice cleanly; suite green.
- **Done:** Commit `a1b2c3d` (08/2026).

---
