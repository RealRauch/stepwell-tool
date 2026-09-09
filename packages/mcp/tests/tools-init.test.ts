import { rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callTool, connect, fixtures, payload, tempProject } from "./helper.ts";

const emptyRoot = join(fixtures, "project-empty");

describe("init fallback — root without STEPWELL project (9.3/M5)", () => {
  it("docs_validate returns exactly one PROJECT_NOT_INITIALIZED finding", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "docs_validate", { root: emptyRoot });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.findings).toHaveLength(1);
      expect(data.findings[0]!.code).toBe("PROJECT_NOT_INITIALIZED");
      expect(data.findings[0]!.message).toMatch(/PLAYBOOK/);
      expect(data.warnings).toEqual([]);
      expect(data.ok).toBe(false);
    } finally {
      await c.close();
    }
  });

  it("docs_status returns the zero aggregate with the init finding", async () => {
    const c = await connect();
    try {
      const data = payload(await callTool(c, "docs_status", { root: emptyRoot }));
      expect(data.openTotal).toBe(0);
      expect(data.runningSteps).toEqual([]);
      expect(data.doneQuote).toEqual({ done: 0, total: 0, percent: 0 });
      expect(data.warnings).toHaveLength(1);
      expect(data.warnings[0]!.code).toBe("PROJECT_NOT_INITIALIZED");
    } finally {
      await c.close();
    }
  });

  it("read and mutation tools answer with the structured init error, not file-per-file errors", async () => {
    const c = await connect();
    try {
      const cases: Array<[string, Record<string, unknown>]> = [
        ["backlog_list", { root: emptyRoot }],
        ["progress_list", { root: emptyRoot }],
        ["backlog_show", { root: emptyRoot, id: "H1" }],
        ["progress_show", { root: emptyRoot, phase: "Phase 1" }],
        ["archive_item", { root: emptyRoot, id: "H1" }],
        ["progress_update", { root: emptyRoot, phase: "Phase 1", step: "1.1", status: "🔄" }],
      ];
      for (const [tool, args] of cases) {
        const result = await callTool(c, tool, args);
        expect(result.isError, tool).toBe(true);
        const data = payload(result);
        expect(data.code, tool).toBe("PROJECT_NOT_INITIALIZED");
        expect(data.missing, tool).toHaveLength(4);
        expect(data.message, tool).toMatch(/PLAYBOOK/);
      }
    } finally {
      await c.close();
    }
  });

  it("keeps the generic per-file error for partial inventory", async () => {
    const dir = tempProject("project-a");
    rmSync(join(dir, "PROGRESS.md"));
    const c = await connect();
    try {
      const result = await callTool(c, "docs_status", { root: dir });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("missing required file");
      expect(result.content[0]?.text).not.toContain("PROJECT_NOT_INITIALIZED");
    } finally {
      await c.close();
    }
  });
});
