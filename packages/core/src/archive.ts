import { parseBacklog } from "./backlog.ts";
import { parseProgress } from "./progress.ts";
import { allSynonyms, escapeRegExp } from "./profile.ts";
import type { ArchiveItem, ParseResult, PhaseBlock } from "./types.ts";

const ERLEDIGT_LINE = new RegExp(
  `^-\\s+\\*\\*(?:${allSynonyms("doneLabel").map(escapeRegExp).join("|")}):\\*\\*\\s*(.+?)\\s*$`,
  "u",
);

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
