import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { lineDiff } from "./diff.ts";
import { allSynonyms, canonical, detectLocale, escapeRegExp, synonymPattern, type Locale } from "./profile.ts";
import { docsValidate } from "./validate.ts";
import { loadProject } from "./project.ts";
import type {
  ArchiveItemPlan,
  ApplyResult,
  BacklogAddPlan,
  BacklogItem,
  BacklogRemovePlan,
  BacklogUpdatePlan,
  PhaseBlock,
  PhasePlan,
  PlanChange,
  Priority,
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
  title?: string;
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
    const blockLines = item.raw.split(/\r?\n/);
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

function assertFreshChanges(changes: PlanChange[]): void {
  for (const change of changes) {
    let current: string;
    try {
      current = readFileSync(change.file, "utf8");
    } catch {
      throw new Error(`stale plan: ${change.file} is no longer readable — create a new plan`);
    }
    if (current !== change.before) {
      throw new Error(
        `stale plan: ${change.file} changed since the plan was created — create a new plan (dryRun: false) before applying`,
      );
    }
  }
}

export function applyArchivePlan(plan: ArchiveItemPlan): ApplyResult {
  if (plan.dryRun) {
    throw new Error(
      "refusing to apply a dry-run plan — create the plan with dryRun: false to apply",
    );
  }
  assertFreshChanges(plan.changes);
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

function insertRunningPhaseSkeleton(
  lines: string[],
  heading: string,
  scopeHeading: string,
  bullets: string[],
): void {
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
  lines.splice(insertAt, 0, heading, "", `**${scopeHeading}**`, "", ...bullets, "");
}

function appendTableRows(lines: string[], rows: string[]): void {
  let lastRow = -1;
  lines.forEach((l, i) => {
    if (tableLineHasStep(l)) lastRow = i;
  });
  if (lastRow === -1) throw new Error("no progress table found in PROGRESS.md");
  lines.splice(lastRow + 1, 0, ...rows);
}

const FIELD_LINE = /^\*\*(.+?):\*\*/u;
const BULLET_LINE = /^-\s+/u;

function appendScopeBullets(
  lines: string[],
  block: PhaseBlock,
  scopeHeading: string,
  bullets: string[],
): void {
  const start = block.span.start - 1;
  const end = block.span.end - 1;
  let scopeIdx = -1;
  let lastBullet = -1;
  for (let i = start; i <= end; i++) {
    const line = (lines[i] ?? "").trim();
    if (scopeIdx === -1) {
      const field = FIELD_LINE.exec(line);
      if (field && allSynonyms("scopeLabel").some((s) => field[1]!.toLowerCase().startsWith(s.toLowerCase()))) {
        scopeIdx = i;
      }
    } else if (BULLET_LINE.test(line)) {
      lastBullet = i;
    }
  }
  if (scopeIdx === -1) {
    throw new Error(`scope section ("${scopeHeading}") im Block "${block.name}" nicht gefunden`);
  }
  lines.splice((lastBullet === -1 ? scopeIdx : lastBullet) + 1, 0, ...bullets);
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
  const newTitle = normalizeNote(options.title);
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

    // Reihenfolge definiert (T2): 1) Titel-Rename (zeilenzahlneutral), 2) Phasen-
    // Entfernung (Span noch gültig, R1), 3) Tabellen-Zeile, 4) Skelett/Scope.
    if (newTitle !== undefined && block !== undefined) {
      const headingIdx = block.span.start - 1;
      if (!/^###/u.test(lines[headingIdx] ?? "")) {
        throw new Error(`phase heading for "${block.name}" not found in PROGRESS.md`);
      }
      lines[headingIdx] = `### ${block.name} — ${newTitle}`;
    }

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
      appendTableRows(lines, [`| ${step} | ${rowName} | ${status} |`]);
    }

    if (block === undefined) {
      const skeletonHeading =
        newTitle !== undefined ? `### ${phase} — ${newTitle}` : `### ${phase}`;
      insertRunningPhaseSkeleton(lines, skeletonHeading, scopeHeading, [
        `- **${step} ${rowName}**`,
      ]);
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
        const blockLines = block.raw.split(/\r?\n/);
        if (newTitle !== undefined) {
          blockLines[0] = `### ${block.name} — ${newTitle}`;
        }
        if (note !== undefined) {
          blockLines.push(`**${verificationLabel}:** ${note}`);
        }
        const trimmed = content.replace(/\s+$/u, "");
        return `${trimmed}${eol}${eol}---${eol}${eol}${blockLines.join(eol)}${eol}`;
      },
    });
  }

  const changes = buildChanges(root, edits);
  return { root, phase, step, status, title: newTitle, dryRun, note, completedPhase, changes };
}

export function applyProgressPlan(plan: ProgressUpdatePlan): ApplyResult {
  if (plan.dryRun) {
    throw new Error(
      "refusing to apply a dry-run plan — create the plan with dryRun: false to apply",
    );
  }
  assertFreshChanges(plan.changes);
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

// ---------------------------------------------------------------------------
// Phasen-Planung (T4): neue Phase vorausplanen (Tabellen-Zeilen + Skeleton).
// ---------------------------------------------------------------------------

export interface PhaseStep {
  step: string;
  name: string;
}

export interface PhaseOptions {
  dryRun?: boolean;
}

export function planPhase(
  root: string,
  phase: string,
  steps: PhaseStep[],
  options: PhaseOptions = {},
): PhasePlan {
  const dryRun = options.dryRun ?? true;
  const docs = loadProject(root);
  const progress = docs.progress().value;

  const prefixMatch = /^Phase\s+(\d+)(\s+—\s+(.+))?$/u.exec(phase.trim());
  if (prefixMatch === null) {
    throw new Error(`phase "${phase}" entspricht nicht dem Muster "Phase <Nr>[ — Titel]"`);
  }
  const phaseNumber = prefixMatch[1]!;
  const phaseHeading = `### ${phase.trim()}`;

  if (steps.length === 0) {
    throw new Error("missing steps: eine Phase braucht mindestens einen Step");
  }
  const seen = new Set<string>();
  for (const entry of steps) {
    const step = entry.step.trim();
    if (!/^\d+(?:\.\d+)?$/u.test(step) || !step.startsWith(`${phaseNumber}.`)) {
      throw new Error(
        `step "${entry.step}" gehört nicht zur Phase ${phaseNumber} (Muster: ${phaseNumber}.<Nr>)`,
      );
    }
    if (seen.has(step)) {
      throw new Error(`duplicate step: "${step}" ist mehrfach in der Steps-Liste`);
    }
    seen.add(step);
    if (entry.name.trim() === "") {
      throw new Error(`missing name for step ${step}`);
    }
    if (progress.rows.some((r) => r.step === step)) {
      throw new Error(`step "${step}" existiert bereits in der Fortschrittstabelle`);
    }
  }
  const running = progress.phases.find((p) => phaseMatches(p, phase.trim()));
  if (running !== undefined) {
    for (const entry of steps) {
      const step = entry.step.trim();
      const inScope = running.scope.some((s) =>
        new RegExp(`^\\*{0,2}\\s*${escapeRegExp(step)}\\b`).test(s),
      );
      if (inScope) {
        throw new Error(
          `step "${step}" ist bereits im Scope der laufenden Phase "${running.name}"`,
        );
      }
    }
  }
  const archived = docs.progressArchive().value.find((p) => phaseMatches(p, phase.trim()));
  if (archived !== undefined) {
    throw new Error(`phase "${phase}" liegt bereits im PROGRESS_ARCHIVE (Step-Nummern nie wiederverwenden)`);
  }

  const locale = detectLocale(
    readText(join(root, "PROGRESS.md")).content,
    readText(join(root, "docs", "archive", "PROGRESS_ARCHIVE.md")).content,
  );
  const scopeHeading = `${canonical("scopeLabel", locale)} (Steps):`;

  const edit = (content: string, eol: string): string => {
    const lines = content.split(eol);
    appendTableRows(lines, steps.map((s) => `| ${s.step.trim()} | ${s.name.trim()} | ⬜ |`));
    if (running === undefined) {
      insertRunningPhaseSkeleton(
        lines,
        phaseHeading,
        scopeHeading,
        steps.map((s) => `- **${s.step.trim()} ${s.name.trim()}**`),
      );
    } else {
      appendScopeBullets(
        lines,
        running,
        scopeHeading,
        steps.map((s) => `- **${s.step.trim()} ${s.name.trim()}**`),
      );
    }
    return lines.join(eol);
  };

  const changes = buildChanges(root, [
    {
      relPath: "PROGRESS.md",
      description: running !== undefined
        ? `Laufende Phase "${running.name}" um ${steps.length} Steps erweitern (Tabellen-Zeilen ⬜ + Scope-Bullets)`
        : `Phase "${phase.trim()}" mit ${steps.length} Steps vorausplanen (Tabellen-Zeilen ⬜ + Detail-Block-Skelett)`,
      transform: edit,
    },
  ]);
  return { root, phase: phase.trim(), dryRun, changes };
}

export function applyPhasePlan(plan: PhasePlan): ApplyResult {
  if (plan.dryRun) {
    throw new Error("refusing to apply a dry-run plan — create the plan with dryRun: false to apply");
  }
  assertFreshChanges(plan.changes);
  const written: string[] = [];
  for (const change of plan.changes) {
    writeFileSync(change.file, change.after, "utf8");
    written.push(change.file);
  }

  const messages: string[] = [];
  const fresh = loadProject(plan.root);
  const block = fresh.progress().value.phases.find((p) => phaseMatches(p, plan.phase));
  const blockOk = block !== undefined;
  messages.push(
    blockOk
      ? `phase "${plan.phase}" is planned under the running phases`
      : `phase "${plan.phase}" MISSING from the running phases`,
  );
  // PLAN_WITHOUT_WIP ist bis zum ersten 🔄 der definierte Zustand einer
  // vorausgeplanten Phase — kein Apply-Fehler.
  const findings = docsValidate(plan.root)
    .findings
    .filter((f) => f.message.includes(`"${plan.phase}"`) && f.code !== "PLAN_WITHOUT_WIP");
  if (blockOk) {
    messages.push("phase is planned but not started yet (PLAN_WITHOUT_WIP resolves with the first 🔄)");
  }
  if (findings.length === 0) messages.push("docs_validate reports no other findings for this phase");
  else for (const f of findings) messages.push(`${f.code}: ${f.message}`);

  const ok = blockOk && findings.length === 0;
  return { written, verification: { ok, messages } };
}

// ---------------------------------------------------------------------------
// Backlog-CRUD (T1): add / update / remove im Plan/Dry-run-Modell.
// ---------------------------------------------------------------------------

const KNOWN_PRIORITIES: readonly Exclude<Priority, "unknown">[] = ["🔴", "🟠", "🟡", "🟢", "🔵"];
const PRIORITY_SERIES: Partial<Record<Exclude<Priority, "unknown">, string>> = {
  "🔴": "K",
  "🟠": "H",
  "🟡": "M",
  "🟢": "L",
};
const ID_PATTERN = /^[A-Z][0-9]+$/;
const STAMP_TOKEN = new RegExp(
  `(?<=\\b(?:${allSynonyms("standMarker").map(escapeRegExp).join("|")})\\s*)\\S+`,
);

export interface BacklogAddOptions {
  dryRun?: boolean;
  section: string;
  title: string;
  priority: Exclude<Priority, "unknown">;
  id?: string;
  text?: string;
}

export interface BacklogUpdateOptions {
  dryRun?: boolean;
  title?: string;
  priority?: Exclude<Priority, "unknown">;
  section?: string;
  text?: string;
}

export interface BacklogRemoveOptions {
  dryRun?: boolean;
  note?: string;
  locale?: Locale;
}

/** JJMMDD/HHMM gemäß PLAYBOOK §3. */
export function stampNow(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, "0");
  return `${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}/${p(d.getHours())}${p(d.getMinutes())}`;
}

function refreshHeadingStamp(lines: string[]): void {
  for (const [idx, line] of lines.entries()) {
    if (!/^#\s/u.test(line)) continue;
    if (STAMP_TOKEN.test(line)) {
      lines[idx] = line.replace(STAMP_TOKEN, stampNow());
    }
    return;
  }
}

function sectionHeadingLineAt(lines: string[], section: string): number {
  const wanted = section.trim().toLowerCase();
  if (wanted === "") return -1;
  for (const [idx, line] of lines.entries()) {
    if (!SECTION_HEADING.test(line)) continue;
    const text = line.replace(/^##\s+/u, "").trim();
    if (INDEX_HEADING.test(text)) continue;
    if (text.toLowerCase().endsWith(wanted)) return idx;
  }
  return -1;
}

function sectionInsertAt(lines: string[], headingIdx: number): number {
  let end = headingIdx + 1;
  while (end < lines.length && !SECTION_HEADING.test(lines[end]!) && !RULE_LINE.test(lines[end]!)) {
    end += 1;
  }
  let insertAt = end;
  while (insertAt > headingIdx + 1 && (lines[insertAt - 1]?.trim() ?? "") === "") {
    insertAt -= 1;
  }
  return insertAt;
}

function insertIntoSection(lines: string[], section: string, blockLines: string[]): void {
  const headingIdx = sectionHeadingLineAt(lines, section);
  if (headingIdx === -1) {
    throw new Error(`unknown section: ${section} (Sektions-Titel ohne Emoji, z. B. "HOCH")`);
  }
  const insertAt = sectionInsertAt(lines, headingIdx);
  lines.splice(insertAt, 0, "", ...blockLines);
}

function removeItemLines(lines: string[], span: { start: number; end: number }): void {
  lines.splice(span.start - 1, span.end - span.start + 1);
  if (
    span.start - 2 >= 0 &&
    (lines[span.start - 2]?.trim() ?? "x") === "" &&
    (lines[span.start - 1]?.trim() ?? "x") === ""
  ) {
    lines.splice(span.start - 1, 1);
  }
}

function buildItemBlock(
  id: string,
  title: string,
  priority: string,
  text: string | undefined,
  checkbox = "[ ]",
): string[] {
  const body = text === undefined ? [] : text.replace(/\s+$/u, "").split(/\r?\n/);
  return [`### ${checkbox} ${id} — ${title} — ${priority}`, ...body];
}

function collectKnownIds(docs: ReturnType<typeof loadProject>): Set<string> {
  const ids = new Set<string>();
  for (const item of docs.backlog().value.items) ids.add(item.id);
  for (const done of docs.backlog().value.doneIndex) ids.add(done.id);
  for (const item of docs.backlogArchive().value) ids.add(item.id);
  return ids;
}

function nextSeriesId(docs: ReturnType<typeof loadProject>, letter: string): string {
  let max = 0;
  for (const id of collectKnownIds(docs)) {
    const m = new RegExp(`^${escapeRegExp(letter)}(\\d+)$`, "u").exec(id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${letter}${max + 1}`;
}

function requireOpenItem(docs: ReturnType<typeof loadProject>, id: string): BacklogItem {
  const item = docs.backlog().value.items.find((i) => i.id === id);
  if (item !== undefined) return item;
  const archived = docs.backlogArchive().value.some((i) => i.id === id);
  if (archived) throw new Error(`item "${id}" is already archived`);
  throw new Error(`unknown open item id: ${id} (nicht im offenen BACKLOG)`);
}

function appendIndexTail(
  lines: string[],
  entryLine: string,
  file: string,
): void {
  let sectionStart = -1;
  for (const [idx, line] of lines.entries()) {
    if (SECTION_HEADING.test(line) && INDEX_HEADING.test(line)) {
      sectionStart = idx;
      break;
    }
  }
  if (sectionStart === -1) {
    throw new Error(`missing Erledigt-Index section in ${file}`);
  }
  let end = sectionStart + 1;
  while (end < lines.length && !SECTION_HEADING.test(lines[end]!) && !RULE_LINE.test(lines[end]!)) {
    end += 1;
  }
  let insertAt = end;
  while (insertAt > sectionStart + 1 && (lines[insertAt - 1]?.trim() ?? "") === "") {
    insertAt -= 1;
  }
  lines.splice(insertAt, 0, entryLine);
}

export function planBacklogAdd(root: string, options: BacklogAddOptions): BacklogAddPlan {
  const dryRun = options.dryRun ?? true;
  const title = options.title.trim();
  if (title === "") throw new Error("missing title: ein Item braucht einen Titel nach der ID");
  if (!KNOWN_PRIORITIES.includes(options.priority)) {
    throw new Error(`unknown priority: ${options.priority} (erlaubt sind ${KNOWN_PRIORITIES.join(" ")})`);
  }
  const docs = loadProject(root);
  const backlogRel = "BACKLOG.md";

  let id = options.id?.trim() ?? "";
  if (id === "") {
    const series = PRIORITY_SERIES[options.priority];
    if (series === undefined) {
      throw new Error(
        `priority ${options.priority} has no id series — provide an explicit id (Konvention ^[A-Z][0-9]+$)`,
      );
    }
    id = nextSeriesId(docs, series);
  } else {
    if (!ID_PATTERN.test(id)) {
      throw new Error(`id "${id}" verletzt die Nomenklatur ^[A-Z][0-9]+$`);
    }
    if (collectKnownIds(docs).has(id)) {
      throw new Error(`id "${id}" ist bereits vergeben (offen, Erledigt-Index oder Archiv)`);
    }
  }

  const section = options.section.trim();
  const blockLines = buildItemBlock(id, title, options.priority, options.text);

  const edit = (content: string, eol: string): string => {
    const lines = content.split(eol);
    insertIntoSection(lines, section, blockLines);
    refreshHeadingStamp(lines);
    return lines.join(eol);
  };

  const changes = buildChanges(root, [
    {
      relPath: backlogRel,
      description: `Item "${id}" in Sektion "${section}" anlegen (Ende der Sektion, Priorität ${options.priority})`,
      transform: edit,
    },
  ]);
  return { root, id, section, dryRun, changes };
}

export function applyBacklogAddPlan(plan: BacklogAddPlan): ApplyResult {
  if (plan.dryRun) {
    throw new Error("refusing to apply a dry-run plan — create the plan with dryRun: false to apply");
  }
  assertFreshChanges(plan.changes);
  const written: string[] = [];
  for (const change of plan.changes) {
    writeFileSync(change.file, change.after, "utf8");
    written.push(change.file);
  }

  const messages: string[] = [];
  const fresh = loadProject(plan.root);
  const item = fresh.backlog().value.items.find((i) => i.id === plan.id);
  const added = item !== undefined && item.open && item.section === plan.section;
  messages.push(
    added
      ? `item "${plan.id}" is open in section "${plan.section}"`
      : `item "${plan.id}" MISSING from the open BACKLOG or in the wrong section`,
  );
  const findings = docsValidate(plan.root)
    .findings
    .filter((f) => f.message.includes(`"${plan.id}"`));
  if (findings.length === 0) messages.push("docs_validate reports no findings for this id");
  else for (const f of findings) messages.push(`${f.code}: ${f.message}`);

  const ok = added && findings.length === 0;
  return { written, verification: { ok, messages } };
}

export function planBacklogUpdate(root: string, id: string, options: BacklogUpdateOptions): BacklogUpdatePlan {
  const dryRun = options.dryRun ?? true;
  const docs = loadProject(root);
  const item = requireOpenItem(docs, id);

  const newTitle = normalizeNote(options.title) ?? item.title;
  const newPriority = options.priority ?? item.priority;
  if (options.priority !== undefined && !KNOWN_PRIORITIES.includes(options.priority)) {
    throw new Error(`unknown priority: ${options.priority} (erlaubt sind ${KNOWN_PRIORITIES.join(" ")})`);
  }
  const headingLine = item.raw.split(/\r?\n/)[0] ?? "";
  const suffixMatch = /\s+\*[^*]+\*\s*$/u.exec(headingLine);
  const suffix = suffixMatch !== null ? ` ${suffixMatch[0].trim()}` : "";
  const checkbox = /^###\s+\[x\]/u.test(headingLine) ? "[x]" : "[ ]";
  const body =
    options.text === undefined
      ? item.raw.split(/\r?\n/).slice(1)
      : options.text.replace(/\s+$/u, "").split(/\r?\n/);
  const blockLines = [
    `### ${checkbox} ${item.id} — ${newTitle} — ${newPriority}${suffix}`,
    ...body,
  ];

  const sectionChanged = options.section !== undefined && options.section !== item.section;
  let targetSection = item.section;
  if (options.section !== undefined) {
    targetSection = options.section;
  } else if (newPriority !== item.priority) {
    const match = docs.backlog().value.sections.find((s) => s.emoji === newPriority);
    if (match !== undefined) targetSection = match.title;
  }

  const edit = (content: string, eol: string): string => {
    const lines = content.split(eol);
    if (sectionChanged || targetSection !== item.section) {
      removeItemLines(lines, item.span);
      insertIntoSection(lines, targetSection, blockLines);
    } else {
      lines.splice(item.span.start - 1, item.span.end - item.span.start + 1, ...blockLines);
    }
    refreshHeadingStamp(lines);
    return lines.join(eol);
  };

  const changes = buildChanges(root, [
    {
      relPath: "BACKLOG.md",
      description:
        targetSection !== item.section
          ? `Item "${item.id}" aktualisieren und in Sektion "${targetSection}" verschieben`
          : `Item "${item.id}" aktualisieren (Titel/Priorität/Text in-place)`,
      transform: edit,
    },
  ]);
  return { root, id: item.id, dryRun, changes };
}

function headingEndsOptionalSuffix(rawSuffix: string): boolean {
  return /^\s+\*[^*]+\*$/u.test(rawSuffix);
}

export function applyBacklogUpdatePlan(plan: BacklogUpdatePlan): ApplyResult {
  if (plan.dryRun) {
    throw new Error("refusing to apply a dry-run plan — create the plan with dryRun: false to apply");
  }
  assertFreshChanges(plan.changes);
  const written: string[] = [];
  for (const change of plan.changes) {
    writeFileSync(change.file, change.after, "utf8");
    written.push(change.file);
  }

  const messages: string[] = [];
  const fresh = loadProject(plan.root);
  const item = fresh.backlog().value.items.find((i) => i.id === plan.id);
  const updated = item !== undefined && item.open;
  messages.push(
    updated ? `item "${plan.id}" is open and updated` : `item "${plan.id}" MISSING from the open BACKLOG`,
  );
  const findings = docsValidate(plan.root)
    .findings
    .filter((f) => f.message.includes(`"${plan.id}"`));
  if (findings.length === 0) messages.push("docs_validate reports no findings for this id");
  else for (const f of findings) messages.push(`${f.code}: ${f.message}`);

  const ok = updated && findings.length === 0;
  return { written, verification: { ok, messages } };
}

export function planBacklogRemove(root: string, id: string, options: BacklogRemoveOptions = {}): BacklogRemovePlan {
  const dryRun = options.dryRun ?? true;
  const note = normalizeNote(options.note);
  const docs = loadProject(root);
  const item = requireOpenItem(docs, id);

  const backlogRel = "BACKLOG.md";
  const archiveRel = join("docs", "archive", "BACKLOG_ARCHIVE.md");
  const backlogText = readText(join(root, backlogRel)).content;
  const archiveText = readText(join(root, archiveRel)).content;
  const locale = options.locale ?? detectLocale(backlogText, archiveText);
  const removedWord = canonical("removedWord", locale);
  const removedLabel = canonical("removedLabel", locale);

  const editBacklog = (content: string, eol: string): string => {
    const lines = content.split(eol);
    removeItemLines(lines, item.span);
    appendIndexTail(
      lines,
      `- ${item.id} — ${item.title} — ${removedWord}${note !== undefined ? ` (${note})` : ""}`,
      backlogRel,
    );
    refreshHeadingStamp(lines);
    return lines.join(eol);
  };

  const editArchive = (content: string, eol: string): string => {
    const blockLines = item.raw.split(/\r?\n/);
    if (note !== undefined) {
      blockLines.push(`- **${removedLabel}:** ${note}`);
    }
    const trimmed = content.replace(/\s+$/u, "");
    return `${trimmed}${eol}${eol}---${eol}${eol}${blockLines.join(eol)}${eol}`;
  };

  const changes = buildChanges(root, [
    {
      relPath: backlogRel,
      description: `Item "${id}" aus dem offenen BACKLOG entfernen (verbatim-Verschub ins Archiv, Index-Tail ohne Erledigt-Marker)`,
      transform: editBacklog,
    },
    {
      relPath: archiveRel,
      description: `Item-Block "${id}" verbatim ans BACKLOG_ARCHIVE anhängen (Checkbox bleibt [ ])${note !== undefined ? ", mit Entfernt-Zeile" : ""}`,
      transform: editArchive,
    },
  ]);
  return { root, id: item.id, note, dryRun, changes };
}

export function applyBacklogRemovePlan(plan: BacklogRemovePlan): ApplyResult {
  if (plan.dryRun) {
    throw new Error("refusing to apply a dry-run plan — create the plan with dryRun: false to apply");
  }
  assertFreshChanges(plan.changes);
  const written: string[] = [];
  for (const change of plan.changes) {
    writeFileSync(change.file, change.after, "utf8");
    written.push(change.file);
  }

  const messages: string[] = [];
  const fresh = loadProject(plan.root);
  const stillOpen = fresh.backlog().value.items.some((i) => i.id === plan.id);
  const inArchive = fresh.backlogArchive().value.some((i) => i.id === plan.id);
  messages.push(
    stillOpen ? `item "${plan.id}" is STILL in the open BACKLOG` : `item "${plan.id}" removed from open BACKLOG`,
  );
  messages.push(
    inArchive
      ? `item "${plan.id}" present in BACKLOG_ARCHIVE (Checkbox [ ], bewusst ohne Erledigt-Marker)`
      : `item "${plan.id}" MISSING from BACKLOG_ARCHIVE`,
  );

  const findings = docsValidate(plan.root)
    .findings
    .filter((f) => f.message.includes(`"${plan.id}"`));
  if (findings.length === 0) messages.push("docs_validate reports no findings for this id");
  else for (const f of findings) messages.push(`${f.code}: ${f.message}`);

  const ok = !stillOpen && inArchive && findings.length === 0;
  return { written, verification: { ok, messages } };
}
