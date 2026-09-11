import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { allSynonyms, canonical, detectLocale, synonymPattern } from "../src/profile.ts";
import { docsStatus, docsValidate, parseBacklog, parseBacklogArchive, parseProgress, parseProgressArchive } from "../src/index.ts";

const fixtures = join(import.meta.dirname, "fixtures");
const readFixture = (...parts: string[]): string =>
  readFileSync(join(fixtures, ...parts), "utf8");

describe("project-c-en — English files parse without configuration (4.1)", () => {
  const backlog = parseBacklog(readFixture("project-c-en", "BACKLOG.md"));
  const progress = parseProgress(readFixture("project-c-en", "PROGRESS.md"));

  it("parses the English BACKLOG with zero warnings", () => {
    expect(backlog.warnings).toEqual([]);
    expect(backlog.value.items.map((i) => i.id)).toEqual(["E1", "E2", "L3", "T8"]);
    expect(backlog.value.items.every((i) => i.open)).toBe(true);
  });

  it("extracts location from **Location:** bullets", () => {
    expect(backlog.value.items[0]?.location).toBe("`src/routes/upload.ts:42` (multipart handler)");
    expect(backlog.value.items[0]?.span).toEqual({ start: 17, end: 21 });
  });

  it("detects the Done Index and its one-liners", () => {
    expect(backlog.value.doneIndex).toEqual([
      { id: "F1", summary: "Migration hardening", sha: "a1b2c3d" },
    ]);
    expect(backlog.value.sections.some((s) => s.title.includes("Done Index"))).toBe(false);
  });

  it("parses the English PROGRESS table and phase block", () => {
    expect(progress.warnings).toEqual([]);
    expect(progress.value.rows).toHaveLength(7);
    expect(progress.value.rows.find((r) => r.step === "2.2")?.status).toBe("⬜");
    const phase = progress.value.phases[0]!;
    expect(phase.name).toBe("Phase 2");
    expect(phase.title).toBe("UI Polish");
    expect(phase.goal).toBe("The admin area feels right for laypeople (see BACKLOG).");
    expect(phase.acceptance).toBe("typecheck + unit + e2e green; U21/U22 completed.");
    expect(phase.scope).toHaveLength(4);
  });

  it("parses the English archives (Done line, completed marker, Verification)", () => {
    const items = parseBacklogArchive(readFixture("project-c-en", "docs", "archive", "BACKLOG_ARCHIVE.md"));
    expect(items.warnings).toEqual([]);
    expect(items.value[0]?.id).toBe("F1");
    expect(items.value[0]?.open).toBe(false);
    expect(items.value[0]?.doneLine).toBe("Commit `a1b2c3d` (08/2026).");

    const phases = parseProgressArchive(readFixture("project-c-en", "docs", "archive", "PROGRESS_ARCHIVE.md"));
    expect(phases.warnings).toEqual([]);
    expect(phases.value[0]?.completedOn).toBe("07/2026");
    expect(phases.value[0]?.verification).toBe("typecheck + 120 tests green; smoke deploy to staging.");
  });

  it("validates clean and aggregates (docsValidate, docsStatus)", () => {
    const root = join(fixtures, "project-c-en");
    const validation = docsValidate(root);
    expect(validation.findings).toEqual([]);
    expect(validation.warnings).toEqual([]);
    expect(validation.ok).toBe(true);

    const status = docsStatus(root);
    expect(status.openTotal).toBe(4);
    expect(status.runningSteps.map((r) => r.step)).toEqual(["2.1"]);
    expect(status.runningPhases).toEqual(["Phase 2 — UI Polish"]);
  });
});

describe("locale profiles — synonyms and detection (4.1)", () => {
  it("detects the language of document content", () => {
    expect(detectLocale(readFixture("project-a", "BACKLOG.md"))).toBe("de");
    expect(detectLocale(readFixture("project-c-en", "BACKLOG.md"))).toBe("en");
    expect(detectLocale(readFixture("project-c-en", "PROGRESS.md"))).toBe("en");
    expect(detectLocale("", "")).toBe("en");
  });

  it("exposes canonical strings per locale for generation", () => {
    expect(canonical("doneWord", "de")).toBe("erledigt");
    expect(canonical("doneWord", "en")).toBe("done");
    expect(canonical("doneLabel", "en")).toBe("Done");
    expect(canonical("scopeLabel", "en")).toBe("Scope");
    expect(canonical("verificationLabel", "en")).toBe("Verification");
  });

  it("builds union patterns across all locales", () => {
    const pattern = synonymPattern("doneIndexHeading");
    expect(pattern.test("Erledigt-Index")).toBe(true);
    expect(pattern.test("done index")).toBe(true);
    expect(pattern.test("Fortschritt")).toBe(false);
    expect(allSynonyms("locationLabel")).toEqual(["Ort", "Location"]);
  });

  it("tolerates legacy DE bullet labels in EN open files (Decision 10)", () => {
    const mixedBullets = [
      "# BACKLOG.md — Open (As of: 260911/1430)",
      "",
      "## 🟠 HIGH",
      "",
      "### [ ] L1 — Item with legacy DE bullets — 🟠",
      "- **Ort:** legacy DE location",
      "- **Abnahme:** legacy DE acceptance",
      "",
    ].join("\n");
    const r = parseBacklog(mixedBullets);
    expect(r.warnings).toEqual([]);
    expect(r.value.items[0]?.location).toBe("legacy DE location");
    expect(r.value.items[0]?.text).toContain("legacy DE acceptance");
  });
});

describe("project-g-mixed — EN open files + DE archives (I1/14.5)", () => {
  const root = join(fixtures, "project-g-mixed");
  const backlog = parseBacklog(readFixture("project-g-mixed", "BACKLOG.md"));
  const progress = parseProgress(readFixture("project-g-mixed", "PROGRESS.md"));

  it("parses the EN BACKLOG without warnings", () => {
    expect(backlog.warnings).toEqual([]);
    expect(backlog.value.items.map((i) => i.id)).toEqual(["M1", "M2", "M3", "M4"]);
    expect(backlog.value.items.every((i) => i.open)).toBe(true);
    expect(backlog.value.sections.map((s) => [s.emoji, s.title])).toEqual([
      ["🔴", "CRITICAL"],
      ["🟠", "HIGH"],
      ["🟡", "MEDIUM"],
      ["🟢", "LOW"],
      ["🔵", "TEST GAPS"],
    ]);
    expect(backlog.value.doneIndex).toEqual([
      { id: "S1", summary: "Pilot setup", sha: "b1c2d3e" },
      { id: "A1", summary: "Initial migration hardening", sha: "a1b2c3d" },
      { id: "A2", summary: "Session cookie hardening", sha: "c3d4e5f" },
    ]);
  });

  it("captures the Location field in EN and surfaces the legacy-DE item body intact", () => {
    expect(backlog.value.items[0]?.location).toContain("Historical BACKLOG items");
    expect(backlog.value.items[0]?.text).toContain("**Acceptance:**");
  });

  it("parses the EN PROGRESS table and phase block without warnings", () => {
    expect(progress.warnings).toEqual([]);
    expect(progress.value.rows).toHaveLength(5);
    expect(progress.value.rows.find((r) => r.step === "14.5")?.status).toBe("🔄");
    const phase = progress.value.phases[0]!;
    expect(phase.name).toBe("Phase 14");
    expect(phase.title).toBe("Language switch: English primary");
    expect(phase.goal).toContain("English");
    expect(phase.scope).toHaveLength(2);
  });

  it("parses DE archives without warnings (append-only, never re-locale'd)", () => {
    const items = parseBacklogArchive(readFixture("project-g-mixed", "docs", "archive", "BACKLOG_ARCHIVE.md"));
    expect(items.warnings).toEqual([]);
    expect(items.value.map((i) => [i.id, i.open, i.doneLine])).toEqual([
      ["S1", false, "Commit `b1c2d3e` (02/2024)."],
      ["A1", false, "Commit `a1b2c3d` (03/2024)."],
      ["A2", false, "Commit `c3d4e5f` (06/2024)."],
    ]);

    const phases = parseProgressArchive(readFixture("project-g-mixed", "docs", "archive", "PROGRESS_ARCHIVE.md"));
    expect(phases.warnings).toEqual([]);
    expect(phases.value.map((p) => p.name)).toEqual(["Phase 0", "Phase 1"]);
    expect(phases.value[0]?.completedOn).toBe("01/2024");
    expect(phases.value[0]?.verification).toContain("typecheck");
  });

  it("validates clean across EN open + DE archive (Decision 10 migration)", () => {
    const validation = docsValidate(root);
    expect(validation.findings).toEqual([]);
    expect(validation.warnings).toEqual([]);
    expect(validation.ok).toBe(true);

    const status = docsStatus(root);
    expect(status.openTotal).toBe(4);
    expect(status.runningSteps.map((r) => r.step)).toEqual(["14.5"]);
    expect(status.runningPhases).toEqual(["Phase 14 — Language switch: English primary"]);
  });

  it("detects the locale per file (EN open, DE archive)", () => {
    expect(detectLocale(readFixture("project-g-mixed", "BACKLOG.md"))).toBe("en");
    expect(detectLocale(readFixture("project-g-mixed", "PROGRESS.md"))).toBe("en");
    expect(detectLocale(readFixture("project-g-mixed", "docs", "archive", "BACKLOG_ARCHIVE.md"))).toBe("de");
    expect(detectLocale(readFixture("project-g-mixed", "docs", "archive", "PROGRESS_ARCHIVE.md"))).toBe("de");
  });

  it("does NOT emit a STRUCT_LOCALE warning for legacy DE labels in EN files (I1/14.6)", () => {
    const validation = docsValidate(root);
    expect(validation.findings.map((f) => f.code)).not.toContain("STRUCT_LOCALE");
    expect(validation.warnings.map((w) => w.code)).not.toContain("STRUCT_LOCALE");
  });
});
