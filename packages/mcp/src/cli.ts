#!/usr/bin/env node
import {
  applyArchivePlan,
  applyProgressPlan,
  docsStatus,
  docsValidate,
  planArchiveItem,
  planProgressUpdate,
  priorityAliasHelp,
  readBacklog,
  readProgress,
  resolvePriority,
  resolveStatus,
  statusAliasHelp,
  type ArchiveItemPlan,
  type ApplyResult,
  type DocsStatus,
  type PlanChange,
  type ProgressUpdatePlan,
} from "stepwell-core";

export interface CliIo {
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
}

/**
 * Version des JSON-Output-Kontrakts aller `--json`-Ausgaben (M6/9.6). Regel:
 * Breaking-Änderung an Feldern je Command ⇒ diese Zahl hochzählen (Decision 16).
 */
export const JSON_SCHEMA_VERSION = 2;

function jsonOut(payload: Record<string, unknown>): string {
  return `${JSON.stringify({ schema: JSON_SCHEMA_VERSION, ...payload }, null, 2)}\n`;
}

interface CliOptions {
  root: string | undefined;
  json: boolean;
  priority: string[];
  open: boolean | undefined;
  section: string | undefined;
  status: string | undefined;
  id: string | undefined;
  note: string | undefined;
  title: string | undefined;
  checkpoint: string | undefined;
  phase: string | undefined;
  step: string | undefined;
  locale: string | undefined;
  apply: boolean;
}

const USAGE = `usage: stepwell <command> [options]

commands:
  status           Aggregat des Projekts (offene Items, laufende Phasen, ✅-Quote)
  backlog          Items der BACKLOG.md listen
  progress         Fortschrittstabelle listen
  validate         Konsistenz prüfen (Exit 1 bei Funden)
  archive          Erledigtes Item ins Archiv verschieben (Dry-run; --apply zum Schreiben)
  progress-update  Step-Status pflegen inkl. Phasen-Abschluss (Dry-run; --apply zum Schreiben)

options:
  --root <dir>       Projekt-Root (Pflicht)
  --priority <list>  Komma-Liste, Icons oder Aliase: 🔴=red/kritisch/p1, 🟠=orange/hoch/p2,
                     🟡=yellow/mittel/p3, 🟢=green/niedrig/p4, 🔵=blue/test/p5, unknown
  --open <bool>      Checkbox-Filter (true/false, nur backlog)
  --section <title>  Exakter Sektions-Titel (nur backlog)
  --status <icon>    Status-Filter (progress) bzw. neues Icon (progress-update):
                     ⬜=open, 🔄=running/wip, ✅=done, ⛔=blocked, unknown (nur Filter)
  --id <id>          Item-ID (nur archive)
  --note <text>      Erledigt-/Verifikations-Notiz (archive, progress-update)
  --title <text>     Neuer Phasen-Titel (progress-update) — benennt Block-Heading um
  --checkpoint <sha> Commit-SHA der Phase, 7–40 Hex (progress-update) — landet in der
                     Verifikations-Zeile des Archiv-Blocks
  --locale <de|en>   Sprache generierter Texte (archive, progress-update; Default: Auto-Erkennung)
  --apply            Änderungen schreiben (archive, progress-update; Default: Dry-run-Vorschau)
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
    id: undefined,
    note: undefined,
    title: undefined,
    checkpoint: undefined,
    phase: undefined,
    step: undefined,
    locale: undefined,
    apply: false,
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
      case "--id":
        options.id = next();
        break;
      case "--note":
        options.note = next();
        break;
      case "--title":
        options.title = next();
        break;
      case "--checkpoint":
        options.checkpoint = next();
        break;
      case "--apply":
        options.apply = true;
        break;
      case "--phase":
        options.phase = next();
        break;
      case "--step":
        options.step = next();
        break;
      case "--locale":
        options.locale = next();
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

function requireLocale(options: CliOptions): "de" | "en" | undefined {
  if (options.locale === undefined || options.locale === "") return undefined;
  if (options.locale !== "de" && options.locale !== "en") {
    throw new UsageError("invalid --locale: erlaubt sind de und en");
  }
  return options.locale;
}

function requirePriorities(options: CliOptions): string[] {
  return options.priority.map((token) => {
    const resolved = resolvePriority(token);
    if (resolved === undefined) {
      throw new UsageError(`invalid --priority value: "${token}" — erlaubt sind ${priorityAliasHelp()}`);
    }
    return resolved;
  });
}

function requireStatusFilter(options: CliOptions): string {
  const resolved = resolveStatus(options.status!);
  if (resolved === undefined) {
    throw new UsageError(
      `invalid --status value: "${options.status}" — erlaubt sind ${statusAliasHelp()}`,
    );
  }
  return resolved;
}

function requireStatusIcon(options: CliOptions): "⬜" | "🔄" | "✅" | "⛔" {
  const resolved = resolveStatus(options.status!);
  if (resolved === undefined || resolved === "unknown") {
    throw new UsageError(
      `invalid --status value: "${options.status}" — erlaubt sind ${statusAliasHelp().replace(", unknown", "")}`,
    );
  }
  return resolved;
}

function statusText(s: DocsStatus): string {
  const prio = s.openByPriority;
  const prioLine = `🔴 ${prio["🔴"]} · 🟠 ${prio["🟠"]} · 🟡 ${prio["🟡"]} · 🟢 ${prio["🟢"]} · 🔵 ${prio["🔵"]} · unknown ${prio.unknown}`;
  const steps = s.runningSteps.length > 0
    ? s.runningSteps.map((r) => `${r.step} ${r.name} (${r.status})`).join(", ")
    : "(keine)";
  const phases = s.runningPhases.length > 0 ? s.runningPhases.join(", ") : "(keine)";
  const nextStep = s.nextStep !== undefined ? `${s.nextStep.step} ${s.nextStep.name} (⬜)` : "(keiner)";
  const nextPriority = s.nextPriority !== undefined
    ? `${s.nextPriority} (${s.openByPriority[s.nextPriority]} offen)`
    : "(keine)";
  const quote = `✅-Quote: ${s.doneQuote.done}/${s.doneQuote.total} (${s.doneQuote.percent}%)`;
  return [
    `Offene Items: ${s.openTotal} (${prioLine})`,
    `Laufende Steps: ${steps}`,
    `Laufende Phasen: ${phases}`,
    `Nächster Step: ${nextStep}`,
    `Nächste Priorität: ${nextPriority}`,
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

function planText(plan: { dryRun: boolean; changes: PlanChange[] }): string {
  const lines: string[] = [
    plan.dryRun ? "Dry-run — es wurde nichts geschrieben (--apply zum Anwenden)." : "Apply — Änderungen geschrieben:",
    "",
  ];
  for (const change of plan.changes as PlanChange[]) {
    lines.push(`## ${basename(change.file)} — ${change.description}`);
    lines.push(change.diff);
    lines.push("");
  }
  return lines.join("\n");
}

function applyResultText(result: ApplyResult): string {
  const lines = [
    result.verification.ok ? "OK — Archivierung verifiziert." : "FEHLER — Verifikation fehlgeschlagen:",
    ...result.verification.messages.map((m) => `  ${m}`),
    "",
  ];
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

  if (command === undefined || !["status", "backlog", "progress", "validate", "archive", "progress-update"].includes(command)) {
    io.stderr.write(USAGE);
    return 2;
  }

  try {
    switch (command) {
      case "status": {
        const s = docsStatus(requireRoot(options));
        io.stdout.write(options.json ? jsonOut(s as unknown as Record<string, unknown>) : statusText(s));
        return 0;
      }
      case "backlog": {
        const root = requireRoot(options);
        const parsed = readBacklog(root);
        let items = parsed.value.items;
        const priorities = requirePriorities(options);
        if (priorities.length > 0) {
          const wanted = new Set(priorities);
          items = items.filter((i) => wanted.has(i.priority));
        }
        if (options.open !== undefined) {
          items = items.filter((i) => i.open === options.open);
        }
        if (options.section !== undefined) {
          items = items.filter((i) => i.section === options.section);
        }
        if (options.json) {
          io.stdout.write(jsonOut({ count: items.length, items: items.map(({ raw: _raw, ...rest }) => rest), warnings: parsed.warnings }));
        } else {
          io.stdout.write(backlogText(items));
        }
        return 0;
      }
      case "progress": {
        const root = requireRoot(options);
        const parsed = readProgress(root);
        let rows = parsed.value.rows;
        if (options.status !== undefined && options.status !== "") {
          const wanted = requireStatusFilter(options);
          rows = rows.filter((r) => r.status === wanted);
        }
        io.stdout.write(options.json ? jsonOut({ count: rows.length, rows, warnings: parsed.warnings }) : progressText(rows));
        return 0;
      }
      case "validate": {
        const result = docsValidate(requireRoot(options));
        io.stdout.write(options.json ? jsonOut(result) : validateText(result));
        return result.ok ? 0 : 1;
      }
      case "archive": {
        const root = requireRoot(options);
        if (options.id === undefined || options.id === "") {
          throw new UsageError("missing required option: --id <itemId>");
        }
        const locale = requireLocale(options);
        const plan = planArchiveItem(root, options.id, {
          dryRun: !options.apply,
          ...(options.note !== undefined ? { note: options.note } : {}),
          ...(locale !== undefined ? { locale } : {}),
        });
        if (plan.dryRun) {
          io.stdout.write(options.json ? jsonOut(plan as unknown as Record<string, unknown>) : planText(plan));
          return 0;
        }
        const result = applyArchivePlan(plan);
        if (options.json) {
          io.stdout.write(jsonOut(result as unknown as Record<string, unknown>));
        } else {
          io.stdout.write(applyResultText(result));
        }
        return result.verification.ok ? 0 : 1;
      }
      case "progress-update": {
        const root = requireRoot(options);
        if (options.phase === undefined || options.phase === "") {
          throw new UsageError("missing required option: --phase <phase>");
        }
        if (options.step === undefined || options.step === "") {
          throw new UsageError("missing required option: --step <nr>");
        }
        if (options.status === undefined || options.status === "") {
          throw new UsageError("missing required option: --status <icon|alias>");
        }
        const statusIcon = requireStatusIcon(options);
        const plan = planProgressUpdate(root, options.phase, options.step, statusIcon, {
          dryRun: !options.apply,
          ...(options.title !== undefined && options.title !== "" ? { title: options.title } : {}),
          ...(options.note !== undefined ? { note: options.note } : {}),
          ...(options.checkpoint !== undefined && options.checkpoint !== ""
            ? { checkpoint: options.checkpoint }
            : {}),
          ...(requireLocale(options) !== undefined ? { locale: requireLocale(options)! } : {}),
        });
        if (plan.dryRun) {
          io.stdout.write(options.json ? jsonOut(plan as unknown as Record<string, unknown>) : planText(plan));
          return 0;
        }
        const result = applyProgressPlan(plan);
        if (options.json) {
          io.stdout.write(jsonOut(result as unknown as Record<string, unknown>));
        } else {
          io.stdout.write(applyResultText(result));
        }
        return result.verification.ok ? 0 : 1;
      }
      default:
        io.stderr.write(USAGE);
        return 2;
    }
  } catch (err) {
    if (err instanceof UsageError) {
      io.stderr.write(`${err.message}\n\n${USAGE}`);
      return 2;
    }
    const message = err instanceof Error ? err.message : String(err);
    io.stderr.write(`error: ${message}\n`);
    return 1;
  }
}

// Direktausführung aus src (cli.ts, native TS) wie aus dist (cli.js, H1/10.5) —
// die Heuristik muss beide Endungen erkennen, sonst startet das installierte Bin nicht.
const isDirectRun = process.argv[1] !== undefined && /cli\.(ts|js)$/u.test(process.argv[1]);
if (isDirectRun) {
  process.exitCode = await runCli(process.argv.slice(2), { stdout: process.stdout, stderr: process.stderr });
}
