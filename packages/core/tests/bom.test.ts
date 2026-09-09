import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseBacklog, readBacklog } from "../src/backlog.ts";
import { parseProgress, readProgress } from "../src/progress.ts";
import { docsValidate } from "../src/validate.ts";

const fixtures = join(import.meta.dirname, "fixtures");
const projectA = join(fixtures, "project-a");
const projectBom = join(fixtures, "project-f-bom");

describe("BOM tolerance (T5, 9.13)", () => {
  it("a BOM-prefixed backlog parses identically to the BOM-less variant", () => {
    const plain = readBacklog(projectA);
    const withBom = readBacklog(projectBom);
    expect(withBom).toEqual(plain);
  });

  it("a BOM-prefixed progress file parses identically to the BOM-less variant", () => {
    const plain = readProgress(projectA);
    const withBom = readProgress(projectBom);
    expect(withBom).toEqual(plain);
  });

  it("a BOM-prefixed project is docs_validate clean like its BOM-less twin", () => {
    expect(docsValidate(projectBom)).toEqual(docsValidate(projectA));
  });

  it("strips the BOM at parse level even without the fixture (inline)", () => {
    const content = "# BACKLOG.md — Offene Punkte\n\n## 🟠 HOCH\n\n> Keine offenen Items.\n";
    const withBom = parseBacklog(`\uFEFF${content}`, "inline.md");
    const plain = parseBacklog(content, "inline.md");
    expect(withBom).toEqual(plain);
    expect(withBom.warnings).toEqual([]);
  });

  it("keeps content beyond the first character untouched", () => {
    const content = "## 🟠 HOCH\n";
    expect(parseBacklog(`\uFEFF${content}`, "inline.md").value.sections).toHaveLength(1);
  });
});
