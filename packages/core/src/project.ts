import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseBacklog } from "./backlog.js";
import { parseBacklogArchive, parseProgressArchive } from "./archive.js";
import { parseProgress } from "./progress.js";
import type {
  ArchiveItem,
  Backlog,
  BacklogEntry,
  PhaseBlock,
  Progress,
  ParseResult,
} from "./types.js";

const BACKLOG_PATH = "BACKLOG.md";
const PROGRESS_PATH = "PROGRESS.md";
const BACKLOG_ARCHIVE_PATH = join("docs", "archive", "BACKLOG_ARCHIVE.md");
const PROGRESS_ARCHIVE_PATH = join("docs", "archive", "PROGRESS_ARCHIVE.md");

const REQUIRED_FILES = [BACKLOG_PATH, PROGRESS_PATH, BACKLOG_ARCHIVE_PATH, PROGRESS_ARCHIVE_PATH];

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
  const missing = REQUIRED_FILES.filter((rel) => !existsSync(join(root, rel)));
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
