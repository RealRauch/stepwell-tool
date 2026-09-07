export { parseBacklog, readBacklog } from "./backlog.ts";
export { parseProgress, readProgress, scopeSteps } from "./progress.ts";
export { parseBacklogArchive, parseProgressArchive } from "./archive.ts";
export { backlogShow, loadProject } from "./project.ts";
export type { ProjectDocs } from "./project.ts";
export { docsStatus } from "./status.ts";
export { docsValidate } from "./validate.ts";
export type {
  ArchiveItem,
  Backlog,
  BacklogEntry,
  BacklogItem,
  BacklogSection,
  DoneEntry,
  DocsStatus,
  ParseResult,
  PhaseBlock,
  Priority,
  Progress,
  ProgressRow,
  Status,
  ValidateResult,
  Warning,
} from "./types.ts";

export const TOOL_NAME = "method-docs";
export const TOOL_VERSION = "0.1.0";
