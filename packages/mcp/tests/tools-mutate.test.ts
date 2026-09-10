import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callTool, connect, payload, projectA, tempProject } from "./helper.ts";

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

  it("generates English markers with the locale parameter (4.2)", async () => {
    const dir = tempProject("project-a");
    const c = await connect();
    try {
      const result = await callTool(c, "archive_item", {
        root: dir,
        id: "H2",
        note: "Commit `9f8e7d6`",
        locale: "en",
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      const backlogChange = data.changes.find((ch: { file: string }) => ch.file.endsWith("BACKLOG.md"));
      expect(backlogChange.after).toContain("- H2 — Session-Cookie ohne SameSite — done (Commit `9f8e7d6`)");
    } finally {
      await c.close();
    }
  });

  it("applies with dryRun:false on a temp copy and returns verification (3.2)", async () => {
    const dir = tempProject("project-a");
    const c = await connect();
    try {
      const result = await callTool(c, "archive_item", {
        root: dir,
        id: "L3",
        note: "Commit `c0ffee0`",
        dryRun: false,
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.written).toHaveLength(2);
      expect(data.verification.ok).toBe(true);
    } finally {
      await c.close();
    }
    const backlog = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    expect(backlog).not.toContain("### [ ] L3");
    expect(backlog).toContain("- L3 — Docs-Build-Warnungen aufräumen — erledigt (Commit `c0ffee0`)");
  });
});

describe("tool progress_update title param (T2, 6.8)", () => {
  it("renames the block heading via the title parameter", async () => {
    const dir = tempProject("project-a");
    const c = await connect();
    try {
      const result = await callTool(c, "progress_update", {
        root: dir,
        phase: "Phase 2",
        step: "2.3",
        status: "🔄",
        title: "Polish & i18n",
        dryRun: false,
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.verification.ok).toBe(true);
    } finally {
      await c.close();
    }
    const progress = readFileSync(join(dir, "PROGRESS.md"), "utf8");
    expect(progress).toContain("### Phase 2 — Polish & i18n");
    expect(progress).toContain("| 2.3 | U22 Ladezustände | 🔄 |");
  });
});

describe("tools backlog_add/update/remove (T1, 6.9)", () => {
  it("backlog_add plans by default and leaves files untouched", async () => {
    const before = readFileSync(backlogPath, "utf8");
    const c = await connect();
    try {
      const result = await callTool(c, "backlog_add", {
        root: projectA,
        section: "HOCH",
        title: "Rate-Limit für Login",
        priority: "🟠",
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.dryRun).toBe(true);
      expect(data.id).toBe("H3");
      expect(data.changes[0].after).toContain("### [ ] H3 — Rate-Limit für Login — 🟠");
    } finally {
      await c.close();
    }
    expect(readFileSync(backlogPath, "utf8")).toBe(before);
  });

  it("backlog_add applies and refreshes the Stand timestamp", async () => {
    const dir = tempProject("project-a");
    const c = await connect();
    try {
      const result = await callTool(c, "backlog_add", {
        root: dir,
        section: "NIEDRIG",
        title: "Docs-Syntax-Check",
        priority: "🟢",
        text: "- **Ort:** `docs/`",
        dryRun: false,
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.verification.ok).toBe(true);
    } finally {
      await c.close();
    }
    const backlog = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    expect(backlog).toContain("### [ ] L4 — Docs-Syntax-Check — 🟢");
    expect(backlog).not.toContain("260907/1200");
  });

  it("backlog_update moves the item across the priority section", async () => {
    const dir = tempProject("project-a");
    const c = await connect();
    try {
      const result = await callTool(c, "backlog_update", {
        root: dir,
        id: "H2",
        priority: "🟡",
        dryRun: false,
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.verification.ok).toBe(true);
    } finally {
      await c.close();
    }
    const backlog = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    const mittel = backlog.indexOf("## 🟡 MITTEL");
    const moved = backlog.indexOf("### [ ] H2 — Session-Cookie ohne SameSite — 🟡");
    expect(moved).toBeGreaterThan(mittel);
  });

  it("backlog_remove archives the block without an erledigt marker", async () => {
    const dir = tempProject("project-a");
    const c = await connect();
    try {
      const result = await callTool(c, "backlog_remove", {
        root: dir,
        id: "T8",
        note: "durch H3 abgedeckt",
        dryRun: false,
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.verification.ok).toBe(true);
    } finally {
      await c.close();
    }
    const backlog = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    expect(backlog).toContain("- T8 — Fehlverhalten bei leerer DB abdecken — entfernt (durch H3 abgedeckt)");
    const archive = readFileSync(join(dir, "docs", "archive", "BACKLOG_ARCHIVE.md"), "utf8");
    expect(archive).toContain("### [ ] T8");
    expect(archive).toContain("- **Entfernt:** durch H3 abgedeckt");
  });
});

describe("tool progress_plan_phase (T4, 6.10)", () => {
  it("plans a new phase with rows and skeleton, then progress_update continues without workaround", async () => {
    const dir = tempProject("project-a");
    const c = await connect();
    try {
      const result = await callTool(c, "progress_plan_phase", {
        root: dir,
        phase: "Phase 7 — Rundung",
        steps: [
          { step: "7.1", name: "Erster Step" },
          { step: "7.2", name: "Zweiter Step" },
        ],
        dryRun: false,
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.verification.ok).toBe(true);

      const followUp = await callTool(c, "progress_update", {
        root: dir,
        phase: "Phase 7",
        step: "7.1",
        status: "🔄",
        dryRun: false,
      });
      expect(followUp.isError).toBeFalsy();
      expect(payload(followUp).verification.ok).toBe(true);
    } finally {
      await c.close();
    }
    const progress = readFileSync(join(dir, "PROGRESS.md"), "utf8");
    expect(progress).toContain("### Phase 7 — Rundung");
    expect(progress).toContain("| 7.1 | Erster Step | 🔄 |");
    expect(progress).toContain("| 7.2 | Zweiter Step | ⬜ |");
    expect(progress.match(/### Phase 7 — Rundung/gu)).toHaveLength(1);
  });

  it("rejects step numbers outside the phase as tool errors", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "progress_plan_phase", {
        root: tempProject("project-a"),
        phase: "Phase 7",
        steps: [{ step: "8.1", name: "Fremd" }],
      });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("8.1");
    } finally {
      await c.close();
    }
  });
});

describe("tool progress_update (3.3)", () => {
  const progressPath = join(projectA, "PROGRESS.md");

  it("returns the plan by default and leaves files untouched", async () => {
    const before = readFileSync(progressPath, "utf8");
    const c = await connect();
    try {
      const result = await callTool(c, "progress_update", {
        root: projectA,
        phase: "Phase 2",
        step: "2.2",
        status: "🔄",
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.dryRun).toBe(true);
      expect(data.completedPhase).toBe(false);
      expect(data.changes).toHaveLength(1);
    } finally {
      await c.close();
    }
    expect(readFileSync(progressPath, "utf8")).toBe(before);
  });

  it("applies on a temp copy and verifies (dryRun:false)", async () => {
    const dir = tempProject("project-a");
    const c = await connect();
    try {
      const result = await callTool(c, "progress_update", {
        root: dir,
        phase: "Phase 2",
        step: "2.2",
        status: "🔄",
        dryRun: false,
      });
      expect(result.isError).toBeFalsy();
      const data = payload(result);
      expect(data.verification.ok).toBe(true);
    } finally {
      await c.close();
    }
    expect(readFileSync(join(dir, "PROGRESS.md"), "utf8")).toContain("| 2.2 | U21 Fehlertexte | 🔄 |");
  });

  it("reports unknown phases as tool errors", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "progress_update", {
        root: projectA,
        phase: "Phase 42",
        step: "2.1",
        status: "✅",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("Phase 42");
    } finally {
      await c.close();
    }
  });
});

describe("plan detail level summary vs diff (12.2, E1/2)", () => {
  it("progress_update dry-run with detail:summary returns headline + line counts only", async () => {
    const c = await connect();
    try {
      const data = payload(
        await callTool(c, "progress_update", {
          root: projectA,
          phase: "Phase 2",
          step: "2.2",
          status: "🔄",
          detail: "summary",
        }),
      );
      expect(data.dryRun).toBe(true);
      expect(data.detail).toBe("summary");
      for (const ch of data.changes) {
        expect(ch).not.toHaveProperty("before");
        expect(ch).not.toHaveProperty("after");
        expect(ch).not.toHaveProperty("diff");
        expect(typeof ch.file).toBe("string");
        expect(typeof ch.description).toBe("string");
        expect(typeof ch.beforeLines).toBe("number");
        expect(typeof ch.afterLines).toBe("number");
      }
    } finally {
      await c.close();
    }
  });

  it("archive_item supports detail:summary, too", async () => {
    const c = await connect();
    try {
      const data = payload(
        await callTool(c, "archive_item", { root: projectA, id: "H1", detail: "summary" }),
      );
      expect(data.detail).toBe("summary");
      expect(data.changes[0]).not.toHaveProperty("diff");
      expect(data.changes[0].beforeLines).toBeGreaterThan(0);
    } finally {
      await c.close();
    }
  });

  it("backlog_add supports detail:summary", async () => {
    const c = await connect();
    try {
      const data = payload(
        await callTool(c, "backlog_add", {
          root: tempProject("project-a"),
          section: "MITTEL",
          title: "Test-Item — Projektion",
          priority: "🟡",
          id: "X1",
          detail: "summary",
        }),
      );
      expect(data.detail).toBe("summary");
      expect(data.changes[0]).not.toHaveProperty("before");
    } finally {
      await c.close();
    }
  });

  it("default stays diff mode (full before/after/diff, no detail marker)", async () => {
    const c = await connect();
    try {
      const data = payload(
        await callTool(c, "progress_update", {
          root: projectA,
          phase: "Phase 2",
          step: "2.2",
          status: "🔄",
        }),
      );
      expect(data.detail).toBeUndefined();
      expect(typeof data.changes[0].diff).toBe("string");
      expect(typeof data.changes[0].before).toBe("string");
    } finally {
      await c.close();
    }
  });

  it("apply answers are unaffected by detail:summary", async () => {
    const dir = tempProject("project-a");
    const c = await connect();
    try {
      const data = payload(
        await callTool(c, "progress_update", {
          root: dir,
          phase: "Phase 2",
          step: "2.2",
          status: "🔄",
          detail: "summary",
          dryRun: false,
        }),
      );
      expect(data.verification.ok).toBe(true);
      expect(data.detail).toBeUndefined();
      expect(data.written).toHaveLength(1);
    } finally {
      await c.close();
    }
  });
});
