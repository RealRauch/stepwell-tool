import { readFileSync, rmSync } from "node:fs";
import { Writable } from "node:stream";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli.ts";
import { tempProject } from "./helper.ts";

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

describe("runCli — archive (3.2)", () => {
  it("previews the plan without writing by default", async () => {
    const io = makeIo();
    const code = await runCli(["archive", "--root", projectA, "--id", "H1"], io.io);
    expect(code).toBe(0);
    expect(io.stdout).toContain("Dry-run");
    expect(io.stdout).toContain("-### [ ] H1");
    expect(io.stdout).toContain("+### [x] H1");
    expect(readFileSync(join(projectA, "BACKLOG.md"), "utf8")).toContain("### [ ] H1");
  });

  it("writes with --apply and prints the verification", async () => {
    const dir = tempProject("project-a");
    const io = makeIo();
    const code = await runCli(
      ["archive", "--root", dir, "--id", "L3", "--note", "Commit `c0ffee0`", "--apply"],
      io.io,
    );
    expect(code).toBe(0);
    expect(io.stdout).toContain("OK");
    const backlog = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    expect(backlog).not.toContain("### [ ] L3");
    expect(backlog).toContain("- L3 — Docs-Build-Warnungen aufräumen — erledigt (Commit `c0ffee0`)");
  });

  it("fails with exit 1 for unknown ids", async () => {
    const io = makeIo();
    const code = await runCli(["archive", "--root", projectA, "--id", "NOPE", "--apply"], io.io);
    expect(code).toBe(1);
    expect(io.stderr).toContain("NOPE");
  });
});

describe("runCli — progress-update (3.3)", () => {
  it("previews the plan without writing by default", async () => {
    const io = makeIo();
    const code = await runCli(
      ["progress-update", "--root", projectA, "--phase", "Phase 2", "--step", "2.2", "--status", "🔄"],
      io.io,
    );
    expect(code).toBe(0);
    expect(io.stdout).toContain("Dry-run");
    expect(io.stdout).toContain("+| 2.2 | U21 Fehlertexte | 🔄 |");
    expect(readFileSync(join(projectA, "PROGRESS.md"), "utf8")).toContain("| 2.2 | U21 Fehlertexte | ⬜ |");
  });

  it("writes with --apply and prints the verification", async () => {
    const dir = tempProject("project-a");
    const io = makeIo();
    const code = await runCli(
      ["progress-update", "--root", dir, "--phase", "Phase 2", "--step", "2.2", "--status", "🔄", "--apply"],
      io.io,
    );
    expect(code).toBe(0);
    expect(io.stdout).toContain("OK");
    expect(readFileSync(join(dir, "PROGRESS.md"), "utf8")).toContain("| 2.2 | U21 Fehlertexte | 🔄 |");
  });

  it("accepts --title for progress-update and renames the block heading", async () => {
    const dir = tempProject("project-a");
    const io = makeIo();
    const code = await runCli(
      ["progress-update", "--root", dir, "--phase", "Phase 2", "--step", "2.3", "--status", "🔄", "--title", "Polish & i18n", "--apply"],
      io.io,
    );
    expect(code).toBe(0);
    expect(io.stdout).toContain("OK");
    expect(readFileSync(join(dir, "PROGRESS.md"), "utf8")).toContain("### Phase 2 — Polish & i18n");
  });

  it("rejects invalid status icons with usage exit 2", async () => {
    const io = makeIo();
    const code = await runCli(
      ["progress-update", "--root", projectA, "--phase", "Phase 2", "--step", "2.2", "--status", "wow"],
      io.io,
    );
    expect(code).toBe(2);
    expect(io.stderr).toContain("--status");
  });
});

describe("runCli — archive locale (4.2)", () => {
  it("generates English markers with --locale en (4.2)", async () => {
    const dir = tempProject("project-a");
    const io = makeIo();
    const code = await runCli(
      ["archive", "--root", dir, "--id", "H2", "--note", "Commit `9f8e7d6`", "--locale", "en", "--apply"],
      io.io,
    );
    expect(code).toBe(0);
    const backlog = readFileSync(join(dir, "BACKLOG.md"), "utf8");
    expect(backlog).toContain("- H2 — Session-Cookie ohne SameSite — done (Commit `9f8e7d6`)");
  });

  it("rejects invalid locales with usage exit 2", async () => {
    const io = makeIo();
    const code = await runCli(["archive", "--root", projectA, "--id", "H1", "--locale", "fr"], io.io);
    expect(code).toBe(2);
    expect(io.stderr).toContain("--locale");
  });
});

describe("runCli — ascii aliases (T3, 6.7)", () => {
  it("accepts --status running for progress-update and writes the icon", async () => {
    const dir = tempProject("project-a");
    const io = makeIo();
    const code = await runCli(
      ["progress-update", "--root", dir, "--phase", "Phase 2", "--step", "2.2", "--status", "running", "--apply"],
      io.io,
    );
    expect(code).toBe(0);
    expect(readFileSync(join(dir, "PROGRESS.md"), "utf8")).toContain("| 2.2 | U21 Fehlertexte | 🔄 |");
  });

  it("accepts --priority red,yellow for the backlog filter", async () => {
    const io = makeIo();
    const code = await runCli(["backlog", "--root", projectA, "--priority", "red,yellow"], io.io);
    expect(code).toBe(0);
    expect(io.stdout).toContain("U21");
    expect(io.stdout).toContain("U22");
    expect(io.stdout).not.toContain("H1");
  });

  it("accepts --status done for the progress filter", async () => {
    const io = makeIo();
    const code = await runCli(["progress", "--root", projectA, "--status", "done"], io.io);
    expect(code).toBe(0);
    expect(io.stdout).toContain("0.1");
    expect(io.stdout).not.toContain("2.2");
  });

  it("lists the allowed aliases for an invalid priority (exit 2)", async () => {
    const io = makeIo();
    const code = await runCli(["backlog", "--root", projectA, "--priority", "bogus"], io.io);
    expect(code).toBe(2);
    expect(io.stderr).toContain("bogus");
    expect(io.stderr).toContain("🔴=red/kritisch/p1");
  });

  it("lists the allowed aliases for an invalid status (exit 2)", async () => {
    const io = makeIo();
    const code = await runCli(
      ["progress-update", "--root", projectA, "--phase", "Phase 2", "--step", "2.2", "--status", "wow"],
      io.io,
    );
    expect(code).toBe(2);
    expect(io.stderr).toContain("🔄=running/wip");
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

  it("fails with usage exit 2 when --root is missing", async () => {
    const io = makeIo();
    const code = await runCli(["status"], io.io);
    expect(code).toBe(2);
    expect(io.stderr).toContain("--root");
  });

  it("fails with the loader message for missing files (partial inventory)", async () => {
    const dir = tempProject("project-a");
    rmSync(join(dir, "PROGRESS.md"));
    const io = makeIo();
    const code = await runCli(["status", "--root", dir], io.io);
    expect(code).toBe(1);
    expect(io.stderr).toContain("missing required file");
  });
});

describe("runCli — --json schema contract (M6, 9.6)", () => {
  it("stamps schema: 1 on every JSON payload", async () => {
    const cases: string[][] = [
      ["status", "--root", projectA, "--json"],
      ["backlog", "--root", projectA, "--json"],
      ["progress", "--root", projectA, "--json"],
      ["validate", "--root", projectA, "--json"],
      ["validate", "--root", projectDrift, "--json"],
    ];
    for (const argv of cases) {
      const io = makeIo();
      const code = await runCli(argv, io.io);
      expect(code, argv.join(" ")).toBe(0);
      const parsed = JSON.parse(io.stdout) as { schema?: number };
      expect(parsed.schema, argv.join(" ")).toBe(1);
    }
  });

  it("stamps schema on archive and progress-update payloads (dry-run and apply)", async () => {
    const dir = tempProject("project-a");

    const dry = makeIo();
    await runCli(["archive", "--root", dir, "--id", "H1", "--note", "test", "--json"], dry.io);
    expect((JSON.parse(dry.stdout) as { schema?: number }).schema).toBe(1);

    const applied = makeIo();
    await runCli(["archive", "--root", dir, "--id", "H1", "--note", "test", "--apply", "--json"], applied.io);
    expect((JSON.parse(applied.stdout) as { schema?: number }).schema).toBe(1);

    const plan = makeIo();
    await runCli(["progress-update", "--root", dir, "--phase", "Phase 2", "--step", "2.2", "--status", "done", "--json"], plan.io);
    expect((JSON.parse(plan.stdout) as { schema?: number }).schema).toBe(1);
  });

  it("keeps the top-level key contract per command (schema + documented fields)", async () => {
    const io = makeIo();
    await runCli(["status", "--root", projectA, "--json"], io.io);
    expect(Object.keys(JSON.parse(io.stdout) as object).sort()).toEqual([
      "doneQuote", "openByPriority", "openTotal", "runningPhases", "runningSteps", "schema", "warnings",
    ]);
  });
});
