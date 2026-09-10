import { readFileSync } from "node:fs";
import { join } from "node:path";
import { allSynonyms, escapeRegExp } from "./profile.ts";
import { loadProject, type ProjectDocs } from "./project.ts";
import { ProjectNotInitializedError } from "./project-files.ts";
import { scopeSteps } from "./progress.ts";
import type { Warning } from "./types.ts";

const ID_CONVENTION = /^[A-Z][0-9]+$/;
const union = (words: readonly string[]): string => words.map(escapeRegExp).join("|");
const LEGACY_DATE = new RegExp(
  `(?:\\((?:${union([...allSynonyms("doneWord"), ...allSynonyms("completedMarker")])})\\s+` +
    `|\\b(?:${union(allSynonyms("standMarker"))})\\s*)` +
    `(?<!\\d)(\\d{2}\\/\\d{4})(?!\\d)`,
  "gu",
);

function scanLegacyDates(filePath: string, file: string, findings: Warning[]): void {
  let content: string;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    return;
  }
  const lines = content.split(/\r?\n/);
  for (const [idx, line] of lines.entries()) {
    for (const m of line.matchAll(LEGACY_DATE)) {
      findings.push({
        code: "DATE_LEGACY",
        file,
        line: idx + 1,
        message: `Legacy date format "${m[1]}" — canonical is JJMMDD/HHMM (PLAYBOOK §3).`,
      });
    }
  }
}

export function docsValidate(root: string): {
  findings: Warning[];
  warnings: Warning[];
  ok: boolean;
} {
  let docs: ProjectDocs;
  try {
    docs = loadProject(root);
  } catch (err) {
    if (err instanceof ProjectNotInitializedError) {
      return {
        findings: [{ code: "PROJECT_NOT_INITIALIZED", file: root, message: err.message }],
        warnings: [],
        ok: false,
      };
    }
    throw err;
  }
  const backlogPath = join(root, "BACKLOG.md");
  const progressPath = join(root, "PROGRESS.md");
  const backlogArchivePath = join(root, "docs", "archive", "BACKLOG_ARCHIVE.md");

  const backlog = docs.backlog();
  const progress = docs.progress();
  const backlogArchive = docs.backlogArchive();
  const progressArchive = docs.progressArchive();
  const findings: Warning[] = [];

  for (const item of backlog.value.items) {
    if (!item.open) {
      findings.push({
        code: "NOT_ARCHIVED",
        file: backlogPath,
        line: item.span.start,
        message: `Item "${item.id}" is checked off ([x]) but still in the open BACKLOG — move to archive + one-liner in the Done Index.`,
      });
    }
  }

  const byId = new Map<string, number[]>();
  for (const item of backlog.value.items) {
    const lines = byId.get(item.id) ?? [];
    lines.push(item.span.start);
    byId.set(item.id, lines);
  }
  for (const [id, lines] of byId) {
    for (const line of lines.slice(1)) {
      findings.push({
        code: "ID_DUPLICATE",
        file: backlogPath,
        line,
        message: `Item-ID "${id}" appears more than once (first occurrence line: ${lines[0]}) — IDs are project-wide unique.`,
      });
    }
  }

  for (const item of backlog.value.items) {
    if (!ID_CONVENTION.test(item.id)) {
      findings.push({
        code: "ID_CONVENTION",
        file: backlogPath,
        line: item.span.start,
        message: `Item-ID "${item.id}" violates the naming convention ^[A-Z][0-9]+$ — warning, the item stays listed.`,
      });
    }
  }
  for (const done of backlog.value.doneIndex) {
    if (!ID_CONVENTION.test(done.id)) {
      findings.push({
        code: "ID_CONVENTION",
        file: backlogPath,
        message: `Item-ID "${done.id}" in the Done Index violates the naming convention ^[A-Z][0-9]+$.`,
      });
    }
  }

  const archiveIds = new Set(backlogArchive.value.map((item) => item.id));
  for (const done of backlog.value.doneIndex) {
    if (!archiveIds.has(done.id)) {
      findings.push({
        code: "INDEX_WITHOUT_ARCHIVE",
        file: backlogPath,
        message: `Done Index entry "${done.id}" has no block in BACKLOG_ARCHIVE.md.`,
      });
    }
  }

  const doneIds = new Set(backlog.value.doneIndex.map((done) => done.id));
  for (const item of backlogArchive.value) {
    if (item.open) continue;
    if (!doneIds.has(item.id)) {
      findings.push({
        code: "ARCHIVE_WITHOUT_INDEX",
        file: backlogArchivePath,
        line: item.span.start,
        message: `Archive block "${item.id}" is missing from the Done Index of BACKLOG.md.`,
      });
    }
  }

  const runningSteps = progress.value.rows.filter((row) => row.status === "🔄");
  for (const row of runningSteps) {
    const hasPlan = progress.value.phases.some((block) => scopeSteps(block).includes(row.step));
    if (!hasPlan) {
      findings.push({
        code: "WIP_WITHOUT_PLAN",
        file: progressPath,
        message: `Step ${row.step} is 🔄, but no detail block under "Active Phases" packages it.`,
      });
    }
  }
  for (const block of progress.value.phases) {
    const steps = new Set(scopeSteps(block));
    const isRunning = runningSteps.some((row) => steps.has(row.step));
    if (!isRunning) {
      findings.push({
        code: "PLAN_WITHOUT_WIP",
        file: progressPath,
        line: block.span.start,
        message: `Detail block "${block.name}" has no 🔄 step in the progress table.`,
      });
    }
  }

  const stepLines = new Map<string, number[]>();
  const TABLE_ROW = /^\|\s*(\d+(?:\.\d+)?)\s*\|/;
  for (const [idx, line] of readFileSync(progressPath, "utf8").split(/\r?\n/).entries()) {
    const m = TABLE_ROW.exec(line);
    if (m) {
      const lines = stepLines.get(m[1]!) ?? [];
      lines.push(idx + 1);
      stepLines.set(m[1]!, lines);
    }
  }
  for (const [step, lines] of stepLines) {
    for (const line of lines.slice(1)) {
      findings.push({
        code: "STEP_DUPLICATE",
        file: progressPath,
        line,
        message: `Step number "${step}" appears more than once in the progress table (first row: ${lines[0]}) — progress_update only maintains the first row on duplicates.`,
      });
    }
  }

  scanLegacyDates(backlogPath, backlogPath, findings);
  scanLegacyDates(progressPath, progressPath, findings);

  const warnings = [...backlog.warnings, ...progress.warnings];

  return { findings, warnings, ok: findings.length === 0 };
}
