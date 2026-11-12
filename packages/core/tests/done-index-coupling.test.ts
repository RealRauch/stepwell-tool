import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyArchivePlan,
  planArchiveItem,
  applyBacklogRemovePlan,
  planBacklogRemove,
  applyProgressPlan,
  planProgressUpdate,
} from "../src/mutations.ts";
import { docsValidate } from "../src/validate.ts";
import { backlogShow } from "../src/project.ts";
import { docsRepair } from "../src/repair.ts";

const fixtures = join(import.meta.dirname, "fixtures");

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

function tempProject(fixture = "project-a"): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-dicoupling-"));
  tempDirs.push(dir);
  cpSync(join(fixtures, fixture), dir, { recursive: true });
  return dir;
}

describe("Done-Index coupling (M24/32.3)", () => {
  it("archive_item to a shard puts the index line into the shard's Done-Index section", () => {
    const root = tempProject();
    // project-a: Phase 2 running → shard target BACKLOG_ARCHIVE.p2.md
    applyArchivePlan(planArchiveItem(root, "H1", { dryRun: false, note: "Commit `deadbee`" }));

    const shard = readFileSync(join(root, "docs", "archive", "BACKLOG_ARCHIVE.p2.md"), "utf8");
    expect(shard).toContain("## ✅ Erledigt-Index");
    expect(shard).toContain("- H1 — Upload-Endpunkt ohne Größenlimit — erledigt (Commit `deadbee`)");

    const backlog = readFileSync(join(root, "BACKLOG.md"), "utf8");
    expect(backlog).not.toContain("- H1 — Upload-Endpunkt");
    expect(backlog).toContain("## ✅ Erledigt-Index"); // section stays (canonical lines live there)

    expect(docsValidate(root).ok).toBe(true);
  });

  it("backlog_remove to a shard puts the removed tail into the shard's index section", () => {
    const root = tempProject();
    applyBacklogRemovePlan(planBacklogRemove(root, "T8", { dryRun: false, note: "durch H3 abgedeckt" }));
    const shard = readFileSync(join(root, "docs", "archive", "BACKLOG_ARCHIVE.p2.md"), "utf8");
    expect(shard).toContain("- T8 — Fehlverhalten bei leerer DB abdecken — entfernt (durch H3 abgedeckt)");
    const backlog = readFileSync(join(root, "BACKLOG.md"), "utf8");
    expect(backlog).not.toContain("- T8 —");
    expect(docsValidate(root).ok).toBe(true);
  });

  it("index line in the wrong file is an INDEX_LOCATION finding (strict locality)", () => {
    const root = tempProject();
    // H1 goes to the shard — then hand-move its line back into BACKLOG (drift)
    applyArchivePlan(planArchiveItem(root, "H1", { dryRun: false }));
    const shardPath = join(root, "docs", "archive", "BACKLOG_ARCHIVE.p2.md");
    const backlogPath = join(root, "BACKLOG.md");
    const shardLine = readFileSync(shardPath, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith("- H1 —"))!;
    writeFileSync(shardPath, readFileSync(shardPath, "utf8").replace(`${shardLine}\n`, ""), "utf8");
    writeFileSync(
      backlogPath,
      readFileSync(backlogPath, "utf8").replace(
        "## ✅ Erledigt-Index\n",
        `## ✅ Erledigt-Index\n\n${shardLine}\n`,
      ),
      "utf8",
    );
    const report = docsValidate(root);
    expect(report.ok).toBe(false);
    const finding = report.findings.find((f) => f.code === "INDEX_LOCATION");
    expect(finding).toBeDefined();
    expect(finding?.file.endsWith("BACKLOG.md")).toBe(true);
    expect(finding?.message).toContain("H1");
  });

  it("ARCHIVE_WITHOUT_INDEX for a shard block reconstructs the line in the shard (repair)", () => {
    const root = tempProject();
    applyArchivePlan(planArchiveItem(root, "H1", { dryRun: false }));
    const shardPath = join(root, "docs", "archive", "BACKLOG_ARCHIVE.p2.md");
    writeFileSync(
      shardPath,
      readFileSync(shardPath, "utf8")
        .split(/\r?\n/)
        .filter((l) => !l.startsWith("- H1 —"))
        .join("\n"),
      "utf8",
    );
    expect(docsValidate(root).ok).toBe(false);

    const plan = docsRepair(root, { dryRun: false });
    expect(plan.fix.applied.map((a) => a.code)).toContain("ARCHIVE_WITHOUT_INDEX");
    expect(readFileSync(shardPath, "utf8")).toContain("- H1 —");
    expect(docsValidate(root).ok).toBe(true);
  });

  it("backlogShow finds the done entry from a shard index section", () => {
    const entry = backlogShow(join(fixtures, "project-m-shards"), "M7");
    expect(entry?.done?.id).toBe("M7");
  });

  it("coupled fixture state stays clean (S1 in BACKLOG index, S2/M7 in shard sections)", () => {
    const report = docsValidate(join(fixtures, "project-m-shards"));
    expect(report.findings).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("canonical archive keeps the index line in BACKLOG (unchanged behavior)", () => {
    const root = tempProject("project-m-shards");
    // flip the running step to ✅ so no phase runs → canonical target
    applyProgressPlan(planProgressUpdate(root, "Phase 2", "2.1", "✅", { dryRun: false }));
    applyArchivePlan(planArchiveItem(root, "H1", { dryRun: false }));
    const backlog = readFileSync(join(root, "BACKLOG.md"), "utf8");
    expect(backlog).toContain("- H1 — Upload-Endpunkt ohne Größenlimit — erledigt");
  });
});
