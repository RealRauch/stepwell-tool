import { describe, expect, it } from "vitest";
import {
  connect,
  projectA,
  projectDrift,
  resourceMime,
  resourceText,
} from "./helper.ts";

const enc = (p: string): string => encodeURIComponent(p);

describe("resource templates (2.4)", () => {
  it("lists three templates with root in the URI", async () => {
    const c = await connect();
    try {
      const { resourceTemplates } = await c.client.listResourceTemplates();
      expect(resourceTemplates.map((t) => t.uriTemplate).sort()).toEqual([
        "methoddocs://{root}/archive/{kind}",
        "methoddocs://{root}/backlog",
        "methoddocs://{root}/progress",
      ]);
    } finally {
      await c.close();
    }
  });

  it("reads BACKLOG.md verbatim through the template", async () => {
    const c = await connect();
    try {
      const result = await c.client.readResource({ uri: `methoddocs://${enc(projectA)}/backlog` });
      expect(resourceMime(result)).toBe("text/markdown");
      const text = resourceText(result);
      expect(text).toContain("# BACKLOG.md — Offene Punkte (Stand: 260907/1200)");
      expect(text).toContain("### [ ] H1 — Upload-Endpunkt ohne Größenlimit — 🟠");
    } finally {
      await c.close();
    }
  });

  it("reads PROGRESS.md verbatim through the template", async () => {
    const c = await connect();
    try {
      const result = await c.client.readResource({ uri: `methoddocs://${enc(projectA)}/progress` });
      const text = resourceText(result);
      expect(text).toContain("# Projekt-Tracking: Demo-Projekt");
      expect(text).toContain("| 2.1 | Strings-Modul | 🔄 |");
    } finally {
      await c.close();
    }
  });

  it("reads both archive kinds", async () => {
    const c = await connect();
    try {
      const backlog = await c.client.readResource({
        uri: `methoddocs://${enc(projectA)}/archive/backlog`,
      });
      expect(resourceText(backlog)).toContain("# BACKLOG_ARCHIVE.md");
      expect(resourceText(backlog)).toContain("### [x] S1");

      const progress = await c.client.readResource({
        uri: `methoddocs://${enc(projectA)}/archive/progress`,
      });
      expect(resourceText(progress)).toContain("# PROGRESS_ARCHIVE.md");
      expect(resourceText(progress)).toContain("### Phase 0 — Projektaufsetzung");
    } finally {
      await c.close();
    }
  });

  it("rejects unknown archive kinds and missing projects with clear errors", async () => {
    const c = await connect();
    try {
      await expect(
        c.client.readResource({ uri: `methoddocs://${enc(projectA)}/archive/nope` }),
      ).rejects.toThrow(/unknown archive kind/);
      await expect(
        c.client.readResource({ uri: `methoddocs://${enc(projectA + "\\missing")}/backlog` }),
      ).rejects.toThrow(/BACKLOG\.md/);
      void projectDrift;
    } finally {
      await c.close();
    }
  });
});
