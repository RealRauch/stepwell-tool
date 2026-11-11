import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callTool, connect, payload, tempProject } from "./helper.ts";

// H9/30.2: the transport layer of docsRepair — a NEW destructive tool next to
// docs_validate (which stays byte-identical read-only: H4 lock + annotations).

describe("tool docs_repair (H9/30.2)", () => {
  it("defaults to dry-run: reports planned/skipped without writing", async () => {
    const c = await connect();
    const dir = tempProject("project-b-drift");
    try {
      const before = readFileSync(join(dir, "BACKLOG.md"), "utf8");
      const result = await callTool(c, "docs_repair", { root: dir });
      expect(result.isError).toBeFalsy();
      const data = payload(result) as {
        root: string;
        dryRun: boolean;
        fix: { planned: unknown[]; applied: unknown[]; skipped: unknown[] };
        verification: { ok: boolean };
      };
      expect(data.dryRun).toBe(true);
      expect(data.fix.planned).toHaveLength(3);
      expect(data.fix.applied).toEqual([]);
      expect(readFileSync(join(dir, "BACKLOG.md"), "utf8")).toBe(before);
    } finally {
      await c.close();
    }
  });

  it("applies mechanical repairs with dryRun: false and reports the refusals", async () => {
    const c = await connect();
    const dir = tempProject("project-b-drift");
    try {
      const result = await callTool(c, "docs_repair", { root: dir, dryRun: false });
      expect(result.isError).toBeFalsy();
      const data = payload(result) as {
        dryRun: boolean;
        fix: { applied: Array<{ code: string }>; skipped: Array<{ code: string; reason: string }> };
        verification: { ok: boolean; messages: string[] };
      };
      expect(data.dryRun).toBe(false);
      expect(data.fix.applied.map((a) => a.code).sort()).toEqual(["ARCHIVE_WITHOUT_INDEX", "NOT_ARCHIVED"]);
      const wipSkip = data.fix.skipped.find((s) => s.code === "WIP_WITHOUT_PLAN");
      expect(wipSkip?.reason).toMatch(/other table row/iu);
      expect(data.verification.ok).toBe(false);
    } finally {
      await c.close();
    }
  });
});
