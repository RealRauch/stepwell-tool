import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadProject } from "./project.js";
import { scopeSteps } from "./progress.js";
import type { Warning } from "./types.js";

const ID_CONVENTION = /^[A-Z][0-9]+$/;
const LEGACY_DATE =
  /(?:\(erledigt\s+|\(abgeschlossen\s+|Stand:\s*)(?<!\d)(\d{2}\/\d{4})(?!\d)/gu;

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
        message: `Legacy-Datumsformat "${m[1]}" — kanonisch ist JJMMDD/HHMM (PLAYBOOK §3).`,
      });
    }
  }
}

export function docsValidate(root: string): {
  findings: Warning[];
  warnings: Warning[];
  ok: boolean;
} {
  const docs = loadProject(root);
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
        message: `Item "${item.id}" ist abgehakt ([x]), hängt aber noch im offenen BACKLOG — ins Archiv verschieben + Einzeiler im Erledigt-Index.`,
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
        message: `Item-ID "${id}" kommt doppelt vor (erste Vorkommens-Zeile: ${lines[0]}) — IDs sind projektweit eindeutig.`,
      });
    }
  }

  for (const item of backlog.value.items) {
    if (!ID_CONVENTION.test(item.id)) {
      findings.push({
        code: "ID_CONVENTION",
        file: backlogPath,
        line: item.span.start,
        message: `Item-ID "${item.id}" verletzt die Nomenklatur ^[A-Z][0-9]+$ — Warnung, das Item bleibt gelistet.`,
      });
    }
  }
  for (const done of backlog.value.doneIndex) {
    if (!ID_CONVENTION.test(done.id)) {
      findings.push({
        code: "ID_CONVENTION",
        file: backlogPath,
        message: `Item-ID "${done.id}" im Erledigt-Index verletzt die Nomenklatur ^[A-Z][0-9]+$.`,
      });
    }
  }

  const archiveIds = new Set(backlogArchive.value.map((item) => item.id));
  for (const done of backlog.value.doneIndex) {
    if (!archiveIds.has(done.id)) {
      findings.push({
        code: "INDEX_WITHOUT_ARCHIVE",
        file: backlogPath,
        message: `Erledigt-Index-Eintrag "${done.id}" hat keinen Block im BACKLOG_ARCHIVE.md.`,
      });
    }
  }

  const doneIds = new Set(backlog.value.doneIndex.map((done) => done.id));
  for (const item of backlogArchive.value) {
    if (!doneIds.has(item.id)) {
      findings.push({
        code: "ARCHIVE_WITHOUT_INDEX",
        file: backlogArchivePath,
        line: item.span.start,
        message: `Archiv-Block "${item.id}" fehlt im Erledigt-Index der BACKLOG.md.`,
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
        message: `Step ${row.step} ist 🔄, aber kein Detail-Block unter „Laufende Phasen“ paketiert ihn.`,
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
        message: `Detail-Block "${block.name}" hat keinen 🔄-Step in der Fortschrittstabelle.`,
      });
    }
  }

  scanLegacyDates(backlogPath, backlogPath, findings);
  scanLegacyDates(progressPath, progressPath, findings);

  const warnings = [
    ...backlog.warnings,
    ...progress.warnings,
    ...backlogArchive.warnings,
    ...progressArchive.warnings,
  ];

  return { findings, warnings, ok: findings.length === 0 };
}
