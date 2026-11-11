import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {afterEach, describe, expect, it, vi } from "vitest";
import { DOC_FILES, projectTemplates } from "stepwell-core";
import { workstreamReport } from "../src/report.ts";

const dirs: string[] = [];

function makeDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-gitr-"));
  dirs.push(dir);
  return dir;
}

function git(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); // M19/29.2: execFileSync leaks stderr to the console — pipe it (still surfaces in errors)
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
  git(main, ["config", "core.autocrlf", "false"]); // M19/29.2: deterministic test repos
  git(main, ["add", "-A"]);
  git(main, ["commit", "-m", "init stepwell docs"]);
  const work = `${main}-workstream`;
  dirs.push(work); // T7: register the sibling — it must not leak into %TEMP%
  git(main, ["worktree", "add", "-b", "feature", work]);
  return { main, work };
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

// M19/29.2: git subprocesses under Windows AV/indexer load need more headroom than the 5 s default
vi.setConfig({ testTimeout: 20000 });

describe("workstreamReport", () => {
  it("reports the trunk with no worktrees in a single-tree repo", () => {
    const root = makeDir();
    mkdirSync(join(root, "docs", "archive"), { recursive: true });
    for (const rel of DOC_FILES) writeFileSync(join(root, rel), projectTemplates.progress);
    git(root, ["init", "-b", "main"]);
    git(root, ["config", "user.email", "test@example.com"]);
    git(root, ["config", "user.name", "Test"]);
    git(root, ["config", "core.autocrlf", "false"]); // M19/29.2: deterministic test repos
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
    mkdirSync(huskDir, { recursive: true });
    writeFileSync(
      join(huskDir, ".git"),
      `gitdir: ${main}/.git/worktrees/does-not-exist`,
    );
    // clean sibling without any .git pointer must NOT be flagged
    const clean = `${main}-clean`;
    mkdirSync(join(clean), { recursive: true });
    writeFileSync(join(clean, "BACKLOG.md"), "unrelated project copy");
    dirs.push(huskDir, clean); // T7: fixture siblings registered too

    const result = workstreamReport(main);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.husks).toContain(huskDir);
    expect(result.husks).not.toContain(clean);
    expect(result.husks).not.toContain(work);

    // prunable: registration whose worktree path vanished
    rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
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

describe("workstreamReport predictedOverlap (H10/30.4)", () => {
  const backlogWith = (id: string, file: string): string =>
    [
      "# BACKLOG.md — Open items (As of: 2026-11-11T10:00",
      "",
      "## 🟠 HIGH",
      "",
      `### [ ] ${id} — Shared file worker — 🟠`,
      `- **Location:** \`${file}\``,
      "- **Problem:** overlap prognosis fixture",
      "",
      "## 🔵 TEST GAPS",
      "",
      "> No open items.",
      "",
      "## ✅ DONE INDEX",
      "",
      "> (One line per completed item, with commit hash; details in archive.)",
    ].join("\n");

  it("predicts the file both sides' open items touch, before anyone edits it", () => {
    const { main, work } = makeWorkstream();
    commitFile(work, "BACKLOG.md", backlogWith("H1", "src/shared.ts"), "branch item on shared file");
    commitFile(main, "BACKLOG.md", backlogWith("H2", "src/shared.ts"), "trunk item on the same file");

    const result = workstreamReport(work);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ws = result.worktrees.find((w) => w.branch === "feature");
    expect(ws?.predictedOverlap).toEqual([{ path: "src/shared.ts", openItems: ["H1", "H2"] }]);
  });

  it("stays silent for disjoint paths and keeps overlap[] byte-identical (empty here)", () => {
    const { main, work } = makeWorkstream();
    commitFile(work, "BACKLOG.md", backlogWith("H1", "src/branch-only.ts"), "branch item");
    commitFile(main, "BACKLOG.md", backlogWith("H2", "src/trunk-only.ts"), "trunk item");

    const result = workstreamReport(work);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ws = result.worktrees.find((w) => w.branch === "feature");
    expect(ws?.predictedOverlap).toEqual([]);
    // factual overlap: both sides committed their BACKLOG.md — the prognosis is
    // empty because the ITEMS' paths are disjoint (the two signals are orthogonal)
    expect(ws?.overlap).toEqual(["BACKLOG.md"]);
  });
});

describe("workstreamReport idCollisions (M20/30.5)", () => {
  const backlogWith = (id: string, file: string): string =>
    [
      "# BACKLOG.md — Open items (As of: 2026-11-11T10:00",
      "",
      "## 🟠 HIGH",
      "",
      `### [ ] ${id} — Collision fixture — 🟠`,
      `- **Location:** \`${file}\``,
      "- **Problem:** id collision fixture",
      "",
      "## ✅ DONE INDEX",
      "",
      "> (One line per completed item, with commit hash; details in archive.)",
    ].join("\n");

  const progressWith = (step: string): string =>
    [
      "# Project tracking: Collision fixture",
      "",
      "## Progress",
      "",
      "| # | Step | Status |",
      "|---|------|--------|",
      `| ${step} | Collision step | ⬜ |`,
    ].join("\n");

  it("detects ids and steps both sides added since the merge base", () => {
    const { main, work } = makeWorkstream();
    commitFile(work, "BACKLOG.md", backlogWith("M20", "src/branch.ts"), "branch adds M20");
    commitFile(work, "PROGRESS.md", progressWith("30.1"), "branch adds step 30.1");
    commitFile(main, "BACKLOG.md", backlogWith("M20", "src/trunk.ts"), "trunk adds M20 too");
    commitFile(main, "PROGRESS.md", progressWith("30.1"), "trunk adds 30.1 too");

    const result = workstreamReport(main);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ws = result.worktrees.find((w) => w.branch === "feature");
    expect(ws?.idCollisions).toEqual(["M20", "30.1"]);
  });

  it("stays empty for distinct additions", () => {
    const { main, work } = makeWorkstream();
    commitFile(work, "BACKLOG.md", backlogWith("M20", "src/branch.ts"), "branch adds M20");
    commitFile(main, "BACKLOG.md", backlogWith("M21", "src/trunk.ts"), "trunk adds M21");

    const result = workstreamReport(main);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ws = result.worktrees.find((w) => w.branch === "feature");
    expect(ws?.idCollisions).toEqual([]);
  });
});
