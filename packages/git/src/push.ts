import { docsValidate } from "stepwell-core";
import { runGit, splitLines } from "./git.ts";
import { resolveTrunkBranch } from "./sync.ts";
import type { SyncError } from "./types.ts";

/**
 * Successful push (branch → trunk): trunk fast-forwarded to the branch head —
 * after the push, branch and trunk point at the same commit.
 */
export interface PushOk {
  ok: true;
  branch: string;
  trunk: string;
  /** docs_validate summary of the merged doc state on the trunk. */
  validation: { ok: boolean; findings: number; warnings: number };
}

export type PushResult = PushOk | { ok: false; error: SyncError };

function fail(error: SyncError): PushResult {
  return { ok: false, error };
}

function validationOf(root: string): PushOk["validation"] {
  const validation = docsValidate(root);
  return {
    ok: validation.ok,
    findings: validation.findings.length,
    warnings: validation.warnings.length,
  };
}

export type PushGuards = { ok: true; branch: string; trunk: string; mainPath: string } | { ok: false; error: SyncError };

function guardFail(error: SyncError): { ok: false; error: SyncError } {
  return { ok: false, error };
}

/**
 * Guard chain of the push operation (shared by the real op and its dry-run
 * preview — one source of truth): everything up to and including the push
 * precondition and the trunk-worktree cleanliness check. The merge itself
 * stays in pushTrunk.
 */
export function pushGuards(root: string): PushGuards {
  const inside = runGit(root, ["rev-parse", "--is-inside-work-tree"]);
  if (inside.status !== 0 || inside.stdout.trim() !== "true") {
    if (inside.status === -1) {
      return guardFail({ code: "GIT_MISSING", message: "git is not available on PATH", detail: inside.stderr });
    }
    return guardFail({ code: "NOT_A_GIT_REPO", message: `"${root}" is not inside a git work tree` });
  }

  const branch = runGit(root, ["branch", "--show-current"]).stdout.trim();
  if (branch === "") {
    return guardFail({ code: "DETACHED_HEAD", message: "HEAD is detached — a workstream needs a branch to push from" });
  }

  const dirty = splitLines(runGit(root, ["status", "--porcelain"]).stdout).map((line) => line.slice(3).trim());
  if (dirty.length > 0) {
    return guardFail({
      code: "DIRTY_TREE",
      message: "working tree has uncommitted changes — commit before pushing",
      files: dirty,
    });
  }

  const trunk = resolveTrunkBranch(root);
  if (trunk === undefined) {
    return guardFail({ code: "MERGE_REFUSED", message: "cannot determine the trunk branch (main worktree has no branch)" });
  }
  if (trunk === branch) {
    return guardFail({
      code: "ON_TRUNK_BRANCH",
      message: `"${branch}" is the trunk branch itself — nothing to push (workstream operations run in a linked worktree)`,
    });
  }

  // Push precondition: trunk head must be an ancestor of the branch head.
  const ancestor = runGit(root, ["merge-base", "--is-ancestor", trunk, "HEAD"]);
  if (ancestor.status !== 0) {
    const behind = runGit(root, ["rev-list", "--count", `HEAD..${trunk}`]).stdout.trim();
    const ahead = runGit(root, ["rev-list", "--count", `${trunk}..HEAD`]).stdout.trim();
    return guardFail({
      code: "STALE_BRANCH",
      message: `re-pull required — "${branch}" is behind "${trunk}" by ${behind} commit(s) (ahead by ${ahead}); pull, verify, then push again`,
      detail: `behind: ${behind}, ahead: ${ahead}`,
    });
  }

  // Trunk-side guard: the main worktree must be clean before it receives the merge.
  const list = runGit(root, ["worktree", "list", "--porcelain"]);
  const mainPath = splitLines(list.stdout)
    .find((line) => line.startsWith("worktree "))
    ?.slice("worktree ".length);
  if (mainPath === undefined) {
    return guardFail({ code: "MERGE_REFUSED", message: "cannot locate the main worktree" });
  }
  const trunkDirty = splitLines(runGit(mainPath, ["status", "--porcelain"]).stdout).map((line) => line.slice(3).trim());
  if (trunkDirty.length > 0) {
    return guardFail({
      code: "TRUNK_DIRTY",
      message: `the trunk worktree ("${mainPath}") has uncommitted changes — clean it before pushing`,
      files: trunkDirty,
    });
  }
  return { ok: true, branch, trunk, mainPath };
}

/**
 * Push (merge branch → trunk) — the safe direction: only allowed when the trunk
 * head is already an ancestor of the branch (the preceding pull brought it in),
 * so what gets pushed was verified against the current trunk (PLAYBOOK §1
 * push precondition). The merge runs as `--ff-only` IN the main worktree, which
 * makes the precondition atomic: if trunk moved between check and merge, git
 * refuses the fast-forward and the caller re-enters the pull → verify → push
 * loop. Never a real merge, never a conflict on this side.
 */
export function pushTrunk(root: string): PushResult {
  const guards = pushGuards(root);
  if (!guards.ok) return guards;
  const { branch, trunk, mainPath } = guards;

  // Atomic move: --ff-only refuses if trunk moved in the TOCTOU window (STALE_BRANCH again).
  const merge = runGit(mainPath, [
    "merge",
    "--ff-only",
    "-m",
    `stepwell: merge ${branch} into ${trunk}`,
    branch,
  ]);
  if (merge.status !== 0) {
    const behind = runGit(root, ["rev-list", "--count", `HEAD..${trunk}`]).stdout.trim();
    return fail({
      code: "STALE_BRANCH",
      message: `re-pull required — "${trunk}" moved during the push (behind by ${behind} commit(s)); pull, verify, then push again`,
      detail: (merge.stderr.trim() !== "" ? merge.stderr : merge.stdout).trim(),
    });
  }

  const push: PushOk = {
    ok: true,
    branch,
    trunk,
    validation: validationOf(mainPath),
  };
  return push;
}
