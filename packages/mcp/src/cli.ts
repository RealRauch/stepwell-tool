#!/usr/bin/env node
import { docsStatus, docsValidate, readBacklog, readProgress, type DocsStatus } from "@method-docs/core";

export interface CliIo {
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
}

interface CliOptions {
  root: string | undefined;
  json: boolean;
  priority: string[];
  open: boolean | undefined;
  section: string | undefined;
  status: string | undefined;
}

const USAGE = `usage: method-docs <command> [options]

commands:
  status    Aggregat des Projekts (offene Items, laufende Phasen, ✅-Quote)
  backlog   Items der BACKLOG.md listen
  progress  Fortschrittstabelle listen
  validate  Konsistenz prüfen (Exit 1 bei Funden)

options:
  --root <dir>       Projekt-Root (Pflicht)
  --priority <list>  Komma-Liste: 🔴,🟠,🟡,🟢,🔵,unknown
  --open <bool>      Checkbox-Filter (true/false, nur backlog)
  --section <title>  Exakter Sektions-Titel (nur backlog)
  --status <icon>    Status-Filter (nur progress): ⬜,🔄,✅,⛔,unknown
  --json             Roh-Payloads statt Lesbarkeit
`;

function parseArgs(argv: string[]): { command: string | undefined; options: CliOptions } {
  const options: CliOptions = {
    root: undefined,
    json: false,
    priority: [],
    open: undefined,
    section: undefined,
    status: undefined,
  };
  let command: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    const next = (): string | undefined => argv[++i];
    switch (arg) {
      case "--root":
        options.root = next();
        break;
      case "--json":
        options.json = true;
        break;
      case "--priority":
        options.priority = (next() ?? "").split(",").map((p) => p.trim()).filter((p) => p !== "");
        break;
      case "--open": {
        const value = next();
        options.open = value === "false" ? false : value === "true" ? true : true;
        if (value !== "false" && value !== "true") i--;
        break;
      }
      case "--section":
        options.section = next();
        break;
      case "--status":
        options.status = next();
        break;
      default:
        if (command === undefined && !arg.startsWith("-")) {
          command = arg;
        } else {
          throw new UsageError(`unknown argument: ${arg}`);
        }
    }
  }
  return { command, options };
}

export class UsageError extends Error {}

function requireRoot(options: CliOptions): string {
  if (options.root === undefined || options.root === "") {
    throw new UsageError("missing required option: --root <dir>");
  }
  return options.root;
}

function basename(path: string): string {
  return path.split(/[\\/]/u).pop() ?? path;
}

function statusText(s: DocsStatus): string {
  const prio = s.openByPriority;
  const prioLine = `🔴 ${prio["🔴"]} · 🟠 ${prio["🟠"]} · 🟡 ${prio["🟡"]} · 🟢 ${prio["🟢"]} · 🔵 ${prio["🔵"]} · unknown ${prio.unknown}`;
  const steps = s.runningSteps.length > 0
    ? s.runningSteps.map((r) => `${r.step} ${r.name} (${r.status})`).join(", ")
    : "(keine)";
  const phases = s.runningPhases.length > 0 ? s.runningPhases.join(", ") : "(keine)";
  const quote = `✅-Quote: ${s.doneQuote.done}/${s.doneQuote.total} (${s.doneQuote.percent}%)`;
  return [
    `Offene Items: ${s.openTotal} (${prioLine})`,
    `Laufende Steps: ${steps}`,
    `Laufende Phasen: ${phases}`,
    quote,
    `Warnungen: ${s.warnings.length}`,
    "",
  ].join("\n");
}

function backlogText(items: Array<{ id: string; title: string; priority: string; section: string; open: boolean }>): string {
  const lines = items.map((i) => `${i.id} ${i.priority} [${i.open ? " " : "x"}] ${i.section} — ${i.title}`);
  return [...lines, "", `Items: ${items.length}`, ""].join("\n");
}

function progressText(rows: Array<{ step: string; name: string; status: string }>): string {
  const lines = rows.map((r) => `${r.step} ${r.status} ${r.name}`);
  return [...lines, "", `Zeilen: ${rows.length}`, ""].join("\n");
}

function validateText(result: { findings: Array<{ code: string; file: string; line?: number; message: string }>; warnings: Array<{ code: string }>; ok: boolean }): string {
  const lines: string[] = [];
  if (result.ok) {
    lines.push("OK — keine Konsistenz-Funde.");
  } else {
    lines.push(`Funde: ${result.findings.length}`);
    for (const f of result.findings) {
      const where = f.line === undefined ? basename(f.file) : `${basename(f.file)}:${f.line}`;
      lines.push(`${f.code} ${where} — ${f.message}`);
    }
  }
  lines.push(`Warnungen (Parse): ${result.warnings.length}`);
  lines.push("");
  return lines.join("\n");
}

export async function runCli(argv: string[], io: CliIo): Promise<number> {
  let command: string | undefined;
  let options: CliOptions;
  try {
    const parsed = parseArgs(argv);
    command = parsed.command;
    options = parsed.options;
  } catch (err) {
    if (err instanceof UsageError) {
      io.stderr.write(`${err.message}\n\n${USAGE}`);
      return 2;
    }
    throw err;
  }

  if (command === undefined || !["status", "backlog", "progress", "validate"].includes(command)) {
    io.stderr.write(USAGE);
    return 2;
  }

  try {
    switch (command) {
      case "status": {
        const s = docsStatus(requireRoot(options));
        io.stdout.write(options.json ? `${JSON.stringify(s, null, 2)}\n` : statusText(s));
        return 0;
      }
      case "backlog": {
        const root = requireRoot(options);
        const parsed = readBacklog(root);
        let items = parsed.value.items;
        if (options.priority.length > 0) {
          const wanted = new Set(options.priority);
          items = items.filter((i) => wanted.has(i.priority));
        }
        if (options.open !== undefined) {
          items = items.filter((i) => i.open === options.open);
        }
        if (options.section !== undefined) {
          items = items.filter((i) => i.section === options.section);
        }
        if (options.json) {
          io.stdout.write(`${JSON.stringify({ count: items.length, items: items.map(({ raw: _raw, ...rest }) => rest), warnings: parsed.warnings }, null, 2)}\n`);
        } else {
          io.stdout.write(backlogText(items));
        }
        return 0;
      }
      case "progress": {
        const root = requireRoot(options);
        const parsed = readProgress(root);
        let rows = parsed.value.rows;
        if (options.status !== undefined) {
          rows = rows.filter((r) => r.status === options.status);
        }
        io.stdout.write(options.json ? `${JSON.stringify({ count: rows.length, rows, warnings: parsed.warnings }, null, 2)}\n` : progressText(rows));
        return 0;
      }
      case "validate": {
        const result = docsValidate(requireRoot(options));
        io.stdout.write(options.json ? `${JSON.stringify(result, null, 2)}\n` : validateText(result));
        return result.ok ? 0 : 1;
      }
      default:
        io.stderr.write(USAGE);
        return 2;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    io.stderr.write(`error: ${message}\n`);
    return 1;
  }
}

const isDirectRun = process.argv[1] !== undefined && /cli\.ts$/u.test(process.argv[1]);
if (isDirectRun) {
  process.exitCode = await runCli(process.argv.slice(2), { stdout: process.stdout, stderr: process.stderr });
}
