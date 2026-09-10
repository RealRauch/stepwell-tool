import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callTool, connect, fixtures, payload, tempProject } from "./helper.ts";
import type { ToolResultLike } from "./helper.ts";

const emptyRoot = join(fixtures, "project-empty");

describe("compact JSON + structuredContent opt-in (E1/1, 12.1)", () => {
  it("tool text payloads are compact JSON (no indentation, no newlines)", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "docs_validate", { root: tempProject("project-a") });
      expect(result.isError).toBeFalsy();
      const text = result.content[0]!.text;
      expect(text).not.toContain("\n");
      expect(payload(result).ok).toBe(true);
    } finally {
      await c.close();
    }
  });

  it("structured error payloads are compact JSON, too", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "backlog_show", { root: emptyRoot, id: "H1" });
      expect(result.isError).toBe(true);
      const text = result.content[0]!.text;
      expect(text).not.toContain("\n");
      expect(payload(result).code).toBe("PROJECT_NOT_INITIALIZED");
    } finally {
      await c.close();
    }
  });
});

describe("structuredContent opt-in (E1/2 of M3 contract, 12.1)", () => {
  it("docs_validate omits structuredContent by default and delivers it with structured: true", async () => {
    const c = await connect();
    try {
      const root = tempProject("project-a");
      const plain = await callTool(c, "docs_validate", { root });
      expect(plain.structuredContent).toBeUndefined();
      const structured = await callTool(c, "docs_validate", { root, structured: true });
      expect(structured.structuredContent).toBeDefined();
      const data = structured.structuredContent as { ok: boolean; findings: unknown[] };
      expect(data.ok).toBe(true);
      expect(data.findings).toEqual([]);
      // text payload stays parseable in both modes
      expect(payload(structured).ok).toBe(true);
    } finally {
      await c.close();
    }
  });

  it("progress_update omits structuredContent by default and delivers it with structured: true", async () => {
    const c = await connect();
    try {
      const root = tempProject("project-a");
      const plain = await callTool(c, "progress_update", {
        root,
        phase: "Phase 2",
        step: "2.2",
        status: "🔄",
      });
      expect(plain.structuredContent).toBeUndefined();
      const structured = await callTool(c, "progress_update", {
        root,
        phase: "Phase 2",
        step: "2.2",
        status: "🔄",
        structured: true,
      });
      const data = structured.structuredContent as {
        step?: string;
        completedPhase?: boolean;
        changes?: unknown[];
      };
      expect(data.step).toBe("2.2");
      expect(data.completedPhase).toBe(false);
      expect(Array.isArray(data.changes)).toBe(true);
    } finally {
      await c.close();
    }
  });

  it("archive_item omits structuredContent by default and delivers it with structured: true", async () => {
    const c = await connect();
    try {
      const root = tempProject("project-a");
      const plain = await callTool(c, "archive_item", { root, id: "H1", note: "test" });
      expect(plain.structuredContent).toBeUndefined();
      const structured = await callTool(c, "archive_item", {
        root,
        id: "H1",
        note: "test",
        structured: true,
      });
      const data = structured.structuredContent as { id?: string; dryRun?: boolean };
      expect(data.id).toBe("H1");
      expect(data.dryRun).toBe(true);
    } finally {
      await c.close();
    }
  });

  it("isError results carry no structuredContent even with structured: true", async () => {
    const c = await connect();
    try {
      const result: ToolResultLike = await callTool(c, "archive_item", {
        root: emptyRoot,
        id: "H1",
        structured: true,
      });
      expect(result.isError).toBe(true);
      expect(result.structuredContent).toBeUndefined();
      expect(payload(result).code).toBe("PROJECT_NOT_INITIALIZED");
    } finally {
      await c.close();
    }
  });

  it("read tools stay plain text payloads", async () => {
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
