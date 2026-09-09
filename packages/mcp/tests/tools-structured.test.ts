import { describe, expect, it } from "vitest";
import { callTool, connect, payload, tempProject } from "./helper.ts";

describe("structuredContent (M3, 9.7)", () => {
  it("docs_validate delivers findings additionally as structuredContent", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "docs_validate", { root: tempProject("project-a") });
      expect(result.isError).toBeFalsy();
      expect(result.structuredContent).toBeDefined();
      const structured = result.structuredContent as { ok: boolean; findings: unknown[] };
      expect(structured.ok).toBe(true);
      expect(structured.findings).toEqual([]);
      // text payload stays untouched and parseable
      expect(payload(result).ok).toBe(true);
    } finally {
      await c.close();
    }
  });

  it("progress_update delivers the plan additionally as structuredContent", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "progress_update", {
        root: tempProject("project-a"),
        phase: "Phase 2",
        step: "2.2",
        status: "🔄",
      });
      expect(result.isError).toBeFalsy();
      const structured = result.structuredContent as {
        step?: string;
        completedPhase?: boolean;
        changes?: unknown[];
      };
      expect(structured.step).toBe("2.2");
      expect(structured.completedPhase).toBe(false);
      expect(Array.isArray(structured.changes)).toBe(true);
    } finally {
      await c.close();
    }
  });

  it("archive_item delivers the plan additionally as structuredContent", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "archive_item", {
        root: tempProject("project-a"),
        id: "H1",
        note: "test",
      });
      expect(result.isError).toBeFalsy();
      const structured = result.structuredContent as { id?: string; dryRun?: boolean };
      expect(structured.id).toBe("H1");
      expect(structured.dryRun).toBe(true);
    } finally {
      await c.close();
    }
  });

  it("read tools stay plain text payloads (scope: the three candidates only)", async () => {
    const c = await connect();
    try {
      const status = await callTool(c, "docs_status", { root: tempProject("project-a") });
      expect(status.structuredContent).toBeUndefined();
      const list = await callTool(c, "backlog_list", { root: tempProject("project-a") });
      expect(list.structuredContent).toBeUndefined();
    } finally {
      await c.close();
    }
  });
});
