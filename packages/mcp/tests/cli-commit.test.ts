import { Writable } from "node:stream";
import {describe, expect, it, vi } from "vitest";
import { runCli } from "../src/cli.ts";
import { git, tempGitProject } from "./helper.ts";

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

// M19/29.2: git subprocesses under Windows AV/indexer load need more headroom than the 5 s default
vi.setConfig({ testTimeout: 20000 });

describe("runCli — --commit automation (H5/26.3)", () => {
  it("progress-update --apply --commit commits the docs and reports the section in JSON", async () => {
    const dir = tempGitProject("project-a");
    const io = makeIo();

    const code = await runCli(
      ["progress-update", "--root", dir, "--phase", "Phase 2", "--step", "2.2", "--status", "wip", "--apply", "--commit", "--json"],
      io.io,
    );

    expect(code).toBe(0);
    const json = JSON.parse(io.stdout) as { commit: { ok: boolean; sha?: string } };
    expect(json.commit.ok).toBe(true);
    expect(json.commit.sha).toBeDefined();
    expect(git(dir, ["log", "-1", "--format=%s"]).trim()).toBe("docs(progress): step 2.2 🔄");
    expect(git(dir, ["status", "--porcelain"])).toBe("");
  });

  it("archive --apply --commit reports the section in JSON", async () => {
    const dir = tempGitProject("project-a");
    const io = makeIo();

    const code = await runCli(["archive", "--root", dir, "--id", "H1", "--apply", "--commit", "--json"], io.io);

    expect(code).toBe(0);
    const json = JSON.parse(io.stdout) as { commit: { ok: boolean } };
    expect(json.commit.ok).toBe(true);
    expect(git(dir, ["log", "-1", "--format=%s"]).trim()).toBe("docs(backlog): archive H1");
  });

  it("a failed commit keeps verification ok, reports commit.ok false, exits 1", async () => {
    const dir = tempGitProject("project-a");
    const { writeFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    writeFileSync(join(dir, "staged.txt"), "foreign\n");
    git(dir, ["add", "staged.txt"]);
    const io = makeIo();

    const code = await runCli(
      ["progress-update", "--root", dir, "--phase", "Phase 2", "--step", "2.2", "--status", "wip", "--apply", "--commit", "--json"],
      io.io,
    );

    expect(code).toBe(1);
    const json = JSON.parse(io.stdout) as {
      verification: { ok: boolean };
      commit: { ok: boolean; error: { code: string } };
    };
    expect(json.verification.ok).toBe(true);
    expect(json.commit.ok).toBe(false);
    expect(json.commit.error.code).toBe("COMMIT_BLOCKED");
    // edits stay applied
    expect(git(dir, ["diff", "--cached", "--name-only"])).toContain("staged.txt");
  });

  it("without --commit the JSON has no commit section", async () => {
    const dir = tempGitProject("project-a");
    const io = makeIo();

    const code = await runCli(
      ["progress-update", "--root", dir, "--phase", "Phase 2", "--step", "2.2", "--status", "wip", "--apply", "--json"],
      io.io,
    );

    expect(code).toBe(0);
    const json = JSON.parse(io.stdout) as { commit?: unknown };
    expect(json.commit).toBeUndefined();
    expect(git(dir, ["log", "-1", "--format=%s"]).trim()).toBe("init");
  });
});
