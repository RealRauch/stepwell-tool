import { parseBacklog } from "./backlog.js";
import { parseProgress } from "./progress.js";
import type { ArchiveItem, ParseResult, PhaseBlock } from "./types.js";

const ERLEDIGT_LINE = /^-\s+\*\*Erledigt:\*\*\s*(.+?)\s*$/u;

export function parseBacklogArchive(
  content: string,
  file = "docs/archive/BACKLOG_ARCHIVE.md",
): ParseResult<ArchiveItem[]> {
  const result = parseBacklog(content, file);
  const items: ArchiveItem[] = result.value.items.map((item) => {
    const archive: ArchiveItem = { ...item, doneLine: "" };
    for (const line of item.text.split("\n")) {
      const m = ERLEDIGT_LINE.exec(line);
      if (m) {
        archive.doneLine = m[1]!;
        break;
      }
    }
    return archive;
  });
  return { value: items, warnings: result.warnings };
}

export function parseProgressArchive(
  content: string,
  file = "docs/archive/PROGRESS_ARCHIVE.md",
): ParseResult<PhaseBlock[]> {
  const result = parseProgress(content, file);
  return { value: result.value.phases, warnings: result.warnings };
}
