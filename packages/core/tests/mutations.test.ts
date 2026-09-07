import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { lineDiff } from "../src/diff.ts";
import { planArchiveItem } from "../src/mutations.ts";

const fixtures = join(import.meta.dirname, "fixtures");
const tempDirs: string[] = [];

function tempCopy(project: string): string {
  const dir = mkdtempSync(join(tmpdir(), "method-docs-test-"));
  tempDirs.push(dir);
  cpSync(join(fixtures, project), dir, { recursive: true });
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("lineDiff", () => {
  it("returns empty string for identical content", () => {
    expect(lineDiff("a\nb\n", "a\nb\n")).toBe("");
  });

  it("marks removals and additions with context lines", () => {
    const diff = lineDiff("a\nb\nc\nd\n", "a\nx\nc\nd\n");
    expect(diff.split("\n")).toEqual([" a", "-b", "+x", " c", " d"]);
  });

  it("limits context lines", () => {
    const diff = lineDiff("1\n2\n3\n4\n5\n6\n7\nX\n", "1\n2\n3\n4\n5\n6\n7\nY\n");
    expect(diff.split("\n")).toEqual([" 6", " 7", "-X", "+Y"]);
  });

  it("handles insertions at the end", () => {
    const diff = lineDiff("a\n", "a\nb\n");
    expect(diff.split("\n")).toEqual([" a", "+b"]);
  });
});

describe("planArchiveItem — dry-run planning (3.1)", () => {
  it("plans block removal and archive append without writing", () => {
    const dir = tempCopy("project-a");
    const backlogPath = join(dir, "BACKLOG.md");
    const archivePath = join(dir, "docs", "archive", "BACKLOG_ARCHIVE.md");
    const backlogBefore = readFileSync(backlogPath, "utf8");
    const archiveBefore = readFileSync(archivePath, "utf8");

    const plan = planArchiveItem(dir, "H1");

    expect(plan.dryRun).toBe(true);
    expect(plan.note).toBeUndefined();
    expect(plan.changes).toHaveLength(2);

    const backlogChange = plan.changes.find((c) => c.file.endsWith("BACKLOG.md"))!;
    expect(backlogChange.before).toContain("### [ ] H1 — Upload-Endpunkt ohne Größenlimit — 🟠");
    expect(backlogChange.after).not.toContain("### [ ] H1");
    expect(backlogChange.after).toContain("### [ ] H2 — Session-Cookie ohne SameSite — 🟠");
    expect(backlogChange.after).toContain("## ✅ Erledigt-Index");
    expect(
      backlogChange.diff.split("\n").some((l) => l.startsWith("-") && l.includes("### [ ] H1")),
    ).toBe(true);

    const archiveChange = plan.changes.find((c) => c.file.endsWith("BACKLOG_ARCHIVE.md"))!;
    expect(archiveChange.after).toContain("\n---\n\n### [x] H1 — Upload-Endpunkt ohne Größenlimit — 🟠");
    expect(archiveChange.after.trimEnd().endsWith("Oversize-Upload liefert 413; reguläre Uploads bis Limit funktionieren; Suite grün.")).toBe(true);

    expect(readFileSync(backlogPath, "utf8")).toBe(backlogBefore);
    expect(readFileSync(archivePath, "utf8")).toBe(archiveBefore);
  });

  it("collapses the doubled blank line after block removal", () => {
    const dir = tempCopy("project-a");
    const plan = planArchiveItem(dir, "H1");
    const after = plan.changes.find((c) => c.file.endsWith("BACKLOG.md"))!.after;
    expect(after).not.toMatch(/\n\n\n/);
  });

  it("attaches note as Erledigt line and index tail", () => {
    const dir = tempCopy("project-a");
    const plan = planArchiveItem(dir, "H2", { note: "Commit `a1b2c3d`, 120/120 Tests grün" });
    expect(plan.note).toBe("Commit `a1b2c3d`, 120/120 Tests grün");

    const archiveChange = plan.changes.find((c) => c.file.endsWith("BACKLOG_ARCHIVE.md"))!;
    expect(archiveChange.after).toContain("- **Erledigt:** Commit `a1b2c3d`, 120/120 Tests grün");

    const backlogChange = plan.changes.find((c) => c.file.endsWith("BACKLOG.md"))!;
    expect(backlogChange.after).toContain(
      "- H2 — Session-Cookie ohne SameSite — erledigt (Commit `a1b2c3d`, 120/120 Tests grün)",
    );
    const after = backlogChange.after;
    const indexHead = after.indexOf("## ✅ Erledigt-Index");
    const entryAt = after.indexOf("- H2 — Session-Cookie ohne SameSite — erledigt");
    const trailingRule = after.lastIndexOf("---");
    expect(indexHead).toBeGreaterThan(-1);
    expect(entryAt).toBeGreaterThan(indexHead);
    expect(entryAt).toBeLessThan(trailingRule);
    expect(after).toContain("- S1 — Schema-Migration 001→002 abgesichert — erledigt in `a1b2c3d`");
  });

  it("rejects unknown and already-archived ids", () => {
    const dir = tempCopy("project-a");
    expect(() => planArchiveItem(dir, "NOPE")).toThrow(/unknown open item/);
    expect(() => planArchiveItem(dir, "S1")).toThrow(/already archived/);
  });

  it("keeps checked-off open-area items archivable (D2 remedy)", () => {
    const dir = tempCopy("project-b-drift");
    const plan = planArchiveItem(dir, "H9");
    const archiveChange = plan.changes.find((c) => c.file.endsWith("BACKLOG_ARCHIVE.md"))!;
    expect(archiveChange.after).toContain("### [x] H9 — Abgehakt, aber noch nicht archiviert (Validate-Fall) — 🟠");
    const backlogChange = plan.changes.find((c) => c.file.endsWith("BACKLOG.md"))!;
    expect(backlogChange.after).not.toContain("### [x] H9");
    expect(backlogChange.after).toContain("- H9 — Abgehakt, aber noch nicht archiviert (Validate-Fall) — erledigt");
  });
});
