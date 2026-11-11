import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// L14/27.7: deterministic line endings for the four method doc files and the
// method copies (PLAYBOOK/LESSONS/QUICKSTART/README). The repo pins ALL text
// files via a single .gitattributes glob (predates this step — since the repo
// was founded); the contract under test is the effective attribute, not a
// per-file listing.

const repoRoot = join(import.meta.dirname, "..", "..", "..");

const DOC_FILES = [
  "BACKLOG.md",
  "PROGRESS.md",
  join("docs", "archive", "BACKLOG_ARCHIVE.md"),
  join("docs", "archive", "PROGRESS_ARCHIVE.md"),
  join("docs", "PLAYBOOK.md"),
  join("docs", "LESSONS.md"),
  join("docs", "QUICKSTART.md"),
  "README.md",
];

describe(".gitattributes EOL pinning (L14/27.7)", () => {
  it("pins every text file to LF via a single glob", () => {
    const content = readFileSync(join(repoRoot, ".gitattributes"), "utf8");
    expect(content.split(/\r?\n/)).toContain("* text=auto eol=lf");
  });

  it("git check-attr reports eol=lf for the doc files and method copies", () => {
    const out = execFileSync("git", ["check-attr", "eol", "--", ...DOC_FILES], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    const lines = out.split(/\r?\n/).filter((l) => l.trim() !== "");
    expect(lines).toHaveLength(DOC_FILES.length);
    for (const line of lines) {
      expect(line).toMatch(/eol:\s*lf$/u);
    }
  });
});
