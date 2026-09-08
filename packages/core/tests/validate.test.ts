import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { docsValidate } from "../src/validate.ts";

const fixtures = join(import.meta.dirname, "fixtures");

const tempDirs: string[] = [];
function tempCopy(project: string): string {
  const dir = mkdtempSync(join(tmpdir(), "method-docs-validate-"));
  tempDirs.push(dir);
  cpSync(join(fixtures, project), dir, { recursive: true });
  return dir;
}
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("docsValidate — project-a (clean)", () => {
  const result = docsValidate(join(fixtures, "project-a"));

  it("reports no findings and no warnings", () => {
    expect(result.findings).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.ok).toBe(true);
  });
});

describe("docsValidate — project-b-drift (all validate rules)", () => {
  const result = docsValidate(join(fixtures, "project-b-drift"));

  it("emits exactly the expected findings (D2, D5, D8, D11–D15)", () => {
    expect(result.findings.map((f) => [f.code, f.line])).toEqual([
      ["NOT_ARCHIVED", 20],
      ["ID_DUPLICATE", 43],
      ["ID_CONVENTION", 47],
      ["INDEX_WITHOUT_ARCHIVE", undefined],
      ["INDEX_WITHOUT_ARCHIVE", undefined],
      ["ARCHIVE_WITHOUT_INDEX", 8],
      ["WIP_WITHOUT_PLAN", undefined],
      ["PLAN_WITHOUT_WIP", 24],
      ["DATE_LEGACY", 1],
    ]);
    expect(result.ok).toBe(false);
  });

  it("names the affected IDs/steps in the messages", () => {
    expect(result.findings.some((f) => f.code === "NOT_ARCHIVED" && f.message.includes("H9"))).toBe(true);
    expect(result.findings.some((f) => f.code === "ID_DUPLICATE" && f.message.includes("L10"))).toBe(true);
    expect(result.findings.some((f) => f.code === "ID_CONVENTION" && f.message.includes("fix_me"))).toBe(true);
    expect(
      result.findings.filter((f) => f.code === "INDEX_WITHOUT_ARCHIVE").every((f) =>
        f.message.includes("S9") || f.message.includes("M9"),
      ),
    ).toBe(true);
    expect(result.findings.some((f) => f.code === "ARCHIVE_WITHOUT_INDEX" && f.message.includes("Z9"))).toBe(true);
    expect(result.findings.some((f) => f.code === "WIP_WITHOUT_PLAN" && f.message.includes("1.4"))).toBe(true);
    expect(result.findings.some((f) => f.code === "DATE_LEGACY" && f.message.includes("09/2026"))).toBe(true);
  });

  it("collects the parse warnings of all four files (D1, D3, D4, D6, D7, D9, D10)", () => {
    expect(result.warnings).toHaveLength(10);
    expect(result.warnings.map((w) => w.code)).toEqual([
      "PRIO_MISSING",
      "PRIO_DUPLICATE",
      "PRIO_MISSING",
      "BLOCK_UNSTRUCTURED",
      "PRIO_MISSING",
      "PRIO_UNKNOWN",
      "PRIO_MISSING",
      "TITLE_EMPTY",
      "STATUS_UNKNOWN",
      "ROW_INCOMPLETE",
    ]);
  });

  it("never reports convention findings against the append-only archive", () => {
    const archiveFiles = result.findings.filter((f) => f.file.includes("ARCHIVE"));
    expect(archiveFiles.map((f) => f.code)).toEqual(["ARCHIVE_WITHOUT_INDEX"]);
  });
});

describe("docsValidate — project-e-tableindex (W1)", () => {
  const result = docsValidate(join(fixtures, "project-e-tableindex"));

  it("stays clean — the table done index fills doneIndex, no ARCHIVE_WITHOUT_INDEX", () => {
    expect(result.findings).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.ok).toBe(true);
  });
});

describe("docsValidate — STEP_DUPLICATE (R6)", () => {
  it("reports duplicated step numbers from the second occurrence on", () => {
    const dir = tempCopy("project-a");
    const progressPath = join(dir, "PROGRESS.md");
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8").replace(
        "| 2.3 | U22 Ladezustände | ⬜ |",
        "| 2.3 | U22 Ladezustände | ⬜ |\n| 2.1 | Strings-Modul | ⬜ |",
      ),
      "utf8",
    );

    const result = docsValidate(dir);

    expect(result.ok).toBe(false);
    expect(result.findings).toHaveLength(1);
    const finding = result.findings[0]!;
    expect(finding.code).toBe("STEP_DUPLICATE");
    expect(finding.file).toBe(progressPath);
    expect(finding.line).toBe(41);
    expect(finding.message).toContain("2.1");
  });

  it("reports each additional occurrence of a triplicated step", () => {
    const dir = tempCopy("project-a");
    const progressPath = join(dir, "PROGRESS.md");
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8").replace(
        "| 2.3 | U22 Ladezustände | ⬜ |",
        "| 2.3 | U22 Ladezustände | ⬜ |\n| 1.1 | Migrations-Skript | ✅ |\n| 1.1 | Migrations-Skript (Kopie) | ✅ |",
      ),
      "utf8",
    );

    const result = docsValidate(dir);

    expect(result.findings.filter((f) => f.code === "STEP_DUPLICATE")).toHaveLength(2);
  });
});
