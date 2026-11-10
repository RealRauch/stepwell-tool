import { existsSync } from "node:fs";
import { join } from "node:path";

export const BACKLOG_PATH = "BACKLOG.md";
export const PROGRESS_PATH = "PROGRESS.md";
export const BACKLOG_ARCHIVE_PATH = join("docs", "archive", "BACKLOG_ARCHIVE.md");
export const PROGRESS_ARCHIVE_PATH = join("docs", "archive", "PROGRESS_ARCHIVE.md");

export const REQUIRED_FILES = [
  BACKLOG_PATH,
  PROGRESS_PATH,
  BACKLOG_ARCHIVE_PATH,
  PROGRESS_ARCHIVE_PATH,
];

export function missingProjectFiles(root: string): string[] {
  return REQUIRED_FILES.filter((rel) => !existsSync(join(root, rel)));
}

export class ProjectNotInitializedError extends Error {
  readonly code = "PROJECT_NOT_INITIALIZED";
  readonly missing: string[];

  constructor(root: string, missing: readonly string[]) {
    // M13: neutral, non-prescriptive — a project-wide enabled server also runs in
    // repos that never asked for STEPWELL; missing all four is harmless, so the
    // message informs instead of instructing (no auto-init, Decision 14/M12 guardrail).
    super(
      `No STEPWELL project under "${root}" — all four doc files are missing. ` +
        `No action required unless you want to adopt STEPWELL (start from docs/QUICKSTART.md; ` +
        `templates: \`stepwell://templates/{kind}\` — backlog | progress | backlog-archive | progress-archive). ` +
        `Missing: ${missing.join(", ")}.`,
    );
    this.name = "ProjectNotInitializedError";
    this.missing = [...missing];
  }
}
