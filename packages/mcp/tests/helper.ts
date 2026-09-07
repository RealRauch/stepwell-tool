import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { join } from "node:path";
import { createDocsServer } from "../src/server.js";

export const fixtures = join(import.meta.dirname, "..", "..", "core", "tests", "fixtures");
export const projectA = join(fixtures, "project-a");
export const projectDrift = join(fixtures, "project-b-drift");

export interface TestClient {
  client: Client;
  close: () => Promise<void>;
}

export async function connect(): Promise<TestClient> {
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

export interface ToolResultLike {
  isError?: boolean;
  content: Array<{ type: string; text: string }>;
}

export async function callTool(
  testClient: TestClient,
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResultLike> {
  return (await testClient.client.callTool({ name, arguments: args })) as ToolResultLike;
}

export function payload(result: ToolResultLike): any {
  return JSON.parse(result.content[0]!.text) as unknown;
}
