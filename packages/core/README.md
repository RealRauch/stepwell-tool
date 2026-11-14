# stepwell-core

Parser, reports and validation for STEPWELL method docs (`BACKLOG.md`,
`PROGRESS.md`, `docs/archive/*`) — the library layer of
[`stepwell`](https://www.npmjs.com/package/stepwell) (CLI + MCP server), with
**no MCP dependency**.

- **Fault-tolerant parsing:** projects follow the method, not byte-exact —
  drift surfaces as structured warnings (`ParseResult<T> = { value, warnings[] }`),
  never a crash.
- **Item blocks carry `span` + `raw`** (line range + verbatim block) as the
  basis for the verbatim archive moves.
- **Cross-consistency:** validation aggregates findings across the four files
  (Done Index ↔ archive, checkbox ↔ archival, 🔄 ↔ detail block, id/date
  conventions) with an `accepted[]` escape hatch for deliberately marked lines.
- **Tolerance layer:** reads DE+EN field labels silently (union matching) —
  open files migrate at the natural edit; append-only archives are never faulted.
- **Multi-project:** every function takes the project `root` — one instance
  serves any number of STEPWELL projects.

Method documentation lives in the
[tool repo](https://github.com/RealRauch/stepwell-tool) (`docs/PLAYBOOK.md`).

## License

MIT
