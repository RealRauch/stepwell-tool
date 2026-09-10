import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

interface Manifest {
  name: string;
  version?: string;
  files?: string[];
  bin?: Record<string, string>;
  exports?: Record<string, unknown>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
}

function manifest(pkg: string): Manifest {
  return JSON.parse(readFileSync(join(repoRoot, "packages", pkg, "package.json"), "utf8"));
}

describe("packaging manifests (D3, 7.3; dist since 10.4/H1)", () => {
  it("ships compiled dist only — no src in the published files", () => {
    for (const pkg of ["core", "mcp"]) {
      const m = manifest(pkg);
      expect(m.files, `${m.name} files field`).toContain("dist");
      const joined = (m.files ?? []).join(",");
      expect(joined, `${m.name} must not ship src`).not.toContain("src");
      expect(joined, `${m.name} must not ship tests`).not.toContain("tests");
      expect(joined, `${m.name} must not ship fixtures`).not.toContain("fixtures");
    }
    expect(manifest("mcp").files).toContain("skills");
  });

  it("points exports and bin at dist and builds via prepublishOnly (H1)", () => {
    const core = manifest("core");
    const coreExports = core.exports?.["."] as Record<string, string>;
    expect(coreExports.import).toBe("./dist/index.js");
    expect(coreExports.types).toBe("./dist/index.d.ts");
    expect(core.scripts?.prepublishOnly).toContain("build");

    const mcp = manifest("mcp");
    const mcpExports = mcp.exports?.["."] as Record<string, string>;
expect(mcpExports.import).toBe("./dist/index.js");
    expect(mcpExports.types).toBe("./dist/index.d.ts");
    expect(mcp.bin?.["stepwell"]).toBe("./dist/cli.js");
    expect(mcp.scripts?.prepublishOnly).toContain("build");
  });
});

describe("stepwell naming + lockstep versions (N1/13.1)", () => {
  function rootManifest(): Manifest & { workspaces?: string[] } {
    return JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  }

  it("root package.json is named 'stepwell' (N1 — flat primary)", () => {
    expect(rootManifest().name).toBe("stepwell");
  });

  it("core package.json is named 'stepwell-core' (flat, kein @scope)", () => {
    expect(manifest("core").name).toBe("stepwell-core");
  });

  it("mcp package.json is named 'stepwell' (flat, ehemals @method-docs/mcp)", () => {
    expect(manifest("mcp").name).toBe("stepwell");
  });

  it("mcp bin key is 'stepwell' (nicht 'method-docs')", () => {
    expect(manifest("mcp").bin?.["stepwell"]).toBe("./dist/cli.js");
    expect(manifest("mcp").bin?.["method-docs"]).toBeUndefined();
  });

  it("mcp dependencies referenzieren 'stepwell-core' (nicht @method-docs/core)", () => {
    const deps = manifest("mcp").dependencies as Record<string, string> | undefined;
    expect(deps?.["stepwell-core"]).toBe("*");
    expect(deps?.["@method-docs/core"]).toBeUndefined();
  });

  it("alle drei package.json tragen dieselbe Version (Lockstep, Decision 16)", () => {
    const root = rootManifest().version;
    const core = manifest("core").version;
    const mcp = manifest("mcp").version;
    expect(core).toBe(root);
    expect(mcp).toBe(root);
  });
});

describe("stepwell skill asset (M7, 9.5)", () => {
  const skillPath = join(repoRoot, "packages", "mcp", "skills", "stepwell", "SKILL.md");

  it("ships the skill directory in the mcp package files", () => {
    const m = manifest("mcp");
    expect(m.files, "mcp files field must include skills").toContain("skills");
  });

  it("contains the SKILL.md with method-consistent guidance", () => {
    const text = readFileSync(skillPath, "utf8");
    expect(text).toContain("name: stepwell");
    expect(text).toContain("PLAYBOOK");
    expect(text).toContain("docs_status");
    expect(text).toContain("progress_update");
    expect(text).toContain("archive_item");
    expect(text).toContain("Freigabe");
    expect(text).toContain("stepwell://templates/");
  });
});

describe("pack smoke wiring (L6, 9.8)", () => {
  it("provides the pack smoke script and wires it into CI", () => {
    expect(existsSync(join(repoRoot, "scripts", "pack-smoke.mjs"))).toBe(true);
    const workflow = readFileSync(join(repoRoot, ".github", "workflows", "ci.yml"), "utf8");
    expect(workflow).toMatch(/pack-smoke:/u);
  });

  it("keeps the versioned release documents in place", () => {
    expect(existsSync(join(repoRoot, "CHANGELOG.md"))).toBe(true);
    const changelog = readFileSync(join(repoRoot, "CHANGELOG.md"), "utf8");
    expect(changelog).toContain("## [Unreleased]");
    expect(changelog).toContain("Keep a Changelog");
  });
});

describe("pack smoke with spaces in the temp path (R8, 10.2)", () => {
  it("runs green when TMP/TEMP contain spaces (windows shell quoting)", () => {
    const spacedTemp = join(repoRoot, "test-results", "tmp with spaces");
    mkdirSync(spacedTemp, { recursive: true });
    const result = spawnSync(process.execPath, [join(repoRoot, "scripts", "pack-smoke.mjs")], {
      encoding: "utf8",
      timeout: 120_000,
      env: { ...process.env, TMP: spacedTemp, TEMP: spacedTemp, TMPDIR: spacedTemp },
    });
    rmSync(spacedTemp, { recursive: true, force: true });
    expect(result.status, `stderr: ${result.stderr}`).toBe(0);
    // H1/10.5: the smoke must prove the artifact RUNS - dynamic handshake included
    expect(result.stdout).toContain("handshake OK");
  }, 150_000);
});

describe("build pipeline (H1/1, 10.3)", () => {
  it("emits js + declarations for both workspaces with rewritten relative imports", () => {
    const result = spawnSync("npm", ["run", "build"], {
      cwd: repoRoot,
      encoding: "utf8",
      shell: true,
      timeout: 120_000,
    });
    expect(result.status, `stderr: ${result.stderr}`).toBe(0);
    expect(existsSync(join(repoRoot, "packages", "core", "dist", "index.js"))).toBe(true);
    expect(existsSync(join(repoRoot, "packages", "core", "dist", "index.d.ts"))).toBe(true);
    expect(existsSync(join(repoRoot, "packages", "mcp", "dist", "index.js"))).toBe(true);
    expect(existsSync(join(repoRoot, "packages", "mcp", "dist", "tools.js"))).toBe(true);
    // relative .ts imports must be rewritten to .js in the emitted output
    const projectFilesJs = readFileSync(join(repoRoot, "packages", "core", "dist", "project-files.js"), "utf8");
    expect(projectFilesJs).not.toMatch(/from "[^"]+\.ts"/u);
    const projectJs = readFileSync(join(repoRoot, "packages", "core", "dist", "project.js"), "utf8");
    expect(projectJs).toContain('from "./backlog.js"');
    expect(projectJs).not.toContain('from "./backlog.ts"');
  }, 150_000);
});
