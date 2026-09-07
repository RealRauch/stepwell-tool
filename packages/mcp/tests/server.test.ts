import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createDocsServer, SERVER_NAME, SERVER_VERSION } from "../src/server.ts";

async function connect(): Promise<{ client: Client; close: () => Promise<void> }> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createDocsServer();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(clientTransport);
  return {
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

describe("createDocsServer — 2.1 grundserver", () => {
  it("exposes SERVER_NAME/VERSION", () => {
    expect(SERVER_NAME).toBe("stepwell");
    expect(SERVER_VERSION).toBe("0.1.0");
  });

  it("lists the echo tool with metadata", async () => {
    const { client, close } = await connect();
    try {
      const { tools } = await client.listTools();
      const echo = tools.find((t) => t.name === "echo");
      expect(echo).toBeDefined();
      expect(echo?.title).toBe("Echo");
      expect(echo?.description).toContain("Echo");
      expect(echo?.inputSchema.type).toBe("object");
    } finally {
      await close();
    }
  });

  it("echoes text back through the protocol", async () => {
    const { client, close } = await connect();
    try {
      const result = (await client.callTool({ name: "echo", arguments: { text: "hallo" } })) as {
        isError?: boolean;
        content: Array<{ type: string; text: string }>;
      };
      expect(result.isError).toBeFalsy();
      expect(result.content).toEqual([{ type: "text", text: "hallo" }]);
    } finally {
      await close();
    }
  });

  it("returns isError for calls with missing arguments (schema validation)", async () => {
    const { client, close } = await connect();
    try {
      const result = (await client.callTool({ name: "echo", arguments: {} })) as {
        isError?: boolean;
        content: Array<{ type: string; text: string }>;
      };
      expect(result.isError).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
    } finally {
      await close();
    }
  });
});
