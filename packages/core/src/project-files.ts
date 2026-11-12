import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const BACKLOG_PATH = "BACKLOG.md";
export const PROGRESS_PATH = "PROGRESS.md";
export const BACKLOG_ARCHIVE_PATH = join("docs", "archive", "BACKLOG_ARCHIVE.md");
export const PROGRESS_ARCHIVE_PATH = join("docs", "archive", "PROGRESS_ARCHIVE.md");

export type ArchiveKind = "backlog" | "progress";

const ARCHIVE_DIR = join("docs", "archive");
const SHARD_SUFFIX = /\.p(\d+)\.md$/u;

/**
 * H11/32.1: shard files of one archive kind, ordered p<n>-ascending by phase
 * NUMBER (p2 before p10); non-p variants sort lexicographically after the
 * p-series. The canonical file is NOT included — readers append it last.
 * A missing archive dir yields [] (missingProjectFiles handles the hard case).
 */
export function archiveShardPaths(root: string, kind: ArchiveKind): string[] {
  const prefix = kind === "backlog" ? "BACKLOG_ARCHIVE" : "PROGRESS_ARCHIVE";
  const canonical = `${prefix}.md`;
  const dir = join(root, ARCHIVE_DIR);
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries
    .filter((name) => name.startsWith(prefix) && name.endsWith(".md") && name !== canonical)
    .map((name) => {
      const m = SHARD_SUFFIX.exec(name);
      return { name, order: m ? Number(m[1]) : Number.POSITIVE_INFINITY };
    })
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    .map((e) => join(ARCHIVE_DIR, e.name));
}

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
