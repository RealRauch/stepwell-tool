import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { fileHashes } from "../src/hashes.ts";
import { docsStatus } from "../src/status.ts";

const fixtures = join(import.meta.dirname, "fixtures");

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

const HEX64 = /^[0-9a-f]{64}$/u;

describe("fileHashes (12.5, E2/3)", () => {
  it("returns sha256 per doc file with posix-style relative keys", () => {
    const hashes = fileHashes(join(fixtures, "project-a"));
    expect(Object.keys(hashes).sort()).toEqual([
      "BACKLOG.md",
      "PROGRESS.md",
      "docs/archive/BACKLOG_ARCHIVE.md",
      "docs/archive/PROGRESS_ARCHIVE.md",
    ]);
    for (const hash of Object.values(hashes)) {
      expect(hash).toMatch(HEX64);
    }
  });

  it("changes only for the file whose content changed", () => {
    const dir = mkdtempSync(join(tmpdir(), "method-docs-hashes-"));
    tempDirs.push(dir);
    cpSync(join(fixtures, "project-a"), dir, { recursive: true });
    const before = fileHashes(dir);
    const backlogPath = join(dir, "BACKLOG.md");
    writeFileSync(backlogPath, `${readFileSync(backlogPath, "utf8")}\n`, "utf8");
    const after = fileHashes(dir);
    expect(after["BACKLOG.md"]).not.toBe(before["BACKLOG.md"]);
    expect(after["PROGRESS.md"]).toBe(before["PROGRESS.md"]);
  });

  it("tolerates missing files by omitting their keys (Decision 6)", () => {
    const dir = mkdtempSync(join(tmpdir(), "method-docs-hashes-"));
    tempDirs.push(dir);
    cpSync(join(fixtures, "project-a"), dir, { recursive: true });
    rmSync(join(dir, "PROGRESS.md"));
    const hashes = fileHashes(dir);
    expect(Object.keys(hashes)).toHaveLength(3);
    expect(Object.keys(hashes)).not.toContain("PROGRESS.md");
  });

  it("docs_status carries the hashes additively", () => {
    const status = docsStatus(join(fixtures, "project-a"));
    expect(status.hashes).toEqual(fileHashes(join(fixtures, "project-a")));
  });

  it("docs_status zero state carries empty hashes (M5)", () => {
    const status = docsStatus(join(fixtures, "project-empty"));
    expect(status.hashes).toEqual({});
  });
});
