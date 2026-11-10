import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DOC_FILES, projectTemplates } from "stepwell-core";
import { workstreamReport } from "../src/report.ts";

const dirs: string[] = [];

function makeDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-gitr-"));
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

describe("workstreamReport", () => {
  it("reports the trunk with no worktrees in a single-tree repo", () => {
    const root = makeDir();
    mkdirSync(join(root, "docs", "archive"), { recursive: true });
    for (const rel of DOC_FILES) writeFileSync(join(root, rel), projectTemplates.progress);
    git(root, ["init", "-b", "main"]);
    git(root, ["config", "user.email", "test@example.com"]);
    git(root, ["config", "user.name", "Test"]);
    git(root, ["add", "-A"]);
    git(root, ["commit", "-m", "init"]);

    const result = workstreamReport(root);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.trunk).toBe("main");
    expect(result.current).toBe("main");
    expect(result.worktrees).toEqual([]);
  });

  it("lists linked worktrees with branch, ahead/behind, dirty flag and last activity", () => {
    const { main, work } = makeWorkstream();
    commitFile(work, "branch.txt", "branch work\n", "branch step work");

    const result = workstreamReport(main);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.trunk).toBe("main");
    expect(result.current).toBe("main");
    expect(result.worktrees).toHaveLength(1);
    const ws = result.worktrees[0]!;
    expect(ws.branch).toBe("feature");
    expect(ws.ahead).toBe(1);
    expect(ws.behind).toBe(0);
    expect(ws.dirty).toBe(false);
    expect(ws.overlap).toEqual([]);
    expect(ws.lastSubject).toBe("branch step work");
    expect(ws.lastCommitIso).toMatch(/^\d{4}-\d{2}-\d{2}T/u);

    // dirty flag + behind count react to state
    writeFileSync(join(work, "scratch.txt"), "uncommitted\n");
    commitFile(main, "trunk.txt", "trunk work\n", "trunk work");
    const result2 = workstreamReport(main);
    expect(result2.ok).toBe(true);
    if (!result2.ok) return;
    expect(result2.worktrees[0]!.dirty).toBe(true);
    expect(result2.worktrees[0]!.behind).toBe(1);
  });

  it("flags conflict-candidate overlap when both sides touched the same file", () => {
    const { main, work } = makeWorkstream();
    commitFile(work, "PROGRESS.md", `${projectTemplates.progress}\n<!-- branch edit -->\n`, "branch edit");
    commitFile(main, "PROGRESS.md", `${projectTemplates.progress}\n<!-- trunk edit -->\n`, "trunk edit");

    const result = workstreamReport(main);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.worktrees[0]!.overlap).toContain("PROGRESS.md");
    // overlap is relative to the merge base: without shared files there is none
    const clean = makeWorkstream();
    commitFile(clean.work, "branch.txt", "branch work\n", "branch work");
    commitFile(clean.main, "trunk.txt", "trunk work\n", "trunk work");
    const result2 = workstreamReport(clean.main);
    expect(result2.ok).toBe(true);
    if (!result2.ok) return;
    expect(result2.worktrees[0]!.overlap).toEqual([]);
  });

  it("reports a detached-head worktree with an empty branch", () => {
    const { main, work } = makeWorkstream();
    git(work, ["checkout", "--detach"]);

    const result = workstreamReport(main);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.worktrees[0]!.branch).toBe("");
  });

  it("reports the current branch of the queried root", () => {
    const { work } = makeWorkstream();

    const result = workstreamReport(work);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.current).toBe("feature");
  });

  it("flags husks (stale .git pointer into this repo) and prunable registrations", () => {
    const { main, work } = makeWorkstream();
    // husk: sibling dir with a .git FILE pointing into this repo's admin dir that is gone
    const huskDir = `${main}-leftover`;
    mkdirSync(join(huskDir, ".git"), { recursive: true });
    writeFileSync(
      join(huskDir, ".git", "HEAD"),
      "",
    );
    writeFileSync(
      join(huskDir, ".git"),
      `gitdir: ${main}/.git/worktrees/does-not-exist`,
    );
    // clean sibling without any .git pointer must NOT be flagged
    const clean = `${main}-clean`;
    mkdirSync(join(clean), { recursive: true });
    writeFileSync(join(clean, "BACKLOG.md"), "unrelated project copy");

    const result = workstreamReport(main);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.husks).toContain(huskDir);
    expect(result.husks).not.toContain(clean);
    expect(result.husks).not.toContain(work);

    // prunable: registration whose worktree path vanished
    rmSync(work, { recursive: true, force: true });
    const result2 = workstreamReport(main);
    expect(result2.ok).toBe(true);
    if (!result2.ok) return;
    expect(result2.prunable).toContain(work);
    git(main, ["worktree", "prune"]);
  });

  it("reports a non-repo root", () => {
    const root = makeDir();

    const result = workstreamReport(root);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_A_GIT_REPO");
  });
});
