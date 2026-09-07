import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { lineDiff } from "./diff.ts";
import { docsValidate } from "./validate.ts";
import { loadProject } from "./project.ts";
import type { ArchiveItemPlan, ApplyResult, PlanChange } from "./types.ts";

export interface ArchiveItemOptions {
  dryRun?: boolean;
  note?: string;
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
const RULE_LINE = /^-{3,}\s*$/;
const INDEX_HEADING = /Erledigt-Index/u;

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
    const entryLine = `- ${item.id} — ${item.title} — erledigt${note !== undefined ? ` (${note})` : ""}`;
    lines.splice(insertAt, 0, entryLine);
    return lines.join(eol);
  };

  const appendToArchive = (content: string, eol: string): string => {
    const blockLines = item.raw.split(eol);
    const heading = blockLines[0] ?? `### [ ] ${item.id}`;
    blockLines[0] = heading.replace(/^###\s+\[ \]/u, "### [x]");
    if (note !== undefined) {
      blockLines.push(`- **Erledigt:** ${note}`);
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
