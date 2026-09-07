import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callTool, connect, payload, projectA, projectDrift } from "./helper.js";

describe("tool progress_list (2.3)", () => {
  it("lists all table rows", async () => {
    const c = await connect();
    try {
      const data = payload(await callTool(c, "progress_list", { root: projectA }));
      expect(data.count).toBe(9);
      expect(data.rows[0]).toEqual({ step: "0.1", name: "Projekt einrichten", status: "✅" });
      expect(data.rows.find((r: { step: string }) => r.step === "2.1")?.status).toBe("🔄");
      expect(data.warnings).toEqual([]);
    } finally {
      await c.close();
    }
  });

  it("filters by status", async () => {
    const c = await connect();
    try {
      const data = payload(await callTool(c, "progress_list", { root: projectA, status: "✅" }));
      expect(data.count).toBe(5);
      const drift = payload(await callTool(c, "progress_list", { root: projectDrift, status: "🔄" }));
      expect(drift.rows.map((r: { step: string }) => r.step)).toEqual(["1.4"]);
    } finally {
      await c.close();
    }
  });
});

describe("tool progress_show (2.3)", () => {
  it("returns the phase detail block with raw", async () => {
    const c = await connect();
    try {
      const data = payload(await callTool(c, "progress_show", { root: projectA, phase: "Phase 2" }));
      expect(data.name).toBe("Phase 2");
      expect(data.title).toBe("UI-Polish");
      expect(data.scope).toHaveLength(4);
      expect(data.raw).toContain("### Phase 2 — UI-Polish");
    } finally {
      await c.close();
    }
  });

  it("matches archived phases too", async () => {
    const c = await connect();
    try {
      const data = payload(await callTool(c, "progress_show", { root: projectA, phase: "Phase 0" }));
      expect(data.completedOn).toBe("07/2026");
      expect(data.verification).toContain("120 Tests grün");
    } finally {
      await c.close();
    }
  });

  it("returns isError for unknown phases", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "progress_show", { root: projectA, phase: "Phase 99" });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("Phase 99");
    } finally {
      await c.close();
    }
  });
});

describe("tool docs_status (2.3)", () => {
  it("returns the aggregate for a clean project", async () => {
    const c = await connect();
    try {
      const data = payload(await callTool(c, "docs_status", { root: projectA }));
      expect(data.openTotal).toBe(7);
      expect(data.openByPriority["🟠"]).toBe(3);
      expect(data.runningPhases).toEqual(["Phase 2 — UI-Polish"]);
      expect(data.doneQuote).toEqual({ done: 5, total: 9, percent: 56 });
      expect(data.warnings).toEqual([]);
    } finally {
      await c.close();
    }
  });

  it("embeds findings and warnings for the drift project", async () => {
    const c = await connect();
    try {
      const data = payload(await callTool(c, "docs_status", { root: projectDrift }));
      expect(data.openTotal).toBe(7);
      expect(data.runningPhases).toEqual([]);
      const codes = data.warnings.map((w: { code: string }) => w.code);
      expect(codes).toContain("NOT_ARCHIVED");
      expect(codes).toContain("PLAN_WITHOUT_WIP");
      expect(codes).toContain("DATE_LEGACY");
    } finally {
      await c.close();
    }
  });
});

describe("tool docs_validate (2.3)", () => {
  it("returns ok:true with no findings for a clean project", async () => {
    const c = await connect();
    try {
      const data = payload(await callTool(c, "docs_validate", { root: projectA }));
      expect(data.ok).toBe(true);
      expect(data.findings).toEqual([]);
      expect(data.warnings).toEqual([]);
    } finally {
      await c.close();
    }
  });

  it("returns all validate findings for the drift project", async () => {
    const c = await connect();
    try {
      const data = payload(await callTool(c, "docs_validate", { root: projectDrift }));
      expect(data.ok).toBe(false);
      expect(data.findings).toHaveLength(9);
      expect(data.warnings).toHaveLength(10);
      const codes = data.findings.map((f: { code: string }) => f.code);
      expect(codes).toEqual([
        "NOT_ARCHIVED",
        "ID_DUPLICATE",
        "ID_CONVENTION",
        "INDEX_WITHOUT_ARCHIVE",
        "INDEX_WITHOUT_ARCHIVE",
        "ARCHIVE_WITHOUT_INDEX",
        "WIP_WITHOUT_PLAN",
        "PLAN_WITHOUT_WIP",
        "DATE_LEGACY",
      ]);
    } finally {
      await c.close();
    }
  });

  it("returns isError for missing files", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "docs_validate", { root: join(projectA, "docs") });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("missing required file");
    } finally {
      await c.close();
    }
  });
});
