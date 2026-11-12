import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadProject, backlogShow } from "../src/project.ts";
import { archiveShardPaths, docFileSet } from "../src/project-files.ts";
import { fileHashes } from "../src/hashes.ts";
import { docsValidate } from "../src/validate.ts";
import { phaseContext } from "../src/context.ts";

const fixtures = join(import.meta.dirname, "fixtures");

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

function tempShardsProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-shards-"));
  tempDirs.push(dir);
  cpSync(join(fixtures, "project-m-shards"), dir, { recursive: true });
  return dir;
}

describe("archive sharding (H11/32.1)", () => {
  it("archiveShardPaths lists shards p<n>-ascending, canonical last", () => {
    const root = join(fixtures, "project-m-shards");
    expect(archiveShardPaths(root, "backlog")).toEqual([
      join("docs", "archive", "BACKLOG_ARCHIVE.p1.md"),
      join("docs", "archive", "BACKLOG_ARCHIVE.p2.md"),
    ]);
    expect(archiveShardPaths(root, "progress")).toEqual([
      join("docs", "archive", "PROGRESS_ARCHIVE.p1.md"),
    ]);
  });

  it("archiveShardPaths sorts by phase NUMBER, not lexicographically (p2 < p10)", () => {
    const root = tempShardsProject();
    const dir = join(root, "docs", "archive");
    writeFileSync(join(dir, "BACKLOG_ARCHIVE.p10.md"), "# stub\n", "utf8");
    expect(archiveShardPaths(root, "backlog")).toEqual([
      join("docs", "archive", "BACKLOG_ARCHIVE.p1.md"),
      join("docs", "archive", "BACKLOG_ARCHIVE.p2.md"),
      join("docs", "archive", "BACKLOG_ARCHIVE.p10.md"),
    ]);
  });

  it("loadProject concatenates backlog archive: shards first, canonical last", () => {
    const docs = loadProject(join(fixtures, "project-m-shards"));
    const ids = docs.backlogArchive().value.map((item) => item.id);
    expect(ids).toEqual(["S2", "M7", "S1"]);
  });

  it("loadProject concatenates progress archive shards before canonical phases", () => {
    const docs = loadProject(join(fixtures, "project-m-shards"));
    const names = docs.progressArchive().value.map((block) => block.name);
    expect(names).toEqual(["Phase 1", "Phase 0"]);
  });

  it("parse warnings from shards carry the shard file attribution", () => {
    const root = tempShardsProject();
    // PRIO_MISSING is a parse-level warning (fires in archives too): strip the
    // priority emoji from the M7 title inside the p2 shard
    const shard = join(root, "docs", "archive", "BACKLOG_ARCHIVE.p2.md");
    const text = readFileSync(shard, "utf8");
    writeFileSync(
      shard,
      text.replace(
        "### [x] M7 — Duplizierte Geo-Logik auf Shared-Helper umgestellt — 🟡",
        "### [x] M7 — Duplizierte Geo-Logik auf Shared-Helper umgestellt",
      ),
      "utf8",
    );
    const docs = loadProject(root);
    const warning = docs.backlogArchive().warnings.find((w) => w.code === "PRIO_MISSING");
    expect(warning).toBeDefined();
    expect(warning?.file.endsWith("BACKLOG_ARCHIVE.p2.md")).toBe(true);
  });

  it("backlogShow resolves an item living in a shard", () => {
    const entry = backlogShow(join(fixtures, "project-m-shards"), "M7");
    expect(entry?.archive?.id).toBe("M7");
    expect(entry?.archive?.doneLine).toContain("c3d4e5f");
  });

  it("docs_validate stays clean across split archives (INDEX/ARCHIVE over shards)", () => {
    const report = docsValidate(join(fixtures, "project-m-shards"));
    expect(report.findings).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("docs_validate attributes ARCHIVE_WITHOUT_INDEX to the shard file", () => {
    const root = tempShardsProject();
    // drop the coupled index line for M7 from its shard section (M24/32.3)
    const backlogPath = join(root, "docs", "archive", "BACKLOG_ARCHIVE.p2.md");
    let text = readFileSync(backlogPath, "utf8");
    text = text.replace(
      "- M7 — Duplizierte Geo-Logik auf Shared-Helper umgestellt — erledigt in `c3d4e5f` (Details: Archiv)\n",
      "",
    );
    writeFileSync(backlogPath, text, "utf8");
    const report = docsValidate(root);
    const finding = report.findings.find((f) => f.code === "ARCHIVE_WITHOUT_INDEX");
    expect(finding).toBeDefined();
    expect(finding?.file).toContain("BACKLOG_ARCHIVE.p2.md");
  });

  it("phaseContext finds blocks in progress archive shards", () => {
    const ctx = phaseContext(join(fixtures, "project-m-shards"), "Phase 1");
    expect(ctx.phase.name).toBe("Phase 1");
  });

  it("projects without shards are unchanged (byte-identical behavior)", () => {
    const docs = loadProject(join(fixtures, "project-a"));
    expect(docs.backlogArchive().value.map((i) => i.id)).toEqual(["S1", "S2", "M7"]);
    expect(existsSync(join(fixtures, "project-a", "docs", "archive", "BACKLOG_ARCHIVE.p1.md"))).toBe(
      false,
    );
  });

  it("docFileSet = canonical four on a project without shards (M25/32.4)", () => {
    expect(docFileSet(join(fixtures, "project-a"))).toEqual([
      "BACKLOG.md",
      "PROGRESS.md",
      "docs/archive/BACKLOG_ARCHIVE.md",
      "docs/archive/PROGRESS_ARCHIVE.md",
    ]);
  });

  it("docFileSet + fileHashes include existing shards (fast path sees shard changes)", () => {
    const root = join(fixtures, "project-m-shards");
    expect(docFileSet(root)).toEqual([
      "BACKLOG.md",
      "PROGRESS.md",
      "docs/archive/BACKLOG_ARCHIVE.md",
      "docs/archive/PROGRESS_ARCHIVE.md",
      "docs/archive/BACKLOG_ARCHIVE.p1.md",
      "docs/archive/BACKLOG_ARCHIVE.p2.md",
      "docs/archive/PROGRESS_ARCHIVE.p1.md",
    ]);
    const hashes = fileHashes(root);
    expect(Object.keys(hashes).sort()).toEqual([
      "BACKLOG.md",
      "PROGRESS.md",
      "docs/archive/BACKLOG_ARCHIVE.md",
      "docs/archive/BACKLOG_ARCHIVE.p1.md",
      "docs/archive/BACKLOG_ARCHIVE.p2.md",
      "docs/archive/PROGRESS_ARCHIVE.md",
      "docs/archive/PROGRESS_ARCHIVE.p1.md",
    ]);
    for (const hash of Object.values(hashes)) {
      expect(hash).toMatch(/^[0-9a-f]{64}$/u);
    }
  });
});