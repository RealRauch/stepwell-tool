import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callTool, connect, payload, projectA } from "./helper.ts";

const backlogPath = join(projectA, "BACKLOG.md");

describe("tool archive_item — dry-run only (3.1)", () => {
  it("returns the plan with diffs and leaves files untouched by default", async () => {
    const before = readFileSync(backlogPath, "utf8");
    const c = await connect();
    try {
      const result = await callTool(c, "archive_item", { root: projectA, id: "H1" });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.dryRun).toBe(true);
      expect(data.changes).toHaveLength(2);
      expect(
        data.changes.some(
          (ch: { diff: string }) =>
            ch.diff.split("\n").some((l: string) => l.startsWith("-") && l.includes("### [ ] H1")),
        ),
      ).toBe(true);
    } finally {
      await c.close();
    }
    expect(readFileSync(backlogPath, "utf8")).toBe(before);
  });

  it("rejects apply until Step 3.2 unlocks it", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "archive_item", { root: projectA, id: "H1", dryRun: false });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("3.2");
    } finally {
      await c.close();
    }
  });

  it("reports unknown ids as tool errors", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "archive_item", { root: projectA, id: "NOPE" });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("NOPE");
    } finally {
      await c.close();
    }
  });
});
