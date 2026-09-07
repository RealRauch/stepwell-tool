export type Priority = "🔴" | "🟠" | "🟡" | "🟢" | "🔵" | "unknown";

export interface Warning {
  code: string;
  file: string;
  line?: number;
  message: string;
}

export interface ParseResult<T> {
  value: T;
  warnings: Warning[];
}

export interface BacklogSection {
  title: string;
  emoji: string;
  headerRule: string;
}

export interface BacklogItem {
  id: string;
  title: string;
  priority: Priority;
  section: string;
  open: boolean;
  location?: string;
  text: string;
  span: { start: number; end: number };
  raw: string;
}

export interface DoneEntry {
  id: string;
  summary: string;
  sha?: string;
}

export interface Backlog {
  sections: BacklogSection[];
  items: BacklogItem[];
  doneIndex: DoneEntry[];
}

export type Status = "⬜" | "🔄" | "✅" | "⛔" | "unknown";

export interface ProgressRow {
  step: string;
  name: string;
  status: Status;
}

export interface PhaseBlock {
  name: string;
  title: string;
  goal: string;
  scope: string[];
  acceptance: string;
  verification?: string;
  completedOn?: string;
  span: { start: number; end: number };
  raw: string;
}

export interface Progress {
  rows: ProgressRow[];
  phases: PhaseBlock[];
}

export interface ArchiveItem extends BacklogItem {
  doneLine: string;
}

export interface BacklogEntry {
  id: string;
  item?: BacklogItem;
  done?: DoneEntry;
  archive?: ArchiveItem;
}

export interface DocsStatus {
  openByPriority: Record<Priority, number>;
  openTotal: number;
  runningSteps: ProgressRow[];
  runningPhases: string[];
  doneQuote: { done: number; total: number; percent: number };
  warnings: Warning[];
}

export interface ValidateResult {
  findings: Warning[];
  warnings: Warning[];
  ok: boolean;
}

export interface PlanChange {
  file: string;
  description: string;
  before: string;
  after: string;
  diff: string;
}

export interface ArchiveItemPlan {
  root: string;
  id: string;
  dryRun: boolean;
  note: string | undefined;
  changes: PlanChange[];
}

export interface ProgressUpdatePlan {
  root: string;
  phase: string;
  step: string;
  status: Status;
  title: string | undefined;
  dryRun: boolean;
  note: string | undefined;
  completedPhase: boolean;
  changes: PlanChange[];
}

export interface ApplyResult {
  written: string[];
  verification: { ok: boolean; messages: string[] };
}
