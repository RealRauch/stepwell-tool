import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Abnahme-Test für T6: das Coverage-Gate muss tatsächlich blockieren.
 * Wir schreiben eine temporäre Vitest-Config mit absurd hohen Schwellen
 * (99 %) und rufen Vitest rekursiv auf — die echte Coverage (~85 %) muss
 * das Gate reißen. Sonst wäre der Schwellenwert nur Dekoration.
 */

const TMP_DIR = "test-results/tmp-coverage-gate";
const TMP_CONFIG = join(TMP_DIR, "vitest.high.config.ts");

const HIGH_THRESHOLD_CONFIG = `
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/*/tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/*.d.ts", "**/types.ts", "**/index.ts", "packages/mcp/src/serve.ts"],
      reportsDirectory: "test-results/tmp-coverage-gate/reports",
      thresholds: {
        "packages/core/src/**/*.ts": { statements: 99, branches: 99, functions: 99, lines: 99 },
        "packages/mcp/src/**/*.ts": { statements: 99, branches: 99, functions: 99, lines: 99 },
      },
    },
  },
});
`;

beforeAll(() => {
  mkdirSync(TMP_DIR, { recursive: true });
  writeFileSync(TMP_CONFIG, HIGH_THRESHOLD_CONFIG, "utf8");
});

afterAll(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

describe("coverage gate enforcement (T6 Abnahme)", () => {
  it("fails vitest when thresholds are raised above current coverage", async () => {
    // Async spawn (nicht spawnSync): lässt den Vitest-Worker weiter atmen,
    // sonst timeout't der RPC-Layer ("onTaskUpdate") während wir warten.
    const exitCode = await new Promise<number | null>((resolve) => {
      const child = spawn(
        "npx",
        ["vitest", "run", "--config", TMP_CONFIG, "--coverage", "--reporter=basic"],
        { cwd: process.cwd(), stdio: "ignore", shell: true, windowsHide: true },
      );
      child.on("close", (code) => resolve(code));
      child.on("error", () => resolve(null));
    });
    expect(exitCode).not.toBe(0);
  }, 180_000);
});
