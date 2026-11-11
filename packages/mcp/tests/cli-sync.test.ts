import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import {afterEach, describe, expect, it, vi } from "vitest";
import { DOC_FILES, projectTemplates } from "stepwell-core";
import { runCli } from "../src/cli.ts";

function gitc(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); // M19/29.2: execFileSync leaks stderr to the console — pipe it (still surfaces in errors)
}

function makeWorktreePair(): { main: string; work: string } {
  const main = mkdtempSync(join(tmpdir(), "stepwell-clisync-"));
  mkdirSync(join(main, "docs", "archive"), { recursive: true });
  for (const rel of DOC_FILES) writeFileSync(join(main, rel), projectTemplates.progress);
  gitc(main, ["init", "-b", "main"]);
  gitc(main, ["config", "user.email", "test@example.com"]);
  gitc(main, ["config", "user.name", "Test"]);
  gitc(main, ["config", "core.autocrlf", "false"]); // M19/29.2: deterministic test repos
  gitc(main, ["add", "-A"]);
  gitc(main, ["commit", "-m", "init"]);
  const work = `${main}-workstream`;
  dirs.push(main, work); // T7: both sides registered for afterEach cleanup
  gitc(main, ["worktree", "add", "-b", "feature", work]);
  return { main, work };
}

function makeIo(): { stdout: string; stderr: string; io: { stdout: Writable; stderr: Writable } } {
  let out = "";
  let err = "";
  const stdout = new Writable({
    write(chunk, _enc, cb) {
      out += chunk.toString();
      cb();
    },
  });
  const stderr = new Writable({
    write(chunk, _enc, cb) {
      err += chunk.toString();
      cb();
    },
  });
  return { get stdout() { return out; }, get stderr() { return err; }, io: { stdout, stderr } };
}

const dirs: string[] = [];

afterEach(() => {
  // T7: register both sides of every worktree pair — no silent %TEMP% litter
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

// M19/29.2: git subprocesses under Windows AV/indexer load need more headroom than the 5 s default
vi.setConfig({ testTimeout: 20000 });

describe("runCli — sync (H5/26.5)", () => {
  it("sync status prints the report as JSON with schema", async () => {
    const { main, work } = makeWorktreePair();
    const io = makeIo();

    const code = await runCli(["sync", "status", "--root", work, "--json"], io.io);

    expect(code).toBe(0);
    const json = JSON.parse(io.stdout) as { schema: number; ok: boolean; trunk: string; current: string };
    expect(json.schema).toBe(2);
    expect(json.ok).toBe(true);
    expect(json.trunk).toBe("main");
    expect(json.current).toBe("feature");
  });

  it("sync pull defaults to a pre-flight preview without mutating", async () => {
    const { main, work } = makeWorktreePair();
    gitc(main, ["commit", "--allow-empty", "-m", "later trunk"]);
    const headBefore = gitc(work, ["rev-parse", "HEAD"]).trim();
    const io = makeIo();

    const code = await runCli(["sync", "pull", "--root", work, "--json"], io.io);

    expect(code).toBe(0);
    const json = JSON.parse(io.stdout) as { direction: string; dryRun: boolean; behind: number };
    expect(json.direction).toBe("pull");
    expect(json.dryRun).toBe(true);
    expect(json.behind).toBe(1);
    expect(gitc(work, ["rev-parse", "HEAD"]).trim()).toBe(headBefore);
  });

  it("sync pull --apply fast-forwards and sync push --apply moves the trunk", async () => {
    const { main, work } = makeWorktreePair();
    writeFileSync(join(work, "branch.txt"), "branch work\n");
    gitc(work, ["add", "-A"]);
    gitc(work, ["commit", "-m", "branch work"]);
    const ioPull = makeIo();
    const ioPush = makeIo();

    const pullCode = await runCli(["sync", "pull", "--root", work, "--apply", "--json"], ioPull.io);
    expect(pullCode).toBe(0);
    const pullJson = JSON.parse(ioPull.stdout) as { dryRun: boolean; fastForward: boolean };
    expect(pullJson.dryRun).toBe(false);
    expect(pullJson.fastForward).toBe(false);

    const workHead = gitc(work, ["rev-parse", "HEAD"]).trim();
    const pushCode = await runCli(["sync", "push", "--root", work, "--apply", "--json"], ioPush.io);
    expect(pushCode).toBe(0);
    const pushJson = JSON.parse(ioPush.stdout) as { direction: string };
    expect(pushJson.direction).toBe("push");
    expect(gitc(main, ["rev-parse", "HEAD"]).trim()).toBe(workHead);
  });

  it("a failed sync exits 1 and reports the structured error", async () => {
    const { main, work } = makeWorktreePair();
    gitc(main, ["commit", "--allow-empty", "-m", "late trunk"]);
    writeFileSync(join(work, "branch.txt"), "branch work\n");
    gitc(work, ["add", "-A"]);
    gitc(work, ["commit", "-m", "branch work"]);
    const io = makeIo();

    const code = await runCli(["sync", "push", "--root", work, "--apply", "--json"], io.io);

    expect(code).toBe(1);
    const json = JSON.parse(io.stdout) as { ok: boolean; error: { code: string } };
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("STALE_BRANCH");
  });

  it("sync without a direction is a usage error", async () => {
    const io = makeIo();

    const code = await runCli(["sync", "--root", "."], io.io);

    expect(code).toBe(2);
    expect(io.stderr).toContain("usage");
  });

  it("single-tree sync status hints how to set up a workstream (L15/27.8)", async () => {
    const main = mkdtempSync(join(tmpdir(), "stepwell-clisync-single-"));
    dirs.push(main);
    mkdirSync(join(main, "docs", "archive"), { recursive: true });
    for (const rel of DOC_FILES) writeFileSync(join(main, rel), projectTemplates.progress);
    gitc(main, ["init", "-b", "main"]);
    gitc(main, ["config", "user.email", "test@example.com"]);
    gitc(main, ["config", "user.name", "Test"]);
    gitc(main, ["config", "core.autocrlf", "false"]); // M19/29.2: deterministic test repos
    gitc(main, ["add", "-A"]);
    gitc(main, ["commit", "-m", "init"]);
    const io = makeIo();

    const code = await runCli(["sync", "status", "--root", main], io.io);

    expect(code).toBe(0);
    expect(io.stdout).toContain("Workstreams: none (single-tree mode)");
    expect(io.stdout).toContain("git worktree add");
    expect(io.stdout).toContain("-b");
  });
});
