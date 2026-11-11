import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callTool, connect, git, payload, projectA, projectDrift, tempGitProject, tempProject } from "./helper.ts";

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

  it("returns isError for projects with missing files (partial inventory)", async () => {
    const dir = tempProject("project-a");
    rmSync(join(dir, "BACKLOG.md"));
    const c = await connect();
    try {
      const result = await callTool(c, "backlog_list", { root: dir });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("missing required file");
    } finally {
      await c.close();
    }
  });
});

describe("backlog_list field projection (12.2, E1/2)", () => {
  it("projects items to the requested fields for overview calls", async () => {
    const c = await connect();
    try {
      const data = payload(
        await callTool(c, "backlog_list", {
          root: projectA,
          fields: ["id", "title", "priority", "open", "section"],
        }),
      );
      expect(data.count).toBe(7);
      for (const item of data.items) {
        expect(Object.keys(item).sort()).toEqual(["id", "open", "priority", "section", "title"]);
      }
    } finally {
      await c.close();
    }
  });

  it("projects single fields selectively (e.g. id + text)", async () => {
    const c = await connect();
    try {
      const data = payload(
        await callTool(c, "backlog_list", { root: projectA, fields: ["id", "text"] }),
      );
      const h1 = data.items.find((i: { id: string }) => i.id === "H1");
      expect(Object.keys(h1).sort()).toEqual(["id", "text"]);
      expect(typeof h1.text).toBe("string");
    } finally {
      await c.close();
    }
  });

  it("keeps the full shape (minus raw) when fields is omitted", async () => {
    const c = await connect();
    try {
      const data = payload(await callTool(c, "backlog_list", { root: projectA }));
      const h1 = data.items.find((i: { id: string }) => i.id === "H1");
      expect(h1).not.toHaveProperty("raw");
      expect(h1).toHaveProperty("text");
      expect(h1).toHaveProperty("span");
    } finally {
      await c.close();
    }
  });

  it("rejects unknown field names with a tool error", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "backlog_list", {
        root: projectA,
        fields: ["id", "nope"],
      });
      expect(result.isError).toBe(true);
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

describe("backlog_add considerWorktrees (M20/30.5)", () => {
  it("skips ids occupied in foreign worktree doc states", async () => {
    const c = await connect();
    const main = tempGitProject("project-a");
    const work = `${main}-ws`;
    git(main, ["worktree", "add", "-b", "feature", work]);
    const backlogPath = join(work, "BACKLOG.md");
    writeFileSync(
      backlogPath,
      readFileSync(backlogPath, "utf8").replace(
        "## 🟡 MITTEL\n\n> Keine offenen Items.",
        "## 🟡 MITTEL\n\n### [ ] M8 — Fremder Worktree hat diese Nummer — 🟡\n- **Location:** `src/foreign.ts`\n- **Problem:** Kollisions-Fixture",
      ),
      "utf8",
    );
    git(work, ["add", "-A"]);
    git(work, ["commit", "-m", "foreign M20"]);
    try {
      const result = await callTool(c, "backlog_add", {
        root: main,
        section: "HOCH",
        title: "Kollisions-Kandidat",
        priority: "🟡",
        considerWorktrees: true,
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result) as { id: string };
      expect(data.id).toBe("M9"); // project-a M-series ends at M7; foreign worktree occupies M8
    } finally {
      await c.close();
      rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); // M19 hygiene
    }
  });

  it("falls back with a warning when the root is not a git repo", async () => {
    const c = await connect();
    const dir = tempProject("project-a");
    try {
      const result = await callTool(c, "backlog_add", {
        root: dir,
        section: "HOCH",
        title: "Ohne git",
        priority: "🟡",
        considerWorktrees: true,
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result) as { id: string; worktreeWarnings: string[] };
      expect(data.id).toBe("M8");
      expect(data.worktreeWarnings[0]).toMatch(/considerWorktrees/iu);
    } finally {
      await c.close();
    }
  });
});

describe("backlog_list ready filter + dependency fields (M21/30.6)", () => {
  const projectLdeps = join(import.meta.dirname, "..", "..", "core", "tests", "fixtures", "project-l-deps");

  it("ready: true yields exactly the open items without open ancestors", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "backlog_list", { root: projectLdeps, ready: true });
      expect(result.isError).toBeFalsy();
      const data = payload(result) as { items: Array<{ id: string; ready: boolean }> };
      expect(data.items.map((i) => i.id)).toEqual(["X3"]);
      expect(data.items[0]?.ready).toBe(true);
    } finally {
      await c.close();
    }
  });

  it("projects the derived dependency fields", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "backlog_list", {
        root: projectLdeps,
        fields: ["id", "dependsOn", "blockedBy", "ready"],
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result) as { items: Array<Record<string, unknown>> };
      const x1 = data.items.find((i) => i["id"] === "X1");
      expect(x1).toEqual({ id: "X1", dependsOn: ["X2"], blockedBy: ["X2", "X3"], ready: false });
    } finally {
      await c.close();
    }
  });
});
