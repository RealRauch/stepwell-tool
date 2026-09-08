import { describe, expect, it } from "vitest";
import { connect } from "./helper.ts";

/** Erwartete MCP-Annotations je Tool (Step 9.2 / M2). */
const READ_ONLY_TOOLS = [
  "echo",
  "docs_status",
  "docs_validate",
  "backlog_show",
  "backlog_list",
  "progress_list",
  "progress_show",
] as const;

const DESTRUCTIVE_TOOLS = ["archive_item", "backlog_remove"] as const;

const MUTATING_TOOLS = [
  "progress_update",
  "backlog_add",
  "backlog_update",
  "progress_plan_phase",
] as const;

describe("tool annotations (9.2/M2)", () => {
  it("every tool carries complete annotations", async () => {
    const c = await connect();
    try {
      const known = new Set<string>([
        ...READ_ONLY_TOOLS,
        ...DESTRUCTIVE_TOOLS,
        ...MUTATING_TOOLS,
      ]);
      const tools = c.client.listTools();
      const listed = (await tools).tools;
      expect(listed.map((t) => t.name).sort()).toEqual([...known].sort());

      for (const tool of listed) {
        expect(tool.annotations, `annotations missing for ${tool.name}`).toBeDefined();
        for (const hint of ["readOnlyHint", "destructiveHint", "idempotentHint"] as const) {
          expect(
            typeof tool.annotations?.[hint],
            `${tool.name}.${hint} must be boolean`,
          ).toBe("boolean");
        }
      }
    } finally {
      await c.close();
    }
  });

  it("read tools are readOnly and idempotent", async () => {
    const c = await connect();
    try {
      const tools = (await c.client.listTools()).tools;
      const byName = new Map(tools.map((t) => [t.name, t.annotations]));
      for (const name of READ_ONLY_TOOLS) {
        expect(byName.get(name)?.readOnlyHint, `${name}.readOnlyHint`).toBe(true);
        expect(byName.get(name)?.destructiveHint, `${name}.destructiveHint`).toBe(false);
        expect(byName.get(name)?.idempotentHint, `${name}.idempotentHint`).toBe(true);
      }
    } finally {
      await c.close();
    }
  });

  it("archive_item and backlog_remove are destructive, not idempotent", async () => {
    const c = await connect();
    try {
      const tools = (await c.client.listTools()).tools;
      const byName = new Map(tools.map((t) => [t.name, t.annotations]));
      for (const name of DESTRUCTIVE_TOOLS) {
        expect(byName.get(name)?.destructiveHint, `${name}.destructiveHint`).toBe(true);
        expect(byName.get(name)?.readOnlyHint, `${name}.readOnlyHint`).toBe(false);
        expect(byName.get(name)?.idempotentHint, `${name}.idempotentHint`).toBe(false);
      }
    } finally {
      await c.close();
    }
  });

  it("planning tools are non-destructive with dryRun default, not idempotent", async () => {
    const c = await connect();
    try {
      const tools = (await c.client.listTools()).tools;
      const byName = new Map(tools.map((t) => [t.name, t.annotations]));
      for (const name of MUTATING_TOOLS) {
        expect(byName.get(name)?.readOnlyHint, `${name}.readOnlyHint`).toBe(false);
        expect(byName.get(name)?.destructiveHint, `${name}.destructiveHint`).toBe(false);
        expect(byName.get(name)?.idempotentHint, `${name}.idempotentHint`).toBe(false);
      }
    } finally {
      await c.close();
    }
  });
});
