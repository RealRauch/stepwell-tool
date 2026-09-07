import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callTool, connect, payload, projectA, projectDrift } from "./helper.ts";

describe("tool backlog_list (2.2)", () => {
  it("lists all open items without raw payload", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "backlog_list", { root: projectA });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.count).toBe(7);
      expect(data.items.map((i: { id: string }) => i.id)).toEqual([
        "H1", "H2", "L3", "T8", "R4", "U21", "U22",
      ]);
      for (const item of data.items) {
        expect(item).not.toHaveProperty("raw");
      }
      expect(data.warnings).toEqual([]);
    } finally {
      await c.close();
    }
  });

  it("filters by priority, open and section", async () => {
    const c = await connect();
    try {
      const prio = payload(await callTool(c, "backlog_list", { root: projectA, priority: ["🟠"] }));
      expect(prio.items.map((i: { id: string }) => i.id)).toEqual(["H1", "H2", "R4"]);

      const closed = payload(await callTool(c, "backlog_list", { root: projectA, open: false }));
      expect(closed.items).toEqual([]);

      const section = payload(await callTool(c, "backlog_list", { root: projectA, section: "HOCH" }));
      expect(section.items.map((i: { id: string }) => i.id)).toEqual(["H1", "H2"]);
    } finally {
      await c.close();
    }
  });

  it("lists drift items including closed ones and warnings", async () => {
    const c = await connect();
    try {
      const data = payload(await callTool(c, "backlog_list", { root: projectDrift }));
      expect(data.count).toBe(8);
      expect(data.items.some((i: { id: string; open: boolean }) => i.id === "H9" && i.open === false)).toBe(true);
      expect(data.warnings.length).toBeGreaterThan(0);
    } finally {
      await c.close();
    }
  });

  it("returns isError for projects with missing files", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "backlog_list", {
        root: join(projectA, "docs"),
      });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("missing required file");
    } finally {
      await c.close();
    }
  });
});

describe("tool backlog_show (2.2)", () => {
  it("returns the merged view with raw payload for an open item", async () => {
    const c = await connect();
    try {
      const data = payload(await callTool(c, "backlog_show", { root: projectA, id: "H1" }));
      expect(data.id).toBe("H1");
      expect(data.item.title).toBe("Upload-Endpunkt ohne Größenlimit");
      expect(data.item.raw).toContain("### [ ] H1");
      expect(data.item.span).toEqual({ start: 19, end: 23 });
      expect(data.done).toBeUndefined();
    } finally {
      await c.close();
    }
  });

  it("merges done index and archive for archived IDs", async () => {
    const c = await connect();
    try {
      const data = payload(await callTool(c, "backlog_show", { root: projectA, id: "S1" }));
      expect(data.done.summary).toBe("Schema-Migration 001→002 abgesichert");
      expect(data.archive.raw).toContain("### [x] S1");
      expect(data.archive.doneLine).toContain("`a1b2c3d`");
    } finally {
      await c.close();
    }
  });

  it("returns isError with clear message for unknown IDs", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "backlog_show", { root: projectA, id: "NOPE" });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("NOPE");
    } finally {
      await c.close();
    }
  });
});
