import { Writable } from "node:stream";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli.js";

const fixtures = join(import.meta.dirname, "..", "..", "core", "tests", "fixtures");
const projectA = join(fixtures, "project-a");
const projectDrift = join(fixtures, "project-b-drift");

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

describe("runCli — status", () => {
  it("prints a human-readable aggregate", async () => {
    const io = makeIo();
    const code = await runCli(["status", "--root", projectA], io.io);
    expect(code).toBe(0);
    expect(io.stdout).toContain("Offene Items: 7");
    expect(io.stdout).toContain("🟠 3");
    expect(io.stdout).toContain("Phase 2 — UI-Polish");
    expect(io.stdout).toContain("✅-Quote: 5/9 (56%)");
    expect(io.stdout).toContain("Warnungen: 0");
  });

  it("prints raw JSON with --json", async () => {
    const io = makeIo();
    const code = await runCli(["status", "--root", projectA, "--json"], io.io);
    expect(code).toBe(0);
    const parsed = JSON.parse(io.stdout) as { openTotal: number };
    expect(parsed.openTotal).toBe(7);
  });

  it("reports warnings for the drift project", async () => {
    const io = makeIo();
    const code = await runCli(["status", "--root", projectDrift], io.io);
    expect(code).toBe(0);
    expect(io.stdout).toContain("Warnungen: 19");
  });
});

describe("runCli — backlog", () => {
  it("lists items with priority/section filters", async () => {
    const io = makeIo();
    const code = await runCli(["backlog", "--root", projectA, "--priority", "🟠"], io.io);
    expect(code).toBe(0);
    expect(io.stdout).toContain("H1");
    expect(io.stdout).toContain("R4");
    expect(io.stdout).not.toContain("L3");

    const io2 = makeIo();
    await runCli(["backlog", "--root", projectA, "--section", "HOCH"], io2.io);
    expect(io2.stdout).toContain("H2");
    expect(io2.stdout).not.toContain("R4");
  });

  it("filters closed items with --open=false", async () => {
    const io = makeIo();
    const code = await runCli(["backlog", "--root", projectDrift, "--open", "false"], io.io);
    expect(code).toBe(0);
    expect(io.stdout).toContain("H9");
    expect(io.stdout).not.toContain("K9");
  });

  it("emits the core payload with --json (no raw)", async () => {
    const io = makeIo();
    const code = await runCli(["backlog", "--root", projectA, "--json"], io.io);
    expect(code).toBe(0);
    const parsed = JSON.parse(io.stdout) as { count: number; items: Array<Record<string, unknown>> };
    expect(parsed.count).toBe(7);
    expect(parsed.items[0]).not.toHaveProperty("raw");
  });
});

describe("runCli — progress", () => {
  it("lists table rows and filters by status", async () => {
    const io = makeIo();
    const code = await runCli(["progress", "--root", projectA], io.io);
    expect(code).toBe(0);
    expect(io.stdout).toContain("2.1 🔄 Strings-Modul");

    const io2 = makeIo();
    await runCli(["progress", "--root", projectA, "--status", "✅"], io2.io);
    expect(io2.stdout).toContain("0.1");
    expect(io2.stdout).not.toContain("2.2");
  });
});

describe("runCli — validate", () => {
  it("exits 0 with an OK line for a clean project", async () => {
    const io = makeIo();
    const code = await runCli(["validate", "--root", projectA], io.io);
    expect(code).toBe(0);
    expect(io.stdout).toContain("OK");
  });

  it("exits 1 and lists findings for the drift project", async () => {
    const io = makeIo();
    const code = await runCli(["validate", "--root", projectDrift], io.io);
    expect(code).toBe(1);
    expect(io.stdout).toContain("NOT_ARCHIVED");
    expect(io.stdout).toContain("DATE_LEGACY");
    expect(io.stdout).toContain("BACKLOG.md:20");
  });
});

describe("runCli — usage and errors", () => {
  it("prints usage and exits 2 without a command", async () => {
    const io = makeIo();
    const code = await runCli([], io.io);
    expect(code).toBe(2);
    expect(io.stderr).toContain("usage");
  });

  it("prints usage and exits 2 for unknown commands", async () => {
    const io = makeIo();
    const code = await runCli(["nope"], io.io);
    expect(code).toBe(2);
  });

  it("fails with a clear error when --root is missing", async () => {
    const io = makeIo();
    const code = await runCli(["status"], io.io);
    expect(code).toBe(1);
    expect(io.stderr).toContain("--root");
  });

  it("fails with the loader message for missing files", async () => {
    const io = makeIo();
    const code = await runCli(["status", "--root", join(projectA, "docs")], io.io);
    expect(code).toBe(1);
    expect(io.stderr).toContain("missing required file");
  });
});
