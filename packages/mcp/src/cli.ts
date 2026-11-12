#!/usr/bin/env node
import {
  applyArchivePlan,
  applyProgressPlan,
  docsRepair,
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
  type DocsRepairPlan,
  type DocsStatus,
  type PlanChange,
  type ProgressUpdatePlan,
} from "stepwell-core";
import {
  commitDocs,
  docCommitMessage,
  pullTrunk,
  pushTrunk,
  syncPreview,
  workstreamReport,
  type PullPreviewOk,
  type PushPreviewOk,
  type SyncError,
  type SyncPreviewOk,
  type WorkstreamReportOk,
} from "stepwell-git";

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

/** One-line commit outcome for human-readable output (H5/26.3). */
function commitLine(outcome: Record<string, unknown>): string {
  if (outcome.ok === true) {
    const committed = outcome.committed === true;
    return committed
      ? `Committed ${(outcome.files as string[] | undefined)?.length ?? 0} doc file(s): ${outcome.sha ?? "?"}`
      : "Nothing to commit (docs unchanged)";
  }
  const error = outcome.error as { code: string; message: string } | undefined;
  return `Commit failed (${error?.code}): ${error?.message ?? "unknown cause"}`;
}

// --- sync text renderers (H5/26.5) ----------------------------------------

function syncErrorText(error: SyncError): string {
  const files = error.files !== undefined && error.files.length > 0 ? ` (files: ${error.files.join(", ")})` : "";
  return `sync failed (${error.code}): ${error.message}${files}\n`;
}

function syncStatusText(report: WorkstreamReportOk | { ok: false; error: SyncError }): string {
  if (!report.ok) return syncErrorText(report.error);
  const lines = [`Trunk: ${report.trunk}`, `Current branch: ${report.current}`];
  if (report.worktrees.length === 0) {
    lines.push("Workstreams: none (single-tree mode)");
    lines.push("Set up a workstream: git worktree add ../<project>-<branch> -b <branch>");
  } else {
    lines.push("Workstreams:");
    for (const ws of report.worktrees) {
      const state = ws.branch === "" ? "(detached)" : `${ws.ahead} ahead / ${ws.behind} behind`;
      const live = ws.lastSubject === "" ? "" : ` — last: "${ws.lastSubject}"`;
      const overlap = ws.overlap.length > 0 ? ` — overlap: ${ws.overlap.join(", ")}` : "";
      const dirty = ws.dirty ? " [dirty]" : "";
      lines.push(`  ${ws.path} (${ws.branch}) ${state}${dirty}${live}${overlap}`);
      // H10/30.4: file-based collision prognosis from open-item Location bullets
      for (const p of ws.predictedOverlap) {
        lines.push(`    predicted overlap: ${p.path} (open items: ${p.openItems.join(", ")})`);
      }
    }
  }
  return `${lines.join("\n")}\n`;
}

function syncPreviewText(preview: SyncPreviewOk): string {
  if (preview.direction === "pull") {
    const p: PullPreviewOk = preview;
    return [
      `pull preview (dry-run): trunk "${p.trunk}" → branch "${p.branch}"`,
      `  behind: ${p.behind} commit(s), files: ${p.files.length === 0 ? "(none)" : p.files.join(", ")}`,
      p.overlap.length > 0 ? `  overlap (likely conflicts): ${p.overlap.join(", ")}` : "  overlap: none",
    ].join("\n") + "\n";
  }
  const p: PushPreviewOk = preview;
  return [
    `push preview (dry-run): branch "${p.branch}" → trunk "${p.trunk}"`,
    `  ahead: ${p.ahead} commit(s), trunk would move to ${p.target}`,
  ].join("\n") + "\n";
}

function syncApplyText(direction: "pull" | "push", outcome: { ok: true; fastForward?: boolean; mergedFiles?: number }): string {
  if (direction === "pull") {
    return `pulled trunk into branch: fast-forward=${outcome.fastForward === true}, files changed: ${outcome.mergedFiles ?? 0}\n`;
  }
  return "pushed branch to trunk: trunk fast-forwarded to the branch head\n";
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
  commit: boolean;
  commitMessage: string | undefined;
  positionals: string[];
}

const USAGE = `usage: stepwell <command> [options]

commands:
  status           Project aggregate (open items, running phases, ✅ ratio)
  backlog          List items of BACKLOG.md
  progress         List progress table rows
  validate         Check consistency (exit 1 on findings)
  repair           Mechanically repair validate findings over the responsible
                   planners (dry-run; --apply to write; exit 1 while findings remain)
  archive          Move completed item into archive (dry-run; --apply to write)
  progress-update  Update step status incl. phase completion (dry-run; --apply to write)
  sync <direction> Git workstream sync (H5): status (read-only report) | pull | push.
                   pull/push are pre-flight previews by default; --apply executes.

options:
  --root <dir>       Project root (defaults to the current directory)
  --priority <list>  Comma list, icons or aliases: 🔴=red/critical/p1, 🟠=orange/high/p2,
                     🟡=yellow/medium/p3, 🟢=green/low/p4, 🔵=blue/test/p5, unknown
  --open <bool>      Checkbox filter (true/false, backlog only)
  --section <title>  Exact section title (backlog only)
  --status <icon>    Status filter (progress) or new icon (progress-update):
                     ⬜=open, 🔄=running/wip, ✅=done, ⛔=blocked, unknown (filter only)
  --id <id>          Item id (archive only)
  --note <text>      Done/verification note (archive, progress-update)
  --title <text>     New phase title (progress-update) — renames the block heading
  --checkpoint <sha> Commit SHA of the phase, 7–40 hex (progress-update) — lands in
                     the verification line of the archive block
  --locale <de|en>   Language for generated text (archive, progress-update; default: auto-detect)
  --apply            Write the changes (archive, progress-update; default: dry-run preview)
  --commit           After a successful apply, commit ONLY the four doc files (archive,
                     progress-update; ignored for dry-runs). Refused when the index has
                     pre-staged changes (COMMIT_BLOCKED); a failed commit keeps the edits
                     applied (COMMIT_FAILED) and the command exits 1.
  --commit-message   Commit subject with --commit; default generated from the operation
  --json             Raw payloads instead of human-readable text
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
    commit: false,
    commitMessage: undefined,
    positionals: [],
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
      case "--commit":
        options.commit = true;
        break;
      case "--commit-message":
        options.commitMessage = next();
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
        } else if (!arg.startsWith("-")) {
          options.positionals.push(arg);
        } else {
          throw new UsageError(`unknown argument: ${arg}`);
        }
    }
  }
  return { command, options };
}

export class UsageError extends Error {}

function requireRoot(options: CliOptions, defaultRoot: string | undefined): string {
  const root = options.root === undefined || options.root === "" ? defaultRoot : options.root;
  if (root === undefined || root === "") {
    throw new UsageError("missing required option: --root <dir> (or run inside a project directory)");
  }
  return root;
}

function basename(path: string): string {
  return path.split(/[\\/]/u).pop() ?? path;
}

function requireLocale(options: CliOptions): "de" | "en" | undefined {
  if (options.locale === undefined || options.locale === "") return undefined;
  if (options.locale !== "de" && options.locale !== "en") {
    throw new UsageError("invalid --locale: allowed values are de and en");
  }
  return options.locale;
}

function requirePriorities(options: CliOptions): string[] {
  return options.priority.map((token) => {
    const resolved = resolvePriority(token);
    if (resolved === undefined) {
      throw new UsageError(`invalid --priority value: "${token}" — allowed: ${priorityAliasHelp()}`);
    }
    return resolved;
  });
}

function requireStatusFilter(options: CliOptions): string {
  const resolved = resolveStatus(options.status!);
  if (resolved === undefined) {
    throw new UsageError(
      `invalid --status value: "${options.status}" — allowed: ${statusAliasHelp()}`,
    );
  }
  return resolved;
}

function requireStatusIcon(options: CliOptions): "⬜" | "🔄" | "✅" | "⛔" {
  const resolved = resolveStatus(options.status!);
  if (resolved === undefined || resolved === "unknown") {
    throw new UsageError(
      `invalid --status value: "${options.status}" — allowed: ${statusAliasHelp().replace(", unknown", "")}`,
    );
  }
  return resolved;
}

function statusText(s: DocsStatus): string {
  const prio = s.openByPriority;
  const prioLine = `🔴 ${prio["🔴"]} · 🟠 ${prio["🟠"]} · 🟡 ${prio["🟡"]} · 🟢 ${prio["🟢"]} · 🔵 ${prio["🔵"]} · unknown ${prio.unknown}`;
  const steps = s.runningSteps.length > 0
    ? s.runningSteps.map((r) => `${r.step} ${r.name} (${r.status})`).join(", ")
    : "(none)"
  const phases = s.runningPhases.length > 0 ? s.runningPhases.join(", ") : "(none)";
  const nextStep = s.nextStep !== undefined ? `${s.nextStep.step} ${s.nextStep.name} (⬜)` : "(none)";
  const nextPriority = s.nextPriority !== undefined
    ? `${s.nextPriority} (${s.openByPriority[s.nextPriority]} open)`
    : "(none)";
  const quote = `✅ ratio: ${s.doneQuote.done}/${s.doneQuote.total} (${s.doneQuote.percent}%)`;
  // L24/32.7: growth is measurable — one compact line over all doc files
  const docFiles = s.docFiles.length > 0
    ? `Doc files: ${s.docFiles.length} files, ${s.docFiles.reduce((n, f) => n + f.lines, 0)} lines, ${s.docFiles.reduce((n, f) => n + f.bytes, 0)} bytes`
    : "Doc files: (none)";
  return [
    `Open items: ${s.openTotal} (${prioLine})`,
    `Running steps: ${steps}`,
    `Running phases: ${phases}`,
    `Next step: ${nextStep}`,
    `Next priority: ${nextPriority}`,
    quote,
    docFiles,
    `Warnings: ${s.warnings.length}`,
    "",
  ].join("\n");
}

function backlogText(items: Array<{ id: string; title: string; priority: string; section: string; open: boolean }>): string {
  const lines = items.map((i) => `${i.id} ${i.priority} [${i.open ? " " : "x"}] ${i.section} — ${i.title}`);
  return [...lines, "", `Items: ${items.length}`, ""].join("\n");
}

function progressText(rows: Array<{ step: string; name: string; status: string }>): string {
  const lines = rows.map((r) => `${r.step} ${r.status} ${r.name}`);
  return [...lines, "", `Rows: ${rows.length}`, ""].join("\n");
}

function validateText(result: {
  findings: Array<{ code: string; file: string; line?: number; message: string }>;
  acknowledged: Array<{ code: string; file: string; line?: number; message: string }>;
  warnings: Array<{ code: string }>;
  ok: boolean;
}): string {
  const lines: string[] = [];
  if (result.ok) {
    lines.push("OK — no consistency findings.");
  } else {
    lines.push(`Findings: ${result.findings.length}`);
    for (const f of result.findings) {
      const where = f.line === undefined ? basename(f.file) : `${basename(f.file)}:${f.line}`;
      lines.push(`${f.code} ${where} — ${f.message}`);
    }
  }
  if (result.acknowledged.length > 0) {
    lines.push(`Acknowledged (accepted findings): ${result.acknowledged.length}`);
    for (const f of result.acknowledged) {
      const where = f.line === undefined ? basename(f.file) : `${basename(f.file)}:${f.line}`;
      lines.push(`  ${f.code} ${where}`);
    }
  }
  lines.push(`Warnings (parse): ${result.warnings.length}`);
  lines.push("");
  return lines.join("\n");
}

function planText(plan: { dryRun: boolean; changes: PlanChange[] }): string {
  const lines: string[] = [
    plan.dryRun ? "Dry-run — nothing was written (--apply to apply)." : "Apply — changes written:",
    "",
  ];
  for (const change of plan.changes as PlanChange[]) {
    lines.push(`## ${basename(change.file)} — ${change.description}`);
    lines.push(change.diff);
    lines.push("");
  }
  return lines.join("\n");
}

function repairText(result: DocsRepairPlan): string {
  const lines: string[] = [
    result.dryRun ? "Dry-run — nothing was written (--apply to apply)." : "Apply — repairs executed:",
    "",
  ];
  const list = (label: string, actions: Array<{ code: string; target: string }>): void => {
    lines.push(`${label}: ${actions.length}`);
    for (const a of actions) lines.push(`  ${a.code}${a.target !== "" ? ` — ${a.target}` : ""}`);
  };
  list(result.dryRun ? "Planned" : "Applied", result.dryRun ? result.fix.planned : result.fix.applied);
  list("Skipped", result.fix.skipped);
  for (const s of result.fix.skipped) lines.push(`    reason: ${s.reason}`);
  lines.push("");
  lines.push(result.verification.ok ? "OK — no findings remain." : `Findings remaining: ${result.verification.messages.length}`);
  for (const m of result.verification.messages) lines.push(`  ${m}`);
  lines.push("");
  if (!result.dryRun) {
    for (const change of result.changes) {
      lines.push(`## ${basename(change.file)} — ${change.description}`);
      lines.push(change.diff);
      lines.push("");
    }
  }
  return lines.join("\n");
}

function applyResultText(result: ApplyResult): string {
  const lines = [
    result.verification.ok ? "OK — archival verified." : "ERROR — verification failed:",
    ...result.verification.messages.map((m) => `  ${m}`),
    "",
  ];
  return lines.join("\n");
}

export async function runCli(argv: string[], io: CliIo, defaultRoot?: string): Promise<number> {
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

  if (command === undefined || !["status", "backlog", "progress", "validate", "repair", "archive", "progress-update", "sync"].includes(command)) {
    io.stderr.write(USAGE);
    return 2;
  }

  try {
    switch (command) {
      case "status": {
        const s = docsStatus(requireRoot(options, defaultRoot));
        io.stdout.write(options.json ? jsonOut(s as unknown as Record<string, unknown>) : statusText(s));
        return 0;
      }
      case "backlog": {
        const root = requireRoot(options, defaultRoot);
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
        const root = requireRoot(options, defaultRoot);
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
        const result = docsValidate(requireRoot(options, defaultRoot));
        io.stdout.write(options.json ? jsonOut(result) : validateText(result));
        return result.ok ? 0 : 1;
      }
      case "repair": {
        const result = docsRepair(requireRoot(options, defaultRoot), { dryRun: !options.apply });
        io.stdout.write(options.json ? jsonOut(result as unknown as Record<string, unknown>) : repairText(result));
        return result.dryRun ? 0 : result.verification.ok ? 0 : 1;
      }
      case "archive": {
        const root = requireRoot(options, defaultRoot);
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
        let commitOutcome: Record<string, unknown> | undefined;
        if (options.commit) {
          const outcome = commitDocs(root, {
            message: options.commitMessage ?? docCommitMessage({ kind: "archive", id: options.id }),
          });
          commitOutcome = outcome as Record<string, unknown>;
          (result as unknown as Record<string, unknown>).commit = commitOutcome;
        }
        if (options.json) {
          io.stdout.write(jsonOut(result as unknown as Record<string, unknown>));
        } else {
          io.stdout.write(applyResultText(result));
          if (commitOutcome !== undefined) io.stdout.write(`${commitLine(commitOutcome)}\n`);
        }
        return result.verification.ok && (commitOutcome?.ok !== false) ? 0 : 1;
      }
      case "progress-update": {
        const root = requireRoot(options, defaultRoot);
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
        let commitOutcome: Record<string, unknown> | undefined;
        if (options.commit) {
          const outcome = commitDocs(root, {
            message: options.commitMessage ??
              docCommitMessage({ kind: "progress", steps: [options.step], status: statusIcon }),
          });
          commitOutcome = outcome as Record<string, unknown>;
          (result as unknown as Record<string, unknown>).commit = commitOutcome;
        }
        if (options.json) {
          io.stdout.write(jsonOut(result as unknown as Record<string, unknown>));
        } else {
          io.stdout.write(applyResultText(result));
          if (commitOutcome !== undefined) io.stdout.write(`${commitLine(commitOutcome)}\n`);
        }
        return result.verification.ok && (commitOutcome?.ok !== false) ? 0 : 1;
      }
      case "sync": {
        const root = requireRoot(options, defaultRoot);
        const direction = options.positionals[0];
        if (direction === undefined || options.positionals.length > 1) {
          throw new UsageError("usage: stepwell sync <status|pull|push> (exactly one direction)");
        }
        if (direction !== "status" && direction !== "pull" && direction !== "push") {
          throw new UsageError(`unknown sync direction: ${direction}`);
        }
        if (direction === "status") {
          const report = workstreamReport(root);
          if (options.json) {
            io.stdout.write(jsonOut(report as unknown as Record<string, unknown>));
          } else {
            io.stdout.write(syncStatusText(report));
          }
          return report.ok ? 0 : 1;
        }
        const dryRun = !options.apply;
        const preview = syncPreview(root, direction);
        if (dryRun || !preview.ok) {
          if (options.json) {
            io.stdout.write(jsonOut({ direction, dryRun, ...preview } as unknown as Record<string, unknown>));
          } else {
            io.stdout.write(preview.ok ? syncPreviewText(preview) : syncErrorText(preview.error));
          }
          return preview.ok ? 0 : 1;
        }
        const outcome = direction === "pull" ? pullTrunk(root) : pushTrunk(root);
        if (options.json) {
          io.stdout.write(jsonOut({ direction, dryRun, ...outcome } as unknown as Record<string, unknown>));
        } else {
          io.stdout.write(outcome.ok ? syncApplyText(direction, outcome) : syncErrorText(outcome.error));
        }
        return outcome.ok ? 0 : 1;
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
  process.exitCode = await runCli(
    process.argv.slice(2),
    { stdout: process.stdout, stderr: process.stderr },
    process.cwd(),
  );
}
