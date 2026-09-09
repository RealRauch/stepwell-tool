import { loadProject, type ProjectDocs } from "./project.ts";
import { ProjectNotInitializedError } from "./project-files.ts";
import { scopeSteps } from "./progress.ts";
import { docsValidate } from "./validate.ts";
import type { DocsStatus, Priority, ProgressRow } from "./types.ts";

export function docsStatus(root: string): DocsStatus {
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

  // Next-Action (L7): erste ⬜-Zeile der laufenden Phasen (Tabellen-Ordnung) +
  // erste nicht-leere Prioritäts-Sektion (🔴→🔵) — rein ableitend.
  const planningBlocks = progress.value.phases.filter((block) => {
    const steps = new Set(scopeSteps(block));
    return progress.value.rows.some((r) => r.status === "🔄" && steps.has(r.step));
  });
  const plannedSteps = new Set(planningBlocks.flatMap((block) => scopeSteps(block)));
  const nextStep: ProgressRow | undefined = progress.value.rows.find(
    (r) => r.status === "⬜" && plannedSteps.has(r.step),
  );
  const nextPriority = (["🔴", "🟠", "🟡", "🟢", "🔵"] as const).find(
    (p) => openByPriority[p] > 0,
  );

  const validation = docsValidate(root);
  const warnings = [...validation.findings, ...validation.warnings];

  return {
    openByPriority,
    openTotal,
    runningSteps,
    runningPhases,
    doneQuote: { done, total, percent },
    nextStep,
    nextPriority,
    warnings,
  };
}
