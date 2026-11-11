import { describe, expect, it } from "vitest";
import { extractFiles, parseBacklog } from "../src/backlog.ts";

// H10/30.4: path-like tokens extracted from the Location bullet — a cheap
// prediction surface for workstream overlaps. Only path-shaped tokens: no
// invention, no glob expansion, prose and dates stay out.

describe("extractFiles (H10/30.4)", () => {
  it("extracts backticked paths", () => {
    expect(extractFiles("`packages/core/src/validate.ts` (`PLAN_WITHOUT_WIP`); Fund: Session 11/2026")).toEqual([
      "packages/core/src/validate.ts",
    ]);
  });

  it("strips line references (file.ts:12) and handles comma/semicolon lists", () => {
    expect(extractFiles("`src/auth/session.ts:18`, `src/routes/upload.ts:42`; src/x.ts")).toEqual([
      "src/auth/session.ts",
      "src/routes/upload.ts",
      "src/x.ts",
    ]);
  });

  it("tolerates parenthetical comments and Windows separators", () => {
    expect(extractFiles("`D:\\Development\\internal-pwa\\docs\\PLAYBOOK.md` (+ `LESSONS.md`, dort unverändert)")).toEqual([
      "D:\\Development\\internal-pwa\\docs\\PLAYBOOK.md",
      "LESSONS.md",
    ]);
  });

  it("ignores prose, dates and globs (no invention, no glob expansion)", () => {
    expect(extractFiles("Fund: eigene Session 11/2026 — pwa-CRLF-Warning beim Sync als Vorschmack")).toEqual([]);
    expect(extractFiles("`src/**/*.ts` aus der Glob-Idee, Stand: 09/2026")).toEqual([]);
    expect(extractFiles(undefined)).toEqual([]);
    expect(extractFiles("")).toEqual([]);
  });

  it("deduplicates while preserving first-seen order", () => {
    expect(extractFiles("`src/a.ts`, src/a.ts:9, `src/b.ts`")).toEqual(["src/a.ts", "src/b.ts"]);
  });
});

describe("BacklogItem.files (H10/30.4)", () => {
  it("parses the location bullet into files[] on every item", () => {
    const content = [
      "# BACKLOG.md — Open items (As of: 2026-11-11T10:00",
      "",
      "## 🟠 HIGH",
      "",
      "### [ ] H1 — Upload endpoint without size limit — 🟠",
      "- **Location:** `src/routes/upload.ts:42` (Multipart handler)",
      "- **Problem:** no limits.fileSize",
      "",
      "### [ ] H2 — Session cookie without SameSite — 🟠",
      "- **Location:** session prose without any path",
      "- **Problem:** sameSite unset",
      "",
    ].join("\n");
    const parsed = parseBacklog(content);
    const [h1, h2] = parsed.value.items;
    expect(h1?.files).toEqual(["src/routes/upload.ts"]);
    expect(h2?.files).toEqual([]);
    expect(parsed.warnings).toEqual([]);
  });
});
