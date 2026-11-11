import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { lineDiff } from "./diff.ts";
import { canonical, detectLocale, synonymPattern } from "./profile.ts";
import { applyArchivePlan, insertRunningPhaseSkeleton, planArchiveItem, splitLines } from "./mutations.ts";
import { readProgress } from "./progress.ts";
import { loadProject } from "./project.ts";
import { docsValidate } from "./validate.ts";
import type { DocsRepairAction, DocsRepairOptions, DocsRepairPlan, PlanChange, ProgressRow } from "./types.ts";

/**
 * H9/30.1 — mechanical repair path over the responsible planners, never text
 * manipulation: every fix either delegates to the planner that owns the structure
 * (planArchiveItem) or to a small deterministic extraction transform that reuses
 * the mutation primitives (splitLines, insertRunningPhaseSkeleton, EOL handling,
 * fresh before/after). Findings that need human judgment stay findings.
 */
const REPAIRABLE = new Set([
  "EMPTY_MARKER_STALE",
  "DATE_LEGACY",
  "NOT_ARCHIVED",
  "WIP_WITHOUT_PLAN",
  "ARCHIVE_WITHOUT_INDEX",
]);

const YYMMDD_HHMM = /(?<![\d/-])(\d{2})(\d{2})(\d{2})\/(\d{2})(\d{2})(?!\d)/u;
const EMPTY_MARKER_LINE = /^>\s*(?:No open items\.|Keine offenen Punkte\.?)\s*$/u;
const SECTION_HEADING = /^##\s+/u;
const RULE_LINE = /^-{3,}\s*$/u;

interface FindingLike {
  code: string;
  file: string;
  line?: number;
  message: string;
}

function readText(path: string): { content: string; eol: string } {
  const content = readFileSync(path, "utf8");
  return { content, eol: content.includes("\r\n") ? "\r\n" : "\n" };
}

function build(
  root: string,
  relPath: string,
  description: string,
  transform: (content: string, eol: string) => string,
): PlanChange[] {
  const path = join(root, relPath);
  const { content, eol } = readText(path);
  const after = transform(content, eol);
  return [{ file: path, description, before: content, after, diff: lineDiff(content, after) }];
}

function writeChanges(changes: PlanChange[]): void {
  for (const change of changes) {
    const current = readFileSync(change.file, "utf8");
    if (current !== change.before) {
      throw new Error(`stale repair: ${change.file} changed since the plan was computed — retry docs_repair`);
    }
    writeFileSync(change.file, change.after, "utf8");
  }
}

/** Builds AND writes one transform repair; returns the changes for reporting. */
function applyTransform(
  root: string,
  relPath: string,
  description: string,
  transform: (content: string, eol: string) => string,
): PlanChange[] {
  const changes = build(root, relPath, description, transform);
  writeChanges(changes);
  return changes;
}

/**
 * Classifies one finding: a repair action (code, file, target) when mechanically
 * repairable, else the skip reason. DATE_LEGACY splits by form: `YYMMDD/HHMM` is
 * reconstructible (the finding message carries the matched stamp), `MM/YYYY`
 * lacks the day and stays a finding (no invention).
 */
function classifyFinding(
  finding: FindingLike,
): DocsRepairAction | { skipReason: string } {
  const { code, file, message } = finding;
  if (!REPAIRABLE.has(code)) {
    return { skipReason: "no mechanical repair — the finding needs human judgment" };
  }
  if (code === "DATE_LEGACY") {
    const stamp = /"(\d{6}\/\d{4})"/u.exec(message)?.[1];
    if (stamp === undefined) {
      return { skipReason: "MM/YYYY lacks the day — the ISO stamp is not reconstructible" };
    }
    return { code, file, target: stamp };
  }
  if (code === "NOT_ARCHIVED" || code === "ARCHIVE_WITHOUT_INDEX") {
    return { code, file, target: /"([A-Z][0-9]+)"/u.exec(message)?.[1] ?? "" };
  }
  if (code === "WIP_WITHOUT_PLAN") {
    return { code, file, target: /Step (\d+(?:\.\d+))/u.exec(message)?.[1] ?? "" };
  }
  // EMPTY_MARKER_STALE
  return { code, file, target: /Section "([^"]+)"/u.exec(message)?.[1] ?? "" };
}

/** Repair transforms — each returns the full PlanChanges for ONE action. */

function removeEmptyMarker(root: string, line: number): PlanChange[] {
  return applyTransform(root, "BACKLOG.md", `docs_repair: stale "No open items." placeholder removed (line ${line})`, (content, eol) => {
    const lines = splitLines(content);
    const idx = line - 1;
    if (!EMPTY_MARKER_LINE.test(lines[idx] ?? "")) {
      throw new Error(`stale repair: line ${line} is no longer the placeholder — retry docs_repair`);
    }
    lines.splice(idx, 1);
    // do not leave a double blank line behind
    if ((lines[idx - 1]?.trim() ?? "x") === "" && (lines[idx]?.trim() ?? "x") === "") {
      lines.splice(idx, 1);
    }
    return lines.join(eol);
  });
}

function rewriteLegacyDate(root: string, line: number, stamp: string): PlanChange[] {
  const m = YYMMDD_HHMM.exec(stamp);
  if (m === null) throw new Error(`not a YYMMDD/HHMM stamp: ${stamp}`);
  const iso = `20${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
  return applyTransform(root, "BACKLOG.md", `docs_repair: legacy stamp ${stamp} → ${iso} (line ${line})`, (content, eol) => {
    const lines = splitLines(content);
    const idx = line - 1;
    const current = lines[idx] ?? "";
    if (!current.includes(stamp)) {
      throw new Error(`stale repair: line ${line} no longer carries ${stamp} — retry docs_repair`);
    }
    lines[idx] = current.split(stamp).join(iso);
    return lines.join(eol);
  });
}

function appendIndexLine(root: string, id: string): PlanChange[] {
  const docs = loadProject(root);
  const archiveText = readFileSync(join(root, "docs", "archive", "BACKLOG_ARCHIVE.md"), "utf8");
  const backlogText = readFileSync(join(root, "BACKLOG.md"), "utf8");
  const locale = detectLocale(backlogText, archiveText);
  const doneWord = canonical("doneWord", locale);
  const archived = docs.backlogArchive().value.find((item) => item.id === id);
  if (archived === undefined) {
    throw new Error(`stale repair: archive block "${id}" is gone — retry docs_repair`);
  }
  const doneIndexHeading = synonymPattern("doneIndexHeading");
  return applyTransform(
    root,
    "BACKLOG.md",
    `docs_repair: Done Index line for "${id}" reconstructed from the archive block title`,
    (content, eol) => {
      const lines = splitLines(content);
      let sectionStart = -1;
      for (const [idx, line] of lines.entries()) {
        if (SECTION_HEADING.test(line) && doneIndexHeading.test(line)) {
          sectionStart = idx;
          break;
        }
      }
      if (sectionStart === -1) throw new Error("missing Done Index section in BACKLOG.md");
      let end = sectionStart + 1;
      while (end < lines.length && !SECTION_HEADING.test(lines[end]!) && !RULE_LINE.test(lines[end]!)) {
        end += 1;
      }
      let insertAt = end;
      while (insertAt > sectionStart + 1 && (lines[insertAt - 1]?.trim() ?? "") === "") {
        insertAt -= 1;
      }
      lines.splice(
        insertAt,
        0,
        `- ${id} — ${archived.title} — ${doneWord} (index line reconstructed by docs_repair; commit unknown)`,
      );
      return lines.join(eol);
    },
  );
}

function insertWipSkeleton(root: string, step: string): PlanChange[] {
  const progress = readProgress(root).value;
  const row: ProgressRow | undefined = progress.rows.find((r) => r.step === step);
  if (row === undefined) throw new Error(`stale repair: table row ${step} is gone — retry docs_repair`);
  const phaseNumber = step.split(".")[0] ?? "";
  // Guard: only when this phase has NO other table rows — otherwise the scope for
  // the sibling rows would be invented (M17/SCOPE_ROW_MISSING would fire on the
  // new block). Scope reconstruction for real phases needs a human.
  const siblings = progress.rows.filter((r) => r.step !== step && r.step.startsWith(`${phaseNumber}.`));
  if (siblings.length > 0) {
    throw new Error(
      `repair refused: phase ${phaseNumber} has ${siblings.length} other table row(s) — reconstructing their scope needs a human`,
    );
  }
  const progressText = readFileSync(join(root, "PROGRESS.md"), "utf8");
  const locale = detectLocale(progressText, progressText);
  const scopeHeading = `${canonical("scopeLabel", locale)} (Steps):`;
  return applyTransform(root, "PROGRESS.md", `docs_repair: running-phase skeleton for step ${step} (header + scope bullet)`, (content, eol) => {
    const lines = splitLines(content);
    insertRunningPhaseSkeleton(lines, `### Phase ${phaseNumber}`, scopeHeading, [`- **${step} ${row.name}**`]);
    return lines.join(eol);
  });
}

function executeOne(root: string, finding: FindingLike, target: string): PlanChange[] {
  switch (finding.code) {
    case "EMPTY_MARKER_STALE":
      return removeEmptyMarker(root, finding.line ?? 0);
    case "DATE_LEGACY":
      return rewriteLegacyDate(root, finding.line ?? 0, target);
    case "NOT_ARCHIVED": {
      const plan = planArchiveItem(root, target, { dryRun: false, note: "repaired by docs_repair" });
      applyArchivePlan(plan);
      return plan.changes;
    }
    case "ARCHIVE_WITHOUT_INDEX":
      return appendIndexLine(root, target);
    case "WIP_WITHOUT_PLAN":
      return insertWipSkeleton(root, target);
    default:
      throw new Error(`not repairable: ${finding.code}`);
  }
}

const MAX_ITERATIONS = 50;

export function docsRepair(root: string, options: DocsRepairOptions = {}): DocsRepairPlan {
  const dryRun = options.dryRun ?? true;

  // Dry-run: classify once, report planned/skipped, write nothing.
  const initial = docsValidate(root);
  const planned: DocsRepairAction[] = [];
  const drySkipped: Array<DocsRepairAction & { reason: string }> = [];
  for (const finding of initial.findings) {
    const classified = classifyFinding(finding);
    if ("skipReason" in classified) {
      drySkipped.push({ code: finding.code, file: finding.file, target: "", reason: classified.skipReason });
    } else {
      planned.push(classified);
    }
  }
  if (dryRun) {
    return {
      root,
      dryRun: true,
      fix: { planned, applied: [], skipped: drySkipped },
      changes: [],
      verification: {
        ok: initial.findings.length === 0,
        messages: initial.findings.map((f) => `${f.code}: ${f.message}`),
      },
    };
  }

  // Apply: ONE action per iteration on freshly computed state — spans never go
  // stale across repairs, and each applied repair is immediately re-validated.
  const applied: DocsRepairAction[] = [];
  const changes: PlanChange[] = [];
  const refusals = new Map<string, string>();
  let guard = 0;
  while (guard++ < MAX_ITERATIONS) {
    const current = docsValidate(root);
    const next = current.findings.find((f) => {
      if (refusals.has(`${f.code}:${f.line ?? ""}`)) return false;
      return !("skipReason" in classifyFinding(f));
    });
    if (next === undefined) break;
    const action = classifyFinding(next) as DocsRepairAction;
    try {
      changes.push(...executeOne(root, next, action.target));
    } catch (err) {
      // deterministic refusal (e.g. multi-row phase) — record and never retry
      refusals.set(`${next.code}:${next.line ?? ""}`, err instanceof Error ? err.message : String(err));
      continue;
    }
    applied.push(action);
    // stuck guard: the repair ran but the finding survived — never retry it
    const after = docsValidate(root);
    if (after.findings.some((f) => f.code === next.code && f.message === next.message)) {
      refusals.set(`${next.code}:${next.line ?? ""}`, "repair did not clear the finding — left as is");
    }
  }

  const finalResult = docsValidate(root);
  const skipped: Array<DocsRepairAction & { reason: string }> = [];
  for (const finding of finalResult.findings) {
    const key = `${finding.code}:${finding.line ?? ""}`;
    const refusal = refusals.get(key);
    const classified = classifyFinding(finding);
    skipped.push({
      code: finding.code,
      file: finding.file,
      target: "",
      reason:
        refusal ??
        ("skipReason" in classified
          ? classified.skipReason
          : "repair did not clear the finding — left as is"),
    });
  }

  return {
    root,
    dryRun: false,
    fix: { planned: [], applied, skipped },
    changes,
    verification: {
      ok: finalResult.findings.length === 0,
      messages: finalResult.findings.map((f) => `${f.code}: ${f.message}`),
    },
  };
}
