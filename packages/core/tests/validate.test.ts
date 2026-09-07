import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { docsValidate } from "../src/validate.js";

const fixtures = join(import.meta.dirname, "fixtures");

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
