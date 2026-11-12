import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseBacklog } from "./backlog.ts";
import { parseProgressArchive, toArchiveItem } from "./archive.ts";
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
  DoneEntry,
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
   * M24/32.3: each record also carries the file's own Done-Index section entries
   * (coupled model — an index line lives where its block lives).
   */
  backlogArchiveFiles(): ReadonlyArray<{
    file: string;
    result: ParseResult<ArchiveItem[]>;
    doneIndex: DoneEntry[];
  }>;
  progressArchiveFiles(): ReadonlyArray<{ file: string; result: ParseResult<PhaseBlock[]> }>;
  /**
   * M24/32.3: the union Done Index — BACKLOG.md's section plus every shard's
   * own section (order: BACKLOG first, then shards p<n>-ascending).
   */
  doneIndexAll(): DoneEntry[];
}

export function loadProject(root: string): ProjectDocs {
  const missing = missingProjectFiles(root);
  if (missing.length === REQUIRED_FILES.length) {
    throw new ProjectNotInitializedError(root, missing);
  }
  if (missing.length > 0) {
    throw new Error(`missing required file(s) under ${root}: ${missing.join(", ")}`);
  }
  const backlogMemo = memo(() =>
    parseBacklog(readRequired(root, BACKLOG_PATH), join(root, BACKLOG_PATH)),
  );
  const backlogArchiveFiles = memo(() => backlogArchiveFileParses(root));
  const progressArchiveFiles = memo(() =>
    archiveFiles(root, "progress", PROGRESS_ARCHIVE_PATH, parseProgressArchive),
  );
  const doneIndexAll = memo(() => [
    ...backlogMemo().value.doneIndex,
    ...backlogArchiveFiles().flatMap((f) => f.doneIndex),
  ]);
  return {
    root,
    backlog: backlogMemo,
    progress: memo(() => parseProgress(readRequired(root, PROGRESS_PATH), join(root, PROGRESS_PATH))),
    backlogArchive: memo(() => concatArchive(backlogArchiveFiles().map((f) => ({ result: f.result })))),
    progressArchive: memo(() => concatArchive(progressArchiveFiles())),
    backlogArchiveFiles,
    progressArchiveFiles,
    doneIndexAll,
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

/** Backlog archives with per-file done-index sections (M24/32.3). */
function backlogArchiveFileParses(root: string) {
  const files = [...archiveShardPaths(root, "backlog"), BACKLOG_ARCHIVE_PATH];
  return files.map((rel) => {
    const file = join(root, rel);
    const parsed = parseBacklog(readRequired(root, rel), file);
    return {
      file,
      result: { value: parsed.value.items.map(toArchiveItem), warnings: parsed.warnings },
      doneIndex: parsed.value.doneIndex,
    };
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
  const done = docs.doneIndexAll().find((d) => d.id === id);
  if (done) entry.done = done;

  const archive = docs.backlogArchive().value.find((item) => item.id === id);
  if (archive) entry.archive = archive;

  return entry.item !== undefined || entry.done !== undefined || entry.archive !== undefined
    ? entry
    : undefined;
}
