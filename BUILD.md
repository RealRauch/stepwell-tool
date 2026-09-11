# BUILD.md

How `stepwell` / `stepwell-core` compile, how the workspaces resolve each other,
and the platform trap that bit CI (B1).

## Commands

```bash
npm install
npm run typecheck   # workspace tsconfigs (dev, noEmit) + root Vitest config
npm run build       # tsc -> dist/ in both workspaces (tsconfig.build.json)
npm run test        # Vitest (includes real build + pack-smoke tests)
```

## Cross-workspace resolution

`stepwell` (packages/mcp) imports `stepwell-core` (packages/core) via the bare
specifier `stepwell-core`:

- **Dev / typecheck:** `packages/mcp/tsconfig.json` maps
  `paths: { "stepwell-core": ["../core/src/index.ts"] }` — source-to-source.
- **Build:** `packages/mcp/tsconfig.build.json` maps
  `paths: { "stepwell-core": ["../core/dist/index.d.ts"] }` — build order is
  core first, then mcp; both `package.json` scripts enforce this via
  `prepublishOnly`/`build`.

### Rule: `paths` always with `baseUrl` (B1)

TypeScript accepts `compilerOptions.paths` without `compilerOptions.baseUrl`
on some platforms but **rejects it strictly on Linux** with
`error TS2307: Cannot find module 'stepwell-core'` (deprecated combination).
Windows tolerates it — which hid the breakage locally until CI ran.
Both MCP tsconfigs therefore declare `"baseUrl": "."`; the `paths` targets are
relative to the package directory and unchanged. A guard test
(`cross-workspace tsconfig resolution (B1/17.1)` in `packages/mcp/tests/packaging.test.ts`)
fails any future `paths` mapping that ships without `baseUrl`.

## Platform notes

- **Node ≥ 22.18**, native TypeScript type stripping — the repo ships TS source
  and runs `.ts` files directly in dev; the published package ships compiled
  `dist` (see README → Distribution).
- **Line endings:** the repo is edited on Windows (CRLF) and built on Linux
  (CI) — never assume `process.platform`-specific path shapes inside emitted
  output; the build pipeline test asserts rewritten relative imports.
- **pack-smoke** (`scripts/pack-smoke.mjs`, CI job `pack-smoke`) packs the real
  artifact, installs it into a temp dir and proves the stdio handshake +
  CLI bin run — this is the acceptance gate for publishing.
