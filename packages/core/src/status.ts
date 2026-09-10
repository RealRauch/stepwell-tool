import { loadProject, type ProjectDocs } from "./project.ts";
import { backlogShow } from "./project.ts";
import { ProjectNotInitializedError } from "./project-files.ts";
import { scopeSteps } from "./progress.ts";
import { docsValidate } from "./validate.ts";
import type {
  BacklogItem,
  DocsStatus,
  NextStepScope,
  Priority,
  ProgressRow,
} from "./types.ts";

export interface DocsStatusOptions {
  /** Zusatz-Kontext: `"nextStepScope"` liefert Ziel/Abnahme/Scope + gemergtes Backlog-Item des nächsten Steps (E2/12.3). */
  include?: ReadonlyArray<"nextStepScope">;
}

const ITEM_REF = /\(([A-Z]+[0-9]+)\/[0-9]+\)/u;

function resolveNextStepScope(
  root: string,
  docs: ProjectDocs,
  row: ProgressRow,
): NextStepScope | undefined {
  const block = docs.progress().value.phases.find((b) => scopeSteps(b).includes(row.step));
  if (block === undefined) return undefined;
  const scopeEntry = block.scope.find((s) => scopeStepsLike(s) === row.step);
  const refSource = `${row.name} ${scopeEntry ?? ""}`;
  const match = ITEM_REF.exec(refSource);
  let item: BacklogItem | undefined;
  if (match !== null) {
    const id = match[1]!;
    const open = docs.backlog().value.items.find((i) => i.id === id);
    if (open !== undefined) {
      item = open;
    } else {
      const entry = backlogShow(root, id);
      item = entry?.item ?? entry?.archive;
    }
  }
  return {
    phase: block.name,
    phaseTitle: block.title,
    step: row.step,
    name: row.name,
    goal: block.goal,
    acceptance: block.acceptance,
    ...(scopeEntry !== undefined ? { scope: scopeEntry } : {}),
    ...(item !== undefined ? { item } : {}),
  };
}

function scopeStepsLike(entry: string): string | undefined {
  const m = /^\*{0,2}\s*(\d+(?:\.\d+)?)\b/u.exec(entry);
  return m?.[1];
}

export function docsStatus(root: string, options?: DocsStatusOptions): DocsStatus {
  let docs: ProjectDocs;
  try {
    docs = loadProject(root);
  } catch (err) {
    if (err instanceof ProjectNotInitializedError) {
      return {
        openByPriority: { "🔴": 0, "🟠": 0, "🟡": 0, "🟢": 0, "🔵": 0, unknown: 0 },
        openTotal: 0,
        runningSteps: [],
        runningPhases: [],
        doneQuote: { done: 0, total: 0, percent: 0 },
        nextStep: undefined,
        nextPriority: undefined,
        warnings: [{ code: "PROJECT_NOT_INITIALIZED", file: root, message: err.message }],
      };
    }
    throw err;
  }
  const backlog = docs.backlog();
  const progress = docs.progress();

  const openByPriority: Record<Priority, number> = {
    "🔴": 0,
    "🟠": 0,
    "🟡": 0,
    "🟢": 0,
    "🔵": 0,
    unknown: 0,
  };
  let openTotal = 0;
  for (const item of backlog.value.items) {
    if (item.open) {
      openByPriority[item.priority] += 1;
      openTotal += 1;
    }
  }

  const runningSteps: ProgressRow[] = progress.value.rows.filter((r) => r.status === "🔄");
  const runningPhases: string[] = [];
  for (const block of progress.value.phases) {
    const steps = new Set(scopeSteps(block));
    const isRunning = runningSteps.some((r) => steps.has(r.step));
    if (isRunning) {
      const label = block.title !== "" ? `${block.name} — ${block.title}` : block.name;
      if (!runningPhases.includes(label)) runningPhases.push(label);
    }
  }

  const done = progress.value.rows.filter((r) => r.status === "✅").length;
  const total = progress.value.rows.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  // Next-Action (L7/L10): Kaskade — (1) erste ⬜-Zeile einer Phase mit 🔄
  // (Vorrang laufender Arbeit), (2) sonst erste ⬜-Zeile einer rein vorausgeplanten
  // Phase (Tabellen-Ordnung), (3) sonst undefined.
  const openRowIn = (blocks: typeof progress.value.phases): ProgressRow | undefined => {
    const steps = new Set(blocks.flatMap((block) => scopeSteps(block)));
    return progress.value.rows.find((r) => r.status === "⬜" && steps.has(r.step));
  };
  const runningBlocks = progress.value.phases.filter((block) => {
    const steps = new Set(scopeSteps(block));
    return progress.value.rows.some((r) => r.status === "🔄" && steps.has(r.step));
  });
  const plannedOnlyBlocks = progress.value.phases.filter((block) => !runningBlocks.includes(block));
  const nextStep: ProgressRow | undefined = openRowIn(runningBlocks) ?? openRowIn(plannedOnlyBlocks);
  const nextPriority = (["🔴", "🟠", "🟡", "🟢", "🔵"] as const).find(
    (p) => openByPriority[p] > 0,
  );

  const validation = docsValidate(root);
  const warnings = [...validation.findings, ...validation.warnings];

  const nextStepScope =
    options?.include?.includes("nextStepScope") === true && nextStep !== undefined
      ? resolveNextStepScope(root, docs, nextStep)
      : undefined;

  return {
    openByPriority,
    openTotal,
    runningSteps,
    runningPhases,
    doneQuote: { done, total, percent },
    nextStep,
    nextPriority,
    ...(nextStepScope !== undefined ? { nextStepScope } : {}),
    warnings,
  };
}
