import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { projectTemplates, REQUIRED_FILES } from "stepwell-core";
import { pullTrunk } from "../src/sync.ts";

// --- helpers -------------------------------------------------------------

const TEMPLATE_BY_FILE: Record<string, Parameters<typeof projectTemplates>[0]> = {
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

function makeStepwellRepo(): string {
  const root = makeDir();
  for (const rel of REQUIRED_FILES) {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, projectTemplates(TEMPLATE_BY_FILE[rel]!));
  }
  git(root, ["init", "-b", "main"]);
  git(root, ["config", "user.email", "test@example.com"]);
  git(root, ["config", "user.name", "Test"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-m", "init stepwell docs"]);
  return root;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

// --- pull (trunk → branch) ------------------------------------------------

describe("pullTrunk", () => {
  it("fast-forwards when only trunk moved", () => {
    const root = makeStepwellRepo();
    git(root, ["checkout", "-b", "feature"]);
    git(root, ["checkout", "main"]);
    writeFileSync(join(root, "trunk-only.txt"), "trunk work\n");
    git(root, ["add", "-A"]);
    git(root, ["commit", "-m", "trunk work"]);
    git(root, ["checkout", "feature"]);

    const result = pullTrunk(root);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.branch).toBe("feature");
    expect(result.trunk).toBe("main");
    expect(result.fastForward).toBe(true);
    expect(result.validation.ok).toBe(true);
  });

  it("creates a merge commit when both sides moved", () => {
    const root = makeStepwellRepo();
    git(root, ["checkout", "-b", "feature"]);
    writeFileSync(join(root, "branch-only.txt"), "branch work\n");
    git(root, ["add", "-A"]);
    git(root, ["commit", "-m", "branch work"]);
    git(root, ["checkout", "main"]);
    writeFileSync(join(root, "trunk-only.txt"), "trunk work\n");
    git(root, ["add", "-A"]);
    git(root, ["commit", "-m", "trunk work"]);
    git(root, ["checkout", "feature"]);

    const result = pullTrunk(root);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fastForward).toBe(false);
    expect(result.mergedFiles).toBeGreaterThan(0);
    // after the merge, trunk head is an ancestor of the branch
    const mergeBase = git(root, ["merge-base", "main", "HEAD"]).trim();
    const trunkHead = git(root, ["rev-parse", "main"]).trim();
    expect(mergeBase).toBe(trunkHead);
  });

  it("is a no-op when already up to date", () => {
    const root = makeStepwellRepo();
    git(root, ["checkout", "-b", "feature"]);
    const first = pullTrunk(root);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.mergedFiles).toBe(0);

    const second = pullTrunk(root);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.fastForward).toBe(false);
    expect(second.mergedFiles).toBe(0);
  });

  it("refuses on a dirty tree and merges nothing", () => {
    const root = makeStepwellRepo();
    git(root, ["checkout", "-b", "feature"]);
    git(root, ["checkout", "main"]);
    writeFileSync(join(root, "trunk-only.txt"), "trunk work\n");
    git(root, ["add", "-A"]);
    git(root, ["commit", "-m", "trunk work"]);
    git(root, ["checkout", "feature"]);
    const headBefore = git(root, ["rev-parse", "HEAD"]).trim();
    writeFileSync(join(root, "scratch.txt"), "uncommitted\n");

    const result = pullTrunk(root);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("DIRTY_TREE");
    expect(result.error.files).toContain("scratch.txt");
    expect(git(root, ["rev-parse", "HEAD"]).trim()).toBe(headBefore);
  });

  it("aborts cleanly on a merge conflict and reports both sides", () => {
    const root = makeStepwellRepo();
    git(root, ["checkout", "-b", "feature"]);
    writeFileSync(
      join(root, "PROGRESS.md"),
      projectTemplates("progress").replace("## Active Phases", "## Active Phases\n<!-- branch edit -->"),
    );
    git(root, ["add", "-A"]);
    git(root, ["commit", "-m", "branch edit"]);
    git(root, ["checkout", "main"]);
    writeFileSync(
      join(root, "PROGRESS.md"),
      projectTemplates("progress").replace("## Active Phases", "## Active Phases\n<!-- trunk edit -->"),
    );
    git(root, ["add", "-A"]);
    git(root, ["commit", "-m", "trunk edit"]);
    git(root, ["checkout", "feature"]);
    const headBefore = git(root, ["rev-parse", "HEAD"]).trim();

    const result = pullTrunk(root);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("MERGE_CONFLICT");
    expect(result.error.files).toContain("PROGRESS.md");
    // clean abort: tree back to the pre-merge state
    expect(git(root, ["rev-parse", "HEAD"]).trim()).toBe(headBefore);
    expect(git(root, ["status", "--porcelain"])).toBe("");
  });

  it("reports a detached head", () => {
    const root = makeStepwellRepo();
    git(root, ["checkout", "--detach"]);

    const result = pullTrunk(root);

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
