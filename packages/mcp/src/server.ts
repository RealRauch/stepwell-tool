import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerDocsResources } from "./resources.ts";
import { READ_ONLY_ANNOTATIONS, registerDocsTools } from "./tools.ts";

export const SERVER_NAME = "stepwell";
export const SERVER_VERSION = "0.1.0";

export function createDocsServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Echo-Tool zur Verifikation des Servers (Step 2.1).",
      annotations: { ...READ_ONLY_ANNOTATIONS },
      inputSchema: { text: z.string().describe("Der zurückzugebende Text.") },
    },
    async ({ text }) => ({
      content: [{ type: "text", text }],
    }),
  );

  registerDocsTools(server);
  registerDocsResources(server);

  return server;
}
