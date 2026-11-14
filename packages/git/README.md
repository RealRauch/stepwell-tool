# stepwell-git

Git satellite for [`stepwell`](https://www.npmjs.com/package/stepwell): parallel
phases run as **workstreams** — one git worktree + branch per phase, merge per
step back to the trunk. Transport-neutral: depends on
[`stepwell-core`](https://www.npmjs.com/package/stepwell-core), depends on no
transport. All git intelligence lives here — core stays git-blind.

- **Workstream sync:** pull (trunk → branch, the risky side — conflicts surface
  as a clean abort with a structured report) and push (branch → trunk,
  fast-forward only; a stale push is refused with "re-pull required"). Push
  precondition: trunk head must already be an ancestor of the branch.
- **Commit automation:** doc-file commits via `progress_update`/`archive_item`
  (`commit: true`) — stages only the canonical doc file set (deterministic
  staging, no secrets risk); a failed commit leaves the edits applied with a
  structured message, never a rollback.
- **Zero config:** the trunk is derived from the branch of the main worktree.

Exposed as the MCP tool `workstream_sync` (dry-run-first) and CLI-first as
`stepwell sync status|pull|push` — the path for agents without MCP registration.

Method documentation lives in the
[tool repo](https://github.com/RealRauch/stepwell-tool) (`docs/PLAYBOOK.md`).

## License

MIT
