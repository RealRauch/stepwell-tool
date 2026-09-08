import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseBacklogArchive, parseProgressArchive } from "../src/archive.ts";
import { backlogShow, loadProject } from "../src/project.ts";
import type { ArchiveItem, ParseResult, PhaseBlock } from "../src/types.ts";

const fixtures = join(import.meta.dirname, "fixtures");

const readFixture = (...parts: string[]): string =>
  readFileSync(join(fixtures, ...parts), "utf8");

const parseItems = (...parts: string[]): ParseResult<ArchiveItem[]> =>
  parseBacklogArchive(readFixture(...parts));

const parsePhases = (...parts: string[]): ParseResult<PhaseBlock[]> =>
  parseProgressArchive(readFixture(...parts));

describe("parseBacklogArchive — project-a", () => {
  const result = parseItems("project-a", "docs", "archive", "BACKLOG_ARCHIVE.md");

  it("parses archived item blocks with done lines, no warnings", () => {
    expect(result.warnings).toEqual([]);
    expect(result.value.map((i) => [i.id, i.title, i.priority])).toEqual([
      ["S1", "Schema-Migration 001→002 abgesichert", "🔴"],
      ["S2", "Env-Config failt hart bei fehlenden Secrets", "🔴"],
      ["M7", "Duplizierte Geo-Logik auf Shared-Helper umgestellt", "🟡"],
    ]);
    expect(result.value.every((i) => i.open === false)).toBe(true);
    expect(result.value[0]?.doneLine).toBe(
      "Commit `a1b2c3d` (08/2026), Verifikation: 120/120 Tests grün.",
    );
    expect(result.value[2]?.doneLine).toBe("Commit `c3d4e5f` (09/2026).");
    expect(result.value[0]?.span).toEqual({ start: 8, end: 13 });
    expect(result.value[0]?.location).toBe("`db/migrations/002_*.sql`");
    expect(result.value[0]?.raw).toContain("*(erledigt 08/2026)*");
    expect(result.value[0]?.raw.startsWith("### [x] S1")).toBe(true);
  });
});

describe("parseBacklogArchive — project-b-drift", () => {
  it("parses the Z9 orphan block tolerantly", () => {
    const result = parseItems("project-b-drift", "docs", "archive", "BACKLOG_ARCHIVE.md");
    expect(result.value).toHaveLength(2);
    const z9 = result.value[0]!;
    expect(z9.id).toBe("Z9");
    expect(z9.open).toBe(false);
    expect(z9.doneLine).toBe("Commit `f6a7b8c` (09/2026).");
  });

  it("warns at parse level for the Z8 suffix-drift block — suppression is the aggregation's job (W2)", () => {
    const result = parseItems("project-b-drift", "docs", "archive", "BACKLOG_ARCHIVE.md");
    expect(result.warnings.map((w) => [w.code, w.line])).toEqual([["PRIO_MISSING", 16]]);
    const z8 = result.value[1]!;
    expect(z8.id).toBe("Z8");
    expect(z8.priority).toBe("unknown");
    expect(z8.doneLine).toBe("Commit `x9y8z7a` (09/2026).");
  });
});

describe("parseProgressArchive", () => {
  it("re-parses archived phase blocks including empty archives", () => {
    const drift = parsePhases("project-b-drift", "docs", "archive", "PROGRESS_ARCHIVE.md");
    expect(drift.value).toEqual([]);
    expect(drift.warnings).toEqual([]);
    const a = parsePhases("project-a", "docs", "archive", "PROGRESS_ARCHIVE.md");
    expect(a.value).toHaveLength(2);
  });
});

describe("loadProject — 4-file obligation", () => {
  it("loads all four fixture files lazily", () => {
    const docs = loadProject(join(fixtures, "project-a"));
    expect(docs.root.endsWith("project-a")).toBe(true);
    expect(docs.backlog().value.items).toHaveLength(7);
    expect(docs.progress().value.rows).toHaveLength(9);
    expect(docs.backlogArchive().value).toHaveLength(3);
    expect(docs.progressArchive().value).toHaveLength(2);
  });

  it("memoizes parses within one loadProject instance", () => {
    const docs = loadProject(join(fixtures, "project-a"));
    expect(docs.backlog()).toBe(docs.backlog());
  });

  it("hard-fails listing all missing files", () => {
    expect(() => loadProject(join(fixtures, "does-not-exist"))).toThrow(
      /BACKLOG\.md.*PROGRESS\.md/s,
    );
  });
});

describe("backlogShow — merge view open ↔ index ↔ archive", () => {
  it("returns the open item for open IDs", () => {
    const entry = backlogShow(join(fixtures, "project-a"), "H1");
    expect(entry?.id).toBe("H1");
    expect(entry?.item?.title).toBe("Upload-Endpunkt ohne Größenlimit");
    expect(entry?.item?.raw.startsWith("### [ ] H1")).toBe(true);
    expect(entry?.done).toBeUndefined();
    expect(entry?.archive).toBeUndefined();
  });

  it("merges done index and archive for archived IDs", () => {
    const entry = backlogShow(join(fixtures, "project-a"), "S1");
    expect(entry?.done?.summary).toBe("Schema-Migration 001→002 abgesichert");
    expect(entry?.done?.sha).toBe("a1b2c3d");
    expect(entry?.archive?.doneLine).toContain("`a1b2c3d`");
    expect(entry?.archive?.raw.startsWith("### [x] S1")).toBe(true);
    expect(entry?.item).toBeUndefined();
  });

  it("matches IDs case-sensitively and returns undefined for unknown IDs", () => {
    expect(backlogShow(join(fixtures, "project-a"), "h1")).toBeUndefined();
    expect(backlogShow(join(fixtures, "project-a"), "NOPE")).toBeUndefined();
  });

  it("hard-fails on projects with missing files", () => {
    expect(() => backlogShow(join(fixtures, "does-not-exist"), "H1")).toThrow(
      /missing required file/,
    );
  });
});
