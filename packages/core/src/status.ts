import { loadProject } from "./project.js";
import { scopeSteps } from "./progress.js";
import { docsValidate } from "./validate.js";
import type { DocsStatus, Priority, ProgressRow } from "./types.js";

export function docsStatus(root: string): DocsStatus {
  const docs = loadProject(root);
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

  const validation = docsValidate(root);
  const warnings = [...validation.findings, ...validation.warnings];

  return {
    openByPriority,
    openTotal,
    runningSteps,
    runningPhases,
    doneQuote: { done, total, percent },
    warnings,
  };
}
