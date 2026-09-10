import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { callTool, connect, payload, resourceMime, resourceText } from "./helper.ts";
import { TEMPLATE_KINDS, projectTemplates } from "../../core/src/templates.ts";

const tempDirs: string[] = [];
function scaffoldFromTemplates(): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-mcp-templates-"));
  tempDirs.push(dir);
  writeFileSync(join(dir, "BACKLOG.md"), projectTemplates.backlog, "utf8");
  writeFileSync(join(dir, "PROGRESS.md"), projectTemplates.progress, "utf8");
  const archiveDir = join(dir, "docs", "archive");
  mkdirSync(archiveDir, { recursive: true });
  writeFileSync(join(archiveDir, "BACKLOG_ARCHIVE.md"), projectTemplates["backlog-archive"], "utf8");
  writeFileSync(join(archiveDir, "PROGRESS_ARCHIVE.md"), projectTemplates["progress-archive"], "utf8");
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("template resources (M8/9.4)", () => {
  it("serves all four file skeletons as markdown", async () => {
    const c = await connect();
    try {
      const titles: Record<string, string> = {
        backlog: "# BACKLOG.md — Offene Punkte",
        progress: "# Projekt-Tracking:",
        "backlog-archive": "# BACKLOG_ARCHIVE.md — Archiv erledigter Items (append-only)",
        "progress-archive": "# PROGRESS_ARCHIVE.md — Archiv abgeschlossener Phasen (append-only)",
      };
      for (const kind of TEMPLATE_KINDS) {
        const result = await c.client.readResource({ uri: `stepwell://templates/${kind}` });
        expect(resourceMime(result), kind).toBe("text/markdown");
        expect(resourceText(result), kind).toContain(titles[kind]!);
      }
    } finally {
      await c.close();
    }
  });

  it("rejects unknown template kinds", async () => {
    const c = await connect();
    try {
      await expect(
        c.client.readResource({ uri: "stepwell://templates/nope" }),
      ).rejects.toThrow(/unknown template kind/);
    } finally {
      await c.close();
    }
  });

  it("docs_validate is clean for a project scaffolded from the templates", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "docs_validate", { root: scaffoldFromTemplates() });
      expect(result.isError).toBeFalsy();
      expect(payload(result).ok).toBe(true);
    } finally {
      await c.close();
    }
  });

  it("the init-fallback guidance points at the template resources", async () => {
    const c = await connect();
    try {
      const result = await callTool(c, "backlog_list", { root: join(fixturesEmpty()) });
      expect(result.isError).toBe(true);
      expect(payload(result).message).toContain("stepwell://templates/");
    } finally {
      await c.close();
    }
  });
});

function fixturesEmpty(): string {
  return join(import.meta.dirname, "..", "..", "core", "tests", "fixtures", "project-empty");
}
