import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { lineDiff } from "./diff.ts";
import { allSynonyms, canonical, detectLocale, synonymPattern, type Locale } from "./profile.ts";
import { docsValidate } from "./validate.ts";
import { loadProject } from "./project.ts";
import type {
  ArchiveItemPlan,
  ApplyResult,
  PhaseBlock,
  PlanChange,
  ProgressUpdatePlan,
  Status,
} from "./types.ts";

export interface ArchiveItemOptions {
  dryRun?: boolean;
  note?: string;
  locale?: Locale;
}

export interface ProgressUpdateOptions {
  dryRun?: boolean;
  note?: string;
  locale?: Locale;
}

interface FileEdit {
  relPath: string;
  description: string;
  transform: (content: string, eol: string) => string;
}

function readText(path: string): { content: string; eol: string } {
  const content = readFileSync(path, "utf8");
  return { content, eol: content.includes("\r\n") ? "\r\n" : "\n" };
}

function normalizeNote(note: string | undefined): string | undefined {
  const trimmed = note?.trim();
  return trimmed === "" ? undefined : trimmed;
}

function buildChanges(root: string, edits: FileEdit[]): PlanChange[] {
  return edits.map((edit) => {
    const path = join(root, edit.relPath);
    const { content, eol } = readText(path);
    const after = edit.transform(content, eol);
    return {
      file: path,
      description: edit.description,
      before: content,
      after,
      diff: lineDiff(content, after),
    };
  });
}

const ITEM_HEADING = /^###\s+\[(.)\]\s*(.*)$/u;
const SECTION_HEADING = /^##\s+/;
const RULE_LINE = /^-{3,}\s*$/u;
const INDEX_HEADING = synonymPattern("doneIndexHeading");

export function planArchiveItem(
  root: string,
  id: string,
  options: ArchiveItemOptions = {},
): ArchiveItemPlan {
  const dryRun = options.dryRun ?? true;
  const note = normalizeNote(options.note);
  const docs = loadProject(root);

  const item = docs.backlog().value.items.find((i) => i.id === id);
  if (item === undefined) {
    const archived = docs.backlogArchive().value.some((i) => i.id === id);
    if (archived) {
      throw new Error(`item "${id}" is already archived`);
    }
    throw new Error(`unknown open item id: ${id} (nicht im offenen BACKLOG)`);
  }

  const backlogRel = "BACKLOG.md";
  const archiveRel = join("docs", "archive", "BACKLOG_ARCHIVE.md");
  const backlogText = readText(join(root, backlogRel)).content;
  const archiveText = readText(join(root, archiveRel)).content;
  const locale = options.locale ?? detectLocale(backlogText, archiveText);
  const doneWord = canonical("doneWord", locale);
  const doneLabel = canonical("doneLabel", locale);

  const removeBlock = (content: string, eol: string): string => {
    const lines = content.split(eol);
    const start = item.span.start - 1;
    const count = item.span.end - item.span.start + 1;
    lines.splice(start, count);
    if (
      start - 1 >= 0 &&
      (lines[start - 1]?.trim() ?? "x") === "" &&
      (lines[start]?.trim() ?? "x") === ""
    ) {
      lines.splice(start, 1);
    }
    return lines.join(eol);
  };

  const appendIndexLine = (content: string, eol: string): string => {
    const lines = content.split(eol);
    let sectionStart = -1;
    for (const [idx, line] of lines.entries()) {
      if (SECTION_HEADING.test(line) && INDEX_HEADING.test(line)) {
        sectionStart = idx;
        break;
      }
    }
    if (sectionStart === -1) {
      throw new Error(`missing Erledigt-Index section in ${backlogRel}`);
    }
    let end = sectionStart + 1;
    while (end < lines.length && !SECTION_HEADING.test(lines[end]!) && !RULE_LINE.test(lines[end]!)) {
      end += 1;
    }
    let insertAt = end;
    while (insertAt > sectionStart + 1 && (lines[insertAt - 1]?.trim() ?? "") === "") {
      insertAt -= 1;
    }
    const entryLine = `- ${item.id} — ${item.title} — ${doneWord}${note !== undefined ? ` (${note})` : ""}`;
    lines.splice(insertAt, 0, entryLine);
    return lines.join(eol);
  };

  const appendToArchive = (content: string, eol: string): string => {
    const blockLines = item.raw.split(eol);
    const heading = blockLines[0] ?? `### [ ] ${item.id}`;
    blockLines[0] = heading.replace(/^###\s+\[ \]/u, "### [x]");
    if (note !== undefined) {
      blockLines.push(`- **${doneLabel}:** ${note}`);
    }
    const blockText = blockLines.join(eol);
    const trimmed = content.replace(/\s+$/u, "");
    return `${trimmed}${eol}${eol}---${eol}${eol}${blockText}${eol}`;
  };

  const changes = buildChanges(root, [
    {
      relPath: backlogRel,
      description: `Item "${id}" aus dem offenen BACKLOG entfernen (span ${item.span.start}–${item.span.end}, verbatim)`,
      transform: (content, eol) => appendIndexLine(removeBlock(content, eol), eol),
    },
    {
      relPath: archiveRel,
      description: `Item-Block "${id}" verbatim ans BACKLOG_ARCHIVE anhängen (Checkbox → [x]${note !== undefined ? ", mit Erledigt-Zeile" : ""})`,
      transform: appendToArchive,
    },
  ]);

  return { root, id, dryRun, note, changes };
}

export function applyArchivePlan(plan: ArchiveItemPlan): ApplyResult {
  if (plan.dryRun) {
    throw new Error(
      "refusing to apply a dry-run plan — create the plan with dryRun: false to apply",
    );
  }
  const written: string[] = [];
  for (const change of plan.changes) {
    writeFileSync(change.file, change.after, "utf8");
    written.push(change.file);
  }

  const messages: string[] = [];
  const fresh = loadProject(plan.root);
  const backlog = fresh.backlog().value;
  const stillOpen = backlog.items.some((i) => i.id === plan.id);
  const inArchive = fresh.backlogArchive().value.some((i) => i.id === plan.id);
  const inIndex = backlog.doneIndex.some((d) => d.id === plan.id);
  if (!stillOpen) messages.push(`item "${plan.id}" removed from open BACKLOG`);
  else messages.push(`item "${plan.id}" is STILL in the open BACKLOG`);
  if (inArchive) messages.push(`item "${plan.id}" present in BACKLOG_ARCHIVE`);
  else messages.push(`item "${plan.id}" MISSING from BACKLOG_ARCHIVE`);
  if (inIndex) messages.push(`item "${plan.id}" present in the Erledigt-Index`);
  else messages.push(`item "${plan.id}" MISSING from the Erledigt-Index`);

  const findings = docsValidate(plan.root)
    .findings
    .filter((f) => f.message.includes(`"${plan.id}"`));
  if (findings.length === 0) messages.push("docs_validate reports no findings for this id anymore");
  else for (const f of findings) messages.push(`${f.code}: ${f.message}`);

  const ok = !stillOpen && inArchive && inIndex && findings.length === 0;
  return { written, verification: { ok, messages } };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function extractScopeName(scopeEntry: string): string | undefined {
  const bold = /^\*{0,2}\s*\d+(?:\.\d+)?\s+(.+?)\s*\*\*(?:\s.*)?$/u.exec(scopeEntry);
  if (bold) return bold[1]!.trim();
  const m = /^\*{0,2}\s*\d+(?:\.\d+)?\s+(.+?)\s*(?:—.*)?$/u.exec(scopeEntry);
  return m?.[1]?.trim();
}

function tableLineHasStep(line: string, step?: string): boolean {
  if (!line.trim().startsWith("|")) return false;
  const cells = line.split("|");
  if (cells.length < 4) return false;
  const cell = cells[1]?.trim() ?? "";
  return step === undefined ? /^\d+(?:\.\d+)?$/u.test(cell) : cell === step;
}

function phaseMatches(block: PhaseBlock, phase: string): boolean {
  return block.name === phase || block.title === phase || `${block.name} — ${block.title}` === phase;
}

const SECTION_RULE = /^-{3,}\s*$/u;

function removeSpan(lines: string[], start: number, end: number): void {
  lines.splice(start - 1, end - start + 1);
  if (
    start - 2 >= 0 &&
    (lines[start - 2]?.trim() ?? "x") === "" &&
    (lines[start - 1]?.trim() ?? "x") === ""
  ) {
    lines.splice(start - 1, 1);
  }
}

export function planProgressUpdate(
  root: string,
  phase: string,
  step: string,
  status: Status,
  options: ProgressUpdateOptions = {},
): ProgressUpdatePlan {
  const dryRun = options.dryRun ?? true;
  const note = normalizeNote(options.note);
  const docs = loadProject(root);
  const progress = docs.progress().value;
  const progressText = readText(join(root, "PROGRESS.md")).content;
  const progressArchiveText = readText(join(root, "docs", "archive", "PROGRESS_ARCHIVE.md")).content;
  const locale = options.locale ?? detectLocale(progressText, progressArchiveText);
  const scopeHeading = `${canonical("scopeLabel", locale)} (Steps):`;
  const verificationLabel = canonical("verificationLabel", locale);

  const block = progress.phases.find((p) => phaseMatches(p, phase)) ?? undefined;
  const row = progress.rows.find((r) => r.step === step);

  if (block === undefined && status !== "🔄") {
    throw new Error(`unknown phase: ${phase} (nur 🔄-Phasen können neu angelegt werden)`);
  }
  if (block === undefined && row !== undefined) {
    const paramPrefix = /^Phase\s+(\d+)/u.exec(phase);
    if (paramPrefix && !row.step.startsWith(`${paramPrefix[1]!}.`)) {
      throw new Error(`unknown step: ${step} (gehört nicht zur neu anzulegenden Phase ${phase})`);
    }
  }
  const scopeEntry =
    block?.scope.find((entry) =>
      new RegExp(`^\\*{0,2}\\s*${escapeRegExp(step)}\\b`).test(entry),
    ) ?? undefined;
  if (block !== undefined && row === undefined && scopeEntry === undefined) {
    throw new Error(`unknown step: ${step} (weder in der Tabelle noch im Scope der Phase)`);
  }

  const prefixMatch = block === undefined ? undefined : /^Phase\s+(\d+)/u.exec(block.name);
  const remainingOpen = prefixMatch
    ? progress.rows.filter(
        (r) =>
          r.step.startsWith(`${prefixMatch[1]!}.`) &&
          r.step !== step &&
          (r.status === "🔄" || r.status === "⬜"),
      )
    : ["kept-open"];
  const completedPhase = status === "✅" && prefixMatch !== undefined && remainingOpen.length === 0;

  const progressRel = "PROGRESS.md";
  const archiveRel = join("docs", "archive", "PROGRESS_ARCHIVE.md");
  const rowName = row?.name ?? (scopeEntry !== undefined ? extractScopeName(scopeEntry) : undefined) ?? step;

  const editProgress = (content: string, eol: string): string => {
    const lines = content.split(eol);

    if (completedPhase && block !== undefined) {
      removeSpan(lines, block.span.start, block.span.end);
    }

    if (row !== undefined) {
      const idx = lines.findIndex((l) => tableLineHasStep(l, row.step));
      if (idx === -1) throw new Error(`table row for step ${row.step} not found`);
      const cells = lines[idx]!.split("|");
      cells[3] = ` ${status} `;
      lines[idx] = cells.join("|");
    } else {
      let lastRow = -1;
      lines.forEach((l, i) => {
        if (tableLineHasStep(l)) lastRow = i;
      });
      if (lastRow === -1) throw new Error("no progress table found in PROGRESS.md");
      lines.splice(lastRow + 1, 0, `| ${step} | ${rowName} | ${status} |`);
    }

    if (block === undefined) {
      const headingPattern = synonymPattern("runningPhasesHeading");
      const sectionStart = lines.findIndex((l) => /^##\s+/u.test(l) && headingPattern.test(l));
      if (sectionStart === -1) {
        throw new Error(
          `missing running-phases section (${allSynonyms("runningPhasesHeading").join(" | ")}) in PROGRESS.md`,
        );
      }
      let end = sectionStart + 1;
      while (end < lines.length && !/^##\s/u.test(lines[end]!) && !SECTION_RULE.test(lines[end]!)) {
        end += 1;
      }
      let insertAt = end;
      while (insertAt > sectionStart + 1 && (lines[insertAt - 1]?.trim() ?? "") === "") {
        insertAt -= 1;
      }
      lines.splice(
        insertAt,
        0,
        `### ${phase}`,
        "",
        `**${scopeHeading}**`,
        "",
        `- **${step} ${rowName}**`,
        "",
      );
    } else if (!completedPhase && scopeEntry === undefined) {
      lines.splice(block.span.end, 0, `- **${step} ${rowName}**`);
    }
    return lines.join(eol);
  };

  const edits: FileEdit[] = [
    {
      relPath: progressRel,
      description: completedPhase
        ? `Step ${step} auf ${status} setzen und Detail-Block "${block?.name}" ins Archiv verschieben`
        : `Step ${step} in der Fortschrittstabelle auf ${status} setzen`,
      transform: editProgress,
    },
  ];
  if (completedPhase && block !== undefined) {
    edits.push({
      relPath: archiveRel,
      description: `Detail-Block "${block.name}" verbatim ans PROGRESS_ARCHIVE anhängen${note !== undefined ? " (mit Verifikations-Zeile)" : ""}`,
      transform: (content, eol) => {
        const blockLines = block.raw.split(eol);
        if (note !== undefined) {
          blockLines.push(`**${verificationLabel}:** ${note}`);
        }
        const trimmed = content.replace(/\s+$/u, "");
        return `${trimmed}${eol}${eol}---${eol}${eol}${blockLines.join(eol)}${eol}`;
      },
    });
  }

  const changes = buildChanges(root, edits);
  return { root, phase, step, status, dryRun, note, completedPhase, changes };
}

export function applyProgressPlan(plan: ProgressUpdatePlan): ApplyResult {
  if (plan.dryRun) {
    throw new Error(
      "refusing to apply a dry-run plan — create the plan with dryRun: false to apply",
    );
  }
  const written: string[] = [];
  for (const change of plan.changes) {
    writeFileSync(change.file, change.after, "utf8");
    written.push(change.file);
  }

  const messages: string[] = [];
  const fresh = loadProject(plan.root);
  const progress = fresh.progress().value;
  const row = progress.rows.find((r) => r.step === plan.step);
  const statusOk = row !== undefined && row.status === plan.status;
  messages.push(
    statusOk
      ? `step ${plan.step} has status ${plan.status}`
      : `step ${plan.step} MISSING from the table or has the wrong status`,
  );

  let archiveOk = true;
  if (plan.completedPhase) {
    const stillThere = progress.phases.some((p) => phaseMatches(p, plan.phase));
    const inArchive = fresh.progressArchive().value.some((p) => phaseMatches(p, plan.phase));
    archiveOk = !stillThere && inArchive;
    messages.push(
      archiveOk
        ? "phase block moved to PROGRESS_ARCHIVE"
        : "phase block move FAILED (missing in archive or still in PROGRESS)",
    );
  }

  const findings = docsValidate(plan.root)
    .findings
    .filter((f) => f.message.includes(plan.step));
  if (findings.length === 0) messages.push("docs_validate reports no findings for this step");
  else for (const f of findings) messages.push(`${f.code}: ${f.message}`);

  const ok = statusOk && archiveOk && findings.length === 0;
  return { written, verification: { ok, messages } };
}
