import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  Backlog,
  BacklogItem,
  BacklogSection,
  DoneEntry,
  ParseResult,
  Priority,
  Warning,
} from "./types.js";

const PRIORITY_EMOJIS: readonly string[] = ["🔴", "🟠", "🟡", "🟢", "🔵"];
const PICTOGRAPHIC = /^[\p{Extended_Pictographic}\uFE0F\u200D]+$/u;
const SEPARATOR = /^(.*?)\s+—\s+([\s\S]*)$/;
const TITLE_SUFFIX = /^(.*\S)\s+—\s+(\S+)$/u;
const OPTIONAL_SUFFIX = /\s*\*\([^()]*\)\*$/u;
const BULLET = /^-\s+\*\*.+?:\*\*/u;
const LOCATION_BULLET = /^-\s+\*\*Ort:\*\*\s+(.+?)\s*$/u;
const DONE_LINE = /^-\s+(.+?)\s+—\s+(.+?)\s+—\s+erledigt in\s+`([^`]+)`/u;
const SEPARATOR_RULE = /^-{3,}\s*$/u;

const isKnownPriority = (token: string): token is Exclude<Priority, "unknown"> =>
  PRIORITY_EMOJIS.includes(token);

const stripQuote = (line: string): string => line.replace(/^>\s?/, "");

function splitEmoji(heading: string): { emoji: string; title: string } {
  const m = /^(\S+)\s+([\s\S]*)$/.exec(heading);
  if (m && PICTOGRAPHIC.test(m[1]!)) {
    return { emoji: m[1]!, title: m[2]!.trim() };
  }
  return { emoji: "", title: heading.trim() };
}

interface TitleParts {
  id: string;
  title: string;
  known: Priority | undefined;
  duplicate: boolean;
  unknownEmoji: boolean;
}

function extractTitleParts(rest: string): TitleParts {
  const sep = SEPARATOR.exec(rest);
  let id: string;
  let title: string;
  if (sep) {
    id = sep[1]!.trim();
    title = sep[2]!.trim();
  } else {
    id = rest.trim();
    title = "";
  }

  let knownCount = 0;
  let known: Priority | undefined;
  let unknownEmoji = false;
  for (;;) {
    const stripped = title.replace(OPTIONAL_SUFFIX, "").trim();
    let changed = stripped !== title;
    title = stripped;
    const m = TITLE_SUFFIX.exec(title);
    if (m) {
      const token = m[2]!;
      if (isKnownPriority(token)) {
        knownCount += 1;
        known = token;
        title = m[1]!.trim();
        changed = true;
      } else if (!unknownEmoji && PICTOGRAPHIC.test(token)) {
        unknownEmoji = true;
        title = m[1]!.trim();
        changed = true;
      }
    }
    if (!changed) break;
  }

  return { id, title, known, duplicate: knownCount > 1, unknownEmoji };
}

interface RawItem {
  heading: string;
  headingLine: number;
  open: boolean;
  rest: string;
  body: string[];
}

interface BuiltItem {
  item: BacklogItem;
  warnings: Warning[];
}

function buildItem(raw: RawItem, section: BacklogSection | null, file: string): BuiltItem {
  const warnings: Warning[] = [];
  const { id, title, known, duplicate, unknownEmoji } = extractTitleParts(raw.rest);

  if (duplicate) {
    warnings.push({
      code: "PRIO_DUPLICATE",
      file,
      line: raw.headingLine,
      message: `Item "${id}" trägt mehrere Prioritäts-Marker im Titel — nur einer wird erfasst.`,
    });
  }

  let priority: Priority;
  if (known !== undefined) {
    priority = known;
  } else if (unknownEmoji) {
    priority = "unknown";
    warnings.push({
      code: "PRIO_UNKNOWN",
      file,
      line: raw.headingLine,
      message: `Item "${id}" trägt ein unbekanntes Prioritäts-Emoji — priority ist "unknown".`,
    });
  } else if (section !== null && isKnownPriority(section.emoji)) {
    priority = section.emoji;
    warnings.push({
      code: "PRIO_MISSING",
      file,
      line: raw.headingLine,
      message: `Item "${id}" hat keinen Prioritäts-Suffix — Priorität aus dem Sektions-Emoji übernommen.`,
    });
  } else {
    priority = "unknown";
    warnings.push({
      code: "PRIO_MISSING",
      file,
      line: raw.headingLine,
      message: `Item "${id}" hat weder Titel-Suffix noch bekanntes Sektions-Emoji — priority ist "unknown".`,
    });
  }

  if (id !== "" && title === "") {
    warnings.push({
      code: "TITLE_EMPTY",
      file,
      line: raw.headingLine,
      message: `Item "${id}" hat keinen Titel nach dem Trenner.`,
    });
  }

  let bodyEnd = raw.headingLine + raw.body.length;
  while (bodyEnd > raw.headingLine && (raw.body[bodyEnd - raw.headingLine - 1] ?? "").trim() === "") {
    bodyEnd -= 1;
  }
  const bodyLines = raw.body.slice(0, bodyEnd - raw.headingLine);
  const contentLines = bodyLines.filter((l) => l.trim() !== "");

  if (contentLines.length > 0 && !contentLines.some((l) => BULLET.test(l))) {
    warnings.push({
      code: "BLOCK_UNSTRUCTURED",
      file,
      line: raw.headingLine,
      message: `Item "${id}" hat keinen strukturierten Block (keine **Label:**-Bullets) — Text als Freitext erfasst.`,
    });
  }

  const item: BacklogItem = {
    id,
    title,
    priority,
    section: section?.title ?? "",
    open: raw.open,
    text: bodyLines.join("\n"),
    span: { start: raw.headingLine, end: bodyEnd },
    raw: [raw.heading, ...bodyLines].join("\n"),
  };
  for (const line of bodyLines) {
    const location = LOCATION_BULLET.exec(line);
    if (location) {
      item.location = location[1]!;
      break;
    }
  }

  return { item, warnings };
}

export function parseBacklog(content: string, file = "BACKLOG.md"): ParseResult<Backlog> {
  const lines = content.split(/\r?\n/);
  const warnings: Warning[] = [];
  const sections: BacklogSection[] = [];
  const headerRules: string[][] = [];
  const items: BacklogItem[] = [];
  const doneIndex: DoneEntry[] = [];

  let currentSection: BacklogSection | null = null;
  let inDoneIndex = false;
  let headerRuleOpen = false;
  let currentItem: RawItem | null = null;

  const flushItem = (): void => {
    if (currentItem === null) return;
    const built = buildItem(currentItem, currentSection, file);
    items.push(built.item);
    warnings.push(...built.warnings);
    currentItem = null;
  };

  const endSection = (): void => {
    flushItem();
    currentSection = null;
    headerRuleOpen = false;
  };

  for (const [idx, line] of lines.entries()) {
    const lineNo = idx + 1;

    const sectionMatch = /^##\s+(.*)$/.exec(line);
    if (sectionMatch) {
      endSection();
      const heading = sectionMatch[1]!.trim();
      if (/Erledigt-Index/u.test(heading)) {
        inDoneIndex = true;
        continue;
      }
      inDoneIndex = false;
      const { emoji, title } = splitEmoji(heading);
      currentSection = { title, emoji, headerRule: "" };
      headerRules.push([]);
      sections.push(currentSection);
      headerRuleOpen = true;
      continue;
    }

    const itemMatch = /^###\s+\[(.)\]\s*([\s\S]*)$/u.exec(line);
    if (itemMatch) {
      if (inDoneIndex) continue;
      flushItem();
      headerRuleOpen = false;
      currentItem = {
        heading: line,
        headingLine: lineNo,
        open: itemMatch[1] === " ",
        rest: itemMatch[2] ?? "",
        body: [],
      };
      continue;
    }

    if (SEPARATOR_RULE.test(line)) {
      endSection();
      inDoneIndex = false;
      continue;
    }

    if (currentItem !== null) {
      currentItem.body.push(line);
      continue;
    }

    if (inDoneIndex) {
      const done = DONE_LINE.exec(line);
      if (done) {
        doneIndex.push({ id: done[1]!.trim(), summary: done[2]!.trim(), sha: done[3]! });
      }
      continue;
    }

    if (currentSection !== null && headerRuleOpen) {
      const ruleParts = headerRules[sections.indexOf(currentSection)];
      if (line.startsWith(">")) {
        ruleParts?.push(stripQuote(line));
      } else if (line.trim() !== "") {
        headerRuleOpen = false;
      }
    }
  }
  endSection();

  for (const [i, section] of sections.entries()) {
    section.headerRule = (headerRules[i] ?? []).join("\n");
  }

  return { value: { sections, items, doneIndex }, warnings };
}

export function readBacklog(root: string): ParseResult<Backlog> {
  const path = join(root, "BACKLOG.md");
  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    throw new Error(`missing required file: ${path}`);
  }
  return parseBacklog(content, path);
}
