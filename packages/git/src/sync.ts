import { docsValidate } from "stepwell-core";
import { runGit, splitLines } from "./git.ts";
import type { PullOk, PullResult, SyncError } from "./types.ts";

function fail(error: SyncError): PullResult {
  return { ok: false, error };
}

/**
 * Trunk branch of the project = the branch checked out in the MAIN worktree
 * (PLAYBOOK §1 "zero config"). `undefined` when it cannot be determined
 * (bare repo, detached main worktree).
 */
export function resolveTrunkBranch(root: string): string | undefined {
  const list = runGit(root, ["worktree", "list", "--porcelain"]);
  if (list.status !== 0) return undefined;
  const mainPath = splitLines(list.stdout)
    .find((line) => line.startsWith("worktree "))
    ?.slice("worktree ".length);
  if (mainPath === undefined) return undefined;
  const branch = runGit(mainPath, ["branch", "--show-current"]).stdout.trim();
  return branch === "" ? undefined : branch;
}

function commitsTouching(root: string, base: string, tip: string, file: string): number {
  if (base === "" || base === tip) return 0;
  const out = runGit(root, ["rev-list", "--count", `${base}..${tip}`, "--", file]).stdout.trim();
  const n = Number.parseInt(out, 10);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Pull (merge trunk → branch) inside the caller's workstream worktree —
 * the risky direction: code conflicts surface HERE, before trunk moves
 * (PLAYBOOK §1 ritual). Guards run before anything touches the tree;
 * a conflict aborts cleanly back to the pre-merge state with a structured
 * report (files + per-side commit counts). Post-merge the four docs are
 * re-validated as the mechanical net.
 */
export function pullTrunk(root: string): PullResult {
  const inside = runGit(root, ["rev-parse", "--is-inside-work-tree"]);
  if (inside.status !== 0 || inside.stdout.trim() !== "true") {
    if (inside.status === -1) {
      return fail({ code: "GIT_MISSING", message: "git is not available on PATH", detail: inside.stderr });
    }
    return fail({ code: "NOT_A_GIT_REPO", message: `"${root}" is not inside a git work tree` });
  }

  const branch = runGit(root, ["branch", "--show-current"]).stdout.trim();
  if (branch === "") {
    return fail({ code: "DETACHED_HEAD", message: "HEAD is detached — a workstream needs a branch to merge into" });
  }

  const dirty = runGit(root, ["status", "--porcelain"]);
  const dirtyFiles = splitLines(dirty.stdout).map((line) => line.slice(3).trim());
  if (dirtyFiles.length > 0) {
    return fail({
      code: "DIRTY_TREE",
      message: "working tree has uncommitted changes — commit or stash before syncing",
      files: dirtyFiles,
    });
  }

  const trunk = resolveTrunkBranch(root);
  if (trunk === undefined) {
    return fail({ code: "MERGE_REFUSED", message: "cannot determine the trunk branch (main worktree has no branch)" });
  }

  const headBefore = runGit(root, ["rev-parse", "HEAD"]).stdout.trim();
  const merge = runGit(root, [
    "merge",
    "--no-edit",
    "-m",
    `stepwell: sync trunk (${trunk}) into ${branch}`,
    trunk,
  ]);

  if (merge.status !== 0) {
    const conflicted = splitLines(runGit(root, ["diff", "--name-only", "--diff-filter=U"]).stdout);
    if (conflicted.length > 0) {
      // Clean abort: back to the exact pre-merge state; report both sides.
      runGit(root, ["merge", "--abort"]);
      const base = runGit(root, ["merge-base", headBefore, trunk]).stdout.trim();
      const detail = conflicted
        .map((file) =>
          `${file} (branch: ${commitsTouching(root, base, headBefore, file)} commit(s), trunk: ${commitsTouching(root, base, trunk, file)} commit(s))`,
        )
        .join("; ");
      return fail({
        code: "MERGE_CONFLICT",
        message: `merge of "${trunk}" into "${branch}" conflicts — aborted cleanly, resolve and retry`,
        files: conflicted,
        detail,
      });
    }
    return fail({
      code: "MERGE_REFUSED",
      message: `git refused the merge of "${trunk}" into "${branch}"`,
      detail: (merge.stderr.trim() !== "" ? merge.stderr : merge.stdout).trim(),
    });
  }

  const headAfter = runGit(root, ["rev-parse", "HEAD"]).stdout.trim();
  const trunkHead = runGit(root, ["rev-parse", trunk]).stdout.trim();
  const mergedFiles = splitLines(runGit(root, ["diff", "--name-only", headBefore, "HEAD"]).stdout).length;
  const validation = docsValidate(root);
  const pull: PullOk = {
    ok: true,
    branch,
    trunk,
    fastForward: headAfter === trunkHead && headBefore !== trunkHead,
    mergedFiles,
    validation: {
      ok: validation.ok,
      findings: validation.findings.length,
      warnings: validation.warnings.length,
    },
  };
  return pull;
}
