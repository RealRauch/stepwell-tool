import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function manifest(pkg: string): { name: string; files?: string[]; bin?: Record<string, string> } {
  return JSON.parse(readFileSync(join(repoRoot, "packages", pkg, "package.json"), "utf8"));
}

describe("packaging manifests (D3, 7.3)", () => {
  it("ships source only — both workspaces declare a files field without tests", () => {
    for (const pkg of ["core", "mcp"]) {
      const m = manifest(pkg);
      expect(m.files, `${m.name} files field`).toContain("src");
      const joined = (m.files ?? []).join(",");
      expect(joined).not.toContain("tests");
      expect(joined).not.toContain("fixtures");
    }
  });

  it("exposes the method-docs bin from the mcp workspace", () => {
    const m = manifest("mcp");
    expect(m.bin?.["method-docs"]).toBeTruthy();
  });
});
