#!/usr/bin/env node
/**
 * Pack-Smoke (L6/9.8 + H1/10.5): npm pack beider Workspaces → Tarballs in ein
 * temporäres Prefix installieren → Artefakt-Inhalt prüfen (dist, skills, Manifest)
 * → stdio-Handshake gegen den INSTALLIERTEN Server → CLI-Bin-Smoke gegen dist.
 * Seit dem Build-/dist-Schritt (H1) ist das Artefakt aus node_modules lauffähig.
 */
import { spawn, spawnSync } from "node:child_process";
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
// R8: bei shell:true (win32) verkettet node die Argumente unquoted — Pfade mit
// Leerzeichen brechen. Explizit doppelte Anführungszeichen setzen (cmd.exe).
const quoteForShell = (arg) => (shell && /[\s"]/u.test(arg) ? `"${arg.replaceAll('"', '\\"')}"` : arg);
const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args.map(quoteForShell), { stdio: "pipe", encoding: "utf8", shell, ...opts });
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

// 3) Artefakt-Inhalt statisch prüfen (seit 10.4/H1: compiled dist, kein src)
const mcpRoot = join(installDir, "node_modules", "@method-docs", "mcp");
const coreRoot = join(installDir, "node_modules", "@method-docs", "core");
for (const path of [
  join(coreRoot, "dist", "index.js"),
  join(coreRoot, "dist", "index.d.ts"),
  join(mcpRoot, "dist", "serve.js"),
  join(mcpRoot, "dist", "cli.js"),
  join(mcpRoot, "dist", "tools.js"),
  join(mcpRoot, "skills", "stepwell", "SKILL.md"),
]) {
  assertExists(path);
}
const mcpManifest = JSON.parse(readFileSync(join(mcpRoot, "package.json"), "utf8"));
if (mcpManifest.bin?.["method-docs"] !== "./dist/cli.js") {
  fail(`unexpected bin mapping: ${JSON.stringify(mcpManifest.bin)}`);
}
if (mcpManifest.dependencies?.["@method-docs/core"] === undefined) {
  fail("installed mcp artifact lost its @method-docs/core dependency");
}

// 4) stdio-Handshake gegen den installierten Server (H1: dist läuft aus node_modules)
const handshake = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "pack-smoke", version: "0.0.0" },
  },
};
const handshakeResult = await new Promise((resolve) => {
  const child = spawn(process.execPath, [join(mcpRoot, "dist", "serve.js")], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  let buffer = "";
  let errBuffer = "";
  const timer = setTimeout(() => {
    child.kill();
    resolve({ ok: false, detail: `timeout waiting for initialize response, got: ${buffer} stderr: ${errBuffer}` });
  }, 20_000);
  child.stderr.on("data", (chunk) => {
    errBuffer += chunk.toString();
  });
  child.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    const line = buffer.split("\n").find((l) => l.includes('"id":1'));
    if (line === undefined) return;
    clearTimeout(timer);
    child.kill();
    try {
      const parsed = JSON.parse(line);
      if (parsed.result?.serverInfo?.name !== "stepwell") {
        resolve({ ok: false, detail: `unexpected serverInfo: ${line}` });
      } else {
        resolve({ ok: true, detail: parsed.result.serverInfo.name });
      }
    } catch (err) {
      resolve({ ok: false, detail: `unparseable response: ${line} (${err})` });
    }
  });
  child.stdin.write(JSON.stringify(handshake) + "\n");
  child.on("exit", () => {
    if (timer.hasRef()) {
      clearTimeout(timer);
      resolve({ ok: false, detail: `server exited early, got: ${buffer} stderr: ${errBuffer}` });
    }
  });
});
if (!handshakeResult.ok) fail(`stdio handshake: ${handshakeResult.detail}`);
console.log(`pack-smoke: handshake OK (server ${handshakeResult.detail})`);

// 5) CLI-Bin-Smoke gegen das installierte Artefakt (Usage → Exit 2)
const cli = spawnSync(process.execPath, [join(mcpRoot, "dist", "cli.js")], { encoding: "utf8" });
if (cli.status !== 2 || !`${cli.stderr}`.includes("usage: method-docs")) {
  fail(`cli smoke unexpected: exit ${cli.status}, stderr: ${cli.stderr}`);
}

rmSync(work, { recursive: true, force: true });
console.log("pack-smoke: OK (pack, install, dist artifacts, stdio handshake, cli bin)");
