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
  ProjectNotInitializedError,
  readBacklog,
  readProgress,
  type BacklogItem,
  type Locale,
  type PhaseBlock,
  type Priority,
  type Status,
} from "@method-docs/core";type ToolResult = CallToolResult;

function textResult(value: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

/** Text-Payload, bei Opt-in (`structured: true`) zusätzlich als structuredContent (M3/9.7, E1/12.1). */
function structuredResult(value: Record<string, unknown>): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value) }],
    structuredContent: value,
  };
}

function errorResult(err: unknown): ToolResult {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text", text: message }], isError: true };
}

function errorOrThrow(err: unknown): ToolResult {
  if (err instanceof ProjectNotInitializedError) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ code: err.code, message: err.message, missing: err.missing }),
      }],
      isError: true,
    };
  }
  return errorResult(err);
}

async function asResult(fn: () => unknown): Promise<ToolResult> {
  try {
    return textResult(fn());
  } catch (err) {
    return errorOrThrow(err);
  }
}

async function asStructuredResult(
  fn: () => unknown,
  structured: boolean,
): Promise<ToolResult> {
  try {
    const value = fn() as Record<string, unknown>;
    return structured ? structuredResult(value) : textResult(value);
  } catch (err) {
    return errorOrThrow(err);
  }
}

const PRIORITY_VALUES = ["🔴", "🟠", "🟡", "🟢", "🔵", "unknown"] as const;
const PRIORITY_WRITE_VALUES = ["🔴", "🟠", "🟡", "🟢", "🔵"] as const;

const TEXT_FIELD = z.string().optional()
  .describe("Item-Body als Bullets (z. B. \"- **Ort:** …\\n- **Problem:** …\") — wird verbatim übernommen.");
const DRYRUN_FIELD = z.boolean().default(true)
  .describe("true (Default): nur Plan/Diff-Vorschau; false: Änderungen schreiben.");
const STRUCTURED_FIELD = z.boolean().default(false)
  .describe("true: Payload zusätzlich als structuredContent (M3); false (Default): nur Text-Content.");
const DETAIL_FIELD = z.enum(["summary", "diff"]).default("diff")
  .describe(
    "Plan-Detailstufe bei Dry-run: \"diff\" (Default) = volle Vorschau; \"summary\" = " +
      "Headline + Zeilenzahlen (Routine-Statuspflege). Apply antwortet unverändert.",
  );

/** Projiziert Dry-run-Pläne auf Headline + Zeilenzahlen (E1/12.2) — Apply bleibt unberührt. */
function summarizePlan<T extends object>(plan: T): T {
  if ((plan as { dryRun?: unknown }).dryRun !== true) return plan;
  const changes = (plan as {
    changes?: Array<{ file: string; description: string; before: string; after: string }>;
  }).changes;
  if (changes === undefined) return plan;
  return {
    ...plan,
    detail: "summary",
    changes: changes.map((c) => ({
      file: c.file,
      description: c.description,
      beforeLines: c.before.split("\n").length,
      afterLines: c.after.split("\n").length,
    })),
  } as T;
}

const ROOT_FIELD = z.string().describe("Absoluter Pfad zum Projekt-Root (mit BACKLOG.md/PROGRESS.md).");

// MCP-Annotations je Tool-Klasse (Step 9.2/M2): explizit gesetzt, auch wo der
// Spec-Default passen würde — Clients sollen nicht auf Defaults raten müssen.
export const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
} as const;

export const DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
} as const;

export const MUTATING_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
} as const;
const LOCALE_FIELD = z.enum(["de", "en"]).optional()
  .describe("Sprache für generierte Texte (Index-Zeile, Erledigt-/Verifikations-Marker). " +
    "Default: Auto-Erkennung aus dem Datei-Kontext.");

function withoutRaw(item: BacklogItem): Omit<BacklogItem, "raw"> {
  const { raw: _raw, ...rest } = item;
  return rest;
}

const PROJECTABLE_FIELDS = [
  "id",
  "title",
  "priority",
  "section",
  "open",
  "location",
  "text",
  "span",
] as const;

function projectItem(
  item: BacklogItem,
  fields: readonly (typeof PROJECTABLE_FIELDS)[number][],
): Record<string, unknown> {
  const full = withoutRaw(item) as unknown as Record<string, unknown>;
  return Object.fromEntries(fields.map((f) => [f, full[f]]));
}

export function registerDocsTools(server: McpServer): void {
  server.registerTool(
    "backlog_list",
    {
      annotations: { ...READ_ONLY_ANNOTATIONS },
      title: "Backlog-Liste",
      description:
        "Listet Items der BACKLOG.md eines STEPWELL-Projekts (ohne raw, schlanker Payload) " +
        "inkl. Parse-Warnungen; Filter: priority, open, section; Projektion: fields " +
        "(z. B. [\"id\",\"title\",\"priority\",\"open\",\"section\"] für Übersichts-Calls).",
      inputSchema: {
        root: ROOT_FIELD,
        priority: z.array(z.enum(PRIORITY_VALUES)).optional()
          .describe("Filter auf Prioritäten."),
        open: z.boolean().optional().describe("Filter auf offene/erledigte Checkbox."),
        section: z.string().optional().describe("Exakter Sektions-Titel (ohne Emoji)."),
        fields: z.array(z.enum(PROJECTABLE_FIELDS)).optional()
          .describe("Projiziert jedes Item auf die genannten Felder (Token-Ökonomie, E1); " +
            "fehlt der Parameter, werden alle Felder außer raw geliefert."),
      },
    },
    ({ root, priority, open, section, fields }) =>
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
        return {
          count: items.length,
          items: items.map((i) => (fields ? projectItem(i, fields) : withoutRaw(i))),
          warnings: parsed.warnings,
        };
      }),
  );

  server.registerTool(
    "backlog_show",
    {
      annotations: { ...READ_ONLY_ANNOTATIONS },
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
      annotations: { ...READ_ONLY_ANNOTATIONS },
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
      annotations: { ...READ_ONLY_ANNOTATIONS },
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
      annotations: { ...READ_ONLY_ANNOTATIONS },
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
      annotations: { ...READ_ONLY_ANNOTATIONS },
      title: "Doku-Validierung",
      description:
        "Prüft die Querkonsistenz der vier Doku-Dateien (Erledigt-Index ↔ Archiv, Checkbox ↔ " +
        "Archivierung, 🔄 ↔ Detail-Block, ID-/Datum-Konvention) und sammelt Parse-Warnungen ein.",
      inputSchema: { root: ROOT_FIELD, structured: STRUCTURED_FIELD },
    },
    ({ root, structured }) => asStructuredResult(() => docsValidate(root), structured),
  );

  server.registerTool(
    "archive_item",
    {
      annotations: { ...DESTRUCTIVE_ANNOTATIONS },
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
        structured: STRUCTURED_FIELD,
        detail: DETAIL_FIELD,
        dryRun: z.boolean().default(true)
          .describe("true (Default): nur Plan/Diff-Vorschau; false: Änderungen schreiben."),
      },
    },
    ({ root, id, note, locale, structured, detail, dryRun }) =>
      asStructuredResult(() => {
        const plan = planArchiveItem(root, id, {
          dryRun,
          ...(note !== undefined ? { note } : {}),
          ...(locale !== undefined ? { locale: locale as Locale } : {}),
        });
        const result = plan.dryRun ? plan : applyArchivePlan(plan);
        return detail === "summary" ? summarizePlan(result) : result;
      }, structured),
  );

  server.registerTool(
    "progress_update",
    {
      annotations: { ...MUTATING_ANNOTATIONS },
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
        checkpoint: z.string().optional()
          .describe("Optionaler Commit-SHA der Phase (7–40 Hex) — bei Phasen-Abschluss in der Verifikations-Zeile des Archiv-Blocks."),
        locale: LOCALE_FIELD,
        structured: STRUCTURED_FIELD,
        detail: DETAIL_FIELD,
        dryRun: z.boolean().default(true)
          .describe("true (Default): nur Plan/Diff-Vorschau; false: Änderungen schreiben."),
      },
    },
    ({ root, phase, step, status, title, note, checkpoint, locale, structured, detail, dryRun }) =>
      asStructuredResult(() => {
        const plan = planProgressUpdate(root, phase, step, status as Status, {
          dryRun,
          ...(title !== undefined ? { title } : {}),
          ...(note !== undefined ? { note } : {}),
          ...(checkpoint !== undefined ? { checkpoint } : {}),
          ...(locale !== undefined ? { locale: locale as Locale } : {}),
        });
        const result = plan.dryRun ? plan : applyProgressPlan(plan);
        return detail === "summary" ? summarizePlan(result) : result;
      }, structured),
  );

  server.registerTool(
    "backlog_add",
    {
      annotations: { ...MUTATING_ANNOTATIONS },
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
        detail: DETAIL_FIELD,
        dryRun: DRYRUN_FIELD,
      },
    },
    ({ root, section, title, priority, id, text, detail, dryRun }) =>
      asResult(() => {
        const plan = planBacklogAdd(root, {
          dryRun,
          section,
          title,
          priority: priority as Exclude<Priority, "unknown">,
          ...(id !== undefined ? { id } : {}),
          ...(text !== undefined ? { text } : {}),
        });
        const result = plan.dryRun ? plan : applyBacklogAddPlan(plan);
        return detail === "summary" ? summarizePlan(result) : result;
      }),
  );

  server.registerTool(
    "backlog_update",
    {
      annotations: { ...MUTATING_ANNOTATIONS },
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
        detail: DETAIL_FIELD,
        dryRun: DRYRUN_FIELD,
      },
    },
    ({ root, id, title, priority, section, text, detail, dryRun }) =>
      asResult(() => {
        const plan = planBacklogUpdate(root, id, {
          dryRun,
          ...(title !== undefined ? { title } : {}),
          ...(priority !== undefined ? { priority: priority as Exclude<Priority, "unknown"> } : {}),
          ...(section !== undefined ? { section } : {}),
          ...(text !== undefined ? { text } : {}),
        });
        const result = plan.dryRun ? plan : applyBacklogUpdatePlan(plan);
        return detail === "summary" ? summarizePlan(result) : result;
      }),
  );

  server.registerTool(
    "backlog_remove",
    {
      annotations: { ...DESTRUCTIVE_ANNOTATIONS },
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
        detail: DETAIL_FIELD,
        dryRun: DRYRUN_FIELD,
      },
    },
    ({ root, id, note, locale, detail, dryRun }) =>
      asResult(() => {
        const plan = planBacklogRemove(root, id, {
          dryRun,
          ...(note !== undefined ? { note } : {}),
          ...(locale !== undefined ? { locale: locale as Locale } : {}),
        });
        const result = plan.dryRun ? plan : applyBacklogRemovePlan(plan);
        return detail === "summary" ? summarizePlan(result) : result;
      }),
  );

  server.registerTool(
    "progress_plan_phase",
    {
      annotations: { ...MUTATING_ANNOTATIONS },
      title: "Phase vorausplanen (Dry-run)",
      description:
        "Plant eine neue Phase: legt Tabellen-Zeilen für alle Steps (⬜, mit Namen) und ein " +
        "Detail-Block-Skelett mit vollständigem Scope unter 'Laufende Phasen' an. Existiert die " +
        "Phase bereits als laufende Phase, wird sie um die Steps erweitert (fehlende Tabellen-Zeilen " +
        "+ Scope-Bullets, ohne Nachbar-Zeilen anzutasten). Validiert, dass " +
        "die Step-Nummern zum Phasen-Namen passen (Phase <N> → <N>.<x>) und Phase/Steps noch frei " +
        "sind. Liefert den Plan mit Diff-Vorschau; geschrieben wird nur mit dryRun: false.",
      inputSchema: {
        root: ROOT_FIELD,
        phase: z.string().describe('Neue Phase im Muster "Phase <Nr>[ — Titel]", z. B. "Phase 7 — Rundung".'),
        steps: z
          .array(z.object({ step: z.string(), name: z.string() }))
          .describe("Steps der Phase in Reihenfolge (z. B. [{ step: \"7.1\", name: \"Setup\" }])."),
        detail: DETAIL_FIELD,
        dryRun: DRYRUN_FIELD,
      },
    },
    ({ root, phase, steps, detail, dryRun }) =>
      asResult(() => {
        const plan = planPhase(root, phase, steps, { dryRun });
        const result = plan.dryRun ? plan : applyPhasePlan(plan);
        return detail === "summary" ? summarizePlan(result) : result;
      }),
  );
}

export type { Priority };
