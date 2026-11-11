import {describe, expect, it, vi } from "vitest";
import { callTool, connect, git, payload, tempGitProject } from "./helper.ts";

// M19/29.2: git subprocesses under Windows AV/indexer load need more headroom than the 5 s default
vi.setConfig({ testTimeout: 20000 });

describe("tool commit automation (H5/26.3)", () => {
  it("archive_item apply + commit:true commits exactly the four docs", async () => {
    const dir = tempGitProject("project-a");
    const c = await connect();
    try {
      const result = await callTool(c, "archive_item", { root: dir, id: "H1", dryRun: false, commit: true });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.commit.ok).toBe(true);
      expect(data.commit.committed).toBe(true);
      expect(data.commit.sha).toBeDefined();
      const subject = git(dir, ["log", "-1", "--format=%s"]).trim();
      expect(subject).toBe("docs(backlog): archive H1");
      const files = git(dir, ["show", "--name-only", "--format=", "HEAD"]).trim().split(/\r?\n/u).sort();
      for (const file of files) expect(file.replace(/\\/gu, "/")).toMatch(/BACKLOG(_ARCHIVE)?\.md|PROGRESS(_ARCHIVE)?\.md/u);
      expect(git(dir, ["status", "--porcelain"])).toBe("");
    } finally {
      await c.close();
    }
  });

  it("progress_update apply + commit:true commits once with a generated subject", async () => {
    const dir = tempGitProject("project-a");
    const c = await connect();
    try {
      const result = await callTool(c, "progress_update", {
        root: dir,
        phase: "Phase 2",
        step: "2.2",
        status: "🔄",
        dryRun: false,
        commit: true,
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.commit.ok).toBe(true);
      expect(git(dir, ["log", "-1", "--format=%s"]).trim()).toBe("docs(progress): step 2.2 🔄");
      expect(git(dir, ["status", "--porcelain"])).toBe("");
    } finally {
      await c.close();
    }
  });

  it("commitMessage overrides the generated subject", async () => {
    const dir = tempGitProject("project-a");
    const c = await connect();
    try {
      const result = await callTool(c, "archive_item", {
        root: dir,
        id: "H1",
        dryRun: false,
        commit: true,
        commitMessage: "custom subject",
      });
      expect(result.isError).toBeFalsy();
      expect(git(dir, ["log", "-1", "--format=%s"]).trim()).toBe("custom subject");
    } finally {
      await c.close();
    }
  });

  it("reports a failed commit in the payload while the edits stay applied", async () => {
    const dir = tempGitProject("project-a");
    // pre-stage a foreign file so commitDocs refuses (COMMIT_BLOCKED)
    const { writeFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    writeFileSync(join(dir, "staged.txt"), "foreign\n");
    git(dir, ["add", "staged.txt"]);

    const c = await connect();
    try {
      const result = await callTool(c, "archive_item", { root: dir, id: "H1", dryRun: false, commit: true });
      // apply (the tool's primary job) succeeded; the commit failure is a structured payload section
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.commit.ok).toBe(false);
      expect(data.commit.error.code).toBe("COMMIT_BLOCKED");
      // edits stay on disk (never a rollback): the archive move happened
      const { readFileSync } = await import("node:fs");
      const archive = readFileSync(join(dir, "docs", "archive", "BACKLOG_ARCHIVE.md"), "utf8");
      expect(archive).toContain("### [x] H1 —");
      const backlog = readFileSync(join(dir, "BACKLOG.md"), "utf8");
      expect(backlog).toContain("- H1 —");
      // staged state untouched
      expect(git(dir, ["diff", "--cached", "--name-only"])).toContain("staged.txt");
    } finally {
      await c.close();
    }
  });

  it("dry-run ignores the commit parameter", async () => {
    const dir = tempGitProject("project-a");
    const c = await connect();
    try {
      const result = await callTool(c, "archive_item", { root: dir, id: "H1", commit: true });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.dryRun).toBe(true);
      expect(data.commit).toBeUndefined();
      expect(git(dir, ["log", "-1", "--format=%s"]).trim()).toBe("init");
    } finally {
      await c.close();
    }
  });
});
