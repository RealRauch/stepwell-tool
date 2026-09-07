import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerDocsResources } from "./resources.js";
import { registerDocsTools } from "./tools.js";

export const SERVER_NAME = "method-docs";
export const SERVER_VERSION = "0.1.0";

export function createDocsServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Echo-Tool zur Verifikation des Servers (Step 2.1).",
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
