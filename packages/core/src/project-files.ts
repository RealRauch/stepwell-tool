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
    super(
      `Kein STEPWELL-Projekt unter "${root}" — alle vier Doku-Dateien fehlen. ` +
        `Lege ${missing.join(", ")} an — Vorlagen: \`stepwell://templates/{kind}\` ` +
        `(backlog | progress | backlog-archive | progress-archive) oder Muster: ` +
        `PLAYBOOK §3 — oder prüfe den root-Pfad.`,
    );
    this.name = "ProjectNotInitializedError";
    this.missing = [...missing];
  }
}
