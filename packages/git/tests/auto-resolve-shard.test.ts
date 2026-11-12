import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
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

// M19/29.2: git subprocesses under Windows AV/indexer load need more headroom than the 5 s default
vi.setConfig({ testTimeout: 30000 });

const TEMPLATE_BY_FILE: Record<string, keyof typeof projectTemplates> = {
  "BACKLOG.md": "backlog",
  "PROGRESS.md": "progress",
  "docs/archive/BACKLOG_ARCHIVE.md": "backlog-archive",
  "docs/archive/PROGRESS_ARCHIVE.md": "progress-archive",
};

const dirs: string[] = [];

function git(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function makeDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-gits-"));
  dirs.push(dir);
  return dir;
}

/** Main repo with two open items + two diverged workstream worktrees, each with Phase 1 running. */
function makeShardCollision(): { main: string; a: string; b: string } {
  const main = makeDir();
  mkdirSync(join(main, "docs", "archive"), { recursive: true });
  for (const rel of REQUIRED_FILES) {
    writeFileSync(join(main, rel), projectTemplates[TEMPLATE_BY_FILE[rel.replace(/\\/gu, "/")]!]);
  }
  // seed Phase 1 as RUNNING (row 1.1 🔄 + detail block) — identical in every worktree,
  // so all worktree writes to BACKLOG_ARCHIVE.p1.md share the shard file name
  writeFileSync(
    join(main, "PROGRESS.md"),
    projectTemplates.progress
      .replace(
        "| # | Step | Status |\n|---|------|--------|\n",
        "| # | Step | Status |\n|---|------|--------|\n| 1.1 | work | 🔄 |\n",
      )
      .replace(
        "## Active Phases\n\n---",
        "## Active Phases\n\n### Phase 1 — Shard work\n\n**Scope (Steps):**\n\n- **1.1 work**\n\n---",
      ),
    "utf8",
  );
  git(main, ["init", "-b", "main"]);
  git(main, ["config", "user.email", "test@example.com"]);
  git(main, ["config", "user.name", "Test"]);
  git(main, ["config", "core.autocrlf", "false"]);
  applyBacklogAddPlan(planBacklogAdd(main, { section: "HIGH", title: "Item one", priority: "🟠", dryRun: false }));
  applyBacklogAddPlan(planBacklogAdd(main, { section: "HIGH", title: "Item two", priority: "🟠", dryRun: false }));
  git(main, ["add", "-A"]);
  git(main, ["commit", "-m", "init: two items, phase 1 running"]);
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
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

describe("pull auto-resolution for shard appends (H7 × M25/32.4)", () => {
  it("resolves a BOTH-ADDED shard collision mechanically, ordered by completion stamps", () => {
    const { a, b } = makeShardCollision();
    archiveIn(a, "H1", "2026-11-11T01:00"); // → BACKLOG_ARCHIVE.p1.md (worktree A)
    expect(pullTrunk(b).ok).toBe(true); // b pulls trunk first (ritual, nothing to pull)
    archiveIn(b, "H2", "2026-11-11T02:00"); // → its own BACKLOG_ARCHIVE.p1.md (worktree B)
    // meanwhile A pushed its shard to the trunk
    expect(pullTrunk(a).ok).toBe(true);
    expect(pushTrunk(a).ok).toBe(true);
    // B's pull now collides on BACKLOG_ARCHIVE.p1.md (both added, no merge base)
    const result = pullTrunk(b);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolved).toContain("docs/archive/BACKLOG_ARCHIVE.p1.md");
    expect(result.validation.ok).toBe(true);
    const shard = readFileSync(join(b, "docs", "archive", "BACKLOG_ARCHIVE.p1.md"), "utf8");
    expect(shard.indexOf("### [x] H1")).toBeLessThan(shard.indexOf("### [x] H2")); // 01:00 before 02:00
    expect(shard.match(/## ✅ (?:Erledigt-Index|Done Index)/gu)).toHaveLength(1); // one coupled section, both lines
    expect(shard.indexOf("- H1 —")).toBeLessThan(shard.indexOf("- H2 —"));
    expect(pushTrunk(b).ok).toBe(true); // the loop completes: B pushes after pull
  });
});
