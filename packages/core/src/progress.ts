import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  ParseResult,
  PhaseBlock,
  Progress,
  ProgressRow,
  Status,
  Warning,
} from "./types.ts";

const STATUS_ICONS: readonly string[] = ["⬜", "🔄", "✅", "⛔"];
const SEPARATOR_ROW = /^[\s|:-]+$/;
const SEPARATOR_RULE = /^-{3,}\s*$/u;
const HEADING = /^##\s+(.*)$/;
const BLOCK_HEADING = /^###\s+(.*)$/;
const PHASE_SUFFIX = /\s*\*\(abgeschlossen\s+([^)]+)\)\*\s*$/u;
const PHASE_SPLIT = /^(.*?)\s+—\s+([\s\S]*)$/;
const FIELD = /^\*\*(.+?):\*\*\s*(.*)$/u;
const SCOPE_BULLET = /^-\s+(.*)$/;

const isStatusIcon = (token: string): token is Exclude<Status, "unknown"> =>
  STATUS_ICONS.includes(token);

interface RawBlock {
  headingText: string;
  headingLine: number;
  lines: string[];
  fields: Map<string, string>;
  scope: string[];
  scopeOpen: boolean;
}

function splitPhaseHeading(headingText: string): {
  name: string;
  title: string;
  completedOn: string | undefined;
} {
  let heading = headingText.trim();
  let completedOn: string | undefined;
  const m = PHASE_SUFFIX.exec(heading);
  if (m) {
    completedOn = m[1]!;
    heading = heading.replace(PHASE_SUFFIX, "").trim();
  }
  heading = heading.replace(/\s*\*\([^()]*\)\*$/u, "").trim();
  const sep = PHASE_SPLIT.exec(heading);
  if (sep) {
    return { name: sep[1]!.trim(), title: sep[2]!.trim(), completedOn };
  }
  return { name: heading, title: "", completedOn };
}

function buildBlock(raw: RawBlock, lines: string[]): PhaseBlock {
  const { name, title, completedOn } = splitPhaseHeading(raw.headingText);
  let end = raw.headingLine + raw.lines.length;
  while (end > raw.headingLine && (raw.lines[end - raw.headingLine - 1] ?? "").trim() === "") {
    end -= 1;
  }
  const blockLines = raw.lines.slice(0, end - raw.headingLine);
  const block: PhaseBlock = {
    name,
    title,
    goal: raw.fields.get("Ziel") ?? "",
    scope: raw.scope,
    acceptance: raw.fields.get("Abnahme") ?? "",
    span: { start: raw.headingLine, end },
    raw: [lines[raw.headingLine - 1] ?? `### ${raw.headingText}`, ...blockLines].join("\n"),
  };
  const verification = raw.fields.get("Verifikation");
  if (verification !== undefined) {
    block.verification = verification;
  }
  if (completedOn !== undefined) {
    block.completedOn = completedOn;
  }
  return block;
}

export function parseProgress(content: string, file = "PROGRESS.md"): ParseResult<Progress> {
  const lines = content.split(/\r?\n/);
  const warnings: Warning[] = [];
  const rows: ProgressRow[] = [];
  const phases: PhaseBlock[] = [];

  let inTableSection = false;
  let current: RawBlock | null = null;

  const flushBlock = (): void => {
    if (current === null) return;
    phases.push(buildBlock(current, lines));
    current = null;
  };

  for (const [idx, line] of lines.entries()) {
    const lineNo = idx + 1;

    const headingMatch = HEADING.exec(line);
    if (headingMatch) {
      flushBlock();
      inTableSection = /^Fortschritt\b/u.test(headingMatch[1]!.trim());
      continue;
    }

    const blockMatch = BLOCK_HEADING.exec(line);
    if (blockMatch) {
      flushBlock();
      inTableSection = false;
      current = {
        headingText: blockMatch[1]!,
        headingLine: lineNo,
        lines: [],
        fields: new Map<string, string>(),
        scope: [],
        scopeOpen: false,
      };
      continue;
    }

    if (SEPARATOR_RULE.test(line)) {
      flushBlock();
      inTableSection = false;
      continue;
    }

    if (current !== null) {
      current.lines.push(line);
      const field = FIELD.exec(line.trim());
      if (field) {
        current.fields.set(field[1]!, field[2]!.trim());
        current.scopeOpen = /^Umfang/u.test(field[1]!);
      } else if (line.trim() !== "") {
        const bullet = SCOPE_BULLET.exec(line.trim());
        if (bullet && current.scopeOpen) {
          current.scope.push(bullet[1]!.trim());
        } else {
          current.scopeOpen = false;
        }
      }
      continue;
    }

    if (inTableSection && line.trim().startsWith("|")) {
      const trimmed = line.trim();
      if (SEPARATOR_ROW.test(trimmed)) continue;
      const cells = trimmed.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.some((c) => /^#$/u.test(c) || /^step$/iu.test(c))) continue;
      if (cells.length >= 3) {
        const cell = cells[2]!;
        if (isStatusIcon(cell)) {
          rows.push({ step: cells[0]!, name: cells[1]!, status: cell });
        } else {
          rows.push({ step: cells[0]!, name: cells[1]!, status: "unknown" });
          warnings.push({
            code: "STATUS_UNKNOWN",
            file,
            line: lineNo,
            message: `Unbekanntes Status-Icon "${cell}" in Zeile ${cells[0]!} — status ist "unknown".`,
          });
        }
      } else if (cells.length === 2) {
        rows.push({ step: cells[0]!, name: cells[1]!, status: "unknown" });
        warnings.push({
          code: "ROW_INCOMPLETE",
          file,
          line: lineNo,
          message: `Tabellenzeile ${cells[0]!} ohne Status-Spalte — status ist "unknown".`,
        });
      }
    }
  }
  flushBlock();

  return { value: { rows, phases }, warnings };
}

export function readProgress(root: string): ParseResult<Progress> {
  const path = join(root, "PROGRESS.md");
  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    throw new Error(`missing required file: ${path}`);
  }
  return parseProgress(content, path);
}

export function scopeSteps(block: PhaseBlock): string[] {
  const steps: string[] = [];
  for (const entry of block.scope) {
    const m = /^\*{0,2}\s*(\d+(?:\.\d+)?)\b/u.exec(entry);
    if (m) steps.push(m[1]!);
  }
  return steps;
}
