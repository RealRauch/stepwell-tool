import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseBacklog } from "./backlog.ts";
import { parseBacklogArchive, parseProgressArchive } from "./archive.ts";
import { parseProgress } from "./progress.ts";
import {
  BACKLOG_ARCHIVE_PATH,
  BACKLOG_PATH,
  PROGRESS_ARCHIVE_PATH,
  PROGRESS_PATH,
  REQUIRED_FILES,
  missingProjectFiles,
  ProjectNotInitializedError,
  archiveShardPaths,
  type ArchiveKind,
} from "./project-files.ts";
import type {
  ArchiveItem,
  Backlog,
  BacklogEntry,
  PhaseBlock,
  Progress,
  ParseResult,
} from "./types.ts";

function memo<T>(fn: () => T): () => T {
  let value: T | undefined;
  let loaded = false;
  return () => {
    if (!loaded) {
      value = fn();
      loaded = true;
    }
    return value!;
  };
}

function readRequired(root: string, relPath: string): string {
  const path = join(root, relPath);
  try {
    return readFileSync(path, "utf8");
  } catch {
    throw new Error(`missing required file: ${path}`);
  }
}

export interface ProjectDocs {
  root: string;
  backlog(): ParseResult<Backlog>;
  progress(): ParseResult<Progress>;
  backlogArchive(): ParseResult<ArchiveItem[]>;
  progressArchive(): ParseResult<PhaseBlock[]>;
  /**
   * H11/32.1: per-file archive parses (shards p<n>-ascending, canonical last).
   * Values concat to backlogArchive().value; warnings carry per-file attribution.
   */
  backlogArchiveFiles(): ReadonlyArray<{ file: string; result: ParseResult<ArchiveItem[]> }>;
  progressArchiveFiles(): ReadonlyArray<{ file: string; result: ParseResult<PhaseBlock[]> }>;
}

export function loadProject(root: string): ProjectDocs {
  const missing = missingProjectFiles(root);
  if (missing.length === REQUIRED_FILES.length) {
    throw new ProjectNotInitializedError(root, missing);
  }
  if (missing.length > 0) {
    throw new Error(`missing required file(s) under ${root}: ${missing.join(", ")}`);
  }
  const backlogArchiveFiles = memo(() =>
    archiveFiles(root, "backlog", BACKLOG_ARCHIVE_PATH, parseBacklogArchive),
  );
  const progressArchiveFiles = memo(() =>
    archiveFiles(root, "progress", PROGRESS_ARCHIVE_PATH, parseProgressArchive),
  );
  return {
    root,
    backlog: memo(() => parseBacklog(readRequired(root, BACKLOG_PATH), join(root, BACKLOG_PATH))),
    progress: memo(() => parseProgress(readRequired(root, PROGRESS_PATH), join(root, PROGRESS_PATH))),
    backlogArchive: memo(() => concatArchive(backlogArchiveFiles())),
    progressArchive: memo(() => concatArchive(progressArchiveFiles())),
    backlogArchiveFiles,
    progressArchiveFiles,
  };
}

/** Parse every shard (p<n>-ascending) plus the canonical file last (H11/32.1). */
function archiveFiles<T>(
  root: string,
  kind: ArchiveKind,
  canonicalPath: string,
  parse: (content: string, file: string) => ParseResult<T[]>,
): Array<{ file: string; result: ParseResult<T[]> }> {
  const files = [...archiveShardPaths(root, kind), canonicalPath];
  return files.map((rel) => {
    const file = join(root, rel);
    return { file, result: parse(readRequired(root, rel), file) };
  });
}

function concatArchive<T>(files: ReadonlyArray<{ result: ParseResult<T[]> }>): ParseResult<T[]> {
  const value = files.flatMap((f) => f.result.value);
  const warnings = files.flatMap((f) => f.result.warnings);
  return { value, warnings };
}

export function backlogShow(root: string, id: string): BacklogEntry | undefined {
  const docs = loadProject(root);
  const entry: BacklogEntry = { id };

  const backlog = docs.backlog().value;
  const openItem = backlog.items.find((item) => item.id === id);
  if (openItem) entry.item = openItem;
  const done = backlog.doneIndex.find((d) => d.id === id);
  if (done) entry.done = done;

  const archive = docs.backlogArchive().value.find((item) => item.id === id);
  if (archive) entry.archive = archive;

  return entry.item !== undefined || entry.done !== undefined || entry.archive !== undefined
    ? entry
    : undefined;
}
