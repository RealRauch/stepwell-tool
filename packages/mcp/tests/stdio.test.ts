import { spawn } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const servePath = join(import.meta.dirname, "..", "src", "serve.ts");

describe("serve.ts — stdio transport (real process)", () => {
  it("answers the initialize handshake over stdio", async () => {
    const child = spawn(process.execPath, [servePath], { stdio: ["pipe", "pipe", "pipe"] });
    const init = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "stdio-test", version: "0.0.0" },
      },
    };
    child.stdin.write(JSON.stringify(init) + "\n");

    const line = await new Promise<string>((resolve, reject) => {
      let buffer = "";
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error(`timeout waiting for initialize response, got: ${buffer}`));
      }, 10_000);
      child.stdout.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
        const match = buffer.split("\n").find((l) => l.includes('"id":1'));
        if (match) {
          clearTimeout(timer);
          resolve(match);
        }
      });
      child.on("exit", () => {
        clearTimeout(timer);
        reject(new Error(`server exited early, got: ${buffer}`));
      });
    });
    child.kill();

    const parsed = JSON.parse(line) as {
      result: { serverInfo: { name: string; version: string } };
    };
    expect(parsed.result.serverInfo.name).toBe("method-docs");
    expect(parsed.result.serverInfo.version).toBe("0.1.0");
  });
});
