import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyArchivePlan,
  applyBacklogAddPlan,
  planArchiveItem,
  planBacklogAdd,
  projectTemplates,
  REQUIRED_FILES,
} from "stepwell-core";
import { pullTrunk } from "../src/sync.ts";
import { pushTrunk } from "../src/push.ts";

const TEMPLATE_BY_FILE: Record<string, keyof typeof projectTemplates> = {
  "BACKLOG.md": "backlog",
  "PROGRESS.md": "progress",
  "docs/archive/BACKLOG_ARCHIVE.md": "backlog-archive",
  "docs/archive/PROGRESS_ARCHIVE.md": "progress-archive",
};

const dirs: string[] = [];

function git(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}

function makeDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-gita-"));
  dirs.push(dir);
  return dir;
}

/** Main repo with two open items + two diverged workstream worktrees (A=ws-a, B=ws-b). */
function makeCollision(): { main: string; a: string; b: string } {
  const main = makeDir();
  mkdirSync(join(main, "docs", "archive"), { recursive: true });
  for (const rel of REQUIRED_FILES) {
    const abs = join(main, rel);
    writeFileSync(abs, projectTemplates[TEMPLATE_BY_FILE[rel.replace(/\\/gu, "/")]!]);
  }
  git(main, ["init", "-b", "main"]);
  git(main, ["config", "user.email", "test@example.com"]);
  git(main, ["config", "user.name", "Test"]);
  applyBacklogAddPlan(planBacklogAdd(main, { section: "HIGH", title: "Item one", priority: "🟠", dryRun: false }));
  applyBacklogAddPlan(planBacklogAdd(main, { section: "HIGH", title: "Item two", priority: "🟠", dryRun: false }));
  git(main, ["add", "-A"]);
  git(main, ["commit", "-m", "init with two items"]);
  const a = `${main}-ws-a`;
  const b = `${main}-ws-b`;
  dirs.push(a, b);
  git(main, ["worktree", "add", "-b", "ws/a", a]);
  git(main, ["worktree", "add", "-b", "ws/b", b]);
  return { main, a, b };
}

/** Archive one item in a worktree and commit it (content + docs state). */
function archiveIn(root: string, id: string, note?: string): void {
  applyArchivePlan(planArchiveItem(root, id, note === undefined ? { dryRun: false } : { dryRun: false, note }));
  git(root, ["add", "-A"]);
  git(root, ["commit", "-m", `archive ${id}`]);
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("pull auto-resolution for archive appends (H7/27.6)", () => {
  it("resolves the append collision mechanically and orders by completion timestamps", () => {
    const { main, a, b } = makeCollision();
    archiveIn(a, "H1", "2026-11-11T01:00");
    expect(pullTrunk(b).ok).toBe(true); // b pulls trunk first (ritual)
    archiveIn(b, "H2", "2026-11-11T02:00");
    // meanwhile A pushed its step to the trunk
    expect(pullTrunk(a).ok).toBe(true);
    expect(pushTrunk(a).ok).toBe(true);
    // B's pull now collides with A's archive appends — resolved mechanically
    const result = pullTrunk(b);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolved).toContain("docs/archive/BACKLOG_ARCHIVE.md");
    expect(result.validation.ok).toBe(true);
    const archive = readFileSync(join(b, "docs", "archive", "BACKLOG_ARCHIVE.md"), "utf8");
    expect(archive.indexOf("### [x] H1")).toBeLessThan(archive.indexOf("### [x] H2")); // 01:00 before 02:00
    const backlog = readFileSync(join(b, "BACKLOG.md"), "utf8");
    expect(backlog.indexOf("- H1 —")).toBeLessThan(backlog.indexOf("- H2 —"));
    expect(pushTrunk(b).ok).toBe(true); // the loop completes: B pushes after pull
  });

  it("falls back to HEAD-first order when neither side carries a timestamp", () => {
    const { main, a, b } = makeCollision();
    archiveIn(a, "H1");
    expect(pullTrunk(b).ok).toBe(true);
    archiveIn(b, "H2");
    expect(pullTrunk(a).ok).toBe(true);
    expect(pushTrunk(a).ok).toBe(true);

    const result = pullTrunk(b);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolved?.length).toBeGreaterThan(0);
    const archive = readFileSync(join(b, "docs", "archive", "BACKLOG_ARCHIVE.md"), "utf8");
    expect(archive.indexOf("### [x] H2")).toBeLessThan(archive.indexOf("### [x] H1")); // HEAD side (B's H2) first
  });

  it("still aborts cleanly on a table-row conflict (not an append)", () => {
    const { main, a, b } = makeCollision();
    // both sides edit the same PROGRESS row region — a real content conflict
    const rowEdit = (root: string, status: string): void => {
      const p = join(root, "PROGRESS.md");
      writeFileSync(p, projectTemplates.progress.replace("## Active Phases", `## Active Phases\n<!-- ${status} -->`));
      git(root, ["add", "-A"]);
      git(root, ["commit", "-m", `row edit ${status}`]);
    };
    rowEdit(a, "edit-a");
    expect(pullTrunk(b).ok).toBe(true);
    rowEdit(b, "edit-b");
    expect(pullTrunk(a).ok).toBe(true);
    expect(pushTrunk(a).ok).toBe(true);

    const result = pullTrunk(b);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("MERGE_CONFLICT");
    // clean abort
    expect(git(b, ["status", "--porcelain"])).toBe("");
  });
});
