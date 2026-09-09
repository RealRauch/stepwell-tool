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
}

export function loadProject(root: string): ProjectDocs {
  const missing = missingProjectFiles(root);
  if (missing.length === REQUIRED_FILES.length) {
    throw new ProjectNotInitializedError(root, missing);
  }
  if (missing.length > 0) {
    throw new Error(`missing required file(s) under ${root}: ${missing.join(", ")}`);
  }
  return {
    root,
    backlog: memo(() => parseBacklog(readRequired(root, BACKLOG_PATH), join(root, BACKLOG_PATH))),
    progress: memo(() => parseProgress(readRequired(root, PROGRESS_PATH), join(root, PROGRESS_PATH))),
    backlogArchive: memo(() =>
      parseBacklogArchive(readRequired(root, BACKLOG_ARCHIVE_PATH), join(root, BACKLOG_ARCHIVE_PATH)),
    ),
    progressArchive: memo(() =>
      parseProgressArchive(
        readRequired(root, PROGRESS_ARCHIVE_PATH),
        join(root, PROGRESS_ARCHIVE_PATH),
      ),
    ),
  };
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
