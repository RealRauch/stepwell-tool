import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { lineDiff } from "../src/diff.ts";
import {
  applyArchivePlan,
  applyProgressPlan,
  planArchiveItem,
  planProgressUpdate,
} from "../src/mutations.ts";
import { canonical } from "../src/profile.ts";

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

describe("applyArchivePlan — apply + verification (3.2)", () => {
  it("refuses to apply a dry-run plan", () => {
    const dir = tempCopy("project-a");
    const plan = planArchiveItem(dir, "H1");
    expect(plan.dryRun).toBe(true);
    expect(() => applyArchivePlan(plan)).toThrow(/dryRun/);
  });

  it("writes both files, verifies fresh state and reports success", () => {
    const dir = tempCopy("project-a");
    const plan = planArchiveItem(dir, "H1", { dryRun: false, note: "Commit `deadbee`" });

    const result = applyArchivePlan(plan);

    expect(result.written).toHaveLength(2);
    expect(result.written[0]?.endsWith("BACKLOG.md")).toBe(true);
    expect(result.verification.ok).toBe(true);
    expect(result.verification.messages.join("\n")).toContain("removed from open BACKLOG");

    const backlog = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    expect(backlog).not.toContain("### [ ] H1");
    expect(backlog).toContain("- H1 — Upload-Endpunkt ohne Größenlimit — erledigt (Commit `deadbee`)");

    const archive = readFileSync(join(dir, "docs", "archive", "BACKLOG_ARCHIVE.md"), "utf8");
    expect(archive).toContain("### [x] H1");
    expect(archive).toContain("- **Erledigt:** Commit `deadbee`");
  });

  it("clears the D2 finding for a checked-off item after apply", () => {
    const dir = tempCopy("project-b-drift");
    const plan = planArchiveItem(dir, "H9", { dryRun: false });

    const result = applyArchivePlan(plan);

    expect(result.verification.ok).toBe(true);
    expect(
      result.verification.messages.join("\n"),
    ).not.toMatch(/NOT_ARCHIVED/);
  });
});

describe("planProgressUpdate — dry-run planning (3.3)", () => {
  it("updates a table cell and keeps everything else verbatim", () => {
    const dir = tempCopy("project-a");
    const plan = planProgressUpdate(dir, "Phase 2", "2.2", "🔄");

    expect(plan.dryRun).toBe(true);
    expect(plan.completedPhase).toBe(false);
    expect(plan.changes).toHaveLength(1);
    const change = plan.changes[0]!;
    expect(change.file.endsWith("PROGRESS.md")).toBe(true);
    expect(change.after).toContain("| 2.2 | U21 Fehlertexte | 🔄 |");
    expect(change.after).toContain("| 2.1 | Strings-Modul | 🔄 |");
    expect(change.before).toContain("| 2.2 | U21 Fehlertexte | ⬜ |");
  });

  it("does not complete the phase while open steps remain", () => {
    const dir = tempCopy("project-a");
    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅");
    expect(plan.completedPhase).toBe(false);
    expect(plan.changes).toHaveLength(1);
  });

  it("completes the phase and plans the archive move when nothing stays open", () => {
    const dir = tempCopy("project-a");
    const progressPath = join(dir, "PROGRESS.md");
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8")
        .replace("| 2.0 | Auth-Entscheidung | ⛔ |", "| 2.0 | Auth-Entscheidung | ✅ |")
        .replace("| 2.2 | U21 Fehlertexte | ⬜ |", "| 2.2 | U21 Fehlertexte | ✅ |")
        .replace("| 2.3 | U22 Ladezustände | ⬜ |", "| 2.3 | U22 Ladezustände | ✅ |"),
      "utf8",
    );

    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅", { note: "Suite 132/132 grün" });

    expect(plan.completedPhase).toBe(true);
    expect(plan.changes).toHaveLength(2);
    const progressChange = plan.changes.find((c) => c.file.endsWith("PROGRESS.md"))!;
    expect(progressChange.after).toContain("| 2.1 | Strings-Modul | ✅ |");
    expect(progressChange.after).not.toContain("### Phase 2 — UI-Polish");
    const archiveChange = plan.changes.find((c) => c.file.endsWith("PROGRESS_ARCHIVE.md"))!;
    expect(archiveChange.after).toContain("### Phase 2 — UI-Polish");
    expect(archiveChange.after).toContain("**Verifikation:** Suite 132/132 grün");
  });

  it("creates a skeleton block and table row for a new phase (🔄)", () => {
    const dir = tempCopy("project-b-drift");
    const plan = planProgressUpdate(dir, "Phase 9 — Drift-Fixes", "9.1", "🔄");

    const change = plan.changes[0]!;
    expect(change.after).toContain("### Phase 9 — Drift-Fixes");
    expect(change.after).toContain("**Umfang (Steps):**");
    expect(change.after).toContain("- **9.1 9.1**");
    expect(change.after).toContain("| 9.1 | 9.1 | 🔄 |");
  });

  it("appends a missing table row from the scope entry", () => {
    const dir = tempCopy("project-a");
    const progressPath = join(dir, "PROGRESS.md");
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8").replace("| 2.2 | U21 Fehlertexte | ⬜ |\n", ""),
      "utf8",
    );

    const plan = planProgressUpdate(dir, "Phase 2", "2.2", "🔄");

    const change = plan.changes[0]!;
    expect(change.after).toContain("| 2.2 | U21 Fehlertexte migrieren | 🔄 |");
  });

  it("rejects unknown phases and steps", () => {
    const dir = tempCopy("project-a");
    expect(() => planProgressUpdate(dir, "Phase 99", "2.1", "🔄")).toThrow(/unknown step/);
    expect(() => planProgressUpdate(dir, "Phase 99", "2.1", "✅")).toThrow(/unknown phase/);
    expect(() => planProgressUpdate(dir, "Phase 2", "9.9", "🔄")).toThrow(/unknown step/);
  });
});

describe("locale generation (4.2)", () => {
  it("auto-detects English and generates done/Done markers", () => {
    const dir = tempCopy("project-c-en");
    const plan = planArchiveItem(dir, "E1", { note: "Commit `f0e1d2c`" });
    expect(plan.note).toBe("Commit `f0e1d2c`");

    const backlogChange = plan.changes.find((c) => c.file.endsWith("BACKLOG.md"))!;
    expect(backlogChange.after).toContain("- E1 — Upload endpoint without size limit — done (Commit `f0e1d2c`)");
    const archiveChange = plan.changes.find((c) => c.file.endsWith("BACKLOG_ARCHIVE.md"))!;
    expect(archiveChange.after).toContain("- **Done:** Commit `f0e1d2c`");
  });

  it("honors an explicit locale override on a German project", () => {
    const dir = tempCopy("project-a");
    const plan = planArchiveItem(dir, "H1", { locale: "en", note: "Commit `aabbcc1`" });

    const backlogChange = plan.changes.find((c) => c.file.endsWith("BACKLOG.md"))!;
    expect(backlogChange.after).toContain("- H1 — Upload-Endpunkt ohne Größenlimit — done (Commit `aabbcc1`)");
    const archiveChange = plan.changes.find((c) => c.file.endsWith("BACKLOG_ARCHIVE.md"))!;
    expect(archiveChange.after).toContain("- **Done:** Commit `aabbcc1`");
  });

  it("generates English skeletons and verification lines for progress_update", () => {
    const dir = tempCopy("project-c-en");
    const skeleton = planProgressUpdate(dir, "Phase 3 — Widgets", "3.1", "🔄");
    const skeletonChange = skeleton.changes[0]!;
    expect(skeletonChange.after).toContain("**Scope (Steps):**");
    expect(skeletonChange.after).not.toContain("**Umfang (Steps):**");

    const progressPath = join(dir, "PROGRESS.md");
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8").replace("| 2.2 | U21 error texts | ⬜ |", "| 2.2 | U21 error texts | ✅ |").replace("| 2.3 | U22 loading states | ⬜ |", "| 2.3 | U22 loading states | ✅ |"),
      "utf8",
    );
    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅", { note: "suite green" });
    const archiveChange = plan.changes.find((c) => c.file.endsWith("PROGRESS_ARCHIVE.md"))!;
    expect(archiveChange.after).toContain("**Verification:** suite green");
  });

  it("keeps German as the fallback for empty content (canonical)", () => {
    expect(canonical("doneWord", "de")).toBe("erledigt");
  });
});

describe("mutation regressions — R5 (Phase 6)", () => {
  /** Removes row 2.1 from the table and marks 2.2/2.3 done: updating 2.1 must
   *  re-insert the row AND complete the phase in the same call (R1 scenario). */
  function setupForR1(project: string): string {
    const dir = tempCopy(project);
    const progressPath = join(dir, "PROGRESS.md");
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8")
        .replace("| 2.2 | U21 Fehlertexte | ⬜ |", "| 2.2 | U21 Fehlertexte | ✅ |")
        .replace("| 2.3 | U22 Ladezustände | ⬜ |", "| 2.3 | U22 Ladezustände | ✅ |")
        .replace("| 2.1 | Strings-Modul | 🔄 |\n", ""),
      "utf8",
    );
    return dir;
  }

  it("R1: missing row + phase completion keeps table-first PROGRESS.md intact", () => {
    const dir = setupForR1("project-d-tablefirst");

    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅", { dryRun: false, note: "Suite grün" });
    expect(plan.completedPhase).toBe(true);
    const result = applyProgressPlan(plan);
    expect(result.verification.ok).toBe(true);

    const progress = readFileSync(join(dir, "PROGRESS.md"), "utf8");
    expect(progress).toContain("| 2.1 | Strings-Modul anlegen | ✅ |");
    expect(progress).not.toContain("### Phase 2 — UI-Polish");
    expect(progress).not.toContain("- **2.3 U22");
    expect(progress).not.toMatch(/\n{3,}/u);
    const archive = readFileSync(join(dir, "docs", "archive", "PROGRESS_ARCHIVE.md"), "utf8");
    expect(archive).toContain("### Phase 2 — UI-Polish");
    expect(archive).toContain("**Verifikation:** Suite grün");
  });

  it("R1: missing row + phase completion keeps blocks-first PROGRESS.md intact (guard)", () => {
    const dir = setupForR1("project-a");

    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅", { dryRun: false });
    expect(plan.completedPhase).toBe(true);
    const result = applyProgressPlan(plan);
    expect(result.verification.ok).toBe(true);

    const progress = readFileSync(join(dir, "PROGRESS.md"), "utf8");
    expect(progress).toContain("| 2.1 | Strings-Modul anlegen | ✅ |");
    expect(progress).not.toContain("### Phase 2 — UI-Polish");
    expect(progress).not.toContain("- **2.3 U22");
  });
});

describe("applyProgressPlan — apply + verification (3.3)", () => {
  it("refuses to apply a dry-run plan", () => {
    const dir = tempCopy("project-a");
    const plan = planProgressUpdate(dir, "Phase 2", "2.2", "🔄");
    expect(() => applyProgressPlan(plan)).toThrow(/dryRun/);
  });

  it("writes the status change and verifies fresh state", () => {
    const dir = tempCopy("project-a");
    const plan = planProgressUpdate(dir, "Phase 2", "2.2", "🔄", { dryRun: false });

    const result = applyProgressPlan(plan);

    expect(result.verification.ok).toBe(true);
    expect(readFileSync(join(dir, "PROGRESS.md"), "utf8")).toContain("| 2.2 | U21 Fehlertexte | 🔄 |");
  });

  it("moves a completed phase block into the archive and verifies", () => {
    const dir = tempCopy("project-a");
    const progressPath = join(dir, "PROGRESS.md");
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8")
        .replace("| 2.0 | Auth-Entscheidung | ⛔ |", "| 2.0 | Auth-Entscheidung | ✅ |")
        .replace("| 2.2 | U21 Fehlertexte | ⬜ |", "| 2.2 | U21 Fehlertexte | ✅ |")
        .replace("| 2.3 | U22 Ladezustände | ⬜ |", "| 2.3 | U22 Ladezustände | ✅ |"),
      "utf8",
    );

    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅", { dryRun: false, note: "Suite 132/132 grün" });
    const result = applyProgressPlan(plan);

    expect(result.verification.ok).toBe(true);
    const progress = readFileSync(progressPath, "utf8");
    expect(progress).toContain("| 2.1 | Strings-Modul | ✅ |");
    expect(progress).not.toContain("### Phase 2 — UI-Polish");
    const archive = readFileSync(join(dir, "docs", "archive", "PROGRESS_ARCHIVE.md"), "utf8");
    expect(archive).toContain("### Phase 2 — UI-Polish");
    expect(archive).toContain("**Verifikation:** Suite 132/132 grün");
  });
});
