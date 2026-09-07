import { describe, expect, it } from "vitest";
import {
  priorityAliasHelp,
  resolvePriority,
  resolveStatus,
  statusAliasHelp,
} from "../src/aliases.ts";

describe("resolvePriority (T3)", () => {
  it("accepts the emoji itself", () => {
    expect(resolvePriority("🔴")).toBe("🔴");
    expect(resolvePriority("🔵")).toBe("🔵");
  });

  it("accepts english, german and positional aliases case-insensitively", () => {
    expect(resolvePriority("red")).toBe("🔴");
    expect(resolvePriority("kritisch")).toBe("🔴");
    expect(resolvePriority("P1")).toBe("🔴");
    expect(resolvePriority("hoch")).toBe("🟠");
    expect(resolvePriority("mittel")).toBe("🟡");
    expect(resolvePriority("niedrig")).toBe("🟢");
    expect(resolvePriority("test")).toBe("🔵");
    expect(resolvePriority("Blue")).toBe("🔵");
  });

  it("passes unknown through and rejects everything else", () => {
    expect(resolvePriority("unknown")).toBe("unknown");
    expect(resolvePriority("bogus")).toBeUndefined();
    expect(resolvePriority("")).toBeUndefined();
  });

  it("help lists every emoji with its aliases", () => {
    expect(priorityAliasHelp()).toContain("🔴=red/kritisch/p1");
    expect(priorityAliasHelp()).toContain("🔵=blue/test/p5");
    expect(priorityAliasHelp()).toContain("unknown");
  });
});

describe("resolveStatus (T3)", () => {
  it("accepts the icon itself and english aliases", () => {
    expect(resolveStatus("⬜")).toBe("⬜");
    expect(resolveStatus("running")).toBe("🔄");
    expect(resolveStatus("wip")).toBe("🔄");
    expect(resolveStatus("DONE")).toBe("✅");
    expect(resolveStatus("blocked")).toBe("⛔");
  });

  it("passes unknown through and rejects everything else", () => {
    expect(resolveStatus("unknown")).toBe("unknown");
    expect(resolveStatus("wow")).toBeUndefined();
  });

  it("help lists every icon with its aliases", () => {
    expect(statusAliasHelp()).toContain("⬜=open");
    expect(statusAliasHelp()).toContain("🔄=running/wip");
    expect(statusAliasHelp()).toContain("✅=done");
    expect(statusAliasHelp()).toContain("⛔=blocked");
    expect(statusAliasHelp()).toContain("unknown");
  });
});
