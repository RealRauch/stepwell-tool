export { parseBacklog, readBacklog } from "./backlog.ts";
export { parseProgress, readProgress, scopeSteps } from "./progress.ts";
export { parseBacklogArchive, parseProgressArchive } from "./archive.ts";
export { backlogShow, loadProject } from "./project.ts";
export type { ProjectDocs } from "./project.ts";
export { lineDiff } from "./diff.ts";
export {
  applyArchivePlan,
  applyProgressPlan,
  planArchiveItem,
  planProgressUpdate,
  type ArchiveItemOptions,
  type ProgressUpdateOptions,
} from "./mutations.ts";
export { docsStatus } from "./status.ts";
export { docsValidate } from "./validate.ts";
export type {
  ArchiveItem,
  ArchiveItemPlan,
  ApplyResult,
  Backlog,
  BacklogEntry,
  BacklogItem,
  BacklogSection,
  DoneEntry,
  DocsStatus,
  ParseResult,
  PhaseBlock,
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
