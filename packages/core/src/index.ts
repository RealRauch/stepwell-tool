export { parseBacklog, readBacklog } from "./backlog.ts";
export { parseProgress, readProgress, scopeSteps } from "./progress.ts";
export { parseBacklogArchive, parseProgressArchive } from "./archive.ts";
export { backlogShow, loadProject } from "./project.ts";
export type { ProjectDocs } from "./project.ts";
export { lineDiff } from "./diff.ts";
export {
  applyArchivePlan,
  applyProgressPlan,
  applyBacklogAddPlan,
  applyBacklogRemovePlan,
  applyBacklogUpdatePlan,
  applyPhasePlan,
  planArchiveItem,
  planBacklogAdd,
  planBacklogRemove,
  planBacklogUpdate,
  planPhase,
  planProgressUpdate,
  stampNow,
  type ArchiveItemOptions,
  type BacklogAddOptions,
  type BacklogRemoveOptions,
  type BacklogUpdateOptions,
  type PhaseOptions,
  type PhaseStep,
  type ProgressUpdateOptions,
} from "./mutations.ts";
export {
  allSynonyms,
  canonical,
  detectLocale,
  getFieldByRole,
  synonymPattern,
  LOCALES,
  SYNONYMS,
  type Locale,
  type SynonymRole,
} from "./profile.ts";
export { docsStatus } from "./status.ts";
export { docsValidate } from "./validate.ts";
export {
  PRIORITY_ALIASES,
  STATUS_ALIASES,
  priorityAliasHelp,
  resolvePriority,
  resolveStatus,
  statusAliasHelp,
} from "./aliases.ts";
export type {
  ArchiveItem,
  ArchiveItemPlan,
  ApplyResult,
  Backlog,
  BacklogAddPlan,
  BacklogEntry,
  BacklogItem,
  BacklogRemovePlan,
  BacklogSection,
  BacklogUpdatePlan,
  DoneEntry,
  DocsStatus,
  ParseResult,
  PhaseBlock,
  PhasePlan,
  PlanChange,
  Priority,
  Progress,
  ProgressRow,
  ProgressUpdatePlan,
  Status,
  ValidateResult,
  Warning,
} from "./types.ts";

export const TOOL_NAME = "method-docs";
export const TOOL_VERSION = "0.1.0";
