import { describe, expect, it } from "vitest";
import { connect } from "./helper.ts";

/**
 * Consumer-facing input contract (H4/25.2, Decision 13): the parameter surface of
 * every tool as seen over a real `tools/list` round-trip via InMemoryTransport —
 * exactly what a consumer client sees. Any rename, added/removed parameter or
 * type/enum/default change breaks this test and is a consumer-facing MAJOR
 * (Decision 10) that must be coordinated BEFORE promotion (CONSUMERS.md runbook).
 *
 * Deliberately NOT locked here: descriptions/titles (free prose per contract),
 * annotations (tools-annotations.test.ts), resource URIs (resources.test.ts),
 * JSON serialization details such as additionalProperties.
 */

const str = { type: "string" } as const;
const boolWithDefault = (value: boolean) => ({ type: "boolean", default: value });
const enumOf = (...values: string[]) => ({ type: "string", enum: values });
const arrayOf = (items: unknown) => ({ type: "array", items });
const unionOf = (...members: unknown[]) => ({ anyOf: members });
const detailField = { type: "string", enum: ["summary", "diff"], default: "diff" };

const PRIORITY_READ = ["🔴", "🟠", "🟡", "🟢", "🔵", "unknown"];
const PRIORITY_WRITE = ["🔴", "🟠", "🟡", "🟢", "🔵"];
const STATUS_FILTER = ["⬜", "🔄", "✅", "⛔", "unknown"];
const STATUS_SET = ["⬜", "🔄", "✅", "⛔"];
const LOCALE = ["de", "en"];
const PROJECTABLE = ["id", "title", "priority", "section", "open", "location", "text", "span"];

const CONTRACT: Record<string, { required: string[]; params: Record<string, unknown> }> = {
  echo: {
    required: ["text"],
    params: { text: str },
  },
  backlog_list: {
    required: ["root"],
    params: {
      root: str,
      priority: arrayOf(enumOf(...PRIORITY_READ)),
      open: { type: "boolean" },
      section: str,
      fields: arrayOf(enumOf(...PROJECTABLE)),
    },
  },
  backlog_show: {
    required: ["root", "id"],
    params: { root: str, id: str },
  },
  progress_list: {
    required: ["root"],
    params: { root: str, status: enumOf(...STATUS_FILTER) },
  },
  progress_show: {
    required: ["root", "phase"],
    params: { root: str, phase: str },
  },
  docs_status: {
    required: ["root"],
    params: { root: str, include: arrayOf(enumOf("nextStepScope")) },
  },
  docs_validate: {
    required: ["root"],
    params: { root: str, structured: boolWithDefault(false) },
  },
  archive_item: {
    required: ["root", "id"],
    params: {
      root: str,
      id: str,
      note: str,
      locale: enumOf(...LOCALE),
      structured: boolWithDefault(false),
      detail: detailField,
      dryRun: boolWithDefault(true),
      commit: boolWithDefault(false),
      commitMessage: str,
    },
  },
  progress_update: {
    required: ["root", "phase", "step", "status"],
    params: {
      root: str,
      phase: str,
      step: unionOf(str, arrayOf(str)),
      status: enumOf(...STATUS_SET),
      title: str,
      note: str,
      checkpoint: str,
      locale: enumOf(...LOCALE),
      structured: boolWithDefault(false),
      detail: detailField,
      dryRun: boolWithDefault(true),
      commit: boolWithDefault(false),
      commitMessage: str,
    },
  },
  backlog_add: {
    required: ["root", "section", "title", "priority"],
    params: {
      root: str,
      section: str,
      title: str,
      priority: enumOf(...PRIORITY_WRITE),
      id: str,
      text: str,
      detail: detailField,
      dryRun: boolWithDefault(true),
    },
  },
  backlog_update: {
    required: ["root", "id"],
    params: {
      root: str,
      id: str,
      title: str,
      priority: enumOf(...PRIORITY_WRITE),
      section: str,
      text: str,
      detail: detailField,
      dryRun: boolWithDefault(true),
    },
  },
  backlog_remove: {
    required: ["root", "id"],
    params: {
      root: str,
      id: str,
      note: str,
      locale: enumOf(...LOCALE),
      detail: detailField,
      dryRun: boolWithDefault(true),
    },
  },
  progress_plan_phase: {
    required: ["root", "phase", "steps"],
    params: {
      root: str,
      phase: str,
      steps: arrayOf({
        type: "object",
        properties: { step: str, name: str },
        required: ["name", "step"],
      }),
      detail: detailField,
      dryRun: boolWithDefault(true),
    },
  },
};

/** Project a JSON schema node to its consumer-relevant keys (sorted `required`). */
function norm(node: unknown): unknown {
  if (typeof node !== "object" || node === null) return node;
  const n = node as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (n["type"] !== undefined) out["type"] = n["type"];
  if (n["enum"] !== undefined) out["enum"] = n["enum"];
  if (n["default"] !== undefined) out["default"] = n["default"];
  if (n["anyOf"] !== undefined) out["anyOf"] = (n["anyOf"] as unknown[]).map(norm);
  if (n["items"] !== undefined) out["items"] = norm(n["items"]);
  if (n["properties"] !== undefined) {
    out["properties"] = Object.fromEntries(
      Object.entries(n["properties"] as Record<string, unknown>).map(([k, v]) => [k, norm(v)]),
    );
  }
  if (n["required"] !== undefined) out["required"] = [...(n["required"] as string[])].sort();
  return out;
}

describe("tool input-schema contract (H4/25.2, Decision 13)", () => {
  it("tools/list exposes exactly the locked parameter surface for all 13 tools", async () => {
    const c = await connect();
    try {
      const { tools } = await c.client.listTools();
      const byName = new Map(tools.map((t) => [t.name, t]));
      expect([...byName.keys()].sort()).toEqual(Object.keys(CONTRACT).sort());
      for (const [name, expected] of Object.entries(CONTRACT)) {
        const schema = byName.get(name)?.inputSchema as
          | { properties?: Record<string, unknown>; required?: string[] }
          | undefined;
        expect(schema, `inputSchema of ${name}`).toBeDefined();
        expect([...(schema!.required ?? [])].sort(), `required params of ${name}`).toEqual(
          [...expected.required].sort(),
        );
        const actual = Object.fromEntries(
          Object.entries(schema!.properties ?? {}).map(([k, v]) => [k, norm(v)]),
        );
        expect(actual, `parameter specs of ${name}`).toEqual(expected.params);
      }
    } finally {
      await c.close();
    }
  });
});
