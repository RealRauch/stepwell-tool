import { canonical, detectLocale } from "./profile.ts";
import { backlogShow, loadProject, type ProjectDocs } from "./project.ts";
import { scopeSteps } from "./progress.ts";
import type { BacklogItem, PhaseBlock, ProgressRow } from "./types.ts";

/**
 * Phase-Kontext zur Lesezeit (G5/12.6): Phase verbatim, Tabellen-Zeilen der Phase und
 * die per ID-Ref gemergten Backlog-Item-Bodies in Step-Reihenfolge — kein Duplikat in
 * den Dateien, kein Schreibpfad, kein Cache (Zero-Cache bleibt).
 */
export interface PhaseContext {
  phase: PhaseBlock;
  rows: ProgressRow[];
  items: BacklogItem[];
  /** Explizite Refs `(X/n)`, die weder offen noch im Archiv auflösbar sind — toleriert, kein Crash (Decision 6). */
  unresolved: string[];
  markdown: string;
}

const EXPLICIT_REF = /\(([A-Z]+[0-9]+)\/[0-9]+\)/gu;
const ID_TOKEN = /\b([A-Z]{1,3}[0-9]{1,4})\b/gu;

function phaseMatches(block: PhaseBlock, phase: string): boolean {
  return (
    block.name === phase ||
    block.title === phase ||
    `${block.name} — ${block.title}` === phase
  );
}

function findBlock(docs: ProjectDocs, phase: string): PhaseBlock | undefined {
  return (
    docs.progress().value.phases.find((b) => phaseMatches(b, phase)) ??
    docs.progressArchive().value.find((b) => phaseMatches(b, phase))
  );
}

function collectRefs(block: PhaseBlock): { ids: string[]; explicitRefs: Map<string, string> } {
  const ids: string[] = [];
  const seen = new Set<string>();
  const explicitRefs = new Map<string, string>();
  const push = (id: string, rawRef: string | undefined): void => {
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
    if (rawRef !== undefined) explicitRefs.set(id, rawRef);
  };
  for (const entry of block.scope) {
    for (const m of entry.matchAll(EXPLICIT_REF)) push(m[1]!, m[0]!.slice(1, -1));
    for (const m of entry.matchAll(ID_TOKEN)) push(m[1]!, undefined);
  }
  return { ids, explicitRefs };
}

function resolveItem(root: string, docs: ProjectDocs, id: string): BacklogItem | undefined {
  const open = docs.backlog().value.items.find((i) => i.id === id);
  if (open !== undefined) return open;
  const entry = backlogShow(root, id);
  return entry?.item ?? entry?.archive;
}

function renderMarkdown(
  block: PhaseBlock,
  rows: ProgressRow[],
  items: BacklogItem[],
  unresolved: string[],
): string {
  const locale = detectLocale(block.raw);
  const progressLabel = canonical("progressHeading", locale);
  const lines: string[] = [block.raw, "", `**${progressLabel}:**`, "", "| # | Step | Status |", "|---|------|--------|"];
  for (const row of rows) {
    lines.push(`| ${row.step} | ${row.name} | ${row.status} |`);
  }
  for (const item of items) {
    lines.push("", `### ${item.id} — ${item.title} — ${item.priority}`, "", item.text);
  }
  if (unresolved.length > 0) {
    lines.push("", `> unresolved refs: ${unresolved.join(", ")}`);
  }
  return lines.join("\n");
}

export function phaseContext(root: string, phase: string): PhaseContext {
  const docs = loadProject(root);
  const block = findBlock(docs, phase);
  if (block === undefined) {
    throw new Error(`unknown phase: ${phase} (weder laufende Phase noch Archiv)`);
  }
  const steps = new Set(scopeSteps(block));
  const rows = docs.progress().value.rows.filter((r) => steps.has(r.step));
  const { ids, explicitRefs } = collectRefs(block);
  const items: BacklogItem[] = [];
  const unresolved: string[] = [];
  for (const id of ids) {
    const item = resolveItem(root, docs, id);
    if (item !== undefined) {
      items.push(item);
    } else if (explicitRefs.has(id)) {
      unresolved.push(explicitRefs.get(id)!);
    }
  }
  return {
    phase: block,
    rows,
    items,
    unresolved,
    markdown: renderMarkdown(block, rows, items, unresolved),
  };
}
