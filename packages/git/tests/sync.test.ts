import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { projectTemplates, REQUIRED_FILES } from "stepwell-core";
import { pullTrunk } from "../src/sync.ts";

// --- helpers -------------------------------------------------------------

const TEMPLATE_BY_FILE: Record<string, keyof typeof projectTemplates> = {
  "BACKLOG.md": "backlog",
  "PROGRESS.md": "progress",
  "docs/archive/BACKLOG_ARCHIVE.md": "backlog-archive",
  "docs/archive/PROGRESS_ARCHIVE.md": "progress-archive",
};

const dirs: string[] = [];

function makeDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-git-"));
  dirs.push(dir);
  return dir;
}

function git(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}

/** Main worktree (stays on trunk = `main`) + a linked workstream worktree on `feature`. */
function makeWorkstream(): { main: string; work: string } {
  const main = makeDir();
  for (const rel of REQUIRED_FILES) {
    const abs = join(main, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, projectTemplates[TEMPLATE_BY_FILE[rel.replace(/\\/gu, "/")]!]);
  }
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

// --- pull (trunk → branch) ------------------------------------------------

describe("pullTrunk", () => {
  it("fast-forwards when only trunk moved", () => {
    const { main, work } = makeWorkstream();
    writeFileSync(join(main, "trunk-only.txt"), "trunk work\n");
    git(main, ["add", "-A"]);
    git(main, ["commit", "-m", "trunk work"]);

    const result = pullTrunk(work);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.branch).toBe("feature");
    expect(result.trunk).toBe("main");
    expect(result.fastForward).toBe(true);
    expect(result.validation.ok).toBe(true);
  });

  it("creates a merge commit when both sides moved", () => {
    const { main, work } = makeWorkstream();
    writeFileSync(join(work, "branch-only.txt"), "branch work\n");
    git(work, ["add", "-A"]);
    git(work, ["commit", "-m", "branch work"]);
    writeFileSync(join(main, "trunk-only.txt"), "trunk work\n");
    git(main, ["add", "-A"]);
    git(main, ["commit", "-m", "trunk work"]);

    const result = pullTrunk(work);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fastForward).toBe(false);
    expect(result.mergedFiles).toBeGreaterThan(0);
    // after the merge, trunk head is an ancestor of the branch
    const mergeBase = git(work, ["merge-base", "main", "HEAD"]).trim();
    const trunkHead = git(work, ["rev-parse", "main"]).trim();
    expect(mergeBase).toBe(trunkHead);
  });

  it("is a no-op when already up to date", () => {
    const { work } = makeWorkstream();
    const first = pullTrunk(work);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.mergedFiles).toBe(0);

    const second = pullTrunk(work);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.fastForward).toBe(false);
    expect(second.mergedFiles).toBe(0);
  });

  it("refuses on a dirty tree and merges nothing", () => {
    const { main, work } = makeWorkstream();
    writeFileSync(join(main, "trunk-only.txt"), "trunk work\n");
    git(main, ["add", "-A"]);
    git(main, ["commit", "-m", "trunk work"]);
    const headBefore = git(work, ["rev-parse", "HEAD"]).trim();
    writeFileSync(join(work, "scratch.txt"), "uncommitted\n");

    const result = pullTrunk(work);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("DIRTY_TREE");
    expect(result.error.files).toContain("scratch.txt");
    expect(git(work, ["rev-parse", "HEAD"]).trim()).toBe(headBefore);
  });

  it("aborts cleanly on a merge conflict and reports both sides", () => {
    const { main, work } = makeWorkstream();
    writeFileSync(
      join(work, "PROGRESS.md"),
      projectTemplates.progress.replace("## Active Phases", "## Active Phases\n<!-- branch edit -->"),
    );
    git(work, ["add", "-A"]);
    git(work, ["commit", "-m", "branch edit"]);
    writeFileSync(
      join(main, "PROGRESS.md"),
      projectTemplates.progress.replace("## Active Phases", "## Active Phases\n<!-- trunk edit -->"),
    );
    git(main, ["add", "-A"]);
    git(main, ["commit", "-m", "trunk edit"]);
    const headBefore = git(work, ["rev-parse", "HEAD"]).trim();

    const result = pullTrunk(work);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("MERGE_CONFLICT");
    expect(result.error.files).toContain("PROGRESS.md");
    expect(result.error.detail).toContain("branch:");
    expect(result.error.detail).toContain("trunk:");
    // clean abort: tree back to the pre-merge state
    expect(git(work, ["rev-parse", "HEAD"]).trim()).toBe(headBefore);
    expect(git(work, ["status", "--porcelain"])).toBe("");
  });

  it("reports a detached head", () => {
    const { work } = makeWorkstream();
    git(work, ["checkout", "--detach"]);

    const result = pullTrunk(work);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("DETACHED_HEAD");
  });

  it("reports a non-repo root", () => {
    const root = makeDir();

    const result = pullTrunk(root);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_A_GIT_REPO");
  });
});
