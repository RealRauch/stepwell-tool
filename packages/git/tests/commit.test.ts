import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {afterEach, describe, expect, it, vi } from "vitest";
import { DOC_FILES } from "stepwell-core";
import { commitDocs } from "../src/commit.ts";

const dirs: string[] = [];

function makeDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-gitc-"));
  dirs.push(dir);
  return dir;
}

function git(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); // M19/29.2: execFileSync leaks stderr to the console — pipe it (still surfaces in errors)
}

/** Plain repo (no worktree needed — commitDocs never touches trunk logic). */
function makeRepo(): string {
  const root = makeDir();
  mkdirSync(join(root, "docs", "archive"), { recursive: true });
  for (const rel of DOC_FILES) writeFileSync(join(root, rel), `# ${rel}\n`);
  git(root, ["init", "-b", "main"]);
  git(root, ["config", "user.email", "test@example.com"]);
  git(root, ["config", "user.name", "Test"]);
  git(root, ["config", "core.autocrlf", "false"]); // M19/29.2: deterministic test repos
  git(root, ["add", "-A"]);
  git(root, ["commit", "-m", "init"]);
  return root;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

// M19/29.2: git subprocesses under Windows AV/indexer load need more headroom than the 5 s default
vi.setConfig({ testTimeout: 20000 });

describe("commitDocs", () => {
  it("commits exactly the four doc paths and reports the sha", () => {
    const root = makeRepo();
    writeFileSync(join(root, "PROGRESS.md"), "# PROGRESS.md\nchanged\n");
    writeFileSync(join(root, "foreign.txt"), "untracked code change\n");

    const result = commitDocs(root, { message: "docs(progress): step 26.3 ✅" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.committed).toBe(true);
    expect(result.sha).toBeDefined();
    expect(result.files).toEqual(["PROGRESS.md"]);
    const committedFiles = git(root, ["show", "--name-only", "--format=", "HEAD"]).trim().split(/\r?\n/u);
    expect(committedFiles).toEqual(["PROGRESS.md"]);
    // the foreign file is untouched and still untracked
    expect(git(root, ["status", "--porcelain"])).toContain("?? foreign.txt");
  });

  it("reports nothing to commit when the docs are unchanged", () => {
    const root = makeRepo();

    const result = commitDocs(root, { message: "docs: noop" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.committed).toBe(false);
    expect(result.files).toEqual([]);
    expect(result.sha).toBeUndefined();
    expect(git(root, ["rev-list", "--count", "HEAD"]).trim()).toBe("1");
  });

  it("refuses when foreign changes are already staged", () => {
    const root = makeRepo();
    writeFileSync(join(root, "staged.txt"), "someone else staged this\n");
    git(root, ["add", "staged.txt"]);

    const result = commitDocs(root, { message: "docs: would leak" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("COMMIT_BLOCKED");
    expect(result.error.files).toContain("staged.txt");
    // the staged state is left exactly as it was
    expect(git(root, ["diff", "--cached", "--name-only"])).toContain("staged.txt");
    expect(git(root, ["rev-list", "--count", "HEAD"]).trim()).toBe("1");
  });

  it("keeps the edits applied when a hook fails the commit", () => {
    const root = makeRepo();
    const hook = join(root, ".git", "hooks", "pre-commit");
    mkdirSync(join(hook, ".."), { recursive: true });
    writeFileSync(hook, "#!/bin/sh\nexit 1\n");
    chmodSync(hook, 0o755);
    writeFileSync(join(root, "PROGRESS.md"), "# PROGRESS.md\nchanged\n");
    const headBefore = git(root, ["rev-parse", "HEAD"]).trim();

    const result = commitDocs(root, { message: "docs: hook blocks this" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("COMMIT_FAILED");
    // edits stay applied (never a rollback), HEAD unchanged
    expect(readFileSync(join(root, "PROGRESS.md"), "utf8")).toContain("changed");
    expect(git(root, ["rev-parse", "HEAD"]).trim()).toBe(headBefore);
  });

  it("lands the message verbatim as the commit subject", () => {
    const root = makeRepo();
    writeFileSync(join(root, "BACKLOG.md"), "# BACKLOG.md\nchanged\n");

    const result = commitDocs(root, { message: "docs(backlog): archive H9" });

    expect(result.ok).toBe(true);
    expect(git(root, ["log", "-1", "--format=%s"]).trim()).toBe("docs(backlog): archive H9");
  });

  it("reports a detached head", () => {
    const root = makeRepo();
    git(root, ["checkout", "--detach"]);

    const result = commitDocs(root, { message: "docs: lost commit" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("DETACHED_HEAD");
  });

  it("reports a non-repo root", () => {
    const root = makeDir();

    const result = commitDocs(root, { message: "docs: nowhere" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_A_GIT_REPO");
  });
});
