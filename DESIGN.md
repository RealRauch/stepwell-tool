---
name: stepwell
description: Deterministic governance for coding agents — landing page in the logo's own world (paper, navy, teal, amber)
colors:
  paper: "#f7f5f1"
  paper-2: "#efece5"
  plate: "#ffffff"
  ink: "#16344e"
  ink-soft: "#1d4463"
  ink-2: "#45607a"
  line: "#ddd6c9"
  line-soft: "#e7e2d7"
  teal: "#2e7f95"
  teal-deep: "#1f6a80"
  teal-pale: "#d8e9eb"
  amber: "#e8993c"
  amber-deep: "#b9760f"
  amber-soft: "#f2d9b4"
  rust: "#a8543c"
  rust-deep: "#94452f"
  well: "#132c43"
  well-bar: "#0d2236"
  well-deep: "#0a1c2d"
  well-text: "#c9d9e4"
  well-muted: "#8fa9bd"
  well-faint: "#33506b"
  command-text: "#9fd4d9"
  snippet-note: "#6b8299"
  diff-add: "#7cc4a4"
  diff-del: "#e07a5f"
typography:
  display:
    fontFamily: "Montserrat, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.5rem, 4.8vw, 4.2rem)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Montserrat, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.75rem, 2.8vw, 2.4rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    lineHeight: 1.65
  mono:
    fontFamily: "JetBrains Mono, Fira Code, Consolas, monospace"
    fontSize: "0.8125rem"
    lineHeight: 1.62
rounded:
  xs: "4px"
  sm: "9px"
  md: "10px"
  lg: "14px"
  xl: "18px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "28px"
  lg: "48px"
  section: "92px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "13px 22px"
  button-primary-hover:
    backgroundColor: "{colors.ink-soft}"
  terminal:
    backgroundColor: "{colors.well}"
    textColor: "{colors.well-text}"
    rounded: "{rounded.lg}"
  terminal-output:
    backgroundColor: "{colors.well-deep}"
    textColor: "{colors.well-text}"
    rounded: "{rounded.md}"
  snippet:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "9px"
---

# stepwell — DESIGN.md

## Overview

The visual world is pinned by the delivered logo (`website/assets/stepwell-logo.jpg`): an isometric
stepped well in navy/teal with an amber path and target, on a warm white ground. The page treats
itself as the document the tool governs — set like a specification, proven like a session log.
Flat surfaces, 1px rules, no glass or glow. The amber accent is semantic, not decorative: it is the
path down the well (nextStep, active tab, CTA arrow), never body color. Terminal blocks are the
"well interior" — dark navy panels where real tool output is the evidence.

Provenance notes (brief-pinned, recorded against detector advisories): Montserrat display was
chosen because the logo's own wordmark letterforms are Montserrat-adjacent — a brand-driven pin,
not a category default. The warm paper ground continues the logo asset's own background; white
plates are set on it deliberately so the JPG's white reads as a framed plate, not a mismatch.

## Colors

### Primary
- **Ink (navy):** `#16344e` — all headings, body emphasis, primary buttons. Hover `#1d4463`.
- **Teal:** `#2e7f95` structural accent, small text uses deep `#1f6a80` (≥4.5:1 on paper); pale
  `#d8e9eb` only as code-chip fill.

### Secondary
- **Amber:** `#e8993c` lives inside the well (terminals): prompts, active tab, target dot. On paper
  use `#b9760f` (graphics ≥3:1). Never for body text on light ground.

### Tertiary
- **Rust:** `#a8543c` / `#94452f` — semantic negative only ("Without stepwell" marks). Diff colors
  in output: add `#7cc4a4`, del `#e07a5f`.

### Neutral
- Paper `#f7f5f1`, alternate section `#efece5`, plates `#ffffff`, hairlines `#ddd6c9` /
  `#e7e2d7`, secondary text `#45607a` (≈5.6:1 on paper).
- Well interior ramp: `#132c43` panel, `#0d2236` bar, `#0a1c2d` output, text `#c9d9e4`, muted
  `#8fa9bd` (comment lines, ≥4.5:1), faint `#33506b` (decorative dots only — not for text).

### Named Rules
- **Amber discipline:** amber = the active path/target. One amber element per view region, never
  two competing ones.
- **One elevation per element:** an element carries a 1px border OR a shadow, never both.

## Typography

- **Display:** Montserrat 800, `clamp(2.5rem, 4.8vw, 4.2rem)`, -0.02em, line-height 1.04. Hero
  emphasis is teal color, never gradient text.
- **Section headings:** Montserrat 700, `clamp(1.75rem, 2.8vw, 2.4rem)`.
- **Body:** system sans 16px / 1.65, measure ≤68ch for intros, ≤74ch for definitions.
- **Mono (evidence only):** JetBrains Mono for commands, tool output, file names, spec lines,
  version chips. Never as a prose or display costume.
- No kickers/eyebrows above headings; headings carry their own weight.

## Layout

- `.shell` 1160px / `.shell-narrow` 920px, 28px gutters. Sections 92px vertical rhythm, alternating
  paper / paper-2 with hairline seams. Hero: 1.15fr/0.85fr two-column, left copy, right framed
  logo plate. Definition lists (principles) are ruled rows (icon+term column 250px + text), not
  card grids. File architecture is a shared-hairline 2×2 grid (collapsed borders, table feel).

## Elevation & Depth

- Flat by default. Depth comes from the two-level ground (paper → white plate) and from the
  light→dark "well interior" jump for terminals.
- `box-shadow` appears only on the primary button hover (`0 8px 18px -6px rgba(22,52,78,.35)`,
  no border on that element). Zero-offset colored halos are banned.

## Shapes

- Radii: 9px small controls/chips, 10px buttons/snippets, 14px terminals, 18px logo plate,
  999px only for the version chip. Icons are drawn inline SVG, 1.75 stroke, one weight, teal-deep.

## Components

### Buttons
- **Primary:** navy `#16344e` fill, paper text, 10px radius, Montserrat 600 15px, amber arrow icon.
- **Ghost copy buttons:** borderless, muted text, hover tinted ground; `is-copied` state amber.

### Terminal ("well interior")
- Panel `#132c43`, 14px radius, bar `#0d2236` with muted dots + mono title (nowrap) + mono tabs;
  active tab amber text with 2px amber underline. Output on `#0a1c2d`, mono 13px/1.62.

### Cards / Containers
- File grid cells and callouts: 1px `#ddd6c9` border, white or paper ground, 28–32px internal
  padding, no shadow. Snippets: white plate, 9px radius, mono 13px.

### Navigation
- Sticky paper header, hairline seam; brand = cropped logo chip (white, 1px border) + Montserrat
  wordmark + mono version chip. Hover: navy text + amber 2px underline offset 5px. Mobile: nav
  links hidden, GitHub chip remains.

### Signature Component
- The terrace divider under the hero: a line-drawn stepped-well cross-section (teal hairlines,
  amber target dot with rays) — geometry only, echoing the logo's motif.

## Do's and Don'ts

### Do:
- **Do** keep tool output verbatim (plan texts, JSON shapes, diff hunks) — the evidence is the design.
- **Do** put amber only on the active path (prompt `$`, active tab, arrow, target dot).
- **Do** set the logo JPG inside a white plate element (padding outside the crop window).
- **Do** theme browser surfaces: selection `#f2d9b4`, focus ring 2px `#2e7f95`, muted scrollbars.

### Don't:
- **Don't** use glass, blur, gradient text, glow blobs, or grid overlays — the previous look was
  removed deliberately as a generated-UI cluster.
- **Don't** introduce emoji as icons; icons are drawn SVG at one stroke weight.
- **Don't** pair a 1px border with a wide shadow on the same element.
- **Don't** put amber text on the paper ground (contrast) — use `#b9760f` for graphics, teal-deep
  for small text.
- **Don't** add kicker/eyebrow labels above headings.
