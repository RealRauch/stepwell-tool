import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyArchivePlan,
  planArchiveItem,
  applyProgressPlan,
  planProgressUpdate,
  planPhase,
} from "../src/mutations.ts";
import { docsValidate } from "../src/validate.ts";

const fixtures = join(import.meta.dirname, "fixtures");

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

function tempProject(fixture = "project-a"): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-shardrot-"));
  tempDirs.push(dir);
  cpSync(join(fixtures, fixture), dir, { recursive: true });
  return dir;
}

function flip(root: string, phase: string, step: string, status: "🔄" | "✅" | "⬜" | "⛔"): void {
  applyProgressPlan(planProgressUpdate(root, phase, step, status, { dryRun: false }));
}

describe("shard rotation (H12/32.2)", () => {
  it("archive_item during a running phase creates BACKLOG_ARCHIVE.p<n>.md with header", () => {
    const root = tempProject();
    // project-a ships with step 2.1 🔄 (Phase 2 running)
    applyArchivePlan(planArchiveItem(root, "H1", { dryRun: false }));
    const shardPath = join(root, "docs", "archive", "BACKLOG_ARCHIVE.p2.md");
    expect(existsSync(shardPath)).toBe(true);
    const shard = readFileSync(shardPath, "utf8");
    expect(shard).toContain("# BACKLOG_ARCHIVE.p2.md");
    expect(shard).toContain("Phase 2");
    expect(shard).toContain("### [x] H1 — Upload-Endpunkt ohne Größenlimit — 🟠");
    // canonical file untouched
    const canonical = readFileSync(join(root, "docs", "archive", "BACKLOG_ARCHIVE.md"), "utf8");
    expect(canonical).not.toContain("H1");
  });

  it("archive_item without a running phase stays on the canonical file", () => {
    const root = tempProject();
    flip(root, "Phase 2", "2.1", "✅"); // careful: completes the phase (see below tests) —
    // after completion NO row is 🔄 anymore → next archive goes canonical (0.1-Baseline)
    applyArchivePlan(planArchiveItem(root, "L3", { dryRun: false }));
    expect(existsSync(join(root, "docs", "archive", "BACKLOG_ARCHIVE.p2.md"))).toBe(false);
    const canonical = readFileSync(join(root, "docs", "archive", "BACKLOG_ARCHIVE.md"), "utf8");
    expect(canonical).toContain("### [x] L3");
  });

  it("archive_item appends to an existing shard without duplicating the header", () => {
    const root = tempProject();
    applyArchivePlan(planArchiveItem(root, "H1", { dryRun: false }));
    applyArchivePlan(planArchiveItem(root, "H2", { dryRun: false }));
    const shard = readFileSync(join(root, "docs", "archive", "BACKLOG_ARCHIVE.p2.md"), "utf8");
    expect(shard.match(/# BACKLOG_ARCHIVE\.p2\.md/g)).toHaveLength(1);
    expect(shard).toContain("### [x] H1");
    expect(shard).toContain("### [x] H2");
    expect(shard.indexOf("H1")).toBeLessThan(shard.indexOf("H2"));
  });

  it("phase completion appends the block to PROGRESS_ARCHIVE.p<n>.md with header", () => {
    const root = tempProject();
    flip(root, "Phase 2", "2.3", "✅");
    flip(root, "Phase 2", "2.2", "✅");
    flip(root, "Phase 2", "2.1", "✅"); // last open/running step → completes Phase 2
    const shardPath = join(root, "docs", "archive", "PROGRESS_ARCHIVE.p2.md");
    expect(existsSync(shardPath)).toBe(true);
    const shard = readFileSync(shardPath, "utf8");
    expect(shard).toContain("# PROGRESS_ARCHIVE.p2.md");
    expect(shard).toContain("### Phase 2 — UI-Polish");
    const canonical = readFileSync(join(root, "docs", "archive", "PROGRESS_ARCHIVE.md"), "utf8");
    expect(canonical).not.toContain("Phase 2 — UI-Polish");
  });

  it("step numbers of shard-archived phases stay guarded (no reuse)", () => {
    const root = tempProject();
    flip(root, "Phase 2", "2.3", "✅");
    flip(root, "Phase 2", "2.2", "✅");
    flip(root, "Phase 2", "2.1", "✅");
    // simulate hand-edit drift: table rows gone, archived block in the shard remains —
    // the table guard cannot fire; the archive guard must (read across shards, H11)
    const progressPath = join(root, "PROGRESS.md");
    const pruned = readFileSync(progressPath, "utf8")
      .split(/\r?\n/)
      .filter((l) => !/^\|\s*2\.[0-3]\s*\|/u.test(l))
      .join("\n");
    writeFileSync(progressPath, pruned, "utf8");
    expect(() =>
      planPhase(root, "Phase 2", [{ step: "2.1", name: "again" }], { dryRun: false }),
    ).toThrow(/PROGRESS_ARCHIVE/);
  });

  it("docs_validate stays clean after shard rotation", () => {
    const root = tempProject();
    applyArchivePlan(planArchiveItem(root, "H1", { dryRun: false }));
    flip(root, "Phase 2", "2.3", "✅");
    flip(root, "Phase 2", "2.2", "✅");
    flip(root, "Phase 2", "2.1", "✅");
    const report = docsValidate(root);
    expect(report.ok).toBe(true);
    expect(report.findings).toEqual([]);
  });
});
