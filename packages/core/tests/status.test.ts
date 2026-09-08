import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { docsStatus } from "../src/status.ts";

const fixtures = join(import.meta.dirname, "fixtures");

describe("docsStatus — project-a (clean)", () => {
  const status = docsStatus(join(fixtures, "project-a"));

  it("counts open items by priority", () => {
    expect(status.openByPriority).toEqual({
      "🔴": 0,
      "🟠": 3,
      "🟡": 2,
      "🟢": 1,
      "🔵": 1,
      unknown: 0,
    });
    expect(status.openTotal).toBe(7);
  });

  it("reports the running step and its phase", () => {
    expect(status.runningSteps.map((r) => r.step)).toEqual(["2.1"]);
    expect(status.runningPhases).toEqual(["Phase 2 — UI-Polish"]);
  });

  it("computes the ✅ quote over the full table", () => {
    expect(status.doneQuote).toEqual({ done: 5, total: 9, percent: 56 });
  });

  it("embeds no warnings for a clean project", () => {
    expect(status.warnings).toEqual([]);
  });
});

describe("docsStatus — project-b-drift", () => {
  const status = docsStatus(join(fixtures, "project-b-drift"));

  it("aggregates drift data tolerantly", () => {
    expect(status.openByPriority).toEqual({
      "🔴": 1,
      "🟠": 0,
      "🟡": 0,
      "🟢": 4,
      "🔵": 1,
      unknown: 1,
    });
    expect(status.openTotal).toBe(7);
    expect(status.runningSteps.map((r) => r.step)).toEqual(["1.4"]);
    expect(status.runningPhases).toEqual([]);
    expect(status.doneQuote).toEqual({ done: 1, total: 4, percent: 25 });
  });

  it("embeds validate findings first, then the collected parse warnings", () => {
    expect(status.warnings.map((w) => [w.code, w.line])).toEqual([
      ["NOT_ARCHIVED", 20],
      ["ID_DUPLICATE", 43],
      ["ID_CONVENTION", 47],
      ["INDEX_WITHOUT_ARCHIVE", undefined],
      ["INDEX_WITHOUT_ARCHIVE", undefined],
      ["ARCHIVE_WITHOUT_INDEX", 8],
      ["WIP_WITHOUT_PLAN", undefined],
      ["PLAN_WITHOUT_WIP", 24],
      ["DATE_LEGACY", 1],
      ["PRIO_MISSING", 11],
      ["PRIO_DUPLICATE", 35],
      ["PRIO_MISSING", 39],
      ["BLOCK_UNSTRUCTURED", 39],
      ["PRIO_MISSING", 43],
      ["PRIO_UNKNOWN", 58],
      ["PRIO_MISSING", 66],
      ["TITLE_EMPTY", 66],
      ["STATUS_UNKNOWN", 18],
      ["ROW_INCOMPLETE", 19],
    ]);
  });

  it("does not surface parse warnings from archive files — only consistency findings (W2)", () => {
    expect(
      status.warnings.filter((w) => w.file.includes("ARCHIVE")).map((w) => w.code),
    ).toEqual(["ARCHIVE_WITHOUT_INDEX"]);
  });
});
