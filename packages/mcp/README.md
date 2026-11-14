# stepwell

CLI + MCP server for **reading, checking and managing** the project docs
(`BACKLOG.md`, `PROGRESS.md`, `docs/archive/*`) in repos that follow the
[STEPWELL method](https://github.com/RealRauch/stepwell-tool#readme) —
priority-driven backlog, small steps, verbatim archive pattern, test-first.

**Principle: Markdown stays the source of truth.** The tool reads, validates and
assists — if the docs are lost, no data is lost. Structure operations (status
maintenance, archival, Done Index) run through the tools, never by hand.

## Install

```bash
npm install -g stepwell            # CLI + MCP server (stepwell-core/-git included)
npx stepwell status --root /path/to/project
```

## CLI quick start

```bash
stepwell status   --root <project>    # aggregate: priorities, running phases, next step
stepwell validate --root <project>    # cross-consistency of the four docs files
stepwell backlog  --root <project>    # open items, lean payload
stepwell sync status --root <project> # workstream report (git satellite)
```

A project is STEPWELL-shaped when the four files exist (`BACKLOG.md`,
`PROGRESS.md`, `docs/archive/BACKLOG_ARCHIVE.md`, `docs/archive/PROGRESS_ARCHIVE.md`).
Without them the tools do nothing — never create structure unrequested.

## MCP server (stdio)

One registration serves any STEPWELL project — the project root travels with
every call as the `root` parameter. Point your MCP client at the bundled
entry point:

```json
{
  "mcpServers": {
    "stepwell": {
      "command": "node",
      "args": ["<npm-root>/stepwell/dist/serve.js"]
    }
  }
}
```

Resolve `<npm-root>` with `npm root -g` (global install) or point at your local
`node_modules`. The full tool surface (13 tools, dry-run-first mutations, git
workstream sync) is documented in the
[tool repo](https://github.com/RealRauch/stepwell-tool#readme) — agents start
from `SKILL.md` (bundled at `skills/stepwell/SKILL.md` in this package) and
`docs/QUICKSTART.md` in the repo.

## Related packages

- [`stepwell-core`](https://www.npmjs.com/package/stepwell-core) — parser +
  reports + validation (library, no MCP dependency)
- [`stepwell-git`](https://www.npmjs.com/package/stepwell-git) — git satellite
  (workstream sync, commit automation)

## License

MIT
