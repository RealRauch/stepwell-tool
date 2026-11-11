import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { docsRepair } from "../src/repair.ts";
import { docsValidate } from "../src/validate.ts";

const fixtures = join(import.meta.dirname, "fixtures");

const tempDirs: string[] = [];
function tempCopy(project: string): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-repair-"));
  tempDirs.push(dir);
  cpSync(join(fixtures, project), dir, { recursive: true });
  return dir;
}
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); // M19/29.2
  }
});

describe("docsRepair — dry-run default (H9/30.1)", () => {
  it("lists planned actions and skipped findings without writing anything", () => {
    const dir = tempCopy("project-b-drift");
    const before = ["BACKLOG.md", "PROGRESS.md", join("docs", "archive", "BACKLOG_ARCHIVE.md")]
      .map((rel) => readFileSync(join(dir, rel), "utf8"));

    const plan = docsRepair(dir);

    expect(plan.dryRun).toBe(true);
    expect(plan.fix.applied).toEqual([]);
    expect(plan.changes).toEqual([]);
    // b-drift: H9 NOT_ARCHIVED, Z9 ARCHIVE_WITHOUT_INDEX, 1.4 WIP_WITHOUT_PLAN
    // (planned order follows the validate finding order)
    expect(plan.fix.planned.map((a) => [a.code, a.target])).toEqual([
      ["NOT_ARCHIVED", "H9"],
      ["ARCHIVE_WITHOUT_INDEX", "Z9"],
      ["WIP_WITHOUT_PLAN", "1.4"],
    ]);
    // non-repairable codes + the MM/YYYY legacy date stay findings with a reason
    const skippedCodes = plan.fix.skipped.map((s) => s.code);
    expect(skippedCodes).toContain("ID_DUPLICATE");
    expect(skippedCodes).toContain("ID_CONVENTION");
    expect(skippedCodes).toContain("INDEX_WITHOUT_ARCHIVE");
    expect(skippedCodes).toContain("PLAN_WITHOUT_WIP");
    const legacySkip = plan.fix.skipped.find((s) => s.code === "DATE_LEGACY");
    expect(legacySkip?.reason).toMatch(/MM\/YYYY.*day/iu);
    // nothing written
    const after = ["BACKLOG.md", "PROGRESS.md", join("docs", "archive", "BACKLOG_ARCHIVE.md")]
      .map((rel) => readFileSync(join(dir, rel), "utf8"));
    expect(after).toEqual(before);
  });
});

describe("docsRepair — per-code isolation (H9/30.1): the fix removes exactly this finding", () => {
  it("EMPTY_MARKER_STALE: removes the stale placeholder, keeps the section items byte-identical", () => {
    const dir = tempCopy("project-a");
    const backlogPath = join(dir, "BACKLOG.md");
    writeFileSync(
      backlogPath,
      readFileSync(backlogPath, "utf8").replace(
        "## 🟠 HOCH\n",
        "## 🟠 HOCH\n\n> No open items.\n",
      ),
      "utf8",
    );
    expect(docsValidate(dir).findings.map((f) => f.code)).toEqual(["EMPTY_MARKER_STALE"]);

    const result = docsRepair(dir, { dryRun: false });

    expect(result.fix.applied.map((a) => a.code)).toEqual(["EMPTY_MARKER_STALE"]);
    expect(result.verification.ok).toBe(true);
    const after = readFileSync(backlogPath, "utf8");
    expect(after).not.toContain("> No open items.");
    expect(after).toContain("### [ ] H1 — Upload-Endpunkt ohne Größenlimit — 🟠");
    expect(docsValidate(dir).ok).toBe(true);
  });

  it("DATE_LEGACY (YYMMDD/HHMM): rewrites the stamp to ISO 8601 in place", () => {
    const dir = tempCopy("project-a");
    const backlogPath = join(dir, "BACKLOG.md");
    writeFileSync(
      backlogPath,
      readFileSync(backlogPath, "utf8").replace("Stand: 2026-09-07T12:00", "Stand: 260907/1523"),
      "utf8",
    );
    expect(docsValidate(dir).findings.map((f) => f.code)).toEqual(["DATE_LEGACY"]);

    const result = docsRepair(dir, { dryRun: false });

    expect(result.fix.applied.map((a) => a.code)).toEqual(["DATE_LEGACY"]);
    expect(result.verification.ok).toBe(true);
    expect(readFileSync(backlogPath, "utf8")).toContain("Stand: 2026-09-07T15:23");
    expect(docsValidate(dir).ok).toBe(true);
  });

  it("DATE_LEGACY (MM/YYYY): stays a finding — the day is not reconstructible", () => {
    const dir = tempCopy("project-a");
    const backlogPath = join(dir, "BACKLOG.md");
    writeFileSync(
      backlogPath,
      readFileSync(backlogPath, "utf8").replace("Stand: 2026-09-07T12:00", "Stand: 09/2026"),
      "utf8",
    );
    expect(docsValidate(dir).findings.map((f) => f.code)).toEqual(["DATE_LEGACY"]);

    const result = docsRepair(dir, { dryRun: false });

    expect(result.fix.applied).toEqual([]);
    expect(result.fix.skipped).toHaveLength(1);
    expect(result.fix.skipped[0]?.code).toBe("DATE_LEGACY");
    expect(result.fix.skipped[0]?.reason).toMatch(/MM\/YYYY.*day/iu);
    expect(readFileSync(backlogPath, "utf8")).toContain("Stand: 09/2026");
    expect(docsValidate(dir).ok).toBe(false);
  });

  it("NOT_ARCHIVED: archives via planArchiveItem with the repair note", () => {
    const dir = tempCopy("project-a");
    const backlogPath = join(dir, "BACKLOG.md");
    writeFileSync(
      backlogPath,
      readFileSync(backlogPath, "utf8").replace("### [ ] H1 —", "### [x] H1 —"),
      "utf8",
    );
    expect(docsValidate(dir).findings.map((f) => f.code)).toEqual(["NOT_ARCHIVED"]);

    const result = docsRepair(dir, { dryRun: false });

    expect(result.fix.applied.map((a) => a.code)).toEqual(["NOT_ARCHIVED"]);
    expect(result.verification.ok).toBe(true);
    const backlog = readFileSync(backlogPath, "utf8");
    expect(backlog).not.toContain("### [x] H1 —");
    // project-a is German: the generated done word is the locale canonical
    expect(backlog).toContain("- H1 — Upload-Endpunkt ohne Größenlimit — erledigt (repaired by docs_repair)");
    const archive = readFileSync(join(dir, "docs", "archive", "BACKLOG_ARCHIVE.md"), "utf8");
    expect(archive).toContain("### [x] H1 — Upload-Endpunkt ohne Größenlimit — 🟠");
    expect(docsValidate(dir).ok).toBe(true);
  });

  it("WIP_WITHOUT_PLAN: creates the skeleton when the phase has no other table rows", () => {
    const dir = tempCopy("project-a");
    const progressPath = join(dir, "PROGRESS.md");
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8").replace(
        "| 2.3 | U22 Ladezustände | ⬜ |",
        "| 2.3 | U22 Ladezustände | ⬜ |\n| 9.9 | Fremd-Step | 🔄 |",
      ),
      "utf8",
    );
    expect(docsValidate(dir).findings.map((f) => f.code)).toEqual(["WIP_WITHOUT_PLAN"]);

    const result = docsRepair(dir, { dryRun: false });

    expect(result.fix.applied.map((a) => a.code)).toEqual(["WIP_WITHOUT_PLAN"]);
    expect(result.verification.ok).toBe(true);
    const after = readFileSync(progressPath, "utf8");
    expect(after).toContain("### Phase 9");
    expect(after).toContain("- **9.9 Fremd-Step**");
    expect(docsValidate(dir).ok).toBe(true);
  });

  it("WIP_WITHOUT_PLAN: skips when the phase has other table rows (scope reconstruction needs a human)", () => {
    const dir = tempCopy("project-a");
    const progressPath = join(dir, "PROGRESS.md");
    // 1.1–1.3 rows exist; a new orphan 🔄 row of the SAME phase must not get a
    // skeleton — the scope for 1.1–1.3 cannot be invented (M17 would fire).
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8").replace(
        "| 2.3 | U22 Ladezustände | ⬜ |",
        "| 2.3 | U22 Ladezustände | ⬜ |\n| 1.9 | Verwaister Step | 🔄 |",
      ),
      "utf8",
    );
    expect(docsValidate(dir).findings.map((f) => f.code)).toEqual(["WIP_WITHOUT_PLAN"]);

    const result = docsRepair(dir, { dryRun: false });

    expect(result.fix.applied).toEqual([]);
    expect(result.fix.skipped).toHaveLength(1);
    expect(result.fix.skipped[0]?.code).toBe("WIP_WITHOUT_PLAN");
    expect(result.fix.skipped[0]?.reason).toMatch(/other table row/iu);
    expect(readFileSync(progressPath, "utf8")).not.toContain("### Phase 1");
    expect(docsValidate(dir).ok).toBe(false);
  });

  it("ARCHIVE_WITHOUT_INDEX: reconstructs the Done Index line from the archive block title", () => {
    const dir = tempCopy("project-a");
    const archivePath = join(dir, "docs", "archive", "BACKLOG_ARCHIVE.md");
    writeFileSync(
      archivePath,
      `${readFileSync(archivePath, "utf8").replace(/\s+$/u, "")}\n\n---\n\n### [x] Z8 — Rekonstruktions-Fall — 🟢\n- **Ort:** \`src/x.ts\`\n`,
      "utf8",
    );
    expect(docsValidate(dir).findings.map((f) => f.code)).toEqual(["ARCHIVE_WITHOUT_INDEX"]);

    const result = docsRepair(dir, { dryRun: false });

    expect(result.fix.applied.map((a) => a.code)).toEqual(["ARCHIVE_WITHOUT_INDEX"]);
    expect(result.verification.ok).toBe(true);
    const backlog = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    expect(backlog).toContain("- Z8 — Rekonstruktions-Fall — erledigt (index line reconstructed by docs_repair; commit unknown)");
    expect(docsValidate(dir).ok).toBe(true);
  });
});

describe("docsRepair — b-drift integration (H9/30.1)", () => {
  it("applies every repairable finding sequentially; non-repairable findings survive untouched", () => {
    const dir = tempCopy("project-b-drift");

    const result = docsRepair(dir, { dryRun: false });

    // b-drift's orphan 1.4 row has sibling rows (1.1–1.3) → skeleton repair is
    // refused (scope reconstruction needs a human), NOT silently applied.
    const appliedCodes = result.fix.applied.map((a) => a.code).sort();
    expect(appliedCodes).toEqual(["ARCHIVE_WITHOUT_INDEX", "NOT_ARCHIVED"]);

    const after = docsValidate(dir);
    const remaining = after.findings.map((f) => f.code);
    expect(remaining).toContain("ID_DUPLICATE");
    expect(remaining).toContain("ID_CONVENTION");
    expect(remaining).toContain("INDEX_WITHOUT_ARCHIVE");
    expect(remaining).toContain("PLAN_WITHOUT_WIP");
    expect(remaining).toContain("DATE_LEGACY");
    expect(remaining).toContain("WIP_WITHOUT_PLAN");
    expect(remaining).not.toContain("NOT_ARCHIVED");
    expect(remaining).not.toContain("ARCHIVE_WITHOUT_INDEX");
    expect(result.verification.ok).toBe(false);
    expect(result.changes.length).toBeGreaterThanOrEqual(2);
    const wipSkip = result.fix.skipped.find((s) => s.code === "WIP_WITHOUT_PLAN");
    expect(wipSkip?.reason).toMatch(/other table row/iu);
  });
});
