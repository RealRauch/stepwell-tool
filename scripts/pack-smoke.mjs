#!/usr/bin/env node
/**
 * Pack-Smoke (L6/9.8): npm pack beider Workspaces → Tarballs in ein temporäres
 * Prefix installieren → Artefakt-Inhalt prüfen (src, bin/exports, SKILL.md).
 *
 * Bekannte Lücke (Fund dieses Smokes, BACKLOG-Item): Node strippt TS grundsätzlich
 * NICHT unter node_modules (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING) — das
 * Artefakt enthält reine .ts-Source und ist aus node_modules daher nicht direkt
 * ausführbar. Der stdio-Handshake gegen das installierte Artefakt ist damit bis zu
 * einem Build-/dist-Schritt nicht möglich; der Smoke prüft statisch und beendet
 * sich mit einem deutlichen Log-Hinweis. Node >= 23.6 lokal (Repo-Läufe) umgeht
 * das nur außerhalb von node_modules.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(import.meta.dirname, "..");
const work = mkdtempSync(join(tmpdir(), "method-docs-pack-smoke-"));
const installDir = join(work, "install");

const fail = (message) => {
  console.error(`pack-smoke FAILED: ${message}`);
  rmSync(work, { recursive: true, force: true });
  process.exit(1);
};
const shell = process.platform === "win32";
const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: "pipe", encoding: "utf8", shell, ...opts });
  if (r.error) fail(`${cmd} ${args.join(" ")} spawn error: ${r.error}`);
  if (r.status !== 0) fail(`${cmd} ${args.join(" ")} exited ${r.status}\n${r.stderr}`);
  return r.stdout;
};
const assertExists = (path) => {
  if (!existsSync(path)) fail(`missing from artifact: ${path}`);
};

// 1) Tarballs bauen
run("npm", ["pack", "--pack-destination", work, "./packages/core", "./packages/mcp"], { cwd: repoRoot });
const tarballs = readdirSync(work).filter((f) => f.endsWith(".tgz"));
if (tarballs.length !== 2) fail(`expected 2 tarballs, got: ${tarballs.join(", ")}`);

// 2) Tarballs installieren (löst auch die Workspace-Abhängigkeit über die Artefakte auf)
run("npm", ["install", "--prefix", installDir, "--no-audit", "--no-fund", ...tarballs.map((t) => join(work, t))]);

// 3) Artefakt-Inhalt statisch prüfen
const mcpRoot = join(installDir, "node_modules", "@method-docs", "mcp");
const coreRoot = join(installDir, "node_modules", "@method-docs", "core");
for (const path of [
  join(coreRoot, "src", "index.ts"),
  join(mcpRoot, "src", "serve.ts"),
  join(mcpRoot, "src", "cli.ts"),
  join(mcpRoot, "src", "tools.ts"),
  join(mcpRoot, "skills", "stepwell", "SKILL.md"),
]) {
  assertExists(path);
}
const mcpManifest = JSON.parse(readFileSync(join(mcpRoot, "package.json"), "utf8"));
if (mcpManifest.bin?.["method-docs"] !== "./src/cli.ts") {
  fail(`unexpected bin mapping: ${JSON.stringify(mcpManifest.bin)}`);
}
if (mcpManifest.dependencies?.["@method-docs/core"] === undefined) {
  fail("installed mcp artifact lost its @method-docs/core dependency");
}

// 4) Runtime-Lücke dokumentieren (dynamic handshake blocked — siehe Dateikopf)
console.log(
  "pack-smoke: static artifact checks OK (tarballs installieren, src/skills/manifest vorhanden)",
);
console.log(
  "pack-smoke: NOTE stdio handshake against the artifact skipped - node refuses TS stripping under node_modules (dist/build item open)",
);

rmSync(work, { recursive: true, force: true });
console.log("pack-smoke: OK");
