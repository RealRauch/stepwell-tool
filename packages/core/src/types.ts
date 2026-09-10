export type Priority = "🔴" | "🟠" | "🟡" | "🟢" | "🔵" | "unknown";

export interface Warning {
  code: string;
  /** Dateipfad des Befunds — Ausnahme: Root-level-Funde (z. B. PROJECT_NOT_INITIALIZED) tragen den Projekt-Root (Verzeichnis). */
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
  /** Erste ⬜-Zeile einer laufenden Phase (Tabellen-Ordnung) — undefined, wenn keine. */
  nextStep: ProgressRow | undefined;
  /** Erste nicht-leere Prioritäts-Sektion (🔴→🔵) — undefined, wenn keine offenen Items. */
  nextPriority: Priority | undefined;
  /** Nur mit `include: ["nextStepScope"]` (E2/12.3): Ziel/Abnahme/Scope + gemergtes Item des nächsten Steps. */
  nextStepScope?: NextStepScope;
  warnings: Warning[];
}

/** Step-Kontext für den Session-Einstieg (E2/12.3) — 1 Call statt docs_status + progress_show + backlog_show. */
export interface NextStepScope {
  phase: string;
  phaseTitle: string;
  step: string;
  name: string;
  goal: string;
  acceptance: string;
  /** Scope-Bullet des Steps, verbatim aus dem Detail-Block. */
  scope?: string;
  /** Über `(X/n)`-Ref aufgelöstes Backlog-Item (offen bevorzugt, sonst Archiv) — undefined, wenn kein Ref oder nicht auflösbar. */
  item?: BacklogItem;
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
  checkpoint?: string;
  completedPhase: boolean;
  /** Statischer Erinnerungs-Baustein bei Phasen-Abschluss (L4) — reiner Text. */
  docSyncReminder?: string;
  changes: PlanChange[];
}

export interface BacklogAddPlan {
  root: string;
  id: string;
  section: string;
  dryRun: boolean;
  changes: PlanChange[];
}

export interface BacklogUpdatePlan {
  root: string;
  id: string;
  dryRun: boolean;
  changes: PlanChange[];
}

export interface BacklogRemovePlan {
  root: string;
  id: string;
  dryRun: boolean;
  note: string | undefined;
  changes: PlanChange[];
}

export interface PhasePlan {
  root: string;
  phase: string;
  dryRun: boolean;
  changes: PlanChange[];
}

export interface ApplyResult {
  written: string[];
  verification: { ok: boolean; messages: string[] };
}
