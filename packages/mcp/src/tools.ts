import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  backlogShow,
  docsStatus,
  docsValidate,
  readBacklog,
  readProgress,
  loadProject,
  type BacklogItem,
  type PhaseBlock,
  type Priority,
  type Status,
} from "@method-docs/core";

type ToolResult = CallToolResult;

function textResult(value: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

function errorResult(err: unknown): ToolResult {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text", text: message }], isError: true };
}

async function asResult(fn: () => unknown): Promise<ToolResult> {
  try {
    return textResult(fn());
  } catch (err) {
    return errorResult(err);
  }
}

const PRIORITY_VALUES = ["🔴", "🟠", "🟡", "🟢", "🔵", "unknown"] as const;

const ROOT_FIELD = z.string().describe("Absoluter Pfad zum Projekt-Root (mit BACKLOG.md/PROGRESS.md).");

function withoutRaw(item: BacklogItem): Omit<BacklogItem, "raw"> {
  const { raw: _raw, ...rest } = item;
  return rest;
}

export function registerDocsTools(server: McpServer): void {
  server.registerTool(
    "backlog_list",
    {
      title: "Backlog-Liste",
      description:
        "Listet Items der BACKLOG.md eines STEPWELL-Projekts (ohne raw, schlanker Payload) " +
        "inkl. Parse-Warnungen; Filter: priority, open, section.",
      inputSchema: {
        root: ROOT_FIELD,
        priority: z.array(z.enum(PRIORITY_VALUES)).optional()
          .describe("Filter auf Prioritäten."),
        open: z.boolean().optional().describe("Filter auf offene/erledigte Checkbox."),
        section: z.string().optional().describe("Exakter Sektions-Titel (ohne Emoji)."),
      },
    },
    ({ root, priority, open, section }) =>
      asResult(() => {
        const parsed = readBacklog(root);
        let items = parsed.value.items;
        if (priority !== undefined) {
          const wanted = new Set<string>(priority);
          items = items.filter((i) => wanted.has(i.priority));
        }
        if (open !== undefined) {
          items = items.filter((i) => i.open === open);
        }
        if (section !== undefined) {
          items = items.filter((i) => i.section === section);
        }
        return { count: items.length, items: items.map(withoutRaw), warnings: parsed.warnings };
      }),
  );

  server.registerTool(
    "backlog_show",
    {
      title: "Backlog-Item-Ansicht",
      description:
        "Merge-Sicht für eine Item-ID über offenes BACKLOG, Erledigt-Index und BACKLOG_ARCHIVE " +
        "— inkl. raw + span; identifiziert das Item nicht, wird isError geliefert.",
      inputSchema: {
        root: ROOT_FIELD,
        id: z.string().describe("Item-ID, exakt und case-sensitiv (z. B. \"H1\")."),
      },
    },
    ({ root, id }) =>
      asResult(() => {
        const entry = backlogShow(root, id);
        if (entry === undefined) {
          throw new Error(`unknown item id: ${id} (nicht im offenen BACKLOG, Erledigt-Index oder Archiv)`);
        }
        return entry;
      }),
  );

  const STATUS_VALUES = ["⬜", "🔄", "✅", "⛔", "unknown"] as const;

  server.registerTool(
    "progress_list",
    {
      title: "Fortschrittsliste",
      description:
        "Listet die Zeilen der Fortschrittstabelle aus PROGRESS.md inkl. Parse-Warnungen; " +
        "Filter: status (Icon oder \"unknown\").",
      inputSchema: {
        root: ROOT_FIELD,
        status: z.enum(STATUS_VALUES).optional().describe("Filter auf Status-Icon."),
      },
    },
    ({ root, status }) =>
      asResult(() => {
        const parsed = readProgress(root);
        let rows = parsed.value.rows;
        if (status !== undefined) {
          rows = rows.filter((r) => r.status === (status as Status));
        }
        return { count: rows.length, rows, warnings: parsed.warnings };
      }),
  );

  const matchesPhase = (block: PhaseBlock, phase: string): boolean =>
    block.name === phase ||
    block.title === phase ||
    `${block.name} — ${block.title}` === phase;

  server.registerTool(
    "progress_show",
    {
      title: "Phasen-Detail",
      description:
        "Detail-Block einer Phase (inkl. raw) — Suche über laufende Phasen und Archiv; " +
        "erkannt werden Name (\"Phase 2\"), Titel oder beides (\"Phase 2 — UI-Polish\").",
      inputSchema: {
        root: ROOT_FIELD,
        phase: z.string().describe("Phasen-Name oder -Titel, z. B. \"Phase 2\"."),
      },
    },
    ({ root, phase }) =>
      asResult(() => {
        const docs = loadProject(root);
        const block =
          docs.progress().value.phases.find((p) => matchesPhase(p, phase)) ??
          docs.progressArchive().value.find((p) => matchesPhase(p, phase));
        if (block === undefined) {
          throw new Error(`unknown phase: ${phase} (weder laufende Phase noch Archiv)`);
        }
        return block;
      }),
  );

  server.registerTool(
    "docs_status",
    {
      title: "Doku-Status",
      description:
        "Aggregat eines STEPWELL-Projekts: offene Items je Priorität, laufende Steps/Phasen, " +
        "✅-Quote und sämtliche Validierungs-/Parse-Warnungen.",
      inputSchema: { root: ROOT_FIELD },
    },
    ({ root }) => asResult(() => docsStatus(root)),
  );

  server.registerTool(
    "docs_validate",
    {
      title: "Doku-Validierung",
      description:
        "Prüft die Querkonsistenz der vier Doku-Dateien (Erledigt-Index ↔ Archiv, Checkbox ↔ " +
        "Archivierung, 🔄 ↔ Detail-Block, ID-/Datum-Konvention) und sammelt Parse-Warnungen ein.",
      inputSchema: { root: ROOT_FIELD },
    },
    ({ root }) => asResult(() => docsValidate(root)),
  );
}

export type { Priority };
