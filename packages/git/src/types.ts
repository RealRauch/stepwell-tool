/** Error codes for workstream sync operations (H5/26.x). */
export type SyncErrorCode =
  | "GIT_MISSING"
  | "NOT_A_GIT_REPO"
  | "DETACHED_HEAD"
  | "DIRTY_TREE"
  | "MERGE_CONFLICT"
  | "MERGE_REFUSED"
  | "STALE_BRANCH"
  | "TRUNK_DIRTY"
  | "ON_TRUNK_BRANCH";

/** Structured failure of a sync operation — never a throw; callers render `message` verbatim. */
export interface SyncError {
  code: SyncErrorCode;
  message: string;
  /** Files involved (dirty paths or conflict paths), when applicable. */
  files?: string[];
  /** Human-readable extra context (e.g. per-side commit counts, git stderr excerpt). */
  detail?: string;
}

/** Successful pull (trunk → branch). */
export interface PullOk {
  ok: true;
  /** Branch the merge ran in (the workstream branch). */
  branch: string;
  /** Trunk branch merged in (main worktree's checked-out branch). */
  trunk: string;
  /** True when the merge was a fast-forward (HEAD moved to the trunk head). */
  fastForward: boolean;
  /** Number of files the merge changed (0 when already up to date). */
  mergedFiles: number;
  /** docs_validate summary of the merged doc state (the mechanical post-merge net). */
  validation: { ok: boolean; findings: number; warnings: number };
}

export type PullResult = PullOk | { ok: false; error: SyncError };
