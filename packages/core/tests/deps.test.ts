import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseBacklog } from "../src/backlog.ts";
import { docsValidate } from "../src/validate.ts";

// M21/30.6: dependencies as data — tolerant optional `Depends on:` bullet,
// derived dependsOn/blockedBy/ready, DEP_UNKNOWN warning, DEP_CYCLE finding.

const fixtures = join(import.meta.dirname, "fixtures");

describe("dependsOn parsing (M21/30.6)", () => {
  it("reads comma lists from the Depends-on bullet", () => {
    const content = [
      "# BACKLOG.md — Open items (As of: 2026-11-11T10:00",
      "",
      "## 🟠 HIGH",
      "",
      "### [ ] H1 — Waits for two — 🟠",
      "- **Location:** `src/a.ts`",
      "- **Depends on:** H6, M12",
      "- **Problem:** fixture",
      "",
    ].join("\n");
    const [h1] = parseBacklog(content).value.items;
    expect(h1?.dependsOn).toEqual(["H6", "M12"]);
  });

  it("reads multiple Depends-on bullets and the German variant silently", () => {
    const content = [
      "# BACKLOG.md — Offene Punkte (Stand: 2026-11-11T10:00",
      "",
      "## 🟠 HOCH",
      "",
      "### [ ] H1 — Mehrfach-Bullet — 🟠",
      "- **Ort:** `src/a.ts`",
      "- **Hängt ab von:** H6",
      "- **Problem:** fixture",
      "- **Depends on:** M12",
      "",
    ].join("\n");
    const [h1] = parseBacklog(content).value.items;
    expect(h1?.dependsOn).toEqual(["H6", "M12"]);
  });

  it("leaves items without a bullet at []", () => {
    const content = [
      "# BACKLOG.md — Open items (As of: 2026-11-11T10:00",
      "",
      "## 🟠 HIGH",
      "",
      "### [ ] H1 — No deps — 🟠",
      "- **Location:** `src/a.ts`",
      "- **Problem:** fixture",
      "",
    ].join("\n");
    const [h1] = parseBacklog(content).value.items;
    expect(h1?.dependsOn).toEqual([]);
  });
});

describe("derived ready/blockedBy (M21/30.6) — fixture project-l-deps", () => {
  const result = parseBacklog(join(fixtures, "project-l-deps", "BACKLOG.md"));

  it("resolves transitive blocking: X1 blockedBy [X2, X3], X3 ready", () => {
    const byId = new Map(result.value.items.map((i) => [i.id, i]));
    expect(byId.get("X1")?.blockedBy).toEqual(["X2", "X3"]);
    expect(byId.get("X1")?.ready).toBe(false);
    expect(byId.get("X2")?.blockedBy).toEqual(["X3"]);
    expect(byId.get("X2")?.ready).toBe(false);
    expect(byId.get("X3")?.blockedBy).toEqual([]);
    expect(byId.get("X3")?.ready).toBe(true);
  });

  it("blocks both cycle members without infinite loop", () => {
    const byId = new Map(result.value.items.map((i) => [i.id, i]));
    expect(byId.get("X4")?.ready).toBe(false);
    expect(byId.get("X5")?.ready).toBe(false);
  });
});

describe("validate DEP_UNKNOWN / DEP_CYCLE (M21/30.6) — fixture project-l-deps", () => {
  const result = docsValidate(join(fixtures, "project-l-deps"));

  it("reports the unknown reference as a warning (does not flip ok) and the cycle as a finding", () => {
    expect(result.warnings.map((w) => w.code)).toContain("DEP_UNKNOWN");
    const unknown = result.warnings.find((w) => w.code === "DEP_UNKNOWN");
    expect(unknown?.message).toContain("ZZ9");
    const cycles = result.findings.filter((f) => f.code === "DEP_CYCLE");
    expect(cycles).toHaveLength(1);
    expect(cycles[0]?.message).toContain("X4");
    expect(result.ok).toBe(false);
  });
});
