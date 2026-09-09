import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseBacklog, readBacklog } from "../src/backlog.ts";
import { ProjectNotInitializedError } from "../src/project-files.ts";
import type { Backlog, BacklogItem, ParseResult } from "../src/types.ts";

const fixtures = join(import.meta.dirname, "fixtures");

const parseFixture = (...parts: string[]): ParseResult<Backlog> =>
  parseBacklog(readFileSync(join(fixtures, ...parts), "utf8"));

const byId = (result: ParseResult<Backlog>, id: string): BacklogItem => {
  const item = result.value.items.find((i) => i.id === id);
  if (!item) throw new Error(`fixture item not found: ${id}`);
  return item;
};

describe("parseBacklog — project-a (clean, no warnings)", () => {
  const result = parseFixture("project-a", "BACKLOG.md");

  it("parses without any parse warnings", () => {
    expect(result.warnings).toEqual([]);
  });

  it("collects sections with emoji and header rules", () => {
    expect(result.value.sections.map((s) => [s.emoji, s.title])).toEqual([
      ["🔴", "KRITISCH"],
      ["🟠", "HOCH"],
      ["🟡", "MITTEL"],
      ["🟢", "NIEDRIG"],
      ["🔵", "TEST-LÜCKEN (aus dem Review abgeleitet)"],
      ["📋", "OFFENE PUNKTE R-SERIE (nach dem Review; Richtung Pilotbetrieb)"],
      ["🎨", "UI-DESIGN-REVIEW (U-Reihe, 09/2026 — Design-Kritik Admin-Bereich)"],
    ]);
    const kritisch = result.value.sections[0];
    expect(kritisch?.headerRule).toBe("Keine offenen Items.");
    const rSerie = result.value.sections.find((s) => s.emoji === "📋");
    expect(rSerie?.headerRule).toContain("Betriebs- und Produkt-Punkte");
    const ui = result.value.sections.find((s) => s.emoji === "🎨");
    expect(ui?.headerRule).toContain("Paketier-Regel i18n-ready — verbindlich");
  });

  it("lists all open items in document order", () => {
    expect(result.value.items.map((i) => i.id)).toEqual([
      "H1", "H2", "L3", "T8", "R4", "U21", "U22",
    ]);
    expect(result.value.items.every((i) => i.open)).toBe(true);
  });

  it("parses an item block with all fields (H1)", () => {
    const h1 = byId(result, "H1");
    expect(h1.title).toBe("Upload-Endpunkt ohne Größenlimit");
    expect(h1.priority).toBe("🟠");
    expect(h1.section).toBe("HOCH");
    expect(h1.open).toBe(true);
    expect(h1.location).toBe("`src/routes/upload.ts:42` (Multipart-Handler)");
    expect(h1.span).toEqual({ start: 19, end: 23 });
    expect(h1.raw.startsWith("### [ ] H1 — Upload-Endpunkt ohne Größenlimit — 🟠")).toBe(true);
    expect(h1.raw.endsWith("Oversize-Upload liefert 413; reguläre Uploads bis Limit funktionieren; Suite grün.")).toBe(true);
    expect(h1.text.startsWith("- **Ort:** `src/routes/upload.ts:42` (Multipart-Handler)")).toBe(true);
    expect(h1.text).toContain("**Abnahme:**");
  });

  it("strips optional *(…)* suffixes and derives priority from the title (T8, R4)", () => {
    const t8 = byId(result, "T8");
    expect(t8.title).toBe("Fehlverhalten bei leerer DB abdecken");
    expect(t8.priority).toBe("🔵");
    expect(t8.section).toBe("TEST-LÜCKEN (aus dem Review abgeleitet)");

    const r4 = byId(result, "R4");
    expect(r4.title).toBe("Feldtest auf Zielgeräten");
    expect(r4.priority).toBe("🟠");
    expect(r4.section).toBe("OFFENE PUNKTE R-SERIE (nach dem Review; Richtung Pilotbetrieb)");
    expect(r4.location).toBe("kein Code-Ort — Testprotokoll.");
  });

  it("assigns U-series items to their thematic section with title priority", () => {
    const u21 = byId(result, "U21");
    expect(u21.priority).toBe("🟡");
    expect(u21.section).toBe("UI-DESIGN-REVIEW (U-Reihe, 09/2026 — Design-Kritik Admin-Bereich)");
  });

  it("does not model empty sections as items", () => {
    expect(result.value.items.filter((i) => i.section === "KRITISCH")).toEqual([]);
    expect(result.value.items.filter((i) => i.section === "MITTEL")).toEqual([]);
  });

  it("parses the done index as separate one-liners", () => {
    expect(result.value.doneIndex).toEqual([
      { id: "S1", summary: "Schema-Migration 001→002 abgesichert", sha: "a1b2c3d" },
      { id: "S2", summary: "Env-Config failt hart bei fehlenden Secrets", sha: "b2c3d4e" },
      { id: "M7", summary: "Duplizierte Geo-Logik auf Shared-Helper umgestellt", sha: "c3d4e5f" },
    ]);
    expect(result.value.doneIndex.map((d) => d.id)).not.toContain("H1");
  });
});

describe("parseBacklog — project-b-drift (tolerance, parse warnings)", () => {
  const result = parseFixture("project-b-drift", "BACKLOG.md");

  it("parses all items without crashing", () => {
    expect(result.value.items.map((i) => i.id)).toEqual([
      "K9", "H9", "L9", "L10", "L10", "fix_me", "X1", "T9",
    ]);
    expect(result.value.sections).toHaveLength(6);
    expect(result.value.doneIndex).toEqual([
      { id: "S9", summary: "Im Index, aber NICHT im Archiv (Validate-Fall)", sha: "d4e5f6a" },
      { id: "M9", summary: "Auch im Index, fehlt im Archiv", sha: "e5f6a7b" },
      { id: "Z8", summary: "Archiv-Block ohne Prioritäts-Suffix (W2-Fall)", sha: "x9y8z7a" },
    ]);
  });

  it("emits exactly the expected parse warnings with line numbers", () => {
    expect(result.warnings.map((w) => [w.code, w.line])).toEqual([
      ["PRIO_MISSING", 11],
      ["PRIO_DUPLICATE", 35],
      ["PRIO_MISSING", 39],
      ["BLOCK_UNSTRUCTURED", 39],
      ["PRIO_MISSING", 43],
      ["PRIO_UNKNOWN", 58],
      ["PRIO_MISSING", 66],
      ["TITLE_EMPTY", 66],
    ]);
    expect(result.warnings[0]?.file).toBe("BACKLOG.md");
    expect(result.warnings.every((w) => typeof w.message === "string" && w.message.length > 0)).toBe(true);
  });

  it("derives fallback priority for suffix-less items in known sections (L10, T9)", () => {
    const l10s = result.value.items.filter((i) => i.id === "L10");
    expect(l10s[0]?.priority).toBe("🟢");
    expect(l10s[1]?.priority).toBe("🟢");
    expect(byId(result, "T9").priority).toBe("🔵");
  });

  it("falls back to the section priority with a warning (D1)", () => {
    const k9 = byId(result, "K9");
    expect(k9.priority).toBe("🔴");
    expect(k9.section).toBe("KRITISCH");
  });

  it("parses [x] in the open area as closed without validate-level warnings (D2)", () => {
    const h9 = byId(result, "H9");
    expect(h9.open).toBe(false);
    expect(h9.priority).toBe("🟠");
    expect(result.warnings.map((w) => w.code)).not.toContain("NOT_ARCHIVED");
  });

  it("parses duplicated priority markers once (D3)", () => {
    const l9 = byId(result, "L9");
    expect(l9.title).toBe("Titel mit doppeltem Prioritäts-Marker");
    expect(l9.priority).toBe("🟢");
  });

  it("captures unstructured free text (D4)", () => {
    const l10 = result.value.items.filter((i) => i.id === "L10")[0];
    expect(l10).toBeDefined();
    expect("location" in (l10 as BacklogItem)).toBe(false);
    expect(l10?.text).toContain("Nur ein Absatz ohne Bullet-Liste.");
  });

  it("lists duplicated IDs twice and leaves ID_DUPLICATE to validation (D5)", () => {
    expect(result.value.items.filter((i) => i.id === "L10")).toHaveLength(2);
    expect(result.warnings.map((w) => w.code)).not.toContain("ID_DUPLICATE");
  });

  it("maps unknown section/priority emoji to unknown with a warning (D6)", () => {
    const x1 = byId(result, "X1");
    expect(x1.priority).toBe("unknown");
    expect(x1.section).toBe("EXPERIMENTELL (unbekannte Priorität)");
  });

  it("tolerates an empty title (D7)", () => {
    const t9 = byId(result, "T9");
    expect(t9.title).toBe("");
    expect(t9.id).toBe("T9");
  });

  it("lists convention-violating IDs without parse-level ID_CONVENTION (D14)", () => {
    const fixMe = byId(result, "fix_me");
    expect(fixMe.open).toBe(true);
    expect(fixMe.priority).toBe("🟢");
    expect(result.warnings.map((w) => w.code)).not.toContain("ID_CONVENTION");
  });

  it("leaves DATE_LEGACY to validation (D15)", () => {
    expect(result.warnings.map((w) => w.code)).not.toContain("DATE_LEGACY");
  });
});

describe("parseBacklog — inline edge cases", () => {
  it("trims id and title around the first separator", () => {
    const r = parseBacklog("# B\n\n## 🟠 HOCH\n\n### [ ]  W1  — Titel — 🔴\n- **Ort:** a\n");
    const w1 = r.value.items[0];
    expect(w1?.id).toBe("W1");
    expect(w1?.title).toBe("Titel");
    expect(w1?.priority).toBe("🔴");
    expect(w1?.open).toBe(true);
  });

  it("treats uppercase [X] as closed", () => {
    const r = parseBacklog("## 🔴 KRITISCH\n\n### [X] C1 — t — 🔴\n");
    expect(r.value.items[0]?.open).toBe(false);
  });

  it("returns an empty value without warnings for content without sections", () => {
    const r = parseBacklog("# Nur eine Überschrift\n\nEtwas Prosa.\n");
    expect(r.value).toEqual({ sections: [], items: [], doneIndex: [] });
    expect(r.warnings).toEqual([]);
  });
});

describe("parseBacklog — Erledigt-Index als Tabelle (W1)", () => {
  const tableIndex = [
    "# BACKLOG.md — Offene Punkte (Stand: 260801/0900)",
    "",
    "---",
    "",
    "## ✅ ERLEDIGT-INDEX (Einzeiler — Details/Funde/Decisions: `docs/archive/BACKLOG_ARCHIVE.md`)",
    "",
    "| Serie | Item (kurz) | Commit/Phase |",
    "|-------|-------------|--------------|",
    "| K | K5 SQL-Injection Column-Whitelist | `d4e5f6a` |",
    "| M | M8 Cache-Header für statische Assets | Phase 6.3 |",
    "| L | L1–L3 (Cleanup-Batch) | Phase 5, siehe Archiv |",
    "",
  ].join("\n");

  it("parses table rows after the separator into done entries, skipping the header", () => {
    const r = parseBacklog(tableIndex);
    expect(r.value.doneIndex).toEqual([
      { id: "K5", summary: "SQL-Injection Column-Whitelist", sha: "d4e5f6a" },
      { id: "M8", summary: "Cache-Header für statische Assets" },
      { id: "L1–L3", summary: "(Cleanup-Batch)" },
    ]);
    expect(r.warnings).toEqual([]);
  });

  it("accepts bullets and table rows mixed (union matching)", () => {
    const mixed = `${tableIndex}\n- S1 — Schema-Migration — erledigt in \`a1b2c3d\` (Details: Archiv)\n`;
    const r = parseBacklog(mixed);
    expect(r.value.doneIndex.map((d) => d.id)).toEqual(["K5", "M8", "L1–L3", "S1"]);
  });

  it("reads the id from the first column when the table has only two columns", () => {
    const twoColumns = [
      "## ✅ Erledigt-Index",
      "",
      "| Item (kurz) | Commit/Phase |",
      "|-------------|--------------|",
      "| K5 Rate-Limit | `d4e5f6a` |",
      "",
    ].join("\n");
    const r = parseBacklog(twoColumns);
    expect(r.value.doneIndex).toEqual([
      { id: "K5", summary: "Rate-Limit", sha: "d4e5f6a" },
    ]);
  });

  it("parses the project-e fixture table index without warnings", () => {
    const r = parseFixture("project-e-tableindex", "BACKLOG.md");
    expect(r.warnings).toEqual([]);
    expect(r.value.doneIndex).toEqual([
      { id: "K5", summary: "SQL-Injection Column-Whitelist", sha: "d4e5f6a" },
      { id: "M8", summary: "Cache-Header für statische Assets" },
    ]);
  });
});

describe("readBacklog — file loading", () => {
  it("reads and parses a fixture project", () => {
    const r = readBacklog(join(fixtures, "project-b-drift"));
    expect(r.value.items).toHaveLength(8);
    expect(r.warnings[0]?.file.endsWith("BACKLOG.md")).toBe(true);
  });

  it("hard-fails when BACKLOG.md is missing", () => {
    expect(() => readBacklog(join(fixtures, "does-not-exist"))).toThrow(/BACKLOG\.md/);
  });

  it("throws ProjectNotInitializedError when all four files are missing (M5)", () => {
    try {
      readBacklog(join(fixtures, "project-empty"));
      expect.unreachable("readBacklog must throw for an uninitialized root");
    } catch (err) {
      expect(err).toBeInstanceOf(ProjectNotInitializedError);
      const e = err as InstanceType<typeof ProjectNotInitializedError>;
      expect(e.code).toBe("PROJECT_NOT_INITIALIZED");
      expect(e.missing).toHaveLength(4);
      expect(e.message).toMatch(/PLAYBOOK/);
    }
  });
});
