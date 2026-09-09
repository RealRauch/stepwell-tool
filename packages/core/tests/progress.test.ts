import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseProgress, readProgress, scopeSteps } from "../src/progress.ts";
import { ProjectNotInitializedError } from "../src/project-files.ts";
import type { ParseResult, Progress } from "../src/types.ts";

const fixtures = join(import.meta.dirname, "fixtures");

const parseFixture = (...parts: string[]): ParseResult<Progress> =>
  parseProgress(readFileSync(join(fixtures, ...parts), "utf8"));

describe("parseProgress — project-a (clean, no warnings)", () => {
  const result = parseFixture("project-a", "PROGRESS.md");

  it("parses the full progress table without warnings", () => {
    expect(result.warnings).toEqual([]);
    expect(result.value.rows).toEqual([
      { step: "0.1", name: "Projekt einrichten", status: "✅" },
      { step: "0.2", name: "Env & Struktur", status: "✅" },
      { step: "1.1", name: "Migrations-Skript", status: "✅" },
      { step: "1.2", name: "Seed-Skript", status: "✅" },
      { step: "1.3", name: "API-Grundgerüst", status: "✅" },
      { step: "2.0", name: "Auth-Entscheidung", status: "⛔" },
      { step: "2.1", name: "Strings-Modul", status: "🔄" },
      { step: "2.2", name: "U21 Fehlertexte", status: "⬜" },
      { step: "2.3", name: "U22 Ladezustände", status: "⬜" },
    ]);
  });

  it("parses the running phase detail block with all fields", () => {
    expect(result.value.phases).toHaveLength(1);
    const phase = result.value.phases[0]!;
    expect(phase.name).toBe("Phase 2");
    expect(phase.title).toBe("UI-Polish");
    expect(phase.goal).toBe("Admin-Bereich fühlt sich für Laypersonen richtig an (siehe BACKLOG U-Reihe).");
    expect(phase.acceptance).toBe("typecheck + unit + e2e grün; U21/U22 abgeschlossen.");
    expect(phase.scope).toEqual([
      "**2.0 Auth-Entscheidung** — ⛔ wartet auf SSO-vs.-PW-Entscheidung (siehe BACKLOG H2-Diskussion)",
      "**2.1 Strings-Modul anlegen** (i18n-Fundament, siehe Paketier-Regel im BACKLOG)",
      "**2.2 U21 Fehlertexte migrieren**",
      "**2.3 U22 Lade-/Leerzustände**",
    ]);
    expect(phase.span).toEqual({ start: 13, end: 24 });
    expect(phase.raw.startsWith("### Phase 2 — UI-Polish")).toBe(true);
    expect("verification" in phase).toBe(false);
    expect("completedOn" in phase).toBe(false);
  });
});

describe("parseProgress — project-b-drift (tolerance, parse warnings)", () => {
  const result = parseFixture("project-b-drift", "PROGRESS.md");

  it("maps unknown icons and missing status columns to unknown (D9, D10)", () => {
    expect(result.value.rows).toEqual([
      { step: "1.1", name: "Setup", status: "✅" },
      { step: "1.2", name: "Unbekanntes Icon", status: "unknown" },
      { step: "1.3", name: "Zeile ohne Status-Spalte", status: "unknown" },
      { step: "1.4", name: "In Arbeit ohne Detail-Block", status: "🔄" },
    ]);
    expect(result.warnings.map((w) => [w.code, w.line])).toEqual([
      ["STATUS_UNKNOWN", 18],
      ["ROW_INCOMPLETE", 19],
    ]);
  });

  it("collects the orphan detail block wherever it appears (D12 base)", () => {
    expect(result.value.phases).toHaveLength(1);
    const phase = result.value.phases[0]!;
    expect(phase.name).toBe("Verwaister Detail-Block (Phase „Drift“ ohne laufende Phase)");
    expect(phase.title).toBe("");
    expect(phase.goal).toBe("Ein Detail-Block existiert, aber keine Phase ist in der Tabelle als 🔄 markiert.");
    expect(phase.acceptance).toBe("Validator meldet die Diskrepanz (D12).");
    expect(phase.scope).toEqual([]);
    expect(phase.span).toEqual({ start: 24, end: 28 });
  });
});

describe("parseProgress — progress archive detail blocks", () => {
  const result = parseFixture("project-a", "docs", "archive", "PROGRESS_ARCHIVE.md");

  it("parses archived phase blocks with completion dates (verbatim, legacy tolerated)", () => {
    expect(result.warnings).toEqual([]);
    expect(result.value.phases).toHaveLength(2);
    const phase0 = result.value.phases[0]!;
    expect(phase0.name).toBe("Phase 0");
    expect(phase0.title).toBe("Projektaufsetzung");
    expect(phase0.completedOn).toBe("07/2026");
    expect(phase0.verification).toBe("typecheck + 120 Tests grün; Smoke-Deploy auf Staging.");
    expect(phase0.scope).toEqual([
      "**0.1 Projekt einrichten** — git, npm, Editorconfig",
      "**0.2 Env & Struktur** — config.ts mit harter Validierung",
    ]);
    const phase1 = result.value.phases[1]!;
    expect(phase1.name).toBe("Phase 1");
    expect(phase1.completedOn).toBe("08/2026");
  });

  it("parses an empty archive without warnings", () => {
    const empty = parseFixture("project-b-drift", "docs", "archive", "PROGRESS_ARCHIVE.md");
    expect(empty.value.phases).toEqual([]);
    expect(empty.warnings).toEqual([]);
  });
});

describe("readProgress — file loading", () => {
  it("reads and parses a fixture project", () => {
    const r = readProgress(join(fixtures, "project-a"));
    expect(r.value.rows).toHaveLength(9);
    expect(r.warnings).toEqual([]);
  });

  it("hard-fails when PROGRESS.md is missing", () => {
    expect(() => readProgress(join(fixtures, "does-not-exist"))).toThrow(/PROGRESS\.md/);
  });

  it("throws ProjectNotInitializedError when all four files are missing (M5)", () => {
    try {
      readProgress(join(fixtures, "project-empty"));
      expect.unreachable("readProgress must throw for an uninitialized root");
    } catch (err) {
      expect(err).toBeInstanceOf(ProjectNotInitializedError);
      const e = err as InstanceType<typeof ProjectNotInitializedError>;
      expect(e.code).toBe("PROJECT_NOT_INITIALIZED");
      expect(e.missing).toHaveLength(4);
    }
  });
});

describe("locale + tolerance details (4.x)", () => {
  it("keeps the scope list open across indented continuation lines", () => {
    const content = [
      "# Projekt-Tracking",
      "",
      "## Laufende Phasen",
      "",
      "### Phase 5 — Wrap",
      "",
      "**Umfang (Steps):**",
      "",
      "- **5.1 Erster Step** — mit langer",
      "  umgebrochener Beschreibung",
      "- **5.2 Zweiter Step**",
      "",
      "---",
      "",
      "## Fortschritt",
      "",
      "| # | Step | Status |",
      "|---|------|--------|",
      "| 5.1 | Erster | 🔄 |",
      "| 5.2 | Zweiter | ⬜ |",
    ].join("\n");
    const r = parseProgress(content);
    const block = r.value.phases[0]!;
    expect(block.scope).toEqual([
      "**5.1 Erster Step** — mit langer",
      "**5.2 Zweiter Step**",
    ]);
    expect(scopeSteps(block)).toEqual(["5.1", "5.2"]);
  });

  it("parses English phase labels (Goal, Acceptance, Scope)", () => {
    const content = [
      "# Project Tracking",
      "",
      "## Active Phases",
      "",
      "### Phase 3 — Widgets",
      "",
      "**Goal:** Ship widgets.",
      "",
      "**Acceptance:** CI green.",
      "",
      "**Scope (Steps):**",
      "",
      "- **3.1 Widget core**",
      "",
      "---",
      "",
      "## Progress",
      "",
      "| # | Step | Status |",
      "|---|------|--------|",
      "| 3.1 | Widget core | 🔄 |",
    ].join("\n");
    const r = parseProgress(content);
    expect(r.value.rows).toEqual([{ step: "3.1", name: "Widget core", status: "🔄" }]);
    const block = r.value.phases[0]!;
    expect(block.goal).toBe("Ship widgets.");
    expect(block.acceptance).toBe("CI green.");
    expect(block.scope).toEqual(["**3.1 Widget core**"]);
  });
});
