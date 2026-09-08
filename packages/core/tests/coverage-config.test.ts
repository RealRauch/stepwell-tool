import { describe, it, expect } from "vitest";
import config from "../../../vitest.config.ts";

interface CoverageConfig {
  provider?: string;
  include?: string[];
  exclude?: string[];
  thresholds?: Record<string, unknown>;
}

const coverage = ((config.test ?? {}) as { coverage?: CoverageConfig }).coverage ?? {};
const thresholds = coverage.thresholds ?? {};

describe("vitest coverage config (T6)", () => {
  it("uses the v8 coverage provider", () => {
    expect(coverage.provider).toBe("v8");
  });

  it("includes source files under packages/*/src", () => {
    expect(coverage.include ?? []).toContain("packages/*/src/**/*.ts");
  });

  it("enforces core package thresholds (90/85/95/90)", () => {
    const t = thresholds["packages/core/src/**/*.ts"] as Record<string, number> | undefined;
    expect(t).toBeDefined();
    expect(t!.statements).toBeGreaterThanOrEqual(90);
    expect(t!.branches).toBeGreaterThanOrEqual(85);
    expect(t!.functions).toBeGreaterThanOrEqual(95);
    expect(t!.lines).toBeGreaterThanOrEqual(90);
  });

  it("enforces mcp package thresholds (85/78/90/85)", () => {
    const t = thresholds["packages/mcp/src/**/*.ts"] as Record<string, number> | undefined;
    expect(t).toBeDefined();
    expect(t!.statements).toBeGreaterThanOrEqual(85);
    expect(t!.branches).toBeGreaterThanOrEqual(78);
    expect(t!.functions).toBeGreaterThanOrEqual(90);
    expect(t!.lines).toBeGreaterThanOrEqual(85);
  });

  it("excludes types-only files from coverage", () => {
    expect(coverage.exclude ?? []).toContain("**/*.d.ts");
    expect(coverage.exclude ?? []).toContain("**/types.ts");
  });

  it("excludes barrel re-export files from coverage", () => {
    expect(coverage.exclude ?? []).toContain("**/index.ts");
  });

  it("excludes the stdio bootstrap from coverage", () => {
    expect(coverage.exclude ?? []).toContain("packages/mcp/src/serve.ts");
  });
});
