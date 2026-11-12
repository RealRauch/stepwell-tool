import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { lineDiff } from "../src/diff.ts";
import { parseBacklog } from "../src/backlog.ts";
import { parseProgress } from "../src/progress.ts";
import { docsValidate } from "../src/validate.ts";
import {
  applyArchivePlan,
  applyBacklogAddPlan,
  applyBacklogRemovePlan,
  applyBacklogUpdatePlan,
  applyPhasePlan,
  applyProgressPlan,
  planArchiveItem,
  planBacklogAdd,
  planBacklogRemove,
  planBacklogUpdate,
  planPhase,
  planProgressUpdate,
} from "../src/mutations.ts";
import { canonical } from "../src/profile.ts";

const fixtures = join(import.meta.dirname, "fixtures");
const tempDirs: string[] = [];

function tempCopy(project: string): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-test-"));
  tempDirs.push(dir);
  cpSync(join(fixtures, project), dir, { recursive: true });
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
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

    const archiveChange = plan.changes.find((c) => c.file.endsWith("BACKLOG_ARCHIVE.p2.md"))!;
    expect(archiveChange.after).toContain("\n---\n\n### [x] H1 — Upload-Endpunkt ohne Größenlimit — 🟠");
    expect(archiveChange.after.trimEnd().endsWith("- H1 — Upload-Endpunkt ohne Größenlimit — erledigt")).toBe(true); // M24/32.3: shard ends with its index line

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

    const archiveChange = plan.changes.find((c) => c.file.endsWith("BACKLOG_ARCHIVE.p2.md"))!;
    expect(archiveChange.after).toContain("- **Erledigt:** Commit `a1b2c3d`, 120/120 Tests grün");

    expect(archiveChange.after).toContain(
      "- H2 — Session-Cookie ohne SameSite — erledigt (Commit `a1b2c3d`, 120/120 Tests grün)",
    ); // M24/32.3: the line lives in the shard's own index section
    const backlogChange = plan.changes.find((c) => c.file.endsWith("BACKLOG.md"))!;
    expect(backlogChange.after).not.toContain("- H2 — Session-Cookie");
    const shardAfter = archiveChange.after;
    const indexHead = shardAfter.indexOf("## ✅ Erledigt-Index");
    const entryAt = shardAfter.indexOf("- H2 — Session-Cookie ohne SameSite — erledigt");
    expect(indexHead).toBeGreaterThan(-1);
    expect(entryAt).toBeGreaterThan(indexHead); // section tail; shard files carry no trailing rule
    expect(backlogChange.after).toContain("- S1 — Schema-Migration 001→002 abgesichert — erledigt in `a1b2c3d`");
  });

  it("rejects unknown and already-archived ids", () => {
    const dir = tempCopy("project-a");
    expect(() => planArchiveItem(dir, "NOPE")).toThrow(/unknown open item/);
    expect(() => planArchiveItem(dir, "S1")).toThrow(/already archived/);
  });

  it("keeps checked-off open-area items archivable (D2 remedy)", () => {
    const dir = tempCopy("project-b-drift");
    const plan = planArchiveItem(dir, "H9");
    const archiveChange = plan.changes.find((c) => c.file.endsWith("BACKLOG_ARCHIVE.p1.md"))!;
    expect(archiveChange.after).toContain("### [x] H9 — Abgehakt, aber noch nicht archiviert (Validate-Fall) — 🟠");
    const backlogChange = plan.changes.find((c) => c.file.endsWith("BACKLOG.md"))!;
    expect(backlogChange.after).not.toContain("### [x] H9");
    expect(archiveChange.after).toContain("- H9 — Abgehakt, aber noch nicht archiviert (Validate-Fall) — erledigt"); // M24/32.3
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
    expect(backlog).not.toContain("- H1 —");

    const archive = readFileSync(join(dir, "docs", "archive", "BACKLOG_ARCHIVE.p2.md"), "utf8");
    expect(archive).toContain("### [x] H1");
    expect(archive).toContain("- **Erledigt:** Commit `deadbee`");
    // M24/32.3: the done line lives in the shard's own index section
    expect(archive).toContain("- H1 — Upload-Endpunkt ohne Größenlimit — erledigt (Commit `deadbee`)");
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
    const archiveChange = plan.changes.find((c) => c.file.endsWith("PROGRESS_ARCHIVE.p2.md"))!;
    expect(archiveChange.after).toContain("### Phase 2 — UI-Polish");
    expect(archiveChange.after).toContain("**Verifikation:** Suite 132/132 grün");
  });

  it("M10: appends a post-hoc completed older phase at the end (phase numbers may be non-monotonic)", () => {
    const dir = tempCopy("project-h-completion-order");

    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅", {
      dryRun: false,
      note: "nachgeholt",
    });
    expect(plan.completedPhase).toBe(true);
    applyProgressPlan(plan);

    // H12/32.2: completions land on their own shard — Phase 2 → p2 file
    const shard = readFileSync(join(dir, "docs", "archive", "PROGRESS_ARCHIVE.p2.md"), "utf8");
    expect(shard.indexOf("### Phase 2 — UI-Polish")).toBeGreaterThan(-1);
    expect(shard.lastIndexOf("### Phase 2 — UI-Polish")).toBe(shard.indexOf("### Phase 2 — UI-Polish"));
    expect(shard).toContain("**Verifikation:** nachgeholt");
    // legacy stock in the canonical file stays untouched (append-only, frozen)
    const archive = readFileSync(join(dir, "docs", "archive", "PROGRESS_ARCHIVE.md"), "utf8");
    expect(archive).not.toContain("### Phase 2 — UI-Polish");
  });

  it("H2: accepts a phase archived earlier in the same batch — row update only, no second append", () => {
    const dir = tempCopy("project-h-completion-order");
    const first = planProgressUpdate(dir, "Phase 2", "2.1", "✅", { dryRun: false });
    expect(first.completedPhase).toBe(true);
    applyProgressPlan(first);

    expect(() => planProgressUpdate(dir, "Phase 2", "2.2", "✅")).toThrow(/unknown phase/);
    const plan = planProgressUpdate(dir, "Phase 2", "2.2", "✅", {
      dryRun: false,
      phaseAlreadyArchived: true,
    });
    expect(plan.completedPhase).toBe(false);
    expect(plan.changes).toHaveLength(1);
    const change = plan.changes[0]!;
    expect(change.file.endsWith("PROGRESS_ARCHIVE.md")).toBe(false);
    expect(change.after).toContain("| 2.2 | U21 Fehlertexte | ✅ |");
    expect(change.after).not.toContain("### Phase 2");
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

describe("phase matching + phantom skeleton guard (H8, 29.1)", () => {
  const planned = [
    { step: "7.1", name: "Erster Step" },
    { step: "7.2", name: "Zweiter Step" },
  ];

  it("matches a bare phase number to 'Phase <N>' and flips only the table row", () => {
    const dir = tempCopy("project-a");
    applyPhasePlan(planPhase(dir, "Phase 7 — Rundung", planned, { dryRun: false }));

    const plan = planProgressUpdate(dir, "7", "7.1", "🔄", { dryRun: true });
    expect(plan.changes).toHaveLength(1);
    const change = plan.changes[0]!;
    expect(change.file.endsWith("PROGRESS.md")).toBe(true);
    expect(change.after).toContain("| 7.1 | Erster Step | 🔄 |");
    expect(change.after).not.toMatch(/### 7\b/u);
  });

  it("refuses to create a phantom skeleton when the step has a table row but no block matches (H8)", () => {
    const dir = tempCopy("project-a");
    applyPhasePlan(planPhase(dir, "Phase 7 — Rundung", planned, { dryRun: false }));

    // non-"Phase <N>" name that matches nothing: previously inserted a silent
    // "### Neue Phase" skeleton while flipping the row — a corruption, H8
    expect(() =>
      planProgressUpdate(dir, "Neue Phase", "7.1", "🔄", { dryRun: true }),
    ).toThrow(/7\.1/);
    // bare number without a matching phase: same refusal
    expect(() =>
      planProgressUpdate(dir, "99", "7.1", "🔄", { dryRun: true }),
    ).toThrow(/7\.1/u);
  });
});

describe("title rename prefix guard (L16, 29.3)", () => {
  it("accepts a full heading as --title without doubling the 'Phase <N> —' prefix", () => {
    const dir = tempCopy("project-a");
    const plan = planProgressUpdate(dir, "Phase 2", "2.2", "🔄", { dryRun: true, title: "Phase 2 — UI Polish" });
    const change = plan.changes[0]!;
    expect(change.after).toContain("### Phase 2 — UI Polish");
    expect(change.after).not.toContain("Phase 2 — Phase 2");
  });

  it("keeps the archive heading clean on phase completion with a full heading as title", () => {
    const dir = tempCopy("project-h-completion-order");
    const result = applyProgressPlan(
      planProgressUpdate(dir, "Phase 2", "2.1", "✅", { dryRun: false, title: "Phase 2 — Batch done" }),
    );
    expect(result.verification.ok).toBe(true);
    const archive = readFileSync(join(dir, "docs", "archive", "PROGRESS_ARCHIVE.p2.md"), "utf8");
    expect(archive).toContain("### Phase 2 — Batch done");
    expect(archive).not.toContain("Phase 2 — Phase 2");
  });
});

describe("locale generation (4.2)", () => {
  it("auto-detects English and generates done/Done markers", () => {
    const dir = tempCopy("project-c-en");
    const plan = planArchiveItem(dir, "E1", { note: "Commit `f0e1d2c`" });
    expect(plan.note).toBe("Commit `f0e1d2c`");

    const archiveChange = plan.changes.find((c) => c.file.endsWith("BACKLOG_ARCHIVE.p2.md"))!;
    expect(archiveChange.after).toContain("- **Done:** Commit `f0e1d2c`");
    expect(archiveChange.after).toContain("- E1 — Upload endpoint without size limit — done (Commit `f0e1d2c`)"); // M24/32.3: shard section
    const backlogChange = plan.changes.find((c) => c.file.endsWith("BACKLOG.md"))!;
    expect(backlogChange.after).not.toContain("- E1 —");
  });

  it("honors an explicit locale override on a German project", () => {
    const dir = tempCopy("project-a");
    const plan = planArchiveItem(dir, "H1", { locale: "en", note: "Commit `aabbcc1`" });

    const archiveChange = plan.changes.find((c) => c.file.endsWith("BACKLOG_ARCHIVE.p2.md"))!;
    expect(archiveChange.after).toContain("- **Done:** Commit `aabbcc1`");
    expect(archiveChange.after).toContain("- H1 — Upload-Endpunkt ohne Größenlimit — done (Commit `aabbcc1`)"); // M24/32.3: shard section
    const backlogChange = plan.changes.find((c) => c.file.endsWith("BACKLOG.md"))!;
    expect(backlogChange.after).not.toContain("- H1 —");
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
    const archiveChange = plan.changes.find((c) => c.file.endsWith("PROGRESS_ARCHIVE.p2.md"))!;
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
    const archive = readFileSync(join(dir, "docs", "archive", "PROGRESS_ARCHIVE.p2.md"), "utf8");
    expect(archive).toContain("### Phase 2 — UI-Polish");
    expect(archive).toContain("**Verifikation:** Suite grün");
  });

  /** Converts all four docs files of a copied project to CRLF line endings. */
  function toCrlf(dir: string): void {
    for (const rel of [
      "BACKLOG.md",
      "PROGRESS.md",
      join("docs", "archive", "BACKLOG_ARCHIVE.md"),
      join("docs", "archive", "PROGRESS_ARCHIVE.md"),
    ]) {
      const path = join(dir, rel);
      writeFileSync(path, readFileSync(path, "utf8").replace(/\n/gu, "\r\n"), "utf8");
    }
  }

  const loneLf = (content: string): number => (content.match(/(?<!\r)\n/gu) ?? []).length;

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
  it("R3: archive_item keeps CRLF line endings in the archive", () => {
    const dir = tempCopy("project-a");
    toCrlf(dir);
    const plan = planArchiveItem(dir, "H1", { dryRun: false, note: "Commit `deadbee`" });
    const result = applyArchivePlan(plan);
    expect(result.verification.ok).toBe(true);
    const archive = readFileSync(join(dir, "docs", "archive", "BACKLOG_ARCHIVE.p2.md"), "utf8");
    expect(archive).toContain("### [x] H1");
    expect(archive).toContain("- **Erledigt:** Commit `deadbee`");
    expect(loneLf(archive)).toBe(0);
    expect(loneLf(readFileSync(join(dir, "BACKLOG.md"), "utf8"))).toBe(0);
  });

  it("R3: progress_update phase completion keeps CRLF line endings", () => {
    const dir = tempCopy("project-a");
    toCrlf(dir);
    const progressPath = join(dir, "PROGRESS.md");
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8")
        .replace("| 2.2 | U21 Fehlertexte | ⬜ |", "| 2.2 | U21 Fehlertexte | ✅ |")
        .replace("| 2.3 | U22 Ladezustände | ⬜ |", "| 2.3 | U22 Ladezustände | ✅ |"),
      "utf8",
    );
    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅", { dryRun: false, note: "Suite grün" });
    const result = applyProgressPlan(plan);
    expect(result.verification.ok).toBe(true);
    expect(loneLf(readFileSync(progressPath, "utf8"))).toBe(0);
    const archive = readFileSync(join(dir, "docs", "archive", "PROGRESS_ARCHIVE.p2.md"), "utf8");
    expect(archive).toContain("### Phase 2 — UI-Polish");
    expect(loneLf(archive)).toBe(0);
  });
  it("R4: refuses to apply an archive plan after an interim file change", () => {
    const dir = tempCopy("project-a");
    const plan = planArchiveItem(dir, "H1", { dryRun: false });
    const backlogPath = join(dir, "BACKLOG.md");
    writeFileSync(
      backlogPath,
      readFileSync(backlogPath, "utf8").replace(
        "# BACKLOG.md — Offene Punkte",
        "# BACKLOG.md — Offene Punkte (editiert)",
      ),
      "utf8",
    );
    expect(() => applyArchivePlan(plan)).toThrow(/stale/i);
    expect(readFileSync(backlogPath, "utf8")).toContain("(editiert)");
    expect(readFileSync(backlogPath, "utf8")).toContain("### [ ] H1");
  });

  it("R4: refuses to apply a progress plan after an interim file change", () => {
    const dir = tempCopy("project-a");
    const plan = planProgressUpdate(dir, "Phase 2", "2.2", "🔄", { dryRun: false });
    const progressPath = join(dir, "PROGRESS.md");
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8").replace(
        "# Projekt-Tracking: Demo-Projekt",
        "# Projekt-Tracking: Demo-Projekt (editiert)",
      ),
      "utf8",
    );
    expect(() => applyProgressPlan(plan)).toThrow(/stale/i);
    expect(readFileSync(progressPath, "utf8")).toContain("| 2.2 | U21 Fehlertexte | ⬜ |");
  });

  it("R4: applies cleanly when the file is untouched since planning", () => {
    const dir = tempCopy("project-a");
    const plan = planArchiveItem(dir, "H1", { dryRun: false });
    const result = applyArchivePlan(plan);
    expect(result.verification.ok).toBe(true);
  });
  it("T2: title renames the phase heading and nothing else (6.8)", () => {
    const dir = tempCopy("project-a");
    const progressPath = join(dir, "PROGRESS.md");
    const beforeLines = readFileSync(progressPath, "utf8").split("\n");

    const plan = planProgressUpdate(dir, "Phase 2", "2.2", "🔄", {
      dryRun: false,
      title: "UI-Polish & i18n",
    });
    expect(plan.title).toBe("UI-Polish & i18n");
    const result = applyProgressPlan(plan);
    expect(result.verification.ok).toBe(true);

    const afterLines = readFileSync(progressPath, "utf8").split("\n");
    expect(afterLines).toHaveLength(beforeLines.length);
    const changed = beforeLines
      .map((line, i) => [i, line !== afterLines[i]] as const)
      .filter(([, differs]) => differs)
      .map(([i]) => i);
    expect(changed).toEqual([12, 38]);
    expect(afterLines[12]).toBe("### Phase 2 — UI-Polish & i18n");
    expect(afterLines[38]).toBe("| 2.2 | U21 Fehlertexte | 🔄 |");

    const fresh = parseProgress(readFileSync(progressPath, "utf8")).value;
    const renamed = fresh.phases.find((p) => p.title === "UI-Polish & i18n");
    expect(renamed?.name).toBe("Phase 2");
  });

  it("T2: title + phase completion archives the block under the new title", () => {
    const dir = setupForR1("project-a");
    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅", {
      dryRun: false,
      note: "Suite grün",
      title: "UI-Polish Final",
    });
    expect(plan.completedPhase).toBe(true);
    const result = applyProgressPlan(plan);
    expect(result.verification.ok).toBe(true);

    const progress = readFileSync(join(dir, "PROGRESS.md"), "utf8");
    expect(progress).not.toContain("### Phase 2");
    expect(progress).toContain("| 2.1 | Strings-Modul anlegen | ✅ |");
    const archive = readFileSync(join(dir, "docs", "archive", "PROGRESS_ARCHIVE.p2.md"), "utf8");
    expect(archive).toContain("### Phase 2 — UI-Polish Final");
    expect(archive).toContain("**Verifikation:** Suite grün");
  });

  it("T2: title completes a new-phase skeleton heading", () => {
    const dir = tempCopy("project-b-drift");
    const plan = planProgressUpdate(dir, "Phase 9", "9.1", "🔄", { title: "Drift-Fixes" });
    const change = plan.changes[0]!;
    expect(change.after).toContain("### Phase 9 — Drift-Fixes");
    expect(change.after).not.toContain("### Phase 9\n");
  });
});

describe("backlog CRUD (T1, 6.9)", () => {
  it("add derives the next id of the priority series and appends to the section", () => {
    const dir = tempCopy("project-a");
    const backlogPath = join(dir, "BACKLOG.md");

    const plan = planBacklogAdd(dir, {
      dryRun: false,
      section: "HOCH",
      title: "Rate-Limit für Login",
      priority: "🟠",
      text: "- **Ort:** `src/auth/login.ts`\n- **Problem:** Brute-Force ungehindert.",
    });
    expect(plan.id).toBe("H3");
    const result = applyBacklogAddPlan(plan);
    expect(result.verification.ok).toBe(true);

    const backlog = readFileSync(backlogPath, "utf8");
    expect(backlog).toContain("### [ ] H3 — Rate-Limit für Login — 🟠");
    expect(backlog).toContain("- **Ort:** `src/auth/login.ts`");
    const h3At = backlog.indexOf("### [ ] H3");
    const h2Body = backlog.indexOf("- **Abnahme:** Cookie-Flags");
    const rule = backlog.indexOf("---", h2Body);
    expect(h3At).toBeGreaterThan(h2Body);
    expect(h3At).toBeLessThan(rule);
    expect(backlog).not.toMatch(/\n{3,}/u);

    const parsed = parseBacklog(backlog).value;
    const added = parsed.items.find((i) => i.id === "H3");
    expect(added?.open).toBe(true);
    expect(added?.priority).toBe("🟠");
    expect(added?.section).toBe("HOCH");
    expect(added?.location).toBe("`src/auth/login.ts`");
    const h1 = parsed.items.find((i) => i.id === "H1");
    expect(h1?.raw).toContain("Kein `limits.fileSize` gesetzt");
  });

  it("add refreshes the Stand timestamp in the heading", () => {
    const dir = tempCopy("project-a");
    const plan = planBacklogAdd(dir, {
      section: "MITTEL",
      title: "Irgendwas",
      priority: "🟡",
    });
    const heading = plan.changes[0]!.after.split("\n")[0]!;
    expect(heading).toMatch(/Stand: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}/u);
    expect(heading).not.toContain("260907/1200");
    expect(plan.id).toBe("M8");
  });

  it("add rejects non-conforming, duplicate ids and unknown sections", () => {
    const dir = tempCopy("project-a");
    expect(() =>
      planBacklogAdd(dir, { section: "HOCH", title: "X", priority: "🟠", id: "nope_1" }),
    ).toThrow(/Nomenklatur|convention/iu);
    expect(() =>
      planBacklogAdd(dir, { section: "HOCH", title: "X", priority: "🟠", id: "H1" }),
    ).toThrow(/H1/);
    expect(() =>
      planBacklogAdd(dir, { section: "GIBT_ES_NICHT", title: "X", priority: "🟠" }),
    ).toThrow(/GIBT_ES_NICHT/);
    expect(() =>
      planBacklogAdd(dir, { section: "TEST-LÜCKEN", title: "X", priority: "🔵" }),
    ).toThrow(/id/iu);
  });

  it("update rewrites title in place and keeps the body verbatim", () => {
    const dir = tempCopy("project-a");
    const plan = planBacklogUpdate(dir, "H2", {
      dryRun: false,
      title: "Session-Cookie ohne SameSite und Secure",
    });
    const result = applyBacklogUpdatePlan(plan);
    expect(result.verification.ok).toBe(true);

    const backlog = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    expect(backlog).toContain("### [ ] H2 — Session-Cookie ohne SameSite und Secure — 🟠");
    expect(backlog).toContain("sameSite: \"lax\"");
    expect(backlog).not.toContain("H2 — Session-Cookie ohne SameSite — 🟠");

    const parsed = parseBacklog(backlog).value;
    const h2 = parsed.items.find((i) => i.id === "H2");
    expect(h2?.span.start).toBe(25);
    expect(h2?.priority).toBe("🟠");
  });

  it("update moves the block across sections when the priority changes", () => {
    const dir = tempCopy("project-a");
    const plan = planBacklogUpdate(dir, "H2", {
      dryRun: false,
      priority: "🟢",
      title: "Session-Cookie-Polish",
    });
    const result = applyBacklogUpdatePlan(plan);
    expect(result.verification.ok).toBe(true);

    const backlog = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    const lowSection = backlog.indexOf("## 🟢 NIEDRIG");
    const movedAt = backlog.indexOf("### [ ] H2 — Session-Cookie-Polish — 🟢");
    const l3 = backlog.indexOf("### [ ] L3");
    expect(movedAt).toBeGreaterThan(lowSection);
    expect(movedAt).toBeGreaterThan(l3);
    const hochSection = backlog.slice(backlog.indexOf("## 🟠 HOCH"), lowSection);
    expect(hochSection).not.toContain("### [ ] H2");

    const parsed = parseBacklog(backlog).value;
    const h2 = parsed.items.find((i) => i.id === "H2");
    expect(h2?.section).toBe("NIEDRIG");
    expect(h2?.priority).toBe("🟢");
  });

  it("update rejects unknown ids", () => {
    const dir = tempCopy("project-a");
    expect(() => planBacklogUpdate(dir, "NOPE", { title: "X" })).toThrow(/NOPE/);
  });

  it("remove moves the block verbatim to the archive without an index line", () => {
    const dir = tempCopy("project-a");
    const before = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    const plan = planBacklogRemove(dir, "R4", { dryRun: false, note: "Thema veraltet" });
    const result = applyBacklogRemovePlan(plan);
    expect(result.verification.ok).toBe(true);

    const backlog = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    expect(backlog).not.toContain("### [ ] R4");
    expect(backlog).not.toContain("- R4 —");
    expect(backlog).toContain("- S1 — Schema-Migration 001→002 abgesichert — erledigt in `a1b2c3d`");
    expect(readFileSync(join(dir, "BACKLOG.md"), "utf8")).not.toBe(before);

    const archive = readFileSync(join(dir, "docs", "archive", "BACKLOG_ARCHIVE.p2.md"), "utf8");
    expect(archive).toContain(
      "### [ ] R4 — Feldtest auf Zielgeräten — 🟠 *(vor Pilotbetrieb zwingend)*",
    );
    expect(archive).toContain("- **Entfernt:** Thema veraltet");
    expect(archive).toContain("- R4 — Feldtest auf Zielgeräten — entfernt (Thema veraltet)"); // M24/32.3: tail in shard section

    const validation = docsValidate(dir);
    expect(validation.findings.filter((f) => f.message.includes("R4"))).toEqual([]);
  });

  it("remove rejects unknown and already-archived ids", () => {
    const dir = tempCopy("project-a");
    expect(() => planBacklogRemove(dir, "NOPE")).toThrow(/NOPE/);
    expect(() => planBacklogRemove(dir, "S1")).toThrow(/already archived/);
  });
});

describe("phase planning (T4, 6.10)", () => {
  const steps = [
    { step: "7.1", name: "Erster Step" },
    { step: "7.2", name: "Zweiter Step" },
    { step: "7.3", name: "Dritter Step" },
  ];

  it("plans table rows and a full scope skeleton for a new phase", () => {
    const dir = tempCopy("project-a");
    const progressPath = join(dir, "PROGRESS.md");

    const plan = planPhase(dir, "Phase 7 — Rundung", steps, { dryRun: false });
    expect(plan.dryRun).toBe(false);
    const change = plan.changes[0]!;
    expect(change.after).toContain("| 7.1 | Erster Step | ⬜ |");
    expect(change.after).toContain("| 7.3 | Dritter Step | ⬜ |");
    expect(change.after).toContain("### Phase 7 — Rundung");
    expect(change.after).toContain("- **7.2 Zweiter Step**");

    const result = applyPhasePlan(plan);
    expect(result.verification.ok).toBe(true);

    const progress = readFileSync(progressPath, "utf8");
    expect(progress).toContain("| 7.1 | Erster Step | ⬜ |");
    const parsed = parseProgress(progress).value;
    const block = parsed.phases.find((p) => p.name === "Phase 7");
    expect(block?.title).toBe("Rundung");
    expect(block?.scope).toHaveLength(3);

    // M18/27.9: pure planning is a PHASE_PLANNED warning, not a finding:
    const validation = docsValidate(dir);
    expect(validation.findings.some((f) => f.code === "PLAN_WITHOUT_WIP" && f.message.includes("Phase 7"))).toBe(false);
    expect(validation.warnings.some((w) => w.code === "PHASE_PLANNED" && w.message.includes("Phase 7"))).toBe(true);

    // Integration: erster 🔄-Step übernimmt den bestehenden Scope ohne Workaround
    const start = planProgressUpdate(dir, "Phase 7", "7.1", "🔄", { dryRun: false });
    expect(start.changes).toHaveLength(1);
    const startResult = applyProgressPlan(start);
    expect(startResult.verification.ok).toBe(true);
    const after = docsValidate(dir);
    expect(after.findings.some((f) => f.code === "PLAN_WITHOUT_WIP")).toBe(false);
    expect(after.ok).toBe(true);
    expect(readFileSync(progressPath, "utf8")).not.toMatch(/### Phase 7 — Rundung[\s\S]*### Phase 7 — Rundung/u);
  });

  it("rejects step numbers outside the phase, duplicates and existing phases", () => {
    const dir = tempCopy("project-a");
    expect(() =>
      planPhase(dir, "Phase 7", [{ step: "8.1", name: "Fremd" }]),
    ).toThrow(/8\.1/);
    expect(() =>
      planPhase(dir, "Phase 7", [
        { step: "7.1", name: "A" },
        { step: "7.1", name: "B" },
      ]),
    ).toThrow(/7\.1/);
    expect(() => planPhase(dir, "Phase 0", [{ step: "0.9", name: "X" }])).toThrow(
      /PROGRESS_ARCHIVE/,
    );
    expect(() => planPhase(dir, "Siebte Phase", steps)).toThrow(/Phase/);
    expect(() =>
      planPhase(dir, "Phase 7 — Rundung", [{ step: "7.1", name: "A" }, ...steps]),
    ).toThrow(/7\.1/);
  });
});

describe("phase extension — steps to a running phase (D5, 8.3)", () => {
  it("appends table rows and scope bullets to an existing running phase", () => {
    const dir = tempCopy("project-a");
    const progressPath = join(dir, "PROGRESS.md");
    const before = readFileSync(progressPath, "utf8");

    const plan = planPhase(dir, "Phase 2", [{ step: "2.4", name: "Extra-Step" }], {
      dryRun: false,
    });
    expect(plan.dryRun).toBe(false);
    const change = plan.changes[0]!;
    expect(change.after).toContain("| 2.4 | Extra-Step | ⬜ |");
    expect(change.after).toContain("- **2.4 Extra-Step**");
    expect(change.after.match(/### Phase 2 — UI-Polish/gu)).toHaveLength(1);
    const afterLines = change.after.split("\n");
    expect(before.split("\n").every((l) => afterLines.includes(l))).toBe(true);

    const result = applyPhasePlan(plan);
    expect(result.verification.ok).toBe(true);

    const progress = readFileSync(progressPath, "utf8");
    const parsed = parseProgress(progress).value;
    const block = parsed.phases.find((p) => p.name === "Phase 2");
    expect(block?.scope).toHaveLength(5);
    expect(block?.scope.at(-1)).toBe("**2.4 Extra-Step**");
    expect(progress).toContain("| 2.1 | Strings-Modul | 🔄 |");
    expect(progress).toContain("**Abnahme:** typecheck + unit + e2e grün; U21/U22 abgeschlossen.");

    const validation = docsValidate(dir);
    expect(validation.findings).toEqual([]);
    expect(validation.warnings).toEqual([]);
  });

  it("rejects steps already present in the table or in the block scope", () => {
    const dir = tempCopy("project-a");
    expect(() => planPhase(dir, "Phase 2", [{ step: "2.1", name: "X" }])).toThrow(
      /existiert bereits in der Fortschrittstabelle/,
    );

    const progressPath = join(dir, "PROGRESS.md");
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8").replace(
        "- **2.3 U22 Lade-/Leerzustände**",
        "- **2.3 U22 Lade-/Leerzustände**\n- **2.4 Schon im Scope**",
      ),
      "utf8",
    );
    expect(() => planPhase(dir, "Phase 2", [{ step: "2.4", name: "Nochmal" }])).toThrow(
      /2\.4/,
    );
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
    const archive = readFileSync(join(dir, "docs", "archive", "PROGRESS_ARCHIVE.p2.md"), "utf8");
    expect(archive).toContain("### Phase 2 — UI-Polish");
    expect(archive).toContain("**Verifikation:** Suite 132/132 grün");
  });
});

describe("progress_update checkpoint (L2, 9.10)", () => {
  function tempPhaseReady(): string {
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
    return dir;
  }

  it("phase completion with checkpoint-only writes it into the Verifikation line", () => {
    const dir = tempPhaseReady();
    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅", { checkpoint: "abc1234" });

    expect(plan.completedPhase).toBe(true);
    expect(plan.checkpoint).toBe("abc1234");
    const archiveChange = plan.changes.find((c) => c.file.endsWith("PROGRESS_ARCHIVE.p2.md"))!;
    expect(archiveChange.after).toContain("**Verifikation:** (checkpoint: abc1234)");
  });

  it("note and checkpoint combine into one Verifikation line", () => {
    const dir = tempPhaseReady();
    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅", {
      note: "Suite grün",
      checkpoint: "0123456789abcdef",
    });

    const archiveChange = plan.changes.find((c) => c.file.endsWith("PROGRESS_ARCHIVE.p2.md"))!;
    expect(archiveChange.after).toContain("**Verifikation:** Suite grün (checkpoint: 0123456789abcdef)");
  });

  it("survives the apply roundtrip verbatim", () => {
    const dir = tempPhaseReady();
    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅", {
      dryRun: false,
      checkpoint: "abc1234",
    });
    const result = applyProgressPlan(plan);

    expect(result.verification.ok).toBe(true);
    const archive = readFileSync(join(dir, "docs", "archive", "PROGRESS_ARCHIVE.p2.md"), "utf8");
    expect(archive).toContain("**Verifikation:** (checkpoint: abc1234)");
  });

  it("rejects malformed checkpoint SHAs", () => {
    const dir = tempPhaseReady();
    expect(() => planProgressUpdate(dir, "Phase 2", "2.1", "✅", { checkpoint: "xyz" })).toThrow(/checkpoint/);
    expect(() => planProgressUpdate(dir, "Phase 2", "2.1", "✅", { checkpoint: "abc12" })).toThrow(/checkpoint/);
    expect(() => planProgressUpdate(dir, "Phase 2", "2.1", "✅", { checkpoint: "g123456" })).toThrow(/checkpoint/);
  });
});

describe("doc-sync reminder on phase completion (L4, 9.11)", () => {
  function tempPhaseReady(): string {
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
    return dir;
  }

  it("phase completion plan carries the static reminder", () => {
    const dir = tempPhaseReady();
    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅", { checkpoint: "abc1234" });

    expect(plan.completedPhase).toBe(true);
    expect(plan.docSyncReminder).toContain("Doku-Sync prüfen");
    expect(plan.docSyncReminder).toContain("AGENTS-Kickoff");
    expect(plan.docSyncReminder).toContain("README");
    expect(plan.docSyncReminder).toContain("PLAYBOOK-Kopien");
  });

  it("non-completion answers stay unchanged", () => {
    const dir = tempCopy("project-a");
    const plan = planProgressUpdate(dir, "Phase 2", "2.2", "🔄");
    expect(plan.completedPhase).toBe(false);
    expect(plan.docSyncReminder).toBeUndefined();
  });

  it("apply verification messages include the reminder", () => {
    const dir = tempPhaseReady();
    const plan = planProgressUpdate(dir, "Phase 2", "2.1", "✅", { dryRun: false });
    const result = applyProgressPlan(plan);

    expect(result.verification.ok).toBe(true);
    expect(result.verification.messages.some((m) => m.includes("Doku-Sync prüfen"))).toBe(true);
  });
});

describe("K1: phase completion removes exactly the own block (adjacent blocks, mixed line endings)", () => {
  const countLoneLf = (content: string): number => (content.match(/(?<!\r)\n/gu) ?? []).length;

  /**
   * Converts PROGRESS.md to CRLF and injects `stray` lone-LF line endings in the
   * preamble — the real-world internal-pwa shape (CRLF file touched by an LF edit).
   * The parsers split on /\r?\n/ (every newline); a mutation that splits on the
   * detected dominant eol only then mis-aligns block.span line numbers.
   */
  function toCrlfWithStrayLf(dir: string, stray: number): void {
    const path = join(dir, "PROGRESS.md");
    let content = readFileSync(path, "utf8").replace(/\n/gu, "\r\n");
    for (let n = 0; n < stray; n += 1) {
      const at = content.indexOf("\r\n");
      content = `${content.slice(0, at)}\n${content.slice(at + 2)}`;
    }
    writeFileSync(path, content, "utf8");
  }

  it("leaves the following block heading + scope untouched (the reported failure mode)", () => {
    const dir = tempCopy("project-j-adjacent-blocks");
    toCrlfWithStrayLf(dir, 3);

    const plan = planProgressUpdate(dir, "Phase 7", "7.2", "✅", {
      dryRun: false,
      note: "Suite grün",
    });
    expect(plan.completedPhase).toBe(true);

    const result = applyProgressPlan(plan);
    expect(result.verification.ok).toBe(true);

    const progress = readFileSync(join(dir, "PROGRESS.md"), "utf8");
    expect(progress).not.toContain("### Phase 7 — Erste Phase");
    expect(progress).toContain("### Phase 8 — Zweite Phase");
    expect(progress).toContain("**Ziel:** Zweite Phase läuft.");
    expect(progress).toContain("- **8.1 Gamma**");
    expect(progress).toContain("- **8.2 Delta**");
    expect(progress).not.toMatch(/\n{3,}/u);
    expect(countLoneLf(progress)).toBe(0);
  });

  it("archives the completed block verbatim (pure LF, adjacent blocks)", () => {
    const dir = tempCopy("project-j-adjacent-blocks");
    const plan = planProgressUpdate(dir, "Phase 7", "7.2", "✅", {
      dryRun: false,
      note: "Suite grün",
    });
    const result = applyProgressPlan(plan);
    expect(result.verification.ok).toBe(true);

    // H12/32.2: Phase 7 completion lands on its own shard (8.1 keeps running)
    const archive = readFileSync(join(dir, "docs", "archive", "PROGRESS_ARCHIVE.p7.md"), "utf8");
    expect(archive).toContain("### Phase 7 — Erste Phase");
    expect(archive).toContain("- **7.2 Beta**");
    expect(archive).toContain("**Verifikation:** Suite grün");
  });
});

describe("considerWorktrees exclusions (M20/30.5)", () => {
  it("backlog_add skips excluded ids when auto-assigning the series number", () => {
    const dir = tempCopy("project-a");
    const plan = planBacklogAdd(dir, {
      section: "HOCH",
      title: "Fremd kollidiert",
      priority: "🟡",
      excludeIds: ["M8", "M9"], // own M-series ends at M7 (archives) — force past the next two
    });
    expect(plan.id).toBe("M10");
  });

  it("explicit ids are never filtered (explicit is explicit)", () => {
    const dir = tempCopy("project-a");
    const plan = planBacklogAdd(dir, {
      section: "HOCH",
      title: "Explizit bleibt explizit",
      priority: "🟡",
      id: "M20",
    });
    expect(plan.id).toBe("M20");
  });

  it("planPhase refuses phases and steps occupied in foreign worktrees", () => {
    const dir = tempCopy("project-a");
    expect(() =>
      planPhase(dir, "Phase 30 — Kollision", [{ step: "30.1", name: "A" }], { excludePhases: ["30"] }),
    ).toThrow(/phase 30.*foreign worktree/u);
    expect(() =>
      planPhase(dir, "Phase 31 — Kollision", [{ step: "31.1", name: "A" }], { excludeSteps: ["31.1"] }),
    ).toThrow(/31\.1.*foreign worktree/u);
  });
});

describe("backlog_update position (L17/30.7)", () => {
  it("moves a block to the top of its section, the rest byte-identical", () => {
    const dir = tempCopy("project-a");
    const result = applyBacklogUpdatePlan(planBacklogUpdate(dir, "H2", { position: "top", dryRun: false }));
    expect(result.verification.ok).toBe(true);
    const text = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    expect(text.indexOf("### [ ] H2 — Session-Cookie")).toBeLessThan(text.indexOf("### [ ] H1 — Upload-Endpunkt"));
    expect(text).toContain("### [ ] H1 — Upload-Endpunkt ohne Größenlimit — 🟠");
    expect(text).toContain("- **Ort:** `src/auth/session.ts:18` (Cookie-Serializer)");
  });

  it("moves to the bottom and honors numeric slots (1-based)", () => {
    const dir = tempCopy("project-a");
    applyBacklogUpdatePlan(planBacklogUpdate(dir, "H1", { position: "bottom", dryRun: false }));
    let text = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    expect(text.indexOf("### [ ] H1 —")).toBeGreaterThan(text.indexOf("### [ ] H2 —"));

    applyBacklogUpdatePlan(planBacklogUpdate(dir, "H1", { position: 1, dryRun: false }));
    text = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    expect(text.indexOf("### [ ] H1 —")).toBeLessThan(text.indexOf("### [ ] H2 —"));
  });

  it("combines section + position (first switch, then place)", () => {
    const dir = tempCopy("project-a");
    const result = applyBacklogUpdatePlan(
      planBacklogUpdate(dir, "H2", { section: "MITTEL", position: "top", dryRun: false }),
    );
    expect(result.verification.ok).toBe(true);
    const text = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    const mittel = text.indexOf("## 🟡 MITTEL");
    const h2 = text.indexOf("### [ ] H2 — Session-Cookie");
    expect(h2).toBeGreaterThan(mittel);
  });

  it("rejects out-of-range positions with a structured error (never clamps)", () => {
    const dir = tempCopy("project-a");
    expect(() => planBacklogUpdate(dir, "H1", { position: 99, dryRun: true })).toThrow(/out of range/u);
    expect(() => planBacklogUpdate(dir, "H1", { position: 0, dryRun: true })).toThrow(/position/u);
  });
});
