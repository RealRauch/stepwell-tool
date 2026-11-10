import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { projectTemplates, REQUIRED_FILES } from "stepwell-core";
import { pullTrunk } from "../src/sync.ts";
import { pushTrunk } from "../src/push.ts";

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

function commitFile(root: string, rel: string, content: string, message: string): void {
  const abs = join(root, rel);
  mkdirSync(join(abs, ".."), { recursive: true });
  writeFileSync(abs, content);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-m", message]);
}

/** Main worktree (trunk = `main`) + linked workstream worktree on `feature`. */
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

// --- push (branch → trunk) -------------------------------------------------

describe("pushTrunk", () => {
  it("fast-forwards trunk to the branch head and validates the merged docs", () => {
    const { main, work } = makeWorkstream();
    commitFile(work, "branch.txt", "branch work\n", "branch work");
    const workHead = git(work, ["rev-parse", "HEAD"]).trim();

    const result = pushTrunk(work);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.branch).toBe("feature");
    expect(result.trunk).toBe("main");
    expect(result.validation.ok).toBe(true);
    expect(git(main, ["rev-parse", "HEAD"]).trim()).toBe(workHead);
  });

  it("refuses a stale branch and the re-pull loop completes the push", () => {
    const { main, work } = makeWorkstream();
    // the workstream does step work, pulls trunk, then trunk moves again
    commitFile(work, "branch.txt", "branch work\n", "branch work");
    expect(pullTrunk(work).ok).toBe(true);
    commitFile(main, "trunk-late.txt", "late trunk work\n", "late trunk work");

    const stale = pushTrunk(work);

    expect(stale.ok).toBe(false);
    if (stale.ok) return;
    expect(stale.error.code).toBe("STALE_BRANCH");
    expect(stale.error.message).toContain("re-pull");
    const mainHeadBefore = git(main, ["rev-parse", "HEAD"]).trim();

    // ritual: pull → verify → push
    const pulled = pullTrunk(work);
    expect(pulled.ok).toBe(true);
    const pushed = pushTrunk(work);
    expect(pushed.ok).toBe(true);
    expect(git(main, ["rev-parse", "HEAD"]).trim()).not.toBe(mainHeadBefore);
  });

  it("refuses when the trunk worktree is dirty", () => {
    const { main, work } = makeWorkstream();
    commitFile(work, "branch.txt", "branch work\n", "branch work");
    writeFileSync(join(main, "scratch.txt"), "uncommitted\n");

    const result = pushTrunk(work);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("TRUNK_DIRTY");
    expect(result.error.files).toContain("scratch.txt");
  });

  it("refuses on a dirty workstream tree before touching anything", () => {
    const { work } = makeWorkstream();
    writeFileSync(join(work, "scratch.txt"), "uncommitted\n");

    const result = pushTrunk(work);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("DIRTY_TREE");
    expect(result.error.files).toContain("scratch.txt");
  });

  it("refuses when run inside the main (trunk) worktree", () => {
    const { main } = makeWorkstream();

    const result = pushTrunk(main);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ON_TRUNK_BRANCH");
  });

  it("reports a detached head", () => {
    const { work } = makeWorkstream();
    git(work, ["checkout", "--detach"]);

    const result = pushTrunk(work);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("DETACHED_HEAD");
  });

  it("reports a non-repo root", () => {
    const root = makeDir();

    const result = pushTrunk(root);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_A_GIT_REPO");
  });
});
