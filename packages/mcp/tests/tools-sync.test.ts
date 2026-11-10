import { describe, expect, it } from "vitest";
import { callTool, connect, git, payload, tempGitProject } from "./helper.ts";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { DOC_FILES, projectTemplates } from "stepwell-core";

function gitc(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}

/** Workstream fixture: main worktree (trunk) + linked worktree on `feature`. */
function makeWorktreePair(): { main: string; work: string } {
  const main = mkdtempSync(join(tmpdir(), "stepwell-ws-"));
  mkdirSync(join(main, "docs", "archive"), { recursive: true });
  for (const rel of DOC_FILES) writeFileSync(join(main, rel), projectTemplates.progress);
  gitc(main, ["init", "-b", "main"]);
  gitc(main, ["config", "user.email", "test@example.com"]);
  gitc(main, ["config", "user.name", "Test"]);
  gitc(main, ["add", "-A"]);
  gitc(main, ["commit", "-m", "init"]);
  const work = `${main}-workstream`;
  gitc(main, ["worktree", "add", "-b", "feature", work]);
  return { main, work };
}

describe("tool workstream_sync (H5/26.5)", () => {
  it("status returns the read-only workstream report", async () => {
    const { main, work } = makeWorktreePair();
    const c = await connect();
    try {
      const result = await callTool(c, "workstream_sync", { root: work, direction: "status" });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.ok).toBe(true);
      expect(data.trunk).toBe("main");
      expect(data.current).toBe("feature");
      expect(data.worktrees).toHaveLength(1);
      expect(data.worktrees[0].branch).toBe("feature");
    } finally {
      await c.close();
      rmSync(main, { recursive: true, force: true });
    }
  });

  it("pull dry-run previews and leaves the tree untouched", async () => {
    const { main, work } = makeWorktreePair();
    gitc(main, ["commit", "--allow-empty", "-m", "later trunk"]);
    const headBefore = git(work, ["rev-parse", "HEAD"]).trim();
    const c = await connect();
    try {
      const result = await callTool(c, "workstream_sync", { root: work, direction: "pull" });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.ok).toBe(true);
      expect(data.dryRun).toBe(true);
      expect(data.direction).toBe("pull");
      expect(data.behind).toBe(1);
      expect(git(work, ["rev-parse", "HEAD"]).trim()).toBe(headBefore);
    } finally {
      await c.close();
      rmSync(main, { recursive: true, force: true });
    }
  });

  it("pull dryRun:false fast-forwards the branch", async () => {
    const { main, work } = makeWorktreePair();
    const trunkHead = git(main, ["rev-parse", "HEAD"]).trim();
    const c = await connect();
    try {
      const result = await callTool(c, "workstream_sync", { root: work, direction: "pull", dryRun: false });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.ok).toBe(true);
      expect(data.fastForward).toBe(true);
      expect(git(work, ["rev-parse", "HEAD"]).trim()).toBe(trunkHead);
    } finally {
      await c.close();
      rmSync(main, { recursive: true, force: true });
    }
  });

  it("push dryRun:false moves the trunk (precondition holds)", async () => {
    const { main, work } = makeWorkstreamPairWithCommit();
    const workHead = git(work, ["rev-parse", "HEAD"]).trim();
    const c = await connect();
    try {
      const result = await callTool(c, "workstream_sync", { root: work, direction: "push", dryRun: false });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.ok).toBe(true);
      expect(git(main, ["rev-parse", "HEAD"]).trim()).toBe(workHead);
    } finally {
      await c.close();
      rmSync(main, { recursive: true, force: true });
    }
  });

  it("push dry-run on a stale branch reports STALE_BRANCH without mutating", async () => {
    const { main, work } = makeWorktreePair();
    gitc(main, ["commit", "--allow-empty", "-m", "late trunk"]);
    writeFileSync(join(work, "branch.txt"), "branch work\n");
    gitc(work, ["add", "-A"]);
    gitc(work, ["commit", "-m", "branch work"]);
    const c = await connect();
    try {
      const result = await callTool(c, "workstream_sync", { root: work, direction: "push" });
      const data = payload(result);
      expect(data.ok).toBe(false);
      expect(data.error.code).toBe("STALE_BRANCH");
      expect(data.error.message).toContain("re-pull");
    } finally {
      await c.close();
      rmSync(main, { recursive: true, force: true });
    }
  });

  it("unknown direction is a tool error", async () => {
    const { main, work } = makeWorktreePair();
    const c = await connect();
    try {
      const result = await callTool(c, "workstream_sync", { root: work, direction: "rebase" });
      expect(result.isError).toBe(true);
    } finally {
      await c.close();
      rmSync(main, { recursive: true, force: true });
    }
  });
});

function makeWorkstreamPairWithCommit(): { main: string; work: string } {
  const pair = makeWorktreePair();
  writeFileSync(join(pair.work, "branch.txt"), "branch work\n");
  gitc(pair.work, ["add", "-A"]);
  gitc(pair.work, ["commit", "-m", "branch work"]);
  return pair;
}
