import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseBacklog } from "../src/backlog.ts";
import { parseBacklogArchive, parseProgressArchive } from "../src/archive.ts";
import { parseProgress } from "../src/progress.ts";
import { docsValidate } from "../src/validate.ts";
import { TEMPLATE_KINDS, projectTemplates } from "../src/templates.ts";

const tempDirs: string[] = [];
function scaffoldFromTemplates(): string {
  const dir = mkdtempSync(join(tmpdir(), "method-docs-templates-"));
  tempDirs.push(dir);
  writeFileSync(join(dir, "BACKLOG.md"), projectTemplates.backlog, "utf8");
  writeFileSync(join(dir, "PROGRESS.md"), projectTemplates.progress, "utf8");
  const archiveDir = join(dir, "docs", "archive");
  mkdirSync(archiveDir, { recursive: true });
  writeFileSync(join(archiveDir, "BACKLOG_ARCHIVE.md"), projectTemplates["backlog-archive"], "utf8");
  writeFileSync(join(archiveDir, "PROGRESS_ARCHIVE.md"), projectTemplates["progress-archive"], "utf8");
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("project templates (M8/9.4)", () => {
  it("covers exactly the four required files", () => {
    expect([...TEMPLATE_KINDS].sort()).toEqual([
      "backlog",
      "backlog-archive",
      "progress",
      "progress-archive",
    ]);
  });

  it("backlog skeleton parses clean: five priority sections, no items, empty done index", () => {
    const parsed = parseBacklog(projectTemplates.backlog, "BACKLOG.md");
    expect(parsed.warnings).toEqual([]);
    expect(parsed.value.sections.map((s) => s.title)).toEqual([
      "KRITISCH", "HOCH", "MITTEL", "NIEDRIG", "TEST-LÜCKEN",
    ]);
    expect(parsed.value.items).toEqual([]);
    expect(parsed.value.doneIndex).toEqual([]);
  });

  it("progress skeleton parses clean: empty table, no phase blocks", () => {
    const parsed = parseProgress(projectTemplates.progress, "PROGRESS.md");
    expect(parsed.warnings).toEqual([]);
    expect(parsed.value.rows).toEqual([]);
    expect(parsed.value.phases).toEqual([]);
  });

  it("archive skeletons parse to empty lists without warnings", () => {
    expect(parseBacklogArchive(projectTemplates["backlog-archive"], "A.md")).toEqual({
      value: [],
      warnings: [],
    });
    expect(parseProgressArchive(projectTemplates["progress-archive"], "P.md")).toEqual({
      value: [],
      warnings: [],
    });
  });

  it("a project scaffolded from the templates is docs_validate clean", () => {
    const result = docsValidate(scaffoldFromTemplates());
    expect(result.findings).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
