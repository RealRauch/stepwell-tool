import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerDocsResources } from "./resources.ts";
import { READ_ONLY_ANNOTATIONS, registerDocsTools } from "./tools.ts";

export const SERVER_NAME = "stepwell";
export const SERVER_VERSION = "0.1.0";

export function createDocsServer(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      // M12: conditional, passive entry hint (findability without pushiness —
      // opt-in per project, never auto-init in a foreign repo, M13 direction).
      instructions:
        "STEPWELL structures the project via four markdown files (BACKLOG.md, PROGRESS.md, docs/archive/*). " +
        "Use these tools only when the project root contains the four STEPWELL files OR the user explicitly asks for STEPWELL. " +
        "Never create structure unrequested in a foreign repo. New to STEPWELL? Start from docs/QUICKSTART.md; " +
        "templates are available as resources.",
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
