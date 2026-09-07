import { describe, expect, it } from "vitest";
import { TOOL_NAME, TOOL_VERSION } from "../src/index.ts";

describe("toolchain smoke", () => {
  it("resolves workspace source through vitest", () => {
    expect(TOOL_NAME).toBe("method-docs");
    expect(TOOL_VERSION).toBe("0.1.0");
  });
});
