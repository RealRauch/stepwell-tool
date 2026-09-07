export { parseBacklog, readBacklog } from "./backlog.js";
export { parseProgress, readProgress, scopeSteps } from "./progress.js";
export { parseBacklogArchive, parseProgressArchive } from "./archive.js";
export { backlogShow, loadProject } from "./project.js";
export type { ProjectDocs } from "./project.js";
export { docsStatus } from "./status.js";
export { docsValidate } from "./validate.js";
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
} from "./types.js";

export const TOOL_NAME = "method-docs";
export const TOOL_VERSION = "0.1.0";
