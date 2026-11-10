import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DOC_FILES, projectTemplates } from "stepwell-core";
import { syncPreview } from "../src/preview.ts";

const dirs: string[] = [];

function makeDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-gitp-"));
  dirs.push(dir);
  return dir;
}

function git(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}

function commitFile(root: string, rel: string, content: string, message: string): void {
  const abs = join(root, rel);
  mkdirSync(join(abs, ".."), { recursive: true });
  writeFileSync(abs, content);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-m", message]);
}

function makeWorkstream(): { main: string; work: string } {
  const main = makeDir();
  mkdirSync(join(main, "docs", "archive"), { recursive: true });
  for (const rel of DOC_FILES) writeFileSync(join(main, rel), projectTemplates.progress);
  git(main, ["init", "-b", "main"]);
  git(main, ["config", "user.email", "test@example.com"]);
  git(main, ["config", "user.name", "Test"]);
  git(main, ["add", "-A"]);
  git(main, ["commit", "-m", "init stepwell docs"]);
  const work = `${main}-workstream`;
  dirs.push(work); // T7: register the sibling — it must not leak into %TEMP%
  git(main, ["worktree", "add", "-b", "feature", work]);
  return { main, work };
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("syncPreview", () => {
  it("pull preview lists what would merge and mutates nothing", () => {
    const { main, work } = makeWorkstream();
    commitFile(main, "incoming.txt", "trunk work\n", "trunk work");
    commitFile(main, "PROGRESS.md", `${projectTemplates.progress}\n<!-- trunk edit -->\n`, "trunk doc edit");
    const headBefore = git(work, ["rev-parse", "HEAD"]).trim();

    const result = syncPreview(work, "pull");

    expect(result.ok).toBe(true);
    if (!result.ok || result.direction !== "pull") return;
    expect(result.dryRun).toBe(true);
    expect(result.branch).toBe("feature");
    expect(result.trunk).toBe("main");
    expect(result.behind).toBe(2);
    expect(result.files).toContain("incoming.txt");
    expect(git(work, ["rev-parse", "HEAD"]).trim()).toBe(headBefore);
    expect(git(work, ["status", "--porcelain"])).toBe("");
  });

  it("push preview reports a stale branch exactly like the real op would", () => {
    const { main, work } = makeWorkstream();
    commitFile(work, "branch.txt", "branch work\n", "branch work");
    commitFile(main, "late.txt", "late trunk work\n", "late trunk work");

    const result = syncPreview(work, "push");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("STALE_BRANCH");
    const mainHead = git(main, ["rev-parse", "HEAD"]).trim();
    expect(mainHead).toBe(git(main, ["rev-parse", "main"]).trim());
  });

  it("push preview reports the target sha when the precondition holds", () => {
    const { main, work } = makeWorkstream();
    commitFile(work, "branch.txt", "branch work\n", "branch work");
    const workHead = git(work, ["rev-parse", "HEAD"]).trim();

    const result = syncPreview(work, "push");

    expect(result.ok).toBe(true);
    if (!result.ok || result.direction !== "push") return;
    expect(result.preconditionMet).toBe(true);
    expect(result.ahead).toBe(1);
    expect(result.target).toBe(workHead);
    expect(git(main, ["rev-parse", "HEAD"]).trim()).not.toBe(workHead);
  });

  it("reports a dirty tree as the real op would", () => {
    const { work } = makeWorkstream();
    writeFileSync(join(work, "scratch.txt"), "uncommitted\n");

    const result = syncPreview(work, "pull");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("DIRTY_TREE");
  });

  it("reports a non-repo root", () => {
    const result = syncPreview(makeDir(), "pull");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_A_GIT_REPO");
  });
});
