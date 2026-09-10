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
        "methoddocs://templates/{kind}",
        "methoddocs://{root}/archive/{kind}",
        "methoddocs://{root}/backlog",
        "methoddocs://{root}/hashes",
        "methoddocs://{root}/phase/{phase}",
        "methoddocs://{root}/progress",
      ]);
    } finally {
      await c.close();
    }
  });

  it("lists the four concrete template resources for discovery (L9)", async () => {
    const c = await connect();
    try {
      const { resources } = await c.client.listResources();
      const templates = resources.filter((r) => r.uri.startsWith("methoddocs://templates/"));
      expect(templates.map((r) => r.uri).sort()).toEqual([
        "methoddocs://templates/backlog",
        "methoddocs://templates/backlog-archive",
        "methoddocs://templates/progress",
        "methoddocs://templates/progress-archive",
      ]);
      expect(templates.every((r) => r.mimeType === "text/markdown")).toBe(true);
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

  it("serves a compact sha256 manifest for the fast path (12.5, E2/3)", async () => {
    const c = await connect();
    try {
      const result = await c.client.readResource({
        uri: `methoddocs://${enc(projectA)}/hashes`,
      });
      expect(resourceMime(result)).toBe("application/json");
      const hashes = JSON.parse(resourceText(result)) as Record<string, string>;
      expect(Object.keys(hashes).sort()).toEqual([
        "BACKLOG.md",
        "PROGRESS.md",
        "docs/archive/BACKLOG_ARCHIVE.md",
        "docs/archive/PROGRESS_ARCHIVE.md",
      ]);
      for (const hash of Object.values(hashes)) {
        expect(hash).toMatch(/^[0-9a-f]{64}$/u);
      }
    } finally {
      await c.close();
    }
  });

  it("serves the merged phase context as markdown (12.6, G5)", async () => {
    const c = await connect();
    try {
      const result = await c.client.readResource({
        uri: `methoddocs://${enc(projectA)}/phase/${enc("Phase 2 — UI-Polish")}`,
      });
      expect(resourceMime(result)).toBe("text/markdown");
      const text = resourceText(result);
      expect(text).toContain("### Phase 2 — UI-Polish");
      expect(text).toContain("### U21 —");
      expect(text).toContain("### U22 —");
      expect(text).toContain("| 2.1 | Strings-Modul | 🔄 |");
    } finally {
      await c.close();
    }
  });

  it("rejects unknown phases in the phase context resource", async () => {
    const c = await connect();
    try {
      await expect(
        c.client.readResource({ uri: `methoddocs://${enc(projectA)}/phase/${enc("Phase 99")}` }),
      ).rejects.toThrow(/Phase 99/);
    } finally {
      await c.close();
    }
  });
});
