# BACKLOG.md — Open Issues (As of: 260908/0900)

> **This file contains only OPEN items.** Completed items are moved **verbatim**
> to `docs/archive/BACKLOG_ARCHIVE.md`; only a one-liner remains in the Done Index (below).
> Legend: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low · 🔵 test gap

---

## 🔴 CRITICAL

> No open items.

---

## 🟠 HIGH

### [ ] E1 — Upload endpoint without size limit — 🟠
- **Location:** `src/routes/upload.ts:42` (multipart handler)
- **Problem:** No `limits.fileSize` set — oversized bodies pressure memory (found during load test 09/2026).
- **Fix:** Limit `fileSize` to 5 MB, respond 413 with a clear message; test with an oversized body.
- **Acceptance:** Oversized upload returns 413; regular uploads up to the limit work; suite green.

### [ ] E2 — Session cookie without SameSite — 🟠
- **Location:** `src/auth/session.ts:18` (cookie serializer)
- **Problem:** `sameSite` not set → residual CSRF risk in embedded views.
- **Fix:** Enforce `sameSite: "lax"` and `secure` in production; contract test on cookie flags.
- **Acceptance:** Cookie flags verified in the integration test; E2E login stays green.

---

## 🟡 MEDIUM

> No open items.

---

## 🟢 LOW

### [ ] L3 — Clean up docs build warnings — 🟢
- **Location:** `docs/` (strict build, 4 warnings)
- **Problem:** Dead links and anchors rot unnoticed.
- **Fix:** Fix warnings, add the strict build to CI.
- **Acceptance:** Strict build green in CI without warnings.

---

## 🔵 TEST GAPS

### [ ] T8 — Cover empty-database behavior — 🔵 *(OPTIONAL, before pilot)*
- **Goal:** Integration tests for empty states of all list endpoints (200 + empty arrays instead of 500).
- **Scope:** Fixtures without seed, one assert per endpoint; no production change expected.
- **Acceptance:** 5 new tests green on an empty database.

---

## ✅ Done Index

> One-liner per completed item (details in the archive).

- F1 — Migration hardening — done in `a1b2c3d` (details: archive)

---
