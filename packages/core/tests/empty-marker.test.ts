import { mkdirSync, readFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyBacklogAddPlan,
  applyArchivePlan,
  docsValidate,
  planArchiveItem,
  planBacklogAdd,
  projectTemplates,
  REQUIRED_FILES,
} from "stepwell-core";

const dirs: string[] = [];

function makeTemplateProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-marker-"));
  dirs.push(dir);
  for (const rel of REQUIRED_FILES) {
    const abs = join(dir, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, projectTemplates[rel.includes("BACKLOG_ARCHIVE") ? "backlog-archive" : rel.includes("PROGRESS_ARCHIVE") ? "progress-archive" : rel === "BACKLOG.md" ? "backlog" : "progress"]);
  }
  return dir;
}

const backlog = (dir: string): string => readFileSync(join(dir, "BACKLOG.md"), "utf8");

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("empty-marker invariant (H6/27.4)", () => {
  it("backlog_add removes the section placeholder when it receives its first item", () => {
    const dir = makeTemplateProject();
    const plan = planBacklogAdd(dir, { section: "HIGH", title: "First item", priority: "🟠", dryRun: false });
    applyBacklogAddPlan(plan);

    const text = backlog(dir);
    expect(text).toContain("### [ ] H1 — First item — 🟠");
    const highSection = text.slice(text.indexOf("## 🟠 HIGH"), text.indexOf("## 🟡"));
    expect(highSection).not.toMatch(/No open items\./u);
  });

  it("backlog_add leaves marker-free sections alone and drops a German legacy marker too", () => {
    const dir = makeTemplateProject();
    // first add removes the placeholder; second add must not re-introduce anything
    applyBacklogAddPlan(planBacklogAdd(dir, { section: "HIGH", title: "One", priority: "🟠", dryRun: false }));
    applyBacklogAddPlan(planBacklogAdd(dir, { section: "HIGH", title: "Two", priority: "🟠", dryRun: false }));
    const high = backlog(dir).slice(backlog(dir).indexOf("## 🟠"), backlog(dir).indexOf("## 🟡"));
    expect(high).not.toMatch(/No open items\./u);

    // legacy German marker variant is tolerated on read and dropped on add
    const p = join(dir, "BACKLOG.md");
    const text = backlog(dir).replace("## 🟡 MEDIUM\n", "## 🟡 MEDIUM\n\n> Keine offenen Punkte.\n");
    writeFileSync(p, text);
    applyBacklogAddPlan(planBacklogAdd(dir, { section: "MEDIUM", title: "Legacy", priority: "🟡", dryRun: false }));
    const medium = backlog(dir).slice(backlog(dir).indexOf("## 🟡"), backlog(dir).indexOf("## 🟢"));
    expect(medium).not.toMatch(/Keine offenen Punkte\./u);
    expect(medium).toContain("### [ ] M1 — Legacy — 🟡");
  });

  it("archiving the last item of a section restores the placeholder", () => {
    const dir = makeTemplateProject();
    applyBacklogAddPlan(planBacklogAdd(dir, { section: "HIGH", title: "Only", priority: "🟠", dryRun: false }));
    applyArchivePlan(planArchiveItem(dir, "H1", { dryRun: false }));

    const high = backlog(dir).slice(backlog(dir).indexOf("## 🟠"), backlog(dir).indexOf("## 🟡"));
    expect(high).not.toContain("### [ ]");
    expect(high).toContain("> No open items.");
  });

  it("sections that keep items are never re-marked and validate stays clean", () => {
    const dir = makeTemplateProject();
    applyBacklogAddPlan(planBacklogAdd(dir, { section: "HIGH", title: "One", priority: "🟠", dryRun: false }));
    applyBacklogAddPlan(planBacklogAdd(dir, { section: "HIGH", title: "Two", priority: "🟠", dryRun: false }));
    applyArchivePlan(planArchiveItem(dir, "H1", { dryRun: false }));

    const high = backlog(dir).slice(backlog(dir).indexOf("## 🟠"), backlog(dir).indexOf("## 🟡"));
    expect(high).toContain("### [ ] H2 — Two — 🟠");
    expect(high).not.toMatch(/No open items\./u);
    expect(docsValidate(dir).findings.filter((f) => f.code === "EMPTY_MARKER_STALE")).toEqual([]);
  });

  it("docs_validate reports EMPTY_MARKER_STALE when a section carries items and a marker", () => {
    const dir = makeTemplateProject();
    applyBacklogAddPlan(planBacklogAdd(dir, { section: "HIGH", title: "One", priority: "🟠", dryRun: false }));
    // simulate pre-tool drift (e.g. datacraft's existing state): marker hand-inserted under a populated section
    const p = join(dir, "BACKLOG.md");
    const text = backlog(dir).replace("### [ ] H1 — One — 🟠", "> No open items.\n\n### [ ] H1 — One — 🟠");
    writeFileSync(p, text);

    const result = docsValidate(dir);
    const finding = result.findings.find((f) => f.code === "EMPTY_MARKER_STALE");
    expect(finding).toBeDefined();
    expect(finding?.file).toContain("BACKLOG.md");
    expect(finding?.line).toBeDefined();
    expect(result.ok).toBe(false);
  });
});
