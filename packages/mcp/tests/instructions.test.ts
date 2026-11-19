import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { connect } from "./helper.ts";

/**
 * Server instructions (M12/26.7): the agent-facing entry hint must be
 * conditional and passive — findability without pushiness (M12 guardrail):
 * activates only when the four files exist or the user explicitly asks for
 * STEPWELL, never asks to create structure unrequested (no auto-init, M13
 * direction). M32/45.4: the bootstrap hint rides on the TOOL (docs_status
 * include "templates") — the old pointers (docs/QUICKSTART.md deliberately
 * absent in target projects, Decision 15; stepwell://templates/* resources
 * not readable from every agent surface) were dead ends at agent runtime
 * (StarSearch field probe 11/2026).
 */
describe("server instructions (M12)", () => {
  it("declares conditional, passive instructions with a tool-reachable bootstrap hint", async () => {
    const c = await connect();
    try {
      const text = c.client.getInstructions() ?? "";
      expect(text).toContain("templates"); // M32 bootstrap hint present
      expect(text).toContain('include ["templates"]'); // names the parameter
      expect(text).toContain("only when"); // conditional activation, not a command
      expect(text).toContain("explicitly asks"); // opt-in clause (M13 wording)
      expect(text).not.toMatch(/create the four files/iu); // no auto-init instruction
      expect(text).not.toContain("QUICKSTART"); // dead pointer removed (M32/45.4)
    } finally {
      await c.close();
    }
  });
});

/**
 * SKILL activation clause (M13/26.7): the skill must not self-authorize in a
 * foreign repo — activation = four files present OR the user explicitly asks
 * for STEPWELL ("one is to be set up" invited exactly the unrequested setup
 * the guardrail forbids).
 */
describe("skill activation clause (M13)", () => {
  it("activates on existing files or explicit request, never on setup intent", () => {
    const skill = readFileSync(
      join(import.meta.dirname, "..", "skills", "stepwell", "SKILL.md"),
      "utf8",
    );
    expect(skill).toContain("or the user explicitly asks for STEPWELL");
    expect(skill).not.toContain("or one is to be set up");
  });
});
