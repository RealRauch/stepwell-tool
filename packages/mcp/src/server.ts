import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerDocsResources } from "./resources.ts";
import { READ_ONLY_ANNOTATIONS, registerDocsTools } from "./tools.ts";

export const SERVER_NAME = "stepwell";

// L31/38.1: derived from the workspace package.json — the release bump is the
// package.json edit alone; the handshake version can never decouple again.
const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };
export const SERVER_VERSION = version;

export function createDocsServer(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      // M12: conditional, passive entry hint (findability without pushiness —
      // opt-in per project, never auto-init in a foreign repo, M13 direction).
      // M32/45.4: the old pointers were dead ends at agent runtime in a target
      // project (QUICKSTART is deliberately not distributed there, Decision 15;
      // stepwell://templates/* resources are not readable from every agent
      // surface) — the bootstrap now rides on the tool itself (docs_status
      // include "templates", 45.3) plus the empty-table seed (plan_phase, M33).
      instructions:
        "STEPWELL structures the project via four markdown files (BACKLOG.md, PROGRESS.md, docs/archive/*). " +
        "Use these tools only when the project root contains the four STEPWELL files OR the user explicitly asks for STEPWELL. " +
        "Never create structure unrequested in a foreign repo. Asked to set STEPWELL up? docs_status with " +
        'include ["templates"] returns the four file skeletons inline (M32 bootstrap hint) — adopt them unchanged; ' +
        "progress_plan_phase then plans the first phase directly into the empty progress table (M33).",
    },
  );

  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Echo tool for server verification (step 2.1).",
      annotations: { ...READ_ONLY_ANNOTATIONS },
      inputSchema: { text: z.string().describe("The text to return.") },
    },
    async ({ text }) => ({
      content: [{ type: "text", text }],
    }),
  );

  registerDocsTools(server);
  registerDocsResources(server);

  return server;
}
