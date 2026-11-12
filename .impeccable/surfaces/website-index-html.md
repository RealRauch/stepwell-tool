---
version: 1
slug: "website-index-html"
primary_target: "website/index.html"
related_targets: []
---

# Surface brief — website/index.html (Landing page, Persuade)

## Scope & mode
Single static landing page (`website/index.html` + `style.css` + `app.js`). Mode: Persuade — the visitor (developer running coding agents) decides to adopt stepwell. German-language project, English site copy.

## Audience, job, action, proof
Audience: developers/agency teams using MCP-capable coding agents (Claude Code, Cursor, OpenCode, ZCode) whose progress docs drift. Job: understand what stepwell enforces and why it is safe. Action: run `npx stepwell` / register the MCP server / read PLAYBOOK. Proof: real tool outputs (status/validate/repair/sync JSON and plan diffs), test count, tool surface, method files.

## Constraints (pinned)
- User-pinned world (2026-11-12): the delivered logo (`website/assets/stepwell-logo.jpg`, 2048×2048) supplies palette and motif — warm paper ground, deep navy ink, teal structure, amber as the single accent; isometric stepped-well mark. Light ground chosen deliberately against the AI dark-neon cluster the user flagged.
- Content is frozen at the post-Phase-32 state (L27): sections Problem, Playground (6 tool tabs), Pillars, Architecture (4 files + phase shards), Workstreams, Quickstart (5 config tabs incl. ZCode), footer links. Copy claims stay as verified; no new claims.
- No backend, no build step, static files only.

## Chosen direction & memorable moment
Direction contract below (pinned brief beats the roll; code-led — no image generation in this harness).

## Unresolved decisions
- Crop box for the mark (CSS crop of the JPG) is eyeballed and refined against screenshots.
- Display face Montserrat chosen as wordmark-adjacent; revisit only if it renders poorly.

## Direction contract
THESIS: The page is the document the tool governs — set like a specification, proven like a session log. It refuses the dark-neon SaaS costume; the logo supplies world and palette, and amber belongs semantically to the path down the well (nextStep, the glowing target), never to decoration.

OWN-WORLD: Paper #f7f5f1 ground, navy ink #16344e, secondary #4a6178, hairlines #ddd6c9, teal #2e7f95 (plus pale teal #cfe3e6 as surface fill), amber #e8993c reserved for active paths/target/CTA arrow. Terminal blocks are the well interior: navy #132c43 ground, teal/amber output. Flat: 1px rules, no glass, no gradient text, no glow; drawn SVG icons at one stroke weight; Montserrat display, body system stack, mono only for evidence.

STORY: Within seconds the visitor knows stepwell makes agent work deterministic, sees the real outputs as proof, and has one command to start.

FIRST VIEWPORT: Left-aligned display headline (≤5.2rem, two lines) over a two-line subline; to the right the logo mark as a framed plate on paper; below the headline a mono spec line (tests · tools · schema · Node) separated by hairlines — no pills, no kicker; primary CTA is a navy button with amber arrow beside the inline `npx stepwell` command block.

FORM: User-pinned direction (logo palette + motif); no concept-seed roll run — the brief pins the world. Code-led build (no image generation available). Honest risk: paper worlds tip into generic-via cleanliness; countermeasures are the terraced-well divider motif drawn from the mark and strict amber discipline.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Recorded deviation (finish review round 1)

FIRST VIEWPORT promised a two-line headline over a two-line subline at desktop. The render sets
the headline on three lines and the subline on four (desktop-hero.png). Cited reason for keeping
it: the hero copy is frozen (surface constraint: content frozen at the L27 state, no copy edits
without re-verification), and the committed display scale (Montserrat 800 at up to 4.2rem, the
world's display voice) cannot fit "Deterministic governance for" on one 620px column line — a
two-line setting would force either a ~2.2rem display (below the world's scale, violating
OWN-WORLD's type intent) or a copy edit that requires a fresh evidence pass. The full-viewport
memory test is served by the headline's three stepped lines; deviation accepted at review.
