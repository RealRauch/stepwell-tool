import { DOC_FILES } from "stepwell-core";
import { runGit, splitLines } from "./git.ts";
import type { CommitDocsOk, CommitDocsResult } from "./types.ts";

/**
 * Deterministic default subjects shared by CLI and MCP (PLAYBOOK §4 style:
 * conventional, English, lowercase; the status icon is part of the method's
 * surface vocabulary).
 */
export function docCommitMessage(
  op: { kind: "archive"; id: string } | { kind: "progress"; steps: string[]; status: string },
): string {
  if (op.kind === "archive") return `docs(backlog): archive ${op.id}`;
  const steps = op.steps.join(", ");
  return op.steps.length === 1
    ? `docs(progress): step ${steps} ${op.status}`
    : `docs(progress): steps ${steps} ${op.status}`;
}

/**
 * Commit ONLY the four method docs after a successful apply (Decision 14):
 * deterministic staging — nothing else is ever staged, so no foreign or secret
 * file can leak into the commit. A non-empty pre-existing index is refused
 * (COMMIT_BLOCKED, state left untouched). A failed commit (e.g. hooks) leaves
 * the edits applied with a structured message — never a rollback.
 */
export function commitDocs(root: string, options: { message: string }): CommitDocsResult {
  const inside = runGit(root, ["rev-parse", "--is-inside-work-tree"]);
  if (inside.status !== 0 || inside.stdout.trim() !== "true") {
    if (inside.status === -1) {
      return { ok: false, error: { code: "GIT_MISSING", message: "git is not available on PATH", detail: inside.stderr } };
    }
    return { ok: false, error: { code: "NOT_A_GIT_REPO", message: `"${root}" is not inside a git work tree` } };
  }

  const branch = runGit(root, ["branch", "--show-current"]).stdout.trim();
  if (branch === "") {
    return { ok: false, error: { code: "DETACHED_HEAD", message: "HEAD is detached — a doc commit would be unreachable" } };
  }

  const preStaged = splitLines(runGit(root, ["diff", "--cached", "--name-only"]).stdout);
  if (preStaged.length > 0) {
    return {
      ok: false,
      error: {
        code: "COMMIT_BLOCKED",
        message: "the index already has staged changes — commit or unstage them first so the doc commit stays exactly the four files",
        files: preStaged,
      },
    };
  }

  runGit(root, ["add", "--", ...DOC_FILES]);
  if (runGit(root, ["diff", "--cached", "--quiet"]).status === 0) {
    // the apply did not change any of the four docs (e.g. idempotent re-run)
    return { ok: true, committed: false, files: [] };
  }

  const commit = runGit(root, ["commit", "-m", options.message]);
  if (commit.status !== 0) {
    return {
      ok: false,
      error: {
        code: "COMMIT_FAILED",
        message: "the doc edits are applied, but the commit failed — resolve the cause and commit yourself (no rollback was attempted)",
        detail: (commit.stderr.trim() !== "" ? commit.stderr : commit.stdout).trim(),
      },
    };
  }

  const sha = runGit(root, ["rev-parse", "HEAD"]).stdout.trim();
  const files = splitLines(runGit(root, ["show", "--name-only", "--format=", "HEAD"]).stdout);
  const ok: CommitDocsOk = { ok: true, committed: true, files, sha };
  return ok;
}
