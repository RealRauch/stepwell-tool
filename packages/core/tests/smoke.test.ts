import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TOOL_NAME, TOOL_VERSION } from "../src/index.ts";

const corePkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };

describe("toolchain smoke", () => {
  it("resolves workspace source through vitest", () => {
    expect(TOOL_NAME).toBe("stepwell");
    expect(TOOL_VERSION).toBe(corePkg.version);
  });
});
