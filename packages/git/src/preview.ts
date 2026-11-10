import { runGit, splitLines } from "./git.ts";
import { commitCount, pullGuards } from "./sync.ts";
import { pushGuards } from "./push.ts";
import { overlapFiles } from "./report.ts";
import type { SyncError } from "./types.ts";

export interface PullPreviewOk {
  ok: true;
  dryRun: true;
  direction: "pull";
  branch: string;
  trunk: string;
  /** Commits the pull would bring in. */
  behind: number;
  /** Files the pull would change. */
  files: string[];
  /** Conflict candidates (touched on both sides since the merge base). */
  overlap: string[];
}

export interface PushPreviewOk {
  ok: true;
  dryRun: true;
  direction: "push";
  branch: string;
  trunk: string;
  /** Commits the push would advance the trunk by. */
  ahead: number;
  /** SHA the trunk would fast-forward to. */
  target: string;
  /** Always true on success — a failed precondition reports STALE_BRANCH instead. */
  preconditionMet: boolean;
}

export type SyncPreviewOk = PullPreviewOk | PushPreviewOk;
export type SyncPreviewResult = SyncPreviewOk | { ok: false; error: SyncError };

/**
 * Dry-run pre-flight for pull/push: runs the EXACT guard chain of the real
 * operation (same code, same order — one source of truth) and reports what
 * the op would do, without touching anything. Guard failures come back as
 * the same structured errors the real op would produce, so callers can
 * pre-flight the ritual before running it.
 */
export function syncPreview(root: string, direction: "pull" | "push"): SyncPreviewResult {
  if (direction === "pull") {
    const guards = pullGuards(root);
    if (!guards.ok) return guards;
    const behind = commitCount(root, `HEAD..${guards.trunk}`);
    const files = splitLines(runGit(root, ["diff", "--name-only", `HEAD..${guards.trunk}`]).stdout);
    const overlap = overlapFiles(root, guards.branch, guards.trunk);
    const preview: PullPreviewOk = { ok: true, dryRun: true, direction: "pull", branch: guards.branch, trunk: guards.trunk, behind, files, overlap };
    return preview;
  }
  const guards = pushGuards(root);
  if (!guards.ok) return guards;
  const preview: PushPreviewOk = {
    ok: true,
    dryRun: true,
    direction: "push",
    branch: guards.branch,
    trunk: guards.trunk,
    ahead: commitCount(root, `${guards.trunk}..HEAD`),
    target: runGit(root, ["rev-parse", "HEAD"]).stdout.trim(),
    preconditionMet: true,
  };
  return preview;
}
