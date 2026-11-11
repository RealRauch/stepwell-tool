import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { docsValidate } from "../src/validate.ts";

const fixtures = join(import.meta.dirname, "fixtures");

const tempDirs: string[] = [];
function tempCopy(project: string): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-validate-"));
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

  it("collects the parse warnings of the open files only — archive warnings suppressed (W2)", () => {
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
    expect(result.warnings.every((w) => !w.file.includes("ARCHIVE"))).toBe(true);
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

describe("docsValidate — project-empty (M5)", () => {
  const result = docsValidate(join(fixtures, "project-empty"));

  it("returns exactly one PROJECT_NOT_INITIALIZED finding with guidance", () => {
    expect(result.findings).toHaveLength(1);
    const finding = result.findings[0]!;
    expect(finding.code).toBe("PROJECT_NOT_INITIALIZED");
    expect(finding.file).toBe(join(fixtures, "project-empty"));
    expect(finding.line).toBeUndefined();
    expect(finding.message).toContain("BACKLOG.md");
    expect(finding.message).toContain("PROGRESS_ARCHIVE.md");
    // M13: neutral, non-prescriptive guidance (QUICKSTART/templates, no command)
    expect(finding.message).toContain("No action required");
    expect(finding.message).not.toMatch(/Lege /u);
    expect(result.warnings).toEqual([]);
    expect(result.ok).toBe(false);
  });

  it("keeps the per-file hard error for partial inventory (Teilbestand)", () => {
    const dir = tempCopy("project-a");
    rmSync(join(dir, "PROGRESS.md"));
    expect(() => docsValidate(dir)).toThrow(/missing required file\(s\)/);
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

describe("docsValidate — DATE_LEGACY (Q3: ISO 8601 canonical, both legacy forms)", () => {
  it("flags a legacy YYMMDD/HHMM timestamp in an open file", () => {
    const dir = tempCopy("project-a");
    const backlogPath = join(dir, "BACKLOG.md");
    writeFileSync(
      backlogPath,
      readFileSync(backlogPath, "utf8").replace(/Stand: [0-9T:-]+/u, "Stand: 260907/1200"),
      "utf8",
    );

    const result = docsValidate(dir);

    expect(result.ok).toBe(false);
    const finding = result.findings.find((f) => f.code === "DATE_LEGACY");
    expect(finding?.message).toContain("260907/1200");
    expect(finding?.line).toBe(1);
  });

  it("accepts the canonical ISO 8601 timestamp without a finding", () => {
    const dir = tempCopy("project-a");
    const result = docsValidate(dir);
    expect(result.findings.some((f) => f.code === "DATE_LEGACY")).toBe(false);
  });

  it("never flags legacy timestamps in the append-only archive", () => {
    const dir = tempCopy("project-a");
    const archivePath = join(dir, "docs", "archive", "PROGRESS_ARCHIVE.md");
    writeFileSync(
      archivePath,
      readFileSync(archivePath, "utf8").replace(
        "*(abgeschlossen 07/2026)*",
        "*(abgeschlossen 260907/1523)*",
      ),
      "utf8",
    );

    const result = docsValidate(dir);

    expect(result.findings.some((f) => f.code === "DATE_LEGACY")).toBe(false);
  });
});

describe("docsValidate — inline accepted marker (L13)", () => {
  const result = docsValidate(join(fixtures, "project-i-acknowledged"));

  it("moves a marked finding to `acknowledged` and keeps the report green", () => {
    expect(result.findings).toEqual([]);
    expect(result.acknowledged.map((f) => f.code)).toEqual(["ID_CONVENTION"]);
    expect(result.acknowledged[0]!.message).toContain("R1-A");
    expect(result.ok).toBe(true);
  });

  it("keeps the same finding blocking without the marker", () => {
    const dir = tempCopy("project-i-acknowledged");
    const backlogPath = join(dir, "BACKLOG.md");
    writeFileSync(
      backlogPath,
      readFileSync(backlogPath, "utf8").replace(" *(accepted: ID_CONVENTION)*", ""),
      "utf8",
    );

    const stripped = docsValidate(dir);

    expect(stripped.acknowledged).toEqual([]);
    expect(stripped.ok).toBe(false);
    expect(stripped.findings.map((f) => f.code)).toEqual(["ID_CONVENTION"]);
  });

  it("acknowledges only the codes named in the marker", () => {
    const dir = tempCopy("project-i-acknowledged");
    const backlogPath = join(dir, "BACKLOG.md");
    writeFileSync(
      backlogPath,
      readFileSync(backlogPath, "utf8").replace("accepted: ID_CONVENTION", "accepted: DATE_LEGACY"),
      "utf8",
    );

    const other = docsValidate(dir);

    expect(other.acknowledged).toEqual([]);
    expect(other.findings.map((f) => f.code)).toEqual(["ID_CONVENTION"]);
  });
});

describe("docsValidate — SCOPE_ROW_MISSING (M17/27.5)", () => {
  it("reports a table row whose step is missing from the phase's detail-block scope", () => {
    const dir = tempCopy("project-a");
    const progressPath = join(dir, "PROGRESS.md");
    // incident shape (11/2026): the block scope lost its 2.3 bullet while the row stayed
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8").replace(
        "- **2.3 U22 Ladezustände",
        "- **2.3 REMOVED-BY-INCIDENT",
      ).replace(
        "- **2.3 REMOVED-BY-INCIDENT",
        "",
      ),
      "utf8",
    );

    const result = docsValidate(dir);
    const finding = result.findings.find((f) => f.code === "SCOPE_ROW_MISSING");
    expect(finding).toBeDefined();
    expect(finding?.message).toContain("2.3");
  });

  it("does not flag rows of phases without any detail block (adoption/legacy exemption)", () => {
    const dir = tempCopy("project-a");
    const progressPath = join(dir, "PROGRESS.md");
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8").replace(
        "## Progress",
        "## Progress",
      ).replace(
        "| 0.1 | Projekt einrichten | ✅ |",
        "| 9.9 | Legacy ohne Block | ✅ |\n| 0.1 | Projekt einrichten | ✅ |",
      ),
      "utf8",
    );

    const result = docsValidate(dir);
    expect(result.findings.filter((f) => f.code === "SCOPE_ROW_MISSING")).toEqual([]);
  });

  it("stays silent when every row of a block-bearing phase has its scope bullet", () => {
    const dir = tempCopy("project-a");
    const result = docsValidate(dir);
    expect(result.findings.filter((f) => f.code === "SCOPE_ROW_MISSING")).toEqual([]);
  });
});
