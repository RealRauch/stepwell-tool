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
import { resolve } from "node:path";
import { configDefaults, defineConfig } from "vitest/config";
// vitest behält root beim Repo-cwd (Spawn läuft mit cwd=repo) — import.meta.dirname
// der Config-Datei läge im tmp-Verzeichnis und wäre falsch.
const repoRoot = process.cwd();
export default defineConfig({
  resolve: {
    // identisch zur Haupt-Config: Tests immer gegen die core-Quelle (10.4/H1)
    alias: { "stepwell-core": resolve(repoRoot, "packages/core/src/index.ts") },
  },
  test: {
    environment: "node",
    include: ["packages/*/tests/**/*.test.ts"],
    // R7: Gate-Datei ausschließen — sonst startet der Nested-Run diesen Test
    // erneut (Rekursion), bis ein Worker crasht; genau eine Nested-Ebene läuft.
    exclude: [...configDefaults.exclude, "**/coverage-gate.test.ts"],
    // 10.3/H1: Spawn-lastige Tests (build/pack) sonst Kollision, s. Haupt-Config
    fileParallelism: false,
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
  // R9: Das Exit-Code-Verhalten bei Threshold-Verletzung ist umgebungsabhängig
  // (im vitest-verschachtelten Spawn exit 1 + Meldung; in isolierten CLI-Läufen
  // wurde 0 gemessen — CI muss das verifizieren, siehe R9). Der Test prüft
  // deshalb BEIDES: Exit-Code und Threshold-Meldung im Output.
  it("fails vitest when thresholds are raised above current coverage", async () => {
    // Async spawn (nicht spawnSync): lässt den Vitest-Worker weiter atmen,
    // sonst timeout't der RPC-Layer ("onTaskUpdate") während wir warten.
    const { exitCode, output } = await new Promise<{ exitCode: number | null; output: string }>((resolve) => {
      const child = spawn(
        "npx",
        ["vitest", "run", "--config", TMP_CONFIG, "--coverage", "--reporter=basic"],
        { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"], shell: true, windowsHide: true },
      );
      let output = "";
      child.stdout?.on("data", (chunk: Buffer) => {
        output += chunk.toString();
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        output += chunk.toString();
      });
      child.on("close", (code) => resolve({ exitCode: code, output }));
      child.on("error", () => resolve({ exitCode: null, output }));
    });
    // Ursachen-Assert (R7): Nicht-Null genügt nicht — ein gecrashter Nested-Run
    // würde ihn ebenfalls erfüllen. Das Gate muss die Threshold-Meldung zeigen
    // (Format: `Coverage for lines (96.23%) does not meet "<glob>" threshold (99%)`).
    expect(exitCode).not.toBe(0);
    expect(output).toMatch(/does not meet .+ threshold/iu);
  }, 180_000);
});
