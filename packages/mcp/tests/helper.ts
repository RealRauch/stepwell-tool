import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach } from "vitest";
import { createDocsServer } from "../src/server.ts";

export const fixtures = join(import.meta.dirname, "..", "..", "core", "tests", "fixtures");
export const projectA = join(fixtures, "project-a");
export const projectDrift = join(fixtures, "project-b-drift");

const tempDirs: string[] = [];

/** Copy of a fixture project in the OS temp dir — mutations only ever run here. */
export function tempProject(project: string): string {
  const dir = mkdtempSync(join(tmpdir(), "stepwell-mcp-"));
  tempDirs.push(dir);
  cpSync(join(fixtures, project), dir, { recursive: true });
  return dir;
}

/** Like tempProject, plus a git repo with one `init` commit on `main` (H5/26.3). */
export function tempGitProject(project: string): string {
  const dir = tempProject(project);
  git(dir, ["init", "-b", "main"]);
  git(dir, ["config", "user.email", "test@example.com"]);
  git(dir, ["config", "user.name", "Test"]);
  git(dir, ["config", "core.autocrlf", "false"]); // M19/29.2: deterministic test repos
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-m", "init"]);
  return dir;
}

export function git(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); // M19/29.2: execFileSync leaks stderr to the console — pipe it (still surfaces in errors)
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

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
  structuredContent?: unknown;
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

export function resourceText(result: { contents: Array<Record<string, unknown>> }): string {
  const first = result.contents[0] ?? {};
  if (typeof first["text"] !== "string") {
    throw new Error("resource content has no text part");
  }
  return first["text"];
}

export function resourceMime(result: { contents: Array<Record<string, unknown>> }): unknown {
  return result.contents[0]?.["mimeType"];
}
