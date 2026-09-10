import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const repoRoot = dirname(fileURLToPath(import.meta.url));

/**
 * Coverage-Gate (T6 — Phase 9.1).
 *
 * Schwellen pro Paket — per-Glob-Threshold (vitest 3.x):
 *   - core:  90 % statements/lines, 85 % branches, 95 % functions
 *   - mcp:   85 % statements/lines, 78 % branches, 90 % functions
 *
 * Ausgeschlossene Dateien (Coverage bringt hier nur Boilerplate):
 *   - **\/*.d.ts          → Type-Deklarationen (keine Runtime)
 *   - **\/types.ts        → reine Typ-Aliase (kein Runtime-Code)
 *   - **\/index.ts        → Barrel-Re-Exports (Runtime ist TOOL_NAME/VERSION-Konstanten)
 *   - packages\/mcp\/src\/serve.ts → stdio-Bootstrap; Integration ist in stdio.test.ts
 *
 * Gate wird nur aktiv, wenn Vitest mit `--coverage` läuft — das tut die CI bereits.
 */
export default defineConfig({
  resolve: {
    // 10.4/H1: Die Workspace-Exports zeigen auf dist — Tests müssen aber immer
    // gegen die AKTUELLE Quelle laufen (dist könnte stale sein), daher Alias.
    alias: {
      "stepwell-core": resolve(repoRoot, "packages/core/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["packages/*/tests/**/*.test.ts"],
    // 10.3/H1: packaging.test.ts (npm run build → dist) und der Nested-Run des
    // coverage-gate-Tests (der dieselbe Suite inkl. packaging ausführt) kollidieren
    // sonst auf dist-Writes und npm-Prozessen — Spawn-lastige Tests serialisieren.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: [
        "**/*.d.ts",
        "**/types.ts",
        "**/index.ts",
        "packages/mcp/src/serve.ts",
      ],
      thresholds: {
        "packages/core/src/**/*.ts": {
          statements: 90,
          branches: 85,
          functions: 95,
          lines: 90,
        },
        "packages/mcp/src/**/*.ts": {
          statements: 85,
          branches: 78,
          functions: 90,
          lines: 85,
        },
      },
    },
  },
});
