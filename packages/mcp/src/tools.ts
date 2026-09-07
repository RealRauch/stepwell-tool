import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  applyArchivePlan,
  applyBacklogAddPlan,
  applyBacklogRemovePlan,
  applyBacklogUpdatePlan,
  applyPhasePlan,
  applyProgressPlan,
  backlogShow,
  docsStatus,
  docsValidate,
  loadProject,
  planArchiveItem,
  planBacklogAdd,
  planBacklogRemove,
  planBacklogUpdate,
  planPhase,
  planProgressUpdate,
  readBacklog,
  readProgress,
  type BacklogItem,
  type Locale,
  type PhaseBlock,
  type Priority,
  type Status,
} from "@method-docs/core";type ToolResult = CallToolResult;

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
const PRIORITY_WRITE_VALUES = ["🔴", "🟠", "🟡", "🟢", "🔵"] as const;

const TEXT_FIELD = z.string().optional()
  .describe("Item-Body als Bullets (z. B. \"- **Ort:** …\\n- **Problem:** …\") — wird verbatim übernommen.");
const DRYRUN_FIELD = z.boolean().default(true)
  .describe("true (Default): nur Plan/Diff-Vorschau; false: Änderungen schreiben.");

const ROOT_FIELD = z.string().describe("Absoluter Pfad zum Projekt-Root (mit BACKLOG.md/PROGRESS.md).");
const LOCALE_FIELD = z.enum(["de", "en"]).optional()
  .describe("Sprache für generierte Texte (Index-Zeile, Erledigt-/Verifikations-Marker). " +
    "Default: Auto-Erkennung aus dem Datei-Kontext.");

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

  server.registerTool(
    "archive_item",
    {
      title: "Item archivieren (Dry-run)",
      description:
        "Plant die verbatim-Verschiebung eines erledigten Backlog-Items ins BACKLOG_ARCHIVE " +
        "(Checkbox → [x], optionale note als **Erledigt:**-Zeile) plus Einzeiler im " +
        "Erledigt-Index. Liefert den Plan mit Diff-Vorschau; geschrieben wird nur mit " +
        "dryRun: false.",
      inputSchema: {
        root: ROOT_FIELD,
        id: z.string().describe("Item-ID des offenen Backlog-Items, exakt (z. B. \"H1\")."),
        note: z.string().optional()
          .describe("Optionale Erledigt-Notiz (z. B. Commit-Hash) — landet im Archiv-Block und Index-Tail."),
        locale: LOCALE_FIELD,
        dryRun: z.boolean().default(true)
          .describe("true (Default): nur Plan/Diff-Vorschau; false: Änderungen schreiben."),
      },
    },
    ({ root, id, note, locale, dryRun }) =>
      asResult(() => {
        const plan = planArchiveItem(root, id, {
          dryRun,
          ...(note !== undefined ? { note } : {}),
          ...(locale !== undefined ? { locale: locale as Locale } : {}),
        });
        return plan.dryRun ? plan : applyArchivePlan(plan);
      }),
  );

  server.registerTool(
    "progress_update",
    {
      title: "Step-Status pflegen (Dry-run)",
      description:
        "Setzt den Status eines Steps in der Fortschrittstabelle (fehlende Zeilen werden ergänzt), " +
        "legt bei 🔄 ein Detail-Block-Skelett unter 'Laufende Phasen' an und verschiebt vollständige " +
        "Phasen verbatim ins PROGRESS_ARCHIVE (note → **Verifikation:**-Zeile). Liefert den Plan " +
        "mit Diff-Vorschau; geschrieben wird nur mit dryRun: false.",
      inputSchema: {
        root: ROOT_FIELD,
        phase: z.string().describe("Phasen-Name, -Titel oder beides (z. B. \"Phase 2\" / \"Phase 2 — UI-Polish\")."),
        step: z.string().describe("Step-Nummer laut Tabelle/Scope (z. B. \"2.2\")."),
        status: z.enum(["⬜", "🔄", "✅", "⛔"]).describe("Neues Status-Icon."),
        title: z.string().optional()
          .describe("Neuer Phasen-Titel — benennt das Detail-Block-Heading konsistent um (Tabelle bleibt unverändert); bei Phasen-Abschluss im selben Call wandert der Block unter dem neuen Titel ins Archiv."),
        note: z.string().optional()
          .describe("Optionale Notiz — bei Phasen-Abschluss als **Verifikation:**-Zeile am Archiv-Block."),
        locale: LOCALE_FIELD,
        dryRun: z.boolean().default(true)
          .describe("true (Default): nur Plan/Diff-Vorschau; false: Änderungen schreiben."),
      },
    },
    ({ root, phase, step, status, title, note, locale, dryRun }) =>
      asResult(() => {
        const plan = planProgressUpdate(root, phase, step, status as Status, {
          dryRun,
          ...(title !== undefined ? { title } : {}),
          ...(note !== undefined ? { note } : {}),
          ...(locale !== undefined ? { locale: locale as Locale } : {}),
        });
        return plan.dryRun ? plan : applyProgressPlan(plan);
      }),
  );

  server.registerTool(
    "backlog_add",
    {
      title: "Backlog-Item anlegen (Dry-run)",
      description:
        "Legt ein offenes Backlog-Item am Ende der Ziel-Sektion an: konforme ID (Serien-Konvention, " +
        "Auto-Vergabe K/H/M/L je Priorität oder explizit), korrektes Block-Format, " +
        "Stand:-Zeitstempel wird aktualisiert. Liefert den Plan mit Diff-Vorschau; geschrieben " +
        "wird nur mit dryRun: false.",
      inputSchema: {
        root: ROOT_FIELD,
        section: z.string().describe("Ziel-Sektion (Titel ohne Emoji, z. B. \"HOCH\")."),
        title: z.string().describe("Item-Titel nach der ID."),
        priority: z.enum(PRIORITY_WRITE_VALUES).describe("Prioritäts-Emoji (Teil des Titels)."),
        id: z.string().optional()
          .describe("Explizite Item-ID (Konvention ^[A-Z][0-9]+$); fehlt sie, wird die nächste freie Nummer der Prioritäts-Serie (K/H/M/L) vergeben. 🔵 erfordert eine explizite ID."),
        text: TEXT_FIELD,
        dryRun: DRYRUN_FIELD,
      },
    },
    ({ root, section, title, priority, id, text, dryRun }) =>
      asResult(() => {
        const plan = planBacklogAdd(root, {
          dryRun,
          section,
          title,
          priority: priority as Exclude<Priority, "unknown">,
          ...(id !== undefined ? { id } : {}),
          ...(text !== undefined ? { text } : {}),
        });
        return plan.dryRun ? plan : applyBacklogAddPlan(plan);
      }),
  );

  server.registerTool(
    "backlog_update",
    {
      title: "Backlog-Item ändern (Dry-run)",
      description:
        "Ändert Titel, Priorität, Text oder Sektion eines offenen Items im Block-Format " +
        "(Span-Neuberechnung, Stand:-Zeitstempel). Prioritätswechsel verschiebt den Block in die " +
        "passende Prioritäts-Sektion. Liefert den Plan mit Diff-Vorschau; geschrieben wird nur " +
        "mit dryRun: false.",
      inputSchema: {
        root: ROOT_FIELD,
        id: z.string().describe("Item-ID des offenen Backlog-Items, exakt (z. B. \"H1\")."),
        title: z.string().optional().describe("Neuer Titel."),
        priority: z.enum(PRIORITY_WRITE_VALUES).optional().describe("Neue Priorität."),
        section: z.string().optional()
          .describe("Neue Ziel-Sektion (Titel ohne Emoji); Default: passende Prioritäts-Sektion bei Prioritätswechsel, sonst bleibt das Item in-place."),
        text: TEXT_FIELD,
        dryRun: DRYRUN_FIELD,
      },
    },
    ({ root, id, title, priority, section, text, dryRun }) =>
      asResult(() => {
        const plan = planBacklogUpdate(root, id, {
          dryRun,
          ...(title !== undefined ? { title } : {}),
          ...(priority !== undefined ? { priority: priority as Exclude<Priority, "unknown"> } : {}),
          ...(section !== undefined ? { section } : {}),
          ...(text !== undefined ? { text } : {}),
        });
        return plan.dryRun ? plan : applyBacklogUpdatePlan(plan);
      }),
  );

  server.registerTool(
    "backlog_remove",
    {
      title: "Backlog-Item entfernen (Dry-run)",
      description:
        "Entfernt ein offenes Item OHNE Hard-Delete: der Block wandert verbatim ins BACKLOG_ARCHIVE " +
        "(Checkbox bleibt [ ], optionale note als **Entfernt:**-Zeile), im Erledigt-Index erscheint " +
        "ein Tail ohne Erledigt-Marker. Liefert den Plan mit Diff-Vorschau; geschrieben wird nur " +
        "mit dryRun: false.",
      inputSchema: {
        root: ROOT_FIELD,
        id: z.string().describe("Item-ID des offenen Backlog-Items, exakt (z. B. \"H1\")."),
        note: z.string().optional()
          .describe("Optionale Entfernt-Notiz — landet im Archiv-Block und Index-Tail."),
        locale: LOCALE_FIELD,
        dryRun: DRYRUN_FIELD,
      },
    },
    ({ root, id, note, locale, dryRun }) =>
      asResult(() => {
        const plan = planBacklogRemove(root, id, {
          dryRun,
          ...(note !== undefined ? { note } : {}),
          ...(locale !== undefined ? { locale: locale as Locale } : {}),
        });
        return plan.dryRun ? plan : applyBacklogRemovePlan(plan);
      }),
  );

  server.registerTool(
    "progress_plan_phase",
    {
      title: "Phase vorausplanen (Dry-run)",
      description:
        "Plant eine neue Phase: legt Tabellen-Zeilen für alle Steps (⬜, mit Namen) und ein " +
        "Detail-Block-Skelett mit vollständigem Scope unter 'Laufende Phasen' an. Validiert, dass " +
        "die Step-Nummern zum Phasen-Namen passen (Phase <N> → <N>.<x>) und Phase/Steps noch frei " +
        "sind. Liefert den Plan mit Diff-Vorschau; geschrieben wird nur mit dryRun: false.",
      inputSchema: {
        root: ROOT_FIELD,
        phase: z.string().describe('Neue Phase im Muster "Phase <Nr>[ — Titel]", z. B. "Phase 7 — Rundung".'),
        steps: z
          .array(z.object({ step: z.string(), name: z.string() }))
          .describe("Steps der Phase in Reihenfolge (z. B. [{ step: \"7.1\", name: \"Setup\" }])."),
        dryRun: DRYRUN_FIELD,
      },
    },
    ({ root, phase, steps, dryRun }) =>
      asResult(() => {
        const plan = planPhase(root, phase, steps, { dryRun });
        return plan.dryRun ? plan : applyPhasePlan(plan);
      }),
  );
}

export type { Priority };
