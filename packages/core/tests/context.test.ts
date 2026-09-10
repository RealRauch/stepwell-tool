import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { planPhase } from "../src/mutations.ts";
import { applyPhasePlan } from "../src/mutations.ts";
import { phaseContext } from "../src/context.ts";

const fixtures = join(import.meta.dirname, "fixtures");

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function tempProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-context-"));
  tempDirs.push(dir);
  cpSync(join(fixtures, "project-a"), dir, { recursive: true });
  return dir;
}

describe("phaseContext (12.6, G5)", () => {
  it("merges phase block, table rows and item bodies in step order", () => {
    const ctx = phaseContext(join(fixtures, "project-a"), "Phase 2");
    expect(ctx.phase.name).toBe("Phase 2");
    expect(ctx.phase.raw).toContain("### Phase 2 — UI-Polish");
    expect(ctx.rows.map((r) => r.step)).toEqual(["2.0", "2.1", "2.2", "2.3"]);
    // plain-ID mentions in scope bullets, in first-occurrence order:
    // 2.0 → H2, 2.2 → U21, 2.3 → U22
    expect(ctx.items.map((i) => i.id)).toEqual(["H2", "U21", "U22"]);
    expect(ctx.items.every((i) => i.text.length > 0)).toBe(true);
    expect(ctx.unresolved).toEqual([]);
    expect(ctx.markdown).toContain("### Phase 2 — UI-Polish");
    expect(ctx.markdown).toContain("| 2.1 | Strings-Modul |");
    for (const item of ctx.items) {
      expect(ctx.markdown).toContain(`### ${item.id} —`);
      expect(ctx.markdown).toContain(item.text.split("\n")[0]!);
    }
  });

  it("lists unknown explicit refs as unresolved with a markdown hint, without crashing", () => {
    const dir = tempProject();
    const progressPath = join(dir, "PROGRESS.md");
    writeFileSync(
      progressPath,
      readFileSync(progressPath, "utf8").replace(
        "- **2.2 U21 Fehlertexte migrieren**",
        "- **2.2 U21 Fehlertexte migrieren (ZZ99/1)**",
      ),
      "utf8",
    );
    const ctx = phaseContext(dir, "Phase 2");
    expect(ctx.unresolved).toEqual(["ZZ99/1"]);
    expect(ctx.markdown).toContain("ZZ99/1");
    // known ids still resolve around it
    expect(ctx.items.map((i) => i.id)).toEqual(["H2", "U21", "U22"]);
  });

  it("falls back to the progress archive for completed phases", () => {
    const ctx = phaseContext(join(fixtures, "project-a"), "Phase 0");
    expect(ctx.phase.name).toBe("Phase 0");
    expect(ctx.phase.raw).toContain("### Phase 0 — Projektaufsetzung");
    expect(ctx.rows.map((r) => r.step)).toEqual(["0.1", "0.2"]);
    expect(ctx.rows.every((r) => r.status === "✅")).toBe(true);
  });

  it("suffices with phase + rows when the block has no item refs", () => {
    const dir = tempProject();
    applyPhasePlan(
      planPhase(dir, "Phase 3 — Leer", [{ step: "3.1", name: "Erster Schritt" }], { dryRun: false }),
    );
    const ctx = phaseContext(dir, "Phase 3");
    expect(ctx.items).toEqual([]);
    expect(ctx.unresolved).toEqual([]);
    expect(ctx.rows.map((r) => r.step)).toEqual(["3.1"]);
  });

  it("throws for unknown phases", () => {
    expect(() => phaseContext(join(fixtures, "project-a"), "Phase 99")).toThrow(/Phase 99/);
  });
});
