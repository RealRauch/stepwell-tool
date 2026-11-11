import { describe, expect, it } from "vitest";
import { appendChunkOrder } from "../src/progress.ts";

describe("appendChunkOrder (H7/27.6)", () => {
  it("orders ISO-stamped chunks chronologically", () => {
    const earlier = "### [x] H1 — first — done\n*(done 2026-11-11T01:00)*";
    const later = "### [x] H2 — second — done\n*(done 2026-11-11T02:00)*";
    expect(appendChunkOrder(earlier, later)).toBe(-1);
    expect(appendChunkOrder(later, earlier)).toBe(1);
    expect(appendChunkOrder(earlier, earlier)).toBe(0);
  });

  it("orders legacy YYMMDD/HHMM stamps", () => {
    const earlier = "- H1 — first — done (261111/0100)";
    const later = "- H2 — second — done (261201/0100)";
    expect(appendChunkOrder(earlier, later)).toBe(-1);
    expect(appendChunkOrder(later, earlier)).toBe(1);
  });

  it("mixes ISO and legacy stamps on one shared timeline", () => {
    const iso = "- H1 — iso stamp (2026-12-01T00:00)";
    const legacy = "- H2 — legacy stamp (261111/0100)";
    expect(appendChunkOrder(legacy, iso)).toBe(-1); // Nov 11 < Dec 1
    expect(appendChunkOrder(iso, legacy)).toBe(1);
  });

  it("returns undefined when either side carries no parseable stamp", () => {
    expect(appendChunkOrder("no stamp here", "*(done 2026-11-11T01:00)*")).toBeUndefined();
    expect(appendChunkOrder("a", "b")).toBeUndefined();
  });
});
