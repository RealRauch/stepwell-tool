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
} from "stepwell-core";type ToolResult = CallToolResult;

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
      title: "Backlog list",
      description:
        "Lists items of a STEPWELL project's BACKLOG.md (without raw, lean payload) " +
        "including parse warnings; filter: priority, open, section; projection: fields " +
        "(e.g. [\"id\",\"title\",\"priority\",\"open\",\"section\"] for overview calls).",
      inputSchema: {
        root: ROOT_FIELD,
        priority: z.array(z.enum(PRIORITY_VALUES)).optional()
          .describe("Filter on priorities."),
        open: z.boolean().optional().describe("Filter on open/completed checkbox."),
        section: z.string().optional().describe("Exact section title (without emoji)."),
        fields: z.array(z.enum(PROJECTABLE_FIELDS)).optional()
          .describe("Project each item to the listed fields (token economy, E1); " +
            "if the parameter is missing, all fields except raw are returned."),
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
      title: "Backlog item view",
      description:
        "Merge view for an item id across the open BACKLOG, Done Index and BACKLOG_ARCHIVE " +
        "— including raw + span; if the item is not identified, isError is returned.",
      inputSchema: {
        root: ROOT_FIELD,
        id: z.string().describe("Item id, exact and case-sensitive (e.g. \"H1\")."),
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
      title: "Progress list",
      description:
        "Lists the rows of the progress table in PROGRESS.md including parse warnings; " +
        "filter: status (icon or \"unknown\").",
      inputSchema: {
        root: ROOT_FIELD,
        status: z.enum(STATUS_VALUES).optional().describe("Filter on status icon."),
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
      title: "Phase detail",
      description:
        "Detail block of a phase (including raw) — search across active phases and archive; " +
        "matched by name (\"Phase 2\"), title, or both (\"Phase 2 — UI Polish\").",
      inputSchema: {
        root: ROOT_FIELD,
        phase: z.string().describe("Phase name or title, e.g. \"Phase 2\"."),
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
      title: "Docs status",
      description:
        "Aggregate of a STEPWELL project: open items per priority, running steps/phases, " +
        "✅-ratio and all validation/parse warnings.",
      inputSchema: {
        root: ROOT_FIELD,
        include: z.array(z.enum(["nextStepScope"])).optional()
          .describe('Additional context: "nextStepScope" returns the goal/acceptance/scope bullet + ' +
            "merged backlog item of the next step (1 call instead of 3, E2/12.3)."),
      },
    },
    ({ root, include }) =>
      asResult(() => docsStatus(root, include ? { include } : undefined)),
  );

  server.registerTool(
    "docs_validate",
    {
      annotations: { ...READ_ONLY_ANNOTATIONS },
      title: "Docs validation",
      description:
        "Checks cross-consistency of the four doc files (Done Index ↔ archive, checkbox ↔ " +
        "archival, 🔄 ↔ detail block, id/date convention) and collects parse warnings.",
      inputSchema: { root: ROOT_FIELD, structured: STRUCTURED_FIELD },
    },
    ({ root, structured }) => asStructuredResult(() => docsValidate(root), structured),
  );

  server.registerTool(
    "archive_item",
    {
      annotations: { ...DESTRUCTIVE_ANNOTATIONS },
      title: "Archive item (dry-run)",
      description:
        "Plans the verbatim move of a completed backlog item into BACKLOG_ARCHIVE " +
        "(checkbox → [x], optional note as **Done:** line) plus a one-liner in the " +
        "Done Index. Returns the plan with a diff preview; nothing is written unless " +
        "dryRun is false.",
      inputSchema: {
        root: ROOT_FIELD,
        id: z.string().describe("Item id of the open backlog item, exact (e.g. \"H1\")."),
        note: z.string().optional()
          .describe("Optional done note (e.g. commit hash) — ends up in the archive block and index tail."),
        locale: LOCALE_FIELD,
        structured: STRUCTURED_FIELD,
        detail: DETAIL_FIELD,
        dryRun: z.boolean().default(true)
          .describe("true (default): plan/diff preview only; false: write the changes."),
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
      title: "Update step status (dry-run)",
      description:
        "Sets the status of a step in the progress table (missing rows are added), " +
        "creates a detail block skeleton under 'Active Phases' on 🔄 and moves complete " +
        "phases verbatim into PROGRESS_ARCHIVE (note → **Verification:** line). Returns the " +
        "plan with a diff preview; nothing is written unless dryRun is false.",
      inputSchema: {
        root: ROOT_FIELD,
        phase: z.string().describe("Phase name, title or both (e.g. \"Phase 2\" / \"Phase 2 — UI Polish\")."),
        step: z.union([z.string(), z.array(z.string())])
          .describe("Step number per table/scope (e.g. \"2.2\") or an array of step numbers for multi-step updates in one call (e.g. phase completion; only with dryRun: false)."),
        status: z.enum(["⬜", "🔄", "✅", "⛔"]).describe("New status icon."),
        title: z.string().optional()
          .describe("New phase title — renames the detail block heading consistently (table stays unchanged); on phase completion in the same call the block moves into the archive under the new title."),
        note: z.string().optional()
          .describe("Optional note — on phase completion it becomes the **Verification:** line on the archive block."),
        checkpoint: z.string().optional()
          .describe("Optional commit SHA of the phase (7–40 hex) — on phase completion it appears in the verification line of the archive block."),
        locale: LOCALE_FIELD,
        structured: STRUCTURED_FIELD,
        detail: DETAIL_FIELD,
        dryRun: z.boolean().default(true)
          .describe("true (default): plan/diff preview only; false: write the changes."),
      },
    },
    ({ root, phase, step, status, title, note, checkpoint, locale, structured, detail, dryRun }) =>
      asStructuredResult(() => {
        const steps = Array.isArray(step) ? step : [step];
        if (steps.length > 1 && dryRun) {
          throw new Error(
            `multi-step (${steps.join(", ")}) requires dryRun: false — dry-run previews are only defined for a single step`,
          );
        }
        const runSingle = (oneStep: string): unknown => {
          const plan = planProgressUpdate(root, phase, oneStep, status as Status, {
            dryRun,
            ...(title !== undefined ? { title } : {}),
            ...(note !== undefined ? { note } : {}),
            ...(checkpoint !== undefined ? { checkpoint } : {}),
            ...(locale !== undefined ? { locale: locale as Locale } : {}),
          });
          const result = plan.dryRun ? plan : applyProgressPlan(plan);
          return detail === "summary" ? summarizePlan(result) : result;
        };
        if (steps.length === 1) return runSingle(steps[0]!);
        const results = steps.map(runSingle) as Array<{
          written: string[];
          verification: { ok: boolean; messages: string[] };
        }>;
        const written = [...new Set(results.flatMap((r) => r.written))];
        const messages = results.flatMap((r) => r.verification.messages);
        const allOk = results.every((r) => r.verification.ok);
        return { written, steps, verification: { ok: allOk, messages } };
      }, structured),
  );

  server.registerTool(
    "backlog_add",
    {
      annotations: { ...MUTATING_ANNOTATIONS },
      title: "Create backlog item (dry-run)",
      description:
        "Creates an open backlog item at the end of the target section: conforming id " +
        "(series convention, auto-assigned K/H/M/L per priority or explicit), correct " +
        "block format, As of: timestamp updated. Returns the plan with a diff preview; " +
        "nothing is written unless dryRun is false.",
      inputSchema: {
        root: ROOT_FIELD,
        section: z.string().describe("Target section (title without emoji, e.g. \"HIGH\")."),
        title: z.string().describe("Item title after the id."),
        priority: z.enum(PRIORITY_WRITE_VALUES).describe("Priority emoji (part of the title)."),
        id: z.string().optional()
          .describe("Explicit item id (convention ^[A-Z][0-9]+$); if missing, the next free number of the priority series (K/H/M/L) is assigned. 🔵 requires an explicit id."),
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
      title: "Update backlog item (dry-run)",
      description:
        "Changes title, priority, text or section of an open item in the block format " +
        "(span re-computation, As of: timestamp). A priority change moves the block to the " +
        "matching priority section. Returns the plan with a diff preview; nothing is " +
        "written unless dryRun is false.",
      inputSchema: {
        root: ROOT_FIELD,
        id: z.string().describe("Item id of the open backlog item, exact (e.g. \"H1\")."),
        title: z.string().optional().describe("New title."),
        priority: z.enum(PRIORITY_WRITE_VALUES).optional().describe("New priority."),
        section: z.string().optional()
          .describe("New target section (title without emoji); default: matching priority section on priority change, otherwise the item stays in place."),
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
      title: "Remove backlog item (dry-run)",
      description:
        "Removes an open item WITHOUT hard delete: the block moves verbatim into BACKLOG_ARCHIVE " +
        "(checkbox stays [ ], optional note as **Removed:** line), the Done Index gets a tail " +
        "without a Done marker. Returns the plan with a diff preview; nothing is written " +
        "unless dryRun is false.",
      inputSchema: {
        root: ROOT_FIELD,
        id: z.string().describe("Item id of the open backlog item, exact (e.g. \"H1\")."),
        note: z.string().optional()
          .describe("Optional removal note — ends up in the archive block and index tail."),
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
      title: "Plan phase ahead (dry-run)",
      description:
        "Plans a new phase: creates table rows for all steps (⬜, with names) and a " +
        "detail block skeleton with the full scope under 'Active Phases'. If the phase " +
        "already exists as an active phase, it is extended with the new steps (missing " +
        "table rows + scope bullets, without touching neighbouring rows). Validates that " +
        "the step numbers match the phase name (Phase <N> → <N>.<x>) and that phase/steps " +
        "are still free. Returns the plan with a diff preview; nothing is written unless " +
        "dryRun is false.",
      inputSchema: {
        root: ROOT_FIELD,
        phase: z.string().describe('New phase in the pattern "Phase <Nr>[ — Title]", e.g. "Phase 7 — Polish".'),
        steps: z
          .array(z.object({ step: z.string(), name: z.string() }))
          .describe("Steps of the phase in order (e.g. [{ step: \"7.1\", name: \"Setup\" }])."),
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
